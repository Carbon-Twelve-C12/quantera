# Smart Account API Reference

## Overview

The Smart Account API provides functionality for creating, managing, and interacting with programmable ERC-7702 compatible accounts. This document details the endpoints, parameters, and responses for using the Smart Account service.

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

### Get Templates

Retrieves available smart account templates.

```
GET /api/smart-accounts/templates
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| category | string | No | Filter templates by category (basic, treasury, yield, trading) |
| limit | number | No | Maximum number of templates to return (default: 20) |
| offset | number | No | Offset for pagination (default: 0) |

#### Response

```json
{
  "templates": [
    {
      "id": "template-123",
      "name": "Basic Account",
      "description": "Simple account with ownership and delegation",
      "category": "basic",
      "parameters": [
        {
          "name": "owner",
          "type": "address",
          "description": "Owner address",
          "required": true
        },
        {
          "name": "dailyLimit",
          "type": "uint256",
          "description": "Daily spending limit in wei",
          "required": false,
          "default": "1000000000000000000"
        }
      ],
      "code": "contract BasicAccount {\n  address public owner;\n  // ... more code\n}"
    },
    // Additional templates...
  ],
  "total": 8,
  "limit": 20,
  "offset": 0
}
```

#### Response Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| templates | array | List of available templates |
| total | number | Total number of templates matching the query |
| limit | number | Limit used in the query |
| offset | number | Offset used in the query |

### Get Template Details

Returns detailed information about a specific template.

```
GET /api/smart-accounts/templates/:id
```

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Template ID |

#### Response

```json
{
  "id": "template-123",
  "name": "Basic Account",
  "description": "Simple account with ownership and delegation",
  "category": "basic",
  "parameters": [
    {
      "name": "owner",
      "type": "address",
      "description": "Owner address",
      "required": true
    },
    {
      "name": "dailyLimit",
      "type": "uint256",
      "description": "Daily spending limit in wei",
      "required": false,
      "default": "1000000000000000000"
    }
  ],
  "code": "contract BasicAccount {\n  address public owner;\n  mapping(address => bool) public delegates;\n  uint256 public dailyLimit;\n  // ... more code\n}",
  "features": [
    "Ownership",
    "Delegation",
    "Daily Limits"
  ],
  "gasEstimate": "4500000",
  "complexity": "low",
  "examples": [
    {
      "title": "Basic setup",
      "parameters": {
        "owner": "0x123...",
        "dailyLimit": "1000000000000000000"
      }
    }
  ]
}
```

### Deploy Smart Account

Creates a new smart account from a template.

```
POST /api/smart-accounts/deploy
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| templateId | string | Yes | Template ID to use |
| name | string | Yes | User-friendly name for the account |
| parameters | object | Yes | Template-specific parameters |
| customCode | string | No | Customized contract code (if modifying the template) |

#### Example Request

```json
{
  "templateId": "template-123",
  "name": "My First Smart Account",
  "parameters": {
    "owner": "0x123...",
    "dailyLimit": "5000000000000000000"
  }
}
```

#### Response

```json
{
  "deploymentId": "deploy-456",
  "status": "pending",
  "txHash": "0x789...",
  "estimatedCompletionTime": 30,
  "parameters": {
    "owner": "0x123...",
    "dailyLimit": "5000000000000000000"
  }
}
```

#### Response Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| deploymentId | string | Unique ID for tracking the deployment |
| status | string | Initial status of the deployment (pending, processing, completed, failed) |
| txHash | string | Transaction hash of the deployment transaction |
| estimatedCompletionTime | number | Estimated seconds until completion |
| parameters | object | Parameters used for the deployment |

### Get Deployment Status

Returns the status of a smart account deployment.

```
GET /api/smart-accounts/deploy/:deploymentId
```

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| deploymentId | string | Yes | Deployment ID |

#### Response

```json
{
  "deploymentId": "deploy-456",
  "status": "completed",
  "txHash": "0x789...",
  "accountAddress": "0xabc...",
  "creationTime": 1651234567,
  "completionTime": 1651234597,
  "parameters": {
    "owner": "0x123...",
    "dailyLimit": "5000000000000000000"
  }
}
```

