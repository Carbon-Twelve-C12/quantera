use alloy_primitives::{Address, U256, Bytes};
use ethereum_client::{EthereumClient, Error as EthError};
use serde::{Serialize, Deserialize};
use std::sync::Arc;
use std::collections::HashMap;
use crate::Error;

/// Type of smart account template
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
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

/// Parameters for account execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionParams {
    pub gas_limit: U256,
    pub gas_price: U256,
    pub value: U256,
    pub delegated: bool,
    pub delegate: Address,
    pub valid_until: u64,
    pub nonce: U256,
}

/// Template for smart account
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
    pub verification_date: u64,
    pub parameters_schema: String,
    pub version: String,
    pub usage_count: U256,
}

/// Smart account information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartAccount {
    pub account_id: [u8; 32],
    pub owner: Address,
    pub template_id: [u8; 32],
    pub code: Vec<u8>,
    pub code_hash: [u8; 32],
    pub creation_date: u64,
    pub last_execution: u64,
    pub execution_count: U256,
    pub parameters: HashMap<String, String>,
    pub is_active: bool,
    pub delegates: Vec<Address>,
}

/// Result of account execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionResult {
    pub success: bool,
    pub result_data: Vec<u8>,
    pub logs: Vec<String>,
    pub gas_used: U256,
    pub error_message: String,
}

/// Operation performed on a smart account
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartAccountOperation {
    pub operation_id: [u8; 32],
    pub account_id: [u8; 32],
    pub operation_type: String,
    pub timestamp: u64,
    pub data: Vec<u8>,
    pub result: ExecutionResult,
    pub executed_by: Address,
}

/// Verification result for a template
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerificationResult {
    pub is_verified: bool,
    pub vulnerability_risk: u8,
    pub security_notes: Vec<String>,
    pub performance_risk: u8,
    pub verifier: Address,
    pub verification_timestamp: u64,
}

/// Client for interacting with the SmartAccountTemplates contract
#[derive(Debug, Clone)]
pub struct SmartAccountClient {
    client: Arc<EthereumClient>,
    contract_address: Address,
}

