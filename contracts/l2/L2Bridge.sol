// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IL2Bridge.sol";
import "../interfaces/ITradingModule.sol";

/**
 * @title L2Bridge
 * @dev Implementation of the Layer 2 bridge for treasury token trading optimization
 * Supports Pectra upgrade capabilities including blob data optimization (EIP-7691)
 */
contract L2Bridge is IL2Bridge {
    // Reference to the L1 bridge address
    address public l1BridgeAddress;
    
    // L2 chain ID
    uint256 public l2ChainId;
    
    // Current blob gas price
    uint256 public blobGasPrice;
    
    // Address of the admin
    address public admin;
    
    // Mapping of L2 orders by order ID
    mapping(bytes32 => L2Order) public l2Orders;
    
    // Mapping of L2 trades by trade ID
    mapping(bytes32 => L2Trade) public l2Trades;
    
    // Mapping of L1 order ID to L2 order ID
    mapping(bytes32 => bytes32) public l1ToL2OrderIds;
    
    // Mapping of orders by treasury ID
    mapping(bytes32 => bytes32[]) public treasuryOrders;
    
    // Active buy orders by treasury
    mapping(bytes32 => bytes32[]) public activeBuyOrders;
    
    // Active sell orders by treasury
    mapping(bytes32 => bytes32[]) public activeSellOrders;
    
    // Mapping of settled L2 trades
    mapping(bytes32 => bool) public settledTrades;
    
    /**
     * @dev Modifier to ensure caller is the admin
     */
    modifier onlyAdmin() {
        require(msg.sender == admin, "L2Bridge: caller is not the admin");
        _;
    }
    
    /**
     * @dev Modifier to ensure caller is the L1 bridge
     */
    modifier onlyL1Bridge() {
        require(msg.sender == l1BridgeAddress, "L2Bridge: caller is not the L1 bridge");
        _;
    }
    
    /**
     * @dev Constructor
     * @param _l1BridgeAddress The address of the L1 bridge
     * @param _l2ChainId The L2 chain ID
     * @param _initialBlobGasPrice The initial blob gas price
     */
    constructor(address _l1BridgeAddress, uint256 _l2ChainId, uint256 _initialBlobGasPrice) {
        l1BridgeAddress = _l1BridgeAddress;
        l2ChainId = _l2ChainId;
        blobGasPrice = _initialBlobGasPrice;
        admin = msg.sender;
    }
    
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
    ) external override onlyL1Bridge returns (bytes32) {
        // Generate a unique L2 order ID
        bytes32 l2OrderId = keccak256(abi.encodePacked(
            l1OrderId,
            treasuryId,
            owner,
            isBuyOrder,
            amount,
            price,
            expirationTime,
            block.timestamp
        ));
        
        // Create L2 order
        L2Order memory newOrder = L2Order({
            orderId: l2OrderId,
            treasuryId: treasuryId,
            owner: owner,
            isBuyOrder: isBuyOrder,
            amount: amount,
            price: price,
            expirationTime: expirationTime,
            isActive: true,
            l1OrderId: l1OrderId,
            extraData: extraData
        });
        
        // Store the order
        l2Orders[l2OrderId] = newOrder;
        l1ToL2OrderIds[l1OrderId] = l2OrderId;
        treasuryOrders[treasuryId].push(l2OrderId);
        
        // Add to active orders
        if (isBuyOrder) {
            activeBuyOrders[treasuryId].push(l2OrderId);
        } else {
            activeSellOrders[treasuryId].push(l2OrderId);
        }
        
        // Emit event
        emit OrderBridgedFromL1(l1OrderId, l2OrderId, treasuryId);
        
        return l2OrderId;
    }
    
    /**
     * @dev Execute trade on L2
     * @param buyOrderId The unique identifier for the buy order
     * @param sellOrderId The unique identifier for the sell order
     * @return The unique identifier for the created L2 trade
     */
    function executeL2Trade(bytes32 buyOrderId, bytes32 sellOrderId) external override returns (bytes32) {
        // Get order details
        L2Order storage buyOrder = l2Orders[buyOrderId];
        L2Order storage sellOrder = l2Orders[sellOrderId];
        
        // Validate orders
        require(buyOrder.isActive, "L2Bridge: buy order not active");
        require(sellOrder.isActive, "L2Bridge: sell order not active");
        require(buyOrder.treasuryId == sellOrder.treasuryId, "L2Bridge: treasury ID mismatch");
        require(buyOrder.isBuyOrder, "L2Bridge: not a buy order");
        require(!sellOrder.isBuyOrder, "L2Bridge: not a sell order");
        require(buyOrder.price >= sellOrder.price, "L2Bridge: price mismatch");
        require(block.timestamp <= buyOrder.expirationTime, "L2Bridge: buy order expired");
        require(block.timestamp <= sellOrder.expirationTime, "L2Bridge: sell order expired");
        
        // Determine trade amount (minimum of buy and sell amounts)
        uint256 tradeAmount = buyOrder.amount < sellOrder.amount ? buyOrder.amount : sellOrder.amount;
        
        // Generate a unique trade ID
        bytes32 tradeId = keccak256(abi.encodePacked(
            buyOrderId,
            sellOrderId,
            tradeAmount,
            block.timestamp
        ));
        
        // Create trade
        L2Trade memory newTrade = L2Trade({
            tradeId: tradeId,
            treasuryId: buyOrder.treasuryId,
            buyer: buyOrder.owner,
            seller: sellOrder.owner,
            amount: tradeAmount,
            price: sellOrder.price, // Use sell price (lowest price)
            timestamp: block.timestamp,
            buyOrderId: buyOrderId,
            sellOrderId: sellOrderId
        });
        
        // Store the trade
        l2Trades[tradeId] = newTrade;
        
        // Update order amounts
        buyOrder.amount -= tradeAmount;
        sellOrder.amount -= tradeAmount;
        
        // Update order status if fully filled
        if (buyOrder.amount == 0) {
            buyOrder.isActive = false;
            _removeOrderFromActive(buyOrderId, buyOrder.treasuryId, true);
        }
        
        if (sellOrder.amount == 0) {
            sellOrder.isActive = false;
            _removeOrderFromActive(sellOrderId, sellOrder.treasuryId, false);
        }
        
        // Emit event
        emit L2TradeExecuted(tradeId, buyOrder.treasuryId, buyOrderId, sellOrderId);
        
        return tradeId;
    }
    
    /**
     * @dev Generate proof for L1 settlement
     * This implementation leverages EIP-7691 for blob data optimization
     * @param tradeId The unique identifier for the L2 trade
     * @return The proof data for L1 settlement
     */
    function generateSettlementProof(bytes32 tradeId) external view override returns (bytes memory) {
        // Get trade details
        L2Trade memory trade = l2Trades[tradeId];
        
        // Ensure trade exists
        require(trade.tradeId == tradeId, "L2Bridge: trade does not exist");
        
        // Get order details
        L2Order memory buyOrder = l2Orders[trade.buyOrderId];
        L2Order memory sellOrder = l2Orders[trade.sellOrderId];
        
        // For EIP-7691 blob optimization, we pack the proof data in an efficient blob format
        // The proof includes the trade details and state root information for validation
        
        // Get current state root (in a real implementation, this would be a secure state root)
        bytes32 stateRoot = _getCurrentStateRoot();
        
        // Create optimized blob proof data
        bytes memory proofData = abi.encode(
            // Trade details
            trade.tradeId,
            trade.treasuryId,
            trade.buyer,
            trade.seller,
            trade.amount,
            trade.price,
            trade.timestamp,
            
            // Order references
            buyOrder.l1OrderId,
            sellOrder.l1OrderId,
            
            // Verification data
            stateRoot,
            block.number,
            l2ChainId
        );
        
        return proofData;
    }
    
    /**
     * @dev Settle trade back to L1
     * @param tradeId The unique identifier for the L2 trade
     * @return Success status
     */
    function settleTradeToL1(bytes32 tradeId) external override returns (bool) {
        // Ensure trade exists and hasn't been settled
        require(l2Trades[tradeId].tradeId == tradeId, "L2Bridge: trade does not exist");
        require(!settledTrades[tradeId], "L2Bridge: trade already settled");
        
        // Mark as settled
        settledTrades[tradeId] = true;
        
        // Generate proof
        bytes memory proofData = generateSettlementProof(tradeId);
        
        // Get order IDs from L1
        L2Trade memory trade = l2Trades[tradeId];
        L2Order memory buyOrder = l2Orders[trade.buyOrderId];
        L2Order memory sellOrder = l2Orders[trade.sellOrderId];
        
        // Call L1 to settle the trade (this would be a cross-chain message in practice)
        // In an actual implementation, this would use a proper L2->L1 messaging system
        // For this example, we simulate the L1 bridge call
        bytes32 l1TradeId = _simulateL1Settlement(
            buyOrder.l1OrderId,
            sellOrder.l1OrderId,
            proofData
        );
        
        // Emit event
        emit TradeSettledToL1(tradeId, l1TradeId);
        
        return true;
    }
    
    /**
     * @dev Get all active L2 orders for a treasury
     * @param treasuryId The unique identifier for the treasury
     * @return Array of L2 order IDs
     */
    function getActiveL2Orders(bytes32 treasuryId) external view override returns (bytes32[] memory) {
        // Combine active buy and sell orders
        bytes32[] memory buyOrders = activeBuyOrders[treasuryId];
        bytes32[] memory sellOrders = activeSellOrders[treasuryId];
        
        // Create array for all active orders
        bytes32[] memory allOrders = new bytes32[](buyOrders.length + sellOrders.length);
        
        // Populate array
        for (uint256 i = 0; i < buyOrders.length; i++) {
            allOrders[i] = buyOrders[i];
        }
        
        for (uint256 i = 0; i < sellOrders.length; i++) {
            allOrders[buyOrders.length + i] = sellOrders[i];
        }
        
        return allOrders;
    }
    
    /**
     * @dev Get L2 order details
     * @param orderId The unique identifier for the L2 order
     * @return The L2 order details
     */
    function getL2OrderDetails(bytes32 orderId) external view override returns (L2Order memory) {
        return l2Orders[orderId];
    }
    
    /**
     * @dev Get L2 trade details
     * @param tradeId The unique identifier for the L2 trade
     * @return The L2 trade details
     */
    function getL2TradeDetails(bytes32 tradeId) external view override returns (L2Trade memory) {
        return l2Trades[tradeId];
    }
    
    /**
     * @dev Update blob gas price (admin only)
     * @param newBlobGasPrice The new blob gas price
     */
    function updateBlobGasPrice(uint256 newBlobGasPrice) external override onlyAdmin {
        blobGasPrice = newBlobGasPrice;
        emit BlobGasPriceUpdated(newBlobGasPrice);
    }
    
    /**
     * @dev Get the current blob gas price
     * @return The current blob gas price
     */
    function getBlobGasPrice() external view override returns (uint256) {
        return blobGasPrice;
    }
    
    /**
     * @dev Get the L1 bridge address
     * @return The L1 bridge address
     */
    function getL1BridgeAddress() external view override returns (address) {
        return l1BridgeAddress;
    }
    
    /**
     * @dev Get the L2 chain ID
     * @return The L2 chain ID
     */
    function getL2ChainId() external view override returns (uint256) {
        return l2ChainId;
    }
    
    /**
     * @dev Update the L1 bridge address (admin only)
     * @param newL1BridgeAddress The new L1 bridge address
     */
    function updateL1BridgeAddress(address newL1BridgeAddress) external onlyAdmin {
        l1BridgeAddress = newL1BridgeAddress;
    }
    
    /**
     * @dev Remove an order from the active orders list
     * @param orderId The order ID to remove
     * @param treasuryId The treasury ID
     * @param isBuyOrder Whether it's a buy order
     */
    function _removeOrderFromActive(bytes32 orderId, bytes32 treasuryId, bool isBuyOrder) internal {
        bytes32[] storage activeOrders = isBuyOrder ? activeBuyOrders[treasuryId] : activeSellOrders[treasuryId];
        
        // Find and remove order
        for (uint256 i = 0; i < activeOrders.length; i++) {
            if (activeOrders[i] == orderId) {
                // Replace with the last element and pop
                activeOrders[i] = activeOrders[activeOrders.length - 1];
                activeOrders.pop();
                break;
            }
        }
    }
    
    /**
     * @dev Get the current state root for verification
     * @return The current state root
     */
    function _getCurrentStateRoot() internal view returns (bytes32) {
        // In a real implementation, this would get the current L2 state root
        // For this example, we create a simulated state root
        return keccak256(abi.encodePacked(
            block.number,
            block.timestamp,
            block.difficulty,
            blockhash(block.number - 1)
        ));
    }
    
    /**
     * @dev Simulate L1 settlement (in practice, this would be a cross-chain message)
     * @param buyOrderId L1 buy order ID
     * @param sellOrderId L1 sell order ID
     * @param proofData Proof data for settlement
     * @return Simulated L1 trade ID
     */
    function _simulateL1Settlement(
        bytes32 buyOrderId,
        bytes32 sellOrderId,
        bytes memory proofData
    ) internal view returns (bytes32) {
        // In a real implementation, this would send a message to L1
        // For this example, we create a simulated L1 trade ID
        return keccak256(abi.encodePacked(
            buyOrderId,
            sellOrderId,
            proofData,
            block.timestamp
        ));
    }
} 