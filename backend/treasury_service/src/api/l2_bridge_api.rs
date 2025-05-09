use std::sync::Arc;
use warp::{Filter, Rejection, Reply};
use serde::{Deserialize, Serialize};
use ethers::types::{Address, U256, H256};
use std::collections::HashMap;

use crate::clients::l2_bridge_client::{
    L2BridgeClient, L2Chain, MessageStatus, L2ChainInfo, CrossChainMessage,
    OrderBridgingRequest, OrderBridgingResult, TradeSettlementRequest, TradeSettlementResult,
    L2GasEstimation
};
use crate::ethereum_client::EthereumClient;
use crate::Error;
use crate::api::auth::{with_auth, Role, JwtClaims};
use crate::api::utils::{with_clients, json_response, json_error_response};

// Request types
#[derive(Debug, Deserialize)]
pub struct BridgeOrderRequest {
    pub order_id: String, // bytes32 as hex string
    pub treasury_id: String, // bytes32 as hex string
    pub user: String, // address as hex string
    pub is_buy: bool,
    pub amount: String, // U256 as string
    pub price: String, // U256 as string
    pub expiration: u64,
    pub signature: String, // bytes as hex string
    pub destination_chain_id: u64,
}

#[derive(Debug, Deserialize)]
pub struct SettleTradeRequest {
    pub trade_id: String, // bytes32 as hex string
    pub buy_order_id: String, // bytes32 as hex string
    pub sell_order_id: String, // bytes32 as hex string
    pub treasury_id: String, // bytes32 as hex string
    pub buyer: String, // address as hex string
    pub seller: String, // address as hex string
    pub amount: String, // U256 as string
    pub price: String, // U256 as string
    pub settlement_timestamp: u64,
    pub destination_chain_id: u64,
}

#[derive(Debug, Deserialize)]
pub struct RetryMessageRequest {
    pub message_id: String, // bytes32 as hex string
}

