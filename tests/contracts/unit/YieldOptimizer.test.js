const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("YieldOptimizer Security Tests", function () {
  // Test fixture that deploys all needed contracts
  async function deployYieldOptimizerFixture() {
    // Get signers
    const [owner, creator, user1, user2, feeRecipient] = await ethers.getSigners();
    
    // Deploy mock asset factory first
    const AssetFactory = await ethers.getContractFactory("AssetFactory");
    const mockTreasuryRegistry = await ethers.Wallet.createRandom().getAddress();
    const mockComplianceModule = await ethers.Wallet.createRandom().getAddress();
    const assetFactory = await AssetFactory.deploy(mockTreasuryRegistry, mockComplianceModule);
    
    // Deploy YieldOptimizer
    const YieldOptimizer = await ethers.getContractFactory("YieldOptimizer");
    const yieldOptimizer = await YieldOptimizer.deploy(assetFactory.address, feeRecipient.address);
    
    // Grant roles
    const STRATEGY_CREATOR_ROLE = await yieldOptimizer.STRATEGY_CREATOR_ROLE();
    const PERFORMANCE_UPDATER_ROLE = await yieldOptimizer.PERFORMANCE_UPDATER_ROLE();
    const AUTO_COMPOUNDER_ROLE = await yieldOptimizer.AUTO_COMPOUNDER_ROLE();
    
    await yieldOptimizer.grantRole(STRATEGY_CREATOR_ROLE, creator.address);
    await yieldOptimizer.grantRole(PERFORMANCE_UPDATER_ROLE, owner.address);
    await yieldOptimizer.grantRole(AUTO_COMPOUNDER_ROLE, owner.address);
    
    return { yieldOptimizer, assetFactory, owner, creator, user1, user2, feeRecipient };
  }
  
  describe("Role-Based Access Control", function () {
    it("Should allow only STRATEGY_CREATOR_ROLE to create strategies", async function () {
      const { yieldOptimizer, user1, creator } = await loadFixture(deployYieldOptimizerFixture);
      
      // Define a basic strategy
      const strategyParams = {
        name: "Test Strategy",
        description: "Strategy for testing",
        riskLevel: 1, // MODERATE
        isPublic: true,
        performanceFee: 200, // 2%
        metadataURI: "ipfs://test",
        supportedSources: [0, 1], // LENDING, STAKING
        supportedAssetClasses: [0, 1] // TREASURY, ENVIRONMENTAL_ASSET
      };
      
      // User without role should not be able to create a strategy
      await expect(
        yieldOptimizer.connect(user1).createStrategy(
          strategyParams.name,
          strategyParams.description,
          strategyParams.riskLevel,
          strategyParams.isPublic,
          strategyParams.performanceFee,
          strategyParams.metadataURI,
          strategyParams.supportedSources,
          strategyParams.supportedAssetClasses
        )
      ).to.be.revertedWithCustomError(yieldOptimizer, "Unauthorized");
      
      // User with role should be able to create a strategy
      await expect(
        yieldOptimizer.connect(creator).createStrategy(
          strategyParams.name,
          strategyParams.description,
          strategyParams.riskLevel,
          strategyParams.isPublic,
          strategyParams.performanceFee,
          strategyParams.metadataURI,
          strategyParams.supportedSources,
          strategyParams.supportedAssetClasses
        )
      ).to.not.be.reverted;
    });
    
    it("Should only allow strategy creator or admin to update strategy", async function () {
      const { yieldOptimizer, creator, user1, user2 } = await loadFixture(deployYieldOptimizerFixture);
      
      // Create a strategy first
      const tx = await yieldOptimizer.connect(creator).createStrategy(
        "Test Strategy",
        "Strategy for testing",
        1, // MODERATE
        true,
        200, // 2%
        "ipfs://test",
        [0, 1], // LENDING, STAKING
        [0, 1] // TREASURY, ENVIRONMENTAL_ASSET
      );
      
      const receipt = await tx.wait();
      
      // Find the StrategyCreated event to get the strategy ID
      const event = receipt.events.find(e => e.event === "StrategyCreated");
      const strategyId = event.args.strategyId;
      
      // User who is not creator should not be able to update
      await expect(
        yieldOptimizer.connect(user1).updateStrategy(
          strategyId,
          false, // isPublic
          true, // isActive
          300, // performanceFee
          "ipfs://updated"
        )
      ).to.be.revertedWithCustomError(yieldOptimizer, "NotStrategyOwner");
      
      // Creator should be able to update
      await expect(
        yieldOptimizer.connect(creator).updateStrategy(
          strategyId,
          false, // isPublic
          true, // isActive
          300, // performanceFee
          "ipfs://updated"
        )
      ).to.not.be.reverted;
    });
  });
  
  describe("Custom Error Handling", function () {
    it("Should revert with InvalidZeroAddress for zero address parameters", async function () {
      // Try to deploy with zero addresses
      const YieldOptimizer = await ethers.getContractFactory("YieldOptimizer");
      await expect(
        YieldOptimizer.deploy(ethers.constants.AddressZero, ethers.constants.AddressZero)
      ).to.be.revertedWithCustomError(YieldOptimizer, "InvalidZeroAddress");
      
      const { yieldOptimizer, owner } = await loadFixture(deployYieldOptimizerFixture);
      
      // Try to set fee recipient to zero address
      await expect(
        yieldOptimizer.connect(owner).setProtocolFeeRecipient(ethers.constants.AddressZero)
      ).to.be.revertedWithCustomError(yieldOptimizer, "InvalidZeroAddress");
    });
    
    it("Should revert with EmptyInput for empty string parameters", async function () {
      const { yieldOptimizer, creator } = await loadFixture(deployYieldOptimizerFixture);
      
      // Try to create strategy with empty name
      await expect(
        yieldOptimizer.connect(creator).createStrategy(
          "", // empty name
          "Strategy for testing",
          1, // MODERATE
          true,
          200, // 2%
          "ipfs://test",
          [0, 1], // LENDING, STAKING
          [0, 1] // TREASURY, ENVIRONMENTAL_ASSET
        )
      ).to.be.revertedWithCustomError(yieldOptimizer, "EmptyInput");
      
      // Try with empty description
      await expect(
        yieldOptimizer.connect(creator).createStrategy(
          "Test Strategy",
          "", // empty description
          1, // MODERATE
          true,
          200, // 2%
          "ipfs://test",
          [0, 1], // LENDING, STAKING
          [0, 1] // TREASURY, ENVIRONMENTAL_ASSET
        )
      ).to.be.revertedWithCustomError(yieldOptimizer, "EmptyInput");
      
      // Try with empty metadata URI
      await expect(
        yieldOptimizer.connect(creator).createStrategy(
          "Test Strategy",
          "Strategy for testing",
          1, // MODERATE
          true,
          200, // 2%
          "", // empty metadataURI
          [0, 1], // LENDING, STAKING
          [0, 1] // TREASURY, ENVIRONMENTAL_ASSET
        )
      ).to.be.revertedWithCustomError(yieldOptimizer, "EmptyInput");
    });
    
    it("Should revert with PerformanceFeeTooHigh when fee exceeds maximum", async function () {
      const { yieldOptimizer, creator } = await loadFixture(deployYieldOptimizerFixture);
      
      // Try to create strategy with fee that's too high (over 50%)
      await expect(
        yieldOptimizer.connect(creator).createStrategy(
          "Test Strategy",
          "Strategy for testing",
          1, // MODERATE
          true,
          6000, // 60% - too high
          "ipfs://test",
          [0, 1], // LENDING, STAKING
          [0, 1] // TREASURY, ENVIRONMENTAL_ASSET
        )
      ).to.be.revertedWithCustomError(yieldOptimizer, "PerformanceFeeTooHigh");
    });
    
    it("Should revert with ArrayLengthMismatch when array lengths don't match", async function () {
      const { yieldOptimizer, creator, user1 } = await loadFixture(deployYieldOptimizerFixture);
      
      // Create a strategy first
      const tx = await yieldOptimizer.connect(creator).createStrategy(
        "Test Strategy",
        "Strategy for testing",
        1, // MODERATE
        true,
        200, // 2%
        "ipfs://test",
        [0, 1], // LENDING, STAKING
        [0, 1] // TREASURY, ENVIRONMENTAL_ASSET
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "StrategyCreated");
      const strategyId = event.args.strategyId;
      
      // Try to apply strategy with mismatched arrays
      await expect(
        yieldOptimizer.connect(user1).applyStrategy(
          strategyId,
          [ethers.Wallet.createRandom().address, ethers.Wallet.createRandom().address], // 2 assets
          [5000], // only 1 allocation
          true,
          86400 // 1 day
        )
      ).to.be.revertedWithCustomError(yieldOptimizer, "ArrayLengthMismatch");
    });
  });
  
  describe("Input Validation", function () {
    it("Should validate allocation percentages sum to 100%", async function () {
      const { yieldOptimizer, creator, user1 } = await loadFixture(deployYieldOptimizerFixture);
      
      // Create a strategy first
      const tx = await yieldOptimizer.connect(creator).createStrategy(
        "Test Strategy",
        "Strategy for testing",
        1, // MODERATE
        true,
        200, // 2%
        "ipfs://test",
        [0, 1], // LENDING, STAKING
        [0, 1] // TREASURY, ENVIRONMENTAL_ASSET
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "StrategyCreated");
      const strategyId = event.args.strategyId;
      
      // Try to apply strategy with allocations that don't sum to 100%
      const asset1 = ethers.Wallet.createRandom().address;
      const asset2 = ethers.Wallet.createRandom().address;
      
      await expect(
        yieldOptimizer.connect(user1).applyStrategy(
          strategyId,
          [asset1, asset2], 
          [3000, 5000], // 30% + 50% = 80%, not 100%
          true,
          86400 // 1 day
        )
      ).to.be.revertedWithCustomError(yieldOptimizer, "AllocationMismatch");
      
      // Correct allocation should work
      await expect(
        yieldOptimizer.connect(user1).applyStrategy(
          strategyId,
          [asset1, asset2], 
          [5000, 5000], // 50% + 50% = 100%
          true,
          86400 // 1 day
        )
      ).to.not.be.reverted;
    });
    
    it("Should validate compound frequency is above minimum", async function () {
      const { yieldOptimizer, creator, user1 } = await loadFixture(deployYieldOptimizerFixture);
      
      // Create a strategy first
      const tx = await yieldOptimizer.connect(creator).createStrategy(
        "Test Strategy",
        "Strategy for testing",
        1, // MODERATE
        true,
        200, // 2%
        "ipfs://test",
        [0, 1], // LENDING, STAKING
        [0, 1] // TREASURY, ENVIRONMENTAL_ASSET
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "StrategyCreated");
      const strategyId = event.args.strategyId;
      
      // Try with frequency that's too low
      const asset1 = ethers.Wallet.createRandom().address;
      const asset2 = ethers.Wallet.createRandom().address;
      
      await expect(
        yieldOptimizer.connect(user1).applyStrategy(
          strategyId,
          [asset1, asset2],
          [5000, 5000], // 50% + 50% = 100%
          true,
          600 // 10 minutes - too low
        )
      ).to.be.revertedWithCustomError(yieldOptimizer, "CompoundFrequencyTooLow");
      
      // Correct frequency should work
      await expect(
        yieldOptimizer.connect(user1).applyStrategy(
          strategyId,
          [asset1, asset2],
          [5000, 5000], // 50% + 50% = 100%
          true,
          3600 // 1 hour - minimum required
        )
      ).to.not.be.reverted;
    });
  });
  
  describe("Checks-Effects-Interactions Pattern", function () {
    it("Should update internal state before external calls in updateUserStrategy", async function () {
      const { yieldOptimizer, creator, user1 } = await loadFixture(deployYieldOptimizerFixture);
      
      // Create a strategy
      const tx = await yieldOptimizer.connect(creator).createStrategy(
        "Test Strategy",
        "Strategy for testing",
        1, // MODERATE
        true,
        200, // 2%
        "ipfs://test",
        [0, 1], // LENDING, STAKING
        [0, 1] // TREASURY, ENVIRONMENTAL_ASSET
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "StrategyCreated");
      const strategyId = event.args.strategyId;
      
      // Apply strategy
      const asset1 = ethers.Wallet.createRandom().address;
      const asset2 = ethers.Wallet.createRandom().address;
      
      const applyTx = await yieldOptimizer.connect(user1).applyStrategy(
        strategyId,
        [asset1, asset2],
        [5000, 5000], // 50% + 50% = 100%
        true,
        3600 // 1 hour
      );
      
      const applyReceipt = await applyTx.wait();
      const applyEvent = applyReceipt.events.find(e => e.event === "StrategyApplied");
      const userStrategyId = applyEvent.args.userStrategyId;
      
      // Now update the strategy
      const asset3 = ethers.Wallet.createRandom().address;
      
      await expect(
        yieldOptimizer.connect(user1).updateUserStrategy(
          userStrategyId,
          [asset1, asset3], // changed assets
          [4000, 6000], // changed allocations
          false, // changed autocompound
          0, // changed frequency
          true // keep active
        )
      ).to.emit(yieldOptimizer, "UserStrategyUpdated");
      
      // Verify the update was successful
      const userStrategy = await yieldOptimizer.getUserStrategy(userStrategyId);
      expect(userStrategy.autoCompound).to.equal(false);
      expect(userStrategy.assets.length).to.equal(2);
      expect(userStrategy.assets[1]).to.equal(asset3);
      expect(userStrategy.allocationPercentages[0]).to.equal(4000);
      expect(userStrategy.allocationPercentages[1]).to.equal(6000);
    });
  });
  
  describe("Protocol Fee Management", function () {
    it("Should only allow admin to update protocol fee", async function () {
      const { yieldOptimizer, owner, user1 } = await loadFixture(deployYieldOptimizerFixture);
      
      // Non-admin should not be able to update fee
      await expect(
        yieldOptimizer.connect(user1).setProtocolFee(300)
      ).to.be.reverted;
      
      // Admin should be able to update fee
      await expect(
        yieldOptimizer.connect(owner).setProtocolFee(300)
      ).to.not.be.reverted;
      
      // Verify fee was updated
      expect(await yieldOptimizer.protocolFee()).to.equal(300);
    });
    
    it("Should not allow protocol fee above maximum", async function () {
      const { yieldOptimizer, owner } = await loadFixture(deployYieldOptimizerFixture);
      
      // Try to set fee that's too high (over 50%)
      await expect(
        yieldOptimizer.connect(owner).setProtocolFee(6000) // 60%
      ).to.be.revertedWithCustomError(yieldOptimizer, "PerformanceFeeTooHigh");
      
      // Setting within limit should work
      await expect(
        yieldOptimizer.connect(owner).setProtocolFee(4000) // 40%
      ).to.not.be.reverted;
    });
  });
}); 