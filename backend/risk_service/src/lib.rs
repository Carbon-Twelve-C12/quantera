use std::sync::Arc;
use std::collections::HashMap;
use tokio::sync::RwLock;
use ethers::prelude::*;
use serde::{Deserialize, Serialize};
use rust_decimal::Decimal;
use rust_decimal::prelude::*;
use rust_decimal_macros::dec;

// Helper trait for Decimal conversions
trait DecimalExt {
    fn to_f64_lossy(&self) -> f64;
    fn sqrt_approx(&self) -> Option<Decimal>;
}

impl DecimalExt for Decimal {
    fn to_f64_lossy(&self) -> f64 {
        self.to_string().parse::<f64>().unwrap_or(0.0)
    }
    
    fn sqrt_approx(&self) -> Option<Decimal> {
        if *self < Decimal::ZERO {
            return None;
        }
        let f = self.to_f64_lossy();
        Some(Decimal::try_from(f.sqrt()).unwrap_or(Decimal::ZERO))
    }
}
use chrono::{DateTime, Utc};
use uuid::Uuid;
use anyhow::Result;
use thiserror::Error;
use tracing::{info, warn, error};
use ndarray::{Array1, Array2};
use rand::prelude::*;
use statrs::distribution::{Normal, ContinuousCDF};
use statrs::statistics::Statistics;
use redis::aio::ConnectionManager;
use sqlx::{PgPool, postgres::PgPoolOptions};
pub mod ethereum_client;
pub mod websocket;
pub mod config;
use ethereum_client::{EthereumClient, Address};
use futures::stream::StreamExt;

