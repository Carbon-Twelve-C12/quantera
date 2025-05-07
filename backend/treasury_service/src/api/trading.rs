use crate::{
    api::{ApiServices, ApiError, with_services, with_auth},
    Error as ServiceError,
};
use serde::{Serialize, Deserialize};
use warp::{Filter, Rejection, Reply};
use std::sync::Arc;
use tracing::{info, debug, error};
use alloy_primitives::{Address, U256};
use uuid::Uuid;

/// Order type
#[derive(Debug, Serialize, Deserialize, Copy, Clone, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum OrderType {
    Buy,
    Sell,
}

/// Order status
#[derive(Debug, Serialize, Deserialize, Copy, Clone, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum OrderStatus {
    Pending,
    Open,
    PartiallyFilled,
    Filled,
    Cancelled,
    Rejected,
    Expired,
}

/// Order request
#[derive(Debug, Serialize, Deserialize)]
pub struct PlaceOrderRequest {
    pub wallet_address: String,
    pub treasury_id: String,
    pub order_type: String, // "buy" or "sell"
    pub quantity: String,
    pub price: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expiration: Option<u64>, // Timestamp in seconds
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_l2: Option<bool>, // Whether to place on L2
    #[serde(skip_serializing_if = "Option::is_none")]
    pub partition: Option<String>, // ERC-1400 partition
}

/// Cancel order request
#[derive(Debug, Serialize, Deserialize)]
pub struct CancelOrderRequest {
    pub wallet_address: String,
    pub order_id: String,
}

/// Order response
#[derive(Debug, Serialize, Deserialize)]
pub struct OrderResponse {
    pub order_id: String,
    pub wallet_address: String,
    pub treasury_id: String,
    pub order_type: String,
    pub quantity: String,
    pub price: String,
    pub status: String,
    pub created_at: u64,
    pub updated_at: u64,
    pub filled_quantity: String,
    pub remaining_quantity: String,
    pub expiration: Option<u64>,
    pub is_l2: bool,
    pub gas_saved: Option<String>,
    pub partition: Option<String>,
    pub tx_hash: Option<String>,
}

/// Create trading routes
pub fn routes(
    services: Arc<ApiServices>,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    let place_order_route = warp::path!("trading" / "orders")
        .and(warp::post())
        .and(with_auth(services.auth_service.clone()))
        .and(warp::body::json())
        .and(with_services(services.clone()))
        .and_then(place_order_handler);
    
    let cancel_order_route = warp::path!("trading" / "orders" / "cancel")
        .and(warp::post())
        .and(with_auth(services.auth_service.clone()))
        .and(warp::body::json())
        .and(with_services(services.clone()))
        .and_then(cancel_order_handler);
    
    let get_orders_route = warp::path!("trading" / "orders")
        .and(warp::get())
        .and(warp::query::<OrderQueryParams>())
        .and(with_auth(services.auth_service.clone()))
        .and(with_services(services.clone()))
        .and_then(get_orders_handler);
    
    let get_order_route = warp::path!("trading" / "orders" / String)
        .and(warp::get())
        .and(with_auth(services.auth_service.clone()))
        .and(with_services(services.clone()))
        .and_then(get_order_handler);
    
    place_order_route
        .or(cancel_order_route)
        .or(get_orders_route)
        .or(get_order_route)
}

/// Order query parameters
#[derive(Debug, Serialize, Deserialize, Default, Clone)]
pub struct OrderQueryParams {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub wallet_address: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub treasury_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub order_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub limit: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub offset: Option<usize>,
}

