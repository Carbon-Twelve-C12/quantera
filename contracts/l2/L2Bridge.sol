// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../interfaces/IL2Bridge.sol";

/**
 * @title L2Bridge
 * @dev Contract for bridging orders and trades between L1 and various L2 chains
 * with enhanced cross-chain capabilities and Pectra EIP support
 */
contract L2Bridge is IL2Bridge, AccessControl, Pausable, ReentrancyGuard {
    using Counters for Counters.Counter;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");

    // Constants
    uint256 public constant GWEI = 1e9;

    // Counters
    Counters.Counter private _messageIdCounter;
    Counters.Counter private _orderIdCounter;
    Counters.Counter private _tradeIdCounter;

    // Mappings
    mapping(bytes32 => CrossChainMessage) public messages;
    mapping(uint64 => L2ChainInfo) public chains;
    mapping(address => bytes32[]) public senderMessages;
    mapping(uint64 => bytes32[]) public chainMessages;
    mapping(bytes32 => bytes32) public messageIdByOrderId;
    mapping(bytes32 => bytes32) public messageIdByTradeId;
    mapping(address => OrderBridgingRequest[]) public userOrders;
    mapping(address => TradeSettlementRequest[]) public userTrades;
    mapping(bytes32 => bool) public processedMessages;
    
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

    // Constructor
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
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
        
        chains[chainId] = L2ChainInfo({
            chainId: chainId,
            chainType: chainType,
            name: name,
            enabled: true,
            bridgeAddress: bridgeAddress,
            rollupAddress: rollupAddress,
            verificationBlocks: verificationBlocks,
            gasTokenSymbol: gasTokenSymbol,
            nativeTokenPriceUsd: nativeTokenPriceUsd,
            averageBlockTime: averageBlockTime,
            blob_enabled: blobEnabled,
            maxMessageSize: maxMessageSize
        });
        
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
        return keccak256(abi.encodePacked(block.chainid, _messageIdCounter.current(), block.timestamp));
    }

    /**
     * @dev Create a new cross-chain message
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
        
        bytes32 messageId = _generateMessageId();
        
        CrossChainMessage storage message = messages[messageId];
        message.messageId = messageId;
        message.sourceChainId = uint64(block.chainid);
        message.destinationChainId = destinationChainId;
        message.sender = msg.sender;
        message.recipient = recipient;
        message.amount = amount;
        message.data = data;
        message.timestamp = block.timestamp;
        message.nonce = _messageIdCounter.current();
        message.status = MessageStatus.PENDING;
        message.transactionHash = bytes32(uint256(uint160(tx.origin)));
        
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
    ) external onlyRole(OPERATOR_ROLE) {
        require(messages[messageId].messageId == messageId, "Message does not exist");
        
        CrossChainMessage storage message = messages[messageId];
        message.status = status;
        
        if (status == MessageStatus.CONFIRMED) {
            message.confirmationTimestamp = block.timestamp;
            message.confirmationTransactionHash = bytes32(uint256(uint160(tx.origin)));
        } else if (status == MessageStatus.FAILED) {
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
        require(messages[messageId].messageId == messageId, "Message does not exist");
        require(messages[messageId].status == MessageStatus.FAILED, "Message is not failed");
        require(messages[messageId].sender == msg.sender || hasRole(OPERATOR_ROLE, msg.sender), "Not authorized");
        
        CrossChainMessage storage message = messages[messageId];
        message.status = MessageStatus.PENDING;
        message.failureReason = "";
        
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
        uint256 totalMessages = _messageIdCounter.current();
        uint256 pendingCount = 0;
        
        // First, count pending messages
        for (uint256 i = 1; i <= totalMessages; i++) {
            bytes32 messageId = keccak256(abi.encodePacked(block.chainid, i, 0)); // Approximate ID for checking
            if (messages[messageId].status == MessageStatus.PENDING) {
                pendingCount++;
            }
        }
        
        bytes32[] memory pendingMessages = new bytes32[](pendingCount);
        uint256 index = 0;
        
        // Then populate the array
        for (uint256 i = 1; i <= totalMessages; i++) {
            bytes32 messageId = keccak256(abi.encodePacked(block.chainid, i, 0)); // Approximate ID for checking
            if (messages[messageId].status == MessageStatus.PENDING) {
                pendingMessages[index] = messageId;
                index++;
            }
        }
        
        return pendingMessages;
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
     * @dev Verify a message with provided proof
     * @param messageId The message ID
     * @param proof The verification proof
     * @return True if the message is verified
     */
    function verifyMessage(bytes32 messageId, bytes calldata proof) external view returns (bool) {
        require(messages[messageId].messageId == messageId, "Message does not exist");
        
        CrossChainMessage storage message = messages[messageId];
        L2ChainInfo storage chain = chains[message.destinationChainId];
        
        // Simplified verification for demonstration
        // In a real implementation, this would verify merkle proofs or other cryptographic evidence
        if (chain.rollupAddress != address(0)) {
            // For Optimistic Rollups, verify against the rollup contract
            bytes32 messageHash = keccak256(abi.encodePacked(
                message.messageId,
                message.sourceChainId,
                message.destinationChainId,
                message.sender,
                message.recipient,
                message.data
            ));
            
            // Verify signature in the proof
            bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
            address signer = ethSignedMessageHash.recover(proof);
            
            return signer == chain.rollupAddress || hasRole(RELAYER_ROLE, signer);
        }
        
        // Default case - simplified validation
        return proof.length > 0;
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
        nonReentrant 
        whenNotPaused 
        returns (OrderBridgingResult memory result) 
    {
        require(isChainSupported(request.destinationChainId), "Destination chain not supported");
        require(request.user == msg.sender || hasRole(OPERATOR_ROLE, msg.sender), "Not authorized");
        require(request.expiration > block.timestamp, "Order expired");
        
        // Prepare order data for the message
        bytes memory orderData = abi.encode(
            request.order_id,
            request.treasury_id,
            request.user,
            request.is_buy,
            request.amount,
            request.price,
            request.expiration,
            request.signature
        );
        
        // Calculate fee based on destination chain and data size
        L2ChainInfo storage chain = chains[request.destinationChainId];
        
        // Determine if we should use blob data (EIP-7691) based on size and chain support
        bool useBlob = chain.blob_enabled && 
                     orderData.length > 100_000 && 
                     orderData.length <= chain.maxMessageSize;
        
        // Create cross-chain message
        bytes32 messageId = _createMessage(
            request.destinationChainId,
            chain.bridgeAddress,
            orderData,
            0
        );
        
        // Calculate estimated confirmation time
        uint64 estimatedTime = chain.verificationBlocks * chain.averageBlockTime;
        
        // Link order ID to message ID
        messageIdByOrderId[request.order_id] = messageId;
        
        // Store order in user orders
        userOrders[request.user].push(request);
        
        // Increment order counter
        _orderIdCounter.increment();
        
        // Create result
        result = OrderBridgingResult({
            message_id: messageId,
            source_transaction_hash: bytes32(uint256(uint160(tx.origin))),
            estimated_confirmation_time: estimatedTime,
            bridging_fee: 0, // In a real implementation, this would be calculated based on gas prices
            status: MessageStatus.PENDING
        });
        
        if (useBlob) {
            emit BlobDataUsed(messageId, request.destinationChainId, orderData.length);
        }
        
        emit OrderBridged(request.order_id, messageId, request.destinationChainId);
        
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
        nonReentrant 
        whenNotPaused 
        returns (TradeSettlementResult memory result) 
    {
        require(isChainSupported(request.destinationChainId), "Destination chain not supported");
        require(msg.sender == request.buyer || msg.sender == request.seller || hasRole(OPERATOR_ROLE, msg.sender), "Not authorized");
        
        // Prepare trade data for the message
        bytes memory tradeData = abi.encode(
            request.trade_id,
            request.buy_order_id,
            request.sell_order_id,
            request.treasury_id,
            request.buyer,
            request.seller,
            request.amount,
            request.price,
            request.settlement_timestamp
        );
        
        // Calculate fee based on destination chain and data size
        L2ChainInfo storage chain = chains[request.destinationChainId];
        
        // Determine if we should use blob data (EIP-7691) based on size and chain support
        bool useBlob = chain.blob_enabled && 
                     tradeData.length > 100_000 && 
                     tradeData.length <= chain.maxMessageSize;
        
        // Create cross-chain message
        bytes32 messageId = _createMessage(
            request.destinationChainId,
            chain.bridgeAddress,
            tradeData,
            0
        );
        
        // Calculate estimated confirmation time
        uint64 estimatedTime = chain.verificationBlocks * chain.averageBlockTime;
        
        // Link trade ID to message ID
        messageIdByTradeId[request.trade_id] = messageId;
        
        // Store trade in user trades
        userTrades[request.buyer].push(request);
        userTrades[request.seller].push(request);
        
        // Increment trade counter
        _tradeIdCounter.increment();
        
        // Create result
        result = TradeSettlementResult({
            message_id: messageId,
            source_transaction_hash: bytes32(uint256(uint160(tx.origin))),
            estimated_confirmation_time: estimatedTime,
            settlement_fee: 0, // In a real implementation, this would be calculated based on gas prices
            status: MessageStatus.PENDING
        });
        
        if (useBlob) {
            emit BlobDataUsed(messageId, request.destinationChainId, tradeData.length);
        }
        
        emit TradeSettled(request.trade_id, messageId, request.destinationChainId);
        
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
        require(isChainSupported(destinationChainId), "Destination chain not supported");
        
        L2ChainInfo storage chain = chains[destinationChainId];
        
        // Check if blob is supported on the chain
        if (useBlob && !chain.blob_enabled) {
            useBlob = false;
        }
        
        // Base gas cost for transaction
        uint256 gasLimit = 100_000;
        
        // Add gas for data
        uint256 dataGas;
        
        if (useBlob) {
            // Blob gas calculation based on EIP-7691
            // Each blob can contain up to 128KB of data
            uint256 blobCount = (dataSize + 131_071) / 131_072; // Ceiling division by 128KB
            dataGas = blobCount * 120_000; // Approximate gas per blob
        } else {
            // Regular calldata gas cost (16 gas per non-zero byte, 4 gas per zero byte)
            // We'll use an approximation of 14 gas per byte on average
            dataGas = dataSize * 14;
        }
        
        gasLimit += dataGas;
        
        // Gas prices in wei (10 gwei = 10 * 10^9 wei)
        uint256 gasPrice = 10 * GWEI;
        uint256 blobGasPrice = useBlob ? 5 * GWEI : 0;
        
        // Calculate total cost
        uint256 totalCost = gasLimit * gasPrice;
        uint256 blobCost = 0;
        uint256 blobGasLimit = 0;
        
        if (useBlob) {
            blobGasLimit = (dataSize + 131_071) / 131_072 * 120_000;
            blobCost = blobGasLimit * blobGasPrice;
            totalCost += blobCost;
        }
        
        // Calculate USD cost
        // nativeTokenPriceUsd is scaled by 1e18
        // To prevent loss of precision, we scale up before division
        uint256 usdCostScaled = (totalCost * chain.nativeTokenPriceUsd) / 1e18;
        
        // Return the estimation
        return L2GasEstimation({
            chainId: destinationChainId,
            chainType: chain.chainType,
            gasPriceWei: gasPrice,
            gasLimit: gasLimit,
            estimatedCostWei: totalCost,
            estimatedCostUsd: usdCostScaled,
            estimatedTimeSeconds: chain.verificationBlocks * chain.averageBlockTime,
            blobGasPrice: useBlob ? blobGasPrice : 0,
            blobGasLimit: blobGasLimit,
            blobCostWei: blobCost
        });
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
    ) external view returns (bool) {
        require(isChainSupported(destinationChainId), "Destination chain not supported");
        
        L2ChainInfo storage chain = chains[destinationChainId];
        
        // If blob is not supported or data is too small, use calldata
        if (!chain.blob_enabled || dataSize <= 100_000) {
            return false;
        }
        
        // If data is too large for calldata but can fit in blob, use blob
        if (dataSize > 100_000 && dataSize <= chain.maxMessageSize) {
            return true;
        }
        
        // For intermediate sizes, calculate the cost of each approach
        L2GasEstimation memory blobEstimation = this.estimateBridgingGas(destinationChainId, dataSize, true);
        L2GasEstimation memory calldataEstimation = this.estimateBridgingGas(destinationChainId, dataSize, false);
        
        // Use the cheaper option
        return blobEstimation.estimatedCostWei < calldataEstimation.estimatedCostWei;
    }

    //--------------------------------------------------------------------------
    // Utility Functions
    //--------------------------------------------------------------------------

    /**
     * @dev Check if blob data is enabled for a chain
     * @param chainId The chain ID
     * @return True if blob data is enabled
     */
    function isBlobEnabled(uint64 chainId) external view returns (bool) {
        require(chains[chainId].chainId != 0, "Chain does not exist");
        return chains[chainId].blob_enabled;
    }

    /**
     * @dev Get the chain ID of the current network
     * @return The chain ID
     */
    function getCurrentChainId() external view returns (uint64) {
        return uint64(block.chainid);
    }

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
} 