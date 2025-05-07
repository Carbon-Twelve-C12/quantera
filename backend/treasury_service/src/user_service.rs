use crate::{
    clients::{ComplianceClient, TreasuryTokenClient, TreasuryRegistryClient},
    TreasuryInfo, 
    TreasuryStatus,
    Error as ServiceError
};
use alloy_primitives::{Address, U256, H256, Bytes};
use ethereum_client::EthereumClient;
use std::sync::Arc;
use std::collections::HashMap;
use serde::{Serialize, Deserialize};
use async_trait::async_trait;
use chrono::{Utc, TimeZone};
use tracing::{info, debug, warn, error};

/// Verification data for user registration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerificationData {
    pub full_name: String,
    pub date_of_birth: String,
    pub email: String,
    pub address: AddressData,
    pub government_id: Option<IdData>,
    pub jurisdiction: String,
}

/// Address data for verification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddressData {
    pub street: String,
    pub city: String,
    pub state: String,
    pub country: String,
    pub postal_code: String,
}

/// Government ID data for verification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IdData {
    pub id_type: String,
    pub id_number: String,
    pub issuing_country: String,
    pub expiration_date: Option<String>,
}

/// Institutional verification data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstitutionalVerificationData {
    pub institution_name: String,
    pub registration_number: String,
    pub jurisdiction: String,
    pub representative: RepresentativeData,
    pub bls_public_key: String,
}

/// Representative data for institutional verification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepresentativeData {
    pub full_name: String,
    pub position: String,
    pub email: String,
    pub phone: String,
}

/// User data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserData {
    pub wallet_address: Address,
    pub email: String,
    pub verification_status: VerificationStatus,
    pub is_institutional: bool,
    pub registration_date: u64,
    pub metadata_uri: Option<String>,
}

/// Verification details
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerificationDetails {
    pub wallet_address: Address,
    pub status: VerificationStatus,
    pub jurisdiction: String,
    pub verification_date: Option<u64>,
    pub expiration_date: Option<u64>,
    pub investment_limit: Option<U256>,
    pub institutional_details: Option<InstitutionalDetails>,
}

/// Institutional user details
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstitutionalDetails {
    pub institution_name: String,
    pub registration_number: String,
    pub stake_amount: U256,
    pub validator_count: u64,
    pub is_active: bool,
    pub representative: RepresentativeData,
    pub bls_public_key: String,
}

/// Institutional registration result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstitutionalRegistrationResult {
    pub wallet_address: Address,
    pub institution_name: String,
    pub status: VerificationStatus,
    pub stake_amount: U256,
    pub validator_count: u64,
    pub is_active: bool,
    pub registration_date: u64,
}

/// User portfolio holding
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortfolioHolding {
    pub treasury_id: [u8; 32],
    pub token_address: Address,
    pub name: String,
    pub symbol: String,
    pub balance: U256,
    pub value: U256,
    pub pending_yield: U256,
    pub yield_rate: u64,
    pub maturity_date: u64,
    pub is_restricted: bool,
}

/// Complete user portfolio
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserPortfolio {
    pub wallet_address: Address,
    pub holdings: Vec<PortfolioHolding>,
    pub total_value: U256,
    pub total_pending_yield: U256,
    pub verification_status: VerificationStatus,
    pub investment_limit: Option<U256>,
    pub smart_account_enabled: bool,
}

/// Verification status
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum VerificationStatus {
    Unverified,
    Pending,
    Verified,
    Rejected,
    Suspended,
}

/// Smart account setup result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartAccountSetupResult {
    pub wallet_address: Address,
    pub code_hash: H256,
    pub setup_time: u64,
    pub success: bool,
    pub error_message: Option<String>,
}

/// Verification provider interface
#[async_trait]
pub trait VerificationProvider: Send + Sync {
    /// Verify user identity
    async fn verify_identity(&self, data: &VerificationData) -> Result<bool, ServiceError>;
    
    /// Verify institutional identity
    async fn verify_institutional(&self, data: &InstitutionalVerificationData) -> Result<bool, ServiceError>;
    
    /// Validate BLS public key for institutional users
    async fn validate_bls_key(&self, public_key: &str) -> Result<bool, ServiceError>;
}

/// Mock verification provider for development
pub struct MockVerificationProvider;

#[async_trait]
impl VerificationProvider for MockVerificationProvider {
    async fn verify_identity(&self, data: &VerificationData) -> Result<bool, ServiceError> {
        // In a real implementation, this would call an external KYC service
        // For now, just do basic validation
        if data.full_name.is_empty() || data.email.is_empty() || data.jurisdiction.is_empty() {
            return Ok(false);
        }
        
        // Mock successful verification
        Ok(true)
    }
    
