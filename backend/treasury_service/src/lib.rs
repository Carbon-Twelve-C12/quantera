use alloy_primitives::{Address, U256, H256, Bytes};
use ethereum_client::{EthereumClient, Error as EthError};
use serde::{Serialize, Deserialize};
use std::sync::Arc;
use async_trait::async_trait;
use thiserror::Error;

// Create and export clients module
mod clients;
pub use clients::*;

// Create and export yield scheduler
mod yield_scheduler;
pub use yield_scheduler::{
    YieldSchedulerService,
    YieldDistributionResult,
    MaturityResult,
    TreasurySnapshot,
};

// Create and export user service
mod user_service;
pub use user_service::{
    UserService,
    VerificationProvider,
    MockVerificationProvider,
    VerificationData,
    AddressData,
    IdData,
    InstitutionalVerificationData,
    RepresentativeData,
    UserData,
    VerificationDetails,
    InstitutionalDetails,
    InstitutionalRegistrationResult,
    PortfolioHolding,
    UserPortfolio,
    VerificationStatus,
    SmartAccountSetupResult,
};

// Create and export authentication service
mod auth_service;
pub use auth_service::{
    AuthenticationService,
    AuthMethod,
    AuthRequest,
    AuthChallenge,
    AuthResult,
    TokenValidationResult,
    TwoFactorSetupResult,
};

// Create and export API module
pub mod api;

/// Custom error type for Treasury service operations
#[derive(Debug, Error)]
pub enum Error {
    #[error("Ethereum client error: {0}")]
    EthereumClient(#[from] EthError),
    
    #[error("Contract interaction error: {0}")]
    ContractInteraction(String),
    
    #[error("Encoding error: {0}")]
    Encoding(String),
    
    #[error("Decoding error: {0}")]
    Decoding(String),
    
    #[error("IPFS error: {0}")]
    Ipfs(String),
    
    #[error("Data not found: {0}")]
    NotFound(String),
    
    #[error("Registry operation failed: {0}")]
    RegistryOperation(String),
    
    #[error("Invalid state: {0}")]
    InvalidState(String),
    
    #[error("Invalid parameter: {0}")]
    InvalidParameter(String),
    
    #[error("Unauthorized: {0}")]
    Unauthorized(String),
    
    #[error("Internal error: {0}")]
    Internal(String),
    
    #[error("Feature not implemented: {0}")]
    Unimplemented(String),
}

/// Treasury types
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum TreasuryType {
    TBill,
    TNote,
    TBond,
}

/// Treasury status
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum TreasuryStatus {
    Active,
    Matured,
    Redeemed,
}

/// Treasury information structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TreasuryInfo {
    pub token_address: Address,
    pub metadata_uri: String,
    pub status: TreasuryStatus,
    pub current_price: U256,
    pub issuance_date: u64,
    pub maturity_date: u64,
    pub yield_rate: u64,
    pub issuer: Address,
    pub historical_data_hash: H256,
}

/// Treasury overview for listing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TreasuryOverview {
    pub token_id: [u8; 32],
    pub token_address: Address,
    pub name: String,
    pub symbol: String,
    pub treasury_type: TreasuryType,
    pub current_price: U256,
    pub yield_rate: u64,
    pub maturity_date: u64,
    pub status: TreasuryStatus,
}

/// Treasury metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TreasuryMetadata {
    pub name: String,
    pub symbol: String,
    pub description: String,
    pub issuer_name: String,
    pub treasury_type: TreasuryType,
    pub face_value: String,
    pub issuance_date: u64,
    pub maturity_date: u64,
    pub yield_rate: u64,
    pub image_uri: Option<String>,
    pub external_url: Option<String>,
    pub additional_details: Option<serde_json::Value>,
}

/// Client for interacting with the TreasuryRegistry contract
#[derive(Debug, Clone)]
pub struct TreasuryRegistryClient {
    client: Arc<EthereumClient>,
    contract_address: Address,
}

impl TreasuryRegistryClient {
    /// Create a new TreasuryRegistryClient
    pub async fn new(client: Arc<EthereumClient>, address: Address) -> Self {
        Self {
            client,
            contract_address: address,
        }
    }
    
