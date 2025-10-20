use std::collections::HashMap;
use std::sync::Arc;
use ethers::types::Address;
use serde::{Deserialize, Serialize};
use anyhow::Result;
use chrono::{DateTime, Utc, Datelike};
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use sqlx::PgPool;
use tracing::{info, warn};

// ============ Tax Calculator ============

pub struct TaxCalculator {
    db: Arc<PgPool>,
    jurisdiction_rules: HashMap<String, TaxRules>,
}

impl TaxCalculator {
    pub fn new(db: Arc<PgPool>) -> Arc<Self> {
        let mut jurisdiction_rules = HashMap::new();
        
        // US Tax Rules
        jurisdiction_rules.insert("US".to_string(), TaxRules {
            capital_gains_short_term: dec!(0.37), // Up to 37% for short-term
            capital_gains_long_term: dec!(0.20),  // 20% for long-term
            holding_period_days: 365,
            wash_sale_period_days: 30,
            de_minimis_threshold: dec!(600),
            requires_1099: true,
            withholding_rate: dec!(0.24),
        });
        
        // EU Tax Rules (simplified)
        jurisdiction_rules.insert("EU".to_string(), TaxRules {
            capital_gains_short_term: dec!(0.30),
            capital_gains_long_term: dec!(0.25),
            holding_period_days: 365,
            wash_sale_period_days: 0, // EU doesn't have wash sale rules
            de_minimis_threshold: dec!(1000),
            requires_1099: false,
            withholding_rate: dec!(0.25),
        });
        
        // Singapore Tax Rules
        jurisdiction_rules.insert("SG".to_string(), TaxRules {
            capital_gains_short_term: dec!(0.00), // No capital gains tax
            capital_gains_long_term: dec!(0.00),
            holding_period_days: 0,
            wash_sale_period_days: 0,
            de_minimis_threshold: dec!(0),
            requires_1099: false,
            withholding_rate: dec!(0.00),
        });
        
        // UK Tax Rules
        jurisdiction_rules.insert("GB".to_string(), TaxRules {
            capital_gains_short_term: dec!(0.20),
            capital_gains_long_term: dec!(0.20),
            holding_period_days: 0, // No distinction in UK
            wash_sale_period_days: 30, // Bed and breakfast rule
            de_minimis_threshold: dec!(12300),
            requires_1099: false,
            withholding_rate: dec!(0.20),
        });
        
        // Japan Tax Rules
        jurisdiction_rules.insert("JP".to_string(), TaxRules {
            capital_gains_short_term: dec!(0.315), // 31.5% for crypto/securities
            capital_gains_long_term: dec!(0.20),
            holding_period_days: 365,
            wash_sale_period_days: 0,
            de_minimis_threshold: dec!(200000), // 200,000 JPY
            requires_1099: false,
            withholding_rate: dec!(0.2042),
        });
        
        Arc::new(Self {
            db,
            jurisdiction_rules,
        })
    }
    
    /// Calculate tax implications for a transaction
    pub async fn calculate_tax(
        &self,
        transaction: Transaction,
        jurisdiction: &str,
    ) -> Result<TaxReport, crate::ComplianceError> {
        info!("Calculating tax for transaction in jurisdiction: {}", jurisdiction);
        
        let rules = self.jurisdiction_rules
            .get(jurisdiction)
            .ok_or_else(|| crate::ComplianceError::TaxCalculationError(
                format!("Unknown jurisdiction: {}", jurisdiction)
            ))?;
        
        // Get cost basis
        let cost_basis = self.get_cost_basis(transaction.investor, transaction.asset).await?;
        
        // Calculate gains/losses
        let proceeds = transaction.amount;
        let gain_loss = proceeds - cost_basis.total_cost;
        
        // Determine if short-term or long-term
        let holding_period = Utc::now() - cost_basis.acquisition_date;
        let is_long_term = holding_period.num_days() >= rules.holding_period_days as i64;
        
        let tax_rate = if is_long_term {
            rules.capital_gains_long_term
        } else {
            rules.capital_gains_short_term
        };
        
        let tax_due = if gain_loss > dec!(0) {
            gain_loss * tax_rate
        } else {
            dec!(0) // No tax on losses
        };
        
        // Check for wash sale
        let wash_sale = if rules.wash_sale_period_days > 0 {
            self.check_wash_sale(&transaction, rules.wash_sale_period_days).await?
        } else {
            false
        };
        
        let report = TaxReport {
            transaction_id: transaction.transaction_id(),
            investor: transaction.investor,
            jurisdiction: jurisdiction.to_string(),
            transaction_type: transaction.transaction_type.clone(),
            amount: transaction.amount,
            cost_basis: cost_basis.total_cost,
            gain_loss,
            is_long_term,
            tax_rate,
            tax_due,
            wash_sale,
            wash_sale_disallowed: if wash_sale { Some(gain_loss.min(dec!(0)).abs()) } else { None },
            withholding_required: rules.withholding_rate > dec!(0),
            withholding_amount: if rules.withholding_rate > dec!(0) {
                Some(proceeds * rules.withholding_rate)
            } else {
                None
            },
            reporting_required: gain_loss.abs() > rules.de_minimis_threshold || rules.requires_1099,
            calculated_at: Utc::now(),
        };
        
        // Store tax report
        self.store_tax_report(&report).await?;
        
        info!("Tax calculation complete. Gain/Loss: {}, Tax Due: {}", gain_loss, tax_due);
        
        Ok(report)
    }
    
