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
use tracing::{info, warn, error};
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};

use crate::services::tradefinance_service::{
    TradeFinanceService, TradeFinanceAsset, TradeFinancePosition,
    PurchaseResult, TradeFinanceAnalytics
};

// ============================================================================
// JWT Claims Structure
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeFinanceJwtClaims {
    pub sub: String,  // wallet address
    pub exp: i64,
    pub iat: i64,
    pub role: String,
}

// ============================================================================
// API State with JWT Secret
// ============================================================================

#[derive(Clone)]
pub struct TradeFinanceApiState {
    pub db: Arc<PgPool>,
    pub jwt_secret: String,
}

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
    pub units: i32,
    pub max_price: Option<String>,
}

// ============================================================================
// Authentication Helpers
// ============================================================================

/// Extract and validate JWT token from headers
fn validate_jwt_token(
    headers: &HeaderMap,
    jwt_secret: &str,
) -> Result<TradeFinanceJwtClaims, (StatusCode, String)> {
    let auth_header = headers
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| {
            warn!("Missing authorization header for trade finance access");
            (StatusCode::UNAUTHORIZED, "Authorization header required".to_string())
        })?;

    if !auth_header.starts_with("Bearer ") {
        return Err((StatusCode::UNAUTHORIZED, "Invalid authorization format. Use: Bearer <token>".to_string()));
    }

    let token = &auth_header[7..];

    let token_data = decode::<TradeFinanceJwtClaims>(
        token,
        &DecodingKey::from_secret(jwt_secret.as_bytes()),
        &Validation::new(Algorithm::HS256),
    ).map_err(|e| {
        warn!("JWT validation failed: {}", e);
        (StatusCode::UNAUTHORIZED, "Invalid or expired token".to_string())
    })?;

    let claims = token_data.claims;

    let now = chrono::Utc::now().timestamp();
    if claims.exp < now {
        return Err((StatusCode::UNAUTHORIZED, "Token has expired".to_string()));
    }

    Ok(claims)
}

/// Validate and verify wallet ownership for position access
fn validate_position_access(
    headers: &HeaderMap,
    requested_wallet: &str,
    jwt_secret: &str,
) -> Result<TradeFinanceJwtClaims, (StatusCode, String)> {
    let claims = validate_jwt_token(headers, jwt_secret)?;

    // Verify wallet ownership
    let token_wallet = claims.sub.to_lowercase();
    let requested_wallet_lower = requested_wallet.to_lowercase();

    if token_wallet != requested_wallet_lower {
        warn!(
            "Position access denied: token wallet {} does not match requested wallet {}",
            token_wallet, requested_wallet_lower
        );
        return Err((
            StatusCode::FORBIDDEN,
            "Access denied. You can only access your own positions.".to_string()
        ));
    }

    Ok(claims)
}

/// Validate wallet address format
fn validate_wallet_address(wallet: &str) -> Result<(), (StatusCode, String)> {
    if !wallet.starts_with("0x") {
        return Err((StatusCode::BAD_REQUEST, "Wallet address must start with 0x".to_string()));
    }
    if wallet.len() != 42 {
        return Err((StatusCode::BAD_REQUEST, "Wallet address must be 42 characters".to_string()));
    }
    if !wallet[2..].chars().all(|c| c.is_ascii_hexdigit()) {
        return Err((StatusCode::BAD_REQUEST, "Wallet address contains invalid characters".to_string()));
    }
    Ok(())
}

// ============================================================================
// API Handlers
// ============================================================================

/// GET /api/v1/tradefinance/assets
/// List all trade finance assets with optional filtering
/// This endpoint is public for asset discovery
async fn list_assets_handler(
    State(state): State<TradeFinanceApiState>,
    Query(filters): Query<AssetFilters>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    info!("Listing trade finance assets with filters: {:?}", filters);

    // Validate query parameters
    if let Some(limit) = filters.limit {
        if limit < 0 || limit > 100 {
            return Err((StatusCode::BAD_REQUEST, "Limit must be between 0 and 100".to_string()));
        }
    }
    if let Some(offset) = filters.offset {
        if offset < 0 {
            return Err((StatusCode::BAD_REQUEST, "Offset must be non-negative".to_string()));
        }
    }
    if let Some(min_yield) = filters.min_yield {
        if min_yield < 0 || min_yield > 10000 {
            return Err((StatusCode::BAD_REQUEST, "min_yield must be between 0 and 10000 basis points".to_string()));
        }
    }
    if let Some(max_risk) = filters.max_risk {
        if max_risk < 1 || max_risk > 5 {
            return Err((StatusCode::BAD_REQUEST, "max_risk must be between 1 and 5".to_string()));
        }
    }

    let service = TradeFinanceService::new(state.db);
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
        (StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch assets".to_string())
    })?;

    Ok(Json(serde_json::json!({
        "assets": assets,
        "total_count": assets.len(),
    })))
}

/// GET /api/v1/tradefinance/assets/:id
/// Get specific trade finance asset details
/// This endpoint is public for asset discovery
async fn get_asset_handler(
    State(state): State<TradeFinanceApiState>,
    Path(asset_id): Path<String>,
) -> Result<Json<TradeFinanceAsset>, (StatusCode, String)> {
    info!("Fetching trade finance asset: {}", asset_id);

    // Validate asset_id format (alphanumeric with dashes)
    if asset_id.is_empty() || asset_id.len() > 50 {
        return Err((StatusCode::BAD_REQUEST, "Invalid asset ID format".to_string()));
    }
    if !asset_id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_') {
        return Err((StatusCode::BAD_REQUEST, "Asset ID contains invalid characters".to_string()));
    }

    let service = TradeFinanceService::new(state.db);
    let asset = service.get_asset(&asset_id)
        .await
        .map_err(|e| {
            error!("Failed to fetch asset: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch asset".to_string())
        })?
        .ok_or_else(|| {
            (StatusCode::NOT_FOUND, format!("Asset {} not found", asset_id))
        })?;

    Ok(Json(asset))
}

