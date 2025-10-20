const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("EnhancedSecurityToken", function () {
    let EnhancedSecurityToken;
    let token;
    let owner;
    let addr1;
    let addr2;
    let addr3;
    let paymentToken;
    
    const INITIAL_SUPPLY = ethers.utils.parseEther("1000000");
    const DIVIDEND_AMOUNT = ethers.utils.parseEther("10000");
    
    beforeEach(async function () {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        
        // Deploy a mock payment token (USDC)
        const MockToken = await ethers.getContractFactory("MockERC20");
        paymentToken = await MockToken.deploy("USDC", "USDC", 6);
        await paymentToken.deployed();
        
        // Deploy EnhancedSecurityToken
        EnhancedSecurityToken = await ethers.getContractFactory("EnhancedSecurityToken");
        token = await upgrades.deployProxy(
            EnhancedSecurityToken,
            ["Enhanced Security Token", "EST", INITIAL_SUPPLY, ethers.constants.AddressZero],
            { initializer: "initialize" }
        );
        await token.deployed();
        
        // Setup roles
        const DIVIDEND_MANAGER_ROLE = await token.DIVIDEND_MANAGER_ROLE();
        const VOTING_ADMIN_ROLE = await token.VOTING_ADMIN_ROLE();
        const CORPORATE_ACTIONS_ROLE = await token.CORPORATE_ACTIONS_ROLE();
        
        await token.grantRole(DIVIDEND_MANAGER_ROLE, owner.address);
        await token.grantRole(VOTING_ADMIN_ROLE, owner.address);
        await token.grantRole(CORPORATE_ACTIONS_ROLE, owner.address);
        
        // Distribute tokens for testing
        await token.transfer(addr1.address, ethers.utils.parseEther("100000"));
        await token.transfer(addr2.address, ethers.utils.parseEther("200000"));
        await token.transfer(addr3.address, ethers.utils.parseEther("50000"));
    });
    
    describe("Dividend Distribution", function () {
        it("Should declare and distribute dividends correctly", async function () {
            // Mint payment tokens for dividend
            await paymentToken.mint(owner.address, DIVIDEND_AMOUNT);
            await paymentToken.approve(token.address, DIVIDEND_AMOUNT);
            
            // Declare dividend
            const recordDate = await time.latest() + 3600; // 1 hour from now
            const paymentDate = recordDate + 86400; // 1 day after record date
            
            const tx = await token.declareDividend(
                DIVIDEND_AMOUNT,
                paymentToken.address,
                recordDate,
                paymentDate
            );
            
            await expect(tx).to.emit(token, "DividendDeclared")
                .withArgs(1, DIVIDEND_AMOUNT, paymentToken.address, recordDate, paymentDate);
            
            // Check dividend info
            const info = await token.getDividendInfo(1);
            expect(info.totalAmount).to.equal(DIVIDEND_AMOUNT);
            expect(info.paymentToken).to.equal(paymentToken.address);
        });
        
        it("Should calculate dividends proportionally", async function () {
            await paymentToken.mint(owner.address, DIVIDEND_AMOUNT);
            await paymentToken.approve(token.address, DIVIDEND_AMOUNT);
            
            const recordDate = await time.latest() + 10;
            const paymentDate = recordDate + 100;
            
            await token.declareDividend(
                DIVIDEND_AMOUNT,
                paymentToken.address,
                recordDate,
                paymentDate
            );
            
            // Calculate expected dividends
            const addr1Balance = await token.balanceOf(addr1.address);
            const totalSupply = await token.totalSupply();
            const expectedDividend = DIVIDEND_AMOUNT.mul(addr1Balance).div(totalSupply);
            
            const calculatedDividend = await token.calculateDividend(1, addr1.address);
            expect(calculatedDividend).to.be.closeTo(expectedDividend, ethers.utils.parseEther("1"));
        });
        
        it("Should allow claiming dividends after payment date", async function () {
            await paymentToken.mint(owner.address, DIVIDEND_AMOUNT);
            await paymentToken.approve(token.address, DIVIDEND_AMOUNT);
            
            const recordDate = await time.latest() + 10;
            const paymentDate = recordDate + 100;
            
            await token.declareDividend(
                DIVIDEND_AMOUNT,
                paymentToken.address,
                recordDate,
                paymentDate
            );
            
            // Advance time to payment date
            await time.increaseTo(paymentDate + 1);
            
            // Claim dividend
            const balanceBefore = await paymentToken.balanceOf(addr1.address);
            await token.connect(addr1).claimDividend(1);
            const balanceAfter = await paymentToken.balanceOf(addr1.address);
            
            expect(balanceAfter).to.be.gt(balanceBefore);
        });
        
        it("Should prevent double claiming", async function () {
            await paymentToken.mint(owner.address, DIVIDEND_AMOUNT);
            await paymentToken.approve(token.address, DIVIDEND_AMOUNT);
            
            const recordDate = await time.latest() + 10;
            const paymentDate = recordDate + 100;
            
            await token.declareDividend(
                DIVIDEND_AMOUNT,
                paymentToken.address,
                recordDate,
                paymentDate
            );
            
            await time.increaseTo(paymentDate + 1);
            
            await token.connect(addr1).claimDividend(1);
            
            // Try to claim again
            await expect(
                token.connect(addr1).claimDividend(1)
            ).to.be.revertedWithCustomError(token, "DividendAlreadyClaimed");
        });
        
        it("Should sweep unclaimed dividends after expiry", async function () {
            await paymentToken.mint(owner.address, DIVIDEND_AMOUNT);
            await paymentToken.approve(token.address, DIVIDEND_AMOUNT);
            
            const recordDate = await time.latest() + 10;
            const paymentDate = recordDate + 100;
            
            await token.declareDividend(
                DIVIDEND_AMOUNT,
                paymentToken.address,
                recordDate,
                paymentDate
            );
            
            // Advance time past expiry (365 days)
            await time.increaseTo(paymentDate + 365 * 86400 + 1);
            
            const balanceBefore = await paymentToken.balanceOf(owner.address);
            await token.sweepUnclaimedDividends(1);
            const balanceAfter = await paymentToken.balanceOf(owner.address);
            
            // Owner should receive unclaimed dividends back
            expect(balanceAfter).to.be.gt(balanceBefore);
        });
    });
    
    describe("Voting Rights", function () {
        it("Should create proposal and allow voting", async function () {
            const duration = 100; // 100 blocks
            const quorum = 3000; // 30%
            
            const tx = await token.createProposal(
                "Increase dividend payout ratio",
                duration,
                quorum
            );
            
            await expect(tx).to.emit(token, "ProposalCreated");
            
            // Cast vote
            await token.connect(addr1).castVote(1, 1); // Vote for
            await token.connect(addr2).castVote(1, 0); // Vote against
            
            const proposal = await token.getProposalInfo(1);
            expect(proposal.forVotes).to.be.gt(0);
            expect(proposal.againstVotes).to.be.gt(0);
        });
        
        it("Should enforce voting period", async function () {
            await token.createProposal("Test proposal", 10, 3000);
            
            // Advance past voting period
            await mine(15);
            
            await expect(
                token.connect(addr1).castVote(1, 1)
            ).to.be.revertedWithCustomError(token, "ProposalEnded");
        });
        
        it("Should allow vote delegation", async function () {
            await token.connect(addr1).delegateVote(addr2.address);
            
            await expect(
                token.connect(addr1).delegateVote(addr2.address)
            ).to.emit(token, "VoteDelegated").withArgs(addr1.address, addr2.address);
        });
        
        it("Should prevent self-delegation", async function () {
            await expect(
                token.connect(addr1).delegateVote(addr1.address)
            ).to.be.revertedWithCustomError(token, "SelfDelegation");
        });
        
        it("Should execute passed proposals with quorum", async function () {
            await token.createProposal("Test proposal", 10, 1000); // 10% quorum
            
            // Vote with majority
            await token.connect(owner).castVote(1, 1); // Large holder votes for
            await token.connect(addr1).castVote(1, 1);
            await token.connect(addr2).castVote(1, 1);
            
            // Advance past voting and execution delay
            await mine(10 + 100); // voting period + execution delay
            
            await expect(
                token.executeProposal(1)
            ).to.emit(token, "ProposalExecuted").withArgs(1);
        });
    });
    
    describe("Corporate Actions", function () {
        it("Should initiate and execute stock split", async function () {
            const balanceBefore = await token.balanceOf(addr1.address);
            
            // Initiate 2:1 split
            const executionDate = await time.latest() + 86400;
            await token.initiateSplit(2, 1, executionDate);
            
            // Advance to execution date
            await time.increaseTo(executionDate);
            
            // Execute split
            await token.executeCorporateAction(1);
            
            const balanceAfter = await token.balanceOf(addr1.address);
            expect(balanceAfter).to.equal(balanceBefore.mul(2));
        });
        
        it("Should initiate and execute reverse split", async function () {
            const balanceBefore = await token.balanceOf(addr1.address);
            
            // Initiate 1:10 reverse split
            const executionDate = await time.latest() + 86400;
            await token.initiateReverseSplit(1, 10, executionDate);
            
            // Advance to execution date
            await time.increaseTo(executionDate);
            
            // Execute reverse split
            await token.executeCorporateAction(1);
            
            const balanceAfter = await token.balanceOf(addr1.address);
            expect(balanceAfter).to.equal(balanceBefore.div(10));
        });
        
        it("Should handle rights issue subscription", async function () {
            // Initiate rights issue: 1 new share per 10 existing
            const subscriptionPrice = ethers.utils.parseEther("100");
            const deadline = await time.latest() + 86400;
            
            await token.initiateRightsIssue(10, subscriptionPrice, deadline);
            
            // Calculate eligible rights for addr1
            const balance = await token.balanceOf(addr1.address);
            const eligibleRights = balance.div(10);
            
            // Subscribe to rights
            const payment = eligibleRights.mul(subscriptionPrice);
            await expect(
                token.connect(addr1).subscribeToRights(1, eligibleRights, { value: payment })
            ).to.emit(token, "RightsSubscribed");
        });
        
        it("Should prevent invalid ratio for splits", async function () {
            const executionDate = await time.latest() + 86400;
            
            await expect(
                token.initiateSplit(0, 1, executionDate)
            ).to.be.revertedWithCustomError(token, "InvalidActionRatio");
        });
        
        it("Should prevent premature execution of corporate actions", async function () {
            const executionDate = await time.latest() + 86400;
            await token.initiateSplit(2, 1, executionDate);
            
            // Try to execute before execution date
            await expect(
                token.executeCorporateAction(1)
            ).to.be.revertedWithCustomError(token, "ActionNotScheduled");
        });
    });
    
    describe("Transfer Restrictions", function () {
        it("Should enforce blacklist restrictions", async function () {
            const COMPLIANCE_ROLE = await token.COMPLIANCE_ROLE();
            await token.grantRole(COMPLIANCE_ROLE, owner.address);
            
            // Set blacklist restriction
            const TRANSFER_ADMIN_ROLE = await token.TRANSFER_ADMIN_ROLE();
            await token.grantRole(TRANSFER_ADMIN_ROLE, owner.address);
            await token.setTransferRestriction(1); // BLACKLIST
            
            // Blacklist addr1
            await token.addToBlacklist(addr1.address);
            
            // Try to transfer
            await expect(
                token.connect(addr1).transfer(addr2.address, ethers.utils.parseEther("100"))
            ).to.be.revertedWithCustomError(token, "AddressBlacklisted");
        });
        
        it("Should enforce whitelist restrictions", async function () {
            const COMPLIANCE_ROLE = await token.COMPLIANCE_ROLE();
            const TRANSFER_ADMIN_ROLE = await token.TRANSFER_ADMIN_ROLE();
            await token.grantRole(COMPLIANCE_ROLE, owner.address);
            await token.grantRole(TRANSFER_ADMIN_ROLE, owner.address);
            
            await token.setTransferRestriction(2); // WHITELIST
            
            // Only whitelist addr1
            await token.addToWhitelist(addr1.address);
            
            // addr2 not whitelisted, transfer should fail
            await expect(
                token.connect(addr2).transfer(addr3.address, ethers.utils.parseEther("100"))
            ).to.be.revertedWithCustomError(token, "AddressNotWhitelisted");
        });
        
        it("Should enforce lockup periods", async function () {
            const COMPLIANCE_ROLE = await token.COMPLIANCE_ROLE();
            const TRANSFER_ADMIN_ROLE = await token.TRANSFER_ADMIN_ROLE();
            await token.grantRole(COMPLIANCE_ROLE, owner.address);
            await token.grantRole(TRANSFER_ADMIN_ROLE, owner.address);
            
            await token.setTransferRestriction(3); // LOCKUP
            
            // Set lockup for addr1
            const lockupExpiry = await time.latest() + 86400;
            await token.setLockup(addr1.address, lockupExpiry);
            
            // Try to transfer during lockup
            await expect(
                token.connect(addr1).transfer(addr2.address, ethers.utils.parseEther("100"))
            ).to.be.revertedWithCustomError(token, "LockupPeriodActive");
            
            // Advance past lockup
            await time.increaseTo(lockupExpiry + 1);
            
            // Transfer should now succeed
            await expect(
                token.connect(addr1).transfer(addr2.address, ethers.utils.parseEther("100"))
            ).to.not.be.reverted;
        });
        
        it("Should allow global transfer disable", async function () {
            await token.setTransfersEnabled(false);
            
            await expect(
                token.connect(addr1).transfer(addr2.address, ethers.utils.parseEther("100"))
            ).to.be.revertedWithCustomError(token, "TransfersDisabled");
        });
    });
    
    describe("ERC-1400 Compliance", function () {
        it("Should report as controllable", async function () {
            expect(await token.isControllable()).to.be.true;
        });
        
        it("Should report as issuable", async function () {
            expect(await token.isIssuable()).to.be.true;
        });
        
        it("Should set and get document", async function () {
            const docHash = ethers.utils.formatBytes32String("DOC001");
            const uri = "ipfs://QmDocumentHash";
            
            await token.setDocument(docHash, uri, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(uri)));
            
            const [docUri] = await token.getDocument(docHash);
            expect(docUri).to.equal(uri);
        });
    });
    
    describe("Edge Cases", function () {
        it("Should handle zero balance dividend claims gracefully", async function () {
            await paymentToken.mint(owner.address, DIVIDEND_AMOUNT);
            await paymentToken.approve(token.address, DIVIDEND_AMOUNT);
            
            const recordDate = await time.latest() + 10;
            const paymentDate = recordDate + 100;
            
            await token.declareDividend(
                DIVIDEND_AMOUNT,
                paymentToken.address,
                recordDate,
                paymentDate
            );
            
            // Create new address with no tokens
            const [newAddr] = await ethers.getSigners();
            
            await time.increaseTo(paymentDate + 1);
            
            // Should revert with insufficient funds
            await expect(
                token.connect(newAddr).claimDividend(1)
            ).to.be.revertedWithCustomError(token, "InsufficientDividendFunds");
        });
        
        it("Should handle voting with zero balance", async function () {
            await token.createProposal("Test", 100, 3000);
            
            // Transfer all tokens away from addr3
            const balance = await token.balanceOf(addr3.address);
            await token.connect(addr3).transfer(addr1.address, balance);
            
            // Should revert when trying to vote with zero balance
            await expect(
                token.connect(addr3).castVote(1, 1)
            ).to.be.revertedWithCustomError(token, "InvalidVoteChoice");
        });
    });
});

// Helper function to mine blocks
async function mine(blocks) {
    for (let i = 0; i < blocks; i++) {
        await ethers.provider.send("evm_mine", []);
    }
}
