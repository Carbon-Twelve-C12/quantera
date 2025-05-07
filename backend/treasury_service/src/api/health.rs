use serde::{Serialize, Deserialize};
use warp::{Filter, Rejection, Reply};
use std::time::{SystemTime, UNIX_EPOCH};

/// Health status response
#[derive(Debug, Serialize, Deserialize)]
pub struct HealthResponse {
    status: String,
    timestamp: u64,
    version: String,
    database: bool,
    ethereum_node: bool,
}

/// Create health routes
pub fn routes() -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    warp::path("health")
        .and(warp::path::end())
        .and(warp::get())
        .and_then(health_handler)
}

/// Health check handler
async fn health_handler() -> Result<impl Reply, Rejection> {
    // In a real-world scenario, we would check database, blockchain connection, etc.
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    
    let response = HealthResponse {
        status: "ok".to_string(),
        timestamp: now,
        version: env!("CARGO_PKG_VERSION").to_string(),
        database: true, // Mock values for simplicity
        ethereum_node: true, // Mock values for simplicity
    };
    
    Ok(warp::reply::json(&response))
} 