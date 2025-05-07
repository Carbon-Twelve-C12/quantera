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
- Responsive UI with light/dark theme support
- Seamless wallet connectivity integration

## Project Structure
```
Quantera/
├── contracts/             # Smart contracts
│   ├── accounts/          # Smart account templates
│   ├── l2/                # Layer 2 bridge contracts
│   └── institutional/     # Institutional validator contracts
├── backend/               # Rust backend services
│   ├── ethereum_client/   # Ethereum blockchain client
│   └── treasury_service/  # Treasury management services and API
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
```

## Development Status
### Completed
- **Smart Contracts**: All core contracts including TreasuryRegistry, TreasuryToken, ComplianceModule, TradingModule, L2Bridge, and SmartAccountTemplates
- **Backend Services**: 
  - Ethereum client with Pectra support
  - Contract client implementations (TreasuryRegistryClient, TreasuryTokenClient, ComplianceClient, TradingClient, L2Client)
  - Service layer components (YieldSchedulerService, UserService, AuthenticationService)
  - RESTful API layer with Warp including authentication, treasury management, user management, and trading endpoints
- **Frontend Components**: 
  - Core page components (HomePage, MarketplacePage, PortfolioPage)
  - Common components (Header, Footer, ImageWithFallback)
  - Theme system with light/dark mode support
  - Responsive design for all screen sizes
  - Marketplace with filtering and sorting functionality

### In Progress
- Wallet connectivity integration
- API integration with backend services
- Implementing comprehensive test suites

### Key Implementations
- Blockchain Client: Ethereum client with EIP-7702, EIP-7691, and EIP-2537 support
- YieldSchedulerService: Automated yield distribution and maturity processing for tokenized treasuries
- UserService: User management, verification, and portfolio tracking
- AuthenticationService: JWT-based authentication with wallet signatures
- RESTful API: Comprehensive API endpoints for all platform features
- L2 Integration: Efficient cross-layer trading with blob data optimization
- UI/UX: Responsive design with theme support and accessibility considerations

## API Endpoints
The platform exposes the following API endpoints:

### Authentication
- `POST /auth/challenge`: Generate authentication challenge for wallet signature
- `POST /auth/login`: Login with wallet signature
- `POST /auth/logout`: Logout and invalidate token

### Treasury Management
- `GET /treasuries`: List all treasury tokens with filtering options
- `GET /treasuries/{id}`: Get specific treasury details
- `POST /treasuries`: Create new treasury token (restricted)
- `GET /treasuries/{id}/yield`: Get yield information for a treasury

### User Management
- `POST /users/register`: Register a new user
- `POST /users/verify`: Submit verification information
- `POST /users/institutional/register`: Register an institutional user
- `GET /users/{address}/portfolio`: Get user portfolio with analytics
- `POST /users/smart-account/setup`: Configure smart account for automated strategies

### Trading
- `POST /trading/orders`: Place buy/sell orders for treasury tokens
- `GET /trading/orders`: List orders with filtering options
- `GET /trading/orders/{id}`: Get order details
- `POST /trading/orders/cancel`: Cancel an existing order

## Frontend Features

### Core Pages
- **Home**: Landing page with platform overview and key features
- **Marketplace**: Browse, filter, and search available treasury tokens
- **Portfolio**: View holdings, yield information, and historical performance
- **404**: Custom not found page with proper navigation

### Common Components
- **Header**: Navigation bar with theme toggle and wallet connectivity
- **Footer**: Platform information and social links
- **ImageWithFallback**: Enhanced image component with error handling

### Theme System
- **Light/Dark Mode**: Complete theme support across all components
- **Toggle Control**: Intuitive toggle with sun/moon icons
- **Theme Persistence**: User preference saved in localStorage
- **Smooth Transitions**: Animated transitions between themes

### Responsive Design
- **Mobile-First**: Optimized for all screen sizes from mobile to desktop
- **Flexible Layouts**: Adaptive grid systems and component sizing
- **Proper Spacing**: Consistent spacing and typography across devices
- **Touch-Friendly**: Appropriately sized interactive elements for touch

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
