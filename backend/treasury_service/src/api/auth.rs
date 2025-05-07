use crate::{
    api::{ApiServices, ApiError, with_services},
    AuthRequest, AuthMethod, AuthChallenge,
    Error as ServiceError,
};
use serde::{Serialize, Deserialize};
use warp::{Filter, Rejection, Reply};
use std::sync::Arc;
use tracing::{info, debug, error};
use alloy_primitives::Address;

/// Challenge request
#[derive(Debug, Serialize, Deserialize)]
pub struct ChallengeRequest {
    wallet_address: String,
}

/// Challenge response
#[derive(Debug, Serialize, Deserialize)]
pub struct ChallengeResponse {
    wallet_address: String,
    challenge: String,
    expires_at: u64,
}

/// Login request
#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    wallet_address: String,
    signature: String,
    auth_method: String,
}

/// Login response
#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    token: String,
    expires_at: u64,
    role: String,
    is_institutional: bool,
    is_verified: bool,
    wallet_address: String,
}

/// Create authentication routes
pub fn routes(
    services: Arc<ApiServices>,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    let challenge_route = warp::path!("auth" / "challenge")
        .and(warp::post())
        .and(warp::body::json())
        .and(with_services(services.clone()))
        .and_then(challenge_handler);
    
    let login_route = warp::path!("auth" / "login")
        .and(warp::post())
        .and(warp::body::json())
        .and(with_services(services.clone()))
        .and_then(login_handler);
    
    let logout_route = warp::path!("auth" / "logout")
        .and(warp::post())
        .and(warp::header::<String>("Authorization"))
        .and(with_services(services.clone()))
        .and_then(logout_handler);
    
    challenge_route.or(login_route).or(logout_route)
}

/// Generate authentication challenge
async fn challenge_handler(
    request: ChallengeRequest,
    services: Arc<ApiServices>,
) -> Result<impl Reply, Rejection> {
    info!("Generating challenge for wallet: {}", request.wallet_address);
    
    // Parse wallet address
    let wallet_address = match Address::parse_checksummed(&request.wallet_address, None) {
        Ok(addr) => addr,
        Err(_) => {
            return Err(warp::reject::custom(ApiError(
                ServiceError::InvalidParameter("Invalid wallet address format".into())
            )));
        }
    };
    
    // Generate challenge
    let challenge = services.auth_service.generate_challenge(wallet_address)
        .await
        .map_err(|e| warp::reject::custom(ApiError(e)))?;
    
    // Convert to response
    let response = ChallengeResponse {
        wallet_address: request.wallet_address,
        challenge: challenge.challenge,
        expires_at: challenge.expires_at,
    };
    
    Ok(warp::reply::json(&response))
}

/// Handle login request
async fn login_handler(
    request: LoginRequest,
    services: Arc<ApiServices>,
) -> Result<impl Reply, Rejection> {
    info!("Processing login for wallet: {}", request.wallet_address);
    
    // Parse wallet address
    let wallet_address = match Address::parse_checksummed(&request.wallet_address, None) {
        Ok(addr) => addr,
        Err(_) => {
            return Err(warp::reject::custom(ApiError(
                ServiceError::InvalidParameter("Invalid wallet address format".into())
            )));
        }
    };
    
    // Parse auth method
    let auth_method = match request.auth_method.as_str() {
        "wallet" => AuthMethod::Wallet,
        "password" => AuthMethod::Password,
        "2fa" => AuthMethod::TwoFactor,
        "smart_account" => AuthMethod::SmartAccount,
        _ => {
            return Err(warp::reject::custom(ApiError(
                ServiceError::InvalidParameter("Invalid authentication method".into())
            )));
        }
    };
    
    // Create auth request
    let auth_request = AuthRequest {
        wallet_address,
        signature: Some(request.signature),
        password: None,
        two_factor_code: None,
        auth_method,
    };
    
    // Process authentication
    let auth_result = services.auth_service.authenticate(auth_request)
        .await
        .map_err(|e| warp::reject::custom(ApiError(e)))?;
    
    // Create response
    let response = LoginResponse {
        token: auth_result.token,
        expires_at: auth_result.expires_at,
        role: auth_result.role,
        is_institutional: auth_result.is_institutional,
        is_verified: auth_result.is_verified,
        wallet_address: request.wallet_address,
    };
    
    Ok(warp::reply::json(&response))
}

/// Handle logout request
async fn logout_handler(
    auth_header: String,
    services: Arc<ApiServices>,
) -> Result<impl Reply, Rejection> {
    // Extract token
    let parts: Vec<&str> = auth_header.split_whitespace().collect();
    if parts.len() != 2 || parts[0] != "Bearer" {
        return Err(warp::reject::custom(ApiError(
            ServiceError::Unauthorized("Invalid Authorization header format".into())
        )));
    }
    
    let token = parts[1];
    
    // Revoke token
    services.auth_service.revoke_token(token)
        .await
        .map_err(|e| warp::reject::custom(ApiError(e)))?;
    
    // Return success
    Ok(warp::reply::json(&serde_json::json!({
        "success": true,
        "message": "Successfully logged out"
    })))
} 