use ethers::prelude::*;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use eyre::Result;
use std::collections::HashMap;

/// Asset classes supported by the platform
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum AssetClass {
    TREASURY,
    REAL_ESTATE,
    CORPORATE_BOND,
    ENVIRONMENTAL_ASSET,
    IP_RIGHT,
    INVOICE,
    COMMODITY,
    INFRASTRUCTURE,
    CUSTOM,
}

/// Status of a tokenized asset
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum AssetStatus {
    DRAFT,
    PENDING_APPROVAL,
    APPROVED,
    REJECTED,
    ACTIVE,
    PAUSED,
    RETIRED,
}

/// Asset template configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetTemplate {
    pub template_id: [u8; 32],
    pub name: String,
    pub description: String,
    pub asset_class: AssetClass,
    pub creator: Address,
    pub is_approved: bool,
    pub is_public: bool,
    pub creation_date: u64,
    pub contract_uri: String,
    pub metadata_schema: String,
}

/// Asset metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetMetadata {
    pub asset_id: [u8; 32],
    pub name: String,
    pub symbol: String,
    pub description: String,
    pub asset_class: AssetClass,
    pub issuer: Address,
    pub status: AssetStatus,
    pub creation_date: u64,
    pub last_updated: u64,
    pub contract_address: Address,
    pub total_supply: U256,
    pub decimals: u8,
    pub metadata_uri: String,
    pub template_id: Option<[u8; 32]>,
    pub custom_fields: HashMap<String, String>,
}

/// Environmental asset specific metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvironmentalAssetMetadata {
    pub asset_type: String,
    pub certification_standard: String,
    pub vintage_year: u16,
    pub project_id: String,
    pub project_location: String,
    pub verification_date: u64,
    pub registry_link: String,
    pub impact_metrics: HashMap<String, String>,
    pub expiration_date: Option<u64>,
}

/// Client for interacting with the AssetFactory contract
pub struct AssetFactoryClient<M> {
    /// Contract instance
    contract: Arc<ethers::contract::Contract<M>>,
    /// Contract address
    address: Address,
}

impl<M: Middleware> AssetFactoryClient<M> {
    /// Create a new client instance
    pub fn new(client: Arc<M>, address: Address) -> Self {
        // Note: In a real implementation, we would load the ABI from a file or embed it
        let abi = include_str!("../abi/AssetFactory.json");
        let contract = Arc::new(
            ethers::contract::Contract::new(address, serde_json::from_str(abi).unwrap(), client),
        );
        
        Self { contract, address }
    }
    
    /// Create a new asset template
    pub async fn create_template(
        &self,
        name: String,
        description: String,
        asset_class: AssetClass,
        is_public: bool,
        contract_uri: String,
        metadata_schema: String,
    ) -> Result<[u8; 32]> {
        let call = self
            .contract
            .method::<_, [u8; 32]>(
                "createTemplate",
                (name, description, asset_class, is_public, contract_uri, metadata_schema),
            )?;
            
        let template_id = call.call().await?;
        Ok(template_id)
    }
    
    /// Update an existing template
    pub async fn update_template(
        &self,
        template_id: [u8; 32],
        name: String,
        description: String,
        is_public: bool,
        contract_uri: String,
        metadata_schema: String,
    ) -> Result<bool> {
        let call = self
            .contract
            .method::<_, bool>(
                "updateTemplate",
                (template_id, name, description, is_public, contract_uri, metadata_schema),
            )?;
            
        let success = call.call().await?;
        Ok(success)
    }
    
    /// Approve or reject a template
    pub async fn review_template(
        &self,
        template_id: [u8; 32],
        approved: bool,
        feedback: String,
    ) -> Result<bool> {
        let call = self
            .contract
            .method::<_, bool>(
                "reviewTemplate",
                (template_id, approved, feedback),
            )?;
            
        let success = call.call().await?;
        Ok(success)
    }
    
    /// Create a new asset using a template
    pub async fn create_asset_from_template(
        &self,
        template_id: [u8; 32],
        name: String,
        symbol: String,
        description: String,
        total_supply: U256,
        decimals: u8,
        metadata_uri: String,
        custom_fields: HashMap<String, String>,
    ) -> Result<([u8; 32], Address)> {
        let call = self
            .contract
            .method::<_, ([u8; 32], Address)>(
                "createAssetFromTemplate",
                (
                    template_id,
                    name,
                    symbol,
                    description,
                    total_supply,
                    decimals,
                    metadata_uri,
                    custom_fields,
                ),
            )?;
            
        let (asset_id, contract_address) = call.call().await?;
        Ok((asset_id, contract_address))
    }
    
