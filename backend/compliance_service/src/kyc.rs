use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Duration;
use anyhow::Result;
use chrono::{DateTime, Utc};
use reqwest::{Client, StatusCode};
use tracing::{info, warn, error};
use uuid::Uuid;

// ============ KYC Provider Trait ============

#[async_trait]
pub trait KycProvider: Send + Sync {
    async fn verify_identity(&self, params: KycParams) -> Result<KycResult>;
    async fn check_status(&self, verification_id: String) -> Result<KycStatus>;
    async fn upload_document(&self, document: Vec<u8>, doc_type: &str) -> Result<String>;
}

// ============ Data Structures ============

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KycParams {
    pub investor_id: String,
    pub document_type: String,
    pub country: String,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KycResult {
    pub verification_id: String,
    pub verified: bool,
    pub kyc_level: u8, // 0: None, 1: Basic, 2: Enhanced, 3: Institutional
    pub reason: Option<String>,
    pub checks: Vec<KycCheck>,
    pub timestamp: DateTime<Utc>,
    pub expiry: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KycCheck {
    pub check_type: String,
    pub passed: bool,
    pub details: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum KycStatus {
    Pending,
    InProgress,
    Completed,
    Failed,
    Expired,
}

// ============ Jumio Client Implementation ============

pub struct JumioClient {
    api_key: String,
    api_secret: String,
    base_url: String,
    client: Client,
}

impl JumioClient {
    pub fn new(api_key: String, api_secret: String) -> Self {
        Self {
            api_key,
            api_secret,
            base_url: "https://netverify.com/api/v4".to_string(),
            client: Client::builder()
                .timeout(Duration::from_secs(30))
                .build()
                .unwrap(),
        }
    }
    
    async fn retry_request<T>(&self, request: reqwest::RequestBuilder) -> Result<T>
    where
        T: serde::de::DeserializeOwned,
    {
        let mut retries = 0;
        let max_retries = 3;
        
        loop {
            let req = request.try_clone().ok_or_else(|| anyhow::anyhow!("Failed to clone request"))?;
            match req.send().await {
                Ok(response) if response.status().is_success() => {
                    return response.json::<T>().await.map_err(Into::into);
                }
                Ok(response) => {
                    let status = response.status();
                    let body = response.text().await.unwrap_or_default();
                    if retries < max_retries {
                        let delay = Duration::from_secs(2u64.pow(retries));
                        warn!("Request failed with status {}, retrying in {:?}: {}", status, delay, body);
                        tokio::time::sleep(delay).await;
                        retries += 1;
                    } else {
                        return Err(anyhow::anyhow!("Request failed after {} retries: {}", max_retries, body));
                    }
                }
                Err(e) if retries < max_retries => {
                    let delay = Duration::from_secs(2u64.pow(retries));
                    warn!("Request error, retrying in {:?}: {}", delay, e);
                    tokio::time::sleep(delay).await;
                    retries += 1;
                }
                Err(e) => return Err(e.into()),
            }
        }
    }
}

#[async_trait]
impl KycProvider for JumioClient {
    async fn verify_identity(&self, params: KycParams) -> Result<KycResult> {
        info!("Initiating Jumio KYC verification for investor: {}", params.investor_id);
        
        // Create verification request
        let verification_id = Uuid::new_v4().to_string();
        
        let request_body = serde_json::json!({
            "customerInternalReference": params.investor_id,
            "userReference": verification_id,
            "reportingCriteria": {
                "country": params.country,
                "idType": params.document_type
            }
        });
        
        let response = self.client
            .post(&format!("{}/initiateNetverify", self.base_url))
            .basic_auth(&self.api_key, Some(&self.api_secret))
            .json(&request_body)
            .send()
            .await?;
        
        let status = response.status();
        let body = response.text().await?;
        
        if status != StatusCode::OK {
            error!("Jumio API error: {}", body);
            return Ok(KycResult {
                verification_id,
                verified: false,
                kyc_level: 0,
                reason: Some(format!("Jumio verification failed: {}", body)),
                checks: vec![],
                timestamp: Utc::now(),
                expiry: Utc::now() + chrono::Duration::days(365),
            });
        }
        
        // Parse response
        let jumio_response: JumioResponse = serde_json::from_str(&body)?;
        
        // Determine verification result
        let mut checks = vec![];
        let mut verified = true;
        
        // Document verification
        if let Some(doc_status) = jumio_response.document_status {
            let passed = doc_status == "APPROVED";
            verified = verified && passed;
            checks.push(KycCheck {
                check_type: "document_verification".to_string(),
                passed,
                details: Some(doc_status),
            });
        }
        
        // Identity verification
        if let Some(identity_status) = jumio_response.identity_verification {
            let passed = identity_status == "APPROVED";
            verified = verified && passed;
            checks.push(KycCheck {
                check_type: "identity_verification".to_string(),
                passed,
                details: Some(identity_status),
            });
        }
        
        // Determine KYC level
        let kyc_level = if verified {
            if checks.len() >= 2 {
                2 // Enhanced
            } else {
                1 // Basic
            }
        } else {
            0 // None
        };
        
        Ok(KycResult {
            verification_id: jumio_response.scan_reference.unwrap_or(verification_id),
            verified,
            kyc_level,
            reason: if !verified { Some("Verification checks failed".to_string()) } else { None },
            checks,
            timestamp: Utc::now(),
            expiry: Utc::now() + chrono::Duration::days(365),
        })
    }
    
    async fn check_status(&self, verification_id: String) -> Result<KycStatus> {
        let response = self.client
            .get(&format!("{}/retrieval/{}", self.base_url, verification_id))
            .basic_auth(&self.api_key, Some(&self.api_secret))
            .send()
            .await?;
        
        if response.status() == StatusCode::OK {
            let body = response.text().await?;
            let status_response: JumioStatusResponse = serde_json::from_str(&body)?;
            
            Ok(match status_response.status.as_str() {
                "PENDING" => KycStatus::Pending,
                "PROCESSING" => KycStatus::InProgress,
                "DONE" => KycStatus::Completed,
                "FAILED" => KycStatus::Failed,
                _ => KycStatus::Pending,
            })
        } else {
            Ok(KycStatus::Failed)
        }
    }
    
    async fn upload_document(&self, document: Vec<u8>, doc_type: &str) -> Result<String> {
        let doc_id = Uuid::new_v4().to_string();
        
        let response = self.client
            .post(&format!("{}/documents", self.base_url))
            .basic_auth(&self.api_key, Some(&self.api_secret))
            .header("Content-Type", "application/octet-stream")
            .header("X-Document-Type", doc_type)
            .body(document)
            .send()
            .await?;
        
        if response.status() == StatusCode::OK {
            Ok(doc_id)
        } else {
            Err(anyhow::anyhow!("Document upload failed"))
        }
    }
}

// ============ Onfido Client Implementation ============

pub struct OnfidoClient {
    api_token: String,
    base_url: String,
    client: Client,
}

impl OnfidoClient {
    pub fn new(api_token: String) -> Self {
        Self {
            api_token,
            base_url: "https://api.onfido.com/v3.6".to_string(),
            client: Client::builder()
                .timeout(Duration::from_secs(30))
                .build()
                .unwrap(),
        }
    }
}

#[async_trait]
impl KycProvider for OnfidoClient {
    async fn verify_identity(&self, params: KycParams) -> Result<KycResult> {
        info!("Initiating Onfido KYC verification for investor: {}", params.investor_id);
        
        // Create applicant
        let applicant_body = serde_json::json!({
            "first_name": params.metadata.get("first_name").unwrap_or(&"John".to_string()),
            "last_name": params.metadata.get("last_name").unwrap_or(&"Doe".to_string()),
            "country": params.country
        });
        
        let response = self.client
            .post(&format!("{}/applicants", self.base_url))
            .header("Authorization", format!("Token token={}", self.api_token))
            .json(&applicant_body)
            .send()
            .await?;
        
        if response.status() != StatusCode::CREATED {
            return Ok(KycResult {
                verification_id: Uuid::new_v4().to_string(),
                verified: false,
                kyc_level: 0,
                reason: Some("Failed to create Onfido applicant".to_string()),
                checks: vec![],
                timestamp: Utc::now(),
                expiry: Utc::now() + chrono::Duration::days(365),
            });
        }
        
        let applicant: OnfidoApplicant = response.json().await?;
        
        // Create check
        let check_body = serde_json::json!({
            "applicant_id": applicant.id,
            "report_names": ["document", "facial_similarity_photo"]
        });
        
        let check_response = self.client
            .post(&format!("{}/checks", self.base_url))
            .header("Authorization", format!("Token token={}", self.api_token))
            .json(&check_body)
            .send()
            .await?;
        
        if check_response.status() != StatusCode::CREATED {
            return Ok(KycResult {
                verification_id: applicant.id,
                verified: false,
                kyc_level: 0,
                reason: Some("Failed to create Onfido check".to_string()),
                checks: vec![],
                timestamp: Utc::now(),
                expiry: Utc::now() + chrono::Duration::days(365),
            });
        }
        
        let check: OnfidoCheck = check_response.json().await?;
        
        // Determine result
        let verified = check.result == Some("clear".to_string());
        let kyc_level = if verified { 2 } else { 0 };
        
        let mut checks = vec![];
        for report in check.report_ids.iter() {
            checks.push(KycCheck {
                check_type: "onfido_report".to_string(),
                passed: verified,
                details: Some(report.clone()),
            });
        }
        
        Ok(KycResult {
            verification_id: check.id,
            verified,
            kyc_level,
            reason: if !verified { Some("Onfido verification failed".to_string()) } else { None },
            checks,
            timestamp: Utc::now(),
            expiry: Utc::now() + chrono::Duration::days(365),
        })
    }
    
    async fn check_status(&self, verification_id: String) -> Result<KycStatus> {
        let response = self.client
            .get(&format!("{}/checks/{}", self.base_url, verification_id))
            .header("Authorization", format!("Token token={}", self.api_token))
            .send()
            .await?;
        
        if response.status() == StatusCode::OK {
            let check: OnfidoCheck = response.json().await?;
            
            Ok(match check.status.as_deref() {
                Some("in_progress") => KycStatus::InProgress,
                Some("complete") => KycStatus::Completed,
                Some("withdrawn") => KycStatus::Failed,
                _ => KycStatus::Pending,
            })
        } else {
            Ok(KycStatus::Failed)
        }
    }
    
    async fn upload_document(&self, _document: Vec<u8>, _doc_type: &str) -> Result<String> {
        // Onfido document upload requires multipart form
        // Implementation simplified for brevity
        Ok(Uuid::new_v4().to_string())
    }
}

// ============ Response Structures ============

#[derive(Debug, Deserialize)]
struct JumioResponse {
    scan_reference: Option<String>,
    document_status: Option<String>,
    identity_verification: Option<String>,
}

#[derive(Debug, Deserialize)]
struct JumioStatusResponse {
    status: String,
}

#[derive(Debug, Deserialize)]
struct OnfidoApplicant {
    id: String,
}

#[derive(Debug, Deserialize)]
struct OnfidoCheck {
    id: String,
    status: Option<String>,
    result: Option<String>,
    report_ids: Vec<String>,
}
