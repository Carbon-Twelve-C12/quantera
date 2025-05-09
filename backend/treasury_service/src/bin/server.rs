use treasury_service::{
    TreasuryRegistryClient,
    IpfsClient,
    TreasuryService,
    YieldSchedulerService,
    UserService,
    AuthenticationService,
    MockVerificationProvider,
    api::{routes, ApiServices, TokenClientsContainer},
    AssetManagementService,
};
use ethereum_client::EthereumClient;
use alloy_primitives::Address;
use std::sync::Arc;
use std::net::SocketAddr;
use tracing::{info, error};
use tracing_subscriber::{EnvFilter, fmt};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();
    
    info!("Starting Treasury API server");
    
    // Load environment variables
    dotenv::dotenv().ok();
    
    // Get configuration from environment
    let ethereum_rpc_url = std::env::var("ETHEREUM_RPC_URL")
        .unwrap_or_else(|_| "http://localhost:8545".to_string());
    
    let registry_address = std::env::var("REGISTRY_ADDRESS")
        .unwrap_or_else(|_| "0x0000000000000000000000000000000000000000".to_string());
    
    let ipfs_url = std::env::var("IPFS_URL")
        .unwrap_or_else(|_| "http://localhost:5001".to_string());
    
    let jwt_secret = std::env::var("JWT_SECRET")
        .unwrap_or_else(|_| "your-secret-key".to_string());
    
    let server_port = std::env::var("API_PORT")
        .unwrap_or_else(|_| "3030".to_string())
        .parse::<u16>()
        .unwrap_or(3030);
    
    // Contract addresses from environment
    let l2_bridge_address = std::env::var("L2_BRIDGE_ADDRESS")
        .unwrap_or_else(|_| "0x0000000000000000000000000000000000000000".to_string());
    
    let smart_account_address = std::env::var("SMART_ACCOUNT_ADDRESS")
        .unwrap_or_else(|_| "0x0000000000000000000000000000000000000000".to_string());
    
    let asset_factory_address = std::env::var("ASSET_FACTORY_ADDRESS")
        .unwrap_or_else(|_| "0x0000000000000000000000000000000000000000".to_string());
    
    let liquidity_pools_address = std::env::var("LIQUIDITY_POOLS_ADDRESS")
        .unwrap_or_else(|_| "0x0000000000000000000000000000000000000000".to_string());
    
    let yield_optimizer_address = std::env::var("YIELD_OPTIMIZER_ADDRESS")
        .unwrap_or_else(|_| "0x0000000000000000000000000000000000000000".to_string());
    
    // Create Ethereum client
    let ethereum_client = Arc::new(EthereumClient::new(&ethereum_rpc_url).await?);
    
    // Create registry client
    let registry_address = Address::parse_checksummed(&registry_address, None)
        .expect("Invalid registry address format");
    
    let registry_client = Arc::new(TreasuryRegistryClient::new(ethereum_client.clone(), registry_address).await);
    
    // Create IPFS client
    let ipfs_client = IpfsClient::new(&ipfs_url);
    
    // Create Treasury service
    let treasury_service = Arc::new(TreasuryService::new(registry_client.clone(), ipfs_client).await);
    
    // Create verification provider
    let verification_provider = Arc::new(MockVerificationProvider);
    
    // Create clients for UserService
    let compliance_client = treasury_service::clients::compliance_client::ComplianceClient::new(
        ethereum_client.clone(),
        Address::ZERO, // Mock address
    ).await;
    
    // Create UserService
    let user_service = Arc::new(UserService::new(
        Arc::new(compliance_client),
        registry_client.clone(),
        ethereum_client.clone(),
        verification_provider,
    ).await);
    
    // Create YieldSchedulerService
    let yield_scheduler = Arc::new(YieldSchedulerService::new(
        registry_client.clone(),
        ethereum_client.clone(),
    ).await);
    
    // Create AuthenticationService
    let auth_service = Arc::new(AuthenticationService::new(
        user_service.clone(),
        ethereum_client.clone(),
        jwt_secret,
    ).await);
    
    // Create TradingClient
    let trading_client = treasury_service::clients::trading_client::TradingClient::new(
        ethereum_client.clone(),
        Address::ZERO, // Mock address
    ).await;
    
    // Create L2Client
    let l2_client = treasury_service::clients::l2_client::L2Client::new(
        ethereum_client.clone(),
        Address::ZERO, // Mock address
    ).await;
    
    // Create AssetManagementService
    let asset_management_service = Arc::new(AssetManagementService::new(
        ethereum_client.clone(),
        registry_client.clone(),
    ).await);
    
    // Create L2BridgeClient with actual address
    let l2_bridge_address = Address::parse_checksummed(&l2_bridge_address, None)
        .expect("Invalid L2 bridge address format");
    
    let l2_bridge_client = treasury_service::clients::l2_bridge_client::L2BridgeClient::new(
        ethereum_client.clone(),
        l2_bridge_address,
    );
    
    // Create SmartAccountClient with actual address
    let smart_account_address = Address::parse_checksummed(&smart_account_address, None)
        .expect("Invalid smart account address format");
    
    let smart_account_client = treasury_service::clients::smart_account_client::SmartAccountClient::new(
        ethereum_client.clone(),
        smart_account_address,
    );
    
    // Create AssetFactoryClient with actual address
    let asset_factory_address = Address::parse_checksummed(&asset_factory_address, None)
        .expect("Invalid asset factory address format");
    
    let asset_factory_client = treasury_service::clients::asset_factory_client::AssetFactoryClient::new(
        ethereum_client.clone(),
        asset_factory_address,
    );
    
    // Create LiquidityPoolsClient with actual address
    let liquidity_pools_address = Address::parse_checksummed(&liquidity_pools_address, None)
        .expect("Invalid liquidity pools address format");
    
    let liquidity_pools_client = treasury_service::clients::liquidity_pools_client::LiquidityPoolsClient::new(
        ethereum_client.clone(),
        liquidity_pools_address,
    );
    
    // Create YieldOptimizerClient with actual address
    let yield_optimizer_address = Address::parse_checksummed(&yield_optimizer_address, None)
        .expect("Invalid yield optimizer address format");
    
    let yield_optimizer_client = treasury_service::clients::yield_optimizer_client::YieldOptimizerClient::new(
        ethereum_client.clone(),
        yield_optimizer_address,
    );
    
    // Create token client
    let token_client = treasury_service::clients::treasury_token_client::TreasuryTokenClient::new(
        ethereum_client.clone(),
        Address::ZERO, // Mock address
    ).await;
    
    // Create token clients container
    let token_clients_container = TokenClientsContainer {
        treasury_token_client: token_client,
    };
    
    // Create API services
    let api_services = ApiServices {
        treasury_service,
        registry_client,
        yield_scheduler,
        user_service,
        auth_service: auth_service.clone(),
        ethereum_client,
        trading_client: Arc::new(trading_client),
        l2_client: Arc::new(l2_client),
        token_clients: Arc::new(token_clients_container),
        asset_management_service,
        l2_bridge_client: Arc::new(l2_bridge_client),
        smart_account_client: Arc::new(smart_account_client),
        asset_factory_client: Arc::new(asset_factory_client),
        liquidity_pools_client: Arc::new(liquidity_pools_client),
        yield_optimizer_client: Arc::new(yield_optimizer_client),
    };
    
    // Create API routes
    let api_routes = routes(api_services);
    
    // Start the server
    let addr = SocketAddr::from(([0, 0, 0, 0], server_port));
    info!("Listening on {}", addr);
    
    warp::serve(api_routes)
        .run(addr)
        .await;
    
    Ok(())
} 