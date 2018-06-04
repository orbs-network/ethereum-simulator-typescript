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
    abstract async getDataFromEthereum(contractAddress: string): Promise<DataFromEthereum>;

}

export interface EthereumFunctionParameter {
    name: string;
    type: string;
}
export interface EthereumFunctionInterface {
    name: string;
    inputs: EthereumFunctionParameter[];
    outputs: EthereumFunctionParameter[];
}

export interface StorageContractItem {
    intValue: number;
    stringValue: string;
}

export interface DataFromEthereum {
    result: string;
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

    public async getDataFromEthereum(contractAddress: string): Promise<DataFromEthereum> {
        const web3 = new Web3(new Web3.providers.HttpProvider(this.getEndpoint()));

        const ethFuncInterface = {
            name: "getValues",
            inputs: <EthereumFunctionParameter[]>[],
            outputs: [
              { name: "intValue", type: "uint256" },
              { name: "stringValue", type: "string" }
            ]
          };

        const block = await web3.eth.getBlock("latest");
        const callData = web3.eth.abi.encodeFunctionCall(ethFuncInterface, <string[]>[]);
        const outputHexString = await web3.eth.call({ to: contractAddress, data: callData }, block.number);
        const output = web3.eth.abi.decodeParameters(ethFuncInterface.outputs as any, outputHexString);

        return new Promise<DataFromEthereum>((resolve) => {
            resolve({
                result: output.__length__ === 1 ? output[0] : output,
                blockNumber: block.number,
                timestamp: block.timestamp
            })
        })
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