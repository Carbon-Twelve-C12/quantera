// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../interfaces/IComplianceModule.sol";
import "../tokens/EnhancedSecurityToken.sol";

/**
 * @title AssetLifecycleManager
 * @author Quantera Team
 * @notice Manages complete asset lifecycle from issuance to retirement
 * @dev Handles maturity, redemptions, transfer restrictions, and retirement
 */
contract AssetLifecycleManager is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;

    // ============ Roles ============
    bytes32 public constant LIFECYCLE_ADMIN = keccak256("LIFECYCLE_ADMIN");
    bytes32 public constant REDEMPTION_OPERATOR = keccak256("REDEMPTION_OPERATOR");
    bytes32 public constant COMPLIANCE_OFFICER = keccak256("COMPLIANCE_OFFICER");
    bytes32 public constant RESTRICTION_MANAGER = keccak256("RESTRICTION_MANAGER");

    // ============ Enums ============
    
    enum RestrictionType {
        LOCKUP_PERIOD,
        TRANSFER_WINDOW,
        HOLDING_PERIOD,
        JURISDICTION_BASED,
        VOLUME_LIMIT,
        INVESTOR_TYPE,
        TIME_OF_DAY
    }

    enum RetirementReason {
        MATURITY,
        EARLY_REDEMPTION,
        DEFAULT,
        REGULATORY,
        VOLUNTARY,
        CORPORATE_ACTION,
        LIQUIDATION
    }

    enum AssetStatus {
        ACTIVE,
        MATURING,
        MATURED,
        REDEEMING,
        RETIRING,
        RETIRED
    }

    // ============ Structs ============
    
    /**
     * @notice Maturity configuration for an asset
     * @param maturityDate Timestamp when asset matures
     * @param faceValue Face value at maturity
     * @param redemptionToken Token used for redemption
     * @param hasInterest Whether asset bears interest
     * @param couponRate Annual interest rate in basis points
     * @param couponFrequency Days between coupon payments
     * @param finalCouponDate Last coupon payment date
     * @param gracePeriod Days after maturity for late redemption
     */
    struct MaturityConfig {
        uint256 maturityDate;
        uint256 faceValue;
        address redemptionToken;
        bool hasInterest;
        uint256 couponRate;
        uint256 couponFrequency;
        uint256 finalCouponDate;
        uint256 gracePeriod;
    }

    /**
     * @notice Record of a redemption transaction
     * @param holder Address of token holder
     * @param tokenAmount Amount of tokens redeemed
     * @param principalPaid Principal amount paid
     * @param interestPaid Interest amount paid
     * @param timestamp Redemption timestamp
     * @param txHash Transaction hash
     */
    struct RedemptionRecord {
        address holder;
        uint256 tokenAmount;
        uint256 principalPaid;
        uint256 interestPaid;
        uint256 timestamp;
        bytes32 txHash;
    }

    /**
     * @notice Transfer restriction configuration
     * @param restrictionType Type of restriction
     * @param startDate Restriction start timestamp
     * @param endDate Restriction end timestamp
     * @param maxAmount Maximum transfer amount
     * @param minHoldingPeriod Minimum days to hold
     * @param allowedJurisdictions List of allowed jurisdictions
     * @param restrictedHours Trading hour restrictions
     * @param isActive Whether restriction is active
     */
    struct TransferRestriction {
        RestrictionType restrictionType;
        uint256 startDate;
        uint256 endDate;
        uint256 maxAmount;
        uint256 minHoldingPeriod;
        string[] allowedJurisdictions;
        uint8[2] restrictedHours; // [startHour, endHour]
        bool isActive;
    }

    /**
     * @notice Asset retirement record
     * @param asset Asset address
     * @param reason Retirement reason
     * @param timestamp Retirement timestamp
     * @param totalSupply Total supply at retirement
     * @param redeemedAmount Amount redeemed
     * @param unredeemed Unredeemed amount
     * @param finalReportHash IPFS hash of final report
     * @param isFinalized Whether retirement is finalized
     */
    struct RetirementRecord {
        address asset;
        RetirementReason reason;
        uint256 timestamp;
        uint256 totalSupply;
        uint256 redeemedAmount;
        uint256 unredeemed;
        bytes32 finalReportHash;
        bool isFinalized;
    }

    /**
     * @notice Asset lifecycle state
     */
    struct AssetLifecycle {
        AssetStatus status;
        uint256 issuanceDate;
        uint256 lastActivityDate;
        MaturityConfig maturity;
        uint256 totalRedeemed;
        uint256 totalInterestPaid;
        bool hasRestrictions;
        bool isRetired;
    }

    // ============ State Variables ============
    
    // Asset tracking
    mapping(address => AssetLifecycle) public assetLifecycles;
    mapping(address => mapping(uint256 => TransferRestriction)) public transferRestrictions;
    mapping(address => uint256) public restrictionCount;
    mapping(address => RetirementRecord) public retirements;
    
    // Redemption tracking
    mapping(address => mapping(address => RedemptionRecord[])) public redemptions; // asset => holder => records
    mapping(address => uint256) public totalRedemptions;
    mapping(address => mapping(address => uint256)) public lastRedemption; // asset => holder => timestamp
    
    // Failed redemption retry
    mapping(address => mapping(address => uint256)) public failedRedemptions; // asset => holder => amount
    mapping(address => address[]) public failedRedemptionHolders;
    
    // Jurisdiction management
    mapping(string => bool) public approvedJurisdictions;
    mapping(address => string) public investorJurisdictions;
    
    // Counters
    Counters.Counter private _restrictionIdCounter;
    Counters.Counter private _redemptionIdCounter;
    
    // Configuration
    address public complianceModule;
    uint256 public defaultGracePeriod = 30 days;
    uint256 public maxRedemptionRetries = 3;
    
    // Constants
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant DAYS_IN_YEAR = 365;
    uint256 public constant PRECISION = 1e18;
    
    // ============ Events ============
    
    // Lifecycle events
    event AssetRegistered(address indexed asset, uint256 maturityDate);
    event AssetMatured(address indexed asset, uint256 maturityDate);
    event AssetRetired(address indexed asset, RetirementReason reason);
    event AssetFinalized(address indexed asset, bytes32 reportHash);
    
    // Redemption events
    event RedemptionExecuted(
        address indexed asset,
        address indexed holder,
        uint256 principal,
        uint256 interest,
        uint256 total
    );
    event RedemptionFailed(
        address indexed asset,
        address indexed holder,
        uint256 amount,
        string reason
    );
    event RedemptionRetried(
        address indexed asset,
        address indexed holder,
        bool success
    );
    
    // Restriction events
    event RestrictionAdded(
        address indexed asset,
        uint256 restrictionId,
        RestrictionType restrictionType
    );
    event RestrictionRemoved(address indexed asset, uint256 restrictionId);
    event TransferValidated(
        address indexed asset,
        address from,
        address to,
        bool valid
    );
    
    // Configuration events
    event JurisdictionApproved(string jurisdiction);
    event JurisdictionRevoked(string jurisdiction);
    event InvestorJurisdictionSet(address indexed investor, string jurisdiction);
    
    // ============ Custom Errors ============
    error AssetNotRegistered();
    error AssetAlreadyMatured();
    error AssetNotMatured();
    error RedemptionNotAvailable();
    error InsufficientBalance();
    error RedemptionFailed();
    error InvalidMaturityDate();
    error InvalidRedemptionToken();
    error AssetAlreadyRetired();
    error RetirementNotInitiated();
    error InvalidRestriction();
    error TransferRestricted();
    error JurisdictionNotAllowed();
    error HoldingPeriodNotMet();
    error VolumeExceeded();
    error TradingWindowClosed();
    error GracePeriodExpired();
    error UnauthorizedOperation();
    
    // ============ Constructor ============
    
    constructor(address _complianceModule) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(LIFECYCLE_ADMIN, msg.sender);
        _grantRole(REDEMPTION_OPERATOR, msg.sender);
        _grantRole(COMPLIANCE_OFFICER, msg.sender);
        _grantRole(RESTRICTION_MANAGER, msg.sender);
        
        complianceModule = _complianceModule;
    }
    
    // ============ Maturity & Redemption Functions ============
    
    /**
     * @notice Register an asset with maturity configuration
     * @param _asset Asset address
     * @param _config Maturity configuration
     */
    function registerAssetMaturity(
        address _asset,
        MaturityConfig calldata _config
    ) external onlyRole(LIFECYCLE_ADMIN) {
        if (_config.maturityDate <= block.timestamp) revert InvalidMaturityDate();
        if (_config.redemptionToken == address(0)) revert InvalidRedemptionToken();
        
        AssetLifecycle storage lifecycle = assetLifecycles[_asset];
        lifecycle.status = AssetStatus.ACTIVE;
        lifecycle.issuanceDate = block.timestamp;
        lifecycle.lastActivityDate = block.timestamp;
        lifecycle.maturity = _config;
        
        emit AssetRegistered(_asset, _config.maturityDate);
    }
    
    /**
     * @notice Check if an asset has matured
     * @param _asset Asset address
     * @return Whether asset has matured
     */
    function checkMaturity(address _asset) public view returns (bool) {
        AssetLifecycle storage lifecycle = assetLifecycles[_asset];
        if (lifecycle.status == AssetStatus.ACTIVE && 
            block.timestamp >= lifecycle.maturity.maturityDate) {
            return true;
        }
        return false;
    }
    
    /**
     * @notice Update asset status to matured
     * @param _asset Asset address
     */
    function markAssetMatured(address _asset) external onlyRole(LIFECYCLE_ADMIN) {
        if (!checkMaturity(_asset)) revert AssetNotMatured();
        
        AssetLifecycle storage lifecycle = assetLifecycles[_asset];
        lifecycle.status = AssetStatus.MATURED;
        lifecycle.lastActivityDate = block.timestamp;
        
        emit AssetMatured(_asset, lifecycle.maturity.maturityDate);
    }
    
    /**
     * @notice Calculate redemption amount for a holder
     * @param _asset Asset address
     * @param _holder Holder address
     * @return principal Principal amount
     * @return interest Interest amount
     */
    function calculateRedemptionAmount(
        address _asset,
        address _holder
    ) public view returns (uint256 principal, uint256 interest) {
        AssetLifecycle storage lifecycle = assetLifecycles[_asset];
        
        if (lifecycle.status == AssetStatus.ACTIVE) revert AssetNotMatured();
        if (lifecycle.isRetired) revert AssetAlreadyRetired();
        
        uint256 balance = IERC20(_asset).balanceOf(_holder);
        if (balance == 0) return (0, 0);
        
        uint256 totalSupply = IERC20(_asset).totalSupply();
        if (totalSupply == 0) return (0, 0);
        
        // Calculate principal
        principal = (lifecycle.maturity.faceValue * balance) / totalSupply;
        
        // Calculate interest if applicable
        if (lifecycle.maturity.hasInterest) {
            uint256 daysSinceIssuance = (block.timestamp - lifecycle.issuanceDate) / 1 days;
            interest = (principal * lifecycle.maturity.couponRate * daysSinceIssuance) / 
                      (BASIS_POINTS * DAYS_IN_YEAR);
        }
        
        return (principal, interest);
    }
    
    /**
     * @notice Execute redemption for a holder
     * @param _asset Asset address
     * @param _holder Holder address
     */
    function executeRedemption(
        address _asset,
        address _holder
    ) external onlyRole(REDEMPTION_OPERATOR) nonReentrant whenNotPaused {
        AssetLifecycle storage lifecycle = assetLifecycles[_asset];
        
        // Check if within grace period
        if (lifecycle.status != AssetStatus.MATURED && lifecycle.status != AssetStatus.REDEEMING) {
            revert RedemptionNotAvailable();
        }
        
        if (block.timestamp > lifecycle.maturity.maturityDate + lifecycle.maturity.gracePeriod) {
            revert GracePeriodExpired();
        }
        
        uint256 balance = IERC20(_asset).balanceOf(_holder);
        if (balance == 0) revert InsufficientBalance();
        
        (uint256 principal, uint256 interest) = calculateRedemptionAmount(_asset, _holder);
        uint256 totalAmount = principal + interest;
        
        if (totalAmount == 0) revert RedemptionNotAvailable();
        
        // Update lifecycle
        lifecycle.status = AssetStatus.REDEEMING;
        lifecycle.totalRedeemed += balance;
        lifecycle.totalInterestPaid += interest;
        lifecycle.lastActivityDate = block.timestamp;
        
        // Record redemption
        RedemptionRecord memory record = RedemptionRecord({
            holder: _holder,
            tokenAmount: balance,
            principalPaid: principal,
            interestPaid: interest,
            timestamp: block.timestamp,
            txHash: keccak256(abi.encodePacked(_asset, _holder, block.timestamp))
        });
        
        redemptions[_asset][_holder].push(record);
        totalRedemptions[_asset]++;
        lastRedemption[_asset][_holder] = block.timestamp;
        
        // Burn tokens
        try EnhancedSecurityToken(_asset).burn(balance) {
            // Transfer redemption payment
            IERC20 redemptionToken = IERC20(lifecycle.maturity.redemptionToken);
            redemptionToken.safeTransfer(_holder, totalAmount);
            
            emit RedemptionExecuted(_asset, _holder, principal, interest, totalAmount);
        } catch {
            // Record failed redemption for retry
            failedRedemptions[_asset][_holder] = totalAmount;
            failedRedemptionHolders[_asset].push(_holder);
            
            emit RedemptionFailed(_asset, _holder, totalAmount, "Burn failed");
            revert RedemptionFailed();
        }
    }
    
    /**
     * @notice Retry failed redemptions
     * @param _asset Asset address
     */
    function retryFailedRedemptions(address _asset) 
        external 
        onlyRole(REDEMPTION_OPERATOR) 
        nonReentrant 
    {
        address[] memory holders = failedRedemptionHolders[_asset];
        
        for (uint256 i = 0; i < holders.length; i++) {
            address holder = holders[i];
            uint256 amount = failedRedemptions[_asset][holder];
            
            if (amount > 0) {
                IERC20 redemptionToken = IERC20(assetLifecycles[_asset].maturity.redemptionToken);
                
                try redemptionToken.transfer(holder, amount) {
                    failedRedemptions[_asset][holder] = 0;
                    emit RedemptionRetried(_asset, holder, true);
                } catch {
                    emit RedemptionRetried(_asset, holder, false);
                }
            }
        }
    }
    
    // ============ Transfer Restriction Functions ============
    
    /**
     * @notice Add a transfer restriction to an asset
     * @param _asset Asset address
     * @param _restriction Restriction configuration
     * @return restrictionId Unique restriction identifier
     */
    function addRestriction(
        address _asset,
        TransferRestriction calldata _restriction
    ) external onlyRole(RESTRICTION_MANAGER) returns (uint256) {
        if (_restriction.startDate >= _restriction.endDate) revert InvalidRestriction();
        
        _restrictionIdCounter.increment();
        uint256 restrictionId = _restrictionIdCounter.current();
        
        transferRestrictions[_asset][restrictionId] = _restriction;
        restrictionCount[_asset]++;
        
        AssetLifecycle storage lifecycle = assetLifecycles[_asset];
        lifecycle.hasRestrictions = true;
        
        emit RestrictionAdded(_asset, restrictionId, _restriction.restrictionType);
        
        return restrictionId;
    }
    
    /**
     * @notice Validate a transfer against all restrictions
     * @param _asset Asset address
     * @param _from Source address
     * @param _to Destination address
     * @param _amount Transfer amount
     * @return valid Whether transfer is valid
     * @return reason Rejection reason if invalid
     */
    function validateTransfer(
        address _asset,
        address _from,
        address _to,
        uint256 _amount
    ) external view returns (bool valid, string memory reason) {
        AssetLifecycle storage lifecycle = assetLifecycles[_asset];
        
        // Check if asset is retired
        if (lifecycle.isRetired) {
            return (false, "Asset retired");
        }
        
        // Check if asset has restrictions
        if (!lifecycle.hasRestrictions) {
            return (true, "");
        }
        
        // Check each restriction
        uint256 count = restrictionCount[_asset];
        for (uint256 i = 1; i <= count; i++) {
            TransferRestriction storage restriction = transferRestrictions[_asset][i];
            
            if (!restriction.isActive) continue;
            
            // Check time-based restrictions
            if (block.timestamp < restriction.startDate || 
                block.timestamp > restriction.endDate) {
                continue;
            }
            
            // Check restriction types
            if (restriction.restrictionType == RestrictionType.LOCKUP_PERIOD) {
                if (block.timestamp < restriction.endDate) {
                    return (false, "Lockup period active");
                }
            } else if (restriction.restrictionType == RestrictionType.TRANSFER_WINDOW) {
                uint256 hour = (block.timestamp / 3600) % 24;
                if (hour < restriction.restrictedHours[0] || 
                    hour > restriction.restrictedHours[1]) {
                    return (false, "Outside transfer window");
                }
            } else if (restriction.restrictionType == RestrictionType.HOLDING_PERIOD) {
                // Check how long sender has held tokens
                uint256 holdingTime = block.timestamp - lastRedemption[_asset][_from];
                if (holdingTime < restriction.minHoldingPeriod * 1 days) {
                    return (false, "Holding period not met");
                }
            } else if (restriction.restrictionType == RestrictionType.JURISDICTION_BASED) {
                if (!_checkJurisdiction(_from, _to, restriction)) {
                    return (false, "Jurisdiction not allowed");
                }
            } else if (restriction.restrictionType == RestrictionType.VOLUME_LIMIT) {
                if (_amount > restriction.maxAmount) {
                    return (false, "Volume limit exceeded");
                }
            } else if (restriction.restrictionType == RestrictionType.TIME_OF_DAY) {
                uint256 hour = (block.timestamp / 3600) % 24;
                uint256 dayOfWeek = (block.timestamp / 86400 + 4) % 7; // 0 = Sunday
                
                // Skip weekends
                if (dayOfWeek == 0 || dayOfWeek == 6) {
                    return (false, "Weekend trading not allowed");
                }
                
                // Check trading hours (9am - 5pm)
                if (hour < 9 || hour >= 17) {
                    return (false, "Outside trading hours");
                }
            }
        }
        
        emit TransferValidated(_asset, _from, _to, true);
        return (true, "");
    }
    
    /**
     * @notice Remove a restriction
     * @param _asset Asset address
     * @param _restrictionId Restriction ID
     */
    function removeRestriction(
        address _asset,
        uint256 _restrictionId
    ) external onlyRole(RESTRICTION_MANAGER) {
        TransferRestriction storage restriction = transferRestrictions[_asset][_restrictionId];
        restriction.isActive = false;
        
        emit RestrictionRemoved(_asset, _restrictionId);
        
        // Check if any restrictions remain
        bool hasActive = false;
        uint256 count = restrictionCount[_asset];
        for (uint256 i = 1; i <= count; i++) {
            if (transferRestrictions[_asset][i].isActive) {
                hasActive = true;
                break;
            }
        }
        
        if (!hasActive) {
            assetLifecycles[_asset].hasRestrictions = false;
        }
    }
    
    /**
     * @notice Check jurisdiction compliance
     */
    function _checkJurisdiction(
        address _from,
        address _to,
        TransferRestriction storage _restriction
    ) private view returns (bool) {
        string memory fromJurisdiction = investorJurisdictions[_from];
        string memory toJurisdiction = investorJurisdictions[_to];
        
        // Check if jurisdictions are allowed
        bool fromAllowed = false;
        bool toAllowed = false;
        
        for (uint256 i = 0; i < _restriction.allowedJurisdictions.length; i++) {
            if (keccak256(bytes(fromJurisdiction)) == 
                keccak256(bytes(_restriction.allowedJurisdictions[i]))) {
                fromAllowed = true;
            }
            if (keccak256(bytes(toJurisdiction)) == 
                keccak256(bytes(_restriction.allowedJurisdictions[i]))) {
                toAllowed = true;
            }
        }
        
        return fromAllowed && toAllowed;
    }
    
    // ============ Asset Retirement Functions ============
    
    /**
     * @notice Initiate asset retirement
     * @param _asset Asset address
     * @param _reason Retirement reason
     */
    function initiateRetirement(
        address _asset,
        RetirementReason _reason
    ) external onlyRole(LIFECYCLE_ADMIN) {
        AssetLifecycle storage lifecycle = assetLifecycles[_asset];
        
        if (lifecycle.isRetired) revert AssetAlreadyRetired();
        
        lifecycle.status = AssetStatus.RETIRING;
        lifecycle.lastActivityDate = block.timestamp;
        
        uint256 totalSupply = IERC20(_asset).totalSupply();
        uint256 redeemed = lifecycle.totalRedeemed;
        
        RetirementRecord storage retirement = retirements[_asset];
        retirement.asset = _asset;
        retirement.reason = _reason;
        retirement.timestamp = block.timestamp;
        retirement.totalSupply = totalSupply;
        retirement.redeemedAmount = redeemed;
        retirement.unredeemed = totalSupply - redeemed;
        retirement.isFinalized = false;
        
        emit AssetRetired(_asset, _reason);
    }
    
    /**
     * @notice Finalize asset retirement
     * @param _asset Asset address
     * @param _reportHash IPFS hash of final report
     */
    function finalizeRetirement(
        address _asset,
        bytes32 _reportHash
    ) external onlyRole(LIFECYCLE_ADMIN) {
        RetirementRecord storage retirement = retirements[_asset];
        
        if (retirement.timestamp == 0) revert RetirementNotInitiated();
        if (retirement.isFinalized) revert AssetAlreadyRetired();
        
        retirement.finalReportHash = _reportHash;
        retirement.isFinalized = true;
        
        AssetLifecycle storage lifecycle = assetLifecycles[_asset];
        lifecycle.status = AssetStatus.RETIRED;
        lifecycle.isRetired = true;
        lifecycle.lastActivityDate = block.timestamp;
        
        // Pause the token if possible
        try EnhancedSecurityToken(_asset).pause() {} catch {}
        
        emit AssetFinalized(_asset, _reportHash);
    }
    
    /**
     * @notice Get retirement status
     * @param _asset Asset address
     * @return Retirement record
     */
    function getRetirementStatus(address _asset) 
        external 
        view 
        returns (RetirementRecord memory) 
    {
        return retirements[_asset];
    }
    
    // ============ Jurisdiction Management ============
    
    /**
     * @notice Approve a jurisdiction
     * @param _jurisdiction Jurisdiction code
     */
    function approveJurisdiction(string calldata _jurisdiction) 
        external 
        onlyRole(COMPLIANCE_OFFICER) 
    {
        approvedJurisdictions[_jurisdiction] = true;
        emit JurisdictionApproved(_jurisdiction);
    }
    
    /**
     * @notice Revoke a jurisdiction
     * @param _jurisdiction Jurisdiction code
     */
    function revokeJurisdiction(string calldata _jurisdiction) 
        external 
        onlyRole(COMPLIANCE_OFFICER) 
    {
        approvedJurisdictions[_jurisdiction] = false;
        emit JurisdictionRevoked(_jurisdiction);
    }
    
    /**
     * @notice Set investor jurisdiction
     * @param _investor Investor address
     * @param _jurisdiction Jurisdiction code
     */
    function setInvestorJurisdiction(
        address _investor,
        string calldata _jurisdiction
    ) external onlyRole(COMPLIANCE_OFFICER) {
        investorJurisdictions[_investor] = _jurisdiction;
        emit InvestorJurisdictionSet(_investor, _jurisdiction);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get asset lifecycle information
     * @param _asset Asset address
     * @return Asset lifecycle data
     */
    function getAssetLifecycle(address _asset) 
        external 
        view 
        returns (AssetLifecycle memory) 
    {
        return assetLifecycles[_asset];
    }
    
    /**
     * @notice Get redemption history for a holder
     * @param _asset Asset address
     * @param _holder Holder address
     * @return Redemption records
     */
    function getRedemptionHistory(
        address _asset,
        address _holder
    ) external view returns (RedemptionRecord[] memory) {
        return redemptions[_asset][_holder];
    }
    
    /**
     * @notice Check if transfer is allowed
     * @param _asset Asset address
     * @param _from Source address
     * @param _to Destination address
     * @param _amount Transfer amount
     * @return Whether transfer is allowed
     */
    function canTransfer(
        address _asset,
        address _from,
        address _to,
        uint256 _amount
    ) external view returns (bool) {
        (bool valid, ) = this.validateTransfer(_asset, _from, _to, _amount);
        return valid;
    }
    
    /**
     * @notice Get days until maturity
     * @param _asset Asset address
     * @return Days remaining
     */
    function getDaysToMaturity(address _asset) external view returns (uint256) {
        AssetLifecycle storage lifecycle = assetLifecycles[_asset];
        
        if (block.timestamp >= lifecycle.maturity.maturityDate) {
            return 0;
        }
        
        return (lifecycle.maturity.maturityDate - block.timestamp) / 1 days;
    }
    
    /**
     * @notice Check if in grace period
     * @param _asset Asset address
     * @return Whether in grace period
     */
    function isInGracePeriod(address _asset) external view returns (bool) {
        AssetLifecycle storage lifecycle = assetLifecycles[_asset];
        
        if (lifecycle.status != AssetStatus.MATURED) {
            return false;
        }
        
        uint256 gracePeriodEnd = lifecycle.maturity.maturityDate + lifecycle.maturity.gracePeriod;
        return block.timestamp <= gracePeriodEnd;
    }
    
    /**
     * @notice Get total unredeemed amount
     * @param _asset Asset address
     * @return Unredeemed token amount
     */
    function getUnredeemedAmount(address _asset) external view returns (uint256) {
        uint256 totalSupply = IERC20(_asset).totalSupply();
        uint256 redeemed = assetLifecycles[_asset].totalRedeemed;
        
        if (totalSupply > redeemed) {
            return totalSupply - redeemed;
        }
        
        return 0;
    }
    
    // ============ Configuration Functions ============
    
    /**
     * @notice Set default grace period
     * @param _days Grace period in days
     */
    function setDefaultGracePeriod(uint256 _days) 
        external 
        onlyRole(LIFECYCLE_ADMIN) 
    {
        defaultGracePeriod = _days * 1 days;
    }
    
    /**
     * @notice Update compliance module
     * @param _complianceModule New compliance module address
     */
    function setComplianceModule(address _complianceModule) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        complianceModule = _complianceModule;
    }
    
    // ============ Emergency Functions ============
    
    /**
     * @notice Pause all operations
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @notice Resume all operations
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @notice Emergency redemption override
     * @param _asset Asset address
     * @param _holder Holder address
     * @param _amount Redemption amount
     */
    function emergencyRedemption(
        address _asset,
        address _holder,
        uint256 _amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        AssetLifecycle storage lifecycle = assetLifecycles[_asset];
        IERC20 redemptionToken = IERC20(lifecycle.maturity.redemptionToken);
        
        redemptionToken.safeTransfer(_holder, _amount);
        
        emit RedemptionExecuted(_asset, _holder, _amount, 0, _amount);
    }
}
