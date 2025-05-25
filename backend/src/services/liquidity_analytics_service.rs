use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio;
use chrono::{DateTime, Utc, Duration};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum OptimizationStrategy {
    Conservative,
    Balanced,
    Aggressive,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MarketCondition {
    Stable,
    Volatile,
    Illiquid,
    Stressed,
    Optimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FeeModel {
    Static,
    VolatilityBased,
    LiquidityBased,
    Hybrid,
    TimeWeighted,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LiquidityPool {
    pub pool_id: String,
    pub token_a: String,
    pub token_b: String,
    pub fee_tier: u32,
    pub total_liquidity: u128,
    pub current_price: f64,
    pub price_24h_change: f64,
    pub volume_24h: u128,
    pub fees_24h: u128,
    pub apy_estimate: f64,
    pub last_updated: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptimizedPosition {
    pub position_id: String,
    pub pool_id: String,
    pub owner: String,
    pub strategy: OptimizationStrategy,
    pub current_yield: f64,
    pub target_yield: f64,
    pub capital_efficiency: f64,
    pub impermanent_loss: f64,
    pub total_fees_earned: u128,
    pub performance_score: f64,
    pub last_rebalance: DateTime<Utc>,
    pub next_rebalance_due: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YieldOpportunity {
    pub pool_id: String,
    pub estimated_apy: f64,
    pub risk_score: f64,
    pub confidence_level: f64,
    pub liquidity_required: u128,
    pub time_horizon: Duration,
    pub market_condition: MarketCondition,
    pub valid_until: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketAnalytics {
    pub pool_id: String,
    pub volatility_30d: f64,
    pub volume_24h: u128,
    pub average_spread: f64,
    pub liquidity_depth: u128,
    pub price_impact_1k: f64,
    pub price_impact_10k: f64,
    pub price_impact_100k: f64,
    pub trade_count_24h: u32,
    pub unique_traders_24h: u32,
    pub market_condition: MarketCondition,
    pub last_updated: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DynamicFeeData {
    pub pool_id: String,
    pub fee_model: FeeModel,
    pub current_fee: f64,
    pub base_fee: f64,
    pub volatility_adjustment: f64,
    pub liquidity_adjustment: f64,
    pub time_adjustment: f64,
    pub market_condition: MarketCondition,
    pub last_calculation: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LiquidityRecommendation {
    pub recommendation_type: String,
    pub priority: String, // High, Medium, Low
    pub action: String,   // Rebalance, Add, Remove, Hold
    pub reason: String,
    pub expected_improvement: f64,
    pub risk_level: String,
    pub time_sensitive: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortfolioAnalytics {
    pub total_value_locked: u128,
    pub total_yield_earned: u128,
    pub average_apy: f64,
    pub total_impermanent_loss: f64,
    pub capital_efficiency_score: f64,
    pub risk_score: f64,
    pub diversification_score: f64,
    pub active_positions: u32,
    pub pending_rebalances: u32,
}

pub struct LiquidityAnalyticsService {
    pools: HashMap<String, LiquidityPool>,
    optimized_positions: HashMap<String, OptimizedPosition>,
    market_analytics: HashMap<String, MarketAnalytics>,
    yield_opportunities: Vec<YieldOpportunity>,
    dynamic_fees: HashMap<String, DynamicFeeData>,
}

impl LiquidityAnalyticsService {
    pub fn new() -> Self {
        Self {
            pools: HashMap::new(),
            optimized_positions: HashMap::new(),
            market_analytics: HashMap::new(),
            yield_opportunities: Vec::new(),
            dynamic_fees: HashMap::new(),
        }
    }

    /// Update pool data and recalculate analytics
    pub async fn update_pool_data(&mut self, pool: LiquidityPool) -> Result<(), Box<dyn std::error::Error>> {
        let pool_id = pool.pool_id.clone();
        
        // Update pool data
        self.pools.insert(pool_id.clone(), pool.clone());
        
        // Recalculate market analytics
        self.calculate_market_analytics(&pool_id).await?;
        
        // Update dynamic fees
        self.calculate_dynamic_fees(&pool_id).await?;
        
        // Detect yield opportunities
        self.detect_yield_opportunities(&pool_id).await?;
        
        Ok(())
    }

    /// Calculate comprehensive market analytics for a pool
    pub async fn calculate_market_analytics(&mut self, pool_id: &str) -> Result<MarketAnalytics, Box<dyn std::error::Error>> {
        let pool = self.pools.get(pool_id)
            .ok_or("Pool not found")?;

        // Calculate volatility (simplified - in production would use historical data)
        let volatility_30d = self.calculate_volatility(pool_id, 30).await?;
        
        // Calculate price impact for different trade sizes
        let price_impact_1k = self.calculate_price_impact(pool_id, 1000.0).await?;
        let price_impact_10k = self.calculate_price_impact(pool_id, 10000.0).await?;
        let price_impact_100k = self.calculate_price_impact(pool_id, 100000.0).await?;
        
        // Calculate average spread
        let average_spread = self.calculate_average_spread(pool_id).await?;
        
        // Assess market condition
        let market_condition = self.assess_market_condition(
            volatility_30d,
            pool.total_liquidity,
            pool.volume_24h,
            average_spread,
        );

        let analytics = MarketAnalytics {
            pool_id: pool_id.to_string(),
            volatility_30d,
            volume_24h: pool.volume_24h,
            average_spread,
            liquidity_depth: pool.total_liquidity,
            price_impact_1k,
            price_impact_10k,
            price_impact_100k,
            trade_count_24h: self.get_trade_count_24h(pool_id).await?,
            unique_traders_24h: self.get_unique_traders_24h(pool_id).await?,
            market_condition,
            last_updated: Utc::now(),
        };

        self.market_analytics.insert(pool_id.to_string(), analytics.clone());
        Ok(analytics)
    }

    /// Calculate dynamic fees based on market conditions
    pub async fn calculate_dynamic_fees(&mut self, pool_id: &str) -> Result<DynamicFeeData, Box<dyn std::error::Error>> {
        let pool = self.pools.get(pool_id)
            .ok_or("Pool not found")?;
        
        let analytics = self.market_analytics.get(pool_id)
            .ok_or("Market analytics not available")?;

        // Base fee from pool configuration
        let base_fee = (pool.fee_tier as f64) / 10000.0; // Convert basis points to percentage

        // Calculate adjustments based on market conditions
        let volatility_adjustment = self.calculate_volatility_fee_adjustment(analytics.volatility_30d);
        let liquidity_adjustment = self.calculate_liquidity_fee_adjustment(analytics.liquidity_depth);
        let time_adjustment = self.calculate_time_fee_adjustment(analytics.last_updated);

        // Apply fee model (using Hybrid model for this example)
        let total_adjustment = volatility_adjustment + liquidity_adjustment + time_adjustment;
        let current_fee = (base_fee + total_adjustment).max(0.0001).min(0.1); // 0.01% to 10%

        let fee_data = DynamicFeeData {
            pool_id: pool_id.to_string(),
            fee_model: FeeModel::Hybrid,
            current_fee,
            base_fee,
            volatility_adjustment,
            liquidity_adjustment,
            time_adjustment,
            market_condition: analytics.market_condition.clone(),
            last_calculation: Utc::now(),
        };

        self.dynamic_fees.insert(pool_id.to_string(), fee_data.clone());
        Ok(fee_data)
    }

    /// Detect yield opportunities across pools
    pub async fn detect_yield_opportunities(&mut self, pool_id: &str) -> Result<Vec<YieldOpportunity>, Box<dyn std::error::Error>> {
        let pool = self.pools.get(pool_id)
            .ok_or("Pool not found")?;
        
        let analytics = self.market_analytics.get(pool_id)
            .ok_or("Market analytics not available")?;

        let mut opportunities = Vec::new();

        // Calculate estimated APY based on recent performance
        let estimated_apy = self.calculate_estimated_apy(pool_id).await?;
        
        // Calculate risk score based on volatility and liquidity
        let risk_score = self.calculate_risk_score(analytics);
        
        // Calculate confidence level based on data quality and market stability
        let confidence_level = self.calculate_confidence_level(analytics);

        // Only create opportunity if it meets minimum criteria
        if estimated_apy > 5.0 && risk_score < 70.0 && confidence_level > 60.0 {
            let opportunity = YieldOpportunity {
                pool_id: pool_id.to_string(),
                estimated_apy,
                risk_score,
                confidence_level,
                liquidity_required: 100_000 * 1_000_000_000_000_000_000, // 100k tokens
                time_horizon: Duration::hours(24),
                market_condition: analytics.market_condition.clone(),
                valid_until: Utc::now() + Duration::hours(24),
            };

            opportunities.push(opportunity.clone());
            self.yield_opportunities.push(opportunity);
        }

        Ok(opportunities)
    }

    /// Generate optimization recommendations for a position
    pub async fn generate_optimization_recommendations(
        &self,
        position_id: &str,
    ) -> Result<Vec<LiquidityRecommendation>, Box<dyn std::error::Error>> {
        let position = self.optimized_positions.get(position_id)
            .ok_or("Position not found")?;
        
        let analytics = self.market_analytics.get(&position.pool_id)
            .ok_or("Market analytics not available")?;

        let mut recommendations = Vec::new();

        // Check if rebalancing is needed
        if self.should_rebalance(position, analytics) {
            recommendations.push(LiquidityRecommendation {
                recommendation_type: "Rebalancing".to_string(),
                priority: "High".to_string(),
                action: "Rebalance".to_string(),
                reason: "Position has drifted outside optimal range".to_string(),
                expected_improvement: 2.5,
                risk_level: "Low".to_string(),
                time_sensitive: true,
            });
        }

        // Check for yield optimization opportunities
        if position.current_yield < position.target_yield * 0.9 {
            recommendations.push(LiquidityRecommendation {
                recommendation_type: "Yield Optimization".to_string(),
                priority: "Medium".to_string(),
                action: "Optimize".to_string(),
                reason: "Current yield is below target by more than 10%".to_string(),
                expected_improvement: position.target_yield - position.current_yield,
                risk_level: "Medium".to_string(),
                time_sensitive: false,
            });
        }

        // Check for capital efficiency improvements
        if position.capital_efficiency < 75.0 {
            recommendations.push(LiquidityRecommendation {
                recommendation_type: "Capital Efficiency".to_string(),
                priority: "Medium".to_string(),
                action: "Concentrate".to_string(),
                reason: "Capital efficiency is below optimal threshold".to_string(),
                expected_improvement: 5.0,
                risk_level: "Medium".to_string(),
                time_sensitive: false,
            });
        }

        // Check market condition recommendations
        match analytics.market_condition {
            MarketCondition::Volatile => {
                recommendations.push(LiquidityRecommendation {
                    recommendation_type: "Risk Management".to_string(),
                    priority: "High".to_string(),
                    action: "Reduce".to_string(),
                    reason: "High volatility detected - consider reducing exposure".to_string(),
                    expected_improvement: 0.0,
                    risk_level: "High".to_string(),
                    time_sensitive: true,
                });
            },
            MarketCondition::Optimal => {
                recommendations.push(LiquidityRecommendation {
                    recommendation_type: "Opportunity".to_string(),
                    priority: "Low".to_string(),
                    action: "Add".to_string(),
                    reason: "Optimal market conditions - consider increasing position".to_string(),
                    expected_improvement: 1.5,
                    risk_level: "Low".to_string(),
                    time_sensitive: false,
                });
            },
            _ => {}
        }

        Ok(recommendations)
    }

    /// Calculate portfolio-level analytics
    pub async fn calculate_portfolio_analytics(&self, owner: &str) -> Result<PortfolioAnalytics, Box<dyn std::error::Error>> {
        let user_positions: Vec<&OptimizedPosition> = self.optimized_positions
            .values()
            .filter(|p| p.owner == owner)
            .collect();

        if user_positions.is_empty() {
            return Ok(PortfolioAnalytics {
                total_value_locked: 0,
                total_yield_earned: 0,
                average_apy: 0.0,
                total_impermanent_loss: 0.0,
                capital_efficiency_score: 0.0,
                risk_score: 0.0,
                diversification_score: 0.0,
                active_positions: 0,
                pending_rebalances: 0,
            });
        }

        let total_value_locked = user_positions.iter()
            .map(|p| p.total_fees_earned)
            .sum::<u128>() * 20; // Estimate TVL from fees (simplified)

        let total_yield_earned = user_positions.iter()
            .map(|p| p.total_fees_earned)
            .sum();

        let average_apy = user_positions.iter()
            .map(|p| p.current_yield)
            .sum::<f64>() / user_positions.len() as f64;

        let total_impermanent_loss = user_positions.iter()
            .map(|p| p.impermanent_loss)
            .sum::<f64>();

        let capital_efficiency_score = user_positions.iter()
            .map(|p| p.capital_efficiency)
            .sum::<f64>() / user_positions.len() as f64;

        let risk_score = self.calculate_portfolio_risk_score(&user_positions);
        let diversification_score = self.calculate_diversification_score(&user_positions);

        let pending_rebalances = user_positions.iter()
            .filter(|p| p.next_rebalance_due <= Utc::now())
            .count() as u32;

        Ok(PortfolioAnalytics {
            total_value_locked,
            total_yield_earned,
            average_apy,
            total_impermanent_loss,
            capital_efficiency_score,
            risk_score,
            diversification_score,
            active_positions: user_positions.len() as u32,
            pending_rebalances,
        })
    }

    /// Get real-time market data for dashboard
    pub async fn get_real_time_market_data(&self) -> Result<HashMap<String, MarketAnalytics>, Box<dyn std::error::Error>> {
        Ok(self.market_analytics.clone())
    }

    /// Get yield opportunities sorted by attractiveness
    pub async fn get_yield_opportunities(&self) -> Result<Vec<YieldOpportunity>, Box<dyn std::error::Error>> {
        let mut opportunities = self.yield_opportunities.clone();
        
        // Filter out expired opportunities
        opportunities.retain(|opp| opp.valid_until > Utc::now());
        
        // Sort by estimated APY descending, then by risk score ascending
        opportunities.sort_by(|a, b| {
            b.estimated_apy.partial_cmp(&a.estimated_apy)
                .unwrap_or(std::cmp::Ordering::Equal)
                .then_with(|| a.risk_score.partial_cmp(&b.risk_score).unwrap_or(std::cmp::Ordering::Equal))
        });

        Ok(opportunities)
    }

    // Helper methods for calculations

    async fn calculate_volatility(&self, _pool_id: &str, _days: u32) -> Result<f64, Box<dyn std::error::Error>> {
        // Simplified volatility calculation - in production would use historical price data
        Ok(15.5) // 15.5% volatility
    }

    async fn calculate_price_impact(&self, pool_id: &str, trade_size: f64) -> Result<f64, Box<dyn std::error::Error>> {
        let pool = self.pools.get(pool_id)
            .ok_or("Pool not found")?;
        
        // Simplified price impact calculation
        let liquidity_ratio = trade_size / (pool.total_liquidity as f64 / 1e18);
        let price_impact = liquidity_ratio * 0.5; // 0.5% impact per 1% of liquidity
        
        Ok(price_impact.min(10.0)) // Cap at 10%
    }

    async fn calculate_average_spread(&self, _pool_id: &str) -> Result<f64, Box<dyn std::error::Error>> {
        // Simplified spread calculation
        Ok(0.3) // 0.3% average spread
    }

    async fn get_trade_count_24h(&self, _pool_id: &str) -> Result<u32, Box<dyn std::error::Error>> {
        Ok(1250) // Placeholder trade count
    }

    async fn get_unique_traders_24h(&self, _pool_id: &str) -> Result<u32, Box<dyn std::error::Error>> {
        Ok(340) // Placeholder unique traders
    }

    fn assess_market_condition(&self, volatility: f64, liquidity: u128, volume: u128, spread: f64) -> MarketCondition {
        let high_volatility = volatility > 20.0;
        let low_volatility = volatility < 5.0;
        let high_liquidity = liquidity > 1_000_000 * 1_000_000_000_000_000_000; // 1M tokens
        let low_liquidity = liquidity < 100_000 * 1_000_000_000_000_000_000;   // 100k tokens
        let high_volume = volume > 500_000 * 1_000_000_000_000_000_000;        // 500k volume
        let tight_spread = spread < 0.5;

        match (high_volatility, low_volatility, high_liquidity, low_liquidity, high_volume, tight_spread) {
            (false, true, true, false, _, true) => MarketCondition::Optimal,
            (true, false, false, true, _, _) => MarketCondition::Stressed,
            (true, false, _, _, _, _) => MarketCondition::Volatile,
            (_, _, false, true, _, _) => MarketCondition::Illiquid,
            _ => MarketCondition::Stable,
        }
    }

    fn calculate_volatility_fee_adjustment(&self, volatility: f64) -> f64 {
        // Higher volatility = higher fees
        let volatility_delta = volatility - 5.0; // 5% baseline
        (volatility_delta * 0.001).max(-0.002).min(0.005) // -0.2% to +0.5% adjustment
    }

    fn calculate_liquidity_fee_adjustment(&self, liquidity: u128) -> f64 {
        // Lower liquidity = higher fees
        let liquidity_threshold = 1_000_000u128 * 1_000_000_000_000_000_000u128; // 1M tokens
        let liquidity_ratio = (liquidity as f64) / (liquidity_threshold as f64);
        
        if liquidity_ratio < 0.1 {
            0.003 // +0.3% for very low liquidity
        } else if liquidity_ratio < 0.5 {
            0.001 // +0.1% for low liquidity
        } else if liquidity_ratio > 2.0 {
            -0.001 // -0.1% for high liquidity
        } else {
            0.0 // No adjustment for normal liquidity
        }
    }

    fn calculate_time_fee_adjustment(&self, last_updated: DateTime<Utc>) -> f64 {
        let hours_since_update = (Utc::now() - last_updated).num_hours();
        
        if hours_since_update > 24 {
            0.002 // +0.2% for stale data
        } else if hours_since_update > 6 {
            0.001 // +0.1% for somewhat stale data
        } else {
            0.0 // No adjustment for fresh data
        }
    }

    async fn calculate_estimated_apy(&self, pool_id: &str) -> Result<f64, Box<dyn std::error::Error>> {
        let pool = self.pools.get(pool_id)
            .ok_or("Pool not found")?;
        
        // Simplified APY calculation based on fees and volume
        let daily_fees = (pool.fees_24h as f64) / 1e18;
        let total_liquidity = (pool.total_liquidity as f64) / 1e18;
        
        if total_liquidity > 0.0 {
            let daily_yield = daily_fees / total_liquidity;
            let apy = daily_yield * 365.0 * 100.0; // Convert to percentage
            Ok(apy)
        } else {
            Ok(0.0)
        }
    }

    fn calculate_risk_score(&self, analytics: &MarketAnalytics) -> f64 {
        let volatility_score = (analytics.volatility_30d / 50.0 * 100.0).min(100.0);
        let liquidity_score = if analytics.liquidity_depth < 100_000 * 1_000_000_000_000_000_000 {
            80.0
        } else if analytics.liquidity_depth < 500_000 * 1_000_000_000_000_000_000 {
            40.0
        } else {
            20.0
        };
        
        let spread_score = (analytics.average_spread * 20.0).min(100.0);
        
        (volatility_score + liquidity_score + spread_score) / 3.0
    }

    fn calculate_confidence_level(&self, analytics: &MarketAnalytics) -> f64 {
        let data_freshness = if (Utc::now() - analytics.last_updated).num_hours() < 1 {
            100.0
        } else if (Utc::now() - analytics.last_updated).num_hours() < 6 {
            80.0
        } else {
            50.0
        };
        
        let trade_volume_score = if analytics.trade_count_24h > 1000 {
            100.0
        } else if analytics.trade_count_24h > 100 {
            80.0
        } else {
            60.0
        };
        
        (data_freshness + trade_volume_score) / 2.0
    }

    fn should_rebalance(&self, position: &OptimizedPosition, analytics: &MarketAnalytics) -> bool {
        // Check if rebalance is due based on time
        if position.next_rebalance_due <= Utc::now() {
            return true;
        }
        
        // Check if market conditions warrant immediate rebalancing
        match analytics.market_condition {
            MarketCondition::Stressed | MarketCondition::Volatile => true,
            _ => false,
        }
    }

    fn calculate_portfolio_risk_score(&self, positions: &[&OptimizedPosition]) -> f64 {
        if positions.is_empty() {
            return 0.0;
        }
        
        // Calculate weighted average risk based on position sizes
        let total_value: u128 = positions.iter().map(|p| p.total_fees_earned * 20).sum();
        
        if total_value == 0 {
            return 50.0; // Default medium risk
        }
        
        let weighted_risk: f64 = positions.iter()
            .map(|p| {
                let weight = (p.total_fees_earned * 20) as f64 / total_value as f64;
                let position_risk = match p.strategy {
                    OptimizationStrategy::Conservative => 20.0,
                    OptimizationStrategy::Balanced => 50.0,
                    OptimizationStrategy::Aggressive => 80.0,
                    OptimizationStrategy::Custom => 60.0,
                };
                weight * position_risk
            })
            .sum();
        
        weighted_risk
    }

    fn calculate_diversification_score(&self, positions: &[&OptimizedPosition]) -> f64 {
        if positions.is_empty() {
            return 0.0;
        }
        
        // Count unique pools
        let unique_pools: std::collections::HashSet<&String> = positions.iter()
            .map(|p| &p.pool_id)
            .collect();
        
        let diversification_ratio = unique_pools.len() as f64 / positions.len() as f64;
        diversification_ratio * 100.0
    }

    /// Add a new optimized position
    pub async fn add_optimized_position(&mut self, position: OptimizedPosition) -> Result<(), Box<dyn std::error::Error>> {
        self.optimized_positions.insert(position.position_id.clone(), position);
        Ok(())
    }

    /// Update an existing optimized position
    pub async fn update_optimized_position(&mut self, position: OptimizedPosition) -> Result<(), Box<dyn std::error::Error>> {
        if self.optimized_positions.contains_key(&position.position_id) {
            self.optimized_positions.insert(position.position_id.clone(), position);
            Ok(())
        } else {
            Err("Position not found".into())
        }
    }

    /// Get position by ID
    pub async fn get_position(&self, position_id: &str) -> Result<OptimizedPosition, Box<dyn std::error::Error>> {
        self.optimized_positions.get(position_id)
            .cloned()
            .ok_or("Position not found".into())
    }

    /// Get all positions for a user
    pub async fn get_user_positions(&self, owner: &str) -> Result<Vec<OptimizedPosition>, Box<dyn std::error::Error>> {
        let positions = self.optimized_positions.values()
            .filter(|p| p.owner == owner)
            .cloned()
            .collect();
        
        Ok(positions)
    }
} 