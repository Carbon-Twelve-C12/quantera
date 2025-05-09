// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./ITradingModule.sol";

/**
 * @title IL2Bridge
 * @dev Interface for the L2Bridge contract
 */
interface IL2Bridge {
    /**
     * @dev Enum for the supported L2 chains
     */
    enum L2Chain {
        OPTIMISM,
        ARBITRUM,
        ZKSYNC,
        STARKNET,
        BASE,
        POLYGON_ZKEVM,
        LINEA,
        CUSTOM
    }

    /**
     * @dev Enum for the cross-chain message status
     */
    enum MessageStatus {
        PENDING,
        CONFIRMED,
        FAILED,
        REJECTED
    }

    /**
     * @dev Struct for L2 chain information
     */
    struct L2ChainInfo {
        uint64 chainId;
        L2Chain chainType;
        string name;
        bool enabled;
        address bridgeAddress;
        address rollupAddress;
        uint64 verificationBlocks;
        string gasTokenSymbol;
        uint256 nativeTokenPriceUsd;
        uint64 averageBlockTime;
        bool blob_enabled;
        uint64 maxMessageSize;
    }

    /**
     * @dev Struct for cross-chain messages
     */
    struct CrossChainMessage {
        bytes32 messageId;
        uint64 sourceChainId;
        uint64 destinationChainId;
        address sender;
        address recipient;
        uint256 amount;
        bytes data;
        uint64 timestamp;
        uint256 nonce;
        MessageStatus status;
        bytes32 transactionHash;
        uint64 confirmationTimestamp;
        bytes32 confirmationTransactionHash;
        string failureReason;
    }

    /**
     * @dev Struct for order bridging requests
     */
    struct OrderBridgingRequest {
        bytes32 order_id;
        bytes32 treasury_id;
        address user;
        bool is_buy;
        uint256 amount;
        uint256 price;
        uint64 expiration;
        bytes signature;
        uint64 destinationChainId;
    }

    /**
     * @dev Struct for order bridging results
     */
    struct OrderBridgingResult {
        bytes32 message_id;
        bytes32 source_transaction_hash;
        uint64 estimated_confirmation_time;
        uint256 bridging_fee;
        MessageStatus status;
    }

    /**
     * @dev Struct for trade settlement requests
     */
    struct TradeSettlementRequest {
        bytes32 trade_id;
        bytes32 buy_order_id;
        bytes32 sell_order_id;
        bytes32 treasury_id;
        address buyer;
        address seller;
        uint256 amount;
        uint256 price;
        uint64 settlement_timestamp;
        uint64 destinationChainId;
    }

    /**
     * @dev Struct for trade settlement results
     */
    struct TradeSettlementResult {
        bytes32 message_id;
        bytes32 source_transaction_hash;
        uint64 estimated_confirmation_time;
        uint256 settlement_fee;
        MessageStatus status;
    }

