# Technical Specification for TreasuryToken Platform 

## 1. Introduction

### 1.1 Purpose
This technical specification details the architecture, components, and implementation of the TreasuryToken platform, an Ethereum-based system for tokenizing U.S. Treasury securities. This document serves as the definitive technical reference for developers building the platform, with specific attention to leveraging the Pectra upgrade capabilities.

### 1.2 Scope
This specification covers the MVP version of the platform, focusing exclusively on the tokenization of treasury securities (bills, notes, and bonds). It details all technical aspects including smart contracts, backend services, frontend components, and integration points, with a strategic focus on Ethereum's Pectra upgrade advantages.

### 1.3 Definitions
- **Treasury Security**: Government debt instrument issued by the U.S. Department of the Treasury
- **T-Bill**: Short-term treasury security with maturity periods of 4, 8, 13, 26, or 52 weeks
- **T-Note**: Medium-term treasury security with maturity periods of 2, 3, 5, 7, or 10 years
- **T-Bond**: Long-term treasury security with maturity periods of 20 or 30 years
- **Yield**: The return an investor receives from a treasury security
- **Tokenization**: The process of creating a digital token representing ownership of an asset
- **ERC-1400**: Ethereum token standard for security tokens with transfer restrictions
- **Smart Account**: EIP-7702-enabled wallet that can execute programmatic logic
- **Delegation**: The ability to authorize other accounts to act on behalf of a primary account

## 2. System Architecture

### 2.1 High-Level Architecture
The TreasuryToken platform consists of four primary components:
1. **Smart Contracts**: Ethereum-based contracts for treasury tokens, registry, and compliance
2. **Backend Services**: Rust-based services using Alloy framework for contract interaction
3. **API Layer**: RESTful API for frontend and third-party integration
4. **Frontend Application**: React-based web application for user interaction

### 2.2 Architecture Diagram
```
+-----------------------+       +-------------------------+
|                       |       |                         |
|  Frontend Application |<----->|  API Layer (Rust/Warp)  |
|  (React)              |       |                         |
|                       |       +------------+------------+
+-----------------------+                    |
                                             |
                                    +--------v---------+
                                    |                  |
                                    | Backend Services |
                                    | (Rust/Alloy)     |
                                    |                  |
                                    +--------+---------+
                                             |
+-------------------------+        +---------v----------+
|                         |        |                    |
| IPFS Metadata Storage   |<------>|  Smart Contracts   |
|                         |        |  (Solidity)        |
+-------------------------+        |                    |
                                   +--------------------+
```

### 2.3 Data Flow
1. **Treasury Issuance**: Admin → Backend → Smart Contracts → IPFS
2. **User Registration**: User → Frontend → API → Backend → Compliance Contract
3. **Treasury Purchase**: User → Smart Account → API → Backend → Trading Contract → Treasury Contract
4. **Yield Distribution**: Backend Service → Treasury Contract → User Wallets

### 2.4 Pectra-Enhanced Components
1. **Smart Accounts**: Implementation of EIP-7702 for programmable EOA wallets
2. **Layer 2 Integration**: Optimized data availability via EIP-7691 for efficient treasury operations
3. **Enhanced Staking**: Support for institutional validators through EIP-7251 and EIP-6110
4. **Advanced Execution**: Leveraging EIP-7685 for complex treasury operations

## 3. Smart Contract Specifications

### 3.1 TreasuryRegistry Contract

#### 3.1.1 Purpose
Central registry for all tokenized treasury securities on the platform, managing metadata and status.

#### 3.1.2 State Variables
```solidity
// Mapping from token ID to treasury information
mapping(bytes32 => TreasuryInfo) public treasuries;

// List of approved issuers
mapping(address => bool) public approvedIssuers;

// Mapping of delegated operators
mapping(address => mapping(address => bool)) public delegatedOperators;

// Platform administrator
address public admin;

// Supported treasury types
enum TreasuryType { TBILL, TNOTE, TBOND }

// Treasury status
enum TreasuryStatus { ACTIVE, MATURED, REDEEMED }

// Treasury information structure
struct TreasuryInfo {
    address tokenAddress;
    string metadataURI;
    TreasuryStatus status;
    uint256 currentPrice;
    uint256 issuanceDate;
    uint256 maturityDate;
    uint256 yieldRate;
    address issuer;
    bytes32 historicalDataHash; // For EIP-2935 block hash storage
}
```

#### 3.1.3 Key Functions
```solidity
// Register a new treasury
function registerTreasury(
    address tokenAddress,
    bytes32 tokenId,
    string calldata metadataURI,
    TreasuryType treasuryType,
    uint256 issuanceDate,
    uint256 maturityDate,
    uint256 yieldRate
) external returns (bytes32);

// Update treasury status
function updateTreasuryStatus(bytes32 tokenId, TreasuryStatus newStatus) external;

// Update treasury price
function updateTreasuryPrice(bytes32 tokenId, uint256 newPrice) external;

// Add approved issuer
function addApprovedIssuer(address issuer) external;

// Remove approved issuer
function removeApprovedIssuer(address issuer) external;

// Delegate operator permissions
function delegateOperator(address operator, bool approved) external;

// Execute operation as delegated operator
function executeAsDelegated(
    address owner,
    bytes32 tokenId,
    bytes calldata operationData
) external returns (bool);

// Get treasury details
function getTreasuryDetails(bytes32 tokenId) external view returns (TreasuryInfo memory);

// Get all treasuries
function getAllTreasuries() external view returns (bytes32[] memory);

// Get treasuries by type
function getTreasuriesByType(TreasuryType treasuryType) external view returns (bytes32[] memory);

// Get treasuries by status
function getTreasuriesByStatus(TreasuryStatus status) external view returns (bytes32[] memory);

// Check if issuer is approved
function isApprovedIssuer(address issuer) external view returns (bool);

// Check if operator is delegated for an owner
function isDelegatedOperator(address owner, address operator) external view returns (bool);
```

#### 3.1.4 Events
```solidity
// Emitted when a new treasury is registered
event TreasuryRegistered(bytes32 indexed tokenId, address tokenAddress, TreasuryType treasuryType);

// Emitted when treasury status is updated
event TreasuryStatusUpdated(bytes32 indexed tokenId, TreasuryStatus newStatus);

// Emitted when treasury price is updated
event TreasuryPriceUpdated(bytes32 indexed tokenId, uint256 newPrice);

// Emitted when issuer approval changes
event IssuerApprovalChanged(address indexed issuer, bool approved);

// Emitted when operator delegation changes
event OperatorDelegationChanged(address indexed owner, address indexed operator, bool approved);

// Emitted when delegated operation is executed
event DelegatedOperationExecuted(address indexed owner, address indexed operator, bytes32 indexed tokenId);
```

