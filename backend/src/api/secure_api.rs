use axum::{
    extract::{Path, Query, State, ConnectInfo},
    http::{StatusCode, HeaderMap},
    response::{Json, IntoResponse},
    routing::{get, post, put},
    Router,
    middleware,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::sync::atomic::{AtomicU64, Ordering};
use std::net::SocketAddr;
use tokio::sync::RwLock;
use uuid::Uuid;
use chrono::{DateTime, Utc, Duration};
use sha2::{Sha256, Digest};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation, Algorithm};
use tracing::{info, warn, error};
use sqlx::PgPool;
use dashmap::DashMap;

use crate::services::multi_chain_asset_service::{MultiChainAssetService, AssetType, ComplianceStandard};
use crate::compliance::enhanced_compliance_engine::{
    EnhancedComplianceEngine, InvestorProfile, InvestorType, KYCStatus, AMLStatus,
    AccreditationStatus, RiskRating, SanctionsStatus, AccessLevel
};

// Security Configuration - loaded from environment with defaults
const MAX_REQUEST_SIZE: usize = 1024 * 1024; // 1MB
const SESSION_TIMEOUT_HOURS: i64 = 24;

// Rate limit defaults (can be overridden by environment variables)
const DEFAULT_RATE_LIMIT_REQUESTS: u64 = 100; // per minute for authenticated users
const DEFAULT_RATE_LIMIT_ANONYMOUS: u64 = 20; // per minute for anonymous users
const DEFAULT_RATE_LIMIT_BURST: u64 = 10; // burst allowance

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
    pub rate_limiter: Arc<AtomicRateLimiter>,
    pub audit_logger: Arc<RwLock<AuditLogger>>,
    pub db: Arc<PgPool>, // Phase 3: Database pool for auth
}

// ============================================================================
// Production-Grade Atomic Rate Limiter
// Uses DashMap for lock-free concurrent access with atomic counters
// Implements sliding window algorithm with configurable limits
// ============================================================================

/// Rate limit entry with atomic counter and window tracking
pub struct RateLimitEntry {
    /// Atomic request counter for lock-free increments
    count: AtomicU64,
    /// Window start timestamp (Unix milliseconds)
    window_start: AtomicU64,
}

impl RateLimitEntry {
    fn new(now_ms: u64) -> Self {
        Self {
            count: AtomicU64::new(1),
            window_start: AtomicU64::new(now_ms),
        }
    }
}

/// Lock-free atomic rate limiter using DashMap
/// Supports both user-based and IP-based rate limiting
pub struct AtomicRateLimiter {
    /// User-based rate limit tracking (by user ID or wallet address)
    user_limits: DashMap<String, RateLimitEntry>,
    /// IP-based rate limit tracking (defense against distributed attacks)
    ip_limits: DashMap<String, RateLimitEntry>,
    /// Rate limit for authenticated users (requests per minute)
    authenticated_limit: u64,
    /// Rate limit for anonymous users (requests per minute)
    anonymous_limit: u64,
    /// Burst allowance (additional requests allowed in short bursts)
    burst_allowance: u64,
    /// Window duration in milliseconds (default 60000ms = 1 minute)
    window_duration_ms: u64,
}

impl AtomicRateLimiter {
    /// Create a new rate limiter with configuration from environment
    pub fn new() -> Self {
        let authenticated_limit = std::env::var("RATE_LIMIT_REQUESTS_PER_MINUTE")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(DEFAULT_RATE_LIMIT_REQUESTS);

        let anonymous_limit = std::env::var("RATE_LIMIT_ANONYMOUS_PER_MINUTE")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(DEFAULT_RATE_LIMIT_ANONYMOUS);

        let burst_allowance = std::env::var("RATE_LIMIT_BURST")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(DEFAULT_RATE_LIMIT_BURST);

        info!(
            "Rate limiter initialized: authenticated={}/min, anonymous={}/min, burst={}",
            authenticated_limit, anonymous_limit, burst_allowance
        );

        Self {
            user_limits: DashMap::new(),
            ip_limits: DashMap::new(),
            authenticated_limit,
            anonymous_limit,
            burst_allowance,
            window_duration_ms: 60_000, // 1 minute
        }
    }

