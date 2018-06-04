import * as mocha from "mocha";
import * as chai from "chai";
import * as getPort from "get-port";

import createEthSimulator, { EthereumSimulator } from "../lib/index";

const expect = chai.expect;

describe("simulator test", function() {
    this.timeout(10000);
    const SERVER_IP_ADDRESS = "127.0.0.1";
    let ethSim: EthereumSimulator;

    beforeEach(async () => {
        const ethSimPort = await getPort();

        ethSim = await createEthSimulator(ethSimPort);
    });
    
    it("should launch successfully", async () => {
        expect(ethSim.port).to.be.gt(0);
        expect(ethSim.contractAddress).to.not.equal("");
    });

    afterEach(async () => {
        ethSim.close();
    })
});