### 3.2 TreasuryToken Contract

#### 3.2.1 Purpose
ERC-1400 compatible security token representing fractional ownership of a specific treasury security, enhanced with Pectra capabilities.

#### 3.2.2 State Variables
```solidity
// ERC-1400 token data
string public name;
string public symbol;
uint8 public decimals;
uint256 public totalSupply;

// Treasury-specific data
bytes32 public treasuryId;
uint256 public faceValue;
uint256 public yieldRate;
uint256 public issuanceDate;
uint256 public maturityDate;
uint256 public lastYieldDistribution;
uint256 public yieldDistributionInterval;
address public issuer;
TreasuryRegistry public registry;

// Mapping from token holder to balance
mapping(address => uint256) private _balances;

// Mapping of authorized operators
mapping(address => mapping(address => bool)) private _authorizedOperator;

// Mapping for smart account code storage (EIP-7702)
mapping(address => bytes) private _accountCode;

// Treasury types (matching registry types)
enum TreasuryType { TBILL, TNOTE, TBOND }
TreasuryType public treasuryType;

// BLS signature verification for institutional operations
mapping(bytes => bool) private _verifiedSignatures;
```

#### 3.2.3 Key Functions
```solidity
// Initialize a new treasury token
constructor(
    string memory _name,
    string memory _symbol,
    uint256 _totalSupply,
    bytes32 _treasuryId,
    TreasuryType _treasuryType,
    uint256 _faceValue,
    uint256 _yieldRate,
    uint256 _issuanceDate,
    uint256 _maturityDate,
    address _issuer,
    address _registryAddress
);

// ERC-1400 transfer function with compliance checks
function transferWithData(
    address to,
    uint256 value,
    bytes calldata data
) external returns (bool);

// Check if transfer is valid
function canTransfer(
    address to,
    uint256 value,
    bytes calldata data
) external view returns (bool, byte, bytes32);

// Distribute yield to token holders
function distributeYield() external returns (bool);

// Calculate yield amount for token holder
function calculateYieldAmount(address holder) external view returns (uint256);

// Process maturity
function processMaturity() external returns (bool);

// Redeem tokens at maturity
function redeem(uint256 amount) external returns (bool);

// Issue new tokens (restricted to issuer)
function issue(address to, uint256 amount) external returns (bool);

// Set smart account code (EIP-7702)
function setAccountCode(bytes calldata code) external returns (bool);

// Execute smart account logic
function executeAccountCode(bytes calldata data) external returns (bytes memory);

// Validate BLS signature for institutional operations (EIP-2537)
function validateBLSSignature(
    bytes calldata signature,
    bytes calldata message,
    bytes calldata publicKey
) external returns (bool);
```

#### 3.2.4 Events
```solidity
// Emitted when yield is distributed
event YieldDistributed(uint256 totalAmount, uint256 distributionDate);

// Emitted when treasury matures
event TreasuryMatured(bytes32 indexed treasuryId, uint256 maturityDate);

// Emitted when tokens are redeemed
event TokensRedeemed(address indexed holder, uint256 amount);

// Emitted when new tokens are issued
event TokensIssued(address indexed to, uint256 amount);

// Emitted when account code is set
event AccountCodeSet(address indexed account, bytes32 codeHash);

// Emitted when account code is executed
event AccountCodeExecuted(address indexed account, bytes32 dataHash, bytes32 resultHash);

// Emitted when BLS signature is verified
event BLSSignatureVerified(bytes32 signatureHash, bytes32 messageHash, bool valid);
```

### 3.3 ComplianceModule Contract

#### 3.3.1 Purpose
Ensures regulatory compliance for treasury token transfers based on investor verification, enhanced with institutional capabilities.

#### 3.3.2 State Variables
```solidity
// Registry reference
TreasuryRegistry public registry;

// Mapping of investor verification status
mapping(address => VerificationStatus) public investorStatus;

// Mapping of investor jurisdictions
mapping(address => bytes2) public investorJurisdiction;

// Mapping of investment limits by verification status
mapping(uint8 => uint256) public investmentLimits;

// Mapping of institutional stakers
mapping(address => InstitutionalInfo) public institutionalStakers;

// Verification status enum
enum VerificationStatus {
    NONE,
    BASIC,
    VERIFIED,
    INSTITUTIONAL
}

// Institutional staker information
struct InstitutionalInfo {
    uint256 stakeAmount;
    uint256 validatorCount;
    bytes blsPublicKey;
    bool active;
}
```

#### 3.3.3 Key Functions
```solidity
// Check if transfer complies with regulations
function checkCompliance(
    address from,
    address to,
    uint256 amount,
    bytes32 treasuryId
) external view returns (bool, bytes memory);

// Set investor verification status
function setInvestorStatus(
    address investor,
    VerificationStatus status,
    bytes2 jurisdiction
) external;

// Set investment limit for verification level
function setInvestmentLimit(
    VerificationStatus status,
    uint256 limit
) external;

// Register institutional staker
function registerInstitutionalStaker(
    address institution,
    uint256 stakeAmount,
    bytes calldata blsPublicKey
) external returns (bool);

// Update institutional stake
function updateInstitutionalStake(
    uint256 newStakeAmount
) external returns (bool);

// Get investor details
function getInvestorDetails(address investor) 
    external 
    view 
    returns (VerificationStatus, bytes2, uint256);

// Get institutional staker details
function getInstitutionalDetails(address institution)
    external
    view
    returns (InstitutionalInfo memory);
```

#### 3.3.4 Events
```solidity
// Emitted when investor status changes
event InvestorStatusChanged(address indexed investor, VerificationStatus status);

// Emitted when investment limits change
event InvestmentLimitChanged(VerificationStatus status, uint256 newLimit);

// Emitted when institutional staker is registered
event InstitutionalStakerRegistered(address indexed institution, uint256 stakeAmount);

// Emitted when institutional stake is updated
event InstitutionalStakeUpdated(address indexed institution, uint256 newStakeAmount);
```

### 3.4 TradingModule Contract

#### 3.4.1 Purpose
Facilitates buying and selling of treasury tokens between users, with enhanced L2 integration and smart account capabilities.

