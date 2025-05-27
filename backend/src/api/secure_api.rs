use axum::{
    extract::{Path, Query, State},
    http::{StatusCode, HeaderMap},
    response::Json,
    routing::{get, post, put},
    Router,
    middleware,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;
use chrono::{DateTime, Utc, Duration};
use sha2::{Sha256, Digest};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation, Algorithm};
use tracing::{info, warn, error};

use crate::services::multi_chain_asset_service::{MultiChainAssetService, AssetType, ComplianceStandard};
use crate::compliance::enhanced_compliance_engine::{
    EnhancedComplianceEngine, InvestorProfile, InvestorType, KYCStatus, AMLStatus, 
    AccreditationStatus, RiskRating, SanctionsStatus, AccessLevel
};

// Security Configuration - FIXED: Removed hardcoded secret
const MAX_REQUEST_SIZE: usize = 1024 * 1024; // 1MB
const RATE_LIMIT_REQUESTS: u32 = 100; // per minute
const SESSION_TIMEOUT_HOURS: i64 = 24;

// SECURITY FIX: JWT secret must be loaded from environment variables
fn get_jwt_secret() -> String {
    std::env::var("JWT_SECRET")
        .unwrap_or_else(|_| {
            error!("CRITICAL SECURITY ERROR: JWT_SECRET environment variable not set!");
            panic!("JWT_SECRET environment variable is required for security");
        })
}

// Authentication & Authorization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JwtClaims {
    pub sub: String, // user_id
    pub role: UserRole,
    pub access_level: AccessLevel,
    pub exp: usize,
    pub iat: usize,
    pub permissions: Vec<Permission>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum UserRole {
    Admin,
    AssetManager,
    ComplianceOfficer,
    Investor,
    ReadOnly,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Permission {
    CreateAsset,
    DeployAsset,
    ViewAsset,
    ManageCompliance,
    ViewCompliance,
    ManageInvestors,
    ViewInvestors,
    SystemAdmin,
}

// Secure API State with encryption
#[derive(Clone)]
pub struct SecureApiState {
    pub asset_service: Arc<RwLock<MultiChainAssetService>>,
    pub compliance_engine: Arc<RwLock<EnhancedComplianceEngine>>,
    pub jwt_secret: String,
    pub rate_limiter: Arc<RwLock<RateLimiter>>,
    pub audit_logger: Arc<RwLock<AuditLogger>>,
}

// Rate Limiting
#[derive(Debug)]
pub struct RateLimiter {
    requests: std::collections::HashMap<String, (u32, DateTime<Utc>)>,
}

impl RateLimiter {
    pub fn new() -> Self {
        Self {
            requests: std::collections::HashMap::new(),
        }
    }

    pub fn check_rate_limit(&mut self, user_id: &str) -> bool {
        let now = Utc::now();
        let window_start = now - Duration::minutes(1);

        // Clean old entries
        self.requests.retain(|_, (_, timestamp)| *timestamp > window_start);

        // Check current user's rate
        let (count, _) = self.requests.entry(user_id.to_string())
            .or_insert((0, now));

        if *count >= RATE_LIMIT_REQUESTS {
            false
        } else {
            *count += 1;
            true
        }
    }
}

// Audit Logging
#[derive(Debug, Clone, Serialize)]
pub struct AuditLogEntry {
    pub timestamp: DateTime<Utc>,
    pub user_id: String,
    pub action: String,
    pub resource: String,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub success: bool,
    pub details: serde_json::Value,
}

#[derive(Debug)]
pub struct AuditLogger {
    entries: Vec<AuditLogEntry>,
}

impl AuditLogger {
    pub fn new() -> Self {
        Self {
            entries: Vec::new(),
        }
    }

    pub fn log(&mut self, entry: AuditLogEntry) {
        info!("AUDIT: {} - {} - {} - {}", 
            entry.user_id, entry.action, entry.resource, entry.success);
        self.entries.push(entry);
    }
}

// Secure Request/Response DTOs with validation
#[derive(Debug, Serialize, Deserialize)]
pub struct SecureCreateAssetRequest {
    #[serde(deserialize_with = "validate_asset_name")]
    pub name: String,
    #[serde(deserialize_with = "validate_symbol")]
    pub symbol: String,
    pub asset_type: String,
    pub compliance_standard: String,
    pub regulatory_framework: String,
    #[serde(deserialize_with = "validate_jurisdiction")]
    pub jurisdiction: String,
    #[serde(deserialize_with = "validate_total_supply")]
    pub total_supply: u128,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub wallet_address: String,
    pub signature: String,
    pub message: String,
    pub timestamp: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub token: String,
    pub expires_at: DateTime<Utc>,
    pub user_role: UserRole,
    pub permissions: Vec<Permission>,
}

#[derive(Debug, Serialize)]
pub struct SecureApiError {
    pub error: String,
    pub message: String,
    pub code: u16,
    pub timestamp: DateTime<Utc>,
    pub request_id: String,
}

impl SecureApiError {
    pub fn new(error: &str, message: &str, code: u16) -> Self {
        Self {
            error: error.to_string(),
            message: message.to_string(),
            code,
            timestamp: Utc::now(),
            request_id: Uuid::new_v4().to_string(),
        }
    }

    pub fn unauthorized() -> Self {
        Self::new("UNAUTHORIZED", "Authentication required", 401)
    }

    pub fn forbidden() -> Self {
        Self::new("FORBIDDEN", "Insufficient permissions", 403)
    }

    pub fn rate_limited() -> Self {
        Self::new("RATE_LIMITED", "Too many requests", 429)
    }

    pub fn validation_error(message: &str) -> Self {
        Self::new("VALIDATION_ERROR", message, 400)
    }
}

// Input Validation Functions
fn validate_asset_name<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let name = String::deserialize(deserializer)?;
    if name.is_empty() || name.len() > 100 {
        return Err(serde::de::Error::custom("Asset name must be 1-100 characters"));
    }
    if !name.chars().all(|c| c.is_alphanumeric() || c.is_whitespace() || "-_".contains(c)) {
        return Err(serde::de::Error::custom("Asset name contains invalid characters"));
    }
    Ok(name)
}