#### Response Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| deploymentId | string | Deployment ID |
| status | string | Current status (pending, processing, completed, failed) |
| txHash | string | Transaction hash of the deployment |
| accountAddress | string | Address of the deployed smart account (if completed) |
| creationTime | number | Unix timestamp of deployment request |
| completionTime | number | Unix timestamp of deployment completion |
| parameters | object | Parameters used for the deployment |
| error | string | Error message (if status is 'failed') |

### Get User Accounts

Returns smart accounts owned or delegated to a user.

```
GET /api/smart-accounts/user/:address
```

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| address | string | Yes | User wallet address |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| includeOwned | boolean | No | Include accounts owned by the user (default: true) |
| includeDelegated | boolean | No | Include accounts where user is a delegate (default: true) |
| limit | number | No | Maximum number of accounts to return (default: 10) |
| offset | number | No | Offset for pagination (default: 0) |

#### Response

```json
{
  "accounts": [
    {
      "address": "0xabc...",
      "name": "My First Smart Account",
      "templateId": "template-123",
      "templateName": "Basic Account",
      "ownerAddress": "0x123...",
      "isOwner": true,
      "isDelegate": false,
      "creationTime": 1651234567,
      "lastActivity": 1651334567,
      "balances": [
        {
          "token": "ETH",
          "amount": "10000000000000000000",
          "usdValue": 25000.00
        }
      ]
    },
    // Additional accounts...
  ],
  "total": 3,
  "limit": 10,
  "offset": 0
}
```

### Get Account Details

Returns detailed information about a specific smart account.

```
GET /api/smart-accounts/:address
```

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| address | string | Yes | Smart account address |

#### Response

```json
{
  "address": "0xabc...",
  "name": "My First Smart Account",
  "templateId": "template-123",
  "templateName": "Basic Account",
  "ownerAddress": "0x123...",
  "creationTime": 1651234567,
  "lastActivity": 1651334567,
  "balances": [
    {
      "token": "ETH",
      "amount": "10000000000000000000",
      "usdValue": 25000.00
    },
    {
      "token": "USDC",
      "address": "0xdef...",
      "amount": "50000000000",
      "usdValue": 50000.00
    }
  ],
  "delegates": [
    {
      "address": "0x456...",
      "addedAt": 1651244567,
      "permissions": ["transfer", "swap"]
    }
  ],
  "parameters": {
    "owner": "0x123...",
    "dailyLimit": "5000000000000000000"
  },
  "code": "contract BasicAccount {\n  address public owner;\n  // ... actual deployed code\n}",
  "totalValue": 75000.00
}
```

### Execute Operation

Executes an operation on a smart account.

```
POST /api/smart-accounts/:address/execute
```

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| address | string | Yes | Smart account address |

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| operation | string | Yes | Operation type (transfer, swap, delegate, etc.) |
| parameters | object | Yes | Operation-specific parameters |
| gasLimit | string | No | Custom gas limit for the operation |

#### Example Request: Transfer

```json
{
  "operation": "transfer",
  "parameters": {
    "to": "0x789...",
    "token": "0xdef...",
    "amount": "1000000000"
  }
}
```

#### Example Request: Add Delegate

```json
{
  "operation": "addDelegate",
  "parameters": {
    "delegate": "0x456...",
    "permissions": ["transfer", "swap"]
  }
}
```

#### Response

```json
{
  "operationId": "op-789",
  "status": "pending",
  "txHash": "0xdef...",
  "estimatedCompletionTime": 15,
  "operation": "transfer",
  "parameters": {
    "to": "0x789...",
    "token": "0xdef...",
    "amount": "1000000000"
  }
}
```

### Get Operation Status

Returns the status of a smart account operation.

```
GET /api/smart-accounts/:address/operations/:operationId
```

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| address | string | Yes | Smart account address |
| operationId | string | Yes | Operation ID |

#### Response

```json
{
  "operationId": "op-789",
  "status": "completed",
  "txHash": "0xdef...",
  "operation": "transfer",
  "executor": "0x123...",
  "creationTime": 1651434567,
  "completionTime": 1651434582,
  "gasUsed": "50000",
  "parameters": {
    "to": "0x789...",
    "token": "0xdef...",
    "amount": "1000000000"
  }
}
```

