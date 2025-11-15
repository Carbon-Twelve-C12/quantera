use axum::{
    routing::get,
    Router,
    response::IntoResponse,
    Json,
    http::{Method, header::{AUTHORIZATION, CONTENT_TYPE}, HeaderValue},
};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::RwLock;
use tower_http::cors::CorsLayer;
use tracing_subscriber;
use dotenv::dotenv;
use serde_json::json;
use sqlx::postgres::PgPool;

mod services;
mod compliance;
mod api;

use services::market_maker_service::MarketMakerService;
use compliance::enhanced_compliance_engine::EnhancedComplianceEngine;
use api::secure_api::{SecureApiState, RateLimiter, AuditLogger};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load environment variables
    dotenv().ok();
    
    // Initialize tracing
    tracing_subscriber::fmt::init();
    
    // Load configuration
    let port = std::env::var("API_PORT")
        .unwrap_or_else(|_| "3001".to_string())
        .parse::<u16>()
        .expect("Invalid API_PORT");
    
    let cors_origins = std::env::var("ALLOWED_ORIGINS")
        .unwrap_or_else(|_| "http://localhost:3000".to_string());
    
    // Initialize database connection pool
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set in .env");
    
    let db_pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");
    
    tracing::info!("Database connection pool established");
    
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
    
    // Create secure API state
    let secure_state = SecureApiState {
        asset_service: asset_service.clone(),
        compliance_engine: compliance_engine.clone(),
        jwt_secret: jwt_secret.clone(),
        rate_limiter: Arc::new(RwLock::new(RateLimiter::new())),
        audit_logger: Arc::new(RwLock::new(AuditLogger::new())),
        db: Arc::new(db_pool),
    };

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

    // Build our application with routes
    let app = Router::new()
        .route("/", get(|| async { "Quantera Backend API v2.0.0-alpha" }))
        .route("/health", get(health_check))
        .merge(api::secure_api::create_secure_router(secure_state))
        .layer(cors);

    // Run the server
    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    println!("Server running on http://{}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_check() -> impl IntoResponse {
    Json(json!({
        "status": "healthy",
        "service": "quantera-backend",
        "version": "2.0.0-alpha",
        "timestamp": chrono::Utc::now().to_rfc3339(),
    }))
} 