impl SmartAccountClient {
    /// Create a new SmartAccountClient
    pub fn new(client: Arc<EthereumClient>, address: Address) -> Self {
        Self {
            client,
            contract_address: address,
        }
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
    ) -> Result<[u8; 32], Error> {
        let template_id = self.client.send_transaction(
            self.contract_address,
            "createTemplate(string,string,uint8,bytes,bool,string,string)",
            vec![
                name.into(),
                description.into(),
                (template_type as u8).into(),
                Bytes::from(code.clone()).into(),
                is_public.into(),
                parameters_schema.into(),
                version.into(),
            ],
            0.into(),
        ).await.map_err(Error::EthereumClient)?;
        
        // Parse transaction receipt to extract the template ID
        let receipt = self.client.get_transaction_receipt(template_id)
            .await.map_err(Error::EthereumClient)?;
            
        // Extract template ID from logs (assuming it's the first event parameter)
        let template_id_bytes: [u8; 32] = receipt.logs[0].topics[1].to_fixed_bytes();
        
        Ok(template_id_bytes)
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
    ) -> Result<bool, Error> {
        let success = self.client.send_transaction(
            self.contract_address,
            "updateTemplate(bytes32,string,string,bytes,bool,string,string)",
            vec![
                template_id.into(),
                name.into(),
                description.into(),
                Bytes::from(code.clone()).into(),
                is_public.into(),
                parameters_schema.into(),
                version.into(),
            ],
            0.into(),
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(success)
    }
    
    /// Get template details
    pub async fn get_template(&self, template_id: [u8; 32]) -> Result<AccountTemplate, Error> {
        let template = self.client.call_contract::<AccountTemplate>(
            self.contract_address,
            "getTemplate(bytes32)",
            vec![template_id.into()],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(template)
    }
    
    /// Get verification result for a template
    pub async fn get_verification_result(&self, template_id: [u8; 32]) -> Result<VerificationResult, Error> {
        let result = self.client.call_contract::<VerificationResult>(
            self.contract_address,
            "getVerificationResult(bytes32)",
            vec![template_id.into()],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(result)
    }
    
    /// Deploy a smart account from a template
    pub async fn deploy_account(
        &self,
        template_id: [u8; 32],
        parameters: HashMap<String, String>,
    ) -> Result<[u8; 32], Error> {
        // Encode parameters as a string map
        let encoded_params = serde_json::to_string(&parameters)
            .map_err(|_| Error::InvalidParameter("Could not serialize parameters".to_string()))?;
        
        let tx_hash = self.client.send_transaction(
            self.contract_address,
            "deployAccount(bytes32,string)",
            vec![
                template_id.into(),
                encoded_params.into(),
            ],
            0.into(),
        ).await.map_err(Error::EthereumClient)?;
        
        // Parse transaction receipt to extract the account ID
        let receipt = self.client.get_transaction_receipt(tx_hash)
            .await.map_err(Error::EthereumClient)?;
            
        // Extract account ID from logs (assuming it's the first event parameter)
        let account_id_bytes: [u8; 32] = receipt.logs[0].topics[1].to_fixed_bytes();
        
        Ok(account_id_bytes)
    }
    
    /// Get smart account details
    pub async fn get_account(&self, account_id: [u8; 32]) -> Result<SmartAccount, Error> {
        let account = self.client.call_contract::<SmartAccount>(
            self.contract_address,
            "getAccount(bytes32)",
            vec![account_id.into()],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(account)
    }
    
    /// Execute smart account code
    pub async fn execute_account(
        &self,
        account_id: [u8; 32],
        data: Vec<u8>,
        execution_params: ExecutionParams,
    ) -> Result<ExecutionResult, Error> {
        let encoded_params = self.client.encode_params(
            "(uint256,uint256,uint256,bool,address,uint64,uint256)",
            vec![(
                execution_params.gas_limit,
                execution_params.gas_price,
                execution_params.value,
                execution_params.delegated,
                execution_params.delegate,
                execution_params.valid_until,
                execution_params.nonce,
            ).into()],
        ).map_err(Error::EthereumClient)?;
        
        let result = self.client.call_contract::<ExecutionResult>(
            self.contract_address,
            "executeAccount(bytes32,bytes,(uint256,uint256,uint256,bool,address,uint64,uint256))",
            vec![
                account_id.into(),
                Bytes::from(data.clone()).into(),
                encoded_params,
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(result)
    }
    
    /// Simulate execution without state changes
    pub async fn simulate_execution(
        &self,
        account_id: [u8; 32],
        data: Vec<u8>,
    ) -> Result<ExecutionResult, Error> {
        let result = self.client.call_contract::<ExecutionResult>(
            self.contract_address,
            "simulateExecution(bytes32,bytes)",
            vec![
                account_id.into(),
                Bytes::from(data.clone()).into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(result)
    }
    
    /// Add a delegate to a smart account
    pub async fn add_delegate(
        &self,
        account_id: [u8; 32],
        delegate: Address,
    ) -> Result<bool, Error> {
        let success = self.client.send_transaction(
            self.contract_address,
            "addDelegate(bytes32,address)",
            vec![
                account_id.into(),
                delegate.into(),
            ],
            0.into(),
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(success)
    }
    
    /// Remove a delegate from a smart account
    pub async fn remove_delegate(
        &self,
        account_id: [u8; 32],
        delegate: Address,
    ) -> Result<bool, Error> {
        let success = self.client.send_transaction(
            self.contract_address,
            "removeDelegate(bytes32,address)",
            vec![
                account_id.into(),
                delegate.into(),
            ],
            0.into(),
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(success)
    }
    
    /// Get all delegates for a smart account
    pub async fn get_delegates(&self, account_id: [u8; 32]) -> Result<Vec<Address>, Error> {
        let delegates = self.client.call_contract::<Vec<Address>>(
            self.contract_address,
            "getDelegates(bytes32)",
            vec![account_id.into()],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(delegates)
    }
    
    /// Check if an address is a delegate for a smart account
    pub async fn is_delegate(
        &self,
        account_id: [u8; 32],
        delegate: Address,
    ) -> Result<bool, Error> {
        let is_delegate = self.client.call_contract::<bool>(
            self.contract_address,
            "isDelegate(bytes32,address)",
            vec![
                account_id.into(),
                delegate.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(is_delegate)
    }
    
    /// Get operation history for a smart account
    pub async fn get_operation_history(
        &self,
        account_id: [u8; 32],
    ) -> Result<Vec<SmartAccountOperation>, Error> {
        let operations = self.client.call_contract::<Vec<SmartAccountOperation>>(
            self.contract_address,
            "getOperationHistory(bytes32)",
            vec![account_id.into()],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(operations)
    }
    
    /// Get accounts owned by a user
    pub async fn get_accounts_by_owner(&self, owner: Address) -> Result<Vec<[u8; 32]>, Error> {
        let accounts = self.client.call_contract::<Vec<[u8; 32]>>(
            self.contract_address,
            "getAccountsByOwner(address)",
            vec![owner.into()],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(accounts)
    }
    
    /// Get accounts where an address is a delegate
    pub async fn get_accounts_by_delegate(&self, delegate: Address) -> Result<Vec<[u8; 32]>, Error> {
        let accounts = self.client.call_contract::<Vec<[u8; 32]>>(
            self.contract_address,
            "getAccountsByDelegate(address)",
            vec![delegate.into()],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(accounts)
    }
    
    /// Get templates by type
    pub async fn get_templates_by_type(&self, template_type: TemplateType) -> Result<Vec<[u8; 32]>, Error> {
        let templates = self.client.call_contract::<Vec<[u8; 32]>>(
            self.contract_address,
            "getTemplatesByType(uint8)",
            vec![(template_type as u8).into()],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(templates)
    }
    
    /// Get templates created by a user
    pub async fn get_templates_by_creator(&self, creator: Address) -> Result<Vec<[u8; 32]>, Error> {
        let templates = self.client.call_contract::<Vec<[u8; 32]>>(
            self.contract_address,
            "getTemplatesByCreator(address)",
            vec![creator.into()],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(templates)
    }
    
    /// Get all public templates
    pub async fn get_public_templates(&self) -> Result<Vec<[u8; 32]>, Error> {
        let templates = self.client.call_contract::<Vec<[u8; 32]>>(
            self.contract_address,
            "getPublicTemplates()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(templates)
    }
    
    /// Get all verified templates
    pub async fn get_verified_templates(&self) -> Result<Vec<[u8; 32]>, Error> {
        let templates = self.client.call_contract::<Vec<[u8; 32]>>(
            self.contract_address,
            "getVerifiedTemplates()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(templates)
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
    ) -> Result<[u8; 32], Error> {
        // Check that allocations add up to 100
        let total_allocation: u16 = reinvestment_allocations.iter().map(|&x| x as u16).sum();
        if total_allocation != 100 {
            return Err(Error::InvalidParameter("Reinvestment allocations must add up to 100".to_string()));
        }
        
        // Check that targets and allocations have the same length
        if reinvestment_targets.len() != reinvestment_allocations.len() {
            return Err(Error::InvalidParameter("Reinvestment targets and allocations must have the same length".to_string()));
        }
        
        let tx_hash = self.client.send_transaction(
            self.contract_address,
            "createYieldReinvestmentTemplate(string,string,bool,uint64,uint256,address[],uint8[])",
            vec![
                name.into(),
                description.into(),
                is_public.into(),
                auto_compound_frequency.into(),
                min_reinvest_amount.into(),
                reinvestment_targets.into(),
                reinvestment_allocations.into(),
            ],
            0.into(),
        ).await.map_err(Error::EthereumClient)?;
        
        // Parse transaction receipt to extract the template ID
        let receipt = self.client.get_transaction_receipt(tx_hash)
            .await.map_err(Error::EthereumClient)?;
            
        // Extract template ID from logs (assuming it's the first event parameter)
        let template_id_bytes: [u8; 32] = receipt.logs[0].topics[1].to_fixed_bytes();
        
        Ok(template_id_bytes)
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