    /// Generate IRS Form 1099 (US only)
    pub async fn generate_1099(
        &self,
        investor: Address,
        year: u32,
    ) -> Result<Form1099, crate::ComplianceError> {
        info!("Generating Form 1099 for investor {:?} for year {}", investor, year);
        
        // Get all transactions for the year
        let transactions = self.get_yearly_transactions(investor, year).await?;
        
        let mut total_proceeds = dec!(0);
        let mut total_cost_basis = dec!(0);
        let mut short_term_gain = dec!(0);
        let mut long_term_gain = dec!(0);
        let mut wash_sale_disallowed = dec!(0);
        
        for tx in &transactions {
            total_proceeds += tx.proceeds;
            total_cost_basis += tx.cost_basis;
            
            let gain = tx.proceeds - tx.cost_basis;
            if tx.is_long_term {
                long_term_gain += gain;
            } else {
                short_term_gain += gain;
            }
            
            if tx.wash_sale {
                wash_sale_disallowed += gain.min(dec!(0)).abs();
            }
        }
        
        let form = Form1099 {
            tax_year: year,
            investor,
            payer_name: "Quantera Platform".to_string(),
            payer_tin: "00-0000000".to_string(), // Would be actual TIN in production
            recipient_tin: None, // Would be collected during KYC
            gross_proceeds: total_proceeds,
            cost_basis: total_cost_basis,
            short_term_gain_loss: short_term_gain,
            long_term_gain_loss: long_term_gain,
            federal_tax_withheld: dec!(0), // Calculate from transactions
            wash_sale_loss_disallowed: wash_sale_disallowed,
            transactions: transactions.len() as u32,
            generated_at: Utc::now(),
        };
        
        info!("Form 1099 generated. Total proceeds: {}, Net gain: {}", 
              total_proceeds, short_term_gain + long_term_gain);
        
        Ok(form)
    }
    
    /// Calculate wash sales for a set of trades
    pub async fn calculate_wash_sales(
        &self,
        trades: Vec<Trade>,
    ) -> Result<WashSaleReport, crate::ComplianceError> {
        let mut wash_sales = Vec::new();
        let mut total_disallowed = dec!(0);
        
        for i in 0..trades.len() {
            let trade = &trades[i];
            
            // Only check for wash sales on losses
            if trade.gain_loss >= dec!(0) {
                continue;
            }
            
            // Look for repurchases within 30 days before or after
            for j in 0..trades.len() {
                if i == j {
                    continue;
                }
                
                let other_trade = &trades[j];
                
                // Check if same or substantially identical security
                if trade.asset != other_trade.asset {
                    continue;
                }
                
                // Check if within wash sale period (30 days)
                let days_between = (trade.date - other_trade.date).num_days().abs();
                if days_between <= 30 && other_trade.is_purchase {
                    wash_sales.push(WashSale {
                        sale_trade_id: trade.id.clone(),
                        purchase_trade_id: other_trade.id.clone(),
                        loss_disallowed: trade.gain_loss.abs(),
                        adjusted_basis: trade.cost_basis + trade.gain_loss.abs(),
                    });
                    
                    total_disallowed += trade.gain_loss.abs();
                    break; // Only count once per sale
                }
            }
        }
        
        Ok(WashSaleReport {
            investor: trades.first().map(|t| t.investor).unwrap_or_default(),
            period_start: trades.iter().map(|t| t.date).min().unwrap_or_else(Utc::now),
            period_end: trades.iter().map(|t| t.date).max().unwrap_or_else(Utc::now),
            wash_sales,
            total_disallowed,
            generated_at: Utc::now(),
        })
    }
    
    /// Get cost basis for an investor's position
    async fn get_cost_basis(
        &self,
        investor: Address,
        asset: Option<Address>,
    ) -> Result<CostBasis, crate::ComplianceError> {
        // In production, this would fetch from database
        // Using mock data for now
        
        Ok(CostBasis {
            investor,
            asset,
            total_cost: dec!(10000),
            acquisition_date: Utc::now() - chrono::Duration::days(400),
            method: CostBasisMethod::Fifo,
        })
    }
    
