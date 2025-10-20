// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title TreasuryAssetTemplate
 * @author Quantera Team
 * @notice Template for tokenizing treasury securities (T-Bills, T-Notes, T-Bonds)
 * @dev Institutional-grade treasury token with automated interest distribution
 */
contract TreasuryAssetTemplate is 
    Initializable,
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    ERC20PausableUpgradeable,
    AccessControlUpgradeable 
{
    // ============ Roles ============
    bytes32 public constant TREASURY_ADMIN_ROLE = keccak256("TREASURY_ADMIN");
    bytes32 public constant INTEREST_DISTRIBUTOR_ROLE = keccak256("INTEREST_DISTRIBUTOR");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE");

    // ============ Enums ============
    enum SecurityType {
        TBill,      // Treasury Bill (< 1 year)
        TNote,      // Treasury Note (2-10 years)
        TBond,      // Treasury Bond (20-30 years)
        TIPS,       // Treasury Inflation-Protected Securities
        FRN         // Floating Rate Notes
    }

    enum InterestType {
        Zero,       // Zero coupon (T-Bills)
        Fixed,      // Fixed rate coupon
        Floating,   // Floating rate
        Inflation   // Inflation-adjusted
    }

    // ============ Structs ============
    
    struct TreasuryDetails {
        SecurityType securityType;
        InterestType interestType;
        string cusip;              // CUSIP identifier
        uint256 faceValue;         // Par value
        uint256 issueDate;         // Issue timestamp
        uint256 maturityDate;      // Maturity timestamp
        uint256 couponRate;        // Annual rate in basis points
        uint256 couponFrequency;   // Payments per year (0, 2, or 4)
        uint256 auctionPrice;      // Price at auction (basis points of par)
        bool isCallable;           // Whether bond can be called early
        uint256 callDate;          // Earliest call date
        uint256 callPrice;         // Call price in basis points
    }

    struct InterestPayment {
        uint256 paymentDate;
        uint256 recordDate;        // Date for determining eligible holders
        uint256 exDividendDate;    // Last day to buy and receive payment
        uint256 paymentAmount;     // Total payment amount
        uint256 perTokenAmount;    // Payment per token
        bool isPaid;
        uint256 totalClaimed;
    }

    struct InvestorInfo {
        bool isQualified;          // Qualified institutional buyer
        bool isAccredited;         // Accredited investor
        bool kycCompleted;
        uint256 totalInvested;
        uint256 totalInterestClaimed;
        mapping(uint256 => bool) claimedPayments; // Payment ID => claimed
        uint256 lockupEndDate;
        string taxId;              // Encrypted tax ID for 1099 reporting
    }

    // ============ State Variables ============
    TreasuryDetails public treasury;
    
    mapping(uint256 => InterestPayment) public interestPayments;
    mapping(address => InvestorInfo) public investors;
    mapping(address => mapping(uint256 => uint256)) public balanceAtRecord;
    
    uint256 public nextPaymentId;
    uint256 public totalInterestPaid;
    uint256 public currentYield;       // Current yield in basis points
    uint256 public yieldToMaturity;    // YTM in basis points
    
    address public complianceModule;
    address public paymentToken;       // USDC/USDT for interest payments
    address public custodian;          // Institutional custodian
    
    uint256 public minimumInvestment;
    uint256 public maximumSupply;
    
    bool public interestAutoCompound;
    bool public transferRestricted;
    
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant DAYS_IN_YEAR = 365;
    uint256 public constant PRECISION = 1e18;
    
    // ============ Events ============
    event TreasuryTokenized(
        SecurityType indexed securityType,
        string cusip,
        uint256 faceValue,
        uint256 maturityDate
    );
    event InterestScheduled(
        uint256 indexed paymentId,
        uint256 paymentDate,
        uint256 amount
    );
    event InterestPaid(
        uint256 indexed paymentId,
        uint256 totalAmount,
        uint256 perTokenAmount
    );
    event InterestClaimed(
        address indexed investor,
        uint256 indexed paymentId,
        uint256 amount
    );
    event InvestorQualified(address indexed investor, bool isQualified);
    event YieldUpdated(uint256 currentYield, uint256 yieldToMaturity);
    event MaturityReached(uint256 maturityDate, uint256 redemptionValue);
    event TreasuryRedeemed(address indexed investor, uint256 amount);
    
    // ============ Custom Errors ============
    error NotQualifiedInvestor();
    error BelowMinimumInvestment();
    error TransferRestricted();
    error MaturityNotReached();
    error PaymentAlreadyClaimed();
    error InvalidSecurityType();
    error InvalidPaymentSchedule();
    error PaymentNotDue();
    error InsufficientPaymentFunds();
    error ExceedsMaxSupply();
    
    // ============ Initializer ============
    
    function initialize(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply,
        uint8 _decimals,
        address _complianceModule
    ) public initializer {
        __ERC20_init(_name, _symbol);
        __ERC20Burnable_init();
        __ERC20Pausable_init();
        __AccessControl_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TREASURY_ADMIN_ROLE, msg.sender);
        _grantRole(INTEREST_DISTRIBUTOR_ROLE, msg.sender);
        
        complianceModule = _complianceModule;
        minimumInvestment = 10000 * (10 ** _decimals); // $10,000 minimum
        maximumSupply = _totalSupply;
        transferRestricted = true;
        
        // Mint initial supply
        _mint(msg.sender, _totalSupply);
    }
    
    // ============ Treasury Setup ============
    
    /**
     * @notice Configure treasury security details
     * @param _type Security type
     * @param _cusip CUSIP identifier
     * @param _faceValue Face/par value
     * @param _maturityDate Maturity timestamp
     * @param _couponRate Annual coupon rate in basis points
     * @param _couponFrequency Payments per year
     */
    function setupTreasury(
        SecurityType _type,
        string calldata _cusip,
        uint256 _faceValue,
        uint256 _maturityDate,
        uint256 _couponRate,
        uint256 _couponFrequency
    ) external onlyRole(TREASURY_ADMIN_ROLE) {
        if (_maturityDate <= block.timestamp) revert InvalidSecurityType();
        if (_type == SecurityType.TBill && _couponFrequency != 0) revert InvalidSecurityType();
        if (_type != SecurityType.TBill && _couponFrequency == 0) revert InvalidSecurityType();
        
        treasury.securityType = _type;
        treasury.cusip = _cusip;
        treasury.faceValue = _faceValue;
        treasury.issueDate = block.timestamp;
        treasury.maturityDate = _maturityDate;
        treasury.couponRate = _couponRate;
        treasury.couponFrequency = _couponFrequency;
        
        // Set interest type based on security type
        if (_type == SecurityType.TBill) {
            treasury.interestType = InterestType.Zero;
        } else if (_type == SecurityType.TIPS) {
            treasury.interestType = InterestType.Inflation;
        } else if (_type == SecurityType.FRN) {
            treasury.interestType = InterestType.Floating;
        } else {
            treasury.interestType = InterestType.Fixed;
        }
        
        // Calculate initial yields
        _calculateYields();
        
        // Schedule interest payments if applicable
        if (_couponFrequency > 0) {
            _scheduleInterestPayments();
        }
        
        emit TreasuryTokenized(_type, _cusip, _faceValue, _maturityDate);
    }
    
    /**
     * @notice Set auction results
     * @param _auctionPrice Price at auction in basis points of par
     */
    function setAuctionResults(uint256 _auctionPrice) 
        external 
        onlyRole(TREASURY_ADMIN_ROLE) 
    {
        treasury.auctionPrice = _auctionPrice;
        _calculateYields();
    }
    
    // ============ Interest Management ============
    
    /**
     * @notice Schedule all interest payments
     */
    function _scheduleInterestPayments() private {
        if (treasury.couponFrequency == 0) return;
        
        uint256 timeToMaturity = treasury.maturityDate - treasury.issueDate;
        uint256 paymentInterval = DAYS_IN_YEAR * 1 days / treasury.couponFrequency;
        uint256 numberOfPayments = timeToMaturity / paymentInterval;
        
        uint256 paymentDate = treasury.issueDate + paymentInterval;
        uint256 couponAmount = (treasury.faceValue * treasury.couponRate) / 
                               (BASIS_POINTS * treasury.couponFrequency);
        
        for (uint256 i = 0; i < numberOfPayments; i++) {
            InterestPayment storage payment = interestPayments[i];
            payment.paymentDate = paymentDate;
            payment.recordDate = paymentDate - 5 days; // T-5 record date
            payment.exDividendDate = paymentDate - 1 days; // T-1 ex-dividend
            payment.paymentAmount = couponAmount;
            payment.perTokenAmount = couponAmount * PRECISION / totalSupply();
            
            emit InterestScheduled(i, paymentDate, couponAmount);
            
            paymentDate += paymentInterval;
        }
        
        nextPaymentId = numberOfPayments;
    }
    
    /**
     * @notice Execute interest payment
     * @param _paymentId Payment ID to execute
     */
    function executeInterestPayment(uint256 _paymentId) 
        external 
        onlyRole(INTEREST_DISTRIBUTOR_ROLE) 
        whenNotPaused 
    {
        InterestPayment storage payment = interestPayments[_paymentId];
        
        if (payment.isPaid) revert PaymentAlreadyClaimed();
        if (block.timestamp < payment.paymentDate) revert PaymentNotDue();
        
        // Take snapshot of balances at record date
        // In production, this would use a more efficient snapshot mechanism
        
        payment.isPaid = true;
        totalInterestPaid += payment.paymentAmount;
        
        emit InterestPaid(_paymentId, payment.paymentAmount, payment.perTokenAmount);
    }
    
    /**
     * @notice Claim interest payment
     * @param _paymentId Payment ID to claim
     */
    function claimInterest(uint256 _paymentId) 
        external 
        whenNotPaused 
    {
        InterestPayment storage payment = interestPayments[_paymentId];
        InvestorInfo storage investor = investors[msg.sender];
        
        if (!payment.isPaid) revert PaymentNotDue();
        if (investor.claimedPayments[_paymentId]) revert PaymentAlreadyClaimed();
        
        // Calculate claimable amount based on balance at record date
        uint256 balanceAtRecordDate = balanceAtRecord[msg.sender][_paymentId];
        if (balanceAtRecordDate == 0) {
            balanceAtRecordDate = balanceOf(msg.sender); // Fallback to current
        }
        
        uint256 claimAmount = (balanceAtRecordDate * payment.perTokenAmount) / PRECISION;
        
        investor.claimedPayments[_paymentId] = true;
        investor.totalInterestClaimed += claimAmount;
        payment.totalClaimed += claimAmount;
        
        // Transfer payment token to investor
        // In production, would transfer actual USDC/USDT
        
        emit InterestClaimed(msg.sender, _paymentId, claimAmount);
    }
    
    // ============ Maturity & Redemption ============
    
    /**
     * @notice Check if security has matured
     */
    function checkMaturity() external view returns (bool) {
        return block.timestamp >= treasury.maturityDate;
    }
    
    /**
     * @notice Redeem at maturity
     */
    function redeemAtMaturity() external whenNotPaused {
        if (block.timestamp < treasury.maturityDate) revert MaturityNotReached();
        
        uint256 balance = balanceOf(msg.sender);
        if (balance == 0) return;
        
        // Calculate redemption value
        uint256 redemptionValue = (balance * treasury.faceValue) / totalSupply();
        
        // Burn the tokens
        _burn(msg.sender, balance);
        
        // Transfer redemption amount
        // In production, would transfer actual funds
        
        emit TreasuryRedeemed(msg.sender, redemptionValue);
    }
    
    // ============ Investor Management ============
    
    /**
     * @notice Qualify an investor
     * @param _investor Investor address
     * @param _isQualified Is qualified institutional buyer
     * @param _isAccredited Is accredited investor
     */
    function qualifyInvestor(
        address _investor,
        bool _isQualified,
        bool _isAccredited
    ) external onlyRole(COMPLIANCE_ROLE) {
        InvestorInfo storage investor = investors[_investor];
        investor.isQualified = _isQualified;
        investor.isAccredited = _isAccredited;
        investor.kycCompleted = true;
        
        emit InvestorQualified(_investor, _isQualified);
    }
    
    /**
     * @notice Set investor tax ID (encrypted)
     * @param _investor Investor address
     * @param _taxId Encrypted tax ID
     */
    function setInvestorTaxId(address _investor, string calldata _taxId) 
        external 
        onlyRole(COMPLIANCE_ROLE) 
    {
        investors[_investor].taxId = _taxId;
    }
    
    // ============ Yield Calculations ============
    
    /**
     * @notice Calculate current yield and YTM
     */
    function _calculateYields() private {
        if (treasury.securityType == SecurityType.TBill) {
            // T-Bill yield calculation (discount yield)
            uint256 discount = BASIS_POINTS - treasury.auctionPrice;
            uint256 daysToMaturity = (treasury.maturityDate - block.timestamp) / 1 days;
            currentYield = (discount * DAYS_IN_YEAR * BASIS_POINTS) / 
                          (treasury.auctionPrice * daysToMaturity);
        } else {
            // Coupon bond yield calculation
            currentYield = (treasury.couponRate * BASIS_POINTS) / treasury.auctionPrice;
            
            // Simplified YTM calculation
            uint256 yearsToMaturity = (treasury.maturityDate - block.timestamp) / 
                                     (DAYS_IN_YEAR * 1 days);
            if (yearsToMaturity > 0) {
                uint256 priceAppreciation = (BASIS_POINTS - treasury.auctionPrice) / 
                                          yearsToMaturity;
                yieldToMaturity = currentYield + priceAppreciation;
            }
        }
        
        emit YieldUpdated(currentYield, yieldToMaturity);
    }
    
    /**
     * @notice Get accrued interest since last payment
     * @return Accrued interest amount
     */
    function getAccruedInterest() external view returns (uint256) {
        if (treasury.couponFrequency == 0) return 0;
        
        uint256 daysSinceLastPayment = (block.timestamp - treasury.issueDate) % 
                                       (DAYS_IN_YEAR * 1 days / treasury.couponFrequency);
        uint256 dailyInterest = (treasury.faceValue * treasury.couponRate) / 
                               (BASIS_POINTS * DAYS_IN_YEAR);
        
        return dailyInterest * daysSinceLastPayment / 1 days;
    }
    
    // ============ Transfer Controls ============
    
    /**
     * @notice Override transfer to enforce compliance
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20Upgradeable, ERC20PausableUpgradeable) {
        super._beforeTokenTransfer(from, to, amount);
        
        if (from != address(0) && to != address(0)) { // Not mint or burn
            if (transferRestricted) {
                InvestorInfo storage fromInvestor = investors[from];
                InvestorInfo storage toInvestor = investors[to];
                
                // Check qualifications
                if (!toInvestor.isQualified && !toInvestor.isAccredited) {
                    revert NotQualifiedInvestor();
                }
                
                // Check KYC
                if (!toInvestor.kycCompleted) {
                    revert NotQualifiedInvestor();
                }
                
                // Check minimum investment
                if (toInvestor.totalInvested == 0 && amount < minimumInvestment) {
                    revert BelowMinimumInvestment();
                }
                
                // Update records
                fromInvestor.totalInvested -= amount;
                toInvestor.totalInvested += amount;
            }
        }
        
        // Check max supply
        if (to != address(0) && totalSupply() + amount > maximumSupply) {
            revert ExceedsMaxSupply();
        }
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get time to maturity in days
     * @return Days until maturity
     */
    function getDaysToMaturity() external view returns (uint256) {
        if (block.timestamp >= treasury.maturityDate) return 0;
        return (treasury.maturityDate - block.timestamp) / 1 days;
    }
    
    /**
     * @notice Get next payment date
     * @return Next payment timestamp
     */
    function getNextPaymentDate() external view returns (uint256) {
        for (uint256 i = 0; i < nextPaymentId; i++) {
            if (!interestPayments[i].isPaid) {
                return interestPayments[i].paymentDate;
            }
        }
        return 0;
    }
    
    /**
     * @notice Check if investor can transfer
     * @param _investor Investor address
     * @return Can transfer
     */
    function canTransfer(address _investor) external view returns (bool) {
        InvestorInfo storage investor = investors[_investor];
        return investor.kycCompleted && 
               (investor.isQualified || investor.isAccredited) &&
               block.timestamp >= investor.lockupEndDate;
    }
    
    /**
     * @notice Get total return for holding period
     * @param _holdingPeriod Days held
     * @return Total return in basis points
     */
    function calculateTotalReturn(uint256 _holdingPeriod) 
        external 
        view 
        returns (uint256) 
    {
        uint256 interestReturn = (treasury.couponRate * _holdingPeriod) / DAYS_IN_YEAR;
        uint256 priceReturn = 0;
        
        if (treasury.auctionPrice < BASIS_POINTS) {
            priceReturn = ((BASIS_POINTS - treasury.auctionPrice) * _holdingPeriod) /
                         ((treasury.maturityDate - treasury.issueDate) / 1 days);
        }
        
        return interestReturn + priceReturn;
    }
    
    // ============ Configuration ============
    
    /**
     * @notice Set payment token address
     * @param _token Payment token address
     */
    function setPaymentToken(address _token) 
        external 
        onlyRole(TREASURY_ADMIN_ROLE) 
    {
        paymentToken = _token;
    }
    
    /**
     * @notice Set custodian address
     * @param _custodian Custodian address
     */
    function setCustodian(address _custodian) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        custodian = _custodian;
    }
    
    /**
     * @notice Enable auto-compounding
     * @param _enabled Enable auto-compound
     */
    function setAutoCompound(bool _enabled) 
        external 
        onlyRole(TREASURY_ADMIN_ROLE) 
    {
        interestAutoCompound = _enabled;
    }
    
    /**
     * @notice Set maturity date (for extendable securities)
     * @param _maturityDate New maturity date
     */
    function setMaturityDate(uint256 _maturityDate) 
        external 
        onlyRole(TREASURY_ADMIN_ROLE) 
    {
        if (_maturityDate <= block.timestamp) revert InvalidSecurityType();
        treasury.maturityDate = _maturityDate;
        
        // Recalculate yields
        _calculateYields();
        
        // Reschedule payments if needed
        if (treasury.couponFrequency > 0) {
            _scheduleInterestPayments();
        }
        
        emit MaturityReached(_maturityDate, treasury.faceValue);
    }
    
    // ============ Emergency Functions ============
    
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
