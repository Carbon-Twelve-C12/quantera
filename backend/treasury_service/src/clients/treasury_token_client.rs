use alloy_primitives::{Address, U256, H256, Bytes};
use ethereum_client::{EthereumClient, Error as EthError};
use std::sync::Arc;
use serde::{Serialize, Deserialize};
use thiserror::Error;
use tracing::{info, debug, warn, error};

/// Custom error type for TreasuryTokenClient operations
#[derive(Debug, Error)]
pub enum Error {
    #[error("Ethereum client error: {0}")]
    EthereumClient(#[from] EthError),
    
    #[error("Contract interaction error: {0}")]
    ContractInteraction(String),
    
    #[error("Encoding/decoding error: {0}")]
    Encoding(String),
    
    #[error("Token error: {0}")]
    Token(String),
    
    #[error("Yield distribution error: {0}")]
    YieldDistribution(String),
    
    #[error("Unauthorized operation: {0}")]
    Unauthorized(String),
    
    #[error("Invalid parameter: {0}")]
    InvalidParameter(String),
}

/// Token partition type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenPartition {
    pub partition_id: [u8; 32],
    pub name: String,
    pub total_supply: U256,
    pub transferable: bool,
    pub documents_required: bool,
}

/// Token document type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenDocument {
    pub document_id: [u8; 32],
    pub name: String,
    pub uri: String,
    pub hash: H256,
    pub required: bool,
    pub valid_from: u64,
    pub valid_to: Option<u64>,
}

/// Token balance info
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenBalance {
    pub partition_id: [u8; 32],
    pub balance: U256,
    pub pending_yield: U256,
    pub restricted_balance: U256,
    pub last_yield_claim_time: u64,
}

/// Yield distribution event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YieldDistribution {
    pub distribution_id: u64,
    pub amount: U256,
    pub timestamp: u64,
    pub yield_rate: u64,  // In basis points
    pub partition_id: Option<[u8; 32]>,
    pub distribution_end_time: u64,
}

/// Client for interacting with the TreasuryToken contract
#[derive(Debug, Clone)]
pub struct TreasuryTokenClient {
    client: Arc<EthereumClient>,
    contract_address: Address,
}

impl TreasuryTokenClient {
    /// Create a new TreasuryTokenClient
    pub async fn new(client: Arc<EthereumClient>, address: Address) -> Self {
        Self {
            client,
            contract_address: address,
        }
    }
    
