# Quantera Platform API Reference

## Overview

This document provides detailed reference for the Quantera Platform's API endpoints and WebSocket subscription topics. This information is intended for developers integrating with the platform.

## Table of Contents

1. [Authentication](#authentication)
2. [L2Bridge API](#l2bridge-api)
3. [WebSocket Subscriptions](#websocket-subscriptions)
4. [Smart Account API](#smart-account-api)
5. [Error Handling](#error-handling)

## Authentication

All API requests require authentication using JWT tokens obtained through the authentication flow:

1. `POST /auth/challenge`: Generate authentication challenge for wallet signature
2. `POST /auth/login`: Login with wallet signature
3. `POST /auth/logout`: Logout and invalidate token

Include the JWT token in the Authorization header for all requests:

```
Authorization: Bearer <token>
```

## L2Bridge API

The L2Bridge API enables cross-chain asset transfers between Ethereum and various Layer 2 networks.

### Endpoints

#### Get Supported Chains

```
GET /api/l2/chains
```

Returns information about supported blockchain networks.

**Response:**
```json
{
  "chains": [
    {
      "chainId": 1,
      "name": "Ethereum",
      "rpcUrl": "https://mainnet.infura.io/v3/...",
      "explorerUrl": "https://etherscan.io",
      "nativeCurrency": {
        "name": "Ethereum",
        "symbol": "ETH",
        "decimals": 18
      },
      "blob_enabled": true
    },
    {
      "chainId": 10,
      "name": "Optimism",
      "rpcUrl": "https://mainnet.optimism.io",
      "explorerUrl": "https://optimistic.etherscan.io",
      "nativeCurrency": {
        "name": "Ethereum",
        "symbol": "ETH",
        "decimals": 18
      },
      "blob_enabled": true
    }
    // Additional chains...
  ]
}
```

#### Estimate Gas

```
POST /api/l2/estimate-gas
```

Estimates gas costs for bridging assets between chains.

**Request:**
```json
{
  "fromChainId": 1,
  "toChainId": 10,
  "dataSize": 1000,
  "useBlob": true
}
```

**Response:**
```json
{
  "gasAmount": "150000",
  "gasCost": "0.003",
  "gasPrice": "20000000000",
  "estimatedTimeSeconds": 180,
  "estimatedUsdCost": 5.75,
  "useBlob": true,
  "blobGasLimit": "120000",
  "callDataGasLimit": "200000"
}
```

#### Bridge Order

```
POST /api/l2/bridge
```

Initiates a bridge transaction to transfer assets between chains.

**Request:**
```json
{
  "fromChainId": 1,
  "toChainId": 10,
  "recipient": "0x...",
  "amount": "1000000000000000000",
  "tokenAddress": "0x...", // Optional, omit for native ETH
  "treasuryId": "treasury-123" // Optional, for treasury tokens
}
```

**Response:**
```json
{
  "orderId": "order-123",
  "messageId": "msg-456",
  "txHash": "0x...",
  "status": "PENDING"
}
```

#### Get Message Status

```
GET /api/l2/message/:messageId
```

Returns the status of a bridge message.

**Response:**
```json
{
  "messageId": "msg-456",
  "status": "PROCESSING",
  "fromChainId": 1,
  "toChainId": 10,
  "timestamp": 1651234567,
  "txHash": "0x...",
  "destinationChainId": 10
}
```

#### Get User Orders

```
GET /api/l2/user/:address
```

Returns bridge orders associated with a user address.

**Response:**
```json
{
  "orders": [
    {
      "orderId": "order-123",
      "fromChainId": 1,
      "toChainId": 10,
      "amount": "1000000000000000000",
      "tokenAddress": "0x...",
      "recipient": "0x...",
      "timestamp": 1651234567,
      "status": "CONFIRMED",
      "txHash": "0x...",
      "messageId": "msg-456",
      "treasuryId": "treasury-123"
    }
    // Additional orders...
  ]
}
```

#### Get Transactions

```
GET /api/l2/transactions/:address
```

Returns bridge transactions for a user address.

**Response:**
```json
{
  "transactions": [
    {
      "id": "tx-123",
      "type": "bridge",
      "status": "confirmed",
      "timestamp": 1651234567,
      "chainId": 1,
      "amount": "1000000000000000000",
      "tokenAddress": "0x...",
      "messageId": "msg-456"
    }
    // Additional transactions...
  ]
}
```

## WebSocket Subscriptions

The Quantera Platform provides real-time updates through WebSocket connections. This section covers available subscription topics and message formats.

### Connection Setup

Connect to the WebSocket server:

```
wss://api.quantera.io/ws
```

After connecting, authenticate by sending a message:

```json
{
  "type": "authenticate",
  "token": "your-jwt-token"
}
```

### L2Bridge Subscription Topics

#### L2 Messages

Subscribe to all L2 bridge messages for the authenticated user:

```json
{
  "action": "subscribe",
  "topic": "l2_messages"
}
```

Message format:

```json
{
  "type": "L2NewMessage",
  "payload": {
    "messageId": "msg-456",
    "fromChainId": 1,
    "toChainId": 10,
    "sender": "0x...",
    "recipient": "0x...",
    "amount": "1000000000000000000",
    "data": "0x...",
    "timestamp": 1651234567,
    "status": "PENDING",
    "txHash": "0x..."
  }
}
```

#### L2 Chain Updates

Subscribe to gas price updates for a specific chain:

```json
{
  "action": "subscribe",
  "topic": "l2_chain",
  "params": {
    "chainId": 1
  }
}
```

Message format:

```json
{
  "type": "L2GasPriceUpdate",
  "payload": {
    "chainId": 1,
    "gasPrice": "20000000000"
  }
}
```

#### L2 Message Status

Subscribe to status updates for a specific message:

```json
{
  "action": "subscribe",
  "topic": "l2_message",
  "params": {
    "messageId": "msg-456"
  }
}
```

Message format:

```json
{
  "type": "L2MessageStatusUpdate",
  "payload": {
    "messageId": "msg-456",
    "status": "CONFIRMED",
    "fromChainId": 1,
    "toChainId": 10,
    "timestamp": 1651234567,
    "txHash": "0x...",
    "destinationChainId": 10
  }
}
```

### Smart Account Subscription Topics

#### Smart Account Operations

Subscribe to operation updates for a smart account:

```json
{
  "action": "subscribe",
  "topic": "smart_account_operations",
  "params": {
    "address": "0x..."
  }
}
```

Message format:

```json
{
  "type": "SmartAccountOperation",
  "payload": {
    "operationId": "op-123",
    "accountAddress": "0x...",
    "operationType": "transfer",
    "executor": "0x...",
    "status": "completed",
    "timestamp": 1651234567,
    "txHash": "0x...",
    "gasUsed": "50000"
  }
}
```

#### Smart Account Delegates

Subscribe to delegate changes for a smart account:

```json
{
  "action": "subscribe",
  "topic": "smart_account_delegates",
  "params": {
    "address": "0x..."
  }
}
```

Message format:

```json
{
  "type": "SmartAccountDelegateUpdate",
  "payload": {
    "accountAddress": "0x...",
    "delegateAddress": "0x...",
    "action": "added", // or "removed"
    "permissions": ["transfer", "swap"],
    "timestamp": 1651234567,
    "txHash": "0x..."
  }
}
```

### Unsubscribing

To unsubscribe from a topic:

```json
{
  "action": "unsubscribe",
  "topic": "l2_messages"
}
```

## Smart Account API

Comprehensive documentation for the Smart Account API can be found in the [Smart Account API Reference](./api/smart-account-api.md).

## Error Handling

All API endpoints return standard HTTP status codes. In case of an error, the response body will contain additional information:

```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Invalid chainId parameter",
    "details": {
      "parameter": "chainId",
      "reason": "Must be a supported chain ID"
    }
  }
}
```

Common error codes:

- `UNAUTHORIZED`: Authentication is required or has failed
- `INVALID_PARAMETER`: A request parameter is invalid
- `RESOURCE_NOT_FOUND`: The requested resource does not exist
- `BRIDGE_ERROR`: Error occurred during bridge operation
- `CHAIN_ERROR`: Error communicating with blockchain
- `INTERNAL_ERROR`: Unexpected server error

For WebSocket errors, an error message will be sent:

```json
{
  "type": "error",
  "error": {
    "code": "SUBSCRIPTION_FAILED",
    "message": "Failed to subscribe to topic"
  }
}
``` 