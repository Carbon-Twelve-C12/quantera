use crate::{
    TreasuryRegistryClient, 
    TreasuryTokenClient, 
    TreasuryInfo, 
    TreasuryStatus,
    Error as ServiceError
};
use alloy_primitives::{Address, U256, H256};
use ethereum_client::EthereumClient;
use std::sync::Arc;
use std::collections::HashMap;
use tokio::task::JoinHandle;
use tokio::time::{self, Duration};
use chrono::{Utc, TimeZone};
use tracing::{info, debug, warn, error};

/// Result of a yield distribution operation
#[derive(Debug, Clone)]
pub struct YieldDistributionResult {
    pub treasury_id: [u8; 32],
    pub token_address: Address,
    pub distribution_id: u64,
    pub amount: U256,
    pub distribution_time: u64,
    pub success: bool,
    pub error_message: Option<String>,
}

/// Result of maturity processing
#[derive(Debug, Clone)]
pub struct MaturityResult {
    pub treasury_id: [u8; 32],
    pub token_address: Address,
    pub maturity_date: u64,
    pub processed_at: u64,
    pub success: bool,
    pub error_message: Option<String>,
}

/// Historical snapshot of a treasury
#[derive(Debug, Clone)]
pub struct TreasurySnapshot {
    pub treasury_id: [u8; 32],
    pub block_number: u64,
    pub block_hash: H256,
    pub timestamp: u64,
    pub price: U256,
    pub total_supply: U256,
    pub yield_rate: u64,
}

/// Yield scheduler service for automating yield distributions and maturity processing
pub struct YieldSchedulerService {
    registry_client: Arc<TreasuryRegistryClient>,
    token_clients: Arc<tokio::sync::Mutex<HashMap<Address, TreasuryTokenClient>>>,
    ethereum_client: Arc<EthereumClient>,
    scheduler_handle: Option<JoinHandle<()>>,
    running: bool,
}

