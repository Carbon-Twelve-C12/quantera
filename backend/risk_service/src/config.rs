// Configuration management for Risk Service
use std::env;
use serde::Deserialize;
use tracing::info;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub database_url: String,
    pub redis_url: String,
    pub eth_rpc_url: String,
    pub risk_engine_address: String,
    pub chainlink_price_feed: Option<String>,
    pub log_level: String,
    pub http_port: u16,
    pub ws_port: u16,
}

impl Config {
    pub fn from_env() -> Result<Self, String> {
        // Try to load .env file if it exists
        dotenv::dotenv().ok();
        
        // Required environment variables
        let database_url = env::var("DATABASE_URL")
            .map_err(|_| "DATABASE_URL not set. Example: postgresql://postgres:password@localhost:5432/quantera_dev")?;
            
        let redis_url = env::var("REDIS_URL")
            .map_err(|_| "REDIS_URL not set. Example: redis://localhost:6379")?;
            
        let eth_rpc_url = env::var("ETH_RPC_URL")
            .map_err(|_| "ETH_RPC_URL not set. Example: http://localhost:8545 or https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY")?;
            
        let risk_engine_address = env::var("RISK_ENGINE_ADDRESS")
            .map_err(|_| "RISK_ENGINE_ADDRESS not set. Example: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")?;
        
        // Optional environment variables with defaults
        let chainlink_price_feed = env::var("CHAINLINK_PRICE_FEED").ok();
        let log_level = env::var("LOG_LEVEL").unwrap_or_else(|_| "info".to_string());
        let http_port = env::var("HTTP_PORT")
            .unwrap_or_else(|_| "8001".to_string())
            .parse::<u16>()
            .map_err(|_| "HTTP_PORT must be a valid port number")?;
        let ws_port = env::var("WS_PORT")
            .unwrap_or_else(|_| "8546".to_string())
            .parse::<u16>()
            .map_err(|_| "WS_PORT must be a valid port number")?;
        
        let config = Config {
            database_url,
            redis_url,
            eth_rpc_url,
            risk_engine_address,
            chainlink_price_feed,
            log_level,
            http_port,
            ws_port,
        };
        
        info!("Configuration loaded successfully");
        info!("HTTP API will listen on port {}", config.http_port);
        info!("WebSocket will listen on port {}", config.ws_port);
        info!("Connected to Ethereum RPC: {}", config.eth_rpc_url);
        
        Ok(config)
    }
    
    pub fn validate(&self) -> Result<(), String> {
        // Validate database URL format
        if !self.database_url.starts_with("postgresql://") && !self.database_url.starts_with("postgres://") {
            return Err("DATABASE_URL must start with postgresql:// or postgres://".to_string());
        }
        
        // Validate Redis URL format
        if !self.redis_url.starts_with("redis://") {
            return Err("REDIS_URL must start with redis://".to_string());
        }
        
        // Validate Ethereum RPC URL format
        if !self.eth_rpc_url.starts_with("http://") && !self.eth_rpc_url.starts_with("https://") 
            && !self.eth_rpc_url.starts_with("ws://") && !self.eth_rpc_url.starts_with("wss://") {
            return Err("ETH_RPC_URL must start with http://, https://, ws://, or wss://".to_string());
        }
        
        // Validate Ethereum address format (basic check)
        if !self.risk_engine_address.starts_with("0x") || self.risk_engine_address.len() != 42 {
            return Err("RISK_ENGINE_ADDRESS must be a valid Ethereum address (0x followed by 40 hex characters)".to_string());
        }
        
        Ok(())
    }
}
