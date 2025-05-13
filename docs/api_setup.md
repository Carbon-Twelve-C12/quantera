# Quantera Platform API Setup Guide

This guide explains how to set up the Quantera Platform API server with the correct contract addresses for various smart contracts.

## Environment Variables

The API server requires several environment variables to function properly. These can be set in a `.env` file in the root directory of the project or directly in your environment.

### Required Environment Variables

```bash
# Ethereum connection
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your-infura-key

# Contract addresses
REGISTRY_ADDRESS=0x...
L2_BRIDGE_ADDRESS=0x...
SMART_ACCOUNT_ADDRESS=0x...
ASSET_FACTORY_ADDRESS=0x...
LIQUIDITY_POOLS_ADDRESS=0x...
YIELD_OPTIMIZER_ADDRESS=0x...

# Other configuration
IPFS_URL=https://ipfs.infura.io:5001
JWT_SECRET=your-secure-jwt-secret
API_PORT=3030
```

### Description of Contract Addresses

| Variable | Description |
|----------|-------------|
| `REGISTRY_ADDRESS` | Address of the TreasuryRegistry contract that maintains the registry of all treasury tokens |
| `L2_BRIDGE_ADDRESS` | Address of the L2Bridge contract that manages cross-chain communication for orders and trades |
| `SMART_ACCOUNT_ADDRESS` | Address of the SmartAccountTemplates contract that manages account templates and deployment |
| `ASSET_FACTORY_ADDRESS` | Address of the AssetFactory contract for creating and managing asset templates |
| `LIQUIDITY_POOLS_ADDRESS` | Address of the LiquidityPools contract with concentrated liquidity positions |
| `YIELD_OPTIMIZER_ADDRESS` | Address of the YieldOptimizer contract for yield strategy management |

## Starting the Server

After setting up the environment variables, you can start the server with:

```bash
cargo run --bin server
```

The server will be available at the port specified in the `API_PORT` environment variable (default: 3030).

## Testing the Setup

You can test that the API server is running correctly by accessing the health endpoint:

```bash
curl http://localhost:3030/api/health
```

If the server is running correctly, it should return a JSON response with a status of "OK".

## API Documentation

The complete API documentation is available in the `docs/api` directory, which includes:

- Authentication endpoints
- Treasury management endpoints
- Trading endpoints
- L2 bridge endpoints for cross-chain functionality
- Smart account endpoints for template and account management
- Asset factory endpoints for multi-asset support
- Liquidity pools endpoints for liquidity management
- Yield optimizer endpoints for yield strategy management

## OpenAPI Documentation

The backend API is documented using the OpenAPI (Swagger) specification. The spec file is located at `docs/openapi.yaml` and covers all treasury, compliance, and asset management endpoints, including request/response schemas and error cases. This spec is used to generate the frontend TypeScript API client for seamless integration.

### Updating the API Spec
- Edit `docs/openapi.yaml` to add or update endpoint documentation.
- Ensure all new endpoints, request/response types, and error cases are described.

### Generating the TypeScript Client
- Use `openapi-generator` or `swagger-codegen` to generate the client:
  ```
  openapi-generator-cli generate -i docs/openapi.yaml -g typescript-axios -o frontend/src/api/generated
  ```
- Import and use the generated client in your React components and hooks.

### Best Practices
- Keep the OpenAPI spec up to date with backend changes.
- Use the spec to drive both backend and frontend development for type safety and consistency.

## Troubleshooting

### Invalid Contract Address Format

If you see an error like "Invalid X address format", ensure that the address is a valid Ethereum address with the correct checksum format.

### Connection to Ethereum Node Failed

If the server cannot connect to the Ethereum node, check that your `ETHEREUM_RPC_URL` is correct and that your network connection is working.

### Contract Interaction Errors

If you see errors related to contract interactions, ensure that the contract addresses are correct and that the contracts are deployed on the network you're connecting to. 