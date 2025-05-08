use ethers::prelude::*;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use eyre::Result;
use std::collections::HashMap;

/// Represents risk levels for yield strategies
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum RiskLevel {
    CONSERVATIVE,
    MODERATE,
    AGGRESSIVE,
    CUSTOM,
}

/// Represents yield source types
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum YieldSourceType {
    NATIVE,
    LIQUIDITY_POOL,
    LENDING,
    STAKING,
    FARMING,
    CUSTOM,
}

/// Represents asset classes in the Asset Factory
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum AssetClass {
    TREASURY,
    REAL_ESTATE,
    CORPORATE_BOND,
    ENVIRONMENTAL_ASSET,
    IP_RIGHT,
    INVOICE,
    COMMODITY,
    INFRASTRUCTURE,
    CUSTOM,
}

/// Environmental asset specific metadata for yield strategies
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvironmentalYieldMetadata {
    pub asset_type: String,
    pub certification_standard: String,
    pub impact_multiplier: U256,
    pub sdg_alignment: HashMap<u8, U256>,
    pub carbon_negative: bool,
    pub retirement_percentage: U256,
}

/// Strategy configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StrategyConfig {
    pub strategy_id: [u8; 32],
    pub name: String,
    pub description: String,
    pub creator: Address,
    pub risk_level: RiskLevel,
    pub is_public: bool,
    pub is_active: bool,
    pub creation_date: u64,
    pub performance_fee: U256,
    pub metadata_uri: String,
    pub supported_sources: Vec<YieldSourceType>,
    pub supported_asset_classes: Vec<AssetClass>,
}

/// User strategy application
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserStrategy {
    pub user_strategy_id: [u8; 32],
    pub strategy_id: [u8; 32],
    pub user: Address,
    pub assets: Vec<Address>,
    pub allocation_percentages: Vec<U256>,
    pub total_value: U256,
    pub start_date: u64,
    pub last_harvest_date: u64,
    pub total_yield: U256,
    pub total_fees_paid: U256,
    pub auto_compound: bool,
    pub compound_frequency: U256,
    pub is_active: bool,
}

/// Performance metrics for a strategy
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub strategy_id: [u8; 32],
    pub total_value: U256,
    pub total_yield: U256,
    pub annualized_return: U256,
    pub volatility: U256,
    pub sharpe_ratio: U256,
    pub max_drawdown: U256,
    pub total_users: U256,
    pub update_timestamp: U256,
}

/// Client for interacting with the YieldOptimizer contract
pub struct YieldOptimizerClient<M> {
    /// Contract instance
    contract: Arc<ethers::contract::Contract<M>>,
    /// Contract address
    address: Address,
}

impl<M: Middleware> YieldOptimizerClient<M> {
    /// Create a new client instance
    pub fn new(client: Arc<M>, address: Address) -> Self {
        // Note: In a real implementation, we would load the ABI from a file or embed it
        let abi = include_str!("../abi/YieldOptimizer.json");
        let contract = Arc::new(
            ethers::contract::Contract::new(address, serde_json::from_str(abi).unwrap(), client),
        );
        
        Self { contract, address }
    }
    
    /// Create a new yield strategy
    pub async fn create_strategy(
        &self,
        name: String,
        description: String,
        risk_level: RiskLevel,
        is_public: bool,
        performance_fee: U256,
        metadata_uri: String,
        supported_sources: Vec<YieldSourceType>,
        supported_asset_classes: Vec<AssetClass>,
    ) -> Result<[u8; 32]> {
        let call = self
            .contract
            .method::<_, [u8; 32]>(
                "createStrategy",
                (
                    name,
                    description,
                    risk_level,
                    is_public,
                    performance_fee,
                    metadata_uri,
                    supported_sources,
                    supported_asset_classes,
                ),
            )?;
            
        let strategy_id = call.call().await?;
        Ok(strategy_id)
    }
    
    /// Update an existing strategy
    pub async fn update_strategy(
        &self,
        strategy_id: [u8; 32],
        is_public: bool,
        is_active: bool,
        performance_fee: U256,
        metadata_uri: String,
    ) -> Result<bool> {
        let call = self
            .contract
            .method::<_, bool>(
                "updateStrategy",
                (strategy_id, is_public, is_active, performance_fee, metadata_uri),
            )?;
            
        let success = call.call().await?;
        Ok(success)
    }
    
    /// Apply a strategy to user assets
    pub async fn apply_strategy(
        &self,
        strategy_id: [u8; 32],
        assets: Vec<Address>,
        allocation_percentages: Vec<U256>,
        auto_compound: bool,
        compound_frequency: U256,
    ) -> Result<[u8; 32]> {
        let call = self
            .contract
            .method::<_, [u8; 32]>(
                "applyStrategy",
                (strategy_id, assets, allocation_percentages, auto_compound, compound_frequency),
            )?;
            
        let user_strategy_id = call.call().await?;
        Ok(user_strategy_id)
    }
    
