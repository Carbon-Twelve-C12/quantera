# L2Bridge API Reference

## Overview

The L2Bridge API provides functionality for cross-chain asset transfers between Ethereum mainnet and various Layer 2 networks. This document details the endpoints, parameters, and responses for interacting with the L2Bridge service.

## Base URL

```
https://api.quantera.io
```

## Authentication

All API requests require authentication using JWT tokens obtained through the authentication flow. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Get Supported Chains

Retrieves information about supported blockchain networks for L2 bridging.

```
GET /api/l2/chains
```

#### Response

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
    // Additional chains...
  ]
}
```

#### Response Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| chainId | number | The numeric identifier for the blockchain network |
| name | string | Human-readable name of the network |
| rpcUrl | string | JSON-RPC URL for the network |
| explorerUrl | string | Block explorer URL for the network |
| nativeCurrency | object | Information about the network's native currency |
| blob_enabled | boolean | Whether the network supports EIP-7691 blob data |

### Estimate Gas

Estimates gas costs for bridging assets between chains, with optional blob data support.

```
POST /api/l2/estimate-gas
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| fromChainId | number | Yes | Source chain ID |
| toChainId | number | Yes | Destination chain ID |
| dataSize | number | Yes | Size of data to bridge in bytes |
| useBlob | boolean | No | Whether to use blob data if supported (default: auto-detected) |

#### Example Request

```json
{
  "fromChainId": 1,
  "toChainId": 10,
  "dataSize": 1000,
  "useBlob": true
}
```

#### Response

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

#### Response Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| gasAmount | string | Estimated gas units required |
| gasCost | string | Estimated gas cost in ETH |
| gasPrice | string | Current gas price in wei |
| estimatedTimeSeconds | number | Estimated time to complete in seconds |
| estimatedUsdCost | number | Estimated cost in USD |
| useBlob | boolean | Whether blob data will be used |
| blobGasLimit | string | Gas limit for blob data |
| callDataGasLimit | string | Gas limit for calldata |

### Bridge Order

Initiates a bridge transaction to transfer assets between chains.

```
POST /api/l2/bridge
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| fromChainId | number | Yes | Source chain ID |
| toChainId | number | Yes | Destination chain ID |
| recipient | string | Yes | Recipient address on destination chain |
| amount | string | Yes | Amount to bridge (in smallest unit) |
| tokenAddress | string | No | Token address (omit for native ETH) |
| treasuryId | string | No | Treasury ID for treasury tokens |

#### Example Request

```json
{
  "fromChainId": 1,
  "toChainId": 10,
  "recipient": "0x123...",
  "amount": "1000000000000000000",
  "tokenAddress": "0x456...",
  "treasuryId": "treasury-123"
}
```

#### Response

```json
{
  "orderId": "order-123",
  "messageId": "msg-456",
  "txHash": "0x789...",
  "status": "PENDING"
}
```

#### Response Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| orderId | string | Unique ID for the bridge order |
| messageId | string | ID for tracking the bridge message |
| txHash | string | Transaction hash on the source chain |
| status | string | Initial status of the bridge transaction |

### Get Message Status

Returns the status of a bridge message.

```
GET /api/l2/message/:messageId
```

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| messageId | string | Yes | ID of the bridge message |

#### Response

```json
{
  "messageId": "msg-456",
  "status": "PROCESSING",
  "fromChainId": 1,
  "toChainId": 10,
  "timestamp": 1651234567,
  "txHash": "0x789...",
  "destinationChainId": 10,
  "failureReason": null
}
```

#### Response Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| messageId | string | ID of the bridge message |
| status | string | Current status (PENDING, PROCESSING, CONFIRMED, FAILED) |
| fromChainId | number | Source chain ID |
| toChainId | number | Destination chain ID |
| timestamp | number | Unix timestamp of message creation |
| txHash | string | Transaction hash on source chain |
| destinationChainId | number | Destination chain ID |
| failureReason | string | Reason for failure (if status is FAILED) |

### Get User Orders

Returns bridge orders associated with a user address.

```
GET /api/l2/user/:address
```

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| address | string | Yes | User wallet address |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Maximum number of orders to return (default: 10) |
| offset | number | No | Offset for pagination (default: 0) |
| status | string | No | Filter by status (PENDING, PROCESSING, CONFIRMED, FAILED) |

#### Response

```json
{
  "orders": [
    {
      "orderId": "order-123",
      "fromChainId": 1,
      "toChainId": 10,
      "amount": "1000000000000000000",
      "tokenAddress": "0x456...",
      "recipient": "0x123...",
      "timestamp": 1651234567,
      "status": "CONFIRMED",
      "txHash": "0x789...",
      "messageId": "msg-456",
      "treasuryId": "treasury-123"
    },
    // Additional orders...
  ],
  "total": 5,
  "limit": 10,
  "offset": 0
}
```

#### Response Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| orders | array | List of bridge orders |
| total | number | Total number of orders matching the query |
| limit | number | Limit used in the query |
| offset | number | Offset used in the query |

### Get Transactions

Returns bridge transactions for a user address.

```
GET /api/l2/transactions/:address
```

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| address | string | Yes | User wallet address |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Maximum number of transactions to return (default: 10) |
| offset | number | No | Offset for pagination (default: 0) |
| type | string | No | Filter by transaction type (deposit, withdraw, bridge) |
| status | string | No | Filter by status (pending, processing, confirmed, failed) |

#### Response

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
      "tokenAddress": "0x456...",
      "messageId": "msg-456"
    },
    // Additional transactions...
  ],
  "total": 15,
  "limit": 10,
  "offset": 0
}
```

