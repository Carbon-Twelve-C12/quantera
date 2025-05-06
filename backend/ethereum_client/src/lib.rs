use alloy_primitives::{Address, U256, H256};
use alloy_provider::Provider;
use alloy_signer::LocalWallet;
use alloy_contract::{Tokenize, Token, FromEvent};
use std::collections::HashMap;
use std::sync::Arc;
use thiserror::Error;
use tracing::{info, error, warn, debug};

/// Custom error type for EthereumClient operations
#[derive(Debug, Error)]
pub enum Error {
    #[error("Provider error: {0}")]
    ProviderError(String),
    
    #[error("Wallet error: {0}")]
    WalletError(String),
    
    #[error("Contract error: {0}")]
    ContractError(String),
    
    #[error("Encoding error: {0}")]
    EncodingError(String),
    
    #[error("Transaction error: {0}")]
    TransactionError(String),
    
    #[error("Blob data error: {0}")]
    BlobDataError(String),
    
    #[error("Smart account error: {0}")]
    SmartAccountError(String),
    
    #[error("BLS signature error: {0}")]
    BLSSignatureError(String),
    
    #[error("Invalid state: {0}")]
    InvalidState(String),
}

/// Transaction receipt returned after sending transactions
#[derive(Debug, Clone)]
pub struct TransactionReceipt {
    pub transaction_hash: H256,
    pub block_number: u64,
    pub block_hash: H256,
    pub contract_address: Option<Address>,
    pub gas_used: U256,
    pub status: bool,
    pub logs: Vec<Log>,
}

/// Log entry from transaction receipt
#[derive(Debug, Clone)]
pub struct Log {
    pub address: Address,
    pub topics: Vec<H256>,
    pub data: Vec<u8>,
    pub block_number: u64,
    pub transaction_hash: H256,
    pub log_index: u32,
}

/// Client for interacting with Ethereum blockchain
pub struct EthereumClient {
    provider: Arc<Provider>,
    wallet: LocalWallet,
    chain_id: u64,
    supports_pectra: bool,
}

impl EthereumClient {
    /// Create a new EthereumClient
    pub async fn new(rpc_url: &str, private_key: &str, chain_id: u64) -> Result<Self, Error> {
        info!("Initializing EthereumClient with chain_id: {}", chain_id);
        
        // Initialize provider
        let provider = Provider::try_from(rpc_url)
            .map_err(|e| Error::ProviderError(e.to_string()))?;
        
        // Initialize wallet from private key
        let wallet = LocalWallet::from_private_key_hex(private_key)
            .map_err(|e| Error::WalletError(format!("Failed to create wallet: {}", e)))?;
        
        // Check if the network supports Pectra
        let supports_pectra = Self::check_pectra_support(&provider).await
            .unwrap_or(false);
        
        info!("EthereumClient initialized. Pectra support: {}", supports_pectra);
        
        Ok(Self {
            provider: Arc::new(provider),
            wallet,
            chain_id,
            supports_pectra,
        })
    }
    
    /// Check if the connected network supports Pectra EIPs
    async fn check_pectra_support(provider: &Provider) -> Result<bool, Error> {
        // Try to detect EIP-7702 support (smart accounts)
        let result = provider.request::<_, String>(
            "eth_supportedEIPs",
            [vec!["7702", "7691", "2537", "2935"]]
        ).await;
        
        match result {
            Ok(supported_eips) => {
                debug!("Supported EIPs: {}", supported_eips);
                // If at least one Pectra EIP is supported
                Ok(supported_eips.contains("7702") || 
                   supported_eips.contains("7691") ||
                   supported_eips.contains("2537") ||
                   supported_eips.contains("2935"))
            },
            Err(_) => {
                // Fallback to checking chain ID for known Pectra-enabled networks
                let pectra_chains = vec![1, 11155111, 5]; // Mainnet, Sepolia, Goerli
                Ok(pectra_chains.contains(&provider.get_chain_id().await.unwrap_or(0)))
            }
        }
    }
    