    /// Update a user's strategy application
    pub async fn update_user_strategy(
        &self,
        user_strategy_id: [u8; 32],
        assets: Vec<Address>,
        allocation_percentages: Vec<U256>,
        auto_compound: bool,
        compound_frequency: U256,
        is_active: bool,
    ) -> Result<bool> {
        let call = self
            .contract
            .method::<_, bool>(
                "updateUserStrategy",
                (
                    user_strategy_id,
                    assets,
                    allocation_percentages,
                    auto_compound,
                    compound_frequency,
                    is_active,
                ),
            )?;
            
        let success = call.call().await?;
        Ok(success)
    }
    
    /// Harvest yields from a user's strategy
    pub async fn harvest_yield(
        &self,
        user_strategy_id: [u8; 32],
        recipient: Address,
    ) -> Result<(U256, U256)> {
        let call = self
            .contract
            .method::<_, (U256, U256)>(
                "harvestYield",
                (user_strategy_id, recipient),
            )?;
            
        let (yield_amount, fee_amount) = call.call().await?;
        Ok((yield_amount, fee_amount))
    }
    
    /// Trigger auto-compounding for eligible strategies
    pub async fn trigger_auto_compound(
        &self,
        user_strategy_ids: Vec<[u8; 32]>,
    ) -> Result<U256> {
        let call = self
            .contract
            .method::<_, U256>(
                "triggerAutoCompound",
                user_strategy_ids,
            )?;
            
        let compounded_count = call.call().await?;
        Ok(compounded_count)
    }
    
    /// Get strategy configuration
    pub async fn get_strategy_config(&self, strategy_id: [u8; 32]) -> Result<StrategyConfig> {
        let call = self
            .contract
            .method::<_, StrategyConfig>(
                "getStrategyConfig",
                strategy_id,
            )?;
            
        let config = call.call().await?;
        Ok(config)
    }
    
    /// Get a user's strategy application
    pub async fn get_user_strategy(&self, user_strategy_id: [u8; 32]) -> Result<UserStrategy> {
        let call = self
            .contract
            .method::<_, UserStrategy>(
                "getUserStrategy",
                user_strategy_id,
            )?;
            
        let user_strategy = call.call().await?;
        Ok(user_strategy)
    }
    
    /// Get all strategies for a user
    pub async fn get_user_strategies(&self, user: Address) -> Result<Vec<[u8; 32]>> {
        let call = self
            .contract
            .method::<_, Vec<[u8; 32]>>(
                "getUserStrategies",
                user,
            )?;
            
        let user_strategy_ids = call.call().await?;
        Ok(user_strategy_ids)
    }
    
    /// Get performance metrics for a strategy
    pub async fn get_performance_metrics(&self, strategy_id: [u8; 32]) -> Result<PerformanceMetrics> {
        let call = self
            .contract
            .method::<_, PerformanceMetrics>(
                "getPerformanceMetrics",
                strategy_id,
            )?;
            
        let metrics = call.call().await?;
        Ok(metrics)
    }
    
    /// Get all public strategies
    pub async fn get_public_strategies(&self) -> Result<Vec<[u8; 32]>> {
        let call = self
            .contract
            .method::<_, Vec<[u8; 32]>>(
                "getPublicStrategies",
                (),
            )?;
            
        let strategy_ids = call.call().await?;
        Ok(strategy_ids)
    }
    
    /// Get strategies by creator
    pub async fn get_strategies_by_creator(&self, creator: Address) -> Result<Vec<[u8; 32]>> {
        let call = self
            .contract
            .method::<_, Vec<[u8; 32]>>(
                "getStrategiesByCreator",
                creator,
            )?;
            
        let strategy_ids = call.call().await?;
        Ok(strategy_ids)
    }
    
    /// Get strategies by risk level
    pub async fn get_strategies_by_risk_level(&self, risk_level: RiskLevel) -> Result<Vec<[u8; 32]>> {
        let call = self
            .contract
            .method::<_, Vec<[u8; 32]>>(
                "getStrategiesByRiskLevel",
                risk_level,
            )?;
            
        let strategy_ids = call.call().await?;
        Ok(strategy_ids)
    }
    
    /// Get strategies that support a specific asset class
    pub async fn get_strategies_by_asset_class(&self, asset_class: AssetClass) -> Result<Vec<[u8; 32]>> {
        let call = self
            .contract
            .method::<_, Vec<[u8; 32]>>(
                "getStrategiesByAssetClass",
                asset_class,
            )?;
            
        let strategy_ids = call.call().await?;
        Ok(strategy_ids)
    }
    