#### Response Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| transactions | array | List of bridge transactions |
| total | number | Total number of transactions matching the query |
| limit | number | Limit used in the query |
| offset | number | Offset used in the query |

## WebSocket Subscriptions

The L2Bridge also supports real-time updates through WebSocket connections. See the [WebSocket API Reference](./index.md#websocket-subscriptions) for details on available subscription topics.

## Error Codes

| Code | Description |
|------|-------------|
| INVALID_CHAIN | The specified chain ID is not supported |
| INSUFFICIENT_BALANCE | Insufficient balance for the transaction |
| BRIDGE_UNAVAILABLE | The bridge is temporarily unavailable |
| ESTIMATION_FAILED | Failed to estimate gas for the transaction |
| BRIDGE_OPERATION_FAILED | Bridge operation failed during execution |
| MESSAGE_NOT_FOUND | The specified message ID does not exist |

## Status Definitions

| Status | Description |
|--------|-------------|
| PENDING | Transaction has been submitted to the source chain |
| PROCESSING | Transaction is confirmed on source chain and awaiting destination chain |
| CONFIRMED | Assets are available on the destination chain |
| FAILED | Transaction failed (see failureReason for details) |

## Examples

### JavaScript Example: Bridging ETH to Optimism

```javascript
// Example using fetch API
const bridgeETH = async () => {
  const token = 'your-jwt-token';
  
  // First, estimate gas
  const estimateResponse = await fetch('https://api.quantera.io/api/l2/estimate-gas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      fromChainId: 1,
      toChainId: 10,
      dataSize: 1000,
      useBlob: true
    })
  });
  
  const gasEstimate = await estimateResponse.json();
  console.log('Estimated cost:', gasEstimate.estimatedUsdCost, 'USD');
  
  // Then, initiate bridge transaction
  const bridgeResponse = await fetch('https://api.quantera.io/api/l2/bridge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      fromChainId: 1,
      toChainId: 10,
      recipient: '0x123...',
      amount: '1000000000000000000', // 1 ETH
    })
  });
  
  const bridgeResult = await bridgeResponse.json();
  console.log('Bridge initiated:', bridgeResult);
  
  // Monitor status
  const monitorStatus = async () => {
    const statusResponse = await fetch(`https://api.quantera.io/api/l2/message/${bridgeResult.messageId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const status = await statusResponse.json();
    console.log('Bridge status:', status.status);
    
    if (status.status !== 'CONFIRMED' && status.status !== 'FAILED') {
      // Check again in 30 seconds
      setTimeout(monitorStatus, 30000);
    }
  };
  
  // Start monitoring
  monitorStatus();
};

bridgeETH();
```

## Rate Limits

| Endpoint | Rate Limit |
|----------|------------|
| GET /api/l2/chains | 60 requests per minute |
| POST /api/l2/estimate-gas | 30 requests per minute |
| POST /api/l2/bridge | 10 requests per minute |
| GET /api/l2/message/:messageId | 60 requests per minute |
| GET /api/l2/user/:address | 30 requests per minute |
| GET /api/l2/transactions/:address | 30 requests per minute |

## FAQ

**Q: How long do bridge transactions take to complete?**  
A: Typically 3-5 minutes for Optimism and Base, 10-15 minutes for Arbitrum, and 20-30 minutes for Polygon.

**Q: What happens if a transaction fails?**  
A: If a transaction fails on the source chain, funds remain in your wallet. If it fails after confirmation on the source chain, the bridge protocol will attempt automatic recovery.

**Q: Is there a fee for using the bridge?**  
A: The only costs are the gas fees for the transactions. The platform does not charge additional fees. 