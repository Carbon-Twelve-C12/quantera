#!/bin/bash

# Set environment variables for gas reporting and test optimization
export REPORT_GAS=true
export HARDHAT_NETWORK=hardhat
export NODE_ENV=test

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting comprehensive integration tests...${NC}"
echo "==============================================="

# Run the integration tests with detailed reporting
echo -e "${YELLOW}Running AssetFactory and LiquidityPools integration tests...${NC}"
npx hardhat test integration/AssetFactoryLiquidityIntegrationTest.js --verbose

# Run L2Bridge and Smart Account integration tests
echo -e "${YELLOW}Running L2Bridge and Smart Account integration tests...${NC}"
npx hardhat test integration/L2BridgeAndSmartAccountsTest.js --verbose

# Run L2Bridge Gas Optimizer tests
echo -e "${YELLOW}Running L2Bridge Gas Optimizer tests...${NC}"
npx hardhat test integration/L2BridgeGasOptimizerTest.js --verbose

# Generate test coverage report
echo -e "${YELLOW}Generating test coverage report...${NC}"
npx hardhat coverage

echo -e "${GREEN}All integration tests completed!${NC}"
echo "==============================================="
echo "To view coverage report, open coverage/index.html in your browser." 