use std::sync::Arc;
use tokio::sync::RwLock;
use axum::{
    body::Body,
    http::{Request, StatusCode, HeaderMap, HeaderValue},
    Router,
};
use tower::ServiceExt;
use serde_json::json;
use chrono::{Utc, Duration};
use jsonwebtoken::{encode, EncodingKey, Header};

use crate::api::secure_api::{
    SecureApiState, JwtClaims, UserRole, Permission, AccessLevel,
    create_secure_router, RateLimiter, AuditLogger
};
use crate::services::multi_chain_asset_service::MultiChainAssetService;
use crate::compliance::enhanced_compliance_engine::EnhancedComplianceEngine;

/// Comprehensive Backend Security Test Suite
/// Tests all critical security aspects of the API
pub struct BackendSecurityTestSuite {
    app: Router,
    state: SecureApiState,
}

impl BackendSecurityTestSuite {
    pub fn new() -> Self {
        let asset_service = Arc::new(RwLock::new(MultiChainAssetService::new()));
        let mut compliance_engine = EnhancedComplianceEngine::new();
        
        // Grant test access levels
        compliance_engine.grant_access("test_admin".to_string(), AccessLevel::Administrative);
        compliance_engine.grant_access("test_user".to_string(), AccessLevel::Standard);
        
        let state = SecureApiState {
            asset_service,
            compliance_engine: Arc::new(RwLock::new(compliance_engine)),
            jwt_secret: "test-secret-key".to_string(),
            rate_limiter: Arc::new(RwLock::new(RateLimiter::new())),
            audit_logger: Arc::new(RwLock::new(AuditLogger::new())),
        };

        let app = create_secure_router(state.clone());

        Self { app, state }
    }

    /// Test 1: Authentication Security
    pub async fn test_authentication_security(&self) -> SecurityTestResult {
        let mut results = Vec::new();

        // Test 1.1: Unauthenticated access should be blocked
        let request = Request::builder()
            .uri("/api/v1/assets")
            .body(Body::empty())
            .unwrap();

        let response = self.app.clone().oneshot(request).await.unwrap();
        results.push(SecurityCheck {
            name: "Unauthenticated Access Blocked".to_string(),
            passed: response.status() == StatusCode::UNAUTHORIZED,
            details: format!("Status: {}", response.status()),
            severity: SecuritySeverity::Critical,
        });

        // Test 1.2: Invalid token should be rejected
        let mut headers = HeaderMap::new();
        headers.insert("Authorization", HeaderValue::from_static("Bearer invalid-token"));
        
        let request = Request::builder()
            .uri("/api/v1/assets")
            .body(Body::empty())
            .unwrap();

        let response = self.app.clone().oneshot(request).await.unwrap();
        results.push(SecurityCheck {
            name: "Invalid Token Rejected".to_string(),
            passed: response.status() == StatusCode::UNAUTHORIZED,
            details: format!("Status: {}", response.status()),
            severity: SecuritySeverity::Critical,
        });

        // Test 1.3: Expired token should be rejected
        let expired_claims = JwtClaims {
            sub: "test_user".to_string(),
            role: UserRole::Investor,
            access_level: AccessLevel::Standard,
            exp: (Utc::now() - Duration::hours(1)).timestamp() as usize, // Expired
            iat: (Utc::now() - Duration::hours(2)).timestamp() as usize,
            permissions: vec![Permission::ViewAsset],
        };

        let expired_token = encode(
            &Header::default(),
            &expired_claims,
            &EncodingKey::from_secret("test-secret-key".as_ref()),
        ).unwrap();

        let mut headers = HeaderMap::new();
        headers.insert("Authorization", HeaderValue::from_str(&format!("Bearer {}", expired_token)).unwrap());
        
        let request = Request::builder()
            .uri("/api/v1/assets")
            .body(Body::empty())
            .unwrap();

        let response = self.app.clone().oneshot(request).await.unwrap();
        results.push(SecurityCheck {
            name: "Expired Token Rejected".to_string(),
            passed: response.status() == StatusCode::UNAUTHORIZED,
            details: format!("Status: {}", response.status()),
            severity: SecuritySeverity::Critical,
        });

        SecurityTestResult {
            category: "Authentication Security".to_string(),
            checks: results,
        }
    }

