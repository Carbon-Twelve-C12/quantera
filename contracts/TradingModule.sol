// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/ITradingModule.sol";
import "./interfaces/ITreasuryRegistry.sol";
import "./interfaces/ITreasuryToken.sol";

/**
 * @title TradingModule
 * @dev Implementation of the trading module for treasury tokens with L2 integration
 * and EIP-7691 support for optimized data availability
 */
contract TradingModule is ITradingModule {
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
    
    // Mapping of trades by trade ID
    mapping(bytes32 => Trade) private _trades;
    
    // Registry reference
    ITreasuryRegistry public registry;
    
    // Platform fee in basis points (e.g., 25 = 0.25%)
    uint16 public feeRate;
    
    // Fee collector address
    address public feeCollector;
    
    // Admin address
    address public admin;
    
    // Total fees collected
    uint256 public totalFeesCollected;
    
    /**
     * @dev Modifier to check if caller is admin
     */
    modifier onlyAdmin() {
        require(msg.sender == admin, "TradingModule: caller is not admin");
        _;
    }
    
    /**
     * @dev Constructor to initialize the trading module
     * @param _registry Address of the treasury registry
     * @param _feeCollector Address to collect trading fees
     * @param _feeRate Initial fee rate in basis points
     */
    constructor(address _registry, address _feeCollector, uint16 _feeRate) {
        require(_registry != address(0), "TradingModule: registry is the zero address");
        require(_feeCollector != address(0), "TradingModule: fee collector is the zero address");
        require(_feeRate <= 1000, "TradingModule: fee rate cannot exceed 10%");
        
        registry = ITreasuryRegistry(_registry);
        feeCollector = _feeCollector;
        feeRate = _feeRate;
        admin = msg.sender;
    }
    
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
    ) external payable override returns (bytes32) {
        // Validate inputs
        require(amount > 0, "TradingModule: amount must be greater than zero");
        require(price > 0, "TradingModule: price must be greater than zero");
        require(expirationTime > block.timestamp, "TradingModule: expiration time must be in the future");
        
        // Validate treasury exists
        ITreasuryRegistry.TreasuryInfo memory treasuryInfo = registry.getTreasuryDetails(treasuryId);
        require(treasuryInfo.tokenAddress != address(0), "TradingModule: treasury does not exist");
        require(treasuryInfo.status == ITreasuryRegistry.TreasuryStatus.ACTIVE, "TradingModule: treasury is not active");
        
        // Validate L2 parameters if using L2
        if (useL2) {
            require(l2ChainId > 0, "TradingModule: L2 chain ID must be specified");
            require(l2Bridges[l2ChainId].isActive, "TradingModule: L2 bridge not available for specified chain");
        }
        
        // Calculate total price
        uint256 totalPrice = amount * price;
        
        // Verify sent ETH covers the total price
        require(msg.value >= totalPrice, "TradingModule: insufficient ETH sent");
        
        // Generate order ID
        bytes32 orderId = keccak256(abi.encodePacked(
            treasuryId,
            msg.sender,
            amount,
            price,
            block.timestamp,
            "BUY"
        ));
        
        // Create order
        Order memory newOrder = Order({
            orderId: orderId,
            treasuryId: treasuryId,
            owner: msg.sender,
            isBuyOrder: true,
            amount: amount,
            price: price,
            expirationTime: expirationTime,
            isActive: true,
            isL2Bridged: false,
            extraData: extraData
        });
        
        // Store order
        orders[orderId] = newOrder;
        treasuryOrders[treasuryId].push(orderId);
        activeBuyOrders[treasuryId].push(orderId);
        
        // Emit event
        emit OrderCreated(orderId, treasuryId, msg.sender, true, false);
        
        // Bridge order to L2 if requested
        if (useL2) {
            bridgeOrderToL2(orderId, l2ChainId);
        }
        
        // Refund excess ETH
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
        
        return orderId;
    }
    
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
    ) external override returns (bytes32) {
        // Validate inputs
        require(amount > 0, "TradingModule: amount must be greater than zero");
        require(price > 0, "TradingModule: price must be greater than zero");
        require(expirationTime > block.timestamp, "TradingModule: expiration time must be in the future");
        
        // Validate treasury exists
        ITreasuryRegistry.TreasuryInfo memory treasuryInfo = registry.getTreasuryDetails(treasuryId);
        require(treasuryInfo.tokenAddress != address(0), "TradingModule: treasury does not exist");
        require(treasuryInfo.status == ITreasuryRegistry.TreasuryStatus.ACTIVE, "TradingModule: treasury is not active");
        
        // Validate L2 parameters if using L2
        if (useL2) {
            require(l2ChainId > 0, "TradingModule: L2 chain ID must be specified");
            require(l2Bridges[l2ChainId].isActive, "TradingModule: L2 bridge not available for specified chain");
        }
        
        // Check token balance and approval
        ITreasuryToken token = ITreasuryToken(treasuryInfo.tokenAddress);
        require(token.balanceOf(msg.sender) >= amount, "TradingModule: insufficient balance");
        
        // Generate order ID
        bytes32 orderId = keccak256(abi.encodePacked(
            treasuryId,
            msg.sender,
            amount,
            price,
            block.timestamp,
            "SELL"
        ));
        
        // Create order
        Order memory newOrder = Order({
            orderId: orderId,
            treasuryId: treasuryId,
            owner: msg.sender,
            isBuyOrder: false,
            amount: amount,
            price: price,
            expirationTime: expirationTime,
            isActive: true,
            isL2Bridged: false,
            extraData: extraData
        });
        
        // Store order
        orders[orderId] = newOrder;
        treasuryOrders[treasuryId].push(orderId);
        activeSellOrders[treasuryId].push(orderId);
        
        // Emit event
        emit OrderCreated(orderId, treasuryId, msg.sender, false, false);
        
        // Bridge order to L2 if requested
        if (useL2) {
            bridgeOrderToL2(orderId, l2ChainId);
        }
        
        return orderId;
    }
    
    /**
     * @dev Cancel an existing order
     * @param orderId The unique identifier for the order
     */
    function cancelOrder(bytes32 orderId) external override {
        // Get order
        Order storage order = orders[orderId];
        
        // Validate order
        require(order.orderId == orderId, "TradingModule: order does not exist");
        require(order.owner == msg.sender, "TradingModule: caller is not order owner");
        require(order.isActive, "TradingModule: order is not active");
        require(!order.isL2Bridged, "TradingModule: order is bridged to L2, cancel on L2 first");
        
        // Deactivate order
        order.isActive = false;
        
        // Remove from active orders
        _removeFromActiveOrders(orderId, order.treasuryId, order.isBuyOrder);
        
        // Refund ETH for buy orders
        if (order.isBuyOrder) {
            uint256 refundAmount = order.amount * order.price;
            payable(order.owner).transfer(refundAmount);
        }
        
        // Emit event
        emit OrderCanceled(orderId);
    }
    
    /**
     * @dev Execute trade by matching buy and sell orders
     * @param buyOrderId The unique identifier for the buy order
     * @param sellOrderId The unique identifier for the sell order
     * @return The unique identifier for the created trade
     */
    function executeTrade(bytes32 buyOrderId, bytes32 sellOrderId) external override returns (bytes32) {
        // Get orders
        Order storage buyOrder = orders[buyOrderId];
        Order storage sellOrder = orders[sellOrderId];
        
        // Validate orders
        _validateTradeOrders(buyOrder, sellOrder);
        
        // Calculate trade details
        uint256 tradeAmount = _calculateTradeAmount(buyOrder, sellOrder);
        uint256 tradePrice = buyOrder.price; // Use buy order price
        uint256 tradeTotalPrice = tradeAmount * tradePrice;
        
        // Calculate fee
        uint256 fee = (tradeTotalPrice * feeRate) / 10000;
        uint256 sellerReceives = tradeTotalPrice - fee;
        
        // Generate trade ID
        bytes32 tradeId = keccak256(abi.encodePacked(
            buyOrderId,
            sellOrderId,
            tradeAmount,
            block.timestamp
        ));
        
        // Transfer tokens from seller to buyer
        ITreasuryRegistry.TreasuryInfo memory treasuryInfo = registry.getTreasuryDetails(buyOrder.treasuryId);
        ITreasuryToken token = ITreasuryToken(treasuryInfo.tokenAddress);
        
        // Execute token transfer
        bool transferSuccess = token.transferWithData(
            buyOrder.owner,
            tradeAmount,
            abi.encode(tradeId)
        );
        require(transferSuccess, "TradingModule: token transfer failed");
        
        // Transfer ETH from trading module to seller
        payable(sellOrder.owner).transfer(sellerReceives);
        
        // Add fee to total collected
        totalFeesCollected += fee;
        
        // Create trade record
        Trade memory newTrade = Trade({
            tradeId: tradeId,
            treasuryId: buyOrder.treasuryId,
            buyer: buyOrder.owner,
            seller: sellOrder.owner,
            amount: tradeAmount,
            price: tradePrice,
            timestamp: block.timestamp,
            isL2Settled: false
        });
        
        _trades[tradeId] = newTrade;
        
        // Update order status
        _updateOrdersAfterTrade(buyOrder, sellOrder, tradeAmount);
        
        // Emit event
        emit TradeExecuted(tradeId, buyOrder.treasuryId, buyOrderId, sellOrderId, false);
        
        return tradeId;
    }
    
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
    ) external override returns (bytes32) {
        // Get orders
        Order storage buyOrder = orders[buyOrderId];
        Order storage sellOrder = orders[sellOrderId];
        
        // Validate orders
        _validateTradeOrders(buyOrder, sellOrder);
        
        // Ensure caller is either buyer or seller with a smart account
        require(
            msg.sender == buyOrder.owner || msg.sender == sellOrder.owner,
            "TradingModule: caller must be buyer or seller"
        );
        
        // Calculate trade details
        uint256 tradeAmount = _calculateTradeAmount(buyOrder, sellOrder);
        uint256 tradePrice = buyOrder.price; // Use buy order price
        uint256 tradeTotalPrice = tradeAmount * tradePrice;
        
        // Calculate fee
        uint256 fee = (tradeTotalPrice * feeRate) / 10000;
        uint256 sellerReceives = tradeTotalPrice - fee;
        
        // Generate trade ID
        bytes32 tradeId = keccak256(abi.encodePacked(
            buyOrderId,
            sellOrderId,
            tradeAmount,
            block.timestamp,
            accountData
        ));
        
        // Get token address
        ITreasuryRegistry.TreasuryInfo memory treasuryInfo = registry.getTreasuryDetails(buyOrder.treasuryId);
        ITreasuryToken token = ITreasuryToken(treasuryInfo.tokenAddress);
        
        // Execute smart account logic
        bytes memory result;
        if (msg.sender == buyOrder.owner) {
            // Buyer executing smart account logic
            result = token.executeAccountCode(accountData);
        } else {
            // Seller executing smart account logic
            result = token.executeAccountCode(accountData);
        }
        
        // Execute token transfer
        bool transferSuccess = token.transferWithData(
            buyOrder.owner,
            tradeAmount,
            abi.encode(tradeId, result)
        );
        require(transferSuccess, "TradingModule: token transfer failed");
        
        // Transfer ETH from trading module to seller
        payable(sellOrder.owner).transfer(sellerReceives);
        
        // Add fee to total collected
        totalFeesCollected += fee;
        
        // Create trade record
        Trade memory newTrade = Trade({
            tradeId: tradeId,
            treasuryId: buyOrder.treasuryId,
            buyer: buyOrder.owner,
            seller: sellOrder.owner,
            amount: tradeAmount,
            price: tradePrice,
            timestamp: block.timestamp,
            isL2Settled: false
        });
        
        _trades[tradeId] = newTrade;
        
        // Update order status
        _updateOrdersAfterTrade(buyOrder, sellOrder, tradeAmount);
        
        // Emit event
        emit TradeExecuted(tradeId, buyOrder.treasuryId, buyOrderId, sellOrderId, false);
        
        return tradeId;
    }
    
    /**
     * @dev Bridge order to L2 for execution
     * @param orderId The unique identifier for the order
     * @param l2ChainId The L2 chain ID
     * @return Success status
     */
    function bridgeOrderToL2(
        bytes32 orderId,
        uint256 l2ChainId
    ) public override returns (bool) {
        // Validate L2 parameters
        require(l2ChainId > 0, "TradingModule: L2 chain ID must be specified");
        require(l2Bridges[l2ChainId].isActive, "TradingModule: L2 bridge not available for specified chain");
        
        // Get order
        Order storage order = orders[orderId];
        
        // Validate order
        require(order.orderId == orderId, "TradingModule: order does not exist");
        require(order.isActive, "TradingModule: order is not active");
        require(!order.isL2Bridged, "TradingModule: order already bridged to L2");
        require(order.owner == msg.sender || msg.sender == admin, "TradingModule: caller not authorized");
        
        // Mark order as bridged
        order.isL2Bridged = true;
        
        // In a real implementation, this would call the L2 bridge contract to create the order on L2
        // Here, we're just emitting an event to simulate the bridge operation
        
        // Prepare blob data for L2 (EIP-7691)
        bytes memory blobData = abi.encode(
            order.orderId,
            order.treasuryId,
            order.owner,
            order.isBuyOrder,
            order.amount,
            order.price,
            order.expirationTime,
            order.extraData
        );
        
        // This is a placeholder for the actual L2 bridge call
        // In production, this would involve sending a blob transaction to the L2 bridge
        
        // Emit event
        emit OrderBridgedToL2(orderId, l2ChainId);
        
        return true;
    }
    
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
    ) external override returns (bytes32) {
        // Get orders
        Order storage buyOrder = orders[buyOrderId];
        Order storage sellOrder = orders[sellOrderId];
        
        // Validate orders exist
        require(buyOrder.orderId == buyOrderId, "TradingModule: buy order does not exist");
        require(sellOrder.orderId == sellOrderId, "TradingModule: sell order does not exist");
        
        // Validate orders are bridged to L2
        require(buyOrder.isL2Bridged, "TradingModule: buy order not bridged to L2");
        require(sellOrder.isL2Bridged, "TradingModule: sell order not bridged to L2");
        
        // Verify L2 proof data
        // In a real implementation, this would validate the proof from the L2 network
        // Here, we're just checking if the proof data is not empty
        require(l2ProofData.length > 0, "TradingModule: invalid L2 proof data");
        
        // Parse trade details from L2 proof data
        // In a real implementation, this would decode the proof and extract verified data
        // For simplicity, we're assuming the proof contains the trade amount
        uint256 tradeAmount = abi.decode(l2ProofData, (uint256));
        require(tradeAmount > 0, "TradingModule: invalid trade amount");
        require(tradeAmount <= buyOrder.amount, "TradingModule: trade amount exceeds buy order");
        require(tradeAmount <= sellOrder.amount, "TradingModule: trade amount exceeds sell order");
        
        // Generate trade ID
        bytes32 tradeId = keccak256(abi.encodePacked(
            buyOrderId,
            sellOrderId,
            tradeAmount,
            block.timestamp,
            "L2SETTLED"
        ));
        
        // Create trade record
        Trade memory newTrade = Trade({
            tradeId: tradeId,
            treasuryId: buyOrder.treasuryId,
            buyer: buyOrder.owner,
            seller: sellOrder.owner,
            amount: tradeAmount,
            price: buyOrder.price,
            timestamp: block.timestamp,
            isL2Settled: true
        });
        
        _trades[tradeId] = newTrade;
        
        // Update order status
        _updateOrdersAfterTrade(buyOrder, sellOrder, tradeAmount);
        
        // Get L2 chain ID from the orders
        uint256 l2ChainId = 0;
        for (uint256 id = 1; id < 10000; id++) {
            if (l2Bridges[id].isActive) {
                l2ChainId = id;
                break;
            }
        }
        
        // Emit events
        emit TradeExecuted(tradeId, buyOrder.treasuryId, buyOrderId, sellOrderId, true);
        emit L2TradeSettled(tradeId, l2ChainId);
        
        return tradeId;
    }
    
    /**
     * @dev Get all active orders for a treasury
     * @param treasuryId The unique identifier for the treasury
     * @return Array of order IDs
     */
    function getActiveOrders(bytes32 treasuryId) external view override returns (bytes32[] memory) {
        bytes32[] memory buyOrders = activeBuyOrders[treasuryId];
        bytes32[] memory sellOrders = activeSellOrders[treasuryId];
        
        bytes32[] memory allActive = new bytes32[](buyOrders.length + sellOrders.length);
        
        for (uint256 i = 0; i < buyOrders.length; i++) {
            allActive[i] = buyOrders[i];
        }
        
        for (uint256 i = 0; i < sellOrders.length; i++) {
            allActive[buyOrders.length + i] = sellOrders[i];
        }
        
        return allActive;
    }
    
    /**
     * @dev Get order details
     * @param orderId The unique identifier for the order
     * @return The order details
     */
    function getOrderDetails(bytes32 orderId) external view override returns (Order memory) {
        return orders[orderId];
    }
    
    /**
     * @dev Update fee rate (admin only)
     * @param newFeeRate The new fee rate
     */
    function updateFeeRate(uint16 newFeeRate) external override onlyAdmin {
        require(newFeeRate <= 1000, "TradingModule: fee rate cannot exceed 10%");
        
        feeRate = newFeeRate;
        
        emit FeeRateUpdated(newFeeRate);
    }
    
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
    ) external override onlyAdmin {
        require(l2ChainId > 0, "TradingModule: L2 chain ID must be greater than zero");
        require(bridgeAddress != address(0), "TradingModule: bridge address is the zero address");
        
        l2Bridges[l2ChainId] = L2BridgeInfo({
            l2BridgeAddress: bridgeAddress,
            blobGasPrice: blobGasPrice,
            isActive: isActive
        });
        
        emit L2BridgeUpdated(l2ChainId, bridgeAddress, blobGasPrice, isActive);
    }
    
    /**
     * @dev Update blob gas price for L2
     * @param l2ChainId The L2 chain ID
     * @param newBlobGasPrice The new blob gas price
     */
    function updateL2BlobGasPrice(
        uint256 l2ChainId,
        uint256 newBlobGasPrice
    ) external override onlyAdmin {
        require(l2Bridges[l2ChainId].isActive, "TradingModule: L2 bridge not active");
        
        l2Bridges[l2ChainId].blobGasPrice = newBlobGasPrice;
        
        emit L2BridgeUpdated(
            l2ChainId,
            l2Bridges[l2ChainId].l2BridgeAddress,
            newBlobGasPrice,
            true
        );
    }
    
    /**
     * @dev Withdraw collected fees (admin only)
     */
    function withdrawFees() external override onlyAdmin {
        require(totalFeesCollected > 0, "TradingModule: no fees to withdraw");
        
        uint256 amount = totalFeesCollected;
        totalFeesCollected = 0;
        
        payable(feeCollector).transfer(amount);
        
        emit FeesWithdrawn(feeCollector, amount);
    }
    
    /**
     * @dev Get trade details
     * @param tradeId The unique identifier for the trade
     * @return The trade details
     */
    function getTradeDetails(bytes32 tradeId) external view returns (Trade memory) {
        return _trades[tradeId];
    }
    
    /**
     * @dev Validate trade orders
     * @param buyOrder The buy order
     * @param sellOrder The sell order
     */
    function _validateTradeOrders(Order storage buyOrder, Order storage sellOrder) internal view {
        // Validate buy order
        require(buyOrder.orderId != bytes32(0), "TradingModule: buy order does not exist");
        require(buyOrder.isActive, "TradingModule: buy order is not active");
        require(buyOrder.isBuyOrder, "TradingModule: not a buy order");
        require(block.timestamp < buyOrder.expirationTime, "TradingModule: buy order expired");
        require(!buyOrder.isL2Bridged, "TradingModule: buy order is bridged to L2");
        
        // Validate sell order
        require(sellOrder.orderId != bytes32(0), "TradingModule: sell order does not exist");
        require(sellOrder.isActive, "TradingModule: sell order is not active");
        require(!sellOrder.isBuyOrder, "TradingModule: not a sell order");
        require(block.timestamp < sellOrder.expirationTime, "TradingModule: sell order expired");
        require(!sellOrder.isL2Bridged, "TradingModule: sell order is bridged to L2");
        
        // Validate matching treasury
        require(buyOrder.treasuryId == sellOrder.treasuryId, "TradingModule: treasury mismatch");
        
        // Validate price (buy price must be >= sell price)
        require(buyOrder.price >= sellOrder.price, "TradingModule: price mismatch");
    }
    
    /**
     * @dev Calculate trade amount based on order sizes
     * @param buyOrder The buy order
     * @param sellOrder The sell order
     * @return The trade amount
     */
    function _calculateTradeAmount(Order storage buyOrder, Order storage sellOrder) internal pure returns (uint256) {
        return buyOrder.amount <= sellOrder.amount ? buyOrder.amount : sellOrder.amount;
    }
    
    /**
     * @dev Update orders after trade execution
     * @param buyOrder The buy order
     * @param sellOrder The sell order
     * @param tradeAmount The amount that was traded
     */
    function _updateOrdersAfterTrade(Order storage buyOrder, Order storage sellOrder, uint256 tradeAmount) internal {
        // Update buy order
        if (tradeAmount >= buyOrder.amount) {
            // Buy order fully filled
            buyOrder.isActive = false;
            _removeFromActiveOrders(buyOrder.orderId, buyOrder.treasuryId, true);
        } else {
            // Buy order partially filled
            buyOrder.amount -= tradeAmount;
        }
        
        // Update sell order
        if (tradeAmount >= sellOrder.amount) {
            // Sell order fully filled
            sellOrder.isActive = false;
            _removeFromActiveOrders(sellOrder.orderId, sellOrder.treasuryId, false);
        } else {
            // Sell order partially filled
            sellOrder.amount -= tradeAmount;
        }
    }
    
    /**
     * @dev Remove order from active orders list
     * @param orderId The order ID to remove
     * @param treasuryId The treasury ID
     * @param isBuyOrder Whether it's a buy order
     */
    function _removeFromActiveOrders(bytes32 orderId, bytes32 treasuryId, bool isBuyOrder) internal {
        bytes32[] storage activeOrders = isBuyOrder ? activeBuyOrders[treasuryId] : activeSellOrders[treasuryId];
        
        for (uint256 i = 0; i < activeOrders.length; i++) {
            if (activeOrders[i] == orderId) {
                // Swap with the last element and pop
                activeOrders[i] = activeOrders[activeOrders.length - 1];
                activeOrders.pop();
                break;
            }
        }
    }
} 