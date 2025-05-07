#!/bin/bash

# Script to run the local development environment for Quantera Platform

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Starting Quantera Platform Development Environment ===${NC}"

# Check if required programs are installed
check_dependency() {
  if ! command -v $1 &> /dev/null; then
    echo -e "${YELLOW}Warning: $1 is not installed. Some features may not work correctly.${NC}"
    return 1
  fi
  return 0
}

check_dependency npm
check_dependency node

# Define function to stop all processes on exit
cleanup() {
  echo -e "${YELLOW}Stopping all processes...${NC}"
  kill $(jobs -p) 2>/dev/null
  exit
}

# Register the cleanup function for SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# Try to start backend server if available
if check_dependency cargo && [ -d "backend/treasury_service" ]; then
  echo -e "${GREEN}Starting backend server...${NC}"
  cd backend && RUST_LOG=info cargo run --bin server &
  BACKEND_PID=$!
  cd ..
else
  echo -e "${YELLOW}Skipping backend server (missing dependencies or directories)${NC}"
  echo -e "${BLUE}Note:${NC} The frontend will use mock data instead of real API calls"
fi

# Start frontend development server if it exists, otherwise show instructions
if [ -d "frontend" ]; then
  echo -e "${GREEN}Starting frontend development server...${NC}"
  cd frontend
  if [ -f "package.json" ]; then
    npm start &
    FRONTEND_PID=$!
  else
    echo -e "${RED}Error: frontend/package.json not found.${NC}"
    echo -e "${YELLOW}To fix this, run these commands to set up the frontend:${NC}"
    echo -e "cd frontend"
    echo -e "npm init -y"
    echo -e "npm install react react-dom react-router-dom react-bootstrap bootstrap axios react-icons react-scripts web-vitals"
    echo -e "npm start"
  fi
  cd ..
else
  echo -e "${RED}Error: frontend directory not found.${NC}"
  echo -e "${YELLOW}To fix this, run:${NC}"
  echo -e "mkdir -p frontend/src frontend/public"
  echo -e "cd frontend"
  echo -e "npm init -y"
  echo -e "npm install react react-dom react-router-dom react-bootstrap bootstrap axios react-icons react-scripts web-vitals"
  echo -e "npm start"
fi

echo -e "${GREEN}Development environment setup complete${NC}"
echo -e "${BLUE}Frontend:${NC} http://localhost:3000"
echo -e "${BLUE}API:${NC} http://localhost:3001/api (may not be available)"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Wait for all background processes to finish
wait 