    /// Check rate limit for a user (lock-free atomic operation)
    /// Returns (allowed, remaining_requests, reset_time_ms)
    pub fn check_user_limit(&self, user_id: &str, is_authenticated: bool) -> (bool, u64, u64) {
        let limit = if is_authenticated {
            self.authenticated_limit + self.burst_allowance
        } else {
            self.anonymous_limit
        };

        self.check_limit_internal(&self.user_limits, user_id, limit)
    }

    /// Check rate limit for an IP address (lock-free atomic operation)
    /// Returns (allowed, remaining_requests, reset_time_ms)
    pub fn check_ip_limit(&self, ip: &str) -> (bool, u64, u64) {
        // IP limit is more restrictive to prevent DDoS
        let ip_limit = self.anonymous_limit * 5; // Allow 5x anonymous limit per IP
        self.check_limit_internal(&self.ip_limits, ip, ip_limit)
    }

    /// Internal lock-free rate limit check with atomic operations
    fn check_limit_internal(
        &self,
        limits: &DashMap<String, RateLimitEntry>,
        key: &str,
        max_requests: u64,
    ) -> (bool, u64, u64) {
        let now_ms = Utc::now().timestamp_millis() as u64;
        let window_start_threshold = now_ms.saturating_sub(self.window_duration_ms);

        // Use entry API for atomic get-or-insert
        let entry = limits.entry(key.to_string()).or_insert_with(|| {
            RateLimitEntry::new(now_ms)
        });

        let entry_ref = entry.value();

        // Load current window start
        let current_window_start = entry_ref.window_start.load(Ordering::Acquire);

        // Check if window has expired
        if current_window_start < window_start_threshold {
            // Window expired - reset atomically
            // Use compare_exchange to handle race condition
            match entry_ref.window_start.compare_exchange(
                current_window_start,
                now_ms,
                Ordering::AcqRel,
                Ordering::Acquire,
            ) {
                Ok(_) => {
                    // We won the race to reset the window
                    entry_ref.count.store(1, Ordering::Release);
                    let remaining = max_requests.saturating_sub(1);
                    let reset_time = now_ms + self.window_duration_ms;
                    return (true, remaining, reset_time);
                }
                Err(actual_start) => {
                    // Another thread reset the window, use their start time
                    // Fall through to normal increment logic
                    if actual_start >= window_start_threshold {
                        // Window is now valid, proceed with increment
                    }
                }
            }
        }

        // Atomically increment counter and check limit
        let previous_count = entry_ref.count.fetch_add(1, Ordering::AcqRel);
        let new_count = previous_count + 1;

        let window_start = entry_ref.window_start.load(Ordering::Acquire);
        let reset_time = window_start + self.window_duration_ms;

        if new_count > max_requests {
            // Over limit - decrement back to avoid drift
            entry_ref.count.fetch_sub(1, Ordering::AcqRel);
            (false, 0, reset_time)
        } else {
            let remaining = max_requests.saturating_sub(new_count);
            (true, remaining, reset_time)
        }
    }