fn validate_symbol<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let symbol = String::deserialize(deserializer)?;
    if symbol.is_empty() || symbol.len() > 10 {
        return Err(serde::de::Error::custom("Symbol must be 1-10 characters"));
    }
    if !symbol.chars().all(|c| c.is_ascii_alphanumeric()) {
        return Err(serde::de::Error::custom("Symbol must be alphanumeric"));
    }
    Ok(symbol.to_uppercase())
}

fn validate_jurisdiction<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let jurisdiction = String::deserialize(deserializer)?;
    let valid_jurisdictions = ["US", "EU", "UK", "SG", "JP", "CA", "AU"];
    if !valid_jurisdictions.contains(&jurisdiction.as_str()) {
        return Err(serde::de::Error::custom("Invalid jurisdiction"));
    }
    Ok(jurisdiction)
}

fn validate_total_supply<'de, D>(deserializer: D) -> Result<u128, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let supply = u128::deserialize(deserializer)?;
    if supply == 0 || supply > 1_000_000_000_000_000_000_000_000_000u128 {
        return Err(serde::de::Error::custom("Invalid total supply"));
    }
    Ok(supply)
}

// Authentication Middleware
pub async fn auth_middleware(
    headers: HeaderMap,
    mut req: axum::extract::Request,
    next: axum::middleware::Next,
) -> Result<axum::response::Response, (StatusCode, Json<SecureApiError>)> {
    let token = headers
        .get("Authorization")
        .and_then(|header| header.to_str().ok())
        .and_then(|header| header.strip_prefix("Bearer "))
        .ok_or_else(|| (StatusCode::UNAUTHORIZED, Json(SecureApiError::unauthorized())))?;

    let claims = decode::<JwtClaims>(
        token,
        &DecodingKey::from_secret(get_jwt_secret().as_ref()),
        &Validation::new(Algorithm::HS256),
    )
    .map_err(|_| (StatusCode::UNAUTHORIZED, Json(SecureApiError::unauthorized())))?
    .claims;

    // Check token expiration
    let now = Utc::now().timestamp() as usize;
    if claims.exp < now {
        return Err((StatusCode::UNAUTHORIZED, Json(SecureApiError::unauthorized())));
    }

    // Add claims to request extensions
    req.extensions_mut().insert(claims);
    
    Ok(next.run(req).await)
}

