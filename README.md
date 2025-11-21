# Quantera Platform

Institutional-grade asset tokenization infrastructure enabling fractional ownership and trading of real-world assets through blockchain technology.

[![Version](https://img.shields.io/badge/Version-2.0.0--alpha-green)]()
[![License](https://img.shields.io/badge/License-MIT-blue)]()

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/Carbon-Twelve-C12/quantera.git
cd quantera

# 2. Set up database
createdb quantera_dev
psql quantera_dev < backend/migrations/*.sql

# 3. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your DATABASE_URL

# 4. Start backend
cd backend && cargo run --bin quantera-backend

# 5. Start frontend
cd frontend && npm install && npm start
```

Visit `http://localhost:3000` and connect your MetaMask wallet.

---

## Architecture

### Services

| Service | Port | Framework | Purpose |
|---------|------|-----------|---------|
| Main Backend | 3001 | Axum | Auth, Assets, Portfolio, Trading |
| Risk Service | 8001 | Axum | Real-time risk metrics |
| Compliance Service | 8002 | Axum | KYC/AML, sanctions screening |

### Data Flow

```
Frontend (React + TypeScript)
    ↓ REST API
Main Backend (Axum)
    ↓ Database queries
PostgreSQL + Redis
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Material-UI, ethers.js |
| **Backend** | Rust (Axum), PostgreSQL, Redis, SQLx |
| **Blockchain** | Solidity 0.8.20, Hardhat, ethers-rs |
| **Infrastructure** | Docker, TimescaleDB |

---

## API Endpoints

### Authentication (Challenge-Response)
```
POST /api/v1/auth/challenge      # Generate signing challenge
POST /api/v1/auth/verify         # Verify signature, get JWT
GET  /api/v1/auth/validate       # Check token validity
POST /api/v1/auth/logout         # Revoke session
```

### Portfolio Management
```
GET  /api/v1/portfolio/:address               # Complete portfolio
GET  /api/v1/portfolio/:address/holdings      # Asset holdings
GET  /api/v1/portfolio/:address/transactions  # Transaction history
GET  /api/v1/portfolio/:address/performance   # Performance metrics
```

### Trade Finance
```
GET  /api/v1/tradefinance/assets                  # List assets
GET  /api/v1/tradefinance/assets/:id              # Asset details
POST /api/v1/tradefinance/purchase                # Purchase units
GET  /api/v1/tradefinance/positions/:address      # User positions
```

### Risk Management
```
GET /api/v2/risk/portfolio/:address   # Risk metrics (Port 8001)
GET /api/v2/risk/alerts/:address      # Risk alerts
WS  ws://localhost:8546               # Real-time updates
```

### Compliance
```
POST /api/v2/compliance/kyc/verify        # KYC verification (Port 8002)
POST /api/v2/compliance/sanctions/screen  # Sanctions screening
POST /api/v2/compliance/reports/generate  # Compliance reports
```

---

## Project Structure

```
quantera/
├── contracts/                 # Solidity smart contracts
│   ├── institutional/         # RiskEngine.sol
│   ├── compliance/            # AutomatedComplianceEngine.sol
│   ├── factories/             # AssetTemplateRegistry.sol
│   ├── tokens/                # EnhancedSecurityToken.sol
│   └── lifecycle/             # AssetLifecycleManager.sol
│
├── backend/                   # Rust backend services
│   ├── src/                   # Main backend (port 3001)
│   │   ├── api/               # API handlers
│   │   │   ├── secure_api.rs      # Auth endpoints
│   │   │   ├── portfolio_api.rs   # Portfolio endpoints
│   │   │   └── tradefinance_api.rs # Trading endpoints
│   │   └── services/          # Business logic
│   │       ├── portfolio_service.rs
│   │       └── tradefinance_service.rs
│   │
│   ├── risk_service/          # Risk management (port 8001)
│   ├── compliance_service/    # Compliance (port 8002)
│   └── migrations/            # Database schemas
│
└── frontend/                  # React application
    ├── src/
    │   ├── api/              # API clients
    │   ├── components/       # React components
    │   ├── contexts/         # State management
    │   │   ├── AuthContext.tsx
    │   │   └── PortfolioContext.tsx
    │   ├── pages/            # Page components
    │   └── types/            # TypeScript types
    └── public/
```

---

## Development

### Prerequisites

- Rust 1.75+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+ (optional)
- MetaMask browser extension

### Backend Setup

```bash
# Build all services
cd backend
cargo build --workspace

# Run main backend
cargo run --bin quantera-backend

# Run specialized services (optional)
cargo run --bin risk_service_server
cargo run --bin compliance_service_server
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### Database Migrations

```bash
# Apply in order
psql quantera_dev < backend/migrations/001_auth_schema.sql
psql quantera_dev < backend/migrations/002_portfolio_schema.sql
psql quantera_dev < backend/migrations/003_tradefinance_schema.sql
psql quantera_dev < backend/migrations/seed_test_data.sql
```

### Smart Contract Testing

```bash
cd tests/contracts
npm install
npx hardhat test
```

---

## Environment Variables

Create `backend/.env`:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/quantera_dev
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=your-secret-key-here
API_PORT=3001
ALLOWED_ORIGINS=http://localhost:3000
```

Create `frontend/.env`:

```bash
REACT_APP_API_URL=http://localhost:3001
REACT_APP_CHAIN_ID=1337
```

---

## Core Features

### Wallet Authentication
- MetaMask integration with challenge-response flow
- JWT-based session management
- Automatic signature verification (ECDSA)

### Portfolio Management
- Real-time holdings tracking
- Transaction history
- Performance metrics (Sharpe ratio, returns, volatility)
- Yield distribution tracking

### Trade Finance
- Tokenized trade finance instruments
- Fractional investment
- Automated settlement
- Risk rating (1-5 scale)

### Risk Management
- Real-time Value-at-Risk (VaR) calculation
- Portfolio risk metrics
- WebSocket updates
- Risk alerts and notifications

### Compliance
- Multi-jurisdiction KYC/AML
- Automated sanctions screening
- Tax calculation and reporting
- IPFS-based document storage

---

## Smart Contracts

**Deployed on Ethereum-compatible chains:**

- `RiskEngine.sol` - Portfolio risk limits enforcement
- `AutomatedComplianceEngine.sol` - Multi-jurisdiction compliance rules
- `AssetTemplateRegistry.sol` - Template-based asset deployment
- `EnhancedSecurityToken.sol` - ERC-1400 with dividends and governance
- `AssetLifecycleManager.sol` - Automated asset lifecycle management

---

## Database Schema

### Authentication
- `users` - Wallet-based user accounts
- `auth_challenges` - Challenge-response authentication
- `auth_sessions` - JWT session tracking

### Portfolio
- `portfolio_holdings` - User asset holdings
- `portfolio_transactions` - Transaction history
- `yield_distributions` - Dividend tracking

### Trade Finance
- `tradefinance_assets` - Available investment opportunities
- `tradefinance_positions` - User positions
- `tradefinance_transactions` - Trading history

### Risk Management
- `risk_metrics` - TimescaleDB hypertable for time-series data
- `risk_alerts` - Risk notification tracking
- `correlation_matrix` - Asset correlation data

---

## Testing

```bash
# Backend tests
cd backend
cargo test

# Frontend tests
cd frontend
npm test

# Smart contract tests
cd tests/contracts
npx hardhat test

# Integration tests
npx hardhat test integration/*.test.js
```

---

## Security

- Wallet signature verification (ECDSA)
- JWT token authentication (24-hour expiry)
- SQL injection prevention (parameterized queries)
- CORS whitelist configuration
- Role-based access control (RBAC)
- Session revocation on logout
- Encrypted sensitive data (AES-256)

---

## Performance

- Portfolio API: <500ms response time
- Risk calculation: <1s for 20-asset portfolio
- WebSocket latency: <50ms
- Database queries: Indexed for optimal performance

---

## License

MIT

---