/// GET /api/v1/tradefinance/positions/:wallet_address
/// Get user's trade finance positions (AUTHENTICATED)
async fn get_positions_handler(
    State(state): State<TradeFinanceApiState>,
    Path(wallet_address): Path<String>,
    headers: HeaderMap,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    // Validate wallet address format
    validate_wallet_address(&wallet_address)?;

    // Authenticate and verify wallet ownership
    let claims = validate_position_access(&headers, &wallet_address, &state.jwt_secret)?;
    info!("Authenticated position access for wallet: {}", claims.sub);

    let service = TradeFinanceService::new(state.db);
    let positions = service.get_positions(&wallet_address)
        .await
        .map_err(|e| {
            error!("Failed to fetch positions for {}: {}", wallet_address, e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch positions".to_string())
        })?;

    // Calculate totals with proper error handling
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
/// Purchase trade finance asset units (AUTHENTICATED)
async fn purchase_asset_handler(
    State(state): State<TradeFinanceApiState>,
    headers: HeaderMap,
    Json(req): Json<PurchaseRequest>,
) -> Result<Json<PurchaseResult>, (StatusCode, String)> {
    // Authenticate user
    let claims = validate_jwt_token(&headers, &state.jwt_secret)?;
    let wallet_address = claims.sub.clone();

    info!("Processing purchase: asset={}, wallet={}, units={}",
          req.asset_id, wallet_address, req.units);

    // Validate wallet address from token
    validate_wallet_address(&wallet_address)?;

    // Validate asset_id
    if req.asset_id.is_empty() || req.asset_id.len() > 50 {
        return Err((StatusCode::BAD_REQUEST, "Invalid asset ID format".to_string()));
    }

    // Validate units
    if req.units <= 0 {
        return Err((StatusCode::BAD_REQUEST, "Units must be positive".to_string()));
    }
    if req.units > 1_000_000 {
        return Err((StatusCode::BAD_REQUEST, "Units exceed maximum allowed per transaction".to_string()));
    }

    // Parse and validate max_price if provided
    let max_price = if let Some(price_str) = &req.max_price {
        let price = price_str.parse::<Decimal>()
            .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid max_price format".to_string()))?;
        if price <= Decimal::ZERO {
            return Err((StatusCode::BAD_REQUEST, "max_price must be positive".to_string()));
        }
        Some(price)
    } else {
        None
    };

    let service = TradeFinanceService::new(state.db);
    let result = service.purchase_asset(
        &req.asset_id,
        &wallet_address,  // Use wallet from authenticated token, not from request body
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
            (StatusCode::CONFLICT, "Asset is not available for purchase".to_string())
        } else if error_msg.contains("Insufficient units") {
            (StatusCode::CONFLICT, "Insufficient units available".to_string())
        } else if error_msg.contains("Price slippage") {
            (StatusCode::CONFLICT, "Price has changed beyond acceptable slippage".to_string())
        } else if error_msg.contains("Minimum investment") {
            (StatusCode::UNPROCESSABLE_ENTITY, "Purchase does not meet minimum investment requirement".to_string())
        } else if error_msg.contains("KYC") || error_msg.contains("compliance") {
            (StatusCode::FORBIDDEN, "KYC verification required for this purchase".to_string())
        } else {
            error!("Purchase failed for {}: {}", wallet_address, error_msg);
            (StatusCode::INTERNAL_SERVER_ERROR, "Purchase failed. Please try again.".to_string())
        }
    })?;

    info!("Purchase successful: transaction_id={}", result.transaction_id);

    Ok(Json(result))
}

/// GET /api/v1/tradefinance/analytics
/// Get trade finance market analytics
/// This endpoint is public for market overview
async fn get_analytics_handler(
    State(state): State<TradeFinanceApiState>,
) -> Result<Json<TradeFinanceAnalytics>, (StatusCode, String)> {
    info!("Fetching trade finance analytics");

    let service = TradeFinanceService::new(state.db);
    let analytics = service.get_analytics()
        .await
        .map_err(|e| {
            error!("Failed to fetch analytics: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch analytics".to_string())
        })?;

    Ok(Json(analytics))
}

// ============================================================================
// Router Creation
// ============================================================================

/// Create trade finance router
/// - Public endpoints: asset listing, asset details, analytics
/// - Authenticated endpoints: positions (wallet ownership), purchase
pub fn create_tradefinance_router(db: Arc<PgPool>) -> Router {
    // Load JWT secret from environment
    let jwt_secret = std::env::var("JWT_SECRET")
        .expect("JWT_SECRET must be set for trade finance API authentication");

    let state = TradeFinanceApiState {
        db,
        jwt_secret,
    };

    Router::new()
        // Public endpoints (asset discovery)
        .route("/api/v1/tradefinance/assets", get(list_assets_handler))
        .route("/api/v1/tradefinance/assets/:id", get(get_asset_handler))
        .route("/api/v1/tradefinance/analytics", get(get_analytics_handler))
        // Authenticated endpoints
        .route("/api/v1/tradefinance/positions/:wallet_address", get(get_positions_handler))
        .route("/api/v1/tradefinance/purchase", post(purchase_asset_handler))
        .with_state(state)
}
