# L2Bridge User Guide

## Overview

The L2Bridge feature enables you to seamlessly move assets between Ethereum mainnet and various Layer 2 networks, optimizing for both cost and speed. This guide will walk you through using the L2Bridge functionality in the Quantera Platform.

## Table of Contents

1. [Key Features](#key-features)
2. [Supported Networks](#supported-networks)
3. [Cost Optimization Technology](#cost-optimization-technology)
4. [Basic Usage](#basic-usage)
5. [Advanced Features](#advanced-features)
6. [Monitoring Transactions](#monitoring-transactions)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

## Key Features

- **Multi-Chain Support**: Bridge assets across Ethereum, Optimism, Arbitrum, and more
- **EIP-7691 Blob Support**: Utilize Ethereum's blob data capabilities for cost-effective bridging
- **Gas Optimization**: Automatic selection of the most cost-effective data transport method
- **Real-Time Updates**: WebSocket-powered status updates for bridge operations
- **Treasury Integration**: Direct bridging of treasury assets across chains
- **Transaction History**: Comprehensive tracking of all bridge operations

## Supported Networks

| Network | Chain ID | Blob Support | Description |
|---------|----------|-------------|-------------|
| Ethereum | 1 | Yes | Mainnet with full blob data support |
| Optimism | 10 | Yes | L2 with blob data support |
| Arbitrum | 42161 | No | L2 with traditional calldata format |
| Polygon | 137 | Yes | L1-compatible sidechain with blob support |
| Base | 8453 | Yes | L2 with blob data support |

## Cost Optimization Technology

The L2Bridge intelligently selects the most cost-effective data transport method:

1. **Blob Data (EIP-7691)**: For chains that support blob data, the bridge uses this more cost-effective format for large transfers.
2. **Dictionary Compression**: Our proprietary compression algorithm reduces data size by up to 70%.
3. **Calldata Fallback**: For chains without blob support, the bridge automatically falls back to traditional calldata.

The bridge UI clearly displays the selected method and estimated costs before you confirm any transaction.

## Basic Usage

### Bridging Assets

1. **Navigate to the Bridge Widget**: Access the bridge feature from your dashboard or via the "Bridge" tab in the main navigation.

2. **Connect Your Wallet**: Ensure your wallet is connected to the platform.

3. **Select Destination Chain**: Choose the L2 network where you want to send your assets.

4. **Enter Treasury ID**: If bridging treasury assets, enter the treasury ID.

5. **Specify Amount**: Enter the amount of ETH or tokens you wish to bridge.

6. **Review Gas Estimation**: The system will provide a gas cost estimation, showing:
   - Data format (Blob or Calldata)
   - Estimated cost in USD
   - Gas limit

7. **Initiate Bridge**: Click the "Bridge" button to start the process.

8. **Confirm Transaction**: Approve the transaction in your wallet when prompted.

### Example Bridge Flow

Here's a typical bridging flow:

1. User connects wallet on Ethereum mainnet
2. Selects Optimism as the destination
3. Enters 1.0 ETH as the amount
4. System calculates gas using blob data: ~$3.50
5. User confirms transaction
6. L2Bridge executes the transfer
7. Real-time status updates appear via WebSocket
8. Assets become available on Optimism typically within 3-5 minutes

## Advanced Features

### Gas Estimation Customization

You can customize the gas estimation by adjusting the data size parameter:

```javascript
// Example: Custom gas estimation
const estimation = await estimateBridgingGas(
  2000, // Custom data size in bytes
  1     // Data type: 0 = calldata, 1 = blob
);
```

### Programmatic Access

For developers, the L2Bridge can be accessed programmatically:

```typescript
import { useL2Bridge } from '../contexts/L2BridgeContext';

// Inside your component
const { 
  bridgeOrder, 
  estimateBridgingGas, 
  getOrdersByUser 
} = useL2Bridge();

// Bridge an order
const handleBridge = async () => {
  const order = {
    orderId: 'uniqueOrderId',
    treasuryId: 'treasury-123',
    userAddress: '0x...',
    isBuy: true,
    amount: '1.0',
    price: '0'
  };
  
  await bridgeOrder(order);
};
```

## Monitoring Transactions

### Recent Transactions

The L2BridgeWidget displays your recent transactions with:

- Transaction ID
- Amount
- Status indicator (Pending, Processing, Confirmed, Failed)
- Timestamp

### Transaction Status

Transactions proceed through the following states:

1. **Pending**: Transaction is submitted to the source chain
2. **Processing**: Transaction is confirmed on source chain, waiting for destination chain
3. **Confirmed**: Assets are available on the destination chain
4. **Failed**: Transaction failed (with error details)

### WebSocket Notifications

Real-time updates are delivered via WebSocket connections. You'll receive automatic notifications when:

- Your transaction status changes
- Assets become available on the destination chain
- There are potential issues with your transaction

## Troubleshooting

### Common Issues

| Issue | Potential Solution |
|-------|-------------------|
| Transaction stuck in "Pending" | Check source chain for network congestion |
| Transaction failed | View error details in transaction history |
| Destination chain not available | Ensure wallet is on the correct network |
| Unable to see bridged assets | Add the token to your wallet on the destination chain |
| Gas estimation error | Try manually specifying a smaller data size |

### Contacting Support

For issues not covered here, please contact support at support@quantera.io with:
1. Your transaction ID
2. Source and destination chain information
3. Error messages received
4. Wallet address

## FAQ

**Q: How long do bridge transactions take?**
A: Typically 3-5 minutes for Optimism and Base, 10-15 minutes for Arbitrum, and 20-30 minutes for Polygon.

**Q: Are there minimum or maximum amounts?**
A: Minimum is 0.01 ETH (or equivalent). No maximum, though larger amounts may require additional confirmations.

**Q: Which tokens can I bridge?**
A: Currently ETH and Quantera treasury tokens. Support for ERC-20 tokens is coming soon.

**Q: Is there a fee for using the bridge?**
A: The only costs are the gas fees for the transactions. The platform does not charge additional fees.

**Q: What happens if my transaction fails?**
A: If a transaction fails on the source chain, funds remain in your wallet. If it fails after confirmation on the source chain, the bridge protocol will attempt automatic recovery.

**Q: Can I cancel a pending bridge transaction?**
A: Once submitted to the blockchain, transactions cannot be canceled. They can only complete or fail.

**Q: Is blob data support active on all networks?**
A: Blob data is supported on Ethereum mainnet, Optimism, Base, and Polygon. Arbitrum uses traditional calldata.

---

For technical details on the L2Bridge implementation, please refer to the [Technical Documentation](../technical/l2bridge-technical.md).

For API documentation, see the [L2Bridge API Reference](../api/l2bridge-api.md). 