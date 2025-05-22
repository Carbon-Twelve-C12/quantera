const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("L2Bridge Security Tests", function () {
  // Test fixture that deploys all needed contracts
  async function deployL2BridgeFixture() {
    // Get signers
    const [admin, operator, relayer, user1, user2] = await ethers.getSigners();
    
    // Deploy gas optimizer mock first
    const L2BridgeGasOptimizer = await ethers.getContractFactory("L2BridgeGasOptimizer");
    const gasOptimizer = await L2BridgeGasOptimizer.deploy();
    
    // Deploy L2Bridge
    const L2Bridge = await ethers.getContractFactory("L2Bridge");
    const l2Bridge = await L2Bridge.deploy(gasOptimizer.address);
    
    // Grant roles
    const ADMIN_ROLE = await l2Bridge.ADMIN_ROLE();
    const OPERATOR_ROLE = await l2Bridge.OPERATOR_ROLE();
    const RELAYER_ROLE = await l2Bridge.RELAYER_ROLE();
    
    await l2Bridge.grantRole(ADMIN_ROLE, admin.address);
    await l2Bridge.grantRole(OPERATOR_ROLE, operator.address);
    await l2Bridge.grantRole(RELAYER_ROLE, relayer.address);
    
    // Add a test chain
    const chainId = 10; // Optimism
    await l2Bridge.addChain(
      chainId, // chainId
      0, // L2Chain.OPTIMISM
      "Optimism", // name
      ethers.Wallet.createRandom().address, // bridgeAddress
      ethers.Wallet.createRandom().address, // rollupAddress
      12, // verificationBlocks
      "ETH", // gasTokenSymbol
      ethers.utils.parseEther("2000"), // nativeTokenPriceUsd
      2, // averageBlockTime
      true, // blobEnabled
      1000000 // maxMessageSize
    );
    
    return { l2Bridge, gasOptimizer, admin, operator, relayer, user1, user2, chainId };
  }
  
  describe("Role-Based Access Control", function () {
    it("Should allow only ADMIN_ROLE to add chains", async function () {
      const { l2Bridge, user1 } = await loadFixture(deployL2BridgeFixture);
      
      const chainId = 42161; // Arbitrum
      
      // User without role should not be able to add a chain
      await expect(
        l2Bridge.connect(user1).addChain(
          chainId, // chainId
          1, // L2Chain.ARBITRUM
          "Arbitrum", // name
          ethers.Wallet.createRandom().address, // bridgeAddress
          ethers.Wallet.createRandom().address, // rollupAddress
          20, // verificationBlocks
          "ETH", // gasTokenSymbol
          ethers.utils.parseEther("2000"), // nativeTokenPriceUsd
          2, // averageBlockTime
          true, // blobEnabled
          1000000 // maxMessageSize
        )
      ).to.be.reverted;
      
      // Admin should be able to add a chain
      await expect(
        l2Bridge.addChain(
          chainId, // chainId
          1, // L2Chain.ARBITRUM
          "Arbitrum", // name
          ethers.Wallet.createRandom().address, // bridgeAddress
          ethers.Wallet.createRandom().address, // rollupAddress
          20, // verificationBlocks
          "ETH", // gasTokenSymbol
          ethers.utils.parseEther("2000"), // nativeTokenPriceUsd
          2, // averageBlockTime
          true, // blobEnabled
          1000000 // maxMessageSize
        )
      ).to.not.be.reverted;
      
      // Verify the chain was added
      const chainInfo = await l2Bridge.getChainInfo(chainId);
      expect(chainInfo.name).to.equal("Arbitrum");
    });
    
    it("Should allow only ADMIN_ROLE to update chains", async function () {
      const { l2Bridge, user1, chainId } = await loadFixture(deployL2BridgeFixture);
      
      const newBridgeAddress = ethers.Wallet.createRandom().address;
      
      // User without role should not be able to update a chain
      await expect(
        l2Bridge.connect(user1).updateChain(
          chainId, // chainId
          newBridgeAddress, // bridgeAddress
          15, // verificationBlocks
          ethers.utils.parseEther("2100"), // nativeTokenPriceUsd
          3, // averageBlockTime
          true, // enabled
          true // blobEnabled
        )
      ).to.be.reverted;
      
      // Admin should be able to update a chain
      await expect(
        l2Bridge.updateChain(
          chainId, // chainId
          newBridgeAddress, // bridgeAddress
          15, // verificationBlocks
          ethers.utils.parseEther("2100"), // nativeTokenPriceUsd
          3, // averageBlockTime
          true, // enabled
          true // blobEnabled
        )
      ).to.not.be.reverted;
      
      // Verify the chain was updated
      const chainInfo = await l2Bridge.getChainInfo(chainId);
      expect(chainInfo.bridgeAddress).to.equal(newBridgeAddress);
      expect(chainInfo.verificationBlocks).to.equal(15);
    });
    
    it("Should allow only RELAYER_ROLE to update message status", async function () {
      const { l2Bridge, user1, relayer, chainId } = await loadFixture(deployL2BridgeFixture);
      
      // Create a message first
      const recipient = ethers.Wallet.createRandom().address;
      const data = ethers.utils.toUtf8Bytes("test message");
      
      // Create batch messages to get a message ID
      const tx = await l2Bridge.createBatchMessages(
        chainId,
        [recipient],
        [data],
        [0] // amounts
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "BatchMessageSent");
      const messageIds = event.args.messageIds;
      const messageId = messageIds[0];
      
      // User without role should not be able to update message status
      await expect(
        l2Bridge.connect(user1).updateMessageStatus(
          messageId,
          2, // MessageStatus.CONFIRMED
          ""
        )
      ).to.be.reverted;
      
      // Relayer should be able to update message status
      await expect(
        l2Bridge.connect(relayer).updateMessageStatus(
          messageId,
          2, // MessageStatus.CONFIRMED
          ""
        )
      ).to.not.be.reverted;
      
      // Verify the message status was updated
      const status = await l2Bridge.getMessageStatus(messageId);
      expect(status).to.equal(2); // MessageStatus.CONFIRMED
    });
    
    it("Should allow only message sender or OPERATOR_ROLE to retry messages", async function () {
      const { l2Bridge, user1, relayer, operator, chainId } = await loadFixture(deployL2BridgeFixture);
      
      // Create a message first
      const recipient = ethers.Wallet.createRandom().address;
      const data = ethers.utils.toUtf8Bytes("test message");
      
      // Create batch messages to get a message ID
      const tx = await l2Bridge.connect(user1).createBatchMessages(
        chainId,
        [recipient],
        [data],
        [0] // amounts
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "BatchMessageSent");
      const messageIds = event.args.messageIds;
      const messageId = messageIds[0];
      
      // Mark message as failed
      await l2Bridge.connect(relayer).updateMessageStatus(
        messageId,
        3, // MessageStatus.FAILED
        "Test failure"
      );
      
      // Other user should not be able to retry the message
      await expect(
        l2Bridge.connect(user2).retryMessage(messageId)
      ).to.be.revertedWithCustomError(l2Bridge, "Unauthorized");
      
      // Original sender should be able to retry
      await expect(
        l2Bridge.connect(user1).retryMessage(messageId)
      ).to.not.be.reverted;
      
      // Mark as failed again for operator test
      await l2Bridge.connect(relayer).updateMessageStatus(
        messageId,
        3, // MessageStatus.FAILED
        "Test failure"
      );
      
      // Operator should be able to retry any message
      await expect(
        l2Bridge.connect(operator).retryMessage(messageId)
      ).to.not.be.reverted;
    });
    
    it("Should allow only ADMIN_ROLE to pause/unpause", async function () {
      const { l2Bridge, user1 } = await loadFixture(deployL2BridgeFixture);
      
      // User without role should not be able to pause
      await expect(
        l2Bridge.connect(user1).pause()
      ).to.be.reverted;
      
      // Admin should be able to pause
      await expect(
        l2Bridge.pause()
      ).to.not.be.reverted;
      
      // Verify the contract is paused
      expect(await l2Bridge.paused()).to.be.true;
      
      // User without role should not be able to unpause
      await expect(
        l2Bridge.connect(user1).unpause()
      ).to.be.reverted;
      
      // Admin should be able to unpause
      await expect(
        l2Bridge.unpause()
      ).to.not.be.reverted;
      
      // Verify the contract is unpaused
      expect(await l2Bridge.paused()).to.be.false;
    });
  });
  
  describe("Custom Error Handling", function () {
    it("Should revert with InvalidZeroAddress for zero address parameters", async function () {
      const { l2Bridge, admin } = await loadFixture(deployL2BridgeFixture);
      
      // Try to add a chain with zero bridge address
      await expect(
        l2Bridge.addChain(
          42161, // chainId
          1, // L2Chain.ARBITRUM
          "Arbitrum", // name
          ethers.constants.AddressZero, // bridgeAddress - zero address
          ethers.Wallet.createRandom().address, // rollupAddress
          20, // verificationBlocks
          "ETH", // gasTokenSymbol
          ethers.utils.parseEther("2000"), // nativeTokenPriceUsd
          2, // averageBlockTime
          true, // blobEnabled
          1000000 // maxMessageSize
        )
      ).to.be.revertedWithCustomError(l2Bridge, "InvalidZeroAddress");
      
      // Try to update a chain with zero bridge address
      const chainId = 10; // Optimism from fixture
      await expect(
        l2Bridge.updateChain(
          chainId, // chainId
          ethers.constants.AddressZero, // bridgeAddress - zero address
          15, // verificationBlocks
          ethers.utils.parseEther("2100"), // nativeTokenPriceUsd
          3, // averageBlockTime
          true, // enabled
          true // blobEnabled
        )
      ).to.be.revertedWithCustomError(l2Bridge, "InvalidZeroAddress");
    });
    
    it("Should revert with ChainNotSupported when chain doesn't exist", async function () {
      const { l2Bridge, user1 } = await loadFixture(deployL2BridgeFixture);
      
      const unsupportedChainId = 1234; // Non-existent chain
      const recipient = ethers.Wallet.createRandom().address;
      const data = ethers.utils.toUtf8Bytes("test message");
      
      // Try to create a message for unsupported chain
      await expect(
        l2Bridge.connect(user1).createBatchMessages(
          unsupportedChainId,
          [recipient],
          [data],
          [0] // amounts
        )
      ).to.be.revertedWithCustomError(l2Bridge, "ChainNotSupported");
      
      // Try to estimate gas for unsupported chain
      await expect(
        l2Bridge.estimateBridgingGas(
          unsupportedChainId,
          1000, // dataSize
          false // useBlob
        )
      ).to.be.revertedWithCustomError(l2Bridge, "ChainNotSupported");
    });
    
    it("Should revert with ArrayLengthMismatch when arrays don't match", async function () {
      const { l2Bridge, user1, chainId } = await loadFixture(deployL2BridgeFixture);
      
      const recipients = [
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address
      ];
      const data = [ethers.utils.toUtf8Bytes("test1")];
      const amounts = [0, 0];
      
      // Try to create batch messages with mismatched arrays
      await expect(
        l2Bridge.connect(user1).createBatchMessages(
          chainId,
          recipients, // 2 recipients
          data, // 1 data item
          amounts // 2 amounts
        )
      ).to.be.revertedWithCustomError(l2Bridge, "ArrayLengthMismatch");
    });
    
    it("Should revert with MessageNotFound when message doesn't exist", async function () {
      const { l2Bridge, relayer } = await loadFixture(deployL2BridgeFixture);
      
      const nonExistentMessageId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("non-existent"));
      
      // Try to get details for non-existent message
      await expect(
        l2Bridge.getMessageDetails(nonExistentMessageId)
      ).to.be.revertedWithCustomError(l2Bridge, "MessageNotFound");
      
      // Try to update status of non-existent message
      await expect(
        l2Bridge.connect(relayer).updateMessageStatus(
          nonExistentMessageId,
          2, // MessageStatus.CONFIRMED
          ""
        )
      ).to.be.revertedWithCustomError(l2Bridge, "MessageNotFound");
    });
    
    it("Should revert with MessageCannotBeRetried for non-failed messages", async function () {
      const { l2Bridge, user1, chainId } = await loadFixture(deployL2BridgeFixture);
      
      // Create a message
      const recipient = ethers.Wallet.createRandom().address;
      const data = ethers.utils.toUtf8Bytes("test message");
      
      const tx = await l2Bridge.connect(user1).createBatchMessages(
        chainId,
        [recipient],
        [data],
        [0] // amounts
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "BatchMessageSent");
      const messageIds = event.args.messageIds;
      const messageId = messageIds[0];
      
      // Try to retry a pending message (not failed)
      await expect(
        l2Bridge.connect(user1).retryMessage(messageId)
      ).to.be.revertedWithCustomError(l2Bridge, "MessageCannotBeRetried");
    });
  });
  
  describe("Input Validation", function () {
    it("Should validate order parameters", async function () {
      const { l2Bridge, user1, chainId } = await loadFixture(deployL2BridgeFixture);
      
      const now = Math.floor(Date.now() / 1000);
      const treasuryId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("treasury"));
      const orderId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("order"));
      
      // Try to bridge an order with zero amount
      await expect(
        l2Bridge.connect(user1).bridgeOrder({
          order_id: orderId,
          treasury_id: treasuryId,
          user: user1.address,
          is_buy: true,
          amount: 0, // zero amount
          price: ethers.utils.parseEther("100"),
          expiration: now + 3600,
          destinationChainId: chainId,
          signature: "0x"
        })
      ).to.be.revertedWithCustomError(l2Bridge, "InvalidAmount");
      
      // Try to bridge an order with zero price
      await expect(
        l2Bridge.connect(user1).bridgeOrder({
          order_id: orderId,
          treasury_id: treasuryId,
          user: user1.address,
          is_buy: true,
          amount: ethers.utils.parseEther("10"),
          price: 0, // zero price
          expiration: now + 3600,
          destinationChainId: chainId,
          signature: "0x"
        })
      ).to.be.revertedWithCustomError(l2Bridge, "InvalidPrice");
      
      // Try to bridge an order that's already expired
      await expect(
        l2Bridge.connect(user1).bridgeOrder({
          order_id: orderId,
          treasury_id: treasuryId,
          user: user1.address,
          is_buy: true,
          amount: ethers.utils.parseEther("10"),
          price: ethers.utils.parseEther("100"),
          expiration: now - 3600, // expired
          destinationChainId: chainId,
          signature: "0x"
        })
      ).to.be.revertedWithCustomError(l2Bridge, "OrderExpired");
    });
    
    it("Should validate trade parameters", async function () {
      const { l2Bridge, user1, user2, chainId } = await loadFixture(deployL2BridgeFixture);
      
      const treasuryId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("treasury"));
      const tradeId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("trade"));
      
      // Try to settle a trade with buyer and seller being the same
      await expect(
        l2Bridge.connect(user1).settleTrade({
          trade_id: tradeId,
          treasury_id: treasuryId,
          buyer: user1.address,
          seller: user1.address, // same as buyer
          amount: ethers.utils.parseEther("10"),
          price: ethers.utils.parseEther("100"),
          settlement_date: Math.floor(Date.now() / 1000),
          destinationChainId: chainId
        })
      ).to.be.revertedWithCustomError(l2Bridge, "BuyerSellerSame");
      
      // Try to settle a trade with zero amount
      await expect(
        l2Bridge.connect(user1).settleTrade({
          trade_id: tradeId,
          treasury_id: treasuryId,
          buyer: user1.address,
          seller: user2.address,
          amount: 0, // zero amount
          price: ethers.utils.parseEther("100"),
          settlement_date: Math.floor(Date.now() / 1000),
          destinationChainId: chainId
        })
      ).to.be.revertedWithCustomError(l2Bridge, "InvalidAmount");
      
      // Try to settle a trade with zero price
      await expect(
        l2Bridge.connect(user1).settleTrade({
          trade_id: tradeId,
          treasury_id: treasuryId,
          buyer: user1.address,
          seller: user2.address,
          amount: ethers.utils.parseEther("10"),
          price: 0, // zero price
          settlement_date: Math.floor(Date.now() / 1000),
          destinationChainId: chainId
        })
      ).to.be.revertedWithCustomError(l2Bridge, "InvalidPrice");
    });
  });
  
  describe("Message Security", function () {
    it("Should prevent bridging the same order twice", async function () {
      const { l2Bridge, user1, chainId } = await loadFixture(deployL2BridgeFixture);
      
      const now = Math.floor(Date.now() / 1000);
      const treasuryId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("treasury"));
      const orderId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("order"));
      
      // Bridge an order for the first time
      await l2Bridge.connect(user1).bridgeOrder({
        order_id: orderId,
        treasury_id: treasuryId,
        user: user1.address,
        is_buy: true,
        amount: ethers.utils.parseEther("10"),
        price: ethers.utils.parseEther("100"),
        expiration: now + 3600,
        destinationChainId: chainId,
        signature: "0x"
      });
      
      // Try to bridge the same order again
      await expect(
        l2Bridge.connect(user1).bridgeOrder({
          order_id: orderId,
          treasury_id: treasuryId,
          user: user1.address,
          is_buy: true,
          amount: ethers.utils.parseEther("10"),
          price: ethers.utils.parseEther("100"),
          expiration: now + 3600,
          destinationChainId: chainId,
          signature: "0x"
        })
      ).to.be.revertedWithCustomError(l2Bridge, "OrderAlreadyBridged");
    });
    
    it("Should prevent settling the same trade twice", async function () {
      const { l2Bridge, user1, user2, chainId } = await loadFixture(deployL2BridgeFixture);
      
      const treasuryId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("treasury"));
      const tradeId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("trade"));
      
      // Settle a trade for the first time
      await l2Bridge.connect(user1).settleTrade({
        trade_id: tradeId,
        treasury_id: treasuryId,
        buyer: user1.address,
        seller: user2.address,
        amount: ethers.utils.parseEther("10"),
        price: ethers.utils.parseEther("100"),
        settlement_date: Math.floor(Date.now() / 1000),
        destinationChainId: chainId
      });
      
      // Try to settle the same trade again
      await expect(
        l2Bridge.connect(user1).settleTrade({
          trade_id: tradeId,
          treasury_id: treasuryId,
          buyer: user1.address,
          seller: user2.address,
          amount: ethers.utils.parseEther("10"),
          price: ethers.utils.parseEther("100"),
          settlement_date: Math.floor(Date.now() / 1000),
          destinationChainId: chainId
        })
      ).to.be.revertedWithCustomError(l2Bridge, "TradeAlreadySettled");
    });
  });
  
  describe("Gas Optimization", function () {
    it("Should calculate optimal data format correctly", async function () {
      const { l2Bridge, chainId } = await loadFixture(deployL2BridgeFixture);
      
      // Small data size should not use blob
      const useBlob1 = await l2Bridge.calculateOptimalDataFormat(chainId, 1000);
      expect(useBlob1).to.equal(false);
      
      // Large data size should use blob
      const useBlob2 = await l2Bridge.calculateOptimalDataFormat(chainId, 100000);
      expect(useBlob2).to.equal(true);
    });
    
    it("Should estimate gas costs correctly", async function () {
      const { l2Bridge, chainId } = await loadFixture(deployL2BridgeFixture);
      
      // Estimate gas for small data without blob
      const gasEstimation1 = await l2Bridge.estimateBridgingGas(chainId, 1000, false);
      expect(gasEstimation1.chainId).to.equal(chainId);
      
      // Estimate gas for large data with blob
      const gasEstimation2 = await l2Bridge.estimateBridgingGas(chainId, 100000, true);
      expect(gasEstimation2.chainId).to.equal(chainId);
      expect(gasEstimation2.blobGasLimit).to.be.gt(0);
    });
  });
}); 