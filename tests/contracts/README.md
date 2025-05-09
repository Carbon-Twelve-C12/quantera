# Quantera Platform Contract Integration Tests

This directory contains integration tests for the Quantera Platform smart contracts.

## Overview

Integration tests verify that different components of the system work together correctly. In this project, we test interactions between:

- L2Bridge contract and SmartAccountTemplates
- Bridging account templates across different L2 chains
- Cross-chain account deployment and execution
- Error handling and recovery

## Setup

1. Make sure you have Node.js (v14+) and npm installed

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with required environment variables:
   ```
   MAINNET_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/your-api-key
   ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/your-api-key
   OPTIMISM_RPC_URL=https://opt-mainnet.g.alchemy.com/v2/your-api-key
   PRIVATE_KEY=your-private-key
   ETHERSCAN_API_KEY=your-etherscan-api-key
   ARBISCAN_API_KEY=your-arbiscan-api-key
   OPTIMISM_API_KEY=your-optimism-etherscan-api-key
   ```

   Note: For local testing, these environment variables are optional.

## Running Tests

### Local Development

1. Start a local Hardhat node:
   ```bash
   npx hardhat node
   ```

2. Run the integration tests:
   ```bash
   npx hardhat test integration/bridge_account_integration_test.js --network localhost
   ```

### Running on Testnets

To run tests on public testnets (e.g., Goerli, Arbitrum Goerli, Optimism Goerli):

1. Update the network configuration in `hardhat.config.js` to include testnet configurations
2. Add appropriate RPC URLs and private keys to your `.env` file
3. Run the tests on the desired network:
   ```bash
   npx hardhat test integration/bridge_account_integration_test.js --network goerli
   ```

## Test Coverage

To generate test coverage reports:

```bash
npx hardhat coverage
```

The report will be available in the `coverage/` directory.

## Gas Analysis

To analyze gas usage:

```bash
REPORT_GAS=true npx hardhat test integration/bridge_account_integration_test.js
```

## Debugging

For more verbose output during tests:

```bash
npx hardhat test integration/bridge_account_integration_test.js --verbose
```

## Test Structure

- `before`: Sets up the test environment by deploying contracts and configuring test data
- `describe` blocks: Group related test cases together
- `it` blocks: Individual test cases that verify specific behaviors

## Key Test Scenarios

1. **Cross-chain Template Deployment**:
   - Creating a template on the source chain
   - Verifying the template
   - Bridging the template to L2 chains
   - Updating message status
   - Optimal data format calculation

2. **Cross-chain Account Deployment**:
   - Creating a deployment-ready template
   - Deploying an account from the template
   - Adding delegates to the account
   - Bridging account execution instructions to L2
   - Simulating account execution
   - Gas estimation for L2 operations

3. **Error Handling and Recovery**:
   - Handling message failure
   - Retrying failed messages

## Adding New Integration Tests

To add new integration tests:

1. Create a new test file in the `integration/` directory
2. Follow the pattern in existing tests:
   - Deploy relevant contracts
   - Set up test data
   - Perform contract interactions
   - Assert expected results 