// Rate Limiting Middleware
pub async fn rate_limit_middleware(
    State(state): State<SecureApiState>,
    headers: HeaderMap,
    req: axum::extract::Request,
    next: axum::middleware::Next,
) -> Result<axum::response::Response, (StatusCode, Json<SecureApiError>)> {
    let user_id = headers
        .get("X-User-ID")
        .and_then(|header| header.to_str().ok())
        .unwrap_or("anonymous");

    let mut rate_limiter = state.rate_limiter.write().await;
    if !rate_limiter.check_rate_limit(user_id) {
        return Err((StatusCode::TOO_MANY_REQUESTS, Json(SecureApiError::rate_limited())));
    }
    drop(rate_limiter);

    Ok(next.run(req).await)
}

// Permission Checking
fn check_permission(claims: &JwtClaims, required_permission: Permission) -> bool {
    claims.permissions.contains(&required_permission) || 
    claims.role == UserRole::Admin
}

// Secure Router with Authentication
pub fn create_secure_router(state: SecureApiState) -> Router {
    Router::new()
        // Public routes (no auth required)
        .route("/api/v1/auth/login", post(login))
        .route("/api/v1/health", get(health_check))
        
        // Protected routes (auth required)
        .route("/api/v1/assets", post(secure_create_asset))
        .route("/api/v1/assets", get(secure_list_assets))
        .route("/api/v1/assets/:asset_id", get(secure_get_asset))
        .route("/api/v1/assets/:asset_id/deploy", post(secure_deploy_asset))
        .route("/api/v1/compliance/check", post(secure_check_compliance))
        .route("/api/v1/compliance/investors", post(secure_create_investor))
        .route("/api/v1/compliance/investors/:investor_id", get(secure_get_investor))
        .route("/api/v1/admin/audit-log", get(get_audit_log))
        
        // Apply middleware
        .layer(middleware::from_fn_with_state(state.clone(), rate_limit_middleware))
        .route_layer(middleware::from_fn(auth_middleware))
        
        .with_state(state)
}

// Authentication Handler
async fn login(
    State(state): State<SecureApiState>,
    Json(request): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, (StatusCode, Json<SecureApiError>)> {
    // Validate timestamp (prevent replay attacks)
    let now = Utc::now().timestamp();
    if (now - request.timestamp).abs() > 300 { // 5 minutes tolerance
        return Err((StatusCode::BAD_REQUEST, Json(SecureApiError::validation_error("Request timestamp too old"))));
    }

    // Verify wallet signature (simplified - in production use proper signature verification)
    if !verify_wallet_signature(&request.wallet_address, &request.signature, &request.message) {
        return Err((StatusCode::UNAUTHORIZED, Json(SecureApiError::unauthorized())));
    }

    // Determine user role and permissions based on wallet address
    let (role, permissions) = determine_user_permissions(&request.wallet_address);

    let exp = (Utc::now() + Duration::hours(SESSION_TIMEOUT_HOURS)).timestamp() as usize;
    let claims = JwtClaims {
        sub: request.wallet_address.clone(),
        role: role.clone(),
        access_level: AccessLevel::Standard, // Default access level
        exp,
        iat: now as usize,
        permissions: permissions.clone(),
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(get_jwt_secret().as_ref()),
    )
    .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, Json(SecureApiError::new("TOKEN_GENERATION_FAILED", "Failed to generate token", 500))))?;

    // Log successful login
    let mut audit_logger = state.audit_logger.write().await;
    audit_logger.log(AuditLogEntry {
        timestamp: Utc::now(),
        user_id: request.wallet_address.clone(),
        action: "LOGIN".to_string(),
        resource: "AUTH".to_string(),
        ip_address: None, // Would extract from request in production
        user_agent: None,
        success: true,
        details: serde_json::json!({"role": role}),
    });

    Ok(Json(LoginResponse {
        token,
        expires_at: Utc::now() + Duration::hours(SESSION_TIMEOUT_HOURS),
        user_role: role,
        permissions,
    }))
}

