use axum::{
    routing::get,
    Router,
};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tracing_subscriber;

mod services;
mod compliance;
mod api;

use services::market_maker_service::MarketMakerService;
use compliance::enhanced_compliance_engine::EnhancedComplianceEngine;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Initialize services
    let _market_maker_service = MarketMakerService::new();
    let _compliance_engine = EnhancedComplianceEngine::new();

    // Build our application with routes
    let app = Router::new()
        .route("/", get(|| async { "Quantera Backend API" }))
        .route("/health", get(|| async { "OK" }))
        .layer(CorsLayer::permissive());

    // Run the server
    let addr = SocketAddr::from(([127, 0, 0, 1], 3001));
    println!("Server running on http://{}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
} 