/// Place order handler
async fn place_order_handler(
    _token: String, // From auth middleware
    request: PlaceOrderRequest,
    services: Arc<ApiServices>,
) -> Result<impl Reply, Rejection> {
    info!("Placing order for user: {}", request.wallet_address);
    
    // Parse wallet address
    let wallet_address = parse_address(&request.wallet_address)?;
    
    // Parse treasury ID
    let treasury_id = parse_treasury_id(&request.treasury_id)?;
    
    // Parse order type
    let order_type = match request.order_type.to_lowercase().as_str() {
        "buy" => OrderType::Buy,
        "sell" => OrderType::Sell,
        _ => {
            return Err(warp::reject::custom(ApiError(
                ServiceError::InvalidParameter("Invalid order type".into())
            )));
        }
    };
    
    // Parse quantity
    let quantity = parse_decimal_str(&request.quantity)?;
    
    // Parse price
    let price = parse_decimal_str(&request.price)?;
    
    // Check if user is verified
    let user_status = services.user_service.get_user_verification_status(wallet_address)
        .await
        .map_err(|e| warp::reject::custom(ApiError(e)))?;
    
    // Check restrictions if this is a sell order
    if order_type == OrderType::Sell {
        let is_restricted = services.trading_client.is_restricted(wallet_address, treasury_id)
            .await
            .map_err(|e| warp::reject::custom(ApiError(e)))?;
        
        if is_restricted {
            return Err(warp::reject::custom(ApiError(
                ServiceError::Unauthorized("Trading is restricted for this treasury".into())
            )));
        }
        
        // Verify user has enough balance
        let token_info = services.registry_client.get_treasury_details(treasury_id)
            .await
            .map_err(|e| warp::reject::custom(ApiError(e)))?;
        
        let token_client = services.token_clients.treasury_token_client
            .clone();
        
        let balance = token_client.balance_of(wallet_address)
            .await
            .map_err(|e| warp::reject::custom(ApiError(e)))?;
        
        if balance < quantity {
            return Err(warp::reject::custom(ApiError(
                ServiceError::InvalidState("Insufficient balance".into())
            )));
        }
    }
    
    // Place order on L2 if requested
    let order_result = if request.use_l2.unwrap_or(false) {
        // Place order on L2
        place_l2_order(
            &services,
            wallet_address,
            treasury_id,
            order_type,
            quantity,
            price,
            request.expiration,
            request.partition.clone(),
        ).await?
    } else {
        // Place order on L1
        place_l1_order(
            &services,
            wallet_address,
            treasury_id,
            order_type,
            quantity,
            price,
            request.expiration,
            request.partition.clone(),
        ).await?
    };
    
    Ok(warp::reply::json(&order_result))
}

/// Place order on L1
async fn place_l1_order(
    services: &Arc<ApiServices>,
    wallet_address: Address,
    treasury_id: [u8; 32],
    order_type: OrderType,
    quantity: U256,
    price: U256,
    expiration: Option<u64>,
    partition: Option<String>,
) -> Result<OrderResponse, Rejection> {
    // In a real implementation, this would interact with the TradingClient to place an order
    // For this example, we'll just create a mock order response
    
    // Generate order ID
    let order_id = Uuid::new_v4().to_string();
    
    // Get current timestamp
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    
    // Create order response
    let order = OrderResponse {
        order_id,
        wallet_address: wallet_address.to_string(),
        treasury_id: hex::encode(treasury_id),
        order_type: match order_type {
            OrderType::Buy => "buy".to_string(),
            OrderType::Sell => "sell".to_string(),
        },
        quantity: quantity.to_string(),
        price: price.to_string(),
        status: "open".to_string(),
        created_at: now,
        updated_at: now,
        filled_quantity: "0".to_string(),
        remaining_quantity: quantity.to_string(),
        expiration,
        is_l2: false,
        gas_saved: None,
        partition,
        tx_hash: Some(format!("0x{}", hex::encode(rand::random::<[u8; 32]>()))),
    };
    
    Ok(order)
}

