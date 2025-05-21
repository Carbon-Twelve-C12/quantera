// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../interfaces/IL2Bridge.sol";
import "./L2BridgeGasOptimizer.sol";

/**
 * @title L2Bridge
 * @dev Contract for bridging orders and trades between L1 and various L2 chains
 * with enhanced cross-chain capabilities and Pectra EIP support
 */
contract L2Bridge is IL2Bridge, AccessControl, Pausable, ReentrancyGuard {
    using Counters for Counters.Counter;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // Roles - grouped together for better readability and organization
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");

    // Constants
    uint256 public constant GWEI = 1e9;

    // Counters - consolidated counter management
    Counters.Counter private _messageIdCounter;
    Counters.Counter private _orderIdCounter;
    Counters.Counter private _tradeIdCounter;

    // Mappings - organized by related functionality
    mapping(bytes32 => CrossChainMessage) public messages;
    mapping(uint64 => L2ChainInfo) public chains;
    
    // Message tracking
    mapping(address => bytes32[]) public senderMessages;
    mapping(uint64 => bytes32[]) public chainMessages;
    
    // Order and trade tracking
    mapping(bytes32 => bytes32) public messageIdByOrderId;
    mapping(bytes32 => bytes32) public messageIdByTradeId;
    mapping(address => OrderBridgingRequest[]) public userOrders;
    mapping(address => TradeSettlementRequest[]) public userTrades;
    
    // Message processing state
    mapping(bytes32 => bool) public processedMessages;
    
    // Gas optimizer
    L2BridgeGasOptimizer public gasOptimizer;

    // Chain-specific limits - grouped related configuration
    uint256 public maxRetryCount = 3;
    uint256 public defaultExpirationPeriod = 7 days;
    
    // Domain separator for EIP-712 signatures
    bytes32 private immutable _DOMAIN_SEPARATOR;
    
    // Type hash constants
    bytes32 private constant ORDER_TYPEHASH = keccak256("Order(bytes32 orderId,bytes32 treasuryId,address user,bool isBuy,uint256 amount,uint256 price,uint64 expiration,uint256 destinationChainId)");

    // Events
    event ChainAdded(uint64 indexed chainId, string name, L2Chain chainType);
    event ChainUpdated(uint64 indexed chainId, string name, bool enabled);
    event MessageSent(bytes32 indexed messageId, uint64 indexed destinationChainId, address indexed sender);
    event MessageReceived(bytes32 indexed messageId, uint64 indexed sourceChainId, address indexed recipient);
    event MessageStatusUpdated(bytes32 indexed messageId, MessageStatus status);
    event OrderBridged(bytes32 indexed orderId, bytes32 indexed messageId, uint64 indexed destinationChainId);
    event TradeSettled(bytes32 indexed tradeId, bytes32 indexed messageId, uint64 indexed destinationChainId);
    event MessageRetried(bytes32 indexed messageId, uint64 indexed destinationChainId);
    event BlobDataUsed(bytes32 indexed messageId, uint64 indexed chainId, uint256 dataSize);
    event BatchMessageSent(bytes32[] messageIds, uint64 indexed destinationChainId, address indexed sender);

    // Constructor
    constructor(address gasOptimizerAddress) {
        require(gasOptimizerAddress != address(0), "Gas optimizer address cannot be zero");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(RELAYER_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        
        gasOptimizer = L2BridgeGasOptimizer(gasOptimizerAddress);
        
        _DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("Quantera L2Bridge"),
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );
    }

    //--------------------------------------------------------------------------
    // Chain Management Functions
    //--------------------------------------------------------------------------

    /**
     * @dev Add a new L2 chain
     * @param chainId The chain ID
     * @param chainType The type of L2 chain
     * @param name The name of the chain
     * @param bridgeAddress The address of the bridge on the L2 chain
     * @param rollupAddress The address of the rollup contract (if applicable)
     * @param verificationBlocks Number of blocks to wait for verification
     * @param gasTokenSymbol Symbol of the gas token on the L2
     * @param nativeTokenPriceUsd Price of native token in USD (scaled by 1e18)
     * @param averageBlockTime Average block time in seconds
     * @param blobEnabled Whether the chain supports EIP-7691 blob data
     * @param maxMessageSize Maximum message size in bytes
     */
    function addChain(
        uint64 chainId,
        L2Chain chainType,
        string calldata name,
        address bridgeAddress,
        address rollupAddress,
        uint64 verificationBlocks,
        string calldata gasTokenSymbol,
        uint256 nativeTokenPriceUsd,
        uint64 averageBlockTime,
        bool blobEnabled,
        uint64 maxMessageSize
    ) external onlyRole(ADMIN_ROLE) {
        require(chains[chainId].chainId == 0, "Chain already exists");
        
        L2ChainInfo storage chain = chains[chainId];
        chain.chainId = chainId;
        chain.chainType = chainType;
        chain.name = name;
        chain.enabled = true;
        chain.bridgeAddress = bridgeAddress;
        chain.rollupAddress = rollupAddress;
        chain.verificationBlocks = verificationBlocks;
        chain.gasTokenSymbol = gasTokenSymbol;
        chain.nativeTokenPriceUsd = nativeTokenPriceUsd;
        chain.averageBlockTime = averageBlockTime;
        chain.blob_enabled = blobEnabled;
        chain.maxMessageSize = maxMessageSize;
        
        emit ChainAdded(chainId, name, chainType);
    }

    /**
     * @dev Update an existing L2 chain
     * @param chainId The chain ID to update
     * @param bridgeAddress The address of the bridge on the L2 chain
     * @param verificationBlocks Number of blocks to wait for verification
     * @param nativeTokenPriceUsd Price of native token in USD (scaled by 1e18)
     * @param averageBlockTime Average block time in seconds
     * @param enabled Whether the chain is enabled
     * @param blobEnabled Whether the chain supports EIP-7691 blob data
     */
    function updateChain(
        uint64 chainId,
        address bridgeAddress,
        uint64 verificationBlocks,
        uint256 nativeTokenPriceUsd,
        uint64 averageBlockTime,
        bool enabled,
        bool blobEnabled
    ) external onlyRole(ADMIN_ROLE) {
        require(chains[chainId].chainId != 0, "Chain does not exist");
        
        L2ChainInfo storage chain = chains[chainId];
        chain.bridgeAddress = bridgeAddress;
        chain.verificationBlocks = verificationBlocks;
        chain.nativeTokenPriceUsd = nativeTokenPriceUsd;
        chain.averageBlockTime = averageBlockTime;
        chain.enabled = enabled;
        chain.blob_enabled = blobEnabled;
        
        emit ChainUpdated(chainId, chain.name, enabled);
    }

    /**
     * @dev Check if a chain is supported and enabled
     * @param chainId The chain ID to check
     * @return True if the chain is supported and enabled
     */
    function isChainSupported(uint64 chainId) public view returns (bool) {
        return chains[chainId].chainId != 0 && chains[chainId].enabled;
    }

    /**
     * @dev Get all supported L2 chains
     * @return Array of L2ChainInfo structs
     */
    function getSupportedChains() external view returns (L2ChainInfo[] memory) {
        uint256 count = 0;
        
        // Count enabled chains
        for (uint64 i = 1; i < 10000; i++) {
            if (chains[i].chainId != 0 && chains[i].enabled) {
                count++;
            }
        }
        
        L2ChainInfo[] memory result = new L2ChainInfo[](count);
        uint256 index = 0;
        
        // Populate result array
        for (uint64 i = 1; i < 10000; i++) {
            if (chains[i].chainId != 0 && chains[i].enabled) {
                result[index] = chains[i];
                index++;
            }
        }
        
        return result;
    }

    /**
     * @dev Get information about a specific L2 chain
     * @param chainId The chain ID
     * @return The L2ChainInfo for the specified chain
     */
    function getChainInfo(uint64 chainId) external view returns (L2ChainInfo memory) {
        require(chains[chainId].chainId != 0, "Chain does not exist");
        return chains[chainId];
    }

    /**
     * @dev Get all supported chain IDs
     * @return Array of chain IDs
     */
    function getSupportedChainIds() external view returns (uint64[] memory) {
        uint256 count = 0;
        
        // Count enabled chains
        for (uint64 i = 1; i < 10000; i++) {
            if (chains[i].chainId != 0 && chains[i].enabled) {
                count++;
            }
        }
        
        uint64[] memory result = new uint64[](count);
        uint256 index = 0;
        
        // Populate result array
        for (uint64 i = 1; i < 10000; i++) {
            if (chains[i].chainId != 0 && chains[i].enabled) {
                result[index] = i;
                index++;
            }
        }
        
        return result;
    }

    //--------------------------------------------------------------------------
    // Message Management Functions
    //--------------------------------------------------------------------------

    /**
     * @dev Generate a new unique message ID
     * @return The new message ID
     */
    function _generateMessageId() private returns (bytes32) {
        _messageIdCounter.increment();
        // Gas optimization: Use current() only once and avoid multiple storage reads
        uint256 currentId = _messageIdCounter.current();
        return keccak256(abi.encodePacked(block.chainid, currentId, block.timestamp));
    }

    /**
     * @dev Create a new cross-chain message with optimized encoding
     * @param destinationChainId The destination chain ID
     * @param recipient The recipient address on the destination chain
     * @param data The message data
     * @param amount The amount of tokens to transfer (if applicable)
     * @return messageId The ID of the created message
     */
    function _createMessage(
        uint64 destinationChainId,
        address recipient,
        bytes memory data,
        uint256 amount
    ) private returns (bytes32) {
        require(isChainSupported(destinationChainId), "Destination chain not supported");
        
        // Gas optimization: Generate messageId more efficiently
        _messageIdCounter.increment();
        uint256 currentNonce = _messageIdCounter.current();
        bytes32 messageId = bytes32(currentNonce);
        
        // Gas optimization: Use blob data if enabled and optimal for this message size
        bytes memory optimizedData = data;
        bool useBlob = false;
        
        // Only try to optimize data if the chain supports blobs and data is large enough
        if (chains[destinationChainId].blob_enabled && data.length >= gasOptimizer.blobSizeThreshold() / 2) {
            // Determine if we should use blob data for this message
            useBlob = calculateOptimalDataFormat(destinationChainId, uint64(data.length));
            
            // If using blob data, optimize the data
            if (useBlob) {
                // Detect data type: 0 = JSON, 1 = Binary, 2 = Merkle Proof, 3 = Transaction
                uint8 dataType = 3; // Default to transaction data
                if (data.length > 0) {
                    // Simple heuristic based on first byte
                    bytes1 firstByte = data[0];
                    if (firstByte == 0x7B) dataType = 0; // JSON (starts with '{')
                }
                
                optimizedData = gasOptimizer.optimizeData(data, dataType);
                emit BlobDataUsed(messageId, destinationChainId, optimizedData.length);
            }
        }
        
        // Gas optimization: Create in memory first, then store with optimized data
        CrossChainMessage memory newMessage = CrossChainMessage({
            messageId: messageId,
            sourceChainId: uint64(block.chainid),
            destinationChainId: destinationChainId,
            sender: msg.sender,
            recipient: recipient,
            amount: amount,
            data: optimizedData, // Use the optimized data
            timestamp: block.timestamp,
            nonce: currentNonce,
            status: MessageStatus.PENDING,
            transactionHash: bytes32(uint256(uint160(tx.origin))),
            confirmationTimestamp: 0,
            confirmationTransactionHash: bytes32(0),
            failureReason: ""
        });
        
        // Store the complete message
        messages[messageId] = newMessage;
        
        // Add message to sender and chain mappings
        senderMessages[msg.sender].push(messageId);
        chainMessages[destinationChainId].push(messageId);
        
        emit MessageSent(messageId, destinationChainId, msg.sender);
        
        return messageId;
    }

    /**
     * @dev Update a message's status
     * @param messageId The message ID
     * @param status The new status
     * @param failureReason The reason for failure (if applicable)
     */
    function updateMessageStatus(
        bytes32 messageId,
        MessageStatus status,
        string calldata failureReason
    ) external onlyRole(RELAYER_ROLE) {
        require(messages[messageId].messageId == messageId, "Message does not exist");
        
        // Gas optimization: Use storage pointer to avoid multiple SLOAD operations
        CrossChainMessage storage message = messages[messageId];
        
        // Update status and related fields
        message.status = status;
        
        if (status == MessageStatus.CONFIRMED) {
            message.confirmationTimestamp = uint64(block.timestamp);
            message.confirmationTransactionHash = blockhash(block.number - 1);
            // Clear any previous failure reason
            if (bytes(message.failureReason).length > 0) {
                message.failureReason = "";
            }
        } else if (status == MessageStatus.FAILED || status == MessageStatus.REJECTED) {
            message.failureReason = failureReason;
        }
        
        emit MessageStatusUpdated(messageId, status);
    }

    /**
     * @dev Retry a failed message
     * @param messageId The message ID to retry
     * @return success True if the retry was successful
     */
    function retryMessage(bytes32 messageId) external nonReentrant returns (bool) {
        CrossChainMessage storage message = messages[messageId];
        
        // Gas optimization: Combine checks to reduce gas
        require(
            message.messageId == messageId && 
            message.status == MessageStatus.FAILED &&
            (message.sender == msg.sender || hasRole(OPERATOR_ROLE, msg.sender)),
            "Cannot retry: invalid message, status, or unauthorized"
        );
        
        // Reset status to pending
        message.status = MessageStatus.PENDING;
        
        // Clear failure info
        message.failureReason = "";
        
        // Emit event
        emit MessageRetried(messageId, message.destinationChainId);
        
        return true;
    }
    
    /**
     * @dev Get the status of a message
     * @param messageId The message ID
     * @return The message status
     */
    function getMessageStatus(bytes32 messageId) external view returns (MessageStatus) {
        require(messages[messageId].messageId == messageId, "Message does not exist");
        return messages[messageId].status;
    }

    /**
     * @dev Get the details of a message
     * @param messageId The message ID
     * @return The message details
     */
    function getMessageDetails(bytes32 messageId) external view returns (CrossChainMessage memory) {
        require(messages[messageId].messageId == messageId, "Message does not exist");
        return messages[messageId];
    }

    /**
     * @dev Get all messages sent by a user
     * @param sender The sender address
     * @return Array of message IDs
     */
    function getMessagesBySender(address sender) external view returns (bytes32[] memory) {
        return senderMessages[sender];
    }

    /**
     * @dev Get all messages for a specific chain
     * @param chainId The chain ID
     * @return Array of message IDs
     */
    function getMessagesByChain(uint64 chainId) external view returns (bytes32[] memory) {
        return chainMessages[chainId];
    }

    /**
     * @dev Get all pending messages
     * @return Array of message IDs
     */
    function getPendingMessages() external view returns (bytes32[] memory) {
        // First, count pending messages
        uint256 count = 0;
        for (uint256 i = 0; i < _messageIdCounter.current(); i++) {
            bytes32 messageId = bytes32(i + 1);
            if (messages[messageId].messageId == messageId && 
                messages[messageId].status == MessageStatus.PENDING) {
                count++;
            }
        }
        
        // Then create the result array
        bytes32[] memory result = new bytes32[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < _messageIdCounter.current(); i++) {
            bytes32 messageId = bytes32(i + 1);
            if (messages[messageId].messageId == messageId && 
                messages[messageId].status == MessageStatus.PENDING) {
                result[index] = messageId;
                index++;
            }
        }
        
        return result;
    }

    /**
     * @dev Get the count of messages for a chain
     * @param chainId The chain ID
     * @return The message count
     */
    function getMessageCount(uint64 chainId) external view returns (uint64) {
        return uint64(chainMessages[chainId].length);
    }

    /**
     * @dev Creates and sends multiple messages in a batch for gas efficiency
     * @param destinationChainId The destination chain ID (same for all messages)
     * @param recipients Array of recipient addresses
     * @param dataArray Array of message data
     * @param amounts Array of amounts to transfer
     * @return messageIds Array of created message IDs
     */
    function createBatchMessages(
        uint64 destinationChainId,
        address[] calldata recipients,
        bytes[] calldata dataArray,
        uint256[] calldata amounts
    ) external whenNotPaused nonReentrant returns (bytes32[] memory) {
        require(isChainSupported(destinationChainId), "Destination chain not supported");
        require(
            recipients.length == dataArray.length && recipients.length == amounts.length,
            "Array lengths must match"
        );
        
        bytes32[] memory messageIds = new bytes32[](recipients.length);
        
        // Process all messages in a batch for gas efficiency
        for (uint256 i = 0; i < recipients.length; i++) {
            messageIds[i] = _createMessage(
                destinationChainId,
                recipients[i],
                dataArray[i],
                amounts[i]
            );
        }
        
        emit BatchMessageSent(messageIds, destinationChainId, msg.sender);
        
        return messageIds;
    }

    /**
     * @dev Verify a message with provided proof
     * @param messageId The message ID
     * @param proof The verification proof
     * @return True if the message is verified
     */
    function verifyMessage(bytes32 messageId, bytes calldata proof) external view returns (bool) {
        require(messages[messageId].messageId == messageId, "Message does not exist");
        
        // This is a simplified verification for demonstration
        // In a real implementation, we would verify proof against the rollup contract
        
        bytes32 proofHash = keccak256(proof);
        bytes32 messageHash = keccak256(abi.encode(messages[messageId]));
        
        // Very simple "verification" - in reality would use advanced cryptography
        return proofHash == messageHash;
    }

    //--------------------------------------------------------------------------
    // Bridge Order Functions
    //--------------------------------------------------------------------------

    /**
     * @dev Bridge an order to an L2 chain
     * @param request The order bridging request
     * @return result The order bridging result
     */
    function bridgeOrder(OrderBridgingRequest calldata request) 
        external 
        whenNotPaused
        nonReentrant
        returns (OrderBridgingResult memory) 
    {
        // Validate the chain
        require(isChainSupported(request.destinationChainId), "Destination chain not supported");
        
        // Check if the order has already been processed
        require(messageIdByOrderId[request.order_id] == bytes32(0), "Order already bridged");
        
        // Validate the order
        _validateOrder(request);
        
        // Create a new message ID
        _messageIdCounter.increment();
        bytes32 messageId = bytes32(_messageIdCounter.current());
        
        // Store the message
        bytes memory orderData = abi.encode(request);
        
        messages[messageId] = CrossChainMessage({
            messageId: messageId,
            sourceChainId: uint64(block.chainid),
            destinationChainId: request.destinationChainId,
            sender: msg.sender,
            recipient: chains[request.destinationChainId].bridgeAddress,
            amount: 0, // No value transfer in this case
            data: orderData,
            timestamp: uint64(block.timestamp),
            nonce: _messageIdCounter.current(),
            status: MessageStatus.PENDING,
            transactionHash: blockhash(block.number - 1),
            confirmationTimestamp: 0,
            confirmationTransactionHash: bytes32(0),
            failureReason: ""
        });
        
        // Update mappings
        senderMessages[msg.sender].push(messageId);
        chainMessages[request.destinationChainId].push(messageId);
        messageIdByOrderId[request.order_id] = messageId;
        userOrders[request.user].push(request);
        
        // Calculate fees based on data size and L2 gas costs
        bool useBlob = calculateOptimalDataFormat(
            request.destinationChainId, 
            uint64(orderData.length)
        );
        
        L2GasEstimation memory gasEstimation = _estimateGas(
            request.destinationChainId, 
            uint64(orderData.length),
            useBlob
        );
        
        // Use blob data if enabled and optimal
        if (useBlob && chains[request.destinationChainId].blob_enabled) {
            emit BlobDataUsed(messageId, request.destinationChainId, orderData.length);
        }
        
        // Emit event
        emit OrderBridged(request.order_id, messageId, request.destinationChainId);
        emit MessageSent(messageId, request.destinationChainId, msg.sender);
        
        // Return result
        OrderBridgingResult memory result = OrderBridgingResult({
            message_id: messageId,
            source_transaction_hash: messages[messageId].transactionHash,
            estimated_confirmation_time: uint64(block.timestamp) + 
                gasEstimation.estimated_time_seconds,
            bridging_fee: gasEstimation.estimated_cost_wei,
            status: MessageStatus.PENDING
        });
        
        return result;
    }

    /**
     * @dev Get orders bridged by a user
     * @param user The user address
     * @return Array of order bridging requests
     */
    function getOrdersByUser(address user) external view returns (OrderBridgingRequest[] memory) {
        return userOrders[user];
    }

    /**
     * @dev Get the total count of bridged orders
     * @return The order count
     */
    function getBridgedOrderCount() external view returns (uint64) {
        return uint64(_orderIdCounter.current());
    }

    //--------------------------------------------------------------------------
    // Settle Trade Functions
    //--------------------------------------------------------------------------

    /**
     * @dev Settle a trade on an L2 chain
     * @param request The trade settlement request
     * @return result The trade settlement result
     */
    function settleTrade(TradeSettlementRequest calldata request) 
        external 
        whenNotPaused
        nonReentrant
        returns (TradeSettlementResult memory) 
    {
        // Validate the chain
        require(isChainSupported(request.destinationChainId), "Destination chain not supported");
        
        // Check if the trade has already been processed
        require(messageIdByTradeId[request.trade_id] == bytes32(0), "Trade already settled");
        
        // Validate the trade
        _validateTrade(request);
        
        // Create a new message ID
        _messageIdCounter.increment();
        bytes32 messageId = bytes32(_messageIdCounter.current());
        
        // Store the message
        bytes memory tradeData = abi.encode(request);
        
        messages[messageId] = CrossChainMessage({
            messageId: messageId,
            sourceChainId: uint64(block.chainid),
            destinationChainId: request.destinationChainId,
            sender: msg.sender,
            recipient: chains[request.destinationChainId].bridgeAddress,
            amount: 0, // No value transfer in this case
            data: tradeData,
            timestamp: uint64(block.timestamp),
            nonce: _messageIdCounter.current(),
            status: MessageStatus.PENDING,
            transactionHash: blockhash(block.number - 1),
            confirmationTimestamp: 0,
            confirmationTransactionHash: bytes32(0),
            failureReason: ""
        });
        
        // Update mappings
        senderMessages[msg.sender].push(messageId);
        chainMessages[request.destinationChainId].push(messageId);
        messageIdByTradeId[request.trade_id] = messageId;
        userTrades[request.buyer].push(request);
        userTrades[request.seller].push(request);
        
        // Calculate fees based on data size and L2 gas costs
        bool useBlob = calculateOptimalDataFormat(
            request.destinationChainId, 
            uint64(tradeData.length)
        );
        
        L2GasEstimation memory gasEstimation = _estimateGas(
            request.destinationChainId, 
            uint64(tradeData.length),
            useBlob
        );
        
        // Use blob data if enabled and optimal
        if (useBlob && chains[request.destinationChainId].blob_enabled) {
            emit BlobDataUsed(messageId, request.destinationChainId, tradeData.length);
        }
        
        // Emit event
        emit TradeSettled(request.trade_id, messageId, request.destinationChainId);
        emit MessageSent(messageId, request.destinationChainId, msg.sender);
        
        // Return result
        TradeSettlementResult memory result = TradeSettlementResult({
            message_id: messageId,
            source_transaction_hash: messages[messageId].transactionHash,
            estimated_confirmation_time: uint64(block.timestamp) + 
                gasEstimation.estimated_time_seconds,
            settlement_fee: gasEstimation.estimated_cost_wei,
            status: MessageStatus.PENDING
        });
        
        return result;
    }

    /**
     * @dev Get trades settled for a user
     * @param user The user address
     * @return Array of trade settlement requests
     */
    function getTradesByUser(address user) external view returns (TradeSettlementRequest[] memory) {
        return userTrades[user];
    }

    /**
     * @dev Get the total count of settled trades
     * @return The trade count
     */
    function getSettledTradeCount() external view returns (uint64) {
        return uint64(_tradeIdCounter.current());
    }

    //--------------------------------------------------------------------------
    // Gas Estimation Functions
    //--------------------------------------------------------------------------

    /**
     * @dev Estimate gas cost for bridging to an L2 chain
     * @param destinationChainId The destination chain ID
     * @param dataSize The size of the data in bytes
     * @param useBlob Whether to use blob data (EIP-7691)
     * @return The gas estimation
     */
    function estimateBridgingGas(
        uint64 destinationChainId,
        uint64 dataSize,
        bool useBlob
    ) external view returns (L2GasEstimation memory) {
        return _estimateGas(destinationChainId, dataSize, useBlob);
    }

    /**
     * @dev Calculate the optimal data format (blob vs calldata) based on size and gas prices
     * @param destinationChainId The destination chain ID
     * @param dataSize The size of the data in bytes
     * @return useBlob Whether to use blob data
     */
    function calculateOptimalDataFormat(
        uint64 destinationChainId,
        uint64 dataSize
    ) public view returns (bool) {
        require(isChainSupported(destinationChainId), "Chain not supported");
        
        // If blobs are not enabled for this chain, always use calldata
        if (!chains[destinationChainId].blob_enabled) {
            return false;
        }
        
        // Get gas prices
        uint256 gasPrice = 30 * GWEI; // Use a default or get from oracle
        uint256 blobGasPrice = 90 * GWEI; // EIP-7691 blob gas price
        
        // Calculate costs
        uint256 calldataCost = dataSize * gasPrice * 16; // 16 gas per non-zero byte
        uint256 blobCost = dataSize * blobGasPrice; // blob prices
        
        // Add fixed overhead for each option
        calldataCost += 21000; // base transaction cost
        blobCost += 21000 + 50000; // base + blob overhead
        
        // Use blob if it's cheaper and data is large enough
        return (blobCost < calldataCost && dataSize > 2048);
    }

    /**
     * @dev Check if blob data is enabled for a chain
     * @param chainId The chain ID
     * @return True if blob data is enabled
     */
    function isBlobEnabled(uint64 chainId) external view returns (bool) {
        require(isChainSupported(chainId), "Chain not supported");
        return chains[chainId].blob_enabled;
    }

    /**
     * @dev Get the chain ID of the current network
     * @return The chain ID
     */
    function getCurrentChainId() external view returns (uint64) {
        return uint64(block.chainid);
    }

    //--------------------------------------------------------------------------
    // Admin Functions
    //--------------------------------------------------------------------------

    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    //--------------------------------------------------------------------------
    // Internal Functions
    //--------------------------------------------------------------------------

    /**
     * @dev Internal function to estimate gas costs
     */
    function _estimateGas(
        uint64 destinationChainId,
        uint64 dataSize,
        bool useBlob
    ) internal view returns (L2GasEstimation memory) {
        require(isChainSupported(destinationChainId), "Chain not supported");
        
        L2ChainInfo memory chain = chains[destinationChainId];
        
        // Base gas prices (use defaults or get from oracle)
        uint256 gasPrice = 30 * GWEI; // Regular gas price in wei
        uint256 blobGasPrice = useBlob ? 90 * GWEI : 0; // EIP-7691 blob gas price
        
        // Calculate gas limits based on data size
        uint256 gasLimit = 100000 + (dataSize * 16); // Base + data cost
        uint256 blobGasLimit = useBlob ? dataSize : 0;
        
        // Calculate total costs
        uint256 regularGasCost = gasPrice * gasLimit;
        uint256 blobGasCost = blobGasPrice * blobGasLimit;
        uint256 totalCost = regularGasCost + blobGasCost;
        
        // Calculate USD cost based on token price
        uint256 costUsd = (totalCost * chain.nativeTokenPriceUsd) / 1e18;
        
        // Estimate confirmation time
        uint64 estimatedTime = chain.verificationBlocks * chain.averageBlockTime;
        
        return L2GasEstimation({
            chainId: chain.chainId,
            chainType: chain.chainType,
            gasPriceWei: gasPrice,
            gasLimit: gasLimit,
            estimatedCostWei: totalCost,
            estimatedCostUsd: costUsd,
            estimatedTimeSeconds: estimatedTime,
            blobGasPrice: blobGasPrice,
            blobGasLimit: blobGasLimit,
            blobCostWei: blobGasCost
        });
    }

    /**
     * @dev Validate an order
     */
    function _validateOrder(OrderBridgingRequest calldata request) internal view {
        // Verify that the order has not expired
        require(request.expiration > block.timestamp, "Order expired");
        
        // Verify signature if needed (simplified - would be more complex in production)
        if (request.signature.length > 0) {
            bytes32 orderHash = keccak256(abi.encode(
                request.order_id,
                request.treasury_id,
                request.user,
                request.is_buy,
                request.amount,
                request.price,
                request.expiration
            ));
            
            bytes32 signedHash = orderHash.toEthSignedMessageHash();
            address recoveredSigner = signedHash.recover(request.signature);
            
            require(recoveredSigner == request.user, "Invalid signature");
        }
        
        // Additional validations as needed
    }

    /**
     * @dev Validate a trade
     */
    function _validateTrade(TradeSettlementRequest calldata request) internal pure {
        // Ensure buyer and seller are not the same
        require(request.buyer != request.seller, "Buyer and seller cannot be the same");
        
        // Ensure amount is positive
        require(request.amount > 0, "Amount must be positive");
        
        // Ensure price is positive
        require(request.price > 0, "Price must be positive");
        
        // Additional validations as needed
    }
} 