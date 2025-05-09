use ethers::prelude::*;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use eyre::Result;
use std::collections::HashMap;

/// Type of smart account template
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum TemplateType {
    YIELD_REINVESTMENT,
    AUTOMATED_TRADING,
    PORTFOLIO_REBALANCING,
    CONDITIONAL_TRANSFER,
    DELEGATION,
    MULTI_SIGNATURE,
    TIMELOCKED_TRANSFER,
    DOLLAR_COST_AVERAGING,
    CUSTOM,
}

/// Execution parameters for smart accounts
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ExecutionParams {
    pub gas_limit: U256,
    pub gas_price: Option<U256>,
    pub value: U256,
    pub delegated: bool,
    pub delegate: Option<Address>,
    pub valid_until: u64,
    pub nonce: U256,
}

/// Smart account template details
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountTemplate {
    pub template_id: [u8; 32],
    pub name: String,
    pub description: String,
    pub template_type: TemplateType,
    pub creator: Address,
    pub code: Vec<u8>,
    pub is_public: bool,
    pub is_verified: bool,
    pub creation_date: u64,
    pub verification_date: Option<u64>,
    pub parameters_schema: String,
    pub version: String,
    pub usage_count: U256,
}

/// Smart account instance
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartAccount {
    pub account_id: [u8; 32],
    pub owner: Address,
    pub template_id: [u8; 32],
    pub code: Vec<u8>,
    pub code_hash: H256,
    pub creation_date: u64,
    pub last_execution: u64,
    pub execution_count: U256,
    pub parameters: HashMap<String, String>,
    pub is_active: bool,
    pub delegates: Vec<Address>,
}

/// Execution result of a smart account
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionResult {
    pub success: bool,
    pub result_data: Vec<u8>,
    pub logs: Vec<String>,
    pub gas_used: U256,
    pub error_message: Option<String>,
}

/// Smart account operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartAccountOperation {
    pub operation_id: [u8; 32],
    pub account_id: [u8; 32],
    pub operation_type: String,
    pub timestamp: u64,
    pub data: Vec<u8>,
    pub result: Option<ExecutionResult>,
    pub executed_by: Address,
}

/// Template verification result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerificationResult {
    pub is_verified: bool,
    pub vulnerability_risk: u8, // 0-100 score
    pub security_notes: Vec<String>,
    pub performance_risk: u8, // 0-100 score
    pub verifier: Address,
    pub verification_timestamp: u64,
}

/// Client for interacting with the SmartAccountTemplates contract
pub struct SmartAccountClient<M> {
    /// Contract instance
    contract: Arc<ethers::contract::Contract<M>>,
    /// Contract address
    address: Address,
}

impl<M: Middleware> SmartAccountClient<M> {
    /// Create a new client instance
    pub fn new(client: Arc<M>, address: Address) -> Self {
        // Note: In a real implementation, we would load the ABI from a file or embed it
        let abi = include_str!("../abi/SmartAccountTemplates.json");
        let contract = Arc::new(
            ethers::contract::Contract::new(address, serde_json::from_str(abi).unwrap(), client),
        );
        
        Self { contract, address }
    }
    
