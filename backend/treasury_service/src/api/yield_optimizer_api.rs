use warp::{Filter, Rejection, Reply};
use serde::{Serialize, Deserialize};
use ethers::types::{H256, Address, U256};
use std::sync::Arc;
use std::convert::TryFrom;
use std::collections::HashMap;
use hex;

use crate::clients::yield_optimizer_client::{YieldOptimizerClient, StrategyConfig, UserStrategy, PerformanceMetrics, RiskLevel, YieldSourceType, AssetClass};
use crate::ethereum_client::EthereumClient;
use crate::auth::jwt::with_auth;

/// Request to create a new yield strategy
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateStrategyRequest {
    pub name: String,
    pub description: String,
    pub risk_level: String,
    pub is_public: bool,
    pub performance_fee: String,
    pub metadata_uri: String,
    pub supported_sources: Vec<String>,
    pub supported_asset_classes: Vec<String>,
}

/// Request to apply a strategy to user assets
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApplyStrategyRequest {
    pub strategy_id: String,
    pub assets: Vec<String>,
    pub allocation_percentages: Vec<String>,
    pub auto_compound: bool,
    pub compound_frequency: String,
}

/// Request for finding sustainable yield strategies
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SustainableYieldRequest {
    pub environmental_asset_types: Vec<String>,
    pub min_retirement_percentage: Option<String>,
    pub carbon_negative_only: bool,
}

/// Request for calculating environmental impact of a yield strategy
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvironmentalImpactRequest {
    pub strategy_id: String,
    pub investment_amount: String,
    pub duration_days: String,
}

/// API error response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiError {
    pub message: String,
}

/// Creates the yield optimizer API routes
pub fn yield_optimizer_routes(
    ethereum_client: Arc<EthereumClient>,
    yield_optimizer_address: Address,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    let client = Arc::new(move || {
        YieldOptimizerClient::new(ethereum_client.clone(), yield_optimizer_address)
    });
    
    let create_strategy = warp::path!("yield" / "strategies")
        .and(warp::post())
        .and(with_auth())
        .and(warp::body::json::<CreateStrategyRequest>())
        .and(warp::any().map(move || client.clone()))
        .and_then(create_strategy_handler);
    
    let get_strategies = warp::path!("yield" / "strategies")
        .and(warp::get())
        .and(warp::any().map(move || client.clone()))
        .and_then(get_strategies_handler);
    
    let get_strategy = warp::path!("yield" / "strategies" / String)
        .and(warp::get())
        .and(warp::any().map(move || client.clone()))
        .and_then(get_strategy_handler);
    
    let apply_strategy = warp::path!("yield" / "strategies" / "apply")
        .and(warp::post())
        .and(with_auth())
        .and(warp::body::json::<ApplyStrategyRequest>())
        .and(warp::any().map(move || client.clone()))
        .and_then(apply_strategy_handler);
    
    let get_user_strategies = warp::path!("yield" / "strategies" / "user" / String)
        .and(warp::get())
        .and(warp::any().map(move || client.clone()))
        .and_then(get_user_strategies_handler);
    
    let get_sustainable_strategies = warp::path!("yield" / "strategies" / "sustainable")
        .and(warp::post())
        .and(warp::body::json::<SustainableYieldRequest>())
        .and(warp::any().map(move || client.clone()))
        .and_then(get_sustainable_strategies_handler);
    
    let calculate_environmental_impact = warp::path!("yield" / "strategies" / "impact")
        .and(warp::post())
        .and(warp::body::json::<EnvironmentalImpactRequest>())
        .and(warp::any().map(move || client.clone()))
        .and_then(calculate_environmental_impact_handler);
    
    create_strategy
        .or(get_strategies)
        .or(get_strategy)
        .or(apply_strategy)
        .or(get_user_strategies)
        .or(get_sustainable_strategies)
        .or(calculate_environmental_impact)
}

