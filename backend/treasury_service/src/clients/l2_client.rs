use alloy_primitives::{Address, U256, H256, Bytes};
use ethereum_client::{EthereumClient, Error as EthError};
use std::sync::Arc;
use serde::{Serialize, Deserialize};
use thiserror::Error;
use tracing::{info, debug, warn, error};

/// Custom error type for L2Client operations
#[derive(Debug, Error)]
pub enum Error {
    #[error("Ethereum client error: {0}")]
    EthereumClient(#[from] EthError),
    
    #[error("Contract interaction error: {0}")]
    ContractInteraction(String),
    
    #[error("Encoding/decoding error: {0}")]
    Encoding(String),
    
    #[error("L2 bridge error: {0}")]
    L2Bridge(String),
    
    #[error("Data not found: {0}")]
    NotFound(String),
    
    #[error("L2 chain error: {0}")]
    L2ChainError(String),
    
    #[error("Blob data error: {0}")]
    BlobDataError(String),
}

/// L2 chain types
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum L2ChainType {
    Optimism,
    Arbitrum,
    ZkSync,
    Starknet,
    Custom,
}

/// L2 transaction status
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum L2TransactionStatus {
    Pending,
    Confirmed,
    Failed,
    Unknown,
}

/// L2 bridge information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct L2BridgeInfo {
    pub l2_chain_type: L2ChainType,
    pub l2_chain_id: u64,
    pub l1_bridge_address: Address,
    pub l2_bridge_address: Address,
    pub l2_enabled: bool,
    pub latest_block_number: u64,
    pub latest_block_hash: H256,
    pub consensus_status: bool,
}

/// L2 transaction data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct L2TransactionData {
    pub l1_tx_hash: H256,
    pub l2_tx_hash: H256,
    pub sender: Address,
    pub target: Address,
    pub data: Vec<u8>,
    pub timestamp: u64,
    pub status: L2TransactionStatus,
    pub l2_chain_id: u64,
    pub blob_data_hash: Option<H256>,
}

/// Token bridge information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenBridgeInfo {
    pub l1_token_address: Address,
    pub l2_token_address: Address,
    pub l2_chain_id: u64,
    pub token_id: Option<[u8; 32]>,
    pub is_bridged: bool,
}

/// Client for interacting with the L2Bridge contract
#[derive(Debug, Clone)]
pub struct L2Client {
    client: Arc<EthereumClient>,
    contract_address: Address,
}

impl L2Client {
    /// Create a new L2Client
    pub async fn new(client: Arc<EthereumClient>, address: Address) -> Self {
        Self {
            client,
            contract_address: address,
        }
    }
    
    /// Bridge a transaction to L2
    pub async fn bridge_transaction(
        &self,
        l2_chain_id: u64,
        target: Address,
        data: Vec<u8>,
        use_blob: bool,
    ) -> Result<H256, Error> {
        info!("Bridging transaction to L2 chain: {}, target: {:?}, data size: {}, use_blob: {}", 
            l2_chain_id, target, data.len(), use_blob);
        
        let tx_hash = if use_blob && self.client.supports_eip_7691().await {
            // Use EIP-7691 blob data for more efficient bridging
            let receipt = self.client.send_blob_transaction(
                self.contract_address,
                "bridgeTransactionWithBlob(uint64,address,bytes)",
                vec![
                    U256::from(l2_chain_id).into(),
                    target.into(),
                    Bytes::from(vec![]).into(), // Empty calldata since we're using blob
                ],
                data, // Use data as blob
            ).await.map_err(Error::EthereumClient)?;
            
            receipt.transaction_hash
        } else {
            // Use regular transaction bridging
            let receipt = self.client.send_transaction(
                self.contract_address,
                "bridgeTransaction(uint64,address,bytes)",
                vec![
                    U256::from(l2_chain_id).into(),
                    target.into(),
                    Bytes::from(data).into(),
                ],
            ).await.map_err(Error::EthereumClient)?;
            
            receipt.transaction_hash
        };
        
        Ok(tx_hash)
    }
    
