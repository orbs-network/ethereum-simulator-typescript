import * as ganache from "ganache-core";
import * as solc from "solc";
const Web3 = require("web3");

import { Contract, Block } from "web3/types";

export interface EthereumFunctionParameter {
    name: string;
    type: string;
}
export interface EthereumFunctionInterface {
    name: string;
    inputs: EthereumFunctionParameter[];
    outputs: EthereumFunctionParameter[];
}

export interface DataFromEthereum {
    result: string;
    blockNumber: number;
    timestamp: number;
}

export class EthereumSimulator {
    public ganacheServer: any;
    private contractAddress: string;
    private port: number;
    private contractSource: string;
    private contractArguments: Object[];

    constructor() {
        this.port = 0;
        this.contractAddress = "";
        this.contractSource = "";
        this.contractArguments = [];
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

    public async callDataFromSimulator(contractAddress: string, functionInterface: EthereumFunctionInterface, block?: Block): Promise<DataFromEthereum> {
        return this.callDataFromEthereum(this.getEndpoint(), contractAddress, functionInterface, block as Block);
    }

    public async callDataFromEthereum(endpoint: string, contractAddress: string, functionInterface: EthereumFunctionInterface, block: Block): Promise<DataFromEthereum> {
        const web3 = new Web3(new Web3.providers.HttpProvider(endpoint));

        if (!block) {
            block = await web3.eth.getBlock("latest");
        }

        const callData = web3.eth.abi.encodeFunctionCall(functionInterface, <string[]>[]);
        const outputHexString = await web3.eth.call({ to: contractAddress, data: callData }, block.number);
        const output = web3.eth.abi.decodeParameters(functionInterface.outputs, outputHexString);

        return new Promise<DataFromEthereum>((resolve) => {
            resolve({
                result: output.__length__ === 1 ? output[0] : output,
                blockNumber: block.number,
                timestamp: block.timestamp
            })
        })
    }

    public addContract(contractCode: string): void {
        this.contractSource = contractCode;
    }

    public setArguments(...args: any[]): void {
        for (var arg of args)
            this.contractArguments.push(arg);
    }

    public async compileAndDeployContract(): Promise<string> {
        if (this.contractSource.length == 0) {
            throw new Error("Must add contract source first");
        }

        const web3 = new Web3(new Web3.providers.HttpProvider(this.getEndpoint()));

        const output = solc.compile(this.contractSource, 1);
        if (output.errors)
            throw output.errors;
            
        const contractName = Object.keys(output.contracts)[0];
        const bytecode = output.contracts[contractName].bytecode;
        const abi = JSON.parse(output.contracts[contractName].interface);
        const contract = new web3.eth.Contract(abi, { data: "0x" + bytecode });
        const tx = contract.deploy({ arguments: this.contractArguments });
        const account = (await web3.eth.getAccounts())[0];
        const contractInstance = await <Contract>tx.send({
            from: account,
            gas: await tx.estimateGas()
        });

        this.contractAddress = contractInstance.options.address;
        return this.contractAddress;
    }

    public async close() {
        await this.ganacheServer.close()
        this.port = 0;
    }
}