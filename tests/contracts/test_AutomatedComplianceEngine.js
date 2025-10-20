const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AutomatedComplianceEngine", function () {
    let AutomatedComplianceEngine;
    let complianceEngine;
    let owner;
    let complianceAdmin;
    let kycProvider;
    let investor1;
    let investor2;
    let addr1;

    const COMPLIANCE_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("COMPLIANCE_ADMIN"));
    const KYC_PROVIDER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("KYC_PROVIDER"));
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    beforeEach(async function () {
        [owner, complianceAdmin, kycProvider, investor1, investor2, addr1] = await ethers.getSigners();

        AutomatedComplianceEngine = await ethers.getContractFactory("AutomatedComplianceEngine");
        complianceEngine = await AutomatedComplianceEngine.deploy(owner.address, complianceAdmin.address);
        await complianceEngine.waitForDeployment();

        // Grant KYC provider role
        await complianceEngine.connect(owner).grantRole(KYC_PROVIDER_ROLE, kycProvider.address);
    });

    describe("Deployment and Roles", function () {
        it("Should set the right owner and compliance admin", async function () {
            expect(await complianceEngine.hasRole(await complianceEngine.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
            expect(await complianceEngine.hasRole(COMPLIANCE_ADMIN_ROLE, complianceAdmin.address)).to.be.true;
        });

        it("Should initialize default jurisdictions", async function () {
            const jurisdictions = await complianceEngine.getSupportedJurisdictions();
            expect(jurisdictions.length).to.equal(3);
            expect(jurisdictions).to.include("US");
            expect(jurisdictions).to.include("EU");
            expect(jurisdictions).to.include("SG");
        });
    });

    describe("Jurisdiction Rules Management", function () {
        it("Should allow compliance admin to update jurisdiction rules", async function () {
            const newRules = {
                enabled: true,
                minInvestmentAmount: ethers.parseEther("50000"),
                maxInvestmentAmount: ethers.parseEther("1000000"),
                maxInvestorsAllowed: 1000,
                coolingOffPeriod: 7,
                requiredKYCLevel: 2,
                minAccreditationLevel: 1,
                requiresLocalEntity: false,
                allowsTokenization: true,
                requiredDocuments: [],
                restrictedAssetTypes: [],
                lastUpdated: 0
            };

            await complianceEngine.connect(complianceAdmin).updateJurisdictionRules("GB", newRules);
            const rules = await complianceEngine.getJurisdictionRules("GB");
            expect(rules.enabled).to.be.true;
            expect(rules.minInvestmentAmount).to.equal(ethers.parseEther("50000"));
        });

        it("Should revert if non-admin tries to update rules", async function () {
            const newRules = {
                enabled: true,
                minInvestmentAmount: ethers.parseEther("10000"),
                maxInvestmentAmount: ethers.parseEther("100000"),
                maxInvestorsAllowed: 100,
                coolingOffPeriod: 0,
                requiredKYCLevel: 1,
                minAccreditationLevel: 0,
                requiresLocalEntity: false,
                allowsTokenization: true,
                requiredDocuments: [],
                restrictedAssetTypes: [],
                lastUpdated: 0
            };

            await expect(
                complianceEngine.connect(investor1).updateJurisdictionRules("JP", newRules)
            ).to.be.revertedWithCustomError(complianceEngine, "AccessControlUnauthorizedAccount");
        });
    });

    describe("Investor Profile Management", function () {
        it("Should allow KYC provider to set investor profile", async function () {
            const kycExpiration = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year
            
            const profile = {
                investorAddress: investor1.address,
                jurisdiction: "US",
                kycLevel: 2,
                accreditationLevel: 1,
                kycExpiration: kycExpiration,
                amlLastChecked: Math.floor(Date.now() / 1000),
                riskScore: 30,
                ipfsDocumentHash: "QmTestHash123",
                totalInvested: ethers.parseEther("100000"),
                lastActivity: 0,
                sanctioned: false,
                pep: false
            };

            await complianceEngine.connect(kycProvider).setInvestorProfile(investor1.address, profile);
            
            const savedProfile = await complianceEngine.investorProfiles(investor1.address);
            expect(savedProfile.jurisdiction).to.equal("US");
            expect(savedProfile.kycLevel).to.equal(2);
            expect(savedProfile.accreditationLevel).to.equal(1);
            expect(savedProfile.sanctioned).to.be.false;
        });

        it("Should batch update multiple investor profiles", async function () {
            const kycExpiration = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
            
            const profiles = [
                {
                    investorAddress: investor1.address,
                    jurisdiction: "US",
                    kycLevel: 3,
                    accreditationLevel: 1,
                    kycExpiration: kycExpiration,
                    amlLastChecked: Math.floor(Date.now() / 1000),
                    riskScore: 25,
                    ipfsDocumentHash: "QmHash1",
                    totalInvested: 0,
                    lastActivity: 0,
                    sanctioned: false,
                    pep: false
                },
                {
                    investorAddress: investor2.address,
                    jurisdiction: "EU",
                    kycLevel: 2,
                    accreditationLevel: 0,
                    kycExpiration: kycExpiration,
                    amlLastChecked: Math.floor(Date.now() / 1000),
                    riskScore: 40,
                    ipfsDocumentHash: "QmHash2",
                    totalInvested: 0,
                    lastActivity: 0,
                    sanctioned: false,
                    pep: false
                }
            ];

            await complianceEngine.connect(kycProvider).batchSetInvestorProfiles(
                [investor1.address, investor2.address],
                profiles
            );

            const profile1 = await complianceEngine.investorProfiles(investor1.address);
            const profile2 = await complianceEngine.investorProfiles(investor2.address);
            
            expect(profile1.kycLevel).to.equal(3);
            expect(profile2.jurisdiction).to.equal("EU");
        });
    });

    describe("Investment Validation", function () {
        beforeEach(async function () {
            // Set up investor profile
            const kycExpiration = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
            
            const profile = {
                investorAddress: investor1.address,
                jurisdiction: "US",
                kycLevel: 3,
                accreditationLevel: 1,
                kycExpiration: kycExpiration,
                amlLastChecked: Math.floor(Date.now() / 1000),
                riskScore: 30,
                ipfsDocumentHash: "QmTestHash",
                totalInvested: 0,
                lastActivity: 0,
                sanctioned: false,
                pep: false
            };

            await complianceEngine.connect(kycProvider).setInvestorProfile(investor1.address, profile);
        });

        it("Should approve valid investment", async function () {
            const assetType = 0; // TREASURY
            const amount = ethers.parseEther("50000");
            const assetAddress = addr1.address;

            const [approved, violations] = await complianceEngine.validateInvestment(
                investor1.address,
                assetType,
                amount,
                assetAddress
            );

            expect(approved).to.be.true;
            expect(violations.length).to.equal(0);
        });

        it("Should reject investment below minimum", async function () {
            const assetType = 0;
            const amount = ethers.parseEther("10000"); // Below US minimum of 25000
            const assetAddress = addr1.address;

            const [approved, violations] = await complianceEngine.validateInvestment(
                investor1.address,
                assetType,
                amount,
                assetAddress
            );

            expect(approved).to.be.false;
            expect(violations.length).to.be.greaterThan(0);
            expect(violations[0].violationType).to.equal("BELOW_MIN_INVESTMENT");
        });

        it("Should reject sanctioned investor", async function () {
            // Update investor to sanctioned
            const profile = {
                investorAddress: investor2.address,
                jurisdiction: "US",
                kycLevel: 3,
                accreditationLevel: 1,
                kycExpiration: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
                amlLastChecked: Math.floor(Date.now() / 1000),
                riskScore: 30,
                ipfsDocumentHash: "QmTestHash",
                totalInvested: 0,
                lastActivity: 0,
                sanctioned: true, // SANCTIONED
                pep: false
            };

            await complianceEngine.connect(kycProvider).setInvestorProfile(investor2.address, profile);

            const [approved, violations] = await complianceEngine.validateInvestment(
                investor2.address,
                0,
                ethers.parseEther("50000"),
                addr1.address
            );

            expect(approved).to.be.false;
            const sanctionViolation = violations.find(v => v.violationType === "SANCTIONED");
            expect(sanctionViolation).to.not.be.undefined;
            expect(sanctionViolation.severity).to.equal(4); // Critical
        });

        it("Should reject expired KYC", async function () {
            // Set expired KYC
            const profile = {
                investorAddress: investor2.address,
                jurisdiction: "US",
                kycLevel: 3,
                accreditationLevel: 1,
                kycExpiration: Math.floor(Date.now() / 1000) - 1, // Expired
                amlLastChecked: Math.floor(Date.now() / 1000),
                riskScore: 30,
                ipfsDocumentHash: "QmTestHash",
                totalInvested: 0,
                lastActivity: 0,
                sanctioned: false,
                pep: false
            };

            await complianceEngine.connect(kycProvider).setInvestorProfile(investor2.address, profile);

            const [approved, violations] = await complianceEngine.validateInvestment(
                investor2.address,
                0,
                ethers.parseEther("50000"),
                addr1.address
            );

            expect(approved).to.be.false;
            expect(violations[0].violationType).to.equal("KYC_EXPIRED");
        });
    });

    describe("Transaction Compliance Check", function () {
        it("Should allow compliant transaction", async function () {
            const profile = {
                investorAddress: investor1.address,
                jurisdiction: "US",
                kycLevel: 3,
                accreditationLevel: 1,
                kycExpiration: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
                amlLastChecked: Math.floor(Date.now() / 1000),
                riskScore: 30,
                ipfsDocumentHash: "QmTestHash",
                totalInvested: 0,
                lastActivity: 0,
                sanctioned: false,
                pep: false
            };

            await complianceEngine.connect(kycProvider).setInvestorProfile(investor1.address, profile);

            const canProceed = await complianceEngine.checkTransactionCompliance(
                investor1.address,
                ethers.parseEther("50000")
            );

            expect(canProceed).to.be.true;
        });

        it("Should block sanctioned investor transaction", async function () {
            const profile = {
                investorAddress: investor1.address,
                jurisdiction: "US",
                kycLevel: 3,
                accreditationLevel: 1,
                kycExpiration: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
                amlLastChecked: Math.floor(Date.now() / 1000),
                riskScore: 30,
                ipfsDocumentHash: "QmTestHash",
                totalInvested: 0,
                lastActivity: 0,
                sanctioned: true, // Sanctioned
                pep: false
            };

            await complianceEngine.connect(kycProvider).setInvestorProfile(investor1.address, profile);

            const canProceed = await complianceEngine.checkTransactionCompliance(
                investor1.address,
                ethers.parseEther("50000")
            );

            expect(canProceed).to.be.false;
        });
    });

    describe("Report Generation", function () {
        it("Should generate compliance report", async function () {
            const violations = ["KYC_EXPIRED", "BELOW_MIN_INVESTMENT"];
            const ipfsHash = "QmReportHash123";

            await expect(
                complianceEngine.connect(complianceAdmin).generateComplianceReport(
                    investor1.address,
                    addr1.address,
                    ethers.parseEther("10000"),
                    violations,
                    ipfsHash
                )
            ).to.emit(complianceEngine, "ComplianceReportGenerated");

            const reportCount = await complianceEngine.totalReportsGenerated();
            expect(reportCount).to.equal(1);
        });
    });

    describe("Emergency Functions", function () {
        it("Should allow compliance admin to pause", async function () {
            await complianceEngine.connect(complianceAdmin).emergencyCompliancePause("Security incident detected");
            expect(await complianceEngine.paused()).to.be.true;
        });

        it("Should allow compliance admin to resume", async function () {
            await complianceEngine.connect(complianceAdmin).emergencyCompliancePause("Test pause");
            expect(await complianceEngine.paused()).to.be.true;

            await complianceEngine.connect(complianceAdmin).resumeCompliance();
            expect(await complianceEngine.paused()).to.be.false;
        });

        it("Should prevent non-admin from pausing", async function () {
            await expect(
                complianceEngine.connect(investor1).emergencyCompliancePause("Unauthorized")
            ).to.be.revertedWithCustomError(complianceEngine, "AccessControlUnauthorizedAccount");
        });
    });

    describe("View Functions", function () {
        it("Should return compliance status", async function () {
            const profile = {
                investorAddress: investor1.address,
                jurisdiction: "US",
                kycLevel: 3,
                accreditationLevel: 1,
                kycExpiration: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
                amlLastChecked: Math.floor(Date.now() / 1000),
                riskScore: 30,
                ipfsDocumentHash: "QmTestHash",
                totalInvested: 0,
                lastActivity: 0,
                sanctioned: false,
                pep: false
            };

            await complianceEngine.connect(kycProvider).setInvestorProfile(investor1.address, profile);

            const [isCompliant, kycValid, jurisdiction] = await complianceEngine.getComplianceStatus(investor1.address);
            
            expect(isCompliant).to.be.true;
            expect(kycValid).to.be.true;
            expect(jurisdiction).to.equal("US");
        });

        it("Should return jurisdiction rules", async function () {
            const rules = await complianceEngine.getJurisdictionRules("US");
            
            expect(rules.enabled).to.be.true;
            expect(rules.minInvestmentAmount).to.equal(ethers.parseEther("25000"));
            expect(rules.requiredKYCLevel).to.equal(3);
            expect(rules.minAccreditationLevel).to.equal(1);
        });
    });
});