#### 3.4.2 State Variables
```solidity
// Registry reference
TreasuryRegistry public registry;

// Order structure
struct Order {
    bytes32 orderId;
    bytes32 treasuryId;
    address owner;
    bool isBuyOrder;
    uint256 amount;
    uint256 price;
    uint256 expirationTime;
    bool isActive;
    bool isL2Bridged;
    bytes extraData;
}

// Trade structure
struct Trade {
    bytes32 tradeId;
    bytes32 treasuryId;
    address buyer;
    address seller;
    uint256 amount;
    uint256 price;
    uint256 timestamp;
    bool isL2Settled;
}

// L2 bridge information
struct L2BridgeInfo {
    address l2BridgeAddress;
    uint256 blobGasPrice;
    bool isActive;
}

// Mapping of orders by order ID
mapping(bytes32 => Order) public orders;

// Mapping of orders by treasury ID
mapping(bytes32 => bytes32[]) public treasuryOrders;

// Active buy orders by treasury
mapping(bytes32 => bytes32[]) public activeBuyOrders;

// Active sell orders by treasury
mapping(bytes32 => bytes32[]) public activeSellOrders;

// L2 bridge info by chain ID
mapping(uint256 => L2BridgeInfo) public l2Bridges;

// Platform fee in basis points (e.g., 25 = 0.25%)
uint16 public feeRate;

// Fee collector address
address public feeCollector;
```

#### 3.4.3 Key Functions
```solidity
// Create a new buy order
function createBuyOrder(
    bytes32 treasuryId,
    uint256 amount,
    uint256 price,
    uint256 expirationTime,
    bool useL2,
    uint256 l2ChainId,
    bytes calldata extraData
) external payable returns (bytes32);

// Create a new sell order
function createSellOrder(
    bytes32 treasuryId,
    uint256 amount,
    uint256 price,
    uint256 expirationTime,
    bool useL2,
    uint256 l2ChainId,
    bytes calldata extraData
) external returns (bytes32);

// Cancel an existing order
function cancelOrder(bytes32 orderId) external;

// Execute trade by matching buy and sell orders
function executeTrade(bytes32 buyOrderId, bytes32 sellOrderId) external returns (bytes32);

// Execute trade with smart account logic
function executeTradeWithAccount(
    bytes32 buyOrderId,
    bytes32 sellOrderId,
    bytes calldata accountData
) external returns (bytes32);

// Bridge order to L2 for execution
function bridgeOrderToL2(
    bytes32 orderId,
    uint256 l2ChainId
) external returns (bool);

// Settle trade from L2
function settleL2Trade(
    bytes32 buyOrderId,
    bytes32 sellOrderId,
    bytes calldata l2ProofData
) external returns (bytes32);

// Get all active orders for a treasury
function getActiveOrders(bytes32 treasuryId) external view returns (bytes32[] memory);

// Get order details
function getOrderDetails(bytes32 orderId) external view returns (Order memory);

// Update fee rate (admin only)
function updateFeeRate(uint16 newFeeRate) external;

// Set L2 bridge information
function setL2Bridge(
    uint256 l2ChainId,
    address bridgeAddress,
    uint256 blobGasPrice,
    bool isActive
) external;

// Update blob gas price for L2
function updateL2BlobGasPrice(
    uint256 l2ChainId,
    uint256 newBlobGasPrice
) external;

// Withdraw collected fees (admin only)
function withdrawFees() external;
```

#### 3.4.4 Events
```solidity
// Emitted when a new order is created
event OrderCreated(bytes32 indexed orderId, bytes32 indexed treasuryId, address indexed owner, bool isBuyOrder, bool isL2Bridged);

// Emitted when an order is canceled
event OrderCanceled(bytes32 indexed orderId);

// Emitted when a trade is executed
event TradeExecuted(bytes32 indexed tradeId, bytes32 indexed treasuryId, bytes32 buyOrderId, bytes32 sellOrderId, bool isL2Settled);

// Emitted when fee rate is updated
event FeeRateUpdated(uint16 newFeeRate);

// Emitted when an order is bridged to L2
event OrderBridgedToL2(bytes32 indexed orderId, uint256 l2ChainId);

// Emitted when a trade is settled from L2
event L2TradeSettled(bytes32 indexed tradeId, uint256 l2ChainId);

// Emitted when L2 bridge info is updated
event L2BridgeUpdated(uint256 l2ChainId, address bridgeAddress, uint256 blobGasPrice, bool isActive);

// Emitted when fees are withdrawn
event FeesWithdrawn(address indexed to, uint256 amount);
```

## 4. Backend Services

### 4.1 Alloy Integration Module

#### 4.1.1 Purpose
Interfaces with Ethereum blockchain using Alloy framework to interact with smart contracts, optimized for Pectra capabilities.

#### 4.1.2 Key Components
```rust
pub struct EthereumClient {
    provider: Provider,
    wallet: LocalWallet,
    chain_id: u64,
    supports_pectra: bool,
}

impl EthereumClient {
    pub async fn new(rpc_url: &str, private_key: &str, chain_id: u64) -> Result<Self, Error>;
    pub async fn deploy_contract(&self, bytecode: Vec<u8>, constructor_args: Vec<u8>) -> Result<Address, Error>;
    pub async fn call_contract<T: Tokenize>(&self, address: Address, function: &str, args: Vec<Token>) -> Result<T, Error>;
    pub async fn send_transaction(&self, address: Address, function: &str, args: Vec<Token>) -> Result<TransactionReceipt, Error>;
    pub async fn get_events<T: FromEvent>(&self, address: Address, event: &str, from_block: u64) -> Result<Vec<T>, Error>;
    pub async fn get_balance(&self, address: Address) -> Result<U256, Error>;
    pub async fn get_historical_block_hash(&self, block_number: u64) -> Result<H256, Error>;
    pub async fn verify_bls_signature(&self, signature: Vec<u8>, message: Vec<u8>, public_key: Vec<u8>) -> Result<bool, Error>;
    pub async fn send_blob_transaction(&self, address: Address, function: &str, args: Vec<Token>, blob_data: Vec<u8>) -> Result<TransactionReceipt, Error>;
    pub async fn check_smart_account_code(&self, address: Address) -> Result<Vec<u8>, Error>;
    pub async fn execute_smart_account(&self, address: Address, data: Vec<u8>) -> Result<Vec<u8>, Error>;
}
```

