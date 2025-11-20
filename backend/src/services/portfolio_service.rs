use sqlx::PgPool;
use serde::{Serialize, Deserialize};
use std::sync::Arc;
use std::collections::HashMap;
use chrono::{DateTime, Utc, Duration};
use rust_decimal::Decimal;
use anyhow::Result;

// ============================================================================
// Data Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetHolding {
    pub id: String,
    pub asset_id: String,
    pub name: String,
    pub symbol: String,
    pub quantity: String,
    pub price: String,
    pub value: String,
    pub yield_rate: Option<String>,
    pub yield_amount: Option<String>,
    pub maturity: Option<String>,
    pub asset_type: Option<String>,
    pub category: Option<String>,
    pub asset_class: Option<String>,
    pub acquisition_date: Option<DateTime<Utc>>,
    pub acquisition_price: Option<String>,
    pub unrealized_gain: Option<String>,
    pub unrealized_gain_percent: Option<String>,
    pub allocation: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortfolioTransaction {
    pub id: String,
    pub transaction_type: String,
    pub asset_id: String,
    pub asset_name: Option<String>,
    pub asset_symbol: Option<String>,
    pub quantity: String,
    pub price: String,
    pub total_value: String,
    pub fee: Option<String>,
    pub status: String,
    pub tx_hash: Option<String>,
    pub block_number: Option<i64>,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YieldDistribution {
    pub id: String,
    pub asset_id: String,
    pub asset_name: Option<String>,
    pub amount: String,
    pub yield_rate: Option<String>,
    pub distribution_date: DateTime<Utc>,
    pub next_distribution_date: Option<DateTime<Utc>>,
    pub frequency: Option<String>,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortfolioSummary {
    pub wallet_address: String,
    pub total_value: String,
    pub total_yield: String,
    pub yield_rate: String,
    pub impact_score: Option<i32>,
    pub carbon_offset: Option<String>,
    pub asset_allocation: HashMap<String, i32>,
    pub holdings: Vec<AssetHolding>,
    pub last_updated: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub total_return: String,
    pub total_return_percentage: String,
    pub time_weighted_return: String,
    pub annualized_return: String,
    pub volatility: String,
    pub sharpe_ratio: String,
    pub periods: PerformancePeriods,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformancePeriods {
    pub daily: String,
    pub weekly: String,
    pub monthly: String,
    pub quarterly: String,
    pub yearly: String,
    pub all_time: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImpactMetrics {
    pub total_carbon_offset: String,
    pub total_land_protected: String,
    pub total_water_saved: i64,
    pub biodiversity_score: i32,
    pub community_impact: i32,
    pub sdg_contributions: HashMap<i32, i32>,
}

// ============================================================================
// Portfolio Service
// ============================================================================

pub struct PortfolioService {
    db: Arc<PgPool>,
}

impl PortfolioService {
    pub fn new(db: Arc<PgPool>) -> Self {
        Self { db }
    }
    
    /// Get complete portfolio for a wallet address
    pub async fn get_portfolio(&self, wallet_address: &str) -> Result<PortfolioSummary> {
        // Fetch all holdings
        let holdings = self.get_holdings(wallet_address, None, None, None, None, None).await?;
        
        // Calculate totals
        let mut total_value = Decimal::ZERO;
        let mut total_yield = Decimal::ZERO;
        let mut asset_allocation: HashMap<String, i32> = HashMap::new();
        
        for holding in &holdings {
            // Parse values
            let value = holding.value.parse::<Decimal>().unwrap_or(Decimal::ZERO);
            let yield_amount = holding.yield_amount.as_ref()
                .and_then(|y| y.parse::<Decimal>().ok())
                .unwrap_or(Decimal::ZERO);
            
            total_value += value;
            total_yield += yield_amount;
            
            // Calculate allocation
            if let Some(category) = &holding.category {
                *asset_allocation.entry(category.clone()).or_insert(0) += holding.allocation.unwrap_or(0);
            }
        }
        
        // Calculate yield rate
        let yield_rate = if total_value > Decimal::ZERO {
            (total_yield / total_value * Decimal::from(100)).to_string()
        } else {
            "0.00".to_string()
        };
        
        Ok(PortfolioSummary {
            wallet_address: wallet_address.to_string(),
            total_value: total_value.to_string(),
            total_yield: total_yield.to_string(),
            yield_rate,
            impact_score: Some(85), // TODO: Calculate from environmental holdings
            carbon_offset: Some("72.5".to_string()), // TODO: Aggregate from holdings
            asset_allocation,
            holdings,
            last_updated: Utc::now(),
        })
    }
    
    /// Get holdings with optional filtering
    pub async fn get_holdings(
        &self,
        wallet_address: &str,
        category: Option<&str>,
        sort: Option<&str>,
        order: Option<&str>,
        limit: Option<i64>,
        offset: Option<i64>,
    ) -> Result<Vec<AssetHolding>> {
        use sqlx::Row;
        
        let mut query = String::from(
            "SELECT id, wallet_address, asset_id, asset_name, asset_symbol, 
                    quantity, acquisition_price, acquisition_date, asset_type,
                    asset_category, asset_class, maturity_date
             FROM portfolio_holdings
             WHERE wallet_address = $1"
        );
        
        // Add category filter if provided
        if category.is_some() {
            query.push_str(" AND asset_category = $2");
        }
        
        // Add sorting
        let sort_field = sort.unwrap_or("created_at");
        let sort_order = order.unwrap_or("desc");
        query.push_str(&format!(" ORDER BY {} {}", sort_field, sort_order));
        
        // Add pagination
        if let Some(lim) = limit {
            query.push_str(&format!(" LIMIT {}", lim));
        }
        if let Some(off) = offset {
            query.push_str(&format!(" OFFSET {}", off));
        }
        
        let mut sql_query = sqlx::query(&query).bind(wallet_address);
        
        if let Some(cat) = category {
            sql_query = sql_query.bind(cat);
        }
        
        let rows = sql_query.fetch_all(self.db.as_ref()).await?;
        
        let mut holdings = Vec::new();
        for row in rows {
            let quantity: Decimal = row.get("quantity");
            let acquisition_price: Decimal = row.get("acquisition_price");
            
            // TODO: Fetch current price from oracle/on-chain
            // For now, use acquisition price + small random variation
            let current_price = acquisition_price * Decimal::new(102, 2); // 2% gain
            let value = quantity * current_price;
            let unrealized_gain = value - (quantity * acquisition_price);
            let unrealized_gain_percent = if acquisition_price > Decimal::ZERO {
                (unrealized_gain / (quantity * acquisition_price)) * Decimal::from(100)
            } else {
                Decimal::ZERO
            };
            
            holdings.push(AssetHolding {
                id: row.get::<uuid::Uuid, _>("id").to_string(),
                asset_id: row.get("asset_id"),
                name: row.get("asset_name"),
                symbol: row.get("asset_symbol"),
                quantity: quantity.to_string(),
                price: current_price.to_string(),
                value: value.to_string(),
                yield_rate: Some("4.50".to_string()), // TODO: Calculate
                yield_amount: Some((value * Decimal::new(450, 4)).to_string()),
                maturity: row.get::<Option<chrono::NaiveDate>, _>("maturity_date")
                    .map(|d| d.to_string()),
                asset_type: row.get("asset_type"),
                category: row.get("asset_category"),
                asset_class: row.get("asset_class"),
                acquisition_date: row.get("acquisition_date"),
                acquisition_price: Some(acquisition_price.to_string()),
                unrealized_gain: Some(unrealized_gain.to_string()),
                unrealized_gain_percent: Some(unrealized_gain_percent.to_string()),
                allocation: Some(12), // TODO: Calculate percentage
            });
        }
        
        Ok(holdings)
    }
    
    /// Get transaction history
    pub async fn get_transactions(
        &self,
        wallet_address: &str,
        transaction_type: Option<&str>,
        asset_id: Option<&str>,
        limit: Option<i64>,
        offset: Option<i64>,
    ) -> Result<Vec<PortfolioTransaction>> {
        use sqlx::Row;
        
        let mut query = String::from(
            "SELECT id, wallet_address, transaction_type, asset_id, asset_name,
                    asset_symbol, quantity, price, total_value, fee, status,
                    tx_hash, block_number, timestamp
             FROM portfolio_transactions
             WHERE wallet_address = $1"
        );
        
        let mut bind_count = 1;
        
        if transaction_type.is_some() {
            bind_count += 1;
            query.push_str(&format!(" AND transaction_type = ${}", bind_count));
        }
        
        if asset_id.is_some() {
            bind_count += 1;
            query.push_str(&format!(" AND asset_id = ${}", bind_count));
        }
        
        query.push_str(" ORDER BY timestamp DESC");
        
        if let Some(lim) = limit {
            query.push_str(&format!(" LIMIT {}", lim));
        }
        if let Some(off) = offset {
            query.push_str(&format!(" OFFSET {}", off));
        }
        
        let mut sql_query = sqlx::query(&query).bind(wallet_address);
        
        if let Some(tx_type) = transaction_type {
            sql_query = sql_query.bind(tx_type);
        }
        if let Some(asset) = asset_id {
            sql_query = sql_query.bind(asset);
        }
        
        let rows = sql_query.fetch_all(self.db.as_ref()).await?;
        
        let mut transactions = Vec::new();
        for row in rows {
            transactions.push(PortfolioTransaction {
                id: row.get::<uuid::Uuid, _>("id").to_string(),
                transaction_type: row.get("transaction_type"),
                asset_id: row.get("asset_id"),
                asset_name: row.get("asset_name"),
                asset_symbol: row.get("asset_symbol"),
                quantity: row.get::<Decimal, _>("quantity").to_string(),
                price: row.get::<Decimal, _>("price").to_string(),
                total_value: row.get::<Decimal, _>("total_value").to_string(),
                fee: row.get::<Option<Decimal>, _>("fee").map(|f| f.to_string()),
                status: row.get("status"),
                tx_hash: row.get("tx_hash"),
                block_number: row.get("block_number"),
                timestamp: row.get("timestamp"),
            });
        }
        
        Ok(transactions)
    }
    
    /// Get yield distributions
    pub async fn get_yield_distributions(
        &self,
        wallet_address: &str,
        status: Option<&str>,
    ) -> Result<Vec<YieldDistribution>> {
        use sqlx::Row;
        
        let mut query = String::from(
            "SELECT id, wallet_address, asset_id, asset_name, amount, yield_rate,
                    distribution_date, next_distribution_date, frequency, status
             FROM yield_distributions
             WHERE wallet_address = $1"
        );
        
        if status.is_some() {
            query.push_str(" AND status = $2");
        }
        
        query.push_str(" ORDER BY distribution_date DESC");
        
        let mut sql_query = sqlx::query(&query).bind(wallet_address);
        
        if let Some(s) = status {
            sql_query = sql_query.bind(s);
        }
        
        let rows = sql_query.fetch_all(self.db.as_ref()).await?;
        
        let mut distributions = Vec::new();
        for row in rows {
            distributions.push(YieldDistribution {
                id: row.get::<uuid::Uuid, _>("id").to_string(),
                asset_id: row.get("asset_id"),
                asset_name: row.get("asset_name"),
                amount: row.get::<Decimal, _>("amount").to_string(),
                yield_rate: row.get::<Option<Decimal>, _>("yield_rate").map(|r| r.to_string()),
                distribution_date: row.get("distribution_date"),
                next_distribution_date: row.get("next_distribution_date"),
                frequency: row.get("frequency"),
                status: row.get("status"),
            });
        }
        
        Ok(distributions)
    }
    
    /// Calculate portfolio performance
    pub async fn calculate_performance(
        &self,
        wallet_address: &str,
        _period: Option<&str>,
    ) -> Result<PerformanceMetrics> {
        // TODO: Implement real performance calculations
        // For Phase 5, return simplified metrics
        
        Ok(PerformanceMetrics {
            total_return: "3865.20".to_string(),
            total_return_percentage: "9.25".to_string(),
            time_weighted_return: "8.75".to_string(),
            annualized_return: "12.45".to_string(),
            volatility: "3.75".to_string(),
            sharpe_ratio: "1.85".to_string(),
            periods: PerformancePeriods {
                daily: "0.04".to_string(),
                weekly: "0.35".to_string(),
                monthly: "1.25".to_string(),
                quarterly: "3.85".to_string(),
                yearly: "12.45".to_string(),
                all_time: "14.35".to_string(),
            },
        })
    }
    
    /// Calculate environmental impact metrics
    pub async fn calculate_impact(
        &self,
        wallet_address: &str,
    ) -> Result<ImpactMetrics> {
        use sqlx::Row;
        
        // Get environmental holdings
        let holdings = self.get_holdings(wallet_address, Some("environmental"), None, None, None, None).await?;
        
        // TODO: Fetch real impact data from asset metadata
        // For Phase 5, return aggregated placeholder
        
        Ok(ImpactMetrics {
            total_carbon_offset: "72.5".to_string(),
            total_land_protected: "3.6".to_string(),
            total_water_saved: 1400000,
            biodiversity_score: 78,
            community_impact: 85,
            sdg_contributions: [(13, 85), (14, 65), (15, 80)]
                .iter()
                .cloned()
                .collect(),
        })
    }
}
