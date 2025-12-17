<p align="center">
  <img src="https://img.shields.io/badge/Quantera-Asset%20Tokenization-10B981?style=for-the-badge&labelColor=09090B" alt="Quantera" />
</p>

<h1 align="center">Quantera</h1>

<p align="center">
  <strong>Institutional-Grade Asset Tokenization Infrastructure</strong>
</p>

<p align="center">
  Enabling fractional ownership, instant settlement, and 24/7 liquidity for real-world assets.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#documentation">Documentation</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-2.0.0--alpha-10B981?style=flat-square&labelColor=18181B" alt="Version" />
  <img src="https://img.shields.io/badge/license-Apache--2.0-3B82F6?style=flat-square&labelColor=18181B" alt="License" />
  <img src="https://img.shields.io/badge/rust-1.75+-EF4444?style=flat-square&labelColor=18181B" alt="Rust" />
  <img src="https://img.shields.io/badge/node-18+-22C55E?style=flat-square&labelColor=18181B" alt="Node" />
</p>

---

## Features

**Tokenization Engine**
- ERC-1400 compliant security tokens with transfer restrictions
- Template-based asset deployment for rapid onboarding
- Automated lifecycle management (issuance, dividends, redemption)

**Portfolio Management**
- Real-time holdings tracking and performance analytics
- Transaction history with complete audit trail
- Yield distribution and dividend tracking

**Trade Finance**
- Tokenized trade finance instruments (letters of credit, receivables)
- Fractional investment with automated settlement
- Risk-rated opportunities with transparent scoring

**Risk & Compliance**
- Real-time Value-at-Risk (VaR) calculation
- Multi-jurisdiction KYC/AML compliance
- Automated sanctions screening
- IPFS-based document verification

**Security**
- Wallet-based authentication (ECDSA signature verification)
- JWT session management with automatic expiry
- Role-based access control (RBAC)
- SQL injection prevention with parameterized queries

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
│              React 18 • TypeScript • Material-UI                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway (Port 3001)                     │
│                    Rust • Axum • SQLx                           │
├─────────────────────────────────────────────────────────────────┤
│  Auth  │  Portfolio  │  Trade Finance  │  Assets  │  Trading   │
└─────────────────────────────────────────────────────────────────┘
              │                    │                    │
              ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Risk Service    │  │ Compliance Svc   │  │   PostgreSQL     │
│   Port 8001      │  │    Port 8002     │  │     + Redis      │
└──────────────────┘  └──────────────────┘  └──────────────────┘
              │                    │
              ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Smart Contracts                             │
│           Solidity 0.8.20 • Hardhat • Ethereum/L2               │
└─────────────────────────────────────────────────────────────────┘
```

### Services

| Service | Port | Purpose |
|---------|------|---------|
| Main Backend | 3001 | Authentication, assets, portfolio, trading |
| Risk Service | 8001 | Real-time risk metrics, VaR calculation |
| Compliance Service | 8002 | KYC/AML, sanctions screening |

### Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React 18, TypeScript, Material-UI, ethers.js |
| Backend | Rust, Axum, PostgreSQL, Redis, SQLx |
| Blockchain | Solidity 0.8.20, Hardhat, ethers-rs |
| Infrastructure | Docker, TimescaleDB |

---

## Quick Start

### Prerequisites

- Rust 1.75+
- Node.js 18+
- PostgreSQL 15+
- MetaMask browser extension

### Installation

```bash
# Clone repository
git clone https://github.com/Carbon-Twelve-C12/quantera.git
cd quantera

# Set up database
createdb quantera_dev
psql quantera_dev < backend/migrations/001_auth_schema.sql
psql quantera_dev < backend/migrations/002_portfolio_schema.sql
psql quantera_dev < backend/migrations/003_tradefinance_schema.sql

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your DATABASE_URL

# Start backend
cd backend && cargo run --bin quantera-backend

# Start frontend (new terminal)
cd frontend && npm install && npm start
```

Visit `http://localhost:3000` and connect your MetaMask wallet.

### Environment Variables

