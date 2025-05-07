use crate::{
    UserService,
    Error as ServiceError,
};
use alloy_primitives::{Address, U256, H256};
use ethereum_client::EthereumClient;
use std::sync::Arc;
use std::collections::HashMap;
use serde::{Serialize, Deserialize};
use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey};
use chrono::{Utc, Duration};
use tracing::{info, debug, warn, error};
use rand::random;
use std::time::SystemTime;

/// Authentication method
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum AuthMethod {
    Wallet,
    Password,
    TwoFactor,
    SmartAccount,
}

/// Authentication request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthRequest {
    pub wallet_address: Address,
    pub signature: Option<String>,
    pub password: Option<String>,
    pub two_factor_code: Option<String>,
    pub auth_method: AuthMethod,
}

/// Authentication challenge
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthChallenge {
    pub wallet_address: Address,
    pub challenge: String,
    pub expires_at: u64,
}

/// JWT claims
#[derive(Debug, Serialize, Deserialize)]
pub struct JwtClaims {
    pub sub: String,           // Subject (wallet address)
    pub iss: String,           // Issuer
    pub exp: u64,              // Expiration time
    pub iat: u64,              // Issued at
    pub role: String,          // User role
    pub institutional: bool,   // Is institutional user
    pub verified: bool,        // Is verified user
}

/// Authentication result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthResult {
    pub wallet_address: Address,
    pub token: String,
    pub expires_at: u64,
    pub role: String,
    pub is_institutional: bool,
    pub is_verified: bool,
}

/// Token validation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenValidationResult {
    pub is_valid: bool,
    pub wallet_address: Option<Address>,
    pub role: Option<String>,
    pub error_message: Option<String>,
}

/// Two-factor setup result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TwoFactorSetupResult {
    pub wallet_address: Address,
    pub setup_code: String,
    pub qr_code_url: String,
    pub recovery_codes: Vec<String>,
    pub success: bool,
}

/// Authentication service
pub struct AuthenticationService {
    user_service: Arc<UserService>,
    ethereum_client: Arc<EthereumClient>,
    jwt_secret: String,
    challenge_map: tokio::sync::Mutex<HashMap<Address, AuthChallenge>>,
    token_blacklist: tokio::sync::Mutex<HashMap<String, u64>>, // Token -> Expiration time
}

impl AuthenticationService {
    /// Create a new AuthenticationService
    pub async fn new(
        user_service: Arc<UserService>,
        ethereum_client: Arc<EthereumClient>,
        jwt_secret: String,
    ) -> Self {
        Self {
            user_service,
            ethereum_client,
            jwt_secret,
            challenge_map: tokio::sync::Mutex::new(HashMap::new()),
            token_blacklist: tokio::sync::Mutex::new(HashMap::new()),
        }
    }
    
    /// Generate a new authentication challenge for a wallet
    pub async fn generate_challenge(
        &self,
        wallet_address: Address,
    ) -> Result<AuthChallenge, ServiceError> {
        // Create a random challenge for the wallet to sign
        // In a real implementation, this would include more entropy and security measures
        // The challenge would also be stored in a database with an expiration time
        let random_value: u64 = random();
        let timestamp = SystemTime::now().duration_since(SystemTime::UNIX_EPOCH)
            .map_err(|e| ServiceError::Internal(format!("Failed to get system time: {}", e)))?.as_secs();
        
        // Format the challenge message
        let challenge = format!(
            "Sign this message to authenticate with Quantera Platform.\nWallet: {}\nNonce: {}\nTimestamp: {}",
            wallet_address, random_value, timestamp
        );
        
        // Set expiration time (5 minutes from now)
        let expires_at = Utc::now().timestamp() as u64 + 300; // 5 minutes
        
        // Create the challenge object
        let auth_challenge = AuthChallenge {
            wallet_address,
            challenge,
            expires_at,
        };
        
        // Store the challenge in our map
        let mut challenges = self.challenge_map.lock().await;
        challenges.insert(wallet_address, auth_challenge.clone());
        
        Ok(auth_challenge)
    }
    
