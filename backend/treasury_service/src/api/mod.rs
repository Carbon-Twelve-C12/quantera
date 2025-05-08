use crate::{
    TreasuryService,
    YieldSchedulerService,
    UserService,
    AuthenticationService,
    Error as ServiceError,
    TreasuryRegistryClient,
    clients::{
        TreasuryTokenClient,
        TradingClient,
        L2Client,
    },
    AssetManagementService,
};
use warp::{Filter, Rejection, Reply};
use std::sync::Arc;
use std::convert::Infallible;
use serde::{Serialize, Deserialize};
use tracing::{info, error, debug};
use http::StatusCode;
use ethereum_client::EthereumClient;
use ethereum_client::Address;

// Import individual route modules
mod auth;
mod treasury;
mod user;
mod trading;
mod health;
mod liquidity_pools_api;
mod yield_optimizer_api;
mod environmental_assets;

// Re-export for easy access
pub use auth::routes as auth_routes;
pub use treasury::routes as treasury_routes;
pub use user::routes as user_routes;
pub use trading::routes as trading_routes;
pub use health::routes as health_routes;
pub use liquidity_pools_api::liquidity_pools_routes;
pub use yield_optimizer_api::yield_optimizer_routes;
pub use environmental_assets::routes as environmental_assets_routes;

/// Container for token clients
#[derive(Clone)]
pub struct TokenClientsContainer {
    pub treasury_token_client: TreasuryTokenClient,
}

/// API error response
#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorResponse {
    pub code: u16,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<String>,
}

/// All services required by the API
pub struct ApiServices {
    pub treasury_service: Arc<TreasuryService>,
    pub registry_client: Arc<TreasuryRegistryClient>,
    pub yield_scheduler: Arc<YieldSchedulerService>,
    pub user_service: Arc<UserService>,
    pub auth_service: Arc<AuthenticationService>,
    pub ethereum_client: Arc<EthereumClient>,
    pub trading_client: Arc<TradingClient>,
    pub l2_client: Arc<L2Client>,
    pub token_clients: Arc<TokenClientsContainer>,
    pub asset_management_service: Arc<AssetManagementService>,
}

/// Create all API routes
pub fn routes(
    services: ApiServices,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    let api_services = Arc::new(services);
    
    // Health check
    let health_routes = health::routes();
    
    // Auth routes
    let auth_routes = auth::routes(api_services.clone());
    
    // Treasury routes
    let treasury_routes = treasury::routes(api_services.clone());
    
    // User routes
    let user_routes = user::routes(api_services.clone());
    
    // Trading routes
    let trading_routes = trading::routes(api_services.clone());
    
    // Liquidity pool routes
    let liquidity_routes = liquidity_pools_api::liquidity_pools_routes(
        api_services.ethereum_client.clone(),
        // Using a placeholder address - replace with actual address
        Address::from_slice(&[0u8; 20])
    );
    
    // Yield optimizer routes
    let yield_routes = yield_optimizer_api::yield_optimizer_routes(
        api_services.ethereum_client.clone(),
        // Using a placeholder address - replace with actual address
        Address::from_slice(&[0u8; 20]) 
    );
    
    // Environmental assets routes
    let environmental_routes = environmental_assets::routes(
        api_services.asset_management_service.clone()
    );
    
    // Combine all routes with prefix
    let api_routes = health_routes
        .or(auth_routes)
        .or(treasury_routes)
        .or(user_routes)
        .or(trading_routes)
        .or(liquidity_routes)
        .or(yield_routes)
        .or(environmental_routes)
        .with(warp::trace::request())
        .recover(handle_rejection);
    
    let cors = warp::cors()
        .allow_any_origin()
        .allow_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
        .allow_headers(vec!["Content-Type", "Authorization", "Accept"])
        .max_age(86400); // 24 hours in seconds
    
    api_routes.with(cors)
}