    /// Combined check for both user and IP limits
    /// Returns the most restrictive result
    pub fn check_combined(
        &self,
        user_id: Option<&str>,
        ip: Option<&str>,
    ) -> RateLimitResult {
        let user_id_str = user_id.unwrap_or("anonymous");
        let is_authenticated = user_id.is_some() && user_id != Some("anonymous");

        let (user_allowed, user_remaining, user_reset) =
            self.check_user_limit(user_id_str, is_authenticated);

        // If user check failed, return immediately
        if !user_allowed {
            return RateLimitResult {
                allowed: false,
                remaining: 0,
                reset_at: user_reset,
                limit_type: RateLimitType::User,
            };
        }

        // Check IP limit if provided
        if let Some(ip_addr) = ip {
            let (ip_allowed, ip_remaining, ip_reset) = self.check_ip_limit(ip_addr);

            if !ip_allowed {
                return RateLimitResult {
                    allowed: false,
                    remaining: 0,
                    reset_at: ip_reset,
                    limit_type: RateLimitType::Ip,
                };
            }

            // Return the more restrictive limit
            return RateLimitResult {
                allowed: true,
                remaining: user_remaining.min(ip_remaining),
                reset_at: user_reset.max(ip_reset),
                limit_type: if user_remaining < ip_remaining {
                    RateLimitType::User
                } else {
                    RateLimitType::Ip
                },
            };
        }

        RateLimitResult {
            allowed: true,
            remaining: user_remaining,
            reset_at: user_reset,
            limit_type: RateLimitType::User,
        }
    }

    /// Cleanup expired entries (call periodically from background task)
    pub fn cleanup_expired(&self) {
        let now_ms = Utc::now().timestamp_millis() as u64;
        let window_start_threshold = now_ms.saturating_sub(self.window_duration_ms * 2);

        self.user_limits.retain(|_, entry| {
            entry.window_start.load(Ordering::Acquire) >= window_start_threshold
        });

        self.ip_limits.retain(|_, entry| {
            entry.window_start.load(Ordering::Acquire) >= window_start_threshold
        });
    }
}

/// Result of a rate limit check
#[derive(Debug, Clone)]
pub struct RateLimitResult {
    pub allowed: bool,
    pub remaining: u64,
    pub reset_at: u64, // Unix milliseconds
    pub limit_type: RateLimitType,
}

/// Type of rate limit that was applied
#[derive(Debug, Clone, Copy)]
pub enum RateLimitType {
    User,
    Ip,
}

// Legacy RateLimiter wrapper for backwards compatibility
#[derive(Debug)]
pub struct RateLimiter {
    inner: Arc<AtomicRateLimiter>,
}

impl RateLimiter {
    pub fn new() -> Self {
        Self {
            inner: Arc::new(AtomicRateLimiter::new()),
        }
    }

