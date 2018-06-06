# Ethereum Simulator

A node.js module that runs a simulated ethereum node using ganache and enables compilation and execution of a contract call via web3 and solcjs.

The goal of this module is to both enable you to quickly test your smart contracts via javascript/typescript and additionally, let you test your own web3 code vs. the ganache ethereum simulator.


## Installation

### Node.js
```sh
npm install ethereum-simulator
```

### Yarn
```sh
yarn add ethereum-simulator
```

## Usage

### TypeScript
```typescript
import { EthereumSimulator } from 'ethereum-simulator';

const ethSim = new EthereumSimulator();
await ethSim.listen(8545);
...

await ethSim.close();
```

### Javascript
```javascript
var EthereumSimulator = require('ethereum-simulator');
var ethSim = new EthereumSimulator();
await ethSim.listen(8545);
...

await ethSim.close();
```

## Quickstart

While the module can be used just as a wrapper to ganache-core, it is also possible to feed it with a contract and have it deploy the contract and later test any function call on that contract.

The test code instruments the entire function set with a sample contract (see [test](/tree/master/test) directory).

There are several exposed methods:
* `addContract` to add a contract to deploy on ganache, expects a string that contract the contract code.
* `setArguments` to set the arguments to send when deploying the above contract
* `compileAndDeployContract` this will compile and then deploy the contract added
* `callDataFromSimulator` this will call a specific contract and function interface on the simulator (closed loop testing of the contract)
* `callDataFromEthereum` the same as above, but will accept a endpoint to work on

# Contribute

The module is written in TypeScript, using ganache-core, solc and web3. Tests are running with mocha+chai.

It will require node.js and npm installed.