    /// Create a custom asset without a template
    pub async fn create_custom_asset(
        &self,
        name: String,
        symbol: String,
        description: String,
        asset_class: AssetClass,
        total_supply: U256,
        decimals: u8,
        metadata_uri: String,
        custom_fields: HashMap<String, String>,
    ) -> Result<([u8; 32], Address)> {
        let call = self
            .contract
            .method::<_, ([u8; 32], Address)>(
                "createCustomAsset",
                (
                    name,
                    symbol,
                    description,
                    asset_class,
                    total_supply,
                    decimals,
                    metadata_uri,
                    custom_fields,
                ),
            )?;
            
        let (asset_id, contract_address) = call.call().await?;
        Ok((asset_id, contract_address))
    }
    
    /// Create an environmental asset
    pub async fn create_environmental_asset(
        &self,
        name: String,
        symbol: String,
        description: String,
        total_supply: U256,
        decimals: u8,
        metadata_uri: String,
        env_metadata: EnvironmentalAssetMetadata,
    ) -> Result<([u8; 32], Address)> {
        let call = self
            .contract
            .method::<_, ([u8; 32], Address)>(
                "createEnvironmentalAsset",
                (
                    name,
                    symbol,
                    description,
                    total_supply,
                    decimals,
                    metadata_uri,
                    env_metadata,
                ),
            )?;
            
        let (asset_id, contract_address) = call.call().await?;
        Ok((asset_id, contract_address))
    }
    
    /// Update an asset's metadata
    pub async fn update_asset_metadata(
        &self,
        asset_id: [u8; 32],
        description: String,
        metadata_uri: String,
        custom_fields: HashMap<String, String>,
    ) -> Result<bool> {
        let call = self
            .contract
            .method::<_, bool>(
                "updateAssetMetadata",
                (asset_id, description, metadata_uri, custom_fields),
            )?;
            
        let success = call.call().await?;
        Ok(success)
    }
    
    /// Change the status of an asset
    pub async fn update_asset_status(
        &self,
        asset_id: [u8; 32],
        status: AssetStatus,
    ) -> Result<bool> {
        let call = self
            .contract
            .method::<_, bool>(
                "updateAssetStatus",
                (asset_id, status),
            )?;
            
        let success = call.call().await?;
        Ok(success)
    }
    
    /// Get template details
    pub async fn get_template(&self, template_id: [u8; 32]) -> Result<AssetTemplate> {
        let call = self
            .contract
            .method::<_, AssetTemplate>(
                "getTemplate",
                template_id,
            )?;
            
        let template = call.call().await?;
        Ok(template)
    }
    
    /// Get asset metadata
    pub async fn get_asset_metadata(&self, asset_id: [u8; 32]) -> Result<AssetMetadata> {
        let call = self
            .contract
            .method::<_, AssetMetadata>(
                "getAssetMetadata",
                asset_id,
            )?;
            
        let metadata = call.call().await?;
        Ok(metadata)
    }
    
    /// Get environmental asset metadata
    pub async fn get_environmental_asset_metadata(
        &self,
        asset_id: [u8; 32],
    ) -> Result<EnvironmentalAssetMetadata> {
        let call = self
            .contract
            .method::<_, EnvironmentalAssetMetadata>(
                "getEnvironmentalAssetMetadata",
                asset_id,
            )?;
            
        let metadata = call.call().await?;
        Ok(metadata)
    }
    
    /// Get templates created by a user
    pub async fn get_templates_by_creator(&self, creator: Address) -> Result<Vec<[u8; 32]>> {
        let call = self
            .contract
            .method::<_, Vec<[u8; 32]>>(
                "getTemplatesByCreator",
                creator,
            )?;
            
        let template_ids = call.call().await?;
        Ok(template_ids)
    }
    
    /// Get public templates for an asset class
    pub async fn get_public_templates_by_asset_class(
        &self,
        asset_class: AssetClass,
    ) -> Result<Vec<[u8; 32]>> {
        let call = self
            .contract
            .method::<_, Vec<[u8; 32]>>(
                "getPublicTemplatesByAssetClass",
                asset_class,
            )?;
            
        let template_ids = call.call().await?;
        Ok(template_ids)
    }
    
    /// Get all public templates
    pub async fn get_all_public_templates(&self) -> Result<Vec<[u8; 32]>> {
        let call = self
            .contract
            .method::<_, Vec<[u8; 32]>>(
                "getAllPublicTemplates",
                (),
            )?;
            
        let template_ids = call.call().await?;
        Ok(template_ids)
    }
    
    /// Get assets created by a user
    pub async fn get_assets_by_issuer(&self, issuer: Address) -> Result<Vec<[u8; 32]>> {
        let call = self
            .contract
            .method::<_, Vec<[u8; 32]>>(
                "getAssetsByIssuer",
                issuer,
            )?;
            
        let asset_ids = call.call().await?;
        Ok(asset_ids)
    }
    
