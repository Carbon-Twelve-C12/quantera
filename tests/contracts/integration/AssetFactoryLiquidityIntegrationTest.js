const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("AssetFactory and LiquidityPools Integration", function () {
  let assetFactory;
  let liquidityPools;
  let owner;
  let issuer;
  let user1;
  let user2;
  let treasuryRegistry;
  let complianceModule;
  let templateId;
  let treasuryAssetA;
  let treasuryAssetB;
  let treasuryAssetAAddress;
  let treasuryAssetBAddress;
  let treasuryAssetAId;
  let treasuryAssetBId;
  let poolId;

  const TREASURY_CLASS = 0; // AssetClass.TREASURY
  const ONE_MILLION = ethers.utils.parseUnits("1000000", 18);
  const ONE_HUNDRED_THOUSAND = ethers.utils.parseUnits("100000", 18);
  const TEN_THOUSAND = ethers.utils.parseUnits("10000", 18);
  const ONE_THOUSAND = ethers.utils.parseUnits("1000", 18);

  before(async function () {
    [owner, issuer, user1, user2] = await ethers.getSigners();

    // Deploy TreasuryRegistry
    const TreasuryRegistry = await ethers.getContractFactory("TreasuryRegistry");
    treasuryRegistry = await TreasuryRegistry.deploy();
    await treasuryRegistry.deployed();

    // Deploy ComplianceModule
    const ComplianceModule = await ethers.getContractFactory("ComplianceModule");
    complianceModule = await ComplianceModule.deploy(treasuryRegistry.address);
    await complianceModule.deployed();

    // Deploy AssetFactory
    const AssetFactory = await ethers.getContractFactory("AssetFactory");
    assetFactory = await AssetFactory.deploy(treasuryRegistry.address, complianceModule.address);
    await assetFactory.deployed();

    // Deploy LiquidityPools
    const LiquidityPools = await ethers.getContractFactory("LiquidityPools");
    liquidityPools = await LiquidityPools.deploy(treasuryRegistry.address, assetFactory.address);
    await liquidityPools.deployed();

    // Register contracts in TreasuryRegistry
    await treasuryRegistry.connect(owner).registerContract(
      "AssetFactory",
      assetFactory.address,
      true
    );

    await treasuryRegistry.connect(owner).registerContract(
      "LiquidityPools",
      liquidityPools.address,
      true
    );

    // Set up template for Treasury assets
    const tx = await assetFactory.connect(owner).createTemplate(
      "Treasury Template",
      TREASURY_CLASS,
      true,
      "ipfs://QmTemplate123",
      [] // No specific modules for this template
    );

    const receipt = await tx.wait();
    const event = receipt.events.find(e => e.event === "TemplateCreated");
    templateId = event.args.templateId;
  });

  it("should create two treasury assets", async function () {
    // Current timestamp
    const blockNum = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNum);
    const currentTimestamp = block.timestamp;
    
    // Asset A: 5-Year Treasury Note with 2% yield
    const assetParamsA = {
      name: "5-Year Treasury Note",
      symbol: "5YTN",
      totalSupply: ONE_MILLION,
      faceValue: ethers.utils.parseUnits("1000", 18),
      issuanceDate: currentTimestamp,
      maturityDate: currentTimestamp + 5 * 365 * 24 * 60 * 60, // 5 years from now
      yieldRate: 200, // 2.00% (in basis points)
      issuer: issuer.address,
      metadataURI: "ipfs://QmAssetA123",
      extraData: "0x"
    };

    const tokenomicsA = {
      hasTransferRestrictions: false,
      hasDividends: true,
      hasMaturity: true,
      hasRoyalties: false,
      feeRate: 25, // 0.25% (in basis points)
      feeRecipient: owner.address,
      customTokenomics: "0x"
    };

    // Create Asset A
    const txA = await assetFactory.connect(issuer).createAsset(
      templateId,
      assetParamsA,
      tokenomicsA,
      [] // No specific modules
    );

    const receiptA = await txA.wait();
    const eventA = receiptA.events.find(e => e.event === "AssetCreated");
    treasuryAssetAAddress = eventA.args.assetAddress;
    treasuryAssetAId = eventA.args.assetId;
    treasuryAssetA = await ethers.getContractAt("ITreasuryToken", treasuryAssetAAddress);

    // Asset B: 10-Year Treasury Bond with 3% yield
    const assetParamsB = {
      name: "10-Year Treasury Bond",
      symbol: "10YTB",
      totalSupply: ONE_MILLION,
      faceValue: ethers.utils.parseUnits("1000", 18),
      issuanceDate: currentTimestamp,
      maturityDate: currentTimestamp + 10 * 365 * 24 * 60 * 60, // 10 years from now
      yieldRate: 300, // 3.00% (in basis points)
      issuer: issuer.address,
      metadataURI: "ipfs://QmAssetB123",
      extraData: "0x"
    };

    const tokenomicsB = {
      hasTransferRestrictions: false,
      hasDividends: true,
      hasMaturity: true,
      hasRoyalties: false,
      feeRate: 25, // 0.25% (in basis points)
      feeRecipient: owner.address,
      customTokenomics: "0x"
    };

    // Create Asset B
    const txB = await assetFactory.connect(issuer).createAsset(
      templateId,
      assetParamsB,
      tokenomicsB,
      [] // No specific modules
    );

    const receiptB = await txB.wait();
    const eventB = receiptB.events.find(e => e.event === "AssetCreated");
    treasuryAssetBAddress = eventB.args.assetAddress;
    treasuryAssetBId = eventB.args.assetId;
    treasuryAssetB = await ethers.getContractAt("ITreasuryToken", treasuryAssetBAddress);

    // Verify assets were created correctly
    expect(await assetFactory.isAsset(treasuryAssetAAddress)).to.be.true;
    expect(await assetFactory.isAsset(treasuryAssetBAddress)).to.be.true;

    const assetDetailsA = await assetFactory.getAssetDetails(treasuryAssetAId);
    expect(assetDetailsA.assetAddress).to.equal(treasuryAssetAAddress);
    expect(assetDetailsA.assetClass).to.equal(TREASURY_CLASS);
    expect(assetDetailsA.issuer).to.equal(issuer.address);

    const assetDetailsB = await assetFactory.getAssetDetails(treasuryAssetBId);
    expect(assetDetailsB.assetAddress).to.equal(treasuryAssetBAddress);
    expect(assetDetailsB.assetClass).to.equal(TREASURY_CLASS);
    expect(assetDetailsB.issuer).to.equal(issuer.address);
  });

  it("should distribute assets to users", async function () {
    // Issuer distributes assets to users
    await treasuryAssetA.connect(issuer).transfer(user1.address, ONE_HUNDRED_THOUSAND);
    await treasuryAssetA.connect(issuer).transfer(user2.address, ONE_HUNDRED_THOUSAND);
    await treasuryAssetB.connect(issuer).transfer(user1.address, ONE_HUNDRED_THOUSAND);
    await treasuryAssetB.connect(issuer).transfer(user2.address, ONE_HUNDRED_THOUSAND);

    // Verify balances
    expect(await treasuryAssetA.balanceOf(user1.address)).to.equal(ONE_HUNDRED_THOUSAND);
    expect(await treasuryAssetA.balanceOf(user2.address)).to.equal(ONE_HUNDRED_THOUSAND);
    expect(await treasuryAssetB.balanceOf(user1.address)).to.equal(ONE_HUNDRED_THOUSAND);
    expect(await treasuryAssetB.balanceOf(user2.address)).to.equal(ONE_HUNDRED_THOUSAND);
  });

  it("should approve LiquidityPools contract to spend tokens", async function () {
    // Users approve LiquidityPools contract to spend their tokens
    await treasuryAssetA.connect(user1).approve(liquidityPools.address, ONE_HUNDRED_THOUSAND);
    await treasuryAssetB.connect(user1).approve(liquidityPools.address, ONE_HUNDRED_THOUSAND);
    await treasuryAssetA.connect(user2).approve(liquidityPools.address, ONE_HUNDRED_THOUSAND);
    await treasuryAssetB.connect(user2).approve(liquidityPools.address, ONE_HUNDRED_THOUSAND);

    // Verify allowances
    expect(await treasuryAssetA.allowance(user1.address, liquidityPools.address)).to.equal(ONE_HUNDRED_THOUSAND);
    expect(await treasuryAssetB.allowance(user1.address, liquidityPools.address)).to.equal(ONE_HUNDRED_THOUSAND);
    expect(await treasuryAssetA.allowance(user2.address, liquidityPools.address)).to.equal(ONE_HUNDRED_THOUSAND);
    expect(await treasuryAssetB.allowance(user2.address, liquidityPools.address)).to.equal(ONE_HUNDRED_THOUSAND);
  });

  it("should create a liquidity pool for the two treasury assets", async function () {
    // Create liquidity pool
    // We're setting the initial price to be 1:1 (token A : token B)
    // The initial sqrt price in Q64.96 format would be sqrt(1) * 2^96 = 2^96
    const initialSqrtPrice = ethers.BigNumber.from(2).pow(96);
    // 0.3% fee tier (30 basis points)
    const feeTier = 30;
    // Tick spacing of 10
    const tickSpacing = 10;

    const tx = await liquidityPools.connect(owner).createPool(
      treasuryAssetAAddress,
      treasuryAssetBAddress,
      TREASURY_CLASS,
      TREASURY_CLASS,
      feeTier,
      initialSqrtPrice,
      tickSpacing
    );

    const receipt = await tx.wait();
    const event = receipt.events.find(e => e.event === "PoolCreated");
    poolId = event.args.poolId;

    // Verify pool was created
    const poolConfig = await liquidityPools.getPoolConfig(poolId);
    expect(poolConfig.tokenA).to.equal(treasuryAssetAAddress);
    expect(poolConfig.tokenB).to.equal(treasuryAssetBAddress);
    expect(poolConfig.assetClassA).to.equal(TREASURY_CLASS);
    expect(poolConfig.assetClassB).to.equal(TREASURY_CLASS);
    expect(poolConfig.feeTier).to.equal(feeTier);
    expect(poolConfig.tickSpacing).to.equal(tickSpacing);
    expect(poolConfig.active).to.be.true;
    expect(poolConfig.owner).to.equal(owner.address);
  });

  it("should add liquidity to the pool", async function () {
    // User1 adds liquidity in the range of -100 to +100 ticks around the current price
    const lowerTick = -100;
    const upperTick = 100;
    
    const tx = await liquidityPools.connect(user1).addLiquidity(
      poolId,
      lowerTick,
      upperTick,
      TEN_THOUSAND, // 10,000 tokens of A desired
      TEN_THOUSAND, // 10,000 tokens of B desired
      0, // No minimum for token A
      0  // No minimum for token B
    );

    const receipt = await tx.wait();
    const event = receipt.events.find(e => e.event === "LiquidityAdded");
    const positionId = event.args.positionId;

    // Verify position was created
    const position = await liquidityPools.getPosition(positionId);
    expect(position.owner).to.equal(user1.address);
    expect(position.poolId).to.equal(poolId);
    expect(position.lowerTick).to.equal(lowerTick);
    expect(position.upperTick).to.equal(upperTick);
    expect(position.liquidity).to.be.gt(0);

    // User2 adds liquidity in a narrower range for more concentrated liquidity
    const narrowLowerTick = -50;
    const narrowUpperTick = 50;
    
    const tx2 = await liquidityPools.connect(user2).addLiquidity(
      poolId,
      narrowLowerTick,
      narrowUpperTick,
      TEN_THOUSAND, // 10,000 tokens of A desired
      TEN_THOUSAND, // 10,000 tokens of B desired
      0, // No minimum for token A
      0  // No minimum for token B
    );

    const receipt2 = await tx2.wait();
    const event2 = receipt2.events.find(e => e.event === "LiquidityAdded");
    const positionId2 = event2.args.positionId;

    // Verify second position was created
    const position2 = await liquidityPools.getPosition(positionId2);
    expect(position2.owner).to.equal(user2.address);
    expect(position2.poolId).to.equal(poolId);
    expect(position2.lowerTick).to.equal(narrowLowerTick);
    expect(position2.upperTick).to.equal(narrowUpperTick);
    expect(position2.liquidity).to.be.gt(0);

    // Verify pool state
    const poolState = await liquidityPools.getPoolState(poolId);
    expect(poolState.totalLiquidity).to.be.gt(0);
  });

  it("should perform swaps in the pool", async function () {
    // User1 swaps 1,000 of token A for token B
    await treasuryAssetA.connect(user1).approve(liquidityPools.address, ONE_THOUSAND);
    
    const balanceAbefore = await treasuryAssetA.balanceOf(user1.address);
    const balanceBbefore = await treasuryAssetB.balanceOf(user1.address);
    
    await liquidityPools.connect(user1).swap(
      poolId,
      user1.address, // recipient
      true, // exactInput
      true, // tokenA to tokenB
      ONE_THOUSAND, // 1,000 of token A in
      0, // No minimum output required
      0  // No deadline
    );
    
    const balanceAafter = await treasuryAssetA.balanceOf(user1.address);
    const balanceBafter = await treasuryAssetB.balanceOf(user1.address);
    
    // Verify balances changed
    expect(balanceAafter).to.be.lt(balanceAbefore);
    expect(balanceBafter).to.be.gt(balanceBbefore);
    
    // User2 swaps 1,000 of token B for token A
    await treasuryAssetB.connect(user2).approve(liquidityPools.address, ONE_THOUSAND);
    
    const balanceAbefore2 = await treasuryAssetA.balanceOf(user2.address);
    const balanceBbefore2 = await treasuryAssetB.balanceOf(user2.address);
    
    await liquidityPools.connect(user2).swap(
      poolId,
      user2.address, // recipient
      true, // exactInput
      false, // tokenB to tokenA
      ONE_THOUSAND, // 1,000 of token B in
      0, // No minimum output required
      0  // No deadline
    );
    
    const balanceAafter2 = await treasuryAssetA.balanceOf(user2.address);
    const balanceBafter2 = await treasuryAssetB.balanceOf(user2.address);
    
    // Verify balances changed in the other direction
    expect(balanceAafter2).to.be.gt(balanceAbefore2);
    expect(balanceBafter2).to.be.lt(balanceBbefore2);
    
    // Verify pool state has updated
    const poolState = await liquidityPools.getPoolState(poolId);
    expect(poolState.volumeTokenA).to.be.gt(0);
    expect(poolState.volumeTokenB).to.be.gt(0);
    expect(poolState.feesCollectedA).to.be.gt(0);
    expect(poolState.feesCollectedB).to.be.gt(0);
  });

  it("should collect fees from positions", async function () {
    // Get user1's positions
    const positionIds = await liquidityPools.getPositionsByOwner(user1.address);
    
    // Collect fees from the first position
    const positionBefore = await liquidityPools.getPosition(positionIds[0]);
    
    await liquidityPools.connect(user1).collectFees(positionIds[0]);
    
    // Verify fees were collected
    const positionAfter = await liquidityPools.getPosition(positionIds[0]);
    expect(positionAfter.tokensOwedA).to.equal(0);
    expect(positionAfter.tokensOwedB).to.equal(0);
    
    // If there were fees, they should have been transferred to the user
    if (positionBefore.tokensOwedA.gt(0) || positionBefore.tokensOwedB.gt(0)) {
      // Verify event was emitted
      const filter = liquidityPools.filters.FeesCollected(null, positionIds[0], user1.address);
      const events = await liquidityPools.queryFilter(filter);
      expect(events.length).to.be.gt(0);
    }
  });

  it("should remove liquidity from positions", async function () {
    // Get user2's positions
    const positionIds = await liquidityPools.getPositionsByOwner(user2.address);
    
    // Check position details before removal
    const positionBefore = await liquidityPools.getPosition(positionIds[0]);
    
    // Remove half the liquidity
    const halfLiquidity = positionBefore.liquidity.div(2);
    
    const balanceAbefore = await treasuryAssetA.balanceOf(user2.address);
    const balanceBbefore = await treasuryAssetB.balanceOf(user2.address);
    
    await liquidityPools.connect(user2).removeLiquidity(
      positionIds[0],
      halfLiquidity,
      0, // No minimum for token A
      0  // No minimum for token B
    );
    
    // Verify liquidity was reduced
    const positionAfter = await liquidityPools.getPosition(positionIds[0]);
    expect(positionAfter.liquidity).to.equal(positionBefore.liquidity.sub(halfLiquidity));
    
    // Verify tokens were returned to the user
    const balanceAafter = await treasuryAssetA.balanceOf(user2.address);
    const balanceBafter = await treasuryAssetB.balanceOf(user2.address);
    
    expect(balanceAafter).to.be.gt(balanceAbefore);
    expect(balanceBafter).to.be.gt(balanceBbefore);
    
    // Verify event was emitted
    const filter = liquidityPools.filters.LiquidityRemoved(null, positionIds[0], user2.address);
    const events = await liquidityPools.queryFilter(filter);
    expect(events.length).to.be.gt(0);
  });

  it("should support maturity and yield events on treasury assets", async function () {
    // Fast forward time by 1 year to simulate passing time for yield accrual
    await time.increase(365 * 24 * 60 * 60);
    
    // Issuer processes yield distribution on Asset A
    await treasuryAssetA.connect(issuer).processYieldDistribution();
    
    // Check that users received yield
    // Note: The actual yield calculation would depend on the specific implementation
    const user1YieldBalance = await treasuryAssetA.getAccruedYield(user1.address);
    expect(user1YieldBalance).to.be.gt(0);
    
    // User1 claims yield
    const balanceBefore = await treasuryAssetA.balanceOf(user1.address);
    await treasuryAssetA.connect(user1).claimYield();
    const balanceAfter = await treasuryAssetA.balanceOf(user1.address);
    
    // Verify user received yield tokens
    expect(balanceAfter).to.be.gt(balanceBefore);
  });

  it("should check cross-contract behavior during asset lifecycle events", async function () {
    // Simulate an asset entering maturity
    // Fast forward to just before Asset A maturity
    const assetDetails = await treasuryAssetA.getAssetDetails();
    await time.increaseTo(assetDetails.maturityDate.sub(10)); // 10 seconds before maturity
    
    // Check asset status
    expect(await treasuryAssetA.hasMatured()).to.be.false;
    
    // Fast forward past maturity
    await time.increaseTo(assetDetails.maturityDate.add(10)); // 10 seconds after maturity
    
    // Check asset status again
    expect(await treasuryAssetA.hasMatured()).to.be.true;
    
    // Verify impact on liquidity pool
    // Depending on implementation, matured assets might have restrictions
    // Here we just check that the pool is still active
    const poolConfig = await liquidityPools.getPoolConfig(poolId);
    expect(poolConfig.active).to.be.true;
    
    // Additional verification based on specific implementation details
    // For example, check if the pool enforces any restrictions on matured assets
    // This would depend on the specific business logic in your contracts
  });
}); 