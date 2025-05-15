# Quantera Platform - Asset Tokenization Ecosystem

[![Website](https://img.shields.io/badge/Website-Quantera.finance-blue)](https://quantera.finance/)
[![Contributors](https://img.shields.io/github/contributors/mjohnson518/vault)](https://github.com/mjohnson518/vault/graphs/contributors)
[![Version](https://img.shields.io/badge/Version-0.8.0-green)]()

## Version: 0.8.0 (80% Complete)

## Overview
Quantera is an ecosystem for tokenizing any financial asset class. While initially focused on U.S. Treasury securities, the platform is architecturally designed for multi-asset support with superior liquidity solutions, yield optimization, and cross-chain interoperability. Leveraging Ethereum's capabilities, Quantera aims to become the leading tokenization platform globally, serving both institutional and individual investors. The platform provides specialized support for environmental assets and sustainable finance instruments, positioning Quantera at the forefront of Web3 sustainability solutions.

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
│   └── contracts/         # Integration tests for smart contracts
└── docs/                  # Documentation
    └── sustainable_finance_initiative.md  # Environmental asset documentation
```

## Development Status
### Completed
- **Smart Contracts**: 
  - Core contracts including TreasuryRegistry, TreasuryToken, ComplianceModule, TradingModule
  - AssetFactory contract for multi-asset tokenization with support for various asset classes
  - LiquidityPools contract with concentrated liquidity positioning
  - YieldOptimizer contract with strategy marketplace and auto-compounding
  - L2Bridge contract with enhanced cross-chain capabilities and EIP-7691 blob data optimization
  - SmartAccountTemplates contract with template management and account deployment
  - Integration tests between contracts

- **Backend Services**: 
  - Ethereum client with Pectra support
  - Contract client implementations
  - Service layer components
  - RESTful API layer with comprehensive endpoints
  - L2BridgeClient for interacting with L2 bridge with enhanced cross-chain capabilities
  - SmartAccountClient for managing smart account templates
  - API endpoints for L2 bridge and smart account functionality
  - WebSocket service for real-time updates on L2 bridge messages and smart account operations

- **Frontend Components**: 
  - Core page components
  - Common components
  - Theme system with light/dark mode support that properly responds across all components
  - Responsive design for all devices
  - Consistent styling across components
  - Improved asset display with proper sorting and categorization
  - Enhanced ImageWithFallback component with robust fallback logic and direct asset mapping
  - Proper image representation for all asset types with category-appropriate visuals
  - L2Bridge React context for state management
  - L2BridgeWidget with comprehensive UI for bridging assets
  - Transaction history tracking with status indicators
  - Gas estimation display with blob data support indication
  - Chain selection with network capabilities display
  - YieldStrategyPage with comprehensive strategy browsing and filtering
  - Strategy application workflow with asset selection and parameter customization
  - Environmental impact calculation for sustainable finance instruments
  - Custom CompatGrid component for Material UI v7 compatibility
  - WalletContext implementation with proper wallet integration
  - Wallet connection and network switching functionality 
  - Persistent wallet connection with local storage
  - Robust error handling for wallet connection issues
  - Contract Explorer page with smart contract browsing and documentation
  - Syntax highlighting for Solidity code display
  - Detailed contract information view with tabs for source code, functions, security, and documentation  
  - Optimized header with hamburger menu navigation for better space utilization
  - Improved responsive layout with better spacing and edge-to-edge design
  - Asset image upload functionality with file and URL input options
  - Custom ImageUploader component with preview, editing, and deletion capabilities
  - Asset Creation wizard with multi-step interface for configuring asset properties
  - Interactive asset class selection with visual categorization
  - Comprehensive asset summary view with visual preview

- **Environmental Asset Integration**:
  - Updated asset class enum from "CARBON_CREDIT" to "ENVIRONMENTAL_ASSET" for broader inclusivity
  - Support for biodiversity credits, renewable energy certificates, and water rights
  - Implementation of impact tracking mechanisms
  - Verification and certification integration for environmental credits
  - Visually distinctive presentation of environmental assets with impact metrics display

- **Type System Implementation**:
  - Comprehensive TypeScript interface for WalletContext
  - Complete type definitions for L2Bridge functionality
  - Standardized type usage across components
  - Fixed circular dependencies and import errors
  - TypeScript configuration with proper path mappings

### In Progress
- **Liquidity Pools Integration**: Frontend interface for concentrated liquidity provision
- **Environmental Impact Dashboard**: Real-time tracking and visualization of impact metrics
- **Certification Standard Integration**: Direct connections to environmental asset verification frameworks
- **Asset Creation UI Enhancements**: Advanced validation and template customization features

### Next Steps
- Create Asset Management service for multi-asset support
- Implement WebSocket support for real-time updates
- Enhance analytics and reporting capabilities
- Develop environmental impact metrics API
- Complete implementation of frontend interfaces for liquidity pools
- Extend Asset Creation wizard with validation rules and template system
- Build Portfolio management dashboard
- Design Analytics visualization components
- Create ESG scoring and impact visualization dashboards
- Conduct security audits and gas optimization
- Implement comprehensive monitoring system
- Validate environmental asset verification mechanisms

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

### Smart Account Management
- `GET /smart-accounts/templates`: List available smart account templates
- `GET /smart-accounts/templates/{id}`: Get specific template details
- `POST /smart-accounts/deploy`: Deploy a new smart account from a template
- `GET /smart-accounts/{address}`: Get smart account details
- `POST /smart-accounts/{address}/execute`: Execute a function on a smart account

### L2 Bridge Operations
- `GET /l2/bridges`: List supported L2 networks
- `POST /l2/bridges/deposit`: Deposit assets to L2
- `POST /l2/bridges/withdraw`: Withdraw assets from L2
- `GET /l2/assets/{chainId}`: List assets on specified L2
- `GET /l2/gas-estimates`: Get gas estimates for L2 operations

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

### Wallet Management
- `GET /wallet/networks`: List supported blockchain networks
- `POST /wallet/connect`: Initialize wallet connection
- `POST /wallet/disconnect`: Disconnect wallet session
- `POST /wallet/switch-network`: Change active blockchain network
- `GET /wallet/balance/{address}`: Get token balances for an address

## Frontend Features

### Core Pages
- **Home**: Platform overview showcasing multi-asset support
- **Marketplace**: Browse, filter, and search available assets
- **Portfolio**: View holdings, yield information, and performance
- **Asset Factory**: Create and customize new asset tokens
- **Liquidity**: Manage liquidity positions across assets
- **Yield Strategy Marketplace**: Browse, filter, and apply yield strategies with environmental impact calculation
- **Smart Accounts**: Configure automated investment strategies
- **Environmental Impact**: View and track sustainability metrics
- **Impact Dashboard**: Visualize environmental impact of investments
- **Contract Explorer**: Browse and understand platform smart contracts with source code, functions, security info, and documentation

### Advanced Components
- **Asset Template Explorer**: Browse templates for different asset classes
- **Liquidity Pool Visualizer**: Interactive view of pool positions
- **Yield Strategy Marketplace**: Browse, filter, and apply yield strategies with environmental impact calculation
- **Cross-Chain Navigator**: Seamlessly switch between blockchain networks
- **Risk Assessment Dashboard**: Analyze portfolio risk metrics
- **Environmental Asset Marketplace**: Specialized interface for sustainable investments
- **Impact Reporting Tool**: Generate customizable ESG reports
- **Certification Verification System**: Validate environmental asset credentials
- **Wallet Connection System**: Unified wallet integration with provider detection and persistent sessions
- **Contract Code Viewer**: Syntax-highlighted code viewer with comprehensive function documentation
- **Responsive Header System**: Space-efficient navigation with collapsible menu functionality

## Sustainable Finance Initiative

Quantera is committed to advancing sustainable finance through our platform:

- **Environmental Asset Support**: Specialized features for carbon credits, biodiversity credits, RECs, and more
- **Impact Measurement**: Comprehensive tracking of environmental and social impacts
- **Verification Integration**: Direct connections to leading certification standards
- **Transparent Reporting**: Customizable ESG reporting frameworks for various stakeholders
- **Yield Enhancement**: Specialized strategies for environmental asset holders
- **Cross-Chain Capabilities**: Efficient trading of environmental assets across blockchain ecosystems

For more details, see our [Sustainable Finance Initiative](docs/sustainable_finance_initiative.md) documentation.

## Timeline

Based on our progress, we are currently in Week 13 of our Implementation Plan. The next major milestones are:

1. **Weeks 13-14**: Complete frontend interfaces for liquidity pools and asset creation
2. **Weeks 14-15**: Implement cross-chain functionality and white-label solutions
3. **Weeks 15-16**: Comprehensive testing, security audits, and deployment preparation 
4. **Weeks 16-18**: Marketplace launch and partner onboarding

Previous milestones completed:
- Backend services, API layer, and type system implementation
- Frontend integration and WalletContext implementation

## Competitive Positioning

With our continued implementation of AssetFactory, LiquidityPools, YieldOptimizer, L2Bridge, WalletContext, and SmartAccountTemplates contracts, Quantera offers several advantages over competitors:

1. **Multi-Asset Support**: Unlike most platforms that focus on a single asset class, Quantera supports treasury securities, environmental assets, and more.

2. **Capital Efficiency**: The concentrated liquidity feature provides superior capital efficiency compared to traditional AMMs.

3. **Yield Optimization**: Our strategy marketplace and auto-compounding capabilities offer sophisticated yield generation.

4. **Cross-Chain Interoperability**: The L2Bridge contract with advanced UI integration enables seamless asset movement across different chains with transparent gas cost estimation.

5. **Smart Account Templates**: Programmable templates for custom investment strategies and automated management.

6. **Sustainable Finance Leadership**: Specialized features for impact investing and environmental assets.

7. **Environmental Impact Tracking**: Advanced capabilities for measuring, reporting, and verifying environmental impact.

8. **Seamless Wallet Integration**: Robust wallet connection system with support for multiple providers and persistent connections.

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

## CI/CD Setup

The project includes comprehensive CI/CD pipelines using GitHub Actions to ensure code quality and testing at each step of development.

### CI Workflows

1. **Smart Contract Testing**
   - Automated testing for all smart contracts
   - Coverage reporting for contract tests
   - Gas optimization checks
   - Contract size verification
   - Security scanning using Slither and Mythril
   - L2 integration tests with local testnet
   - Pectra EIP compatibility checks

2. **Frontend Testing**
   - TypeScript type checking
   - Linting and code style verification
   - Unit tests with Jest
   - Component testing with React Testing Library
   - End-to-end testing with Playwright
   - Accessibility testing for WCAG compliance
   - Build verification

3. **Backend Testing**
   - Rust code formatting checks with rustfmt
   - Static analysis with Clippy
   - Security vulnerability scanning with cargo-audit
   - Unit and integration tests
   - Test coverage reporting with grcov
   - Build verification
   - Database integration tests with PostgreSQL

### GitHub Workflow Files

- `.github/workflows/contract-testing.yml`: Smart contract test pipeline
- `.github/workflows/frontend-testing.yml`: Frontend test pipeline
- `.github/workflows/backend-testing.yml`: Backend test pipeline

### Pull Request Process

The repository includes a pull request template (`.github/PULL_REQUEST_TEMPLATE.md`) that:
- Requires description of changes
- Includes type of change classification
- Links to implementation plan tasks
- Provides a checklist for code quality
- Requires information about testing
- Prompts for security considerations

### Running CI Locally

To run CI checks locally before pushing:

1. Smart contract tests:
   ```
   npx hardhat test
   npx hardhat coverage
   npx hardhat size-contracts
   ```

2. Frontend tests:
   ```
   cd frontend
   npm run typecheck
   npm run lint
   npm test
   npm run build
   ```

3. Backend tests:
   ```
   cd backend
   cargo fmt --all -- --check
   cargo clippy -- -D warnings
   cargo test --all
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
- **L2Bridge Service**: Cross-chain asset transfer and management
- **Smart Account Service**: Template management and account deployment
- **Extensible Treasury Service**: TreasuryService now supports pluggable deployment and compliance logic for treasury token creation via the new `TokenDeployer` and `ComplianceChecker` interfaces. This enables easy integration of custom smart contract deployment and compliance/KYC/AML checks, with mock implementations provided for local development and testing.
- **Improved Test Coverage**: The backend includes comprehensive unit tests for treasury creation, compliance enforcement, and token deployment logic, ensuring robust and secure asset management workflows.

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

## Testing

We have implemented a comprehensive testing strategy for the Quantera Platform:

### Unit Testing
- **Frontend Components**: Jest and React Testing Library for component testing
- **React Hooks**: Specialized testing for custom hooks
- **API Integration**: Mock testing for API endpoints
- **Context Providers**: Full context testing with mock data

### End-to-End Testing
- **Playwright Framework**: Multi-browser testing (Chrome, Firefox, Safari)
- **Mobile Simulation**: Testing responsive design on various device sizes
- **User Flows**: Complete user journey testing

### Accessibility Testing
- **WCAG Compliance**: Tests against WCAG 2.1 AA standards
- **Generated Reports**: HTML reports with detailed accessibility information
- **Continuous Integration**: A11y tests integrated into CI/CD pipeline

### Running Tests
```bash
# Unit tests
npm test

# Unit tests with coverage
npm run test:coverage

# TypeScript type checking
npm run typecheck

# ESLint code quality checks
npm run lint

# End-to-end tests
npm run test:e2e

# Accessibility tests
npm run test:a11y
```

### Continuous Integration
All tests are automatically run on pull requests and merges to main branch via GitHub Actions workflows. Our CI/CD pipeline includes:

1. **Smart Contract Testing**: Security and functionality verification
2. **Frontend Testing**: Unit tests, e2e tests, and accessibility checks 
3. **Backend Testing**: API endpoint validation and integration tests

Our goal is maintaining >95% test coverage across the codebase to ensure reliability, security, and maintainability.

- **TreasuryService Extensibility**: Tests verify that the compliance checker and token deployer are invoked as expected, and that treasury creation is blocked if compliance fails. The architecture is designed for easy extension and robust testing.