**Backend** (`backend/.env`)
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/quantera_dev
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=your-secret-key-here
API_PORT=3001
ALLOWED_ORIGINS=http://localhost:3000
```

**Frontend** (`frontend/.env`)
```bash
REACT_APP_API_URL=http://localhost:3001
REACT_APP_CHAIN_ID=1337
```

---

## API Reference

### Authentication

Challenge-response authentication using wallet signatures.

```
POST /api/v1/auth/challenge      Generate signing challenge
POST /api/v1/auth/verify         Verify signature, receive JWT
GET  /api/v1/auth/validate       Validate token
POST /api/v1/auth/logout         Revoke session
```

### Portfolio

```
GET /api/v1/portfolio/:address                Portfolio overview
GET /api/v1/portfolio/:address/holdings       Asset holdings
GET /api/v1/portfolio/:address/transactions   Transaction history
GET /api/v1/portfolio/:address/performance    Performance metrics
```

### Trade Finance

```
GET  /api/v1/tradefinance/assets              List available assets
GET  /api/v1/tradefinance/assets/:id          Asset details
POST /api/v1/tradefinance/purchase            Purchase units
GET  /api/v1/tradefinance/positions/:address  User positions
```

### Risk Management (Port 8001)

```
GET /api/v2/risk/portfolio/:address   Portfolio risk metrics
GET /api/v2/risk/alerts/:address      Risk alerts
WS  ws://localhost:8546               Real-time updates
```

### Compliance (Port 8002)

```
POST /api/v2/compliance/kyc/verify        KYC verification
POST /api/v2/compliance/sanctions/screen  Sanctions screening
POST /api/v2/compliance/reports/generate  Generate reports
```

---

## Smart Contracts

| Contract | Purpose |
|----------|---------|
| `EnhancedSecurityToken.sol` | ERC-1400 security token with dividends and governance |
| `RiskEngine.sol` | Portfolio risk limits enforcement |
| `AutomatedComplianceEngine.sol` | Multi-jurisdiction compliance rules |
| `AssetTemplateRegistry.sol` | Template-based asset deployment |
| `AssetLifecycleManager.sol` | Automated lifecycle management |

### Testing

```bash
cd tests/contracts
npm install
npx hardhat test
```

---

## Project Structure

```
quantera/
├── contracts/                 # Solidity smart contracts
│   ├── tokens/                # Security token implementations
│   ├── institutional/         # Risk management
│   ├── compliance/            # Compliance engine
│   ├── factories/             # Asset templates
│   └── lifecycle/             # Lifecycle management
│
├── backend/                   # Rust backend services
│   ├── src/                   # Main backend (port 3001)
│   │   ├── api/               # REST endpoints
│   │   └── services/          # Business logic
│   ├── risk_service/          # Risk service (port 8001)
│   ├── compliance_service/    # Compliance service (port 8002)
│   └── migrations/            # Database schemas
│
└── frontend/                  # React application
    ├── src/
    │   ├── api/               # API clients
    │   ├── components/        # React components
    │   ├── contexts/          # State management
    │   ├── pages/             # Page components
    │   └── styles/            # Design system
    └── public/
```

---

## Development

### Backend

```bash
cd backend
cargo build --workspace
cargo run --bin quantera-backend

# Run specialized services
cargo run --bin risk_service_server
cargo run --bin compliance_service_server

# Run tests
cargo test
```

### Frontend

```bash
cd frontend
npm install
npm start

# Run tests
npm test

# Build for production
npm run build
```

### Smart Contracts

```bash
cd tests/contracts
npm install
npx hardhat compile
npx hardhat test
```

---

## Security

- **Authentication**: ECDSA wallet signature verification
- **Sessions**: JWT tokens with 24-hour expiry
- **Data**: SQL injection prevention, parameterized queries
- **Network**: CORS whitelist, HTTPS in production
- **Access**: Role-based access control (RBAC)
- **Encryption**: AES-256 for sensitive data

---

## Performance

| Metric | Target |
|--------|--------|
| Portfolio API | < 500ms |
| Risk Calculation | < 1s (20 assets) |
| WebSocket Latency | < 50ms |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <sub>Built with precision by the Quantera team</sub>
</p>