#[derive(Debug, Deserialize)]
pub struct UpdateMessageStatusRequest {
    pub message_id: String, // bytes32 as hex string
    pub status: MessageStatus,
    pub failure_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GasEstimationRequest {
    pub destination_chain_id: u64,
    pub data_size: u64,
    pub use_blob: bool,
}

// Response types
#[derive(Debug, Serialize)]
pub struct ChainInfoResponse {
    pub chain_id: u64,
    pub chain_type: L2Chain,
    pub name: String,
    pub enabled: bool,
    pub bridge_address: String,
    pub rollup_address: Option<String>,
    pub verification_blocks: u64,
    pub gas_token_symbol: String,
    pub native_token_price_usd: String,
    pub average_block_time: u64,
    pub blob_enabled: bool,
    pub max_message_size: u64,
}

#[derive(Debug, Serialize)]
pub struct MessageResponse {
    pub message_id: String,
    pub source_chain_id: u64,
    pub destination_chain_id: u64,
    pub sender: String,
    pub recipient: String,
    pub amount: String,
    pub data: String,
    pub timestamp: u64,
    pub nonce: String,
    pub status: MessageStatus,
    pub transaction_hash: String,
    pub confirmation_timestamp: Option<u64>,
    pub confirmation_transaction_hash: Option<String>,
    pub failure_reason: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct OrderBridgingResponse {
    pub message_id: String,
    pub source_transaction_hash: String,
    pub estimated_confirmation_time: u64,
    pub bridging_fee: String,
    pub status: MessageStatus,
}

#[derive(Debug, Serialize)]
pub struct TradeSettlementResponse {
    pub message_id: String,
    pub source_transaction_hash: String,
    pub estimated_confirmation_time: u64,
    pub settlement_fee: String,
    pub status: MessageStatus,
}

#[derive(Debug, Serialize)]
pub struct GasEstimationResponse {
    pub chain_id: u64,
    pub chain_type: L2Chain,
    pub gas_price_wei: String,
    pub gas_limit: String,
    pub estimated_cost_wei: String,
    pub estimated_cost_usd: f64,
    pub estimated_time_seconds: u64,
    pub blob_gas_price: Option<String>,
    pub blob_gas_limit: Option<String>,
    pub blob_cost_wei: Option<String>,
}

/**
 * Converts a chain info from the client format to the API response format
 */
fn chain_to_response(chain: L2ChainInfo) -> ChainInfoResponse {
    ChainInfoResponse {
        chain_id: chain.chain_id,
        chain_type: chain.chain_type,
        name: chain.name,
        enabled: chain.enabled,
        bridge_address: format!("{:?}", chain.bridge_address),
        rollup_address: chain.rollup_address.map(|addr| format!("{:?}", addr)),
        verification_blocks: chain.verification_blocks,
        gas_token_symbol: chain.gas_token_symbol,
        native_token_price_usd: chain.native_token_price_usd.to_string(),
        average_block_time: chain.average_block_time,
        blob_enabled: chain.blob_enabled,
        max_message_size: chain.max_message_size,
    }
}

/**
 * Converts a message from the client format to the API response format
 */
fn message_to_response(message: CrossChainMessage) -> MessageResponse {
    MessageResponse {
        message_id: format!("0x{}", hex::encode(message.message_id)),
        source_chain_id: message.source_chain_id,
        destination_chain_id: message.destination_chain_id,
        sender: format!("{:?}", message.sender),
        recipient: format!("{:?}", message.recipient),
        amount: message.amount.to_string(),
        data: format!("0x{}", hex::encode(&message.data)),
        timestamp: message.timestamp,
        nonce: message.nonce.to_string(),
        status: message.status,
        transaction_hash: format!("{:?}", message.transaction_hash),
        confirmation_timestamp: message.confirmation_timestamp,
        confirmation_transaction_hash: message.confirmation_transaction_hash.map(|hash| format!("{:?}", hash)),
        failure_reason: message.failure_reason,
    }
}

/**
 * Converts a bytes32 hex string to a [u8; 32] array
 */
fn hex_to_bytes32(hex_str: &str) -> Result<[u8; 32], String> {
    let hex_str = hex_str.trim_start_matches("0x");
    let bytes = hex::decode(hex_str).map_err(|e| format!("Invalid hex string: {}", e))?;
    
    if bytes.len() > 32 {
        return Err("Hex string too long for bytes32".to_string());
    }
    
    let mut result = [0u8; 32];
    let len = bytes.len().min(32);
    result[32 - len..].copy_from_slice(&bytes[0..len]);
    
    Ok(result)
}

/**
 * Create all API routes for L2 Bridge endpoints
 */
pub fn routes(
    ethereum_client: Arc<EthereumClient>,
    l2_bridge_address: Address,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    // GET /api/l2-bridge/chains - Get all supported chains
    let get_supported_chains = warp::path!("api" / "l2-bridge" / "chains")
        .and(warp::get())
        .and(with_clients(ethereum_client.clone(), l2_bridge_address))
        .and(with_auth(vec![Role::User, Role::Admin]))
        .and_then(handle_get_supported_chains);

    // GET /api/l2-bridge/chains/:chainId - Get chain info
    let get_chain_info = warp::path!("api" / "l2-bridge" / "chains" / u64)
        .and(warp::get())
        .and(with_clients(ethereum_client.clone(), l2_bridge_address))
        .and(with_auth(vec![Role::User, Role::Admin]))
        .and_then(handle_get_chain_info);

    // POST /api/l2-bridge/orders - Bridge an order
    let bridge_order = warp::path!("api" / "l2-bridge" / "orders")
        .and(warp::post())
        .and(warp::body::json())
        .and(with_clients(ethereum_client.clone(), l2_bridge_address))
        .and(with_auth(vec![Role::User, Role::Admin]))
        .and_then(handle_bridge_order);

    // POST /api/l2-bridge/trades - Settle a trade
    let settle_trade = warp::path!("api" / "l2-bridge" / "trades")
        .and(warp::post())
        .and(warp::body::json())
        .and(with_clients(ethereum_client.clone(), l2_bridge_address))
        .and(with_auth(vec![Role::User, Role::Admin]))
        .and_then(handle_settle_trade);

    // GET /api/l2-bridge/messages/:messageId - Get message details
    let get_message = warp::path!("api" / "l2-bridge" / "messages" / String)
        .and(warp::get())
        .and(with_clients(ethereum_client.clone(), l2_bridge_address))
        .and(with_auth(vec![Role::User, Role::Admin]))
        .and_then(handle_get_message);

    // GET /api/l2-bridge/messages/sender/:address - Get messages by sender
    let get_messages_by_sender = warp::path!("api" / "l2-bridge" / "messages" / "sender" / String)
        .and(warp::get())
        .and(with_clients(ethereum_client.clone(), l2_bridge_address))
        .and(with_auth(vec![Role::User, Role::Admin]))
        .and_then(handle_get_messages_by_sender);

    // GET /api/l2-bridge/messages/chain/:chainId - Get messages by chain
    let get_messages_by_chain = warp::path!("api" / "l2-bridge" / "messages" / "chain" / u64)
        .and(warp::get())
        .and(with_clients(ethereum_client.clone(), l2_bridge_address))
        .and(with_auth(vec![Role::User, Role::Admin]))
        .and_then(handle_get_messages_by_chain);

    // GET /api/l2-bridge/messages/pending - Get pending messages
    let get_pending_messages = warp::path!("api" / "l2-bridge" / "messages" / "pending")
        .and(warp::get())
        .and(with_clients(ethereum_client.clone(), l2_bridge_address))
        .and(with_auth(vec![Role::Admin]))
        .and_then(handle_get_pending_messages);

    // POST /api/l2-bridge/messages/retry - Retry a failed message
    let retry_message = warp::path!("api" / "l2-bridge" / "messages" / "retry")
        .and(warp::post())
        .and(warp::body::json())
        .and(with_clients(ethereum_client.clone(), l2_bridge_address))
        .and(with_auth(vec![Role::User, Role::Admin]))
        .and_then(handle_retry_message);

    // PUT /api/l2-bridge/messages/status - Update message status
    let update_message_status = warp::path!("api" / "l2-bridge" / "messages" / "status")
        .and(warp::put())
        .and(warp::body::json())
        .and(with_clients(ethereum_client.clone(), l2_bridge_address))
        .and(with_auth(vec![Role::Admin]))
        .and_then(handle_update_message_status);

    // GET /api/l2-bridge/orders/user/:address - Get orders by user
    let get_orders_by_user = warp::path!("api" / "l2-bridge" / "orders" / "user" / String)
        .and(warp::get())
        .and(with_clients(ethereum_client.clone(), l2_bridge_address))
        .and(with_auth(vec![Role::User, Role::Admin]))
        .and_then(handle_get_orders_by_user);

    // GET /api/l2-bridge/trades/user/:address - Get trades by user
    let get_trades_by_user = warp::path!("api" / "l2-bridge" / "trades" / "user" / String)
        .and(warp::get())
        .and(with_clients(ethereum_client.clone(), l2_bridge_address))
        .and(with_auth(vec![Role::User, Role::Admin]))
        .and_then(handle_get_trades_by_user);

    // POST /api/l2-bridge/gas-estimation - Estimate gas for bridging
    let estimate_gas = warp::path!("api" / "l2-bridge" / "gas-estimation")
        .and(warp::post())
        .and(warp::body::json())
        .and(with_clients(ethereum_client.clone(), l2_bridge_address))
        .and(with_auth(vec![Role::User, Role::Admin]))
        .and_then(handle_estimate_gas);

    // Combine all routes
    get_supported_chains
        .or(get_chain_info)
        .or(bridge_order)
        .or(settle_trade)
        .or(get_message)
        .or(get_messages_by_sender)
        .or(get_messages_by_chain)
        .or(get_pending_messages)
        .or(retry_message)
        .or(update_message_status)
        .or(get_orders_by_user)
        .or(get_trades_by_user)
        .or(estimate_gas)
}

// Route handlers

/// Handle GET /api/l2-bridge/chains
async fn handle_get_supported_chains(
    client: L2BridgeClient<EthereumClient>,
    _claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    match client.get_supported_chains().await {
        Ok(chains) => {
            let response_chains: Vec<ChainInfoResponse> = chains
                .iter()
                .map(|chain| chain_to_response(chain.clone()))
                .collect();
            json_response(&response_chains)
        }
        Err(err) => json_error_response(&format!("Failed to get supported chains: {}", err), 500),
    }
}

/// Handle GET /api/l2-bridge/chains/:chainId
async fn handle_get_chain_info(
    chain_id: u64,
    client: L2BridgeClient<EthereumClient>,
    _claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    match client.get_chain_info(chain_id).await {
        Ok(chain) => json_response(&chain_to_response(chain)),
        Err(err) => json_error_response(&format!("Failed to get chain info: {}", err), 404),
    }
}

/// Handle POST /api/l2-bridge/orders
async fn handle_bridge_order(
    request: BridgeOrderRequest,
    client: L2BridgeClient<EthereumClient>,
    claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    // Parse the request parameters
    let order_id = match hex_to_bytes32(&request.order_id) {
        Ok(id) => id,
        Err(e) => return json_error_response(&format!("Invalid order ID: {}", e), 400),
    };
    
    let treasury_id = match hex_to_bytes32(&request.treasury_id) {
        Ok(id) => id,
        Err(e) => return json_error_response(&format!("Invalid treasury ID: {}", e), 400),
    };
    
    let user = match request.user.parse::<Address>() {
        Ok(addr) => addr,
        Err(_) => return json_error_response("Invalid user address", 400),
    };
    
    let amount = match request.amount.parse::<U256>() {
        Ok(amt) => amt,
        Err(_) => return json_error_response("Invalid amount", 400),
    };
    
    let price = match request.price.parse::<U256>() {
        Ok(p) => p,
        Err(_) => return json_error_response("Invalid price", 400),
    };
    
    let signature = match hex::decode(request.signature.trim_start_matches("0x")) {
        Ok(sig) => sig,
        Err(_) => return json_error_response("Invalid signature format", 400),
    };
    
    // Create the order bridging request
    let order_request = OrderBridgingRequest {
        order_id,
        treasury_id,
        user,
        is_buy: request.is_buy,
        amount,
        price,
        expiration: request.expiration,
        signature,
        destination_chain_id: request.destination_chain_id,
    };
    
    // Bridge the order
    match client.bridge_order(order_request).await {
        Ok(result) => {
            let response = OrderBridgingResponse {
                message_id: format!("0x{}", hex::encode(result.message_id)),
                source_transaction_hash: format!("{:?}", result.source_transaction_hash),
                estimated_confirmation_time: result.estimated_confirmation_time,
                bridging_fee: result.bridging_fee.to_string(),
                status: result.status,
            };
            json_response(&response)
        },
        Err(err) => json_error_response(&format!("Failed to bridge order: {}", err), 500),
    }
}

/// Handle POST /api/l2-bridge/trades
async fn handle_settle_trade(
    request: SettleTradeRequest,
    client: L2BridgeClient<EthereumClient>,
    claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    // Parse the request parameters
    let trade_id = match hex_to_bytes32(&request.trade_id) {
        Ok(id) => id,
        Err(e) => return json_error_response(&format!("Invalid trade ID: {}", e), 400),
    };
    
    let buy_order_id = match hex_to_bytes32(&request.buy_order_id) {
        Ok(id) => id,
        Err(e) => return json_error_response(&format!("Invalid buy order ID: {}", e), 400),
    };
    
    let sell_order_id = match hex_to_bytes32(&request.sell_order_id) {
        Ok(id) => id,
        Err(e) => return json_error_response(&format!("Invalid sell order ID: {}", e), 400),
    };
    
    let treasury_id = match hex_to_bytes32(&request.treasury_id) {
        Ok(id) => id,
        Err(e) => return json_error_response(&format!("Invalid treasury ID: {}", e), 400),
    };
    
    let buyer = match request.buyer.parse::<Address>() {
        Ok(addr) => addr,
        Err(_) => return json_error_response("Invalid buyer address", 400),
    };
    
    let seller = match request.seller.parse::<Address>() {
        Ok(addr) => addr,
        Err(_) => return json_error_response("Invalid seller address", 400),
    };
    
    let amount = match request.amount.parse::<U256>() {
        Ok(amt) => amt,
        Err(_) => return json_error_response("Invalid amount", 400),
    };
    
    let price = match request.price.parse::<U256>() {
        Ok(p) => p,
        Err(_) => return json_error_response("Invalid price", 400),
    };
    
    // Create the trade settlement request
    let trade_request = TradeSettlementRequest {
        trade_id,
        buy_order_id,
        sell_order_id,
        treasury_id,
        buyer,
        seller,
        amount,
        price,
        settlement_timestamp: request.settlement_timestamp,
        destination_chain_id: request.destination_chain_id,
    };
    
    // Settle the trade
    match client.settle_trade(trade_request).await {
        Ok(result) => {
            let response = TradeSettlementResponse {
                message_id: format!("0x{}", hex::encode(result.message_id)),
                source_transaction_hash: format!("{:?}", result.source_transaction_hash),
                estimated_confirmation_time: result.estimated_confirmation_time,
                settlement_fee: result.settlement_fee.to_string(),
                status: result.status,
            };
            json_response(&response)
        },
        Err(err) => json_error_response(&format!("Failed to settle trade: {}", err), 500),
    }
}

/// Handle GET /api/l2-bridge/messages/:messageId
async fn handle_get_message(
    message_id: String,
    client: L2BridgeClient<EthereumClient>,
    _claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    let message_id_bytes = match hex_to_bytes32(&message_id) {
        Ok(id) => id,
        Err(e) => return json_error_response(&format!("Invalid message ID: {}", e), 400),
    };
    
    match client.get_message_details(message_id_bytes).await {
        Ok(message) => json_response(&message_to_response(message)),
        Err(err) => json_error_response(&format!("Failed to get message: {}", err), 404),
    }
}

/// Handle GET /api/l2-bridge/messages/sender/:address
async fn handle_get_messages_by_sender(
    sender_address: String,
    client: L2BridgeClient<EthereumClient>,
    _claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    let sender = match sender_address.parse::<Address>() {
        Ok(addr) => addr,
        Err(_) => return json_error_response("Invalid sender address", 400),
    };
    
    match client.get_messages_with_details_by_sender(sender).await {
        Ok(messages) => {
            let response_messages: Vec<MessageResponse> = messages
                .iter()
                .map(|message| message_to_response(message.clone()))
                .collect();
            json_response(&response_messages)
        },
        Err(err) => json_error_response(&format!("Failed to get messages by sender: {}", err), 500),
    }
}

/// Handle GET /api/l2-bridge/messages/chain/:chainId
async fn handle_get_messages_by_chain(
    chain_id: u64,
    client: L2BridgeClient<EthereumClient>,
    _claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    match client.get_messages_by_chain(chain_id).await {
        Ok(message_ids) => {
            let mut messages = Vec::new();
            for message_id in message_ids {
                if let Ok(message) = client.get_message_details(message_id).await {
                    messages.push(message_to_response(message));
                }
            }
            json_response(&messages)
        },
        Err(err) => json_error_response(&format!("Failed to get messages by chain: {}", err), 500),
    }
}

/// Handle GET /api/l2-bridge/messages/pending
async fn handle_get_pending_messages(
    client: L2BridgeClient<EthereumClient>,
    _claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    match client.get_pending_messages().await {
        Ok(message_ids) => {
            let mut messages = Vec::new();
            for message_id in message_ids {
                if let Ok(message) = client.get_message_details(message_id).await {
                    messages.push(message_to_response(message));
                }
            }
            json_response(&messages)
        },
        Err(err) => json_error_response(&format!("Failed to get pending messages: {}", err), 500),
    }
}

/// Handle POST /api/l2-bridge/messages/retry
async fn handle_retry_message(
    request: RetryMessageRequest,
    client: L2BridgeClient<EthereumClient>,
    claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    let message_id_bytes = match hex_to_bytes32(&request.message_id) {
        Ok(id) => id,
        Err(e) => return json_error_response(&format!("Invalid message ID: {}", e), 400),
    };
    
    match client.retry_message(message_id_bytes).await {
        Ok(success) => {
            if success {
                json_response(&serde_json::json!({ "success": true }))
            } else {
                json_error_response("Failed to retry message", 500)
            }
        },
        Err(err) => json_error_response(&format!("Failed to retry message: {}", err), 500),
    }
}

/// Handle PUT /api/l2-bridge/messages/status
async fn handle_update_message_status(
    request: UpdateMessageStatusRequest,
    client: L2BridgeClient<EthereumClient>,
    _claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    // Not implemented in the client yet, but would be added to update message status
    json_error_response("Not implemented", 501)
}

/// Handle GET /api/l2-bridge/orders/user/:address
async fn handle_get_orders_by_user(
    user_address: String,
    client: L2BridgeClient<EthereumClient>,
    _claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    let user = match user_address.parse::<Address>() {
        Ok(addr) => addr,
        Err(_) => return json_error_response("Invalid user address", 400),
    };
    
    match client.get_orders_by_user(user).await {
        Ok(orders) => {
            json_response(&orders)
        },
        Err(err) => json_error_response(&format!("Failed to get orders by user: {}", err), 500),
    }
}

/// Handle GET /api/l2-bridge/trades/user/:address
async fn handle_get_trades_by_user(
    user_address: String,
    client: L2BridgeClient<EthereumClient>,
    _claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    let user = match user_address.parse::<Address>() {
        Ok(addr) => addr,
        Err(_) => return json_error_response("Invalid user address", 400),
    };
    
    match client.get_trades_by_user(user).await {
        Ok(trades) => {
            json_response(&trades)
        },
        Err(err) => json_error_response(&format!("Failed to get trades by user: {}", err), 500),
    }
}

/// Handle POST /api/l2-bridge/gas-estimation
async fn handle_estimate_gas(
    request: GasEstimationRequest,
    client: L2BridgeClient<EthereumClient>,
    _claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    match client.estimate_bridging_gas(
        request.destination_chain_id,
        request.data_size,
        request.use_blob
    ).await {
        Ok(estimation) => {
            let response = GasEstimationResponse {
                chain_id: estimation.chain_id,
                chain_type: estimation.chain_type,
                gas_price_wei: estimation.gas_price_wei.to_string(),
                gas_limit: estimation.gas_limit.to_string(),
                estimated_cost_wei: estimation.estimated_cost_wei.to_string(),
                estimated_cost_usd: estimation.estimated_cost_usd,
                estimated_time_seconds: estimation.estimated_time_seconds,
                blob_gas_price: estimation.blob_gas_price.map(|p| p.to_string()),
                blob_gas_limit: estimation.blob_gas_limit.map(|l| l.to_string()),
                blob_cost_wei: estimation.blob_cost_wei.map(|c| c.to_string()),
            };
            json_response(&response)
        },
        Err(err) => json_error_response(&format!("Failed to estimate gas: {}", err), 500),
    }
} 