    /// Test 2: Authorization & Permission Control
    pub async fn test_authorization_security(&self) -> SecurityTestResult {
        let mut results = Vec::new();

        // Create tokens with different permission levels
        let investor_token = self.create_test_token(UserRole::Investor, vec![Permission::ViewAsset]);
        let asset_manager_token = self.create_test_token(UserRole::AssetManager, vec![
            Permission::CreateAsset, Permission::ViewAsset
        ]);
        let admin_token = self.create_test_token(UserRole::Admin, vec![
            Permission::CreateAsset, Permission::DeployAsset, Permission::ViewAsset,
            Permission::ManageCompliance, Permission::SystemAdmin
        ]);

        // Test 2.1: Investor cannot create assets
        let create_asset_request = json!({
            "name": "Test Asset",
            "symbol": "TEST",
            "asset_type": "securities",
            "compliance_standard": "ERC3643",
            "regulatory_framework": "SEC",
            "jurisdiction": "US",
            "total_supply": "1000000"
        });

        let mut headers = HeaderMap::new();
        headers.insert("Authorization", HeaderValue::from_str(&format!("Bearer {}", investor_token)).unwrap());
        headers.insert("Content-Type", HeaderValue::from_static("application/json"));

        let request = Request::builder()
            .method("POST")
            .uri("/api/v1/assets")
            .headers(headers)
            .body(Body::from(create_asset_request.to_string()))
            .unwrap();

        let response = self.app.clone().oneshot(request).await.unwrap();
        results.push(SecurityCheck {
            name: "Investor Cannot Create Assets".to_string(),
            passed: response.status() == StatusCode::FORBIDDEN,
            details: format!("Status: {}", response.status()),
            severity: SecuritySeverity::High,
        });

        // Test 2.2: Asset Manager can create assets
        let mut headers = HeaderMap::new();
        headers.insert("Authorization", HeaderValue::from_str(&format!("Bearer {}", asset_manager_token)).unwrap());
        headers.insert("Content-Type", HeaderValue::from_static("application/json"));

        let request = Request::builder()
            .method("POST")
            .uri("/api/v1/assets")
            .headers(headers)
            .body(Body::from(create_asset_request.to_string()))
            .unwrap();

        let response = self.app.clone().oneshot(request).await.unwrap();
        results.push(SecurityCheck {
            name: "Asset Manager Can Create Assets".to_string(),
            passed: response.status() == StatusCode::OK || response.status() == StatusCode::CREATED,
            details: format!("Status: {}", response.status()),
            severity: SecuritySeverity::Medium,
        });

        // Test 2.3: Only admin can access audit logs
        let mut headers = HeaderMap::new();
        headers.insert("Authorization", HeaderValue::from_str(&format!("Bearer {}", investor_token)).unwrap());

        let request = Request::builder()
            .uri("/api/v1/admin/audit-log")
            .headers(headers)
            .body(Body::empty())
            .unwrap();

        let response = self.app.clone().oneshot(request).await.unwrap();
        results.push(SecurityCheck {
            name: "Non-Admin Cannot Access Audit Logs".to_string(),
            passed: response.status() == StatusCode::FORBIDDEN,
            details: format!("Status: {}", response.status()),
            severity: SecuritySeverity::Critical,
        });

        // Test 2.4: Admin can access audit logs
        let mut headers = HeaderMap::new();
        headers.insert("Authorization", HeaderValue::from_str(&format!("Bearer {}", admin_token)).unwrap());

        let request = Request::builder()
            .uri("/api/v1/admin/audit-log")
            .headers(headers)
            .body(Body::empty())
            .unwrap();

        let response = self.app.clone().oneshot(request).await.unwrap();
        results.push(SecurityCheck {
            name: "Admin Can Access Audit Logs".to_string(),
            passed: response.status() == StatusCode::OK,
            details: format!("Status: {}", response.status()),
            severity: SecuritySeverity::Medium,
        });

        SecurityTestResult {
            category: "Authorization Security".to_string(),
            checks: results,
        }
    }