#### 4.1.3 Contract Wrappers
```rust
pub struct TreasuryRegistryClient {
    client: EthereumClient,
    contract_address: Address,
}

impl TreasuryRegistryClient {
    pub async fn new(client: EthereumClient, address: Address) -> Self;
    pub async fn register_treasury(&self, token_address: Address, metadata_uri: &str, treasury_type: TreasuryType, issuance_date: u64, maturity_date: u64, yield_rate: u16) -> Result<[u8; 32], Error>;
    pub async fn update_treasury_status(&self, token_id: [u8; 32], status: TreasuryStatus) -> Result<(), Error>;
    pub async fn update_treasury_price(&self, token_id: [u8; 32], new_price: U256) -> Result<(), Error>;
    pub async fn delegate_operator(&self, operator: Address, approved: bool) -> Result<(), Error>;
    pub async fn execute_as_delegated(&self, owner: Address, token_id: [u8; 32], operation_data: Vec<u8>) -> Result<bool, Error>;
    pub async fn get_treasury_details(&self, token_id: [u8; 32]) -> Result<TreasuryInfo, Error>;
    pub async fn get_all_treasuries(&self) -> Result<Vec<[u8; 32]>, Error>;
    pub async fn get_treasuries_by_type(&self, treasury_type: TreasuryType) -> Result<Vec<[u8; 32]>, Error>;
    pub async fn get_treasuries_by_status(&self, status: TreasuryStatus) -> Result<Vec<[u8; 32]>, Error>;
    pub async fn is_delegated_operator(&self, owner: Address, operator: Address) -> Result<bool, Error>;
}

pub struct TreasuryTokenClient {
    client: EthereumClient,
    contract_address: Address,
}

impl TreasuryTokenClient {
    pub async fn new(client: EthereumClient, address: Address) -> Self;
    pub async fn transfer_with_data(&self, to: Address, value: U256, data: Vec<u8>) -> Result<bool, Error>;
    pub async fn can_transfer(&self, to: Address, value: U256, data: Vec<u8>) -> Result<(bool, u8, [u8; 32]), Error>;
    pub async fn distribute_yield(&self) -> Result<bool, Error>;
    pub async fn calculate_yield_amount(&self, holder: Address) -> Result<U256, Error>;
    pub async fn process_maturity(&self) -> Result<bool, Error>;
    pub async fn redeem(&self, amount: U256) -> Result<bool, Error>;
    pub async fn issue(&self, to: Address, amount: U256) -> Result<bool, Error>;
    pub async fn set_account_code(&self, code: Vec<u8>) -> Result<bool, Error>;
    pub async fn execute_account_code(&self, data: Vec<u8>) -> Result<Vec<u8>, Error>;
    pub async fn validate_bls_signature(&self, signature: Vec<u8>, message: Vec<u8>, public_key: Vec<u8>) -> Result<bool, Error>;
    pub async fn balance_of(&self, account: Address) -> Result<U256, Error>;
    pub async fn total_supply(&self) -> Result<U256, Error>;
}

pub struct ComplianceClient {
    client: EthereumClient,
    contract_address: Address,
}

impl ComplianceClient {
    pub async fn new(client: EthereumClient, address: Address) -> Self;
    pub async fn check_compliance(&self, from: Address, to: Address, amount: U256, treasury_id: [u8; 32]) -> Result<(bool, Vec<u8>), Error>;
    pub async fn set_investor_status(&self, investor: Address, status: VerificationStatus, jurisdiction: [u8; 2]) -> Result<(), Error>;
    pub async fn set_investment_limit(&self, status: VerificationStatus, limit: U256) -> Result<(), Error>;
    pub async fn register_institutional_staker(&self, institution: Address, stake_amount: U256, bls_public_key: Vec<u8>) -> Result<bool, Error>;
    pub async fn update_institutional_stake(&self, new_stake_amount: U256) -> Result<bool, Error>;
    pub async fn get_investor_details(&self, investor: Address) -> Result<(VerificationStatus, [u8; 2], U256), Error>;
    pub async fn get_institutional_details(&self, institution: Address) -> Result<InstitutionalInfo, Error>;
}

pub struct TradingClient {
    client: EthereumClient,
    contract_address: Address,
}

impl TradingClient {
    pub async fn new(client: EthereumClient, address: Address) -> Self;
    pub async fn create_buy_order(&self, treasury_id: [u8; 32], amount: U256, price: U256, expiration_time: u64, use_l2: bool, l2_chain_id: u64, extra_data: Vec<u8>) -> Result<[u8; 32], Error>;
    pub async fn create_sell_order(&self, treasury_id: [u8; 32], amount: U256, price: U256, expiration_time: u64, use_l2: bool, l2_chain_id: u64, extra_data: Vec<u8>) -> Result<[u8; 32], Error>;
    pub async fn cancel_order(&self, order_id: [u8; 32]) -> Result<(), Error>;
    pub async fn execute_trade(&self, buy_order_id: [u8; 32], sell_order_id: [u8; 32]) -> Result<[u8; 32], Error>;
    pub async fn execute_trade_with_account(&self, buy_order_id: [u8; 32], sell_order_id: [u8; 32], account_data: Vec<u8>) -> Result<[u8; 32], Error>;
    pub async fn bridge_order_to_l2(&self, order_id: [u8; 32], l2_chain_id: u64) -> Result<bool, Error>;
    pub async fn settle_l2_trade(&self, buy_order_id: [u8; 32], sell_order_id: [u8; 32], l2_proof_data: Vec<u8>) -> Result<[u8; 32], Error>;
    pub async fn get_active_orders(&self, treasury_id: [u8; 32]) -> Result<Vec<[u8; 32]>, Error>;
    pub async fn get_order_details(&self, order_id: [u8; 32]) -> Result<Order, Error>;
    pub async fn set_l2_bridge(&self, l2_chain_id: u64, bridge_address: Address, blob_gas_price: U256, is_active: bool) -> Result<(), Error>;
}
```

### 4.2 Treasury Management Service

#### 4.2.1 Purpose
Handles treasury tokenization, issuance, and lifecycle management, enhanced with Pectra capabilities.

