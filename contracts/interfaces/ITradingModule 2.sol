// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ITreasuryRegistry.sol";

/**
 * @title ITradingModule
 * @dev Interface for the trading module facilitating buying and selling of treasury tokens
 */
interface ITradingModule {
    /**
     * @dev Order structure
     */
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

    /**
     * @dev Trade structure
     */
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

    /**
     * @dev L2 bridge information
     */
    struct L2BridgeInfo {
        address l2BridgeAddress;
        uint256 blobGasPrice;
        bool isActive;
    }
    
    /**
     * @dev Emitted when a new order is created
     * @param orderId The unique identifier for the order
     * @param treasuryId The unique identifier for the treasury
     * @param owner The address of the order owner
     * @param isBuyOrder Whether the order is a buy order
     * @param isL2Bridged Whether the order is bridged to L2
     */
    event OrderCreated(bytes32 indexed orderId, bytes32 indexed treasuryId, address indexed owner, bool isBuyOrder, bool isL2Bridged);

    /**
     * @dev Emitted when an order is canceled
     * @param orderId The unique identifier for the order
     */
    event OrderCanceled(bytes32 indexed orderId);

    /**
     * @dev Emitted when a trade is executed
     * @param tradeId The unique identifier for the trade
     * @param treasuryId The unique identifier for the treasury
     * @param buyOrderId The unique identifier for the buy order
     * @param sellOrderId The unique identifier for the sell order
     * @param isL2Settled Whether the trade is settled from L2
     */
    event TradeExecuted(bytes32 indexed tradeId, bytes32 indexed treasuryId, bytes32 buyOrderId, bytes32 sellOrderId, bool isL2Settled);

    /**
     * @dev Emitted when fee rate is updated
     * @param newFeeRate The new fee rate
     */
    event FeeRateUpdated(uint16 newFeeRate);

    /**
     * @dev Emitted when an order is bridged to L2
     * @param orderId The unique identifier for the order
     * @param l2ChainId The L2 chain ID
     */
    event OrderBridgedToL2(bytes32 indexed orderId, uint256 l2ChainId);

    /**
     * @dev Emitted when a trade is settled from L2
     * @param tradeId The unique identifier for the trade
     * @param l2ChainId The L2 chain ID
     */
    event L2TradeSettled(bytes32 indexed tradeId, uint256 l2ChainId);

    /**
     * @dev Emitted when L2 bridge info is updated
     * @param l2ChainId The L2 chain ID
     * @param bridgeAddress The bridge address
     * @param blobGasPrice The blob gas price
     * @param isActive Whether the bridge is active
     */
    event L2BridgeUpdated(uint256 l2ChainId, address bridgeAddress, uint256 blobGasPrice, bool isActive);

    /**
     * @dev Emitted when fees are withdrawn
     * @param to The address receiving the fees
     * @param amount The amount of fees withdrawn
     */
    event FeesWithdrawn(address indexed to, uint256 amount);
    
    /**
     * @dev Create a new buy order
     * @param treasuryId The unique identifier for the treasury
     * @param amount The amount of tokens to buy
     * @param price The price per token
     * @param expirationTime The expiration time of the order
     * @param useL2 Whether to use L2 for the order
     * @param l2ChainId The L2 chain ID (if using L2)
     * @param extraData Any additional data for the order
     * @return The unique identifier for the created order
     */
    function createBuyOrder(
        bytes32 treasuryId,
        uint256 amount,
        uint256 price,
        uint256 expirationTime,
        bool useL2,
        uint256 l2ChainId,
        bytes calldata extraData
    ) external payable returns (bytes32);

    /**
     * @dev Create a new sell order
     * @param treasuryId The unique identifier for the treasury
     * @param amount The amount of tokens to sell
     * @param price The price per token
     * @param expirationTime The expiration time of the order
     * @param useL2 Whether to use L2 for the order
     * @param l2ChainId The L2 chain ID (if using L2)
     * @param extraData Any additional data for the order
     * @return The unique identifier for the created order
     */
    function createSellOrder(
        bytes32 treasuryId,
        uint256 amount,
        uint256 price,
        uint256 expirationTime,
        bool useL2,
        uint256 l2ChainId,
        bytes calldata extraData
    ) external returns (bytes32);

    /**
     * @dev Cancel an existing order
     * @param orderId The unique identifier for the order
     */
    function cancelOrder(bytes32 orderId) external;

    /**
     * @dev Execute trade by matching buy and sell orders
     * @param buyOrderId The unique identifier for the buy order
     * @param sellOrderId The unique identifier for the sell order
     * @return The unique identifier for the created trade
     */
    function executeTrade(bytes32 buyOrderId, bytes32 sellOrderId) external returns (bytes32);

    /**
     * @dev Execute trade with smart account logic
     * @param buyOrderId The unique identifier for the buy order
     * @param sellOrderId The unique identifier for the sell order
     * @param accountData Additional data for smart account execution
     * @return The unique identifier for the created trade
     */
    function executeTradeWithAccount(
        bytes32 buyOrderId,
        bytes32 sellOrderId,
        bytes calldata accountData
    ) external returns (bytes32);

    /**
     * @dev Bridge order to L2 for execution
     * @param orderId The unique identifier for the order
     * @param l2ChainId The L2 chain ID
     * @return Success status
     */
    function bridgeOrderToL2(
        bytes32 orderId,
        uint256 l2ChainId
    ) external returns (bool);

    /**
     * @dev Settle trade from L2
     * @param buyOrderId The unique identifier for the buy order
     * @param sellOrderId The unique identifier for the sell order
     * @param l2ProofData Proof data from L2
     * @return The unique identifier for the created trade
     */
    function settleL2Trade(
        bytes32 buyOrderId,
        bytes32 sellOrderId,
        bytes calldata l2ProofData
    ) external returns (bytes32);

    /**
     * @dev Get all active orders for a treasury
     * @param treasuryId The unique identifier for the treasury
     * @return Array of order IDs
     */
    function getActiveOrders(bytes32 treasuryId) external view returns (bytes32[] memory);

    /**
     * @dev Get order details
     * @param orderId The unique identifier for the order
     * @return The order details
     */
    function getOrderDetails(bytes32 orderId) external view returns (Order memory);

    /**
     * @dev Update fee rate (admin only)
     * @param newFeeRate The new fee rate
     */
    function updateFeeRate(uint16 newFeeRate) external;

    /**
     * @dev Set L2 bridge information
     * @param l2ChainId The L2 chain ID
     * @param bridgeAddress The bridge address
     * @param blobGasPrice The blob gas price
     * @param isActive Whether the bridge is active
     */
    function setL2Bridge(
        uint256 l2ChainId,
        address bridgeAddress,
        uint256 blobGasPrice,
        bool isActive
    ) external;

    /**
     * @dev Update blob gas price for L2
     * @param l2ChainId The L2 chain ID
     * @param newBlobGasPrice The new blob gas price
     */
    function updateL2BlobGasPrice(
        uint256 l2ChainId,
        uint256 newBlobGasPrice
    ) external;

    /**
     * @dev Withdraw collected fees (admin only)
     */
    function withdrawFees() external;
} 