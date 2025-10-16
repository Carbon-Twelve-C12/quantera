#!/bin/bash

# Risk Service Startup Script
set -e

echo "=== Starting Risk Service v2.0.0-alpha ==="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from template..."
    if [ -f env.template ]; then
        cp env.template .env
        echo "✅ Created .env file from template"
        echo "⚠️  Please update .env with your actual configuration values"
    else
        echo "❌ No env.template found. Please create .env file manually"
        exit 1
    fi
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Check required environment variables
required_vars="DATABASE_URL REDIS_URL ETH_RPC_URL RISK_ENGINE_ADDRESS"
missing_vars=""

for var in $required_vars; do
    if [ -z "${!var}" ]; then
        missing_vars="$missing_vars $var"
    fi
done

if [ -n "$missing_vars" ]; then
    echo "❌ Missing required environment variables:$missing_vars"
    echo "Please update your .env file"
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "⚠️  PostgreSQL is not running. Starting Docker services..."
    cd ../.. && docker-compose -f docker-compose.dev.yml up -d
    cd backend/risk_service
    sleep 5
fi

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    echo "❌ Redis is not responding. Please ensure Redis is running"
    exit 1
fi

echo "✅ All services healthy"
echo ""
echo "Starting Risk Service..."
echo "  HTTP API: http://localhost:${HTTP_PORT:-8001}"
echo "  WebSocket: ws://localhost:${WS_PORT:-8546}"
echo ""

# Run the service
cargo run --bin risk_service_server