    async fn verify_institutional(&self, data: &InstitutionalVerificationData) -> Result<bool, ServiceError> {
        // In a real implementation, this would call an external verification service
        // For now, just do basic validation
        if data.institution_name.is_empty() || data.registration_number.is_empty() {
            return Ok(false);
        }
        
        // Mock successful verification
        Ok(true)
    }
    
    async fn validate_bls_key(&self, public_key: &str) -> Result<bool, ServiceError> {
        // In a real implementation, this would validate the BLS key format and other properties
        // For now, just check if it's non-empty and has a reasonable length
        if public_key.is_empty() || public_key.len() < 32 {
            return Ok(false);
        }
        
        // Mock successful validation
        Ok(true)
    }
}

/// User service for managing users and verification
pub struct UserService {
    compliance_client: Arc<ComplianceClient>,
    registry_client: Arc<TreasuryRegistryClient>,
    ethereum_client: Arc<EthereumClient>,
    token_clients: Arc<tokio::sync::Mutex<HashMap<Address, TreasuryTokenClient>>>,
    verification_provider: Arc<dyn VerificationProvider>,
}

impl UserService {
    /// Create a new UserService
    pub async fn new(
        compliance_client: Arc<ComplianceClient>,
        registry_client: Arc<TreasuryRegistryClient>,
        ethereum_client: Arc<EthereumClient>,
        verification_provider: Arc<dyn VerificationProvider>,
    ) -> Self {
        Self {
            compliance_client,
            registry_client,
            ethereum_client,
            token_clients: Arc::new(tokio::sync::Mutex::new(HashMap::new())),
            verification_provider,
        }
    }
    
    /// Get or create token client for a token address
    async fn get_token_client(&self, token_address: Address) -> Result<TreasuryTokenClient, ServiceError> {
        let mut clients = self.token_clients.lock().await;
        
        if let Some(client) = clients.get(&token_address) {
            return Ok(client.clone());
        }
        
        // Create new client
        let client = TreasuryTokenClient::new(self.ethereum_client.clone(), token_address).await;
        clients.insert(token_address, client.clone());
        
        Ok(client)
    }
    
    /// Register a new user
    pub async fn register_user(
        &self,
        wallet_address: Address,
        email: String,
    ) -> Result<UserData, ServiceError> {
        info!("Registering new user: {:?}, email: {}", wallet_address, email);
        
        // Create metadata URI for storing user data
        // In a real implementation, we would store this in a secure database or IPFS
        let metadata_uri = format!("users/{:?}", wallet_address);
        
        // Register user with compliance module
        let entity_type = crate::clients::compliance_client::EntityType::Individual;
        
        self.compliance_client.request_verification(
            wallet_address,
            entity_type,
            &metadata_uri,
        ).await.map_err(|e| ServiceError::ContractInteraction(format!("Failed to request verification: {}", e)))?;
        
        // Return user data
        let user_data = UserData {
            wallet_address,
            email,
            verification_status: VerificationStatus::Unverified,
            is_institutional: false,
            registration_date: Utc::now().timestamp() as u64,
            metadata_uri: Some(metadata_uri),
        };
        
        Ok(user_data)
    }
    
    /// Verify a user's identity
    pub async fn verify_user(
        &self,
        wallet_address: Address,
        verification_data: VerificationData,
    ) -> Result<VerificationStatus, ServiceError> {
        info!("Verifying user identity: {:?}", wallet_address);
        
        // Perform identity verification using the verification provider
        let verification_result = self.verification_provider.verify_identity(&verification_data).await?;
        
        if !verification_result {
            return Err(ServiceError::InvalidState("Identity verification failed".into()));
        }
        
        // Update verification status in compliance module
        // First, convert the jurisdiction string to bytes2
        let jurisdiction_bytes = if verification_data.jurisdiction.len() >= 2 {
            let bytes = verification_data.jurisdiction.as_bytes();
            [bytes[0], bytes[1]]
        } else {
            return Err(ServiceError::InvalidParameter("Invalid jurisdiction code".into()));
        };
        
        // Update status
        self.compliance_client.set_investor_status(
            wallet_address,
            crate::clients::compliance_client::VerificationStatus::Verified,
            jurisdiction_bytes,
        ).await.map_err(|e| ServiceError::ContractInteraction(format!("Failed to update verification status: {}", e)))?;
        
        // Get updated verification status
        let status = self.get_user_verification_status(wallet_address).await?;
        
        Ok(match status.status {
            VerificationStatus::Verified => VerificationStatus::Verified,
            VerificationStatus::Pending => VerificationStatus::Pending,
            VerificationStatus::Rejected => VerificationStatus::Rejected,
            VerificationStatus::Suspended => VerificationStatus::Suspended,
            VerificationStatus::Unverified => VerificationStatus::Unverified,
        })
    }
    