    /// Get token information
    pub async fn get_token_info(&self) -> Result<(String, String, U256, Address), Error> {
        debug!("Getting token info for: {:?}", self.contract_address);
        
        // Get name
        let name = self.client.call_contract::<String>(
            self.contract_address,
            "name()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        // Get symbol
        let symbol = self.client.call_contract::<String>(
            self.contract_address,
            "symbol()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        // Get total supply
        let total_supply = self.client.call_contract::<U256>(
            self.contract_address,
            "totalSupply()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        // Get issuer
        let issuer = self.client.call_contract::<Address>(
            self.contract_address,
            "issuer()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok((name, symbol, total_supply, issuer))
    }
    
    /// Get token decimals
    pub async fn get_decimals(&self) -> Result<u8, Error> {
        debug!("Getting token decimals");
        
        let decimals = self.client.call_contract::<u8>(
            self.contract_address,
            "decimals()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(decimals)
    }
    
    /// Get token balance for an account
    pub async fn balance_of(&self, account: Address) -> Result<U256, Error> {
        debug!("Getting token balance for account: {:?}", account);
        
        let balance = self.client.call_contract::<U256>(
            self.contract_address,
            "balanceOf(address)",
            vec![
                account.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(balance)
    }
    
    /// Get token balance for a specific partition
    pub async fn balance_of_by_partition(
        &self,
        account: Address,
        partition_id: [u8; 32],
    ) -> Result<U256, Error> {
        debug!("Getting token balance for account: {:?}, partition: {:?}", account, partition_id);
        
        let balance = self.client.call_contract::<U256>(
            self.contract_address,
            "balanceOfByPartition(bytes32,address)",
            vec![
                partition_id.into(),
                account.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(balance)
    }
    
    /// Get full token balance info for an account and partition
    pub async fn get_balance_info(
        &self,
        account: Address,
        partition_id: [u8; 32],
    ) -> Result<TokenBalance, Error> {
        debug!("Getting token balance info for account: {:?}, partition: {:?}", account, partition_id);
        
        let result = self.client.call_contract::<(U256, U256, U256, u64)>(
            self.contract_address,
            "getBalanceInfo(bytes32,address)",
            vec![
                partition_id.into(),
                account.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        let balance_info = TokenBalance {
            partition_id,
            balance: result.0,
            pending_yield: result.1,
            restricted_balance: result.2,
            last_yield_claim_time: result.3,
        };
        
        Ok(balance_info)
    }
    
    /// Get all partitions for an account
    pub async fn partitions_of(
        &self,
        account: Address,
    ) -> Result<Vec<[u8; 32]>, Error> {
        debug!("Getting partitions for account: {:?}", account);
        
        let partitions = self.client.call_contract::<Vec<[u8; 32]>>(
            self.contract_address,
            "partitionsOf(address)",
            vec![
                account.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(partitions)
    }
    
    /// Get partition details
    pub async fn get_partition_details(
        &self,
        partition_id: [u8; 32],
    ) -> Result<TokenPartition, Error> {
        debug!("Getting partition details for: {:?}", partition_id);
        
        let result = self.client.call_contract::<(String, U256, bool, bool)>(
            self.contract_address,
            "getPartitionDetails(bytes32)",
            vec![
                partition_id.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        let partition = TokenPartition {
            partition_id,
            name: result.0,
            total_supply: result.1,
            transferable: result.2,
            documents_required: result.3,
        };
        
        Ok(partition)
    }
    
    /// Get all partitions
    pub async fn get_all_partitions(&self) -> Result<Vec<[u8; 32]>, Error> {
        debug!("Getting all partitions");
        
        let partitions = self.client.call_contract::<Vec<[u8; 32]>>(
            self.contract_address,
            "getAllPartitions()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(partitions)
    }
    
    /// Create a new partition
    pub async fn create_partition(
        &self,
        name: &str,
        transferable: bool,
        documents_required: bool,
    ) -> Result<[u8; 32], Error> {
        info!("Creating new partition: {}, transferable: {}, documents required: {}", 
            name, transferable, documents_required);
        
        let result = self.client.call_contract::<[u8; 32]>(
            self.contract_address,
            "createPartition(string,bool,bool)",
            vec![
                name.into(),
                transferable.into(),
                documents_required.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(result)
    }
    
    /// Issue tokens to an account in a specific partition
    pub async fn issue_by_partition(
        &self,
        partition_id: [u8; 32],
        to: Address,
        amount: U256,
        data: Vec<u8>,
    ) -> Result<(), Error> {
        info!("Issuing {} tokens to {:?} in partition: {:?}", amount, to, partition_id);
        
        self.client.send_transaction(
            self.contract_address,
            "issueByPartition(bytes32,address,uint256,bytes)",
            vec![
                partition_id.into(),
                to.into(),
                amount.into(),
                Bytes::from(data).into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
    
    /// Redeem tokens from a specific partition
    pub async fn redeem_by_partition(
        &self,
        partition_id: [u8; 32],
        amount: U256,
        data: Vec<u8>,
    ) -> Result<(), Error> {
        info!("Redeeming {} tokens from partition: {:?}", amount, partition_id);
        
        self.client.send_transaction(
            self.contract_address,
            "redeemByPartition(bytes32,uint256,bytes)",
            vec![
                partition_id.into(),
                amount.into(),
                Bytes::from(data).into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
    
    /// Redeem tokens from a specific account and partition (by operator)
    pub async fn operator_redeem_by_partition(
        &self,
        partition_id: [u8; 32],
        from: Address,
        amount: U256,
        data: Vec<u8>,
        operator_data: Vec<u8>,
    ) -> Result<(), Error> {
        info!("Operator redeeming {} tokens from {:?} in partition: {:?}", amount, from, partition_id);
        
        self.client.send_transaction(
            self.contract_address,
            "operatorRedeemByPartition(bytes32,address,uint256,bytes,bytes)",
            vec![
                partition_id.into(),
                from.into(),
                amount.into(),
                Bytes::from(data).into(),
                Bytes::from(operator_data).into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
    
    /// Transfer tokens to another account within a specific partition
    pub async fn transfer_by_partition(
        &self,
        partition_id: [u8; 32],
        to: Address,
        amount: U256,
        data: Vec<u8>,
    ) -> Result<[u8; 32], Error> {
        info!("Transferring {} tokens to {:?} in partition: {:?}", amount, to, partition_id);
        
        let result = self.client.call_contract::<[u8; 32]>(
            self.contract_address,
            "transferByPartition(bytes32,address,uint256,bytes)",
            vec![
                partition_id.into(),
                to.into(),
                amount.into(),
                Bytes::from(data).into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(result)
    }
    
    /// Transfer tokens as an operator
    pub async fn operator_transfer_by_partition(
        &self,
        partition_id: [u8; 32],
        from: Address,
        to: Address,
        amount: U256,
        data: Vec<u8>,
        operator_data: Vec<u8>,
    ) -> Result<[u8; 32], Error> {
        info!("Operator transferring {} tokens from {:?} to {:?} in partition: {:?}", 
            amount, from, to, partition_id);
        
        let result = self.client.call_contract::<[u8; 32]>(
            self.contract_address,
            "operatorTransferByPartition(bytes32,address,address,uint256,bytes,bytes)",
            vec![
                partition_id.into(),
                from.into(),
                to.into(),
                amount.into(),
                Bytes::from(data).into(),
                Bytes::from(operator_data).into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(result)
    }
    
    /// Authorize an operator for all partitions
    pub async fn authorize_operator(
        &self,
        operator: Address,
    ) -> Result<(), Error> {
        info!("Authorizing operator: {:?} for all partitions", operator);
        
        self.client.send_transaction(
            self.contract_address,
            "authorizeOperator(address)",
            vec![
                operator.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
    
    /// Revoke operator status for all partitions
    pub async fn revoke_operator(
        &self,
        operator: Address,
    ) -> Result<(), Error> {
        info!("Revoking operator: {:?} for all partitions", operator);
        
        self.client.send_transaction(
            self.contract_address,
            "revokeOperator(address)",
            vec![
                operator.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
    
    /// Authorize an operator for a specific partition
    pub async fn authorize_operator_by_partition(
        &self,
        partition_id: [u8; 32],
        operator: Address,
    ) -> Result<(), Error> {
        info!("Authorizing operator: {:?} for partition: {:?}", operator, partition_id);
        
        self.client.send_transaction(
            self.contract_address,
            "authorizeOperatorByPartition(bytes32,address)",
            vec![
                partition_id.into(),
                operator.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
    
    /// Revoke operator status for a specific partition
    pub async fn revoke_operator_by_partition(
        &self,
        partition_id: [u8; 32],
        operator: Address,
    ) -> Result<(), Error> {
        info!("Revoking operator: {:?} for partition: {:?}", operator, partition_id);
        
        self.client.send_transaction(
            self.contract_address,
            "revokeOperatorByPartition(bytes32,address)",
            vec![
                partition_id.into(),
                operator.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
    
    /// Check if an address is an operator for a token holder
    pub async fn is_operator_for(
        &self,
        operator: Address,
        token_holder: Address,
    ) -> Result<bool, Error> {
        debug!("Checking if {:?} is operator for {:?}", operator, token_holder);
        
        let result = self.client.call_contract::<bool>(
            self.contract_address,
            "isOperatorFor(address,address)",
            vec![
                operator.into(),
                token_holder.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(result)
    }
    
    /// Check if an address is an operator for a specific partition
    pub async fn is_operator_for_partition(
        &self,
        partition_id: [u8; 32],
        operator: Address,
        token_holder: Address,
    ) -> Result<bool, Error> {
        debug!("Checking if {:?} is operator for {:?} in partition: {:?}", 
            operator, token_holder, partition_id);
        
        let result = self.client.call_contract::<bool>(
            self.contract_address,
            "isOperatorForPartition(bytes32,address,address)",
            vec![
                partition_id.into(),
                operator.into(),
                token_holder.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(result)
    }
    
    /// Set document details for the token
    pub async fn set_document(
        &self,
        name: &str,
        uri: &str,
        document_hash: H256,
        required: bool,
        valid_from: u64,
        valid_to: Option<u64>,
    ) -> Result<[u8; 32], Error> {
        info!("Setting document: {}, URI: {}, required: {}", name, uri, required);
        
        // Call the contract with or without valid_to
        let document_id = match valid_to {
            Some(to) => {
                self.client.call_contract::<[u8; 32]>(
                    self.contract_address,
                    "setDocument(string,string,bytes32,bool,uint256,uint256)",
                    vec![
                        name.into(),
                        uri.into(),
                        document_hash.into(),
                        required.into(),
                        U256::from(valid_from).into(),
                        U256::from(to).into(),
                    ],
                ).await.map_err(Error::EthereumClient)?
            },
            None => {
                self.client.call_contract::<[u8; 32]>(
                    self.contract_address,
                    "setDocument(string,string,bytes32,bool,uint256)",
                    vec![
                        name.into(),
                        uri.into(),
                        document_hash.into(),
                        required.into(),
                        U256::from(valid_from).into(),
                    ],
                ).await.map_err(Error::EthereumClient)?
            }
        };
        
        Ok(document_id)
    }
    
    /// Get document details
    pub async fn get_document(
        &self,
        document_id: [u8; 32],
    ) -> Result<TokenDocument, Error> {
        debug!("Getting document: {:?}", document_id);
        
        let result = self.client.call_contract::<(String, String, H256, bool, u64, u64)>(
            self.contract_address,
            "getDocument(bytes32)",
            vec![
                document_id.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        // Check if valid_to is 0 (indefinite)
        let valid_to = if result.5 == 0 {
            None
        } else {
            Some(result.5)
        };
        
        let document = TokenDocument {
            document_id,
            name: result.0,
            uri: result.1,
            hash: result.2,
            required: result.3,
            valid_from: result.4,
            valid_to,
        };
        
        Ok(document)
    }
    
    /// Get all document IDs
    pub async fn get_all_documents(&self) -> Result<Vec<[u8; 32]>, Error> {
        debug!("Getting all documents");
        
        let documents = self.client.call_contract::<Vec<[u8; 32]>>(
            self.contract_address,
            "getAllDocuments()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(documents)
    }
    
    /// Distribute yield to token holders
    pub async fn distribute_yield(
        &self,
        amount: U256,
        partition_id: Option<[u8; 32]>,
        distribution_end_time: u64,
    ) -> Result<u64, Error> {
        info!("Distributing yield: {}, end time: {}", amount, distribution_end_time);
        
        // Call the contract with or without partition ID
        let distribution_id = match partition_id {
            Some(id) => {
                self.client.call_contract::<u64>(
                    self.contract_address,
                    "distributeYield(uint256,bytes32,uint256)",
                    vec![
                        amount.into(),
                        id.into(),
                        U256::from(distribution_end_time).into(),
                    ],
                ).await.map_err(Error::EthereumClient)?
            },
            None => {
                self.client.call_contract::<u64>(
                    self.contract_address,
                    "distributeYield(uint256,uint256)",
                    vec![
                        amount.into(),
                        U256::from(distribution_end_time).into(),
                    ],
                ).await.map_err(Error::EthereumClient)?
            }
        };
        
        Ok(distribution_id)
    }
    
    /// Claim yield for a specific account
    pub async fn claim_yield(
        &self,
        account: Address,
    ) -> Result<U256, Error> {
        info!("Claiming yield for account: {:?}", account);
        
        let claimed_amount = self.client.call_contract::<U256>(
            self.contract_address,
            "claimYield(address)",
            vec![
                account.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(claimed_amount)
    }
    
    /// Get yield distribution details
    pub async fn get_yield_distribution(
        &self,
        distribution_id: u64,
    ) -> Result<YieldDistribution, Error> {
        debug!("Getting yield distribution: {}", distribution_id);
        
        let result = self.client.call_contract::<(U256, u64, u64, [u8; 32], u64)>(
            self.contract_address,
            "getYieldDistribution(uint256)",
            vec![
                U256::from(distribution_id).into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        // Check if partition ID is empty (0)
        let partition_id = if result.3 == [0u8; 32] {
            None
        } else {
            Some(result.3)
        };
        
        let distribution = YieldDistribution {
            distribution_id,
            amount: result.0,
            timestamp: result.1,
            yield_rate: result.2,
            partition_id,
            distribution_end_time: result.4,
        };
        
        Ok(distribution)
    }
    
    /// Get all yield distributions
    pub async fn get_all_yield_distributions(&self) -> Result<Vec<u64>, Error> {
        debug!("Getting all yield distributions");
        
        let distributions = self.client.call_contract::<Vec<u64>>(
            self.contract_address,
            "getAllYieldDistributions()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(distributions)
    }
    
    /// Get pending yield for an account
    pub async fn get_pending_yield(
        &self,
        account: Address,
    ) -> Result<U256, Error> {
        debug!("Getting pending yield for account: {:?}", account);
        
        let pending_yield = self.client.call_contract::<U256>(
            self.contract_address,
            "getPendingYield(address)",
            vec![
                account.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(pending_yield)
    }
    
    /// Pause all token transfers
    pub async fn pause(&self) -> Result<(), Error> {
        info!("Pausing token transfers");
        
        self.client.send_transaction(
            self.contract_address,
            "pause()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
    
    /// Unpause token transfers
    pub async fn unpause(&self) -> Result<(), Error> {
        info!("Unpausing token transfers");
        
        self.client.send_transaction(
            self.contract_address,
            "unpause()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
    
    /// Check if token transfers are paused
    pub async fn is_paused(&self) -> Result<bool, Error> {
        debug!("Checking if token transfers are paused");
        
        let paused = self.client.call_contract::<bool>(
            self.contract_address,
            "paused()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(paused)
    }
    
    /// Set the compliance module address
    pub async fn set_compliance_module(
        &self,
        module_address: Address,
    ) -> Result<(), Error> {
        info!("Setting compliance module address: {:?}", module_address);
        
        self.client.send_transaction(
            self.contract_address,
            "setComplianceModule(address)",
            vec![
                module_address.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
    
    /// Get the compliance module address
    pub async fn get_compliance_module(&self) -> Result<Address, Error> {
        debug!("Getting compliance module address");
        
        let module_address = self.client.call_contract::<Address>(
            self.contract_address,
            "complianceModule()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(module_address)
    }
} 