### Get Account Operations

Returns operations performed on a smart account.

```
GET /api/smart-accounts/:address/operations
```

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| address | string | Yes | Smart account address |

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Maximum number of operations to return (default: 20) |
| offset | number | No | Offset for pagination (default: 0) |
| status | string | No | Filter by status (pending, processing, completed, failed) |
| operation | string | No | Filter by operation type (transfer, swap, delegate, etc.) |
| from | number | No | Filter by start timestamp (Unix timestamp) |
| to | number | No | Filter by end timestamp (Unix timestamp) |

#### Response

```json
{
  "operations": [
    {
      "operationId": "op-789",
      "status": "completed",
      "txHash": "0xdef...",
      "operation": "transfer",
      "executor": "0x123...",
      "creationTime": 1651434567,
      "completionTime": 1651434582,
      "gasUsed": "50000",
      "parameters": {
        "to": "0x789...",
        "token": "0xdef...",
        "amount": "1000000000"
      }
    },
    // Additional operations...
  ],
  "total": 15,
  "limit": 20,
  "offset": 0
}
```

### Add Delegate

Adds a delegate to a smart account.

```
POST /api/smart-accounts/:address/delegates
```

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| address | string | Yes | Smart account address |

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| delegate | string | Yes | Delegate address to add |
| permissions | array | Yes | Array of permission strings |

#### Example Request

```json
{
  "delegate": "0x456...",
  "permissions": ["transfer", "swap"]
}
```

#### Response

```json
{
  "operationId": "op-101",
  "status": "pending",
  "txHash": "0xaaa...",
  "delegate": "0x456...",
  "permissions": ["transfer", "swap"]
}
```

### Remove Delegate

Removes a delegate from a smart account.

```
DELETE /api/smart-accounts/:address/delegates/:delegateAddress
```

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| address | string | Yes | Smart account address |
| delegateAddress | string | Yes | Delegate address to remove |

#### Response

```json
{
  "operationId": "op-102",
  "status": "pending",
  "txHash": "0xbbb...",
  "delegate": "0x456..."
}
```

### Get Account Delegates

Returns delegates for a smart account.

```
GET /api/smart-accounts/:address/delegates
```

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| address | string | Yes | Smart account address |

#### Response

```json
{
  "delegates": [
    {
      "address": "0x456...",
      "addedAt": 1651244567,
      "addedBy": "0x123...",
      "permissions": ["transfer", "swap"],
      "lastActivity": 1651334567
    },
    // Additional delegates...
  ]
}
```

## WebSocket Subscriptions

