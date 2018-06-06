import * as chai from "chai";
import * as getPort from "get-port";

import { EthereumSimulator, EthereumFunctionInterface, EthereumFunctionParameter } from "../lib/index";
import { simpleStorage } from "./contracts/simple-storage.sol";

const expect = chai.expect;

async function createEthSimulator(port: number): Promise<EthereumSimulator> {
    const ethSim = new EthereumSimulator();
    await ethSim.listen(port);
    return ethSim;
}

describe("simulator test", function() {
    this.timeout(10000);
    let ethSim: EthereumSimulator;
    let intValue: number;
    let stringValue: string;

    beforeEach(async () => {
        const ethSimPort = await getPort();
        intValue = Math.floor(Math.random() * 10000000);
        stringValue = "magic money!";
        ethSim = await createEthSimulator(ethSimPort);
    });
    
    it("should launch successfully", async () => {
        expect(ethSim.getEndpoint()).to.not.throw;
    });

    it("should retrieve values from the contract", async () => {
        ethSim.addContract(simpleStorage);
        ethSim.setArguments(intValue, stringValue);
        const contractAddress = await ethSim.compileAndDeployContract();
        const storageFuncInterface: EthereumFunctionInterface = {
            name: "getValues",
            inputs: <EthereumFunctionParameter[]>[],
            outputs: [
              { name: "intValue", type: "uint256" },
              { name: "stringValue", type: "string" }
            ]
          };
        const res = await ethSim.callDataFromSimulator(contractAddress, storageFuncInterface);
        expect(res).to.have.property("result").that.has.property("intValue", intValue.toString());
        expect(res).to.have.property("result").that.has.property("stringValue", stringValue);
        expect(res).to.have.property("blockNumber");
        expect(res).to.have.property("timestamp");
    })

    afterEach(async () => {
        ethSim.close();
    })
});