/// Convert a ServiceError to a Warp rejection
#[derive(Debug)]
pub struct ApiError(pub ServiceError);

impl warp::reject::Reject for ApiError {}

/// Convert ServiceError to API error response
pub fn error_response(err: &ServiceError) -> (StatusCode, ErrorResponse) {
    let (code, message) = match err {
        ServiceError::NotFound(_) => (StatusCode::NOT_FOUND, "Resource not found"),
        ServiceError::Unauthorized(_) => (StatusCode::UNAUTHORIZED, "Unauthorized"),
        ServiceError::InvalidParameter(_) => (StatusCode::BAD_REQUEST, "Invalid parameter"),
        ServiceError::ContractInteraction(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Blockchain interaction error"),
        ServiceError::EthereumClient(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Ethereum client error"),
        ServiceError::InvalidState(_) => (StatusCode::CONFLICT, "Invalid state"),
        ServiceError::Unimplemented(_) => (StatusCode::NOT_IMPLEMENTED, "Feature not implemented"),
        _ => (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error"),
    };
    
    (code, ErrorResponse {
        code: code.as_u16(),
        message: message.to_string(),
        details: Some(err.to_string()),
    })
}

/// Handle all rejections and convert to error responses
async fn handle_rejection(err: Rejection) -> Result<impl Reply, Infallible> {
    let (code, error_resp) = if let Some(api_error) = err.find::<ApiError>() {
        error_response(&api_error.0)
    } else if let Some(e) = err.find::<warp::filters::body::BodyDeserializeError>() {
        (
            StatusCode::BAD_REQUEST,
            ErrorResponse {
                code: StatusCode::BAD_REQUEST.as_u16(),
                message: "Invalid request body".to_string(),
                details: Some(e.to_string()),
            },
        )
    } else if err.find::<warp::reject::MethodNotAllowed>().is_some() {
        (
            StatusCode::METHOD_NOT_ALLOWED,
            ErrorResponse {
                code: StatusCode::METHOD_NOT_ALLOWED.as_u16(),
                message: "Method not allowed".to_string(),
                details: None,
            },
        )
    } else if err.find::<warp::reject::MissingHeader>().is_some() {
        (
            StatusCode::BAD_REQUEST,
            ErrorResponse {
                code: StatusCode::BAD_REQUEST.as_u16(),
                message: "Missing required header".to_string(),
                details: None,
            },
        )
    } else {
        error!("Unhandled rejection: {:?}", err);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            ErrorResponse {
                code: StatusCode::INTERNAL_SERVER_ERROR.as_u16(),
                message: "Unhandled rejection".to_string(),
                details: None,
            },
        )
    };
    
    Ok(warp::reply::with_status(
        warp::reply::json(&error_resp),
        code,
    ))
}

/// Authentication middleware
pub fn with_auth(auth_service: Arc<AuthenticationService>) -> impl Filter<Extract = (String,), Error = Rejection> + Clone {
    warp::header::<String>("Authorization")
        .and_then(move |token: String| {
            let auth_service = auth_service.clone();
            async move {
                // Extract Bearer token
                let parts: Vec<&str> = token.split_whitespace().collect();
                if parts.len() != 2 || parts[0] != "Bearer" {
                    return Err(warp::reject::custom(ApiError(
                        ServiceError::Unauthorized("Invalid Authorization header format".into())
                    )));
                }
                
                let token = parts[1];
                
                // Validate token
                let validation = auth_service.validate_token(token);
                if !validation.is_valid {
                    return Err(warp::reject::custom(ApiError(
                        ServiceError::Unauthorized(validation.error_message.unwrap_or_else(|| "Invalid token".into()))
                    )));
                }
                
                Ok(token.to_string())
            }
        })
}

/// Extract services from context
pub fn with_services(services: Arc<ApiServices>) -> impl Filter<Extract = (Arc<ApiServices>,), Error = Infallible> + Clone {
    warp::any().map(move || services.clone())
} 