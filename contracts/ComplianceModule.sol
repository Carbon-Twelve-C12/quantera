// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IComplianceModule.sol";
import "./interfaces/ITreasuryRegistry.sol";

/**
 * @title ComplianceModule
 * @dev Implementation of the compliance module ensuring regulatory compliance for treasury token transfers,
 * with support for institutional validation (EIP-7251) and validator deposits (EIP-6110).
 */
contract ComplianceModule is IComplianceModule {
    // Reference to the registry
    ITreasuryRegistry public registry;
    
    // Mapping of investor verification status
    mapping(address => VerificationStatus) public investorStatus;
    
    // Mapping of investor jurisdictions (ISO 3166-1 alpha-2 code)
    mapping(address => bytes2) public investorJurisdiction;
    
    // Mapping of investment limits by verification status
    mapping(uint8 => uint256) public investmentLimits;
    
    // Mapping of institutional stakers
    mapping(address => InstitutionalInfo) public institutionalStakers;
    
    // Mapping of blacklisted addresses
    mapping(address => bool) public blacklisted;
    
    // Mapping of restricted jurisdictions
    mapping(bytes2 => bool) public restrictedJurisdictions;
    
    // Mapping of total investment amount per investor
    mapping(address => uint256) public totalInvestment;
    
    // Administrator address
    address public admin;
    
    // Mapping of compliance managers
    mapping(address => bool) public complianceManagers;
    
    /**
     * @dev Emitted when an address is added to the blacklist
     */
    event AddedToBlacklist(address indexed account);
    
    /**
     * @dev Emitted when an address is removed from the blacklist
     */
    event RemovedFromBlacklist(address indexed account);
    
    /**
     * @dev Emitted when a jurisdiction is restricted
     */
    event JurisdictionRestricted(bytes2 indexed jurisdiction, bool restricted);
    
    /**
     * @dev Emitted when a compliance manager is added or removed
     */
    event ComplianceManagerUpdated(address indexed manager, bool isActive);
    
    /**
     * @dev Modifier to check if caller is admin
     */
    modifier onlyAdmin() {
        require(msg.sender == admin, "ComplianceModule: caller is not admin");
        _;
    }
    
    /**
     * @dev Modifier to check if caller is a compliance manager
     */
    modifier onlyComplianceManager() {
        require(
            msg.sender == admin || complianceManagers[msg.sender],
            "ComplianceModule: caller is not compliance manager or admin"
        );
        _;
    }
    
    /**
     * @dev Constructor to initialize the compliance module
     * @param _admin Address of the admin
     * @param _registry Address of the treasury registry
     */
    constructor(address _admin, address _registry) {
        require(_admin != address(0), "ComplianceModule: admin is the zero address");
        require(_registry != address(0), "ComplianceModule: registry is the zero address");
        
        admin = _admin;
        registry = ITreasuryRegistry(_registry);
        
        // Set default investment limits
        investmentLimits[uint8(VerificationStatus.NONE)] = 0;
        investmentLimits[uint8(VerificationStatus.BASIC)] = 10000 ether; // Example: $10,000 limit
        investmentLimits[uint8(VerificationStatus.VERIFIED)] = 100000 ether; // Example: $100,000 limit
        investmentLimits[uint8(VerificationStatus.INSTITUTIONAL)] = type(uint256).max; // No limit for institutions
    }
    
    /**
     * @dev Check if transfer complies with regulations
     * @param from The address sending tokens
     * @param to The address receiving tokens
     * @param amount The amount of tokens
     * @param treasuryId The unique identifier for the treasury
     * @return Whether the transfer complies, and any additional data
     */
    function checkCompliance(
        address from,
        address to,
        uint256 amount,
        bytes32 treasuryId
    ) external view override returns (bool, bytes memory) {
        // Special case for initial issuance (from zero address)
        if (from == address(0)) {
            return _checkReceiverCompliance(to, amount);
        }
        
        // Check if either party is blacklisted
        if (blacklisted[from] || blacklisted[to]) {
            return (false, abi.encode("Blacklisted address"));
        }
        
        // Check jurisdictions
        bytes2 fromJurisdiction = investorJurisdiction[from];
        bytes2 toJurisdiction = investorJurisdiction[to];
        
        if (restrictedJurisdictions[fromJurisdiction] || restrictedJurisdictions[toJurisdiction]) {
            return (false, abi.encode("Restricted jurisdiction"));
        }
        
        // Check verification status
        VerificationStatus fromStatus = investorStatus[from];
        VerificationStatus toStatus = investorStatus[to];
        
        // Sender must have at least BASIC verification
        if (fromStatus == VerificationStatus.NONE) {
            return (false, abi.encode("Sender not verified"));
        }
        
        // Receiver must have at least BASIC verification
        if (toStatus == VerificationStatus.NONE) {
            return (false, abi.encode("Receiver not verified"));
        }
        
        // Check investment limits for receiver
        uint256 receiverLimit = investmentLimits[uint8(toStatus)];
        if (totalInvestment[to] + amount > receiverLimit) {
            return (false, abi.encode("Exceeds investment limit"));
        }
        
        // All checks passed
        return (true, "");
    }
    
    /**
     * @dev Set investor verification status
     * @param investor The address of the investor
     * @param status The new verification status
     * @param jurisdiction The jurisdiction code (ISO 3166-1 alpha-2)
     */
    function setInvestorStatus(
        address investor,
        VerificationStatus status,
        bytes2 jurisdiction
    ) external override onlyComplianceManager {
        require(investor != address(0), "ComplianceModule: investor is the zero address");
        
        // Update status and jurisdiction
        investorStatus[investor] = status;
        investorJurisdiction[investor] = jurisdiction;
        
        emit InvestorStatusChanged(investor, status);
    }
    
    /**
     * @dev Set investment limit for verification level
     * @param status The verification status
     * @param limit The investment limit
     */
    function setInvestmentLimit(
        VerificationStatus status,
        uint256 limit
    ) external override onlyAdmin {
        investmentLimits[uint8(status)] = limit;
        
        emit InvestmentLimitChanged(status, limit);
    }
    
    /**
     * @dev Register institutional staker
     * @param institution The address of the institution
     * @param stakeAmount The stake amount
     * @param blsPublicKey The BLS public key
     * @return Success status
     */
    function registerInstitutionalStaker(
        address institution,
        uint256 stakeAmount,
        bytes calldata blsPublicKey
    ) external override returns (bool) {
        // Only the institution itself or a compliance manager can register
        require(
            msg.sender == institution || complianceManagers[msg.sender] || msg.sender == admin,
            "ComplianceModule: caller is not authorized"
        );
        
        require(institution != address(0), "ComplianceModule: institution is the zero address");
        require(stakeAmount > 0, "ComplianceModule: stake amount must be greater than zero");
        require(blsPublicKey.length == 48, "ComplianceModule: invalid BLS public key format");
        
        // Check if already registered
        if (institutionalStakers[institution].active) {
            return false;
        }
        
        // Set institutional status
        investorStatus[institution] = VerificationStatus.INSTITUTIONAL;
        
        // Register as institutional staker
        institutionalStakers[institution] = InstitutionalInfo({
            stakeAmount: stakeAmount,
            validatorCount: 1, // Start with one validator
            blsPublicKey: blsPublicKey,
            active: true
        });
        
        emit InstitutionalStakerRegistered(institution, stakeAmount);
        
        return true;
    }
    
    /**
     * @dev Update institutional stake
     * @param newStakeAmount The new stake amount
     * @return Success status
     */
    function updateInstitutionalStake(
        uint256 newStakeAmount
    ) external override returns (bool) {
        // Get institution info
        InstitutionalInfo storage info = institutionalStakers[msg.sender];
        
        // Check if institution is registered
        require(info.active, "ComplianceModule: caller is not a registered institution");
        
        // Check minimum stake amount
        require(newStakeAmount > 0, "ComplianceModule: stake amount must be greater than zero");
        
        // Update stake amount
        info.stakeAmount = newStakeAmount;
        
        emit InstitutionalStakeUpdated(msg.sender, newStakeAmount);
        
        return true;
    }
    
    /**
     * @dev Get investor details
     * @param investor The address of the investor
     * @return The verification status, jurisdiction, and investment limit
     */
    function getInvestorDetails(address investor) 
        external 
        view 
        override 
        returns (VerificationStatus, bytes2, uint256) 
    {
        return (
            investorStatus[investor],
            investorJurisdiction[investor],
            investmentLimits[uint8(investorStatus[investor])]
        );
    }
    
    /**
     * @dev Get institutional staker details
     * @param institution The address of the institution
     * @return The institutional information
     */
    function getInstitutionalDetails(address institution)
        external
        view
        override
        returns (InstitutionalInfo memory)
    {
        return institutionalStakers[institution];
    }
    
    /**
     * @dev Add or remove address from blacklist
     * @param account The address to update
     * @param isBlacklisted Whether the address should be blacklisted
     */
    function setBlacklistStatus(address account, bool isBlacklisted) external onlyComplianceManager {
        blacklisted[account] = isBlacklisted;
        
        if (isBlacklisted) {
            emit AddedToBlacklist(account);
        } else {
            emit RemovedFromBlacklist(account);
        }
    }
    
    /**
     * @dev Set jurisdiction restriction
     * @param jurisdiction The jurisdiction code (ISO 3166-1 alpha-2)
     * @param isRestricted Whether the jurisdiction is restricted
     */
    function setJurisdictionRestriction(bytes2 jurisdiction, bool isRestricted) external onlyAdmin {
        restrictedJurisdictions[jurisdiction] = isRestricted;
        
        emit JurisdictionRestricted(jurisdiction, isRestricted);
    }
    
    /**
     * @dev Add or remove compliance manager
     * @param manager The address of the manager
     * @param isActive Whether the manager is active
     */
    function setComplianceManager(address manager, bool isActive) external onlyAdmin {
        require(manager != address(0), "ComplianceModule: manager is the zero address");
        complianceManagers[manager] = isActive;
        
        emit ComplianceManagerUpdated(manager, isActive);
    }
    
    /**
     * @dev Update total investment for an investor
     * @param investor The address of the investor
     * @param amount The amount to add to total investment
     */
    function updateTotalInvestment(address investor, uint256 amount) external {
        // Only allow calls from treasury tokens registered in the registry
        bool isToken = false;
        bytes32[] memory treasuries = registry.getAllTreasuries();
        
        for (uint256 i = 0; i < treasuries.length; i++) {
            ITreasuryRegistry.TreasuryInfo memory info = registry.getTreasuryDetails(treasuries[i]);
            if (info.tokenAddress == msg.sender) {
                isToken = true;
                break;
            }
        }
        
        require(isToken, "ComplianceModule: caller is not a registered treasury token");
        
        // Update total investment
        totalInvestment[investor] += amount;
    }
    
    /**
     * @dev Set validator count for an institution
     * @param institution The address of the institution
     * @param count The new validator count
     */
    function setValidatorCount(address institution, uint256 count) external onlyAdmin {
        require(institutionalStakers[institution].active, "ComplianceModule: not a registered institution");
        
        institutionalStakers[institution].validatorCount = count;
    }
    
    /**
     * @dev Check receiver compliance internally
     * @param receiver The address receiving tokens
     * @param amount The amount of tokens
     * @return Whether the receiver complies, and any additional data
     */
    function _checkReceiverCompliance(address receiver, uint256 amount) internal view returns (bool, bytes memory) {
        // Check if receiver is blacklisted
        if (blacklisted[receiver]) {
            return (false, abi.encode("Blacklisted address"));
        }
        
        // Check jurisdiction
        bytes2 receiverJurisdiction = investorJurisdiction[receiver];
        if (restrictedJurisdictions[receiverJurisdiction]) {
            return (false, abi.encode("Restricted jurisdiction"));
        }
        
        // Check verification status
        VerificationStatus receiverStatus = investorStatus[receiver];
        if (receiverStatus == VerificationStatus.NONE) {
            return (false, abi.encode("Receiver not verified"));
        }
        
        // Check investment limits
        uint256 receiverLimit = investmentLimits[uint8(receiverStatus)];
        if (totalInvestment[receiver] + amount > receiverLimit) {
            return (false, abi.encode("Exceeds investment limit"));
        }
        
        // All checks passed
        return (true, "");
    }
} 