    /// Verify a wallet signature against a challenge
    pub async fn verify_wallet_signature(
        &self,
        wallet_address: Address,
        signature: &str,
    ) -> Result<bool, ServiceError> {
        // Get the stored challenge for this wallet
        let challenges = self.challenge_map.lock().await;
        let challenge = match challenges.get(&wallet_address) {
            Some(c) => c.clone(),
            None => return Err(ServiceError::NotFound("Authentication challenge not found".into())),
        };
        
        // Check if the challenge has expired
        let now = Utc::now().timestamp() as u64;
        if now > challenge.expires_at {
            return Err(ServiceError::InvalidState("Authentication challenge has expired".into()));
        }
        
        // Verify the signature using the Ethereum client
        let is_valid = self.ethereum_client.verify_signature(wallet_address, &challenge.challenge, signature).await
            .map_err(|e| ServiceError::EthereumClient(e))?;
        
        Ok(is_valid)
    }
    
    /// Authenticate a user
    pub async fn authenticate(
        &self,
        auth_request: AuthRequest,
    ) -> Result<AuthResult, ServiceError> {
        let wallet_address = auth_request.wallet_address;
        
        info!("Authenticating user: {:?} using method: {:?}", wallet_address, auth_request.auth_method);
        
        // Check authentication method and verify accordingly
        let mut authenticated = false;
        
        match auth_request.auth_method {
            AuthMethod::Wallet => {
                // Wallet signature authentication
                if let Some(signature) = auth_request.signature {
                    authenticated = self.verify_wallet_signature(wallet_address, &signature).await?;
                } else {
                    return Err(ServiceError::InvalidParameter("Signature required for wallet authentication".into()));
                }
            },
            AuthMethod::Password => {
                // Password authentication - not implemented in this example
                // In a real implementation, this would verify the password against a stored hash
                return Err(ServiceError::Unimplemented("Password authentication not implemented".into()));
            },
            AuthMethod::TwoFactor => {
                // Two-factor authentication - not implemented in this example
                // In a real implementation, this would verify both wallet signature and 2FA code
                return Err(ServiceError::Unimplemented("Two-factor authentication not implemented".into()));
            },
            AuthMethod::SmartAccount => {
                // Smart account authentication
                // Check if the user has a smart account enabled
                let has_smart_account = self.user_service.is_smart_account_enabled(wallet_address).await?;
                
                if !has_smart_account {
                    return Err(ServiceError::InvalidState("Smart account not enabled for this wallet".into()));
                }
                
                // In a real implementation, we would verify a smart account operation
                // For now, we'll just check if the wallet has a valid signature
                if let Some(signature) = auth_request.signature {
                    authenticated = self.verify_wallet_signature(wallet_address, &signature).await?;
                } else {
                    return Err(ServiceError::InvalidParameter("Signature required for smart account authentication".into()));
                }
            },
        }
        
        if !authenticated {
            return Err(ServiceError::Unauthorized("Authentication failed".into()));
        }
        
        // Get user verification status to determine role
        let user_status = self.user_service.get_user_verification_status(wallet_address).await?;
        
        // Determine the user's role based on status and type
        let role = if user_status.institutional_details.is_some() {
            "institution"
        } else if user_status.status == crate::VerificationStatus::Verified {
            "verified_user"
        } else {
            "user"
        };
        
        // Generate JWT token
        let token_expiry = Utc::now() + Duration::hours(24);
        let claims = JwtClaims {
            sub: format!("{:?}", wallet_address),
            iss: "Quantera Platform".to_string(),
            exp: token_expiry.timestamp() as u64,
            iat: Utc::now().timestamp() as u64,
            role: role.to_string(),
            institutional: user_status.institutional_details.is_some(),
            verified: user_status.status == crate::VerificationStatus::Verified,
        };
        
        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.jwt_secret.as_bytes()),
        ).map_err(|e| ServiceError::Internal(format!("Failed to generate JWT token: {}", e)))?;
        
        // Return authentication result
        let result = AuthResult {
            wallet_address,
            token,
            expires_at: token_expiry.timestamp() as u64,
            role: role.to_string(),
            is_institutional: user_status.institutional_details.is_some(),
            is_verified: user_status.status == crate::VerificationStatus::Verified,
        };
        
        Ok(result)
    }
    
    /// Validate a JWT token
    pub fn validate_token(&self, token: &str) -> TokenValidationResult {
        // Set up validation parameters
        let validation = Validation::default();
        
        // Attempt to decode and validate the token
        let token_data = match decode::<JwtClaims>(
            token,
            &DecodingKey::from_secret(self.jwt_secret.as_bytes()),
            &validation,
        ) {
            Ok(data) => data,
            Err(e) => {
                return TokenValidationResult {
                    is_valid: false,
                    wallet_address: None,
                    role: None,
                    error_message: Some(format!("Token validation error: {}", e)),
                };
            }
        };
        
        // Check token in blacklist
        let in_blacklist = match tokio::runtime::Handle::current().block_on(async {
            let blacklist = self.token_blacklist.lock().await;
            blacklist.contains_key(token)
        }) {
            Ok(result) => result,
            Err(_) => return TokenValidationResult {
                is_valid: false,
                wallet_address: None,
                role: None,
                error_message: Some("Failed to check token blacklist".to_string()),
            },
        };
        
        if in_blacklist {
            return TokenValidationResult {
                is_valid: false,
                wallet_address: None,
                role: None,
                error_message: Some("Token has been revoked".to_string()),
            };
        }
        
        // Parse wallet address from subject
        let wallet_address = match Address::parse_checksummed(&token_data.claims.sub, None) {
            Ok(addr) => addr,
            Err(_) => return TokenValidationResult {
                is_valid: false,
                wallet_address: None,
                role: None,
                error_message: Some("Invalid wallet address in token".to_string()),
            },
        };
        
        // Return successful validation result
        TokenValidationResult {
            is_valid: true,
            wallet_address: Some(wallet_address),
            role: Some(token_data.claims.role),
            error_message: None,
        }
    }
    
    /// Revoke a JWT token
    pub async fn revoke_token(&self, token: &str) -> Result<bool, ServiceError> {
        // Decode token to get expiration time
        let validation = Validation::default();
        let token_data = match decode::<JwtClaims>(
            token,
            &DecodingKey::from_secret(self.jwt_secret.as_bytes()),
            &validation,
        ) {
            Ok(data) => data,
            Err(e) => {
                return Err(ServiceError::InvalidParameter(format!("Invalid token: {}", e)));
            }
        };
        
        // Add token to blacklist with its expiration time
        let mut blacklist = self.token_blacklist.lock().await;
        blacklist.insert(token.to_string(), token_data.claims.exp);
        
        // In a real implementation, we would also add this to a persistent storage
        
        Ok(true)
    }
    
    /// Set up two-factor authentication for a user
    pub async fn setup_two_factor(
        &self,
        wallet_address: Address,
    ) -> Result<TwoFactorSetupResult, ServiceError> {
        // In a real implementation, this would generate a proper TOTP setup
        // For this example, we're just creating a mock setup
        
        // Generate a mock secret key
        let secret_key = format!("MOCK_SECRET_{}", wallet_address);
        
        // Generate mock QR code URL
        let qr_code_url = format!("https://mock-qr-code.com/{}", secret_key);
        
        // Generate mock recovery codes
        let recovery_codes = vec![
            format!("RECOVERY1_{}", wallet_address),
            format!("RECOVERY2_{}", wallet_address),
            format!("RECOVERY3_{}", wallet_address),
        ];
        
        let result = TwoFactorSetupResult {
            wallet_address,
            setup_code: secret_key,
            qr_code_url,
            recovery_codes,
            success: true,
        };
        
        Ok(result)
    }
    
    /// Verify a two-factor code
    pub async fn verify_two_factor(
        &self,
        wallet_address: Address,
        code: &str,
    ) -> Result<bool, ServiceError> {
        // In a real implementation, this would verify the TOTP code
        // For this example, we'll just check if the code is non-empty
        
        if code.is_empty() {
            return Ok(false);
        }
        
        // Mock verification - always returns true for non-empty codes
        Ok(true)
    }
    
    /// Run maintenance tasks (e.g., clearing expired challenges and blacklisted tokens)
    pub async fn run_maintenance(&self) -> Result<(), ServiceError> {
        let now = Utc::now().timestamp() as u64;
        
        // Clear expired challenges
        {
            let mut challenges = self.challenge_map.lock().await;
            challenges.retain(|_, challenge| challenge.expires_at > now);
        }
        
        // Clear expired blacklisted tokens
        {
            let mut blacklist = self.token_blacklist.lock().await;
            blacklist.retain(|_, expiry| *expiry > now);
        }
        
        Ok(())
    }
} 