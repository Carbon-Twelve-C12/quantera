use std::collections::HashSet;
use std::sync::Arc;
use tokio::sync::RwLock;
use ethers::types::Address;
use serde::{Deserialize, Serialize};
use anyhow::Result;
use redis::aio::ConnectionManager;
use redis::AsyncCommands;
use reqwest::Client;
use tracing::{info, warn, error};
use strsim::levenshtein;
use chrono::{DateTime, Utc};

// ============ Sanctions Screener ============

pub struct SanctionsScreener {
    ofac_list: Arc<RwLock<Vec<SanctionedEntity>>>,
    un_list: Arc<RwLock<Vec<SanctionedEntity>>>,
    cache: Arc<RwLock<ConnectionManager>>,
    ofac_api_key: Option<String>,
    client: Client,
    last_update: Arc<RwLock<DateTime<Utc>>>,
}

impl SanctionsScreener {
    pub async fn new(
        ofac_api_key: Option<String>,
        cache: Arc<RwLock<ConnectionManager>>,
    ) -> Result<Arc<Self>> {
        let screener = Arc::new(Self {
            ofac_list: Arc::new(RwLock::new(Vec::new())),
            un_list: Arc::new(RwLock::new(Vec::new())),
            cache,
            ofac_api_key,
            client: Client::builder()
                .timeout(std::time::Duration::from_secs(30))
                .build()?,
            last_update: Arc::new(RwLock::new(Utc::now() - chrono::Duration::days(2))),
        });
        
        // Load initial sanctions lists
        let screener_clone = screener.clone();
        tokio::spawn(async move {
            if let Err(e) = screener_clone.update_lists().await {
                error!("Failed to load initial sanctions lists: {}", e);
            }
        });
        
        // Schedule daily updates
        let screener_clone = screener.clone();
        tokio::spawn(async move {
            loop {
                tokio::time::sleep(tokio::time::Duration::from_secs(86400)).await; // 24 hours
                if let Err(e) = screener_clone.update_lists().await {
                    error!("Failed to update sanctions lists: {}", e);
                }
            }
        });
        
        Ok(screener)
    }
    
    /// Screen an Ethereum address
    pub async fn screen_address(&self, address: Address) -> Result<ScreeningResult> {
        let address_str = format!("{:?}", address);
        
        // Check cache first
        let cache_key = format!("sanctions:{}", address_str);
        let mut cache = self.cache.write().await;
        
        if let Ok(cached) = cache.get::<_, String>(&cache_key).await {
            if let Ok(result) = serde_json::from_str::<ScreeningResult>(&cached) {
                return Ok(result);
            }
        }
        
        // Check if lists need updating (older than 24 hours)
        let last_update = *self.last_update.read().await;
        if Utc::now() - last_update > chrono::Duration::hours(24) {
            self.update_lists().await?;
        }
        
        let mut result = ScreeningResult {
            is_sanctioned: false,
            lists: vec![],
            match_score: 0.0,
            screened_at: Utc::now(),
            details: None,
        };
        
        // Check OFAC list
        let ofac_list = self.ofac_list.read().await;
        for entity in ofac_list.iter() {
            if entity.addresses.contains(&address_str) {
                result.is_sanctioned = true;
                result.lists.push("OFAC".to_string());
                result.match_score = 100.0;
                result.details = Some(format!("Direct match: {}", entity.name));
                break;
            }
        }
        
        // Check UN list
        if !result.is_sanctioned {
            let un_list = self.un_list.read().await;
            for entity in un_list.iter() {
                if entity.addresses.contains(&address_str) {
                    result.is_sanctioned = true;
                    result.lists.push("UN".to_string());
                    result.match_score = 100.0;
                    result.details = Some(format!("Direct match: {}", entity.name));
                    break;
                }
            }
        }
        
        // Cache the result for 24 hours
        let result_str = serde_json::to_string(&result)?;
        let _: () = cache.set_ex(&cache_key, result_str.as_str(), 86400).await?;
        
        info!("Address screening completed: {:?}, sanctioned: {}", address, result.is_sanctioned);
        
        Ok(result)
    }
    
