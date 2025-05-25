use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::{get, post, put},
    Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::services::multi_chain_asset_service::{MultiChainAssetService, AssetType, ComplianceStandard};
use crate::compliance::enhanced_compliance_engine::{
    EnhancedComplianceEngine, InvestorProfile, InvestorType, KYCStatus, AMLStatus, 
    AccreditationStatus, RiskRating, SanctionsStatus
};

// API State
#[derive(Clone)]
pub struct ApiState {
    pub asset_service: Arc<RwLock<MultiChainAssetService>>,
    pub compliance_engine: Arc<RwLock<EnhancedComplianceEngine>>,
}

// Request/Response DTOs
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateAssetRequest {
    pub name: String,
    pub symbol: String,
    pub asset_type: String,
    pub compliance_standard: String,
    pub regulatory_framework: String,
    pub jurisdiction: String,
    pub total_supply: u128,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AssetResponse {
    pub asset_id: String,
    pub name: String,
    pub symbol: String,
    pub asset_type: String,
    pub total_supply: u128,
    pub compliance_standard: String,
    pub regulatory_framework: String,
    pub jurisdiction: String,
    pub created_at: String,
    pub deployments: std::collections::HashMap<String, String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeployAssetRequest {
    pub asset_id: String,
    pub target_chains: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeploymentResponse {
    pub asset_id: String,
    pub deployments: std::collections::HashMap<String, String>,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ComplianceCheckRequest {
    pub investor_id: String,
    pub asset_type: String,
    pub investment_amount: String, // String to handle large numbers
    pub jurisdiction: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ComplianceCheckResponse {
    pub is_compliant: bool,
    pub overall_score: u8,
    pub checks: Vec<ComplianceCheckDto>,
    pub recommendations: Vec<String>,
    pub required_actions: Vec<String>,
    pub estimated_completion_days: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ComplianceCheckDto {
    pub requirement_id: String,
    pub framework: String,
    pub passed: bool,
    pub message: String,
    pub severity: String,
    pub remediation_steps: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateInvestorRequest {
    pub investor_id: String,
    pub jurisdiction: String,
    pub tax_residency: Vec<String>,
    pub investor_type: String,
    pub email: String,
    pub full_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateInvestorRequest {
    pub kyc_status: Option<String>,
    pub aml_status: Option<String>,
    pub accreditation_status: Option<String>,
    pub risk_rating: Option<String>,
    pub compliance_score: Option<u8>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InvestorResponse {
    pub investor_id: String,
    pub jurisdiction: String,
    pub investor_type: String,
    pub kyc_status: String,
    pub aml_status: String,
    pub accreditation_status: String,
    pub compliance_score: u8,
    pub risk_rating: String,
    pub last_updated: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChainSupportResponse {
    pub supported_chains: Vec<String>,
    pub total_assets: usize,
    pub active_deployments: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LiquidityResponse {
    pub asset_id: String,
    pub chain_liquidity: std::collections::HashMap<String, ChainLiquidityDto>,
    pub total_liquidity_usd: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChainLiquidityDto {
    pub chain: String,
    pub total_liquidity_usd: f64,
    pub available_liquidity_usd: f64,
    pub pool_count: usize,
}

#[derive(Debug, Deserialize)]
pub struct PaginationQuery {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
    pub asset_type: Option<String>,
    pub jurisdiction: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub total_count: usize,
    pub page: u32,
    pub per_page: u32,
    pub total_pages: u32,
}

#[derive(Debug, Serialize)]
pub struct ApiError {
    pub error: String,
    pub message: String,
    pub code: u16,
}

impl ApiError {
    pub fn new(error: &str, message: &str, code: u16) -> Self {
        Self {
            error: error.to_string(),
            message: message.to_string(),
            code,
        }
    }
}

// API Routes
pub fn create_router(state: ApiState) -> Router {
    Router::new()
        // Asset Management Routes
        .route("/api/v1/assets", post(create_asset))
        .route("/api/v1/assets", get(list_assets))
        .route("/api/v1/assets/:asset_id", get(get_asset))
        .route("/api/v1/assets/:asset_id/deploy", post(deploy_asset))
        .route("/api/v1/assets/:asset_id/liquidity", get(get_asset_liquidity))
        
        // Compliance Routes
        .route("/api/v1/compliance/check", post(check_compliance))
        .route("/api/v1/compliance/investors", post(create_investor))
        .route("/api/v1/compliance/investors/:investor_id", get(get_investor))
        .route("/api/v1/compliance/investors/:investor_id", put(update_investor))
        .route("/api/v1/compliance/jurisdictions", get(get_supported_jurisdictions))
        
        // Chain Support Routes
        .route("/api/v1/chains", get(get_supported_chains))
        .route("/api/v1/chains/:chain_id/assets", get(get_chain_assets))
        
        // Health Check
        .route("/api/v1/health", get(health_check))
        
        .with_state(state)
}

// Asset Management Handlers
async fn create_asset(
    State(state): State<ApiState>,
    Json(request): Json<CreateAssetRequest>,
) -> Result<Json<AssetResponse>, (StatusCode, Json<ApiError>)> {
    let mut service = state.asset_service.write().await;
    
    let asset_type = parse_asset_type(&request.asset_type)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(ApiError::new("INVALID_ASSET_TYPE", &e, 400))))?;
    
    let compliance_standard = parse_compliance_standard(&request.compliance_standard)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(ApiError::new("INVALID_COMPLIANCE_STANDARD", &e, 400))))?;
    
    let asset_id = service.create_asset(
        request.name.clone(),
        request.symbol.clone(),
        asset_type,
        compliance_standard,
        request.regulatory_framework.clone(),
        request.jurisdiction.clone(),
        request.total_supply,
    ).await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::new("CREATION_FAILED", &e.to_string(), 500))))?;
    
    let asset = service.get_asset(&asset_id)
        .ok_or_else(|| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::new("ASSET_NOT_FOUND", "Created asset not found", 500))))?;
    
    Ok(Json(AssetResponse {
        asset_id: asset.asset_id.clone(),
        name: asset.name.clone(),
        symbol: asset.symbol.clone(),
        asset_type: format!("{:?}", asset.asset_type),
        total_supply: asset.total_supply,
        compliance_standard: format!("{:?}", asset.compliance_standard),
        regulatory_framework: asset.regulatory_framework.clone(),
        jurisdiction: asset.jurisdiction.clone(),
        created_at: asset.created_at.to_rfc3339(),
        deployments: asset.deployments.iter()
            .map(|(k, v)| (format!("{:?}", k), v.contract_address.clone()))
            .collect(),
    }))
}

async fn list_assets(
    State(state): State<ApiState>,
    Query(params): Query<PaginationQuery>,
) -> Result<Json<PaginatedResponse<AssetResponse>>, (StatusCode, Json<ApiError>)> {
    let service = state.asset_service.read().await;
    
    let page = params.page.unwrap_or(1);
    let per_page = params.per_page.unwrap_or(20).min(100); // Max 100 per page
    
    let assets = if let Some(asset_type) = params.asset_type {
        let parsed_type = parse_asset_type(&asset_type)
            .map_err(|e| (StatusCode::BAD_REQUEST, Json(ApiError::new("INVALID_ASSET_TYPE", &e, 400))))?;
        service.get_assets_by_type(&parsed_type)
    } else if let Some(jurisdiction) = params.jurisdiction {
        service.get_assets_by_jurisdiction(&jurisdiction)
    } else {
        service.get_all_assets()
    };
    
    let total_count = assets.len();
    let total_pages = (total_count as f64 / per_page as f64).ceil() as u32;
    
    let start = ((page - 1) * per_page) as usize;
    let end = (start + per_page as usize).min(total_count);
    
    let paginated_assets: Vec<AssetResponse> = assets[start..end].iter()
        .map(|asset| AssetResponse {
            asset_id: asset.asset_id.clone(),
            name: asset.name.clone(),
            symbol: asset.symbol.clone(),
            asset_type: format!("{:?}", asset.asset_type),
            total_supply: asset.total_supply,
            compliance_standard: format!("{:?}", asset.compliance_standard),
            regulatory_framework: asset.regulatory_framework.clone(),
            jurisdiction: asset.jurisdiction.clone(),
            created_at: asset.created_at.to_rfc3339(),
            deployments: asset.deployments.iter()
                .map(|(k, v)| (format!("{:?}", k), v.contract_address.clone()))
                .collect(),
        })
        .collect();
    
    Ok(Json(PaginatedResponse {
        data: paginated_assets,
        total_count,
        page,
        per_page,
        total_pages,
    }))
}

async fn get_asset(
    State(state): State<ApiState>,
    Path(asset_id): Path<String>,
) -> Result<Json<AssetResponse>, (StatusCode, Json<ApiError>)> {
    let service = state.asset_service.read().await;
    
    let asset = service.get_asset(&asset_id)
        .ok_or_else(|| (StatusCode::NOT_FOUND, Json(ApiError::new("ASSET_NOT_FOUND", "Asset not found", 404))))?;
    
    Ok(Json(AssetResponse {
        asset_id: asset.asset_id.clone(),
        name: asset.name.clone(),
        symbol: asset.symbol.clone(),
        asset_type: format!("{:?}", asset.asset_type),
        total_supply: asset.total_supply,
        compliance_standard: format!("{:?}", asset.compliance_standard),
        regulatory_framework: asset.regulatory_framework.clone(),
        jurisdiction: asset.jurisdiction.clone(),
        created_at: asset.created_at.to_rfc3339(),
        deployments: asset.deployments.iter()
            .map(|(k, v)| (format!("{:?}", k), v.contract_address.clone()))
            .collect(),
    }))
}

async fn deploy_asset(
    State(state): State<ApiState>,
    Path(asset_id): Path<String>,
    Json(request): Json<DeployAssetRequest>,
) -> Result<Json<DeploymentResponse>, (StatusCode, Json<ApiError>)> {
    let mut service = state.asset_service.write().await;
    
    let asset = service.get_asset(&asset_id)
        .ok_or_else(|| (StatusCode::NOT_FOUND, Json(ApiError::new("ASSET_NOT_FOUND", "Asset not found", 404))))?
        .clone();
    
    let target_chains: Result<Vec<_>, _> = request.target_chains.iter()
        .map(|chain| parse_supported_chain(chain))
        .collect();
    
    let target_chains = target_chains
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(ApiError::new("INVALID_CHAIN", &e, 400))))?;
    
    let deployments = service.deploy_asset_cross_chain(&asset, target_chains).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::new("DEPLOYMENT_FAILED", &e.to_string(), 500))))?;
    
    let deployment_map: std::collections::HashMap<String, String> = deployments.iter()
        .map(|(k, v)| (format!("{:?}", k), v.clone()))
        .collect();
    
    Ok(Json(DeploymentResponse {
        asset_id: asset_id.clone(),
        deployments: deployment_map,
        status: "deployed".to_string(),
    }))
}

