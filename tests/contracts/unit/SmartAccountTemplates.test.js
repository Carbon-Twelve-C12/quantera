const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("SmartAccountTemplates Security Tests", function () {
  // Test fixture that deploys all needed contracts
  async function deploySmartAccountTemplatesFixture() {
    // Get signers
    const [admin, creator, user1, user2, delegate] = await ethers.getSigners();
    
    // Deploy SmartAccountTemplates
    const SmartAccountTemplates = await ethers.getContractFactory("SmartAccountTemplates");
    const smartAccountTemplates = await SmartAccountTemplates.deploy();
    
    // Grant roles
    const VERIFIER_ROLE = await smartAccountTemplates.VERIFIER_ROLE();
    await smartAccountTemplates.grantRole(VERIFIER_ROLE, admin.address);
    
    return { smartAccountTemplates, admin, creator, user1, user2, delegate };
  }
  
  describe("Role-Based Access Control", function () {
    it("Should allow only VERIFIER_ROLE to verify templates", async function () {
      const { smartAccountTemplates, creator, user1, user2 } = await loadFixture(deploySmartAccountTemplatesFixture);
      
      // Create a template first
      const tx = await smartAccountTemplates.connect(creator).createTemplate(
        "Test Template",
        "Template for testing",
        0, // YIELD_REINVESTMENT
        ethers.utils.toUtf8Bytes("test code"),
        true, // isPublic
        '{"type":"object"}', // parametersSchema
        "1.0.0" // version
      );
      
      const receipt = await tx.wait();
      
      // Find the TemplateCreated event to get the template ID
      const event = receipt.events.find(e => e.event === "TemplateCreated");
      const templateId = event.args.templateId;
      
      // User without role should not be able to verify a template
      await expect(
        smartAccountTemplates.connect(user1).verifyTemplate(
          templateId,
          20, // vulnerabilityRisk
          ["No major security concerns"], // securityNotes
          10 // performanceRisk
        )
      ).to.be.reverted;
      
      // Admin with VERIFIER_ROLE should be able to verify
      await expect(
        smartAccountTemplates.verifyTemplate(
          templateId,
          20, // vulnerabilityRisk
          ["No major security concerns"], // securityNotes
          10 // performanceRisk
        )
      ).to.not.be.reverted;
      
      // Verify the template was marked as verified
      const template = await smartAccountTemplates.getTemplate(templateId);
      expect(template.isVerified).to.be.true;
    });
    
    it("Should allow only ADMIN_ROLE to pause/unpause", async function () {
      const { smartAccountTemplates, user1 } = await loadFixture(deploySmartAccountTemplatesFixture);
      
      // User without role should not be able to pause
      await expect(
        smartAccountTemplates.connect(user1).pause()
      ).to.be.reverted;
      
      // Admin should be able to pause
      await expect(
        smartAccountTemplates.pause()
      ).to.not.be.reverted;
      
      // Verify the contract is paused
      expect(await smartAccountTemplates.paused()).to.be.true;
      
      // User without role should not be able to unpause
      await expect(
        smartAccountTemplates.connect(user1).unpause()
      ).to.be.reverted;
      
      // Admin should be able to unpause
      await expect(
        smartAccountTemplates.unpause()
      ).to.not.be.reverted;
      
      // Verify the contract is unpaused
      expect(await smartAccountTemplates.paused()).to.be.false;
    });
  });
  
  describe("Custom Error Handling", function () {
    it("Should revert with EmptyInput for empty string parameters", async function () {
      const { smartAccountTemplates, creator } = await loadFixture(deploySmartAccountTemplatesFixture);
      
      // Try to create template with empty name
      await expect(
        smartAccountTemplates.connect(creator).createTemplate(
          "", // empty name
          "Template for testing",
          0, // YIELD_REINVESTMENT
          ethers.utils.toUtf8Bytes("test code"),
          true, // isPublic
          '{"type":"object"}', // parametersSchema
          "1.0.0" // version
        )
      ).to.be.revertedWithCustomError(smartAccountTemplates, "EmptyInput");
      
      // Try with empty code
      await expect(
        smartAccountTemplates.connect(creator).createTemplate(
          "Test Template",
          "Template for testing",
          0, // YIELD_REINVESTMENT
          ethers.utils.toUtf8Bytes(""), // empty code
          true, // isPublic
          '{"type":"object"}', // parametersSchema
          "1.0.0" // version
        )
      ).to.be.revertedWithCustomError(smartAccountTemplates, "EmptyInput");
    });
    
    it("Should revert with TemplateNotFound when template doesn't exist", async function () {
      const { smartAccountTemplates } = await loadFixture(deploySmartAccountTemplatesFixture);
      
      const nonExistentTemplateId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("non-existent"));
      
      // Try to get non-existent template
      await expect(
        smartAccountTemplates.getTemplate(nonExistentTemplateId)
      ).to.be.revertedWithCustomError(smartAccountTemplates, "TemplateNotFound");
      
      // Try to update non-existent template
      await expect(
        smartAccountTemplates.updateTemplate(
          nonExistentTemplateId,
          "Updated Template",
          "Updated description",
          ethers.utils.toUtf8Bytes("updated code"),
          true, // isPublic
          '{"type":"object"}', // parametersSchema
          "1.0.1" // version
        )
      ).to.be.revertedWithCustomError(smartAccountTemplates, "TemplateNotFound");
    });
    
    it("Should revert with NotTemplateCreator when unauthorized", async function () {
      const { smartAccountTemplates, creator, user1 } = await loadFixture(deploySmartAccountTemplatesFixture);
      
      // Create a template first
      const tx = await smartAccountTemplates.connect(creator).createTemplate(
        "Test Template",
        "Template for testing",
        0, // YIELD_REINVESTMENT
        ethers.utils.toUtf8Bytes("test code"),
        true, // isPublic
        '{"type":"object"}', // parametersSchema
        "1.0.0" // version
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "TemplateCreated");
      const templateId = event.args.templateId;
      
      // User who is not creator should not be able to update
      await expect(
        smartAccountTemplates.connect(user1).updateTemplate(
          templateId,
          "Updated Template",
          "Updated description",
          ethers.utils.toUtf8Bytes("updated code"),
          true, // isPublic
          '{"type":"object"}', // parametersSchema
          "1.0.1" // version
        )
      ).to.be.revertedWithCustomError(smartAccountTemplates, "Unauthorized");
      
      // Creator should be able to update
      await expect(
        smartAccountTemplates.connect(creator).updateTemplate(
          templateId,
          "Updated Template",
          "Updated description",
          ethers.utils.toUtf8Bytes("updated code"),
          true, // isPublic
          '{"type":"object"}', // parametersSchema
          "1.0.1" // version
        )
      ).to.not.be.reverted;
    });
    
    it("Should revert with ValueOutOfRange for invalid risk scores", async function () {
      const { smartAccountTemplates, creator } = await loadFixture(deploySmartAccountTemplatesFixture);
      
      // Create a template first
      const tx = await smartAccountTemplates.connect(creator).createTemplate(
        "Test Template",
        "Template for testing",
        0, // YIELD_REINVESTMENT
        ethers.utils.toUtf8Bytes("test code"),
        true, // isPublic
        '{"type":"object"}', // parametersSchema
        "1.0.0" // version
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "TemplateCreated");
      const templateId = event.args.templateId;
      
      // Try to verify with vulnerability risk over 100
      await expect(
        smartAccountTemplates.verifyTemplate(
          templateId,
          101, // vulnerabilityRisk - over 100
          ["Security concerns"], // securityNotes
          50 // performanceRisk
        )
      ).to.be.revertedWithCustomError(smartAccountTemplates, "ValueOutOfRange");
      
      // Try to verify with performance risk over 100
      await expect(
        smartAccountTemplates.verifyTemplate(
          templateId,
          50, // vulnerabilityRisk
          ["Security concerns"], // securityNotes
          101 // performanceRisk - over 100
        )
      ).to.be.revertedWithCustomError(smartAccountTemplates, "ValueOutOfRange");
    });
  });
  
  describe("Delegation Security", function () {
    it("Should properly manage delegates for an account", async function () {
      const { smartAccountTemplates, creator, user1, delegate } = await loadFixture(deploySmartAccountTemplatesFixture);
      
      // Create a template
      const tx = await smartAccountTemplates.connect(creator).createTemplate(
        "Test Template",
        "Template for testing",
        0, // YIELD_REINVESTMENT
        ethers.utils.toUtf8Bytes("test code"),
        true, // isPublic
        '{"type":"object"}', // parametersSchema
        "1.0.0" // version
      );
      
      const receipt = await tx.wait();
      const templateId = receipt.events.find(e => e.event === "TemplateCreated").args.templateId;
      
      // Deploy an account from the template
      // Note: In a real implementation, we would need to pass real parameters
      // For this test, we'll create a simplified version
      const deployTx = await smartAccountTemplates.connect(user1).deployAccount(
        templateId,
        { values: {} } // empty parameters map for simplicity
      );
      
      const deployReceipt = await deployTx.wait();
      const accountId = deployReceipt.events.find(e => e.event === "AccountDeployed").args.accountId;
      
      // Add a delegate
      await expect(
        smartAccountTemplates.connect(user1).addDelegate(
          accountId,
          delegate.address
        )
      ).to.emit(smartAccountTemplates, "DelegateAdded")
        .withArgs(accountId, delegate.address);
      
      // Verify delegate was added
      expect(await smartAccountTemplates.isDelegate(accountId, delegate.address)).to.be.true;
      
      // Non-owner should not be able to add delegate
      await expect(
        smartAccountTemplates.connect(creator).addDelegate(
          accountId,
          creator.address
        )
      ).to.be.revertedWithCustomError(smartAccountTemplates, "NotAccountOwner");
      
      // Remove delegate
      await expect(
        smartAccountTemplates.connect(user1).removeDelegate(
          accountId,
          delegate.address
        )
      ).to.emit(smartAccountTemplates, "DelegateRemoved")
        .withArgs(accountId, delegate.address);
      
      // Verify delegate was removed
      expect(await smartAccountTemplates.isDelegate(accountId, delegate.address)).to.be.false;
      
      // Non-owner should not be able to remove delegate
      await expect(
        smartAccountTemplates.connect(creator).removeDelegate(
          accountId,
          delegate.address
        )
      ).to.be.revertedWithCustomError(smartAccountTemplates, "NotAccountOwner");
    });
    
    it("Should validate delegated executions with proper nonce handling", async function () {
      const { smartAccountTemplates, creator, user1, delegate } = await loadFixture(deploySmartAccountTemplatesFixture);
      
      // Create a template
      const tx = await smartAccountTemplates.connect(creator).createTemplate(
        "Test Template",
        "Template for testing",
        0, // YIELD_REINVESTMENT
        ethers.utils.toUtf8Bytes("test code"),
        true, // isPublic
        '{"type":"object"}', // parametersSchema
        "1.0.0" // version
      );
      
      const receipt = await tx.wait();
      const templateId = receipt.events.find(e => e.event === "TemplateCreated").args.templateId;
      
      // Deploy an account
      const deployTx = await smartAccountTemplates.connect(user1).deployAccount(
        templateId,
        { values: {} } // empty parameters map for simplicity
      );
      
      const deployReceipt = await deployTx.wait();
      const accountId = deployReceipt.events.find(e => e.event === "AccountDeployed").args.accountId;
      
      // Add delegate
      await smartAccountTemplates.connect(user1).addDelegate(
        accountId,
        delegate.address
      );
      
      // Generate a nonce
      const nonceTx = await smartAccountTemplates.connect(user1).generateNonce(accountId);
      const nonceReceipt = await nonceTx.wait();
      const nonce = await nonceReceipt.events[0].args[0] || 1; // Fallback to 1 if event not found
      
      // Attempt delegated execution
      const executionData = ethers.utils.toUtf8Bytes("test execution");
      const validUntil = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      
      // Delegate should be able to execute
      await expect(
        smartAccountTemplates.connect(delegate).executeAccount(
          accountId,
          executionData,
          {
            delegated: true,
            delegate: delegate.address,
            nonce: nonce,
            validUntil: validUntil
          }
        )
      ).to.emit(smartAccountTemplates, "AccountExecuted");
      
      // Trying to reuse the nonce should fail
      await expect(
        smartAccountTemplates.connect(delegate).executeAccount(
          accountId,
          executionData,
          {
            delegated: true,
            delegate: delegate.address,
            nonce: nonce,
            validUntil: validUntil
          }
        )
      ).to.be.revertedWithCustomError(smartAccountTemplates, "NonceAlreadyUsed");
      
      // Non-delegate should not be able to execute as delegate
      const nonceForUser = await smartAccountTemplates.connect(user1).generateNonce(accountId);
      
      await expect(
        smartAccountTemplates.connect(creator).executeAccount(
          accountId,
          executionData,
          {
            delegated: true,
            delegate: creator.address,
            nonce: nonceForUser,
            validUntil: validUntil
          }
        )
      ).to.be.revertedWithCustomError(smartAccountTemplates, "NotDelegateAuthorized");
    });
  });
  
  describe("Checks-Effects-Interactions Pattern", function () {
    it("Should properly handle nonce state before external interactions", async function () {
      const { smartAccountTemplates, creator, user1 } = await loadFixture(deploySmartAccountTemplatesFixture);
      
      // Create a template
      const tx = await smartAccountTemplates.connect(creator).createTemplate(
        "Test Template",
        "Template for testing",
        0, // YIELD_REINVESTMENT
        ethers.utils.toUtf8Bytes("test code"),
        true, // isPublic
        '{"type":"object"}', // parametersSchema
        "1.0.0" // version
      );
      
      const receipt = await tx.wait();
      const templateId = receipt.events.find(e => e.event === "TemplateCreated").args.templateId;
      
      // Deploy an account
      const deployTx = await smartAccountTemplates.connect(user1).deployAccount(
        templateId,
        { values: {} } // empty parameters map for simplicity
      );
      
      const deployReceipt = await deployTx.wait();
      const accountId = deployReceipt.events.find(e => e.event === "AccountDeployed").args.accountId;
      
      // Get account details before execution
      const accountBefore = await smartAccountTemplates.getAccount(accountId);
      
      // Execute account
      const executionData = ethers.utils.toUtf8Bytes("test execution");
      
      await smartAccountTemplates.connect(user1).executeAccount(
        accountId,
        executionData,
        {
          delegated: false,
          delegate: ethers.constants.AddressZero,
          nonce: 0,
          validUntil: 0
        }
      );
      
      // Verify account state was updated
      const accountAfter = await smartAccountTemplates.getAccount(accountId);
      expect(accountAfter.executionCount).to.equal(accountBefore.executionCount.add(1));
      expect(accountAfter.lastExecution).to.be.gt(accountBefore.lastExecution);
      
      // Verify operation history was updated
      const operations = await smartAccountTemplates.getOperationHistory(accountId);
      expect(operations.length).to.equal(1);
      expect(operations[0].operationType).to.equal("execute");
      expect(operations[0].executed_by).to.equal(user1.address);
    });
    
    it("Should properly update template usage count on account deployment", async function () {
      const { smartAccountTemplates, creator, user1, user2 } = await loadFixture(deploySmartAccountTemplatesFixture);
      
      // Create a template
      const tx = await smartAccountTemplates.connect(creator).createTemplate(
        "Test Template",
        "Template for testing",
        0, // YIELD_REINVESTMENT
        ethers.utils.toUtf8Bytes("test code"),
        true, // isPublic
        '{"type":"object"}', // parametersSchema
        "1.0.0" // version
      );
      
      const receipt = await tx.wait();
      const templateId = receipt.events.find(e => e.event === "TemplateCreated").args.templateId;
      
      // Check initial usage count
      let template = await smartAccountTemplates.getTemplate(templateId);
      expect(template.usageCount).to.equal(0);
      
      // Deploy first account
      await smartAccountTemplates.connect(user1).deployAccount(
        templateId,
        { values: {} } // empty parameters map for simplicity
      );
      
      // Check usage count after first deployment
      template = await smartAccountTemplates.getTemplate(templateId);
      expect(template.usageCount).to.equal(1);
      
      // Deploy second account
      await smartAccountTemplates.connect(user2).deployAccount(
        templateId,
        { values: {} } // empty parameters map for simplicity
      );
      
      // Check usage count after second deployment
      template = await smartAccountTemplates.getTemplate(templateId);
      expect(template.usageCount).to.equal(2);
    });
  });
  
  describe("Template Type Security", function () {
    it("Should create and validate specialized templates", async function () {
      const { smartAccountTemplates, creator } = await loadFixture(deploySmartAccountTemplatesFixture);
      
      // Create yield reinvestment template
      const yieldTx = await smartAccountTemplates.connect(creator).createYieldReinvestmentTemplate(
        "Yield Reinvestment",
        "Auto-compound yields",
        true, // isPublic
        86400, // autoCompoundFrequency (1 day)
        ethers.utils.parseEther("0.1"), // minReinvestAmount
        [ethers.Wallet.createRandom().address, ethers.Wallet.createRandom().address], // reinvestmentTargets
        [60, 40] // reinvestmentAllocations (60% / 40%)
      );
      
      const yieldReceipt = await yieldTx.wait();
      const yieldTemplateId = yieldReceipt.events.find(e => e.event === "TemplateCreated").args.templateId;
      
      // Verify template was created with correct type
      const yieldTemplate = await smartAccountTemplates.getTemplate(yieldTemplateId);
      expect(yieldTemplate.templateType).to.equal(0); // YIELD_REINVESTMENT
      
      // Create DCA template
      const dcaTx = await smartAccountTemplates.connect(creator).createDCATemplate(
        "Dollar Cost Averaging",
        "Automated DCA strategy",
        true, // isPublic
        ethers.Wallet.createRandom().address, // sourceAsset
        ethers.Wallet.createRandom().address, // targetAsset
        ethers.utils.parseEther("0.5"), // investmentAmount
        86400, // frequency (1 day)
        2592000, // duration (30 days)
        5 // maxSlippage (5%)
      );
      
      const dcaReceipt = await dcaTx.wait();
      const dcaTemplateId = dcaReceipt.events.find(e => e.event === "TemplateCreated").args.templateId;
      
      // Verify template was created with correct type
      const dcaTemplate = await smartAccountTemplates.getTemplate(dcaTemplateId);
      expect(dcaTemplate.templateType).to.equal(3); // DOLLAR_COST_AVERAGING
      
      // Get templates by type
      const yieldTemplates = await smartAccountTemplates.getTemplatesByType(0); // YIELD_REINVESTMENT
      expect(yieldTemplates.length).to.equal(1);
      expect(yieldTemplates[0]).to.equal(yieldTemplateId);
      
      const dcaTemplates = await smartAccountTemplates.getTemplatesByType(3); // DOLLAR_COST_AVERAGING
      expect(dcaTemplates.length).to.equal(1);
      expect(dcaTemplates[0]).to.equal(dcaTemplateId);
    });
  });
}); 