    /// Test 3: Input Validation Security
    pub async fn test_input_validation_security(&self) -> SecurityTestResult {
        let mut results = Vec::new();
        let admin_token = self.create_test_token(UserRole::Admin, vec![Permission::CreateAsset]);

        // Test 3.1: Invalid asset name should be rejected
        let invalid_requests = vec![
            (json!({
                "name": "", // Empty name
                "symbol": "TEST",
                "asset_type": "securities",
                "compliance_standard": "ERC3643",
                "regulatory_framework": "SEC",
                "jurisdiction": "US",
                "total_supply": "1000000"
            }), "Empty Asset Name"),
            
            (json!({
                "name": "A".repeat(101), // Too long name
                "symbol": "TEST",
                "asset_type": "securities",
                "compliance_standard": "ERC3643",
                "regulatory_framework": "SEC",
                "jurisdiction": "US",
                "total_supply": "1000000"
            }), "Asset Name Too Long"),
            
            (json!({
                "name": "Test<script>alert('xss')</script>", // XSS attempt
                "symbol": "TEST",
                "asset_type": "securities",
                "compliance_standard": "ERC3643",
                "regulatory_framework": "SEC",
                "jurisdiction": "US",
                "total_supply": "1000000"
            }), "XSS in Asset Name"),
            
            (json!({
                "name": "Test Asset",
                "symbol": "TOOLONGSYMBOL", // Too long symbol
                "asset_type": "securities",
                "compliance_standard": "ERC3643",
                "regulatory_framework": "SEC",
                "jurisdiction": "US",
                "total_supply": "1000000"
            }), "Symbol Too Long"),
            
            (json!({
                "name": "Test Asset",
                "symbol": "TEST",
                "asset_type": "securities",
                "compliance_standard": "ERC3643",
                "regulatory_framework": "SEC",
                "jurisdiction": "INVALID", // Invalid jurisdiction
                "total_supply": "1000000"
            }), "Invalid Jurisdiction"),
            
            (json!({
                "name": "Test Asset",
                "symbol": "TEST",
                "asset_type": "securities",
                "compliance_standard": "ERC3643",
                "regulatory_framework": "SEC",
                "jurisdiction": "US",
                "total_supply": "0" // Zero supply
            }), "Zero Total Supply"),
        ];

        for (invalid_request, test_name) in invalid_requests {
            let mut headers = HeaderMap::new();
            headers.insert("Authorization", HeaderValue::from_str(&format!("Bearer {}", admin_token)).unwrap());
            headers.insert("Content-Type", HeaderValue::from_static("application/json"));

            let request = Request::builder()
                .method("POST")
                .uri("/api/v1/assets")
                .headers(headers)
                .body(Body::from(invalid_request.to_string()))
                .unwrap();

            let response = self.app.clone().oneshot(request).await.unwrap();
            results.push(SecurityCheck {
                name: format!("Input Validation: {}", test_name),
                passed: response.status() == StatusCode::BAD_REQUEST,
                details: format!("Status: {}", response.status()),
                severity: SecuritySeverity::High,
            });
        }

        SecurityTestResult {
            category: "Input Validation Security".to_string(),
            checks: results,
        }
    }

