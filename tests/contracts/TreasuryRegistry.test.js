const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TreasuryRegistry", function () {
  let TreasuryRegistry;
  let registry;
  let owner;
  let issuer;
  let operator;
  let user;
  
  // Test data
  const treasuryType = {
    TBILL: 0,
    TNOTE: 1,
    TBOND: 2
  };
  
  const treasuryStatus = {
    ACTIVE: 0,
    MATURED: 1,
    REDEEMED: 2
  };

  beforeEach(async function () {
    // Get signers
    [owner, issuer, operator, user] = await ethers.getSigners();
    
    // Deploy TreasuryRegistry contract
    TreasuryRegistry = await ethers.getContractFactory("TreasuryRegistry");
    registry = await TreasuryRegistry.deploy(owner.address);
    await registry.deployed();
    
    // Add issuer as an approved issuer
    await registry.connect(owner).addApprovedIssuer(issuer.address);
  });

  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      expect(await registry.admin()).to.equal(owner.address);
    });
    
    it("Should make admin an approved issuer", async function () {
      expect(await registry.approvedIssuers(owner.address)).to.equal(true);
    });
  });
  
  describe("Issuer Management", function () {
    it("Should allow admin to add approved issuers", async function () {
      const newIssuer = user.address;
      
      await registry.connect(owner).addApprovedIssuer(newIssuer);
      
      expect(await registry.approvedIssuers(newIssuer)).to.equal(true);
    });
    
    it("Should allow admin to remove approved issuers", async function () {
      await registry.connect(owner).removeApprovedIssuer(issuer.address);
      
      expect(await registry.approvedIssuers(issuer.address)).to.equal(false);
    });
    
    it("Should prevent removing admin as an issuer", async function () {
      await expect(
        registry.connect(owner).removeApprovedIssuer(owner.address)
      ).to.be.revertedWith("TreasuryRegistry: cannot remove admin as issuer");
    });
    
    it("Should prevent non-admin from adding issuers", async function () {
      await expect(
        registry.connect(user).addApprovedIssuer(user.address)
      ).to.be.revertedWith("TreasuryRegistry: caller is not admin");
    });
  });
  
  describe("Treasury Registration", function () {
    const tokenAddress = "0x1111111111111111111111111111111111111111";
    const tokenId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TEST_TREASURY"));
    const metadataURI = "ipfs://QmTest";
    const issuanceDate = Math.floor(Date.now() / 1000);
    const maturityDate = issuanceDate + 365 * 24 * 60 * 60; // One year from now
    const yieldRate = 350; // 3.5%
    
    it("Should allow approved issuer to register treasury", async function () {
      await registry.connect(issuer).registerTreasury(
        tokenAddress,
        tokenId,
        metadataURI,
        treasuryType.TNOTE,
        issuanceDate,
        maturityDate,
        yieldRate
      );
      
      const treasuryInfo = await registry.getTreasuryDetails(tokenId);
      
      expect(treasuryInfo.tokenAddress).to.equal(tokenAddress);
      expect(treasuryInfo.metadataURI).to.equal(metadataURI);
      expect(treasuryInfo.status).to.equal(treasuryStatus.ACTIVE);
      expect(treasuryInfo.issuanceDate).to.equal(issuanceDate);
      expect(treasuryInfo.maturityDate).to.equal(maturityDate);
      expect(treasuryInfo.yieldRate).to.equal(yieldRate);
      expect(treasuryInfo.issuer).to.equal(issuer.address);
    });
    
    it("Should prevent non-approved issuer from registering treasury", async function () {
      await expect(
        registry.connect(user).registerTreasury(
          tokenAddress,
          tokenId,
          metadataURI,
          treasuryType.TNOTE,
          issuanceDate,
          maturityDate,
          yieldRate
        )
      ).to.be.revertedWith("TreasuryRegistry: caller is not approved issuer");
    });
    
    it("Should prevent registering with zero token address", async function () {
      await expect(
        registry.connect(issuer).registerTreasury(
          ethers.constants.AddressZero,
          tokenId,
          metadataURI,
          treasuryType.TNOTE,
          issuanceDate,
          maturityDate,
          yieldRate
        )
      ).to.be.revertedWith("TreasuryRegistry: token address is zero");
    });
    
    it("Should prevent registering with empty metadata URI", async function () {
      await expect(
        registry.connect(issuer).registerTreasury(
          tokenAddress,
          tokenId,
          "",
          treasuryType.TNOTE,
          issuanceDate,
          maturityDate,
          yieldRate
        )
      ).to.be.revertedWith("TreasuryRegistry: metadata URI is empty");
    });
    
    it("Should prevent registering with invalid maturity date", async function () {
      await expect(
        registry.connect(issuer).registerTreasury(
          tokenAddress,
          tokenId,
          metadataURI,
          treasuryType.TNOTE,
          issuanceDate,
          issuanceDate - 1,
          yieldRate
        )
      ).to.be.revertedWith("TreasuryRegistry: maturity date must be after issuance date");
    });
    
    it("Should prevent registering the same treasury twice", async function () {
      await registry.connect(issuer).registerTreasury(
        tokenAddress,
        tokenId,
        metadataURI,
        treasuryType.TNOTE,
        issuanceDate,
        maturityDate,
        yieldRate
      );
      
      await expect(
        registry.connect(issuer).registerTreasury(
          tokenAddress,
          tokenId,
          metadataURI,
          treasuryType.TNOTE,
          issuanceDate,
          maturityDate,
          yieldRate
        )
      ).to.be.revertedWith("TreasuryRegistry: treasury already exists");
    });
    
    it("Should add to treasury arrays correctly", async function () {
      await registry.connect(issuer).registerTreasury(
        tokenAddress,
        tokenId,
        metadataURI,
        treasuryType.TNOTE,
        issuanceDate,
        maturityDate,
        yieldRate
      );
      
      const allTreasuries = await registry.getAllTreasuries();
      const treasuriesByType = await registry.getTreasuriesByType(treasuryType.TNOTE);
      const treasuriesByStatus = await registry.getTreasuriesByStatus(treasuryStatus.ACTIVE);
      
      expect(allTreasuries).to.include(tokenId);
      expect(treasuriesByType).to.include(tokenId);
      expect(treasuriesByStatus).to.include(tokenId);
    });
  });
  
  describe("Treasury Status Update", function () {
    const tokenAddress = "0x1111111111111111111111111111111111111111";
    const tokenId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TEST_TREASURY"));
    const metadataURI = "ipfs://QmTest";
    const issuanceDate = Math.floor(Date.now() / 1000);
    const maturityDate = issuanceDate + 365 * 24 * 60 * 60; // One year from now
    const yieldRate = 350; // 3.5%
    
    beforeEach(async function () {
      // Register a treasury for testing
      await registry.connect(issuer).registerTreasury(
        tokenAddress,
        tokenId,
        metadataURI,
        treasuryType.TNOTE,
        issuanceDate,
        maturityDate,
        yieldRate
      );
    });
    
    it("Should allow issuer to update treasury status", async function () {
      await registry.connect(issuer).updateTreasuryStatus(tokenId, treasuryStatus.MATURED);
      
      const treasuryInfo = await registry.getTreasuryDetails(tokenId);
      expect(treasuryInfo.status).to.equal(treasuryStatus.MATURED);
    });
    
    it("Should allow admin to update treasury status", async function () {
      await registry.connect(owner).updateTreasuryStatus(tokenId, treasuryStatus.MATURED);
      
      const treasuryInfo = await registry.getTreasuryDetails(tokenId);
      expect(treasuryInfo.status).to.equal(treasuryStatus.MATURED);
    });
    
    it("Should prevent non-issuer/non-admin from updating treasury status", async function () {
      await expect(
        registry.connect(user).updateTreasuryStatus(tokenId, treasuryStatus.MATURED)
      ).to.be.revertedWith("TreasuryRegistry: caller is not issuer or admin");
    });
    
    it("Should prevent updating non-existent treasury", async function () {
      const nonExistentTokenId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("NON_EXISTENT"));
      
      await expect(
        registry.connect(issuer).updateTreasuryStatus(nonExistentTokenId, treasuryStatus.MATURED)
      ).to.be.revertedWith("TreasuryRegistry: treasury does not exist");
    });
    
    it("Should update the status arrays when status changes", async function () {
      await registry.connect(issuer).updateTreasuryStatus(tokenId, treasuryStatus.MATURED);
      
      const activeTreasuries = await registry.getTreasuriesByStatus(treasuryStatus.ACTIVE);
      const maturedTreasuries = await registry.getTreasuriesByStatus(treasuryStatus.MATURED);
      
      expect(activeTreasuries).to.not.include(tokenId);
      expect(maturedTreasuries).to.include(tokenId);
    });
    
    it("Should prevent changing from REDEEMED status", async function () {
      // First update to REDEEMED
      await registry.connect(issuer).updateTreasuryStatus(tokenId, treasuryStatus.REDEEMED);
      
      // Then try to update to ACTIVE
      await expect(
        registry.connect(issuer).updateTreasuryStatus(tokenId, treasuryStatus.ACTIVE)
      ).to.be.revertedWith("TreasuryRegistry: cannot change from REDEEMED status");
    });
  });
  
  describe("Treasury Price Update", function () {
    const tokenAddress = "0x1111111111111111111111111111111111111111";
    const tokenId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TEST_TREASURY"));
    const metadataURI = "ipfs://QmTest";
    const issuanceDate = Math.floor(Date.now() / 1000);
    const maturityDate = issuanceDate + 365 * 24 * 60 * 60; // One year from now
    const yieldRate = 350; // 3.5%
    
    beforeEach(async function () {
      // Register a treasury for testing
      await registry.connect(issuer).registerTreasury(
        tokenAddress,
        tokenId,
        metadataURI,
        treasuryType.TNOTE,
        issuanceDate,
        maturityDate,
        yieldRate
      );
    });
    
    it("Should allow issuer to update treasury price", async function () {
      const newPrice = ethers.utils.parseEther("980.25");
      
      await registry.connect(issuer).updateTreasuryPrice(tokenId, newPrice);
      
      const treasuryInfo = await registry.getTreasuryDetails(tokenId);
      expect(treasuryInfo.currentPrice).to.equal(newPrice);
    });
    
    it("Should allow admin to update treasury price", async function () {
      const newPrice = ethers.utils.parseEther("980.25");
      
      await registry.connect(owner).updateTreasuryPrice(tokenId, newPrice);
      
      const treasuryInfo = await registry.getTreasuryDetails(tokenId);
      expect(treasuryInfo.currentPrice).to.equal(newPrice);
    });
    
    it("Should prevent non-issuer/non-admin from updating treasury price", async function () {
      const newPrice = ethers.utils.parseEther("980.25");
      
      await expect(
        registry.connect(user).updateTreasuryPrice(tokenId, newPrice)
      ).to.be.revertedWith("TreasuryRegistry: caller is not issuer or admin");
    });
    
    it("Should prevent updating price for REDEEMED treasury", async function () {
      // First update status to REDEEMED
      await registry.connect(issuer).updateTreasuryStatus(tokenId, treasuryStatus.REDEEMED);
      
      // Then try to update price
      const newPrice = ethers.utils.parseEther("980.25");
      
      await expect(
        registry.connect(issuer).updateTreasuryPrice(tokenId, newPrice)
      ).to.be.revertedWith("TreasuryRegistry: cannot update price for REDEEMED treasury");
    });
  });
  
  describe("Delegated Operations", function () {
    it("Should allow delegating an operator", async function () {
      await registry.connect(issuer).delegateOperator(operator.address, true);
      
      expect(await registry.isDelegatedOperator(issuer.address, operator.address)).to.be.true;
    });
    
    it("Should allow revoking an operator", async function () {
      // First delegate
      await registry.connect(issuer).delegateOperator(operator.address, true);
      
      // Then revoke
      await registry.connect(issuer).delegateOperator(operator.address, false);
      
      expect(await registry.isDelegatedOperator(issuer.address, operator.address)).to.be.false;
    });
    
    it("Should prevent delegating to zero address", async function () {
      await expect(
        registry.connect(issuer).delegateOperator(ethers.constants.AddressZero, true)
      ).to.be.revertedWith("TreasuryRegistry: operator is the zero address");
    });
    
    it("Should prevent delegating to self", async function () {
      await expect(
        registry.connect(issuer).delegateOperator(issuer.address, true)
      ).to.be.revertedWith("TreasuryRegistry: cannot delegate to self");
    });
    
    it("Should track delegated operations correctly", async function () {
      // Set up a treasury
      const tokenAddress = "0x1111111111111111111111111111111111111111";
      const tokenId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TEST_TREASURY"));
      const metadataURI = "ipfs://QmTest";
      const issuanceDate = Math.floor(Date.now() / 1000);
      const maturityDate = issuanceDate + 365 * 24 * 60 * 60; // One year from now
      const yieldRate = 350; // 3.5%
      
      await registry.connect(issuer).registerTreasury(
        tokenAddress,
        tokenId,
        metadataURI,
        treasuryType.TNOTE,
        issuanceDate,
        maturityDate,
        yieldRate
      );
      
      // Delegate operator
      await registry.connect(issuer).delegateOperator(operator.address, true);
      
      // Mock operation data
      const operationData = ethers.utils.hexlify(ethers.utils.toUtf8Bytes("TEST_OPERATION"));
      
      // Mock the token address as the registry itself for testing
      // In a real scenario, we'd need to deploy a mock token contract
      const treasuryInfo = await registry.getTreasuryDetails(tokenId);
      
      // Since we can't execute this properly in a test without mocking external contract calls,
      // we'll just check that the function reverts with the expected message when trying to call a non-existent function
      await expect(
        registry.connect(operator).executeAsDelegated(issuer.address, tokenId, operationData)
      ).to.be.revertedWith("TreasuryRegistry: operation execution failed");
    });
  });
  
  describe("View Functions", function () {
    const tokenAddress = "0x1111111111111111111111111111111111111111";
    const tokenId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TEST_TREASURY"));
    const metadataURI = "ipfs://QmTest";
    const issuanceDate = Math.floor(Date.now() / 1000);
    const maturityDate = issuanceDate + 365 * 24 * 60 * 60; // One year from now
    const yieldRate = 350; // 3.5%
    
    beforeEach(async function () {
      // Register a treasury for testing
      await registry.connect(issuer).registerTreasury(
        tokenAddress,
        tokenId,
        metadataURI,
        treasuryType.TNOTE,
        issuanceDate,
        maturityDate,
        yieldRate
      );
    });
    
    it("Should get treasury details correctly", async function () {
      const treasuryInfo = await registry.getTreasuryDetails(tokenId);
      
      expect(treasuryInfo.tokenAddress).to.equal(tokenAddress);
      expect(treasuryInfo.metadataURI).to.equal(metadataURI);
      expect(treasuryInfo.status).to.equal(treasuryStatus.ACTIVE);
      expect(treasuryInfo.issuanceDate).to.equal(issuanceDate);
      expect(treasuryInfo.maturityDate).to.equal(maturityDate);
      expect(treasuryInfo.yieldRate).to.equal(yieldRate);
      expect(treasuryInfo.issuer).to.equal(issuer.address);
    });
    
    it("Should get all treasuries correctly", async function () {
      const allTreasuries = await registry.getAllTreasuries();
      
      expect(allTreasuries.length).to.equal(1);
      expect(allTreasuries[0]).to.equal(tokenId);
    });
    
    it("Should get treasuries by type correctly", async function () {
      const treasuriesByType = await registry.getTreasuriesByType(treasuryType.TNOTE);
      
      expect(treasuriesByType.length).to.equal(1);
      expect(treasuriesByType[0]).to.equal(tokenId);
      
      // Check other types
      const tbillTreasuries = await registry.getTreasuriesByType(treasuryType.TBILL);
      expect(tbillTreasuries.length).to.equal(0);
    });
    
    it("Should get treasuries by status correctly", async function () {
      const activeTreasuries = await registry.getTreasuriesByStatus(treasuryStatus.ACTIVE);
      
      expect(activeTreasuries.length).to.equal(1);
      expect(activeTreasuries[0]).to.equal(tokenId);
      
      // Check other statuses
      const maturedTreasuries = await registry.getTreasuriesByStatus(treasuryStatus.MATURED);
      expect(maturedTreasuries.length).to.equal(0);
    });
    
    it("Should check if issuer is approved correctly", async function () {
      expect(await registry.isApprovedIssuer(issuer.address)).to.be.true;
      expect(await registry.isApprovedIssuer(user.address)).to.be.false;
    });
    
    it("Should check if operator is delegated correctly", async function () {
      // Delegate operator
      await registry.connect(issuer).delegateOperator(operator.address, true);
      
      expect(await registry.isDelegatedOperator(issuer.address, operator.address)).to.be.true;
      expect(await registry.isDelegatedOperator(issuer.address, user.address)).to.be.false;
    });
  });
}); 