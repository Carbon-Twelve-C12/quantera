use alloy_primitives::{Address, U256, H256, Bytes};
use ethereum_client::{EthereumClient, Error as EthError};
use std::sync::Arc;
use serde::{Serialize, Deserialize};
use thiserror::Error;
use tracing::{info, debug, warn, error};

/// Custom error type for TradingClient operations
#[derive(Debug, Error)]
pub enum Error {
    #[error("Ethereum client error: {0}")]
    EthereumClient(#[from] EthError),
    
    #[error("Contract interaction error: {0}")]
    ContractInteraction(String),
    
    #[error("Encoding/decoding error: {0}")]
    Encoding(String),
    
    #[error("Order error: {0}")]
    Order(String),
    
    #[error("Entity not found: {0}")]
    NotFound(String),
    
    #[error("Unauthorized operation: {0}")]
    Unauthorized(String),
    
    #[error("Insufficient balance: {0}")]
    InsufficientBalance(String),
}

/// Order side
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum OrderSide {
    Buy,
    Sell,
}

/// Order type
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum OrderType {
    Limit,
    Market,
}

/// Order status
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum OrderStatus {
    Open,
    Filled,
    PartiallyFilled,
    Cancelled,
    Expired,
}

/// Order data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Order {
    pub order_id: u64,
    pub trader: Address,
    pub token_id: [u8; 32],
    pub side: OrderSide,
    pub order_type: OrderType,
    pub price: U256,
    pub quantity: U256,
    pub filled_quantity: U256,
    pub creation_time: u64,
    pub expiration_time: u64,
    pub status: OrderStatus,
    pub signature: Vec<u8>,
}

/// Trade data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Trade {
    pub trade_id: u64,
    pub buy_order_id: u64,
    pub sell_order_id: u64,
    pub token_id: [u8; 32],
    pub price: U256,
    pub quantity: U256,
    pub buyer: Address,
    pub seller: Address,
    pub timestamp: u64,
    pub l2_hash: Option<H256>,
}

/// Order book entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderBookEntry {
    pub price: U256,
    pub quantity: U256,
    pub order_count: u64,
}

/// Order book for a token
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderBook {
    pub token_id: [u8; 32],
    pub bids: Vec<OrderBookEntry>,
    pub asks: Vec<OrderBookEntry>,
    pub last_trade_price: U256,
    pub last_update_time: u64,
}

/// Client for interacting with the TradingModule contract
#[derive(Debug, Clone)]
pub struct TradingClient {
    client: Arc<EthereumClient>,
    contract_address: Address,
}

impl TradingClient {
    /// Create a new TradingClient
    pub async fn new(client: Arc<EthereumClient>, address: Address) -> Self {
        Self {
            client,
            contract_address: address,
        }
    }
    
