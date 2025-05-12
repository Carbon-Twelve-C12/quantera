use alloy_primitives::{Address, U256, Bytes, FixedBytes};
use ethereum_client::{EthereumClient, Error as EthError};
use serde::{Serialize, Deserialize};
use std::sync::Arc;
use crate::Error;

/// L2 Chain types supported by the bridge
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum L2Chain {
    OPTIMISM,
    ARBITRUM,
    ZKSYNC,
    STARKNET,
    BASE,
    POLYGON_ZKEVM,
    LINEA,
    CUSTOM,
}

/// Status of cross-chain messages
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum MessageStatus {
    PENDING,
    CONFIRMED,
    FAILED,
    REJECTED,
}

/// Information about an L2 chain
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct L2ChainInfo {
    pub chain_id: u64,
    pub chain_type: L2Chain,
    pub name: String,
    pub enabled: bool,
    pub bridge_address: Address,
    pub rollup_address: Address,
    pub verification_blocks: u64,
    pub gas_token_symbol: String,
    pub native_token_price_usd: U256,
    pub average_block_time: u64,
    pub blob_enabled: bool,
    pub max_message_size: u64,
}

/// Cross-chain message structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrossChainMessage {
    pub message_id: [u8; 32],
    pub source_chain_id: u64,
    pub destination_chain_id: u64,
    pub sender: Address,
    pub recipient: Address,
    pub amount: U256,
    pub data: Vec<u8>,
    pub timestamp: u64,
    pub nonce: U256,
    pub status: MessageStatus,
    pub transaction_hash: [u8; 32],
    pub confirmation_timestamp: u64,
    pub confirmation_transaction_hash: [u8; 32],
    pub failure_reason: String,
}

/// Order bridging request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderBridgingRequest {
    pub order_id: [u8; 32],
    pub treasury_id: [u8; 32],
    pub user: Address,
    pub is_buy: bool,
    pub amount: U256,
    pub price: U256,
    pub expiration: u64,
    pub signature: Vec<u8>,
    pub destination_chain_id: u64,
}

/// Result of bridging an order
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderBridgingResult {
    pub message_id: [u8; 32],
    pub source_transaction_hash: [u8; 32],
    pub estimated_confirmation_time: u64,
    pub bridging_fee: U256,
    pub status: MessageStatus,
}

/// Trade settlement request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeSettlementRequest {
    pub trade_id: [u8; 32],
    pub buy_order_id: [u8; 32],
    pub sell_order_id: [u8; 32],
    pub treasury_id: [u8; 32],
    pub buyer: Address,
    pub seller: Address,
    pub amount: U256,
    pub price: U256,
    pub settlement_timestamp: u64,
    pub destination_chain_id: u64,
}

/// Result of settling a trade
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeSettlementResult {
    pub message_id: [u8; 32],
    pub source_transaction_hash: [u8; 32],
    pub estimated_confirmation_time: u64,
    pub settlement_fee: U256,
    pub status: MessageStatus,
}

/// L2 gas estimation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct L2GasEstimation {
    pub chain_id: u64,
    pub chain_type: L2Chain,
    pub gas_price_wei: U256,
    pub gas_limit: U256,
    pub estimated_cost_wei: U256,
    pub estimated_cost_usd: U256,
    pub estimated_time_seconds: u64,
    pub blob_gas_price: U256,
    pub blob_gas_limit: U256,
    pub blob_cost_wei: U256,
}

/// Client for interacting with the L2Bridge contract
#[derive(Debug, Clone)]
pub struct L2BridgeClient {
    client: Arc<EthereumClient>,
    contract_address: Address,
}

impl L2BridgeClient {
    /// Create a new L2BridgeClient
    pub fn new(client: Arc<EthereumClient>, address: Address) -> Self {
        Self {
            client,
            contract_address: address,
        }
    }
    