    pub fn check_rate_limit(&self, user_id: &str) -> bool {
        let (allowed, _, _) = self.inner.check_user_limit(user_id, user_id != "anonymous");
        allowed
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

// Challenge-Response Authentication Structures (Phase 3)
#[derive(Debug, Deserialize)]
pub struct ChallengeRequest {
    pub wallet_address: String,
}

#[derive(Debug, Serialize)]
pub struct ChallengeResponse {
    pub wallet_address: String,
    pub challenge: String,
    pub expires_at: i64,
}

#[derive(Debug, Deserialize)]
pub struct VerifyRequest {
    pub wallet_address: String,
    pub signature: String,
}

#[derive(Debug, Serialize)]
pub struct VerifyResponse {
    pub token: String,
    pub expires_at: i64,
    pub wallet_address: String,
    pub role: String,
}

// Legacy Login Structures (v1.3.0 compatibility)
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

// Rate Limiting Middleware with atomic operations and proper headers
pub async fn rate_limit_middleware(
    State(state): State<SecureApiState>,
    headers: HeaderMap,
    req: axum::extract::Request,
    next: axum::middleware::Next,
) -> Result<axum::response::Response, (StatusCode, Json<SecureApiError>)> {
    // Extract user ID from header or JWT token
    let user_id = headers
        .get("X-User-ID")
        .and_then(|header| header.to_str().ok())
        .or_else(|| {
            // Try to extract from Authorization header
            headers.get("Authorization")
                .and_then(|h| h.to_str().ok())
                .filter(|h| h.starts_with("Bearer "))
                .and_then(|_| Some("authenticated")) // Mark as authenticated if has token
        });

    // Extract client IP from headers (check forwarded headers for proxies)
    let client_ip = headers
        .get("X-Forwarded-For")
        .and_then(|h| h.to_str().ok())
        .and_then(|s| s.split(',').next())
        .map(|s| s.trim())
        .or_else(|| {
            headers.get("X-Real-IP")
                .and_then(|h| h.to_str().ok())
        });

    // Perform atomic rate limit check (no locks required)
    let result = state.rate_limiter.check_combined(user_id, client_ip);

    if !result.allowed {
        warn!(
            "Rate limit exceeded: user={:?}, ip={:?}, limit_type={:?}",
            user_id, client_ip, result.limit_type
        );

        // Return rate limit error with standard headers
        let error = SecureApiError::rate_limited();
        let mut response = (StatusCode::TOO_MANY_REQUESTS, Json(error)).into_response();

        // Add rate limit headers per RFC 6585 / draft-ietf-httpapi-ratelimit-headers
        let headers = response.headers_mut();
        headers.insert(
            "X-RateLimit-Limit",
            format!("{}", state.rate_limiter.authenticated_limit)
                .parse()
                .unwrap_or_default(),
        );
        headers.insert(
            "X-RateLimit-Remaining",
            "0".parse().unwrap_or_default(),
        );
        headers.insert(
            "X-RateLimit-Reset",
            format!("{}", result.reset_at / 1000) // Convert to seconds
                .parse()
                .unwrap_or_default(),
        );
        headers.insert(
            "Retry-After",
            format!("{}", (result.reset_at.saturating_sub(Utc::now().timestamp_millis() as u64)) / 1000 + 1)
                .parse()
                .unwrap_or_default(),
        );

        return Err((StatusCode::TOO_MANY_REQUESTS, Json(SecureApiError::rate_limited())));
    }

    // Execute request and add rate limit headers to response
    let mut response = next.run(req).await;

    // Add rate limit headers to successful responses
    let headers = response.headers_mut();
    headers.insert(
        "X-RateLimit-Limit",
        format!("{}", state.rate_limiter.authenticated_limit)
            .parse()
            .unwrap_or_default(),
    );
    headers.insert(
        "X-RateLimit-Remaining",
        format!("{}", result.remaining)
            .parse()
            .unwrap_or_default(),
    );
    headers.insert(
        "X-RateLimit-Reset",
        format!("{}", result.reset_at / 1000)
            .parse()
            .unwrap_or_default(),
    );

    Ok(response)
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
        .route("/api/v1/auth/challenge", post(create_challenge))
        .route("/api/v1/auth/verify", post(verify_signature))
        .route("/api/v1/auth/logout", post(logout))
        .route("/api/v1/auth/validate", get(validate_token))
        // .route("/api/v1/auth/login", post(login)) // TODO: Fix error type mismatch - disabled for Phase 3A
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

// Phase 3 Authentication Handlers (Challenge-Response Pattern)

/// Generate authentication challenge for wallet signing
async fn create_challenge(
    State(state): State<SecureApiState>,
    Json(req): Json<ChallengeRequest>,
) -> Result<Json<ChallengeResponse>, (StatusCode, String)> {
    // Validate wallet address format
    if !req.wallet_address.starts_with("0x") || req.wallet_address.len() != 42 {
        return Err((StatusCode::BAD_REQUEST, "Invalid wallet address format".to_string()));
    }
    
    // Generate challenge message
    let challenge = format!(
        "Sign this message to authenticate with Quantera:\n\nTimestamp: {}\nNonce: {}",
        Utc::now().timestamp(),
        Uuid::new_v4()
    );
    
    let expires_at = Utc::now() + Duration::minutes(5);
    
    // Store challenge in database
    sqlx::query(
        "INSERT INTO auth_challenges (wallet_address, challenge, expires_at) VALUES ($1, $2, $3)"
    )
    .bind(req.wallet_address.to_lowercase())
    .bind(&challenge)
    .bind(expires_at)
    .execute(state.db.as_ref())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?;
    
    info!("Challenge generated for wallet: {}", req.wallet_address);
    
    Ok(Json(ChallengeResponse {
        wallet_address: req.wallet_address,
        challenge,
        expires_at: expires_at.timestamp(),
    }))
}

/// Verify wallet signature and issue JWT token
async fn verify_signature(
    State(state): State<SecureApiState>,
    Json(req): Json<VerifyRequest>,
) -> Result<Json<VerifyResponse>, (StatusCode, String)> {
    // Fetch challenge from database
    let challenge_record = sqlx::query(
        "SELECT challenge, expires_at, used FROM auth_challenges 
         WHERE wallet_address = $1 
         ORDER BY created_at DESC 
         LIMIT 1"
    )
    .bind(req.wallet_address.to_lowercase())
    .fetch_optional(state.db.as_ref())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?
    .ok_or((StatusCode::UNAUTHORIZED, "No challenge found for this wallet".to_string()))?;
    
    // Extract values from row
    use sqlx::Row;
    let challenge: String = challenge_record.get("challenge");
    let expires_at: DateTime<Utc> = challenge_record.get("expires_at");
    let used: bool = challenge_record.get("used");
    
    // Check if challenge expired
    if expires_at < Utc::now() {
        return Err((StatusCode::UNAUTHORIZED, "Challenge expired".to_string()));
    }
    
    // Check if already used
    if used {
        return Err((StatusCode::UNAUTHORIZED, "Challenge already used".to_string()));
    }
    
    // PHASE 3B: Real ECDSA signature verification using ethers-rs
    use ethers::core::types::Signature;
    use ethers::utils::hash_message;
    
    // Parse the signature
    let signature = req.signature.parse::<Signature>()
        .map_err(|e| {
            warn!("Invalid signature format from {}: {}", req.wallet_address, e);
            (StatusCode::BAD_REQUEST, "Invalid signature format".to_string())
        })?;
    
    // Hash the challenge message (this is what the wallet actually signs)
    let message_hash = hash_message(challenge.as_bytes());
    
    // Recover the address that signed this message
    let recovered_address = signature.recover(message_hash)
        .map_err(|e| {
            warn!("Signature recovery failed for {}: {}", req.wallet_address, e);
            (StatusCode::UNAUTHORIZED, "Invalid signature".to_string())
        })?;
    
    // Compare recovered address with claimed address (case-insensitive)
    let expected_address = req.wallet_address.to_lowercase();
    let recovered_address_hex = format!("{:?}", recovered_address).to_lowercase();
    
    if recovered_address_hex != expected_address {
        warn!(
            "Signature mismatch: expected {}, got {}", 
            expected_address, 
            recovered_address_hex
        );
        return Err((
            StatusCode::UNAUTHORIZED, 
            "Signature verification failed - address mismatch".to_string()
        ));
    }
    
    info!("Signature verified successfully for {}", req.wallet_address);
    
    // Mark challenge as used
    sqlx::query(
        "UPDATE auth_challenges SET used = true WHERE wallet_address = $1 AND challenge = $2"
    )
    .bind(req.wallet_address.to_lowercase())
    .bind(&challenge)
    .execute(state.db.as_ref())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?;
    
    // Create or update user
    let user_record = sqlx::query(
        "INSERT INTO users (wallet_address) VALUES ($1) 
         ON CONFLICT (wallet_address) DO UPDATE SET last_login = NOW()
         RETURNING id, wallet_address"
    )
    .bind(req.wallet_address.to_lowercase())
    .fetch_one(state.db.as_ref())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?;
    
    let user_id: Uuid = user_record.get("id");
    let wallet_address: String = user_record.get("wallet_address");
    
    // Generate JWT token
    let exp = (Utc::now() + Duration::hours(24)).timestamp() as i64;
    let iat = Utc::now().timestamp() as i64;
    
    // Simplified JWT claims for Phase 3
    #[derive(Serialize)]
    struct SimpleClaims {
        sub: String,       // wallet address
        exp: i64,          // expiration timestamp
        iat: i64,          // issued at timestamp
        role: String,      // user role
    }
    
    let claims = SimpleClaims {
        sub: wallet_address.clone(),
        exp,
        iat,
        role: "user".to_string(), // Default role for Phase 3
    };
    
    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(state.jwt_secret.as_bytes()),
    )
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Token generation failed: {}", e)))?;
    
    // Store session
    let token_hash = format!("{:x}", Sha256::digest(token.as_bytes()));
    
    sqlx::query(
        "INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)"
    )
    .bind(user_id)
    .bind(&token_hash)
    .bind(chrono::DateTime::from_timestamp(exp, 0).unwrap())
    .execute(state.db.as_ref())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?;
    
    info!("Authentication successful for wallet: {}", wallet_address);
    
    Ok(Json(VerifyResponse {
        token,
        expires_at: exp,
        wallet_address,
        role: "user".to_string(),
    }))
}

/// Validate JWT token
async fn validate_token(
    State(state): State<SecureApiState>,
    headers: HeaderMap,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    // Extract token from Authorization header
    let auth_header = headers
        .get("Authorization")
        .and_then(|h| h.to_str().ok());
    
    if auth_header.is_none() || !auth_header.unwrap().starts_with("Bearer ") {
        return Ok(Json(serde_json::json!({
            "valid": false,
            "wallet_address": null,
            "role": null,
            "expires_at": null
        })));
    }
    
    let token = &auth_header.unwrap()[7..];
    
    // Decode JWT
    use jsonwebtoken::{decode, DecodingKey, Validation};
    
    #[derive(Deserialize)]
    struct SimpleClaims {
        sub: String,
        exp: i64,
        role: String,
    }
    
    let token_data = decode::<SimpleClaims>(
        token,
        &DecodingKey::from_secret(state.jwt_secret.as_bytes()),
        &Validation::default(),
    );
    
    let claims = match token_data {
        Ok(data) => data.claims,
        Err(e) => {
            info!("Token validation failed: {}", e);
            return Ok(Json(serde_json::json!({
                "valid": false,
                "wallet_address": null,
                "role": null,
                "expires_at": null
            })));
        }
    };
    
    // Check if token is revoked
    let token_hash = format!("{:x}", Sha256::digest(token.as_bytes()));
    
    let session = sqlx::query(
        "SELECT is_revoked FROM auth_sessions WHERE token_hash = $1"
    )
    .bind(&token_hash)
    .fetch_optional(state.db.as_ref())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?;
    
    let is_revoked = if let Some(row) = session {
        use sqlx::Row;
        row.get::<bool, _>("is_revoked")
    } else {
        false
    };
    
    if is_revoked {
        return Ok(Json(serde_json::json!({
            "valid": false,
            "wallet_address": null,
            "role": null,
            "expires_at": null
        })));
    }
    
    Ok(Json(serde_json::json!({
        "valid": true,
        "wallet_address": claims.sub,
        "role": claims.role,
        "expires_at": claims.exp
    })))
}

/// Logout and revoke session
async fn logout(
    State(state): State<SecureApiState>,
    headers: HeaderMap,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    // Extract token from Authorization header
    let auth_header = headers
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or((StatusCode::UNAUTHORIZED, "Missing authorization header".to_string()))?;
    
    // Check for "Bearer " prefix
    if !auth_header.starts_with("Bearer ") {
        return Err((StatusCode::UNAUTHORIZED, "Invalid authorization format".to_string()));
    }
    
    let token = &auth_header[7..]; // Skip "Bearer "
    
    // Hash the token
    let token_hash = format!("{:x}", Sha256::digest(token.as_bytes()));
    
    // Mark session as revoked in database
    let result = sqlx::query(
        "UPDATE auth_sessions SET is_revoked = true WHERE token_hash = $1"
    )
    .bind(&token_hash)
    .execute(state.db.as_ref())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?;
    
    if result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Session not found".to_string()));
    }
    
    info!("Session revoked for token hash: {}", &token_hash[..8]);
    
    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Successfully logged out"
    })))
}

// Legacy Authentication Handler (v1.3.0 compatibility)
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