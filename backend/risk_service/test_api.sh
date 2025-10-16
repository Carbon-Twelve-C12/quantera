#!/bin/bash

# Risk Service API Test Script
# Run this after starting the risk service

echo "=== Risk Service API Testing ==="
echo "Testing endpoints at http://localhost:8001"
echo ""

# Test portfolio address
PORTFOLIO="0x1234567890123456789012345678901234567890"

echo "1. Testing Health Check..."
curl -s http://localhost:8001/health | jq '.' || echo "Service not responding"
echo ""

echo "2. Testing Portfolio Risk Metrics..."
curl -s http://localhost:8001/api/v2/risk/portfolio/$PORTFOLIO | jq '.' || echo "Failed to get risk metrics"
echo ""

echo "3. Testing Risk Scenarios..."
curl -s -X POST http://localhost:8001/api/v2/risk/scenarios/$PORTFOLIO \
  -H "Content-Type: application/json" \
  -d '{
    "scenarios": [
      {
        "name": "Market Crash",
        "volatility_multiplier": 3.0,
        "correlation_adjustment": 0.2
      }
    ]
  }' | jq '.' || echo "Failed to run scenarios"
echo ""

echo "4. Testing Risk Alerts..."
curl -s http://localhost:8001/api/v2/risk/alerts/$PORTFOLIO | jq '.' || echo "Failed to get alerts"
echo ""

echo "=== API Testing Complete ===
"
