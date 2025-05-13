use crate::{
    api::{ApiServices, ApiError, with_services, with_auth},
    Error as ServiceError,
    TreasuryType, TreasuryOverview, TreasuryInfo, TreasuryMetadata,
};
use serde::{Serialize, Deserialize};
use warp::{Filter, Rejection, Reply};
use std::sync::Arc;
use tracing::{info, debug, error};
use alloy_primitives::{U256, Address};

/// Treasury filter parameters
#[derive(Debug, Serialize, Deserialize, Default, Clone)]
pub struct TreasuryQueryParams {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub treasury_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub min_yield: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_maturity: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub limit: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub offset: Option<usize>,
}

/// Treasury creation request
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTreasuryRequest {
    pub name: String,
    pub symbol: String,
    pub description: String,
    pub treasury_type: String,
    pub total_supply: String,
    pub face_value: String,
    pub yield_rate: u64,
    pub maturity_date: u64,
}

/// Create treasury routes
pub fn routes(
    services: Arc<ApiServices>,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    let list_route = warp::path!("treasuries")
        .and(warp::get())
        .and(warp::query::<TreasuryQueryParams>())
        .and(with_services(services.clone()))
        .and_then(list_treasuries_handler);
    
    let detail_route = warp::path!("treasuries" / String)
        .and(warp::get())
        .and(with_services(services.clone()))
        .and_then(get_treasury_handler);
    
    let create_route = warp::path!("treasuries")
        .and(warp::post())
        .and(with_auth(services.auth_service.clone()))
        .and(warp::body::json())
        .and(with_services(services.clone()))
        .and_then(create_treasury_handler);
    
    let yield_info_route = warp::path!("treasuries" / String / "yield")
        .and(warp::get())
        .and(with_services(services.clone()))
        .and_then(get_treasury_yield_handler);
    
    list_route
        .or(detail_route)
        .or(create_route)
        .or(yield_info_route)
}

/// List treasuries handler
async fn list_treasuries_handler(
    params: TreasuryQueryParams,
    services: Arc<ApiServices>,
) -> Result<impl Reply, Rejection> {
    info!("Listing treasuries with filters: {:?}", params);
    
    // Get all treasuries
    let mut treasuries = services.treasury_service
        .get_all_treasuries()
        .await
        .map_err(|e| warp::reject::custom(ApiError(e)))?;
    
    // Apply filters
    if let Some(type_str) = &params.treasury_type {
        let treasury_type = match type_str.as_str() {
            "tbill" => Some(TreasuryType::TBill),
            "tnote" => Some(TreasuryType::TNote),
            "tbond" => Some(TreasuryType::TBond),
            _ => None,
        };
        
        if let Some(t_type) = treasury_type {
            treasuries.retain(|t| t.treasury_type == t_type);
        }
    }
    
    if let Some(min_yield) = params.min_yield {
        treasuries.retain(|t| t.yield_rate >= min_yield);
    }
    
    if let Some(max_maturity) = params.max_maturity {
        treasuries.retain(|t| t.maturity_date <= max_maturity);
    }
    
    // Paginate results
    let limit = params.limit.unwrap_or(10).min(100);
    let offset = params.offset.unwrap_or(0);
    
    let paginated = if offset < treasuries.len() {
        let end = (offset + limit).min(treasuries.len());
        treasuries[offset..end].to_vec()
    } else {
        vec![]
    };
    
    Ok(warp::reply::json(&paginated))
}

/// Get treasury details handler
async fn get_treasury_handler(
    id: String,
    services: Arc<ApiServices>,
) -> Result<impl Reply, Rejection> {
    info!("Getting treasury details for ID: {}", id);
    
    // Parse treasury ID from hex string
    let treasury_id = parse_treasury_id(&id)?;
    
    // Get treasury details
    let info = services.treasury_service
        .get_treasury_details(treasury_id)
        .await
        .map_err(|e| warp::reject::custom(ApiError(e)))?;
    
    Ok(warp::reply::json(&info))
}