/// Place order on L2
async fn place_l2_order(
    services: &Arc<ApiServices>,
    wallet_address: Address,
    treasury_id: [u8; 32],
    order_type: OrderType,
    quantity: U256,
    price: U256,
    expiration: Option<u64>,
    partition: Option<String>,
) -> Result<OrderResponse, Rejection> {
    // In a real implementation, this would interact with the L2Client to place an order on L2
    // For this example, we'll just create a mock order response
    
    // Generate order ID
    let order_id = Uuid::new_v4().to_string();
    
    // Get current timestamp
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    
    // Create order response
    let order = OrderResponse {
        order_id,
        wallet_address: wallet_address.to_string(),
        treasury_id: hex::encode(treasury_id),
        order_type: match order_type {
            OrderType::Buy => "buy".to_string(),
            OrderType::Sell => "sell".to_string(),
        },
        quantity: quantity.to_string(),
        price: price.to_string(),
        status: "open".to_string(),
        created_at: now,
        updated_at: now,
        filled_quantity: "0".to_string(),
        remaining_quantity: quantity.to_string(),
        expiration,
        is_l2: true,
        gas_saved: Some("85%".to_string()),  // Mock gas savings from L2
        partition,
        tx_hash: Some(format!("0x{}", hex::encode(rand::random::<[u8; 32]>()))),
    };
    
    Ok(order)
}

/// Cancel order handler
async fn cancel_order_handler(
    _token: String, // From auth middleware
    request: CancelOrderRequest,
    services: Arc<ApiServices>,
) -> Result<impl Reply, Rejection> {
    info!("Cancelling order: {}", request.order_id);
    
    // Parse wallet address
    let wallet_address = parse_address(&request.wallet_address)?;
    
    // In a real implementation, this would interact with the TradingClient to cancel an order
    // For this example, we'll just create a mock response
    
    // Get current timestamp
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    
    // Create response
    let response = serde_json::json!({
        "success": true,
        "order_id": request.order_id,
        "status": "cancelled",
        "cancelled_at": now,
        "message": "Order successfully cancelled"
    });
    
    Ok(warp::reply::json(&response))
}

/// Get orders handler
async fn get_orders_handler(
    params: OrderQueryParams,
    _token: String, // From auth middleware
    services: Arc<ApiServices>,
) -> Result<impl Reply, Rejection> {
    info!("Getting orders with filters: {:?}", params);
    
    // Parse wallet address if provided
    let wallet_address = if let Some(addr) = &params.wallet_address {
        Some(parse_address(addr)?)
    } else {
        None
    };
    
    // Parse treasury ID if provided
    let treasury_id = if let Some(id) = &params.treasury_id {
        Some(parse_treasury_id(id)?)
    } else {
        None
    };
    
    // In a real implementation, this would fetch orders from the TradingClient
    // For this example, we'll just create mock orders
    
    // Create mock orders
    let mut orders = Vec::new();
    for i in 0..10 {
        let order_type = if i % 2 == 0 { "buy" } else { "sell" };
        let status = match i % 5 {
            0 => "open",
            1 => "filled",
            2 => "partially_filled",
            3 => "cancelled",
            _ => "expired",
        };
        
        // Create mock order
        let order = OrderResponse {
            order_id: Uuid::new_v4().to_string(),
            wallet_address: wallet_address.unwrap_or(Address::ZERO).to_string(),
            treasury_id: treasury_id.map(hex::encode).unwrap_or_else(|| hex::encode(rand::random::<[u8; 32]>())),
            order_type: order_type.to_string(),
            quantity: format!("{}", (i + 1) * 1000),
            price: format!("{}", 100 + i * 5),
            status: status.to_string(),
            created_at: chrono::Utc::now().timestamp() as u64 - i * 3600,
            updated_at: chrono::Utc::now().timestamp() as u64 - i * 1800,
            filled_quantity: if status == "filled" {
                format!("{}", (i + 1) * 1000)
            } else if status == "partially_filled" {
                format!("{}", (i + 1) * 500)
            } else {
                "0".to_string()
            },
            remaining_quantity: if status == "filled" {
                "0".to_string()
            } else if status == "partially_filled" {
                format!("{}", (i + 1) * 500)
            } else {
                format!("{}", (i + 1) * 1000)
            },
            expiration: Some(chrono::Utc::now().timestamp() as u64 + 86400),
            is_l2: i % 3 == 0,
            gas_saved: if i % 3 == 0 { Some("82%".to_string()) } else { None },
            partition: if i % 4 == 0 { Some("default".to_string()) } else { None },
            tx_hash: Some(format!("0x{}", hex::encode(rand::random::<[u8; 32]>()))),
        };
        
        orders.push(order);
    }
    
    // Apply filters
    if let Some(order_type) = &params.order_type {
        orders.retain(|o| o.order_type == *order_type);
    }
    
    if let Some(status) = &params.status {
        orders.retain(|o| o.status == *status);
    }
    
    // Apply pagination
    let limit = params.limit.unwrap_or(10).min(100);
    let offset = params.offset.unwrap_or(0);
    
    let paginated = if offset < orders.len() {
        let end = (offset + limit).min(orders.len());
        orders[offset..end].to_vec()
    } else {
        vec![]
    };
    
    Ok(warp::reply::json(&paginated))
}