    /// Register a new treasury
    pub async fn register_treasury(
        &self,
        token_address: Address,
        metadata_uri: &str,
        treasury_type: TreasuryType,
        issuance_date: u64,
        maturity_date: u64,
        yield_rate: u64,
    ) -> Result<[u8; 32], Error> {
        // Generate a unique token ID
        let token_id = Self::generate_token_id(token_address, treasury_type, issuance_date, maturity_date);
        
        // Convert treasury type to uint8
        let treasury_type_value = match treasury_type {
            TreasuryType::TBill => 0u8,
            TreasuryType::TNote => 1u8,
            TreasuryType::TBond => 2u8,
        };
        
        // Call the contract
        let result = self.client.call_contract::<[u8; 32]>(
            self.contract_address,
            "registerTreasury(address,bytes32,string,uint8,uint256,uint256,uint256)",
            vec![
                token_address.into(),
                token_id.into(),
                metadata_uri.into(),
                treasury_type_value.into(),
                U256::from(issuance_date).into(),
                U256::from(maturity_date).into(),
                U256::from(yield_rate).into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(result)
    }
    
    /// Update treasury status
    pub async fn update_treasury_status(
        &self,
        token_id: [u8; 32],
        status: TreasuryStatus,
    ) -> Result<(), Error> {
        // Convert status to uint8
        let status_value = match status {
            TreasuryStatus::Active => 0u8,
            TreasuryStatus::Matured => 1u8,
            TreasuryStatus::Redeemed => 2u8,
        };
        
        // Call the contract
        self.client.send_transaction(
            self.contract_address,
            "updateTreasuryStatus(bytes32,uint8)",
            vec![
                token_id.into(),
                status_value.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
    
    /// Update treasury price
    pub async fn update_treasury_price(
        &self,
        token_id: [u8; 32],
        new_price: U256,
    ) -> Result<(), Error> {
        // Call the contract
        self.client.send_transaction(
            self.contract_address,
            "updateTreasuryPrice(bytes32,uint256)",
            vec![
                token_id.into(),
                new_price.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
    
    /// Delegate operator permissions
    pub async fn delegate_operator(
        &self,
        user_address: Address,
        operator_address: Address,
        approved: bool,
    ) -> Result<(), Error> {
        // Call the contract
        self.client.send_transaction(
            self.contract_address,
            "delegateOperator(address,bool)",
            vec![
                operator_address.into(),
                approved.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
    
    /// Execute as delegated operator
    pub async fn execute_as_delegated(
        &self,
        owner: Address,
        token_id: [u8; 32],
        operation_data: Vec<u8>,
    ) -> Result<bool, Error> {
        // Call the contract
        let result = self.client.call_contract::<bool>(
            self.contract_address,
            "executeAsDelegated(address,bytes32,bytes)",
            vec![
                owner.into(),
                token_id.into(),
                Bytes::from(operation_data).into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(result)
    }
    
    /// Get treasury details
    pub async fn get_treasury_details(
        &self,
        token_id: [u8; 32],
    ) -> Result<TreasuryInfo, Error> {
        // Call the contract
        let result = self.client.call_contract::<(Address, String, u8, U256, u64, u64, u64, Address, H256)>(
            self.contract_address,
            "getTreasuryDetails(bytes32)",
            vec![
                token_id.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        // Convert status from uint8
        let status = match result.2 {
            0 => TreasuryStatus::Active,
            1 => TreasuryStatus::Matured,
            2 => TreasuryStatus::Redeemed,
            _ => return Err(Error::Decoding("Invalid treasury status".into())),
        };
        
        // Convert tuple to TreasuryInfo
        let info = TreasuryInfo {
            token_address: result.0,
            metadata_uri: result.1,
            status,
            current_price: result.3,
            issuance_date: result.4,
            maturity_date: result.5,
            yield_rate: result.6,
            issuer: result.7,
            historical_data_hash: result.8,
        };
        
        Ok(info)
    }
    
    /// Get all treasuries
    pub async fn get_all_treasuries(&self) -> Result<Vec<[u8; 32]>, Error> {
        // Call the contract
        let result = self.client.call_contract::<Vec<[u8; 32]>>(
            self.contract_address,
            "getAllTreasuries()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(result)
    }
    
    /// Get treasuries by type
    pub async fn get_treasuries_by_type(
        &self,
        treasury_type: TreasuryType,
    ) -> Result<Vec<[u8; 32]>, Error> {
        // Convert treasury type to uint8
        let treasury_type_value = match treasury_type {
            TreasuryType::TBill => 0u8,
            TreasuryType::TNote => 1u8,
            TreasuryType::TBond => 2u8,
        };
        
        // Call the contract
        let result = self.client.call_contract::<Vec<[u8; 32]>>(
            self.contract_address,
            "getTreasuriesByType(uint8)",
            vec![
                treasury_type_value.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(result)
    }
    
    /// Get treasuries by status
    pub async fn get_treasuries_by_status(
        &self,
        status: TreasuryStatus,
    ) -> Result<Vec<[u8; 32]>, Error> {
        // Convert status to uint8
        let status_value = match status {
            TreasuryStatus::Active => 0u8,
            TreasuryStatus::Matured => 1u8,
            TreasuryStatus::Redeemed => 2u8,
        };
        
        // Call the contract
        let result = self.client.call_contract::<Vec<[u8; 32]>>(
            self.contract_address,
            "getTreasuriesByStatus(uint8)",
            vec![
                status_value.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(result)
    }
    
    /// Check if issuer is approved
    pub async fn is_approved_issuer(
        &self,
        issuer: Address,
    ) -> Result<bool, Error> {
        // Call the contract
        let result = self.client.call_contract::<bool>(
            self.contract_address,
            "isApprovedIssuer(address)",
            vec![
                issuer.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(result)
    }
    
    /// Check if operator is delegated for an owner
    pub async fn is_delegated_operator(
        &self,
        owner: Address,
        operator: Address,
    ) -> Result<bool, Error> {
        // Call the contract
        let result = self.client.call_contract::<bool>(
            self.contract_address,
            "isDelegatedOperator(address,address)",
            vec![
                owner.into(),
                operator.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(result)
    }
    
    /// Generate a token ID
    fn generate_token_id(
        token_address: Address,
        treasury_type: TreasuryType,
        issuance_date: u64,
        maturity_date: u64,
    ) -> [u8; 32] {
        let treasury_type_value = match treasury_type {
            TreasuryType::TBill => 0u8,
            TreasuryType::TNote => 1u8,
            TreasuryType::TBond => 2u8,
        };
        
        // Combine elements to create a unique ID
        let data = [
            token_address.as_bytes(),
            &[treasury_type_value],
            &issuance_date.to_be_bytes(),
            &maturity_date.to_be_bytes(),
        ].concat();
        
        // Hash the data to get the token ID
        let hash = alloy_primitives::keccak256(&data);
        hash
    }
}

/// IPFS client for metadata storage
#[derive(Debug, Clone)]
pub struct IpfsClient {
    base_url: String,
}

impl IpfsClient {
    /// Create a new IPFS client
    pub fn new(base_url: &str) -> Self {
        Self {
            base_url: base_url.to_string(),
        }
    }
    
    /// Upload metadata to IPFS
    pub async fn upload_metadata(&self, metadata: &TreasuryMetadata) -> Result<String, Error> {
        // Serialize metadata to JSON
        let json = serde_json::to_string(metadata)
            .map_err(|e| Error::Encoding(format!("Failed to serialize metadata: {}", e)))?;
        
        // In a real implementation, this would upload the JSON to IPFS
        // For now, we'll just return a mock IPFS hash
        let mock_ipfs_hash = format!("ipfs://Qm{:x}", alloy_primitives::keccak256(json.as_bytes()));
        
        Ok(mock_ipfs_hash)
    }
    
    /// Get metadata from IPFS
    pub async fn get_metadata(&self, uri: &str) -> Result<TreasuryMetadata, Error> {
        // In a real implementation, this would fetch the JSON from IPFS
        // For now, we'll just return a mock metadata object
        
        // Check if the URI is an IPFS URI
        if !uri.starts_with("ipfs://") {
            return Err(Error::Ipfs(format!("Invalid IPFS URI: {}", uri)));
        }
        
        // Mock metadata for testing
        let metadata = TreasuryMetadata {
            name: "10-Year Treasury Note".to_string(),
            symbol: "TNOTE-10Y".to_string(),
            description: "U.S. Treasury 10-Year Note".to_string(),
            issuer_name: "U.S. Department of the Treasury".to_string(),
            treasury_type: TreasuryType::TNote,
            face_value: "1000.00".to_string(),
            issuance_date: chrono::Utc::now().timestamp() as u64,
            maturity_date: chrono::Utc::now().timestamp() as u64 + 10 * 365 * 24 * 60 * 60, // 10 years
            yield_rate: 300, // 3.00% (in basis points)
            image_uri: Some("https://example.com/treasury.png".to_string()),
            external_url: Some("https://www.treasurydirect.gov/".to_string()),
            additional_details: None,
        };
        
        Ok(metadata)
    }
}


/// Treasury service for managing treasury tokens
pub struct TreasuryService {
    registry_client: TreasuryRegistryClient,
    ipfs_client: IpfsClient,
}

impl TreasuryService {
    /// Create a new TreasuryService
    pub async fn new(registry_client: TreasuryRegistryClient, ipfs_client: IpfsClient) -> Self {
        Self {
            registry_client,
            ipfs_client,
        }
    }
    
    /// Create a new treasury token
    pub async fn create_treasury_token(
        &self,
        name: String,
        symbol: String,
        total_supply: u64,
        treasury_type: TreasuryType,
        face_value: U256,
        yield_rate: u64,
        issuance_date: u64,
        maturity_date: u64,
        issuer: Address,
    ) -> Result<TreasuryOverview, Error> {
        // Create metadata
        let metadata = TreasuryMetadata {
            name: name.clone(),
            symbol: symbol.clone(),
            description: format!("{} {}", name, match treasury_type {
                TreasuryType::TBill => "Bill",
                TreasuryType::TNote => "Note",
                TreasuryType::TBond => "Bond",
            }),
            issuer_name: "U.S. Department of the Treasury".to_string(),
            treasury_type,
            face_value: face_value.to_string(),
            issuance_date,
            maturity_date,
            yield_rate,
            image_uri: Some("https://example.com/treasury.png".to_string()),
            external_url: Some("https://www.treasurydirect.gov/".to_string()),
            additional_details: None,
        };
        
        // Upload metadata to IPFS
        let metadata_uri = self.ipfs_client.upload_metadata(&metadata).await?;
        
        // Mock token address for now
        // In a real implementation, this would deploy the token contract
        let token_address = Address::ZERO;
        
        // Register treasury in the registry
        let token_id = self.registry_client.register_treasury(
            token_address,
            &metadata_uri,
            treasury_type,
            issuance_date,
            maturity_date,
            yield_rate,
        ).await?;
        
        // Create overview
        let overview = TreasuryOverview {
            token_id,
            token_address,
            name,
            symbol,
            treasury_type,
            current_price: face_value,
            yield_rate,
            maturity_date,
            status: TreasuryStatus::Active,
        };
        
        Ok(overview)
    }
    
    /// Get treasury details
    pub async fn get_treasury_details(&self, token_id: [u8; 32]) -> Result<TreasuryInfo, Error> {
        self.registry_client.get_treasury_details(token_id).await
    }
    
    /// Get all treasuries
    pub async fn get_all_treasuries(&self) -> Result<Vec<TreasuryOverview>, Error> {
        // Get all treasury IDs
        let token_ids = self.registry_client.get_all_treasuries().await?;
        
        // Get details for each treasury
        let mut treasuries = Vec::new();
        for token_id in token_ids {
            if let Ok(info) = self.registry_client.get_treasury_details(token_id).await {
                // Get metadata
                if let Ok(metadata) = self.ipfs_client.get_metadata(&info.metadata_uri).await {
                    let overview = TreasuryOverview {
                        token_id,
                        token_address: info.token_address,
                        name: metadata.name,
                        symbol: metadata.symbol,
                        treasury_type: metadata.treasury_type,
                        current_price: info.current_price,
                        yield_rate: info.yield_rate,
                        maturity_date: info.maturity_date,
                        status: info.status,
                    };
                    
                    treasuries.push(overview);
                }
            }
        }
        
        Ok(treasuries)
    }
    
    /// Update treasury price
    pub async fn update_treasury_price(&self, token_id: [u8; 32], new_price: U256) -> Result<(), Error> {
        self.registry_client.update_treasury_price(token_id, new_price).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_generate_token_id() {
        let token_address = Address::from_slice(&[1; 20]);
        let treasury_type = TreasuryType::TBill;
        let issuance_date = 1640995200; // 2022-01-01
        let maturity_date = 1672531200; // 2023-01-01
        
        let token_id = TreasuryRegistryClient::generate_token_id(
            token_address,
            treasury_type,
            issuance_date,
            maturity_date,
        );
        
        assert_eq!(token_id.len(), 32);
    }
} 