    /// Deploy a contract to the blockchain
    pub async fn deploy_contract(&self, bytecode: Vec<u8>, constructor_args: Vec<u8>) -> Result<Address, Error> {
        info!("Deploying contract");
        
        // Combine bytecode and constructor args
        let mut deploy_data = bytecode;
        deploy_data.extend_from_slice(&constructor_args);
        
        // Create deployment transaction
        let tx_request = self.wallet.sign_transaction(
            deploy_data,
            None, // to (None for contract creation)
            self.chain_id,
            None, // nonce (let the provider determine)
            None, // value (default to 0)
            None, // gas limit (let the provider estimate)
            None, // gas price (let the provider determine)
        ).map_err(|e| Error::TransactionError(format!("Failed to sign deployment transaction: {}", e)))?;
        
        // Send transaction
        let tx_hash = self.provider.send_raw_transaction(tx_request)
            .await
            .map_err(|e| Error::TransactionError(format!("Failed to send deployment transaction: {}", e)))?;
        
        // Wait for transaction receipt
        let receipt = self.provider.get_transaction_receipt(tx_hash)
            .await
            .map_err(|e| Error::TransactionError(format!("Failed to get deployment receipt: {}", e)))?;
        
        // Get contract address from receipt
        let contract_address = receipt.contract_address
            .ok_or_else(|| Error::TransactionError("No contract address in receipt".to_string()))?;
        
        info!("Contract deployed at: {}", contract_address);
        
        Ok(contract_address)
    }
    
    /// Call a contract function (read-only)
    pub async fn call_contract<T: Tokenize>(&self, address: Address, function: &str, args: Vec<Token>) -> Result<T, Error> {
        debug!("Calling contract function: {} at {}", function, address);
        
        // Encode function call
        let calldata = Self::encode_function_call(function, args)
            .map_err(|e| Error::EncodingError(e))?;
        
        // Call contract
        let result = self.provider.call(
            address,
            calldata.clone(),
            None, // Block number (latest)
        ).await.map_err(|e| Error::ContractError(format!("Contract call failed: {}", e)))?;
        
        // Decode result
        let decoded = T::from_tokens(&Token::decode(&result)
            .map_err(|e| Error::EncodingError(format!("Failed to decode result: {}", e)))?)
            .map_err(|e| Error::EncodingError(format!("Failed to convert from tokens: {}", e)))?;
        
        Ok(decoded)
    }
    
    /// Send a transaction to a contract
    pub async fn send_transaction(&self, address: Address, function: &str, args: Vec<Token>) -> Result<TransactionReceipt, Error> {
        info!("Sending transaction to: {} function: {}", address, function);
        
        // Encode function call
        let calldata = Self::encode_function_call(function, args)
            .map_err(|e| Error::EncodingError(e))?;
        
        // Sign transaction
        let tx_request = self.wallet.sign_transaction(
            calldata,
            Some(address),
            self.chain_id,
            None, // nonce
            None, // value
            None, // gas limit
            None, // gas price
        ).map_err(|e| Error::TransactionError(format!("Failed to sign transaction: {}", e)))?;
        
        // Send transaction
        let tx_hash = self.provider.send_raw_transaction(tx_request)
            .await
            .map_err(|e| Error::TransactionError(format!("Failed to send transaction: {}", e)))?;
        
        // Wait for transaction receipt
        let receipt = self.wait_for_transaction_receipt(tx_hash).await?;
        
        if !receipt.status {
            return Err(Error::TransactionError("Transaction reverted".to_string()));
        }
        
        info!("Transaction successful: {}", tx_hash);
        
        Ok(receipt)
    }
    
    /// Get events emitted by a contract
    pub async fn get_events<T: FromEvent>(&self, address: Address, event: &str, from_block: u64) -> Result<Vec<T>, Error> {
        debug!("Getting events: {} from block {}", event, from_block);
        
        // Get event signature
        let event_signature = Self::get_event_signature(event)
            .map_err(|e| Error::EncodingError(e))?;
        
        // Create filter
        let filter = self.provider.new_filter()
            .address(address)
            .event_signature(event_signature)
            .from_block(from_block);
        
        // Get logs
        let logs = filter.logs()
            .await
            .map_err(|e| Error::ContractError(format!("Failed to get logs: {}", e)))?;
        
        // Parse events
        let mut events = Vec::new();
        for log in logs {
            match T::from_log(log) {
                Ok(event) => events.push(event),
                Err(e) => warn!("Failed to parse event: {}", e),
            }
        }
        
        Ok(events)
    }
    
