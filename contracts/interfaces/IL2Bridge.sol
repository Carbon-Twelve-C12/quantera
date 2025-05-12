// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./ITradingModule.sol";

/**
 * @title IL2Bridge
 * @dev Interface for the L2Bridge contract
 */
interface IL2Bridge {
    /**
     * @dev Enum for message status
     */
    enum MessageStatus {
        PENDING,
        CONFIRMED,
        FAILED,
        EXPIRED
    }
    
    /**
     * @dev Struct for chain information
     */
    struct ChainInfo {
        uint256 chainId;
        uint8 chainType;
        string name;
        address bridgeAddress;
        address rollupAddress;
        uint16 verificationBlocks;
        string gasTokenSymbol;
        uint256 nativeTokenPriceUsd;
        uint16 averageBlockTime;
        bool blob_enabled;
        uint32 maxMessageSize;
    }
    
    /**
     * @dev Struct for order details
     */
    struct OrderDetails {
        bytes32 order_id;
        bytes32 treasury_id;
        address user;
        bool is_buy;
        uint256 amount;
        uint256 price;
        uint64 expiration;
        bytes signature;
        uint256 destinationChainId;
    }
    
    /**
     * @dev Struct for cross-chain message
     */
    struct CrossChainMessage {
        bytes32 messageId;
        address sender;
        uint256 sourceChainId;
        uint256 destinationChainId;
        bytes32 related_id; // Order ID or other related ID
        bytes data;
        uint64 timestamp;
        MessageStatus status;
        bytes statusMessage;
        bool useBlob;
    }
    
    /**
     * @dev Struct for gas estimation result
     */
    struct GasEstimation {
        bool useBlob;
        uint256 blobGasLimit;
        uint256 callDataGasLimit;
        uint256 estimatedGasCost;
        uint256 estimatedUsdCost;
    }
    
    // Events
    event ChainAdded(uint256 indexed chainId, string name, address bridgeAddress);
    event ChainUpdated(uint256 indexed chainId, string name, address bridgeAddress);
    event OrderBridged(bytes32 indexed orderId, bytes32 indexed messageId, uint256 destinationChainId);
    event MessageStatusUpdated(bytes32 indexed messageId, MessageStatus status, string statusMessage);
    
    // Chain Management Functions
    function addChain(
        uint256 chainId,
        uint8 chainType,
        string calldata name,
        address bridgeAddress,
        address rollupAddress,
        uint16 verificationBlocks,
        string calldata gasTokenSymbol,
        uint256 nativeTokenPriceUsd,
        uint16 averageBlockTime,
        bool blob_enabled,
        uint32 maxMessageSize
    ) external;
    
    function updateChain(
        uint256 chainId,
        string calldata name,
        address bridgeAddress,
        address rollupAddress,
        uint16 verificationBlocks,
        string calldata gasTokenSymbol,
        uint256 nativeTokenPriceUsd,
        uint16 averageBlockTime,
        bool blob_enabled,
        uint32 maxMessageSize
    ) external;
    
    function removeChain(uint256 chainId) external;
    
    function getChainInfo(uint256 chainId) external view returns (ChainInfo memory);
    
    // Bridging Functions
    function bridgeOrder(OrderDetails calldata order) external payable returns (bytes32);
    
    function updateMessageStatus(
        bytes32 messageId,
        MessageStatus status,
        string calldata statusMessage
    ) external;
    
    // Query Functions
    function getMessageStatus(bytes32 messageId) external view returns (MessageStatus);
    
    function getMessageDetails(bytes32 messageId) external view returns (CrossChainMessage memory);
    
    function getOrdersByUser(address user) external view returns (bytes32[] memory);
    
    // Gas Estimation Functions
    function calculateOptimalDataFormat(
        uint256 chainId,
        uint256 dataSize
    ) external view returns (bool);
    
    function estimateBridgingGas(
        uint256 chainId,
        uint256 dataSize,
        bool useBlob
    ) external view returns (GasEstimation memory);
} 