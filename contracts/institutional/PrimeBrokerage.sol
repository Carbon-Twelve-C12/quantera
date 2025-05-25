// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title PrimeBrokerage
 * @dev Institutional-grade prime brokerage services for sophisticated investors
 * Addresses WEF report's emphasis on institutional infrastructure needs
 * Implements cross-margining, multi-custodial support, and advanced risk management
 */
contract PrimeBrokerage is Ownable, Pausable, ReentrancyGuard {
    using Math for uint256;

    // Account types for different institutional arrangements
    enum AccountType {
        INDIVIDUAL,         // Individual institutional account
        OMNIBUS,           // Omnibus account for multiple clients
        SEGREGATED,        // Segregated client accounts
        PRIME_SERVICES     // Full prime services account
    }

    // Credit facility types
    enum CreditType {
        SECURITIES_LENDING,
        REPO_FINANCING,
        MARGIN_LENDING,
        BRIDGE_FINANCING,
        WORKING_CAPITAL
    }

    // Risk levels for different positions
    enum RiskLevel {
        LOW,      // 0-25% risk
        MEDIUM,   // 26-50% risk
        HIGH,     // 51-75% risk
        CRITICAL  // 76-100% risk
    }

    // Prime brokerage account structure
    struct PrimeAccount {
        address institution;
        string institutionName;
        AccountType accountType;
        uint256 creditLimit;
        uint256 currentExposure;
        uint256 availableCredit;
        uint256 maintenanceMarginRatio;  // In basis points (e.g., 1250 = 12.5%)
        uint256 initialMarginRatio;      // In basis points (e.g., 1500 = 15%)
        mapping(address => uint256) collateralBalances;
        mapping(address => int256) positions;  // Positive for long, negative for short
        mapping(CreditType => uint256) creditFacilities;
        bool isActive;
        uint256 createdAt;
        uint256 lastActivity;
        string jurisdiction;
        address[] authorizedTraders;
        uint256 riskScore;
    }

    // Cross-margin position tracking
    struct CrossMarginPosition {
        address asset;
        int256 position;           // Position size (positive = long, negative = short)
        uint256 entryPrice;        // Average entry price
        uint256 currentPrice;      // Current market price
        uint256 unrealizedPnL;     // Unrealized profit/loss
        uint256 requiredMargin;    // Required margin for position
        uint256 timestamp;
        RiskLevel riskLevel;
    }

    // Credit facility structure
    struct CreditFacility {
        CreditType facilityType;
        uint256 limit;
        uint256 utilized;
        uint256 interestRate;      // Annual rate in basis points
        uint256 maturityDate;
        bool isActive;
        string terms;
    }

    // Risk metrics for portfolio assessment
    struct RiskMetrics {
        uint256 portfolioValue;
        uint256 totalExposure;
        uint256 leverageRatio;
        uint256 concentrationRisk;
        uint256 liquidityRisk;
        uint256 marketRisk;
        uint256 creditRisk;
        uint256 overallRiskScore;
        uint256 lastCalculated;
    }

    // State variables
    mapping(address => PrimeAccount) public primeAccounts;
    mapping(address => CrossMarginPosition[]) public positions;
    mapping(address => mapping(CreditType => CreditFacility)) public creditFacilities;
    mapping(address => RiskMetrics) public riskMetrics;
    mapping(address => bool) public authorizedRiskManagers;
    mapping(address => uint256) public assetPrices;
    
    address[] public registeredInstitutions;
    uint256 public totalAssetsUnderManagement;
    uint256 public totalCreditExtended;
    
    // Configuration parameters
    uint256 public constant DEFAULT_MAINTENANCE_MARGIN = 1250; // 12.5%
    uint256 public constant DEFAULT_INITIAL_MARGIN = 1500;     // 15%
    uint256 public constant MAX_LEVERAGE_RATIO = 1000;         // 10:1 leverage
    uint256 public constant RISK_CALCULATION_INTERVAL = 1 hours;
    uint256 public constant MARGIN_CALL_THRESHOLD = 1100;     // 11% margin call threshold
    
    // Fee structure
    uint256 public primeBrokerageFeeRate = 50;  // 0.5% annual fee
    uint256 public marginLendingRate = 300;     // 3% annual rate
    uint256 public securitiesLendingRate = 100; // 1% annual rate
    address public feeCollector;
    uint256 public totalFeesCollected;

    // Events
    event PrimeAccountCreated(
        address indexed institution,
        AccountType accountType,
        uint256 creditLimit
    );
    
    event PositionOpened(
        address indexed institution,
        address indexed asset,
        int256 position,
        uint256 entryPrice
    );
    
    event PositionClosed(
        address indexed institution,
        address indexed asset,
        int256 position,
        uint256 exitPrice,
        int256 realizedPnL
    );
    
    event MarginCall(
        address indexed institution,
        uint256 requiredMargin,
        uint256 availableMargin,
        uint256 shortfall
    );
    
    event CreditFacilityUtilized(
        address indexed institution,
        CreditType facilityType,
        uint256 amount
    );
    
    event RiskMetricsUpdated(
        address indexed institution,
        uint256 overallRiskScore,
        uint256 leverageRatio
    );
    
    event CollateralDeposited(
        address indexed institution,
        address indexed asset,
        uint256 amount
    );
    
    event CollateralWithdrawn(
        address indexed institution,
        address indexed asset,
        uint256 amount
    );

    // Modifiers
    modifier onlyInstitution() {
        require(primeAccounts[msg.sender].isActive, "Not an active prime account");
        _;
    }

    modifier onlyAuthorizedTrader(address institution) {
        require(_isAuthorizedTrader(institution, msg.sender), "Not authorized trader");
        _;
    }

    modifier onlyRiskManager() {
        require(authorizedRiskManagers[msg.sender], "Not authorized risk manager");
        _;
    }

    modifier validInstitution(address institution) {
        require(primeAccounts[institution].isActive, "Institution not found");
        _;
    }

    constructor(address _feeCollector) {
        require(_feeCollector != address(0), "Invalid fee collector");
        feeCollector = _feeCollector;
    }

    /**
     * @dev Create a new prime brokerage account
     */
    function createPrimeAccount(
        address _institution,
        string memory _institutionName,
        AccountType _accountType,
        uint256 _creditLimit,
        string memory _jurisdiction,
        address[] memory _authorizedTraders
    ) external onlyOwner {
        require(_institution != address(0), "Invalid institution address");
        require(bytes(_institutionName).length > 0, "Institution name required");
        require(!primeAccounts[_institution].isActive, "Institution already registered");
        require(_authorizedTraders.length > 0, "At least one authorized trader required");

        PrimeAccount storage account = primeAccounts[_institution];
        account.institution = _institution;
        account.institutionName = _institutionName;
        account.accountType = _accountType;
        account.creditLimit = _creditLimit;
        account.availableCredit = _creditLimit;
        account.maintenanceMarginRatio = DEFAULT_MAINTENANCE_MARGIN;
        account.initialMarginRatio = DEFAULT_INITIAL_MARGIN;
        account.isActive = true;
        account.createdAt = block.timestamp;
        account.lastActivity = block.timestamp;
        account.jurisdiction = _jurisdiction;
        account.authorizedTraders = _authorizedTraders;
        account.riskScore = 50; // Default medium risk

        registeredInstitutions.push(_institution);

        emit PrimeAccountCreated(_institution, _accountType, _creditLimit);
    }

    /**
     * @dev Deposit collateral into prime account
     */
    function depositCollateral(
        address _asset,
        uint256 _amount
    ) external onlyInstitution nonReentrant {
        require(_amount > 0, "Amount must be greater than zero");

        // Transfer collateral to contract
        IERC20(_asset).transferFrom(msg.sender, address(this), _amount);

        // Update collateral balance
        primeAccounts[msg.sender].collateralBalances[_asset] += _amount;
        primeAccounts[msg.sender].lastActivity = block.timestamp;

        // Update available credit based on collateral value
        _updateAvailableCredit(msg.sender);

        emit CollateralDeposited(msg.sender, _asset, _amount);
    }

    /**
     * @dev Withdraw collateral from prime account
     */
    function withdrawCollateral(
        address _asset,
        uint256 _amount
    ) external onlyInstitution nonReentrant {
        require(_amount > 0, "Amount must be greater than zero");
        require(primeAccounts[msg.sender].collateralBalances[_asset] >= _amount, "Insufficient collateral");

        // Check if withdrawal would violate margin requirements
        require(_canWithdrawCollateral(msg.sender, _asset, _amount), "Withdrawal would violate margin requirements");

        // Update collateral balance
        primeAccounts[msg.sender].collateralBalances[_asset] -= _amount;
        primeAccounts[msg.sender].lastActivity = block.timestamp;

        // Transfer collateral back to institution
        IERC20(_asset).transfer(msg.sender, _amount);

        // Update available credit
        _updateAvailableCredit(msg.sender);

        emit CollateralWithdrawn(msg.sender, _asset, _amount);
    }

    /**
     * @dev Open a new position (long or short)
     */
    function openPosition(
        address _institution,
        address _asset,
        int256 _position,
        uint256 _entryPrice
    ) external onlyAuthorizedTrader(_institution) validInstitution(_institution) {
        require(_position != 0, "Position cannot be zero");
        require(_entryPrice > 0, "Entry price must be positive");

        // Calculate required margin for position
        uint256 positionValue = uint256(_position > 0 ? _position : -_position) * _entryPrice / 1e18;
        uint256 requiredMargin = (positionValue * primeAccounts[_institution].initialMarginRatio) / 10000;

        // Check if institution has sufficient margin
        require(_hasAvailableMargin(_institution, requiredMargin), "Insufficient margin for position");

        // Create new position
        CrossMarginPosition memory newPosition = CrossMarginPosition({
            asset: _asset,
            position: _position,
            entryPrice: _entryPrice,
            currentPrice: _entryPrice,
            unrealizedPnL: 0,
            requiredMargin: requiredMargin,
            timestamp: block.timestamp,
            riskLevel: _calculatePositionRisk(positionValue, _institution)
        });

        positions[_institution].push(newPosition);

        // Update account exposure
        primeAccounts[_institution].currentExposure += positionValue;
        primeAccounts[_institution].lastActivity = block.timestamp;

        // Update risk metrics
        _updateRiskMetrics(_institution);

        emit PositionOpened(_institution, _asset, _position, _entryPrice);
    }

    /**
     * @dev Close an existing position
     */
    function closePosition(
        address _institution,
        uint256 _positionIndex,
        uint256 _exitPrice
    ) external onlyAuthorizedTrader(_institution) validInstitution(_institution) {
        require(_positionIndex < positions[_institution].length, "Invalid position index");
        require(_exitPrice > 0, "Exit price must be positive");

        CrossMarginPosition storage position = positions[_institution][_positionIndex];
        
        // Calculate realized P&L
        int256 realizedPnL = _calculateRealizedPnL(position, _exitPrice);

        // Update account exposure
        uint256 positionValue = uint256(position.position > 0 ? position.position : -position.position) * position.entryPrice / 1e18;
        primeAccounts[_institution].currentExposure -= positionValue;

        // Remove position from array (swap with last element and pop)
        positions[_institution][_positionIndex] = positions[_institution][positions[_institution].length - 1];
        positions[_institution].pop();

        primeAccounts[_institution].lastActivity = block.timestamp;

        // Update risk metrics
        _updateRiskMetrics(_institution);

        emit PositionClosed(_institution, position.asset, position.position, _exitPrice, realizedPnL);
    }

    /**
     * @dev Utilize credit facility
     */
    function utilizeCreditFacility(
        CreditType _facilityType,
        uint256 _amount
    ) external onlyInstitution {
        CreditFacility storage facility = creditFacilities[msg.sender][_facilityType];
        require(facility.isActive, "Credit facility not active");
        require(facility.utilized + _amount <= facility.limit, "Exceeds credit limit");

        facility.utilized += _amount;
        totalCreditExtended += _amount;
        primeAccounts[msg.sender].lastActivity = block.timestamp;

        emit CreditFacilityUtilized(msg.sender, _facilityType, _amount);
    }

    /**
     * @dev Calculate total portfolio value for institution
     */
    function calculatePortfolioValue(address _institution) external view returns (uint256) {
        uint256 totalValue = 0;

        // Add collateral values
        // Note: In a real implementation, this would iterate through known assets
        // For now, we'll use a simplified approach

        // Add unrealized P&L from positions
        CrossMarginPosition[] memory institutionPositions = positions[_institution];
        for (uint256 i = 0; i < institutionPositions.length; i++) {
            totalValue += institutionPositions[i].unrealizedPnL;
        }

        return totalValue;
    }

    /**
     * @dev Check margin requirements and trigger margin call if necessary
     */
    function checkMarginRequirements(address _institution) external onlyRiskManager returns (bool) {
        uint256 totalExposure = _calculateTotalExposure(_institution);
        uint256 availableMargin = _calculateAvailableMargin(_institution);
        uint256 requiredMargin = (totalExposure * primeAccounts[_institution].maintenanceMarginRatio) / 10000;

        if (availableMargin < requiredMargin) {
            uint256 shortfall = requiredMargin - availableMargin;
            emit MarginCall(_institution, requiredMargin, availableMargin, shortfall);
            return false;
        }

        return true;
    }

    /**
     * @dev Update risk metrics for institution
     */
    function updateRiskMetrics(address _institution) external onlyRiskManager {
        _updateRiskMetrics(_institution);
    }

    /**
     * @dev Set up credit facility for institution
     */
    function setupCreditFacility(
        address _institution,
        CreditType _facilityType,
        uint256 _limit,
        uint256 _interestRate,
        uint256 _maturityDate,
        string memory _terms
    ) external onlyOwner validInstitution(_institution) {
        creditFacilities[_institution][_facilityType] = CreditFacility({
            facilityType: _facilityType,
            limit: _limit,
            utilized: 0,
            interestRate: _interestRate,
            maturityDate: _maturityDate,
            isActive: true,
            terms: _terms
        });
    }

    /**
     * @dev Get institution's positions
     */
    function getInstitutionPositions(address _institution) external view returns (CrossMarginPosition[] memory) {
        return positions[_institution];
    }

    /**
     * @dev Get institution's risk metrics
     */
    function getInstitutionRiskMetrics(address _institution) external view returns (RiskMetrics memory) {
        return riskMetrics[_institution];
    }

    /**
     * @dev Get collateral balance for specific asset
     */
    function getCollateralBalance(address _institution, address _asset) external view returns (uint256) {
        return primeAccounts[_institution].collateralBalances[_asset];
    }

    // Internal helper functions

    /**
     * @dev Check if address is authorized trader for institution
     */
    function _isAuthorizedTrader(address _institution, address _trader) internal view returns (bool) {
        address[] memory traders = primeAccounts[_institution].authorizedTraders;
        for (uint256 i = 0; i < traders.length; i++) {
            if (traders[i] == _trader) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Update available credit based on collateral
     */
    function _updateAvailableCredit(address _institution) internal {
        // Simplified calculation - in reality would use proper collateral valuation
        uint256 totalCollateralValue = _calculateTotalCollateralValue(_institution);
        uint256 usedCredit = primeAccounts[_institution].creditLimit - primeAccounts[_institution].availableCredit;
        
        // Available credit = (collateral value * haircut) - used credit
        uint256 availableFromCollateral = (totalCollateralValue * 8000) / 10000; // 80% haircut
        primeAccounts[_institution].availableCredit = availableFromCollateral > usedCredit ? 
            availableFromCollateral - usedCredit : 0;
    }

    /**
     * @dev Calculate total collateral value for institution
     */
    function _calculateTotalCollateralValue(address _institution) internal view returns (uint256) {
        // Simplified - in reality would iterate through all collateral assets
        return 1000000 * 1e18; // Placeholder
    }

    /**
     * @dev Check if institution can withdraw collateral without violating margin
     */
    function _canWithdrawCollateral(address _institution, address _asset, uint256 _amount) internal view returns (bool) {
        // Simplified check - in reality would calculate impact on margin requirements
        uint256 currentBalance = primeAccounts[_institution].collateralBalances[_asset];
        return currentBalance >= _amount;
    }

    /**
     * @dev Check if institution has available margin for new position
     */
    function _hasAvailableMargin(address _institution, uint256 _requiredMargin) internal view returns (bool) {
        uint256 availableMargin = _calculateAvailableMargin(_institution);
        return availableMargin >= _requiredMargin;
    }

    /**
     * @dev Calculate available margin for institution
     */
    function _calculateAvailableMargin(address _institution) internal view returns (uint256) {
        uint256 totalCollateralValue = _calculateTotalCollateralValue(_institution);
        uint256 currentExposure = primeAccounts[_institution].currentExposure;
        uint256 requiredMargin = (currentExposure * primeAccounts[_institution].maintenanceMarginRatio) / 10000;
        
        return totalCollateralValue > requiredMargin ? totalCollateralValue - requiredMargin : 0;
    }

    /**
     * @dev Calculate total exposure for institution
     */
    function _calculateTotalExposure(address _institution) internal view returns (uint256) {
        return primeAccounts[_institution].currentExposure;
    }

    /**
     * @dev Calculate position risk level
     */
    function _calculatePositionRisk(uint256 _positionValue, address _institution) internal view returns (RiskLevel) {
        uint256 portfolioValue = _calculateTotalCollateralValue(_institution);
        if (portfolioValue == 0) return RiskLevel.CRITICAL;
        
        uint256 riskPercentage = (_positionValue * 100) / portfolioValue;
        
        if (riskPercentage <= 25) return RiskLevel.LOW;
        if (riskPercentage <= 50) return RiskLevel.MEDIUM;
        if (riskPercentage <= 75) return RiskLevel.HIGH;
        return RiskLevel.CRITICAL;
    }

    /**
     * @dev Calculate realized P&L for position
     */
    function _calculateRealizedPnL(CrossMarginPosition memory _position, uint256 _exitPrice) internal pure returns (int256) {
        if (_position.position > 0) {
            // Long position
            return int256((_exitPrice - _position.entryPrice) * uint256(_position.position) / 1e18);
        } else {
            // Short position
            return int256((_position.entryPrice - _exitPrice) * uint256(-_position.position) / 1e18);
        }
    }

    /**
     * @dev Update risk metrics for institution
     */
    function _updateRiskMetrics(address _institution) internal {
        uint256 portfolioValue = _calculateTotalCollateralValue(_institution);
        uint256 totalExposure = _calculateTotalExposure(_institution);
        uint256 leverageRatio = portfolioValue > 0 ? (totalExposure * 100) / portfolioValue : 0;
        
        // Simplified risk calculation
        uint256 overallRiskScore = leverageRatio > 500 ? 80 : (leverageRatio / 10) + 20;
        
        riskMetrics[_institution] = RiskMetrics({
            portfolioValue: portfolioValue,
            totalExposure: totalExposure,
            leverageRatio: leverageRatio,
            concentrationRisk: 30, // Placeholder
            liquidityRisk: 25,     // Placeholder
            marketRisk: 40,        // Placeholder
            creditRisk: 20,        // Placeholder
            overallRiskScore: overallRiskScore,
            lastCalculated: block.timestamp
        });

        emit RiskMetricsUpdated(_institution, overallRiskScore, leverageRatio);
    }

    /**
     * @dev Add authorized risk manager
     */
    function addRiskManager(address _riskManager) external onlyOwner {
        authorizedRiskManagers[_riskManager] = true;
    }

    /**
     * @dev Remove authorized risk manager
     */
    function removeRiskManager(address _riskManager) external onlyOwner {
        authorizedRiskManagers[_riskManager] = false;
    }

    /**
     * @dev Update asset price (would be called by oracle in production)
     */
    function updateAssetPrice(address _asset, uint256 _price) external onlyRiskManager {
        assetPrices[_asset] = _price;
    }

    /**
     * @dev Emergency pause function
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause function
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Get all registered institutions
     */
    function getRegisteredInstitutions() external view returns (address[] memory) {
        return registeredInstitutions;
    }
} 