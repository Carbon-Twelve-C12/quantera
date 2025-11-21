use sqlx::PgPool;
use serde::{Serialize, Deserialize};
use std::sync::Arc;
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use rust_decimal::prelude::ToPrimitive;
use anyhow::{Result, anyhow};
use uuid::Uuid;

// ============================================================================
// Data Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeFinanceAsset {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub asset_type: String,
    pub issuer: String,
    pub recipient: String,
    pub image_url: Option<String>,
    pub yield_rate: i32,
    pub maturity_date: i64,
    pub nominal_value: String,
    pub currency: String,
    pub fractional_units: i32,
    pub units_total: i32,
    pub units_available: i32,
    pub current_price: String,
    pub status: String,
    pub risk_rating: i32,
    pub minimum_investment: String,
    pub settlement_currency: String,
    pub verified_entities: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeFinancePosition {
    pub id: String,
    pub asset_id: String,
    pub asset_name: Option<String>,
    pub owner_address: String,
    pub units_owned: i32,
    pub investment_amount: String,
    pub current_value: Option<String>,
    pub acquisition_price: String,
    pub current_price: Option<String>,
    pub acquisition_date: DateTime<Utc>,
    pub expected_return: Option<String>,
    pub expected_yield: Option<String>,
    pub expected_maturity_date: Option<DateTime<Utc>>,
    pub unrealized_pnl: Option<String>,
    pub unrealized_pnl_percent: Option<String>,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PurchaseResult {
    pub success: bool,
    pub position_id: String,
    pub asset_id: String,
    pub units_purchased: i32,
    pub price_per_unit: String,
    pub total_cost: String,
    pub fee: String,
    pub transaction_hash: Option<String>,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeFinanceAnalytics {
    pub total_volume: String,
    pub active_assets: i32,
    pub average_yield: String,
    pub average_maturity: i32,
    pub total_investors: i32,
    pub asset_type_distribution: Vec<AssetTypeDistribution>,
    pub country_distribution: Vec<CountryDistribution>,
    pub risk_distribution: RiskDistribution,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetTypeDistribution {
    pub asset_type: String,
    pub count: i32,
    pub percentage: String,
    pub total_value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CountryDistribution {
    pub country: String,
    pub count: i32,
    pub percentage: String,
    pub total_value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskDistribution {
    pub low: i32,      // Risk rating 1-2
    pub medium: i32,   // Risk rating 3
    pub high: i32,     // Risk rating 4-5
}

// ============================================================================
// Trade Finance Service
// ============================================================================

pub struct TradeFinanceService {
    db: Arc<PgPool>,
}

impl TradeFinanceService {
    pub fn new(db: Arc<PgPool>) -> Self {
        Self { db }
    }
    
    /// List all trade finance assets with optional filtering
    pub async fn list_assets(
        &self,
        asset_type: Option<&str>,
        status: Option<&str>,
        min_yield: Option<i32>,
        max_risk: Option<i32>,
        limit: Option<i64>,
        offset: Option<i64>,
    ) -> Result<Vec<TradeFinanceAsset>> {
        use sqlx::Row;
        
        let mut query = String::from(
            "SELECT id, name, description, asset_type, issuer, recipient,
                    image_url, yield_rate, maturity_date, nominal_value, currency,
                    fractional_units, units_total, units_available, current_price,
                    status, risk_rating, minimum_investment, settlement_currency,
                    verified_entities, created_at
             FROM tradefinance_assets
             WHERE 1=1"
        );
        
        let mut bind_count = 0;
        
        if asset_type.is_some() {
            bind_count += 1;
            query.push_str(&format!(" AND asset_type = ${}", bind_count));
        }
        
        if status.is_some() {
            bind_count += 1;
            query.push_str(&format!(" AND status = ${}", bind_count));
        }
        
        if min_yield.is_some() {
            bind_count += 1;
            query.push_str(&format!(" AND yield_rate >= ${}", bind_count));
        }
        
        if max_risk.is_some() {
            bind_count += 1;
            query.push_str(&format!(" AND risk_rating <= ${}", bind_count));
        }
        
        query.push_str(" ORDER BY created_at DESC");
        
        if let Some(lim) = limit {
            query.push_str(&format!(" LIMIT {}", lim));
        }
        if let Some(off) = offset {
            query.push_str(&format!(" OFFSET {}", off));
        }
        
        let mut sql_query = sqlx::query(&query);
        
        if let Some(t) = asset_type {
            sql_query = sql_query.bind(t);
        }
        if let Some(s) = status {
            sql_query = sql_query.bind(s);
        }
        if let Some(y) = min_yield {
            sql_query = sql_query.bind(y);
        }
        if let Some(r) = max_risk {
            sql_query = sql_query.bind(r);
        }
        
        let rows = sql_query.fetch_all(self.db.as_ref()).await?;
        
        let mut assets = Vec::new();
        for row in rows {
            let maturity_date: DateTime<Utc> = row.get("maturity_date");
            
            assets.push(TradeFinanceAsset {
                id: row.get("id"),
                name: row.get("name"),
                description: row.get("description"),
                asset_type: row.get("asset_type"),
                issuer: row.get("issuer"),
                recipient: row.get("recipient"),
                image_url: row.get("image_url"),
                yield_rate: row.get("yield_rate"),
                maturity_date: maturity_date.timestamp(),
                nominal_value: row.get::<Decimal, _>("nominal_value").to_string(),
                currency: row.get("currency"),
                fractional_units: row.get("fractional_units"),
                units_total: row.get("units_total"),
                units_available: row.get("units_available"),
                current_price: row.get::<Decimal, _>("current_price").to_string(),
                status: row.get("status"),
                risk_rating: row.get("risk_rating"),
                minimum_investment: row.get::<Decimal, _>("minimum_investment").to_string(),
                settlement_currency: row.get("settlement_currency"),
                verified_entities: row.get("verified_entities"),
                created_at: row.get("created_at"),
            });
        }
        
        Ok(assets)
    }
    
    /// Get specific asset by ID
    pub async fn get_asset(&self, asset_id: &str) -> Result<Option<TradeFinanceAsset>> {
        use sqlx::Row;
        
        let row = sqlx::query(
            "SELECT id, name, description, asset_type, issuer, recipient,
                    image_url, yield_rate, maturity_date, nominal_value, currency,
                    fractional_units, units_total, units_available, current_price,
                    status, risk_rating, minimum_investment, settlement_currency,
                    verified_entities, created_at
             FROM tradefinance_assets
             WHERE id = $1"
        )
        .bind(asset_id)
        .fetch_optional(self.db.as_ref())
        .await?;
        
        if let Some(row) = row {
            let maturity_date: DateTime<Utc> = row.get("maturity_date");
            
            Ok(Some(TradeFinanceAsset {
                id: row.get("id"),
                name: row.get("name"),
                description: row.get("description"),
                asset_type: row.get("asset_type"),
                issuer: row.get("issuer"),
                recipient: row.get("recipient"),
                image_url: row.get("image_url"),
                yield_rate: row.get("yield_rate"),
                maturity_date: maturity_date.timestamp(),
                nominal_value: row.get::<Decimal, _>("nominal_value").to_string(),
                currency: row.get("currency"),
                fractional_units: row.get("fractional_units"),
                units_total: row.get("units_total"),
                units_available: row.get("units_available"),
                current_price: row.get::<Decimal, _>("current_price").to_string(),
                status: row.get("status"),
                risk_rating: row.get("risk_rating"),
                minimum_investment: row.get::<Decimal, _>("minimum_investment").to_string(),
                settlement_currency: row.get("settlement_currency"),
                verified_entities: row.get("verified_entities"),
                created_at: row.get("created_at"),
            }))
        } else {
            Ok(None)
        }
    }
    
    /// Get user positions
    pub async fn get_positions(&self, wallet_address: &str) -> Result<Vec<TradeFinancePosition>> {
        use sqlx::Row;
        
        let rows = sqlx::query(
            "SELECT p.id, p.asset_id, a.name as asset_name, p.owner_address,
                    p.units_owned, p.investment_amount, p.acquisition_price,
                    p.acquisition_date, a.current_price, a.maturity_date,
                    p.status
             FROM tradefinance_positions p
             JOIN tradefinance_assets a ON p.asset_id = a.id
             WHERE p.owner_address = $1
             ORDER BY p.created_at DESC"
        )
        .bind(wallet_address)
        .fetch_all(self.db.as_ref())
        .await?;
        
        let mut positions = Vec::new();
        for row in rows {
            let units_owned: i32 = row.get("units_owned");
            let acquisition_price: Decimal = row.get("acquisition_price");
            let current_price: Decimal = row.get("current_price");
            let investment_amount: Decimal = row.get("investment_amount");
            
            let current_value = Decimal::from(units_owned) * current_price;
            let unrealized_pnl = current_value - investment_amount;
            let unrealized_pnl_percent = if investment_amount > Decimal::ZERO {
                (unrealized_pnl / investment_amount) * Decimal::from(100)
            } else {
                Decimal::ZERO
            };
            
            // Calculate expected return based on yield rate
            // TODO: Fetch yield_rate from asset and calculate
            let expected_return = investment_amount * Decimal::new(10595, 4); // 1.0595 (5.95% return)
            let expected_yield = expected_return - investment_amount;
            
            positions.push(TradeFinancePosition {
                id: row.get::<Uuid, _>("id").to_string(),
                asset_id: row.get("asset_id"),
                asset_name: row.get("asset_name"),
                owner_address: row.get("owner_address"),
                units_owned,
                investment_amount: investment_amount.to_string(),
                current_value: Some(current_value.to_string()),
                acquisition_price: acquisition_price.to_string(),
                current_price: Some(current_price.to_string()),
                acquisition_date: row.get("acquisition_date"),
                expected_return: Some(expected_return.to_string()),
                expected_yield: Some(expected_yield.to_string()),
                expected_maturity_date: row.get("maturity_date"),
                unrealized_pnl: Some(unrealized_pnl.to_string()),
                unrealized_pnl_percent: Some(unrealized_pnl_percent.to_string()),
                status: row.get("status"),
            });
        }
        
        Ok(positions)
    }
    
    /// Purchase trade finance asset
    pub async fn purchase_asset(
        &self,
        asset_id: &str,
        wallet_address: &str,
        units: i32,
        max_price: Option<Decimal>,
    ) -> Result<PurchaseResult> {
        use sqlx::Row;
        
        // 1. Fetch asset
        let asset_row = sqlx::query(
            "SELECT id, units_available, current_price, minimum_investment, status
             FROM tradefinance_assets
             WHERE id = $1
             FOR UPDATE" // Lock row for transaction
        )
        .bind(asset_id)
        .fetch_optional(self.db.as_ref())
        .await?
        .ok_or_else(|| anyhow!("Asset not found"))?;
        
        let units_available: i32 = asset_row.get("units_available");
        let current_price: Decimal = asset_row.get("current_price");
        let minimum_investment: Decimal = asset_row.get("minimum_investment");
        let status: String = asset_row.get("status");
        
        // 2. Validate status
        if status != "Active" {
            return Err(anyhow!("Asset is not active"));
        }
        
        // 3. Check units available
        if units > units_available {
            return Err(anyhow!("Insufficient units available"));
        }
        
        // 4. Check price slippage if max_price provided
        if let Some(max) = max_price {
            if current_price > max {
                return Err(anyhow!("Price slippage: current price exceeds maximum"));
            }
        }
        
        // 5. Calculate costs
        let total_cost = Decimal::from(units) * current_price;
        let fee = total_cost * Decimal::new(5, 3); // 0.5% fee
        
        // 6. Check minimum investment
        if total_cost < minimum_investment {
            return Err(anyhow!("Minimum investment not met"));
        }
        
        // 7. Create or update position
        let position_id = sqlx::query(
            "INSERT INTO tradefinance_positions 
             (asset_id, owner_address, units_owned, investment_amount, 
              acquisition_price, acquisition_date, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'Active')
             ON CONFLICT (asset_id, owner_address) DO UPDATE
             SET units_owned = tradefinance_positions.units_owned + $3,
                 investment_amount = tradefinance_positions.investment_amount + $4,
                 updated_at = NOW()
             RETURNING id"
        )
        .bind(asset_id)
        .bind(wallet_address)
        .bind(units)
        .bind(total_cost.to_string())
        .bind(current_price.to_string())
        .bind(Utc::now())
        .fetch_one(self.db.as_ref())
        .await?
        .get::<Uuid, _>("id");
        
        // 8. Record transaction
        let tx_id = Uuid::new_v4();
        sqlx::query(
            "INSERT INTO tradefinance_transactions
             (id, asset_id, buyer_address, transaction_type, units,
              price_per_unit, total_amount, fee, status, timestamp)
             VALUES ($1, $2, $3, 'purchase', $4, $5, $6, $7, 'completed', $8)"
        )
        .bind(tx_id)
        .bind(asset_id)
        .bind(wallet_address)
        .bind(units)
        .bind(current_price.to_string())
        .bind(total_cost.to_string())
        .bind(fee.to_string())
        .bind(Utc::now())
        .execute(self.db.as_ref())
        .await?;
        
        // 9. Update units_available (trigger handles this automatically)
        
        // 10. TODO: Execute blockchain transaction
        // let tx_hash = ethereum_client.purchase_tf_units(...).await?;
        
        Ok(PurchaseResult {
            success: true,
            position_id: position_id.to_string(),
            asset_id: asset_id.to_string(),
            units_purchased: units,
            price_per_unit: current_price.to_string(),
            total_cost: total_cost.to_string(),
            fee: fee.to_string(),
            transaction_hash: None, // TODO: Add when blockchain integration complete
            timestamp: Utc::now(),
        })
    }
    
    /// Get analytics
    pub async fn get_analytics(&self) -> Result<TradeFinanceAnalytics> {
        use sqlx::Row;
        
        // Get total volume
        let total_volume_row = sqlx::query(
            "SELECT COALESCE(SUM(nominal_value), 0) as total
             FROM tradefinance_assets
             WHERE status = 'Active'"
        )
        .fetch_one(self.db.as_ref())
        .await?;
        
        let total_volume: Decimal = total_volume_row.get("total");
        
        // Get active assets count
        let active_count_row = sqlx::query(
            "SELECT COUNT(*) as count FROM tradefinance_assets WHERE status = 'Active'"
        )
        .fetch_one(self.db.as_ref())
        .await?;
        
        let active_assets: i64 = active_count_row.get("count");
        
        // Get average yield
        let avg_yield_row = sqlx::query(
            "SELECT COALESCE(AVG(yield_rate), 0) as avg_yield
             FROM tradefinance_assets
             WHERE status = 'Active'"
        )
        .fetch_one(self.db.as_ref())
        .await?;
        
        let avg_yield: Decimal = avg_yield_row.get("avg_yield");
        
        // Get average maturity (in days)
        let avg_maturity_row = sqlx::query(
            "SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (maturity_date - NOW())) / 86400), 0) as avg_days
             FROM tradefinance_assets
             WHERE status = 'Active'"
        )
        .fetch_one(self.db.as_ref())
        .await?;
        
        let avg_maturity: Decimal = avg_maturity_row.get("avg_days");
        
        // Get distinct investors
        let investors_row = sqlx::query(
            "SELECT COUNT(DISTINCT owner_address) as count FROM tradefinance_positions"
        )
        .fetch_one(self.db.as_ref())
        .await?;
        
        let total_investors: i64 = investors_row.get("count");
        
        // Get asset type distribution
        let type_dist_rows = sqlx::query(
            "SELECT asset_type, COUNT(*) as count, SUM(nominal_value) as total_value
             FROM tradefinance_assets
             WHERE status = 'Active'
             GROUP BY asset_type"
        )
        .fetch_all(self.db.as_ref())
        .await?;
        
        let mut type_distribution = Vec::new();
        for row in type_dist_rows {
            let count: i64 = row.get("count");
            let total_value: Decimal = row.get("total_value");
            let percentage = if active_assets > 0 {
                (Decimal::from(count) / Decimal::from(active_assets)) * Decimal::from(100)
            } else {
                Decimal::ZERO
            };
            
            type_distribution.push(AssetTypeDistribution {
                asset_type: row.get("asset_type"),
                count: count as i32,
                percentage: percentage.to_string(),
                total_value: total_value.to_string(),
            });
        }
        
        // Get risk distribution
        let risk_low = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM tradefinance_assets WHERE status = 'Active' AND risk_rating <= 2"
        )
        .fetch_one(self.db.as_ref())
        .await?;
        
        let risk_medium = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM tradefinance_assets WHERE status = 'Active' AND risk_rating = 3"
        )
        .fetch_one(self.db.as_ref())
        .await?;
        
        let risk_high = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM tradefinance_assets WHERE status = 'Active' AND risk_rating >= 4"
        )
        .fetch_one(self.db.as_ref())
        .await?;
        
        Ok(TradeFinanceAnalytics {
            total_volume: total_volume.to_string(),
            active_assets: active_assets as i32,
            average_yield: (avg_yield / Decimal::from(100)).to_string(), // Convert basis points to percentage
            average_maturity: avg_maturity.to_i32().unwrap_or(0),
            total_investors: total_investors as i32,
            asset_type_distribution: type_distribution,
            country_distribution: vec![], // TODO: Extract from issuer/recipient metadata
            risk_distribution: RiskDistribution {
                low: risk_low as i32,
                medium: risk_medium as i32,
                high: risk_high as i32,
            },
        })
    }
}
