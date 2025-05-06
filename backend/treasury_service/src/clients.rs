use alloy_primitives::{Address, U256, H256, Bytes};
use ethereum_client::{EthereumClient, Error as EthError};
use serde::{Serialize, Deserialize};
use std::sync::Arc;
use crate::Error;

/// Treasury Token types
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum TreasuryType {
    TBill,
    TNote,
    TBond,
}

/// Treasury Token information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenInfo {
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub total_supply: U256,
    pub treasury_id: [u8; 32],
    pub face_value: U256,
    pub yield_rate: u64,
    pub issuance_date: u64,
    pub maturity_date: u64,
    pub last_yield_distribution: u64,
    pub issuer: Address,
}

/// Transfer validation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferValidation {
    pub is_valid: bool,
    pub status_code: u8,
    pub status_message: String,
}

/// Yield distribution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YieldDistributionResult {
    pub treasury_id: [u8; 32],
    pub total_amount: U256,
    pub distribution_timestamp: u64,
}

/// Account code execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountExecutionResult {
    pub success: bool,
    pub result_data: Vec<u8>,
}

/// Client for interacting with the TreasuryToken contract
#[derive(Debug, Clone)]
pub struct TreasuryTokenClient {
    client: Arc<EthereumClient>,
    contract_address: Address,
}

impl TreasuryTokenClient {
    /// Create a new TreasuryTokenClient
    pub async fn new(client: Arc<EthereumClient>, address: Address) -> Self {
        Self {
            client,
            contract_address: address,
        }
    }
    
