const { ethers } = require("hardhat");
const fs = require("fs");

async function deployToNetwork(networkName, networkConfig) {
    console.log(`\n🚀 Deploying to ${networkName}...`);
    
    const deployments = {};
    
    try {
        // 1. Deploy ComplianceAwareToken
        console.log("Deploying ComplianceAwareToken...");
        const ComplianceAwareToken = await ethers.getContractFactory("ComplianceAwareToken");
        const complianceToken = await ComplianceAwareToken.deploy(
            "Quantera Test Token",
            "QTT",
            {
                assetClass: "Real Estate",
                jurisdiction: "US",
                regulatoryFramework: "SEC",
                minimumInvestment: ethers.utils.parseEther("1000"),
                fractionalAllowed: true
            },
            ethers.constants.AddressZero // Placeholder for compliance module
        );
        await complianceToken.deployed();
        deployments.ComplianceAwareToken = complianceToken.address;
        console.log(`✅ ComplianceAwareToken deployed: ${complianceToken.address}`);
        
        // 2. Deploy SettlementAssetManager
        console.log("Deploying SettlementAssetManager...");
        const SettlementAssetManager = await ethers.getContractFactory("SettlementAssetManager");
        const settlementManager = await SettlementAssetManager.deploy();
        await settlementManager.deployed();
        deployments.SettlementAssetManager = settlementManager.address;
        console.log(`✅ SettlementAssetManager deployed: ${settlementManager.address}`);
        
        // 3. Deploy LiquidityPoolOptimizer
        console.log("Deploying LiquidityPoolOptimizer...");
        const LiquidityPoolOptimizer = await ethers.getContractFactory("LiquidityPoolOptimizer");
        const liquidityOptimizer = await LiquidityPoolOptimizer.deploy();
        await liquidityOptimizer.deployed();
        deployments.LiquidityPoolOptimizer = liquidityOptimizer.address;
        console.log(`✅ LiquidityPoolOptimizer deployed: ${liquidityOptimizer.address}`);
        
        // 4. Deploy DynamicFeeStructure
        console.log("Deploying DynamicFeeStructure...");
        const DynamicFeeStructure = await ethers.getContractFactory("DynamicFeeStructure");
        const feeStructure = await DynamicFeeStructure.deploy();
        await feeStructure.deployed();
        deployments.DynamicFeeStructure = feeStructure.address;
        console.log(`✅ DynamicFeeStructure deployed: ${feeStructure.address}`);
        
        // 5. Deploy PrimeBrokerage
        console.log("Deploying PrimeBrokerage...");
        const PrimeBrokerage = await ethers.getContractFactory("PrimeBrokerage");
        const primeBrokerage = await PrimeBrokerage.deploy();
        await primeBrokerage.deployed();
        deployments.PrimeBrokerage = primeBrokerage.address;
        console.log(`✅ PrimeBrokerage deployed: ${primeBrokerage.address}`);
        
        // 6. Deploy UniversalBridge (if supported)
        if (networkConfig.supports.eip1559) {
            console.log("Deploying UniversalBridge...");
            const UniversalBridge = await ethers.getContractFactory("UniversalBridge");
            const bridge = await UniversalBridge.deploy();
            await bridge.deployed();
            deployments.UniversalBridge = bridge.address;
            console.log(`✅ UniversalBridge deployed: ${bridge.address}`);
        }
        
        // Save deployment addresses
        const deploymentData = {
            network: networkName,
            chainId: networkConfig.chainId,
            timestamp: new Date().toISOString(),
            contracts: deployments,
            gasUsed: {
                // Gas usage would be calculated here
            }
        };
        
        fs.writeFileSync(
            `deployments/testnet/${networkName}_deployment.json`,
            JSON.stringify(deploymentData, null, 2)
        );
        
        console.log(`✅ ${networkName} deployment completed successfully!`);
        return deployments;
        
    } catch (error) {
        console.error(`❌ Deployment failed on ${networkName}:`, error.message);
        throw error;
    }
}

module.exports = { deployToNetwork };