async fn get_asset_liquidity(
    State(state): State<ApiState>,
    Path(asset_id): Path<String>,
) -> Result<Json<LiquidityResponse>, (StatusCode, Json<ApiError>)> {
    let service = state.asset_service.read().await;
    
    let liquidity = service.get_asset_liquidity_across_chains(&asset_id).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::new("LIQUIDITY_FETCH_FAILED", &e.to_string(), 500))))?;
    
    let mut total_liquidity = 0.0;
    let chain_liquidity: std::collections::HashMap<String, ChainLiquidityDto> = liquidity.iter()
        .map(|(chain, liquidity_data)| {
            total_liquidity += liquidity_data.total_liquidity_usd;
            (
                format!("{:?}", chain),
                ChainLiquidityDto {
                    chain: format!("{:?}", chain),
                    total_liquidity_usd: liquidity_data.total_liquidity_usd,
                    available_liquidity_usd: liquidity_data.available_liquidity_usd,
                    pool_count: liquidity_data.pools.len(),
                }
            )
        })
        .collect();
    
    Ok(Json(LiquidityResponse {
        asset_id,
        chain_liquidity,
        total_liquidity_usd: total_liquidity,
    }))
}

// Compliance Handlers
async fn check_compliance(
    State(state): State<ApiState>,
    Json(request): Json<ComplianceCheckRequest>,
) -> Result<Json<ComplianceCheckResponse>, (StatusCode, Json<ApiError>)> {
    let engine = state.compliance_engine.read().await;
    
    let investment_amount: u128 = request.investment_amount.parse()
        .map_err(|_| (StatusCode::BAD_REQUEST, Json(ApiError::new("INVALID_AMOUNT", "Invalid investment amount", 400))))?;
    
    let result = engine.comprehensive_compliance_check(
        &request.investor_id,
        &request.asset_type,
        investment_amount,
        &request.jurisdiction,
    ).await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::new("COMPLIANCE_CHECK_FAILED", &e.to_string(), 500))))?;
    
    let checks: Vec<ComplianceCheckDto> = result.checks.iter()
        .map(|check| ComplianceCheckDto {
            requirement_id: check.requirement_id.clone(),
            framework: format!("{:?}", check.framework),
            passed: check.passed,
            message: check.message.clone(),
            severity: format!("{:?}", check.severity),
            remediation_steps: check.remediation_steps.clone(),
        })
        .collect();
    
    Ok(Json(ComplianceCheckResponse {
        is_compliant: result.is_compliant,
        overall_score: result.overall_score,
        checks,
        recommendations: result.recommendations,
        required_actions: result.required_actions,
        estimated_completion_days: result.estimated_completion_time.map(|d| d.num_days()),
    }))
}