    /// Get account balance
    pub async fn get_balance(&self, address: Address) -> Result<U256, Error> {
        debug!("Getting balance for: {}", address);
        
        let balance = self.provider.get_balance(address, None)
            .await
            .map_err(|e| Error::ProviderError(format!("Failed to get balance: {}", e)))?;
        
        Ok(balance)
    }
    
    /// Get historical block hash (EIP-2935)
    pub async fn get_historical_block_hash(&self, block_number: u64) -> Result<H256, Error> {
        debug!("Getting historical block hash for block: {}", block_number);
        
        if !self.supports_pectra {
            warn!("EIP-2935 not supported, falling back to eth_getBlockByNumber");
            let block = self.provider.get_block(block_number)
                .await
                .map_err(|e| Error::ProviderError(format!("Failed to get block: {}", e)))?;
            
            return Ok(block.hash);
        }
        
        // Use EIP-2935 specific call
        let hash = self.provider.request::<_, H256>(
            "eth_getBlockhash",
            [block_number]
        ).await.map_err(|e| Error::ProviderError(format!("Failed to get historical block hash: {}", e)))?;
        
        Ok(hash)
    }
    
    /// Verify BLS signature (EIP-2537)
    pub async fn verify_bls_signature(&self, signature: Vec<u8>, message: Vec<u8>, public_key: Vec<u8>) -> Result<bool, Error> {
        debug!("Verifying BLS signature");
        
        if !self.supports_pectra {
            return Err(Error::BLSSignatureError("EIP-2537 not supported".to_string()));
        }
        
        // Use EIP-2537 specific call
        let result = self.provider.request::<_, bool>(
            "bls_verifySignature",
            [hex::encode(signature), hex::encode(message), hex::encode(public_key)]
        ).await.map_err(|e| Error::BLSSignatureError(format!("Failed to verify BLS signature: {}", e)))?;
        
        Ok(result)
    }
    
    /// Send blob transaction (EIP-7691)
    pub async fn send_blob_transaction(&self, address: Address, function: &str, args: Vec<Token>, blob_data: Vec<u8>) -> Result<TransactionReceipt, Error> {
        info!("Sending blob transaction to: {} function: {}", address, function);
        
        if !self.supports_pectra {
            return Err(Error::BlobDataError("EIP-7691 not supported".to_string()));
        }
        
        // Encode function call
        let calldata = Self::encode_function_call(function, args)
            .map_err(|e| Error::EncodingError(e))?;
        
        // Create blob transaction
        let blob_tx = self.provider.create_blob_transaction(
            self.wallet.address(),
            address,
            calldata,
            blob_data,
            None, // nonce
            None, // value
            None, // gas limit
            None, // gas price
            None, // blob gas price
        ).map_err(|e| Error::BlobDataError(format!("Failed to create blob transaction: {}", e)))?;
        
        // Sign blob transaction
        let signed_tx = self.wallet.sign_blob_transaction(blob_tx, self.chain_id)
            .map_err(|e| Error::TransactionError(format!("Failed to sign blob transaction: {}", e)))?;
        
        // Send transaction
        let tx_hash = self.provider.send_raw_blob_transaction(signed_tx)
            .await
            .map_err(|e| Error::TransactionError(format!("Failed to send blob transaction: {}", e)))?;
        
        // Wait for transaction receipt
        let receipt = self.wait_for_transaction_receipt(tx_hash).await?;
        
        if !receipt.status {
            return Err(Error::TransactionError("Blob transaction reverted".to_string()));
        }
        
        info!("Blob transaction successful: {}", tx_hash);
        
        Ok(receipt)
    }
    
    /// Check smart account code (EIP-7702)
    pub async fn check_smart_account_code(&self, address: Address) -> Result<Vec<u8>, Error> {
        debug!("Checking smart account code for: {}", address);
        
        if !self.supports_pectra {
            return Err(Error::SmartAccountError("EIP-7702 not supported".to_string()));
        }
        
        // Use EIP-7702 specific call
        let result = self.provider.request::<_, String>(
            "eth_getAccountCode",
            [format!("{:?}", address)]
        ).await.map_err(|e| Error::SmartAccountError(format!("Failed to get account code: {}", e)))?;
        
        // Convert hex to bytes
        let code = hex::decode(result.strip_prefix("0x").unwrap_or(&result))
            .map_err(|e| Error::EncodingError(format!("Failed to decode account code: {}", e)))?;
        
        Ok(code)
    }
    
