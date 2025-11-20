use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    response::Json,
    Router,
    routing::get,
};
use sqlx::PgPool;
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use tracing::{info, error};

use crate::services::portfolio_service::{
    PortfolioService, PortfolioSummary, AssetHolding, 
    PortfolioTransaction, YieldDistribution, PerformanceMetrics, ImpactMetrics
};

// ============================================================================
// Query Parameter Structs
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct HoldingsQuery {
    pub category: Option<String>,
    pub sort: Option<String>,
    pub order: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct TransactionsQuery {
    pub transaction_type: Option<String>,
    pub asset_id: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct YieldQuery {
    pub status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PerformanceQuery {
    pub period: Option<String>,
}

// ============================================================================
// API Handlers
// ============================================================================

/// GET /api/v1/portfolio/:wallet_address
/// Get complete portfolio summary
async fn get_portfolio_handler(
    State(db): State<Arc<PgPool>>,
    Path(wallet_address): Path<String>,
    _headers: HeaderMap,
) -> Result<Json<PortfolioSummary>, (StatusCode, String)> {
    info!("Fetching portfolio for wallet: {}", wallet_address);
    
    // TODO: Validate JWT token and check authorization
    // For Phase 5, allow all requests
    
    // Validate wallet address format
    if !wallet_address.starts_with("0x") || wallet_address.len() != 42 {
        return Err((StatusCode::BAD_REQUEST, "Invalid wallet address format".to_string()));
    }
    
    let service = PortfolioService::new(db);
    let portfolio = service.get_portfolio(&wallet_address)
        .await
        .map_err(|e| {
            error!("Failed to fetch portfolio: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to fetch portfolio: {}", e))
        })?;
    
    Ok(Json(portfolio))
}

/// GET /api/v1/portfolio/:wallet_address/holdings
/// Get portfolio holdings with optional filtering
async fn get_holdings_handler(
    State(db): State<Arc<PgPool>>,
    Path(wallet_address): Path<String>,
    Query(query): Query<HoldingsQuery>,
    _headers: HeaderMap,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    info!("Fetching holdings for wallet: {}", wallet_address);
    
    // TODO: Validate JWT token
    
    if !wallet_address.starts_with("0x") || wallet_address.len() != 42 {
        return Err((StatusCode::BAD_REQUEST, "Invalid wallet address format".to_string()));
    }
    
    let service = PortfolioService::new(db);
    let holdings = service.get_holdings(
        &wallet_address,
        query.category.as_deref(),
        query.sort.as_deref(),
        query.order.as_deref(),
        query.limit,
        query.offset,
    )
    .await
    .map_err(|e| {
        error!("Failed to fetch holdings: {}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
    })?;
    
    Ok(Json(serde_json::json!({
        "holdings": holdings,
        "total_count": holdings.len(),
    })))
}

/// GET /api/v1/portfolio/:wallet_address/transactions
/// Get transaction history
async fn get_transactions_handler(
    State(db): State<Arc<PgPool>>,
    Path(wallet_address): Path<String>,
    Query(query): Query<TransactionsQuery>,
    _headers: HeaderMap,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    info!("Fetching transactions for wallet: {}", wallet_address);
    
    // TODO: Validate JWT token
    
    if !wallet_address.starts_with("0x") || wallet_address.len() != 42 {
        return Err((StatusCode::BAD_REQUEST, "Invalid wallet address format".to_string()));
    }
    
    let service = PortfolioService::new(db);
    let transactions = service.get_transactions(
        &wallet_address,
        query.transaction_type.as_deref(),
        query.asset_id.as_deref(),
        query.limit,
        query.offset,
    )
    .await
    .map_err(|e| {
        error!("Failed to fetch transactions: {}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
    })?;
    
    Ok(Json(serde_json::json!({
        "transactions": transactions,
        "total_count": transactions.len(),
    })))
}

/// GET /api/v1/portfolio/:wallet_address/performance
/// Get portfolio performance metrics
async fn get_performance_handler(
    State(db): State<Arc<PgPool>>,
    Path(wallet_address): Path<String>,
    Query(query): Query<PerformanceQuery>,
    _headers: HeaderMap,
) -> Result<Json<PerformanceMetrics>, (StatusCode, String)> {
    info!("Fetching performance for wallet: {}", wallet_address);
    
    // TODO: Validate JWT token
    
    if !wallet_address.starts_with("0x") || wallet_address.len() != 42 {
        return Err((StatusCode::BAD_REQUEST, "Invalid wallet address format".to_string()));
    }
    
    let service = PortfolioService::new(db);
    let performance = service.calculate_performance(
        &wallet_address,
        query.period.as_deref(),
    )
    .await
    .map_err(|e| {
        error!("Failed to calculate performance: {}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
    })?;
    
    Ok(Json(performance))
}

/// GET /api/v1/portfolio/:wallet_address/yield
/// Get yield distributions
async fn get_yield_handler(
    State(db): State<Arc<PgPool>>,
    Path(wallet_address): Path<String>,
    Query(query): Query<YieldQuery>,
    _headers: HeaderMap,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    info!("Fetching yield distributions for wallet: {}", wallet_address);
    
    // TODO: Validate JWT token
    
    if !wallet_address.starts_with("0x") || wallet_address.len() != 42 {
        return Err((StatusCode::BAD_REQUEST, "Invalid wallet address format".to_string()));
    }
    
    let service = PortfolioService::new(db);
    let distributions = service.get_yield_distributions(
        &wallet_address,
        query.status.as_deref(),
    )
    .await
    .map_err(|e| {
        error!("Failed to fetch yield distributions: {}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
    })?;
    
    Ok(Json(serde_json::json!({
        "yield_distributions": distributions,
    })))
}

/// GET /api/v1/portfolio/:wallet_address/impact
/// Get environmental impact metrics
async fn get_impact_handler(
    State(db): State<Arc<PgPool>>,
    Path(wallet_address): Path<String>,
    _headers: HeaderMap,
) -> Result<Json<ImpactMetrics>, (StatusCode, String)> {
    info!("Fetching impact metrics for wallet: {}", wallet_address);
    
    // TODO: Validate JWT token
    
    if !wallet_address.starts_with("0x") || wallet_address.len() != 42 {
        return Err((StatusCode::BAD_REQUEST, "Invalid wallet address format".to_string()));
    }
    
    let service = PortfolioService::new(db);
    let impact = service.calculate_impact(&wallet_address)
        .await
        .map_err(|e| {
            error!("Failed to calculate impact: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
        })?;
    
    Ok(Json(impact))
}

// ============================================================================
// Router Creation
// ============================================================================

pub fn create_portfolio_router(db: Arc<PgPool>) -> Router {
    Router::new()
        .route("/api/v1/portfolio/:wallet_address", get(get_portfolio_handler))
        .route("/api/v1/portfolio/:wallet_address/holdings", get(get_holdings_handler))
        .route("/api/v1/portfolio/:wallet_address/transactions", get(get_transactions_handler))
        .route("/api/v1/portfolio/:wallet_address/performance", get(get_performance_handler))
        .route("/api/v1/portfolio/:wallet_address/yield", get(get_yield_handler))
        .route("/api/v1/portfolio/:wallet_address/impact", get(get_impact_handler))
        .with_state(db)
}
