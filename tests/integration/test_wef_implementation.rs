use std::sync::Arc;
use tokio::sync::RwLock;
use axum::{
    body::Body,
    http::{Request, StatusCode},
    Router,
};
use tower::ServiceExt;
use serde_json::{json, Value};

// Import our modules
use crate::services::multi_chain_asset_service::{
    MultiChainAssetService, AssetType, ComplianceStandard, SupportedChain
};
use crate::compliance::enhanced_compliance_engine::{
    EnhancedComplianceEngine, InvestorProfile, InvestorType, KYCStatus, 
    AMLStatus, AccreditationStatus, RiskRating, SanctionsStatus
};
use crate::api::{ApiState, create_router};

#[tokio::test]
async fn test_multi_chain_asset_service() {
    let mut service = MultiChainAssetService::new();
    
    // Test asset creation
    let asset_id = service.create_asset(
        "Test Real Estate Token".to_string(),
        "TRET".to_string(),
        AssetType::RealEstate,
        ComplianceStandard::ERC3643,
        "SEC".to_string(),
        "US".to_string(),
        1_000_000_000_000_000_000_000, // 1000 tokens
    ).await.expect("Failed to create asset");
    
    assert!(!asset_id.is_empty());
    
    // Test asset retrieval
    let asset = service.get_asset(&asset_id).expect("Asset should exist");
    assert_eq!(asset.name, "Test Real Estate Token");
    assert_eq!(asset.symbol, "TRET");
    assert!(matches!(asset.asset_type, AssetType::RealEstate));
    
    // Test cross-chain deployment
    let target_chains = vec![SupportedChain::Ethereum, SupportedChain::Polygon];
    let deployments = service.deploy_asset_cross_chain(asset, target_chains).await
        .expect("Failed to deploy asset");
    
    assert_eq!(deployments.len(), 2);
    assert!(deployments.contains_key(&SupportedChain::Ethereum));
    assert!(deployments.contains_key(&SupportedChain::Polygon));
    
    // Test liquidity aggregation
    let liquidity = service.get_asset_liquidity_across_chains(&asset_id).await
        .expect("Failed to get liquidity");
    
    assert!(!liquidity.is_empty());
    
    // Test asset filtering
    let real_estate_assets = service.get_assets_by_type(&AssetType::RealEstate);
    assert!(!real_estate_assets.is_empty());
    
    let us_assets = service.get_assets_by_jurisdiction("US");
    assert!(!us_assets.is_empty());
}

#[tokio::test]
async fn test_enhanced_compliance_engine() {
    let mut engine = EnhancedComplianceEngine::new();
    
    // Test investor profile creation
    let investor_id = "test_investor_001".to_string();
    let profile = InvestorProfile {
        investor_id: investor_id.clone(),
        jurisdiction: "US".to_string(),
        tax_residency: vec!["US".to_string()],
        investor_type: InvestorType::AccreditedInvestor,
        kyc_status: KYCStatus::Completed,
        aml_status: AMLStatus::Clear,
        accreditation_status: AccreditationStatus::Verified,
        investment_limits: std::collections::HashMap::new(),
        last_updated: chrono::Utc::now(),
        compliance_score: 85,
        risk_rating: RiskRating::Low,
        sanctions_status: SanctionsStatus::Clear,
        cooling_periods: std::collections::HashMap::new(),
    };
    
    engine.update_investor_profile(investor_id.clone(), profile).await
        .expect("Failed to create investor profile");
    
    // Test compliance check for compliant investor
    let result = engine.comprehensive_compliance_check(
        &investor_id,
        "securities",
        1_000_000_000_000_000_000, // 1 ETH equivalent
        "US",
    ).await.expect("Failed to perform compliance check");
    
    assert!(result.is_compliant);
    assert!(result.overall_score >= 70);
    assert!(!result.checks.is_empty());
    
    // Test compliance check for non-compliant investor
    let non_compliant_id = "test_investor_002".to_string();
    let non_compliant_profile = InvestorProfile {
        investor_id: non_compliant_id.clone(),
        jurisdiction: "US".to_string(),
        tax_residency: vec!["US".to_string()],
        investor_type: InvestorType::Retail,
        kyc_status: KYCStatus::NotStarted,
        aml_status: AMLStatus::UnderReview,
        accreditation_status: AccreditationStatus::NotApplicable,
        investment_limits: std::collections::HashMap::new(),
        last_updated: chrono::Utc::now(),
        compliance_score: 30,
        risk_rating: RiskRating::High,
        sanctions_status: SanctionsStatus::Clear,
        cooling_periods: std::collections::HashMap::new(),
    };
    
    engine.update_investor_profile(non_compliant_id.clone(), non_compliant_profile).await
        .expect("Failed to create non-compliant investor profile");
    
    let non_compliant_result = engine.comprehensive_compliance_check(
        &non_compliant_id,
        "securities",
        1_000_000_000_000_000_000, // 1 ETH equivalent
        "US",
    ).await.expect("Failed to perform compliance check");
    
    assert!(!non_compliant_result.is_compliant);
    assert!(!non_compliant_result.required_actions.is_empty());
    assert!(!non_compliant_result.recommendations.is_empty());
    
    // Test jurisdiction support
    let jurisdictions = engine.get_supported_jurisdictions().await;
    assert!(jurisdictions.contains(&"US".to_string()));
    assert!(jurisdictions.contains(&"EU".to_string()));
    assert!(jurisdictions.contains(&"SG".to_string()));
}

