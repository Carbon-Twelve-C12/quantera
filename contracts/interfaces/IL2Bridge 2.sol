// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ITradingModule.sol";

/**
 * @title IL2Bridge
 * @dev Interface for the Layer 2 bridge for treasury token trading optimization
 */
interface IL2Bridge {
    /**
     * @dev L2 Order structure, similar to the main Order but with L2-specific data
     */
    struct L2Order {
        bytes32 orderId;
        bytes32 treasuryId;
        address owner;
        bool isBuyOrder;
        uint256 amount;
        uint256 price;
        uint256 expirationTime;
        bool isActive;
        uint256 l1OrderId;
        bytes extraData;
    }
    
    /**
     * @dev L2 Trade structure
     */
    struct L2Trade {
        bytes32 tradeId;
        bytes32 treasuryId;
        address buyer;
        address seller;
        uint256 amount;
        uint256 price;
        uint256 timestamp;
        bytes32 buyOrderId;
        bytes32 sellOrderId;
    }
    
    /**
     * @dev Emitted when an order is bridged from L1
     * @param l1OrderId The order ID on L1
     * @param l2OrderId The order ID on L2
     * @param treasuryId The unique identifier for the treasury
     */
    event OrderBridgedFromL1(bytes32 indexed l1OrderId, bytes32 indexed l2OrderId, bytes32 indexed treasuryId);
    
    /**
     * @dev Emitted when a trade is executed on L2
     * @param tradeId The unique identifier for the trade
     * @param treasuryId The unique identifier for the treasury
     * @param buyOrderId The unique identifier for the buy order
     * @param sellOrderId The unique identifier for the sell order
     */
    event L2TradeExecuted(bytes32 indexed tradeId, bytes32 indexed treasuryId, bytes32 buyOrderId, bytes32 sellOrderId);
    
    /**
     * @dev Emitted when a trade is settled back to L1
     * @param l2TradeId The trade ID on L2
     * @param l1TradeId The trade ID on L1
     */
    event TradeSettledToL1(bytes32 indexed l2TradeId, bytes32 indexed l1TradeId);
    
    /**
     * @dev Emitted when blob gas price is updated
     * @param newBlobGasPrice The new blob gas price
     */
    event BlobGasPriceUpdated(uint256 newBlobGasPrice);
    
    /**
     * @dev Create an L2 order from a bridged L1 order
     * @param l1OrderId The order ID on L1
     * @param treasuryId The unique identifier for the treasury
     * @param owner The address of the order owner
     * @param isBuyOrder Whether the order is a buy order
     * @param amount The amount of tokens
     * @param price The price per token
     * @param expirationTime The expiration time of the order
     * @param extraData Any additional data for the order
     * @return The unique identifier for the created L2 order
     */
    function createL2Order(
        bytes32 l1OrderId,
        bytes32 treasuryId,
        address owner,
        bool isBuyOrder,
        uint256 amount,
        uint256 price,
        uint256 expirationTime,
        bytes calldata extraData
    ) external returns (bytes32);
    
    /**
     * @dev Execute trade on L2
     * @param buyOrderId The unique identifier for the buy order
     * @param sellOrderId The unique identifier for the sell order
     * @return The unique identifier for the created L2 trade
     */
    function executeL2Trade(bytes32 buyOrderId, bytes32 sellOrderId) external returns (bytes32);
    
    /**
     * @dev Generate proof for L1 settlement
     * @param tradeId The unique identifier for the L2 trade
     * @return The proof data for L1 settlement
     */
    function generateSettlementProof(bytes32 tradeId) external view returns (bytes memory);
    
    /**
     * @dev Settle trade back to L1
     * @param tradeId The unique identifier for the L2 trade
     * @return Success status
     */
    function settleTradeToL1(bytes32 tradeId) external returns (bool);
    
    /**
     * @dev Get all active L2 orders for a treasury
     * @param treasuryId The unique identifier for the treasury
     * @return Array of L2 order IDs
     */
    function getActiveL2Orders(bytes32 treasuryId) external view returns (bytes32[] memory);
    
    /**
     * @dev Get L2 order details
     * @param orderId The unique identifier for the L2 order
     * @return The L2 order details
     */
    function getL2OrderDetails(bytes32 orderId) external view returns (L2Order memory);
    
    /**
     * @dev Get L2 trade details
     * @param tradeId The unique identifier for the L2 trade
     * @return The L2 trade details
     */
    function getL2TradeDetails(bytes32 tradeId) external view returns (L2Trade memory);
    
    /**
     * @dev Update blob gas price (admin only)
     * @param newBlobGasPrice The new blob gas price
     */
    function updateBlobGasPrice(uint256 newBlobGasPrice) external;
    
    /**
     * @dev Get the current blob gas price
     * @return The current blob gas price
     */
    function getBlobGasPrice() external view returns (uint256);
    
    /**
     * @dev Get the L1 bridge address
     * @return The L1 bridge address
     */
    function getL1BridgeAddress() external view returns (address);
    
    /**
     * @dev Get the L2 chain ID
     * @return The L2 chain ID
     */
    function getL2ChainId() external view returns (uint256);
} 