# Quantera Platform

## Overview
Quantera is a blockchain-based platform for tokenizing financial assets, starting with U.S. Treasury securities. It enables fractional ownership, transparent trading, and automated yield distribution through blockchain technology with enhanced capabilities from Ethereum's Pectra upgrade. The platform is designed to expand to support various financial assets beyond treasuries.

## Features
- Tokenization of financial assets (currently U.S. Treasury bills, notes, and bonds)
- Smart account integration (EIP-7702)
- Layer 2 integration with blob optimization (EIP-7691)
- Compliance framework for regulatory adherence
- Secondary market for trading tokenized assets
- Programmatic yield distribution
- Delegation system for portfolio management
- Institutional validator support

## Project Structure
```
Quantera/
├── contracts/             # Smart contracts
│   ├── accounts/          # Smart account templates
│   ├── l2/                # Layer 2 bridge contracts
│   └── institutional/     # Institutional validator contracts
├── backend/               # Rust backend services
├── frontend/              # React frontend application
├── scripts/               # Development and deployment scripts
├── tests/                 # Test suites
└── docs/                  # Documentation
```

## Development Status
- **Smart Contracts**: Completed core contracts including TreasuryRegistry, TreasuryToken, ComplianceModule, TradingModule, L2Bridge, and SmartAccountTemplates
- **Backend Services**: Implemented Ethereum client, TreasuryRegistryClient, TreasuryService and TreasuryTokenClient
- **Frontend Components**: Basic implementation of TreasuryTokenList and TreasuryTokenDetail components

## Recent Implementations
- L2Bridge contract with blob data optimization (EIP-7691) for efficient cross-layer asset trading
- SmartAccountTemplates for programmable accounts with various asset management strategies
- TreasuryTokenClient for backend interaction with tokenized asset contracts

## Development Setup

### Prerequisites
- Rust (stable version 1.70.0 or newer)
- Node.js (v18 or newer) and npm
- Alloy.rs framework with Pectra EIP support
- Hardhat for local Ethereum development
- IPFS development node
- Local L2 testnet environment (Optimism or Arbitrum)

### Getting Started
1. Clone the repository
   ```
   git clone https://github.com/mjohnson518/vault.git
   cd vault
   ```

2. Install backend dependencies
   ```
   cd backend
   cargo build
   ```

3. Install frontend dependencies
   ```
   cd frontend
   npm install
   ```

4. Set up local development environment
   ```
   cd scripts
   ./setup_local_env.sh
   ```

5. Run tests
   ```
   cd tests
   cargo test
   ```

## Smart Contract Architecture
- **TreasuryRegistry**: Central registry for all tokenized financial assets
- **TreasuryToken**: ERC-1400 compatible token representing asset ownership
- **ComplianceModule**: Ensures regulatory compliance for transfers
- **TradingModule**: Facilitates buying and selling of tokens
- **L2Bridge**: Enables Layer 2 integration for efficient trading with blob optimization
- **SmartAccountTemplates**: Ready-to-use programmable account logic for asset management

## Backend Services
- **Alloy Integration**: Interfaces with Ethereum blockchain using Alloy framework
- **Treasury Management**: Handles lifecycle of tokenized assets
- **Trading Service**: Manages order book and trade execution
- **User Management**: Handles registration, verification, and portfolios
- **API Layer**: RESTful API for frontend and third-party integration

## License
This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Contributing
[Contribution Guidelines]

## Contact
[Contact Information]
