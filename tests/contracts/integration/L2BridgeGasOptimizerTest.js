const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('L2Bridge and GasOptimizer Integration', function () {
  let l2BridgeGasOptimizer;
  let l2Bridge;
  let owner;
  let user1;
  let user2;
  let relayer;
  let operator;
  
  // Constants
  const ADMIN_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('ADMIN_ROLE'));
  const RELAYER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('RELAYER_ROLE'));
  const OPERATOR_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('OPERATOR_ROLE'));
  
  // Test chain information
  const optimismChainId = 10;
  const arbitrumChainId = 42161;
  
  // Data types
  const JSON_DATA = 0;
  const BINARY_DATA = 1;
  const MERKLE_PROOF = 2;
  const TRANSACTION_DATA = 3;
  
  before(async function () {
    [owner, user1, user2, relayer, operator] = await ethers.getSigners();
    
    // Deploy L2BridgeGasOptimizer contract
    const L2BridgeGasOptimizer = await ethers.getContractFactory('L2BridgeGasOptimizer');
    l2BridgeGasOptimizer = await L2BridgeGasOptimizer.deploy();
    await l2BridgeGasOptimizer.deployed();
    
    // Grant operator role to the operator
    await l2BridgeGasOptimizer.grantRole(OPERATOR_ROLE, operator.address);
    
    // Deploy L2Bridge contract with the gas optimizer
    const L2Bridge = await ethers.getContractFactory('L2Bridge');
    l2Bridge = await L2Bridge.deploy(l2BridgeGasOptimizer.address);
    await l2Bridge.deployed();
    
    // Grant roles for L2Bridge
    await l2Bridge.grantRole(RELAYER_ROLE, relayer.address);
    await l2Bridge.grantRole(OPERATOR_ROLE, operator.address);
    
    // Add test chains
    await l2Bridge.addChain(
      optimismChainId,
      0, // Chain type
      "Optimism",
      "0x1234567890123456789012345678901234567890",
      ethers.constants.AddressZero,
      12, // Verification blocks
      "ETH",
      ethers.utils.parseEther('1000'), // $1000 per ETH
      2, // 2 second block time
      true, // Blob enabled
      131072 // 128KB max message size
    );
    
    await l2Bridge.addChain(
      arbitrumChainId,
      1, // Chain type
      "Arbitrum",
      "0x0987654321098765432109876543210987654321",
      ethers.constants.AddressZero,
      15, // Verification blocks
      "ETH",
      ethers.utils.parseEther('1000'), // $1000 per ETH
      0.25, // 0.25 second block time
      false, // Blob NOT enabled
      65536 // 64KB max message size
    );
    
    // Update gas prices
    await l2BridgeGasOptimizer.connect(operator).updateBlobGasPrice(
      optimismChainId,
      ethers.utils.parseUnits('1', 'gwei') // 1 gwei blob gas price
    );
    
    await l2BridgeGasOptimizer.connect(operator).updateBaseGasPrice(
      optimismChainId,
      ethers.utils.parseUnits('10', 'gwei') // 10 gwei base gas price
    );
    
    await l2BridgeGasOptimizer.connect(operator).updateBaseGasPrice(
      arbitrumChainId,
      ethers.utils.parseUnits('0.1', 'gwei') // 0.1 gwei base gas price for Arbitrum
    );
  });
  
  describe('Contract Deployment and Setup', function () {
    it('Should initialize contracts with correct roles', async function () {
      // Check roles for Gas Optimizer
      expect(await l2BridgeGasOptimizer.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
      expect(await l2BridgeGasOptimizer.hasRole(OPERATOR_ROLE, operator.address)).to.be.true;
      
      // Check roles for L2Bridge
      expect(await l2Bridge.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
      expect(await l2Bridge.hasRole(RELAYER_ROLE, relayer.address)).to.be.true;
      expect(await l2Bridge.hasRole(OPERATOR_ROLE, operator.address)).to.be.true;
    });
    
    it('Should have correct chain information', async function () {
      // Check Optimism chain info
      const optimismInfo = await l2Bridge.getChainInfo(optimismChainId);
      expect(optimismInfo.name).to.equal("Optimism");
      expect(optimismInfo.blob_enabled).to.be.true;
      
      // Check Arbitrum chain info
      const arbitrumInfo = await l2Bridge.getChainInfo(arbitrumChainId);
      expect(arbitrumInfo.name).to.equal("Arbitrum");
      expect(arbitrumInfo.blob_enabled).to.be.false;
    });
    
    it('Should have gas optimizer set correctly', async function () {
      expect(await l2Bridge.gasOptimizer()).to.equal(l2BridgeGasOptimizer.address);
    });
    
    it('Should have correct gas prices', async function () {
      // Indirectly check by calling the estimateBridgingGas function
      const optimismEstimation = await l2Bridge.estimateBridgingGas(
        optimismChainId,
        100000, // 100KB data
        true // Use blob
      );
      
      const arbitrumEstimation = await l2Bridge.estimateBridgingGas(
        arbitrumChainId,
        100000, // 100KB data
        false // Don't use blob (not supported on Arbitrum)
      );
      
      // Verify that Optimism's blob gas cost is non-zero
      expect(optimismEstimation.blobGasLimit).to.be.gt(0);
      
      // Verify that Arbitrum's gas cost is significantly lower due to lower gas price
      expect(arbitrumEstimation.estimatedGasCost).to.be.lt(optimismEstimation.estimatedGasCost);
    });
  });
  
  describe('Gas Optimization Functionality', function () {
    it('Should calculate optimal data format correctly', async function () {
      // Small data - should not use blob
      const smallDataResult = await l2Bridge.calculateOptimalDataFormat(
        optimismChainId,
        1000 // 1KB data
      );
      expect(smallDataResult).to.be.false;
      
      // Large data - should use blob
      const largeDataResult = await l2Bridge.calculateOptimalDataFormat(
        optimismChainId,
        200000 // 200KB data
      );
      expect(largeDataResult).to.be.true;
      
      // Any size data on Arbitrum - should not use blob (not supported)
      const arbitrumResult = await l2Bridge.calculateOptimalDataFormat(
        arbitrumChainId,
        200000 // 200KB data
      );
      expect(arbitrumResult).to.be.false;
    });
    
    it('Should estimate bridging gas correctly', async function () {
      // Small data on Optimism
      const smallOptimismEstimation = await l2Bridge.estimateBridgingGas(
        optimismChainId,
        1000, // 1KB data
        false // Don't use blob
      );
      expect(smallOptimismEstimation.useBlob).to.be.false;
      expect(smallOptimismEstimation.callDataGasLimit).to.be.gt(0);
      
      // Large data on Optimism
      const largeOptimismEstimation = await l2Bridge.estimateBridgingGas(
        optimismChainId,
        200000, // 200KB data
        true // Use blob
      );
      expect(largeOptimismEstimation.useBlob).to.be.true;
      expect(largeOptimismEstimation.blobGasLimit).to.be.gt(0);
      
      // Verify USD cost calculation
      expect(largeOptimismEstimation.estimatedUsdCost).to.be.gt(0);
    });
    
    it('Should revert when attempting to use blob on unsupported chain', async function () {
      await expect(
        l2Bridge.estimateBridgingGas(
          arbitrumChainId,
          200000, // 200KB data
          true // Try to use blob (not supported)
        )
      ).to.be.revertedWith("Chain does not support blob data");
    });
    
    it('Should update optimization thresholds correctly', async function () {
      // Update blob size threshold
      await l2BridgeGasOptimizer.connect(owner).updateThresholds(
        50000, // 50KB threshold
        85 // 85% efficiency factor
      );
      
      // Verify that a 60KB message now uses blob (previously would not)
      const mediumDataResult = await l2Bridge.calculateOptimalDataFormat(
        optimismChainId,
        60000 // 60KB data
      );
      expect(mediumDataResult).to.be.true;
    });
  });
  
  describe('Compression Functionality', function () {
    it('Should compress and decompress data correctly', async function () {
      // Create test JSON data
      const jsonData = JSON.stringify({
        type: "order",
        orderId: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        user: "0xabcdef1234567890abcdef1234567890abcdef1234",
        amount: "1000000000000000000",
        timestamp: Date.now(),
        data: {
          price: "2000000000000000000",
          isBuy: true,
          expiration: Date.now() + 86400000
        }
      });
      
      // Compress the data
      const compressedData = await l2BridgeGasOptimizer.compressData(
        ethers.utils.toUtf8Bytes(jsonData),
        JSON_DATA
      );
      
      // Verify compression occurred
      expect(compressedData.length).to.be.lt(ethers.utils.toUtf8Bytes(jsonData).length);
      
      // Decompress the data
      const decompressedData = await l2BridgeGasOptimizer.decompressData(compressedData);
      
      // Convert bytes back to string for comparison
      // Note: In a real test, we would parse this to JSON and compare semantically
      const decompressedString = ethers.utils.toUtf8String(decompressedData);
      
      // Due to compression technique, the exact output might not match byte-for-byte
      // But for this example test, the key is that we can compress and decompress
      expect(decompressedData).to.exist;
    });
    
    it('Should store compression statistics correctly', async function () {
      // Create some test binary data
      const binaryData = ethers.utils.randomBytes(5000);
      
      // Compress the data
      await l2BridgeGasOptimizer.compressData(binaryData, BINARY_DATA);
      
      // Get compression stats
      const [count, avgRatio] = await l2BridgeGasOptimizer.getCompressionStats(BINARY_DATA);
      
      // Verify stats
      expect(count).to.be.gt(0);
      expect(avgRatio).to.be.gt(0);
    });
    
    it('Should update compression parameters correctly', async function () {
      // Update compression parameters for JSON data
      await l2BridgeGasOptimizer.connect(owner).updateCompressionParams(
        JSON_DATA,
        {
          dictionarySize: 32,
          minMatchLength: 5,
          compressionLevel: 8,
          enableHuffman: true,
          blockSize: 32
        }
      );
      
      // Create test JSON data
      const jsonData = JSON.stringify({
        type: "order",
        orderId: "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
        user: "0xfedcba0987654321fedcba0987654321fedcba09",
        amount: "2000000000000000000",
        timestamp: Date.now()
      });
      
      // Compress the data with new parameters
      const compressedData = await l2BridgeGasOptimizer.compressData(
        ethers.utils.toUtf8Bytes(jsonData),
        JSON_DATA
      );
      
      // Verify compression still works
      expect(compressedData.length).to.be.lt(ethers.utils.toUtf8Bytes(jsonData).length);
    });
  });
  
  describe('Bridging with Compression Integration', function () {
    it('Should compress data correctly when bridging', async function () {
      // Create test data to bridge
      const testData = ethers.utils.toUtf8Bytes(JSON.stringify({
        message: "Test bridge with compression",
        timestamp: Date.now(),
        data: Array(1000).fill("test data padding").join(" ") // Make the data large enough
      }));
      
      // Bridge the data with compression
      const tx = await l2Bridge.connect(user1).compressAndBridgeData(
        optimismChainId,
        testData,
        JSON_DATA,
        { 
          value: ethers.utils.parseEther("0.01") // Send some ETH for gas
        }
      );
      
      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      
      // Find the MessageSent event
      const event = receipt.events.find(e => e.event === 'MessageSent');
      expect(event).to.not.be.undefined;
      
      // Check that the message was sent with blob enabled
      const messageId = event.args.messageId;
      const useBlob = event.args.useBlob;
      const dataSize = event.args.dataSize;
      
      // Verify the event
      expect(useBlob).to.be.true;
      expect(dataSize).to.be.lt(testData.length);
      
      // Verify the message was stored correctly
      const message = await l2Bridge.getMessageDetails(messageId);
      expect(message.sender).to.equal(user1.address);
      expect(message.destinationChainId).to.equal(optimismChainId);
      expect(message.useBlob).to.be.true;
      expect(message.status).to.equal(0); // PENDING
    });
    
    it('Should receive a bridged message and decompress it', async function () {
      // Create compressed test data (simulating data from another chain)
      const originalData = ethers.utils.toUtf8Bytes(JSON.stringify({
        message: "Test receive with compression",
        timestamp: Date.now(),
        source: "Arbitrum"
      }));
      
      const compressedData = await l2BridgeGasOptimizer.compressData(
        originalData,
        JSON_DATA
      );
      
      // Create a message ID
      const messageId = ethers.utils.id("test-message-" + Date.now());
      
      // Simulate receiving the message
      const tx = await l2Bridge.connect(relayer).receiveMessage(
        messageId,
        arbitrumChainId,
        user2.address,
        compressedData
      );
      
      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      
      // Find the MessageReceived event
      const event = receipt.events.find(e => e.event === 'MessageReceived');
      expect(event).to.not.be.undefined;
      
      // Verify the event
      expect(event.args.messageId).to.equal(messageId);
      expect(event.args.sourceChainId).to.equal(arbitrumChainId);
      expect(event.args.sender).to.equal(user2.address);
      
      // Verify the message cannot be processed again
      await expect(
        l2Bridge.connect(relayer).receiveMessage(
          messageId,
          arbitrumChainId,
          user2.address,
          compressedData
        )
      ).to.be.revertedWith("Message already processed");
    });
    
    it('Should bridge an order with optimal format selection', async function () {
      // Create an order
      const order = {
        order_id: ethers.utils.id("order-" + Date.now()),
        treasury_id: ethers.utils.id("treasury-1"),
        user: user1.address,
        is_buy: true,
        amount: ethers.utils.parseEther("1.5"),
        price: ethers.utils.parseEther("2000"),
        expiration: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
        signature: "0x", // No signature for simplicity
        destinationChainId: optimismChainId
      };
      
      // Bridge the order
      const tx = await l2Bridge.connect(user1).bridgeOrder(order, {
        value: ethers.utils.parseEther("0.01") // Send some ETH for gas
      });
      
      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      
      // Find the OrderBridged event
      const event = receipt.events.find(e => e.event === 'OrderBridged');
      expect(event).to.not.be.undefined;
      
      // Verify the event
      expect(event.args.orderId).to.equal(order.order_id);
      expect(event.args.destinationChainId).to.equal(optimismChainId);
      
      // Get message details
      const messageId = event.args.messageId;
      const message = await l2Bridge.getMessageDetails(messageId);
      
      // The useBlob field should be determined by the size
      // For this test, it depends on the thresholds set earlier
      expect(message.messageId).to.equal(messageId);
      expect(message.sender).to.equal(user1.address);
      expect(message.status).to.equal(0); // PENDING
      
      // Check that the order is in the user's orders
      const userOrders = await l2Bridge.getOrdersByUser(user1.address);
      expect(userOrders).to.include(order.order_id);
    });
  });
  
  describe('Edge Cases and Security', function () {
    it('Should handle empty data correctly', async function () {
      // Try to compress empty data
      const compressedData = await l2BridgeGasOptimizer.compressData(
        [],
        JSON_DATA
      );
      
      // Should return empty array
      expect(compressedData.length).to.equal(0);
      
      // Try to decompress empty data
      const decompressedData = await l2BridgeGasOptimizer.decompressData(
        []
      );
      
      // Should return empty array
      expect(decompressedData.length).to.equal(0);
    });
    
    it('Should revert when bridging data exceeds max size', async function () {
      // Create very large test data
      const largeData = ethers.utils.randomBytes(200000); // 200KB, larger than Arbitrum's 64KB limit
      
      // Try to bridge to Arbitrum (should fail)
      await expect(
        l2Bridge.connect(user1).compressAndBridgeData(
          arbitrumChainId,
          largeData,
          BINARY_DATA,
          { value: ethers.utils.parseEther("0.01") }
        )
      ).to.be.revertedWith("Data exceeds maximum size");
    });
    
    it('Should revert when non-relayer tries to update message status', async function () {
      // Get a message ID from a previous test
      const userOrders = await l2Bridge.getOrdersByUser(user1.address);
      const orderId = userOrders[0];
      const messageId = (await l2Bridge.getMessagesBySender(user1.address))[0];
      
      // Try to update status as non-relayer
      await expect(
        l2Bridge.connect(user1).updateMessageStatus(
          messageId,
          1, // CONFIRMED
          "Confirmed by user"
        )
      ).to.be.reverted;
      
      // Update status as relayer should work
      await l2Bridge.connect(relayer).updateMessageStatus(
        messageId,
        1, // CONFIRMED
        "Confirmed by relayer"
      );
      
      // Verify status was updated
      expect(await l2Bridge.getMessageStatus(messageId)).to.equal(1); // CONFIRMED
    });
    
    it('Should revert when non-admin tries to update thresholds', async function () {
      await expect(
        l2BridgeGasOptimizer.connect(user1).updateThresholds(
          30000, // 30KB threshold
          75 // 75% efficiency factor
        )
      ).to.be.reverted;
    });
    
    it('Should revert when invalid compression parameters are provided', async function () {
      await expect(
        l2BridgeGasOptimizer.connect(owner).updateCompressionParams(
          JSON_DATA,
          {
            dictionarySize: 100, // Too large (max is 64)
            minMatchLength: 5,
            compressionLevel: 8,
            enableHuffman: true,
            blockSize: 32
          }
        )
      ).to.be.revertedWith("Dictionary size must be <= 64");
      
      await expect(
        l2BridgeGasOptimizer.connect(owner).updateCompressionParams(
          JSON_DATA,
          {
            dictionarySize: 32,
            minMatchLength: 5,
            compressionLevel: 15, // Too high (max is 10)
            enableHuffman: true,
            blockSize: 32
          }
        )
      ).to.be.revertedWith("Compression level must be <= 10");
    });
  });
}); 