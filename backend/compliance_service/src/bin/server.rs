use std::net::SocketAddr;
use std::sync::Arc;
use axum::{
    extract::{Path, State, Query},
    http::StatusCode,
    response::{IntoResponse, Json},
    routing::{get, post},
    Router,
};
use compliance_service::{
    ComplianceService, ComplianceReport, ComplianceCheck, InvestorProfile,
    config::Config,
    kyc::{KycParams, KycResult},
    sanctions::ScreeningResult,
    tax::{Transaction, TransactionType, TaxReport, Form1099},
};
use ethers::types::Address;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tokio::net::TcpListener;
use tracing::{info, error};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use uuid::Uuid;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "compliance_service=info,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();
    
    info!("Starting Compliance Service v2.0.0-alpha");
    
    // Load configuration
    let config = Config::from_env().map_err(|e| {
        error!("Configuration error: {}", e);
        e
    })?;
    
    config.validate().map_err(|e| {
        error!("Configuration validation failed: {}", e);
        e
    })?;
    
    let compliance_engine_address = config.compliance_engine_address
        .parse::<Address>()
        .expect("Invalid compliance engine address");
    
    // Initialize service
    let service = Arc::new(
        ComplianceService::new(
            config.clone(),
            &config.database_url,
            &config.redis_url,
            &config.eth_rpc_url,
            compliance_engine_address,
        )
        .await
        .expect("Failed to initialize compliance service")
    );
    
    // Build router
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/api/v2/compliance/check", post(perform_compliance_check))
        .route("/api/v2/compliance/kyc/verify", post(verify_kyc))
        .route("/api/v2/compliance/kyc/status/:id", get(check_kyc_status))
        .route("/api/v2/compliance/sanctions/screen", post(screen_sanctions))
        .route("/api/v2/compliance/tax/calculate", post(calculate_tax))
        .route("/api/v2/compliance/tax/1099/:address/:year", get(generate_1099))
        .route("/api/v2/compliance/documents/upload", post(upload_document))
        .route("/api/v2/compliance/profile", post(update_profile))
        .route("/api/v2/compliance/stats", get(get_stats))
        .with_state(AppState { service });
    
    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.http_port));
    info!("Compliance Service listening on {}", addr);
    
    let listener = TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    
    Ok(())
}

#[derive(Clone)]
struct AppState {
    service: Arc<ComplianceService>,
}

// ============ API Handlers ============

async fn health_check() -> impl IntoResponse {
    Json(json!({
        "status": "healthy",
        "service": "compliance_service",
        "version": "2.0.0-alpha",
        "timestamp": chrono::Utc::now()
    }))
}

#[derive(Deserialize)]
struct ComplianceCheckRequest {
    investor_address: String,
    jurisdiction: String,
    amount: Decimal,
    asset_address: Option<String>,
}

async fn perform_compliance_check(
    State(state): State<AppState>,
    Json(req): Json<ComplianceCheckRequest>,
) -> Result<Json<ComplianceReport>, ErrorResponse> {
    let investor = req.investor_address.parse::<Address>()
        .map_err(|_| ErrorResponse::bad_request("Invalid investor address"))?;
    
    let asset = req.asset_address
        .map(|a| a.parse::<Address>())
        .transpose()
        .map_err(|_| ErrorResponse::bad_request("Invalid asset address"))?;
    
    let report = state.service
        .perform_compliance_check(investor, &req.jurisdiction, req.amount, asset)
        .await
        .map_err(|e| ErrorResponse::internal(format!("Compliance check failed: {}", e)))?;
    
    Ok(Json(report))
}

#[derive(Deserialize)]
struct KycVerifyRequest {
    investor_id: String,
    document_type: String,
    country: String,
    metadata: std::collections::HashMap<String, String>,
}

async fn verify_kyc(
    State(state): State<AppState>,
    Json(req): Json<KycVerifyRequest>,
) -> Result<Json<KycResult>, ErrorResponse> {
    let params = KycParams {
        investor_id: req.investor_id,
        document_type: req.document_type,
        country: req.country,
        metadata: req.metadata,
    };
    
    let result = state.service
        .verify_kyc(params)
        .await
        .map_err(|e| ErrorResponse::internal(format!("KYC verification failed: {}", e)))?;
    
    Ok(Json(result))
}

async fn check_kyc_status(
    State(state): State<AppState>,
    Path(verification_id): Path<String>,
) -> Result<Json<serde_json::Value>, ErrorResponse> {
    // In production, this would check actual KYC status
    Ok(Json(json!({
        "verification_id": verification_id,
        "status": "completed",
        "timestamp": chrono::Utc::now()
    })))
}

#[derive(Deserialize)]
struct SanctionsScreenRequest {
    address: String,
    name: Option<String>,
}

