require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "../contracts",
    tests: "./",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {
      chainId: 1337,
      allowUnlimitedContractSize: true,
      gasPrice: 20000000000, // 20 gwei
      gas: 12000000, // 12M gas limit to handle complex contract interactions
    }
  },
  mocha: {
    timeout: 60000, // Increase timeout for complex tests
  }
}; 