#[tokio::test]
async fn test_api_endpoints() {
    // Setup test state
    let asset_service = Arc::new(RwLock::new(MultiChainAssetService::new()));
    let compliance_engine = Arc::new(RwLock::new(EnhancedComplianceEngine::new()));
    
    let state = ApiState {
        asset_service,
        compliance_engine,
    };
    
    let app = create_router(state);
    
    // Test health check
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/v1/health")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
    
    // Test asset creation
    let create_asset_request = json!({
        "name": "API Test Asset",
        "symbol": "ATA",
        "asset_type": "real_estate",
        "compliance_standard": "ERC3643",
        "regulatory_framework": "SEC",
        "jurisdiction": "US",
        "total_supply": "1000000000000000000000"
    });
    
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/assets")
                .header("content-type", "application/json")
                .body(Body::from(create_asset_request.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
    
    let body = hyper::body::to_bytes(response.into_body()).await.unwrap();
    let asset_response: Value = serde_json::from_slice(&body).unwrap();
    let asset_id = asset_response["asset_id"].as_str().unwrap();
    
    // Test asset retrieval
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri(&format!("/api/v1/assets/{}", asset_id))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
    
    // Test asset listing with pagination
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/v1/assets?page=1&per_page=10")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
    
    let body = hyper::body::to_bytes(response.into_body()).await.unwrap();
    let list_response: Value = serde_json::from_slice(&body).unwrap();
    assert!(list_response["data"].is_array());
    assert!(list_response["total_count"].as_u64().unwrap() > 0);
    
    // Test investor creation
    let create_investor_request = json!({
        "investor_id": "api_test_investor",
        "jurisdiction": "US",
        "tax_residency": ["US"],
        "investor_type": "accredited_investor",
        "email": "test@example.com",
        "full_name": "Test Investor"
    });
    
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/compliance/investors")
                .header("content-type", "application/json")
                .body(Body::from(create_investor_request.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
    
    // Test compliance check
    let compliance_check_request = json!({
        "investor_id": "api_test_investor",
        "asset_type": "securities",
        "investment_amount": "1000000000000000000",
        "jurisdiction": "US"
    });
    
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/compliance/check")
                .header("content-type", "application/json")
                .body(Body::from(compliance_check_request.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
    
    let body = hyper::body::to_bytes(response.into_body()).await.unwrap();
    let compliance_response: Value = serde_json::from_slice(&body).unwrap();
    assert!(compliance_response["is_compliant"].is_boolean());
    assert!(compliance_response["overall_score"].is_number());
    assert!(compliance_response["checks"].is_array());
    
    // Test supported chains
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/v1/chains")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
    
    let body = hyper::body::to_bytes(response.into_body()).await.unwrap();
    let chains_response: Value = serde_json::from_slice(&body).unwrap();
    assert!(chains_response["supported_chains"].is_array());
    assert!(chains_response["supported_chains"].as_array().unwrap().len() > 0);
}

#[tokio::test]
async fn test_settlement_asset_optimization() {
    let service = MultiChainAssetService::new();
    
    // Test optimal settlement asset selection for different scenarios
    
    // Large institutional transaction should prefer wCBDC
    let optimal_asset = service.get_optimal_settlement_asset(
        &SupportedChain::Ethereum,
        10_000_000.0, // $10M
    ).await;
    
    assert!(optimal_asset.is_some());
    let asset = optimal_asset.unwrap();
    assert!(matches!(asset.asset_type, crate::services::multi_chain_asset_service::SettlementAssetType::WCBDC));
    
    // Smaller transaction should use stablecoins
    let optimal_asset = service.get_optimal_settlement_asset(
        &SupportedChain::Polygon,
        1_000.0, // $1K
    ).await;
    
    assert!(optimal_asset.is_some());
    let asset = optimal_asset.unwrap();
    assert!(asset.is_preferred || matches!(asset.asset_type, crate::services::multi_chain_asset_service::SettlementAssetType::STABLECOIN));
}

#[tokio::test]
async fn test_cross_chain_fee_estimation() {
    let service = MultiChainAssetService::new();
    
    // Test fee estimation between different chains
    let eth_to_polygon_fee = service.estimate_cross_chain_fees(
        &SupportedChain::Ethereum,
        &SupportedChain::Polygon,
        1_000_000_000_000_000_000, // 1 ETH
    ).await.expect("Failed to estimate fees");
    
    assert!(eth_to_polygon_fee > 0.0);
    
    let polygon_to_arbitrum_fee = service.estimate_cross_chain_fees(
        &SupportedChain::Polygon,
        &SupportedChain::Arbitrum,
        1_000_000_000_000_000_000, // 1 ETH
    ).await.expect("Failed to estimate fees");
    
    assert!(polygon_to_arbitrum_fee > 0.0);
    
    // Ethereum should generally be more expensive than L2s
    assert!(eth_to_polygon_fee > polygon_to_arbitrum_fee);
}

#[tokio::test]
async fn test_compliance_edge_cases() {
    let mut engine = EnhancedComplianceEngine::new();
    
    // Test sanctioned investor
    let sanctioned_id = "sanctioned_investor".to_string();
    let sanctioned_profile = InvestorProfile {
        investor_id: sanctioned_id.clone(),
        jurisdiction: "US".to_string(),
        tax_residency: vec!["US".to_string()],
        investor_type: InvestorType::Institutional,
        kyc_status: KYCStatus::Completed,
        aml_status: AMLStatus::Clear,
        accreditation_status: AccreditationStatus::Verified,
        investment_limits: std::collections::HashMap::new(),
        last_updated: chrono::Utc::now(),
        compliance_score: 90,
        risk_rating: RiskRating::Low,
        sanctions_status: SanctionsStatus::Blocked, // Sanctioned!
        cooling_periods: std::collections::HashMap::new(),
    };
    
    engine.update_investor_profile(sanctioned_id.clone(), sanctioned_profile).await
        .expect("Failed to create sanctioned investor profile");
    
    let result = engine.comprehensive_compliance_check(
        &sanctioned_id,
        "securities",
        1_000_000_000_000_000_000,
        "US",
    ).await.expect("Failed to perform compliance check");
    
    assert!(!result.is_compliant);
    assert!(result.required_actions.iter().any(|action| action.contains("sanctions")));
    
    // Test prohibited risk rating
    let prohibited_id = "prohibited_investor".to_string();
    let prohibited_profile = InvestorProfile {
        investor_id: prohibited_id.clone(),
        jurisdiction: "US".to_string(),
        tax_residency: vec!["US".to_string()],
        investor_type: InvestorType::Retail,
        kyc_status: KYCStatus::Completed,
        aml_status: AMLStatus::Clear,
        accreditation_status: AccreditationStatus::NotApplicable,
        investment_limits: std::collections::HashMap::new(),
        last_updated: chrono::Utc::now(),
        compliance_score: 80,
        risk_rating: RiskRating::Prohibited, // Prohibited!
        sanctions_status: SanctionsStatus::Clear,
        cooling_periods: std::collections::HashMap::new(),
    };
    
    engine.update_investor_profile(prohibited_id.clone(), prohibited_profile).await
        .expect("Failed to create prohibited investor profile");
    
    let result = engine.comprehensive_compliance_check(
        &prohibited_id,
        "securities",
        1_000_000_000_000_000_000,
        "US",
    ).await.expect("Failed to perform compliance check");
    
    assert!(!result.is_compliant);
    assert!(result.required_actions.iter().any(|action| action.contains("risk assessment")));
}

#[tokio::test]
async fn test_api_error_handling() {
    let asset_service = Arc::new(RwLock::new(MultiChainAssetService::new()));
    let compliance_engine = Arc::new(RwLock::new(EnhancedComplianceEngine::new()));
    
    let state = ApiState {
        asset_service,
        compliance_engine,
    };
    
    let app = create_router(state);
    
    // Test invalid asset type
    let invalid_asset_request = json!({
        "name": "Invalid Asset",
        "symbol": "INV",
        "asset_type": "invalid_type",
        "compliance_standard": "ERC3643",
        "regulatory_framework": "SEC",
        "jurisdiction": "US",
        "total_supply": "1000000000000000000000"
    });
    
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/assets")
                .header("content-type", "application/json")
                .body(Body::from(invalid_asset_request.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    
    // Test non-existent asset
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/v1/assets/non_existent_asset")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    
    assert_eq!(response.status(), StatusCode::NOT_FOUND);
    
    // Test invalid compliance check
    let invalid_compliance_request = json!({
        "investor_id": "non_existent_investor",
        "asset_type": "securities",
        "investment_amount": "invalid_amount",
        "jurisdiction": "US"
    });
    
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/compliance/check")
                .header("content-type", "application/json")
                .body(Body::from(invalid_compliance_request.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_performance_benchmarks() {
    use std::time::Instant;
    
    let mut service = MultiChainAssetService::new();
    let mut engine = EnhancedComplianceEngine::new();
    
    // Benchmark asset creation
    let start = Instant::now();
    for i in 0..100 {
        let _ = service.create_asset(
            format!("Benchmark Asset {}", i),
            format!("BA{}", i),
            AssetType::RealEstate,
            ComplianceStandard::ERC3643,
            "SEC".to_string(),
            "US".to_string(),
            1_000_000_000_000_000_000_000,
        ).await;
    }
    let asset_creation_time = start.elapsed();
    println!("Created 100 assets in {:?}", asset_creation_time);
    assert!(asset_creation_time.as_millis() < 5000); // Should complete in under 5 seconds
    
    // Benchmark compliance checks
    let investor_id = "benchmark_investor".to_string();
    let profile = InvestorProfile {
        investor_id: investor_id.clone(),
        jurisdiction: "US".to_string(),
        tax_residency: vec!["US".to_string()],
        investor_type: InvestorType::AccreditedInvestor,
        kyc_status: KYCStatus::Completed,
        aml_status: AMLStatus::Clear,
        accreditation_status: AccreditationStatus::Verified,
        investment_limits: std::collections::HashMap::new(),
        last_updated: chrono::Utc::now(),
        compliance_score: 85,
        risk_rating: RiskRating::Low,
        sanctions_status: SanctionsStatus::Clear,
        cooling_periods: std::collections::HashMap::new(),
    };
    
    engine.update_investor_profile(investor_id.clone(), profile).await.unwrap();
    
    let start = Instant::now();
    for _ in 0..100 {
        let _ = engine.comprehensive_compliance_check(
            &investor_id,
            "securities",
            1_000_000_000_000_000_000,
            "US",
        ).await;
    }
    let compliance_check_time = start.elapsed();
    println!("Performed 100 compliance checks in {:?}", compliance_check_time);
    assert!(compliance_check_time.as_millis() < 2000); // Should complete in under 2 seconds
}

#[tokio::test]
async fn test_concurrent_operations() {
    use tokio::task::JoinSet;
    
    let asset_service = Arc::new(RwLock::new(MultiChainAssetService::new()));
    let compliance_engine = Arc::new(RwLock::new(EnhancedComplianceEngine::new()));
    
    let mut join_set = JoinSet::new();
    
    // Test concurrent asset creation
    for i in 0..10 {
        let service = asset_service.clone();
        join_set.spawn(async move {
            let mut service = service.write().await;
            service.create_asset(
                format!("Concurrent Asset {}", i),
                format!("CA{}", i),
                AssetType::Commodities,
                ComplianceStandard::ERC3643,
                "SEC".to_string(),
                "US".to_string(),
                1_000_000_000_000_000_000_000,
            ).await
        });
    }
    
    // Test concurrent compliance checks
    for i in 0..10 {
        let engine = compliance_engine.clone();
        join_set.spawn(async move {
            let mut engine = engine.write().await;
            let investor_id = format!("concurrent_investor_{}", i);
            let profile = InvestorProfile {
                investor_id: investor_id.clone(),
                jurisdiction: "US".to_string(),
                tax_residency: vec!["US".to_string()],
                investor_type: InvestorType::Professional,
                kyc_status: KYCStatus::Completed,
                aml_status: AMLStatus::Clear,
                accreditation_status: AccreditationStatus::Verified,
                investment_limits: std::collections::HashMap::new(),
                last_updated: chrono::Utc::now(),
                compliance_score: 80,
                risk_rating: RiskRating::Medium,
                sanctions_status: SanctionsStatus::Clear,
                cooling_periods: std::collections::HashMap::new(),
            };
            
            engine.update_investor_profile(investor_id.clone(), profile).await.unwrap();
            
            let engine = engine.clone();
            drop(engine); // Release write lock
            let engine = compliance_engine.read().await;
            engine.comprehensive_compliance_check(
                &investor_id,
                "commodities",
                1_000_000_000_000_000_000,
                "US",
            ).await
        });
    }
    
    // Wait for all tasks to complete
    let mut success_count = 0;
    while let Some(result) = join_set.join_next().await {
        if result.is_ok() {
            success_count += 1;
        }
    }
    
    assert_eq!(success_count, 20); // All 20 operations should succeed
}

// Helper function to setup test data
async fn setup_test_data() -> (MultiChainAssetService, EnhancedComplianceEngine) {
    let mut asset_service = MultiChainAssetService::new();
    let mut compliance_engine = EnhancedComplianceEngine::new();
    
    // Create sample assets
    let _real_estate_id = asset_service.create_asset(
        "Sample Real Estate".to_string(),
        "SRE".to_string(),
        AssetType::RealEstate,
        ComplianceStandard::ERC3643,
        "SEC".to_string(),
        "US".to_string(),
        1_000_000_000_000_000_000_000,
    ).await.unwrap();
    
    let _commodity_id = asset_service.create_asset(
        "Sample Commodity".to_string(),
        "SCM".to_string(),
        AssetType::Commodities,
        ComplianceStandard::ERC1400,
        "MiCA".to_string(),
        "EU".to_string(),
        500_000_000_000_000_000_000,
    ).await.unwrap();
    
    // Create sample investor profiles
    let compliant_profile = InvestorProfile {
        investor_id: "compliant_investor".to_string(),
        jurisdiction: "US".to_string(),
        tax_residency: vec!["US".to_string()],
        investor_type: InvestorType::AccreditedInvestor,
        kyc_status: KYCStatus::Completed,
        aml_status: AMLStatus::Clear,
        accreditation_status: AccreditationStatus::Verified,
        investment_limits: std::collections::HashMap::new(),
        last_updated: chrono::Utc::now(),
        compliance_score: 95,
        risk_rating: RiskRating::Low,
        sanctions_status: SanctionsStatus::Clear,
        cooling_periods: std::collections::HashMap::new(),
    };
    
    compliance_engine.update_investor_profile("compliant_investor".to_string(), compliant_profile).await.unwrap();
    
    (asset_service, compliance_engine)
}

#[tokio::test]
async fn test_end_to_end_workflow() {
    let (mut asset_service, mut compliance_engine) = setup_test_data().await;
    
    // 1. Create a new asset
    let asset_id = asset_service.create_asset(
        "End-to-End Test Asset".to_string(),
        "E2E".to_string(),
        AssetType::Securities,
        ComplianceStandard::ERC3643,
        "SEC".to_string(),
        "US".to_string(),
        1_000_000_000_000_000_000_000,
    ).await.expect("Failed to create asset");
    
    // 2. Deploy asset to multiple chains
    let asset = asset_service.get_asset(&asset_id).unwrap();
    let target_chains = vec![SupportedChain::Ethereum, SupportedChain::Polygon, SupportedChain::Arbitrum];
    let deployments = asset_service.deploy_asset_cross_chain(asset, target_chains).await
        .expect("Failed to deploy asset");
    
    assert_eq!(deployments.len(), 3);
    
    // 3. Create investor profile
    let investor_id = "e2e_investor".to_string();
    let profile = InvestorProfile {
        investor_id: investor_id.clone(),
        jurisdiction: "US".to_string(),
        tax_residency: vec!["US".to_string()],
        investor_type: InvestorType::AccreditedInvestor,
        kyc_status: KYCStatus::Completed,
        aml_status: AMLStatus::Clear,
        accreditation_status: AccreditationStatus::Verified,
        investment_limits: std::collections::HashMap::new(),
        last_updated: chrono::Utc::now(),
        compliance_score: 88,
        risk_rating: RiskRating::Low,
        sanctions_status: SanctionsStatus::Clear,
        cooling_periods: std::collections::HashMap::new(),
    };
    
    compliance_engine.update_investor_profile(investor_id.clone(), profile).await
        .expect("Failed to create investor profile");
    
    // 4. Perform compliance check
    let compliance_result = compliance_engine.comprehensive_compliance_check(
        &investor_id,
        "securities",
        10_000_000_000_000_000_000, // 10 ETH
        "US",
    ).await.expect("Failed to perform compliance check");
    
    assert!(compliance_result.is_compliant);
    assert!(compliance_result.overall_score >= 70);
    
    // 5. Get optimal settlement asset
    let settlement_asset = asset_service.get_optimal_settlement_asset(
        &SupportedChain::Ethereum,
        100_000.0, // $100K
    ).await;
    
    assert!(settlement_asset.is_some());
    
    // 6. Estimate cross-chain fees
    let fees = asset_service.estimate_cross_chain_fees(
        &SupportedChain::Ethereum,
        &SupportedChain::Polygon,
        10_000_000_000_000_000_000,
    ).await.expect("Failed to estimate fees");
    
    assert!(fees > 0.0);
    
    // 7. Get asset liquidity
    let liquidity = asset_service.get_asset_liquidity_across_chains(&asset_id).await
        .expect("Failed to get liquidity");
    
    assert!(!liquidity.is_empty());
    
    println!("End-to-end workflow completed successfully!");
    println!("Asset ID: {}", asset_id);
    println!("Deployments: {:?}", deployments.keys().collect::<Vec<_>>());
    println!("Compliance Score: {}", compliance_result.overall_score);
    println!("Settlement Asset: {:?}", settlement_asset.map(|a| a.asset_type));
    println!("Cross-chain Fees: ${:.2}", fees);
} 