    /// Register an institutional user
    pub async fn register_institutional_user(
        &self,
        wallet_address: Address,
        verification_data: InstitutionalVerificationData,
        stake_amount: U256,
    ) -> Result<InstitutionalRegistrationResult, ServiceError> {
        info!("Registering institutional user: {:?}, name: {}", wallet_address, verification_data.institution_name);
        
        // Validate BLS public key
        let bls_key_valid = self.verification_provider.validate_bls_key(&verification_data.bls_public_key).await?;
        
        if !bls_key_valid {
            return Err(ServiceError::InvalidParameter("Invalid BLS public key".into()));
        }
        
        // Verify institutional identity
        let verification_result = self.verification_provider.verify_institutional(&verification_data).await?;
        
        if !verification_result {
            return Err(ServiceError::InvalidState("Institutional verification failed".into()));
        }
        
        // Create metadata URI for storing institutional data
        // In a real implementation, we would store this in a secure database or IPFS
        let metadata_uri = format!("institutions/{:?}", wallet_address);
        
        // Register as institutional validator
        self.compliance_client.register_institutional_validator(
            wallet_address,
            &verification_data.institution_name,
            &metadata_uri,
        ).await.map_err(|e| ServiceError::ContractInteraction(format!("Failed to register institutional validator: {}", e)))?;
        
        // Convert BLS public key from hex to bytes
        let bls_public_key = match hex::decode(&verification_data.bls_public_key.trim_start_matches("0x")) {
            Ok(bytes) => bytes,
            Err(e) => return Err(ServiceError::InvalidParameter(format!("Invalid BLS public key format: {}", e))),
        };
        
        // Register institutional staker
        self.compliance_client.register_institutional_staker(
            wallet_address,
            stake_amount,
            &bls_public_key,
        ).await.map_err(|e| ServiceError::ContractInteraction(format!("Failed to register institutional staker: {}", e)))?;
        
        // Get institutional details
        let details = self.compliance_client.get_institutional_details(wallet_address).await
            .map_err(|e| ServiceError::ContractInteraction(format!("Failed to get institutional details: {}", e)))?;
        
        // Return results
        let result = InstitutionalRegistrationResult {
            wallet_address,
            institution_name: verification_data.institution_name,
            status: VerificationStatus::Verified, // Institutions are immediately verified in this demo
            stake_amount,
            validator_count: details.validator_count,
            is_active: details.active,
            registration_date: Utc::now().timestamp() as u64,
        };
        
        Ok(result)
    }
    
    /// Get a user's portfolio
    pub async fn get_user_portfolio(
        &self,
        wallet_address: Address,
    ) -> Result<UserPortfolio, ServiceError> {
        info!("Getting portfolio for user: {:?}", wallet_address);
        
        // Get user verification status
        let verification_details = self.get_user_verification_status(wallet_address).await?;
        
        // Get all treasury tokens
        let all_treasuries = self.registry_client.get_all_treasuries().await?;
        
        let mut holdings = Vec::new();
        let mut total_value = U256::from(0);
        let mut total_pending_yield = U256::from(0);
        
        // Check balance for each treasury token
        for treasury_id in all_treasuries {
            let treasury_info = match self.registry_client.get_treasury_details(treasury_id).await {
                Ok(info) => info,
                Err(e) => {
                    warn!("Failed to get details for treasury {:?}: {}", treasury_id, e);
                    continue;
                }
            };
            
            // Get token client
            let token_client = match self.get_token_client(treasury_info.token_address).await {
                Ok(client) => client,
                Err(e) => {
                    warn!("Failed to get token client for treasury {:?}: {}", treasury_id, e);
                    continue;
                }
            };
            
            // Get token info
            let token_info = match token_client.get_token_info().await {
                Ok(info) => info,
                Err(e) => {
                    warn!("Failed to get token info for treasury {:?}: {}", treasury_id, e);
                    continue;
                }
            };
            
            // Check user balance
            let balance = match token_client.balance_of(wallet_address).await {
                Ok(balance) => balance,
                Err(e) => {
                    warn!("Failed to get balance for user {:?} in treasury {:?}: {}", wallet_address, treasury_id, e);
                    continue;
                }
            };
            
            // Skip if zero balance
            if balance == U256::from(0) {
                continue;
            }
            
            // Get pending yield
            let pending_yield = match token_client.get_pending_yield(wallet_address).await {
                Ok(yield_amount) => yield_amount,
                Err(e) => {
                    warn!("Failed to get pending yield for user {:?} in treasury {:?}: {}", wallet_address, treasury_id, e);
                    U256::from(0)
                }
            };
            
            // Calculate value (balance * price)
            let value = balance * treasury_info.current_price;
            
            // Check if holding is restricted
            let is_restricted = match self.compliance_client.is_entity_restricted(
                wallet_address, 
                0, // Restriction type 0 = trading restriction
                Some(treasury_id),
            ).await {
                Ok(restricted) => restricted,
                Err(e) => {
                    warn!("Failed to check restrictions for user {:?} in treasury {:?}: {}", wallet_address, treasury_id, e);
                    false
                }
            };
            
            // Add to holdings
            holdings.push(PortfolioHolding {
                treasury_id,
                token_address: treasury_info.token_address,
                name: token_info.0,
                symbol: token_info.1,
                balance,
                value,
                pending_yield,
                yield_rate: treasury_info.yield_rate,
                maturity_date: treasury_info.maturity_date,
                is_restricted,
            });
            
            // Update totals
            total_value += value;
            total_pending_yield += pending_yield;
        }
        
        // Check if smart account is enabled
        let smart_account_enabled = self.is_smart_account_enabled(wallet_address).await?;
        
        // Create portfolio
        let portfolio = UserPortfolio {
            wallet_address,
            holdings,
            total_value,
            total_pending_yield,
            verification_status: verification_details.status,
            investment_limit: verification_details.investment_limit,
            smart_account_enabled,
        };
        
        Ok(portfolio)
    }
    