#### 4.2.2 Key Components
```rust
pub struct TreasuryService {
    registry_client: TreasuryRegistryClient,
    ipfs_client: IpfsClient,
}

impl TreasuryService {
    pub async fn new(registry_client: TreasuryRegistryClient, ipfs_client: IpfsClient) -> Self;
    
    pub async fn create_treasury_token(
        &self,
        name: String,
        symbol: String,
        total_supply: u64,
        treasury_type: TreasuryType,
        face_value: U256,
        yield_rate: u16,
        issuance_date: u64,
        maturity_date: u64,
        issuer: Address,
    ) -> Result<TreasuryTokenData, Error>;
    
    pub async fn get_treasury_details(&self, token_id: [u8; 32]) -> Result<TreasuryDetails, Error>;
    
    pub async fn get_all_treasuries(&self) -> Result<Vec<TreasuryOverview>, Error>;
    
    pub async fn get_treasuries_by_type(&self, treasury_type: TreasuryType) -> Result<Vec<TreasuryOverview>, Error>;
    
    pub async fn distribute_yield(&self, token_id: [u8; 32]) -> Result<YieldDistributionResult, Error>;
    
    pub async fn process_maturity(&self, token_id: [u8; 32]) -> Result<MaturityResult, Error>;
    
    pub async fn update_treasury_price(&self, token_id: [u8; 32], new_price: U256) -> Result<(), Error>;
    
    pub async fn upload_treasury_metadata(&self, metadata: TreasuryMetadata) -> Result<String, Error>;
    
    pub async fn get_treasury_metadata(&self, uri: &str) -> Result<TreasuryMetadata, Error>;
    
    pub async fn delegate_treasury_operations(
        &self,
        owner: Address,
        operator: Address,
        approved: bool
    ) -> Result<(), Error>;
    
    pub async fn execute_treasury_operation(
        &self,
        owner: Address,
        token_id: [u8; 32],
        operation_data: Vec<u8>
    ) -> Result<bool, Error>;
    
    pub async fn set_account_code(
        &self,
        account: Address,
        code: Vec<u8>
    ) -> Result<bool, Error>;
    
    pub async fn execute_treasury_with_account(
        &self,
        account: Address,
        token_id: [u8; 32],
        data: Vec<u8>
    ) -> Result<Vec<u8>, Error>;
}

pub struct YieldSchedulerService {
    treasury_service: TreasuryService,
    registry_client: TreasuryRegistryClient,
}

impl YieldSchedulerService {
    pub async fn new(treasury_service: TreasuryService, registry_client: TreasuryRegistryClient) -> Self;
    
    pub async fn check_and_distribute_yields(&self) -> Result<Vec<YieldDistributionResult>, Error>;
    
    pub async fn check_and_process_maturities(&self) -> Result<Vec<MaturityResult>, Error>;
    
    pub async fn run_scheduler(&self, interval_seconds: u64) -> JoinHandle<()>;
    
    pub async fn create_historical_snapshot(&self, treasury_id: [u8; 32]) -> Result<bytes32, Error>;
    
    pub async fn verify_historical_data(&self, treasury_id: [u8; 32], block_number: u64) -> Result<bool, Error>;
}
```

### 4.3 Trading Service

#### 4.3.1 Purpose
Manages order book, trade execution, and market data, with enhanced L2 integration capabilities.

#### 4.3.2 Key Components
```rust
pub struct TradingService {
    trading_client: TradingClient,
    treasury_client: TreasuryTokenClient,
    registry_client: TreasuryRegistryClient,
    l2_clients: HashMap<u64, L2Client>,
}

impl TradingService {
    pub async fn new(
        trading_client: TradingClient,
        treasury_client: TreasuryTokenClient,
        registry_client: TreasuryRegistryClient,
    ) -> Self;
    
    pub async fn add_l2_client(
        &mut self,
        chain_id: u64,
        client: L2Client
    ) -> Result<(), Error>;
    
    pub async fn create_buy_order(
        &self,
        user_address: Address,
        treasury_id: [u8; 32],
        amount: u64,
        price: U256,
        expiration_time: u64,
        use_l2: bool,
        l2_chain_id: Option<u64>,
        extra_data: Option<Vec<u8>>
    ) -> Result<OrderData, Error>;
    
    pub async fn create_sell_order(
        &self,
        user_address: Address,
        treasury_id: [u8; 32],
        amount: u64,
        price: U256,
        expiration_time: u64,
        use_l2: bool,
        l2_chain_id: Option<u64>,
        extra_data: Option<Vec<u8>>
    ) -> Result<OrderData, Error>;
    
    pub async fn cancel_order(
        &self,
        user_address: Address,
        order_id: [u8; 32],
    ) -> Result<(), Error>;
    
    pub async fn execute_trade(
        &self,
        user_address: Address,
        buy_order_id: [u8; 32],
        sell_order_id: [u8; 32],
    ) -> Result<TradeData, Error>;
    
    pub async fn execute_trade_with_account(
        &self,
        user_address: Address,
        buy_order_id: [u8; 32],
        sell_order_id: [u8; 32],
        account_data: Vec<u8>
    ) -> Result<TradeData, Error>;
    
    pub async fn bridge_order_to_l2(
        &self,
        user_address: Address,
        order_id: [u8; 32],
        l2_chain_id: u64
    ) -> Result<L2BridgeResult, Error>;
    
    pub async fn settle_l2_trade(
        &self,
        user_address: Address,
        buy_order_id: [u8; 32],
        sell_order_id: [u8; 32],
        l2_proof_data: Vec<u8>
    ) -> Result<TradeData, Error>;
    
    pub async fn get_order_book(
        &self,
        treasury_id: [u8; 32],
    ) -> Result<OrderBook, Error>;
    
    pub async fn get_l2_order_book(
        &self,
        treasury_id: [u8; 32],
        l2_chain_id: u64
    ) -> Result<OrderBook, Error>;
    
    pub async fn get_user_orders(
        &self,
        user_address: Address,
    ) -> Result<Vec<OrderData>, Error>;
    
    pub async fn get_recent_trades(
        &self,
        treasury_id: [u8; 32],
        limit: u32,
    ) -> Result<Vec<TradeData>, Error>;
    
    pub async fn match_orders(&self) -> Result<Vec<TradeData>, Error>;
    
    pub async fn match_l2_orders(&self, l2_chain_id: u64) -> Result<Vec<L2TradeData>, Error>;
    
    pub async fn sync_l2_state(&self, l2_chain_id: u64) -> Result<L2SyncResult, Error>;
}

pub struct L2Client {
    rpc_client: Provider,
    bridge_address: Address,
    chain_id: u64,
    blob_gas_price: U256,
}

impl L2Client {
    pub async fn new(rpc_url: &str, bridge_address: Address, chain_id: u64) -> Result<Self, Error>;
    pub async fn get_orders(&self, treasury_id: [u8; 32]) -> Result<Vec<L2Order>, Error>;
    pub async fn get_trades(&self, treasury_id: [u8; 32], limit: u32) -> Result<Vec<L2Trade>, Error>;
    pub async fn generate_proof(&self, buy_order_id: [u8; 32], sell_order_id: [u8; 32]) -> Result<Vec<u8>, Error>;
    pub async fn estimate_blob_gas(&self, data_size: usize) -> Result<U256, Error>;
    pub async fn get_state_root(&self) -> Result<H256, Error>;
}
```

### 4.4 User Management Service

#### 4.4.1 Purpose
Handles user registration, verification, and portfolio management, with enhanced smart account and institutional features.