    /// Get token information
    pub async fn get_token_info(&self) -> Result<TokenInfo, Error> {
        // Get basic token information
        let name = self.client.call_contract::<String>(
            self.contract_address,
            "name()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        let symbol = self.client.call_contract::<String>(
            self.contract_address,
            "symbol()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        let decimals = self.client.call_contract::<u8>(
            self.contract_address,
            "decimals()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        let total_supply = self.client.call_contract::<U256>(
            self.contract_address,
            "totalSupply()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        // Get treasury-specific information
        let treasury_id = self.client.call_contract::<[u8; 32]>(
            self.contract_address,
            "treasuryId()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        let face_value = self.client.call_contract::<U256>(
            self.contract_address,
            "faceValue()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        let yield_rate = self.client.call_contract::<u64>(
            self.contract_address,
            "yieldRate()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        let issuance_date = self.client.call_contract::<u64>(
            self.contract_address,
            "issuanceDate()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        let maturity_date = self.client.call_contract::<u64>(
            self.contract_address,
            "maturityDate()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        let last_yield_distribution = self.client.call_contract::<u64>(
            self.contract_address,
            "lastYieldDistribution()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        let issuer = self.client.call_contract::<Address>(
            self.contract_address,
            "issuer()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        // Create TokenInfo struct
        let info = TokenInfo {
            name,
            symbol,
            decimals,
            total_supply,
            treasury_id,
            face_value,
            yield_rate,
            issuance_date,
            maturity_date,
            last_yield_distribution,
            issuer,
        };
        
        Ok(info)
    }
    
    /// Get token treasury type
    pub async fn get_treasury_type(&self) -> Result<TreasuryType, Error> {
        let treasury_type = self.client.call_contract::<u8>(
            self.contract_address,
            "treasuryType()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        match treasury_type {
            0 => Ok(TreasuryType::TBill),
            1 => Ok(TreasuryType::TNote),
            2 => Ok(TreasuryType::TBond),
            _ => Err(Error::Decoding("Invalid treasury type".into())),
        }
    }
    
    /// Get token balance for an address
    pub async fn balance_of(&self, address: Address) -> Result<U256, Error> {
        let balance = self.client.call_contract::<U256>(
            self.contract_address,
            "balanceOf(address)",
            vec![address.into()],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(balance)
    }
    
    /// Get total token supply
    pub async fn total_supply(&self) -> Result<U256, Error> {
        let supply = self.client.call_contract::<U256>(
            self.contract_address,
            "totalSupply()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(supply)
    }
    
    /// Transfer tokens with data
    pub async fn transfer_with_data(
        &self,
        to: Address,
        value: U256,
        data: Vec<u8>,
    ) -> Result<bool, Error> {
        let result = self.client.send_transaction(
            self.contract_address,
            "transferWithData(address,uint256,bytes)",
            vec![
                to.into(),
                value.into(),
                Bytes::from(data).into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        // Check if the transaction was successful
        if !result.status {
            return Err(Error::ContractInteraction("Transfer failed".into()));
        }
        
        Ok(true)
    }
    
    /// Check if a transfer is valid
    pub async fn can_transfer(
        &self,
        to: Address,
        value: U256,
        data: Vec<u8>,
    ) -> Result<TransferValidation, Error> {
        let result = self.client.call_contract::<(bool, u8, [u8; 32])>(
            self.contract_address,
            "canTransfer(address,uint256,bytes)",
            vec![
                to.into(),
                value.into(),
                Bytes::from(data).into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        // Convert status code to message
        let status_message = match result.1 {
            0 => "Transfer is valid".to_string(),
            1 => "Insufficient balance".to_string(),
            2 => "Recipient is not allowed".to_string(),
            3 => "Sender is not authorized".to_string(),
            4 => "Transfer amount exceeds allowance".to_string(),
            5 => "Transfer is paused".to_string(),
            6 => "Transfer is blocked by compliance".to_string(),
            7 => "Treasury is matured".to_string(),
            8 => "Treasury is redeemed".to_string(),
            _ => format!("Unknown status code: {}", result.1),
        };
        
        let validation = TransferValidation {
            is_valid: result.0,
            status_code: result.1,
            status_message,
        };
        
        Ok(validation)
    }
    
    /// Distribute yield to token holders
    pub async fn distribute_yield(&self) -> Result<YieldDistributionResult, Error> {
        let receipt = self.client.send_transaction(
            self.contract_address,
            "distributeYield()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        // Check if the transaction was successful
        if !receipt.status {
            return Err(Error::ContractInteraction("Yield distribution failed".into()));
        }
        
        // Extract yield distribution details from logs
        // In a real implementation, we would parse the YieldDistributed event
        // For now, we'll create a simulated result
        
        let treasury_id = self.client.call_contract::<[u8; 32]>(
            self.contract_address,
            "treasuryId()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        let yield_rate = self.client.call_contract::<u64>(
            self.contract_address,
            "yieldRate()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        let total_supply = self.client.call_contract::<U256>(
            self.contract_address,
            "totalSupply()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        // Calculate distributed amount (simplified)
        let total_amount = total_supply
            .checked_mul(U256::from(yield_rate))
            .ok_or_else(|| Error::Decoding("Overflow in yield calculation".into()))?
            .checked_div(U256::from(10000)) // Yield rate is in basis points
            .ok_or_else(|| Error::Decoding("Division by zero in yield calculation".into()))?;
        
        let result = YieldDistributionResult {
            treasury_id,
            total_amount,
            distribution_timestamp: chrono::Utc::now().timestamp() as u64,
        };
        
        Ok(result)
    }
    
    /// Calculate yield amount for a token holder
    pub async fn calculate_yield_amount(&self, holder: Address) -> Result<U256, Error> {
        let amount = self.client.call_contract::<U256>(
            self.contract_address,
            "calculateYieldAmount(address)",
            vec![holder.into()],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(amount)
    }
    
    /// Process maturity of the treasury
    pub async fn process_maturity(&self) -> Result<bool, Error> {
        let receipt = self.client.send_transaction(
            self.contract_address,
            "processMaturity()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        // Check if the transaction was successful
        if !receipt.status {
            return Err(Error::ContractInteraction("Maturity processing failed".into()));
        }
        
        Ok(true)
    }
    
    /// Redeem tokens at maturity
    pub async fn redeem(&self, amount: U256) -> Result<bool, Error> {
        let receipt = self.client.send_transaction(
            self.contract_address,
            "redeem(uint256)",
            vec![amount.into()],
        ).await.map_err(Error::EthereumClient)?;
        
        // Check if the transaction was successful
        if !receipt.status {
            return Err(Error::ContractInteraction("Redemption failed".into()));
        }
        
        Ok(true)
    }
    
    /// Issue new tokens (restricted to issuer)
    pub async fn issue(&self, to: Address, amount: U256) -> Result<bool, Error> {
        let receipt = self.client.send_transaction(
            self.contract_address,
            "issue(address,uint256)",
            vec![
                to.into(),
                amount.into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        // Check if the transaction was successful
        if !receipt.status {
            return Err(Error::ContractInteraction("Token issuance failed".into()));
        }
        
        Ok(true)
    }
    
    /// Set smart account code (EIP-7702)
    pub async fn set_account_code(&self, code: Vec<u8>) -> Result<bool, Error> {
        let receipt = self.client.send_transaction(
            self.contract_address,
            "setAccountCode(bytes)",
            vec![Bytes::from(code).into()],
        ).await.map_err(Error::EthereumClient)?;
        
        // Check if the transaction was successful
        if !receipt.status {
            return Err(Error::ContractInteraction("Setting account code failed".into()));
        }
        
        Ok(true)
    }
    
    /// Execute smart account logic
    pub async fn execute_account_code(&self, data: Vec<u8>) -> Result<AccountExecutionResult, Error> {
        let receipt = self.client.send_transaction(
            self.contract_address,
            "executeAccountCode(bytes)",
            vec![Bytes::from(data).into()],
        ).await.map_err(Error::EthereumClient)?;
        
        // Check if the transaction was successful
        if !receipt.status {
            return Err(Error::ContractInteraction("Account code execution failed".into()));
        }
        
        // Extract result from logs or receipt
        // In a real implementation, we would parse the AccountCodeExecuted event
        // For now, we'll create a simulated result
        
        let result = AccountExecutionResult {
            success: true,
            result_data: receipt.logs.first()
                .map(|log| log.data.clone())
                .unwrap_or_default(),
        };
        
        Ok(result)
    }
    
    /// Validate BLS signature for institutional operations (EIP-2537)
    pub async fn validate_bls_signature(
        &self,
        signature: Vec<u8>,
        message: Vec<u8>,
        public_key: Vec<u8>,
    ) -> Result<bool, Error> {
        let is_valid = self.client.call_contract::<bool>(
            self.contract_address,
            "validateBLSSignature(bytes,bytes,bytes)",
            vec![
                Bytes::from(signature).into(),
                Bytes::from(message).into(),
                Bytes::from(public_key).into(),
            ],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(is_valid)
    }
    
    /// Check if the token has matured
    pub async fn has_matured(&self) -> Result<bool, Error> {
        let maturity_date = self.client.call_contract::<u64>(
            self.contract_address,
            "maturityDate()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        // Compare with current timestamp
        let current_time = chrono::Utc::now().timestamp() as u64;
        
        Ok(current_time >= maturity_date)
    }
    
    /// Get next yield distribution time
    pub async fn get_next_yield_distribution(&self) -> Result<u64, Error> {
        let last_distribution = self.client.call_contract::<u64>(
            self.contract_address,
            "lastYieldDistribution()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        let interval = self.client.call_contract::<u64>(
            self.contract_address,
            "yieldDistributionInterval()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        let next_distribution = last_distribution + interval;
        
        Ok(next_distribution)
    }
    
    /// Check if account has smart account code
    pub async fn has_account_code(&self, account: Address) -> Result<bool, Error> {
        let has_code = self.client.call_contract::<bool>(
            self.contract_address,
            "hasCode()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(has_code)
    }
    
    /// Get the hash of the account code
    pub async fn get_code_hash(&self) -> Result<H256, Error> {
        let code_hash = self.client.call_contract::<H256>(
            self.contract_address,
            "getCodeHash()",
            vec![],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(code_hash)
    }
    
    /// Validate an execution would succeed without executing it
    pub async fn validate_execution(&self, data: Vec<u8>) -> Result<bool, Error> {
        let would_succeed = self.client.call_contract::<bool>(
            self.contract_address,
            "validateExecution(bytes)",
            vec![Bytes::from(data).into()],
        ).await.map_err(Error::EthereumClient)?;
        
        Ok(would_succeed)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use alloy_primitives::U256;
    
    // These tests are commented out as they require a running Ethereum node
    // with the appropriate contracts deployed.
    
    /*
    #[tokio::test]
    async fn test_get_token_info() {
        // Setup
        let client = Arc::new(
            EthereumClient::new(
                "http://localhost:8545",
                "0x1234567890123456789012345678901234567890123456789012345678901234",
                1,
            ).await.unwrap()
        );
        
        let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
        let token_client = TreasuryTokenClient::new(client, address).await;
        
        // Test
        let info = token_client.get_token_info().await.unwrap();
        
        // Verify
        assert_eq!(info.name, "Test Treasury Token");
        assert_eq!(info.symbol, "TTT");
        assert_eq!(info.decimals, 18);
        assert!(info.total_supply > U256::ZERO);
    }
    
    #[tokio::test]
    async fn test_balance_of() {
        // Setup
        let client = Arc::new(
            EthereumClient::new(
                "http://localhost:8545",
                "0x1234567890123456789012345678901234567890123456789012345678901234",
                1,
            ).await.unwrap()
        );
        
        let address = Address::from_str("0x1234567890123456789012345678901234567890").unwrap();
        let token_client = TreasuryTokenClient::new(client, address).await;
        
        let user_address = Address::from_str("0x0987654321098765432109876543210987654321").unwrap();
        
        // Test
        let balance = token_client.balance_of(user_address).await.unwrap();
        
        // Verify
        assert!(balance >= U256::ZERO);
    }
    */
} 