    /// Get strategies that support a specific yield source type
    pub async fn get_strategies_by_yield_source(&self, source_type: YieldSourceType) -> Result<Vec<[u8; 32]>> {
        let call = self
            .contract
            .method::<_, Vec<[u8; 32]>>(
                "getStrategiesByYieldSource",
                source_type,
            )?;
            
        let strategy_ids = call.call().await?;
        Ok(strategy_ids)
    }
    
    /// Calculate the expected yield for a strategy
    pub async fn calculate_expected_yield(
        &self,
        strategy_id: [u8; 32],
        assets: Vec<Address>,
        amounts: Vec<U256>,
        period: U256,
    ) -> Result<(U256, U256)> {
        let call = self
            .contract
            .method::<_, (U256, U256)>(
                "calculateExpectedYield",
                (strategy_id, assets, amounts, period),
            )?;
            
        let (expected_yield, annualized_return) = call.call().await?;
        Ok((expected_yield, annualized_return))
    }
    
    /// Get the pending yield for a user strategy
    pub async fn get_pending_yield(&self, user_strategy_id: [u8; 32]) -> Result<(U256, U256)> {
        let call = self
            .contract
            .method::<_, (U256, U256)>(
                "getPendingYield",
                user_strategy_id,
            )?;
            
        let (pending_yield, pending_fees) = call.call().await?;
        Ok((pending_yield, pending_fees))
    }
    
    /// Check if a strategy is suitable for specific assets
    pub async fn check_strategy_suitability(
        &self,
        strategy_id: [u8; 32],
        assets: Vec<Address>,
    ) -> Result<(bool, String)> {
        let call = self
            .contract
            .method::<_, (bool, String)>(
                "checkStrategySuitability",
                (strategy_id, assets),
            )?;
            
        let (is_suitable, reason) = call.call().await?;
        Ok((is_suitable, reason))
    }
    
    /// Get the users of a strategy
    pub async fn get_strategy_usage(&self, strategy_id: [u8; 32]) -> Result<(U256, U256)> {
        let call = self
            .contract
            .method::<_, (U256, U256)>(
                "getStrategyUsage",
                strategy_id,
            )?;
            
        let (user_count, total_value_locked) = call.call().await?;
        Ok((user_count, total_value_locked))
    }
    
    /// Get all user strategies with details
    pub async fn get_all_user_strategies_with_details(
        &self,
        user: Address,
    ) -> Result<HashMap<[u8; 32], UserStrategy>> {
        let user_strategy_ids = self.get_user_strategies(user).await?;
        let mut strategies = HashMap::new();
        
        for user_strategy_id in user_strategy_ids {
            let user_strategy = self.get_user_strategy(user_strategy_id).await?;
            strategies.insert(user_strategy_id, user_strategy);
        }
        
        Ok(strategies)
    }
    
    /// Get all strategies with their performance metrics
    pub async fn get_all_public_strategies_with_metrics(
        &self,
    ) -> Result<HashMap<[u8; 32], (StrategyConfig, PerformanceMetrics)>> {
        let strategy_ids = self.get_public_strategies().await?;
        let mut strategies_with_metrics = HashMap::new();
        
        for strategy_id in strategy_ids {
            let config = self.get_strategy_config(strategy_id).await?;
            let metrics = self.get_performance_metrics(strategy_id).await?;
            strategies_with_metrics.insert(strategy_id, (config, metrics));
        }
        
        Ok(strategies_with_metrics)
    }
    
    /// Find best strategies for a given asset and risk profile
    pub async fn find_best_strategies(
        &self,
        asset: Address,
        risk_level: Option<RiskLevel>,
        min_return: Option<U256>,
    ) -> Result<Vec<[u8; 32]>> {
        // Get all public strategies
        let strategy_ids = self.get_public_strategies().await?;
        let mut suitable_strategies = vec![];
        
        for strategy_id in strategy_ids {
            let config = self.get_strategy_config(strategy_id).await?;
            let metrics = self.get_performance_metrics(strategy_id).await?;
            
            // Check if risk level matches (if specified)
            if let Some(desired_risk) = risk_level {
                if config.risk_level != desired_risk {
                    continue;
                }
            }
            
            // Check if return meets minimum (if specified)
            if let Some(min_ret) = min_return {
                if metrics.annualized_return < min_ret {
                    continue;
                }
            }
            
            // Check if asset is supported
            let (is_suitable, _) = self.check_strategy_suitability(strategy_id, vec![asset]).await?;
            if is_suitable {
                suitable_strategies.push(strategy_id);
            }
        }
        
        Ok(suitable_strategies)
    }
    
