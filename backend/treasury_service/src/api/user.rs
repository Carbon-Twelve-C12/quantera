use crate::{
    api::{ApiServices, ApiError, with_services, with_auth},
    Error as ServiceError,
    VerificationData, AddressData, IdData, InstitutionalVerificationData, RepresentativeData, UserPortfolio,
};
use serde::{Serialize, Deserialize};
use warp::{Filter, Rejection, Reply};
use std::sync::Arc;
use tracing::{info, debug, error};
use alloy_primitives::{Address, U256};

/// User registration request
#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterUserRequest {
    pub wallet_address: String,
    pub email: String,
}

/// Verification request
#[derive(Debug, Serialize, Deserialize)]
pub struct VerificationRequest {
    pub wallet_address: String,
    pub full_name: String,
    pub date_of_birth: String,
    pub email: String,
    pub jurisdiction: String,
    pub address: AddressData,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub government_id: Option<IdData>,
}

/// Institutional registration request
#[derive(Debug, Serialize, Deserialize)]
pub struct InstitutionalRegistrationRequest {
    pub wallet_address: String,
    pub institution_name: String,
    pub registration_number: String,
    pub jurisdiction: String,
    pub stake_amount: String,
    pub representative: RepresentativeData,
    pub bls_public_key: String,
}

/// Smart account setup request
#[derive(Debug, Serialize, Deserialize)]
pub struct SmartAccountSetupRequest {
    pub wallet_address: String,
    pub account_type: String, // "yield_reinvestment", "automated_trading", "portfolio_rebalancing", "conditional_transfers"
    pub template_parameters: serde_json::Value,
}

/// Create user routes
pub fn routes(
    services: Arc<ApiServices>,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    let register_route = warp::path!("users" / "register")
        .and(warp::post())
        .and(warp::body::json())
        .and(with_services(services.clone()))
        .and_then(register_user_handler);
    
    let verify_route = warp::path!("users" / "verify")
        .and(warp::post())
        .and(warp::body::json())
        .and(with_services(services.clone()))
        .and_then(verify_user_handler);
    
    let institutional_route = warp::path!("users" / "institutional" / "register")
        .and(warp::post())
        .and(warp::body::json())
        .and(with_services(services.clone()))
        .and_then(register_institutional_handler);
    
    let portfolio_route = warp::path!("users" / String / "portfolio")
        .and(warp::get())
        .and(with_auth(services.auth_service.clone()))
        .and(with_services(services.clone()))
        .and_then(get_portfolio_handler);
    
    let smart_account_route = warp::path!("users" / "smart-account" / "setup")
        .and(warp::post())
        .and(with_auth(services.auth_service.clone()))
        .and(warp::body::json())
        .and(with_services(services.clone()))
        .and_then(setup_smart_account_handler);
    
    register_route
        .or(verify_route)
        .or(institutional_route)
        .or(portfolio_route)
        .or(smart_account_route)
}

/// Register new user
async fn register_user_handler(
    request: RegisterUserRequest,
    services: Arc<ApiServices>,
) -> Result<impl Reply, Rejection> {
    info!("Registering new user: {}", request.wallet_address);
    
    // Parse wallet address
    let wallet_address = match Address::parse_checksummed(&request.wallet_address, None) {
        Ok(addr) => addr,
        Err(_) => {
            return Err(warp::reject::custom(ApiError(
                ServiceError::InvalidParameter("Invalid wallet address format".into())
            )));
        }
    };
    
    // Register user
    let user_data = services.user_service.register_user(wallet_address, request.email)
        .await
        .map_err(|e| warp::reject::custom(ApiError(e)))?;
    
    Ok(warp::reply::json(&user_data))
}

