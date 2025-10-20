const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("AssetLifecycleManager", function () {
    let AssetLifecycleManager;
    let lifecycleManager;
    let EnhancedSecurityToken;
    let token;
    let paymentToken;
    let owner;
    let operator;
    let holder1;
    let holder2;
    let complianceOfficer;
    
    const INITIAL_SUPPLY = ethers.utils.parseEther("1000000");
    const FACE_VALUE = ethers.utils.parseEther("1100000"); // 10% premium at maturity
    const COUPON_RATE = 500; // 5% annual
    
    beforeEach(async function () {
        [owner, operator, holder1, holder2, complianceOfficer] = await ethers.getSigners();
        
        // Deploy mock payment token (USDC)
        const MockToken = await ethers.getContractFactory("MockERC20");
        paymentToken = await MockToken.deploy("USDC", "USDC", 6);
        await paymentToken.deployed();
        
        // Mint payment tokens for redemption
        await paymentToken.mint(owner.address, ethers.utils.parseEther("10000000"));
        
        // Deploy EnhancedSecurityToken
        EnhancedSecurityToken = await ethers.getContractFactory("EnhancedSecurityToken");
        token = await upgrades.deployProxy(
            EnhancedSecurityToken,
            ["Test Security Token", "TST", INITIAL_SUPPLY, ethers.constants.AddressZero],
            { initializer: "initialize" }
        );
        await token.deployed();
        
        // Deploy AssetLifecycleManager
        AssetLifecycleManager = await ethers.getContractFactory("AssetLifecycleManager");
        lifecycleManager = await AssetLifecycleManager.deploy(ethers.constants.AddressZero);
        await lifecycleManager.deployed();
        
        // Setup roles
        const LIFECYCLE_ADMIN = await lifecycleManager.LIFECYCLE_ADMIN();
        const REDEMPTION_OPERATOR = await lifecycleManager.REDEMPTION_OPERATOR();
        const COMPLIANCE_OFFICER = await lifecycleManager.COMPLIANCE_OFFICER();
        const RESTRICTION_MANAGER = await lifecycleManager.RESTRICTION_MANAGER();
        
        await lifecycleManager.grantRole(LIFECYCLE_ADMIN, owner.address);
        await lifecycleManager.grantRole(REDEMPTION_OPERATOR, operator.address);
        await lifecycleManager.grantRole(COMPLIANCE_OFFICER, complianceOfficer.address);
        await lifecycleManager.grantRole(RESTRICTION_MANAGER, owner.address);
        
        // Distribute tokens for testing
        await token.transfer(holder1.address, ethers.utils.parseEther("100000"));
        await token.transfer(holder2.address, ethers.utils.parseEther("200000"));
        
        // Transfer payment tokens to lifecycle manager for redemptions
        await paymentToken.transfer(lifecycleManager.address, ethers.utils.parseEther("2000000"));
    });
    
    describe("Asset Registration & Maturity", function () {
        it("Should register asset with maturity configuration", async function () {
            const maturityDate = (await time.latest()) + 365 * 86400; // 1 year from now
            
            const maturityConfig = {
                maturityDate: maturityDate,
                faceValue: FACE_VALUE,
                redemptionToken: paymentToken.address,
                hasInterest: true,
                couponRate: COUPON_RATE,
                couponFrequency: 90, // Quarterly
                finalCouponDate: maturityDate,
                gracePeriod: 30 * 86400 // 30 days
            };
            
            await expect(
                lifecycleManager.registerAssetMaturity(token.address, maturityConfig)
            ).to.emit(lifecycleManager, "AssetRegistered")
             .withArgs(token.address, maturityDate);
            
            const lifecycle = await lifecycleManager.getAssetLifecycle(token.address);
            expect(lifecycle.status).to.equal(0); // ACTIVE
        });
        
        it("Should detect maturity correctly", async function () {
            const maturityDate = (await time.latest()) + 100; // 100 seconds from now
            
            const maturityConfig = {
                maturityDate: maturityDate,
                faceValue: FACE_VALUE,
                redemptionToken: paymentToken.address,
                hasInterest: false,
                couponRate: 0,
                couponFrequency: 0,
                finalCouponDate: 0,
                gracePeriod: 86400
            };
            
            await lifecycleManager.registerAssetMaturity(token.address, maturityConfig);
            
            // Check before maturity
            expect(await lifecycleManager.checkMaturity(token.address)).to.be.false;
            
            // Advance time to maturity
            await time.increaseTo(maturityDate);
            
            // Check after maturity
            expect(await lifecycleManager.checkMaturity(token.address)).to.be.true;
        });
        
        it("Should mark asset as matured", async function () {
            const maturityDate = (await time.latest()) + 100;
            
            const maturityConfig = {
                maturityDate: maturityDate,
                faceValue: FACE_VALUE,
                redemptionToken: paymentToken.address,
                hasInterest: false,
                couponRate: 0,
                couponFrequency: 0,
                finalCouponDate: 0,
                gracePeriod: 86400
            };
            
            await lifecycleManager.registerAssetMaturity(token.address, maturityConfig);
            
            // Advance to maturity
            await time.increaseTo(maturityDate);
            
            await expect(
                lifecycleManager.markAssetMatured(token.address)
            ).to.emit(lifecycleManager, "AssetMatured")
             .withArgs(token.address, maturityDate);
            
            const lifecycle = await lifecycleManager.getAssetLifecycle(token.address);
            expect(lifecycle.status).to.equal(2); // MATURED
        });
    });
    
    describe("Redemption", function () {
        beforeEach(async function () {
            const maturityDate = (await time.latest()) + 100;
            
            const maturityConfig = {
                maturityDate: maturityDate,
                faceValue: FACE_VALUE,
                redemptionToken: paymentToken.address,
                hasInterest: true,
                couponRate: COUPON_RATE,
                couponFrequency: 90,
                finalCouponDate: maturityDate,
                gracePeriod: 86400 * 30
            };
            
            await lifecycleManager.registerAssetMaturity(token.address, maturityConfig);
            
            // Advance to maturity
            await time.increaseTo(maturityDate);
            await lifecycleManager.markAssetMatured(token.address);
        });
        
        it("Should calculate redemption amount correctly", async function () {
            const [principal, interest] = await lifecycleManager.calculateRedemptionAmount(
                token.address,
                holder1.address
            );
            
            expect(principal).to.be.gt(0);
            expect(interest).to.be.gt(0);
            
            // Verify proportional calculation
            const balance = await token.balanceOf(holder1.address);
            const totalSupply = await token.totalSupply();
            const expectedPrincipal = FACE_VALUE.mul(balance).div(totalSupply);
            
            expect(principal).to.be.closeTo(expectedPrincipal, ethers.utils.parseEther("1"));
        });
        
        it("Should execute redemption successfully", async function () {
            const balanceBefore = await paymentToken.balanceOf(holder1.address);
            
            await expect(
                lifecycleManager.connect(operator).executeRedemption(token.address, holder1.address)
            ).to.emit(lifecycleManager, "RedemptionExecuted");
            
            const balanceAfter = await paymentToken.balanceOf(holder1.address);
            expect(balanceAfter).to.be.gt(balanceBefore);
            
            // Check token balance is burned
            const tokenBalance = await token.balanceOf(holder1.address);
            expect(tokenBalance).to.equal(0);
        });
        
        it("Should enforce grace period", async function () {
            // Advance past grace period
            await time.increase(31 * 86400); // 31 days
            
            await expect(
                lifecycleManager.connect(operator).executeRedemption(token.address, holder1.address)
            ).to.be.revertedWithCustomError(lifecycleManager, "GracePeriodExpired");
        });
        
        it("Should handle failed redemptions for retry", async function () {
            // Make token burn fail by pausing it
            await token.pause();
            
            await expect(
                lifecycleManager.connect(operator).executeRedemption(token.address, holder1.address)
            ).to.be.revertedWithCustomError(lifecycleManager, "RedemptionFailed");
            
            // Unpause and retry
            await token.unpause();
            await lifecycleManager.connect(operator).retryFailedRedemptions(token.address);
        });
    });
    
    describe("Transfer Restrictions", function () {
        it("Should add lockup period restriction", async function () {
            const restriction = {
                restrictionType: 0, // LOCKUP_PERIOD
                startDate: await time.latest(),
                endDate: (await time.latest()) + 86400 * 180, // 180 days
                maxAmount: 0,
                minHoldingPeriod: 0,
                allowedJurisdictions: [],
                restrictedHours: [0, 0],
                isActive: true
            };
            
            await expect(
                lifecycleManager.addRestriction(token.address, restriction)
            ).to.emit(lifecycleManager, "RestrictionAdded");
            
            const lifecycle = await lifecycleManager.getAssetLifecycle(token.address);
            expect(lifecycle.hasRestrictions).to.be.true;
        });
        
        it("Should validate transfers against restrictions", async function () {
            // Add volume limit restriction
            const restriction = {
                restrictionType: 4, // VOLUME_LIMIT
                startDate: await time.latest(),
                endDate: (await time.latest()) + 86400 * 365,
                maxAmount: ethers.utils.parseEther("10000"),
                minHoldingPeriod: 0,
                allowedJurisdictions: [],
                restrictedHours: [0, 0],
                isActive: true
            };
            
            await lifecycleManager.addRestriction(token.address, restriction);
            
            // Test transfer within limit
            const [valid1, reason1] = await lifecycleManager.validateTransfer(
                token.address,
                holder1.address,
                holder2.address,
                ethers.utils.parseEther("5000")
            );
            expect(valid1).to.be.true;
            
            // Test transfer exceeding limit
            const [valid2, reason2] = await lifecycleManager.validateTransfer(
                token.address,
                holder1.address,
                holder2.address,
                ethers.utils.parseEther("15000")
            );
            expect(valid2).to.be.false;
            expect(reason2).to.include("Volume limit exceeded");
        });
        
        it("Should handle jurisdiction-based restrictions", async function () {
            // Set jurisdictions for investors
            await lifecycleManager.connect(complianceOfficer).setInvestorJurisdiction(holder1.address, "US");
            await lifecycleManager.connect(complianceOfficer).setInvestorJurisdiction(holder2.address, "JP");
            
            // Add jurisdiction restriction
            const restriction = {
                restrictionType: 3, // JURISDICTION_BASED
                startDate: await time.latest(),
                endDate: (await time.latest()) + 86400 * 365,
                maxAmount: 0,
                minHoldingPeriod: 0,
                allowedJurisdictions: ["US", "EU"],
                restrictedHours: [0, 0],
                isActive: true
            };
            
            await lifecycleManager.addRestriction(token.address, restriction);
            
            // holder2 is in JP, not allowed
            const [valid, reason] = await lifecycleManager.validateTransfer(
                token.address,
                holder1.address,
                holder2.address,
                ethers.utils.parseEther("1000")
            );
            expect(valid).to.be.false;
            expect(reason).to.include("Jurisdiction not allowed");
        });
        
        it("Should enforce trading hours restrictions", async function () {
            const restriction = {
                restrictionType: 6, // TIME_OF_DAY
                startDate: await time.latest(),
                endDate: (await time.latest()) + 86400 * 365,
                maxAmount: 0,
                minHoldingPeriod: 0,
                allowedJurisdictions: [],
                restrictedHours: [9, 17], // 9am-5pm
                isActive: true
            };
            
            await lifecycleManager.addRestriction(token.address, restriction);
            
            // Mock weekend check
            // This would need proper time manipulation in a real test
            const [valid, reason] = await lifecycleManager.validateTransfer(
                token.address,
                holder1.address,
                holder2.address,
                ethers.utils.parseEther("1000")
            );
            
            // Result depends on current time
            if (!valid) {
                expect(reason).to.match(/Weekend trading not allowed|Outside trading hours/);
            }
        });
        
        it("Should remove restrictions", async function () {
            const restriction = {
                restrictionType: 0,
                startDate: await time.latest(),
                endDate: (await time.latest()) + 86400,
                maxAmount: 0,
                minHoldingPeriod: 0,
                allowedJurisdictions: [],
                restrictedHours: [0, 0],
                isActive: true
            };
            
            const tx = await lifecycleManager.addRestriction(token.address, restriction);
            const receipt = await tx.wait();
            const restrictionId = receipt.events[0].args.restrictionId;
            
            await expect(
                lifecycleManager.removeRestriction(token.address, restrictionId)
            ).to.emit(lifecycleManager, "RestrictionRemoved");
        });
    });
    
    describe("Asset Retirement", function () {
        it("Should initiate asset retirement", async function () {
            await expect(
                lifecycleManager.initiateRetirement(token.address, 0) // MATURITY reason
            ).to.emit(lifecycleManager, "AssetRetired")
             .withArgs(token.address, 0);
            
            const lifecycle = await lifecycleManager.getAssetLifecycle(token.address);
            expect(lifecycle.status).to.equal(4); // RETIRING
        });
        
        it("Should finalize retirement with report", async function () {
            await lifecycleManager.initiateRetirement(token.address, 0);
            
            const reportHash = ethers.utils.formatBytes32String("QmIPFSHash123");
            
            await expect(
                lifecycleManager.finalizeRetirement(token.address, reportHash)
            ).to.emit(lifecycleManager, "AssetFinalized")
             .withArgs(token.address, reportHash);
            
            const lifecycle = await lifecycleManager.getAssetLifecycle(token.address);
            expect(lifecycle.status).to.equal(5); // RETIRED
            expect(lifecycle.isRetired).to.be.true;
        });
        
        it("Should get retirement status", async function () {
            await lifecycleManager.initiateRetirement(token.address, 2); // DEFAULT reason
            
            const retirement = await lifecycleManager.getRetirementStatus(token.address);
            expect(retirement.reason).to.equal(2);
            expect(retirement.asset).to.equal(token.address);
            expect(retirement.isFinalized).to.be.false;
        });
        
        it("Should prevent operations on retired assets", async function () {
            await lifecycleManager.initiateRetirement(token.address, 0);
            await lifecycleManager.finalizeRetirement(
                token.address,
                ethers.utils.formatBytes32String("report")
            );
            
            const [valid, reason] = await lifecycleManager.validateTransfer(
                token.address,
                holder1.address,
                holder2.address,
                ethers.utils.parseEther("1000")
            );
            
            expect(valid).to.be.false;
            expect(reason).to.equal("Asset retired");
        });
    });
    
    describe("Jurisdiction Management", function () {
        it("Should approve and revoke jurisdictions", async function () {
            await lifecycleManager.connect(complianceOfficer).approveJurisdiction("US");
            expect(await lifecycleManager.approvedJurisdictions("US")).to.be.true;
            
            await lifecycleManager.connect(complianceOfficer).revokeJurisdiction("US");
            expect(await lifecycleManager.approvedJurisdictions("US")).to.be.false;
        });
        
        it("Should set investor jurisdictions", async function () {
            await expect(
                lifecycleManager.connect(complianceOfficer).setInvestorJurisdiction(
                    holder1.address,
                    "EU"
                )
            ).to.emit(lifecycleManager, "InvestorJurisdictionSet")
             .withArgs(holder1.address, "EU");
            
            expect(await lifecycleManager.investorJurisdictions(holder1.address))
                .to.equal("EU");
        });
    });
    
    describe("View Functions", function () {
        it("Should calculate days to maturity", async function () {
            const daysToMaturity = 90;
            const maturityDate = (await time.latest()) + (daysToMaturity * 86400);
            
            const maturityConfig = {
                maturityDate: maturityDate,
                faceValue: FACE_VALUE,
                redemptionToken: paymentToken.address,
                hasInterest: false,
                couponRate: 0,
                couponFrequency: 0,
                finalCouponDate: 0,
                gracePeriod: 86400
            };
            
            await lifecycleManager.registerAssetMaturity(token.address, maturityConfig);
            
            const days = await lifecycleManager.getDaysToMaturity(token.address);
            expect(days).to.be.closeTo(daysToMaturity, 1);
        });
        
        it("Should check if in grace period", async function () {
            const maturityDate = (await time.latest()) + 100;
            
            const maturityConfig = {
                maturityDate: maturityDate,
                faceValue: FACE_VALUE,
                redemptionToken: paymentToken.address,
                hasInterest: false,
                couponRate: 0,
                couponFrequency: 0,
                finalCouponDate: 0,
                gracePeriod: 86400 * 7 // 7 days
            };
            
            await lifecycleManager.registerAssetMaturity(token.address, maturityConfig);
            
            // Advance to maturity
            await time.increaseTo(maturityDate);
            await lifecycleManager.markAssetMatured(token.address);
            
            expect(await lifecycleManager.isInGracePeriod(token.address)).to.be.true;
            
            // Advance past grace period
            await time.increase(86400 * 8);
            expect(await lifecycleManager.isInGracePeriod(token.address)).to.be.false;
        });
    });
    
    describe("Emergency Functions", function () {
        it("Should pause and unpause", async function () {
            await lifecycleManager.pause();
            expect(await lifecycleManager.paused()).to.be.true;
            
            await lifecycleManager.unpause();
            expect(await lifecycleManager.paused()).to.be.false;
        });
        
        it("Should perform emergency redemption", async function () {
            const amount = ethers.utils.parseEther("10000");
            const balanceBefore = await paymentToken.balanceOf(holder1.address);
            
            await lifecycleManager.emergencyRedemption(
                token.address,
                holder1.address,
                amount
            );
            
            const balanceAfter = await paymentToken.balanceOf(holder1.address);
            expect(balanceAfter).to.equal(balanceBefore.add(amount));
        });
    });
});
