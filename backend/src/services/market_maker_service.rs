use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio;
use anyhow::{Result, anyhow};
use chrono::{DateTime, Utc, Duration};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum PerformanceTier {
    Bronze,
    Silver,
    Gold,
    Platinum,
    Diamond,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketMakerProfile {
    pub address: String,
    pub name: String,
    pub registration_date: DateTime<Utc>,
    pub current_tier: PerformanceTier,
    pub stake_amount: u128,
    pub is_active: bool,
    pub kyc_verified: bool,
    pub compliance_score: u32,
    pub total_rewards_earned: u128,
    pub consecutive_days: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub market_maker: String,
    pub date: DateTime<Utc>,
    pub volume_24h: u128,
    pub uptime_percentage: f64,
    pub average_spread_bps: u32,
    pub number_of_trades: u64,
    pub liquidity_provided: u128,
    pub price_improvement: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RewardCalculation {
    pub market_maker: String,
    pub date: DateTime<Utc>,
    pub base_reward: u128,
    pub volume_bonus: u128,
    pub uptime_bonus: u128,
    pub spread_bonus: u128,
    pub tier_multiplier: f64,
    pub consecutive_days_bonus: u128,
    pub total_reward: u128,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyRewardPool {
    pub date: DateTime<Utc>,
    pub total_pool: u128,
    pub distributed_amount: u128,
    pub remaining_amount: u128,
    pub number_of_participants: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TierRequirements {
    pub tier: PerformanceTier,
    pub min_volume_24h: u128,
    pub min_uptime_percentage: f64,
    pub max_spread_bps: u32,
    pub min_consecutive_days: u32,
    pub stake_requirement: u128,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketMakerStats {
    pub total_market_makers: u32,
    pub active_market_makers: u32,
    pub total_volume_24h: u128,
    pub average_uptime: f64,
    pub total_rewards_distributed: u128,
    pub tier_distribution: HashMap<PerformanceTier, u32>,
}

pub struct MarketMakerService {
    market_makers: HashMap<String, MarketMakerProfile>,
    performance_metrics: HashMap<String, Vec<PerformanceMetrics>>,
    reward_history: HashMap<String, Vec<RewardCalculation>>,
    daily_pools: HashMap<String, DailyRewardPool>, // date string -> pool
    tier_requirements: HashMap<PerformanceTier, TierRequirements>,
    daily_reward_pool_size: u128,
}

impl MarketMakerService {
    pub fn new() -> Self {
        let mut service = Self {
            market_makers: HashMap::new(),
            performance_metrics: HashMap::new(),
            reward_history: HashMap::new(),
            daily_pools: HashMap::new(),
            tier_requirements: HashMap::new(),
            daily_reward_pool_size: 1_000_000 * 10u128.pow(18), // 1M tokens per day
        };

        service.initialize_tier_requirements();
        service
    }

    fn initialize_tier_requirements(&mut self) {
        let requirements = vec![
            TierRequirements {
                tier: PerformanceTier::Bronze,
                min_volume_24h: 10_000 * 10u128.pow(18),
                min_uptime_percentage: 80.0,
                max_spread_bps: 100,
                min_consecutive_days: 1,
                stake_requirement: 1_000 * 10u128.pow(18),
            },
            TierRequirements {
                tier: PerformanceTier::Silver,
                min_volume_24h: 50_000 * 10u128.pow(18),
                min_uptime_percentage: 85.0,
                max_spread_bps: 75,
                min_consecutive_days: 7,
                stake_requirement: 5_000 * 10u128.pow(18),
            },
            TierRequirements {
                tier: PerformanceTier::Gold,
                min_volume_24h: 100_000 * 10u128.pow(18),
                min_uptime_percentage: 90.0,
                max_spread_bps: 50,
                min_consecutive_days: 14,
                stake_requirement: 10_000 * 10u128.pow(18),
            },
            TierRequirements {
                tier: PerformanceTier::Platinum,
                min_volume_24h: 500_000 * 10u128.pow(18),
                min_uptime_percentage: 95.0,
                max_spread_bps: 30,
                min_consecutive_days: 30,
                stake_requirement: 50_000 * 10u128.pow(18),
            },
            TierRequirements {
                tier: PerformanceTier::Diamond,
                min_volume_24h: 1_000_000 * 10u128.pow(18),
                min_uptime_percentage: 98.0,
                max_spread_bps: 20,
                min_consecutive_days: 60,
                stake_requirement: 100_000 * 10u128.pow(18),
            },
        ];

        for req in requirements {
            self.tier_requirements.insert(req.tier.clone(), req);
        }
    }

    pub async fn register_market_maker(
        &mut self,
        address: String,
        name: String,
        _stake_amount: u128,
        kyc_verified: bool,
    ) -> Result<()> {
        if self.market_makers.contains_key(&address) {
            return Err(anyhow!("Market maker {} already registered", address));
        }

        let profile = MarketMakerProfile {
            address: address.clone(),
            name,
            registration_date: Utc::now(),
            current_tier: PerformanceTier::Bronze,
            stake_amount: _stake_amount,
            is_active: true,
            kyc_verified,
            compliance_score: if kyc_verified { 100 } else { 0 },
            total_rewards_earned: 0,
            consecutive_days: 0,
        };

        self.market_makers.insert(address.clone(), profile);
        self.performance_metrics.insert(address.clone(), Vec::new());
        self.reward_history.insert(address.clone(), Vec::new());

        println!("Market maker {} registered successfully", address);
        Ok(())
    }

    pub async fn update_performance_metrics(&mut self, update: PerformanceMetrics) -> Result<()> {
        if !self.market_makers.contains_key(&update.market_maker) {
            return Err(anyhow!("Market maker {} not found", update.market_maker));
        }

        // Store the performance metrics
        if let Some(metrics_list) = self.performance_metrics.get_mut(&update.market_maker) {
            metrics_list.push(update.clone());
            
            // Keep only last 30 days of metrics
            let cutoff_date = Utc::now() - Duration::days(30);
            metrics_list.retain(|m| m.date > cutoff_date);
        }

        // Update tier based on performance
        let today = Utc::now().date_naive().to_string();
        let new_tier = self.calculate_tier(&update.market_maker, &today)?;
        
        if let Some(profile) = self.market_makers.get_mut(&update.market_maker) {
            let tier_changed = new_tier != profile.current_tier;
            profile.current_tier = new_tier;
            
            if tier_changed {
                println!("Market maker {} tier updated to {:?}", update.market_maker, profile.current_tier);
            }
        }

        Ok(())
    }

    pub async fn calculate_daily_rewards(&mut self, date: &str) -> Result<Vec<RewardCalculation>> {
        let mut rewards = Vec::new();
        
        // Get all active market makers with performance data for the date
        let active_makers: Vec<String> = self.market_makers
            .iter()
            .filter(|(_, profile)| profile.is_active && profile.kyc_verified)
            .map(|(address, _)| address.clone())
            .collect();

        if active_makers.is_empty() {
            return Ok(rewards);
        }

        let pool = self.get_or_create_daily_pool(date);
        let pool_per_maker = pool.total_pool / active_makers.len() as u128;

        for market_maker in active_makers {
            if let Some(reward) = self.calculate_individual_reward(&market_maker, date, pool_per_maker).await? {
                rewards.push(reward);
            }
        }

        // Update the daily pool
        let total_distributed: u128 = rewards.iter().map(|r| r.total_reward).sum();
        if let Some(pool) = self.daily_pools.get_mut(date) {
            pool.distributed_amount = total_distributed;
            pool.remaining_amount = pool.total_pool.saturating_sub(total_distributed);
            pool.number_of_participants = rewards.len() as u32;
        }

        Ok(rewards)
    }

    pub async fn calculate_individual_reward(
        &mut self,
        market_maker: &str,
        date: &str,
        base_pool_amount: u128,
    ) -> Result<Option<RewardCalculation>> {
        let profile = self.market_makers.get(market_maker)
            .ok_or_else(|| anyhow!("Market maker {} not found", market_maker))?;

        if !profile.is_active || !profile.kyc_verified {
            return Ok(None);
        }

        // Get performance metrics for the date
        let _metrics = self.performance_metrics.get(market_maker)
            .and_then(|metrics_list| {
                metrics_list.iter()
                    .find(|m| m.date.date_naive().to_string() == date)
            });

        // For now, use base calculation (in production, use actual metrics)
        let base_reward = base_pool_amount;
        let volume_bonus = base_reward / 10; // 10% bonus
        let uptime_bonus = base_reward / 20; // 5% bonus
        let spread_bonus = base_reward / 25; // 4% bonus

        let tier_multiplier = self.get_tier_multiplier(&profile.current_tier);
        let consecutive_days_bonus = (profile.consecutive_days as u128) * (base_reward / 100);

        let total_before_multiplier = base_reward + volume_bonus + uptime_bonus + spread_bonus + consecutive_days_bonus;
        let total_reward = ((total_before_multiplier as f64) * tier_multiplier) as u128;

        let reward = RewardCalculation {
            market_maker: market_maker.to_string(),
            date: Utc::now(),
            base_reward,
            volume_bonus,
            uptime_bonus,
            spread_bonus,
            tier_multiplier,
            consecutive_days_bonus,
            total_reward,
        };

        // Store the reward calculation
        if let Some(reward_list) = self.reward_history.get_mut(market_maker) {
            reward_list.push(reward.clone());
        }

        // Update total rewards earned
        if let Some(profile) = self.market_makers.get_mut(market_maker) {
            profile.total_rewards_earned += total_reward;
            profile.consecutive_days += 1; // Simplified - should check actual consecutive performance
        }

        Ok(Some(reward))
    }

    pub fn calculate_tier(&self, market_maker: &str, _date: &str) -> Result<PerformanceTier> {
        let profile = self.market_makers.get(market_maker)
            .ok_or_else(|| anyhow!("Market maker {} not found", market_maker))?;

        // Get recent performance metrics (simplified)
        let recent_metrics = self.performance_metrics.get(market_maker)
            .map(|metrics| metrics.last())
            .flatten();

        if let Some(metrics) = recent_metrics {
            // Check tier requirements from highest to lowest
            for tier in [PerformanceTier::Diamond, PerformanceTier::Platinum, PerformanceTier::Gold, PerformanceTier::Silver, PerformanceTier::Bronze] {
                if let Some(requirements) = self.tier_requirements.get(&tier) {
                    if metrics.volume_24h >= requirements.min_volume_24h &&
                       metrics.uptime_percentage >= requirements.min_uptime_percentage &&
                       metrics.average_spread_bps <= requirements.max_spread_bps &&
                       profile.consecutive_days >= requirements.min_consecutive_days &&
                       profile.stake_amount >= requirements.stake_requirement {
                        return Ok(tier);
                    }
                }
            }
        }

        Ok(PerformanceTier::Bronze) // Default tier
    }

    pub fn get_market_maker_profile(&self, address: &str) -> Option<&MarketMakerProfile> {
        self.market_makers.get(address)
    }

    pub fn get_performance_metrics(&self, market_maker: &str, days: Option<u32>) -> Vec<&PerformanceMetrics> {
        if let Some(metrics_list) = self.performance_metrics.get(market_maker) {
            let cutoff = days.map(|d| Utc::now() - Duration::days(d as i64));
            
            metrics_list.iter()
                .filter(|m| cutoff.map_or(true, |c| m.date > c))
                .collect()
        } else {
            Vec::new()
        }
    }

    pub fn get_reward_history(&self, market_maker: &str, days: Option<u32>) -> Vec<&RewardCalculation> {
        if let Some(reward_list) = self.reward_history.get(market_maker) {
            let cutoff = days.map(|d| Utc::now() - Duration::days(d as i64));
            
            reward_list.iter()
                .filter(|r| cutoff.map_or(true, |c| r.date > c))
                .collect()
        } else {
            Vec::new()
        }
    }

    pub fn get_market_maker_stats(&self) -> MarketMakerStats {
        let total_market_makers = self.market_makers.len() as u32;
        let active_market_makers = self.market_makers.values()
            .filter(|p| p.is_active)
            .count() as u32;

        let total_volume_24h = self.performance_metrics.values()
            .flat_map(|metrics_list| metrics_list.last())
            .map(|m| m.volume_24h)
            .sum();

        let average_uptime = if active_market_makers > 0 {
            self.performance_metrics.values()
                .flat_map(|metrics_list| metrics_list.last())
                .map(|m| m.uptime_percentage)
                .sum::<f64>() / active_market_makers as f64
        } else {
            0.0
        };

        let total_rewards_distributed = self.market_makers.values()
            .map(|p| p.total_rewards_earned)
            .sum();

        let mut tier_distribution = HashMap::new();
        for profile in self.market_makers.values() {
            *tier_distribution.entry(profile.current_tier.clone()).or_insert(0) += 1;
        }

        MarketMakerStats {
            total_market_makers,
            active_market_makers,
            total_volume_24h,
            average_uptime,
            total_rewards_distributed,
            tier_distribution,
        }
    }

    pub fn get_tier_requirements(&self) -> &HashMap<PerformanceTier, TierRequirements> {
        &self.tier_requirements
    }

    pub fn get_daily_pool(&self, date: &str) -> Option<&DailyRewardPool> {
        self.daily_pools.get(date)
    }

    pub fn get_all_market_makers(&self) -> Vec<&MarketMakerProfile> {
        self.market_makers.values().collect()
    }

    // Private helper methods

    fn get_or_create_daily_pool(&mut self, date: &str) -> &DailyRewardPool {
        self.daily_pools.entry(date.to_string()).or_insert_with(|| {
            DailyRewardPool {
                date: Utc::now(),
                total_pool: self.daily_reward_pool_size,
                distributed_amount: 0,
                remaining_amount: self.daily_reward_pool_size,
                number_of_participants: 0,
            }
        })
    }

    fn get_tier_multiplier(&self, tier: &PerformanceTier) -> f64 {
        match tier {
            PerformanceTier::Bronze => 1.0,
            PerformanceTier::Silver => 1.2,
            PerformanceTier::Gold => 1.5,
            PerformanceTier::Platinum => 2.0,
            PerformanceTier::Diamond => 3.0,
        }
    }
} 