/// Verify user identity
async fn verify_user_handler(
    request: VerificationRequest,
    services: Arc<ApiServices>,
) -> Result<impl Reply, Rejection> {
    info!("Verifying user: {}", request.wallet_address);
    
    // Parse wallet address
    let wallet_address = match Address::parse_checksummed(&request.wallet_address, None) {
        Ok(addr) => addr,
        Err(_) => {
            return Err(warp::reject::custom(ApiError(
                ServiceError::InvalidParameter("Invalid wallet address format".into())
            )));
        }
    };
    
    // Create verification data
    let verification_data = VerificationData {
        full_name: request.full_name,
        date_of_birth: request.date_of_birth,
        email: request.email,
        address: request.address,
        government_id: request.government_id,
        jurisdiction: request.jurisdiction,
    };
    
    // Verify user
    let status = services.user_service.verify_user(wallet_address, verification_data)
        .await
        .map_err(|e| warp::reject::custom(ApiError(e)))?;
    
    // Get verification details
    let details = services.user_service.get_user_verification_status(wallet_address)
        .await
        .map_err(|e| warp::reject::custom(ApiError(e)))?;
    
    Ok(warp::reply::json(&details))
}

/// Register institutional user
async fn register_institutional_handler(
    request: InstitutionalRegistrationRequest,
    services: Arc<ApiServices>,
) -> Result<impl Reply, Rejection> {
    info!("Registering institutional user: {}", request.institution_name);
    
    // Parse wallet address
    let wallet_address = match Address::parse_checksummed(&request.wallet_address, None) {
        Ok(addr) => addr,
        Err(_) => {
            return Err(warp::reject::custom(ApiError(
                ServiceError::InvalidParameter("Invalid wallet address format".into())
            )));
        }
    };
    
    // Parse stake amount
    let stake_amount = request.stake_amount.parse::<u64>()
        .map(U256::from)
        .map_err(|_| warp::reject::custom(ApiError(
            ServiceError::InvalidParameter("Invalid stake amount".into())
        )))?;
    
    // Create verification data
    let verification_data = InstitutionalVerificationData {
        institution_name: request.institution_name,
        registration_number: request.registration_number,
        jurisdiction: request.jurisdiction,
        representative: request.representative,
        bls_public_key: request.bls_public_key,
    };
    
    // Register institutional user
    let result = services.user_service.register_institutional_user(
        wallet_address, 
        verification_data, 
        stake_amount
    ).await.map_err(|e| warp::reject::custom(ApiError(e)))?;
    
    Ok(warp::reply::json(&result))
}

/// Get user portfolio
async fn get_portfolio_handler(
    wallet_address_str: String,
    _token: String, // From auth middleware
    services: Arc<ApiServices>,
) -> Result<impl Reply, Rejection> {
    info!("Getting portfolio for user: {}", wallet_address_str);
    
    // Parse wallet address
    let wallet_address = match Address::parse_checksummed(&wallet_address_str, None) {
        Ok(addr) => addr,
        Err(_) => {
            return Err(warp::reject::custom(ApiError(
                ServiceError::InvalidParameter("Invalid wallet address format".into())
            )));
        }
    };
    
    // Get portfolio
    let portfolio = services.user_service.get_user_portfolio(wallet_address)
        .await
        .map_err(|e| warp::reject::custom(ApiError(e)))?;
    
    // Return enhanced portfolio with market data
    let enhanced_portfolio = enhance_portfolio_with_market_data(portfolio);
    
    Ok(warp::reply::json(&enhanced_portfolio))
}

/// Setup smart account
async fn setup_smart_account_handler(
    _token: String, // From auth middleware
    request: SmartAccountSetupRequest,
    services: Arc<ApiServices>,
) -> Result<impl Reply, Rejection> {
    info!("Setting up smart account for user: {}", request.wallet_address);
    
    // Parse wallet address
    let wallet_address = match Address::parse_checksummed(&request.wallet_address, None) {
        Ok(addr) => addr,
        Err(_) => {
            return Err(warp::reject::custom(ApiError(
                ServiceError::InvalidParameter("Invalid wallet address format".into())
            )));
        }
    };
    
    // Generate smart account code based on template
    let account_code = generate_smart_account_code(&request.account_type, &request.template_parameters)
        .map_err(|e| warp::reject::custom(ApiError(e)))?;
    
    // Setup smart account
    let result = services.user_service.setup_smart_account(wallet_address, account_code)
        .await
        .map_err(|e| warp::reject::custom(ApiError(e)))?;
    
    Ok(warp::reply::json(&result))
}

