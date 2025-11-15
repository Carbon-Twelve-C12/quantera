use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use anyhow::Result;
use base64;
use futures::TryStreamExt;
use ipfs_api_backend_hyper::{IpfsApi, IpfsClient as HyperIpfsClient, TryFromUri};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::io::Cursor;
use tracing::{info, debug, error};

// ============ IPFS Client ============

pub struct IpfsClient {
    client: HyperIpfsClient,
    cipher: Aes256Gcm,
    encryption_key: Vec<u8>,
}

impl IpfsClient {
    pub fn new(api_url: &str, encryption_key: Vec<u8>) -> Result<Self> {
        // Validate encryption key
        if encryption_key.len() != 32 {
            return Err(anyhow::anyhow!("Encryption key must be 32 bytes"));
        }
        
        // Create IPFS client
        let client = HyperIpfsClient::from_str(api_url)?;
        
        // Create cipher
        let key = aes_gcm::Key::<Aes256Gcm>::from_slice(&encryption_key);
        let cipher = Aes256Gcm::new(key);
        
        Ok(Self {
            client,
            cipher,
            encryption_key,
        })
    }
    
    /// Upload encrypted data to IPFS
    pub async fn upload_encrypted(&self, data: Vec<u8>) -> Result<String> {
        debug!("Encrypting {} bytes of data for IPFS upload", data.len());
        
        // Generate random nonce (12 bytes for AES-GCM)
        let mut nonce_bytes = [0u8; 12];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);
        
        // Encrypt data
        let ciphertext = self.cipher
            .encrypt(nonce, data.as_ref())
            .map_err(|e| anyhow::anyhow!("Encryption failed: {}", e))?;
        
        // Create encrypted payload with nonce prepended
        let mut encrypted_payload = Vec::new();
        encrypted_payload.extend_from_slice(&nonce_bytes);
        encrypted_payload.extend_from_slice(&ciphertext);
        
        // Calculate checksum
        let mut hasher = Sha256::new();
        hasher.update(&data);
        let checksum = hasher.finalize();
        
        // Create metadata
        let metadata = DocumentMetadata {
            version: 1,
            encrypted: true,
            checksum: hex::encode(checksum),
            size: data.len(),
            timestamp: chrono::Utc::now(),
        };
        
        // Create final document structure
        let document = EncryptedDocument {
            metadata,
            payload: base64::encode(&encrypted_payload),
        };
        
        // Serialize to JSON
        let json_data = serde_json::to_vec(&document)?;
        
        // Upload to IPFS
        let res = self.client
            .add(Cursor::new(json_data))
            .await
            .map_err(|e| anyhow::anyhow!("IPFS upload failed: {}", e))?;
        
        let hash = res.hash;
        
        // Pin the content
        self.client
            .pin_add(&hash, false)
            .await
            .map_err(|e| anyhow::anyhow!("IPFS pinning failed: {}", e))?;
        
        info!("Document uploaded to IPFS: {}", hash);
        
        Ok(hash)
    }
    
    /// Download and decrypt data from IPFS
    pub async fn download_encrypted(&self, hash: &str) -> Result<Vec<u8>> {
        debug!("Downloading encrypted document from IPFS: {}", hash);
        
        // Download from IPFS
        let stream = self.client
            .cat(hash)
            .map_err(|e| anyhow::anyhow!("IPFS download failed: {}", e));
            
        let mut data = Vec::new();
        let mut stream = Box::pin(stream);
        while let Some(chunk) = stream.try_next().await? {
            data.extend_from_slice(&chunk);
        }
        
        // Parse JSON
        let document: EncryptedDocument = serde_json::from_slice(&data)?;
        
        // Decode base64 payload
        let encrypted_payload = base64::decode(&document.payload)?;
        
        // Extract nonce and ciphertext
        if encrypted_payload.len() < 12 {
            return Err(anyhow::anyhow!("Invalid encrypted payload"));
        }
        
        let (nonce_bytes, ciphertext) = encrypted_payload.split_at(12);
        let nonce = Nonce::from_slice(nonce_bytes);
        
        // Decrypt
        let plaintext = self.cipher
            .decrypt(nonce, ciphertext.as_ref())
            .map_err(|e| anyhow::anyhow!("Decryption failed: {}", e))?;
        
        // Verify checksum
        let mut hasher = Sha256::new();
        hasher.update(&plaintext);
        let checksum = hex::encode(hasher.finalize());
        
        if checksum != document.metadata.checksum {
            return Err(anyhow::anyhow!("Checksum verification failed"));
        }
        
        info!("Document downloaded and decrypted successfully");
        
        Ok(plaintext)
    }
    
    /// Upload unencrypted public data to IPFS
    pub async fn upload_public(&self, data: Vec<u8>) -> Result<String> {
        debug!("Uploading {} bytes of public data to IPFS", data.len());
        
        let res = self.client
            .add(Cursor::new(data))
            .await
            .map_err(|e| anyhow::anyhow!("IPFS upload failed: {}", e))?;
        
        let hash = res.hash;
        
        // Pin the content
        self.client
            .pin_add(&hash, false)
            .await
            .map_err(|e| anyhow::anyhow!("IPFS pinning failed: {}", e))?;
        
        info!("Public document uploaded to IPFS: {}", hash);
        
        Ok(hash)
    }
    
    /// List pinned documents
    pub async fn list_pinned(&self) -> Result<Vec<String>> {
        let pins = self.client
            .pin_ls(None, None)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to list pins: {}", e))?;
        
        Ok(pins.keys.into_keys().collect())
    }
    
    /// Unpin a document
    pub async fn unpin(&self, hash: &str) -> Result<()> {
        self.client
            .pin_rm(hash, false)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to unpin: {}", e))?;
        
        info!("Document unpinned from IPFS: {}", hash);
        Ok(())
    }
    
    /// Get IPFS node info
    pub async fn node_info(&self) -> Result<NodeInfo> {
        let id = self.client
            .id(None)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to get node ID: {}", e))?;
        
        let version = self.client
            .version()
            .await
            .map_err(|e| anyhow::anyhow!("Failed to get version: {}", e))?;
        
        Ok(NodeInfo {
            peer_id: id.id,
            version: version.version,
            protocol_version: version.repo.to_string(),
            agent_version: id.agent_version,
            addresses: id.addresses,
        })
    }
}

// ============ Data Structures ============

#[derive(Debug, Serialize, Deserialize)]
struct EncryptedDocument {
    metadata: DocumentMetadata,
    payload: String, // Base64 encoded encrypted data
}

#[derive(Debug, Serialize, Deserialize)]
struct DocumentMetadata {
    version: u32,
    encrypted: bool,
    checksum: String,
    size: usize,
    timestamp: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
pub struct NodeInfo {
    pub peer_id: String,
    pub version: String,
    pub protocol_version: String,
    pub agent_version: String,
    pub addresses: Vec<String>,
}

// ============ Document Types ============

#[derive(Debug, Serialize, Deserialize)]
pub struct ComplianceDocument {
    pub document_type: DocumentType,
    pub investor_address: String,
    pub jurisdiction: String,
    pub content: Vec<u8>,
    pub mime_type: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub expiry: Option<chrono::DateTime<chrono::Utc>>,
    pub verified: bool,
    pub verifier: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum DocumentType {
    Passport,
    DriverLicense,
    ProofOfAddress,
    BankStatement,
    TaxDocument,
    AccreditationCertificate,
    ComplianceReport,
    Other(String),
}