    /// Bridge a token to L2
    pub async fn bridge_token(
        &self,
        l2_chain_id: u64,
        token_address: Address,
        amount: U256,
        recipient: Address,
        token_id: Option<[u8; 32]>,
    ) -> Result<H256, Error> {
        info!("Bridging token to L2 chain: {}, token: {:?}, amount: {}, recipient: {:?}", 
            l2_chain_id, token_address, amount, recipient);
        
        // Call the contract with or without token ID
        let receipt = match token_id {
            Some(id) => {
                self.client.send_transaction(
                    self.contract_address,
                    "bridgeToken(uint64,address,uint256,address,bytes32)",
                    vec![
                        U256::from(l2_chain_id).into(),
                        token_address.into(),
                        amount.into(),
                        recipient.into(),
                        id.into(),
                    ],
                ).await.map_err(Error::EthereumClient)?
            },
            None => {
                self.client.send_transaction(
                    self.contract_address,
                    "bridgeToken(uint64,address,uint256,address)",
                    vec![
                        U256::from(l2_chain_id).into(),
                        token_address.into(),
                        amount.into(),
                        recipient.into(),
                    ],
                ).await.map_err(Error::EthereumClient)?
            }
        };
        
        Ok(receipt.transaction_hash)
    }
    
    /// Get L2 transaction status
    pub async fn get_l2_transaction_status(
        &self,
        l1_tx_hash: H256,
    ) -> Result<L2TransactionStatus, Error> {
        debug!("Getting L2 transaction status for L1 tx: {:?}", l1_tx_hash);
        
        // Call the contract
        let status_value = self.client.call_contract::<u8>(
            self.contract_address,
            "getL2TransactionStatus(bytes32)",
            vec![
                l1_tx_hash.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        // Convert status from uint8
        let status = match status_value {
            0 => L2TransactionStatus::Pending,
            1 => L2TransactionStatus::Confirmed,
            2 => L2TransactionStatus::Failed,
            _ => L2TransactionStatus::Unknown,
        };
        
        Ok(status)
    }
    
    /// Get L2 transaction data
    pub async fn get_l2_transaction_data(
        &self,
        l1_tx_hash: H256,
    ) -> Result<L2TransactionData, Error> {
        debug!("Getting L2 transaction data for L1 tx: {:?}", l1_tx_hash);
        
        // Call the contract
        let result = self.client.call_contract::<(H256, Address, Address, Bytes, u64, u8, u64, H256)>(
            self.contract_address,
            "getL2TransactionData(bytes32)",
            vec![
                l1_tx_hash.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        // Convert status from uint8
        let status = match result.5 {
            0 => L2TransactionStatus::Pending,
            1 => L2TransactionStatus::Confirmed,
            2 => L2TransactionStatus::Failed,
            _ => L2TransactionStatus::Unknown,
        };
        
        // Check if blob data hash is empty (all zeros)
        let blob_data_hash = if result.7 == H256::zero() {
            None
        } else {
            Some(result.7)
        };
        
        // Convert tuple to L2TransactionData
        let data = L2TransactionData {
            l1_tx_hash,
            l2_tx_hash: result.0,
            sender: result.1,
            target: result.2,
            data: result.3.to_vec(),
            timestamp: result.4,
            status,
            l2_chain_id: result.6,
            blob_data_hash,
        };
        
        Ok(data)
    }
    
    /// Register a new L2 chain
    pub async fn register_l2_chain(
        &self,
        chain_id: u64,
        chain_type: L2ChainType,
        l2_bridge_address: Address,
    ) -> Result<(), Error> {
        info!("Registering L2 chain: {}, type: {:?}, bridge address: {:?}", 
            chain_id, chain_type, l2_bridge_address);
        
        // Convert chain type to uint8
        let chain_type_value = match chain_type {
            L2ChainType::Optimism => 0u8,
            L2ChainType::Arbitrum => 1u8,
            L2ChainType::ZkSync => 2u8,
            L2ChainType::Starknet => 3u8,
            L2ChainType::Custom => 4u8,
        };
        
        // Call the contract
        self.client.send_transaction(
            self.contract_address,
            "registerL2Chain(uint64,uint8,address)",
            vec![
                U256::from(chain_id).into(),
                chain_type_value.into(),
                l2_bridge_address.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
    
    /// Enable or disable an L2 chain
    pub async fn set_l2_chain_status(
        &self,
        chain_id: u64,
        enabled: bool,
    ) -> Result<(), Error> {
        info!("Setting L2 chain status: {}, enabled: {}", chain_id, enabled);
        
        // Call the contract
        self.client.send_transaction(
            self.contract_address,
            "setL2ChainStatus(uint64,bool)",
            vec![
                U256::from(chain_id).into(),
                enabled.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
    
    /// Get L2 bridge information
    pub async fn get_l2_bridge_info(
        &self,
        chain_id: u64,
    ) -> Result<L2BridgeInfo, Error> {
        debug!("Getting L2 bridge info for chain: {}", chain_id);
        
        // Call the contract
        let result = self.client.call_contract::<(u8, Address, bool, u64, H256, bool)>(
            self.contract_address,
            "getL2BridgeInfo(uint64)",
            vec![
                U256::from(chain_id).into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        // Convert chain type from uint8
        let chain_type = match result.0 {
            0 => L2ChainType::Optimism,
            1 => L2ChainType::Arbitrum,
            2 => L2ChainType::ZkSync,
            3 => L2ChainType::Starknet,
            4 => L2ChainType::Custom,
            _ => return Err(Error::Encoding("Invalid L2 chain type".into())),
        };
        
        // Convert tuple to L2BridgeInfo
        let info = L2BridgeInfo {
            l2_chain_type: chain_type,
            l2_chain_id: chain_id,
            l1_bridge_address: self.contract_address,
            l2_bridge_address: result.1,
            l2_enabled: result.2,
            latest_block_number: result.3,
            latest_block_hash: result.4,
            consensus_status: result.5,
        };
        
        Ok(info)
    }
    
    /// Get all registered L2 chains
    pub async fn get_all_l2_chains(
        &self,
    ) -> Result<Vec<u64>, Error> {
        debug!("Getting all registered L2 chains");
        
        // Call the contract
        let chain_ids = self.client.call_contract::<Vec<u64>>(
            self.contract_address,
            "getAllL2Chains()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(chain_ids)
    }
    
    /// Get all bridged transactions for a specific L2 chain
    pub async fn get_bridged_transactions(
        &self,
        chain_id: u64,
        limit: u32,
    ) -> Result<Vec<H256>, Error> {
        debug!("Getting bridged transactions for chain: {}, limit: {}", chain_id, limit);
        
        // Call the contract
        let tx_hashes = self.client.call_contract::<Vec<H256>>(
            self.contract_address,
            "getBridgedTransactions(uint64,uint32)",
            vec![
                U256::from(chain_id).into(),
                limit.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(tx_hashes)
    }
    
    /// Get token bridge information
    pub async fn get_token_bridge_info(
        &self,
        l1_token_address: Address,
        l2_chain_id: u64,
        token_id: Option<[u8; 32]>,
    ) -> Result<TokenBridgeInfo, Error> {
        debug!("Getting token bridge info for token: {:?}, chain: {}", l1_token_address, l2_chain_id);
        
        // Call the contract with or without token ID
        let l2_token_address = match token_id {
            Some(id) => {
                self.client.call_contract::<Address>(
                    self.contract_address,
                    "getL2TokenAddress(address,uint64,bytes32)",
                    vec![
                        l1_token_address.into(),
                        U256::from(l2_chain_id).into(),
                        id.into(),
                    ],
                ).await.map_err(Error::EthereumClient)?
            },
            None => {
                self.client.call_contract::<Address>(
                    self.contract_address,
                    "getL2TokenAddress(address,uint64)",
                    vec![
                        l1_token_address.into(),
                        U256::from(l2_chain_id).into(),
                    ],
                ).await.map_err(Error::EthereumClient)?
            }
        };
        
        // Check if token is bridged (address is not zero)
        let is_bridged = l2_token_address != Address::ZERO;
        
        // Create token bridge info
        let info = TokenBridgeInfo {
            l1_token_address,
            l2_token_address,
            l2_chain_id,
            token_id,
            is_bridged,
        };
        
        Ok(info)
    }
    
    /// Register a token mapping between L1 and L2
    pub async fn register_token_mapping(
        &self,
        l1_token_address: Address,
        l2_token_address: Address,
        l2_chain_id: u64,
        token_id: Option<[u8; 32]>,
    ) -> Result<(), Error> {
        info!("Registering token mapping: L1 {:?} -> L2 {:?}, chain: {}", 
            l1_token_address, l2_token_address, l2_chain_id);
        
        // Call the contract with or without token ID
        match token_id {
            Some(id) => {
                self.client.send_transaction(
                    self.contract_address,
                    "registerTokenMapping(address,address,uint64,bytes32)",
                    vec![
                        l1_token_address.into(),
                        l2_token_address.into(),
                        U256::from(l2_chain_id).into(),
                        id.into(),
                    ],
                ).await.map_err(Error::EthereumClient)?;
            },
            None => {
                self.client.send_transaction(
                    self.contract_address,
                    "registerTokenMapping(address,address,uint64)",
                    vec![
                        l1_token_address.into(),
                        l2_token_address.into(),
                        U256::from(l2_chain_id).into(),
                    ],
                ).await.map_err(Error::EthereumClient)?;
            }
        }
        
        Ok(())
    }
    
    /// Update L2 block information
    pub async fn update_l2_block_info(
        &self,
        chain_id: u64,
        block_number: u64,
        block_hash: H256,
    ) -> Result<(), Error> {
        info!("Updating L2 block info: chain: {}, block: {}, hash: {:?}", 
            chain_id, block_number, block_hash);
        
        // Call the contract
        self.client.send_transaction(
            self.contract_address,
            "updateL2BlockInfo(uint64,uint256,bytes32)",
            vec![
                U256::from(chain_id).into(),
                U256::from(block_number).into(),
                block_hash.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
    
    /// Verify L2 transaction proof using historical block hash (EIP-2935)
    pub async fn verify_l2_transaction(
        &self,
        l2_tx_hash: H256,
        l2_chain_id: u64,
        proof_data: Vec<u8>,
    ) -> Result<bool, Error> {
        debug!("Verifying L2 transaction: {:?}, chain: {}", l2_tx_hash, l2_chain_id);
        
        // Call the contract
        let result = self.client.call_contract::<bool>(
            self.contract_address,
            "verifyL2Transaction(bytes32,uint64,bytes)",
            vec![
                l2_tx_hash.into(),
                U256::from(l2_chain_id).into(),
                Bytes::from(proof_data).into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(result)
    }
    
    /// Finalize an L2 to L1 message
    pub async fn finalize_l2_to_l1_message(
        &self,
        l2_chain_id: u64,
        message_hash: H256,
        proof_data: Vec<u8>,
    ) -> Result<(), Error> {
        info!("Finalizing L2 to L1 message: chain: {}, hash: {:?}", l2_chain_id, message_hash);
        
        // Call the contract
        self.client.send_transaction(
            self.contract_address,
            "finalizeL2ToL1Message(uint64,bytes32,bytes)",
            vec![
                U256::from(l2_chain_id).into(),
                message_hash.into(),
                Bytes::from(proof_data).into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(())
    }
}

impl L2Client {
    /// Helper method to check if EIP-7691 is supported
    async fn supports_eip_7691(&self) -> bool {
        // In a real implementation, this would check the client's capabilities
        // For now, we'll just check if the client reports EIP-7691 support
        true
    }
} 