    /// Get user verification status
    pub async fn get_user_verification_status(
        &self,
        wallet_address: Address,
    ) -> Result<VerificationDetails, ServiceError> {
        info!("Getting verification status for user: {:?}", wallet_address);
        
        // Get verification data from compliance client
        let data = self.compliance_client.get_verification_data(wallet_address).await
            .map_err(|e| ServiceError::ContractInteraction(format!("Failed to get verification data: {}", e)))?;
        
        // Convert verification status
        let status = match data.status {
            crate::clients::compliance_client::VerificationStatus::Unverified => VerificationStatus::Unverified,
            crate::clients::compliance_client::VerificationStatus::Pending => VerificationStatus::Pending,
            crate::clients::compliance_client::VerificationStatus::Verified => VerificationStatus::Verified,
            crate::clients::compliance_client::VerificationStatus::Rejected => VerificationStatus::Rejected,
            crate::clients::compliance_client::VerificationStatus::Suspended => VerificationStatus::Suspended,
        };
        
        // Convert jurisdiction bytes to string
        let jurisdiction = match std::str::from_utf8(&[data.jurisdiction[0], data.jurisdiction[1]]) {
            Ok(s) => s.to_string(),
            Err(_) => "??".to_string(),
        };
        
        // Get investment limit based on verification status
        let investment_limit = match status {
            VerificationStatus::Verified => Some(U256::from(1_000_000)), // $1M limit for verified users
            VerificationStatus::Pending => Some(U256::from(10_000)),     // $10K limit for pending verification
            _ => None,                                                   // No limit for other statuses
        };
        
        // Check if this is an institutional user
        let is_institutional = data.entity_type == crate::clients::compliance_client::EntityType::Institution;
        
        // Get institutional details if applicable
        let institutional_details = if is_institutional {
            match self.compliance_client.get_institutional_details(wallet_address).await {
                Ok(details) => {
                    // In a real implementation, we would load more details from storage
                    // For now, create a simplified representation
                    Some(InstitutionalDetails {
                        institution_name: "Institution Name".to_string(), // Would come from metadata
                        registration_number: "REG12345".to_string(),      // Would come from metadata
                        stake_amount: details.stake_amount,
                        validator_count: details.validator_count,
                        is_active: details.active,
                        representative: RepresentativeData {
                            full_name: "Representative Name".to_string(),
                            position: "Representative Position".to_string(),
                            email: "representative@example.com".to_string(),
                            phone: "+1234567890".to_string(),
                        },
                        bls_public_key: hex::encode(details.bls_public_key),
                    })
                },
                Err(e) => {
                    warn!("Failed to get institutional details for user {:?}: {}", wallet_address, e);
                    None
                }
            }
        } else {
            None
        };
        
        // Create verification details
        let details = VerificationDetails {
            wallet_address,
            status,
            jurisdiction,
            verification_date: Some(data.verification_date),
            expiration_date: Some(data.expiration_date),
            investment_limit,
            institutional_details,
        };
        
        Ok(details)
    }
    
