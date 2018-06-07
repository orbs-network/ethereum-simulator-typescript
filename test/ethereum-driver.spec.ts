import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as getPort from "get-port";

import { EthereumSimulator, EthereumFunctionInterface, EthereumFunctionParameter } from "../lib/index";
import { simpleStorage } from "./contracts/simple-storage.sol";

const expect = chai.expect;
chai.use(chaiAsPromised);

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
        return expect(() => ethSim.getEndpoint()).to.not.throw();
    });

    it("should throw if not initialized", async () => {
        await ethSim.close();
        return expect(() => ethSim.getEndpoint()).to.throw("Simulator not listening on any endpoint");
    });

    it("should not allow a deploy without a contract", async () => {
        return expect(ethSim.compileAndDeployContractOnGanache()).to.eventually.be.rejectedWith("Must add contract source first");
    });

    it("should compile and deploy a contract", async () => {
        ethSim.addContract(simpleStorage);
        ethSim.setArguments(intValue, stringValue);
        const contractAddress = await ethSim.compileAndDeployContractOnGanache();

        return expect(contractAddress).to.have.length.gt(0);
    });

    it("should retrieve values from the contract", async () => {
        ethSim.addContract(simpleStorage);
        ethSim.setArguments(intValue, stringValue);
        const contractAddress = await ethSim.compileAndDeployContractOnGanache();
        const storageFuncInterface: EthereumFunctionInterface = {
            name: "getValues",
            inputs: <EthereumFunctionParameter[]>[],
            outputs: [
              { name: "intValue", type: "uint256" },
              { name: "stringValue", type: "string" }
            ]
          };
        const res = await ethSim.callDataFromSimulator(contractAddress, storageFuncInterface);
        await expect(res).to.have.property("result").that.has.property("intValue", intValue.toString());
        await expect(res).to.have.property("result").that.has.property("stringValue", stringValue);
        await expect(res).to.have.property("blockNumber");
        await expect(res).to.have.property("timestamp");
    })

    afterEach(async () => {
        return ethSim.close();
    })
});