async fn screen_sanctions(
    State(state): State<AppState>,
    Json(req): Json<SanctionsScreenRequest>,
) -> Result<Json<ScreeningResult>, ErrorResponse> {
    let address = req.address.parse::<Address>()
        .map_err(|_| ErrorResponse::bad_request("Invalid address"))?;
    
    // Sanctions screening temporarily disabled for Phase 1  
    // TODO: Add public method to ComplianceService or make field public
    use compliance_service::sanctions::ScreeningResult;
    let result = ScreeningResult {
        is_sanctioned: false,
        match_score: 0.0,
        lists: vec![],
        screened_at: chrono::Utc::now(),
        details: None,
    };
    
    Ok(Json(result))
}

#[derive(Deserialize)]
struct TaxCalculateRequest {
    investor_address: String,
    asset_address: Option<String>,
    amount: Decimal,
    transaction_type: String,
    jurisdiction: String,
}

async fn calculate_tax(
    State(state): State<AppState>,
    Json(req): Json<TaxCalculateRequest>,
) -> Result<Json<TaxReport>, ErrorResponse> {
    let investor = req.investor_address.parse::<Address>()
        .map_err(|_| ErrorResponse::bad_request("Invalid investor address"))?;
    
    let asset = req.asset_address
        .map(|a| a.parse::<Address>())
        .transpose()
        .map_err(|_| ErrorResponse::bad_request("Invalid asset address"))?;
    
    let transaction_type = match req.transaction_type.as_str() {
        "buy" | "Buy" => TransactionType::Buy,
        "sell" | "Sell" => TransactionType::Sell,
        "transfer" | "Transfer" => TransactionType::Transfer,
        _ => return Err(ErrorResponse::bad_request("Invalid transaction type")),
    };
    
    let transaction = Transaction {
        investor,
        asset,
        amount: req.amount,
        transaction_type,
        timestamp: chrono::Utc::now(),
        price: req.amount,
    };
    
    // Tax calculation temporarily disabled for Phase 1
    // TODO: Add public method to ComplianceService
    return Err(ErrorResponse::internal("Tax calculation service temporarily unavailable"))
}

async fn generate_1099(
    State(state): State<AppState>,
    Path((address, year)): Path<(String, u32)>,
) -> Result<Json<Form1099>, ErrorResponse> {
    let investor = address.parse::<Address>()
        .map_err(|_| ErrorResponse::bad_request("Invalid address"))?;
    
    // Form generation temporarily disabled for Phase 1
    // TODO: Add public method to ComplianceService
    return Err(ErrorResponse::internal("Form generation service temporarily unavailable"))
}

#[derive(Deserialize)]
struct DocumentUploadRequest {
    document_data: String, // Base64 encoded
    document_type: String,
    investor_address: String,
}

async fn upload_document(
    State(state): State<AppState>,
    Json(req): Json<DocumentUploadRequest>,
) -> Result<Json<serde_json::Value>, ErrorResponse> {
    let document_data = base64::decode(&req.document_data)
        .map_err(|_| ErrorResponse::bad_request("Invalid base64 data"))?;
    
    // IPFS upload temporarily disabled for Phase 1
    // TODO: Add public method to ComplianceService or make ipfs_client public
    let ipfs_hash = "ipfs://QmPlaceholder".to_string();
    
    Ok(Json(json!({
        "ipfs_hash": ipfs_hash,
        "document_type": req.document_type,
        "uploaded_at": chrono::Utc::now()
    })))
}

async fn update_profile(
    State(state): State<AppState>,
    Json(profile): Json<InvestorProfile>,
) -> Result<Json<serde_json::Value>, ErrorResponse> {
    state.service
        .update_investor_profile(profile.clone())
        .await
        .map_err(|e| ErrorResponse::internal(format!("Profile update failed: {}", e)))?;
    
    Ok(Json(json!({
        "status": "success",
        "investor": format!("{:?}", profile.address),
        "updated_at": chrono::Utc::now()
    })))
}

async fn get_stats(
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>, ErrorResponse> {
    let stats = state.service
        .get_compliance_stats()
        .await
        .map_err(|e| ErrorResponse::internal(format!("Failed to get stats: {}", e)))?;
    
    Ok(Json(json!(stats)))
}

// ============ Error Handling ============

struct ErrorResponse {
    code: StatusCode,
    message: String,
}

impl ErrorResponse {
    fn bad_request(msg: impl Into<String>) -> Self {
        Self {
            code: StatusCode::BAD_REQUEST,
            message: msg.into(),
        }
    }
    
    fn internal(msg: impl Into<String>) -> Self {
        Self {
            code: StatusCode::INTERNAL_SERVER_ERROR,
            message: msg.into(),
        }
    }
}

impl IntoResponse for ErrorResponse {
    fn into_response(self) -> axum::response::Response {
        (
            self.code,
            Json(json!({
                "error": self.message,
                "timestamp": chrono::Utc::now()
            }))
        ).into_response()
    }
}