The Smart Account API also supports real-time updates through WebSocket connections. See the [WebSocket API Reference](./index.md#websocket-subscriptions) for details on available subscription topics.

## Operation Types

| Operation | Description |
|-----------|-------------|
| transfer | Transfer tokens from the account |
| swap | Swap one token for another |
| addDelegate | Add a delegate to the account |
| removeDelegate | Remove a delegate from the account |
| updateLimit | Update spending limits |
| executeCustom | Execute a custom function |
| bridgeAssets | Bridge assets to another chain |
| upgradeAccount | Upgrade the account implementation |

## Permission Types

| Permission | Description |
|-----------|-------------|
| transfer | Ability to transfer tokens |
| swap | Ability to swap tokens |
| delegate | Ability to manage delegates |
| execute | Ability to execute arbitrary functions |
| upgrade | Ability to upgrade the account |
| bridge | Ability to bridge assets |

## Error Codes

| Code | Description |
|------|-------------|
| UNAUTHORIZED | Caller is not authorized to perform this operation |
| INVALID_TEMPLATE | Template ID is invalid or not found |
| INVALID_PARAMETERS | Invalid parameters for template or operation |
| DEPLOYMENT_FAILED | Account deployment failed |
| EXECUTION_FAILED | Operation execution failed |
| ACCOUNT_NOT_FOUND | Smart account address not found |
| OPERATION_NOT_FOUND | Operation ID not found |
| DELEGATE_NOT_FOUND | Delegate address not found |
| INSUFFICIENT_BALANCE | Insufficient balance for the operation |
| DAILY_LIMIT_EXCEEDED | Operation would exceed daily spending limit |

## Examples

### JavaScript Example: Creating and Using a Smart Account

```javascript
// Example using fetch API
const createAndUseSmartAccount = async () => {
  const token = 'your-jwt-token';
  
  // Step 1: Get available templates
  const templatesResponse = await fetch('https://api.quantera.io/api/smart-accounts/templates', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const templates = await templatesResponse.json();
  console.log('Available templates:', templates.templates.map(t => t.name));
  
  // Step 2: Deploy a new smart account using the Basic Account template
  const basicTemplate = templates.templates.find(t => t.name === 'Basic Account');
  
  const deployResponse = await fetch('https://api.quantera.io/api/smart-accounts/deploy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      templateId: basicTemplate.id,
      name: 'My First Smart Account',
      parameters: {
        owner: '0x123...',
        dailyLimit: '5000000000000000000'
      }
    })
  });
  
  const deployResult = await deployResponse.json();
  console.log('Deployment initiated:', deployResult);
  
  // Step 3: Monitor deployment status
  const checkDeployment = async () => {
    const statusResponse = await fetch(`https://api.quantera.io/api/smart-accounts/deploy/${deployResult.deploymentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const deployStatus = await statusResponse.json();
    console.log('Deployment status:', deployStatus.status);
    
    if (deployStatus.status === 'completed') {
      console.log('Smart account created:', deployStatus.accountAddress);
      return deployStatus.accountAddress;
    } else if (deployStatus.status === 'failed') {
      console.error('Deployment failed:', deployStatus.error);
      return null;
    } else {
      // Check again in 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));
      return checkDeployment();
    }
  };
  
  // Wait for deployment to complete
  const accountAddress = await checkDeployment();
  
  if (accountAddress) {
    // Step 4: Execute a transfer operation
    const executeResponse = await fetch(`https://api.quantera.io/api/smart-accounts/${accountAddress}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        operation: 'transfer',
        parameters: {
          to: '0x789...',
          token: 'ETH',
          amount: '1000000000000000000' // 1 ETH
        }
      })
    });
    
    const operationResult = await executeResponse.json();
    console.log('Transfer initiated:', operationResult);
    
    // Step 5: Add a delegate
    const delegateResponse = await fetch(`https://api.quantera.io/api/smart-accounts/${accountAddress}/delegates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        delegate: '0x456...',
        permissions: ['transfer', 'swap']
      })
    });
    
    const delegateResult = await delegateResponse.json();
    console.log('Delegate added:', delegateResult);
  }
};

createAndUseSmartAccount();
```

## Rate Limits

| Endpoint | Rate Limit |
|----------|------------|
| GET /api/smart-accounts/templates | 60 requests per minute |
| GET /api/smart-accounts/templates/:id | 60 requests per minute |
| POST /api/smart-accounts/deploy | 10 requests per minute |
| GET /api/smart-accounts/deploy/:deploymentId | 60 requests per minute |
| GET /api/smart-accounts/user/:address | 30 requests per minute |
| GET /api/smart-accounts/:address | 30 requests per minute |
| POST /api/smart-accounts/:address/execute | 20 requests per minute |
| GET /api/smart-accounts/:address/operations/:operationId | 60 requests per minute |
| GET /api/smart-accounts/:address/operations | 30 requests per minute |
| POST /api/smart-accounts/:address/delegates | 20 requests per minute |
| DELETE /api/smart-accounts/:address/delegates/:delegateAddress | 20 requests per minute |
| GET /api/smart-accounts/:address/delegates | 30 requests per minute |

## FAQ

**Q: How much does it cost to deploy a smart account?**  
A: Deployment costs vary based on the complexity of the template, typically ranging from $20-50 in gas fees.

**Q: Can I customize a template before deployment?**  
A: Yes, you can modify the template code by providing a customCode parameter when deploying.

**Q: Are smart accounts compatible with hardware wallets?**  
A: Yes, you can use a hardware wallet address as the owner address when creating a smart account. 