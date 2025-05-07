use alloy_primitives::{Address, U256, H256, Bytes};
use ethereum_client::{EthereumClient, Error as EthError};
use std::sync::Arc;
use serde::{Serialize, Deserialize};
use thiserror::Error;
use tracing::{info, debug, warn, error};

/// Custom error type for ComplianceClient operations
#[derive(Debug, Error)]
pub enum Error {
    #[error("Ethereum client error: {0}")]
    EthereumClient(#[from] EthError),
    
    #[error("Contract interaction error: {0}")]
    ContractInteraction(String),
    
    #[error("Encoding/decoding error: {0}")]
    Encoding(String),
    
    #[error("Verification error: {0}")]
    Verification(String),
    
    #[error("Entity not found: {0}")]
    NotFound(String),
    
    #[error("Unauthorized operation: {0}")]
    Unauthorized(String),
}

/// Verification status types
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum VerificationStatus {
    Unverified,
    Pending,
    Verified,
    Rejected,
    Suspended,
}

/// Entity type for compliance
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum EntityType {
    Individual,
    Institution,
    Issuer,
    Validator,
}

/// Verification data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerificationData {
    pub entity_address: Address,
    pub entity_type: EntityType,
    pub status: VerificationStatus,
    pub verification_date: u64,
    pub expiration_date: u64,
    pub verifier: Address,
    pub metadata_uri: String,
}

/// Restriction data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RestrictionData {
    pub restriction_type: u8,
    pub start_date: u64,
    pub end_date: u64,
    pub token_id: Option<[u8; 32]>,
    pub details: String,
}

/// Regulatory rule
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegulatoryRule {
    pub rule_id: u8,
    pub name: String, 
    pub description: String,
    pub is_active: bool,
    pub parameters: Vec<u8>,
}

/// Client for interacting with the ComplianceModule contract
#[derive(Debug, Clone)]
pub struct ComplianceClient {
    client: Arc<EthereumClient>,
    contract_address: Address,
}

impl ComplianceClient {
    /// Create a new ComplianceClient
    pub async fn new(client: Arc<EthereumClient>, address: Address) -> Self {
        Self {
            client,
            contract_address: address,
        }
    }
    
