use std::sync::Arc;
use warp::{Filter, Rejection, Reply};
use serde::{Deserialize, Serialize};
use ethers::types::{Address, U256};
use std::collections::HashMap;

use crate::clients::smart_account_client::{
    SmartAccountClient, TemplateType, ExecutionParams, AccountTemplate, 
    SmartAccount, ExecutionResult, SmartAccountOperation, VerificationResult
};
use crate::ethereum_client::EthereumClient;
use crate::api::auth::{with_auth, Role, JwtClaims};
use crate::api::utils::{with_clients, json_response, json_error_response};

// Request types
#[derive(Debug, Deserialize)]
pub struct CreateTemplateRequest {
    pub name: String,
    pub description: String,
    pub template_type: TemplateType,
    pub code: String, // Base64 encoded code
    pub is_public: bool,
    pub parameters_schema: String,
    pub version: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTemplateRequest {
    pub name: String,
    pub description: String,
    pub code: String, // Base64 encoded code
    pub is_public: bool,
    pub parameters_schema: String,
    pub version: String,
}

#[derive(Debug, Deserialize)]
pub struct VerifyTemplateRequest {
    pub vulnerability_risk: u8,
    pub security_notes: Vec<String>,
    pub performance_risk: u8,
}

#[derive(Debug, Deserialize)]
pub struct DeployAccountRequest {
    pub template_id: String, // bytes32 as hex string
    pub parameters: HashMap<String, String>,
}

#[derive(Debug, Deserialize)]
pub struct DeployCustomAccountRequest {
    pub code: String, // Base64 encoded code
    pub parameters: HashMap<String, String>,
}

#[derive(Debug, Deserialize)]
pub struct ExecuteAccountRequest {
    pub data: String, // Base64 encoded data
    pub execution_params: ExecutionParamsRequest,
}

#[derive(Debug, Deserialize)]
pub struct ExecutionParamsRequest {
    pub gas_limit: String, // U256 as string
    pub gas_price: Option<String>, // U256 as string
    pub value: String, // U256 as string
    pub delegated: bool,
    pub delegate: Option<String>, // Address as hex string
    pub valid_until: u64,
    pub nonce: String, // U256 as string
}

// Response types
#[derive(Debug, Serialize)]
pub struct TemplateResponse {
    pub template_id: String,
    pub name: String,
    pub description: String,
    pub template_type: TemplateType,
    pub creator: String,
    pub is_public: bool,
    pub is_verified: bool,
    pub creation_date: u64,
    pub verification_date: Option<u64>,
    pub parameters_schema: String,
    pub version: String,
    pub usage_count: String,
}

#[derive(Debug, Serialize)]
pub struct AccountResponse {
    pub account_id: String,
    pub owner: String,
    pub template_id: String,
    pub creation_date: u64,
    pub last_execution: u64,
    pub execution_count: String,
    pub parameters: HashMap<String, String>,
    pub is_active: bool,
    pub delegates: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct ExecutionResultResponse {
    pub success: bool,
    pub result_data: String, // Base64 encoded result
    pub logs: Vec<String>,
    pub gas_used: String,
    pub error_message: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct OperationResponse {
    pub operation_id: String,
    pub account_id: String,
    pub operation_type: String,
    pub timestamp: u64,
    pub data: String, // Base64 encoded data
    pub result: Option<ExecutionResultResponse>,
    pub executed_by: String,
}

/**
 * Create all API routes for Smart Account endpoints
 */
pub fn routes(
    ethereum_client: Arc<EthereumClient>,
    smart_account_address: Address,
) -> impl Filter<Extract = impl Reply, Error = Rejection> + Clone {
    // GET /api/smart-accounts/templates - Get all templates
    let get_templates = warp::path!("api" / "smart-accounts" / "templates")
        .and(warp::get())
        .and(with_clients(ethereum_client.clone(), smart_account_address))
        .and(with_auth(vec![Role::User, Role::Admin]))
        .and_then(handle_get_templates);

    // GET /api/smart-accounts/templates/:templateId - Get template
    let get_template = warp::path!("api" / "smart-accounts" / "templates" / String)
        .and(warp::get())
        .and(with_clients(ethereum_client.clone(), smart_account_address))
        .and(with_auth(vec![Role::User, Role::Admin]))
        .and_then(handle_get_template);

    // POST /api/smart-accounts/templates - Create template
    let create_template = warp::path!("api" / "smart-accounts" / "templates")
        .and(warp::post())
        .and(warp::body::json())
        .and(with_clients(ethereum_client.clone(), smart_account_address))
        .and(with_auth(vec![Role::User, Role::Admin]))
        .and_then(handle_create_template);

    // PUT /api/smart-accounts/templates/:templateId - Update template
    let update_template = warp::path!("api" / "smart-accounts" / "templates" / String)
        .and(warp::put())
        .and(warp::body::json())
        .and(with_clients(ethereum_client.clone(), smart_account_address))
        .and(with_auth(vec![Role::User, Role::Admin]))
        .and_then(handle_update_template);

    // POST /api/smart-accounts/templates/:templateId/verify - Verify template
    let verify_template = warp::path!("api" / "smart-accounts" / "templates" / String / "verify")
        .and(warp::post())
        .and(warp::body::json())
        .and(with_clients(ethereum_client.clone(), smart_account_address))
        .and(with_auth(vec![Role::Admin]))
        .and_then(handle_verify_template);

    // GET /api/smart-accounts/accounts - Get user accounts
    let get_user_accounts = warp::path!("api" / "smart-accounts" / "accounts")
        .and(warp::get())
        .and(with_clients(ethereum_client.clone(), smart_account_address))
        .and(with_auth(vec![Role::User, Role::Admin]))
        .and_then(handle_get_user_accounts);

    // GET /api/smart-accounts/accounts/:accountId - Get account
    let get_account = warp::path!("api" / "smart-accounts" / "accounts" / String)
        .and(warp::get())
        .and(with_clients(ethereum_client.clone(), smart_account_address))
        .and(with_auth(vec![Role::User, Role::Admin]))
        .and_then(handle_get_account);

    // POST /api/smart-accounts/accounts - Deploy account
    let deploy_account = warp::path!("api" / "smart-accounts" / "accounts")
        .and(warp::post())
        .and(warp::body::json())
        .and(with_clients(ethereum_client.clone(), smart_account_address))
        .and(with_auth(vec![Role::User, Role::Admin]))
        .and_then(handle_deploy_account);

    // POST /api/smart-accounts/accounts/custom - Deploy custom account
    let deploy_custom_account = warp::path!("api" / "smart-accounts" / "accounts" / "custom")
        .and(warp::post())
        .and(warp::body::json())
        .and(with_clients(ethereum_client.clone(), smart_account_address))
        .and(with_auth(vec![Role::User, Role::Admin]))
        .and_then(handle_deploy_custom_account);

    // POST /api/smart-accounts/accounts/:accountId/execute - Execute account
    let execute_account = warp::path!("api" / "smart-accounts" / "accounts" / String / "execute")
        .and(warp::post())
        .and(warp::body::json())
        .and(with_clients(ethereum_client.clone(), smart_account_address))
        .and(with_auth(vec![Role::User, Role::Admin]))
        .and_then(handle_execute_account);

    // POST /api/smart-accounts/accounts/:accountId/simulate - Simulate execution
    let simulate_execution = warp::path!("api" / "smart-accounts" / "accounts" / String / "simulate")
        .and(warp::post())
        .and(warp::body::json())
        .and(with_clients(ethereum_client.clone(), smart_account_address))
        .and(with_auth(vec![Role::User, Role::Admin]))
        .and_then(handle_simulate_execution);

    // Combine all routes
    get_templates
        .or(get_template)
        .or(create_template)
        .or(update_template)
        .or(verify_template)
        .or(get_user_accounts)
        .or(get_account)
        .or(deploy_account)
        .or(deploy_custom_account)
        .or(execute_account)
        .or(simulate_execution)
}

// Helper functions for conversion between API and client types

fn template_to_response(template: AccountTemplate) -> TemplateResponse {
    TemplateResponse {
        template_id: format!("0x{}", hex::encode(template.template_id)),
        name: template.name,
        description: template.description,
        template_type: template.template_type,
        creator: format!("{:?}", template.creator),
        is_public: template.is_public,
        is_verified: template.is_verified,
        creation_date: template.creation_date,
        verification_date: template.verification_date,
        parameters_schema: template.parameters_schema,
        version: template.version,
        usage_count: template.usage_count.to_string(),
    }
}

fn account_to_response(account: SmartAccount) -> AccountResponse {
    AccountResponse {
        account_id: format!("0x{}", hex::encode(account.account_id)),
        owner: format!("{:?}", account.owner),
        template_id: format!("0x{}", hex::encode(account.template_id)),
        creation_date: account.creation_date,
        last_execution: account.last_execution,
        execution_count: account.execution_count.to_string(),
        parameters: account.parameters,
        is_active: account.is_active,
        delegates: account.delegates.iter().map(|d| format!("{:?}", d)).collect(),
    }
}

fn execution_result_to_response(result: ExecutionResult) -> ExecutionResultResponse {
    ExecutionResultResponse {
        success: result.success,
        result_data: base64::encode(&result.result_data),
        logs: result.logs,
        gas_used: result.gas_used.to_string(),
        error_message: result.error_message,
    }
}

fn operation_to_response(operation: SmartAccountOperation) -> OperationResponse {
    OperationResponse {
        operation_id: format!("0x{}", hex::encode(operation.operation_id)),
        account_id: format!("0x{}", hex::encode(operation.account_id)),
        operation_type: operation.operation_type,
        timestamp: operation.timestamp,
        data: base64::encode(&operation.data),
        result: operation.result.map(execution_result_to_response),
        executed_by: format!("{:?}", operation.executed_by),
    }
}

fn hex_to_bytes32(hex_str: &str) -> Result<[u8; 32], String> {
    let hex_str = hex_str.trim_start_matches("0x");
    let bytes = hex::decode(hex_str).map_err(|e| format!("Invalid hex string: {}", e))?;
    
    if bytes.len() > 32 {
        return Err("Hex string too long for bytes32".to_string());
    }
    
    let mut result = [0u8; 32];
    let len = bytes.len().min(32);
    result[32 - len..].copy_from_slice(&bytes[0..len]);
    
    Ok(result)
}

fn parse_execution_params(params: ExecutionParamsRequest) -> Result<ExecutionParams, String> {
    let gas_limit = params.gas_limit.parse::<U256>()
        .map_err(|_| "Invalid gas limit".to_string())?;
    
    let gas_price = if let Some(price) = params.gas_price {
        Some(price.parse::<U256>().map_err(|_| "Invalid gas price".to_string())?)
    } else {
        None
    };
    
    let value = params.value.parse::<U256>()
        .map_err(|_| "Invalid value".to_string())?;
    
    let delegate = if let Some(addr) = params.delegate {
        Some(addr.parse::<Address>().map_err(|_| "Invalid delegate address".to_string())?)
    } else {
        None
    };
    
    let nonce = params.nonce.parse::<U256>()
        .map_err(|_| "Invalid nonce".to_string())?;
    
    Ok(ExecutionParams {
        gas_limit,
        gas_price,
        value,
        delegated: params.delegated,
        delegate,
        valid_until: params.valid_until,
        nonce,
    })
}

// Route handlers

/// Handle GET /api/smart-accounts/templates
async fn handle_get_templates(
    client: SmartAccountClient<EthereumClient>,
    _claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    match client.get_all_templates_with_details().await {
        Ok(templates) => {
            let response_templates: Vec<TemplateResponse> = templates
                .values()
                .map(|template| template_to_response(template.clone()))
                .collect();
            json_response(&response_templates)
        }
        Err(err) => json_error_response(&format!("Failed to get templates: {}", err), 500),
    }
}

/// Handle GET /api/smart-accounts/templates/:templateId
async fn handle_get_template(
    template_id: String,
    client: SmartAccountClient<EthereumClient>,
    _claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    let template_id_bytes = match hex_to_bytes32(&template_id) {
        Ok(id) => id,
        Err(e) => return json_error_response(&format!("Invalid template ID: {}", e), 400),
    };
    
    match client.get_template(template_id_bytes).await {
        Ok(template) => json_response(&template_to_response(template)),
        Err(err) => json_error_response(&format!("Failed to get template: {}", err), 404),
    }
}

/// Handle POST /api/smart-accounts/templates
async fn handle_create_template(
    request: CreateTemplateRequest,
    client: SmartAccountClient<EthereumClient>,
    _claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    let code = match base64::decode(&request.code) {
        Ok(code) => code,
        Err(_) => return json_error_response("Invalid code format (must be base64 encoded)", 400),
    };
    
    match client.create_template(
        request.name,
        request.description,
        request.template_type,
        code,
        request.is_public,
        request.parameters_schema,
        request.version,
    ).await {
        Ok(template_id) => json_response(&serde_json::json!({
            "template_id": format!("0x{}", hex::encode(template_id)),
            "success": true
        })),
        Err(err) => json_error_response(&format!("Failed to create template: {}", err), 500),
    }
}

/// Handle PUT /api/smart-accounts/templates/:templateId
async fn handle_update_template(
    template_id: String,
    request: UpdateTemplateRequest,
    client: SmartAccountClient<EthereumClient>,
    _claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    let template_id_bytes = match hex_to_bytes32(&template_id) {
        Ok(id) => id,
        Err(e) => return json_error_response(&format!("Invalid template ID: {}", e), 400),
    };
    
    let code = match base64::decode(&request.code) {
        Ok(code) => code,
        Err(_) => return json_error_response("Invalid code format (must be base64 encoded)", 400),
    };
    
    match client.update_template(
        template_id_bytes,
        request.name,
        request.description,
        code,
        request.is_public,
        request.parameters_schema,
        request.version,
    ).await {
        Ok(success) => {
            if success {
                json_response(&serde_json::json!({ "success": true }))
            } else {
                json_error_response("Failed to update template", 500)
            }
        },
        Err(err) => json_error_response(&format!("Failed to update template: {}", err), 500),
    }
}

/// Handle POST /api/smart-accounts/templates/:templateId/verify
async fn handle_verify_template(
    template_id: String,
    request: VerifyTemplateRequest,
    client: SmartAccountClient<EthereumClient>,
    _claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    let template_id_bytes = match hex_to_bytes32(&template_id) {
        Ok(id) => id,
        Err(e) => return json_error_response(&format!("Invalid template ID: {}", e), 400),
    };
    
    match client.verify_template(
        template_id_bytes,
        request.vulnerability_risk,
        request.security_notes,
        request.performance_risk,
    ).await {
        Ok(success) => {
            if success {
                json_response(&serde_json::json!({ "success": true }))
            } else {
                json_error_response("Failed to verify template", 500)
            }
        },
        Err(err) => json_error_response(&format!("Failed to verify template: {}", err), 500),
    }
}

/// Handle GET /api/smart-accounts/accounts
async fn handle_get_user_accounts(
    client: SmartAccountClient<EthereumClient>,
    claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    let owner = claims.address.parse::<Address>()
        .map_err(|_| warp::reject::custom(crate::Error::InvalidAddress))?;
    
    match client.get_all_accounts_with_details(owner).await {
        Ok(accounts) => {
            let response_accounts: Vec<AccountResponse> = accounts
                .values()
                .map(|account| account_to_response(account.clone()))
                .collect();
            json_response(&response_accounts)
        }
        Err(err) => json_error_response(&format!("Failed to get accounts: {}", err), 500),
    }
}

/// Handle GET /api/smart-accounts/accounts/:accountId
async fn handle_get_account(
    account_id: String,
    client: SmartAccountClient<EthereumClient>,
    _claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    let account_id_bytes = match hex_to_bytes32(&account_id) {
        Ok(id) => id,
        Err(e) => return json_error_response(&format!("Invalid account ID: {}", e), 400),
    };
    
    match client.get_account(account_id_bytes).await {
        Ok(account) => json_response(&account_to_response(account)),
        Err(err) => json_error_response(&format!("Failed to get account: {}", err), 404),
    }
}

/// Handle POST /api/smart-accounts/accounts
async fn handle_deploy_account(
    request: DeployAccountRequest,
    client: SmartAccountClient<EthereumClient>,
    _claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    let template_id_bytes = match hex_to_bytes32(&request.template_id) {
        Ok(id) => id,
        Err(e) => return json_error_response(&format!("Invalid template ID: {}", e), 400),
    };
    
    match client.deploy_account(template_id_bytes, request.parameters).await {
        Ok(account_id) => json_response(&serde_json::json!({
            "account_id": format!("0x{}", hex::encode(account_id)),
            "success": true
        })),
        Err(err) => json_error_response(&format!("Failed to deploy account: {}", err), 500),
    }
}

/// Handle POST /api/smart-accounts/accounts/custom
async fn handle_deploy_custom_account(
    request: DeployCustomAccountRequest,
    client: SmartAccountClient<EthereumClient>,
    _claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    let code = match base64::decode(&request.code) {
        Ok(code) => code,
        Err(_) => return json_error_response("Invalid code format (must be base64 encoded)", 400),
    };
    
    match client.deploy_custom_account(code, request.parameters).await {
        Ok(account_id) => json_response(&serde_json::json!({
            "account_id": format!("0x{}", hex::encode(account_id)),
            "success": true
        })),
        Err(err) => json_error_response(&format!("Failed to deploy custom account: {}", err), 500),
    }
}

/// Handle POST /api/smart-accounts/accounts/:accountId/execute
async fn handle_execute_account(
    account_id: String,
    request: ExecuteAccountRequest,
    client: SmartAccountClient<EthereumClient>,
    _claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    let account_id_bytes = match hex_to_bytes32(&account_id) {
        Ok(id) => id,
        Err(e) => return json_error_response(&format!("Invalid account ID: {}", e), 400),
    };
    
    let data = match base64::decode(&request.data) {
        Ok(data) => data,
        Err(_) => return json_error_response("Invalid data format (must be base64 encoded)", 400),
    };
    
    let execution_params = match parse_execution_params(request.execution_params) {
        Ok(params) => params,
        Err(e) => return json_error_response(&e, 400),
    };
    
    match client.execute_account(account_id_bytes, data, execution_params).await {
        Ok(result) => json_response(&execution_result_to_response(result)),
        Err(err) => json_error_response(&format!("Failed to execute account: {}", err), 500),
    }
}

/// Handle POST /api/smart-accounts/accounts/:accountId/simulate
async fn handle_simulate_execution(
    account_id: String,
    request: ExecuteAccountRequest,
    client: SmartAccountClient<EthereumClient>,
    _claims: JwtClaims,
) -> Result<impl Reply, Rejection> {
    let account_id_bytes = match hex_to_bytes32(&account_id) {
        Ok(id) => id,
        Err(e) => return json_error_response(&format!("Invalid account ID: {}", e), 400),
    };
    
    let data = match base64::decode(&request.data) {
        Ok(data) => data,
        Err(_) => return json_error_response("Invalid data format (must be base64 encoded)", 400),
    };
    
    match client.simulate_execution(account_id_bytes, data).await {
        Ok(result) => json_response(&execution_result_to_response(result)),
        Err(err) => json_error_response(&format!("Failed to simulate execution: {}", err), 500),
    }
} 