/// Generate smart account code based on template
fn generate_smart_account_code(template_type: &str, parameters: &serde_json::Value) -> Result<Vec<u8>, ServiceError> {
    // In a real implementation, this would generate actual EVM bytecode based on the template and parameters
    // For this example, we'll just return mock bytecode
    
    // Create mock bytecode
    let mock_bytecode = match template_type {
        "yield_reinvestment" => vec![0x60, 0x80, 0x60, 0x40, 0x52, 0x00],
        "automated_trading" => vec![0x60, 0x80, 0x60, 0x40, 0x52, 0x01],
        "portfolio_rebalancing" => vec![0x60, 0x80, 0x60, 0x40, 0x52, 0x02],
        "conditional_transfers" => vec![0x60, 0x80, 0x60, 0x40, 0x52, 0x03],
        _ => return Err(ServiceError::InvalidParameter(format!("Unknown template type: {}", template_type))),
    };
    
    Ok(mock_bytecode)
}

/// Enhance portfolio with additional market data
fn enhance_portfolio_with_market_data(portfolio: UserPortfolio) -> serde_json::Value {
    // In a real implementation, this would fetch current market data and enhance the portfolio
    // For this example, we'll just add some mock market data
    
    let holdings_with_market_data: Vec<serde_json::Value> = portfolio.holdings.iter().map(|holding| {
        serde_json::json!({
            "treasury_id": hex::encode(holding.treasury_id),
            "token_address": holding.token_address.to_string(),
            "name": holding.name,
            "symbol": holding.symbol,
            "balance": holding.balance.to_string(),
            "value": holding.value.to_string(),
            "pending_yield": holding.pending_yield.to_string(),
            "yield_rate": holding.yield_rate,
            "maturity_date": holding.maturity_date,
            "is_restricted": holding.is_restricted,
            // Mock market data
            "market_data": {
                "current_price": (holding.value / holding.balance).to_string(),
                "daily_change_percent": format!("{:.2}", (rand::random::<f32>() * 2.0 - 1.0)),
                "daily_volume": format!("{}", rand::random::<u32>() * 1000),
                "market_cap": format!("{}", rand::random::<u32>() * 1000000),
            }
        })
    }).collect();
    
    serde_json::json!({
        "wallet_address": portfolio.wallet_address.to_string(),
        "holdings": holdings_with_market_data,
        "total_value": portfolio.total_value.to_string(),
        "total_pending_yield": portfolio.total_pending_yield.to_string(),
        "verification_status": format!("{:?}", portfolio.verification_status),
        "investment_limit": portfolio.investment_limit.map(|v| v.to_string()),
        "smart_account_enabled": portfolio.smart_account_enabled,
        // Mock portfolio analytics
        "analytics": {
            "yield_weighted_average": format!("{:.2}%", portfolio.holdings.iter().map(|h| h.yield_rate as f64 * (h.value.as_u128() as f64 / portfolio.total_value.as_u128() as f64)).sum::<f64>() / 100.0),
            "maturity_distribution": {
                "short_term": format!("{:.2}%", rand::random::<f32>() * 100.0),
                "medium_term": format!("{:.2}%", rand::random::<f32>() * 100.0),
                "long_term": format!("{:.2}%", rand::random::<f32>() * 100.0),
            },
            "risk_score": format!("{:.1}/10", rand::random::<f32>() * 10.0),
        }
    })
} 