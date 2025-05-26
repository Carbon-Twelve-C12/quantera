#!/bin/bash

echo "🧪 Running Cross-Chain Integration Tests..."

# Test 1: Cross-Chain Asset Transfer
echo "Testing cross-chain asset transfers..."
node scripts/test_cross_chain_transfer.js

# Test 2: Compliance Validation
echo "Testing compliance validation..."
node scripts/test_compliance.js

# Test 3: Performance Testing
echo "Running performance tests..."
node scripts/test_performance.js

# Test 4: Bridge Reliability
echo "Testing bridge reliability..."
node scripts/test_bridge_reliability.js

echo "✅ All tests completed!"
