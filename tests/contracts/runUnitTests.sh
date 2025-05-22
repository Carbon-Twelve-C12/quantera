#!/bin/bash

# Run Unit Tests for Quantera Platform Smart Contracts
echo "Starting Quantera Platform unit tests..."

# Run unit tests
npx hardhat test unit/*.test.js

echo "Unit tests completed!"
echo "To generate a coverage report, run ./test-coverage.sh" 