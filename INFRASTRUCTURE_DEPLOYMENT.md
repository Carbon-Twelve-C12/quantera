# Quantera Platform Infrastructure Deployment Guide

## Overview
This guide covers the complete infrastructure deployment for the Quantera platform, including frontend, backend, smart contracts, and supporting services.

## Prerequisites

### Required Tools
- Node.js 18+ and npm
- Rust 1.70+ and Cargo
- Docker and Docker Compose
- Git
- Cloudflare account with API token
- Ethereum wallet with testnet/mainnet ETH

### Environment Setup
1. Clone the repository:
```bash
git clone https://github.com/Carbon-Twelve-C12/quantera.git
cd quantera
```

2. Install dependencies:
```bash
# Frontend
cd frontend && npm install --legacy-peer-deps

# Backend
cd ../backend && cargo build --release

# Smart contracts
cd ../contracts && npm install
```

## 1. Smart Contract Deployment

### Testnet Deployment (Sepolia)
```bash
cd contracts

# Set environment variables
export PRIVATE_KEY="your-private-key"
export SEPOLIA_RPC_URL="your-infura-or-alchemy-url"
export ETHERSCAN_API_KEY="your-etherscan-api-key"

# Deploy core contracts
npx hardhat run scripts/deploy.js --network sepolia

# Verify contracts
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

### Mainnet Deployment
```bash
# Similar to testnet but use mainnet network
npx hardhat run scripts/deploy.js --network mainnet
```

### Contract Addresses (Save these!)
- QuanteraToken: 0x...
- AssetFactory: 0x...
- Marketplace: 0x...
- ComplianceEngine: 0x...
- UniversalBridge: 0x...

## 2. Backend Deployment

### Local Development
```bash
cd backend

# Run with environment variables
export DATABASE_URL="postgresql://user:pass@localhost/quantera"
export JWT_SECRET="your-secure-jwt-secret"
export RUST_LOG="info"

cargo run --release
```

### Production Deployment (Docker)
```bash
# Build Docker image
docker build -t quantera-backend .

# Run container
docker run -d \
  --name quantera-api \
  -p 8080:8080 \
  -e DATABASE_URL="postgresql://user:pass@db/quantera" \
  -e JWT_SECRET="your-secure-jwt-secret" \
  -e RUST_LOG="info" \
  quantera-backend
```

### Kubernetes Deployment
```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: quantera-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: quantera-backend
  template:
    metadata:
      labels:
        app: quantera-backend
    spec:
      containers:
      - name: api
        image: quantera-backend:latest
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: quantera-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: quantera-secrets
              key: jwt-secret
```

## 3. Frontend Deployment (Cloudflare Pages)

### Build Frontend
```bash
cd frontend

# Set environment variables
export REACT_APP_API_URL="https://api.quantera.finance"
export REACT_APP_CHAIN_ID="1" # Mainnet
export REACT_APP_CONTRACT_ADDRESSES='{"token":"0x...","marketplace":"0x..."}'

# Build production bundle
npm run build
```

### Deploy to Cloudflare Pages

#### Option 1: Wrangler CLI
```bash
# Install wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create Pages project
wrangler pages project create quantera-platform

# Deploy
wrangler pages deploy build --project-name quantera-platform
```

#### Option 2: GitHub Integration
1. Connect GitHub repo to Cloudflare Pages
2. Set build configuration:
   - Build command: `cd frontend && npm install --legacy-peer-deps && npm run build`
   - Build output directory: `frontend/build`
   - Node version: 18

### Environment Variables in Cloudflare
Set in Cloudflare Pages dashboard:
- `REACT_APP_API_URL`
- `REACT_APP_CHAIN_ID`
- `REACT_APP_CONTRACT_ADDRESSES`
- `REACT_APP_INFURA_KEY`

## 4. Database Setup (PostgreSQL)

### Local Development
```bash
# Start PostgreSQL
docker run -d \
  --name quantera-db \
  -e POSTGRES_DB=quantera \
  -e POSTGRES_USER=quantera \
  -e POSTGRES_PASSWORD=secure-password \
  -p 5432:5432 \
  postgres:15

# Run migrations
cd backend
diesel migration run
```

### Production Database (AWS RDS)
1. Create RDS PostgreSQL instance
2. Configure security groups for API access
3. Run migrations:
```bash
export DATABASE_URL="postgresql://user:pass@rds-endpoint/quantera"
diesel migration run
```

## 5. Monitoring & Observability

### Cloudflare Analytics
- Automatically enabled for Pages deployment
- Access via Cloudflare dashboard

### Backend Monitoring (Prometheus + Grafana)
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
  
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### Logging (ELK Stack)
```bash
# Deploy Elasticsearch, Logstash, Kibana
docker-compose -f docker-compose.elk.yml up -d
```

## 6. Security Checklist

### Pre-deployment
- [ ] All environment variables set securely
- [ ] JWT secrets rotated
- [ ] Database passwords strong
- [ ] SSL/TLS certificates configured
- [ ] CORS settings restrictive
- [ ] Rate limiting enabled
- [ ] Input validation comprehensive

### Smart Contracts
- [ ] Audited by security firm
- [ ] Multi-sig wallets for admin functions
- [ ] Timelock for critical operations
- [ ] Emergency pause implemented

### Infrastructure
- [ ] WAF enabled (Cloudflare)
- [ ] DDoS protection active
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan tested

## 7. CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          cd frontend && npm test
          cd ../backend && cargo test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Cloudflare
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: |
          npm install -g wrangler
          cd frontend && npm run build
          wrangler pages deploy build --project-name quantera
```

## 8. DNS & Domain Setup

### Cloudflare DNS Configuration
1. Add domain to Cloudflare
2. Configure DNS records:
   - A record: @ → Cloudflare Pages
   - CNAME: www → @
   - CNAME: api → Backend load balancer

### SSL/TLS
- Cloudflare: Automatic SSL
- Backend: Let's Encrypt via Certbot

## 9. Scaling Strategy

### Frontend (Cloudflare Pages)
- Automatic global CDN distribution
- No manual scaling needed

### Backend
- Horizontal scaling via Kubernetes
- Auto-scaling based on CPU/memory
- Database connection pooling

### Smart Contracts
- Layer 2 solutions for high throughput
- Optimistic rollups for cost reduction

## 10. Maintenance & Updates

### Rolling Updates
```bash
# Backend
kubectl set image deployment/quantera-backend api=quantera-backend:v2

# Frontend (automatic via git push)
git push origin main
```

### Database Migrations
```bash
# Always backup first
pg_dump $DATABASE_URL > backup.sql

# Run migration
diesel migration run

# Rollback if needed
diesel migration revert
```

## Support & Troubleshooting

### Common Issues
1. **Build fails on Cloudflare**
   - Check Node version (should be 18+)
   - Verify environment variables
   - Check build logs

2. **Backend connection issues**
   - Verify CORS configuration
   - Check API URL in frontend
   - Validate SSL certificates

3. **Smart contract failures**
   - Ensure sufficient gas
   - Verify contract addresses
   - Check network connectivity

### Monitoring Endpoints
- Frontend: https://quantera.finance
- API Health: https://api.quantera.finance/health
- Metrics: https://api.quantera.finance/metrics

### Contact
- Technical Issues: tech@quantera.finance
- Security: security@quantera.finance

---

This guide will be updated as the platform evolves. Always refer to the latest version in the repository.