    /// Find sustainable yield strategies optimized for environmental assets
    pub async fn find_sustainable_yield_strategies(
        &self,
        environmental_asset_types: Vec<String>,
        min_retirement_percentage: Option<U256>,
        include_carbon_negative_only: bool,
    ) -> Result<HashMap<[u8; 32], (StrategyConfig, EnvironmentalYieldMetadata)>> {
        // Get strategies that support environmental assets
        let strategy_ids = self.get_strategies_by_asset_class(AssetClass::ENVIRONMENTAL_ASSET).await?;
        let mut sustainable_strategies = HashMap::new();
        
        for strategy_id in strategy_ids {
            let config = self.get_strategy_config(strategy_id).await?;
            
            // Fetch environmental metadata from the contract
            // In a real implementation this would call the contract
            // For now we'll mock this data
            let env_metadata = self.get_environmental_yield_metadata(strategy_id).await?;
            
            // Filter by environmental asset types if specified
            if !environmental_asset_types.is_empty() && 
               !environmental_asset_types.iter().any(|t| env_metadata.asset_type.contains(t)) {
                continue;
            }
            
            // Filter by minimum retirement percentage if specified
            if let Some(min_retirement) = min_retirement_percentage {
                if env_metadata.retirement_percentage < min_retirement {
                    continue;
                }
            }
            
            // Filter by carbon negative flag if specified
            if include_carbon_negative_only && !env_metadata.carbon_negative {
                continue;
            }
            
            sustainable_strategies.insert(strategy_id, (config, env_metadata));
        }
        
        Ok(sustainable_strategies)
    }
    
    /// Get environmental impact metadata for a yield strategy
    pub async fn get_environmental_yield_metadata(
        &self,
        strategy_id: [u8; 32],
    ) -> Result<EnvironmentalYieldMetadata> {
        // In a real implementation, this would fetch data from the contract
        // For now, we'll return mock data
        
        // Mock implementation
        let mut sdg_alignment = HashMap::new();
        sdg_alignment.insert(13, U256::from(80)); // Climate Action
        sdg_alignment.insert(15, U256::from(70)); // Life on Land
        
        let metadata = EnvironmentalYieldMetadata {
            asset_type: "CarbonCredit".to_string(),
            certification_standard: "Verra".to_string(),
            impact_multiplier: U256::from(120), // 1.2x impact
            sdg_alignment,
            carbon_negative: true,
            retirement_percentage: U256::from(20), // 20% of yield automatically retired
        };
        
        Ok(metadata)
    }
    
    /// Calculate the environmental impact of a yield strategy
    pub async fn calculate_environmental_impact(
        &self,
        strategy_id: [u8; 32],
        investment_amount: U256,
        duration_days: U256,
    ) -> Result<HashMap<String, U256>> {
        // In a real implementation, this would calculate based on actual data
        // For now, we'll return mock impact metrics
        let env_metadata = self.get_environmental_yield_metadata(strategy_id).await?;
        
        // Calculate basic yield
        let (expected_yield, _) = self.calculate_expected_yield(
            strategy_id, 
            vec![Address::zero()], // Placeholder
            vec![investment_amount],
            duration_days,
        ).await?;
        
        // Apply impact multiplier
        let adjusted_yield = expected_yield
            .checked_mul(env_metadata.impact_multiplier)
            .unwrap_or(expected_yield)
            .checked_div(U256::from(100))
            .unwrap_or(expected_yield);
        
        // Calculate impact metrics based on the yield
        let mut impact_metrics = HashMap::new();
        
        // Carbon offset (tons of CO2)
        impact_metrics.insert(
            "carbon_offset_tons".to_string(),
            adjusted_yield.checked_div(U256::from(10)).unwrap_or_default(),
        );
        
        // Land area protected (hectares)
        impact_metrics.insert(
            "land_area_protected_hectares".to_string(),
            adjusted_yield.checked_div(U256::from(100)).unwrap_or_default(),
        );
        
        // Renewable energy (MWh)
        impact_metrics.insert(
            "renewable_energy_mwh".to_string(),
            adjusted_yield.checked_div(U256::from(50)).unwrap_or_default(),
        );
        
        // Auto-retired credits
        let retirement_amount = investment_amount
            .checked_mul(env_metadata.retirement_percentage)
            .unwrap_or_default()
            .checked_div(U256::from(100))
            .unwrap_or_default();
            
        impact_metrics.insert("auto_retired_credits".to_string(), retirement_amount);
        
        Ok(impact_metrics)
    }
} 