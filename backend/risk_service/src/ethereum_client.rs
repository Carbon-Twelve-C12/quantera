// Mock Ethereum Client for testing
use ethers::prelude::*;
use std::sync::Arc;

pub type Address = H160;

#[derive(Clone)]
pub struct EthereumClient {
    provider: Arc<Provider<Http>>,
}

impl EthereumClient {
    pub async fn new(url: &str) -> Result<Self, Box<dyn std::error::Error>> {
        let provider = Provider::<Http>::try_from(url)?;
        Ok(Self {
            provider: Arc::new(provider),
        })
    }
    
    pub fn provider(&self) -> &Provider<Http> {
        &self.provider
    }
}
