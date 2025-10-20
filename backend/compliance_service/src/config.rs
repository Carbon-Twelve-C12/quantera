use serde::Deserialize;
use std::env;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ConfigError {
    #[error("Environment variable not found: {0}")]
    NotFound(String),
    #[error("Invalid configuration: {0}")]
    Invalid(String),
}

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    // Database
    pub database_url: String,
    pub redis_url: String,
    
    // Ethereum
    pub eth_rpc_url: String,
    pub compliance_engine_address: String,
    
    // KYC Providers
    pub jumio_api_key: Option<String>,
    pub jumio_api_secret: Option<String>,
    pub onfido_api_token: Option<String>,
    
    // Sanctions APIs
    pub ofac_api_key: Option<String>,
    pub un_sanctions_api_key: Option<String>,
    
    // IPFS
    pub ipfs_api_url: String,
    pub encryption_key: Vec<u8>,
    
    // Service
    pub http_port: u16,
    pub log_level: String,
    
    // Tax
    pub tax_api_key: Option<String>,
}

impl Config {
    pub fn from_env() -> Result<Self, ConfigError> {
        dotenv::dotenv().ok();
        
        // Generate or load encryption key
        let encryption_key = env::var("ENCRYPTION_KEY")
            .unwrap_or_else(|_| {
                // Generate a new key if not provided
                let key = generate_encryption_key();
                hex::encode(&key)
            });
        
        let encryption_key = hex::decode(&encryption_key)
            .map_err(|e| ConfigError::Invalid(format!("Invalid encryption key: {}", e)))?;
        
        if encryption_key.len() != 32 {
            return Err(ConfigError::Invalid("Encryption key must be 32 bytes".to_string()));
        }
        
        Ok(Self {
            database_url: env::var("DATABASE_URL")
                .map_err(|_| ConfigError::NotFound("DATABASE_URL".to_string()))?,
            redis_url: env::var("REDIS_URL")
                .map_err(|_| ConfigError::NotFound("REDIS_URL".to_string()))?,
            eth_rpc_url: env::var("ETH_RPC_URL")
                .map_err(|_| ConfigError::NotFound("ETH_RPC_URL".to_string()))?,
            compliance_engine_address: env::var("COMPLIANCE_ENGINE_ADDRESS")
                .map_err(|_| ConfigError::NotFound("COMPLIANCE_ENGINE_ADDRESS".to_string()))?,
            
            jumio_api_key: env::var("JUMIO_API_KEY").ok(),
            jumio_api_secret: env::var("JUMIO_API_SECRET").ok(),
            onfido_api_token: env::var("ONFIDO_API_TOKEN").ok(),
            
            ofac_api_key: env::var("OFAC_API_KEY").ok(),
            un_sanctions_api_key: env::var("UN_SANCTIONS_API_KEY").ok(),
            
            ipfs_api_url: env::var("IPFS_API_URL")
                .unwrap_or_else(|_| "http://localhost:5001".to_string()),
            encryption_key,
            
            http_port: env::var("HTTP_PORT")
                .unwrap_or_else(|_| "8002".to_string())
                .parse()
                .map_err(|_| ConfigError::Invalid("Invalid HTTP_PORT".to_string()))?,
            log_level: env::var("LOG_LEVEL").unwrap_or_else(|_| "info".to_string()),
            
            tax_api_key: env::var("TAX_API_KEY").ok(),
        })
    }
    
    pub fn validate(&self) -> Result<(), ConfigError> {
        if self.database_url.is_empty() {
            return Err(ConfigError::Invalid("DATABASE_URL is empty".to_string()));
        }
        
        if self.redis_url.is_empty() {
            return Err(ConfigError::Invalid("REDIS_URL is empty".to_string()));
        }
        
        if !self.compliance_engine_address.starts_with("0x") || self.compliance_engine_address.len() != 42 {
            return Err(ConfigError::Invalid("Invalid COMPLIANCE_ENGINE_ADDRESS".to_string()));
        }
        
        // Warn if no KYC providers configured
        if self.jumio_api_key.is_none() && self.onfido_api_token.is_none() {
            tracing::warn!("No KYC providers configured. KYC verification will fail.");
        }
        
        Ok(())
    }
}

fn generate_encryption_key() -> [u8; 32] {
    use rand::RngCore;
    let mut key = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut key);
    key
}
