# Quantera Platform - Asset Tokenization Ecosystem

## Overview
Quantera is a comprehensive blockchain-based ecosystem for tokenizing any financial asset class. While initially focused on U.S. Treasury securities, the platform is architecturally designed for multi-asset support with superior liquidity solutions, yield optimization, and cross-chain interoperability. Leveraging Ethereum's capabilities, Quantera aims to become the leading tokenization platform globally, serving both institutional and individual investors. The platform provides specialized support for environmental assets and sustainable finance instruments, positioning Quantera at the forefront of Web3 sustainability solutions.

## Key Features
- **Asset-Agnostic Tokenization**: Modular system for tokenizing any asset class
- **Advanced Liquidity Solutions**: AMM with concentrated liquidity positions
- **Intelligent Yield Optimization**: Strategy marketplace and auto-compounding
- **Smart Account Integration** (EIP-7702): Programmable account logic
- **Cross-Chain Interoperability**: Unified experience across multiple blockchains
- **Superior Compliance Framework**: Global regulatory adaptability
- **Environmental Asset Support**: Specialized features for carbon credits, biodiversity credits, RECs, and more
- **Impact Tracking & Reporting**: Comprehensive ESG metrics and reporting tools
- **White-Label Customization**: For institutional asset managers
- **Developer Ecosystem**: SDK and template marketplace

## Project Structure
```
Quantera/
├── contracts/             # Smart contracts
│   ├── accounts/          # Smart account templates
│   ├── l2/                # Layer 2 bridge contracts
│   ├── institutional/     # Institutional validator contracts
│   ├── factories/         # Asset factory contracts
│   ├── liquidity/         # Liquidity pool contracts
│   └── yield/             # Yield optimizer contracts
├── backend/               # Rust backend services
│   ├── ethereum_client/   # Ethereum blockchain client
│   └── treasury_service/  # Asset management services and API
├── frontend/              # React frontend application
│   ├── public/            # Static assets
│   └── src/               # React source code
│       ├── api/           # API client for backend services
│       ├── components/    # Reusable UI components
│       │   └── common/    # Common components (Header, Footer, etc.)
│       ├── contexts/      # React contexts (Theme, Wallet, etc.)
│       ├── pages/         # Page components (Home, Marketplace, etc.)
│       ├── styles/        # CSS and styling
│       └── utils/         # Utility functions
├── scripts/               # Development and deployment scripts
├── tests/                 # Test suites
└── docs/                  # Documentation
    └── sustainable_finance_initiative.md  # Environmental asset documentation
```

## Development Status
### Completed
- **Smart Contracts**: Core contracts including TreasuryRegistry, TreasuryToken, ComplianceModule, TradingModule
- **Backend Services**: 
  - Ethereum client with Pectra support
  - Contract client implementations
  - Service layer components
  - RESTful API layer with comprehensive endpoints
- **Frontend Components**: 
  - Core page components
  - Common components
  - Theme system with light/dark mode
  - Responsive design for all devices
- **Environmental Asset Integration**:
  - Updated asset class enum from "CARBON_CREDIT" to "ENVIRONMENTAL_ASSET" for broader inclusivity
  - Support for biodiversity credits, renewable energy certificates, and water rights
  - Implementation of impact tracking mechanisms
  - Verification and certification integration for environmental credits

### In Progress
- **Asset Factory Implementation**: Multi-asset tokenization templates
- **Liquidity Pools**: Advanced AMM with dynamic fees
- **Yield Optimizer**: Auto-compounding and strategy marketplace
- **Smart Account Templates**: Advanced investment strategies
- **Cross-Chain Integration**: Enhanced L2 bridge with blob data optimization
- **Frontend Wallet Connectivity**: Unified interface for all supporting wallets
- **Environmental Impact Dashboard**: Real-time tracking and visualization of impact metrics
- **Certification Standard Integration**: Direct connections to environmental asset verification frameworks

### Next Steps
- Complete implementation of AssetFactory.sol contract
- Implement LiquidityPools.sol contract with concentrated liquidity
- Develop YieldOptimizer.sol with strategy marketplace
- Create SmartAccountTemplates.sol with advanced investment strategies
- Enhance L2Bridge.sol for multi-chain support
- Expand the frontend interface to support new features
- Build ESG scoring and impact visualization dashboards
- Implement environmental asset verification and certification system

## API Endpoints
The platform exposes the following API endpoints:

### Authentication
- `POST /auth/challenge`: Generate authentication challenge for wallet signature
- `POST /auth/login`: Login with wallet signature
- `POST /auth/logout`: Logout and invalidate token

### Asset Management
- `GET /assets`: List all assets with filtering options
- `GET /assets/{id}`: Get specific asset details
- `POST /assets`: Create new asset using templates (restricted)
- `GET /assets/{id}/yield`: Get yield information for an asset

### Liquidity
- `GET /liquidity/pools`: List all liquidity pools
- `GET /liquidity/pools/{id}`: Get specific pool details
- `POST /liquidity/provide`: Add liquidity to a pool
- `POST /liquidity/withdraw`: Remove liquidity from a pool

### Yield Strategies
- `GET /yield/strategies`: List all yield strategies
- `GET /yield/strategies/{id}`: Get specific strategy details
- `POST /yield/strategies/apply`: Apply strategy to holdings
- `GET /yield/forecasts/{assetId}`: Get yield forecasts for an asset

