use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio;
use anyhow::{Result, anyhow};
use chrono::{DateTime, Utc, Duration};
use reqwest::Client;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum ExchangeType {
    Traditional,    // NYSE, NASDAQ, LSE, etc.
    Digital,        // Coinbase, Binance, Kraken, etc.
    Dex,           // Uniswap, SushiSwap, Curve, etc.
    Hybrid,        // Exchanges supporting both traditional and digital assets
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExchangeConfig {
    pub name: String,
    pub exchange_type: ExchangeType,
    pub jurisdiction: String,
    pub api_endpoint: String,
    pub api_key: Option<String>,
    pub api_secret: Option<String>,
    pub supports_real_time: bool,
    pub rate_limit_per_minute: u32,
    pub minimum_volume: u128,
    pub listing_fee: u128,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetListing {
    pub asset_address: String,
    pub symbol: String,
    pub name: String,
    pub exchanges: Vec<String>,
    pub arbitrage_enabled: bool,
    pub price_tolerance_bps: u32,
    pub min_arbitrage_amount: u128,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PriceData {
    pub exchange: String,
    pub asset: String,
    pub price: f64,
    pub volume_24h: f64,
    pub bid: f64,
    pub ask: f64,
    pub spread_bps: u32,
    pub timestamp: DateTime<Utc>,
    pub is_stale: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArbitrageOpportunity {
    pub asset: String,
    pub buy_exchange: String,
    pub sell_exchange: String,
    pub buy_price: f64,
    pub sell_price: f64,
    pub price_difference_bps: u32,
    pub estimated_profit: f64,
    pub max_trade_size: f64,
    pub confidence_score: u32,
    pub risk_score: u32,
    pub timestamp: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketDepth {
    pub exchange: String,
    pub asset: String,
    pub bids: Vec<(f64, f64)>, // (price, size)
    pub asks: Vec<(f64, f64)>, // (price, size)
    pub total_bid_volume: f64,
    pub total_ask_volume: f64,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExchangeStats {
    pub exchange: String,
    pub total_volume_24h: f64,
    pub total_trades_24h: u64,
    pub average_spread_bps: u32,
    pub uptime_percentage: f64,
    pub last_updated: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CrossExchangeAnalysis {
    pub asset: String,
    pub price_variance_bps: u32,
    pub volume_weighted_price: f64,
    pub total_volume_24h: f64,
    pub best_bid: f64,
    pub best_ask: f64,
    pub arbitrage_opportunities: Vec<ArbitrageOpportunity>,
    pub timestamp: DateTime<Utc>,
}

pub struct CrossExchangeService {
    exchanges: HashMap<String, ExchangeConfig>,
    asset_listings: HashMap<String, AssetListing>,
    price_data: HashMap<String, HashMap<String, PriceData>>, // asset -> exchange -> price
    market_depths: HashMap<String, HashMap<String, MarketDepth>>, // asset -> exchange -> depth
    arbitrage_opportunities: Vec<ArbitrageOpportunity>,
    exchange_stats: HashMap<String, ExchangeStats>,
    http_client: Client,
    last_price_update: HashMap<String, DateTime<Utc>>,
}

impl CrossExchangeService {
    pub fn new() -> Self {
        Self {
            exchanges: HashMap::new(),
            asset_listings: HashMap::new(),
            price_data: HashMap::new(),
            market_depths: HashMap::new(),
            arbitrage_opportunities: Vec::new(),
            exchange_stats: HashMap::new(),
            http_client: Client::new(),
            last_price_update: HashMap::new(),
        }
    }

    pub async fn register_exchange(&mut self, config: ExchangeConfig) -> Result<()> {
        if self.exchanges.contains_key(&config.name) {
            return Err(anyhow!("Exchange {} already registered", config.name));
        }

        // Validate exchange configuration
        self.validate_exchange_config(&config).await?;

        self.exchanges.insert(config.name.clone(), config.clone());
        
        // Initialize exchange stats
        self.exchange_stats.insert(config.name.clone(), ExchangeStats {
            exchange: config.name.clone(),
            total_volume_24h: 0.0,
            total_trades_24h: 0,
            average_spread_bps: 0,
            uptime_percentage: 100.0,
            last_updated: Utc::now(),
        });

        println!("Exchange {} registered successfully", config.name);
        Ok(())
    }

    pub async fn list_asset_on_exchanges(
        &mut self,
        asset_address: String,
        symbol: String,
        name: String,
        exchange_names: Vec<String>,
        arbitrage_enabled: bool,
        price_tolerance_bps: u32,
        min_arbitrage_amount: u128,
    ) -> Result<()> {
        // Validate that all exchanges exist and are active
        for exchange_name in &exchange_names {
            let exchange = self.exchanges.get(exchange_name)
                .ok_or_else(|| anyhow!("Exchange {} not found", exchange_name))?;
            
            if !exchange.is_active {
                return Err(anyhow!("Exchange {} is not active", exchange_name));
            }
        }

        let listing = AssetListing {
            asset_address: asset_address.clone(),
            symbol: symbol.clone(),
            name,
            exchanges: exchange_names.clone(),
            arbitrage_enabled,
            price_tolerance_bps,
            min_arbitrage_amount,
            is_active: true,
        };

        self.asset_listings.insert(asset_address.clone(), listing);

        // Initialize price data structures for this asset
        self.price_data.insert(asset_address.clone(), HashMap::new());
        self.market_depths.insert(asset_address.clone(), HashMap::new());

        // Attempt to fetch initial price data from all exchanges
        let exchange_count = exchange_names.len();
        for exchange_name in &exchange_names {
            if let Err(e) = self.fetch_price_data(&asset_address, exchange_name).await {
                println!("Warning: Failed to fetch initial price data for {} on {}: {}", 
                    symbol, exchange_name, e);
            }
        }

        println!("Asset {} listed on {} exchanges", symbol, exchange_count);
        Ok(())
    }

    pub async fn update_all_prices(&mut self) -> Result<()> {
        let assets: Vec<String> = self.asset_listings.keys().cloned().collect();
        
        for asset in assets {
            let exchanges = if let Some(listing) = self.asset_listings.get(&asset) {
                listing.exchanges.clone()
            } else {
                continue;
            };
            
            for exchange_name in exchanges {
                if let Err(e) = self.fetch_price_data(&asset, &exchange_name).await {
                    println!("Failed to update price for {} on {}: {}", asset, exchange_name, e);
                }
            }
        }

        // Update arbitrage opportunities after price updates
        self.detect_arbitrage_opportunities().await?;

        Ok(())
    }

    pub async fn fetch_price_data(&mut self, asset: &str, exchange: &str) -> Result<PriceData> {
        let exchange_config = self.exchanges.get(exchange)
            .ok_or_else(|| anyhow!("Exchange {} not found", exchange))?;

        let price_data = match exchange_config.exchange_type {
            ExchangeType::Traditional => self.fetch_traditional_exchange_price(asset, exchange_config).await?,
            ExchangeType::Digital => self.fetch_digital_exchange_price(asset, exchange_config).await?,
            ExchangeType::Dex => self.fetch_dex_price(asset, exchange_config).await?,
            ExchangeType::Hybrid => self.fetch_hybrid_exchange_price(asset, exchange_config).await?,
        };

        // Store the price data
        if let Some(asset_prices) = self.price_data.get_mut(asset) {
            asset_prices.insert(exchange.to_string(), price_data.clone());
        }

        self.last_price_update.insert(format!("{}:{}", asset, exchange), Utc::now());

        Ok(price_data)
    }

    pub async fn detect_arbitrage_opportunities(&mut self) -> Result<Vec<ArbitrageOpportunity>> {
        let mut opportunities = Vec::new();

        for (asset, listing) in &self.asset_listings {
            if !listing.arbitrage_enabled {
                continue;
            }

            let asset_prices = match self.price_data.get(asset) {
                Some(prices) => prices,
                None => continue,
            };

            // Find arbitrage opportunities between all exchange pairs
            for i in 0..listing.exchanges.len() {
                for j in (i + 1)..listing.exchanges.len() {
                    let exchange1 = &listing.exchanges[i];
                    let exchange2 = &listing.exchanges[j];

                    if let (Some(price1), Some(price2)) = (
                        asset_prices.get(exchange1),
                        asset_prices.get(exchange2)
                    ) {
                        if let Some(opportunity) = self.calculate_arbitrage_opportunity(
                            asset,
                            price1,
                            price2,
                            listing.price_tolerance_bps,
                            listing.min_arbitrage_amount,
                        ).await {
                            opportunities.push(opportunity);
                        }
                    }
                }
            }
        }

        self.arbitrage_opportunities = opportunities.clone();
        Ok(opportunities)
    }

    pub async fn get_cross_exchange_analysis(&self, asset: &str) -> Result<CrossExchangeAnalysis> {
        let listing = self.asset_listings.get(asset)
            .ok_or_else(|| anyhow!("Asset {} not listed", asset))?;

        let asset_prices = self.price_data.get(asset)
            .ok_or_else(|| anyhow!("No price data for asset {}", asset))?;

        let mut prices = Vec::new();
        let mut total_volume = 0.0;
        let mut best_bid = 0.0;
        let mut best_ask = f64::MAX;

        for exchange in &listing.exchanges {
            if let Some(price_data) = asset_prices.get(exchange) {
                prices.push(price_data.price);
                total_volume += price_data.volume_24h;

                if price_data.bid > best_bid {
                    best_bid = price_data.bid;
                }
                if price_data.ask < best_ask {
                    best_ask = price_data.ask;
                }
            }
        }

        // Calculate volume-weighted average price
        let mut vwap = 0.0;
        if total_volume > 0.0 {
            for exchange in &listing.exchanges {
                if let Some(price_data) = asset_prices.get(exchange) {
                    vwap += price_data.price * (price_data.volume_24h / total_volume);
                }
            }
        }

        // Calculate price variance
        let mean_price = prices.iter().sum::<f64>() / prices.len() as f64;
        let variance = prices.iter()
            .map(|price| (price - mean_price).powi(2))
            .sum::<f64>() / prices.len() as f64;
        let price_variance_bps = ((variance.sqrt() / mean_price) * 10000.0) as u32;

        // Get current arbitrage opportunities for this asset
        let arbitrage_opportunities: Vec<ArbitrageOpportunity> = self.arbitrage_opportunities
            .iter()
            .filter(|opp| opp.asset == asset)
            .cloned()
            .collect();

        Ok(CrossExchangeAnalysis {
            asset: asset.to_string(),
            price_variance_bps,
            volume_weighted_price: vwap,
            total_volume_24h: total_volume,
            best_bid,
            best_ask: if best_ask == f64::MAX { 0.0 } else { best_ask },
            arbitrage_opportunities,
            timestamp: Utc::now(),
        })
    }

    pub async fn get_market_depth(&mut self, asset: &str, exchange: &str) -> Result<MarketDepth> {
        let exchange_config = self.exchanges.get(exchange)
            .ok_or_else(|| anyhow!("Exchange {} not found", exchange))?;

        let depth = match exchange_config.exchange_type {
            ExchangeType::Traditional => self.fetch_traditional_market_depth(asset, exchange_config).await?,
            ExchangeType::Digital => self.fetch_digital_market_depth(asset, exchange_config).await?,
            ExchangeType::Dex => self.fetch_dex_market_depth(asset, exchange_config).await?,
            ExchangeType::Hybrid => self.fetch_hybrid_market_depth(asset, exchange_config).await?,
        };

        // Store the market depth
        if let Some(asset_depths) = self.market_depths.get_mut(asset) {
            asset_depths.insert(exchange.to_string(), depth.clone());
        }

        Ok(depth)
    }

    pub fn get_arbitrage_opportunities(&self, asset: Option<&str>) -> Vec<ArbitrageOpportunity> {
        match asset {
            Some(asset_filter) => self.arbitrage_opportunities
                .iter()
                .filter(|opp| opp.asset == asset_filter)
                .cloned()
                .collect(),
            None => self.arbitrage_opportunities.clone(),
        }
    }

    pub fn get_exchange_stats(&self, exchange: &str) -> Option<&ExchangeStats> {
        self.exchange_stats.get(exchange)
    }

    pub fn get_all_exchanges(&self) -> Vec<&ExchangeConfig> {
        self.exchanges.values().collect()
    }

    pub fn get_listed_assets(&self) -> Vec<&AssetListing> {
        self.asset_listings.values().collect()
    }

    // Private helper methods

    async fn validate_exchange_config(&self, config: &ExchangeConfig) -> Result<()> {
        // Basic validation
        if config.name.is_empty() {
            return Err(anyhow!("Exchange name cannot be empty"));
        }

        if config.api_endpoint.is_empty() {
            return Err(anyhow!("API endpoint cannot be empty"));
        }

        // Test connectivity (simplified)
        match self.http_client.get(&config.api_endpoint).send().await {
            Ok(response) => {
                if !response.status().is_success() {
                    return Err(anyhow!("Exchange API endpoint returned error: {}", response.status()));
                }
            }
            Err(e) => {
                println!("Warning: Could not validate exchange connectivity: {}", e);
                // Don't fail registration for connectivity issues
            }
        }

        Ok(())
    }

    async fn fetch_traditional_exchange_price(&self, asset: &str, config: &ExchangeConfig) -> Result<PriceData> {
        // Simplified implementation for traditional exchanges
        // In reality, this would integrate with financial data providers like Bloomberg, Reuters, etc.
        
        let _url = format!("{}/quote/{}", config.api_endpoint, asset);
        let _response = self.http_client
            .get(&_url)
            .header("Authorization", format!("Bearer {}", config.api_key.as_ref().unwrap_or(&"".to_string())))
            .send()
            .await;

        // Mock data for demonstration (in production, parse actual response)
        Ok(PriceData {
            exchange: config.name.clone(),
            asset: asset.to_string(),
            price: 100.0 + (rand::random::<f64>() - 0.5) * 10.0, // Mock price with some variance
            volume_24h: 1000000.0 + rand::random::<f64>() * 500000.0,
            bid: 99.95,
            ask: 100.05,
            spread_bps: 10,
            timestamp: Utc::now(),
            is_stale: false,
        })
    }

    async fn fetch_digital_exchange_price(&self, asset: &str, config: &ExchangeConfig) -> Result<PriceData> {
        // Implementation for digital exchanges (Coinbase, Binance, etc.)
        let _url = format!("{}/api/v1/ticker/24hr?symbol={}", config.api_endpoint, asset);
        
        // Mock implementation
        Ok(PriceData {
            exchange: config.name.clone(),
            asset: asset.to_string(),
            price: 100.0 + (rand::random::<f64>() - 0.5) * 5.0,
            volume_24h: 500000.0 + rand::random::<f64>() * 250000.0,
            bid: 99.98,
            ask: 100.02,
            spread_bps: 4,
            timestamp: Utc::now(),
            is_stale: false,
        })
    }

    async fn fetch_dex_price(&self, asset: &str, config: &ExchangeConfig) -> Result<PriceData> {
        // Implementation for DEX price fetching (Uniswap, SushiSwap, etc.)
        // This would typically involve querying on-chain data or subgraphs
        
        Ok(PriceData {
            exchange: config.name.clone(),
            asset: asset.to_string(),
            price: 100.0 + (rand::random::<f64>() - 0.5) * 2.0,
            volume_24h: 100000.0 + rand::random::<f64>() * 50000.0,
            bid: 99.90,
            ask: 100.10,
            spread_bps: 20,
            timestamp: Utc::now(),
            is_stale: false,
        })
    }

    async fn fetch_hybrid_exchange_price(&self, asset: &str, config: &ExchangeConfig) -> Result<PriceData> {
        // Implementation for hybrid exchanges
        Ok(PriceData {
            exchange: config.name.clone(),
            asset: asset.to_string(),
            price: 100.0 + (rand::random::<f64>() - 0.5) * 3.0,
            volume_24h: 750000.0 + rand::random::<f64>() * 375000.0,
            bid: 99.96,
            ask: 100.04,
            spread_bps: 8,
            timestamp: Utc::now(),
            is_stale: false,
        })
    }

    async fn fetch_traditional_market_depth(&self, asset: &str, config: &ExchangeConfig) -> Result<MarketDepth> {
        // Mock market depth data
        let bids = vec![
            (99.95, 1000.0),
            (99.90, 2000.0),
            (99.85, 1500.0),
            (99.80, 3000.0),
            (99.75, 2500.0),
        ];

        let asks = vec![
            (100.05, 1200.0),
            (100.10, 1800.0),
            (100.15, 2200.0),
            (100.20, 1600.0),
            (100.25, 2800.0),
        ];

        let total_bid_volume = bids.iter().map(|(_, size)| size).sum();
        let total_ask_volume = asks.iter().map(|(_, size)| size).sum();

        Ok(MarketDepth {
            exchange: config.name.clone(),
            asset: asset.to_string(),
            bids,
            asks,
            total_bid_volume,
            total_ask_volume,
            timestamp: Utc::now(),
        })
    }

    async fn fetch_digital_market_depth(&self, asset: &str, config: &ExchangeConfig) -> Result<MarketDepth> {
        // Similar to traditional but with different characteristics
        let bids = vec![
            (99.98, 800.0),
            (99.95, 1500.0),
            (99.92, 1200.0),
            (99.89, 2000.0),
            (99.86, 1800.0),
        ];

        let asks = vec![
            (100.02, 900.0),
            (100.05, 1400.0),
            (100.08, 1600.0),
            (100.11, 1300.0),
            (100.14, 2100.0),
        ];

        let total_bid_volume = bids.iter().map(|(_, size)| size).sum();
        let total_ask_volume = asks.iter().map(|(_, size)| size).sum();

        Ok(MarketDepth {
            exchange: config.name.clone(),
            asset: asset.to_string(),
            bids,
            asks,
            total_bid_volume,
            total_ask_volume,
            timestamp: Utc::now(),
        })
    }

    async fn fetch_dex_market_depth(&self, asset: &str, config: &ExchangeConfig) -> Result<MarketDepth> {
        // DEX typically has different liquidity characteristics
        let bids = vec![
            (99.90, 500.0),
            (99.80, 1000.0),
            (99.70, 800.0),
            (99.60, 1500.0),
            (99.50, 1200.0),
        ];

        let asks = vec![
            (100.10, 600.0),
            (100.20, 1100.0),
            (100.30, 900.0),
            (100.40, 1400.0),
            (100.50, 1300.0),
        ];

        let total_bid_volume = bids.iter().map(|(_, size)| size).sum();
        let total_ask_volume = asks.iter().map(|(_, size)| size).sum();

        Ok(MarketDepth {
            exchange: config.name.clone(),
            asset: asset.to_string(),
            bids,
            asks,
            total_bid_volume,
            total_ask_volume,
            timestamp: Utc::now(),
        })
    }

    async fn fetch_hybrid_market_depth(&self, asset: &str, config: &ExchangeConfig) -> Result<MarketDepth> {
        // Hybrid exchange combines characteristics
        let bids = vec![
            (99.96, 750.0),
            (99.92, 1250.0),
            (99.88, 1000.0),
            (99.84, 1750.0),
            (99.80, 1500.0),
        ];

        let asks = vec![
            (100.04, 800.0),
            (100.08, 1300.0),
            (100.12, 1100.0),
            (100.16, 1600.0),
            (100.20, 1400.0),
        ];

        let total_bid_volume = bids.iter().map(|(_, size)| size).sum();
        let total_ask_volume = asks.iter().map(|(_, size)| size).sum();

        Ok(MarketDepth {
            exchange: config.name.clone(),
            asset: asset.to_string(),
            bids,
            asks,
            total_bid_volume,
            total_ask_volume,
            timestamp: Utc::now(),
        })
    }

    async fn calculate_arbitrage_opportunity(
        &self,
        asset: &str,
        price1: &PriceData,
        price2: &PriceData,
        tolerance_bps: u32,
        min_amount: u128,
    ) -> Option<ArbitrageOpportunity> {
        // Check if prices are recent enough
        let now = Utc::now();
        if now.signed_duration_since(price1.timestamp).num_seconds() > 300 ||
           now.signed_duration_since(price2.timestamp).num_seconds() > 300 {
            return None; // Prices too stale
        }

        let (buy_price, sell_price, buy_exchange, sell_exchange) = if price1.price < price2.price {
            (price1.price, price2.price, &price1.exchange, &price2.exchange)
        } else {
            (price2.price, price1.price, &price2.exchange, &price1.exchange)
        };

        let price_diff_bps = ((sell_price - buy_price) / buy_price * 10000.0) as u32;

        if price_diff_bps < tolerance_bps {
            return None; // Price difference too small
        }

        // Calculate estimated profit (simplified)
        let trade_size = (min_amount as f64) / 1e18; // Convert from wei
        let gross_profit = (sell_price - buy_price) * trade_size;
        let estimated_costs = gross_profit * 0.01; // 1% for fees and slippage
        let net_profit = gross_profit - estimated_costs;

        if net_profit <= 0.0 {
            return None;
        }

        // Calculate confidence and risk scores (simplified)
        let confidence_score = if price_diff_bps > 500 { 6000 } else { 8000 }; // Lower confidence for large differences
        let risk_score = if price_diff_bps > 200 { 3000 } else { 1000 }; // Higher risk for larger differences

        Some(ArbitrageOpportunity {
            asset: asset.to_string(),
            buy_exchange: buy_exchange.clone(),
            sell_exchange: sell_exchange.clone(),
            buy_price,
            sell_price,
            price_difference_bps: price_diff_bps,
            estimated_profit: net_profit,
            max_trade_size: trade_size,
            confidence_score,
            risk_score,
            timestamp: now,
            expires_at: now + Duration::minutes(5),
        })
    }
} 