#### 4.4.2 Key Components
```rust
pub struct UserService {
    compliance_client: ComplianceClient,
    treasury_client: TreasuryTokenClient,
    verification_provider: Box<dyn VerificationProvider>,
}

impl UserService {
    pub async fn new(
        compliance_client: ComplianceClient,
        treasury_client: TreasuryTokenClient,
        verification_provider: Box<dyn VerificationProvider>,
    ) -> Self;
    
    pub async fn register_user(
        &self,
        user_address: Address,
        email: String,
    ) -> Result<UserData, Error>;
    
    pub async fn verify_user(
        &self,
        user_address: Address,
        verification_data: VerificationData,
    ) -> Result<VerificationStatus, Error>;
    
    pub async fn register_institutional_user(
        &self,
        user_address: Address,
        verification_data: InstitutionalVerificationData,
        stake_amount: U256,
        bls_public_key: Vec<u8>
    ) -> Result<InstitutionalRegistrationResult, Error>;
    
    pub async fn get_user_portfolio(
        &self,
        user_address: Address,
    ) -> Result<UserPortfolio, Error>;
    
    pub async fn get_user_verification_status(
        &self,
        user_address: Address,
    ) -> Result<VerificationDetails, Error>;
    
    pub async fn calculate_total_yield(
        &self,
        user_address: Address,
    ) -> Result<U256, Error>;
    
    pub async fn get_investment_limits(
        &self,
        user_address: Address,
    ) -> Result<U256, Error>;
    
    pub async fn setup_smart_account(
        &self,
        user_address: Address,
        account_code: Vec<u8>
    ) -> Result<SmartAccountSetupResult, Error>;
    
    pub async fn get_smart_account_code(
        &self,
        user_address: Address
    ) -> Result<Vec<u8>, Error>;
    
    pub async fn execute_smart_account_operation(
        &self,
        user_address: Address,
        operation_data: Vec<u8>
    ) -> Result<Vec<u8>, Error>;
    
    pub async fn set_delegated_operator(
        &self,
        user_address: Address,
        operator_address: Address,
        approved: bool
    ) -> Result<bool, Error>;
    
    pub async fn get_delegated_operators(
        &self,
        user_address: Address
    ) -> Result<Vec<Address>, Error>;
}
```

## 5. API Layer

### 5.1 REST API Endpoints

#### 5.1.1 Treasury Management Endpoints
```
GET /api/treasuries
GET /api/treasuries/{treasuryId}
GET /api/treasuries/type/{type}
GET /api/treasuries/status/{status}
POST /api/treasuries (admin only)
PUT /api/treasuries/{treasuryId}/price (admin only)
PUT /api/treasuries/{treasuryId}/status (admin only)
GET /api/treasuries/{treasuryId}/history/{blockNumber}
POST /api/treasuries/{treasuryId}/delegate
POST /api/treasuries/{treasuryId}/execute
```

#### 5.1.2 Trading Endpoints
```
GET /api/trading/orders/{treasuryId}
GET /api/trading/orders/user/{userAddress}
GET /api/trading/trades/{treasuryId}
POST /api/trading/orders/buy
POST /api/trading/orders/sell
DELETE /api/trading/orders/{orderId}
POST /api/trading/execute
POST /api/trading/execute/smart-account
POST /api/trading/orders/{orderId}/bridge
GET /api/trading/l2/{chainId}/orders/{treasuryId}
GET /api/trading/l2/{chainId}/trades/{treasuryId}
POST /api/trading/l2/settle
```

#### 5.1.3 User Management Endpoints
```
POST /api/users/register
POST /api/users/verify
POST /api/users/register/institutional
GET /api/users/{userAddress}/portfolio
GET /api/users/{userAddress}/verification
GET /api/users/{userAddress}/yield
POST /api/users/{userAddress}/smart-account
GET /api/users/{userAddress}/smart-account
POST /api/users/{userAddress}/smart-account/execute
POST /api/users/{userAddress}/delegate
GET /api/users/{userAddress}/delegates
```

#### 5.1.4 Admin Endpoints
```
POST /api/admin/issuers
DELETE /api/admin/issuers/{issuerAddress}
PUT /api/admin/compliance/limits
GET /api/admin/users
GET /api/admin/statistics
POST /api/admin/l2/bridges
PUT /api/admin/l2/bridges/{chainId}
GET /api/admin/l2/statistics
```

### 5.2 API Request/Response Models

#### 5.2.1 Treasury Models
```rust
// Treasury creation request
pub struct CreateTreasuryRequest {
    pub name: String,
    pub symbol: String,
    pub total_supply: u64,
    pub treasury_type: String,
    pub face_value: String,
    pub yield_rate: u16,
    pub issuance_date: u64,
    pub maturity_date: u64,
    pub issuer: String,
}

// Treasury details response
pub struct TreasuryDetailsResponse {
    pub treasury_id: String,
    pub token_address: String,
    pub name: String,
    pub symbol: String,
    pub treasury_type: String,
    pub face_value: String,
    pub yield_rate: u16,
    pub issuance_date: u64,
    pub maturity_date: u64,
    pub current_price: String,
    pub status: String,
    pub issuer: String,
    pub total_supply: String,
    pub metadata_uri: String,
    pub historical_data_hash: String,
}

// Treasury list response
pub struct TreasuryListResponse {
    pub treasuries: Vec<TreasuryOverviewResponse>,
}

// Treasury overview
pub struct TreasuryOverviewResponse {
    pub treasury_id: String,
    pub name: String,
    pub symbol: String,
    pub treasury_type: String,
    pub yield_rate: u16,
    pub maturity_date: u64,
    pub current_price: String,
    pub status: String,
}

// Price update request
pub struct UpdatePriceRequest {
    pub new_price: String,
}

// Delegate operator request
pub struct DelegateOperatorRequest {
    pub operator_address: String,
    pub approved: bool,
}

// Treasury execution request
pub struct TreasuryExecutionRequest {
    pub operation_data: String,
}
```

#### 5.2.2 Trading Models
```rust
// Buy order request
pub struct BuyOrderRequest {
    pub treasury_id: String,
    pub amount: u64,
    pub price: String,
    pub expiration_time: u64,
    pub use_l2: bool,
    pub l2_chain_id: Option<u64>,
    pub extra_data: Option<String>,
}

// Sell order request
pub struct SellOrderRequest {
    pub treasury_id: String,
    pub amount: u64,
    pub price: String,
    pub expiration_time: u64,
    pub use_l2: bool,
    pub l2_chain_id: Option<u64>,
    pub extra_data: Option<String>,
}

// Order response
pub struct OrderResponse {
    pub order_id: String,
    pub treasury_id: String,
    pub is_buy_order: bool,
    pub owner: String,
    pub amount: u64,
    pub price: String,
    pub expiration_time: u64,
    pub is_active: bool,
    pub is_l2_bridged: bool,
    pub l2_chain_id: Option<u64>,
    pub extra_data: Option<String>,
}

// Trade execution request
pub struct TradeExecutionRequest {
    pub buy_order_id: String,
    pub sell_order_id: String,
}

// Smart account trade execution request
pub struct SmartAccountTradeRequest {
    pub buy_order_id: String,
    pub sell_order_id: String,
    pub account_data: String,
}

// Bridge order request
pub struct BridgeOrderRequest {
    pub l2_chain_id: u64,
}

// L2 trade settlement request
pub struct L2SettlementRequest {
    pub buy_order_id: String,
    pub sell_order_id: String,
    pub l2_proof_data: String,
}

// Trade response
pub struct TradeResponse {
    pub trade_id: String,
    pub treasury_id: String,
    pub buyer: String,
    pub seller: String,
    pub amount: u64,
    pub price: String,
    pub timestamp: u64,
    pub is_l2_settled: bool,
    pub l2_chain_id: Option<u64>,
}

// Order book response
pub struct OrderBookResponse {
    pub treasury_id: String,
    pub buy_orders: Vec<OrderResponse>,
    pub sell_orders: Vec<OrderResponse>,
    pub l2_orders: Option<L2OrdersResponse>,
}

// L2 orders response
pub struct L2OrdersResponse {
    pub chain_id: u64,
    pub buy_orders: Vec<OrderResponse>,
    pub sell_orders: Vec<OrderResponse>,
    pub last_updated: u64,
}
```

