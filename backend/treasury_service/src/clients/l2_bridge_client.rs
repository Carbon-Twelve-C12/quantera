use ethers::prelude::*;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use eyre::Result;
use std::collections::HashMap;

/// Supported Layer 2 chains
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
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

/// Cross-chain message status
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum MessageStatus {
    PENDING,
    CONFIRMED,
    FAILED,
    REJECTED,
}

/// Information about a Layer 2 chain configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct L2ChainInfo {
    pub chain_id: u64,
    pub chain_type: L2Chain,
    pub name: String,
    pub enabled: bool,
    pub bridge_address: Address,
    pub rollup_address: Option<Address>,
    pub verification_blocks: u64,
    pub gas_token_symbol: String,
    pub native_token_price_usd: U256,
    pub average_block_time: u64,
    pub blob_enabled: bool,
    pub max_message_size: u64,
}

/// Cross-chain message
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
    pub transaction_hash: H256,
    pub confirmation_timestamp: Option<u64>,
    pub confirmation_transaction_hash: Option<H256>,
    pub failure_reason: Option<String>,
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

/// Order bridging result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderBridgingResult {
    pub message_id: [u8; 32],
    pub source_transaction_hash: H256,
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

/// Trade settlement result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeSettlementResult {
    pub message_id: [u8; 32],
    pub source_transaction_hash: H256,
    pub estimated_confirmation_time: u64,
    pub settlement_fee: U256,
    pub status: MessageStatus,
}

/// Gas estimation for different L2 chains
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct L2GasEstimation {
    pub chain_id: u64,
    pub chain_type: L2Chain,
    pub gas_price_wei: U256,
    pub gas_limit: U256,
    pub estimated_cost_wei: U256,
    pub estimated_cost_usd: f64,
    pub estimated_time_seconds: u64,
    pub blob_gas_price: Option<U256>,
    pub blob_gas_limit: Option<U256>,
    pub blob_cost_wei: Option<U256>,
}

/// Client for interacting with the L2Bridge contract
pub struct L2BridgeClient<M> {
    /// Contract instance
    contract: Arc<ethers::contract::Contract<M>>,
    /// Contract address
    address: Address,
}

impl<M: Middleware> L2BridgeClient<M> {
    /// Create a new client instance
    pub fn new(client: Arc<M>, address: Address) -> Self {
        // Note: In a real implementation, we would load the ABI from a file or embed it
        let abi = include_str!("../abi/L2Bridge.json");
        let contract = Arc::new(
            ethers::contract::Contract::new(address, serde_json::from_str(abi).unwrap(), client),
        );
        
        Self { contract, address }
    }
    
    /// Get all supported L2 chains
    pub async fn get_supported_chains(&self) -> Result<Vec<L2ChainInfo>> {
        let call = self
            .contract
            .method::<_, Vec<L2ChainInfo>>(
                "getSupportedChains",
                (),
            )?;
            
        let chains = call.call().await?;
        Ok(chains)
    }
    
    /// Get information about a specific L2 chain
    pub async fn get_chain_info(&self, chain_id: u64) -> Result<L2ChainInfo> {
        let call = self
            .contract
            .method::<_, L2ChainInfo>(
                "getChainInfo",
                chain_id,
            )?;
            
        let chain_info = call.call().await?;
        Ok(chain_info)
    }
    
    /// Bridge an order to an L2 chain
    pub async fn bridge_order(
        &self,
        order_bridging_request: OrderBridgingRequest,
    ) -> Result<OrderBridgingResult> {
        let call = self
            .contract
            .method::<_, OrderBridgingResult>(
                "bridgeOrder",
                order_bridging_request,
            )?;
            
        let result = call.call().await?;
        Ok(result)
    }
    
    /// Settle a trade on an L2 chain
    pub async fn settle_trade(
        &self,
        trade_settlement_request: TradeSettlementRequest,
    ) -> Result<TradeSettlementResult> {
        let call = self
            .contract
            .method::<_, TradeSettlementResult>(
                "settleTrade",
                trade_settlement_request,
            )?;
            
        let result = call.call().await?;
        Ok(result)
    }
    
    /// Get message status by ID
    pub async fn get_message_status(&self, message_id: [u8; 32]) -> Result<MessageStatus> {
        let call = self
            .contract
            .method::<_, MessageStatus>(
                "getMessageStatus",
                message_id,
            )?;
            
        let status = call.call().await?;
        Ok(status)
    }
    
