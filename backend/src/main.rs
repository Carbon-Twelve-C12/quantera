use axum::{
    routing::get,
    Router,
    response::IntoResponse,
    Json,
    http::{Method, header::{AUTHORIZATION, CONTENT_TYPE, HeaderName}, HeaderValue},
    extract::DefaultBodyLimit,
};
use std::net::SocketAddr;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;
use tower_http::cors::CorsLayer;
use tower_http::limit::RequestBodyLimitLayer;
use tracing_subscriber::{self, EnvFilter};
use dotenv::dotenv;
use serde_json::json;
use sqlx::postgres::PgPool;

mod services;
mod compliance;
mod api;

use services::market_maker_service::MarketMakerService;
use compliance::enhanced_compliance_engine::EnhancedComplianceEngine;
use api::secure_api::{SecureApiState, AtomicRateLimiter, AuditLogger};

// Security constants
const MAX_REQUEST_BODY_SIZE: usize = 1024 * 1024; // 1MB max request body

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load environment variables
    dotenv().ok();

    // Initialize tracing with configurable log level
    let log_level = std::env::var("LOG_LEVEL").unwrap_or_else(|_| "info".to_string());
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new(&log_level));
    tracing_subscriber::fmt()
        .with_env_filter(filter)
        .with_target(true)
        .with_thread_ids(true)
        .init();

    tracing::info!("Starting Quantera Backend v2.0.0");

    // Load configuration with validation
    let port = std::env::var("API_PORT")
        .unwrap_or_else(|_| "3001".to_string())
        .parse::<u16>()
        .expect("Invalid API_PORT");

    let cors_origins = std::env::var("ALLOWED_ORIGINS")
        .unwrap_or_else(|_| "http://localhost:3000".to_string());

    // Validate critical environment variables exist
    validate_required_env_vars();

    // Initialize database connection pool with production-ready settings
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set in .env");

    // Connection pool configuration for institutional-grade performance
    let max_connections: u32 = std::env::var("DB_MAX_CONNECTIONS")
        .unwrap_or_else(|_| "100".to_string())
        .parse()
        .unwrap_or(100);

    let min_connections: u32 = std::env::var("DB_MIN_CONNECTIONS")
        .unwrap_or_else(|_| "10".to_string())
        .parse()
        .unwrap_or(10);

    let connection_timeout: u64 = std::env::var("DB_CONNECTION_TIMEOUT")
        .unwrap_or_else(|_| "30".to_string())
        .parse()
        .unwrap_or(30);

    let max_lifetime: u64 = std::env::var("DB_MAX_LIFETIME")
        .unwrap_or_else(|_| "1800".to_string())
        .parse()
        .unwrap_or(1800);

    tracing::info!(
        "Initializing database pool: max={}, min={}, timeout={}s, lifetime={}s",
        max_connections, min_connections, connection_timeout, max_lifetime
    );

    let db_pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(max_connections)
        .min_connections(min_connections)
        .acquire_timeout(Duration::from_secs(connection_timeout))
        .max_lifetime(Duration::from_secs(max_lifetime))
        .idle_timeout(Duration::from_secs(600)) // 10 minutes idle timeout
        .test_before_acquire(true) // Verify connections are valid
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");

    tracing::info!("Database connection pool established with {} max connections", max_connections);
    
    // NOTE: Migrations must be applied manually for Phase 3
    // sqlx::migrate! requires integer-prefixed filenames (e.g., 001_auth.sql)
    // Our migration files use descriptive names
    // Apply with: psql $DATABASE_URL < backend/migrations/*.sql

    // Initialize services
    use services::multi_chain_asset_service::MultiChainAssetService;
    let asset_service = Arc::new(RwLock::new(MultiChainAssetService::new()));
    let compliance_engine = Arc::new(RwLock::new(EnhancedComplianceEngine::new()));
    
    // Get JWT secret
    let jwt_secret = std::env::var("JWT_SECRET")
        .expect("JWT_SECRET must be set in .env");
    
    // Create secure API state with atomic rate limiter
    let secure_state = SecureApiState {
        asset_service: asset_service.clone(),
        compliance_engine: compliance_engine.clone(),
        jwt_secret: jwt_secret.clone(),
        rate_limiter: Arc::new(AtomicRateLimiter::new()),
        audit_logger: Arc::new(RwLock::new(AuditLogger::new())),
        db: Arc::new(db_pool.clone()),
    };
    
    // Keep db_pool Arc for other routers
    let db_arc = Arc::new(db_pool);

    // Parse CORS origins
    let allowed_origins = cors_origins
        .split(',')
        .filter_map(|origin| origin.trim().parse::<HeaderValue>().ok())
        .collect::<Vec<_>>();
    
    // Configure CORS layer
    let cors = CorsLayer::new()
        .allow_origin(allowed_origins)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers([AUTHORIZATION, CONTENT_TYPE]);

    // Build our application with routes and security layers
    let app = Router::new()
        .route("/", get(|| async { "Quantera Backend API v2.0.0" }))
        .route("/health", get(health_check))
        .merge(api::secure_api::create_secure_router(secure_state))
        .merge(api::portfolio_api::create_portfolio_router(db_arc.clone()))
        .merge(api::tradefinance_api::create_tradefinance_router(db_arc.clone()))
        // Security layers
        .layer(DefaultBodyLimit::max(MAX_REQUEST_BODY_SIZE))
        .layer(cors);

    // Run the server
    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    tracing::info!("Quantera Backend listening on http://{}", addr);
    tracing::info!("Security: Request body limit set to {} bytes", MAX_REQUEST_BODY_SIZE);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

/// Validate that all required environment variables are set
fn validate_required_env_vars() {
    let required_vars = [
        ("DATABASE_URL", "Database connection string"),
        ("JWT_SECRET", "JWT signing secret (min 64 chars recommended)"),
    ];

    let mut missing = Vec::new();
    let mut warnings = Vec::new();

    for (var, description) in required_vars {
        match std::env::var(var) {
            Ok(value) => {
                // Additional validation for security-critical variables
                if var == "JWT_SECRET" {
                    if value.len() < 32 {
                        warnings.push(format!(
                            "{}: Value is too short ({}). Minimum 32 characters recommended for security.",
                            var, value.len()
                        ));
                    }
                    if value.contains("dev") || value.contains("test") || value.contains("example") {
                        warnings.push(format!(
                            "{}: Value appears to be a development/test secret. Use a production secret!",
                            var
                        ));
                    }
                }
            }
            Err(_) => missing.push(format!("{}: {}", var, description)),
        }
    }

    // Log warnings
    for warning in &warnings {
        tracing::warn!("SECURITY WARNING: {}", warning);
    }

    // Fail on missing required variables
    if !missing.is_empty() {
        for var in &missing {
            tracing::error!("Missing required environment variable: {}", var);
        }
        panic!(
            "Missing {} required environment variable(s). See .env.example for configuration.",
            missing.len()
        );
    }

    tracing::info!("Environment validation passed");
}

async fn health_check() -> impl IntoResponse {
    Json(json!({
        "status": "healthy",
        "service": "quantera-backend",
        "version": "2.0.0",
        "timestamp": chrono::Utc::now().to_rfc3339(),
    }))
} 