    /// Calculate total yield for a user
    pub async fn calculate_total_yield(
        &self,
        wallet_address: Address,
    ) -> Result<U256, ServiceError> {
        info!("Calculating total yield for user: {:?}", wallet_address);
        
        // Get user portfolio
        let portfolio = self.get_user_portfolio(wallet_address).await?;
        
        // Return total pending yield
        Ok(portfolio.total_pending_yield)
    }
    
    /// Get investment limits for a user
    pub async fn get_investment_limits(
        &self,
        wallet_address: Address,
    ) -> Result<U256, ServiceError> {
        info!("Getting investment limits for user: {:?}", wallet_address);
        
        // Get user verification status
        let verification_details = self.get_user_verification_status(wallet_address).await?;
        
        // Return investment limit or zero if not set
        Ok(verification_details.investment_limit.unwrap_or(U256::from(0)))
    }
    
    /// Setup a smart account for a user
    pub async fn setup_smart_account(
        &self,
        wallet_address: Address,
        account_code: Vec<u8>,
    ) -> Result<SmartAccountSetupResult, ServiceError> {
        info!("Setting up smart account for user: {:?}", wallet_address);
        
        // Get any token client to access the token_client interface
        let treasuries = self.registry_client.get_all_treasuries().await?;
        if treasuries.is_empty() {
            return Err(ServiceError::NotFound("No treasury tokens available".into()));
        }
        
        let treasury_info = self.registry_client.get_treasury_details(treasuries[0]).await?;
        let token_client = self.get_token_client(treasury_info.token_address).await?;
        
        // Set up smart account code
        let result = match token_client.set_account_code(wallet_address, &account_code).await {
            Ok(()) => {
                // Calculate code hash
                let code_hash = H256::from_slice(&alloy_primitives::keccak256(&account_code));
                
                SmartAccountSetupResult {
                    wallet_address,
                    code_hash,
                    setup_time: Utc::now().timestamp() as u64,
                    success: true,
                    error_message: None,
                }
            },
            Err(e) => {
                let error_msg = format!("Failed to set account code: {}", e);
                error!("{}", error_msg);
                
                SmartAccountSetupResult {
                    wallet_address,
                    code_hash: H256::zero(),
                    setup_time: Utc::now().timestamp() as u64,
                    success: false,
                    error_message: Some(error_msg),
                }
            }
        };
        
        Ok(result)
    }
    
    /// Check if a user has a smart account enabled
    pub async fn is_smart_account_enabled(
        &self,
        wallet_address: Address,
    ) -> Result<bool, ServiceError> {
        // Check if the wallet has smart account code
        let code = self.ethereum_client.check_smart_account_code(wallet_address).await
            .map_err(|e| ServiceError::ContractInteraction(format!("Failed to check smart account code: {}", e)))?;
        
        Ok(!code.is_empty())
    }
    
    /// Execute a smart account operation
    pub async fn execute_smart_account_operation(
        &self,
        wallet_address: Address,
        operation_data: Vec<u8>,
    ) -> Result<Vec<u8>, ServiceError> {
        info!("Executing smart account operation for user: {:?}", wallet_address);
        
        // Check if smart account is enabled
        if !self.is_smart_account_enabled(wallet_address).await? {
            return Err(ServiceError::InvalidState("Smart account not enabled for this wallet".into()));
        }
        
        // Execute operation
        let result = self.ethereum_client.execute_smart_account(wallet_address, operation_data).await
            .map_err(|e| ServiceError::ContractInteraction(format!("Failed to execute smart account operation: {}", e)))?;
        
        Ok(result)
    }
    
    /// Set a delegated operator for a user
    pub async fn set_delegated_operator(
        &self,
        user_address: Address,
        operator_address: Address,
        approved: bool,
    ) -> Result<bool, ServiceError> {
        info!("Setting delegated operator {:?} for user {:?}, approved: {}", operator_address, user_address, approved);
        
        // Use the registry client to set delegation
        self.registry_client.delegate_operator(user_address, operator_address, approved).await?;
        
        Ok(true)
    }
    
    /// Get delegated operators for a user
    pub async fn get_delegated_operators(
        &self,
        user_address: Address,
    ) -> Result<Vec<Address>, ServiceError> {
        info!("Getting delegated operators for user: {:?}", user_address);
        
        // In a real implementation, we would query the contract for all delegated operators
        // For now, we'll return an empty list since we don't have that functionality in the client
        // This would be implemented in the TreasuryRegistryClient
        
        Ok(Vec::new())
    }
} 