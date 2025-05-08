use warp::{Filter, Rejection, Reply};
use serde::{Serialize, Deserialize};
use ethers::types::{H256, Address, U256};
use std::sync::Arc;
use std::convert::TryFrom;
use std::str::FromStr;

use crate::asset_management_service::{
    AssetManagementService, 
    AssetManagementError, 
    EnvironmentalAssetDetails,
    EnvironmentalAssetType,
    CertificationStandard,
    VerificationStatus,
    ImpactMetrics
};
use crate::auth::jwt::with_auth;

/// Request to retire environmental credits
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetireCreditsRequest {
    pub amount: String,
    pub retirement_reason: String,
    pub beneficiary: Option<String>,
}

/// API error response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiError {
    pub message: String,
}

/// Creates environmental assets API routes
pub fn routes(
    asset_management_service: Arc<AssetManagementService>
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    let service = Arc::clone(&asset_management_service);
    
    let get_assets = warp::path!("environmental" / "assets")
        .and(warp::get())
        .and(with_service(service.clone()))
        .and_then(get_assets_handler);
    
    let get_asset = warp::path!("environmental" / "assets" / String)
        .and(warp::get())
        .and(with_service(service.clone()))
        .and_then(get_asset_handler);
    
    let get_assets_by_type = warp::path!("environmental" / "assets" / "type" / String)
        .and(warp::get())
        .and(with_service(service.clone()))
        .and_then(get_assets_by_type_handler);
    
    let get_assets_by_standard = warp::path!("environmental" / "assets" / "standard" / String)
        .and(warp::get())
        .and(with_service(service.clone()))
        .and_then(get_assets_by_standard_handler);
    
    let retire_asset = warp::path!("environmental" / "assets" / String / "retire")
        .and(warp::post())
        .and(with_auth())
        .and(warp::body::json::<RetireCreditsRequest>())
        .and(with_service(service.clone()))
        .and_then(retire_asset_handler);
    
    let get_impact = warp::path!("environmental" / "impact" / String)
        .and(warp::get())
        .and(with_service(service.clone()))
        .and_then(get_impact_handler);
    
    let get_portfolio_impact = warp::path!("environmental" / "impact" / "portfolio" / String)
        .and(warp::get())
        .and(with_service(service.clone()))
        .and_then(get_portfolio_impact_handler);
    
    let get_certifications = warp::path!("environmental" / "certifications")
        .and(warp::get())
        .and(with_service(service.clone()))
        .and_then(get_certifications_handler);
    
    let generate_report = warp::path!("environmental" / "reports" / String)
        .and(warp::get())
        .and(with_auth())
        .and(with_service(service.clone()))
        .and_then(generate_report_handler);
    
    get_assets
        .or(get_asset)
        .or(get_assets_by_type)
        .or(get_assets_by_standard)
        .or(retire_asset)
        .or(get_impact)
        .or(get_portfolio_impact)
        .or(get_certifications)
        .or(generate_report)
}

/// Helper to provide service to route handlers
fn with_service(
    service: Arc<AssetManagementService>
) -> impl Filter<Extract = (Arc<AssetManagementService>,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || service.clone())
}

/// Convert service errors to API errors
fn handle_error(err: AssetManagementError) -> Rejection {
    warp::reject::custom(ApiError {
        message: err.to_string(),
    })
}

/// Handler for getting all environmental assets
async fn get_assets_handler(
    service: Arc<AssetManagementService>
) -> Result<impl Reply, Rejection> {
    // This is a placeholder - in a real implementation, we would
    // query all asset types and aggregate them
    
    let carbon_assets = service
        .get_environmental_assets_by_type(EnvironmentalAssetType::CarbonCredit)
        .await
        .map_err(handle_error)?;
    
    let response = serde_json::json!({
        "assets": carbon_assets,
        "count": carbon_assets.len()
    });
    
    Ok(warp::reply::json(&response))
}

/// Handler for getting a specific environmental asset
async fn get_asset_handler(
    asset_id: String,
    service: Arc<AssetManagementService>
) -> Result<impl Reply, Rejection> {
    // Parse the asset ID from hex
    let asset_id = H256::from_str(&asset_id)
        .map_err(|_| handle_error(AssetManagementError::InvalidParameter("Invalid asset ID format".to_string())))?;
    
    let asset = service
        .get_environmental_asset(asset_id)
        .await
        .map_err(handle_error)?;
    
    Ok(warp::reply::json(&asset))
}

/// Handler for getting assets by type
async fn get_assets_by_type_handler(
    asset_type: String,
    service: Arc<AssetManagementService>
) -> Result<impl Reply, Rejection> {
    // Parse the asset type
    let asset_type = match asset_type.to_lowercase().as_str() {
        "carboncredit" => EnvironmentalAssetType::CarbonCredit,
        "biodiversitycredit" => EnvironmentalAssetType::BiodiversityCredit,
        "renewableenergycertificate" => EnvironmentalAssetType::RenewableEnergyCertificate,
        "waterright" => EnvironmentalAssetType::WaterRight,
        "custom" => EnvironmentalAssetType::Custom,
        _ => return Err(handle_error(AssetManagementError::InvalidParameter(format!("Unknown asset type: {}", asset_type)))),
    };
    
    let assets = service
        .get_environmental_assets_by_type(asset_type)
        .await
        .map_err(handle_error)?;
    
    let response = serde_json::json!({
        "assets": assets,
        "count": assets.len(),
        "asset_type": format!("{:?}", asset_type)
    });
    
    Ok(warp::reply::json(&response))
}