    /// Get all supported L2 chains
    pub async fn get_supported_chains(&self) -> Result<Vec<L2ChainInfo>, Error> {
        let chains = self.client.call_contract::<Vec<L2ChainInfo>>(
            self.contract_address,
            "getSupportedChains()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(chains)
    }
    
    /// Get information about a specific L2 chain
    pub async fn get_chain_info(&self, chain_id: u64) -> Result<L2ChainInfo, Error> {
        let chain_info = self.client.call_contract::<L2ChainInfo>(
            self.contract_address,
            "getChainInfo(uint64)",
            vec![chain_id.into()],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(chain_info)
    }
    
    /// Check if a chain is supported and enabled
    pub async fn is_chain_supported(&self, chain_id: u64) -> Result<bool, Error> {
        let is_supported = self.client.call_contract::<bool>(
            self.contract_address,
            "isChainSupported(uint64)",
            vec![chain_id.into()],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(is_supported)
    }
    
    /// Bridge an order to an L2 chain
    pub async fn bridge_order(&self, request: OrderBridgingRequest) -> Result<OrderBridgingResult, Error> {
        // Serialize the request in the format expected by the smart contract
        let encoded_request = self.client.encode_params(
            "((bytes32,bytes32,address,bool,uint256,uint256,uint64,bytes,uint64))",
            vec![(
                request.order_id,
                request.treasury_id,
                request.user,
                request.is_buy,
                request.amount,
                request.price,
                request.expiration,
                Bytes::from(request.signature.clone()),
                request.destination_chain_id,
            ).into()],
        ).map_err(Error::EthereumClient)?;
        
        let result = self.client.call_contract::<OrderBridgingResult>(
            self.contract_address,
            "bridgeOrder((bytes32,bytes32,address,bool,uint256,uint256,uint64,bytes,uint64))",
            vec![encoded_request],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(result)
    }
    
    /// Settle a trade on an L2 chain
    pub async fn settle_trade(&self, request: TradeSettlementRequest) -> Result<TradeSettlementResult, Error> {
        // Serialize the request in the format expected by the smart contract
        let encoded_request = self.client.encode_params(
            "((bytes32,bytes32,bytes32,bytes32,address,address,uint256,uint256,uint64,uint64))",
            vec![(
                request.trade_id,
                request.buy_order_id,
                request.sell_order_id,
                request.treasury_id,
                request.buyer,
                request.seller,
                request.amount,
                request.price,
                request.settlement_timestamp,
                request.destination_chain_id,
            ).into()],
        ).map_err(Error::EthereumClient)?;
        
        let result = self.client.call_contract::<TradeSettlementResult>(
            self.contract_address,
            "settleTrade((bytes32,bytes32,bytes32,bytes32,address,address,uint256,uint256,uint64,uint64))",
            vec![encoded_request],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(result)
    }
    
    /// Get the status of a message
    pub async fn get_message_status(&self, message_id: [u8; 32]) -> Result<MessageStatus, Error> {
        let status = self.client.call_contract::<MessageStatus>(
            self.contract_address,
            "getMessageStatus(bytes32)",
            vec![message_id.into()],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(status)
    }
    
    /// Get the details of a message
    pub async fn get_message_details(&self, message_id: [u8; 32]) -> Result<CrossChainMessage, Error> {
        let message = self.client.call_contract::<CrossChainMessage>(
            self.contract_address,
            "getMessageDetails(bytes32)",
            vec![message_id.into()],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(message)
    }
    
    /// Get all messages sent by a user
    pub async fn get_messages_by_sender(&self, sender: Address) -> Result<Vec<[u8; 32]>, Error> {
        let messages = self.client.call_contract::<Vec<[u8; 32]>>(
            self.contract_address,
            "getMessagesBySender(address)",
            vec![sender.into()],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(messages)
    }
    
    /// Get all pending messages
    pub async fn get_pending_messages(&self) -> Result<Vec<[u8; 32]>, Error> {
        let messages = self.client.call_contract::<Vec<[u8; 32]>>(
            self.contract_address,
            "getPendingMessages()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(messages)
    }
    
    /// Estimate gas cost for bridging to an L2 chain
    pub async fn estimate_bridging_gas(&self, destination_chain_id: u64, data_size: u64, use_blob: bool) -> Result<L2GasEstimation, Error> {
        let estimation = self.client.call_contract::<L2GasEstimation>(
            self.contract_address,
            "estimateBridgingGas(uint64,uint64,bool)",
            vec![
                destination_chain_id.into(),
                data_size.into(),
                use_blob.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(estimation)
    }
    
    /// Calculate the optimal data format (blob vs calldata) based on size and gas prices
    pub async fn calculate_optimal_data_format(&self, destination_chain_id: u64, data_size: u64) -> Result<bool, Error> {
        let use_blob = self.client.call_contract::<bool>(
            self.contract_address,
            "calculateOptimalDataFormat(uint64,uint64)",
            vec![
                destination_chain_id.into(),
                data_size.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(use_blob)
    }
    
    /// Check if blob data is enabled for a chain
    pub async fn is_blob_enabled(&self, chain_id: u64) -> Result<bool, Error> {
        let blob_enabled = self.client.call_contract::<bool>(
            self.contract_address,
            "isBlobEnabled(uint64)",
            vec![chain_id.into()],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(blob_enabled)
    }
    
    /// Get orders bridged by a user
    pub async fn get_orders_by_user(&self, user: Address) -> Result<Vec<OrderBridgingRequest>, Error> {
        let orders = self.client.call_contract::<Vec<OrderBridgingRequest>>(
            self.contract_address,
            "getOrdersByUser(address)",
            vec![user.into()],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(orders)
    }
    
    /// Get trades settled for a user
    pub async fn get_trades_by_user(&self, user: Address) -> Result<Vec<TradeSettlementRequest>, Error> {
        let trades = self.client.call_contract::<Vec<TradeSettlementRequest>>(
            self.contract_address,
            "getTradesByUser(address)",
            vec![user.into()],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(trades)
    }
    
    /// Retry a failed message
    pub async fn retry_message(&self, message_id: [u8; 32]) -> Result<bool, Error> {
        let success = self.client.send_transaction(
            self.contract_address,
            "retryMessage(bytes32)",
            vec![message_id.into()],
            0.into(),
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(success)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use ethers::signers::Signer;
    
    // These tests are commented out as they require a running Ethereum node
    // with the appropriate contracts deployed.
    
    /*
    #[tokio::test]
    async fn test_get_supported_chains() {
        // Setup
        let provider = Provider::<Http>::try_from("http://localhost:8545").unwrap();
        let wallet = LocalWallet::new(&mut rand::thread_rng());
        let client = SignerMiddleware::new(provider, wallet);
        
        let address = "0x1234567890123456789012345678901234567890".parse::<Address>().unwrap();
        let bridge_client = L2BridgeClient::new(Arc::new(client), address);
        
        // Test
        let chains = bridge_client.get_supported_chains().await.unwrap();
        
        // Verify
        assert!(!chains.is_empty());
        assert!(chains.iter().any(|chain| chain.chain_type == L2Chain::OPTIMISM));
    }
    */
} 