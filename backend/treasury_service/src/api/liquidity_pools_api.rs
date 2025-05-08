use warp::{Filter, Rejection, Reply};
use serde::{Serialize, Deserialize};
use ethers::types::{H256, Address, U256};
use std::sync::Arc;
use std::convert::TryFrom;

use crate::clients::liquidity_pools_client::{LiquidityPoolsClient, PoolConfig, PoolState, Position, AssetClass};
use crate::ethereum_client::EthereumClient;
use crate::auth::jwt::with_auth;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePoolRequest {
    pub token_a: String,
    pub token_b: String,
    pub asset_class_a: String,
    pub asset_class_b: String,
    pub fee_tier: u32,
    pub initial_sqrt_price: String,
    pub tick_spacing: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddLiquidityRequest {
    pub pool_id: String,
    pub lower_tick: i32,
    pub upper_tick: i32,
    pub amount0_desired: String,
    pub amount1_desired: String,
    pub amount0_min: String,
    pub amount1_min: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemoveLiquidityRequest {
    pub position_id: String,
    pub liquidity_amount: String,
    pub amount0_min: String,
    pub amount1_min: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectFeesRequest {
    pub position_id: String,
    pub recipient: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SwapRequest {
    pub pool_id: String,
    pub recipient: String,
    pub zero_for_one: bool,
    pub amount_specified: String,
    pub sqrt_price_limit_x96: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PoolResponse {
    pub pool_id: String,
    pub token_a: String,
    pub token_b: String,
    pub asset_class_a: String,
    pub asset_class_b: String,
    pub fee_tier: u32,
    pub initial_sqrt_price: String,
    pub tick_spacing: u32,
    pub active: bool,
    pub owner: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PoolStateResponse {
    pub sqrt_price_x96: String,
    pub tick: i32,
    pub total_liquidity: String,
    pub volume_token_a: String,
    pub volume_token_b: String,
    pub fees_collected_a: String,
    pub fees_collected_b: String,
    pub last_updated: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PositionResponse {
    pub position_id: String,
    pub pool_id: String,
    pub owner: String,
    pub lower_tick: i32,
    pub upper_tick: i32,
    pub liquidity: String,
    pub tokens_owed_a: String,
    pub tokens_owed_b: String,
    pub created_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiError {
    pub message: String,
}

pub fn liquidity_pools_routes(
    ethereum_client: Arc<EthereumClient>,
    liquidity_pools_address: Address,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    let client = Arc::new(move || {
        LiquidityPoolsClient::new(ethereum_client.clone(), liquidity_pools_address)
    });
    
    let create_pool = warp::path!("liquidity" / "pools")
        .and(warp::post())
        .and(with_auth())
        .and(warp::body::json::<CreatePoolRequest>())
        .and(warp::any().map(move || client.clone()))
        .and_then(create_pool_handler);
        
    let add_liquidity = warp::path!("liquidity" / "positions")
        .and(warp::post())
        .and(with_auth())
        .and(warp::body::json::<AddLiquidityRequest>())
        .and(warp::any().map(move || client.clone()))
        .and_then(add_liquidity_handler);
        
    let remove_liquidity = warp::path!("liquidity" / "positions" / "remove")
        .and(warp::post())
        .and(with_auth())
        .and(warp::body::json::<RemoveLiquidityRequest>())
        .and(warp::any().map(move || client.clone()))
        .and_then(remove_liquidity_handler);
        
    let collect_fees = warp::path!("liquidity" / "positions" / "collect-fees")
        .and(warp::post())
        .and(with_auth())
        .and(warp::body::json::<CollectFeesRequest>())
        .and(warp::any().map(move || client.clone()))
        .and_then(collect_fees_handler);
        
    let swap = warp::path!("liquidity" / "swap")
        .and(warp::post())
        .and(with_auth())
        .and(warp::body::json::<SwapRequest>())
        .and(warp::any().map(move || client.clone()))
        .and_then(swap_handler);
        
    let get_pools = warp::path!("liquidity" / "pools")
        .and(warp::get())
        .and(warp::any().map(move || client.clone()))
        .and_then(get_pools_handler);
        
    let get_pool = warp::path!("liquidity" / "pools" / String)
        .and(warp::get())
        .and(warp::any().map(move || client.clone()))
        .and_then(get_pool_handler);
        
    let get_pool_state = warp::path!("liquidity" / "pools" / String / "state")
        .and(warp::get())
        .and(warp::any().map(move || client.clone()))
        .and_then(get_pool_state_handler);
        
    let get_user_positions = warp::path!("liquidity" / "positions" / "user" / String)
        .and(warp::get())
        .and(warp::any().map(move || client.clone()))
        .and_then(get_user_positions_handler);
        
    let get_position = warp::path!("liquidity" / "positions" / String)
        .and(warp::get())
        .and(warp::any().map(move || client.clone()))
        .and_then(get_position_handler);
    
    create_pool
        .or(add_liquidity)
        .or(remove_liquidity)
        .or(collect_fees)
        .or(swap)
        .or(get_pools)
        .or(get_pool)
        .or(get_pool_state)
        .or(get_user_positions)
        .or(get_position)
}

async fn create_pool_handler(
    _user_id: String,
    req: CreatePoolRequest,
    client_fn: Arc<dyn Fn() -> LiquidityPoolsClient<EthereumClient> + Send + Sync>,
) -> Result<impl Reply, Rejection> {
    let client = client_fn();
    
    // Parse token addresses
    let token_a = req.token_a.parse::<Address>().map_err(|_| {
        warp::reject::custom(ApiError {
            message: "Invalid token_a address".to_string(),
        })
    })?;
    
    let token_b = req.token_b.parse::<Address>().map_err(|_| {
        warp::reject::custom(ApiError {
            message: "Invalid token_b address".to_string(),
        })
    })?;
    
    // Parse asset classes
    let asset_class_a = parse_asset_class(&req.asset_class_a)?;
    let asset_class_b = parse_asset_class(&req.asset_class_b)?;
    
    // Parse initial sqrt price
    let initial_sqrt_price = req.initial_sqrt_price.parse::<U256>().map_err(|_| {
        warp::reject::custom(ApiError {
            message: "Invalid initial_sqrt_price".to_string(),
        })
    })?;
    
    // Create pool
    let result = client
        .create_pool(
            token_a,
            token_b,
            asset_class_a,
            asset_class_b,
            req.fee_tier,
            initial_sqrt_price,
            req.tick_spacing,
        )
        .await
        .map_err(|e| {
            warp::reject::custom(ApiError {
                message: format!("Failed to create pool: {}", e),
            })
        })?;
    
    let response = serde_json::json!({
        "pool_id": format!("0x{}", hex::encode(result)),
        "status": "success"
    });
    
    Ok(warp::reply::json(&response))
}

async fn add_liquidity_handler(
    _user_id: String,
    req: AddLiquidityRequest,
    client_fn: Arc<dyn Fn() -> LiquidityPoolsClient<EthereumClient> + Send + Sync>,
) -> Result<impl Reply, Rejection> {
    let client = client_fn();
    
    // Parse pool ID
    let pool_id = parse_bytes32(&req.pool_id)?;
    
    // Parse amounts
    let amount0_desired = req.amount0_desired.parse::<U256>().map_err(|_| {
        warp::reject::custom(ApiError {
            message: "Invalid amount0_desired".to_string(),
        })
    })?;
    
    let amount1_desired = req.amount1_desired.parse::<U256>().map_err(|_| {
        warp::reject::custom(ApiError {
            message: "Invalid amount1_desired".to_string(),
        })
    })?;
    
    let amount0_min = req.amount0_min.parse::<U256>().map_err(|_| {
        warp::reject::custom(ApiError {
            message: "Invalid amount0_min".to_string(),
        })
    })?;
    
    let amount1_min = req.amount1_min.parse::<U256>().map_err(|_| {
        warp::reject::custom(ApiError {
            message: "Invalid amount1_min".to_string(),
        })
    })?;
    
    // Add liquidity
    let (position_id, liquidity, amount0, amount1) = client
        .add_liquidity(
            pool_id,
            req.lower_tick,
            req.upper_tick,
            amount0_desired,
            amount1_desired,
            amount0_min,
            amount1_min,
        )
        .await
        .map_err(|e| {
            warp::reject::custom(ApiError {
                message: format!("Failed to add liquidity: {}", e),
            })
        })?;
    
    let response = serde_json::json!({
        "position_id": format!("0x{}", hex::encode(position_id)),
        "liquidity": liquidity.to_string(),
        "amount0": amount0.to_string(),
        "amount1": amount1.to_string(),
        "status": "success"
    });
    
    Ok(warp::reply::json(&response))
}

async fn remove_liquidity_handler(
    _user_id: String,
    req: RemoveLiquidityRequest,
    client_fn: Arc<dyn Fn() -> LiquidityPoolsClient<EthereumClient> + Send + Sync>,
) -> Result<impl Reply, Rejection> {
    let client = client_fn();
    
    // Parse position ID
    let position_id = parse_bytes32(&req.position_id)?;
    
    // Parse amounts
    let liquidity_amount = req.liquidity_amount.parse::<u128>().map_err(|_| {
        warp::reject::custom(ApiError {
            message: "Invalid liquidity_amount".to_string(),
        })
    })?;
    
    let amount0_min = req.amount0_min.parse::<U256>().map_err(|_| {
        warp::reject::custom(ApiError {
            message: "Invalid amount0_min".to_string(),
        })
    })?;
    
    let amount1_min = req.amount1_min.parse::<U256>().map_err(|_| {
        warp::reject::custom(ApiError {
            message: "Invalid amount1_min".to_string(),
        })
    })?;
    
    // Remove liquidity
    let (amount0, amount1) = client
        .remove_liquidity(
            position_id,
            liquidity_amount,
            amount0_min,
            amount1_min,
        )
        .await
        .map_err(|e| {
            warp::reject::custom(ApiError {
                message: format!("Failed to remove liquidity: {}", e),
            })
        })?;
    
    let response = serde_json::json!({
        "amount0": amount0.to_string(),
        "amount1": amount1.to_string(),
        "status": "success"
    });
    
    Ok(warp::reply::json(&response))
}

async fn collect_fees_handler(
    _user_id: String,
    req: CollectFeesRequest,
    client_fn: Arc<dyn Fn() -> LiquidityPoolsClient<EthereumClient> + Send + Sync>,
) -> Result<impl Reply, Rejection> {
    let client = client_fn();
    
    // Parse position ID
    let position_id = parse_bytes32(&req.position_id)?;
    
    // Parse recipient address
    let recipient = req.recipient.parse::<Address>().map_err(|_| {
        warp::reject::custom(ApiError {
            message: "Invalid recipient address".to_string(),
        })
    })?;
    
    // Collect fees
    let (amount0, amount1) = client
        .collect_fees(position_id, recipient)
        .await
        .map_err(|e| {
            warp::reject::custom(ApiError {
                message: format!("Failed to collect fees: {}", e),
            })
        })?;
    
    let response = serde_json::json!({
        "amount0": amount0.to_string(),
        "amount1": amount1.to_string(),
        "status": "success"
    });
    
    Ok(warp::reply::json(&response))
}

async fn swap_handler(
    _user_id: String,
    req: SwapRequest,
    client_fn: Arc<dyn Fn() -> LiquidityPoolsClient<EthereumClient> + Send + Sync>,
) -> Result<impl Reply, Rejection> {
    let client = client_fn();
    
    // Parse pool ID
    let pool_id = parse_bytes32(&req.pool_id)?;
    
    // Parse recipient address
    let recipient = req.recipient.parse::<Address>().map_err(|_| {
        warp::reject::custom(ApiError {
            message: "Invalid recipient address".to_string(),
        })
    })?;
    
    // Parse amounts
    let amount_specified = req.amount_specified.parse::<i128>().map_err(|_| {
        warp::reject::custom(ApiError {
            message: "Invalid amount_specified".to_string(),
        })
    })?;
    
    let sqrt_price_limit_x96 = req.sqrt_price_limit_x96.parse::<U256>().map_err(|_| {
        warp::reject::custom(ApiError {
            message: "Invalid sqrt_price_limit_x96".to_string(),
        })
    })?;
    
    // Execute swap
    let (amount0, amount1) = client
        .swap(
            pool_id,
            recipient,
            req.zero_for_one,
            amount_specified.into(),
            sqrt_price_limit_x96,
        )
        .await
        .map_err(|e| {
            warp::reject::custom(ApiError {
                message: format!("Failed to swap: {}", e),
            })
        })?;
    
    let response = serde_json::json!({
        "amount0": amount0.to_string(),
        "amount1": amount1.to_string(),
        "status": "success"
    });
    
    Ok(warp::reply::json(&response))
}

async fn get_pools_handler(
    client_fn: Arc<dyn Fn() -> LiquidityPoolsClient<EthereumClient> + Send + Sync>,
) -> Result<impl Reply, Rejection> {
    let client = client_fn();
    
    // Get all pools
    let pool_ids = client
        .get_all_pools()
        .await
        .map_err(|e| {
            warp::reject::custom(ApiError {
                message: format!("Failed to get pools: {}", e),
            })
        })?;
    
    let pool_ids_hex: Vec<String> = pool_ids
        .iter()
        .map(|id| format!("0x{}", hex::encode(id)))
        .collect();
    
    let response = serde_json::json!({
        "pools": pool_ids_hex,
        "count": pool_ids.len()
    });
    
    Ok(warp::reply::json(&response))
}

async fn get_pool_handler(
    pool_id_hex: String,
    client_fn: Arc<dyn Fn() -> LiquidityPoolsClient<EthereumClient> + Send + Sync>,
) -> Result<impl Reply, Rejection> {
    let client = client_fn();
    
    // Parse pool ID
    let pool_id = parse_bytes32(&pool_id_hex)?;
    
    // Get pool config
    let config = client
        .get_pool_config(pool_id)
        .await
        .map_err(|e| {
            warp::reject::custom(ApiError {
                message: format!("Failed to get pool: {}", e),
            })
        })?;
    
    let response = pool_config_to_response(config);
    
    Ok(warp::reply::json(&response))
}

async fn get_pool_state_handler(
    pool_id_hex: String,
    client_fn: Arc<dyn Fn() -> LiquidityPoolsClient<EthereumClient> + Send + Sync>,
) -> Result<impl Reply, Rejection> {
    let client = client_fn();
    
    // Parse pool ID
    let pool_id = parse_bytes32(&pool_id_hex)?;
    
    // Get pool state
    let state = client
        .get_pool_state(pool_id)
        .await
        .map_err(|e| {
            warp::reject::custom(ApiError {
                message: format!("Failed to get pool state: {}", e),
            })
        })?;
    
    let response = pool_state_to_response(state);
    
    Ok(warp::reply::json(&response))
}

async fn get_user_positions_handler(
    user_address: String,
    client_fn: Arc<dyn Fn() -> LiquidityPoolsClient<EthereumClient> + Send + Sync>,
) -> Result<impl Reply, Rejection> {
    let client = client_fn();
    
    // Parse user address
    let user = user_address.parse::<Address>().map_err(|_| {
        warp::reject::custom(ApiError {
            message: "Invalid user address".to_string(),
        })
    })?;
    
    // Get user positions
    let position_ids = client
        .get_user_positions(user)
        .await
        .map_err(|e| {
            warp::reject::custom(ApiError {
                message: format!("Failed to get user positions: {}", e),
            })
        })?;
    
    let position_ids_hex: Vec<String> = position_ids
        .iter()
        .map(|id| format!("0x{}", hex::encode(id)))
        .collect();
    
    let response = serde_json::json!({
        "positions": position_ids_hex,
        "count": position_ids.len()
    });
    
    Ok(warp::reply::json(&response))
}

async fn get_position_handler(
    position_id_hex: String,
    client_fn: Arc<dyn Fn() -> LiquidityPoolsClient<EthereumClient> + Send + Sync>,
) -> Result<impl Reply, Rejection> {
    let client = client_fn();
    
    // Parse position ID
    let position_id = parse_bytes32(&position_id_hex)?;
    
    // Get position
    let position = client
        .get_position(position_id)
        .await
        .map_err(|e| {
            warp::reject::custom(ApiError {
                message: format!("Failed to get position: {}", e),
            })
        })?;
    
    let response = position_to_response(position);
    
    Ok(warp::reply::json(&response))
}

// Helper functions

fn parse_bytes32(hex_str: &str) -> Result<[u8; 32], warp::Rejection> {
    let hex_str = hex_str.trim_start_matches("0x");
    
    let bytes = hex::decode(hex_str).map_err(|_| {
        warp::reject::custom(ApiError {
            message: "Invalid hex string".to_string(),
        })
    })?;
    
    if bytes.len() != 32 {
        return Err(warp::reject::custom(ApiError {
            message: "Hex string must be 32 bytes".to_string(),
        }));
    }
    
    let mut result = [0u8; 32];
    result.copy_from_slice(&bytes);
    
    Ok(result)
}

fn parse_asset_class(class_str: &str) -> Result<AssetClass, warp::Rejection> {
    match class_str.to_uppercase().as_str() {
        "TREASURY" => Ok(AssetClass::TREASURY),
        "REAL_ESTATE" => Ok(AssetClass::REAL_ESTATE),
        "CORPORATE_BOND" => Ok(AssetClass::CORPORATE_BOND),
        "ENVIRONMENTAL_ASSET" => Ok(AssetClass::ENVIRONMENTAL_ASSET),
        "IP_RIGHT" => Ok(AssetClass::IP_RIGHT),
        "INVOICE" => Ok(AssetClass::INVOICE),
        "COMMODITY" => Ok(AssetClass::COMMODITY),
        "INFRASTRUCTURE" => Ok(AssetClass::INFRASTRUCTURE),
        "CUSTOM" => Ok(AssetClass::CUSTOM),
        _ => Err(warp::reject::custom(ApiError {
            message: format!("Invalid asset class: {}", class_str),
        })),
    }
}

fn asset_class_to_string(class: AssetClass) -> String {
    match class {
        AssetClass::TREASURY => "TREASURY".to_string(),
        AssetClass::REAL_ESTATE => "REAL_ESTATE".to_string(),
        AssetClass::CORPORATE_BOND => "CORPORATE_BOND".to_string(),
        AssetClass::ENVIRONMENTAL_ASSET => "ENVIRONMENTAL_ASSET".to_string(),
        AssetClass::IP_RIGHT => "IP_RIGHT".to_string(),
        AssetClass::INVOICE => "INVOICE".to_string(),
        AssetClass::COMMODITY => "COMMODITY".to_string(),
        AssetClass::INFRASTRUCTURE => "INFRASTRUCTURE".to_string(),
        AssetClass::CUSTOM => "CUSTOM".to_string(),
    }
}

fn pool_config_to_response(config: PoolConfig) -> PoolResponse {
    PoolResponse {
        pool_id: format!("0x{}", hex::encode(config.pool_id)),
        token_a: format!("0x{:x}", config.token_a),
        token_b: format!("0x{:x}", config.token_b),
        asset_class_a: asset_class_to_string(config.asset_class_a),
        asset_class_b: asset_class_to_string(config.asset_class_b),
        fee_tier: config.fee_tier,
        initial_sqrt_price: config.initial_sqrt_price.to_string(),
        tick_spacing: config.tick_spacing,
        active: config.active,
        owner: format!("0x{:x}", config.owner),
    }
}

fn pool_state_to_response(state: PoolState) -> PoolStateResponse {
    PoolStateResponse {
        sqrt_price_x96: state.sqrt_price_x96.to_string(),
        tick: state.tick,
        total_liquidity: state.total_liquidity.to_string(),
        volume_token_a: state.volume_token_a.to_string(),
        volume_token_b: state.volume_token_b.to_string(),
        fees_collected_a: state.fees_collected_a.to_string(),
        fees_collected_b: state.fees_collected_b.to_string(),
        last_updated: state.last_updated,
    }
}

fn position_to_response(position: Position) -> PositionResponse {
    PositionResponse {
        position_id: format!("0x{}", hex::encode(position.position_id)),
        pool_id: format!("0x{}", hex::encode(position.pool_id)),
        owner: format!("0x{:x}", position.owner),
        lower_tick: position.lower_tick,
        upper_tick: position.upper_tick,
        liquidity: position.liquidity.to_string(),
        tokens_owed_a: position.tokens_owed_a.to_string(),
        tokens_owed_b: position.tokens_owed_b.to_string(),
        created_at: position.created_at,
    }
} 