    /**
     * @dev Struct for L2 gas estimation
     */
    struct L2GasEstimation {
        uint64 chainId;
        L2Chain chainType;
        uint256 gasPriceWei;
        uint256 gasLimit;
        uint256 estimatedCostWei;
        uint256 estimatedCostUsd;
        uint64 estimatedTimeSeconds;
        uint256 blobGasPrice;
        uint256 blobGasLimit;
        uint256 blobCostWei;
    }

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
    ) external;

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
    ) external;

    /**
     * @dev Get all supported L2 chains
     * @return Array of L2ChainInfo structs
     */
    function getSupportedChains() external view returns (L2ChainInfo[] memory);

    /**
     * @dev Get information about a specific L2 chain
     * @param chainId The chain ID
     * @return The L2ChainInfo for the specified chain
     */
    function getChainInfo(uint64 chainId) external view returns (L2ChainInfo memory);

    /**
     * @dev Get all supported chain IDs
     * @return Array of chain IDs
     */
    function getSupportedChainIds() external view returns (uint64[] memory);

    /**
     * @dev Check if a chain is supported and enabled
     * @param chainId The chain ID to check
     * @return True if the chain is supported and enabled
     */
    function isChainSupported(uint64 chainId) external view returns (bool);

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
    ) external;

    /**
     * @dev Retry a failed message
     * @param messageId The message ID to retry
     * @return success True if the retry was successful
     */
    function retryMessage(bytes32 messageId) external returns (bool);

    /**
     * @dev Get the status of a message
     * @param messageId The message ID
     * @return The message status
     */
    function getMessageStatus(bytes32 messageId) external view returns (MessageStatus);

    /**
     * @dev Get the details of a message
     * @param messageId The message ID
     * @return The message details
     */
    function getMessageDetails(bytes32 messageId) external view returns (CrossChainMessage memory);

    /**
     * @dev Get all messages sent by a user
     * @param sender The sender address
     * @return Array of message IDs
     */
    function getMessagesBySender(address sender) external view returns (bytes32[] memory);

    /**
     * @dev Get all messages for a specific chain
     * @param chainId The chain ID
     * @return Array of message IDs
     */
    function getMessagesByChain(uint64 chainId) external view returns (bytes32[] memory);

    /**
     * @dev Get all pending messages
     * @return Array of message IDs
     */
    function getPendingMessages() external view returns (bytes32[] memory);

    /**
     * @dev Get the count of messages for a chain
     * @param chainId The chain ID
     * @return The message count
     */
    function getMessageCount(uint64 chainId) external view returns (uint64);

    /**
     * @dev Verify a message with provided proof
     * @param messageId The message ID
     * @param proof The verification proof
     * @return True if the message is verified
     */
    function verifyMessage(bytes32 messageId, bytes calldata proof) external view returns (bool);

    /**
     * @dev Bridge an order to an L2 chain
     * @param request The order bridging request
     * @return result The order bridging result
     */
    function bridgeOrder(OrderBridgingRequest calldata request) 
        external 
        returns (OrderBridgingResult memory);

    /**
     * @dev Get orders bridged by a user
     * @param user The user address
     * @return Array of order bridging requests
     */
    function getOrdersByUser(address user) external view returns (OrderBridgingRequest[] memory);

    /**
     * @dev Get the total count of bridged orders
     * @return The order count
     */
    function getBridgedOrderCount() external view returns (uint64);

    /**
     * @dev Settle a trade on an L2 chain
     * @param request The trade settlement request
     * @return result The trade settlement result
     */
    function settleTrade(TradeSettlementRequest calldata request) 
        external 
        returns (TradeSettlementResult memory);

    /**
     * @dev Get trades settled for a user
     * @param user The user address
     * @return Array of trade settlement requests
     */
    function getTradesByUser(address user) external view returns (TradeSettlementRequest[] memory);

    /**
     * @dev Get the total count of settled trades
     * @return The trade count
     */
    function getSettledTradeCount() external view returns (uint64);

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
    ) external view returns (L2GasEstimation memory);

    /**
     * @dev Calculate the optimal data format (blob vs calldata) based on size and gas prices
     * @param destinationChainId The destination chain ID
     * @param dataSize The size of the data in bytes
     * @return useBlob Whether to use blob data
     */
    function calculateOptimalDataFormat(
        uint64 destinationChainId,
        uint64 dataSize
    ) external view returns (bool);

    /**
     * @dev Check if blob data is enabled for a chain
     * @param chainId The chain ID
     * @return True if blob data is enabled
     */
    function isBlobEnabled(uint64 chainId) external view returns (bool);

    /**
     * @dev Get the chain ID of the current network
     * @return The chain ID
     */
    function getCurrentChainId() external view returns (uint64);

    /**
     * @dev Pause the contract
     */
    function pause() external;

    /**
     * @dev Unpause the contract
     */
    function unpause() external;
} 