    /// Get assets by asset class
    pub async fn get_assets_by_asset_class(&self, asset_class: AssetClass) -> Result<Vec<[u8; 32]>> {
        let call = self
            .contract
            .method::<_, Vec<[u8; 32]>>(
                "getAssetsByAssetClass",
                asset_class,
            )?;
            
        let asset_ids = call.call().await?;
        Ok(asset_ids)
    }
    
    /// Get assets created from a template
    pub async fn get_assets_by_template(&self, template_id: [u8; 32]) -> Result<Vec<[u8; 32]>> {
        let call = self
            .contract
            .method::<_, Vec<[u8; 32]>>(
                "getAssetsByTemplate",
                template_id,
            )?;
            
        let asset_ids = call.call().await?;
        Ok(asset_ids)
    }
    
    /// Get all environmental assets
    pub async fn get_all_environmental_assets(&self) -> Result<Vec<[u8; 32]>> {
        let call = self
            .contract
            .method::<_, Vec<[u8; 32]>>(
                "getAllEnvironmentalAssets",
                (),
            )?;
            
        let asset_ids = call.call().await?;
        Ok(asset_ids)
    }
    
    /// Check if an asset exists
    pub async fn asset_exists(&self, asset_id: [u8; 32]) -> Result<bool> {
        let call = self
            .contract
            .method::<_, bool>(
                "assetExists",
                asset_id,
            )?;
            
        let exists = call.call().await?;
        Ok(exists)
    }
    
    /// Get the contract address for an asset
    pub async fn get_asset_contract_address(&self, asset_id: [u8; 32]) -> Result<Address> {
        let call = self
            .contract
            .method::<_, Address>(
                "getAssetContractAddress",
                asset_id,
            )?;
            
        let address = call.call().await?;
        Ok(address)
    }
    
    /// Get total number of assets
    pub async fn get_asset_count(&self) -> Result<U256> {
        let call = self
            .contract
            .method::<_, U256>(
                "getAssetCount",
                (),
            )?;
            
        let count = call.call().await?;
        Ok(count)
    }
    
    /// Get total number of templates
    pub async fn get_template_count(&self) -> Result<U256> {
        let call = self
            .contract
            .method::<_, U256>(
                "getTemplateCount",
                (),
            )?;
            
        let count = call.call().await?;
        Ok(count)
    }
    
    /// Get all templates with full details
    pub async fn get_all_templates_with_details(&self) -> Result<HashMap<[u8; 32], AssetTemplate>> {
        let template_ids = self.get_all_public_templates().await?;
        let mut templates = HashMap::new();
        
        for template_id in template_ids {
            let template = self.get_template(template_id).await?;
            templates.insert(template_id, template);
        }
        
        Ok(templates)
    }
    
    /// Get all environmental assets with metadata
    pub async fn get_all_environmental_assets_with_metadata(
        &self,
    ) -> Result<HashMap<[u8; 32], (AssetMetadata, EnvironmentalAssetMetadata)>> {
        let asset_ids = self.get_all_environmental_assets().await?;
        let mut assets = HashMap::new();
        
        for asset_id in asset_ids {
            let metadata = self.get_asset_metadata(asset_id).await?;
            let env_metadata = self.get_environmental_asset_metadata(asset_id).await?;
            assets.insert(asset_id, (metadata, env_metadata));
        }
        
        Ok(assets)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use ethers::signers::Signer;
    
    // These tests are commented out as they require a running Ethereum node
    // with the appropriate contracts deployed.
    
    /*
    #[tokio::test]
    async fn test_create_template() {
        // Setup
        let provider = Provider::<Http>::try_from("http://localhost:8545").unwrap();
        let wallet = LocalWallet::new(&mut rand::thread_rng());
        let client = SignerMiddleware::new(provider, wallet);
        
        let address = "0x1234567890123456789012345678901234567890".parse::<Address>().unwrap();
        let asset_factory = AssetFactoryClient::new(Arc::new(client), address);
        
        // Test
        let template_id = asset_factory.create_template(
            "Test Template".to_string(),
            "A test template".to_string(),
            AssetClass::TREASURY,
            true,
            "https://example.com/contract".to_string(),
            "{\"properties\":{\"type\":\"string\"}}".to_string(),
        ).await.unwrap();
        
        // Verify
        let template = asset_factory.get_template(template_id).await.unwrap();
        assert_eq!(template.name, "Test Template");
        assert_eq!(template.asset_class, AssetClass::TREASURY);
        assert_eq!(template.is_public, true);
    }
    */
} 