import * as ganache from "ganache-core";
import * as solc from "solc";
import {simpleStorage} from "./contracts/simple-storage.sol";
const Web3 = require("web3");

import { Contract } from "web3/types";

export abstract class EthereumSimulator {
    contractAddress: string;
    port: number;

    constructor() {
        this.port = 0;
        this.contractAddress = "";
    }

    abstract listen(port: number): Promise<void>;
    abstract close(): void;
    abstract getStoredDataFromMemory(): StorageContractItem;
    abstract getDataFromEthereum(): DataFromEthereum;

}

export interface StorageContractItem {
    intValue: number;
    stringValue: string;
}

export interface DataFromEthereum {
    resultJson: string;
    blockNumber: number;
    timestamp: number;
}

class EthereumSimImpl extends EthereumSimulator {
    public ganacheServer: any;
    private storedInt: number;
    private storedString: string;

    constructor() {
        super();
        this.storedInt = 0;
        this.storedString = "";
        this.ganacheServer = ganache.server({ accounts: [{ balance: "300000000000000000000" }], total_accounts: 1 });
    }

    public async listen(port: number): Promise<void> {
        this.port = port;
        return new Promise<void>((resolve, reject) => {
            this.ganacheServer.listen(this.port, function () {
                resolve();
            });
        });
    }

    public getEndpoint(): string {
        if (this.port == 0) {
            throw new Error("Simulator not listening on any endpoint");
        }
        return `http://localhost:${this.port}`;
    }

    public getStoredDataFromMemory(): StorageContractItem {
        return {
            intValue: this.storedInt,
            stringValue: this.storedString
        };
    }

    public getDataFromEthereum(): DataFromEthereum {
        return {
            resultJson: "{ }",
            blockNumber: 1,
            timestamp: 1
        }
    }

    public async compileStorageContract(intValue: number, stringValue: string): Promise<string> {
        const web3 = new Web3(new Web3.providers.HttpProvider(this.getEndpoint()));

        // compile contract
        const output = solc.compile(simpleStorage, 1);
        if (output.errors)
            throw output.errors;
        const bytecode = output.contracts[":SimpleStorage"].bytecode;
        const abi = JSON.parse(output.contracts[":SimpleStorage"].interface);
        // deploy contract
        const contract = new web3.eth.Contract(abi, { data: "0x" + bytecode });
        const tx = contract.deploy({ arguments: [intValue, stringValue] });
        const account = (await web3.eth.getAccounts())[0];
        const contractInstance = await <Contract>tx.send({
            from: account,
            gas: await tx.estimateGas()
        });

        this.storedInt = intValue;
        this.storedString = stringValue;

        return contractInstance.options.address;
    }

    public close() {
        this.ganacheServer.close();
    }
}

export default async function createEthSimulator(port: number): Promise<EthereumSimulator> {
    const ethSim = new EthereumSimImpl();
    await ethSim.listen(port);

    const intValue = Math.floor(Math.random() * 10000000);
    const stringValue = "magic money!";

    ethSim.contractAddress = await ethSim.compileStorageContract(intValue, stringValue);

    return ethSim;
}