/// Handler for creating a new yield strategy
async fn create_strategy_handler(
    _user_id: String,
    req: CreateStrategyRequest,
    client_fn: Arc<dyn Fn() -> YieldOptimizerClient<EthereumClient> + Send + Sync>,
) -> Result<impl Reply, Rejection> {
    // TODO: Implement strategy creation logic
    
    let response = serde_json::json!({
        "strategy_id": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "status": "success"
    });
    
    Ok(warp::reply::json(&response))
}

/// Handler for getting all strategies
async fn get_strategies_handler(
    client_fn: Arc<dyn Fn() -> YieldOptimizerClient<EthereumClient> + Send + Sync>,
) -> Result<impl Reply, Rejection> {
    // TODO: Implement get strategies logic
    
    let response = serde_json::json!({
        "strategies": [],
        "count": 0
    });
    
    Ok(warp::reply::json(&response))
}

/// Handler for getting a specific strategy
async fn get_strategy_handler(
    strategy_id: String,
    client_fn: Arc<dyn Fn() -> YieldOptimizerClient<EthereumClient> + Send + Sync>,
) -> Result<impl Reply, Rejection> {
    // TODO: Implement get strategy logic
    
    let response = serde_json::json!({
        "strategy_id": strategy_id,
        "name": "Example Strategy",
        "description": "A strategy description",
        "risk_level": "MODERATE",
        "is_public": true,
        "is_active": true,
        "performance_fee": "100",
        "creation_date": 0,
        "supported_sources": ["LENDING", "STAKING"],
        "supported_asset_classes": ["TREASURY", "ENVIRONMENTAL_ASSET"]
    });
    
    Ok(warp::reply::json(&response))
}

/// Handler for applying a strategy to user assets
async fn apply_strategy_handler(
    _user_id: String,
    req: ApplyStrategyRequest,
    client_fn: Arc<dyn Fn() -> YieldOptimizerClient<EthereumClient> + Send + Sync>,
) -> Result<impl Reply, Rejection> {
    // TODO: Implement apply strategy logic
    
    let response = serde_json::json!({
        "user_strategy_id": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "status": "success"
    });
    
    Ok(warp::reply::json(&response))
}

/// Handler for getting all user strategies
async fn get_user_strategies_handler(
    user_address: String,
    client_fn: Arc<dyn Fn() -> YieldOptimizerClient<EthereumClient> + Send + Sync>,
) -> Result<impl Reply, Rejection> {
    // TODO: Implement get user strategies logic
    
    let response = serde_json::json!({
        "strategies": [],
        "count": 0
    });
    
    Ok(warp::reply::json(&response))
}

/// Handler for getting sustainable yield strategies
async fn get_sustainable_strategies_handler(
    req: SustainableYieldRequest,
    client_fn: Arc<dyn Fn() -> YieldOptimizerClient<EthereumClient> + Send + Sync>,
) -> Result<impl Reply, Rejection> {
    let client = client_fn();
    
    // Parse min retirement percentage if provided
    let min_retirement_percentage = match req.min_retirement_percentage {
        Some(percentage_str) => {
            match U256::from_dec_str(&percentage_str) {
                Ok(value) => Some(value),
                Err(_) => {
                    return Err(warp::reject::custom(ApiError {
                        message: "Invalid min_retirement_percentage format".to_string(),
                    }));
                }
            }
        }
        None => None,
    };
    
    match client.find_sustainable_yield_strategies(
        req.environmental_asset_types,
        min_retirement_percentage,
        req.carbon_negative_only,
    ).await {
        Ok(strategies) => {
            // Convert the strategies to a format suitable for JSON response
            let strategies_json: Vec<serde_json::Value> = strategies
                .iter()
                .map(|(strategy_id, (config, env_metadata))| {
                    serde_json::json!({
                        "strategy_id": format!("0x{}", hex::encode(strategy_id)),
                        "name": config.name,
                        "description": config.description,
                        "risk_level": format!("{:?}", config.risk_level),
                        "is_public": config.is_public,
                        "is_active": config.is_active,
                        "creation_date": config.creation_date,
                        "performance_fee": config.performance_fee.to_string(),
                        "metadata_uri": config.metadata_uri,
                        "environmental_metadata": {
                            "asset_type": env_metadata.asset_type,
                            "certification_standard": env_metadata.certification_standard,
                            "impact_multiplier": env_metadata.impact_multiplier.to_string(),
                            "carbon_negative": env_metadata.carbon_negative,
                            "retirement_percentage": env_metadata.retirement_percentage.to_string(),
                            "sdg_alignment": env_metadata.sdg_alignment.iter()
                                .map(|(sdg, value)| (sdg.to_string(), value.to_string()))
                                .collect::<HashMap<String, String>>(),
                        }
                    })
                })
                .collect();
            
            let response = serde_json::json!({
                "strategies": strategies_json,
                "count": strategies_json.len()
            });
            
            Ok(warp::reply::json(&response))
        }
        Err(err) => {
            Err(warp::reject::custom(ApiError {
                message: format!("Failed to get sustainable strategies: {}", err),
            }))
        }
    }
}