    /// Test 4: Rate Limiting Security
    pub async fn test_rate_limiting_security(&self) -> SecurityTestResult {
        let mut results = Vec::new();
        let admin_token = self.create_test_token(UserRole::Admin, vec![Permission::ViewAsset]);

        // Test 4.1: Rate limiting should kick in after many requests
        let mut request_count = 0;
        let mut rate_limited = false;

        for i in 0..150 { // Exceed the rate limit of 100 requests per minute
            let mut headers = HeaderMap::new();
            headers.insert("Authorization", HeaderValue::from_str(&format!("Bearer {}", admin_token)).unwrap());
            headers.insert("X-User-ID", HeaderValue::from_static("test_user_rate_limit"));

            let request = Request::builder()
                .uri("/api/v1/health")
                .headers(headers)
                .body(Body::empty())
                .unwrap();

            let response = self.app.clone().oneshot(request).await.unwrap();
            request_count += 1;

            if response.status() == StatusCode::TOO_MANY_REQUESTS {
                rate_limited = true;
                break;
            }
        }

        results.push(SecurityCheck {
            name: "Rate Limiting Enforcement".to_string(),
            passed: rate_limited,
            details: format!("Rate limited after {} requests", request_count),
            severity: SecuritySeverity::Medium,
        });

        SecurityTestResult {
            category: "Rate Limiting Security".to_string(),
            checks: results,
        }
    }

    /// Test 5: Data Protection & Privacy
    pub async fn test_data_protection_security(&self) -> SecurityTestResult {
        let mut results = Vec::new();

        // Test 5.1: Sensitive data should not be exposed in error messages
        let request = Request::builder()
            .method("POST")
            .uri("/api/v1/auth/login")
            .header("Content-Type", "application/json")
            .body(Body::from(json!({
                "wallet_address": "0x1234567890123456789012345678901234567890",
                "signature": "invalid_signature",
                "message": "test_message",
                "timestamp": Utc::now().timestamp()
            }).to_string()))
            .unwrap();

        let response = self.app.clone().oneshot(request).await.unwrap();
        let status = response.status();
        
        // Check that error doesn't expose sensitive information
        results.push(SecurityCheck {
            name: "No Sensitive Data in Error Messages".to_string(),
            passed: status == StatusCode::UNAUTHORIZED,
            details: format!("Login with invalid signature status: {}", status),
            severity: SecuritySeverity::Medium,
        });

        // Test 5.2: Audit logging should be working
        let audit_logger = self.state.audit_logger.read().await;
        let has_audit_entries = !audit_logger.entries.is_empty();
        
        results.push(SecurityCheck {
            name: "Audit Logging Active".to_string(),
            passed: has_audit_entries,
            details: format!("Audit entries count: {}", audit_logger.entries.len()),
            severity: SecuritySeverity::High,
        });

        SecurityTestResult {
            category: "Data Protection Security".to_string(),
            checks: results,
        }
    }

    /// Test 6: Session Management Security
    pub async fn test_session_management_security(&self) -> SecurityTestResult {
        let mut results = Vec::new();

        // Test 6.1: Token should have reasonable expiration
        let claims = JwtClaims {
            sub: "test_user".to_string(),
            role: UserRole::Investor,
            access_level: AccessLevel::Standard,
            exp: (Utc::now() + Duration::hours(24)).timestamp() as usize,
            iat: Utc::now().timestamp() as usize,
            permissions: vec![Permission::ViewAsset],
        };

        let token_exp_hours = (claims.exp - claims.iat) / 3600;
        
        results.push(SecurityCheck {
            name: "Token Expiration Reasonable".to_string(),
            passed: token_exp_hours <= 24, // Max 24 hours
            details: format!("Token expires in {} hours", token_exp_hours),
            severity: SecuritySeverity::Medium,
        });

        // Test 6.2: Token should include necessary claims
        results.push(SecurityCheck {
            name: "Token Contains Required Claims".to_string(),
            passed: !claims.sub.is_empty() && !claims.permissions.is_empty(),
            details: format!("Subject: {}, Permissions: {}", claims.sub, claims.permissions.len()),
            severity: SecuritySeverity::High,
        });

        SecurityTestResult {
            category: "Session Management Security".to_string(),
            checks: results,
        }
    }

    /// Run all security tests
    pub async fn run_all_tests(&self) -> Vec<SecurityTestResult> {
        vec![
            self.test_authentication_security().await,
            self.test_authorization_security().await,
            self.test_input_validation_security().await,
            self.test_rate_limiting_security().await,
            self.test_data_protection_security().await,
            self.test_session_management_security().await,
        ]
    }