async fn create_investor(
    State(state): State<ApiState>,
    Json(request): Json<CreateInvestorRequest>,
) -> Result<Json<InvestorResponse>, (StatusCode, Json<ApiError>)> {
    let mut engine = state.compliance_engine.write().await;
    
    let investor_type = parse_investor_type(&request.investor_type)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(ApiError::new("INVALID_INVESTOR_TYPE", &e, 400))))?;
    
    let profile = InvestorProfile {
        investor_id: request.investor_id.clone(),
        jurisdiction: request.jurisdiction.clone(),
        tax_residency: request.tax_residency.clone(),
        investor_type,
        kyc_status: KYCStatus::NotStarted,
        aml_status: AMLStatus::Clear,
        accreditation_status: AccreditationStatus::NotApplicable,
        investment_limits: std::collections::HashMap::new(),
        last_updated: chrono::Utc::now(),
        compliance_score: 50, // Default score
        risk_rating: RiskRating::Medium,
        sanctions_status: SanctionsStatus::Clear,
        cooling_periods: std::collections::HashMap::new(),
    };
    
    engine.update_investor_profile(request.investor_id.clone(), profile.clone()).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::new("PROFILE_CREATION_FAILED", &e.to_string(), 500))))?;
    
    Ok(Json(InvestorResponse {
        investor_id: profile.investor_id,
        jurisdiction: profile.jurisdiction,
        investor_type: format!("{:?}", profile.investor_type),
        kyc_status: format!("{:?}", profile.kyc_status),
        aml_status: format!("{:?}", profile.aml_status),
        accreditation_status: format!("{:?}", profile.accreditation_status),
        compliance_score: profile.compliance_score,
        risk_rating: format!("{:?}", profile.risk_rating),
        last_updated: profile.last_updated.to_rfc3339(),
    }))
}

