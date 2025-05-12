const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('L2Bridge and SmartAccountTemplates Integration', function () {
  let l2Bridge;
  let smartAccountTemplates;
  let owner;
  let user1;
  let user2;
  let relayer;
  let verifier;
  
  // Constants
  const ADMIN_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('ADMIN_ROLE'));
  const RELAYER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('RELAYER_ROLE'));
  const VERIFIER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('VERIFIER_ROLE'));
  
  // L2 Chain info
  const optimismChainId = 10;
  const optimismName = 'Optimism';
  const optimismBridgeAddress = '0x1234567890123456789012345678901234567890';
  
  // Template info
  let templateId;
  let accountId;
  
  before(async function () {
    [owner, user1, user2, relayer, verifier] = await ethers.getSigners();
    
    // Deploy L2Bridge contract
    const L2Bridge = await ethers.getContractFactory('L2Bridge');
    l2Bridge = await L2Bridge.deploy();
    await l2Bridge.deployed();
    
    // Deploy SmartAccountTemplates contract
    const SmartAccountTemplates = await ethers.getContractFactory('SmartAccountTemplates');
    smartAccountTemplates = await SmartAccountTemplates.deploy();
    await smartAccountTemplates.deployed();
    
    // Grant roles
    await l2Bridge.grantRole(RELAYER_ROLE, relayer.address);
    await smartAccountTemplates.grantRole(VERIFIER_ROLE, verifier.address);
    
    // Add a test chain to L2Bridge
    await l2Bridge.addChain(
      optimismChainId,                // chainId
      0, // L2Chain.OPTIMISM,         // chainType
      optimismName,                   // name
      optimismBridgeAddress,          // bridgeAddress
      ethers.constants.AddressZero,   // rollupAddress
      6,                              // verificationBlocks
      'ETH',                          // gasTokenSymbol
      ethers.utils.parseEther('2000'),// nativeTokenPriceUsd
      2,                              // averageBlockTime
      true,                           // blobEnabled
      131072                         // maxMessageSize
    );
    
    // Create a template in SmartAccountTemplates
    const tx = await smartAccountTemplates.createYieldReinvestmentTemplate(
      'AutoCompound Template',        // name
      'Automatically reinvests yield', // description
      true,                           // isPublic
      86400,                          // autoCompoundFrequency (1 day)
      ethers.utils.parseEther('0.1'), // minReinvestAmount
      [l2Bridge.address],             // reinvestmentTargets (using L2Bridge as a placeholder token)
      [100]                           // reinvestmentAllocations (100%)
    );
    
    // Get the template ID from transaction logs
    const receipt = await tx.wait();
    const event = receipt.events.find(e => e.event === 'TemplateCreated');
    templateId = event.args.templateId;
  });
  
  describe('Basic Functionality Tests', function () {
    it('Should have correct roles', async function () {
      expect(await l2Bridge.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
      expect(await l2Bridge.hasRole(RELAYER_ROLE, relayer.address)).to.be.true;
      expect(await smartAccountTemplates.hasRole(VERIFIER_ROLE, verifier.address)).to.be.true;
    });
    
    it('Should have correct L2 chain information', async function () {
      const chainInfo = await l2Bridge.getChainInfo(optimismChainId);
      expect(chainInfo.name).to.equal(optimismName);
      expect(chainInfo.bridgeAddress).to.equal(optimismBridgeAddress);
      expect(chainInfo.blob_enabled).to.be.true;
    });
    
    it('Should have correct template information', async function () {
      const template = await smartAccountTemplates.getTemplate(templateId);
      expect(template.name).to.equal('AutoCompound Template');
      expect(template.isPublic).to.be.true;
      expect(template.templateType).to.equal(0); // YIELD_REINVESTMENT
    });
  });
  
  describe('SmartAccount Creation', function () {
    it('Should deploy a smart account from template', async function () {
      // Deploy an account using the template
      const parametersJson = JSON.stringify({
        autoCompoundFrequency: 43200, // 12 hours
        minReinvestAmount: ethers.utils.parseEther('0.5').toString(),
        reinvestmentTargets: [l2Bridge.address],
        reinvestmentAllocations: [100]
      });
      
      const tx = await smartAccountTemplates.connect(user1).deployAccount(
        templateId,
        parametersJson
      );
      
      // Get account ID from logs
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'AccountDeployed');
      accountId = event.args.accountId;
      
      // Verify account details
      const account = await smartAccountTemplates.getAccount(accountId);
      expect(account.owner).to.equal(user1.address);
      expect(account.templateId).to.equal(templateId);
      expect(account.isActive).to.be.true;
    });
    
    it('Should add a delegate to the account', async function () {
      // Add user2 as a delegate
      await smartAccountTemplates.connect(user1).addDelegate(accountId, user2.address);
      
      // Check if user2 is a delegate
      expect(await smartAccountTemplates.isDelegate(accountId, user2.address)).to.be.true;
      
      // Get all delegates
      const delegates = await smartAccountTemplates.getDelegates(accountId);
      expect(delegates).to.include(user2.address);
      
      // Check accounts by delegate
      const accounts = await smartAccountTemplates.getAccountsByDelegate(user2.address);
      expect(accounts).to.include(accountId);
    });
    
    it('Should execute account code', async function () {
      // Generate execution parameters
      const executionParams = {
        gasLimit: ethers.utils.parseEther('1'),
        gasPrice: ethers.utils.parseUnits('10', 'gwei'),
        value: 0,
        delegated: false,
        delegate: ethers.constants.AddressZero,
        validUntil: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        nonce: 1
      };
      
      // Execute account code
      const result = await smartAccountTemplates.connect(user1).executeAccount(
        accountId,
        ethers.utils.toUtf8Bytes('test execution data'), 
        executionParams
      );
      
      // Check the event was emitted
      const txReceipt = await result.wait();
      const executedEvent = txReceipt.events.find(e => e.event === 'AccountExecuted');
      expect(executedEvent).to.not.be.undefined;
      
      // Get operation history
      const operations = await smartAccountTemplates.getOperationHistory(accountId);
      expect(operations.length).to.be.greaterThan(0);
      expect(operations[0].accountId).to.equal(accountId);
      expect(operations[0].executed_by).to.equal(user1.address);
    });
  });
  
  describe('L2Bridge Integration', function () {
    it('Should bridge an order to L2', async function () {
      // Prepare an order for bridging
      const orderDetails = {
        order_id: ethers.utils.formatBytes32String('order123'),
        treasury_id: ethers.utils.formatBytes32String('treasury456'),
        user: user1.address,
        is_buy: true,
        amount: ethers.utils.parseEther('1'),
        price: ethers.utils.parseEther('2000'),
        expiration: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
        signature: '0x',
        destinationChainId: optimismChainId
      };
      
      // Bridge the order
      const tx = await l2Bridge.connect(user1).bridgeOrder(orderDetails);
      const receipt = await tx.wait();
      
      // Check events
      const bridgedEvent = receipt.events.find(e => e.event === 'OrderBridged');
      expect(bridgedEvent).to.not.be.undefined;
      expect(bridgedEvent.args.orderId).to.equal(orderDetails.order_id);
      expect(bridgedEvent.args.destinationChainId).to.equal(optimismChainId);
      
      // Get the message ID
      const messageId = bridgedEvent.args.messageId;
      
      // Get order by user
      const userOrders = await l2Bridge.getOrdersByUser(user1.address);
      expect(userOrders.length).to.be.greaterThan(0);
      
      // Update message status using relayer
      await l2Bridge.connect(relayer).updateMessageStatus(
        messageId,
        1, // CONFIRMED
        ''
      );
      
      // Check message status
      const status = await l2Bridge.getMessageStatus(messageId);
      expect(status).to.equal(1); // CONFIRMED
    });
    
    it('Should allow smart account to bridge order', async function () {
      // First simulate execution to get the return data
      const simulationData = ethers.utils.defaultAbiCoder.encode(
        ['address', 'bytes32', 'bytes32', 'bool', 'uint256', 'uint256', 'uint64'],
        [
          l2Bridge.address,
          ethers.utils.formatBytes32String('order789'),
          ethers.utils.formatBytes32String('treasury456'),
          false,
          ethers.utils.parseEther('2'),
          ethers.utils.parseEther('1900'),
          Math.floor(Date.now() / 1000) + 86400 // 24 hours from now
        ]
      );
      
      // Execute account for L2 bridge integration
      const executionParams = {
        gasLimit: ethers.utils.parseEther('1'),
        gasPrice: ethers.utils.parseUnits('10', 'gwei'),
        value: 0,
        delegated: false,
        delegate: ethers.constants.AddressZero,
        validUntil: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        nonce: 2
      };
      
      // Execute account as delegate
      await smartAccountTemplates.connect(user1).executeAccount(
        accountId,
        simulationData,
        executionParams
      );
      
      // Check operations history has been updated
      const operations = await smartAccountTemplates.getOperationHistory(accountId);
      expect(operations.length).to.be.greaterThan(1);
    });
  });
  
  describe('Verification and Security', function () {
    it('Should verify template by verifier', async function () {
      // Verify the template
      await smartAccountTemplates.connect(verifier).verifyTemplate(
        templateId,
        20, // vulnerabilityRisk
        ['Low risk template', 'Performs standard reinvestment operations'],
        15  // performanceRisk
      );
      
      // Check verification status
      const template = await smartAccountTemplates.getTemplate(templateId);
      expect(template.isVerified).to.be.true;
      
      // Get verification details
      const verification = await smartAccountTemplates.getVerificationResult(templateId);
      expect(verification.isVerified).to.be.true;
      expect(verification.vulnerabilityRisk).to.equal(20);
      expect(verification.verifier).to.equal(verifier.address);
    });
    
    it('Should calculate optimal blob format for L2 data', async function () {
      // Calculate for small data
      const smallDataOptimal = await l2Bridge.calculateOptimalDataFormat(
        optimismChainId,
        1000 // 1 KB
      );
      expect(smallDataOptimal).to.be.false; // Should not use blob for small data
      
      // Calculate for large data
      const largeDataOptimal = await l2Bridge.calculateOptimalDataFormat(
        optimismChainId,
        100000 // 100 KB
      );
      expect(largeDataOptimal).to.be.true; // Should use blob for large data
      
      // Get gas estimation
      const gasEstimation = await l2Bridge.estimateBridgingGas(
        optimismChainId,
        100000, // 100 KB
        true    // use blob
      );
      expect(gasEstimation.blobGasLimit.toNumber()).to.be.greaterThan(0);
    });
  });
}); 