/// Create new treasury handler
async fn create_treasury_handler(
    _token: String, // From auth middleware
    request: CreateTreasuryRequest,
    services: Arc<ApiServices>,
) -> Result<impl Reply, Rejection> {
    info!("Creating new treasury: {}", request.name);

    // Parse treasury type
    let treasury_type = match request.treasury_type.to_lowercase().as_str() {
        "tbill" => TreasuryType::TBill,
        "tnote" => TreasuryType::TNote,
        "tbond" => TreasuryType::TBond,
        _ => {
            error!("Invalid treasury type: {}", request.treasury_type);
            return Err(warp::reject::custom(ApiError(
                ServiceError::InvalidParameter("Invalid treasury type".into())
            )));
        }
    };

    // Parse face value
    let face_value = parse_decimal_string(&request.face_value)
        .map_err(|e| warp::reject::custom(ApiError(e)))?;

    // Parse total supply
    let total_supply = request.total_supply.parse::<u64>()
        .map_err(|_| warp::reject::custom(ApiError(
            ServiceError::InvalidParameter("Invalid total supply".into())
        )))?;

    // TODO: Replace with real issuer address from auth context
    let issuer_address = Address::ZERO;

    // Issuer validation: ensure issuer is approved
    let is_approved = services.treasury_service
        .is_approved_issuer(issuer_address)
        .await
        .map_err(|e| {
            error!("Issuer validation failed: {}", e);
            warp::reject::custom(ApiError(ServiceError::Unauthorized("Issuer validation failed".into())))
        })?;
    if !is_approved {
        error!("Unauthorized issuer: {}", issuer_address);
        return Err(warp::reject::custom(ApiError(ServiceError::Unauthorized("Issuer is not approved".into()))));
    }

    // Compliance check: ensure issuer passes KYC/AML (placeholder)
    let is_compliant = true; // TODO: Integrate with compliance module
    if !is_compliant {
        error!("Issuer failed compliance checks: {}", issuer_address);
        return Err(warp::reject::custom(ApiError(ServiceError::Unauthorized("Issuer failed compliance checks".into()))));
    }

    // Get current timestamp for issuance date
    let issuance_date = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    // Create treasury
    let overview = services.treasury_service.create_treasury_token(
        request.name,
        request.symbol,
        total_supply,
        treasury_type,
        face_value,
        request.yield_rate,
        issuance_date,
        request.maturity_date,
        issuer_address,
    ).await.map_err(|e| {
        error!("Failed to create treasury: {}", e);
        warp::reject::custom(ApiError(e))
    })?;

    info!("Treasury created: {:?}", overview);
    // TODO: Emit event to audit log or event bus

    Ok(warp::reply::json(&overview))
}

/// Get treasury yield information
async fn get_treasury_yield_handler(
    id: String,
    services: Arc<ApiServices>,
) -> Result<impl Reply, Rejection> {
    info!("Getting yield information for treasury ID: {}", id);
    
    // Parse treasury ID from hex string
    let treasury_id = parse_treasury_id(&id)?;
    
    // Get treasury details
    let info = services.treasury_service
        .get_treasury_details(treasury_id)
        .await
        .map_err(|e| warp::reject::custom(ApiError(e)))?;
    
    // Create yield response
    let yield_info = serde_json::json!({
        "treasury_id": id,
        "yield_rate": info.yield_rate,
        "annual_yield_percentage": info.yield_rate as f64 / 100.0,
        "maturity_date": info.maturity_date,
        "issuance_date": info.issuance_date,
        "time_to_maturity": if info.maturity_date > chrono::Utc::now().timestamp() as u64 {
            info.maturity_date - chrono::Utc::now().timestamp() as u64
        } else {
            0
        },
    });
    
    Ok(warp::reply::json(&yield_info))
}

/// Parse treasury ID from hex string
fn parse_treasury_id(id: &str) -> Result<[u8; 32], Rejection> {
    let id_cleaned = id.trim_start_matches("0x");
    let bytes = hex::decode(id_cleaned)
        .map_err(|_| warp::reject::custom(ApiError(
            ServiceError::InvalidParameter("Invalid treasury ID format".into())
        )))?;
    
    if bytes.len() != 32 {
        return Err(warp::reject::custom(ApiError(
            ServiceError::InvalidParameter("Treasury ID must be 32 bytes".into())
        )));
    }
    
    let mut result = [0u8; 32];
    result.copy_from_slice(&bytes);
    Ok(result)
}

/// Parse decimal string to U256
fn parse_decimal_string(value: &str) -> Result<U256, ServiceError> {
    // Remove commas if present
    let cleaned = value.replace(',', "");
    
    // Split on decimal point
    let parts: Vec<&str> = cleaned.split('.').collect();
    
    match parts.len() {
        1 => {
            // No decimal point
            let integer_value = parts[0].parse::<u64>()
                .map_err(|_| ServiceError::InvalidParameter(format!("Invalid number format: {}", value)))?;
            Ok(U256::from(integer_value))
        },
        2 => {
            // Has decimal point
            let integer_part = parts[0].parse::<u64>()
                .map_err(|_| ServiceError::InvalidParameter(format!("Invalid number format: {}", value)))?;
            
            let decimal_part = parts[1];
            let scale = 10u64.pow(decimal_part.len() as u32);
            let decimal_value = decimal_part.parse::<u64>()
                .map_err(|_| ServiceError::InvalidParameter(format!("Invalid number format: {}", value)))?;
            
            let value = integer_part * scale + decimal_value;
            Ok(U256::from(value))
        },
        _ => Err(ServiceError::InvalidParameter(format!("Invalid number format: {}", value))),
    }
} 