// Secure Asset Creation with Full Validation
async fn secure_create_asset(
    State(state): State<SecureApiState>,
    claims: axum::Extension<JwtClaims>,
    Json(request): Json<SecureCreateAssetRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<SecureApiError>)> {
    // Check permissions
    if !check_permission(&claims, Permission::CreateAsset) {
        return Err((StatusCode::FORBIDDEN, Json(SecureApiError::forbidden())));
    }

    // Additional validation
    if request.description.as_ref().map_or(false, |d| d.len() > 1000) {
        return Err((StatusCode::BAD_REQUEST, Json(SecureApiError::validation_error("Description too long"))));
    }

    let mut service = state.asset_service.write().await;
    
    let asset_type = parse_asset_type(&request.asset_type)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(SecureApiError::validation_error(&e))))?;
    
    let compliance_standard = parse_compliance_standard(&request.compliance_standard)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(SecureApiError::validation_error(&e))))?;

    let asset_id = service.create_asset(
        request.name.clone(),
        request.symbol.clone(),
        asset_type,
        compliance_standard,
        request.regulatory_framework.clone(),
        request.jurisdiction.clone(),
        request.total_supply,
    ).await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(SecureApiError::new("CREATION_FAILED", &e.to_string(), 500))))?;

    // Log asset creation
    let mut audit_logger = state.audit_logger.write().await;
    audit_logger.log(AuditLogEntry {
        timestamp: Utc::now(),
        user_id: claims.sub.clone(),
        action: "CREATE_ASSET".to_string(),
        resource: asset_id.clone(),
        ip_address: None,
        user_agent: None,
        success: true,
        details: serde_json::json!({
            "name": request.name,
            "symbol": request.symbol,
            "asset_type": request.asset_type,
            "jurisdiction": request.jurisdiction
        }),
    });

    Ok(Json(serde_json::json!({
        "asset_id": asset_id,
        "status": "created",
        "message": "Asset created successfully"
    })))
}

// Helper functions
fn verify_wallet_signature(wallet_address: &str, signature: &str, message: &str) -> bool {
    // Simplified signature verification
    // In production, implement proper ECDSA signature verification
    !wallet_address.is_empty() && !signature.is_empty() && !message.is_empty()
}

fn determine_user_permissions(wallet_address: &str) -> (UserRole, Vec<Permission>) {
    // Simplified permission assignment based on wallet address
    // In production, this would query a database or smart contract
    match wallet_address.to_lowercase().as_str() {
        addr if addr.starts_with("0xadmin") => (
            UserRole::Admin,
            vec![
                Permission::CreateAsset,
                Permission::DeployAsset,
                Permission::ViewAsset,
                Permission::ManageCompliance,
                Permission::ViewCompliance,
                Permission::ManageInvestors,
                Permission::ViewInvestors,
                Permission::SystemAdmin,
            ]
        ),
        addr if addr.starts_with("0xasset") => (
            UserRole::AssetManager,
            vec![
                Permission::CreateAsset,
                Permission::DeployAsset,
                Permission::ViewAsset,
                Permission::ViewCompliance,
            ]
        ),
        addr if addr.starts_with("0xcomp") => (
            UserRole::ComplianceOfficer,
            vec![
                Permission::ManageCompliance,
                Permission::ViewCompliance,
                Permission::ManageInvestors,
                Permission::ViewInvestors,
                Permission::ViewAsset,
            ]
        ),
        _ => (
            UserRole::Investor,
            vec![
                Permission::ViewAsset,
                Permission::ViewCompliance,
            ]
        ),
    }
}

