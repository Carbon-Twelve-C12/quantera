# Quantera Platform - Asset Tokenization Ecosystem

[![Website](https://img.shields.io/badge/Website-Quantera.finance-blue)](https://quantera.finance/)
[![Contributors](https://img.shields.io/github/contributors/mjohnson518/vault)](https://github.com/mjohnson518/vault/graphs/contributors)
[![Version](https://img.shields.io/badge/Version-1.0.0-green)]()

## Version: 1.0.0

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
- **Trade Finance Capabilities**: Support for letters of credit, invoice receivables, warehouse receipts, and other trade finance instruments with fractional ownership
- **Custom Asset Creation**: Flexible framework for creating any tokenized asset type with customizable fields

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
  - Gas optimized message handling with intelligent blob data compression
  - Batch message processing for efficient cross-chain operations
  - SmartAccountTemplates contract with template management and account deployment
  - Comprehensive integration tests for AssetFactory and LiquidityPools interactions
  - Contract security audit preparation documentation
  - Contract optimization plan with detailed implementation schedule
  - Standardized security patterns across all core contracts:
    - Custom errors for gas-efficient error handling
    - Enhanced role-based access control
    - Improved checks-effects-interactions pattern implementation
    - Robust input validation with specific error types
    - Consistent delegation security in SmartAccountTemplates
    - Enhanced yield harvesting security in YieldOptimizer
  - Comprehensive security guidelines documentation for standardizing secure coding practices

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
  - Enhanced WalletConnect system with WalletKit integration and robust fallback mechanism
  - Smart abstraction layer for wallet connectivity providing consistent API regardless of implementation
  - Persistent wallet session management with secure local storage mechanism
  - Graceful error handling for wallet connections and network switching
  - Wallet connection and network switching functionality with detailed transaction event tracking
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
  - Full support for custom asset types with customizable fields
  - Enhanced asset image handling with dedicated storage paths for different asset categories
  - Trade Finance marketplace with support for tokenized trade finance instruments
  - Detailed analytics dashboard for trade finance metrics, risk distribution, and geographic exposure
  - Fractional investment interface for trade finance assets with real-time settlement
  - Multi-asset type filtering for trade finance instruments
  - Comprehensive risk visualization and yield analytics for trade finance
  - Advanced TradeFinanceTradingInterface with support for market, limit, and stop orders
  - Real-time price tracking with visual indicators in trading interface
  - Custom settlement currency selection for trade finance transactions
  - Comprehensive trade order history tracking and management
  - Detailed TradeFinanceAssetDetails component with investment interface and transaction timeline
  - Custom Timeline components for transaction visualization
  - Grid wrapper component for MUI v7 TypeScript compatibility
  - Portfolio management dashboard with comprehensive asset overview
  - Integrated Trade Finance assets into portfolio tracking and analytics 
  - Dedicated Trade Finance portfolio tab with detailed analytics
  - Interactive visualization for trade finance asset types and maturity distribution
  - Geographic exposure analysis for trade finance investments
  - Consolidated view of all asset classes in unified portfolio dashboard
  - Advanced ESG scoring visualization with interactive drill-down capabilities
  - Comprehensive SDG contribution tracking with visualization
  - Environmental impact metrics dashboard with real-world equivalency displays
  - Custom date utilities for consistent date handling across visualizations
  - Multi-dimensional radar charts for ESG metrics comparison
  - Interactive trend analysis with micro-charts embedded in metric cards
  - Real-time equivalency calculations for environmental impact metrics

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

### Recently Completed
- **Advanced Liquidity Solutions**: Comprehensive liquidity optimization and dynamic fee structures
- **Week 11 Implementation**: LiquidityPoolOptimizer.sol, DynamicFeeStructure.sol, and LiquidityAnalyticsService
- **Professional Frontend Dashboard**: LiquidityManagementDashboard with institutional-grade interface
- **Multi-Strategy Optimization**: Conservative (6% APY), Balanced (9% APY), Aggressive (12% APY) targets
- **Dynamic Fee Models**: 5 different fee calculation models with market condition adjustments
- **Real-Time Analytics**: Volatility, price impact, and liquidity depth analysis
- **Automated Rebalancing**: 5 trigger types with configurable parameters
- **Security Enhancement**: Implemented consistent security patterns across all core contracts
- **Gas Optimization**: Enhanced L2Bridge contract with optimized message encoding and blob data handling
- **Integration Testing**: Created comprehensive tests for contract interactions and asset lifecycles
- **Unit Testing**: Implemented extensive unit tests for YieldOptimizer, SmartAccountTemplates, and L2Bridge contracts
- **Test Coverage**: Set up test coverage reporting and created unified test framework
- **Security Documentation**: Developed detailed security guidelines and standards for all contracts
- **ESG Impact Dashboard**: Comprehensive visualization of environmental and social impacts
- **Portfolio Management**: Complete dashboard with cross-asset visualization and analytics
- **Trade Finance Components**: Advanced trading interface with real-time price tracking

### Next Steps
- **Week 12**: Enhanced Frontend Components and Mobile Optimization
- **Phase 3**: Security audits and testnet deployment preparation
- **Mainnet Deployment**: Full platform launch with institutional services
- **Partnership Development**: Institutional client onboarding and market maker partnerships

The platform has successfully reached **v1.0.0** with comprehensive advanced liquidity solutions and is ready for institutional deployment.

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

### Trade Finance
- `GET /tradefinance/assets`: List all trade finance assets with filtering options
- `GET /tradefinance/assets/{id}`: Get specific trade finance asset details
- `GET /tradefinance/assets/type/{type}`: Filter assets by trade finance type
- `POST /tradefinance/assets/{id}/invest`: Invest in a trade finance asset
- `GET /tradefinance/analytics`: Get trade finance market analytics
- `GET /tradefinance/positions/{address}`: Get user's trade finance positions
- `GET /tradefinance/verification/{entityId}`: Get trade entity verification status
- `POST /tradefinance/assets/create`: Create new trade finance asset (issuer only)

## Testing

### Smart Contract Tests
The platform includes comprehensive test coverage for all smart contracts:

1. **Unit Tests**: Located in `tests/contracts/unit/`, these tests focus on individual contract functionality:
   - **YieldOptimizer.test.js**: Tests for security features, role-based access control, custom errors, and the checks-effects-interactions pattern
   - **SmartAccountTemplates.test.js**: Tests for delegation security, template management, and account deployment
   - **L2Bridge.test.js**: Tests for message security, input validation, and cross-chain functionality

2. **Integration Tests**: Located in `tests/contracts/integration/`, these tests validate interactions between contracts:
   - **AssetFactoryLiquidityIntegrationTest.js**: Tests the asset creation and liquidity pool interactions
   - **L2BridgeGasOptimizerTest.js**: Tests the gas optimization for L2 bridging
   - **L2BridgeAndSmartAccountsTest.js**: Tests the interaction between L2Bridge and SmartAccountTemplates

3. **Test Coverage**: The platform uses solidity-coverage to generate detailed coverage reports, targeting:
   - **Statement Coverage**: 95%+
   - **Branch Coverage**: 90%+
   - **Function Coverage**: 100%
   - **Line Coverage**: 95%+

To run the tests:
```bash
cd tests/contracts
npm install
npx hardhat test               # Run all tests
npx hardhat test unit/*.test.js   # Run only unit tests
./test-coverage.sh             # Generate coverage report
```

## Frontend Features

### Core Pages
- **Home**: Platform overview showcasing multi-asset support
- **Marketplace**: Browse, filter, and search available assets
- **Portfolio**: View holdings, yield information, and performance
- **Asset Factory**: Create and customize new asset tokens with support for all asset classes
- **Liquidity**: Manage liquidity positions across assets
- **Yield Strategy Marketplace**: Browse, filter, and apply yield strategies with environmental impact calculation
- **Smart Accounts**: Configure automated investment strategies
- **Environmental Impact**: View and track sustainability metrics
- **Impact Dashboard**: Visualize environmental impact of investments
- **Contract Explorer**: Browse and understand platform smart contracts with source code, functions, security info, and documentation
- **Trade Finance Marketplace**: Browse and invest in tokenized trade finance instruments
- **Trade Finance Analytics**: View detailed metrics and risk analysis for trade finance market
- **Trade Finance Portfolio**: Track investments in trade finance instruments

### Advanced Components
- **Asset Template Explorer**: Browse templates for different asset classes
- **Asset Creation Wizard**: Multi-step interface for creating new assets of any type
- **Custom Asset Support**: Flexible framework for creating any tokenized asset with customizable fields
- **Enhanced Asset Imagery**: Accurate visual representation with dedicated storage paths for different asset types
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

Based on our progress, we are currently in Week 17 of our Implementation Plan. The next major milestones are:

1. **Week 17**: Security audits and finalization of contract optimizations
2. **Week 18**: Testnet deployment and cross-chain validation
3. **Week 19**: Mainnet deployment and marketplace launch

Previous milestones completed:
- Backend services, API layer, and type system implementation
- Frontend integration and WalletContext implementation with comprehensive WalletConnect support
- Asset Creation wizard with support for all asset types
- Trade Finance components including advanced trading interface and detailed asset analysis
- Portfolio management dashboard with integrated cross-asset tracking and analytics
- ESG scoring and impact visualization dashboards with interactive analytics
- Advanced environmental impact measurement with real-world equivalency displays
- Gas-optimized L2Bridge implementation with batch messaging and blob data compression
- Comprehensive integration tests for AssetFactory and LiquidityPools interactions
- Security audit preparation documentation and contract optimization plan

## Competitive Positioning

With our complete implementation of AssetFactory, LiquidityPools, YieldOptimizer, L2Bridge (with gas-optimized messaging), WalletContext, and SmartAccountTemplates contracts, along with comprehensive integration testing and security preparation, Quantera offers several advantages over competitors:

1. **Multi-Asset Support**: Unlike most platforms that focus on a single asset class, Quantera supports treasury securities, environmental assets, and more.

2. **Capital Efficiency**: The concentrated liquidity feature provides superior capital efficiency compared to traditional AMMs.

3. **Yield Optimization**: Our strategy marketplace and auto-compounding capabilities offer sophisticated yield generation.

4. **Cross-Chain Interoperability**: The gas-optimized L2Bridge contract with advanced UI integration enables seamless asset movement across different chains with batch processing and intelligent blob data compression for reduced transaction costs.

5. **Smart Account Templates**: Programmable templates for custom investment strategies and automated management.

6. **Sustainable Finance Leadership**: Specialized features for impact investing and environmental assets.

7. **Environmental Impact Tracking**: Advanced capabilities for measuring, reporting, and verifying environmental impact.

8. **Seamless Wallet Integration**: Robust wallet connection system with support for multiple providers, persistent connections, and graceful fallback mechanisms for a consistent user experience.

9. **Complete Asset Creation**: Full-featured asset creation wizard supporting all asset classes with customizable fields.

10. **Advanced Trade Finance Capabilities**: Comprehensive trading interfaces supporting market, limit and stop orders with real-time price tracking and detailed asset analysis for trade finance instruments.

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