    /// Screen a name using fuzzy matching
    pub async fn screen_name(&self, name: &str) -> Result<ScreeningResult> {
        let name_lower = name.to_lowercase();
        
        // Check cache
        let cache_key = format!("sanctions:name:{}", name_lower);
        let mut cache = self.cache.write().await;
        
        if let Ok(cached) = cache.get::<_, String>(&cache_key).await {
            if let Ok(result) = serde_json::from_str::<ScreeningResult>(&cached) {
                return Ok(result);
            }
        }
        
        let mut result = ScreeningResult {
            is_sanctioned: false,
            lists: vec![],
            match_score: 0.0,
            screened_at: Utc::now(),
            details: None,
        };
        
        let mut best_match_score = 0.0;
        let mut best_match: Option<(String, String)> = None;
        
        // Check OFAC list with fuzzy matching
        let ofac_list = self.ofac_list.read().await;
        for entity in ofac_list.iter() {
            let entity_name_lower = entity.name.to_lowercase();
            
            // Calculate similarity using Levenshtein distance
            let distance = levenshtein(&name_lower, &entity_name_lower);
            let max_len = name_lower.len().max(entity_name_lower.len());
            let similarity = if max_len == 0 {
                100.0
            } else {
                (1.0 - (distance as f64 / max_len as f64)) * 100.0
            };
            
            // Check aliases as well
            for alias in &entity.aliases {
                let alias_lower = alias.to_lowercase();
                let alias_distance = levenshtein(&name_lower, &alias_lower);
                let alias_max_len = name_lower.len().max(alias_lower.len());
                let alias_similarity = if alias_max_len == 0 {
                    100.0
                } else {
                    (1.0 - (alias_distance as f64 / alias_max_len as f64)) * 100.0
                };
                
                if alias_similarity > similarity && alias_similarity > best_match_score {
                    best_match_score = alias_similarity;
                    best_match = Some(("OFAC".to_string(), entity.name.clone()));
                }
            }
            
            if similarity > best_match_score {
                best_match_score = similarity;
                best_match = Some(("OFAC".to_string(), entity.name.clone()));
            }
        }
        
        // Check UN list with fuzzy matching
        let un_list = self.un_list.read().await;
        for entity in un_list.iter() {
            let entity_name_lower = entity.name.to_lowercase();
            let distance = levenshtein(&name_lower, &entity_name_lower);
            let max_len = name_lower.len().max(entity_name_lower.len());
            let similarity = if max_len == 0 {
                100.0
            } else {
                (1.0 - (distance as f64 / max_len as f64)) * 100.0
            };
            
            if similarity > best_match_score {
                best_match_score = similarity;
                best_match = Some(("UN".to_string(), entity.name.clone()));
            }
        }
        
        // Consider a match if similarity is above 85%
        if best_match_score > 85.0 {
            if let Some((list, entity_name)) = best_match {
                result.is_sanctioned = true;
                result.lists.push(list);
                result.match_score = best_match_score;
                result.details = Some(format!("Fuzzy match ({}%): {}", best_match_score.round(), entity_name));
                
                // Log potential false positive for manual review
                if best_match_score < 95.0 {
                    warn!("Potential false positive: {} matched {} with {}% confidence", 
                          name, entity_name, best_match_score.round());
                }
            }
        }
        
        // Cache the result
        let result_str = serde_json::to_string(&result)?;
        let _: () = cache.set_ex(&cache_key, result_str.as_str(), 86400).await?;
        
        info!("Name screening completed: {}, sanctioned: {}, score: {}", 
              name, result.is_sanctioned, result.match_score);
        
        Ok(result)
    }
    
    /// Update sanctions lists from external sources
    pub async fn update_lists(&self) -> Result<()> {
        info!("Updating sanctions lists...");
        
        // Update OFAC list
        if let Err(e) = self.update_ofac_list().await {
            error!("Failed to update OFAC list: {}", e);
        }
        
        // Update UN list
        if let Err(e) = self.update_un_list().await {
            error!("Failed to update UN list: {}", e);
        }
        
        *self.last_update.write().await = Utc::now();
        
        info!("Sanctions lists updated successfully");
        Ok(())
    }
    
    async fn update_ofac_list(&self) -> Result<()> {
        // In production, this would fetch from the OFAC API
        // For now, we'll use a mock implementation
        
        let mock_entities = vec![
            SanctionedEntity {
                id: "OFAC-001".to_string(),
                name: "Sanctioned Entity 1".to_string(),
                entity_type: EntityType::Individual,
                aliases: vec!["SE1".to_string()],
                addresses: vec!["0x742d35Cc6634C0532925a3b844Bc9e7595f0fA01".to_string()],
                programs: vec!["SDN".to_string()],
                listing_date: Utc::now() - chrono::Duration::days(30),
            },
            SanctionedEntity {
                id: "OFAC-002".to_string(),
                name: "Blocked Company XYZ".to_string(),
                entity_type: EntityType::Entity,
                aliases: vec!["XYZ Corp".to_string()],
                addresses: vec![],
                programs: vec!["SDN".to_string()],
                listing_date: Utc::now() - chrono::Duration::days(60),
            },
        ];
        
        *self.ofac_list.write().await = mock_entities;
        
        Ok(())
    }
    
    async fn update_un_list(&self) -> Result<()> {
        // In production, this would fetch from the UN API
        // For now, we'll use a mock implementation
        
        let mock_entities = vec![
            SanctionedEntity {
                id: "UN-001".to_string(),
                name: "UN Sanctioned Individual".to_string(),
                entity_type: EntityType::Individual,
                aliases: vec![],
                addresses: vec!["0x123d35Cc6634C0532925a3b844Bc9e7595f0fA02".to_string()],
                programs: vec!["UNSC".to_string()],
                listing_date: Utc::now() - chrono::Duration::days(45),
            },
        ];
        
        *self.un_list.write().await = mock_entities;
        
        Ok(())
    }
    
    /// Get statistics about sanctions screening
    pub async fn get_stats(&self) -> SanctionsStats {
        let ofac_count = self.ofac_list.read().await.len();
        let un_count = self.un_list.read().await.len();
        let last_update = *self.last_update.read().await;
        
        SanctionsStats {
            total_entities: ofac_count + un_count,
            ofac_entities: ofac_count,
            un_entities: un_count,
            last_update,
        }
    }
}

// ============ Data Structures ============

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SanctionedEntity {
    pub id: String,
    pub name: String,
    pub entity_type: EntityType,
    pub aliases: Vec<String>,
    pub addresses: Vec<String>,
    pub programs: Vec<String>,
    pub listing_date: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EntityType {
    Individual,
    Entity,
    Vessel,
    Aircraft,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreeningResult {
    pub is_sanctioned: bool,
    pub lists: Vec<String>,
    pub match_score: f64,
    pub screened_at: DateTime<Utc>,
    pub details: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct SanctionsStats {
    pub total_entities: usize,
    pub ofac_entities: usize,
    pub un_entities: usize,
    pub last_update: DateTime<Utc>,
}