    /// Check if transaction is a wash sale
    async fn check_wash_sale(
        &self,
        transaction: &Transaction,
        wash_period_days: u32,
    ) -> Result<bool, crate::ComplianceError> {
        // In production, would check database for sales/purchases within wash period
        // Simplified implementation
        
        Ok(false)
    }
    
    /// Get all transactions for an investor in a year
    async fn get_yearly_transactions(
        &self,
        investor: Address,
        year: u32,
    ) -> Result<Vec<TaxTransaction>, crate::ComplianceError> {
        // In production, fetch from database
        // Mock implementation
        
        Ok(vec![
            TaxTransaction {
                id: "tx1".to_string(),
                investor,
                date: Utc::now() - chrono::Duration::days(100),
                proceeds: dec!(15000),
                cost_basis: dec!(10000),
                is_long_term: true,
                wash_sale: false,
            },
        ])
    }
    
    /// Store tax report in database
    async fn store_tax_report(&self, report: &TaxReport) -> Result<(), crate::ComplianceError> {
        sqlx::query!(
            r#"
            INSERT INTO tax_reports (
                transaction_id, investor_address, jurisdiction,
                amount, cost_basis, gain_loss, is_long_term,
                tax_rate, tax_due, wash_sale, calculated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            "#,
            report.transaction_id,
            report.investor.as_bytes(),
            report.jurisdiction,
            report.amount,
            report.cost_basis,
            report.gain_loss,
            report.is_long_term,
            report.tax_rate,
            report.tax_due,
            report.wash_sale,
            report.calculated_at,
        )
        .execute(self.db.as_ref())
        .await?;
        
        Ok(())
    }
}

// ============ Data Structures ============

#[derive(Debug, Clone)]
pub struct TaxRules {
    pub capital_gains_short_term: Decimal,
    pub capital_gains_long_term: Decimal,
    pub holding_period_days: u32,
    pub wash_sale_period_days: u32,
    pub de_minimis_threshold: Decimal,
    pub requires_1099: bool,
    pub withholding_rate: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub investor: Address,
    pub asset: Option<Address>,
    pub amount: Decimal,
    pub transaction_type: TransactionType,
    pub timestamp: DateTime<Utc>,
    pub price: Decimal,
}

impl Transaction {
    pub fn transaction_id(&self) -> String {
        format!("{:?}-{}", self.investor, self.timestamp.timestamp())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TransactionType {
    Buy,
    Sell,
    Transfer,
    Stake,
    Unstake,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaxReport {
    pub transaction_id: String,
    pub investor: Address,
    pub jurisdiction: String,
    pub transaction_type: TransactionType,
    pub amount: Decimal,
    pub cost_basis: Decimal,
    pub gain_loss: Decimal,
    pub is_long_term: bool,
    pub tax_rate: Decimal,
    pub tax_due: Decimal,
    pub wash_sale: bool,
    pub wash_sale_disallowed: Option<Decimal>,
    pub withholding_required: bool,
    pub withholding_amount: Option<Decimal>,
    pub reporting_required: bool,
    pub calculated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Form1099 {
    pub tax_year: u32,
    pub investor: Address,
    pub payer_name: String,
    pub payer_tin: String,
    pub recipient_tin: Option<String>,
    pub gross_proceeds: Decimal,
    pub cost_basis: Decimal,
    pub short_term_gain_loss: Decimal,
    pub long_term_gain_loss: Decimal,
    pub federal_tax_withheld: Decimal,
    pub wash_sale_loss_disallowed: Decimal,
    pub transactions: u32,
    pub generated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WashSaleReport {
    pub investor: Address,
    pub period_start: DateTime<Utc>,
    pub period_end: DateTime<Utc>,
    pub wash_sales: Vec<WashSale>,
    pub total_disallowed: Decimal,
    pub generated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WashSale {
    pub sale_trade_id: String,
    pub purchase_trade_id: String,
    pub loss_disallowed: Decimal,
    pub adjusted_basis: Decimal,
}

#[derive(Debug, Clone)]
struct CostBasis {
    investor: Address,
    asset: Option<Address>,
    total_cost: Decimal,
    acquisition_date: DateTime<Utc>,
    method: CostBasisMethod,
}

#[derive(Debug, Clone)]
enum CostBasisMethod {
    Fifo,
    Lifo,
    SpecificId,
}

#[derive(Debug, Clone)]
pub struct Trade {
    pub id: String,
    pub investor: Address,
    pub asset: Address,
    pub date: DateTime<Utc>,
    pub is_purchase: bool,
    pub quantity: Decimal,
    pub price: Decimal,
    pub cost_basis: Decimal,
    pub gain_loss: Decimal,
}

struct TaxTransaction {
    id: String,
    investor: Address,
    date: DateTime<Utc>,
    proceeds: Decimal,
    cost_basis: Decimal,
    is_long_term: bool,
    wash_sale: bool,
}
