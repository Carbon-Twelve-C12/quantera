#!/bin/bash

# Quantera Platform - Local Development Environment Setup Script

echo "Setting up QuanteraPlatform local development environment..."

# Exit on error
set -e

# Check for required tools
echo "Checking for required tools..."

# Check for Rust
if ! command -v rustc &> /dev/null; then
    echo "Rust not found. Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
    rustup default stable
else
    echo "Rust is already installed. Updating..."
    rustup update stable
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Please install Node.js v18 or newer manually."
    exit 1
else
    NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo "Node.js version is less than 18. Please upgrade Node.js to v18 or newer."
        exit 1
    else
        echo "Node.js v$NODE_VERSION is installed."
    fi
fi

# Check for Solidity compiler
if ! command -v solc &> /dev/null; then
    echo "Solidity compiler not found. Installing..."
    npm install -g solc
else
    echo "Solidity compiler is already installed."
fi

# Create development directories if they don't exist
mkdir -p .dev/{ipfs,ethereum,l2}

# Set up backend environment
echo "Setting up backend environment..."
cd backend

# Create .env file for backend
cat > .env << EOF
# Environment variables for Quantera Platform
RUST_LOG=debug
ETHEREUM_RPC_URL=http://localhost:8545
IPFS_API_URL=http://localhost:5001
L2_RPC_URL=http://localhost:9545
JWT_SECRET=development_secret_do_not_use_in_production
EOF

echo "Building backend services..."
cargo build

echo "Backend setup complete."

# Set up frontend environment
echo "Setting up frontend environment..."
cd ../frontend

# Create package.json if it doesn't exist
if [ ! -f "package.json" ]; then
    cat > package.json << EOF
{
  "name": "quantera-frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.10.0",
    "ethers": "^6.3.0",
    "axios": "^1.3.5",
    "bootstrap": "^5.2.3",
    "react-bootstrap": "^2.7.4"
  },
  "devDependencies": {
    "react-scripts": "5.0.1",
    "@types/react": "^18.0.35",
    "@types/react-dom": "^18.0.11",
    "typescript": "^5.0.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOF

    # Create basic frontend structure
    mkdir -p src/{components,contexts,api,utils,pages}
    
    # Create a simple index file
    cat > src/index.js << EOF
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

    # Create a basic App component
    cat > src/App.js << EOF
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}

export default App;
EOF

    # Create a simple LandingPage
    mkdir -p src/pages
    cat > src/pages/LandingPage.js << EOF
import React from 'react';

function LandingPage() {
  return (
    <div className="container mt-5">
      <h1>Quantera Platform</h1>
      <p className="lead">
        An Ethereum-based platform for tokenizing securities.
      </p>
    </div>
  );
}

export default LandingPage;
EOF

    # Create .env file for frontend
    cat > .env << EOF
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ETHEREUM_NETWORK=localhost
EOF
fi

echo "Installing frontend dependencies..."
npm install

echo "Frontend setup complete."

# Set up contracts environment
echo "Setting up smart contracts environment..."
cd ../contracts

# Create hardhat.config.js if it doesn't exist
if [ ! -f "hardhat.config.js" ]; then
    # Initialize npm
    if [ ! -f "package.json" ]; then
        npm init -y
        npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
    fi
    
    # Create hardhat config
    cat > hardhat.config.js << EOF
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337
    }
  },
  paths: {
    sources: "./",
    tests: "../tests/contracts",
    cache: "../.dev/cache",
    artifacts: "../.dev/artifacts"
  }
};
EOF
fi

echo "Contracts setup complete."

# Create setup script for local blockchain
cat > ../scripts/start_local_blockchain.sh << EOF
#!/bin/bash

# Start a local Ethereum blockchain for development
npx hardhat node
EOF

# Create setup script for local IPFS
cat > ../scripts/start_local_ipfs.sh << EOF
#!/bin/bash

# Start a local IPFS node for development
if ! command -v ipfs &> /dev/null; then
    echo "IPFS not found. Please install IPFS manually."
    exit 1
fi

ipfs daemon
EOF

# Make scripts executable
chmod +x ../scripts/start_local_blockchain.sh
chmod +x ../scripts/start_local_ipfs.sh

echo "Quantera Platform local development environment setup complete."
echo "To start the local blockchain: ./scripts/start_local_blockchain.sh"
echo "To start the local IPFS node: ./scripts/start_local_ipfs.sh"
echo "To start the backend: cd backend && cargo run"
echo "To start the frontend: cd frontend && npm start" 