// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./PrimeBrokerage.sol";

/**
 * @title CrossMargining
 * @dev Advanced cross-margining system for institutional prime brokerage
 * Implements portfolio-level margin calculation with position netting
 * Addresses WEF report's emphasis on capital efficiency for institutions
 */
contract CrossMargining is Ownable, Pausable {
    using Math for uint256;

    // Portfolio margin calculation methods
    enum MarginMethod {
        STANDARD,           // Traditional margin calculation
        PORTFOLIO,          // Portfolio-based margin with netting
        RISK_BASED,         // Risk-based margin calculation
        SPAN               // Standard Portfolio Analysis of Risk
    }

    // Asset correlation levels for portfolio margin
    enum CorrelationLevel {
        NONE,              // No correlation (100% margin)
        LOW,               // Low correlation (80% margin)
        MEDIUM,            // Medium correlation (60% margin
        HIGH,              // High correlation (40% margin)
        PERFECT            // Perfect correlation (20% margin)
    }

    // Portfolio margin account structure
    struct PortfolioMarginAccount {
        address institution;
        MarginMethod marginMethod;
        uint256 portfolioValue;
        uint256 netLiquidationValue;
        uint256 maintenanceMargin;
        uint256 initialMargin;
        uint256 excessLiquidity;
        uint256 buyingPower;
        mapping(address => AssetPosition) positions;
        mapping(address => mapping(address => CorrelationLevel)) assetCorrelations;
        bool isActive;
        uint256 lastCalculation;
    }

    // Individual asset position within portfolio
    struct AssetPosition {
        address asset;
        int256 quantity;           // Positive for long, negative for short
        uint256 marketValue;       // Current market value
        uint256 unrealizedPnL;     // Unrealized profit/loss
        uint256 marginRequirement; // Individual margin requirement
        uint256 riskContribution;  // Contribution to portfolio risk
        uint256 lastUpdated;
    }

    // Risk scenario for stress testing
    struct RiskScenario {
        string scenarioName;
        mapping(address => int256) priceShocks; // Asset -> price shock percentage
        uint256 portfolioImpact;
        bool isActive;
    }

    // Margin calculation result
    struct MarginCalculationResult {
        uint256 grossMargin;           // Sum of individual margins
        uint256 netMargin;             // Portfolio margin after netting
        uint256 diversificationBenefit; // Margin reduction from diversification
        uint256 concentrationPenalty;   // Additional margin for concentration
        uint256 finalMargin;           // Final margin requirement
        uint256 calculationTimestamp;
    }

    // State variables
    mapping(address => PortfolioMarginAccount) public portfolioAccounts;
    mapping(string => RiskScenario) public riskScenarios;
    mapping(address => uint256) public assetVolatilities;
    mapping(address => mapping(address => uint256)) public correlationMatrix;
    
    PrimeBrokerage public primeBrokerageContract;
    address[] public registeredInstitutions;
    
    // Configuration parameters
    uint256 public constant MAX_CONCENTRATION_THRESHOLD = 2500; // 25% max concentration
    uint256 public constant DIVERSIFICATION_BENEFIT_CAP = 5000; // 50% max benefit
    uint256 public constant VOLATILITY_LOOKBACK_PERIOD = 30 days;
    uint256 public constant CORRELATION_DECAY_FACTOR = 9500; // 95% daily decay
    
    // Risk parameters
    uint256 public baseMarginRate = 1000;        // 10% base margin
    uint256 public volatilityMultiplier = 200;   // 2x volatility multiplier
    uint256 public liquidityAdjustment = 150;    // 1.5x for illiquid assets
    uint256 public stressTestMultiplier = 300;   // 3x for stress scenarios

    // Events
    event PortfolioMarginAccountCreated(
        address indexed institution,
        MarginMethod marginMethod
    );
    
    event MarginCalculated(
        address indexed institution,
        uint256 grossMargin,
        uint256 netMargin,
        uint256 diversificationBenefit
    );
    
    event PositionUpdated(
        address indexed institution,
        address indexed asset,
        int256 newQuantity,
        uint256 marginImpact
    );
    
    event RiskScenarioExecuted(
        address indexed institution,
        string scenarioName,
        uint256 portfolioImpact
    );
    
    event CorrelationUpdated(
        address indexed asset1,
        address indexed asset2,
        uint256 correlation
    );
    
    event MarginCall(
        address indexed institution,
        uint256 requiredMargin,
        uint256 availableMargin,
        uint256 shortfall
    );

    // Modifiers
    modifier onlyRegisteredInstitution() {
        require(portfolioAccounts[msg.sender].isActive, "Institution not registered");
        _;
    }

    modifier validInstitution(address institution) {
        require(portfolioAccounts[institution].isActive, "Institution not found");
        _;
    }

    constructor(address _primeBrokerageContract) {
        require(_primeBrokerageContract != address(0), "Invalid prime brokerage contract");
        primeBrokerageContract = PrimeBrokerage(_primeBrokerageContract);
    }

    /**
     * @dev Create portfolio margin account for institution
     */
    function createPortfolioMarginAccount(
        address _institution,
        MarginMethod _marginMethod
    ) external onlyOwner {
        require(_institution != address(0), "Invalid institution address");
        require(!portfolioAccounts[_institution].isActive, "Account already exists");

        PortfolioMarginAccount storage account = portfolioAccounts[_institution];
        account.institution = _institution;
        account.marginMethod = _marginMethod;
        account.isActive = true;
        account.lastCalculation = block.timestamp;

        registeredInstitutions.push(_institution);

        emit PortfolioMarginAccountCreated(_institution, _marginMethod);
    }

    /**
     * @dev Update position in portfolio margin account
     */
    function updatePosition(
        address _institution,
        address _asset,
        int256 _quantity,
        uint256 _marketValue
    ) external validInstitution(_institution) {
        PortfolioMarginAccount storage account = portfolioAccounts[_institution];
        
        // Update position
        account.positions[_asset] = AssetPosition({
            asset: _asset,
            quantity: _quantity,
            marketValue: _marketValue,
            unrealizedPnL: _calculateUnrealizedPnL(_institution, _asset, _quantity, _marketValue),
            marginRequirement: _calculateIndividualMargin(_asset, _quantity, _marketValue),
            riskContribution: _calculateRiskContribution(_institution, _asset, _quantity),
            lastUpdated: block.timestamp
        });

        // Recalculate portfolio margin
        MarginCalculationResult memory result = _calculatePortfolioMargin(_institution);
        account.maintenanceMargin = result.finalMargin;
        account.lastCalculation = block.timestamp;

        emit PositionUpdated(_institution, _asset, _quantity, result.finalMargin);
    }

    /**
     * @dev Calculate portfolio margin for institution
     */
    function calculatePortfolioMargin(address _institution) external view returns (MarginCalculationResult memory) {
        return _calculatePortfolioMargin(_institution);
    }

    /**
     * @dev Execute stress test scenario
     */
    function executeStressTest(
        address _institution,
        string memory _scenarioName
    ) external validInstitution(_institution) returns (uint256) {
        RiskScenario storage scenario = riskScenarios[_scenarioName];
        require(scenario.isActive, "Scenario not active");

        uint256 portfolioImpact = _calculateStressTestImpact(_institution, _scenarioName);
        scenario.portfolioImpact = portfolioImpact;

        emit RiskScenarioExecuted(_institution, _scenarioName, portfolioImpact);
        return portfolioImpact;
    }

    /**
     * @dev Update asset correlation matrix
     */
    function updateCorrelation(
        address _asset1,
        address _asset2,
        uint256 _correlation
    ) external onlyOwner {
        require(_correlation <= 10000, "Correlation cannot exceed 100%");
        
        correlationMatrix[_asset1][_asset2] = _correlation;
        correlationMatrix[_asset2][_asset1] = _correlation; // Symmetric matrix

        emit CorrelationUpdated(_asset1, _asset2, _correlation);
    }

    /**
     * @dev Update asset volatility
     */
    function updateAssetVolatility(address _asset, uint256 _volatility) external onlyOwner {
        require(_volatility > 0, "Volatility must be positive");
        assetVolatilities[_asset] = _volatility;
    }

    /**
     * @dev Create risk scenario for stress testing
     */
    function createRiskScenario(
        string memory _scenarioName,
        address[] memory _assets,
        int256[] memory _priceShocks
    ) external onlyOwner {
        require(_assets.length == _priceShocks.length, "Arrays length mismatch");
        
        RiskScenario storage scenario = riskScenarios[_scenarioName];
        scenario.scenarioName = _scenarioName;
        scenario.isActive = true;
        
        for (uint256 i = 0; i < _assets.length; i++) {
            scenario.priceShocks[_assets[i]] = _priceShocks[i];
        }
    }

    /**
     * @dev Check margin requirements and trigger margin call if necessary
     */
    function checkMarginRequirements(address _institution) external returns (bool) {
        PortfolioMarginAccount storage account = portfolioAccounts[_institution];
        require(account.isActive, "Institution not found");

        // Recalculate current margin requirements
        MarginCalculationResult memory result = _calculatePortfolioMargin(_institution);
        account.maintenanceMargin = result.finalMargin;

        // Get available margin from prime brokerage
        uint256 availableMargin = _getAvailableMargin(_institution);

        if (availableMargin < result.finalMargin) {
            uint256 shortfall = result.finalMargin - availableMargin;
            emit MarginCall(_institution, result.finalMargin, availableMargin, shortfall);
            return false;
        }

        return true;
    }

    /**
     * @dev Get portfolio summary for institution
     */
    function getPortfolioSummary(address _institution) external view returns (
        uint256 portfolioValue,
        uint256 netLiquidationValue,
        uint256 maintenanceMargin,
        uint256 excessLiquidity,
        uint256 buyingPower
    ) {
        PortfolioMarginAccount storage account = portfolioAccounts[_institution];
        return (
            account.portfolioValue,
            account.netLiquidationValue,
            account.maintenanceMargin,
            account.excessLiquidity,
            account.buyingPower
        );
    }

    /**
     * @dev Get position details for specific asset
     */
    function getPositionDetails(address _institution, address _asset) external view returns (AssetPosition memory) {
        return portfolioAccounts[_institution].positions[_asset];
    }

    // Internal calculation functions

    /**
     * @dev Calculate portfolio margin using selected method
     */
    function _calculatePortfolioMargin(address _institution) internal view returns (MarginCalculationResult memory) {
        PortfolioMarginAccount storage account = portfolioAccounts[_institution];
        
        if (account.marginMethod == MarginMethod.PORTFOLIO) {
            return _calculatePortfolioBasedMargin(_institution);
        } else if (account.marginMethod == MarginMethod.RISK_BASED) {
            return _calculateRiskBasedMargin(_institution);
        } else if (account.marginMethod == MarginMethod.SPAN) {
            return _calculateSPANMargin(_institution);
        } else {
            return _calculateStandardMargin(_institution);
        }
    }

    /**
     * @dev Calculate portfolio-based margin with netting benefits
     */
    function _calculatePortfolioBasedMargin(address _institution) internal view returns (MarginCalculationResult memory) {
        // This is a simplified implementation
        // In practice, this would involve complex portfolio risk calculations
        
        uint256 grossMargin = 0;
        uint256 portfolioRisk = 0;
        
        // Calculate gross margin (sum of individual margins)
        // In a real implementation, we would iterate through all positions
        grossMargin = 1000000; // Placeholder
        
        // Calculate portfolio risk considering correlations
        portfolioRisk = _calculatePortfolioRisk(_institution);
        
        // Apply diversification benefit
        uint256 diversificationBenefit = (grossMargin * portfolioRisk) / 10000;
        diversificationBenefit = Math.min(diversificationBenefit, (grossMargin * DIVERSIFICATION_BENEFIT_CAP) / 10000);
        
        // Calculate concentration penalty
        uint256 concentrationPenalty = _calculateConcentrationPenalty(_institution);
        
        uint256 netMargin = grossMargin - diversificationBenefit + concentrationPenalty;
        
        return MarginCalculationResult({
            grossMargin: grossMargin,
            netMargin: netMargin,
            diversificationBenefit: diversificationBenefit,
            concentrationPenalty: concentrationPenalty,
            finalMargin: netMargin,
            calculationTimestamp: block.timestamp
        });
    }

    /**
     * @dev Calculate risk-based margin using volatility and correlations
     */
    function _calculateRiskBasedMargin(address _institution) internal view returns (MarginCalculationResult memory) {
        // Simplified risk-based calculation
        uint256 portfolioValue = _getPortfolioValue(_institution);
        uint256 portfolioVolatility = _calculatePortfolioVolatility(_institution);
        
        uint256 riskBasedMargin = (portfolioValue * portfolioVolatility * volatilityMultiplier) / 1000000;
        
        return MarginCalculationResult({
            grossMargin: riskBasedMargin,
            netMargin: riskBasedMargin,
            diversificationBenefit: 0,
            concentrationPenalty: 0,
            finalMargin: riskBasedMargin,
            calculationTimestamp: block.timestamp
        });
    }

    /**
     * @dev Calculate SPAN (Standard Portfolio Analysis of Risk) margin
     */
    function _calculateSPANMargin(address _institution) internal view returns (MarginCalculationResult memory) {
        // Simplified SPAN calculation
        // In practice, this would involve complex scenario-based calculations
        
        uint256 spanMargin = _calculateWorstCaseScenario(_institution);
        
        return MarginCalculationResult({
            grossMargin: spanMargin,
            netMargin: spanMargin,
            diversificationBenefit: 0,
            concentrationPenalty: 0,
            finalMargin: spanMargin,
            calculationTimestamp: block.timestamp
        });
    }

    /**
     * @dev Calculate standard margin (sum of individual margins)
     */
    function _calculateStandardMargin(address _institution) internal view returns (MarginCalculationResult memory) {
        uint256 totalMargin = 0;
        
        // In practice, iterate through all positions and sum individual margins
        totalMargin = 800000; // Placeholder
        
        return MarginCalculationResult({
            grossMargin: totalMargin,
            netMargin: totalMargin,
            diversificationBenefit: 0,
            concentrationPenalty: 0,
            finalMargin: totalMargin,
            calculationTimestamp: block.timestamp
        });
    }

    /**
     * @dev Calculate individual margin requirement for asset position
     */
    function _calculateIndividualMargin(
        address _asset,
        int256 _quantity,
        uint256 _marketValue
    ) internal view returns (uint256) {
        uint256 volatility = assetVolatilities[_asset];
        if (volatility == 0) volatility = 2000; // Default 20% volatility
        
        uint256 baseMargin = (_marketValue * baseMarginRate) / 10000;
        uint256 volatilityAdjustment = (_marketValue * volatility * volatilityMultiplier) / 1000000;
        
        return baseMargin + volatilityAdjustment;
    }

    /**
     * @dev Calculate unrealized P&L for position
     */
    function _calculateUnrealizedPnL(
        address _institution,
        address _asset,
        int256 _quantity,
        uint256 _marketValue
    ) internal view returns (uint256) {
        // Simplified calculation - in practice would use entry price vs current price
        return 0; // Placeholder
    }

    /**
     * @dev Calculate risk contribution of asset to portfolio
     */
    function _calculateRiskContribution(
        address _institution,
        address _asset,
        int256 _quantity
    ) internal view returns (uint256) {
        // Simplified calculation - in practice would use marginal VaR
        return 0; // Placeholder
    }

    /**
     * @dev Calculate portfolio risk considering correlations
     */
    function _calculatePortfolioRisk(address _institution) internal view returns (uint256) {
        // Simplified portfolio risk calculation
        // In practice, this would use variance-covariance matrix
        return 3000; // 30% portfolio risk
    }

    /**
     * @dev Calculate concentration penalty for over-concentrated positions
     */
    function _calculateConcentrationPenalty(address _institution) internal view returns (uint256) {
        // Check for concentration in any single asset
        // Apply penalty if concentration exceeds threshold
        return 0; // Placeholder
    }

    /**
     * @dev Calculate portfolio volatility
     */
    function _calculatePortfolioVolatility(address _institution) internal view returns (uint256) {
        // Simplified portfolio volatility calculation
        return 1500; // 15% portfolio volatility
    }

    /**
     * @dev Calculate worst-case scenario for SPAN margin
     */
    function _calculateWorstCaseScenario(address _institution) internal view returns (uint256) {
        // Run through predefined scenarios and find worst case
        return 1200000; // Placeholder
    }

    /**
     * @dev Calculate stress test impact on portfolio
     */
    function _calculateStressTestImpact(
        address _institution,
        string memory _scenarioName
    ) internal view returns (uint256) {
        // Apply price shocks from scenario to portfolio positions
        return 500000; // Placeholder impact
    }

    /**
     * @dev Get portfolio value for institution
     */
    function _getPortfolioValue(address _institution) internal view returns (uint256) {
        // Sum market values of all positions
        return 5000000; // Placeholder
    }

    /**
     * @dev Get available margin from prime brokerage contract
     */
    function _getAvailableMargin(address _institution) internal view returns (uint256) {
        // Query prime brokerage contract for available margin
        return 2000000; // Placeholder
    }

    /**
     * @dev Update margin method for institution
     */
    function updateMarginMethod(
        address _institution,
        MarginMethod _newMethod
    ) external onlyOwner validInstitution(_institution) {
        portfolioAccounts[_institution].marginMethod = _newMethod;
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