    /// Get message details by ID
    pub async fn get_message_details(&self, message_id: [u8; 32]) -> Result<CrossChainMessage> {
        let call = self
            .contract
            .method::<_, CrossChainMessage>(
                "getMessageDetails",
                message_id,
            )?;
            
        let message = call.call().await?;
        Ok(message)
    }
    
    /// Get messages sent by a user
    pub async fn get_messages_by_sender(&self, sender: Address) -> Result<Vec<[u8; 32]>> {
        let call = self
            .contract
            .method::<_, Vec<[u8; 32]>>(
                "getMessagesBySender",
                sender,
            )?;
            
        let message_ids = call.call().await?;
        Ok(message_ids)
    }
    
    /// Get messages for a specific chain
    pub async fn get_messages_by_chain(&self, chain_id: u64) -> Result<Vec<[u8; 32]>> {
        let call = self
            .contract
            .method::<_, Vec<[u8; 32]>>(
                "getMessagesByChain",
                chain_id,
            )?;
            
        let message_ids = call.call().await?;
        Ok(message_ids)
    }
    
    /// Get pending messages
    pub async fn get_pending_messages(&self) -> Result<Vec<[u8; 32]>> {
        let call = self
            .contract
            .method::<_, Vec<[u8; 32]>>(
                "getPendingMessages",
                (),
            )?;
            
        let message_ids = call.call().await?;
        Ok(message_ids)
    }
    
    /// Retry a failed message
    pub async fn retry_message(&self, message_id: [u8; 32]) -> Result<bool> {
        let call = self
            .contract
            .method::<_, bool>(
                "retryMessage",
                message_id,
            )?;
            
        let success = call.call().await?;
        Ok(success)
    }
    
    /// Get gas estimation for bridging to an L2 chain
    pub async fn estimate_bridging_gas(
        &self,
        destination_chain_id: u64,
        data_size: u64,
        use_blob: bool,
    ) -> Result<L2GasEstimation> {
        let call = self
            .contract
            .method::<_, L2GasEstimation>(
                "estimateBridgingGas",
                (destination_chain_id, data_size, use_blob),
            )?;
            
        let estimation = call.call().await?;
        Ok(estimation)
    }
    
    /// Get the chain ID of the current network
    pub async fn get_current_chain_id(&self) -> Result<u64> {
        let call = self
            .contract
            .method::<_, u64>(
                "getCurrentChainId",
                (),
            )?;
            
        let chain_id = call.call().await?;
        Ok(chain_id)
    }
    
    /// Check if blob data is enabled for a chain
    pub async fn is_blob_enabled(&self, chain_id: u64) -> Result<bool> {
        let call = self
            .contract
            .method::<_, bool>(
                "isBlobEnabled",
                chain_id,
            )?;
            
        let is_enabled = call.call().await?;
        Ok(is_enabled)
    }
    
    /// Calculate optimal data format (blob vs calldata) based on size and gas prices
    pub async fn calculate_optimal_data_format(
        &self,
        destination_chain_id: u64,
        data_size: u64,
    ) -> Result<bool> { // Returns whether to use blob
        let call = self
            .contract
            .method::<_, bool>(
                "calculateOptimalDataFormat",
                (destination_chain_id, data_size),
            )?;
            
        let use_blob = call.call().await?;
        Ok(use_blob)
    }
    
    /// Get message count for a chain
    pub async fn get_message_count(&self, chain_id: u64) -> Result<u64> {
        let call = self
            .contract
            .method::<_, u64>(
                "getMessageCount",
                chain_id,
            )?;
            
        let count = call.call().await?;
        Ok(count)
    }
    
    /// Get total bridged order count
    pub async fn get_bridged_order_count(&self) -> Result<u64> {
        let call = self
            .contract
            .method::<_, u64>(
                "getBridgedOrderCount",
                (),
            )?;
            
        let count = call.call().await?;
        Ok(count)
    }
    
    /// Get total settled trade count
    pub async fn get_settled_trade_count(&self) -> Result<u64> {
        let call = self
            .contract
            .method::<_, u64>(
                "getSettledTradeCount",
                (),
            )?;
            
        let count = call.call().await?;
        Ok(count)
    }
    
    /// Get all orders bridged by a user
    pub async fn get_orders_by_user(&self, user: Address) -> Result<Vec<OrderBridgingRequest>> {
        let call = self
            .contract
            .method::<_, Vec<OrderBridgingRequest>>(
                "getOrdersByUser",
                user,
            )?;
            
        let orders = call.call().await?;
        Ok(orders)
    }
    
