import * as mocha from "mocha";
import * as chai from "chai";
import * as getPort from "get-port";

import createEthSimulator, { EthereumSimulator } from "../lib/index";

const expect = chai.expect;

describe("simulator test", function() {
    this.timeout(10000);
    let ethSim: EthereumSimulator;

    beforeEach(async () => {
        const ethSimPort = await getPort();
        
        ethSim = await createEthSimulator(ethSimPort);
        console.log(`ethsim online on port ${ethSimPort}`);
    });
    
    it("should launch successfully", async () => {
        expect(ethSim.port).to.be.gt(0);
        expect(ethSim.contractAddress).to.not.equal("");
    });

    it("should retrieve values from the contract", async () => {
        const source = ethSim.getStoredDataFromMemory();
        const res = await ethSim.getDataFromEthereum(ethSim.contractAddress);
        expect(res).to.have.property("result").that.has.property("intValue", source.intValue.toString());
        expect(res).to.have.property("result").that.has.property("stringValue", source.stringValue);
        expect(res).to.have.property("blockNumber");
        expect(res).to.have.property("timestamp");
    })

    afterEach(async () => {
        ethSim.close();
    })
});