#### 5.2.3 User Models
```rust
// User registration request
pub struct UserRegistrationRequest {
    pub email: String,
    pub wallet_address: String,
}

// User verification request
pub struct UserVerificationRequest {
    pub wallet_address: String,
    pub full_name: String,
    pub date_of_birth: String,
    pub address: AddressData,
    pub government_id: IdData,
    pub jurisdiction: String,
}

// Institutional registration request
pub struct InstitutionalRegistrationRequest {
    pub wallet_address: String,
    pub institution_name: String,
    pub registration_number: String,
    pub jurisdiction: String,
    pub representative: RepresentativeData,
    pub stake_amount: String,
    pub bls_public_key: String,
}

// Representative data
pub struct RepresentativeData {
    pub full_name: String,
    pub position: String,
    pub email: String,
    pub phone: String,
}

// Address data
pub struct AddressData {
    pub street: String,
    pub city: String,
    pub state: String,
    pub country: String,
    pub postal_code: String,
}

// ID data
pub struct IdData {
    pub id_type: String,
    pub id_number: String,
    pub expiration_date: String,
    pub issuing_country: String,
}

// Smart account setup request
pub struct SmartAccountSetupRequest {
    pub account_code: String,
}

// Smart account execution request
pub struct SmartAccountExecutionRequest {
    pub operation_data: String,
}

// User portfolio response
pub struct UserPortfolioResponse {
    pub wallet_address: String,
    pub holdings: Vec<HoldingResponse>,
    pub total_value: String,
    pub pending_yield: String,
    pub smart_account_enabled: bool,
    pub delegate_operators: Vec<String>,
}

// Holding response
pub struct HoldingResponse {
    pub treasury_id: String,
    pub name: String,
    pub symbol: String,
    pub balance: String,
    pub value: String,
    pub yield_rate: u16,
    pub maturity_date: u64,
}

// Verification status response
pub struct VerificationStatusResponse {
    pub wallet_address: String,
    pub status: String,
    pub jurisdiction: String,
    pub investment_limit: String,
    pub verification_date: u64,
    pub institutional_details: Option<InstitutionalDetailsResponse>,
}

// Institutional details response
pub struct InstitutionalDetailsResponse {
    pub stake_amount: String,
    pub validator_count: u64,
    pub active: bool,
    pub bls_public_key: String,
}

// Smart account response
pub struct SmartAccountResponse {
    pub wallet_address: String,
    pub code_hash: String,
    pub is_enabled: bool,
    pub last_updated: u64,
}

// Delegate operators response
pub struct DelegateOperatorsResponse {
    pub wallet_address: String,
    pub operators: Vec<OperatorResponse>,
}

// Operator response
pub struct OperatorResponse {
    pub operator_address: String,
    pub approved_since: u64,
}
```

## 6. Frontend Components

### 6.1 Page Structure
1. **Landing Page**: Introduction to platform and treasury tokenization
2. **Treasury Marketplace**: Browse and search available treasury tokens
3. **Portfolio Dashboard**: View owned treasuries and pending yields
4. **Trading Interface**: Buy/sell treasury tokens with L2 options
5. **User Profile**: Account details, verification status, and smart account management
6. **Admin Panel**: Treasury issuance and platform management (for admins only)

### 6.2 Component Hierarchy
```
App
├── Header
│   ├── Logo
│   ├── Navigation
│   └── WalletConnect
├── Pages
│   ├── LandingPage
│   ├── MarketplacePage
│   │   ├── TreasuryFilter
│   │   ├── TreasuryList
│   │   └── TreasuryDetails
│   ├── PortfolioPage
│   │   ├── PortfolioSummary
│   │   ├── TreasuryHoldings
│   │   ├── YieldTracker
│   │   └── DelegateManagement
│   ├── TradingPage
│   │   ├── OrderBook
│   │   ├── L2OrderBook
│   │   ├── TradeForm
│   │   ├── UserOrders
│   │   ├── TradeHistory
│   │   └── L2BridgeForm
│   ├── ProfilePage
│   │   ├── VerificationStatus
│   │   ├── VerificationForm
│   │   ├── InstitutionalForm
│   │   ├── SmartAccountManager
│   │   └── AccountSettings
│   └── AdminPage
│       ├── TreasuryIssuance
│       ├── UserManagement
│       ├── ComplianceSettings
│       ├── L2BridgeSettings
│       └── PlatformStatistics
└── Footer
```

### 6.3 Key Components Specifications

#### 6.3.1 SmartAccountManager Component
```jsx
import React, { useState, useEffect } from 'react';
import { setupSmartAccount, getSmartAccountCode, executeSmartAccount } from '../api/userApi';
import { useWallet } from '../contexts/WalletContext';
import CodeEditor from './CodeEditor';

const SmartAccountManager = () => {
  const { address } = useWallet();
  
  const [accountCode, setAccountCode] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [codeHash, setCodeHash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [operationData, setOperationData] = useState('');
  const [executionResult, setExecutionResult] = useState(null);
  
  useEffect(() => {
    const loadAccountCode = async () => {
      if (!address) return;
      
      try {
        setLoading(true);
        const response = await getSmartAccountCode(address);
        setAccountCode(response.code || '');
        setIsEnabled(response.is_enabled || false);
        setCodeHash(response.code_hash || null);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    loadAccountCode();
  }, [address]);
  
  const handleCodeChange = (newCode) => {
    setAccountCode(newCode);
  };
  
  const handleSetupAccount = async () => {
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);
      
      const response = await setupSmartAccount(address, accountCode);
      setIsEnabled(true);
      setCodeHash(response.code_hash);
      setSuccess('Smart account code successfully deployed!');
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };
  
  const handleExecuteOperation = async () => {
    try {
      setError(null);
      setExecutionResult(null);
      setExecuting(true);
      
      const response = await executeSmartAccount(address, operationData);
      setExecutionResult(response);
      setExecuting(false);
    } catch (err) {
      setError(err.message);
      setExecuting(false);
    }
  };
  
  const getDefaultAccountCode = () => {
    return `
