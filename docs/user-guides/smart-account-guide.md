# Smart Account Management Guide

## Overview

Smart Accounts in the Quantera Platform provide programmable, customizable account functionality that goes beyond traditional wallets. This guide will help you understand how to create, customize, and manage your smart accounts to optimize your asset management experience.

## Table of Contents

1. [Introduction to Smart Accounts](#introduction-to-smart-accounts)
2. [Key Benefits](#key-benefits)
3. [Account Templates](#account-templates)
4. [Creating a Smart Account](#creating-a-smart-account)
5. [Customizing Account Logic](#customizing-account-logic)
6. [Managing Delegates](#managing-delegates)
7. [Monitoring Operations](#monitoring-operations)
8. [Advanced Usage](#advanced-usage)
9. [Security Considerations](#security-considerations)
10. [Troubleshooting](#troubleshooting)
11. [FAQ](#faq)

## Introduction to Smart Accounts

Smart Accounts are programmable, ERC-7702 compatible account contracts that allow you to define custom logic for asset management, automated transactions, delegation, and more. Unlike traditional EOA (Externally Owned Accounts), Smart Accounts can:

- Execute complex operations based on predefined conditions
- Delegate limited access to other users or contracts
- Automate trading strategies and yield optimization
- Interact with multiple DeFi protocols in a single transaction
- Implement custom security rules and limitations

This functionality is made possible by Ethereum's Pectra upgrade, which introduced account abstraction capabilities.

## Key Benefits

- **Automation**: Set up automatic portfolio rebalancing, yield harvesting, or regular payments
- **Delegation**: Grant limited access to accounts for team management
- **Security**: Implement custom verification rules, spending limits, and approval workflows
- **Efficiency**: Execute complex multi-step operations in a single transaction
- **Flexibility**: Upgrade account functionality without migrating assets

## Account Templates

The platform offers several pre-built account templates to get you started:

| Template | Description | Use Case |
|----------|-------------|----------|
| Basic Account | Simple account with ownership and delegation | Personal use |
| Treasury Manager | Account with spending limits and approval workflows | Team treasury |
| Yield Optimizer | Automated yield harvesting and reinvestment | Passive income |
| Portfolio Manager | Automated rebalancing based on predefined allocations | Investment portfolio |
| Trading Bot | Executes trades based on price conditions | Automated trading |
| Multisig | Requires multiple approvals for transactions | High-security needs |

Each template can be customized to fit your specific requirements.

## Creating a Smart Account

### Step-by-Step Guide

1. **Navigate to Smart Accounts**: Access the Smart Account page from your dashboard or via the main navigation.

2. **Connect Your Wallet**: Ensure your wallet is connected to the platform.

3. **Select "Create New Account"**: Click on the tab or button to start the creation process.

4. **Choose a Template**: Browse the available templates and select one that matches your needs.

5. **Configure Parameters**: Enter the required parameters for your chosen template:
   - **Owner Address**: The address that will have full control of the account
   - **Account Name**: A recognizable name for your Smart Account
   - **Template-specific parameters**: E.g., spending limits, delegate addresses, etc.

6. **Review Template Code**: Examine the Solidity code that will be used to create your account.

7. **Customize (Optional)**: Modify the template code if needed (see [Customizing Account Logic](#customizing-account-logic)).

8. **Deploy Account**: Click "Deploy Smart Account" to create your account on the blockchain.

9. **Confirm Transaction**: Approve the transaction in your wallet when prompted.

10. **Account Created**: Once deployed, you'll see your new Smart Account in the "My Accounts" tab.

### Example: Creating a Basic Account

1. Select the "Basic Account" template
2. Configure parameters:
   - Owner Address: Your current wallet address (auto-filled)
   - Account Name: "My First Smart Account"
3. Review the template code (no modifications needed for basic usage)
4. Click "Deploy Smart Account"
5. Confirm the transaction in your wallet
6. Your new Smart Account appears in your account list

## Customizing Account Logic

### Code Editor

The Smart Account creation interface includes a code editor that allows you to modify the template code. This editor features:

- Syntax highlighting for Solidity
- Error detection
- Basic code completion

### Safe Customization Options

For those new to Solidity, these are safe customization areas:

1. **Modifying Constants**:
   ```solidity
   // Change the daily spending limit
   uint256 public constant DAILY_LIMIT = 5 ether; // Change to your preferred amount
   ```

2. **Adjusting Time Parameters**:
   ```solidity
   // Change the time lock period
   uint256 public constant TIME_LOCK = 24 hours; // Adjust as needed
   ```

3. **Adding Delegates**:
   ```solidity
   // Add trusted delegates during initialization
   delegates[0xYourTrustedAddressHere] = true;
   ```

### Advanced Customization

For experienced Solidity developers, you can:

1. Add new functions to extend functionality
2. Implement custom validation logic
3. Create interactions with other protocols
4. Modify execution rules and security parameters

Example: Adding a custom trading function
```solidity
// Add a custom function to swap tokens on a DEX
function swapTokens(address tokenIn, address tokenOut, uint256 amount) external onlyOwnerOrDelegate {
    require(amount <= getAvailableBalance(tokenIn), "Insufficient balance");
    
    // Interact with DEX (implementation depends on the specific DEX)
    // ...
    
    emit TokensSwapped(tokenIn, tokenOut, amount);
}
```

## Managing Delegates

### Adding Delegates

Delegates are addresses that have limited permissions to interact with your Smart Account.

1. Navigate to your Smart Account details
2. Scroll to the "Delegates" section
3. Click "Add Delegate"
4. Enter the delegate's address
5. Confirm the transaction

### Delegate Permissions

Permissions vary by template but typically include:

- Executing trades up to a certain limit
- Initiating transfers (subject to approval)
- Reading account data
- Proposing operations

### Removing Delegates

1. Navigate to your Smart Account details
2. Find the delegate in the list
3. Click the remove icon
4. Confirm the transaction

## Monitoring Operations

### Operations History

The Smart Account interface provides a comprehensive history of all operations:

1. Navigate to your Smart Account details
2. Click the "Operations History" tab
3. View all operations with:
   - Operation type
   - Timestamp
   - Executor address
   - Status
   - Gas used
   - Transaction hash

### Real-Time Updates

The operations history updates in real-time through WebSocket connections, so you'll see new operations as they occur without needing to refresh the page.

### Operation Types

Common operation types include:

- **Transfer**: Moving assets from the account
- **Execute**: Executing a custom function
- **Delegate**: Adding or removing a delegate
- **Upgrade**: Changing the account implementation
- **Swap**: Trading one asset for another

## Advanced Usage

### Integration with L2Bridge

Smart Accounts can be used with the L2Bridge to automate cross-chain operations:

```solidity
// Example: Automatic bridging function
function bridgeToL2(uint256 amount, uint256 chainId) external onlyOwnerOrDelegate {
    require(amount <= getDailyAvailable(), "Exceeds daily limit");
    
    // Call the L2Bridge contract
    l2Bridge.bridgeOrder({
        orderId: generateOrderId(),
        treasuryId: treasuryId,
        userAddress: address(this),
        isBuy: true,
        amount: amount,
        price: 0
    });
    
    emit FundsBridged(amount, chainId);
}
```

### Automated Investment Strategies

Create advanced investment strategies:

```solidity
// Example: Dollar-cost averaging function
function dollarCostAverage(address token, uint256 amount) external onlyOwner {
    require(canExecuteScheduled(), "Too early for next execution");
    
    // Purchase token on regular intervals
    // ...
    
    lastExecutionTime = block.timestamp;
    emit StrategyExecuted("DCA", token, amount);
}
```

### Multi-Account Management

You can create multiple Smart Accounts for different purposes:

- Trading account with high daily limits
- Savings account with time locks
- Team treasury with multisig requirements
- Investment account with automated strategies

## Security Considerations

### Best Practices

1. **Start Small**: Begin with small amounts until you're comfortable with your account's behavior
2. **Test Custom Logic**: Thoroughly test any customizations before deploying with significant assets
3. **Regular Audits**: Periodically review your account's operations and delegate activities
4. **Backup Recovery Methods**: Ensure you have backup access methods configured
5. **Be Cautious with Delegates**: Only add trusted addresses as delegates

### Security Features

Smart Accounts include several security features:

- **Spending Limits**: Daily/transaction limits to prevent large unauthorized transfers
- **Time Locks**: Waiting periods for high-value transactions
- **Approval Workflows**: Multi-step approval processes for sensitive operations
- **Operation Logging**: Comprehensive audit trail of all account activities

## Troubleshooting

### Common Issues

| Issue | Potential Solution |
|-------|-------------------|
| Account deployment failed | Check gas settings and try again |
| Delegate cannot perform operation | Verify the delegate has appropriate permissions |
| Daily limit reached | Wait for limit reset or perform operation from owner account |
| Time lock active | Wait for time lock period to expire |
| Transaction reverted | Check operation parameters and account balance |

### Error Messages

Common error messages and their meanings:

- `"Not authorized"`: The caller doesn't have permission for this operation
- `"Exceeds daily limit"`: Operation would exceed configured spending limit
- `"Time lock active"`: Operation is subject to a time delay
- `"Invalid parameters"`: One or more function parameters are incorrect
- `"Insufficient balance"`: Account lacks enough funds for the operation

## FAQ

**Q: How much does it cost to create a Smart Account?**  
A: Creation costs vary based on the complexity of the template, typically ranging from $20-50 in gas fees.

**Q: Can I change the owner of my Smart Account?**  
A: Yes, the owner can transfer ownership to another address through the account interface.

**Q: What happens if I lose access to my owner wallet?**  
A: Recovery options depend on your account configuration. Some templates support social recovery or backup owners.

**Q: Can Smart Accounts hold NFTs and other non-fungible tokens?**  
A: Yes, Smart Accounts can hold and manage any ERC-compliant token, including NFTs (ERC-721) and semi-fungible tokens (ERC-1155).

**Q: Is there a limit to how many delegates I can add?**  
A: There's no hard limit, but each additional delegate increases gas costs for certain operations.

**Q: Can I upgrade my Smart Account after deployment?**  
A: Most templates support upgradeability, allowing you to enhance functionality without migrating assets.

**Q: Are Smart Accounts compatible with hardware wallets?**  
A: Yes, you can use a hardware wallet as the owner address for maximum security.

---

For technical details on Smart Account implementation, please refer to the [Technical Documentation](../technical/smart-account-technical.md).

For API documentation, see the [Smart Account API Reference](../api/smart-account-api.md). 