/// Handler for getting assets by certification standard
async fn get_assets_by_standard_handler(
    standard: String,
    service: Arc<AssetManagementService>
) -> Result<impl Reply, Rejection> {
    // Parse the certification standard
    let standard = match standard.to_lowercase().as_str() {
        "verra" => CertificationStandard::Verra,
        "goldstandard" => CertificationStandard::GoldStandard,
        "climateactionreserve" => CertificationStandard::ClimateActionReserve,
        "americancarbonregistry" => CertificationStandard::AmericanCarbonRegistry,
        "planvivo" => CertificationStandard::PlanVivo,
        "custom" => CertificationStandard::Custom,
        _ => return Err(handle_error(AssetManagementError::InvalidParameter(format!("Unknown standard: {}", standard)))),
    };
    
    let assets = service
        .get_environmental_assets_by_standard(standard)
        .await
        .map_err(handle_error)?;
    
    let response = serde_json::json!({
        "assets": assets,
        "count": assets.len(),
        "standard": format!("{:?}", standard)
    });
    
    Ok(warp::reply::json(&response))
}

/// Handler for retiring environmental credits
async fn retire_asset_handler(
    asset_id: String,
    _user_id: String,
    req: RetireCreditsRequest,
    service: Arc<AssetManagementService>
) -> Result<impl Reply, Rejection> {
    // Parse the asset ID from hex
    let asset_id = H256::from_str(&asset_id)
        .map_err(|_| handle_error(AssetManagementError::InvalidParameter("Invalid asset ID format".to_string())))?;
    
    // Parse the amount
    let amount = U256::from_dec_str(&req.amount)
        .map_err(|_| handle_error(AssetManagementError::InvalidParameter("Invalid amount format".to_string())))?;
    
    let success = service
        .retire_environmental_asset(asset_id, amount, req.retirement_reason, req.beneficiary)
        .await
        .map_err(handle_error)?;
    
    let response = serde_json::json!({
        "success": success,
        "asset_id": asset_id.to_string(),
        "amount": amount.to_string()
    });
    
    Ok(warp::reply::json(&response))
}

/// Handler for getting impact metrics for an asset
async fn get_impact_handler(
    asset_id: String,
    service: Arc<AssetManagementService>
) -> Result<impl Reply, Rejection> {
    // Parse the asset ID from hex
    let asset_id = H256::from_str(&asset_id)
        .map_err(|_| handle_error(AssetManagementError::InvalidParameter("Invalid asset ID format".to_string())))?;
    
    let metrics = service
        .get_impact_metrics(asset_id)
        .await
        .map_err(handle_error)?;
    
    Ok(warp::reply::json(&metrics))
}

/// Handler for getting portfolio impact metrics
async fn get_portfolio_impact_handler(
    user_address: String,
    service: Arc<AssetManagementService>
) -> Result<impl Reply, Rejection> {
    // Parse the user address
    let user_address = Address::from_str(&user_address)
        .map_err(|_| handle_error(AssetManagementError::InvalidParameter("Invalid address format".to_string())))?;
    
    let metrics = service
        .get_portfolio_impact(user_address)
        .await
        .map_err(handle_error)?;
    
    Ok(warp::reply::json(&metrics))
}

/// Handler for getting all certification standards
async fn get_certifications_handler(
    service: Arc<AssetManagementService>
) -> Result<impl Reply, Rejection> {
    let standards = service
        .get_certification_standards()
        .await
        .map_err(handle_error)?;
    
    let response = serde_json::json!({
        "standards": standards.iter().map(|s| format!("{:?}", s)).collect::<Vec<String>>(),
        "count": standards.len()
    });
    
    Ok(warp::reply::json(&response))
}

/// Handler for generating impact reports
async fn generate_report_handler(
    timeframe: String,
    _user_id: String,
    service: Arc<AssetManagementService>
) -> Result<impl Reply, Rejection> {
    // Parse time period - simple version for the prototype
    let (start_time, end_time) = match timeframe.as_str() {
        "month" => (
            // 30 days ago
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs() - (30 * 24 * 60 * 60),
            // Now
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs()
        ),
        "quarter" => (
            // 90 days ago
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs() - (90 * 24 * 60 * 60),
            // Now
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs()
        ),
        "year" => (
            // 365 days ago
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs() - (365 * 24 * 60 * 60),
            // Now
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs()
        ),
        _ => return Err(handle_error(AssetManagementError::InvalidParameter(format!("Unknown timeframe: {}", timeframe)))),
    };
    
    // For now, we'll use a placeholder user address
    let user_address = Address::from_slice(&[0u8; 20]);
    
    let report = service
        .generate_impact_report(user_address, start_time, end_time)
        .await
        .map_err(handle_error)?;
    
    let response = serde_json::json!({
        "report": report,
        "timeframe": timeframe,
        "start_time": start_time,
        "end_time": end_time
    });
    
    Ok(warp::reply::json(&response))
} 