    /// Create a new account template
    pub async fn create_template(
        &self,
        name: String,
        description: String,
        template_type: TemplateType,
        code: Vec<u8>,
        is_public: bool,
        parameters_schema: String,
        version: String,
    ) -> Result<[u8; 32]> {
        let call = self
            .contract
            .method::<_, [u8; 32]>(
                "createTemplate",
                (name, description, template_type, code, is_public, parameters_schema, version),
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
        code: Vec<u8>,
        is_public: bool,
        parameters_schema: String,
        version: String,
    ) -> Result<bool> {
        let call = self
            .contract
            .method::<_, bool>(
                "updateTemplate",
                (template_id, name, description, code, is_public, parameters_schema, version),
            )?;
            
        let success = call.call().await?;
        Ok(success)
    }
    
    /// Get template details
    pub async fn get_template(&self, template_id: [u8; 32]) -> Result<AccountTemplate> {
        let call = self
            .contract
            .method::<_, AccountTemplate>(
                "getTemplate",
                template_id,
            )?;
            
        let template = call.call().await?;
        Ok(template)
    }
    
    /// Verify a template
    pub async fn verify_template(
        &self,
        template_id: [u8; 32],
        vulnerability_risk: u8,
        security_notes: Vec<String>,
        performance_risk: u8,
    ) -> Result<bool> {
        let call = self
            .contract
            .method::<_, bool>(
                "verifyTemplate",
                (template_id, vulnerability_risk, security_notes, performance_risk),
            )?;
            
        let success = call.call().await?;
        Ok(success)
    }
    
    /// Get verification result for a template
    pub async fn get_verification_result(&self, template_id: [u8; 32]) -> Result<VerificationResult> {
        let call = self
            .contract
            .method::<_, VerificationResult>(
                "getVerificationResult",
                template_id,
            )?;
            
        let result = call.call().await?;
        Ok(result)
    }
    
    /// Deploy a smart account from a template
    pub async fn deploy_account(
        &self,
        template_id: [u8; 32],
        parameters: HashMap<String, String>,
    ) -> Result<[u8; 32]> {
        let call = self
            .contract
            .method::<_, [u8; 32]>(
                "deployAccount",
                (template_id, parameters),
            )?;
            
        let account_id = call.call().await?;
        Ok(account_id)
    }
    
    /// Deploy a custom smart account
    pub async fn deploy_custom_account(
        &self,
        code: Vec<u8>,
        parameters: HashMap<String, String>,
    ) -> Result<[u8; 32]> {
        let call = self
            .contract
            .method::<_, [u8; 32]>(
                "deployCustomAccount",
                (code, parameters),
            )?;
            
        let account_id = call.call().await?;
        Ok(account_id)
    }
    
    /// Update an existing smart account
    pub async fn update_account(
        &self,
        account_id: [u8; 32],
        code: Vec<u8>,
        parameters: HashMap<String, String>,
        is_active: bool,
    ) -> Result<bool> {
        let call = self
            .contract
            .method::<_, bool>(
                "updateAccount",
                (account_id, code, parameters, is_active),
            )?;
            
        let success = call.call().await?;
        Ok(success)
    }
    
    /// Get smart account details
    pub async fn get_account(&self, account_id: [u8; 32]) -> Result<SmartAccount> {
        let call = self
            .contract
            .method::<_, SmartAccount>(
                "getAccount",
                account_id,
            )?;
            
        let account = call.call().await?;
        Ok(account)
    }
    
    /// Execute smart account code
    pub async fn execute_account(
        &self,
        account_id: [u8; 32],
        data: Vec<u8>,
        execution_params: ExecutionParams,
    ) -> Result<ExecutionResult> {
        let call = self
            .contract
            .method::<_, ExecutionResult>(
                "executeAccount",
                (account_id, data, execution_params),
            )?;
            
        let result = call.call().await?;
        Ok(result)
    }
    
    /// Simulate execution (dry run without state changes)
    pub async fn simulate_execution(
        &self,
        account_id: [u8; 32],
        data: Vec<u8>,
    ) -> Result<ExecutionResult> {
        let call = self
            .contract
            .method::<_, ExecutionResult>(
                "simulateExecution",
                (account_id, data),
            )?;
            
        let result = call.call().await?;
        Ok(result)
    }
    
    /// Add a delegate to a smart account
    pub async fn add_delegate(
        &self,
        account_id: [u8; 32],
        delegate: Address,
    ) -> Result<bool> {
        let call = self
            .contract
            .method::<_, bool>(
                "addDelegate",
                (account_id, delegate),
            )?;
            
        let success = call.call().await?;
        Ok(success)
    }
    
    /// Remove a delegate from a smart account
    pub async fn remove_delegate(
        &self,
        account_id: [u8; 32],
        delegate: Address,
    ) -> Result<bool> {
        let call = self
            .contract
            .method::<_, bool>(
                "removeDelegate",
                (account_id, delegate),
            )?;
            
        let success = call.call().await?;
        Ok(success)
    }
    
    /// Get all delegates for a smart account
    pub async fn get_delegates(&self, account_id: [u8; 32]) -> Result<Vec<Address>> {
        let call = self
            .contract
            .method::<_, Vec<Address>>(
                "getDelegates",
                account_id,
            )?;
            
        let delegates = call.call().await?;
        Ok(delegates)
    }
    
    /// Check if an address is a delegate for a smart account
    pub async fn is_delegate(
        &self,
        account_id: [u8; 32],
        delegate: Address,
    ) -> Result<bool> {
        let call = self
            .contract
            .method::<_, bool>(
                "isDelegate",
                (account_id, delegate),
            )?;
            
        let is_delegate = call.call().await?;
        Ok(is_delegate)
    }
    
    /// Get operation history for a smart account
    pub async fn get_operation_history(
        &self,
        account_id: [u8; 32],
    ) -> Result<Vec<SmartAccountOperation>> {
        let call = self
            .contract
            .method::<_, Vec<SmartAccountOperation>>(
                "getOperationHistory",
                account_id,
            )?;
            
        let operations = call.call().await?;
        Ok(operations)
    }
    
    /// Get accounts owned by a user
    pub async fn get_accounts_by_owner(&self, owner: Address) -> Result<Vec<[u8; 32]>> {
        let call = self
            .contract
            .method::<_, Vec<[u8; 32]>>(
                "getAccountsByOwner",
                owner,
            )?;
            
        let account_ids = call.call().await?;
        Ok(account_ids)
    }
    
    /// Get accounts where an address is a delegate
    pub async fn get_accounts_by_delegate(&self, delegate: Address) -> Result<Vec<[u8; 32]>> {
        let call = self
            .contract
            .method::<_, Vec<[u8; 32]>>(
                "getAccountsByDelegate",
                delegate,
            )?;
            
        let account_ids = call.call().await?;
        Ok(account_ids)
    }
    
    /// Get templates by type
    pub async fn get_templates_by_type(&self, template_type: TemplateType) -> Result<Vec<[u8; 32]>> {
        let call = self
            .contract
            .method::<_, Vec<[u8; 32]>>(
                "getTemplatesByType",
                template_type,
            )?;
            
        let template_ids = call.call().await?;
        Ok(template_ids)
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
    
    /// Get all public templates
    pub async fn get_public_templates(&self) -> Result<Vec<[u8; 32]>> {
        let call = self
            .contract
            .method::<_, Vec<[u8; 32]>>(
                "getPublicTemplates",
                (),
            )?;
            
        let template_ids = call.call().await?;
        Ok(template_ids)
    }
    
    /// Get all verified templates
    pub async fn get_verified_templates(&self) -> Result<Vec<[u8; 32]>> {
        let call = self
            .contract
            .method::<_, Vec<[u8; 32]>>(
                "getVerifiedTemplates",
                (),
            )?;
            
        let template_ids = call.call().await?;
        Ok(template_ids)
    }
    
    /// Generate a nonce for account execution
    pub async fn generate_nonce(&self, account_id: [u8; 32]) -> Result<U256> {
        let call = self
            .contract
            .method::<_, U256>(
                "generateNonce",
                account_id,
            )?;
            
        let nonce = call.call().await?;
        Ok(nonce)
    }
    
    /// Verify signature for delegated execution
    pub async fn verify_signature(
        &self,
        account_id: [u8; 32],
        data: Vec<u8>,
        nonce: U256,
        signature: Vec<u8>,
    ) -> Result<bool> {
        let call = self
            .contract
            .method::<_, bool>(
                "verifySignature",
                (account_id, data, nonce, signature),
            )?;
            
        let is_valid = call.call().await?;
        Ok(is_valid)
    }
    
    /// Create a yield reinvestment template
    pub async fn create_yield_reinvestment_template(
        &self,
        name: String,
        description: String,
        is_public: bool,
        auto_compound_frequency: u64,
        min_reinvest_amount: U256,
        reinvestment_targets: Vec<Address>,
        reinvestment_allocations: Vec<u8>,
    ) -> Result<[u8; 32]> {
        let call = self
            .contract
            .method::<_, [u8; 32]>(
                "createYieldReinvestmentTemplate",
                (
                    name,
                    description,
                    is_public,
                    auto_compound_frequency,
                    min_reinvest_amount,
                    reinvestment_targets,
                    reinvestment_allocations,
                ),
            )?;
            
        let template_id = call.call().await?;
        Ok(template_id)
    }
    
    /// Create an automated trading template
    pub async fn create_automated_trading_template(
        &self,
        name: String,
        description: String,
        is_public: bool,
        target_tokens: Vec<Address>,
        price_thresholds: Vec<U256>,
        is_price_above: Vec<bool>,
        order_sizes: Vec<U256>,
        expiration_strategy: u8,
    ) -> Result<[u8; 32]> {
        let call = self
            .contract
            .method::<_, [u8; 32]>(
                "createAutomatedTradingTemplate",
                (
                    name,
                    description,
                    is_public,
                    target_tokens,
                    price_thresholds,
                    is_price_above,
                    order_sizes,
                    expiration_strategy,
                ),
            )?;
            
        let template_id = call.call().await?;
        Ok(template_id)
    }
    
    /// Create a portfolio rebalancing template
    pub async fn create_portfolio_rebalancing_template(
        &self,
        name: String,
        description: String,
        is_public: bool,
        target_assets: Vec<Address>,
        target_allocations: Vec<u8>,
        rebalance_threshold: u8,
        rebalance_frequency: u64,
        max_slippage: u8,
    ) -> Result<[u8; 32]> {
        let call = self
            .contract
            .method::<_, [u8; 32]>(
                "createPortfolioRebalancingTemplate",
                (
                    name,
                    description,
                    is_public,
                    target_assets,
                    target_allocations,
                    rebalance_threshold,
                    rebalance_frequency,
                    max_slippage,
                ),
            )?;
            
        let template_id = call.call().await?;
        Ok(template_id)
    }
    
    /// Create a dollar cost averaging template
    pub async fn create_dca_template(
        &self,
        name: String,
        description: String,
        is_public: bool,
        source_asset: Address,
        target_asset: Address,
        investment_amount: U256,
        frequency: u64,
        duration: u64,
        max_slippage: u8,
    ) -> Result<[u8; 32]> {
        let call = self
            .contract
            .method::<_, [u8; 32]>(
                "createDCATemplate",
                (
                    name,
                    description,
                    is_public,
                    source_asset,
                    target_asset,
                    investment_amount,
                    frequency,
                    duration,
                    max_slippage,
                ),
            )?;
            
        let template_id = call.call().await?;
        Ok(template_id)
    }
    
    /// Create a multi-signature template
    pub async fn create_multi_sig_template(
        &self,
        name: String,
        description: String,
        is_public: bool,
        signers: Vec<Address>,
        threshold: u8,
        execution_timelock: u64,
    ) -> Result<[u8; 32]> {
        let call = self
            .contract
            .method::<_, [u8; 32]>(
                "createMultiSigTemplate",
                (
                    name,
                    description,
                    is_public,
                    signers,
                    threshold,
                    execution_timelock,
                ),
            )?;
            
        let template_id = call.call().await?;
        Ok(template_id)
    }
    
    /// Get all accounts with full details
    pub async fn get_all_accounts_with_details(
        &self,
        owner: Address,
    ) -> Result<HashMap<[u8; 32], SmartAccount>> {
        let account_ids = self.get_accounts_by_owner(owner).await?;
        let mut accounts = HashMap::new();
        
        for account_id in account_ids {
            let account = self.get_account(account_id).await?;
            accounts.insert(account_id, account);
        }
        
        Ok(accounts)
    }
    
    /// Get all templates with full details
    pub async fn get_all_templates_with_details(&self) -> Result<HashMap<[u8; 32], AccountTemplate>> {
        let template_ids = self.get_public_templates().await?;
        let mut templates = HashMap::new();
        
        for template_id in template_ids {
            let template = self.get_template(template_id).await?;
            templates.insert(template_id, template);
        }
        
        Ok(templates)
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
        let smart_account = SmartAccountClient::new(Arc::new(client), address);
        
        // Test
        let code = "function execute(params) { return params.amount * 2; }".as_bytes().to_vec();
        let template_id = smart_account.create_template(
            "Test Template".to_string(),
            "A test template".to_string(),
            TemplateType::CUSTOM,
            code.clone(),
            true,
            "{\"properties\":{\"amount\":{\"type\":\"uint256\"}}}".to_string(),
            "1.0.0".to_string(),
        ).await.unwrap();
        
        // Verify
        let template = smart_account.get_template(template_id).await.unwrap();
        assert_eq!(template.name, "Test Template");
        assert_eq!(template.template_type, TemplateType::CUSTOM);
        assert_eq!(template.code, code);
        assert_eq!(template.is_public, true);
    }
    */
} 