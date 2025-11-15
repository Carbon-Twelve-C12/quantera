use axum::{
    routing::get,
    Router,
    response::IntoResponse,
    Json,
    http::{Method, header::{AUTHORIZATION, CONTENT_TYPE}, HeaderValue},
};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tracing_subscriber;
use dotenv::dotenv;
use serde_json::json;

mod services;
mod compliance;
mod api;

use services::market_maker_service::MarketMakerService;
use compliance::enhanced_compliance_engine::EnhancedComplianceEngine;

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

    // Initialize services
    let _market_maker_service = MarketMakerService::new();
    let _compliance_engine = EnhancedComplianceEngine::new();

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