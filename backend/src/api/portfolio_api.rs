use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    response::Json,
    Router,
    routing::get,
    middleware,
};
use sqlx::PgPool;
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use tracing::{info, warn, error};
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};

use crate::services::portfolio_service::{
    PortfolioService, PortfolioSummary, AssetHolding,
    PortfolioTransaction, YieldDistribution, PerformanceMetrics, ImpactMetrics
};

// ============================================================================
// JWT Claims Structure (shared with secure_api.rs)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortfolioJwtClaims {
    pub sub: String,  // wallet address
    pub exp: i64,
    pub iat: i64,
    pub role: String,
}

// ============================================================================
// API State with JWT Secret
// ============================================================================

#[derive(Clone)]
pub struct PortfolioApiState {
    pub db: Arc<PgPool>,
    pub jwt_secret: String,
}

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
// Authentication Helpers
// ============================================================================

/// Extract and validate JWT token, verify ownership of wallet address
fn validate_portfolio_access(
    headers: &HeaderMap,
    requested_wallet: &str,
    jwt_secret: &str,
) -> Result<PortfolioJwtClaims, (StatusCode, String)> {
    // Extract Authorization header
    let auth_header = headers
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| {
            warn!("Missing authorization header for portfolio access");
            (StatusCode::UNAUTHORIZED, "Authorization header required".to_string())
        })?;

    // Check Bearer prefix
    if !auth_header.starts_with("Bearer ") {
        return Err((StatusCode::UNAUTHORIZED, "Invalid authorization format. Use: Bearer <token>".to_string()));
    }

    let token = &auth_header[7..];

    // Decode and validate JWT
    let token_data = decode::<PortfolioJwtClaims>(
        token,
        &DecodingKey::from_secret(jwt_secret.as_bytes()),
        &Validation::new(Algorithm::HS256),
    ).map_err(|e| {
        warn!("JWT validation failed: {}", e);
        (StatusCode::UNAUTHORIZED, "Invalid or expired token".to_string())
    })?;

    let claims = token_data.claims;

    // Check token expiration
    let now = chrono::Utc::now().timestamp();
    if claims.exp < now {
        return Err((StatusCode::UNAUTHORIZED, "Token has expired".to_string()));
    }

    // CRITICAL SECURITY CHECK: Verify wallet ownership
    // Users can only access their own portfolio data
    let token_wallet = claims.sub.to_lowercase();
    let requested_wallet_lower = requested_wallet.to_lowercase();

    if token_wallet != requested_wallet_lower {
        warn!(
            "Portfolio access denied: token wallet {} does not match requested wallet {}",
            token_wallet, requested_wallet_lower
        );
        return Err((
            StatusCode::FORBIDDEN,
            "Access denied. You can only access your own portfolio.".to_string()
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
    // Validate hex characters
    if !wallet[2..].chars().all(|c| c.is_ascii_hexdigit()) {
        return Err((StatusCode::BAD_REQUEST, "Wallet address contains invalid characters".to_string()));
    }
    Ok(())
}

// ============================================================================
// API Handlers with Authentication
// ============================================================================

/// GET /api/v1/portfolio/:wallet_address
/// Get complete portfolio summary (AUTHENTICATED)
async fn get_portfolio_handler(
    State(state): State<PortfolioApiState>,
    Path(wallet_address): Path<String>,
    headers: HeaderMap,
) -> Result<Json<PortfolioSummary>, (StatusCode, String)> {
    // Validate wallet address format
    validate_wallet_address(&wallet_address)?;

    // Authenticate and authorize
    let claims = validate_portfolio_access(&headers, &wallet_address, &state.jwt_secret)?;
    info!("Authenticated portfolio access for wallet: {}", claims.sub);

    let service = PortfolioService::new(state.db);
    let portfolio = service.get_portfolio(&wallet_address)
        .await
        .map_err(|e| {
            error!("Failed to fetch portfolio for {}: {}", wallet_address, e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch portfolio".to_string())
        })?;

    Ok(Json(portfolio))
}

/// GET /api/v1/portfolio/:wallet_address/holdings
/// Get portfolio holdings with optional filtering (AUTHENTICATED)
async fn get_holdings_handler(
    State(state): State<PortfolioApiState>,
    Path(wallet_address): Path<String>,
    Query(query): Query<HoldingsQuery>,
    headers: HeaderMap,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    // Validate wallet address format
    validate_wallet_address(&wallet_address)?;

    // Authenticate and authorize
    let claims = validate_portfolio_access(&headers, &wallet_address, &state.jwt_secret)?;
    info!("Authenticated holdings access for wallet: {}", claims.sub);

    // Validate query parameters
    if let Some(limit) = query.limit {
        if limit < 0 || limit > 1000 {
            return Err((StatusCode::BAD_REQUEST, "Limit must be between 0 and 1000".to_string()));
        }
    }
    if let Some(offset) = query.offset {
        if offset < 0 {
            return Err((StatusCode::BAD_REQUEST, "Offset must be non-negative".to_string()));
        }
    }

    let service = PortfolioService::new(state.db);
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
        error!("Failed to fetch holdings for {}: {}", wallet_address, e);
        (StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch holdings".to_string())
    })?;

    Ok(Json(serde_json::json!({
        "holdings": holdings,
        "total_count": holdings.len(),
    })))
}

/// GET /api/v1/portfolio/:wallet_address/transactions
/// Get transaction history (AUTHENTICATED)
async fn get_transactions_handler(
    State(state): State<PortfolioApiState>,
    Path(wallet_address): Path<String>,
    Query(query): Query<TransactionsQuery>,
    headers: HeaderMap,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    // Validate wallet address format
    validate_wallet_address(&wallet_address)?;

    // Authenticate and authorize
    let claims = validate_portfolio_access(&headers, &wallet_address, &state.jwt_secret)?;
    info!("Authenticated transactions access for wallet: {}", claims.sub);

    // Validate query parameters
    if let Some(limit) = query.limit {
        if limit < 0 || limit > 1000 {
            return Err((StatusCode::BAD_REQUEST, "Limit must be between 0 and 1000".to_string()));
        }
    }

    let service = PortfolioService::new(state.db);
    let transactions = service.get_transactions(
        &wallet_address,
        query.transaction_type.as_deref(),
        query.asset_id.as_deref(),
        query.limit,
        query.offset,
    )
    .await
    .map_err(|e| {
        error!("Failed to fetch transactions for {}: {}", wallet_address, e);
        (StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch transactions".to_string())
    })?;

    Ok(Json(serde_json::json!({
        "transactions": transactions,
        "total_count": transactions.len(),
    })))
}

/// GET /api/v1/portfolio/:wallet_address/performance
/// Get portfolio performance metrics (AUTHENTICATED)
async fn get_performance_handler(
    State(state): State<PortfolioApiState>,
    Path(wallet_address): Path<String>,
    Query(query): Query<PerformanceQuery>,
    headers: HeaderMap,
) -> Result<Json<PerformanceMetrics>, (StatusCode, String)> {
    // Validate wallet address format
    validate_wallet_address(&wallet_address)?;

    // Authenticate and authorize
    let claims = validate_portfolio_access(&headers, &wallet_address, &state.jwt_secret)?;
    info!("Authenticated performance access for wallet: {}", claims.sub);

    // Validate period parameter
    if let Some(ref period) = query.period {
        let valid_periods = ["1d", "7d", "30d", "90d", "1y", "all"];
        if !valid_periods.contains(&period.as_str()) {
            return Err((
                StatusCode::BAD_REQUEST,
                format!("Invalid period. Use one of: {:?}", valid_periods)
            ));
        }
    }

    let service = PortfolioService::new(state.db);
    let performance = service.calculate_performance(
        &wallet_address,
        query.period.as_deref(),
    )
    .await
    .map_err(|e| {
        error!("Failed to calculate performance for {}: {}", wallet_address, e);
        (StatusCode::INTERNAL_SERVER_ERROR, "Failed to calculate performance".to_string())
    })?;

    Ok(Json(performance))
}

/// GET /api/v1/portfolio/:wallet_address/yield
/// Get yield distributions (AUTHENTICATED)
async fn get_yield_handler(
    State(state): State<PortfolioApiState>,
    Path(wallet_address): Path<String>,
    Query(query): Query<YieldQuery>,
    headers: HeaderMap,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    // Validate wallet address format
    validate_wallet_address(&wallet_address)?;

    // Authenticate and authorize
    let claims = validate_portfolio_access(&headers, &wallet_address, &state.jwt_secret)?;
    info!("Authenticated yield access for wallet: {}", claims.sub);

    // Validate status parameter
    if let Some(ref status) = query.status {
        let valid_statuses = ["pending", "distributed", "claimed", "all"];
        if !valid_statuses.contains(&status.to_lowercase().as_str()) {
            return Err((
                StatusCode::BAD_REQUEST,
                format!("Invalid status. Use one of: {:?}", valid_statuses)
            ));
        }
    }

    let service = PortfolioService::new(state.db);
    let distributions = service.get_yield_distributions(
        &wallet_address,
        query.status.as_deref(),
    )
    .await
    .map_err(|e| {
        error!("Failed to fetch yield distributions for {}: {}", wallet_address, e);
        (StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch yield distributions".to_string())
    })?;

    Ok(Json(serde_json::json!({
        "yield_distributions": distributions,
    })))
}

/// GET /api/v1/portfolio/:wallet_address/impact
/// Get environmental impact metrics (AUTHENTICATED)
async fn get_impact_handler(
    State(state): State<PortfolioApiState>,
    Path(wallet_address): Path<String>,
    headers: HeaderMap,
) -> Result<Json<ImpactMetrics>, (StatusCode, String)> {
    // Validate wallet address format
    validate_wallet_address(&wallet_address)?;

    // Authenticate and authorize
    let claims = validate_portfolio_access(&headers, &wallet_address, &state.jwt_secret)?;
    info!("Authenticated impact access for wallet: {}", claims.sub);

    let service = PortfolioService::new(state.db);
    let impact = service.calculate_impact(&wallet_address)
        .await
        .map_err(|e| {
            error!("Failed to calculate impact for {}: {}", wallet_address, e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Failed to calculate impact".to_string())
        })?;

    Ok(Json(impact))
}

// ============================================================================
// Router Creation
// ============================================================================

/// Create portfolio router with authenticated endpoints
/// All endpoints require valid JWT token and wallet ownership verification
pub fn create_portfolio_router(db: Arc<PgPool>) -> Router {
    // Load JWT secret from environment
    let jwt_secret = std::env::var("JWT_SECRET")
        .expect("JWT_SECRET must be set for portfolio API authentication");

    let state = PortfolioApiState {
        db,
        jwt_secret,
    };

    Router::new()
        .route("/api/v1/portfolio/:wallet_address", get(get_portfolio_handler))
        .route("/api/v1/portfolio/:wallet_address/holdings", get(get_holdings_handler))
        .route("/api/v1/portfolio/:wallet_address/transactions", get(get_transactions_handler))
        .route("/api/v1/portfolio/:wallet_address/performance", get(get_performance_handler))
        .route("/api/v1/portfolio/:wallet_address/yield", get(get_yield_handler))
        .route("/api/v1/portfolio/:wallet_address/impact", get(get_impact_handler))
        .with_state(state)
}
