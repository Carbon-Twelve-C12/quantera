# TreasuryToken Platform

## Overview
TreasuryToken is an Ethereum-based platform for tokenizing U.S. Treasury securities. It enables fractional ownership, transparent trading, and automated yield distribution through blockchain technology with enhanced capabilities from Ethereum's Pectra upgrade.

## Features
- Tokenization of Treasury bills, notes, and bonds
- Smart account integration (EIP-7702)
- Layer 2 integration with blob optimization (EIP-7691)
- Compliance framework for regulatory adherence
- Secondary market for trading tokenized treasuries
- Programmatic yield distribution
- Delegation system for portfolio management
- Institutional validator support

## Project Structure
```
TreasuryToken/
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
   git clone [repository-url]
   cd treasurytoken
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
- **TreasuryRegistry**: Central registry for all tokenized treasury securities
- **TreasuryToken**: ERC-1400 compatible token representing treasury ownership
- **ComplianceModule**: Ensures regulatory compliance for transfers
- **TradingModule**: Facilitates buying and selling of tokens
- **L2Bridge**: Enables Layer 2 integration for efficient trading
- **SmartAccountTemplates**: Ready-to-use programmable account logic

## Backend Services
- **Alloy Integration**: Interfaces with Ethereum blockchain using Alloy framework
- **Treasury Management**: Handles lifecycle of tokenized treasuries
- **Trading Service**: Manages order book and trade execution
- **User Management**: Handles registration, verification, and portfolios
- **API Layer**: RESTful API for frontend and third-party integration

## License
[License Information]

## Contributing
[Contribution Guidelines]

## Contact
[Contact Information]