/// Handler for calculating environmental impact of a yield strategy
async fn calculate_environmental_impact_handler(
    req: EnvironmentalImpactRequest,
    client_fn: Arc<dyn Fn() -> YieldOptimizerClient<EthereumClient> + Send + Sync>,
) -> Result<impl Reply, Rejection> {
    let client = client_fn();
    
    // Parse strategy ID from hex
    let strategy_id = match hex::decode(&req.strategy_id.trim_start_matches("0x")) {
        Ok(bytes) => {
            if bytes.len() != 32 {
                return Err(warp::reject::custom(ApiError {
                    message: "Invalid strategy ID length".to_string(),
                }));
            }
            let mut id = [0u8; 32];
            id.copy_from_slice(&bytes);
            id
        }
        Err(_) => {
            return Err(warp::reject::custom(ApiError {
                message: "Invalid strategy ID format".to_string(),
            }));
        }
    };
    
    // Parse investment amount
    let investment_amount = match U256::from_dec_str(&req.investment_amount) {
        Ok(value) => value,
        Err(_) => {
            return Err(warp::reject::custom(ApiError {
                message: "Invalid investment amount format".to_string(),
            }));
        }
    };
    
    // Parse duration days
    let duration_days = match U256::from_dec_str(&req.duration_days) {
        Ok(value) => value,
        Err(_) => {
            return Err(warp::reject::custom(ApiError {
                message: "Invalid duration days format".to_string(),
            }));
        }
    };
    
    match client.calculate_environmental_impact(
        strategy_id,
        investment_amount,
        duration_days,
    ).await {
        Ok(impact_metrics) => {
            // Convert the metrics to a format suitable for JSON response
            let impact_json: HashMap<String, String> = impact_metrics
                .iter()
                .map(|(key, value)| (key.clone(), value.to_string()))
                .collect();
            
            // Get strategy details for context
            let strategy_config = match client.get_strategy_config(strategy_id).await {
                Ok(config) => config,
                Err(_) => {
                    return Err(warp::reject::custom(ApiError {
                        message: "Failed to get strategy configuration".to_string(),
                    }));
                }
            };
            
            let env_metadata = match client.get_environmental_yield_metadata(strategy_id).await {
                Ok(metadata) => metadata,
                Err(_) => {
                    return Err(warp::reject::custom(ApiError {
                        message: "Failed to get environmental metadata".to_string(),
                    }));
                }
            };
            
            let response = serde_json::json!({
                "strategy_id": format!("0x{}", hex::encode(strategy_id)),
                "strategy_name": strategy_config.name,
                "investment_amount": req.investment_amount,
                "duration_days": req.duration_days,
                "impact_metrics": impact_json,
                "environmental_metadata": {
                    "asset_type": env_metadata.asset_type,
                    "certification_standard": env_metadata.certification_standard,
                    "impact_multiplier": env_metadata.impact_multiplier.to_string(),
                    "carbon_negative": env_metadata.carbon_negative,
                    "retirement_percentage": env_metadata.retirement_percentage.to_string(),
                }
            });
            
            Ok(warp::reply::json(&response))
        }
        Err(err) => {
            Err(warp::reject::custom(ApiError {
                message: format!("Failed to calculate environmental impact: {}", err),
            }))
        }
    }
}

// Helper functions will be implemented later 