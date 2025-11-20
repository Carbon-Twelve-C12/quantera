use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    response::Json,
    Router,
    routing::{get, post},
};
use sqlx::PgPool;
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use rust_decimal::Decimal;
use tracing::{info, error};

use crate::services::tradefinance_service::{
    TradeFinanceService, TradeFinanceAsset, TradeFinancePosition,
    PurchaseResult, TradeFinanceAnalytics
};

// ============================================================================
// Query Parameter Structs
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct AssetFilters {
    pub asset_type: Option<String>,
    pub status: Option<String>,
    pub min_yield: Option<i32>,
    pub max_risk: Option<i32>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct PurchaseRequest {
    pub asset_id: String,
    pub wallet_address: String,
    pub units: i32,
    pub max_price: Option<String>,
}

// ============================================================================
// API Handlers
// ============================================================================

/// GET /api/v1/tradefinance/assets
/// List all trade finance assets with optional filtering
async fn list_assets_handler(
    State(db): State<Arc<PgPool>>,
    Query(filters): Query<AssetFilters>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    info!("Listing trade finance assets with filters: {:?}", filters);
    
    let service = TradeFinanceService::new(db);
    let assets = service.list_assets(
        filters.asset_type.as_deref(),
        filters.status.as_deref(),
        filters.min_yield,
        filters.max_risk,
        filters.limit,
        filters.offset,
    )
    .await
    .map_err(|e| {
        error!("Failed to list assets: {}", e);
        (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
    })?;
    
    Ok(Json(serde_json::json!({
        "assets": assets,
        "total_count": assets.len(),
    })))
}

/// GET /api/v1/tradefinance/assets/:id
/// Get specific trade finance asset details
async fn get_asset_handler(
    State(db): State<Arc<PgPool>>,
    Path(asset_id): Path<String>,
) -> Result<Json<TradeFinanceAsset>, (StatusCode, String)> {
    info!("Fetching trade finance asset: {}", asset_id);
    
    let service = TradeFinanceService::new(db);
    let asset = service.get_asset(&asset_id)
        .await
        .map_err(|e| {
            error!("Failed to fetch asset: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
        })?
        .ok_or_else(|| {
            (StatusCode::NOT_FOUND, format!("Asset {} not found", asset_id))
        })?;
    
    Ok(Json(asset))
}

/// GET /api/v1/tradefinance/positions/:wallet_address
/// Get user's trade finance positions
async fn get_positions_handler(
    State(db): State<Arc<PgPool>>,
    Path(wallet_address): Path<String>,
    _headers: HeaderMap,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    info!("Fetching positions for wallet: {}", wallet_address);
    
    // TODO: Validate JWT token - wallet_address must match authenticated user
    
    if !wallet_address.starts_with("0x") || wallet_address.len() != 42 {
        return Err((StatusCode::BAD_REQUEST, "Invalid wallet address format".to_string()));
    }
    
    let service = TradeFinanceService::new(db);
    let positions = service.get_positions(&wallet_address)
        .await
        .map_err(|e| {
            error!("Failed to fetch positions: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
        })?;
    
    // Calculate totals
    let total_invested: Decimal = positions.iter()
        .filter_map(|p| p.investment_amount.parse::<Decimal>().ok())
        .sum();
    
    let current_value: Decimal = positions.iter()
        .filter_map(|p| p.current_value.as_ref()
            .and_then(|v| v.parse::<Decimal>().ok()))
        .sum();
    
    let unrealized_pnl = current_value - total_invested;
    
    Ok(Json(serde_json::json!({
        "positions": positions,
        "total_invested": total_invested.to_string(),
        "current_value": current_value.to_string(),
        "total_unrealized_pnl": unrealized_pnl.to_string(),
    })))
}

/// POST /api/v1/tradefinance/purchase
/// Purchase trade finance asset units
async fn purchase_asset_handler(
    State(db): State<Arc<PgPool>>,
    _headers: HeaderMap,
    Json(req): Json<PurchaseRequest>,
) -> Result<Json<PurchaseResult>, (StatusCode, String)> {
    info!("Processing purchase: asset={}, wallet={}, units={}", 
          req.asset_id, req.wallet_address, req.units);
    
    // TODO: Validate JWT token
    // TODO: Check KYC/AML status via compliance_service
    
    // Validate wallet address
    if !req.wallet_address.starts_with("0x") || req.wallet_address.len() != 42 {
        return Err((StatusCode::BAD_REQUEST, "Invalid wallet address format".to_string()));
    }
    
    // Validate units
    if req.units <= 0 {
        return Err((StatusCode::BAD_REQUEST, "Units must be positive".to_string()));
    }
    
    // Parse max_price if provided
    let max_price = if let Some(price_str) = &req.max_price {
        Some(price_str.parse::<Decimal>()
            .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid max_price format".to_string()))?)
    } else {
        None
    };
    
    let service = TradeFinanceService::new(db);
    let result = service.purchase_asset(
        &req.asset_id,
        &req.wallet_address,
        req.units,
        max_price,
    )
    .await
    .map_err(|e| {
        let error_msg = e.to_string();
        
        // Map service errors to appropriate HTTP status codes
        if error_msg.contains("Asset not found") {
            (StatusCode::NOT_FOUND, error_msg)
        } else if error_msg.contains("not active") {
            (StatusCode::CONFLICT, error_msg)
        } else if error_msg.contains("Insufficient units") {
            (StatusCode::CONFLICT, error_msg)
        } else if error_msg.contains("Price slippage") {
            (StatusCode::CONFLICT, error_msg)
        } else if error_msg.contains("Minimum investment") {
            (StatusCode::UNPROCESSABLE_ENTITY, error_msg)
        } else {
            error!("Purchase failed: {}", error_msg);
            (StatusCode::INTERNAL_SERVER_ERROR, error_msg)
        }
    })?;
    
    Ok(Json(result))
}

/// GET /api/v1/tradefinance/analytics
/// Get trade finance market analytics
async fn get_analytics_handler(
    State(db): State<Arc<PgPool>>,
) -> Result<Json<TradeFinanceAnalytics>, (StatusCode, String)> {
    info!("Fetching trade finance analytics");
    
    let service = TradeFinanceService::new(db);
    let analytics = service.get_analytics()
        .await
        .map_err(|e| {
            error!("Failed to fetch analytics: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
        })?;
    
    Ok(Json(analytics))
}

// ============================================================================
// Router Creation
// ============================================================================

pub fn create_tradefinance_router(db: Arc<PgPool>) -> Router {
    Router::new()
        .route("/api/v1/tradefinance/assets", get(list_assets_handler))
        .route("/api/v1/tradefinance/assets/:id", get(get_asset_handler))
        .route("/api/v1/tradefinance/positions/:wallet_address", get(get_positions_handler))
        .route("/api/v1/tradefinance/purchase", post(purchase_asset_handler))
        .route("/api/v1/tradefinance/analytics", get(get_analytics_handler))
        .with_state(db)
}