// Simple treasury management account code
function main(data) {
    // Parse operation data
    const operation = JSON.parse(data);
    
    // Define available operations
    const operations = {
        // Automatically reinvest yield into the same treasury
        REINVEST_YIELD: async function() {
            const treasuryId = operation.treasuryId;
            const amount = operation.amount;
            
            // Check current yield
            const yieldAmount = await getYieldAmount(treasuryId);
            
            // If yield is sufficient, reinvest
            if (yieldAmount >= amount) {
                await claimYield(treasuryId);
                await buyTreasury(treasuryId, yieldAmount);
                return { success: true, message: "Yield reinvested" };
            }
            
            return { success: false, message: "Insufficient yield" };
        },
        
        // Set up recurring purchases
        SCHEDULE_PURCHASE: function() {
            const treasuryId = operation.treasuryId;
            const amount = operation.amount;
            const interval = operation.interval;
            
            // Store scheduled purchase in account state
            scheduleTask(treasuryId, amount, interval);
            
            return { success: true, message: "Purchase scheduled" };
        }
    };
    
    // Execute the requested operation
    if (operations[operation.type]) {
        return operations[operation.type]();
    }
    
    // Return error for unknown operation
    return { success: false, message: "Unknown operation" };
}
    `;
  };
  
  return (
    <div className="smart-account-manager">
      <h2>Smart Account Manager</h2>
      
      <div className="account-status">
        <h3>Account Status</h3>
        {loading ? (
          <div className="loading">Loading account status...</div>
        ) : (
          <div className="status-details">
            <div className="status-item">
              <span className="label">Enabled:</span>
              <span className={`value ${isEnabled ? 'enabled' : 'disabled'}`}>
                {isEnabled ? 'Yes' : 'No'}
              </span>
            </div>
            
            {codeHash && (
              <div className="status-item">
                <span className="label">Code Hash:</span>
                <span className="value code-hash">{codeHash}</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
      
      {success && (
        <div className="success-message">
          {success}
        </div>
      )}
      
      <div className="account-code-editor">
        <h3>Account Code</h3>
        <p className="description">
          Define your smart account logic below. This code will execute when your account is triggered.
        </p>
        
        {accountCode === '' && !loading && (
          <button 
            className="template-button"
            onClick={() => setAccountCode(getDefaultAccountCode())}
          >
            Load Template
          </button>
        )}
        
        <CodeEditor
          value={accountCode}
          onChange={handleCodeChange}
          language="javascript"
          height="300px"
          disabled={loading}
        />
        
        <button
          className="setup-button"
          onClick={handleSetupAccount}
          disabled={loading || !accountCode}
        >
          {loading ? 'Deploying...' : isEnabled ? 'Update Smart Account' : 'Deploy Smart Account'}
        </button>
      </div>
      
      {isEnabled && (
        <div className="account-execution">
          <h3>Execute Operation</h3>
          <p className="description">
            Test your smart account by executing an operation below.
          </p>
          
          <textarea
            className="operation-data"
            value={operationData}
            onChange={(e) => setOperationData(e.target.value)}
            placeholder='{"type":"REINVEST_YIELD","treasuryId":"0x123...","amount":"1000000000000000000"}'
            rows={5}
          />
          
          <button
            className="execute-button"
            onClick={handleExecuteOperation}
            disabled={executing || !operationData}
          >
            {executing ? 'Executing...' : 'Execute Operation'}
          </button>
          
          {executionResult && (
            <div className="execution-result">
              <h4>Execution Result</h4>
              <pre>{JSON.stringify(executionResult, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
      
      <div className="account-info">
        <h3>What can you do with Smart Accounts?</h3>
        <ul>
          <li>Create automated trading strategies for treasury tokens</li>
          <li>Set up yield reinvestment rules</li>
          <li>Establish portfolio rebalancing logic</li>
          <li>Configure conditional transfers with custom rules</li>
          <li>Create scheduled operations for your treasuries</li>
          <li>Set up delegation rules to financial advisors or managers</li>
        </ul>
      </div>
    </div>
  );
};

export default SmartAccountManager;
```

#### 6.3.2 L2BridgeForm Component
```jsx
import React, { useState, useEffect } from 'react';
import { bridgeOrderToL2, getL2ChainInfo } from '../api/tradingApi';
import { useWallet } from '../contexts/WalletContext';

const L2BridgeForm = ({ order, onOrderBridged }) => {
  const { address } = useWallet();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [l2Chains, setL2Chains] = useState([]);
  const [selectedChain, setSelectedChain] = useState(null);
  const [gasEstimates, setGasEstimates] = useState({});
  
  useEffect(() => {
    const loadL2Chains = async () => {
      try {
        const chains = await getL2ChainInfo();
        setL2Chains(chains);
        if (chains.length > 0) {
          setSelectedChain(chains[0].chain_id);
        }
      } catch (err) {
        setError("Error loading L2 chain information: " + err.message);
      }
    };
    
    loadL2Chains();
  }, []);
  
  useEffect(() => {
    if (selectedChain && order) {
      estimateGas();
    }
  }, [selectedChain, order]);
  
  const estimateGas = async () => {
    try {
      // This would call an API to estimate gas costs on both L1 and L2
      // Simplified for this example
      const orderSizeInBytes = JSON.stringify(order).length;
      
      const selectedChainInfo = l2Chains.find(chain => chain.chain_id === selectedChain);
      if (!selectedChainInfo) return;
      
      const blobGasPrice = parseFloat(selectedChainInfo.blob_gas_price);
      const l1GasCost = 21000 + (orderSizeInBytes * 16); // Base tx + data
      const l2GasCost = orderSizeInBytes * 2; // Simplified L2 gas calc
      const l1Cost = l1GasCost * 20e9; // 20 gwei gas price
      const l2Cost = l2GasCost * 0.1e9; // 0.1 gwei gas price
      const blobCost = orderSizeInBytes * blobGasPrice;
      
      setGasEstimates({
        l1Gas: l1GasCost,
        l2Gas: l2GasCost,
        l1Cost: l1Cost,
        l2Cost: l2Cost,
        blobCost: blobCost,
        totalCost: l1Cost + l2Cost + blobCost,
        savingsPercent: Math.round(((l1Cost - (l2Cost + blobCost)) / l1Cost) * 100)
      });
    } catch (err) {
      setError("Error estimating gas: " + err.message);
    }
  };
  
  const handleBridge = async () => {
    if (!order || !selectedChain) return;