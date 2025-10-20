// SPDX-License-Identifier: MIT
//! Quantera Compliance Service v2.0.0-alpha
//! 
//! Institutional-grade compliance automation service providing:
//! - Multi-provider KYC verification
//! - Real-time sanctions screening
//! - Multi-jurisdiction tax calculation
//! - Encrypted document storage on IPFS

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use ethers::prelude::*;
use serde::{Deserialize, Serialize};
use thiserror::Error;
use anyhow::Result;
use chrono::{DateTime, Utc};
use uuid::Uuid;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use sqlx::{PgPool, postgres::PgPoolOptions};
use redis::aio::ConnectionManager;
use redis::AsyncCommands;
use tracing::{info, warn, error, debug};
use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use rand::RngCore;
use sha2::{Sha256, Digest};
use strsim::levenshtein;

pub mod config;
pub mod kyc;
pub mod sanctions;
pub mod tax;
pub mod ipfs;

use config::Config;
use kyc::{KycProvider, KycParams, KycResult, KycStatus, JumioClient, OnfidoClient};
use sanctions::{SanctionsScreener, SanctionedEntity, ScreeningResult};
use tax::{TaxCalculator, TaxReport, Transaction, Form1099, WashSaleReport};
use ipfs::IpfsClient;

// ============ Error Types ============

#[derive(Error, Debug)]
pub enum ComplianceError {
    #[error("KYC verification failed: {0}")]
    KycVerificationFailed(String),
    
    #[error("Sanctions screening failed: {0}")]
    SanctionsScreeningFailed(String),
    
    #[error("Tax calculation error: {0}")]
    TaxCalculationError(String),
    
    #[error("IPFS storage error: {0}")]
    IpfsStorageError(String),
    
    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),
    
    #[error("Redis cache error: {0}")]
    CacheError(#[from] redis::RedisError),
    
    #[error("Ethereum client error: {0}")]
    EthereumError(String),
    
    #[error("Configuration error: {0}")]
    ConfigurationError(String),
    
    #[error("API client error: {0}")]
    ApiClientError(#[from] reqwest::Error),
    
    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),
    
    #[error("Encryption error: {0}")]
    EncryptionError(String),
    
    #[error("Rate limit exceeded")]
    RateLimitExceeded,
    
    #[error("Invalid input: {0}")]
    InvalidInput(String),
}