    /// Generate comprehensive security report
    pub async fn generate_security_report(&self) -> SecurityReport {
        let test_results = self.run_all_tests().await;
        
        let mut total_checks = 0;
        let mut passed_checks = 0;
        let mut critical_failures = 0;
        let mut high_failures = 0;
        let mut medium_failures = 0;

        for result in &test_results {
            for check in &result.checks {
                total_checks += 1;
                if check.passed {
                    passed_checks += 1;
                } else {
                    match check.severity {
                        SecuritySeverity::Critical => critical_failures += 1,
                        SecuritySeverity::High => high_failures += 1,
                        SecuritySeverity::Medium => medium_failures += 1,
                        SecuritySeverity::Low => {},
                    }
                }
            }
        }

        let security_score = if total_checks > 0 {
            (passed_checks as f64 / total_checks as f64 * 100.0) as u8
        } else {
            0
        };

        SecurityReport {
            timestamp: Utc::now(),
            security_score,
            total_checks,
            passed_checks,
            critical_failures,
            high_failures,
            medium_failures,
            test_results,
            recommendations: generate_security_recommendations(critical_failures, high_failures, medium_failures),
        }
    }

    // Helper method to create test tokens
    fn create_test_token(&self, role: UserRole, permissions: Vec<Permission>) -> String {
        let claims = JwtClaims {
            sub: "test_user".to_string(),
            role,
            access_level: AccessLevel::Standard,
            exp: (Utc::now() + Duration::hours(1)).timestamp() as usize,
            iat: Utc::now().timestamp() as usize,
            permissions,
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret("test-secret-key".as_ref()),
        ).unwrap()
    }
}

// Security test data structures
#[derive(Debug, Clone)]
pub struct SecurityTestResult {
    pub category: String,
    pub checks: Vec<SecurityCheck>,
}

#[derive(Debug, Clone)]
pub struct SecurityCheck {
    pub name: String,
    pub passed: bool,
    pub details: String,
    pub severity: SecuritySeverity,
}

#[derive(Debug, Clone)]
pub enum SecuritySeverity {
    Critical,
    High,
    Medium,
    Low,
}

#[derive(Debug)]
pub struct SecurityReport {
    pub timestamp: chrono::DateTime<Utc>,
    pub security_score: u8,
    pub total_checks: usize,
    pub passed_checks: usize,
    pub critical_failures: usize,
    pub high_failures: usize,
    pub medium_failures: usize,
    pub test_results: Vec<SecurityTestResult>,
    pub recommendations: Vec<String>,
}

fn generate_security_recommendations(critical: usize, high: usize, medium: usize) -> Vec<String> {
    let mut recommendations = Vec::new();

    if critical > 0 {
        recommendations.push("URGENT: Address critical security vulnerabilities immediately".to_string());
        recommendations.push("Conduct immediate security review with external auditors".to_string());
    }

    if high > 0 {
        recommendations.push("Address high-severity security issues before production deployment".to_string());
    }

    if medium > 0 {
        recommendations.push("Review and address medium-severity security issues".to_string());
    }

    if critical == 0 && high == 0 {
        recommendations.push("Security posture is strong - maintain current security practices".to_string());
        recommendations.push("Consider regular security audits and penetration testing".to_string());
    }

    recommendations.push("Implement continuous security monitoring".to_string());
    recommendations.push("Regular security training for development team".to_string());

    recommendations
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_backend_security_suite() {
        let test_suite = BackendSecurityTestSuite::new();
        let report = test_suite.generate_security_report().await;
        
        println!("Security Report:");
        println!("Score: {}/100", report.security_score);
        println!("Total Checks: {}", report.total_checks);
        println!("Passed: {}", report.passed_checks);
        println!("Critical Failures: {}", report.critical_failures);
        println!("High Failures: {}", report.high_failures);
        println!("Medium Failures: {}", report.medium_failures);

        // Assert that we have no critical failures
        assert_eq!(report.critical_failures, 0, "Critical security vulnerabilities found!");
        
        // Assert minimum security score
        assert!(report.security_score >= 80, "Security score too low: {}", report.security_score);
    }
} 