    /// Place a new order
    pub async fn place_order(
        &self,
        token_id: [u8; 32],
        side: OrderSide,
        order_type: OrderType,
        price: U256,
        quantity: U256,
        expiration_time: u64,
    ) -> Result<u64, Error> {
        info!("Placing {:?} {:?} order for token: {:?}, price: {}, quantity: {}", 
            side, order_type, token_id, price, quantity);
        
        // Convert side to uint8
        let side_value = match side {
            OrderSide::Buy => 0u8,
            OrderSide::Sell => 1u8,
        };
        
        // Convert order type to uint8
        let order_type_value = match order_type {
            OrderType::Limit => 0u8,
            OrderType::Market => 1u8,
        };
        
        // Call the contract
        let order_id = self.client.call_contract::<u64>(
            self.contract_address,
            "placeOrder(bytes32,uint8,uint8,uint256,uint256,uint256)",
            vec![
                token_id.into(),
                side_value.into(),
                order_type_value.into(),
                price.into(),
                quantity.into(),
                U256::from(expiration_time).into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(order_id)
    }
    
    /// Cancel an order
    pub async fn cancel_order(
        &self,
        order_id: u64,
    ) -> Result<(), Error> {
        info!("Cancelling order: {}", order_id);
        
        // Call the contract
        self.client.send_transaction(
            self.contract_address,
            "cancelOrder(uint256)",
            vec![
                U256::from(order_id).into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
    
    /// Execute a trade between orders
    pub async fn execute_trade(
        &self,
        buy_order_id: u64,
        sell_order_id: u64,
        quantity: U256,
    ) -> Result<u64, Error> {
        info!("Executing trade between buy order: {} and sell order: {}, quantity: {}", 
            buy_order_id, sell_order_id, quantity);
        
        // Call the contract
        let trade_id = self.client.call_contract::<u64>(
            self.contract_address,
            "executeTrade(uint256,uint256,uint256)",
            vec![
                U256::from(buy_order_id).into(),
                U256::from(sell_order_id).into(),
                quantity.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(trade_id)
    }
    
    /// Submit order to L2 for blob-based processing (EIP-7691)
    pub async fn submit_order_to_l2(
        &self,
        order_id: u64,
    ) -> Result<H256, Error> {
        info!("Submitting order to L2: {}", order_id);
        
        // Get order data
        let order = self.get_order(order_id).await?;
        
        // Serialize order for blob data
        let order_data = serde_json::to_vec(&order)
            .map_err(|e| Error::Encoding(format!("Failed to serialize order: {}", e)))?;
        
        // Call the contract with blob data
        let receipt = self.client.send_blob_transaction(
            self.contract_address,
            "submitOrderToL2(uint256)",
            vec![
                U256::from(order_id).into(),
            ],
            order_data,
        ).await.map_err(Error::EthereumClient)?;
        
        // Get L2 transaction hash from receipt
        let l2_hash = if let Some(log) = receipt.logs.first() {
            if log.topics.len() > 1 {
                Some(log.topics[1])
            } else {
                None
            }
        } else {
            None
        };
        
        Ok(l2_hash.unwrap_or_default())
    }
    
    /// Get order details
    pub async fn get_order(
        &self,
        order_id: u64,
    ) -> Result<Order, Error> {
        debug!("Getting order: {}", order_id);
        
        // Call the contract
        let result = self.client.call_contract::<(
            Address, [u8; 32], u8, u8, U256, U256, U256, u64, u64, u8, Bytes
        )>(
            self.contract_address,
            "getOrder(uint256)",
            vec![
                U256::from(order_id).into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        // Convert side from uint8
        let side = match result.2 {
            0 => OrderSide::Buy,
            1 => OrderSide::Sell,
            _ => return Err(Error::Encoding("Invalid order side".into())),
        };
        
        // Convert order type from uint8
        let order_type = match result.3 {
            0 => OrderType::Limit,
            1 => OrderType::Market,
            _ => return Err(Error::Encoding("Invalid order type".into())),
        };
        
        // Convert status from uint8
        let status = match result.9 {
            0 => OrderStatus::Open,
            1 => OrderStatus::Filled,
            2 => OrderStatus::PartiallyFilled,
            3 => OrderStatus::Cancelled,
            4 => OrderStatus::Expired,
            _ => return Err(Error::Encoding("Invalid order status".into())),
        };
        
        // Convert tuple to Order
        let order = Order {
            order_id,
            trader: result.0,
            token_id: result.1,
            side,
            order_type,
            price: result.4,
            quantity: result.5,
            filled_quantity: result.6,
            creation_time: result.7,
            expiration_time: result.8,
            status,
            signature: result.10.to_vec(),
        };
        
        Ok(order)
    }
    
    /// Get trade details
    pub async fn get_trade(
        &self,
        trade_id: u64,
    ) -> Result<Trade, Error> {
        debug!("Getting trade: {}", trade_id);
        
        // Call the contract
        let result = self.client.call_contract::<(
            u64, u64, [u8; 32], U256, U256, Address, Address, u64, H256
        )>(
            self.contract_address,
            "getTrade(uint256)",
            vec![
                U256::from(trade_id).into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        // Check if L2 hash is empty
        let l2_hash = if result.8 == H256::zero() {
            None
        } else {
            Some(result.8)
        };
        
        // Convert tuple to Trade
        let trade = Trade {
            trade_id,
            buy_order_id: result.0,
            sell_order_id: result.1,
            token_id: result.2,
            price: result.3,
            quantity: result.4,
            buyer: result.5,
            seller: result.6,
            timestamp: result.7,
            l2_hash,
        };
        
        Ok(trade)
    }
    
    /// Get order book for a token
    pub async fn get_order_book(
        &self,
        token_id: [u8; 32],
        depth: u32,
    ) -> Result<OrderBook, Error> {
        debug!("Getting order book for token: {:?}, depth: {}", token_id, depth);
        
        // Call the contract for bids
        let bids = self.client.call_contract::<Vec<(U256, U256, u64)>>(
            self.contract_address,
            "getOrderBookBids(bytes32,uint32)",
            vec![
                token_id.into(),
                depth.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        // Call the contract for asks
        let asks = self.client.call_contract::<Vec<(U256, U256, u64)>>(
            self.contract_address,
            "getOrderBookAsks(bytes32,uint32)",
            vec![
                token_id.into(),
                depth.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        // Call the contract for last trade price
        let (last_price, last_update) = self.client.call_contract::<(U256, u64)>(
            self.contract_address,
            "getLastTradePrice(bytes32)",
            vec![
                token_id.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        // Convert tuples to OrderBookEntry
        let bid_entries = bids.into_iter().map(|(price, quantity, count)| OrderBookEntry {
            price,
            quantity,
            order_count: count,
        }).collect();
        
        let ask_entries = asks.into_iter().map(|(price, quantity, count)| OrderBookEntry {
            price,
            quantity,
            order_count: count,
        }).collect();
        
        // Create OrderBook
        let order_book = OrderBook {
            token_id,
            bids: bid_entries,
            asks: ask_entries,
            last_trade_price: last_price,
            last_update_time: last_update,
        };
        
        Ok(order_book)
    }
    
    /// Get orders by trader
    pub async fn get_orders_by_trader(
        &self,
        trader: Address,
    ) -> Result<Vec<u64>, Error> {
        debug!("Getting orders for trader: {:?}", trader);
        
        // Call the contract
        let order_ids = self.client.call_contract::<Vec<u64>>(
            self.contract_address,
            "getOrdersByTrader(address)",
            vec![
                trader.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(order_ids)
    }
    
    /// Get orders by token
    pub async fn get_orders_by_token(
        &self,
        token_id: [u8; 32],
    ) -> Result<Vec<u64>, Error> {
        debug!("Getting orders for token: {:?}", token_id);
        
        // Call the contract
        let order_ids = self.client.call_contract::<Vec<u64>>(
            self.contract_address,
            "getOrdersByToken(bytes32)",
            vec![
                token_id.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(order_ids)
    }
    
    /// Get active orders
    pub async fn get_active_orders(
        &self,
    ) -> Result<Vec<u64>, Error> {
        debug!("Getting all active orders");
        
        // Call the contract
        let order_ids = self.client.call_contract::<Vec<u64>>(
            self.contract_address,
            "getActiveOrders()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(order_ids)
    }
    
    /// Get trade history for a token
    pub async fn get_trade_history(
        &self,
        token_id: [u8; 32],
        limit: u32,
    ) -> Result<Vec<Trade>, Error> {
        debug!("Getting trade history for token: {:?}, limit: {}", token_id, limit);
        
        // Call the contract
        let trade_ids = self.client.call_contract::<Vec<u64>>(
            self.contract_address,
            "getTradeHistory(bytes32,uint32)",
            vec![
                token_id.into(),
                limit.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        // Get details for each trade
        let mut trades = Vec::new();
        for id in trade_ids {
            if let Ok(trade) = self.get_trade(id).await {
                trades.push(trade);
            }
        }
        
        Ok(trades)
    }
    
    /// Match orders automatically
    pub async fn match_orders(
        &self,
        token_id: [u8; 32],
        max_matches: u32,
    ) -> Result<Vec<u64>, Error> {
        info!("Matching orders for token: {:?}, max_matches: {}", token_id, max_matches);
        
        // Call the contract
        let trade_ids = self.client.call_contract::<Vec<u64>>(
            self.contract_address,
            "matchOrders(bytes32,uint32)",
            vec![
                token_id.into(),
                max_matches.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(trade_ids)
    }
    
    /// Set delegation status for a trader
    pub async fn set_trading_delegation(
        &self,
        delegate: Address,
        approved: bool,
    ) -> Result<(), Error> {
        info!("Setting trading delegation for delegate: {:?} to {}", delegate, approved);
        
        // Call the contract
        self.client.send_transaction(
            self.contract_address,
            "setTradingDelegation(address,bool)",
            vec![
                delegate.into(),
                approved.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
    
    /// Check if delegate is approved for trader
    pub async fn is_approved_delegate(
        &self,
        trader: Address,
        delegate: Address,
    ) -> Result<bool, Error> {
        debug!("Checking if delegate: {:?} is approved for trader: {:?}", delegate, trader);
        
        // Call the contract
        let approved = self.client.call_contract::<bool>(
            self.contract_address,
            "isApprovedDelegate(address,address)",
            vec![
                trader.into(),
                delegate.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(approved)
    }
    
    /// Sign an order using the client's wallet
    pub async fn sign_order(
        &self,
        order_id: u64,
    ) -> Result<Vec<u8>, Error> {
        debug!("Signing order: {}", order_id);
        
        // Get order details
        let order = self.get_order(order_id).await?;
        
        // Serialize order data for signing
        let order_data = [
            order.token_id.as_slice(),
            &(order.side as u8).to_be_bytes(),
            &(order.order_type as u8).to_be_bytes(),
            &order.price.to_be_bytes(),
            &order.quantity.to_be_bytes(),
            &order.expiration_time.to_be_bytes(),
        ].concat();
        
        // Sign the data
        let signature = self.client.sign_message(order_data).await
            .map_err(|e| Error::Encoding(format!("Failed to sign order: {}", e)))?;
        
        Ok(signature)
    }
} 