impl YieldSchedulerService {
    /// Create a new YieldSchedulerService
    pub async fn new(
        registry_client: Arc<TreasuryRegistryClient>,
        ethereum_client: Arc<EthereumClient>,
    ) -> Self {
        Self {
            registry_client,
            token_clients: Arc::new(tokio::sync::Mutex::new(HashMap::new())),
            ethereum_client,
            scheduler_handle: None,
            running: false,
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
    
    /// Distribute yield for a specific treasury
    pub async fn distribute_yield(
        &self,
        treasury_id: [u8; 32],
    ) -> Result<YieldDistributionResult, ServiceError> {
        info!("Distributing yield for treasury: {:?}", treasury_id);
        
        // Get treasury details
        let treasury_info = self.registry_client.get_treasury_details(treasury_id).await?;
        
        // Skip if not active
        if treasury_info.status != TreasuryStatus::Active {
            return Err(ServiceError::InvalidState(
                format!("Treasury {:?} is not active, current status: {:?}", treasury_id, treasury_info.status)
            ));
        }
        
        // Get token client
        let token_client = self.get_token_client(treasury_info.token_address).await?;
        
        // Calculate yield amount - in a real implementation, this would use more complex logic
        // For example, calculating based on time since last distribution, current yield rate, etc.
        let total_supply = token_client.get_token_info().await
            .map_err(|e| ServiceError::ContractInteraction(format!("Failed to get token info: {}", e)))?
            .2;
        
        // Calculate yield for a period (e.g., 30 days from now)
        let now = Utc::now().timestamp() as u64;
        let distribution_period = 30 * 24 * 60 * 60; // 30 days in seconds
        let yield_amount = calculate_yield_amount(total_supply, treasury_info.yield_rate, distribution_period)?;
        
        // Distribute yield
        let result = match token_client.distribute_yield(
            yield_amount, 
            None, // All partitions
            now + distribution_period, // End time (30 days from now)
        ).await {
            Ok(distribution_id) => {
                YieldDistributionResult {
                    treasury_id,
                    token_address: treasury_info.token_address,
                    distribution_id,
                    amount: yield_amount,
                    distribution_time: now,
                    success: true,
                    error_message: None,
                }
            },
            Err(e) => {
                let error_msg = format!("Failed to distribute yield: {}", e);
                error!("{}", error_msg);
                
                YieldDistributionResult {
                    treasury_id,
                    token_address: treasury_info.token_address,
                    distribution_id: 0,
                    amount: yield_amount,
                    distribution_time: now,
                    success: false,
                    error_message: Some(error_msg),
                }
            }
        };
        
        Ok(result)
    }
    
    /// Process maturity for a specific treasury
    pub async fn process_maturity(
        &self,
        treasury_id: [u8; 32],
    ) -> Result<MaturityResult, ServiceError> {
        info!("Processing maturity for treasury: {:?}", treasury_id);
        
        // Get treasury details
        let treasury_info = self.registry_client.get_treasury_details(treasury_id).await?;
        
        // Skip if not active
        if treasury_info.status != TreasuryStatus::Active {
            return Err(ServiceError::InvalidState(
                format!("Treasury {:?} is not active, current status: {:?}", treasury_id, treasury_info.status)
            ));
        }
        
        // Get token client
        let token_client = self.get_token_client(treasury_info.token_address).await?;
        
        // Check if matured
        let now = Utc::now().timestamp() as u64;
        if now < treasury_info.maturity_date {
            return Err(ServiceError::InvalidState(
                format!("Treasury {:?} has not matured yet, maturity date: {}", treasury_id, treasury_info.maturity_date)
            ));
        }
        
        // Process maturity
        let result = match token_client.process_maturity().await {
            Ok(_) => {
                // Update treasury status in registry
                match self.registry_client.update_treasury_status(treasury_id, TreasuryStatus::Matured).await {
                    Ok(_) => {
                        MaturityResult {
                            treasury_id,
                            token_address: treasury_info.token_address,
                            maturity_date: treasury_info.maturity_date,
                            processed_at: now,
                            success: true,
                            error_message: None,
                        }
                    },
                    Err(e) => {
                        let error_msg = format!("Failed to update treasury status: {}", e);
                        error!("{}", error_msg);
                        
                        MaturityResult {
                            treasury_id,
                            token_address: treasury_info.token_address,
                            maturity_date: treasury_info.maturity_date,
                            processed_at: now,
                            success: false,
                            error_message: Some(error_msg),
                        }
                    }
                }
            },
            Err(e) => {
                let error_msg = format!("Failed to process maturity: {}", e);
                error!("{}", error_msg);
                
                MaturityResult {
                    treasury_id,
                    token_address: treasury_info.token_address,
                    maturity_date: treasury_info.maturity_date,
                    processed_at: now,
                    success: false,
                    error_message: Some(error_msg),
                }
            }
        };
        
        Ok(result)
    }
    
    /// Check and distribute yields for all eligible treasuries
    pub async fn check_and_distribute_yields(&self) -> Result<Vec<YieldDistributionResult>, ServiceError> {
        info!("Checking and distributing yields for eligible treasuries");
        
        let now = Utc::now().timestamp() as u64;
        let mut results = Vec::new();
        
        // Get all active treasuries
        let active_treasuries = self.registry_client.get_treasuries_by_status(TreasuryStatus::Active).await?;
        
        for treasury_id in active_treasuries {
            // Get treasury details
            let treasury_info = match self.registry_client.get_treasury_details(treasury_id).await {
                Ok(info) => info,
                Err(e) => {
                    warn!("Failed to get details for treasury {:?}: {}", treasury_id, e);
                    continue;
                }
            };
            
            // Process treasuries that need yield distribution
            // In a real implementation, we would check the last distribution time and yield schedule
            // For now, we'll use a simplified approach for demonstration
            
            // Get token client
            let token_client = match self.get_token_client(treasury_info.token_address).await {
                Ok(client) => client,
                Err(e) => {
                    warn!("Failed to get token client for treasury {:?}: {}", treasury_id, e);
                    continue;
                }
            };
            
            // Check last yield distribution from token and determine if it's time for a new one
            // Simplified example: distribute every 30 days
            let last_distribution = match get_last_distribution_time(&token_client).await {
                Ok(time) => time,
                Err(e) => {
                    warn!("Failed to get last distribution time for treasury {:?}: {}", treasury_id, e);
                    continue;
                }
            };
            
            const DISTRIBUTION_INTERVAL: u64 = 30 * 24 * 60 * 60; // 30 days in seconds
            
            if last_distribution == 0 || now - last_distribution >= DISTRIBUTION_INTERVAL {
                // Distribute yield
                match self.distribute_yield(treasury_id).await {
                    Ok(result) => {
                        if result.success {
                            info!("Successfully distributed yield for treasury {:?}", treasury_id);
                        } else {
                            warn!("Failed to distribute yield for treasury {:?}: {:?}", 
                                 treasury_id, result.error_message);
                        }
                        results.push(result);
                    },
                    Err(e) => {
                        warn!("Error distributing yield for treasury {:?}: {}", treasury_id, e);
                        // Add failed result
                        results.push(YieldDistributionResult {
                            treasury_id,
                            token_address: treasury_info.token_address,
                            distribution_id: 0,
                            amount: U256::from(0),
                            distribution_time: now,
                            success: false,
                            error_message: Some(format!("Failed to distribute yield: {}", e)),
                        });
                    }
                }
            }
        }
        
        Ok(results)
    }
    
    /// Check and process maturities for all eligible treasuries
    pub async fn check_and_process_maturities(&self) -> Result<Vec<MaturityResult>, ServiceError> {
        info!("Checking and processing maturities for eligible treasuries");
        
        let now = Utc::now().timestamp() as u64;
        let mut results = Vec::new();
        
        // Get all active treasuries
        let active_treasuries = self.registry_client.get_treasuries_by_status(TreasuryStatus::Active).await?;
        
        for treasury_id in active_treasuries {
            // Get treasury details
            let treasury_info = match self.registry_client.get_treasury_details(treasury_id).await {
                Ok(info) => info,
                Err(e) => {
                    warn!("Failed to get details for treasury {:?}: {}", treasury_id, e);
                    continue;
                }
            };
            
            // Check if matured
            if now >= treasury_info.maturity_date {
                // Process maturity
                match self.process_maturity(treasury_id).await {
                    Ok(result) => {
                        if result.success {
                            info!("Successfully processed maturity for treasury {:?}", treasury_id);
                        } else {
                            warn!("Failed to process maturity for treasury {:?}: {:?}", 
                                 treasury_id, result.error_message);
                        }
                        results.push(result);
                    },
                    Err(e) => {
                        warn!("Error processing maturity for treasury {:?}: {}", treasury_id, e);
                        // Add failed result
                        results.push(MaturityResult {
                            treasury_id,
                            token_address: treasury_info.token_address,
                            maturity_date: treasury_info.maturity_date,
                            processed_at: now,
                            success: false,
                            error_message: Some(format!("Failed to process maturity: {}", e)),
                        });
                    }
                }
            }
        }
        
        Ok(results)
    }
    
    /// Create a historical price snapshot for a treasury
    pub async fn create_historical_snapshot(
        &self,
        treasury_id: [u8; 32],
    ) -> Result<TreasurySnapshot, ServiceError> {
        info!("Creating historical snapshot for treasury: {:?}", treasury_id);
        
        // Get treasury details
        let treasury_info = self.registry_client.get_treasury_details(treasury_id).await?;
        
        // Get token client
        let token_client = self.get_token_client(treasury_info.token_address).await?;
        
        // Get current block info
        let block_number = self.ethereum_client.get_block_number().await
            .map_err(|e| ServiceError::EthereumClient(e))?;
        
        let block_hash = self.ethereum_client.get_block_hash(block_number).await
            .map_err(|e| ServiceError::EthereumClient(e))?;
        
        let timestamp = Utc::now().timestamp() as u64;
        
        // Get token total supply
        let total_supply = token_client.get_token_info().await
            .map_err(|e| ServiceError::ContractInteraction(format!("Failed to get token info: {}", e)))?
            .2;
        
        // Create snapshot
        let snapshot = TreasurySnapshot {
            treasury_id,
            block_number,
            block_hash,
            timestamp,
            price: treasury_info.current_price,
            total_supply,
            yield_rate: treasury_info.yield_rate,
        };
        
        // In a real implementation, we'd store this snapshot somewhere (database, blockchain, etc.)
        // For now, we just return it
        
        Ok(snapshot)
    }
    
    /// Verify historical data for a treasury using EIP-2935 historical block hash storage
    pub async fn verify_historical_data(
        &self,
        treasury_id: [u8; 32],
        block_number: u64,
    ) -> Result<bool, ServiceError> {
        info!("Verifying historical data for treasury: {:?} at block: {}", treasury_id, block_number);
        
        // Get stored historical block hash from registry
        let treasury_info = self.registry_client.get_treasury_details(treasury_id).await?;
        let stored_hash = treasury_info.historical_data_hash;
        
        // Get historical block hash using EIP-2935
        let historical_hash = self.ethereum_client.get_historical_block_hash(block_number).await
            .map_err(|e| ServiceError::EthereumClient(e))?;
        
        // Compare hashes
        let matches = stored_hash == historical_hash;
        
        if matches {
            info!("Historical data verification successful for treasury {:?}", treasury_id);
        } else {
            warn!("Historical data verification failed for treasury {:?}", treasury_id);
        }
        
        Ok(matches)
    }
    
    /// Start the yield and maturity scheduler
    pub async fn run_scheduler(&mut self, interval_seconds: u64) -> Result<(), ServiceError> {
        if self.running {
            return Err(ServiceError::InvalidState("Scheduler is already running".into()));
        }
        
        info!("Starting yield and maturity scheduler with interval: {} seconds", interval_seconds);
        self.running = true;
        
        // Clone references for the task
        let registry_client = self.registry_client.clone();
        let token_clients = self.token_clients.clone();
        let ethereum_client = self.ethereum_client.clone();
        
        // Create a service instance for the task
        let service = YieldSchedulerService {
            registry_client,
            token_clients,
            ethereum_client,
            scheduler_handle: None,
            running: true,
        };
        
        // Spawn the scheduler task
        let handle = tokio::spawn(async move {
            let mut interval = time::interval(Duration::from_secs(interval_seconds));
            
            loop {
                interval.tick().await;
                
                // Check for yields to distribute
                if let Err(e) = service.check_and_distribute_yields().await {
                    error!("Error checking and distributing yields: {}", e);
                }
                
                // Check for maturities to process
                if let Err(e) = service.check_and_process_maturities().await {
                    error!("Error checking and processing maturities: {}", e);
                }
                
                // Create historical snapshots for active treasuries periodically
                // In a real implementation, this might be done less frequently
                if let Err(e) = periodically_create_snapshots(&service).await {
                    error!("Error creating periodic snapshots: {}", e);
                }
            }
        });
        
        self.scheduler_handle = Some(handle);
        
        Ok(())
    }
    
    /// Stop the scheduler
    pub fn stop_scheduler(&mut self) -> Result<(), ServiceError> {
        if !self.running {
            return Err(ServiceError::InvalidState("Scheduler is not running".into()));
        }
        
        info!("Stopping yield and maturity scheduler");
        
        if let Some(handle) = self.scheduler_handle.take() {
            handle.abort();
        }
        
        self.running = false;
        
        Ok(())
    }
}

// Helper functions

/// Calculate yield amount based on principal, yield rate, and time period
fn calculate_yield_amount(
    principal: U256,
    yield_rate: u64, // Basis points (e.g., 500 = 5%)
    period_seconds: u64,
) -> Result<U256, ServiceError> {
    // Convert yield rate from basis points to decimal (e.g., 500 -> 0.05)
    let yield_rate_decimal = U256::from(yield_rate) / U256::from(10000);
    
    // Calculate annual yield
    let annual_yield = principal * yield_rate_decimal;
    
    // Calculate yield for the specified period
    // yield = annual_yield * (period_seconds / seconds_in_year)
    let seconds_in_year = 365 * 24 * 60 * 60;
    let period_fraction = U256::from(period_seconds) / U256::from(seconds_in_year);
    
    let yield_amount = annual_yield * period_fraction;
    
    Ok(yield_amount)
}

/// Get the most recent yield distribution time for a token
async fn get_last_distribution_time(token_client: &TreasuryTokenClient) -> Result<u64, ServiceError> {
    // Get all yield distributions
    let distribution_ids = token_client.get_all_yield_distributions().await
        .map_err(|e| ServiceError::ContractInteraction(format!("Failed to get yield distributions: {}", e)))?;
    
    if distribution_ids.is_empty() {
        return Ok(0); // No distributions yet
    }
    
    // Find the most recent distribution
    let mut latest_time = 0;
    
    for id in distribution_ids {
        let distribution = token_client.get_yield_distribution(id).await
            .map_err(|e| ServiceError::ContractInteraction(format!("Failed to get yield distribution details: {}", e)))?;
        
        if distribution.timestamp > latest_time {
            latest_time = distribution.timestamp;
        }
    }
    
    Ok(latest_time)
}

/// Periodically create historical snapshots for active treasuries
async fn periodically_create_snapshots(service: &YieldSchedulerService) -> Result<(), ServiceError> {
    // Get all active treasuries
    let active_treasuries = service.registry_client.get_treasuries_by_status(TreasuryStatus::Active).await?;
    
    // Random sample or specific timing would be used in a real implementation
    // For now, just create snapshots for all active treasuries
    for treasury_id in active_treasuries {
        if let Err(e) = service.create_historical_snapshot(treasury_id).await {
            warn!("Failed to create snapshot for treasury {:?}: {}", treasury_id, e);
        }
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_calculate_yield_amount() {
        // Principal: 1,000,000 tokens
        // Yield rate: 5% (500 basis points)
        // Period: 30 days
        let principal = U256::from(1_000_000);
        let yield_rate = 500; // 5%
        let period_seconds = 30 * 24 * 60 * 60; // 30 days in seconds
        
        let result = calculate_yield_amount(principal, yield_rate, period_seconds).unwrap();
        
        // Expected: 1,000,000 * 0.05 * (30 / 365) ≈ 4,110
        let expected = U256::from(4110);
        assert_eq!(result, expected);
    }
} 