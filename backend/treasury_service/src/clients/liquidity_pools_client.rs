use ethers::prelude::*;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use eyre::Result;
use std::collections::HashMap;

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

/// Configuration of a liquidity pool
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PoolConfig {
    pub pool_id: [u8; 32],
    pub token_a: Address,
    pub token_b: Address,
    pub asset_class_a: AssetClass,
    pub asset_class_b: AssetClass,
    pub fee_tier: u32,
    pub initial_sqrt_price: U256,
    pub tick_spacing: u32,
    pub active: bool,
    pub owner: Address,
}

/// Current state of a liquidity pool
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PoolState {
    pub sqrt_price_x96: U256,
    pub tick: i32,
    pub observation_index: u16,
    pub total_liquidity: u128,
    pub volume_token_a: U256,
    pub volume_token_b: U256,
    pub fees_collected_a: U256,
    pub fees_collected_b: U256,
    pub last_updated: u64,
}

/// Liquidity position in a pool
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub position_id: [u8; 32],
    pub pool_id: [u8; 32],
    pub owner: Address,
    pub lower_tick: i32,
    pub upper_tick: i32,
    pub liquidity: u128,
    pub tokens_owed_a: U256,
    pub tokens_owed_b: U256,
    pub created_at: u64,
}

/// Client for interacting with the LiquidityPools contract
pub struct LiquidityPoolsClient<M> {
    /// Contract instance
    contract: Arc<ethers::contract::Contract<M>>,
    /// Contract address
    address: Address,
}

impl<M: Middleware> LiquidityPoolsClient<M> {
    /// Create a new client instance
    pub fn new(client: Arc<M>, address: Address) -> Self {
        // Note: In a real implementation, we would load the ABI from a file or embed it
        let abi = include_str!("../abi/LiquidityPools.json");
        let contract = Arc::new(
            ethers::contract::Contract::new(address, serde_json::from_str(abi).unwrap(), client),
        );
        
        Self { contract, address }
    }
    
    /// Create a new liquidity pool
    pub async fn create_pool(
        &self,
        token_a: Address,
        token_b: Address,
        asset_class_a: AssetClass,
        asset_class_b: AssetClass,
        fee_tier: u32,
        initial_sqrt_price: U256,
        tick_spacing: u32,
    ) -> Result<[u8; 32]> {
        let call = self
            .contract
            .method::<_, [u8; 32]>(
                "createPool",
                (token_a, token_b, asset_class_a, asset_class_b, fee_tier, initial_sqrt_price, tick_spacing),
            )?;
            
        let pool_id = call.call().await?;
        Ok(pool_id)
    }
    
    /// Add liquidity to a pool
    pub async fn add_liquidity(
        &self,
        pool_id: [u8; 32],
        lower_tick: i32,
        upper_tick: i32,
        amount0_desired: U256,
        amount1_desired: U256,
        amount0_min: U256,
        amount1_min: U256,
    ) -> Result<(
        [u8; 32], // position_id
        u128,     // liquidity
        U256,     // amount0
        U256,     // amount1
    )> {
        let call = self
            .contract
            .method::<_, ([u8; 32], u128, U256, U256)>(
                "addLiquidity",
                (pool_id, lower_tick, upper_tick, amount0_desired, amount1_desired, amount0_min, amount1_min),
            )?;
            
        let result = call.call().await?;
        Ok(result)
    }
    
    /// Remove liquidity from a position
    pub async fn remove_liquidity(
        &self,
        position_id: [u8; 32],
        liquidity_amount: u128,
        amount0_min: U256,
        amount1_min: U256,
    ) -> Result<(U256, U256)> {
        let call = self
            .contract
            .method::<_, (U256, U256)>(
                "removeLiquidity",
                (position_id, liquidity_amount, amount0_min, amount1_min),
            )?;
            
        let (amount0, amount1) = call.call().await?;
        Ok((amount0, amount1))
    }
    
    /// Collect fees from a position
    pub async fn collect_fees(
        &self,
        position_id: [u8; 32],
        recipient: Address,
    ) -> Result<(U256, U256)> {
        let call = self
            .contract
            .method::<_, (U256, U256)>(
                "collectFees",
                (position_id, recipient),
            )?;
            
        let (amount0, amount1) = call.call().await?;
        Ok((amount0, amount1))
    }
    
    /// Execute a swap
    pub async fn swap(
        &self,
        pool_id: [u8; 32],
        recipient: Address,
        zero_for_one: bool,
        amount_specified: I256,
        sqrt_price_limit_x96: U256,
    ) -> Result<(I256, I256)> {
        let call = self
            .contract
            .method::<_, (I256, I256)>(
                "swap",
                (pool_id, recipient, zero_for_one, amount_specified, sqrt_price_limit_x96),
            )?;
            
        let (amount0, amount1) = call.call().await?;
        Ok((amount0, amount1))
    }
    
    /// Get pool configuration
    pub async fn get_pool_config(&self, pool_id: [u8; 32]) -> Result<PoolConfig> {
        let call = self
            .contract
            .method::<_, PoolConfig>(
                "getPoolConfig",
                pool_id,
            )?;
            
        let config = call.call().await?;
        Ok(config)
    }
    
    /// Get pool state
    pub async fn get_pool_state(&self, pool_id: [u8; 32]) -> Result<PoolState> {
        let call = self
            .contract
            .method::<_, PoolState>(
                "getPoolState",
                pool_id,
            )?;
            
        let state = call.call().await?;
        Ok(state)
    }
    