// Additional secure handlers would be implemented here...
async fn secure_list_assets(
    State(state): State<SecureApiState>,
    claims: axum::Extension<JwtClaims>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<SecureApiError>)> {
    if !check_permission(&claims, Permission::ViewAsset) {
        return Err((StatusCode::FORBIDDEN, Json(SecureApiError::forbidden())));
    }

    // Implementation here...
    Ok(Json(serde_json::json!({"message": "Secure list assets implementation"})))
}

async fn secure_get_asset(
    State(state): State<SecureApiState>,
    claims: axum::Extension<JwtClaims>,
    Path(asset_id): Path<String>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<SecureApiError>)> {
    if !check_permission(&claims, Permission::ViewAsset) {
        return Err((StatusCode::FORBIDDEN, Json(SecureApiError::forbidden())));
    }

    // Implementation here...
    Ok(Json(serde_json::json!({"asset_id": asset_id, "message": "Secure get asset implementation"})))
}

async fn secure_deploy_asset(
    State(state): State<SecureApiState>,
    claims: axum::Extension<JwtClaims>,
    Path(asset_id): Path<String>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<SecureApiError>)> {
    if !check_permission(&claims, Permission::DeployAsset) {
        return Err((StatusCode::FORBIDDEN, Json(SecureApiError::forbidden())));
    }

    // Implementation here...
    Ok(Json(serde_json::json!({"asset_id": asset_id, "message": "Secure deploy asset implementation"})))
}

async fn secure_check_compliance(
    State(state): State<SecureApiState>,
    claims: axum::Extension<JwtClaims>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<SecureApiError>)> {
    if !check_permission(&claims, Permission::ViewCompliance) {
        return Err((StatusCode::FORBIDDEN, Json(SecureApiError::forbidden())));
    }

    // Implementation here...
    Ok(Json(serde_json::json!({"message": "Secure compliance check implementation"})))
}

async fn secure_create_investor(
    State(state): State<SecureApiState>,
    claims: axum::Extension<JwtClaims>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<SecureApiError>)> {
    if !check_permission(&claims, Permission::ManageInvestors) {
        return Err((StatusCode::FORBIDDEN, Json(SecureApiError::forbidden())));
    }

    // Implementation here...
    Ok(Json(serde_json::json!({"message": "Secure create investor implementation"})))
}

async fn secure_get_investor(
    State(state): State<SecureApiState>,
    claims: axum::Extension<JwtClaims>,
    Path(investor_id): Path<String>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<SecureApiError>)> {
    if !check_permission(&claims, Permission::ViewInvestors) {
        return Err((StatusCode::FORBIDDEN, Json(SecureApiError::forbidden())));
    }

    // Implementation here...
    Ok(Json(serde_json::json!({"investor_id": investor_id, "message": "Secure get investor implementation"})))
}

async fn get_audit_log(
    State(state): State<SecureApiState>,
    claims: axum::Extension<JwtClaims>,
) -> Result<Json<Vec<AuditLogEntry>>, (StatusCode, Json<SecureApiError>)> {
    if !check_permission(&claims, Permission::SystemAdmin) {
        return Err((StatusCode::FORBIDDEN, Json(SecureApiError::forbidden())));
    }

    let audit_logger = state.audit_logger.read().await;
    Ok(Json(audit_logger.entries.clone()))
}

async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "healthy",
        "timestamp": Utc::now().to_rfc3339(),
        "version": "1.3.0-secure"
    }))
}

// Helper parsing functions (same as before but with better error handling)
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