    /// Execute smart account code (EIP-7702)
    pub async fn execute_smart_account(&self, address: Address, data: Vec<u8>) -> Result<Vec<u8>, Error> {
        info!("Executing smart account: {} with data: {} bytes", address, data.len());
        
        if !self.supports_pectra {
            return Err(Error::SmartAccountError("EIP-7702 not supported".to_string()));
        }
        
        // Create transaction to execute account code
        let tx_request = self.wallet.sign_transaction(
            data,
            Some(address),
            self.chain_id,
            None, // nonce
            None, // value
            None, // gas limit
            None, // gas price
        ).map_err(|e| Error::TransactionError(format!("Failed to sign account execution: {}", e)))?;
        
        // Send transaction with special method
        let tx_hash = self.provider.request::<_, H256>(
            "eth_executeAccountTransaction",
            [hex::encode(tx_request)]
        ).await.map_err(|e| Error::SmartAccountError(format!("Failed to execute account: {}", e)))?;
        
        // Wait for transaction receipt
        let receipt = self.wait_for_transaction_receipt(tx_hash).await?;
        
        if !receipt.status {
            return Err(Error::TransactionError("Account execution reverted".to_string()));
        }
        
        // Get result from logs or return empty
        let result = if let Some(log) = receipt.logs.first() {
            log.data.clone()
        } else {
            Vec::new()
        };
        
        info!("Account execution successful: {}", tx_hash);
        
        Ok(result)
    }
    
    // Helper methods
    
    /// Wait for transaction receipt
    async fn wait_for_transaction_receipt(&self, tx_hash: H256) -> Result<TransactionReceipt, Error> {
        let receipt = self.provider.get_transaction_receipt(tx_hash)
            .await
            .map_err(|e| Error::TransactionError(format!("Failed to get transaction receipt: {}", e)))?;
        
        Ok(TransactionReceipt {
            transaction_hash: receipt.transaction_hash,
            block_number: receipt.block_number,
            block_hash: receipt.block_hash,
            contract_address: receipt.contract_address,
            gas_used: receipt.gas_used,
            status: receipt.status,
            logs: receipt.logs.into_iter().map(|log| Log {
                address: log.address,
                topics: log.topics,
                data: log.data,
                block_number: log.block_number,
                transaction_hash: log.transaction_hash,
                log_index: log.log_index,
            }).collect(),
        })
    }
    
    /// Encode function call with selector and arguments
    fn encode_function_call(function: &str, args: Vec<Token>) -> Result<Vec<u8>, String> {
        // Calculate function selector
        let selector = Self::get_function_selector(function)
            .map_err(|e| format!("Failed to get function selector: {}", e))?;
        
        // Encode arguments
        let encoded_args = Token::encode(&args)
            .map_err(|e| format!("Failed to encode arguments: {}", e))?;
        
        // Combine selector and encoded arguments
        let mut calldata = selector.to_vec();
        calldata.extend_from_slice(&encoded_args);
        
        Ok(calldata)
    }
    
    /// Calculate function selector
    fn get_function_selector(function: &str) -> Result<[u8; 4], String> {
        // Hash the function signature
        let signature = alloy_primitives::keccak256(function.as_bytes());
        
        // Take first 4 bytes
        let mut selector = [0u8; 4];
        selector.copy_from_slice(&signature[0..4]);
        
        Ok(selector)
    }
    
    /// Calculate event signature
    fn get_event_signature(event: &str) -> Result<H256, String> {
        // Hash the event signature
        let hash = alloy_primitives::keccak256(event.as_bytes());
        
        Ok(H256::from_slice(&hash))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_new_client() {
        // This is a basic test to ensure the struct can be created
        let result = EthereumClient::new(
            "http://localhost:8545",
            "0x0000000000000000000000000000000000000000000000000000000000000001",
            1,
        ).await;
        
        assert!(result.is_ok());
    }
    
    // More comprehensive tests would require a local Ethereum node
    // or mocking the provider responses
} 