    /// Get all trades settled for a user
    pub async fn get_trades_by_user(&self, user: Address) -> Result<Vec<TradeSettlementRequest>> {
        let call = self
            .contract
            .method::<_, Vec<TradeSettlementRequest>>(
                "getTradesByUser",
                user,
            )?;
            
        let trades = call.call().await?;
        Ok(trades)
    }
    
    /// Verify a cross-chain message using the provided proof
    pub async fn verify_message(
        &self,
        message_id: [u8; 32],
        proof: Vec<u8>,
    ) -> Result<bool> {
        let call = self
            .contract
            .method::<_, bool>(
                "verifyMessage",
                (message_id, proof),
            )?;
            
        let is_valid = call.call().await?;
        Ok(is_valid)
    }
    
    /// Get all supported chain IDs
    pub async fn get_supported_chain_ids(&self) -> Result<Vec<u64>> {
        let call = self
            .contract
            .method::<_, Vec<u64>>(
                "getSupportedChainIds",
                (),
            )?;
            
        let chain_ids = call.call().await?;
        Ok(chain_ids)
    }
    
    /// Get messages with details by sender
    pub async fn get_messages_with_details_by_sender(
        &self,
        sender: Address,
    ) -> Result<Vec<CrossChainMessage>> {
        let message_ids = self.get_messages_by_sender(sender).await?;
        let mut messages = Vec::with_capacity(message_ids.len());
        
        for message_id in message_ids {
            let message = self.get_message_details(message_id).await?;
            messages.push(message);
        }
        
        Ok(messages)
    }
    
    /// Get gas estimations for all supported chains
    pub async fn get_gas_estimations_for_all_chains(
        &self,
        data_size: u64,
        use_blob: bool,
    ) -> Result<HashMap<u64, L2GasEstimation>> {
        let chain_ids = self.get_supported_chain_ids().await?;
        let mut estimations = HashMap::new();
        
        for chain_id in chain_ids {
            let estimation = self.estimate_bridging_gas(chain_id, data_size, use_blob).await?;
            estimations.insert(chain_id, estimation);
        }
        
        Ok(estimations)
    }
    
    /// Find the most cost-effective chain for bridging
    pub async fn find_most_cost_effective_chain(
        &self,
        data_size: u64,
    ) -> Result<(u64, L2GasEstimation)> {
        let estimations = self.get_gas_estimations_for_all_chains(data_size, false).await?;
        
        let mut lowest_cost = U256::MAX;
        let mut best_chain_id = 0;
        let mut best_estimation = None;
        
        for (chain_id, estimation) in estimations.iter() {
            if estimation.estimated_cost_wei < lowest_cost {
                lowest_cost = estimation.estimated_cost_wei;
                best_chain_id = *chain_id;
                best_estimation = Some(estimation.clone());
            }
        }
        
        // Check if blob format would be more efficient for the best chain
        let use_blob = self.calculate_optimal_data_format(best_chain_id, data_size).await?;
        if use_blob {
            let blob_estimation = self.estimate_bridging_gas(best_chain_id, data_size, true).await?;
            Ok((best_chain_id, blob_estimation))
        } else {
            Ok((best_chain_id, best_estimation.unwrap()))
        }
    }
    
    /// Find the fastest chain for bridging
    pub async fn find_fastest_chain(
        &self,
        data_size: u64,
    ) -> Result<(u64, L2GasEstimation)> {
        let estimations = self.get_gas_estimations_for_all_chains(data_size, false).await?;
        
        let mut fastest_time = u64::MAX;
        let mut best_chain_id = 0;
        let mut best_estimation = None;
        
        for (chain_id, estimation) in estimations.iter() {
            if estimation.estimated_time_seconds < fastest_time {
                fastest_time = estimation.estimated_time_seconds;
                best_chain_id = *chain_id;
                best_estimation = Some(estimation.clone());
            }
        }
        
        // Check if blob format would be faster for the best chain
        let use_blob = self.calculate_optimal_data_format(best_chain_id, data_size).await?;
        if use_blob {
            let blob_estimation = self.estimate_bridging_gas(best_chain_id, data_size, true).await?;
            if blob_estimation.estimated_time_seconds <= fastest_time {
                return Ok((best_chain_id, blob_estimation));
            }
        }
        
        Ok((best_chain_id, best_estimation.unwrap()))
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