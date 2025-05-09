use std::sync::Arc;
use warp::{Filter, Rejection, Reply};
use serde::{Deserialize, Serialize};
use ethers::types::{Address, U256, H256};
use std::collections::HashMap;

use crate::clients::asset_factory_client::{AssetFactoryClient, AssetClass, AssetStatus, AssetTemplate, AssetMetadata, EnvironmentalAssetMetadata};
use crate::ethereum_client::EthereumClient;
use crate::Error;
use crate::api::auth::{with_auth, Role, JwtClaims};
use crate::api::utils::{with_clients, json_response, json_error_response};

// Request types
#[derive(Debug, Deserialize)]
pub struct CreateTemplateRequest {
    pub name: String,
    pub description: String,
    pub asset_class: AssetClass,
    pub is_public: bool,
    pub contract_uri: String,
    pub metadata_schema: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateAssetRequest {
    pub name: String,
    pub symbol: String,
    pub description: String,
    pub asset_class: AssetClass,
    pub total_supply: String, // U256 as string
    pub decimals: u8,
    pub metadata_uri: String,
    pub custom_fields: HashMap<String, String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateAssetFromTemplateRequest {
    pub template_id: String, // bytes32 as hex string
    pub name: String,
    pub symbol: String,
    pub description: String,
    pub total_supply: String, // U256 as string
    pub decimals: u8,
    pub metadata_uri: String,
    pub custom_fields: HashMap<String, String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateEnvironmentalAssetRequest {
    pub name: String,
    pub symbol: String,
    pub description: String,
    pub total_supply: String, // U256 as string
    pub decimals: u8,
    pub metadata_uri: String,
    pub asset_type: String,
    pub certification_standard: String,
    pub vintage_year: u16,
    pub project_id: String,
    pub project_location: String,
    pub verification_date: u64,
    pub registry_link: String,
    pub impact_metrics: HashMap<String, String>,
    pub expiration_date: Option<u64>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAssetStatusRequest {
    pub asset_id: String, // bytes32 as hex string
    pub status: AssetStatus,
}

// Response types
#[derive(Debug, Serialize)]
pub struct TemplateResponse {
    pub template_id: String,
    pub name: String,
    pub description: String,
    pub asset_class: AssetClass,
    pub creator: String,
    pub is_approved: bool,
    pub is_public: bool,
    pub creation_date: u64,
    pub contract_uri: String,
    pub metadata_schema: String,
}

#[derive(Debug, Serialize)]
pub struct AssetResponse {
    pub asset_id: String,
    pub name: String,
    pub symbol: String,
    pub description: String,
    pub asset_class: AssetClass,
    pub issuer: String,
    pub status: AssetStatus,
    pub creation_date: u64,
    pub last_updated: u64,
    pub contract_address: String,
    pub total_supply: String,
    pub decimals: u8,
    pub metadata_uri: String,
    pub template_id: Option<String>,
    pub custom_fields: HashMap<String, String>,
}

#[derive(Debug, Serialize)]
pub struct EnvironmentalAssetResponse {
    pub asset: AssetResponse,
    pub env_metadata: EnvironmentalAssetMetadata,
}

#[derive(Debug, Serialize)]
pub struct CreateAssetResponse {
    pub asset_id: String,
    pub contract_address: String,
}

/**
 * Converts a template from the client format to the API response format
 */
fn template_to_response(template: AssetTemplate) -> TemplateResponse {
    TemplateResponse {
        template_id: format!("0x{}", hex::encode(template.template_id)),
        name: template.name,
        description: template.description,
        asset_class: template.asset_class,
        creator: format!("{:?}", template.creator),
        is_approved: template.is_approved,
        is_public: template.is_public,
        creation_date: template.creation_date,
        contract_uri: template.contract_uri,
        metadata_schema: template.metadata_schema,
    }
}

/**
 * Converts an asset from the client format to the API response format
 */
fn asset_to_response(asset: AssetMetadata) -> AssetResponse {
    AssetResponse {
        asset_id: format!("0x{}", hex::encode(asset.asset_id)),
        name: asset.name,
        symbol: asset.symbol,
        description: asset.description,
        asset_class: asset.asset_class,
        issuer: format!("{:?}", asset.issuer),
        status: asset.status,
        creation_date: asset.creation_date,
        last_updated: asset.last_updated,
        contract_address: format!("{:?}", asset.contract_address),
        total_supply: asset.total_supply.to_string(),
        decimals: asset.decimals,
        metadata_uri: asset.metadata_uri,
        template_id: asset.template_id.map(|id| format!("0x{}", hex::encode(id))),
        custom_fields: asset.custom_fields,
    }
}

/**
 * Create all API routes for Asset Factory endpoints
 */
pub fn routes(
    ethereum_client: Arc<EthereumClient>,
    asset_factory_address: Address,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    // GET /api/templates - Get all templates
    let get_all_templates = warp::path!("api" / "templates")
        .and(warp::get())
        .and(with_clients(ethereum_client.clone(), asset_factory_address))
        .and(with_auth(vec![Role::User, Role::Admin]))
        .and_then(handle_get_all_templates);

    // GET /api/templates/:templateId - Get a template by ID
    let get_template = warp::path!("api" / "templates" / String)
        .and(warp::get())
        .and(with_clients(ethereum_client.clone(), asset_factory_address))
        .and(with_auth(vec![Role::User, Role::Admin]))
        .and_then(handle_get_template);

    // POST /api/templates - Create a new template
    let create_template = warp::path!("api" / "templates")
        .and(warp::post())
        .and(warp::body::json())
        .and(with_clients(ethereum_client.clone(), asset_factory_address))
        .and(with_auth(vec![Role::Issuer, Role::Admin]))
        .and_then(handle_create_template);

    // GET /api/assets - Get all assets
    let get_all_assets = warp::path!("api" / "assets")
        .and(warp::get())
        .and(with_clients(ethereum_client.clone(), asset_factory_address))
        .and(with_auth(vec![Role::User, Role::Admin]))
        .and_then(handle_get_all_assets);

    // GET /api/assets/:assetId - Get an asset by ID
    let get_asset = warp::path!("api" / "assets" / String)
        .and(warp::get())
        .and(with_clients(ethereum_client.clone(), asset_factory_address))
        .and(with_auth(vec![Role::User, Role::Admin]))
        .and_then(handle_get_asset);

    // POST /api/assets - Create a new custom asset
    let create_asset = warp::path!("api" / "assets")
        .and(warp::post())
        .and(warp::body::json())
        .and(with_clients(ethereum_client.clone(), asset_factory_address))
        .and(with_auth(vec![Role::Issuer, Role::Admin]))
        .and_then(handle_create_asset);

    // POST /api/assets/from-template - Create a new asset from template
    let create_asset_from_template = warp::path!("api" / "assets" / "from-template")
        .and(warp::post())
        .and(warp::body::json())
        .and(with_clients(ethereum_client.clone(), asset_factory_address))
        .and(with_auth(vec![Role::Issuer, Role::Admin]))
        .and_then(handle_create_asset_from_template);

    // POST /api/assets/environmental - Create a new environmental asset
    let create_environmental_asset = warp::path!("api" / "assets" / "environmental")
        .and(warp::post())
        .and(warp::body::json())
        .and(with_clients(ethereum_client.clone(), asset_factory_address))
        .and(with_auth(vec![Role::Issuer, Role::Admin]))
        .and_then(handle_create_environmental_asset);

    // PUT /api/assets/:assetId/status - Update asset status
    let update_asset_status = warp::path!("api" / "assets" / String / "status")
        .and(warp::put())
        .and(warp::body::json())
        .and(with_clients(ethereum_client.clone(), asset_factory_address))
        .and(with_auth(vec![Role::Admin]))
        .and_then(handle_update_asset_status);

    // GET /api/assets/class/:assetClass - Get assets by asset class
    let get_assets_by_class = warp::path!("api" / "assets" / "class" / String)
        .and(warp::get())
        .and(with_clients(ethereum_client.clone(), asset_factory_address))
        .and(with_auth(vec![Role::User, Role::Admin]))
        .and_then(handle_get_assets_by_class);

    // GET /api/assets/issuer/:issuerAddress - Get assets by issuer
    let get_assets_by_issuer = warp::path!("api" / "assets" / "issuer" / String)
        .and(warp::get())
        .and(with_clients(ethereum_client.clone(), asset_factory_address))
        .and(with_auth(vec![Role::User, Role::Admin]))
        .and_then(handle_get_assets_by_issuer);

    // GET /api/assets/environmental - Get all environmental assets
    let get_environmental_assets = warp::path!("api" / "assets" / "environmental")
        .and(warp::get())
        .and(with_clients(ethereum_client.clone(), asset_factory_address))
        .and(with_auth(vec![Role::User, Role::Admin]))
        .and_then(handle_get_environmental_assets);

    // Combine all routes
    get_all_templates
        .or(get_template)
        .or(create_template)
        .or(get_all_assets)
        .or(get_asset)
        .or(create_asset)
        .or(create_asset_from_template)
        .or(create_environmental_asset)
        .or(update_asset_status)
        .or(get_assets_by_class)
        .or(get_assets_by_issuer)
        .or(get_environmental_assets)
}

// Route handlers

/// Handle GET /api/templates
async fn handle_get_all_templates(
    client: AssetFactoryClient<EthereumClient>,
    _claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    match client.get_all_templates_with_details().await {
        Ok(templates) => {
            let response_templates: Vec<TemplateResponse> = templates
                .iter()
                .map(|(_, template)| template_to_response(template.clone()))
                .collect();
            json_response(&response_templates)
        }
        Err(err) => json_error_response(&format!("Failed to get templates: {}", err), 500),
    }
}

/// Handle GET /api/templates/:templateId
async fn handle_get_template(
    template_id: String,
    client: AssetFactoryClient<EthereumClient>,
    _claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    // Convert the template ID from hex to bytes32
    let template_id_bytes = match hex::decode(&template_id.trim_start_matches("0x")) {
        Ok(bytes) => {
            let mut result = [0u8; 32];
            let len = bytes.len().min(32);
            result[..len].copy_from_slice(&bytes[..len]);
            result
        },
        Err(_) => return json_error_response("Invalid template ID format", 400),
    };

    match client.get_template(template_id_bytes).await {
        Ok(template) => json_response(&template_to_response(template)),
        Err(err) => json_error_response(&format!("Failed to get template: {}", err), 404),
    }
}

/// Handle POST /api/templates
async fn handle_create_template(
    request: CreateTemplateRequest,
    client: AssetFactoryClient<EthereumClient>,
    claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    // Create the template
    match client.create_template(
        request.name,
        request.description,
        request.asset_class,
        request.is_public,
        request.contract_uri,
        request.metadata_schema,
    ).await {
        Ok(template_id) => json_response(&CreateAssetResponse {
            asset_id: format!("0x{}", hex::encode(template_id)),
            contract_address: "0x0000000000000000000000000000000000000000".to_string(),
        }),
        Err(err) => json_error_response(&format!("Failed to create template: {}", err), 500),
    }
}

/// Handle GET /api/assets
async fn handle_get_all_assets(
    client: AssetFactoryClient<EthereumClient>,
    _claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    // For now, we'll return a limited set of assets to avoid overloading
    // In a real implementation, you would use pagination
    let asset_count = match client.get_asset_count().await {
        Ok(count) => count.as_u64().min(50), // Limit to 50 assets
        Err(err) => return json_error_response(&format!("Failed to get asset count: {}", err), 500),
    };

    let mut assets = Vec::new();
    for i in 0..asset_count {
        // This is a simplified approach, in reality you would use more efficient methods
        // to fetch assets in batch
        let asset_id = [i as u8; 32]; // Dummy ID for example
        if let Ok(metadata) = client.get_asset_metadata(asset_id).await {
            assets.push(asset_to_response(metadata));
        }
    }

    json_response(&assets)
}

/// Handle GET /api/assets/:assetId
async fn handle_get_asset(
    asset_id: String,
    client: AssetFactoryClient<EthereumClient>,
    _claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    // Convert the asset ID from hex to bytes32
    let asset_id_bytes = match hex::decode(&asset_id.trim_start_matches("0x")) {
        Ok(bytes) => {
            let mut result = [0u8; 32];
            let len = bytes.len().min(32);
            result[..len].copy_from_slice(&bytes[..len]);
            result
        },
        Err(_) => return json_error_response("Invalid asset ID format", 400),
    };

    match client.get_asset_metadata(asset_id_bytes).await {
        Ok(asset) => json_response(&asset_to_response(asset)),
        Err(err) => json_error_response(&format!("Failed to get asset: {}", err), 404),
    }
}

/// Handle POST /api/assets
async fn handle_create_asset(
    request: CreateAssetRequest,
    client: AssetFactoryClient<EthereumClient>,
    claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    // Parse the total supply
    let total_supply = match request.total_supply.parse::<U256>() {
        Ok(supply) => supply,
        Err(_) => return json_error_response("Invalid total supply format", 400),
    };

    // Create the asset
    match client.create_custom_asset(
        request.name,
        request.symbol,
        request.description,
        request.asset_class,
        total_supply,
        request.decimals,
        request.metadata_uri,
        request.custom_fields,
    ).await {
        Ok((asset_id, contract_address)) => json_response(&CreateAssetResponse {
            asset_id: format!("0x{}", hex::encode(asset_id)),
            contract_address: format!("{:?}", contract_address),
        }),
        Err(err) => json_error_response(&format!("Failed to create asset: {}", err), 500),
    }
}

/// Handle POST /api/assets/from-template
async fn handle_create_asset_from_template(
    request: CreateAssetFromTemplateRequest,
    client: AssetFactoryClient<EthereumClient>,
    claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    // Convert the template ID from hex to bytes32
    let template_id_bytes = match hex::decode(&request.template_id.trim_start_matches("0x")) {
        Ok(bytes) => {
            let mut result = [0u8; 32];
            let len = bytes.len().min(32);
            result[..len].copy_from_slice(&bytes[..len]);
            result
        },
        Err(_) => return json_error_response("Invalid template ID format", 400),
    };

    // Parse the total supply
    let total_supply = match request.total_supply.parse::<U256>() {
        Ok(supply) => supply,
        Err(_) => return json_error_response("Invalid total supply format", 400),
    };

    // Create the asset from template
    match client.create_asset_from_template(
        template_id_bytes,
        request.name,
        request.symbol,
        request.description,
        total_supply,
        request.decimals,
        request.metadata_uri,
        request.custom_fields,
    ).await {
        Ok((asset_id, contract_address)) => json_response(&CreateAssetResponse {
            asset_id: format!("0x{}", hex::encode(asset_id)),
            contract_address: format!("{:?}", contract_address),
        }),
        Err(err) => json_error_response(&format!("Failed to create asset from template: {}", err), 500),
    }
}

/// Handle POST /api/assets/environmental
async fn handle_create_environmental_asset(
    request: CreateEnvironmentalAssetRequest,
    client: AssetFactoryClient<EthereumClient>,
    claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    // Parse the total supply
    let total_supply = match request.total_supply.parse::<U256>() {
        Ok(supply) => supply,
        Err(_) => return json_error_response("Invalid total supply format", 400),
    };

    // Create the environmental asset metadata
    let env_metadata = EnvironmentalAssetMetadata {
        asset_type: request.asset_type,
        certification_standard: request.certification_standard,
        vintage_year: request.vintage_year,
        project_id: request.project_id,
        project_location: request.project_location,
        verification_date: request.verification_date,
        registry_link: request.registry_link,
        impact_metrics: request.impact_metrics,
        expiration_date: request.expiration_date,
    };

    // Create the environmental asset
    match client.create_environmental_asset(
        request.name,
        request.symbol,
        request.description,
        total_supply,
        request.decimals,
        request.metadata_uri,
        env_metadata,
    ).await {
        Ok((asset_id, contract_address)) => json_response(&CreateAssetResponse {
            asset_id: format!("0x{}", hex::encode(asset_id)),
            contract_address: format!("{:?}", contract_address),
        }),
        Err(err) => json_error_response(&format!("Failed to create environmental asset: {}", err), 500),
    }
}

/// Handle PUT /api/assets/:assetId/status
async fn handle_update_asset_status(
    asset_id: String,
    request: UpdateAssetStatusRequest,
    client: AssetFactoryClient<EthereumClient>,
    claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    // Convert the asset ID from hex to bytes32
    let asset_id_bytes = match hex::decode(&asset_id.trim_start_matches("0x")) {
        Ok(bytes) => {
            let mut result = [0u8; 32];
            let len = bytes.len().min(32);
            result[..len].copy_from_slice(&bytes[..len]);
            result
        },
        Err(_) => return json_error_response("Invalid asset ID format", 400),
    };

    // Update the asset status
    match client.update_asset_status(asset_id_bytes, request.status).await {
        Ok(success) => {
            if success {
                json_response(&serde_json::json!({ "success": true }))
            } else {
                json_error_response("Failed to update asset status", 500)
            }
        },
        Err(err) => json_error_response(&format!("Failed to update asset status: {}", err), 500),
    }
}

/// Handle GET /api/assets/class/:assetClass
async fn handle_get_assets_by_class(
    asset_class: String,
    client: AssetFactoryClient<EthereumClient>,
    _claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    // Parse the asset class
    let asset_class_enum = match asset_class.to_uppercase().as_str() {
        "TREASURY" => AssetClass::TREASURY,
        "REAL_ESTATE" => AssetClass::REAL_ESTATE,
        "CORPORATE_BOND" => AssetClass::CORPORATE_BOND,
        "ENVIRONMENTAL_ASSET" => AssetClass::ENVIRONMENTAL_ASSET,
        "IP_RIGHT" => AssetClass::IP_RIGHT,
        "INVOICE" => AssetClass::INVOICE,
        "COMMODITY" => AssetClass::COMMODITY,
        "INFRASTRUCTURE" => AssetClass::INFRASTRUCTURE,
        "CUSTOM" => AssetClass::CUSTOM,
        _ => return json_error_response("Invalid asset class", 400),
    };

    // Get assets by class
    match client.get_assets_by_asset_class(asset_class_enum).await {
        Ok(asset_ids) => {
            let mut assets = Vec::new();
            for asset_id in asset_ids {
                if let Ok(metadata) = client.get_asset_metadata(asset_id).await {
                    assets.push(asset_to_response(metadata));
                }
            }
            json_response(&assets)
        },
        Err(err) => json_error_response(&format!("Failed to get assets by class: {}", err), 500),
    }
}

/// Handle GET /api/assets/issuer/:issuerAddress
async fn handle_get_assets_by_issuer(
    issuer_address: String,
    client: AssetFactoryClient<EthereumClient>,
    _claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    // Parse the issuer address
    let issuer = match issuer_address.parse::<Address>() {
        Ok(addr) => addr,
        Err(_) => return json_error_response("Invalid issuer address format", 400),
    };

    // Get assets by issuer
    match client.get_assets_by_issuer(issuer).await {
        Ok(asset_ids) => {
            let mut assets = Vec::new();
            for asset_id in asset_ids {
                if let Ok(metadata) = client.get_asset_metadata(asset_id).await {
                    assets.push(asset_to_response(metadata));
                }
            }
            json_response(&assets)
        },
        Err(err) => json_error_response(&format!("Failed to get assets by issuer: {}", err), 500),
    }
}

/// Handle GET /api/assets/environmental
async fn handle_get_environmental_assets(
    client: AssetFactoryClient<EthereumClient>,
    _claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    // Get all environmental assets
    match client.get_all_environmental_assets_with_metadata().await {
        Ok(assets) => {
            let response_assets: Vec<EnvironmentalAssetResponse> = assets
                .iter()
                .map(|(_, (metadata, env_metadata))| EnvironmentalAssetResponse {
                    asset: asset_to_response(metadata.clone()),
                    env_metadata: env_metadata.clone(),
                })
                .collect();
            json_response(&response_assets)
        },
        Err(err) => json_error_response(&format!("Failed to get environmental assets: {}", err), 500),
    }
} 