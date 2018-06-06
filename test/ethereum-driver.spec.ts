import * as mocha from "mocha";
import * as chai from "chai";
import * as getPort from "get-port";

import { EthereumSimulator } from "../lib/index";
import { simpleStorage } from "../lib/contracts/simple-storage.sol";

const expect = chai.expect;

async function createEthSimulator(port: number, source: string, intValue: number, stringValue: string): Promise<EthereumSimulator> {
    const ethSim = new EthereumSimulator();
    await ethSim.listen(port);
    ethSim.addContract(source);
    ethSim.setArguments(intValue, stringValue);

    ethSim.contractAddress = await ethSim.compileAndDeployContract();

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
        ethSim = await createEthSimulator(ethSimPort, simpleStorage, intValue, stringValue);
        console.log(`ethsim online on port ${ethSimPort}`);
    });
    
    it("should launch successfully", async () => {
        expect(ethSim.port).to.be.gt(0);
        expect(ethSim.contractAddress).to.not.equal("");
    });

    it("should retrieve values from the contract", async () => {
        const res = await ethSim.getDataFromEthereum(ethSim.contractAddress);
        expect(res).to.have.property("result").that.has.property("intValue", intValue.toString());
        expect(res).to.have.property("result").that.has.property("stringValue", stringValue);
        expect(res).to.have.property("blockNumber");
        expect(res).to.have.property("timestamp");
    })

    afterEach(async () => {
        ethSim.close();
    })
});