async fn get_investor(
    State(state): State<ApiState>,
    Path(investor_id): Path<String>,
) -> Result<Json<InvestorResponse>, (StatusCode, Json<ApiError>)> {
    let engine = state.compliance_engine.read().await;
    
    let profile = engine.get_investor_profile(&investor_id).await
        .ok_or_else(|| (StatusCode::NOT_FOUND, Json(ApiError::new("INVESTOR_NOT_FOUND", "Investor profile not found", 404))))?;
    
    Ok(Json(InvestorResponse {
        investor_id: profile.investor_id.clone(),
        jurisdiction: profile.jurisdiction.clone(),
        investor_type: format!("{:?}", profile.investor_type),
        kyc_status: format!("{:?}", profile.kyc_status),
        aml_status: format!("{:?}", profile.aml_status),
        accreditation_status: format!("{:?}", profile.accreditation_status),
        compliance_score: profile.compliance_score,
        risk_rating: format!("{:?}", profile.risk_rating),
        last_updated: profile.last_updated.to_rfc3339(),
    }))
}

async fn update_investor(
    State(state): State<ApiState>,
    Path(investor_id): Path<String>,
    Json(request): Json<UpdateInvestorRequest>,
) -> Result<Json<InvestorResponse>, (StatusCode, Json<ApiError>)> {
    let mut engine = state.compliance_engine.write().await;
    
    let mut profile = engine.get_investor_profile(&investor_id).await
        .ok_or_else(|| (StatusCode::NOT_FOUND, Json(ApiError::new("INVESTOR_NOT_FOUND", "Investor profile not found", 404))))?
        .clone();
    
    // Update fields if provided
    if let Some(kyc_status) = request.kyc_status {
        profile.kyc_status = parse_kyc_status(&kyc_status)
            .map_err(|e| (StatusCode::BAD_REQUEST, Json(ApiError::new("INVALID_KYC_STATUS", &e, 400))))?;
    }
    
    if let Some(aml_status) = request.aml_status {
        profile.aml_status = parse_aml_status(&aml_status)
            .map_err(|e| (StatusCode::BAD_REQUEST, Json(ApiError::new("INVALID_AML_STATUS", &e, 400))))?;
    }
    
    if let Some(accreditation_status) = request.accreditation_status {
        profile.accreditation_status = parse_accreditation_status(&accreditation_status)
            .map_err(|e| (StatusCode::BAD_REQUEST, Json(ApiError::new("INVALID_ACCREDITATION_STATUS", &e, 400))))?;
    }
    
    if let Some(risk_rating) = request.risk_rating {
        profile.risk_rating = parse_risk_rating(&risk_rating)
            .map_err(|e| (StatusCode::BAD_REQUEST, Json(ApiError::new("INVALID_RISK_RATING", &e, 400))))?;
    }
    
    if let Some(compliance_score) = request.compliance_score {
        if compliance_score > 100 {
            return Err((StatusCode::BAD_REQUEST, Json(ApiError::new("INVALID_COMPLIANCE_SCORE", "Compliance score must be 0-100", 400))));
        }
        profile.compliance_score = compliance_score;
    }
    
    profile.last_updated = chrono::Utc::now();
    
    engine.update_investor_profile(investor_id.clone(), profile.clone()).await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::new("PROFILE_UPDATE_FAILED", &e.to_string(), 500))))?;
    
    Ok(Json(InvestorResponse {
        investor_id: profile.investor_id,
        jurisdiction: profile.jurisdiction,
        investor_type: format!("{:?}", profile.investor_type),
        kyc_status: format!("{:?}", profile.kyc_status),
        aml_status: format!("{:?}", profile.aml_status),
        accreditation_status: format!("{:?}", profile.accreditation_status),
        compliance_score: profile.compliance_score,
        risk_rating: format!("{:?}", profile.risk_rating),
        last_updated: profile.last_updated.to_rfc3339(),
    }))
}