### Environmental Assets
- `GET /environmental/assets`: List all environmental assets
- `GET /environmental/assets/{id}`: Get specific environmental asset details
- `GET /environmental/assets/type/{type}`: Filter assets by environmental type
- `POST /environmental/assets/{id}/retire`: Retire environmental credits
- `GET /environmental/impact/{assetId}`: Get impact metrics for an asset
- `GET /environmental/impact/portfolio/{address}`: Get aggregate impact for a portfolio
- `GET /environmental/certifications`: List available certification standards
- `GET /environmental/reports/{timeframe}`: Generate impact reports

### User Management
- `POST /users/register`: Register a new user
- `POST /users/verify`: Submit verification information
- `POST /users/institutional/register`: Register an institutional user
- `GET /users/{address}/portfolio`: Get user portfolio with analytics
- `POST /users/smart-account/setup`: Configure smart account for automated strategies

### Trading
- `POST /trading/orders`: Place buy/sell orders for assets
- `GET /trading/orders`: List orders with filtering options
- `GET /trading/orders/{id}`: Get order details
- `POST /trading/orders/cancel`: Cancel an existing order

## Frontend Features

### Core Pages
- **Home**: Platform overview showcasing multi-asset support
- **Marketplace**: Browse, filter, and search available assets
- **Portfolio**: View holdings, yield information, and performance
- **Asset Factory**: Create and customize new asset tokens
- **Liquidity**: Manage liquidity positions across assets
- **Yield Optimizer**: Browse and apply yield strategies
- **Smart Accounts**: Configure automated investment strategies
- **Environmental Impact**: View and track sustainability metrics
- **Impact Dashboard**: Visualize environmental impact of investments

### Advanced Components
- **Asset Template Explorer**: Browse templates for different asset classes
- **Liquidity Pool Visualizer**: Interactive view of pool positions
- **Yield Strategy Selector**: Compare and select strategies
- **Cross-Chain Navigator**: Seamlessly switch between blockchain networks
- **Risk Assessment Dashboard**: Analyze portfolio risk metrics
- **Environmental Asset Marketplace**: Specialized interface for sustainable investments
- **Impact Reporting Tool**: Generate customizable ESG reports
- **Certification Verification System**: Validate environmental asset credentials

## Sustainable Finance Initiative

Quantera is committed to advancing sustainable finance through our platform:

- **Environmental Asset Support**: Specialized features for carbon credits, biodiversity credits, RECs, and more
- **Impact Measurement**: Comprehensive tracking of environmental and social impacts
- **Verification Integration**: Direct connections to leading certification standards
- **Transparent Reporting**: Customizable ESG reporting frameworks for various stakeholders
- **Yield Enhancement**: Specialized strategies for environmental asset holders
- **Cross-Chain Capabilities**: Efficient trading of environmental assets across blockchain ecosystems

For more details, see our [Sustainable Finance Initiative](docs/sustainable_finance_initiative.md) documentation.

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

5. Run the API server
   ```
   cd backend
   cargo run --bin server
   ```

6. Run the frontend development server
   ```
   cd frontend
   npm start
   ```

7. Run tests
   ```
   cd tests
   cargo test
   ```

## Enhanced Architecture
- **Asset Factory**: Modular system for creating and managing tokenized assets
- **Treasury Registry**: Central registry for all tokenized assets
- **Asset Tokens**: ERC-1400 compatible tokens with advanced features
- **Compliance Module**: Global regulatory framework adapters
- **Trading Module**: Order book with AMM integration
- **Liquidity Pools**: Advanced AMM with concentrated liquidity
- **Yield Optimizer**: Strategy marketplace for yield maximization
- **L2 Bridge**: Cross-chain integration for efficient trading
- **Smart Account Templates**: Programmable account logic for asset management
- **Environmental Asset System**: Specialized contracts for sustainability-focused assets
- **Impact Tracker**: Measurement and verification of environmental impacts

## Backend Services
- **Alloy Integration**: Ethereum blockchain interaction with Pectra support
- **Asset Management**: Lifecycle handling for all asset types
- **Trading Service**: Order matching and execution
- **Liquidity Service**: Pooled liquidity management
- **Yield Service**: Strategy execution and optimization
- **User Management**: Registration, verification, and portfolio tracking
- **Authentication**: Secure wallet-based authentication
- **API Layer**: Comprehensive RESTful API
- **Environmental Verification Service**: Integration with certification standards
- **Impact Analytics Service**: Environmental impact calculation and reporting

## License
This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Contributing
We welcome contributions to the Quantera Platform! Here's how you can help:

### Reporting Issues
- Use the GitHub issue tracker to report bugs or suggest enhancements
- Include detailed steps to reproduce the issue
- Mention your environment (OS, browser version, etc.)

### Development Process
1. Fork the repository
2. Create a new branch for your feature (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Guidelines
- Follow the language-specific conventions listed in our style guides
- Write tests for new features and ensure existing tests pass
- Document your code according to language-specific documentation standards
- Ensure your code passes all CI/CD checks before submitting a PR

### Security
- If you discover a security vulnerability, please send an email to hello@marcjohnson.xyz
- Do NOT create public GitHub issues for security vulnerabilities

## Contact
For questions, suggestions, or collaboration opportunities, please email:
hello@marcjohnson.xyz
