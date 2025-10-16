// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title RiskEngine
 * @dev Institutional-grade risk management system for portfolio assessment
 * Implements VaR calculations, risk limits, and emergency controls
 * Part of Quantera v2.0.0-alpha upgrade
 */
contract RiskEngine is AccessControl, Pausable, ReentrancyGuard {
    using Math for uint256;

    // Risk calculation precision (basis points)
    uint256 public constant PRECISION = 10000;
    uint256 public constant CONFIDENCE_95 = 9500; // 95% confidence level
    uint256 public constant CONFIDENCE_99 = 9900; // 99% confidence level
    
    // Roles
    bytes32 public constant RISK_MANAGER_ROLE = keccak256("RISK_MANAGER_ROLE");
    bytes32 public constant PORTFOLIO_MANAGER_ROLE = keccak256("PORTFOLIO_MANAGER_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    
    // Risk metrics structure
    struct RiskMetrics {
        uint256 valueAtRisk95;      // VaR at 95% confidence
        uint256 valueAtRisk99;      // VaR at 99% confidence
        uint256 sharpeRatio;        // Risk-adjusted returns (x100 for precision)
        uint256 maxDrawdown;        // Maximum portfolio drawdown
        uint256 beta;               // Portfolio beta vs benchmark (x100)
        uint256 volatility;         // Historical volatility (annualized, basis points)
        uint256 liquidityScore;     // Liquidity risk metric (0-100)
        uint256 concentrationRisk;  // Asset concentration (basis points)
        uint256 timestamp;
    }
    
    // Portfolio risk limits
    struct RiskLimits {
        uint256 maxPositionSize;     // Max % per asset (basis points)
        uint256 maxLeverage;         // Maximum leverage allowed (x100)
        uint256 maxDrawdownLimit;    // Stop-loss threshold (basis points)
        uint256 minLiquidityScore;   // Minimum liquidity requirement
        uint256 maxVaR95;           // Maximum VaR allowed at 95%
        bool emergencyShutdown;      // Emergency stop flag
    }
    
    // Historical data for VaR calculation
    struct HistoricalData {
        uint256[] returns;          // Historical returns array
        uint256 dataPoints;         // Number of data points
        uint256 lastUpdate;         // Last update timestamp
    }
    
    // State variables
    mapping(address => RiskMetrics) public portfolioRiskMetrics;
    mapping(address => RiskLimits) public portfolioRiskLimits;
    mapping(address => HistoricalData) private historicalData;
    mapping(address => mapping(address => uint256)) public assetPrices; // portfolio => asset => price
    
    // Chainlink price feeds
    mapping(address => AggregatorV3Interface) public priceFeeds;
    address[] public supportedAssets;
    
    // Risk calculation parameters
    uint256 public constant LOOKBACK_PERIOD = 30 days;
    uint256 public constant MIN_DATA_POINTS = 30;
    uint256 public stalePriceThreshold = 3600; // 1 hour
    
    // Events
    event RiskMetricsCalculated(
        address indexed portfolio,
        uint256 var95,
        uint256 var99,
        uint256 sharpeRatio,
        uint256 timestamp
    );
    
    event RiskLimitBreached(
        address indexed portfolio,
        string metricType,
        uint256 value,
        uint256 limit
    );
    
    event EmergencyShutdownTriggered(
        address indexed portfolio,
        string reason,
        uint256 timestamp
    );
    
    event RiskLimitsUpdated(
        address indexed portfolio,
        uint256 maxVaR,
        uint256 maxDrawdown,
        uint256 maxLeverage
    );
    
    event PriceFeedUpdated(
        address indexed asset,
        address indexed priceFeed
    );
    
    // Custom errors for gas efficiency
    error InsufficientDataPoints();
    error StalePrice(address asset);
    error RiskLimitExceeded(string metric);
    error InvalidConfidenceLevel();
    error PortfolioShutdown();
    error InvalidPriceFeed();
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RISK_MANAGER_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
    }
    
    /**
     * @dev Calculate Value at Risk using historical simulation
     * @param portfolio Address of the portfolio
     * @param confidenceLevel Confidence level (9500 for 95%, 9900 for 99%)
     * @param timeHorizon Time horizon in days
     * @return valueAtRisk The calculated VaR
     */
    function calculateVaR(
        address portfolio,
        uint256 confidenceLevel,
        uint256 timeHorizon
    ) external view returns (uint256 valueAtRisk) {
        if (confidenceLevel != CONFIDENCE_95 && confidenceLevel != CONFIDENCE_99) {
            revert InvalidConfidenceLevel();
        }
        
        HistoricalData storage data = historicalData[portfolio];
        if (data.dataPoints < MIN_DATA_POINTS) {
            revert InsufficientDataPoints();
        }
        
        // Sort returns for percentile calculation
        uint256[] memory sortedReturns = _quickSort(data.returns);
        
        // Calculate percentile index
        uint256 percentileIndex = ((10000 - confidenceLevel) * data.dataPoints) / 10000;
        if (percentileIndex == 0) percentileIndex = 1;
        
        // Get VaR at the specified confidence level
        valueAtRisk = sortedReturns[percentileIndex - 1];
        
        // Adjust for time horizon (square root of time scaling)
        if (timeHorizon > 1) {
            valueAtRisk = (valueAtRisk * _sqrt(timeHorizon * 100)) / 10;
        }
        
        return valueAtRisk;
    }
    
    /**
     * @dev Validate transaction against risk limits
     * @param portfolio Portfolio address
     * @param asset Asset address
     * @param amount Transaction amount
     * @param isBuy Whether this is a buy transaction
     * @return isValid Whether transaction is valid
     * @return reason Reason if invalid
     */
    function validateTransaction(
        address portfolio,
        address asset,
        uint256 amount,
        bool isBuy
    ) external view returns (bool isValid, string memory reason) {
        RiskLimits storage limits = portfolioRiskLimits[portfolio];
        
        // Check emergency shutdown
        if (limits.emergencyShutdown) {
            return (false, "Portfolio under emergency shutdown");
        }
        
        // Check position size limit
        uint256 currentPosition = assetPrices[portfolio][asset];
        uint256 newPosition = isBuy ? 
            currentPosition + amount : 
            currentPosition > amount ? currentPosition - amount : 0;
            
        uint256 portfolioValue = _getPortfolioValue(portfolio);
        if (portfolioValue > 0) {
            uint256 positionPercent = (newPosition * PRECISION) / portfolioValue;
            if (positionPercent > limits.maxPositionSize) {
                return (false, "Position size exceeds limit");
            }
        }
        
        // Check VaR limits
        RiskMetrics memory metrics = portfolioRiskMetrics[portfolio];
        if (metrics.valueAtRisk95 > limits.maxVaR95) {
            return (false, "VaR exceeds limit");
        }
        
        // Check liquidity score
        if (metrics.liquidityScore < limits.minLiquidityScore) {
            return (false, "Insufficient liquidity");
        }
        
        return (true, "");
    }
    
    /**
     * @dev Update risk metrics for a portfolio
     * @param portfolio Portfolio address
     */
    function updateRiskMetrics(address portfolio) 
        external 
        onlyRole(RISK_MANAGER_ROLE) 
        nonReentrant 
    {
        RiskMetrics storage metrics = portfolioRiskMetrics[portfolio];
        
        // Calculate VaR at both confidence levels
        metrics.valueAtRisk95 = this.calculateVaR(portfolio, CONFIDENCE_95, 1);
        metrics.valueAtRisk99 = this.calculateVaR(portfolio, CONFIDENCE_99, 1);
        
        // Calculate other risk metrics
        metrics.sharpeRatio = _calculateSharpeRatio(portfolio);
        metrics.maxDrawdown = _calculateMaxDrawdown(portfolio);
        metrics.volatility = _calculateVolatility(portfolio);
        metrics.liquidityScore = _assessLiquidity(portfolio);
        metrics.concentrationRisk = _calculateConcentration(portfolio);
        metrics.beta = _calculateBeta(portfolio);
        metrics.timestamp = block.timestamp;
        
        emit RiskMetricsCalculated(
            portfolio,
            metrics.valueAtRisk95,
            metrics.valueAtRisk99,
            metrics.sharpeRatio,
            block.timestamp
        );
        
        // Check for limit breaches
        _checkRiskLimits(portfolio, metrics);
    }
    
    /**
     * @dev Set risk limits for a portfolio
     * @param portfolio Portfolio address
     * @param limits New risk limits
     */
    function setRiskLimits(
        address portfolio,
        RiskLimits memory limits
    ) external onlyRole(RISK_MANAGER_ROLE) {
        portfolioRiskLimits[portfolio] = limits;
        
        emit RiskLimitsUpdated(
            portfolio,
            limits.maxVaR95,
            limits.maxDrawdownLimit,
            limits.maxLeverage
        );
    }
    
    /**
     * @dev Add historical return data for VaR calculation
     * @param portfolio Portfolio address
     * @param returnValue Return value to add
     */
    function addHistoricalReturn(
        address portfolio,
        uint256 returnValue
    ) external onlyRole(PORTFOLIO_MANAGER_ROLE) {
        HistoricalData storage data = historicalData[portfolio];
        
        // Maintain rolling window of data points
        if (data.returns.length >= 365) {
            // Remove oldest data point
            for (uint i = 0; i < data.returns.length - 1; i++) {
                data.returns[i] = data.returns[i + 1];
            }
            data.returns[data.returns.length - 1] = returnValue;
        } else {
            data.returns.push(returnValue);
            data.dataPoints++;
        }
        
        data.lastUpdate = block.timestamp;
    }
    
    /**
     * @dev Update price feed for an asset
     * @param asset Asset address
     * @param priceFeed Chainlink price feed address
     */
    function updatePriceFeed(
        address asset,
        address priceFeed
    ) external onlyRole(RISK_MANAGER_ROLE) {
        if (priceFeed == address(0)) revert InvalidPriceFeed();
        
        priceFeeds[asset] = AggregatorV3Interface(priceFeed);
        
        // Add to supported assets if new
        bool exists = false;
        for (uint i = 0; i < supportedAssets.length; i++) {
            if (supportedAssets[i] == asset) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            supportedAssets.push(asset);
        }
        
        emit PriceFeedUpdated(asset, priceFeed);
    }
    
    /**
     * @dev Emergency shutdown for a portfolio
     * @param portfolio Portfolio address
     * @param reason Shutdown reason
     */
    function emergencyShutdown(
        address portfolio,
        string memory reason
    ) external onlyRole(EMERGENCY_ROLE) {
        portfolioRiskLimits[portfolio].emergencyShutdown = true;
        
        emit EmergencyShutdownTriggered(
            portfolio,
            reason,
            block.timestamp
        );
    }
    
    /**
     * @dev Resume portfolio after emergency
     * @param portfolio Portfolio address
     */
    function resumePortfolio(
        address portfolio
    ) external onlyRole(EMERGENCY_ROLE) {
        portfolioRiskLimits[portfolio].emergencyShutdown = false;
    }
    
    // Internal helper functions
    
    function _calculateSharpeRatio(address portfolio) private view returns (uint256) {
        HistoricalData storage data = historicalData[portfolio];
        if (data.dataPoints == 0) return 0;
        
        // Calculate average return
        uint256 avgReturn = 0;
        for (uint i = 0; i < data.returns.length; i++) {
            avgReturn += data.returns[i];
        }
        avgReturn = avgReturn / data.returns.length;
        
        // Calculate standard deviation
        uint256 variance = 0;
        for (uint i = 0; i < data.returns.length; i++) {
            uint256 diff = data.returns[i] > avgReturn ? 
                data.returns[i] - avgReturn : 
                avgReturn - data.returns[i];
            variance += (diff * diff);
        }
        
        uint256 stdDev = _sqrt(variance / data.returns.length);
        if (stdDev == 0) return 0;
        
        // Sharpe ratio = (return - risk free rate) / std dev
        // Assuming risk-free rate of 2% annually (200 basis points)
        uint256 riskFreeRate = 200;
        uint256 excessReturn = avgReturn > riskFreeRate ? avgReturn - riskFreeRate : 0;
        
        return (excessReturn * 100) / stdDev; // Multiplied by 100 for precision
    }
    
    function _calculateMaxDrawdown(address portfolio) private view returns (uint256) {
        HistoricalData storage data = historicalData[portfolio];
        if (data.dataPoints == 0) return 0;
        
        uint256 maxValue = 0;
        uint256 maxDrawdown = 0;
        
        for (uint i = 0; i < data.returns.length; i++) {
            if (data.returns[i] > maxValue) {
                maxValue = data.returns[i];
            }
            
            if (maxValue > data.returns[i]) {
                uint256 drawdown = ((maxValue - data.returns[i]) * PRECISION) / maxValue;
                if (drawdown > maxDrawdown) {
                    maxDrawdown = drawdown;
                }
            }
        }
        
        return maxDrawdown;
    }
    
    function _calculateVolatility(address portfolio) private view returns (uint256) {
        HistoricalData storage data = historicalData[portfolio];
        if (data.dataPoints < 2) return 0;
        
        // Calculate returns variance
        uint256 sumSquaredReturns = 0;
        uint256 sumReturns = 0;
        
        for (uint i = 1; i < data.returns.length; i++) {
            uint256 returnVal = data.returns[i] > data.returns[i-1] ?
                ((data.returns[i] - data.returns[i-1]) * PRECISION) / data.returns[i-1] :
                ((data.returns[i-1] - data.returns[i]) * PRECISION) / data.returns[i-1];
                
            sumReturns += returnVal;
            sumSquaredReturns += (returnVal * returnVal) / PRECISION;
        }
        
        uint256 n = data.returns.length - 1;
        uint256 avgReturn = sumReturns / n;
        uint256 variance = (sumSquaredReturns / n) - ((avgReturn * avgReturn) / PRECISION);
        
        // Annualize volatility (assuming daily returns)
        return _sqrt(variance * 252); // 252 trading days
    }
    
    function _assessLiquidity(address portfolio) private view returns (uint256) {
        // Simplified liquidity score based on asset composition
        // In production, this would integrate with liquidity pool data
        uint256 score = 75; // Base score
        
        // Adjust based on portfolio composition
        uint256 assetCount = 0;
        for (uint i = 0; i < supportedAssets.length; i++) {
            if (assetPrices[portfolio][supportedAssets[i]] > 0) {
                assetCount++;
            }
        }
        
        // More assets = better liquidity diversification
        if (assetCount > 10) score += 15;
        else if (assetCount > 5) score += 10;
        else if (assetCount > 2) score += 5;
        
        return score > 100 ? 100 : score;
    }
    
    function _calculateConcentration(address portfolio) private view returns (uint256) {
        uint256 totalValue = _getPortfolioValue(portfolio);
        if (totalValue == 0) return 0;
        
        uint256 maxPosition = 0;
        for (uint i = 0; i < supportedAssets.length; i++) {
            uint256 position = assetPrices[portfolio][supportedAssets[i]];
            if (position > maxPosition) {
                maxPosition = position;
            }
        }
        
        return (maxPosition * PRECISION) / totalValue;
    }
    
    function _calculateBeta(address /*portfolio*/) private pure returns (uint256) {
        // Simplified beta calculation
        // In production, this would calculate against a market benchmark
        return 100; // Beta of 1.0 (market neutral)
    }
    
    function _getPortfolioValue(address portfolio) private view returns (uint256) {
        uint256 totalValue = 0;
        
        for (uint i = 0; i < supportedAssets.length; i++) {
            address asset = supportedAssets[i];
            uint256 holdings = assetPrices[portfolio][asset];
            
            if (holdings > 0 && address(priceFeeds[asset]) != address(0)) {
                (, int256 price,, uint256 updatedAt,) = priceFeeds[asset].latestRoundData();
                
                // Check for stale price
                if (block.timestamp - updatedAt <= stalePriceThreshold && price > 0) {
                    totalValue += (holdings * uint256(price)) / 1e8; // Chainlink prices are 8 decimals
                }
            }
        }
        
        return totalValue;
    }
    
    function _checkRiskLimits(address portfolio, RiskMetrics memory metrics) private {
        RiskLimits storage limits = portfolioRiskLimits[portfolio];
        
        if (metrics.valueAtRisk95 > limits.maxVaR95 && limits.maxVaR95 > 0) {
            emit RiskLimitBreached(portfolio, "VaR95", metrics.valueAtRisk95, limits.maxVaR95);
        }
        
        if (metrics.maxDrawdown > limits.maxDrawdownLimit && limits.maxDrawdownLimit > 0) {
            emit RiskLimitBreached(portfolio, "MaxDrawdown", metrics.maxDrawdown, limits.maxDrawdownLimit);
        }
        
        if (metrics.liquidityScore < limits.minLiquidityScore && limits.minLiquidityScore > 0) {
            emit RiskLimitBreached(portfolio, "Liquidity", metrics.liquidityScore, limits.minLiquidityScore);
        }
    }
    
    function _quickSort(uint256[] memory arr) private pure returns (uint256[] memory) {
        if (arr.length <= 1) return arr;
        
        uint256[] memory sorted = new uint256[](arr.length);
        for (uint i = 0; i < arr.length; i++) {
            sorted[i] = arr[i];
        }
        
        _quickSortHelper(sorted, 0, sorted.length - 1);
        return sorted;
    }
    
    function _quickSortHelper(uint256[] memory arr, uint256 left, uint256 right) private pure {
        if (left >= right) return;
        
        uint256 pivot = arr[(left + right) / 2];
        uint256 i = left;
        uint256 j = right;
        
        while (i <= j) {
            while (arr[i] < pivot) i++;
            while (arr[j] > pivot && j > 0) j--;
            
            if (i <= j) {
                uint256 temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
                i++;
                if (j > 0) j--;
            }
        }
        
        if (left < j) _quickSortHelper(arr, left, j);
        if (i < right) _quickSortHelper(arr, i, right);
    }
    
    function _sqrt(uint256 x) private pure returns (uint256) {
        if (x == 0) return 0;
        
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        
        return y;
    }
}