/// Get order by ID handler
async fn get_order_handler(
    order_id: String,
    _token: String, // From auth middleware
    services: Arc<ApiServices>,
) -> Result<impl Reply, Rejection> {
    info!("Getting order: {}", order_id);
    
    // In a real implementation, this would fetch the order from the TradingClient
    // For this example, we'll just create a mock order
    
    // Create mock order
    let order = OrderResponse {
        order_id: order_id.clone(),
        wallet_address: Address::ZERO.to_string(),
        treasury_id: hex::encode(rand::random::<[u8; 32]>()),
        order_type: "buy".to_string(),
        quantity: "1000".to_string(),
        price: "105".to_string(),
        status: "open".to_string(),
        created_at: chrono::Utc::now().timestamp() as u64 - 3600,
        updated_at: chrono::Utc::now().timestamp() as u64 - 1800,
        filled_quantity: "0".to_string(),
        remaining_quantity: "1000".to_string(),
        expiration: Some(chrono::Utc::now().timestamp() as u64 + 86400),
        is_l2: false,
        gas_saved: None,
        partition: None,
        tx_hash: Some(format!("0x{}", hex::encode(rand::random::<[u8; 32]>()))),
    };
    
    Ok(warp::reply::json(&order))
}

/// Parse address from string
fn parse_address(address: &str) -> Result<Address, Rejection> {
    Address::parse_checksummed(address, None)
        .map_err(|_| warp::reject::custom(ApiError(
            ServiceError::InvalidParameter("Invalid address format".into())
        )))
}

/// Parse treasury ID from hex string
fn parse_treasury_id(id: &str) -> Result<[u8; 32], Rejection> {
    let id_cleaned = id.trim_start_matches("0x");
    let bytes = hex::decode(id_cleaned)
        .map_err(|_| warp::reject::custom(ApiError(
            ServiceError::InvalidParameter("Invalid treasury ID format".into())
        )))?;
    
    if bytes.len() != 32 {
        return Err(warp::reject::custom(ApiError(
            ServiceError::InvalidParameter("Treasury ID must be 32 bytes".into())
        )));
    }
    
    let mut result = [0u8; 32];
    result.copy_from_slice(&bytes);
    Ok(result)
}

/// Parse decimal string to U256
fn parse_decimal_str(value: &str) -> Result<U256, Rejection> {
    // Remove commas if present
    let cleaned = value.replace(',', "");
    
    // Try to parse as integer first
    if let Ok(value) = cleaned.parse::<u64>() {
        return Ok(U256::from(value));
    }
    
    // Parse as floating point
    match cleaned.parse::<f64>() {
        Ok(value) => {
            // Convert to smallest unit (assuming 18 decimals)
            let smallest_unit = value * 1_000_000_000_000_000_000.0;
            
            // Convert to U256
            Ok(U256::from(smallest_unit as u64))
        },
        Err(_) => {
            Err(warp::reject::custom(ApiError(
                ServiceError::InvalidParameter(format!("Invalid numeric format: {}", value))
            )))
        }
    }
} 