#[derive(Error, Debug)]
pub enum RiskServiceError {
    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),
    
    #[error("Redis error: {0}")]
    RedisError(#[from] redis::RedisError),
    
    #[error("Calculation error: {0}")]
    CalculationError(String),
    
    #[error("Insufficient data for calculation")]
    InsufficientData,
    
    #[error("Portfolio not found: {0}")]
    PortfolioNotFound(String),
    
    #[error("Ethereum client error: {0}")]
    EthereumError(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskMetrics {
    pub portfolio_address: Address,
    pub var_95: Decimal,          // 95% Value at Risk
    pub var_99: Decimal,          // 99% Value at Risk
    pub expected_shortfall: Decimal,
    pub sharpe_ratio: Decimal,
    pub sortino_ratio: Decimal,
    pub max_drawdown: Decimal,
    pub beta: Decimal,
    pub alpha: Decimal,
    pub volatility: Decimal,
    pub correlation_matrix: Vec<Vec<Decimal>>,
    pub liquidity_scores: HashMap<Address, u8>,
    pub concentration_risk: Decimal,
    pub leverage_ratio: Decimal,
    pub risk_grade: RiskGrade,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RiskGrade {
    A,  // Low risk
    B,  // Medium-low risk
    C,  // Medium risk
    D,  // Medium-high risk
    F,  // High risk
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortfolioPosition {
    pub asset: Address,
    pub amount: Decimal,
    pub current_price: Decimal,
    pub entry_price: Decimal,
    pub unrealized_pnl: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketScenario {
    pub name: String,
    pub price_shocks: HashMap<Address, Decimal>,
    pub volatility_multiplier: Decimal,
    pub correlation_adjustment: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScenarioOutcome {
    pub scenario: MarketScenario,
    pub portfolio_value_change: Decimal,
    pub var_impact: Decimal,
    pub probability: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskAlert {
    pub id: Uuid,
    pub portfolio: Address,
    pub alert_type: AlertType,
    pub severity: AlertSeverity,
    pub message: String,
    pub metric_value: Decimal,
    pub threshold: Decimal,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertType {
    VaRBreach,
    DrawdownLimit,
    ConcentrationRisk,
    LiquidityWarning,
    VolatilitySpike,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlertSeverity {
    Info,
    Warning,
    Critical,
}

pub struct RiskService {
    eth_client: Arc<EthereumClient>,
    db: Arc<PgPool>,
    cache: Arc<RwLock<ConnectionManager>>,
    risk_engine_address: Address,
    websocket_clients: Arc<RwLock<HashMap<Uuid, tokio::sync::mpsc::Sender<RiskMetrics>>>>,
}

impl RiskService {
    pub async fn new(
        eth_client: Arc<EthereumClient>,
        database_url: &str,
        redis_url: &str,
        risk_engine_address: Address,
    ) -> Result<Self> {
        // Initialize database connection
        let db = PgPoolOptions::new()
            .max_connections(10)
            .connect(database_url)
            .await?;
        
        // Initialize Redis connection
        let client = redis::Client::open(redis_url)?;
        let conn = ConnectionManager::new(client).await?;
        let cache = Arc::new(RwLock::new(conn));
        
        Ok(Self {
            eth_client,
            db: Arc::new(db),
            cache,
            risk_engine_address,
            websocket_clients: Arc::new(RwLock::new(HashMap::new())),
        })
    }
    
    /// Calculate comprehensive risk assessment for a portfolio
    pub async fn calculate_portfolio_risk(
        &self,
        portfolio_address: Address,
    ) -> Result<RiskMetrics, RiskServiceError> {
        // Fetch portfolio positions from on-chain
        let positions = self.fetch_portfolio_positions(portfolio_address).await?;
        
        if positions.is_empty() {
            return Err(RiskServiceError::PortfolioNotFound(format!("{:?}", portfolio_address)));
        }
        
        // Fetch historical price data
        let price_history = self.fetch_price_history(&positions).await?;
        
        if price_history.len() < 30 {
            return Err(RiskServiceError::InsufficientData);
        }
        
        // Calculate returns
        let returns = self.calculate_returns(&price_history);
        
        // Calculate VaR using Monte Carlo simulation
        let (var_95, var_99) = self.calculate_var_monte_carlo(&returns, &positions, 10000).await?;
        
        // Calculate Expected Shortfall (CVaR)
        let expected_shortfall = self.calculate_expected_shortfall(&returns, var_95);
        
        // Calculate correlation matrix
        let correlation_matrix = self.calculate_correlation_matrix(&returns);
        
        // Calculate Sharpe ratio
        let sharpe_ratio = self.calculate_sharpe_ratio(&returns);
        
        // Calculate Sortino ratio
        let sortino_ratio = self.calculate_sortino_ratio(&returns);
        
        // Calculate maximum drawdown
        let max_drawdown = self.calculate_max_drawdown(&price_history);
        
        // Calculate beta and alpha
        let (beta, alpha) = self.calculate_beta_alpha(&returns).await?;
        
        // Calculate volatility
        let volatility = self.calculate_volatility(&returns);
        
        // Assess liquidity
        let liquidity_scores = self.assess_liquidity(&positions).await?;
        
        // Calculate concentration risk
        let concentration_risk = self.calculate_concentration_risk(&positions);
        
        // Calculate leverage ratio
        let leverage_ratio = self.calculate_leverage_ratio(&positions);
        
        // Determine risk grade
        let risk_grade = self.determine_risk_grade(var_95, sharpe_ratio, max_drawdown);
        
        let metrics = RiskMetrics {
            portfolio_address,
            var_95,
            var_99,
            expected_shortfall,
            sharpe_ratio,
            sortino_ratio,
            max_drawdown,
            beta,
            alpha,
            volatility,
            correlation_matrix,
            liquidity_scores,
            concentration_risk,
            leverage_ratio,
            risk_grade,
            timestamp: Utc::now(),
        };
        
        // Store metrics in database
        self.store_risk_metrics(&metrics).await?;
        
        // Cache results in Redis
        self.cache_risk_metrics(&metrics).await?;
        
        // Send real-time updates via WebSocket
        self.broadcast_risk_update(&metrics).await;
        
        Ok(metrics)
    }
    
    /// Predict risk under various market scenarios
    pub async fn predict_risk_scenarios(
        &self,
        portfolio_address: Address,
        scenarios: Vec<MarketScenario>,
    ) -> Result<Vec<ScenarioOutcome>, RiskServiceError> {
        let mut outcomes = Vec::new();
        
        for scenario in scenarios {
            let outcome = self.run_scenario_simulation(portfolio_address, &scenario).await?;
            outcomes.push(outcome);
        }
        
        outcomes.sort_by(|a, b| b.portfolio_value_change.partial_cmp(&a.portfolio_value_change).unwrap());
        
        Ok(outcomes)
    }
    
    /// Monitor risk limits and generate alerts
    pub async fn monitor_risk_limits(
        &self,
        portfolio_address: Address,
    ) -> Result<Vec<RiskAlert>, RiskServiceError> {
        let metrics = self.calculate_portfolio_risk(portfolio_address).await?;
        let limits = self.fetch_risk_limits(portfolio_address).await?;
        let mut alerts = Vec::new();
        
        // Check VaR limits
        if let Some(var_limit) = limits.get("max_var_95") {
            if metrics.var_95 > *var_limit {
                alerts.push(RiskAlert {
                    id: Uuid::new_v4(),
                    portfolio: portfolio_address,
                    alert_type: AlertType::VaRBreach,
                    severity: AlertSeverity::Critical,
                    message: format!("VaR (95%) exceeds limit: {} > {}", metrics.var_95, var_limit),
                    metric_value: metrics.var_95,
                    threshold: *var_limit,
                    timestamp: Utc::now(),
                });
            }
        }
        
        // Check drawdown limits
        if let Some(dd_limit) = limits.get("max_drawdown") {
            if metrics.max_drawdown > *dd_limit {
                alerts.push(RiskAlert {
                    id: Uuid::new_v4(),
                    portfolio: portfolio_address,
                    alert_type: AlertType::DrawdownLimit,
                    severity: AlertSeverity::Warning,
                    message: format!("Maximum drawdown exceeds limit: {} > {}", metrics.max_drawdown, dd_limit),
                    metric_value: metrics.max_drawdown,
                    threshold: *dd_limit,
                    timestamp: Utc::now(),
                });
            }
        }
        
        // Check concentration risk
        if metrics.concentration_risk > Decimal::from_str("0.4").unwrap() {
            alerts.push(RiskAlert {
                id: Uuid::new_v4(),
                portfolio: portfolio_address,
                alert_type: AlertType::ConcentrationRisk,
                severity: AlertSeverity::Warning,
                message: format!("High concentration risk: {}", metrics.concentration_risk),
                metric_value: metrics.concentration_risk,
                threshold: Decimal::from_str("0.4").unwrap(),
                timestamp: Utc::now(),
            });
        }
        
        // Store alerts
        for alert in &alerts {
            self.store_alert(alert).await?;
        }
        
        Ok(alerts)
    }
    
    // Private helper methods
    
    async fn fetch_portfolio_positions(&self, portfolio: Address) -> Result<Vec<PortfolioPosition>, RiskServiceError> {
        // In production, fetch from blockchain
        // For now, return mock data
        Ok(vec![
            PortfolioPosition {
                asset: Address::random(),
                amount: Decimal::from(1000),
                current_price: Decimal::from(100),
                entry_price: Decimal::from(95),
                unrealized_pnl: Decimal::from(5000),
            },
        ])
    }
    
    async fn fetch_price_history(&self, _positions: &[PortfolioPosition]) -> Result<Vec<Vec<Decimal>>, RiskServiceError> {
        // Fetch from database or external API
        // Mock implementation
        let mut rng = thread_rng();
        let mut history = Vec::new();
        
        for _ in 0..100 {
            let mut day_prices = Vec::new();
            for _ in 0..5 {
                let price = Decimal::from(100) + Decimal::from(rng.gen_range(-10..10));
                day_prices.push(price);
            }
            history.push(day_prices);
        }
        
        Ok(history)
    }
    
    fn calculate_returns(&self, price_history: &[Vec<Decimal>]) -> Vec<Vec<Decimal>> {
        let mut returns = Vec::new();
        
        for i in 1..price_history.len() {
            let mut day_returns = Vec::new();
            for j in 0..price_history[i].len() {
                let return_val = (price_history[i][j] - price_history[i-1][j]) / price_history[i-1][j];
                day_returns.push(return_val);
            }
            returns.push(day_returns);
        }
        
        returns
    }
    
    async fn calculate_var_monte_carlo(
        &self,
        returns: &[Vec<Decimal>],
        _positions: &[PortfolioPosition],
        num_simulations: usize,
    ) -> Result<(Decimal, Decimal), RiskServiceError> {
        let mut rng = thread_rng();
        let mut simulated_returns = Vec::new();
        
        // Calculate mean and standard deviation of returns
        let mean = Decimal::from(0); // Simplified
        let std_dev = Decimal::from_str("0.02").unwrap(); // 2% daily volatility
        
        // Run Monte Carlo simulations
        for _ in 0..num_simulations {
            let normal = Normal::new(0.0, std_dev.to_f64_lossy()).unwrap();
            let simulated = Decimal::try_from(normal.sample(&mut rng)).unwrap_or(Decimal::ZERO);
            simulated_returns.push(mean + simulated);
        }
        
        // Sort returns
        simulated_returns.sort();
        
        // Calculate VaR at 95% and 99% confidence levels
        let index_95 = (num_simulations as f64 * 0.05) as usize;
        let index_99 = (num_simulations as f64 * 0.01) as usize;
        
        let var_95 = simulated_returns[index_95].abs();
        let var_99 = simulated_returns[index_99].abs();
        
        Ok((var_95, var_99))
    }
    
    fn calculate_expected_shortfall(&self, returns: &[Vec<Decimal>], var_95: Decimal) -> Decimal {
        let mut losses_beyond_var = Vec::new();
        
        for day_returns in returns {
            for ret in day_returns {
                if *ret < -var_95 {
                    losses_beyond_var.push(ret.abs());
                }
            }
        }
        
        if losses_beyond_var.is_empty() {
            return var_95;
        }
        
        let sum: Decimal = losses_beyond_var.iter().sum();
        sum / Decimal::from(losses_beyond_var.len())
    }
    
    fn calculate_correlation_matrix(&self, returns: &[Vec<Decimal>]) -> Vec<Vec<Decimal>> {
        let num_assets = returns[0].len();
        let mut matrix = vec![vec![Decimal::ZERO; num_assets]; num_assets];
        
        for i in 0..num_assets {
            for j in 0..num_assets {
                if i == j {
                    matrix[i][j] = Decimal::ONE;
                } else {
                    // Calculate correlation between asset i and j
                    let corr = self.calculate_correlation(returns, i, j);
                    matrix[i][j] = corr;
                    matrix[j][i] = corr;
                }
            }
        }
        
        matrix
    }
    
    fn calculate_correlation(&self, returns: &[Vec<Decimal>], i: usize, j: usize) -> Decimal {
        // Simplified correlation calculation
        Decimal::from_str("0.5").unwrap()
    }
    
    fn calculate_sharpe_ratio(&self, returns: &[Vec<Decimal>]) -> Decimal {
        // Calculate average return
        let mut total_return = Decimal::ZERO;
        let mut count = 0;
        
        for day_returns in returns {
            for ret in day_returns {
                total_return += ret;
                count += 1;
            }
        }
        
        let avg_return = total_return / Decimal::from(count);
        
        // Calculate standard deviation
        let mut variance_sum = Decimal::ZERO;
        for day_returns in returns {
            for ret in day_returns {
                let diff = ret - avg_return;
                variance_sum += diff * diff;
            }
        }
        
        let std_dev = (variance_sum / Decimal::from(count)).sqrt_approx().unwrap_or(Decimal::ONE);
        
        // Assume risk-free rate of 2% annually (0.0079% daily)
        let risk_free_rate = Decimal::from_str("0.000079").unwrap();
        
        // Sharpe ratio = (return - risk_free_rate) / std_dev
        if std_dev > Decimal::ZERO {
            (avg_return - risk_free_rate) / std_dev
        } else {
            Decimal::ZERO
        }
    }
    
    fn calculate_sortino_ratio(&self, returns: &[Vec<Decimal>]) -> Decimal {
        // Similar to Sharpe but only considers downside volatility
        let mut total_return = Decimal::ZERO;
        let mut count = 0;
        let mut downside_variance = Decimal::ZERO;
        let mut downside_count = 0;
        
        for day_returns in returns {
            for ret in day_returns {
                total_return += ret;
                count += 1;
                
                if *ret < Decimal::ZERO {
                    downside_variance += ret * ret;
                    downside_count += 1;
                }
            }
        }
        
        let avg_return = total_return / Decimal::from(count);
        
        if downside_count > 0 {
            let downside_deviation = (downside_variance / Decimal::from(downside_count)).sqrt_approx().unwrap_or(Decimal::ONE);
            let risk_free_rate = Decimal::from_str("0.000079").unwrap();
            
            if downside_deviation > Decimal::ZERO {
                (avg_return - risk_free_rate) / downside_deviation
            } else {
                Decimal::ZERO
            }
        } else {
            Decimal::from(100) // No downside risk
        }
    }
    
    fn calculate_max_drawdown(&self, price_history: &[Vec<Decimal>]) -> Decimal {
        let mut max_drawdown = Decimal::ZERO;
        
        for asset_idx in 0..price_history[0].len() {
            let mut peak = price_history[0][asset_idx];
            
            for day_prices in price_history {
                let current = day_prices[asset_idx];
                
                if current > peak {
                    peak = current;
                }
                
                let drawdown = (peak - current) / peak;
                if drawdown > max_drawdown {
                    max_drawdown = drawdown;
                }
            }
        }
        
        max_drawdown
    }
    
    async fn calculate_beta_alpha(&self, _returns: &[Vec<Decimal>]) -> Result<(Decimal, Decimal), RiskServiceError> {
        // Calculate beta and alpha against market benchmark
        // Simplified implementation
        let beta = Decimal::ONE; // Market neutral
        let alpha = Decimal::from_str("0.02").unwrap(); // 2% alpha
        
        Ok((beta, alpha))
    }
    
    fn calculate_volatility(&self, returns: &[Vec<Decimal>]) -> Decimal {
        let mut variance_sum = Decimal::ZERO;
        let mut count = 0;
        
        for day_returns in returns {
            for ret in day_returns {
                variance_sum += ret * ret;
                count += 1;
            }
        }
        
        if count > 0 {
            // Annualize volatility (252 trading days)
            let daily_vol = (variance_sum / Decimal::from(count)).sqrt_approx().unwrap_or(Decimal::ZERO);
            daily_vol * Decimal::from(252).sqrt_approx().unwrap_or(Decimal::ONE)
        } else {
            Decimal::ZERO
        }
    }
    
    async fn assess_liquidity(&self, positions: &[PortfolioPosition]) -> Result<HashMap<Address, u8>, RiskServiceError> {
        let mut scores = HashMap::new();
        
        for position in positions {
            // Simplified liquidity scoring
            let score = if position.amount > Decimal::from(10000) {
                50 // Low liquidity for large positions
            } else if position.amount > Decimal::from(1000) {
                75 // Medium liquidity
            } else {
                95 // High liquidity for small positions
            };
            
            scores.insert(position.asset, score);
        }
        
        Ok(scores)
    }
    
    fn calculate_concentration_risk(&self, positions: &[PortfolioPosition]) -> Decimal {
        let total_value: Decimal = positions.iter()
            .map(|p| p.amount * p.current_price)
            .sum();
        
        if total_value == Decimal::ZERO {
            return Decimal::ZERO;
        }
        
        let max_position = positions.iter()
            .map(|p| p.amount * p.current_price)
            .max()
            .unwrap_or(Decimal::ZERO);
        
        max_position / total_value
    }
    
    fn calculate_leverage_ratio(&self, positions: &[PortfolioPosition]) -> Decimal {
        // Simplified leverage calculation
        // In production, would consider borrowed amounts
        Decimal::ONE
    }
    
    fn determine_risk_grade(&self, var: Decimal, sharpe: Decimal, drawdown: Decimal) -> RiskGrade {
        let var_score = if var < Decimal::from_str("0.02").unwrap() {
            100
        } else if var < Decimal::from_str("0.05").unwrap() {
            75
        } else if var < Decimal::from_str("0.10").unwrap() {
            50
        } else if var < Decimal::from_str("0.15").unwrap() {
            25
        } else {
            0
        };
        
        let sharpe_score = if sharpe > Decimal::from(2) {
            100
        } else if sharpe > Decimal::ONE {
            75
        } else if sharpe > Decimal::from_str("0.5").unwrap() {
            50
        } else if sharpe > Decimal::ZERO {
            25
        } else {
            0
        };
        
        let dd_score = if drawdown < Decimal::from_str("0.05").unwrap() {
            100
        } else if drawdown < Decimal::from_str("0.10").unwrap() {
            75
        } else if drawdown < Decimal::from_str("0.20").unwrap() {
            50
        } else if drawdown < Decimal::from_str("0.30").unwrap() {
            25
        } else {
            0
        };
        
        let avg_score = (var_score + sharpe_score + dd_score) / 3;
        
        match avg_score {
            80..=100 => RiskGrade::A,
            60..=79 => RiskGrade::B,
            40..=59 => RiskGrade::C,
            20..=39 => RiskGrade::D,
            _ => RiskGrade::F,
        }
    }
    
    async fn store_risk_metrics(&self, metrics: &RiskMetrics) -> Result<(), RiskServiceError> {
        let query = r#"
            INSERT INTO risk_metrics (
                portfolio_address, timestamp, var_95, var_99,
                sharpe_ratio, max_drawdown, beta, volatility,
                liquidity_score, concentration_risk, risk_grade
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        "#;
        
        let liquidity_avg = metrics.liquidity_scores.values()
            .map(|&v| v as i32)
            .sum::<i32>() / metrics.liquidity_scores.len().max(1) as i32;
        
        sqlx::query(query)
            .bind(format!("{:?}", metrics.portfolio_address))
            .bind(metrics.timestamp)
            .bind(metrics.var_95.to_f64_lossy())
            .bind(metrics.var_99.to_f64_lossy())
            .bind(metrics.sharpe_ratio.to_f64_lossy())
            .bind(metrics.max_drawdown.to_f64_lossy())
            .bind(metrics.beta.to_f64_lossy())
            .bind(metrics.volatility.to_f64_lossy())
            .bind(liquidity_avg)
            .bind(metrics.concentration_risk.to_f64_lossy())
            .bind(format!("{:?}", metrics.risk_grade))
            .execute(&*self.db)
            .await?;
        
        Ok(())
    }
    
    async fn cache_risk_metrics(&self, metrics: &RiskMetrics) -> Result<(), RiskServiceError> {
        let mut cache = self.cache.write().await;
        let key = format!("risk:portfolio:{:?}", metrics.portfolio_address);
        let value = serde_json::to_string(metrics).unwrap();
        
        redis::cmd("SET")
            .arg(&key)
            .arg(value)
            .arg("EX")
            .arg(300) // 5 minute TTL
            .query_async(&mut *cache)
            .await?;
        
        Ok(())
    }
    
    async fn broadcast_risk_update(&self, metrics: &RiskMetrics) {
        let clients = self.websocket_clients.read().await;
        for (_id, sender) in clients.iter() {
            let _ = sender.send(metrics.clone()).await;
        }
    }
    
    async fn run_scenario_simulation(
        &self,
        portfolio: Address,
        scenario: &MarketScenario,
    ) -> Result<ScenarioOutcome, RiskServiceError> {
        // Stress test portfolio under scenario
        // Simplified implementation
        let portfolio_value_change = Decimal::from_str("-0.05").unwrap(); // 5% loss
        let var_impact = Decimal::from_str("0.02").unwrap(); // 2% increase in VaR
        let probability = Decimal::from_str("0.15").unwrap(); // 15% probability
        
        Ok(ScenarioOutcome {
            scenario: scenario.clone(),
            portfolio_value_change,
            var_impact,
            probability,
        })
    }
    
    async fn fetch_risk_limits(&self, _portfolio: Address) -> Result<HashMap<String, Decimal>, RiskServiceError> {
        // Fetch from database or smart contract
        let mut limits = HashMap::new();
        limits.insert("max_var_95".to_string(), Decimal::from_str("0.10").unwrap());
        limits.insert("max_drawdown".to_string(), Decimal::from_str("0.20").unwrap());
        Ok(limits)
    }
    
    async fn store_alert(&self, _alert: &RiskAlert) -> Result<(), RiskServiceError> {
        // Store in database
        Ok(())
    }
    
    pub async fn register_websocket_client(&self, client_id: Uuid, sender: tokio::sync::mpsc::Sender<RiskMetrics>) {
        let mut clients = self.websocket_clients.write().await;
        clients.insert(client_id, sender);
        info!("WebSocket client {} registered", client_id);
    }
    
    pub async fn unregister_websocket_client(&self, client_id: Uuid) {
        let mut clients = self.websocket_clients.write().await;
        clients.remove(&client_id);
        info!("WebSocket client {} unregistered", client_id);
    }
    
    pub async fn get_client_sender(&self, client_id: Uuid) -> Option<tokio::sync::mpsc::Sender<RiskMetrics>> {
        let clients = self.websocket_clients.read().await;
        clients.get(&client_id).cloned()
    }
}

use rust_decimal::prelude::FromStr;