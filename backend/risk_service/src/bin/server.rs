use std::sync::Arc;
use std::net::SocketAddr;
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Json},
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use risk_service::{RiskService, RiskMetrics, MarketScenario, ScenarioOutcome, RiskAlert};
use risk_service::ethereum_client::{EthereumClient, Address};
use risk_service::websocket::WebSocketServer;
use risk_service::config::Config;
use tokio::net::TcpListener;
use tracing::{info, error};
use tracing_subscriber;
use uuid::Uuid;

#[derive(Clone)]
struct AppState {
    risk_service: Arc<RiskService>,
}

#[derive(Deserialize)]
struct PortfolioQuery {
    address: String,
}

#[derive(Deserialize)]
struct ScenarioRequest {
    portfolio_address: String,
    scenarios: Vec<MarketScenario>,
}

#[derive(Serialize)]
struct ApiResponse<T> {
    success: bool,
    data: Option<T>,
    error: Option<String>,
}

impl<T: Serialize> ApiResponse<T> {
    fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }
    
    fn error(msg: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(msg),
        }
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt::init();
    
    info!("Starting Risk Service v2.0.0-alpha");
    
    // Load and validate configuration
    let config = Config::from_env().map_err(|e| {
        error!("Configuration error: {}", e);
        error!("Please ensure all required environment variables are set.");
        error!("You can copy backend/risk_service/.env.example to .env and fill in the values.");
        std::io::Error::new(std::io::ErrorKind::Other, e)
    })?;
    
    config.validate().map_err(|e| {
        error!("Configuration validation failed: {}", e);
        std::io::Error::new(std::io::ErrorKind::Other, e)
    })?;
    
    let risk_engine_address = config.risk_engine_address
        .parse::<Address>()
        .expect("Invalid risk engine address");
    
    // Initialize Ethereum client
    let eth_client = Arc::new(
        EthereumClient::new(&config.eth_rpc_url)
            .await
            .expect("Failed to connect to Ethereum")
    );
    
    // Initialize Risk Service
    let risk_service = Arc::new(
        RiskService::new(
            eth_client,
            &config.database_url,
            &config.redis_url,
            risk_engine_address,
        )
        .await
        .expect("Failed to initialize Risk Service")
    );
    
    let app_state = AppState { risk_service: risk_service.clone() };
    
    // Build router
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/api/v2/risk/portfolio/:address", get(get_portfolio_risk))
        .route("/api/v2/risk/scenarios/:address", post(run_scenarios))
        .route("/api/v2/risk/alerts/:address", get(get_risk_alerts))
        // WebSocket endpoint disabled for now
        // .route("/api/v2/risk/ws", get(websocket_handler))
        .with_state(app_state);
    
    // Clone service for WebSocket server
    let ws_service = risk_service.clone();
    
    // Start WebSocket server
    let ws_server = WebSocketServer::new(ws_service, config.ws_port);
    let ws_handle = tokio::spawn(async move {
        if let Err(e) = ws_server.start().await {
            error!("WebSocket server error: {}", e);
        }
    });
    
    // Start HTTP server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.http_port));
    info!("Risk Service HTTP API listening on {}", addr);
    info!("Risk Service WebSocket listening on ws://0.0.0.0:{}", config.ws_port);
    
    let listener = TcpListener::bind(addr).await?;
    
    // Run both servers
    tokio::select! {
        result = axum::serve(listener, app) => {
            if let Err(e) = result {
                error!("HTTP server error: {}", e);
            }
        }
        _ = ws_handle => {
            info!("WebSocket server stopped");
        }
    }
    
    Ok(())
}

async fn health_check() -> impl IntoResponse {
    Json(ApiResponse::success("Risk Service v2.0.0-alpha - Healthy"))
}

async fn get_portfolio_risk(
    Path(address): Path<String>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    let portfolio_address = match address.parse::<Address>() {
        Ok(addr) => addr,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<RiskMetrics>::error(format!("Invalid address: {}", e)))
            );
        }
    };
    
    match state.risk_service.calculate_portfolio_risk(portfolio_address).await {
        Ok(metrics) => {
            (StatusCode::OK, Json(ApiResponse::success(metrics)))
        }
        Err(e) => {
            error!("Failed to calculate risk metrics: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("Failed to calculate risk: {}", e)))
            )
        }
    }
}

async fn run_scenarios(
    Path(address): Path<String>,
    State(state): State<AppState>,
    Json(request): Json<ScenarioRequest>,
) -> impl IntoResponse {
    let portfolio_address = match address.parse::<Address>() {
        Ok(addr) => addr,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<Vec<ScenarioOutcome>>::error(format!("Invalid address: {}", e)))
            );
        }
    };
    
    match state.risk_service.predict_risk_scenarios(portfolio_address, request.scenarios).await {
        Ok(outcomes) => {
            (StatusCode::OK, Json(ApiResponse::success(outcomes)))
        }
        Err(e) => {
            error!("Failed to run scenarios: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("Failed to run scenarios: {}", e)))
            )
        }
    }
}

async fn get_risk_alerts(
    Path(address): Path<String>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    let portfolio_address = match address.parse::<Address>() {
        Ok(addr) => addr,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<Vec<RiskAlert>>::error(format!("Invalid address: {}", e)))
            );
        }
    };
    
    match state.risk_service.monitor_risk_limits(portfolio_address).await {
        Ok(alerts) => {
            (StatusCode::OK, Json(ApiResponse::success(alerts)))
        }
        Err(e) => {
            error!("Failed to get risk alerts: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("Failed to get alerts: {}", e)))
            )
        }
    }
}

/* Temporarily disabled WebSocket handlers
async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_websocket(socket, state))
}

async fn handle_websocket(socket: axum::extract::ws::WebSocket, state: AppState) {
    let (tx, mut rx) = tokio::sync::mpsc::channel::<RiskMetrics>(100);
    let client_id = Uuid::new_v4();
    
    // Register client
    state.risk_service.register_websocket_client(client_id, tx);
    
    // Handle socket
    let (mut sender, mut receiver) = socket.split();
    
    // Spawn task to send updates
    let send_task = tokio::spawn(async move {
        while let Some(metrics) = rx.recv().await {
            if let Ok(msg) = serde_json::to_string(&metrics) {
                let _ = sender.send(axum::extract::ws::Message::Text(msg)).await;
            }
        }
    });
    
    // Handle incoming messages (if needed)
    while let Some(Ok(_msg)) = receiver.next().await {
        // Process incoming messages if needed
    }
    
    // Clean up
    state.risk_service.unregister_websocket_client(client_id);
    send_task.abort();
}
*/

// use futures::StreamExt;