// ============ Data Structures ============

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComplianceCheck {
    pub id: Uuid,
    pub investor_address: Address,
    pub jurisdiction: String,
    pub kyc_status: KycStatus,
    pub sanctions_status: ScreeningResult,
    pub tax_status: Option<TaxReport>,
    pub documents: Vec<String>, // IPFS hashes
    pub timestamp: DateTime<Utc>,
    pub risk_score: u32,
    pub approved: bool,
    pub violations: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InvestorProfile {
    pub address: Address,
    pub jurisdiction: String,
    pub kyc_level: u8,
    pub kyc_expiry: DateTime<Utc>,
    pub accreditation_level: u8,
    pub risk_score: u32,
    pub total_invested: Decimal,
    pub documents_ipfs: Vec<String>,
    pub last_check: DateTime<Utc>,
    pub pep: bool,
    pub sanctioned: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComplianceReport {
    pub report_id: Uuid,
    pub investor: Address,
    pub asset: Option<Address>,
    pub amount: Decimal,
    pub jurisdiction: String,
    pub kyc_result: KycResult,
    pub sanctions_result: ScreeningResult,
    pub tax_implications: Option<TaxReport>,
    pub violations: Vec<Violation>,
    pub recommendations: Vec<String>,
    pub generated_at: DateTime<Utc>,
    pub ipfs_hash: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Violation {
    pub violation_type: String,
    pub description: String,
    pub severity: ViolationSeverity,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ViolationSeverity {
    Low,
    Medium,
    High,
    Critical,
}

// ============ Main Service ============

pub struct ComplianceService {
    config: Arc<Config>,
    db: Arc<PgPool>,
    cache: Arc<RwLock<ConnectionManager>>,
    eth_client: Arc<Provider<Http>>,
    kyc_providers: HashMap<String, Box<dyn KycProvider>>,
    sanctions_screener: Arc<SanctionsScreener>,
    tax_calculator: Arc<TaxCalculator>,
    ipfs_client: Arc<IpfsClient>,
    compliance_engine_address: Address,
}

impl ComplianceService {
    /// Initialize new compliance service with all providers
    pub async fn new(
        config: Config,
        database_url: &str,
        redis_url: &str,
        eth_rpc_url: &str,
        compliance_engine_address: Address,
    ) -> Result<Self, ComplianceError> {
        info!("Initializing Compliance Service v2.0.0-alpha");
        
        // Initialize database
        let db = PgPoolOptions::new()
            .max_connections(20)
            .connect(database_url)
            .await
            .map_err(|e| ComplianceError::ConfigurationError(format!("Database connection failed: {}", e)))?;
        
        // Initialize Redis cache
        let redis_client = redis::Client::open(redis_url)
            .map_err(|e| ComplianceError::ConfigurationError(format!("Redis connection failed: {}", e)))?;
        let cache = ConnectionManager::new(redis_client).await?;
        
        // Initialize Ethereum client
        let eth_client = Provider::<Http>::try_from(eth_rpc_url)
            .map_err(|e| ComplianceError::ConfigurationError(format!("Ethereum client failed: {}", e)))?;
        
        // Initialize KYC providers
        let mut kyc_providers: HashMap<String, Box<dyn KycProvider>> = HashMap::new();
        
        if let (Some(jumio_key), Some(jumio_secret)) = (config.jumio_api_key.clone(), config.jumio_api_secret.clone()) {
            kyc_providers.insert(
                "jumio".to_string(),
                Box::new(JumioClient::new(jumio_key, jumio_secret)),
            );
        }
        
        if let Some(onfido_token) = config.onfido_api_token.clone() {
            kyc_providers.insert(
                "onfido".to_string(),
                Box::new(OnfidoClient::new(onfido_token)),
            );
        }
        
        // Initialize sanctions screener
        let sanctions_screener = SanctionsScreener::new(
            config.ofac_api_key.clone(),
            cache.clone(),
        ).await?;
        
        // Initialize tax calculator
        let tax_calculator = TaxCalculator::new(db.clone());
        
        // Initialize IPFS client
        let ipfs_client = IpfsClient::new(
            &config.ipfs_api_url,
            config.encryption_key.clone(),
        )?;
        
        info!("Compliance Service initialized successfully");
        
        Ok(Self {
            config: Arc::new(config),
            db: Arc::new(db),
            cache: Arc::new(RwLock::new(cache)),
            eth_client: Arc::new(eth_client),
            kyc_providers,
            sanctions_screener: Arc::new(sanctions_screener),
            tax_calculator: Arc::new(tax_calculator),
            ipfs_client: Arc::new(ipfs_client),
            compliance_engine_address,
        })
    }
    
    /// Perform complete compliance check for an investor
    pub async fn perform_compliance_check(
        &self,
        investor_address: Address,
        jurisdiction: &str,
        amount: Decimal,
        asset_address: Option<Address>,
    ) -> Result<ComplianceReport, ComplianceError> {
        info!("Performing compliance check for investor: {:?}", investor_address);
        
        let report_id = Uuid::new_v4();
        let mut violations = Vec::new();
        let mut recommendations = Vec::new();
        
        // 1. Check cache first
        let cache_key = format!("compliance:{}:{}", investor_address, jurisdiction);
        let mut cache = self.cache.write().await;
        
        if let Ok(cached) = cache.get::<_, String>(&cache_key).await {
            if let Ok(report) = serde_json::from_str::<ComplianceReport>(&cached) {
                // Check if cache is still valid (24 hours)
                let age = Utc::now() - report.generated_at;
                if age.num_hours() < 24 {
                    info!("Returning cached compliance report");
                    return Ok(report);
                }
            }
        }
        
        // 2. KYC Verification
        let kyc_params = KycParams {
            investor_id: investor_address.to_string(),
            document_type: "passport".to_string(),
            country: jurisdiction.to_string(),
            metadata: HashMap::new(),
        };
        
        let kyc_result = self.verify_kyc(kyc_params).await?;
        
        if !kyc_result.verified {
            violations.push(Violation {
                violation_type: "KYC_FAILED".to_string(),
                description: kyc_result.reason.unwrap_or_else(|| "KYC verification failed".to_string()),
                severity: ViolationSeverity::Critical,
            });
        }
        
        // 3. Sanctions Screening
        let sanctions_result = self.sanctions_screener
            .screen_address(investor_address)
            .await?;
        
        if sanctions_result.is_sanctioned {
            violations.push(Violation {
                violation_type: "SANCTIONS_HIT".to_string(),
                description: format!("Found on sanctions list: {:?}", sanctions_result.lists),
                severity: ViolationSeverity::Critical,
            });
        }
        
        // 4. Tax Calculation (if applicable)
        let tax_implications = if amount > dec!(0) {
            let transaction = Transaction {
                investor: investor_address,
                asset: asset_address,
                amount,
                transaction_type: tax::TransactionType::Buy,
                timestamp: Utc::now(),
                price: amount,
            };
            
            Some(self.tax_calculator.calculate_tax(transaction, jurisdiction).await?)
        } else {
            None
        };
        
        // 5. Check with on-chain compliance engine
        let on_chain_result = self.check_on_chain_compliance(
            investor_address,
            amount,
            asset_address,
        ).await?;
        
        if !on_chain_result {
            violations.push(Violation {
                violation_type: "ON_CHAIN_COMPLIANCE_FAILED".to_string(),
                description: "Failed on-chain compliance validation".to_string(),
                severity: ViolationSeverity::High,
            });
        }
        
        // Generate recommendations
        if violations.is_empty() {
            recommendations.push("All compliance checks passed".to_string());
        } else {
            if violations.iter().any(|v| matches!(v.severity, ViolationSeverity::Critical)) {
                recommendations.push("Transaction should be blocked due to critical violations".to_string());
            }
            if kyc_result.kyc_level < 2 {
                recommendations.push("Enhanced KYC verification recommended".to_string());
            }
        }
        
        // Create report
        let report = ComplianceReport {
            report_id,
            investor: investor_address,
            asset: asset_address,
            amount,
            jurisdiction: jurisdiction.to_string(),
            kyc_result,
            sanctions_result,
            tax_implications,
            violations: violations.clone(),
            recommendations,
            generated_at: Utc::now(),
            ipfs_hash: None,
        };
        
        // Store report on IPFS
        let report_json = serde_json::to_vec(&report)?;
        let ipfs_hash = self.ipfs_client.upload_encrypted(report_json).await?;
        
        let mut final_report = report.clone();
        final_report.ipfs_hash = Some(ipfs_hash.clone());
        
        // Cache the report
        let report_str = serde_json::to_string(&final_report)?;
        let _: () = cache.set_ex(&cache_key, report_str.as_str(), 86400).await?; // 24 hour TTL
        
        // Store in database
        self.store_compliance_report(&final_report).await?;
        
        info!("Compliance check completed. Violations: {}, IPFS: {}", violations.len(), ipfs_hash);
        
        Ok(final_report)
    }
    
    /// Verify KYC using available providers with fallback
    pub async fn verify_kyc(&self, params: KycParams) -> Result<KycResult, ComplianceError> {
        // Try primary provider (Jumio)
        if let Some(jumio) = self.kyc_providers.get("jumio") {
            match jumio.verify_identity(params.clone()).await {
                Ok(result) if result.verified => return Ok(result),
                Ok(result) => {
                    warn!("Jumio verification failed, trying Onfido: {:?}", result.reason);
                }
                Err(e) => {
                    error!("Jumio error: {}, trying Onfido", e);
                }
            }
        }
        
        // Fallback to Onfido
        if let Some(onfido) = self.kyc_providers.get("onfido") {
            match onfido.verify_identity(params).await {
                Ok(result) => return Ok(result),
                Err(e) => {
                    error!("Onfido error: {}", e);
                    return Err(ComplianceError::KycVerificationFailed(format!("All providers failed: {}", e)));
                }
            }
        }
        
        Err(ComplianceError::KycVerificationFailed("No KYC providers available".to_string()))
    }
    
    /// Update investor profile in database and on-chain
    pub async fn update_investor_profile(
        &self,
        profile: InvestorProfile,
    ) -> Result<(), ComplianceError> {
        // Update database
        sqlx::query!(
            r#"
            INSERT INTO investor_profiles (
                address, jurisdiction, kyc_level, kyc_expiry, 
                accreditation_level, risk_score, total_invested,
                documents_ipfs, last_check, pep, sanctioned
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (address) DO UPDATE SET
                jurisdiction = $2, kyc_level = $3, kyc_expiry = $4,
                accreditation_level = $5, risk_score = $6, total_invested = $7,
                documents_ipfs = $8, last_check = $9, pep = $10, sanctioned = $11,
                updated_at = NOW()
            "#,
            profile.address.as_bytes(),
            profile.jurisdiction,
            profile.kyc_level as i16,
            profile.kyc_expiry,
            profile.accreditation_level as i16,
            profile.risk_score as i32,
            profile.total_invested,
            &profile.documents_ipfs,
            profile.last_check,
            profile.pep,
            profile.sanctioned,
        )
        .execute(self.db.as_ref())
        .await?;
        
        // Update on-chain if needed
        // TODO: Call AutomatedComplianceEngine.setInvestorProfile()
        
        info!("Updated investor profile for: {:?}", profile.address);
        Ok(())
    }
    
    /// Store compliance report in database
    async fn store_compliance_report(
        &self,
        report: &ComplianceReport,
    ) -> Result<(), ComplianceError> {
        let violations_json = serde_json::to_value(&report.violations)?;
        let recommendations_json = serde_json::to_value(&report.recommendations)?;
        
        sqlx::query!(
            r#"
            INSERT INTO compliance_reports (
                report_id, investor_address, asset_address, amount,
                jurisdiction, kyc_verified, sanctions_passed,
                violations, recommendations, ipfs_hash, generated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            "#,
            report.report_id,
            report.investor.as_bytes(),
            report.asset.map(|a| a.as_bytes()),
            report.amount,
            report.jurisdiction,
            report.kyc_result.verified,
            !report.sanctions_result.is_sanctioned,
            violations_json,
            recommendations_json,
            report.ipfs_hash.as_deref(),
            report.generated_at,
        )
        .execute(self.db.as_ref())
        .await?;
        
        Ok(())
    }
    
    /// Check compliance with on-chain smart contract
    async fn check_on_chain_compliance(
        &self,
        investor: Address,
        amount: Decimal,
        asset: Option<Address>,
    ) -> Result<bool, ComplianceError> {
        // TODO: Implement actual contract call to AutomatedComplianceEngine
        // For now, return mock result
        
        debug!("Checking on-chain compliance for investor: {:?}", investor);
        
        // Simulate contract call
        let amount_wei = amount.to_string().parse::<f64>().unwrap_or(0.0) * 1e18;
        let amount_wei = amount_wei as u128;
        
        if amount_wei > 1000000000000000000000 { // > 1000 tokens
            Ok(true) // Mock: large amounts allowed
        } else {
            Ok(true) // Mock: all amounts currently allowed
        }
    }
    
    /// Generate compliance statistics
    pub async fn get_compliance_stats(&self) -> Result<HashMap<String, serde_json::Value>, ComplianceError> {
        let mut stats = HashMap::new();
        
        // Get total checks today
        let today_count: i64 = sqlx::query_scalar!(
            "SELECT COUNT(*) FROM compliance_reports WHERE generated_at > NOW() - INTERVAL '1 day'"
        )
        .fetch_one(self.db.as_ref())
        .await?
        .unwrap_or(0);
        
        stats.insert("checks_today".to_string(), serde_json::json!(today_count));
        
        // Get violation breakdown
        let violations: Vec<(String, i64)> = sqlx::query_as!(
            ViolationStat,
            r#"
            SELECT 
                jsonb_array_elements(violations)->>'violation_type' as violation_type,
                COUNT(*) as count
            FROM compliance_reports
            WHERE generated_at > NOW() - INTERVAL '7 days'
            GROUP BY jsonb_array_elements(violations)->>'violation_type'
            "#
        )
        .fetch_all(self.db.as_ref())
        .await?
        .into_iter()
        .map(|v| (v.violation_type.unwrap_or_default(), v.count.unwrap_or(0)))
        .collect();
        
        stats.insert("violations_7d".to_string(), serde_json::json!(violations));
        
        Ok(stats)
    }
}

// Helper struct for stats query
#[derive(sqlx::FromRow)]
struct ViolationStat {
    violation_type: Option<String>,
    count: Option<i64>,
}