async fn get_supported_jurisdictions(
    State(state): State<ApiState>,
) -> Result<Json<Vec<String>>, (StatusCode, Json<ApiError>)> {
    let engine = state.compliance_engine.read().await;
    let jurisdictions = engine.get_supported_jurisdictions().await;
    Ok(Json(jurisdictions))
}

// Chain Support Handlers
async fn get_supported_chains(
    State(state): State<ApiState>,
) -> Result<Json<ChainSupportResponse>, (StatusCode, Json<ApiError>)> {
    let service = state.asset_service.read().await;
    let chains = service.get_supported_chains();
    let all_assets = service.get_all_assets();
    
    let active_deployments = all_assets.iter()
        .map(|asset| asset.deployments.len())
        .sum();
    
    Ok(Json(ChainSupportResponse {
        supported_chains: chains.iter().map(|c| format!("{:?}", c)).collect(),
        total_assets: all_assets.len(),
        active_deployments,
    }))
}

async fn get_chain_assets(
    State(state): State<ApiState>,
    Path(chain_id): Path<String>,
) -> Result<Json<Vec<AssetResponse>>, (StatusCode, Json<ApiError>)> {
    let service = state.asset_service.read().await;
    let chain = parse_supported_chain(&chain_id)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(ApiError::new("INVALID_CHAIN", &e, 400))))?;
    
    let all_assets = service.get_all_assets();
    let chain_assets: Vec<AssetResponse> = all_assets.iter()
        .filter(|asset| asset.deployments.contains_key(&chain))
        .map(|asset| AssetResponse {
            asset_id: asset.asset_id.clone(),
            name: asset.name.clone(),
            symbol: asset.symbol.clone(),
            asset_type: format!("{:?}", asset.asset_type),
            total_supply: asset.total_supply,
            compliance_standard: format!("{:?}", asset.compliance_standard),
            regulatory_framework: asset.regulatory_framework.clone(),
            jurisdiction: asset.jurisdiction.clone(),
            created_at: asset.created_at.to_rfc3339(),
            deployments: asset.deployments.iter()
                .map(|(k, v)| (format!("{:?}", k), v.contract_address.clone()))
                .collect(),
        })
        .collect();
    
    Ok(Json(chain_assets))
}

async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "version": "1.0.0"
    }))
}

// Helper functions for parsing enums
fn parse_asset_type(s: &str) -> Result<AssetType, String> {
    match s.to_lowercase().as_str() {
        "real_estate" | "realestate" => Ok(AssetType::RealEstate),
        "commodities" => Ok(AssetType::Commodities),
        "securities" => Ok(AssetType::Securities),
        "treasury_notes" | "treasurynotes" => Ok(AssetType::TreasuryNotes),
        "corporate_bonds" | "corporatebonds" => Ok(AssetType::CorporateBonds),
        "private_equity" | "privateequity" => Ok(AssetType::PrivateEquity),
        "infrastructure" => Ok(AssetType::Infrastructure),
        "art_and_collectibles" | "artandcollectibles" => Ok(AssetType::ArtAndCollectibles),
        _ => Err(format!("Invalid asset type: {}", s)),
    }
}

