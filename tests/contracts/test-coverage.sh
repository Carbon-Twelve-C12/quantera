#!/bin/bash

# Test Coverage Script for Quantera Platform Smart Contracts
echo "Starting Quantera Platform test coverage..."

# Clean existing coverage files
npx hardhat clean

# Run all tests with coverage
npx hardhat coverage --testfiles "unit/*.test.js" --testfiles "integration/*.js" --solcoverjs ./.solcover.js

# Print coverage summary
echo "Coverage report generated at coverage/index.html"
echo "Open coverage/index.html in your browser to view detailed report"

# Optional: Add additional analysis if needed
# For example, check if coverage is below threshold
# cat coverage/coverage-summary.json | jq '.total.statements.pct < 80' 