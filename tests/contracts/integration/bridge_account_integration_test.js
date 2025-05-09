const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("L2Bridge and SmartAccountTemplates Integration", function () {
  let l2Bridge;
  let smartAccounts;
  let owner;
  let user1;
  let user2;
  let delegateAddress;

  before(async function () {
    // Get signers
    [owner, user1, user2, delegateAddress] = await ethers.getSigners();
    
    // Deploy SmartAccountTemplates contract
    const SmartAccountTemplates = await ethers.getContractFactory("SmartAccountTemplates");
    smartAccounts = await SmartAccountTemplates.deploy();
    await smartAccounts.deployed();

    // Deploy L2Bridge contract
    const L2Bridge = await ethers.getContractFactory("L2Bridge");
    l2Bridge = await L2Bridge.deploy();
    await l2Bridge.deployed();

    // Setup roles for L2Bridge
    const ADMIN_ROLE = await l2Bridge.ADMIN_ROLE();
    const OPERATOR_ROLE = await l2Bridge.OPERATOR_ROLE();
    const RELAYER_ROLE = await l2Bridge.RELAYER_ROLE();

    await l2Bridge.grantRole(OPERATOR_ROLE, owner.address);
    await l2Bridge.grantRole(RELAYER_ROLE, owner.address);

    // Setup test L2 chains
    await l2Bridge.addChain(
      10, // Optimism
      0, // L2Chain.OPTIMISM
      "Optimism",
      ethers.constants.AddressZero, // Bridge address - would be actual address in production
      ethers.constants.AddressZero, // Rollup address
      12, // verification blocks
      "ETH",
      ethers.utils.parseEther("2000"), // Native token price in USD (2000 USD)
      2, // 2 second average block time
      true, // blob enabled
      200000 // max message size
    );

    await l2Bridge.addChain(
      42161, // Arbitrum One
      1, // L2Chain.ARBITRUM
      "Arbitrum One",
      ethers.constants.AddressZero, // Bridge address
      ethers.constants.AddressZero, // Rollup address
      15, // verification blocks
      "ETH",
      ethers.utils.parseEther("2000"), // Native token price in USD
      0.25, // 0.25 second average block time
      true, // blob enabled
      500000 // max message size
    );

    // Setup roles for SmartAccountTemplates
    const VERIFIER_ROLE = await smartAccounts.VERIFIER_ROLE();
    await smartAccounts.grantRole(VERIFIER_ROLE, owner.address);
  });

  describe("Cross-chain Template Deployment", function () {
    let templateId;
    let messageId;

    it("Should create a template on the source chain", async function () {
      // Create a simple automated trading template
      const templateCode = ethers.utils.toUtf8Bytes(`
        function execute(params) {
          if (params.price > params.threshold) {
            return {action: 'buy', amount: params.amount};
          }
          return {action: 'wait'};
        }
      `);

      const tx = await smartAccounts.createTemplate(
        "Automated Trading Template",
        "Buys assets when price crosses threshold",
        1, // TemplateType.AUTOMATED_TRADING
        templateCode,
        true, // public
        '{"properties":{"threshold":{"type":"number"},"amount":{"type":"number"}}}', // schema
        "1.0.0" // version
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'TemplateCreated');
      templateId = event.args.templateId;
      
      // Verify the template exists
      const template = await smartAccounts.getTemplate(templateId);
      expect(template.name).to.equal("Automated Trading Template");
      expect(template.isPublic).to.equal(true);
    });

    it("Should verify the template", async function () {
      await smartAccounts.verifyTemplate(
        templateId,
        20, // vulnerability risk (0-100)
        ["No significant vulnerabilities found", "Non-critical: Parameter validation could be improved"],
        15 // performance risk (0-100)
      );

      const template = await smartAccounts.getTemplate(templateId);
      expect(template.isVerified).to.equal(true);
    });

    it("Should bridge the template to L2 chains", async function () {
      // Encode the template data to send across the bridge
      const templateData = await smartAccounts.getTemplate(templateId);
      const encodedTemplateData = ethers.utils.defaultAbiCoder.encode(
        [
          "bytes32", // templateId
          "string", // name
          "string", // description
          "uint8", // templateType
          "address", // creator
          "bytes", // code
          "bool", // isPublic
          "bool", // isVerified
          "uint64", // creationDate
          "uint64", // verificationDate
          "string", // parametersSchema
          "string" // version
        ],
        [
          templateId,
          templateData.name,
          templateData.description,
          templateData.templateType,
          templateData.creator,
          templateData.code,
          templateData.isPublic,
          templateData.isVerified,
          templateData.creationDate,
          templateData.verificationDate || 0,
          templateData.parametersSchema,
          templateData.version
        ]
      );

      // Bridge to Optimism
      const optimismChainId = 10;
      const tx = await l2Bridge.connect(user1).createMessageForTest(
        optimismChainId,
        ethers.constants.AddressZero, // recipient on L2 - would be the L2 SmartAccountTemplates address
        encodedTemplateData,
        0 // amount
      );

      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'MessageSent');
      messageId = event.args.messageId;

      // Check that the message was created
      const message = await l2Bridge.getMessageDetails(messageId);
      expect(message.status).to.equal(0); // MessageStatus.PENDING
      expect(message.destinationChainId).to.equal(optimismChainId);
      expect(message.sender).to.equal(user1.address);
    });

    it("Should update the message status to confirmed", async function () {
      // In production, this would happen via a cross-chain message verifier
      await l2Bridge.updateMessageStatus(
        messageId,
        1, // MessageStatus.CONFIRMED
        "" // No failure reason
      );

      const message = await l2Bridge.getMessageDetails(messageId);
      expect(message.status).to.equal(1); // MessageStatus.CONFIRMED
    });

    it("Should calculate optimal data format for different sizes", async function () {
      // Small data (under 100KB) - should use calldata
      const smallDataOptimal = await l2Bridge.calculateOptimalDataFormat(10, 50000);
      expect(smallDataOptimal).to.equal(false); // Should use calldata, not blob

      // Large data (over 100KB) - should use blob for supported chains
      const largeDataOptimal = await l2Bridge.calculateOptimalDataFormat(10, 150000);
      expect(largeDataOptimal).to.equal(true); // Should use blob
    });
  });

  describe("Cross-chain Account Deployment", function () {
    let templateId;
    let accountId;
    let crossAccountMessageId;

    it("Should create a deployment-ready template", async function () {
      // Create a DCA (Dollar-Cost Averaging) template
      const tx = await smartAccounts.createDCATemplate(
        "DCA Investment Template",
        "Automatically invests fixed amounts at regular intervals",
        true, // public
        user1.address, // source asset (using an address as placeholder)
        user2.address, // target asset (using an address as placeholder)
        ethers.utils.parseEther("0.1"), // investment amount
        86400, // frequency (daily)
        2592000, // duration (30 days)
        3 // max slippage (3%)
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'TemplateCreated');
      templateId = event.args.templateId;
      
      // Verify template was created
      const template = await smartAccounts.getTemplate(templateId);
      expect(template.name).to.equal("DCA Investment Template");
      expect(template.templateType).to.equal(7); // TemplateType.DOLLAR_COST_AVERAGING
    });

    it("Should deploy an account from the template", async function () {
      // Define parameters for the account
      const parameters = {
        startDate: Math.floor(Date.now() / 1000).toString(),
        totalAmount: ethers.utils.parseEther("3").toString(), // 3 ETH total
        recipientAddress: user2.address
      };

      // In a real implementation, we'd use the correct map type
      // For testing, we'll directly call a modified function
      const tx = await smartAccounts.connect(user1).deployAccountWithParams(
        templateId,
        Object.keys(parameters),
        Object.values(parameters)
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'AccountDeployed');
      accountId = event.args.accountId;
      
      // Verify account was deployed
      const account = await smartAccounts.getAccount(accountId);
      expect(account.owner).to.equal(user1.address);
      expect(account.templateId).to.equal(templateId);
      expect(account.isActive).to.equal(true);
    });

    it("Should add a delegate to the account", async function () {
      await smartAccounts.connect(user1).addDelegate(accountId, delegateAddress.address);
      
      // Verify delegate was added
      const isDelegate = await smartAccounts.isDelegate(accountId, delegateAddress.address);
      expect(isDelegate).to.equal(true);
      
      // Get all delegates
      const delegates = await smartAccounts.getDelegates(accountId);
      expect(delegates).to.include(delegateAddress.address);
    });

    it("Should bridge account execution instructions to L2", async function () {
      // Create an execution instruction
      const executionData = ethers.utils.defaultAbiCoder.encode(
        [
          "bytes32", // accountId
          "bytes32", // templateId
          "address", // owner
          "uint256", // nonce
          "bytes" // function data to execute
        ],
        [
          accountId,
          templateId,
          user1.address,
          1, // nonce
          ethers.utils.toUtf8Bytes("execute({action:'buy', amount: 0.1})")
        ]
      );

      // Bridge to Arbitrum
      const arbitrumChainId = 42161;
      const tx = await l2Bridge.connect(user1).createMessageForTest(
        arbitrumChainId,
        ethers.constants.AddressZero, // recipient on L2
        executionData,
        0 // amount
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'MessageSent');
      crossAccountMessageId = event.args.messageId;
      
      // Check message was created
      const message = await l2Bridge.getMessageDetails(crossAccountMessageId);
      expect(message.status).to.equal(0); // MessageStatus.PENDING
      expect(message.destinationChainId).to.equal(arbitrumChainId);
    });

    it("Should simulate account execution", async function () {
      // Create test execution data
      const executionData = ethers.utils.toUtf8Bytes("execute({price: 2100, threshold: 2000, amount: 0.5})");
      
      // Simulate execution
      const simulationResult = await smartAccounts.simulateExecution(accountId, executionData);
      expect(simulationResult.success).to.equal(true);
    });

    it("Should get gas estimation for L2 operations", async function () {
      // Get gas estimation for a bridging operation to Optimism
      const optimismChainId = 10;
      const dataSize = 50000; // 50KB
      const useBlob = false;
      
      const estimation = await l2Bridge.estimateBridgingGas(optimismChainId, dataSize, useBlob);
      
      expect(estimation.chainId).to.equal(optimismChainId);
      expect(estimation.estimatedTimeSeconds).to.equal(24); // 12 blocks * 2 seconds
      expect(estimation.chainType).to.equal(0); // L2Chain.OPTIMISM
    });
  });

  describe("Error Handling and Recovery", function () {
    let messageId;

    it("Should handle message failure", async function () {
      // Create a message that will fail
      const optimismChainId = 10;
      const invalidData = ethers.utils.toUtf8Bytes("Invalid data that will cause execution to fail");
      
      const tx = await l2Bridge.connect(user1).createMessageForTest(
        optimismChainId,
        ethers.constants.AddressZero,
        invalidData,
        0
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'MessageSent');
      messageId = event.args.messageId;
      
      // Mark the message as failed (in production this would happen via a verifier)
      await l2Bridge.updateMessageStatus(
        messageId,
        2, // MessageStatus.FAILED
        "Invalid template format"
      );
      
      // Check message status
      const message = await l2Bridge.getMessageDetails(messageId);
      expect(message.status).to.equal(2); // MessageStatus.FAILED
      expect(message.failureReason).to.equal("Invalid template format");
    });

    it("Should retry a failed message", async function () {
      // Retry the failed message
      const tx = await l2Bridge.connect(user1).retryMessage(messageId);
      const receipt = await tx.wait();
      
      // Verify it was marked as retried
      const message = await l2Bridge.getMessageDetails(messageId);
      expect(message.status).to.equal(0); // MessageStatus.PENDING
      expect(message.failureReason).to.equal(""); // Failure reason should be cleared
    });
  });
}); 