fn parse_compliance_standard(s: &str) -> Result<ComplianceStandard, String> {
    match s.to_uppercase().as_str() {
        "ERC3643" => Ok(ComplianceStandard::ERC3643),
        "ERC1400" => Ok(ComplianceStandard::ERC1400),
        "ERC1404" => Ok(ComplianceStandard::ERC1404),
        _ => Ok(ComplianceStandard::Custom(s.to_string())),
    }
}

fn parse_supported_chain(s: &str) -> Result<crate::services::multi_chain_asset_service::SupportedChain, String> {
    use crate::services::multi_chain_asset_service::SupportedChain;
    
    match s.to_lowercase().as_str() {
        "ethereum" => Ok(SupportedChain::Ethereum),
        "polygon" => Ok(SupportedChain::Polygon),
        "avalanche" => Ok(SupportedChain::Avalanche),
        "arbitrum" => Ok(SupportedChain::Arbitrum),
        "optimism" => Ok(SupportedChain::Optimism),
        "base" => Ok(SupportedChain::Base),
        "binance_smart_chain" | "bsc" => Ok(SupportedChain::BinanceSmartChain),
        _ => Err(format!("Unsupported chain: {}", s)),
    }
}

fn parse_investor_type(s: &str) -> Result<InvestorType, String> {
    match s.to_lowercase().as_str() {
        "retail" => Ok(InvestorType::Retail),
        "professional" => Ok(InvestorType::Professional),
        "institutional" => Ok(InvestorType::Institutional),
        "qualified_investor" | "qualifiedinvestor" => Ok(InvestorType::QualifiedInvestor),
        "accredited_investor" | "accreditedinvestor" => Ok(InvestorType::AccreditedInvestor),
        "eligible_counterparty" | "eligiblecounterparty" => Ok(InvestorType::EligibleCounterparty),
        _ => Err(format!("Invalid investor type: {}", s)),
    }
}

fn parse_kyc_status(s: &str) -> Result<KYCStatus, String> {
    match s.to_lowercase().as_str() {
        "not_started" | "notstarted" => Ok(KYCStatus::NotStarted),
        "in_progress" | "inprogress" => Ok(KYCStatus::InProgress),
        "completed" => Ok(KYCStatus::Completed),
        "expired" => Ok(KYCStatus::Expired),
        "rejected" => Ok(KYCStatus::Rejected),
        "under_review" | "underreview" => Ok(KYCStatus::UnderReview),
        _ => Err(format!("Invalid KYC status: {}", s)),
    }
}

fn parse_aml_status(s: &str) -> Result<AMLStatus, String> {
    match s.to_lowercase().as_str() {
        "clear" => Ok(AMLStatus::Clear),
        "under_review" | "underreview" => Ok(AMLStatus::UnderReview),
        "flagged" => Ok(AMLStatus::Flagged),
        "blocked" => Ok(AMLStatus::Blocked),
        "requires_enhanced_due_diligence" | "requiresenhancedduediligence" => Ok(AMLStatus::RequiresEnhancedDueDiligence),
        _ => Err(format!("Invalid AML status: {}", s)),
    }
}

fn parse_accreditation_status(s: &str) -> Result<AccreditationStatus, String> {
    match s.to_lowercase().as_str() {
        "not_applicable" | "notapplicable" => Ok(AccreditationStatus::NotApplicable),
        "pending" => Ok(AccreditationStatus::Pending),
        "verified" => Ok(AccreditationStatus::Verified),
        "expired" => Ok(AccreditationStatus::Expired),
        "rejected" => Ok(AccreditationStatus::Rejected),
        _ => Err(format!("Invalid accreditation status: {}", s)),
    }
}

fn parse_risk_rating(s: &str) -> Result<RiskRating, String> {
    match s.to_lowercase().as_str() {
        "low" => Ok(RiskRating::Low),
        "medium" => Ok(RiskRating::Medium),
        "high" => Ok(RiskRating::High),
        "prohibited" => Ok(RiskRating::Prohibited),
        _ => Err(format!("Invalid risk rating: {}", s)),
    }
}

// API module for RESTful endpoints
// This will be expanded in future phases 