    /// Request verification for an entity
    pub async fn request_verification(
        &self,
        entity_address: Address,
        entity_type: EntityType,
        metadata_uri: &str,
    ) -> Result<(), Error> {
        info!("Requesting verification for entity: {:?} of type: {:?}", entity_address, entity_type);
        
        // Convert entity type to uint8
        let entity_type_value = match entity_type {
            EntityType::Individual => 0u8,
            EntityType::Institution => 1u8,
            EntityType::Issuer => 2u8,
            EntityType::Validator => 3u8,
        };
        
        // Call the contract
        self.client.send_transaction(
            self.contract_address,
            "requestVerification(address,uint8,string)",
            vec![
                entity_address.into(),
                entity_type_value.into(),
                metadata_uri.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
    
    /// Approve verification for an entity
    pub async fn approve_verification(
        &self,
        entity_address: Address,
        expiration_date: u64,
    ) -> Result<(), Error> {
        info!("Approving verification for entity: {:?}", entity_address);
        
        // Call the contract
        self.client.send_transaction(
            self.contract_address,
            "approveVerification(address,uint256)",
            vec![
                entity_address.into(),
                U256::from(expiration_date).into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
    
    /// Reject verification for an entity
    pub async fn reject_verification(
        &self,
        entity_address: Address,
        reason: &str,
    ) -> Result<(), Error> {
        info!("Rejecting verification for entity: {:?}, reason: {}", entity_address, reason);
        
        // Call the contract
        self.client.send_transaction(
            self.contract_address,
            "rejectVerification(address,string)",
            vec![
                entity_address.into(),
                reason.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
    
    /// Suspend verification for an entity
    pub async fn suspend_verification(
        &self,
        entity_address: Address,
        reason: &str,
    ) -> Result<(), Error> {
        info!("Suspending verification for entity: {:?}, reason: {}", entity_address, reason);
        
        // Call the contract
        self.client.send_transaction(
            self.contract_address,
            "suspendVerification(address,string)",
            vec![
                entity_address.into(),
                reason.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
    
    /// Reinstate verification for an entity
    pub async fn reinstate_verification(
        &self,
        entity_address: Address,
        expiration_date: u64,
    ) -> Result<(), Error> {
        info!("Reinstating verification for entity: {:?}", entity_address);
        
        // Call the contract
        self.client.send_transaction(
            self.contract_address,
            "reinstateVerification(address,uint256)",
            vec![
                entity_address.into(),
                U256::from(expiration_date).into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
    
    /// Get verification status for an entity
    pub async fn get_verification_status(
        &self,
        entity_address: Address,
    ) -> Result<VerificationStatus, Error> {
        debug!("Getting verification status for entity: {:?}", entity_address);
        
        // Call the contract
        let status_value = self.client.call_contract::<u8>(
            self.contract_address,
            "getVerificationStatus(address)",
            vec![
                entity_address.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        // Convert status from uint8
        let status = match status_value {
            0 => VerificationStatus::Unverified,
            1 => VerificationStatus::Pending,
            2 => VerificationStatus::Verified,
            3 => VerificationStatus::Rejected,
            4 => VerificationStatus::Suspended,
            _ => return Err(Error::Encoding("Invalid verification status".into())),
        };
        
        Ok(status)
    }
    
    /// Get verification data for an entity
    pub async fn get_verification_data(
        &self,
        entity_address: Address,
    ) -> Result<VerificationData, Error> {
        debug!("Getting verification data for entity: {:?}", entity_address);
        
        // Call the contract
        let result = self.client.call_contract::<(u8, u8, u64, u64, Address, String)>(
            self.contract_address,
            "getVerificationData(address)",
            vec![
                entity_address.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        // Convert entity type from uint8
        let entity_type = match result.0 {
            0 => EntityType::Individual,
            1 => EntityType::Institution,
            2 => EntityType::Issuer,
            3 => EntityType::Validator,
            _ => return Err(Error::Encoding("Invalid entity type".into())),
        };
        
        // Convert status from uint8
        let status = match result.1 {
            0 => VerificationStatus::Unverified,
            1 => VerificationStatus::Pending,
            2 => VerificationStatus::Verified,
            3 => VerificationStatus::Rejected,
            4 => VerificationStatus::Suspended,
            _ => return Err(Error::Encoding("Invalid verification status".into())),
        };
        
        // Convert tuple to VerificationData
        let data = VerificationData {
            entity_address,
            entity_type,
            status,
            verification_date: result.2,
            expiration_date: result.3,
            verifier: result.4,
            metadata_uri: result.5,
        };
        
        Ok(data)
    }
    
    /// Add a restriction to an entity
    pub async fn add_restriction(
        &self,
        entity_address: Address,
        restriction_type: u8,
        start_date: u64,
        end_date: u64,
        token_id: Option<[u8; 32]>,
        details: &str,
    ) -> Result<u64, Error> {
        info!("Adding restriction for entity: {:?}, type: {}", entity_address, restriction_type);
        
        // Call the contract with token ID if provided, otherwise call without it
        let result = match token_id {
            Some(id) => {
                self.client.call_contract::<u64>(
                    self.contract_address,
                    "addRestriction(address,uint8,uint256,uint256,bytes32,string)",
                    vec![
                        entity_address.into(),
                        restriction_type.into(),
                        U256::from(start_date).into(),
                        U256::from(end_date).into(),
                        id.into(),
                        details.into(),
                    ],
                ).await.map_err(Error::EthereumClient)?
            },
            None => {
                self.client.call_contract::<u64>(
                    self.contract_address,
                    "addRestriction(address,uint8,uint256,uint256,string)",
                    vec![
                        entity_address.into(),
                        restriction_type.into(),
                        U256::from(start_date).into(),
                        U256::from(end_date).into(),
                        details.into(),
                    ],
                ).await.map_err(Error::EthereumClient)?
            }
        };
        
        Ok(result)
    }
    
    /// Remove a restriction
    pub async fn remove_restriction(
        &self,
        restriction_id: u64,
    ) -> Result<(), Error> {
        info!("Removing restriction: {}", restriction_id);
        
        // Call the contract
        self.client.send_transaction(
            self.contract_address,
            "removeRestriction(uint256)",
            vec![
                U256::from(restriction_id).into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
    
    /// Check if entity is restricted
    pub async fn is_entity_restricted(
        &self,
        entity_address: Address,
        restriction_type: u8,
        token_id: Option<[u8; 32]>,
    ) -> Result<bool, Error> {
        debug!("Checking if entity is restricted: {:?}, type: {}", entity_address, restriction_type);
        
        // Call the contract
        let result = match token_id {
            Some(id) => {
                self.client.call_contract::<bool>(
                    self.contract_address,
                    "isEntityRestricted(address,uint8,bytes32)",
                    vec![
                        entity_address.into(),
                        restriction_type.into(),
                        id.into(),
                    ],
                ).await.map_err(Error::EthereumClient)?
            },
            None => {
                self.client.call_contract::<bool>(
                    self.contract_address,
                    "isEntityRestricted(address,uint8)",
                    vec![
                        entity_address.into(),
                        restriction_type.into(),
                    ],
                ).await.map_err(Error::EthereumClient)?
            }
        };
        
        Ok(result)
    }
    
    /// Get entity restrictions
    pub async fn get_entity_restrictions(
        &self,
        entity_address: Address,
    ) -> Result<Vec<RestrictionData>, Error> {
        debug!("Getting restrictions for entity: {:?}", entity_address);
        
        // Call the contract to get restriction IDs
        let restriction_ids = self.client.call_contract::<Vec<u64>>(
            self.contract_address,
            "getEntityRestrictions(address)",
            vec![
                entity_address.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        // Get details for each restriction
        let mut restrictions = Vec::new();
        for id in restriction_ids {
            let details = self.get_restriction_data(id).await?;
            restrictions.push(details);
        }
        
        Ok(restrictions)
    }
    
    /// Get restriction data
    pub async fn get_restriction_data(
        &self,
        restriction_id: u64,
    ) -> Result<RestrictionData, Error> {
        debug!("Getting data for restriction: {}", restriction_id);
        
        // Call the contract
        let result = self.client.call_contract::<(Address, u8, u64, u64, [u8; 32], String)>(
            self.contract_address,
            "getRestrictionData(uint256)",
            vec![
                U256::from(restriction_id).into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        // Convert tuple to RestrictionData
        let token_id = if result.4 == [0u8; 32] {
            None
        } else {
            Some(result.4)
        };
        
        let data = RestrictionData {
            restriction_type: result.1,
            start_date: result.2,
            end_date: result.3,
            token_id,
            details: result.5,
        };
        
        Ok(data)
    }
    
    /// Add a regulatory rule
    pub async fn add_regulatory_rule(
        &self,
        name: &str,
        description: &str,
        parameters: Vec<u8>,
    ) -> Result<u8, Error> {
        info!("Adding regulatory rule: {}", name);
        
        // Call the contract
        let result = self.client.call_contract::<u8>(
            self.contract_address,
            "addRegulatoryRule(string,string,bytes)",
            vec![
                name.into(),
                description.into(),
                Bytes::from(parameters).into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(result)
    }
    
    /// Update a regulatory rule
    pub async fn update_regulatory_rule(
        &self,
        rule_id: u8,
        name: &str,
        description: &str,
        parameters: Vec<u8>,
    ) -> Result<(), Error> {
        info!("Updating regulatory rule: {}", rule_id);
        
        // Call the contract
        self.client.send_transaction(
            self.contract_address,
            "updateRegulatoryRule(uint8,string,string,bytes)",
            vec![
                rule_id.into(),
                name.into(),
                description.into(),
                Bytes::from(parameters).into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
    
    /// Activate a regulatory rule
    pub async fn activate_regulatory_rule(
        &self,
        rule_id: u8,
    ) -> Result<(), Error> {
        info!("Activating regulatory rule: {}", rule_id);
        
        // Call the contract
        self.client.send_transaction(
            self.contract_address,
            "activateRegulatoryRule(uint8)",
            vec![
                rule_id.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
    
    /// Deactivate a regulatory rule
    pub async fn deactivate_regulatory_rule(
        &self,
        rule_id: u8,
    ) -> Result<(), Error> {
        info!("Deactivating regulatory rule: {}", rule_id);
        
        // Call the contract
        self.client.send_transaction(
            self.contract_address,
            "deactivateRegulatoryRule(uint8)",
            vec![
                rule_id.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
    
    /// Get regulatory rule
    pub async fn get_regulatory_rule(
        &self,
        rule_id: u8,
    ) -> Result<RegulatoryRule, Error> {
        debug!("Getting regulatory rule: {}", rule_id);
        
        // Call the contract
        let result = self.client.call_contract::<(String, String, bool, Bytes)>(
            self.contract_address,
            "getRegulatoryRule(uint8)",
            vec![
                rule_id.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        // Convert tuple to RegulatoryRule
        let rule = RegulatoryRule {
            rule_id,
            name: result.0,
            description: result.1,
            is_active: result.2,
            parameters: result.3.to_vec(),
        };
        
        Ok(rule)
    }
    
    /// Get all regulatory rules
    pub async fn get_all_regulatory_rules(
        &self,
    ) -> Result<Vec<RegulatoryRule>, Error> {
        debug!("Getting all regulatory rules");
        
        // Call the contract to get rule IDs
        let rule_ids = self.client.call_contract::<Vec<u8>>(
            self.contract_address,
            "getAllRegulatoryRules()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        // Get details for each rule
        let mut rules = Vec::new();
        for id in rule_ids {
            if let Ok(rule) = self.get_regulatory_rule(id).await {
                rules.push(rule);
            }
        }
        
        Ok(rules)
    }
    
    /// Check compliance for an operation
    pub async fn check_compliance(
        &self,
        entity_address: Address,
        operation_type: u8,
        token_id: Option<[u8; 32]>,
        data: Vec<u8>,
    ) -> Result<bool, Error> {
        debug!("Checking compliance for entity: {:?}, operation: {}", entity_address, operation_type);
        
        // Call the contract
        let result = match token_id {
            Some(id) => {
                self.client.call_contract::<bool>(
                    self.contract_address,
                    "checkCompliance(address,uint8,bytes32,bytes)",
                    vec![
                        entity_address.into(),
                        operation_type.into(),
                        id.into(),
                        Bytes::from(data).into(),
                    ],
                ).await.map_err(Error::EthereumClient)?
            },
            None => {
                self.client.call_contract::<bool>(
                    self.contract_address,
                    "checkCompliance(address,uint8,bytes)",
                    vec![
                        entity_address.into(),
                        operation_type.into(),
                        Bytes::from(data).into(),
                    ],
                ).await.map_err(Error::EthereumClient)?
            }
        };
        
        Ok(result)
    }
    
    /// Register as an institutional validator
    pub async fn register_institutional_validator(
        &self,
        validator_address: Address,
        name: &str,
        metadata_uri: &str,
    ) -> Result<(), Error> {
        info!("Registering institutional validator: {:?}, name: {}", validator_address, name);
        
        // Call the contract
        self.client.send_transaction(
            self.contract_address,
            "registerInstitutionalValidator(address,string,string)",
            vec![
                validator_address.into(),
                name.into(),
                metadata_uri.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
    
    /// Verify the validator's signature (using BLS if available)
    pub async fn verify_validator_signature(
        &self,
        validator_address: Address,
        message: Vec<u8>,
        signature: Vec<u8>,
    ) -> Result<bool, Error> {
        debug!("Verifying validator signature for: {:?}", validator_address);
        
        // Check if we can use EIP-2537 for BLS signatures
        if self.client.supports_eip_2537() {
            // Get validator's BLS public key
            let public_key = self.client.call_contract::<Bytes>(
                self.contract_address,
                "getValidatorBLSPublicKey(address)",
                vec![
                    validator_address.into(),
                ],
            ).await.map_err(Error::EthereumClient)?;
            
            // Verify using BLS
            return self.client.verify_bls_signature(
                signature, 
                message,
                public_key.to_vec(),
            ).await.map_err(|e| Error::Verification(format!("BLS verification failed: {}", e)));
        }
        
        // Fall back to ECDSA
        let result = self.client.call_contract::<bool>(
            self.contract_address,
            "verifyValidatorSignature(address,bytes,bytes)",
            vec![
                validator_address.into(),
                Bytes::from(message).into(),
                Bytes::from(signature).into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(result)
    }
}

impl ComplianceClient {
    /// Helper method to check if EIP-2537 is supported by the client
    fn supports_eip_2537(&self) -> bool {
        // In a real implementation, this would check the client's capabilities
        // For now, let's assume it's not supported by default
        false
    }
} 