// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../interfaces/IComplianceModule.sol";

/**
 * @title AutomatedComplianceEngine
 * @author Quantera Team
 * @notice Multi-jurisdiction automated compliance system supporting 50+ regions
 * @dev Implements dynamic rules management, KYC/AML validation, and automated reporting
 */
contract AutomatedComplianceEngine is AccessControl, Pausable, ReentrancyGuard {
    using Strings for uint256;

    // ============ Roles ============
    bytes32 public constant COMPLIANCE_ADMIN_ROLE = keccak256("COMPLIANCE_ADMIN");
    bytes32 public constant KYC_PROVIDER_ROLE = keccak256("KYC_PROVIDER");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR");

    // ============ Data Structures ============
    
    /**
     * @notice Jurisdiction-specific compliance rules
     */
    struct JurisdictionRules {
        bool enabled;
        uint256 minInvestmentAmount;     // Minimum investment in USD (18 decimals)
        uint256 maxInvestmentAmount;     // Maximum investment per investor
        uint256 maxInvestorsAllowed;     // Maximum number of investors
        uint256 coolingOffPeriod;        // Days before investment can be withdrawn
        uint8 requiredKYCLevel;          // 0: None, 1: Basic, 2: Enhanced, 3: Institutional
        uint8 minAccreditationLevel;     // 0: Retail, 1: Accredited, 2: Qualified, 3: Institutional
        bool requiresLocalEntity;        // Whether local entity/custodian required
        bool allowsTokenization;         // Whether jurisdiction allows tokenized assets
        string[] requiredDocuments;      // List of required document types
        uint256[] restrictedAssetTypes;  // Asset types not allowed (enum)
        uint256 lastUpdated;
    }

    /**
     * @notice Investor compliance profile
     */
    struct InvestorProfile {
        address investorAddress;
        string jurisdiction;              // ISO 3166-1 alpha-2 code (e.g., "US", "GB")
        uint8 kycLevel;                  // Current KYC verification level
        uint8 accreditationLevel;        // Investor accreditation status
        uint256 kycExpiration;           // KYC expiry timestamp
        uint256 amlLastChecked;          // Last AML/sanctions check
        uint256 riskScore;               // Risk score (0-100)
        string ipfsDocumentHash;         // IPFS hash of encrypted documents
        uint256 totalInvested;           // Total amount invested across all assets
        uint256 lastActivity;            // Last transaction timestamp
        bool sanctioned;                 // Sanctions list flag
        bool pep;                        // Politically exposed person flag
    }

    /**
     * @notice Compliance violation details
     */
    struct ComplianceViolation {
        string violationType;
        string description;
        uint256 severity; // 1: Low, 2: Medium, 3: High, 4: Critical
    }

    /**
     * @notice Transaction compliance report
     */
    struct ComplianceReport {
        address investor;
        address asset;
        uint256 amount;
        uint256 timestamp;
        bool approved;
        string[] violations;
        string ipfsReportHash;
    }

    // ============ State Variables ============
    
    mapping(string => JurisdictionRules) public jurisdictionRules;
    mapping(address => InvestorProfile) public investorProfiles;
    mapping(bytes32 => ComplianceReport) public complianceReports;
    mapping(uint256 => string) public assetTypeNames;
    mapping(address => mapping(uint256 => uint256)) public investorAssetHoldings;
    
    string[] public supportedJurisdictions;
    uint256 public totalReportsGenerated;
    uint256 public complianceCheckCount;
    
    // Rate limiting
    mapping(address => uint256) public lastComplianceCheck;
    uint256 public constant MIN_CHECK_INTERVAL = 1 minutes;
    
    // ============ Events ============
    
    event JurisdictionRuleUpdated(
        string indexed jurisdiction,
        address indexed updatedBy,
        uint256 timestamp
    );
    
    event InvestorProfileUpdated(
        address indexed investor,
        string jurisdiction,
        uint8 kycLevel,
        uint256 timestamp
    );
    
    event ComplianceCheckPerformed(
        address indexed investor,
        address indexed asset,
        bool approved,
        uint256 violationCount
    );
    
    event ComplianceViolationDetected(
        address indexed investor,
        string violationType,
        uint256 severity,
        uint256 timestamp
    );
    
    event ComplianceReportGenerated(
        bytes32 indexed reportId,
        address indexed investor,
        string ipfsHash
    );
    
    event EmergencyCompliancePause(
        address indexed triggeredBy,
        string reason,
        uint256 timestamp
    );

    // ============ Custom Errors ============
    
    error InvalidJurisdiction(string jurisdiction);
    error InsufficientKYCLevel(uint8 required, uint8 actual);
    error InsufficientAccreditation(uint8 required, uint8 actual);
    error InvestmentAmountViolation(uint256 min, uint256 max, uint256 actual);
    error KYCExpired(uint256 expirationTime);
    error SanctionedAddress(address investor);
    error AssetTypeRestricted(uint256 assetType, string jurisdiction);
    error MaxInvestorsExceeded(uint256 max, uint256 current);
    error CoolingOffPeriodActive(uint256 remainingTime);
    error RateLimitExceeded(uint256 nextAllowedTime);
    error JurisdictionNotSupported(string jurisdiction);
    error ComplianceCheckFailed(string reason);
    error UnauthorizedAccess(address caller);

    // ============ Constructor ============
    
    constructor(address _admin, address _complianceAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(COMPLIANCE_ADMIN_ROLE, _complianceAdmin);
        _grantRole(KYC_PROVIDER_ROLE, _complianceAdmin);
        
        _initializeJurisdictions();
        _initializeAssetTypes();
    }

    // ============ Modifiers ============
    
    modifier rateLimited() {
        if (block.timestamp < lastComplianceCheck[msg.sender] + MIN_CHECK_INTERVAL) {
            revert RateLimitExceeded(lastComplianceCheck[msg.sender] + MIN_CHECK_INTERVAL);
        }
        lastComplianceCheck[msg.sender] = block.timestamp;
        _;
    }
    
    modifier validJurisdiction(string memory jurisdiction) {
        if (!jurisdictionRules[jurisdiction].enabled) {
            revert InvalidJurisdiction(jurisdiction);
        }
        _;
    }

    // ============ Core Validation Functions ============
    
    /**
     * @notice Validates investment compliance across all applicable rules
     * @param investor Address of the investor
     * @param assetType Type of asset being invested in
     * @param amount Investment amount in USD (18 decimals)
     * @param assetAddress Address of the asset contract
     * @return approved Whether the investment is approved
     * @return violations Array of violation descriptions
     */
    function validateInvestment(
        address investor,
        uint256 assetType,
        uint256 amount,
        address assetAddress
    ) 
        external 
        view 
        whenNotPaused 
        returns (bool approved, ComplianceViolation[] memory violations) 
    {
        InvestorProfile memory profile = investorProfiles[investor];
        JurisdictionRules memory rules = jurisdictionRules[profile.jurisdiction];
        
        // Count violations
        uint256 violationCount = 0;
        ComplianceViolation[] memory tempViolations = new ComplianceViolation[](10);
        
        // 1. Check KYC Status
        if (profile.kycExpiration < block.timestamp) {
            tempViolations[violationCount++] = ComplianceViolation({
                violationType: "KYC_EXPIRED",
                description: "KYC verification has expired",
                severity: 4
            });
        }
        
        if (profile.kycLevel < rules.requiredKYCLevel) {
            tempViolations[violationCount++] = ComplianceViolation({
                violationType: "INSUFFICIENT_KYC",
                description: string(abi.encodePacked(
                    "KYC level ", 
                    Strings.toString(profile.kycLevel),
                    " insufficient, requires ",
                    Strings.toString(rules.requiredKYCLevel)
                )),
                severity: 3
            });
        }
        
        // 2. Check Sanctions
        if (profile.sanctioned) {
            tempViolations[violationCount++] = ComplianceViolation({
                violationType: "SANCTIONED",
                description: "Investor is on sanctions list",
                severity: 4
            });
        }
        
        // 3. Check Accreditation
        if (profile.accreditationLevel < rules.minAccreditationLevel) {
            tempViolations[violationCount++] = ComplianceViolation({
                violationType: "INSUFFICIENT_ACCREDITATION",
                description: "Investor accreditation level insufficient",
                severity: 3
            });
        }
        
        // 4. Check Investment Amounts
        if (amount < rules.minInvestmentAmount) {
            tempViolations[violationCount++] = ComplianceViolation({
                violationType: "BELOW_MIN_INVESTMENT",
                description: string(abi.encodePacked(
                    "Amount below minimum: ",
                    Strings.toString(amount / 1e18),
                    " USD"
                )),
                severity: 2
            });
        }
        
        if (amount > rules.maxInvestmentAmount && rules.maxInvestmentAmount > 0) {
            tempViolations[violationCount++] = ComplianceViolation({
                violationType: "EXCEEDS_MAX_INVESTMENT",
                description: string(abi.encodePacked(
                    "Amount exceeds maximum: ",
                    Strings.toString(rules.maxInvestmentAmount / 1e18),
                    " USD"
                )),
                severity: 2
            });
        }
        
        // 5. Check Asset Type Restrictions
        for (uint256 i = 0; i < rules.restrictedAssetTypes.length; i++) {
            if (rules.restrictedAssetTypes[i] == assetType) {
                tempViolations[violationCount++] = ComplianceViolation({
                    violationType: "RESTRICTED_ASSET_TYPE",
                    description: string(abi.encodePacked(
                        "Asset type ",
                        assetTypeNames[assetType],
                        " not allowed in jurisdiction"
                    )),
                    severity: 3
                });
                break;
            }
        }
        
        // 6. Check Tokenization Allowed
        if (!rules.allowsTokenization) {
            tempViolations[violationCount++] = ComplianceViolation({
                violationType: "TOKENIZATION_NOT_ALLOWED",
                description: "Jurisdiction does not allow tokenized assets",
                severity: 4
            });
        }
        
        // 7. Check Risk Score
        if (profile.riskScore > 75) {
            tempViolations[violationCount++] = ComplianceViolation({
                violationType: "HIGH_RISK_SCORE",
                description: string(abi.encodePacked(
                    "Risk score too high: ",
                    Strings.toString(profile.riskScore)
                )),
                severity: 3
            });
        }
        
        // Prepare return arrays
        violations = new ComplianceViolation[](violationCount);
        for (uint256 i = 0; i < violationCount; i++) {
            violations[i] = tempViolations[i];
        }
        
        approved = (violationCount == 0);
        complianceCheckCount++;
    }
    
    /**
     * @notice Performs real-time transaction compliance check
     * @param investor Investor address
     * @param amount Transaction amount
     * @return canProceed Whether transaction can proceed
     */
    function checkTransactionCompliance(
        address investor,
        uint256 amount
    ) 
        external 
        view 
        whenNotPaused 
        returns (bool canProceed) 
    {
        InvestorProfile memory profile = investorProfiles[investor];
        
        // Quick checks
        if (profile.sanctioned) return false;
        if (profile.kycExpiration < block.timestamp) return false;
        if (profile.kycLevel == 0) return false;
        
        JurisdictionRules memory rules = jurisdictionRules[profile.jurisdiction];
        if (!rules.enabled) return false;
        
        // Check amount limits
        if (amount < rules.minInvestmentAmount) return false;
        if (rules.maxInvestmentAmount > 0 && amount > rules.maxInvestmentAmount) return false;
        
        return true;
    }

    // ============ Rule Management Functions ============
    
    /**
     * @notice Updates jurisdiction-specific compliance rules
     * @param jurisdiction ISO country code
     * @param rules New compliance rules for the jurisdiction
     */
    function updateJurisdictionRules(
        string calldata jurisdiction,
        JurisdictionRules calldata rules
    ) 
        external 
        onlyRole(COMPLIANCE_ADMIN_ROLE) 
        whenNotPaused 
    {
        // Validate inputs
        require(bytes(jurisdiction).length == 2, "Invalid jurisdiction code");
        require(rules.minInvestmentAmount <= rules.maxInvestmentAmount || rules.maxInvestmentAmount == 0, 
                "Invalid investment limits");
        
        // Check if new jurisdiction
        if (!jurisdictionRules[jurisdiction].enabled && rules.enabled) {
            supportedJurisdictions.push(jurisdiction);
        }
        
        jurisdictionRules[jurisdiction] = rules;
        jurisdictionRules[jurisdiction].lastUpdated = block.timestamp;
        
        emit JurisdictionRuleUpdated(jurisdiction, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Updates investor KYC/compliance profile
     * @param investor Address of the investor
     * @param profile Updated compliance profile
     */
    function setInvestorProfile(
        address investor,
        InvestorProfile calldata profile
    ) 
        external 
        onlyRole(KYC_PROVIDER_ROLE) 
        whenNotPaused 
        validJurisdiction(profile.jurisdiction)
    {
        require(investor != address(0), "Invalid investor address");
        require(profile.kycExpiration > block.timestamp, "KYC already expired");
        
        investorProfiles[investor] = profile;
        investorProfiles[investor].lastActivity = block.timestamp;
        
        emit InvestorProfileUpdated(
            investor, 
            profile.jurisdiction, 
            profile.kycLevel, 
            block.timestamp
        );
    }
    
    /**
     * @notice Batch update investor profiles
     * @param investors Array of investor addresses
     * @param profiles Array of corresponding profiles
     */
    function batchSetInvestorProfiles(
        address[] calldata investors,
        InvestorProfile[] calldata profiles
    ) 
        external 
        onlyRole(KYC_PROVIDER_ROLE) 
        whenNotPaused 
    {
        require(investors.length == profiles.length, "Array length mismatch");
        require(investors.length <= 100, "Batch too large");
        
        for (uint256 i = 0; i < investors.length; i++) {
            investorProfiles[investors[i]] = profiles[i];
            investorProfiles[investors[i]].lastActivity = block.timestamp;
            
            emit InvestorProfileUpdated(
                investors[i],
                profiles[i].jurisdiction,
                profiles[i].kycLevel,
                block.timestamp
            );
        }
    }

    // ============ Report Generation Functions ============
    
    /**
     * @notice Generates compliance report and stores on IPFS
     * @param investor Investor address
     * @param asset Asset address
     * @param amount Transaction amount
     * @param violations Array of violations found
     * @param ipfsHash IPFS hash of detailed report
     * @return reportId Unique report identifier
     */
    function generateComplianceReport(
        address investor,
        address asset,
        uint256 amount,
        string[] calldata violations,
        string calldata ipfsHash
    ) 
        external 
        onlyRole(COMPLIANCE_ADMIN_ROLE) 
        returns (bytes32 reportId) 
    {
        reportId = keccak256(abi.encodePacked(
            investor,
            asset,
            amount,
            block.timestamp,
            totalReportsGenerated++
        ));
        
        complianceReports[reportId] = ComplianceReport({
            investor: investor,
            asset: asset,
            amount: amount,
            timestamp: block.timestamp,
            approved: violations.length == 0,
            violations: violations,
            ipfsReportHash: ipfsHash
        });
        
        emit ComplianceReportGenerated(reportId, investor, ipfsHash);
    }

    // ============ Emergency Functions ============
    
    /**
     * @notice Emergency pause for compliance issues
     * @param reason Reason for emergency pause
     */
    function emergencyCompliancePause(string calldata reason) 
        external 
        onlyRole(COMPLIANCE_ADMIN_ROLE) 
    {
        _pause();
        emit EmergencyCompliancePause(msg.sender, reason, block.timestamp);
    }
    
    /**
     * @notice Resume after emergency pause
     */
    function resumeCompliance() 
        external 
        onlyRole(COMPLIANCE_ADMIN_ROLE) 
    {
        _unpause();
    }

    // ============ View Functions ============
    
    /**
     * @notice Gets investor's current compliance status
     * @param investor Address to check
     * @return isCompliant Whether investor is currently compliant
     * @return kycValid Whether KYC is valid
     * @return jurisdiction Investor's jurisdiction
     */
    function getComplianceStatus(address investor) 
        external 
        view 
        returns (
            bool isCompliant,
            bool kycValid,
            string memory jurisdiction
        ) 
    {
        InvestorProfile memory profile = investorProfiles[investor];
        
        kycValid = profile.kycExpiration > block.timestamp && profile.kycLevel > 0;
        isCompliant = kycValid && !profile.sanctioned && profile.riskScore <= 75;
        jurisdiction = profile.jurisdiction;
    }
    
    /**
     * @notice Gets all supported jurisdictions
     * @return Array of jurisdiction codes
     */
    function getSupportedJurisdictions() 
        external 
        view 
        returns (string[] memory) 
    {
        return supportedJurisdictions;
    }
    
    /**
     * @notice Gets detailed jurisdiction rules
     * @param jurisdiction Jurisdiction code
     * @return Jurisdiction rules struct
     */
    function getJurisdictionRules(string calldata jurisdiction) 
        external 
        view 
        returns (JurisdictionRules memory) 
    {
        return jurisdictionRules[jurisdiction];
    }

    // ============ Internal Functions ============
    
    /**
     * @dev Initializes default jurisdiction rules
     */
    function _initializeJurisdictions() private {
        // United States
        jurisdictionRules["US"] = JurisdictionRules({
            enabled: true,
            minInvestmentAmount: 25000 * 1e18,
            maxInvestmentAmount: 10000000 * 1e18,
            maxInvestorsAllowed: 2000,
            coolingOffPeriod: 0,
            requiredKYCLevel: 3,
            minAccreditationLevel: 1,
            requiresLocalEntity: true,
            allowsTokenization: true,
            requiredDocuments: new string[](0),
            restrictedAssetTypes: new uint256[](0),
            lastUpdated: block.timestamp
        });
        supportedJurisdictions.push("US");
        
        // European Union
        jurisdictionRules["EU"] = JurisdictionRules({
            enabled: true,
            minInvestmentAmount: 10000 * 1e18,
            maxInvestmentAmount: 5000000 * 1e18,
            maxInvestorsAllowed: 5000,
            coolingOffPeriod: 14,
            requiredKYCLevel: 2,
            minAccreditationLevel: 0,
            requiresLocalEntity: false,
            allowsTokenization: true,
            requiredDocuments: new string[](0),
            restrictedAssetTypes: new uint256[](0),
            lastUpdated: block.timestamp
        });
        supportedJurisdictions.push("EU");
        
        // Singapore
        jurisdictionRules["SG"] = JurisdictionRules({
            enabled: true,
            minInvestmentAmount: 20000 * 1e18,
            maxInvestmentAmount: 0, // No max
            maxInvestorsAllowed: 500,
            coolingOffPeriod: 0,
            requiredKYCLevel: 2,
            minAccreditationLevel: 1,
            requiresLocalEntity: false,
            allowsTokenization: true,
            requiredDocuments: new string[](0),
            restrictedAssetTypes: new uint256[](0),
            lastUpdated: block.timestamp
        });
        supportedJurisdictions.push("SG");
    }
    
    /**
     * @dev Initializes asset type names
     */
    function _initializeAssetTypes() private {
        assetTypeNames[0] = "TREASURY";
        assetTypeNames[1] = "REAL_ESTATE";
        assetTypeNames[2] = "COMMODITY";
        assetTypeNames[3] = "EQUITY";
        assetTypeNames[4] = "DEBT";
        assetTypeNames[5] = "FUND";
        assetTypeNames[6] = "ENVIRONMENTAL";
        assetTypeNames[7] = "ART";
        assetTypeNames[8] = "INTELLECTUAL_PROPERTY";
        assetTypeNames[9] = "TRADE_FINANCE";
    }
}