    /// Get position details
    pub async fn get_position(&self, position_id: [u8; 32]) -> Result<Position> {
        let call = self
            .contract
            .method::<_, Position>(
                "getPosition",
                position_id,
            )?;
            
        let position = call.call().await?;
        Ok(position)
    }
    
    /// Get all positions for a user
    pub async fn get_user_positions(&self, user: Address) -> Result<Vec<[u8; 32]>> {
        let call = self
            .contract
            .method::<_, Vec<[u8; 32]>>(
                "getUserPositions",
                user,
            )?;
            
        let position_ids = call.call().await?;
        Ok(position_ids)
    }
    
    /// Get all positions in a pool
    pub async fn get_pool_positions(&self, pool_id: [u8; 32]) -> Result<Vec<[u8; 32]>> {
        let call = self
            .contract
            .method::<_, Vec<[u8; 32]>>(
                "getPoolPositions",
                pool_id,
            )?;
            
        let position_ids = call.call().await?;
        Ok(position_ids)
    }
    
    /// Get the price of a pool
    pub async fn get_pool_price(&self, pool_id: [u8; 32]) -> Result<(U256, i32)> {
        let call = self
            .contract
            .method::<_, (U256, i32)>(
                "getPoolPrice",
                pool_id,
            )?;
            
        let (sqrt_price_x96, tick) = call.call().await?;
        Ok((sqrt_price_x96, tick))
    }
    
    /// Get all pools
    pub async fn get_all_pools(&self) -> Result<Vec<[u8; 32]>> {
        let call = self
            .contract
            .method::<_, Vec<[u8; 32]>>(
                "getAllPools",
                (),
            )?;
            
        let pool_ids = call.call().await?;
        Ok(pool_ids)
    }
    
    /// Get pools containing a specific token
    pub async fn get_pools_by_token(&self, token: Address) -> Result<Vec<[u8; 32]>> {
        let call = self
            .contract
            .method::<_, Vec<[u8; 32]>>(
                "getPoolsByToken",
                token,
            )?;
            
        let pool_ids = call.call().await?;
        Ok(pool_ids)
    }
    
    /// Get pools for a specific asset class
    pub async fn get_pools_by_asset_class(&self, asset_class: AssetClass) -> Result<Vec<[u8; 32]>> {
        let call = self
            .contract
            .method::<_, Vec<[u8; 32]>>(
                "getPoolsByAssetClass",
                asset_class,
            )?;
            
        let pool_ids = call.call().await?;
        Ok(pool_ids)
    }
    
    /// Calculate liquidity amount from token amounts
    pub async fn calculate_liquidity(
        &self,
        pool_id: [u8; 32],
        lower_tick: i32,
        upper_tick: i32,
        amount0: U256,
        amount1: U256,
    ) -> Result<u128> {
        let call = self
            .contract
            .method::<_, u128>(
                "calculateLiquidity",
                (pool_id, lower_tick, upper_tick, amount0, amount1),
            )?;
            
        let liquidity = call.call().await?;
        Ok(liquidity)
    }
    
    /// Calculate token amounts from liquidity amount
    pub async fn calculate_amounts(
        &self,
        pool_id: [u8; 32],
        lower_tick: i32,
        upper_tick: i32,
        liquidity: u128,
    ) -> Result<(U256, U256)> {
        let call = self
            .contract
            .method::<_, (U256, U256)>(
                "calculateAmounts",
                (pool_id, lower_tick, upper_tick, liquidity),
            )?;
            
        let (amount0, amount1) = call.call().await?;
        Ok((amount0, amount1))
    }
    
    /// Quote a swap
    pub async fn quote_swap(
        &self,
        pool_id: [u8; 32],
        zero_for_one: bool,
        amount_specified: I256,
    ) -> Result<(I256, I256, U256, i32, u128)> {
        let call = self
            .contract
            .method::<_, (I256, I256, U256, i32, u128)>(
                "quoteSwap",
                (pool_id, zero_for_one, amount_specified),
            )?;
            
        let result = call.call().await?;
        Ok(result)
    }
    
    /// Set fee tier for a pool
    pub async fn set_pool_fee(
        &self,
        pool_id: [u8; 32],
        new_fee_tier: u32,
    ) -> Result<bool> {
        let call = self
            .contract
            .method::<_, bool>(
                "setPoolFee",
                (pool_id, new_fee_tier),
            )?;
            
        let success = call.call().await?;
        Ok(success)
    }
    
    /// Get fee details for a pool
    pub async fn get_fee_details(
        &self,
        pool_id: [u8; 32],
    ) -> Result<(u32, u16, U256)> {
        let call = self
            .contract
            .method::<_, (u32, u16, U256)>(
                "getFeeDetails",
                pool_id,
            )?;
            
        let (fee_tier, protocol_fee_bps, effective_fee) = call.call().await?;
        Ok((fee_tier, protocol_fee_bps, effective_fee))
    }
    
    /// Get all user positions with details
    pub async fn get_user_positions_with_details(
        &self,
        user: Address,
    ) -> Result<HashMap<[u8; 32], Position>> {
        let position_ids = self.get_user_positions(user).await?;
        let mut positions = HashMap::new();
        
        for position_id in position_ids {
            let position = self.get_position(position_id).await?;
            positions.insert(position_id, position);
        }
        
        Ok(positions)
    }
} 