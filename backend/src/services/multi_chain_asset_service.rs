use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio;
use anyhow::{Result, anyhow};
use uuid::Uuid;
use rand;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum SupportedChain {
    Ethereum,
    Polygon,
    Avalanche,
    Arbitrum,
    Optimism,
    Base,
    BinanceSmartChain,
}

impl SupportedChain {
    pub fn chain_id(&self) -> u64 {
        match self {
            SupportedChain::Ethereum => 1,
            SupportedChain::Polygon => 137,
            SupportedChain::Avalanche => 43114,
            SupportedChain::Arbitrum => 42161,
            SupportedChain::Optimism => 10,
            SupportedChain::Base => 8453,
            SupportedChain::BinanceSmartChain => 56,
        }
    }
    
    pub fn name(&self) -> &'static str {
        match self {
            SupportedChain::Ethereum => "Ethereum",
            SupportedChain::Polygon => "Polygon",
            SupportedChain::Avalanche => "Avalanche",
            SupportedChain::Arbitrum => "Arbitrum",
            SupportedChain::Optimism => "Optimism",
            SupportedChain::Base => "Base",
            SupportedChain::BinanceSmartChain => "Binance Smart Chain",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChainConfig {
    pub chain_id: u64,
    pub rpc_url: String,
    pub block_explorer: String,
    pub settlement_assets: Vec<SettlementAsset>,
    pub supports_eip7702: bool, // Smart account support
    pub supports_blobs: bool,   // EIP-4844 blob support
    pub gas_token: String,
    pub average_block_time: u64, // in seconds
    pub finality_blocks: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SettlementAsset {
    pub symbol: String,
    pub name: String,
    pub contract_address: String,
    pub decimals: u8,
    pub asset_type: SettlementAssetType,
    pub is_preferred: bool,
    pub risk_weight: u8, // BIS framework compliance (0-100)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SettlementAssetType {
    WCBDC,      // Wholesale Central Bank Digital Currency
    STABLECOIN, // Fiat-backed stablecoins
    DEPOSIT_TOKEN, // Commercial bank money
    RBDC,       // Reserve-backed digital currency
    CRYPTO,     // Crypto assets (for DeFi integration)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrossChainAsset {
    pub asset_id: String,
    pub name: String,
    pub symbol: String,
    pub asset_type: AssetType,
    pub deployments: HashMap<SupportedChain, AssetDeployment>,
    pub total_supply: u128,
    pub compliance_standard: ComplianceStandard,
    pub regulatory_framework: String,
    pub jurisdiction: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetDeployment {
    pub contract_address: String,
    pub deployment_tx: String,
    pub deployment_block: u64,
    pub is_active: bool,
    pub liquidity_pools: Vec<LiquidityPool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LiquidityPool {
    pub pool_address: String,
    pub dex_name: String,
    pub pair_token: String,
    pub liquidity_usd: f64,
    pub volume_24h_usd: f64,
    pub apr: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AssetType {
    RealEstate,
    Commodities,
    Securities,
    TreasuryNotes,
    CorporateBonds,
    PrivateEquity,
    Infrastructure,
    ArtAndCollectibles,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ComplianceStandard {
    ERC3643,  // T-REX Protocol
    ERC1400,  // Security Token Standard
    ERC1404,  // Simple Restricted Token Standard
    Custom(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetMetrics {
    pub total_value_locked: f64,
    pub market_cap: f64,
    pub trading_volume_24h: f64,
    pub price_usd: f64,
    pub price_change_24h: f64,
    pub holder_count: u64,
    pub liquidity_score: f64, // 0-100
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrossChainLiquidity {
    pub chain: SupportedChain,
    pub total_liquidity_usd: f64,
    pub available_liquidity_usd: f64,
    pub pools: Vec<LiquidityPool>,
    pub bridge_liquidity: f64,
}

pub struct MultiChainAssetService {
    chain_configs: HashMap<SupportedChain, ChainConfig>,
    supported_assets: HashMap<String, CrossChainAsset>,
    asset_metrics: HashMap<String, AssetMetrics>,
}

impl MultiChainAssetService {
    pub fn new() -> Self {
        let mut chain_configs = HashMap::new();
        
        // Initialize Ethereum configuration
        chain_configs.insert(SupportedChain::Ethereum, ChainConfig {
            chain_id: 1,
            rpc_url: "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY".to_string(),
            block_explorer: "https://etherscan.io".to_string(),
            settlement_assets: vec![
                SettlementAsset {
                    symbol: "USDC".to_string(),
                    name: "USD Coin".to_string(),
                    contract_address: "0xA0b86a33E6441b8C4505B8C4505B8C4505B8C4505".to_string(),
                    decimals: 6,
                    asset_type: SettlementAssetType::STABLECOIN,
                    is_preferred: true,
                    risk_weight: 10,
                },
                SettlementAsset {
                    symbol: "wCBDC".to_string(),
                    name: "Wholesale CBDC".to_string(),
                    contract_address: "0xB0b86a33E6441b8C4505B8C4505B8C4505B8C4505".to_string(),
                    decimals: 18,
                    asset_type: SettlementAssetType::WCBDC,
                    is_preferred: true,
                    risk_weight: 0,
                },
            ],
            supports_eip7702: true,
            supports_blobs: true,
            gas_token: "ETH".to_string(),
            average_block_time: 12,
            finality_blocks: 32,
        });
        
        // Initialize Polygon configuration
        chain_configs.insert(SupportedChain::Polygon, ChainConfig {
            chain_id: 137,
            rpc_url: "https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY".to_string(),
            block_explorer: "https://polygonscan.com".to_string(),
            settlement_assets: vec![
                SettlementAsset {
                    symbol: "USDC".to_string(),
                    name: "USD Coin (PoS)".to_string(),
                    contract_address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174".to_string(),
                    decimals: 6,
                    asset_type: SettlementAssetType::STABLECOIN,
                    is_preferred: true,
                    risk_weight: 10,
                },
                SettlementAsset {
                    symbol: "USDT".to_string(),
                    name: "Tether USD (PoS)".to_string(),
                    contract_address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F".to_string(),
                    decimals: 6,
                    asset_type: SettlementAssetType::STABLECOIN,
                    is_preferred: false,
                    risk_weight: 15,
                },
            ],
            supports_eip7702: false,
            supports_blobs: false,
            gas_token: "MATIC".to_string(),
            average_block_time: 2,
            finality_blocks: 128,
        });
        
        // Initialize other chains...
        Self::init_other_chains(&mut chain_configs);
        
        Self {
            chain_configs,
            supported_assets: HashMap::new(),
            asset_metrics: HashMap::new(),
        }
    }
    
    fn init_other_chains(chain_configs: &mut HashMap<SupportedChain, ChainConfig>) {
        // Avalanche
        chain_configs.insert(SupportedChain::Avalanche, ChainConfig {
            chain_id: 43114,
            rpc_url: "https://api.avax.network/ext/bc/C/rpc".to_string(),
            block_explorer: "https://snowtrace.io".to_string(),
            settlement_assets: vec![
                SettlementAsset {
                    symbol: "USDC".to_string(),
                    name: "USD Coin".to_string(),
                    contract_address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E".to_string(),
                    decimals: 6,
                    asset_type: SettlementAssetType::STABLECOIN,
                    is_preferred: true,
                    risk_weight: 10,
                },
            ],
            supports_eip7702: false,
            supports_blobs: false,
            gas_token: "AVAX".to_string(),
            average_block_time: 2,
            finality_blocks: 1,
        });
        
        // Arbitrum
        chain_configs.insert(SupportedChain::Arbitrum, ChainConfig {
            chain_id: 42161,
            rpc_url: "https://arb1.arbitrum.io/rpc".to_string(),
            block_explorer: "https://arbiscan.io".to_string(),
            settlement_assets: vec![
                SettlementAsset {
                    symbol: "USDC".to_string(),
                    name: "USD Coin (Arb1)".to_string(),
                    contract_address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831".to_string(),
                    decimals: 6,
                    asset_type: SettlementAssetType::STABLECOIN,
                    is_preferred: true,
                    risk_weight: 10,
                },
            ],
            supports_eip7702: false,
            supports_blobs: false,
            gas_token: "ETH".to_string(),
            average_block_time: 1,
            finality_blocks: 1,
        });
    }
    
    pub async fn deploy_asset_cross_chain(
        &mut self,
        asset: &CrossChainAsset,
        target_chains: Vec<SupportedChain>,
    ) -> Result<HashMap<SupportedChain, String>> {
        let mut deployment_addresses = HashMap::new();
        
        for chain in target_chains {
            let config = self.chain_configs.get(&chain)
                .ok_or_else(|| anyhow!("Chain {:?} not supported", chain))?;
            
            // Deploy contract on each chain
            let contract_address = self.deploy_on_chain(asset, &chain, config).await?;
            deployment_addresses.insert(chain, contract_address);
        }
        
        Ok(deployment_addresses)
    }
    
    async fn deploy_on_chain(
        &self,
        asset: &CrossChainAsset,
        chain: &SupportedChain,
        config: &ChainConfig,
    ) -> Result<String> {
        // Implementation for chain-specific deployment
        // This would use alloy-rs for Ethereum-compatible chains
        
        // Choose appropriate token standard based on compliance requirements
        let contract_bytecode = match asset.compliance_standard {
            ComplianceStandard::ERC3643 => self.get_erc3643_bytecode(),
            ComplianceStandard::ERC1400 => self.get_erc1400_bytecode(),
            ComplianceStandard::ERC1404 => self.get_erc1404_bytecode(),
            ComplianceStandard::Custom(_) => self.get_standard_erc20_bytecode(),
        };
        
        // Simulate deployment (in real implementation, this would use alloy-rs)
        let contract_address = format!("0x{:040x}", rand::random::<u64>());
        
        println!("Deploying {} on {} at address {}", 
                asset.name, chain.name(), contract_address);
        
        Ok(contract_address)
    }
    
    pub async fn get_asset_liquidity_across_chains(
        &self,
        asset_id: &str,
    ) -> Result<HashMap<SupportedChain, CrossChainLiquidity>> {
        let mut liquidity_map = HashMap::new();
        
        // Find asset
        let asset = self.supported_assets.get(asset_id)
            .ok_or_else(|| anyhow!("Asset not found: {}", asset_id))?;
        
        // Query liquidity on each chain where asset is deployed
        for (chain, deployment) in &asset.deployments {
            let liquidity = self.query_chain_liquidity(chain, &deployment.contract_address).await?;
            liquidity_map.insert(chain.clone(), liquidity);
        }
        
        Ok(liquidity_map)
    }
    
    async fn query_chain_liquidity(
        &self,
        chain: &SupportedChain,
        contract_address: &str,
    ) -> Result<CrossChainLiquidity> {
        // Implementation for querying liquidity on specific chain
        // This would use the chain's RPC endpoint to query DEX contracts
        
        // Simulate liquidity data
        let pools = vec![
            LiquidityPool {
                pool_address: format!("0x{:040x}", rand::random::<u64>()),
                dex_name: "Uniswap V3".to_string(),
                pair_token: "USDC".to_string(),
                liquidity_usd: 1_000_000.0,
                volume_24h_usd: 50_000.0,
                apr: 8.5,
            },
            LiquidityPool {
                pool_address: format!("0x{:040x}", rand::random::<u64>()),
                dex_name: "SushiSwap".to_string(),
                pair_token: "USDT".to_string(),
                liquidity_usd: 500_000.0,
                volume_24h_usd: 25_000.0,
                apr: 7.2,
            },
        ];
        
        let total_liquidity = pools.iter().map(|p| p.liquidity_usd).sum();
        
        Ok(CrossChainLiquidity {
            chain: chain.clone(),
            total_liquidity_usd: total_liquidity,
            available_liquidity_usd: total_liquidity * 0.8, // 80% available
            pools,
            bridge_liquidity: 200_000.0,
        })
    }
    
    pub async fn create_asset(
        &mut self,
        name: String,
        symbol: String,
        asset_type: AssetType,
        compliance_standard: ComplianceStandard,
        regulatory_framework: String,
        jurisdiction: String,
        total_supply: u128,
    ) -> Result<String> {
        let asset_id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now();
        
        let asset = CrossChainAsset {
            asset_id: asset_id.clone(),
            name,
            symbol,
            asset_type,
            deployments: HashMap::new(),
            total_supply,
            compliance_standard,
            regulatory_framework,
            jurisdiction,
            created_at: now,
            updated_at: now,
        };
        
        self.supported_assets.insert(asset_id.clone(), asset);
        
        // Initialize metrics
        self.asset_metrics.insert(asset_id.clone(), AssetMetrics {
            total_value_locked: 0.0,
            market_cap: 0.0,
            trading_volume_24h: 0.0,
            price_usd: 1.0, // Initial price
            price_change_24h: 0.0,
            holder_count: 0,
            liquidity_score: 0.0,
        });
        
        Ok(asset_id)
    }
    
    pub fn get_asset(&self, asset_id: &str) -> Option<&CrossChainAsset> {
        self.supported_assets.get(asset_id)
    }
    
    pub fn get_asset_metrics(&self, asset_id: &str) -> Option<&AssetMetrics> {
        self.asset_metrics.get(asset_id)
    }
    
    pub fn get_all_assets(&self) -> Vec<&CrossChainAsset> {
        self.supported_assets.values().collect()
    }
    
    pub fn get_assets_by_type(&self, asset_type: &AssetType) -> Vec<&CrossChainAsset> {
        self.supported_assets
            .values()
            .filter(|asset| std::mem::discriminant(&asset.asset_type) == std::mem::discriminant(asset_type))
            .collect()
    }
    
    pub fn get_assets_by_jurisdiction(&self, jurisdiction: &str) -> Vec<&CrossChainAsset> {
        self.supported_assets
            .values()
            .filter(|asset| asset.jurisdiction == jurisdiction)
            .collect()
    }
    
    pub fn get_supported_chains(&self) -> Vec<SupportedChain> {
        self.chain_configs.keys().cloned().collect()
    }
    
    pub fn get_chain_config(&self, chain: &SupportedChain) -> Option<&ChainConfig> {
        self.chain_configs.get(chain)
    }
    
    pub async fn get_optimal_settlement_asset(
        &self,
        chain: &SupportedChain,
        amount_usd: f64,
    ) -> Option<&SettlementAsset> {
        let config = self.chain_configs.get(chain)?;
        
        // Prefer wCBDC for large amounts, stablecoins for smaller amounts
        if amount_usd > 1_000_000.0 {
            // Large institutional transactions prefer wCBDC
            config.settlement_assets
                .iter()
                .find(|asset| matches!(asset.asset_type, SettlementAssetType::WCBDC))
        } else {
            // Smaller transactions can use stablecoins
            config.settlement_assets
                .iter()
                .find(|asset| asset.is_preferred)
        }
    }
    
    pub async fn estimate_cross_chain_fees(
        &self,
        from_chain: &SupportedChain,
        to_chain: &SupportedChain,
        amount: u128,
    ) -> Result<f64> {
        let from_config = self.chain_configs.get(from_chain)
            .ok_or_else(|| anyhow!("Source chain not supported"))?;
        let to_config = self.chain_configs.get(to_chain)
            .ok_or_else(|| anyhow!("Destination chain not supported"))?;
        
        // Estimate fees based on chain characteristics
        let base_fee = match from_chain {
            SupportedChain::Ethereum => 50.0, // Higher fees for Ethereum
            SupportedChain::Polygon => 0.1,   // Very low fees for Polygon
            SupportedChain::Arbitrum => 2.0,  // Low fees for L2s
            SupportedChain::Optimism => 2.0,
            _ => 5.0, // Default fee
        };
        
        let bridge_fee = 10.0; // Fixed bridge fee
        let destination_fee = match to_chain {
            SupportedChain::Ethereum => 30.0,
            SupportedChain::Polygon => 0.05,
            _ => 3.0,
        };
        
        Ok(base_fee + bridge_fee + destination_fee)
    }
    
    fn get_erc3643_bytecode(&self) -> Vec<u8> {
        // Return compiled ERC-3643 contract bytecode
        // In real implementation, this would be the actual bytecode
        vec![0x60, 0x80, 0x60, 0x40] // Placeholder bytecode
    }
    
    fn get_erc1400_bytecode(&self) -> Vec<u8> {
        // Return compiled ERC-1400 contract bytecode
        vec![0x60, 0x80, 0x60, 0x41] // Placeholder bytecode
    }
    
    fn get_erc1404_bytecode(&self) -> Vec<u8> {
        // Return compiled ERC-1404 contract bytecode
        vec![0x60, 0x80, 0x60, 0x42] // Placeholder bytecode
    }
    
    fn get_standard_erc20_bytecode(&self) -> Vec<u8> {
        // Return compiled standard ERC-20 contract bytecode
        vec![0x60, 0x80, 0x60, 0x43] // Placeholder bytecode
    }
}

// Response structures for API endpoints
#[derive(Serialize)]
pub struct ChainSupportResponse {
    pub supported_chains: Vec<SupportedChain>,
    pub chain_configs: HashMap<SupportedChain, ChainConfig>,
    pub total_assets: usize,
}

#[derive(Serialize)]
pub struct AssetListResponse {
    pub assets: Vec<CrossChainAsset>,
    pub total_count: usize,
    pub page: u32,
    pub per_page: u32,
}

#[derive(Serialize)]
pub struct AssetDetailResponse {
    pub asset: CrossChainAsset,
    pub metrics: AssetMetrics,
    pub liquidity: HashMap<SupportedChain, CrossChainLiquidity>,
}

// API endpoint implementations
pub async fn get_supported_chains(
    service: &MultiChainAssetService,
) -> Result<ChainSupportResponse> {
    Ok(ChainSupportResponse {
        supported_chains: service.get_supported_chains(),
        chain_configs: service.chain_configs.clone(),
        total_assets: service.supported_assets.len(),
    })
}

pub async fn get_assets(
    service: &MultiChainAssetService,
    page: u32,
    per_page: u32,
    asset_type: Option<AssetType>,
    jurisdiction: Option<String>,
) -> Result<AssetListResponse> {
    let mut assets: Vec<CrossChainAsset> = if let Some(asset_type) = asset_type {
        service.get_assets_by_type(&asset_type).into_iter().cloned().collect()
    } else if let Some(jurisdiction) = jurisdiction {
        service.get_assets_by_jurisdiction(&jurisdiction).into_iter().cloned().collect()
    } else {
        service.get_all_assets().into_iter().cloned().collect()
    };
    
    // Sort by creation date (newest first)
    assets.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    
    let total_count = assets.len();
    let start = ((page - 1) * per_page) as usize;
    let end = std::cmp::min(start + per_page as usize, total_count);
    
    let paginated_assets = if start < total_count {
        assets[start..end].to_vec()
    } else {
        vec![]
    };
    
    Ok(AssetListResponse {
        assets: paginated_assets,
        total_count,
        page,
        per_page,
    })
}

pub async fn get_asset_detail(
    service: &MultiChainAssetService,
    asset_id: &str,
) -> Result<AssetDetailResponse> {
    let asset = service.get_asset(asset_id)
        .ok_or_else(|| anyhow!("Asset not found"))?
        .clone();
    
    let metrics = service.get_asset_metrics(asset_id)
        .ok_or_else(|| anyhow!("Asset metrics not found"))?
        .clone();
    
    let liquidity = service.get_asset_liquidity_across_chains(asset_id).await?;
    
    Ok(AssetDetailResponse {
        asset,
        metrics,
        liquidity,
    })
} 