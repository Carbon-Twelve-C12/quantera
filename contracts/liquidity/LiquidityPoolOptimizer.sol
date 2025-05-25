// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./LiquidityPools.sol";

/**
 * @title LiquidityPoolOptimizer
 * @dev Advanced liquidity pool optimization for institutional-grade capital efficiency
 * Implements automated rebalancing, yield optimization, and intelligent position management
 * Addresses WEF report's emphasis on capital efficiency and liquidity optimization
 */
contract LiquidityPoolOptimizer is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Math for uint256;

    // Optimization strategies
    enum OptimizationStrategy {
        CONSERVATIVE,       // Low risk, stable returns
        BALANCED,          // Moderate risk, balanced returns
        AGGRESSIVE,        // Higher risk, maximum yield
        CUSTOM            // User-defined parameters
    }

    // Rebalancing triggers
    enum RebalanceTrigger {
        PRICE_DEVIATION,   // Price moves outside range
        TIME_BASED,        // Scheduled rebalancing
        VOLATILITY_SPIKE,  // High volatility detected
        YIELD_OPPORTUNITY, // Better yield opportunity found
        MANUAL            // Manual trigger
    }

    // Optimization configuration for a position
    struct OptimizationConfig {
        OptimizationStrategy strategy;
        uint256 targetYield;           // Target APY in basis points
        uint256 maxSlippage;           // Maximum slippage tolerance in basis points
        uint256 rebalanceThreshold;   // Price deviation threshold for rebalancing
        uint256 minLiquidity;          // Minimum liquidity to maintain
        uint256 maxLiquidity;          // Maximum liquidity to deploy
        bool autoRebalance;            // Enable automatic rebalancing
        bool yieldOptimization;        // Enable yield optimization
        uint256 lastOptimization;      // Timestamp of last optimization
    }

    // Optimized position tracking
    struct OptimizedPosition {
        bytes32 positionId;
        bytes32 poolId;
        address owner;
        OptimizationConfig config;
        uint256 currentYield;          // Current APY in basis points
        uint256 totalFeesEarned;       // Total fees earned
        uint256 impermanentLoss;       // Estimated impermanent loss
        uint256 capitalEfficiency;    // Capital efficiency score (0-10000)
        bool isActive;
        uint256 createdAt;
        uint256 lastRebalance;
    }

    // Yield opportunity tracking
    struct YieldOpportunity {
        bytes32 poolId;
        uint256 estimatedAPY;          // Estimated APY in basis points
        uint256 liquidityRequired;     // Minimum liquidity required
        uint256 riskScore;             // Risk assessment (0-10000)
        uint256 confidence;            // Confidence level (0-10000)
        uint256 validUntil;            // Opportunity expiration
        bool isActive;
    }

    // Market analytics for optimization
    struct MarketAnalytics {
        uint256 volatility;            // 30-day volatility
        uint256 volume24h;             // 24-hour volume
        uint256 averageSpread;         // Average bid-ask spread
        uint256 liquidityDepth;        // Total liquidity depth
        uint256 priceImpact;           // Price impact for standard trade size
        uint256 lastUpdated;
    }

    // State variables
    LiquidityPools public liquidityPools;
    mapping(bytes32 => OptimizedPosition) public optimizedPositions;
    mapping(address => bytes32[]) public userOptimizedPositions;
    mapping(bytes32 => YieldOpportunity[]) public poolYieldOpportunities;
    mapping(bytes32 => MarketAnalytics) public poolAnalytics;
    mapping(OptimizationStrategy => OptimizationConfig) public defaultConfigs;
    
    // Optimization parameters
    uint256 public constant MAX_SLIPPAGE = 1000;           // 10% maximum slippage
    uint256 public constant MIN_REBALANCE_INTERVAL = 1 hours;
    uint256 public constant VOLATILITY_THRESHOLD = 2000;   // 20% volatility threshold
    uint256 public constant YIELD_IMPROVEMENT_THRESHOLD = 100; // 1% yield improvement
    
    // Fee structure
    uint256 public optimizationFee = 50;                   // 0.5% optimization fee
    uint256 public performanceFee = 1000;                  // 10% performance fee
    address public feeCollector;
    uint256 public totalFeesCollected;

    // Events
    event PositionOptimized(
        bytes32 indexed positionId,
        address indexed owner,
        OptimizationStrategy strategy,
        uint256 newYield
    );
    
    event AutoRebalanceExecuted(
        bytes32 indexed positionId,
        RebalanceTrigger trigger,
        uint256 oldYield,
        uint256 newYield
    );
    
    event YieldOpportunityDetected(
        bytes32 indexed poolId,
        uint256 estimatedAPY,
        uint256 riskScore
    );
    
    event OptimizationConfigUpdated(
        bytes32 indexed positionId,
        OptimizationStrategy newStrategy
    );

    // Modifiers
    modifier onlyPositionOwner(bytes32 _positionId) {
        require(optimizedPositions[_positionId].owner == msg.sender, "Not position owner");
        _;
    }

    modifier validStrategy(OptimizationStrategy _strategy) {
        require(_strategy <= OptimizationStrategy.CUSTOM, "Invalid strategy");
        _;
    }

    constructor(address _liquidityPools, address _feeCollector) {
        require(_liquidityPools != address(0), "Invalid liquidity pools address");
        require(_feeCollector != address(0), "Invalid fee collector address");
        
        liquidityPools = LiquidityPools(_liquidityPools);
        feeCollector = _feeCollector;
        
        _initializeDefaultConfigs();
    }

    /**
     * @dev Create an optimized position with automatic optimization features
     */
    function createOptimizedPosition(
        bytes32 _poolId,
        int24 _lowerTick,
        int24 _upperTick,
        uint256 _amount0Desired,
        uint256 _amount1Desired,
        OptimizationStrategy _strategy
    ) external nonReentrant validStrategy(_strategy) returns (bytes32 optimizedPositionId) {
        // Create the underlying liquidity position
        (bytes32 positionId, uint128 liquidity, uint256 amount0, uint256 amount1) = 
            liquidityPools.addLiquidity(
                _poolId,
                _lowerTick,
                _upperTick,
                _amount0Desired,
                _amount1Desired,
                0, // No minimum amounts for optimization
                0
            );

        // Generate optimized position ID
        optimizedPositionId = keccak256(abi.encodePacked(
            positionId,
            msg.sender,
            block.timestamp,
            _strategy
        ));

        // Create optimized position
        OptimizedPosition storage position = optimizedPositions[optimizedPositionId];
        position.positionId = positionId;
        position.poolId = _poolId;
        position.owner = msg.sender;
        position.config = defaultConfigs[_strategy];
        position.currentYield = _calculateCurrentYield(_poolId, liquidity);
        position.totalFeesEarned = 0;
        position.impermanentLoss = 0;
        position.capitalEfficiency = _calculateCapitalEfficiency(_poolId, liquidity, amount0 + amount1);
        position.isActive = true;
        position.createdAt = block.timestamp;
        position.lastRebalance = block.timestamp;

        // Add to user's positions
        userOptimizedPositions[msg.sender].push(optimizedPositionId);

        emit PositionOptimized(optimizedPositionId, msg.sender, _strategy, position.currentYield);
        return optimizedPositionId;
    }

    /**
     * @dev Execute optimization for a position
     */
    function optimizePosition(bytes32 _optimizedPositionId) 
        external 
        nonReentrant 
        onlyPositionOwner(_optimizedPositionId) 
    {
        OptimizedPosition storage position = optimizedPositions[_optimizedPositionId];
        require(position.isActive, "Position not active");
        require(
            block.timestamp >= position.lastOptimization + MIN_REBALANCE_INTERVAL,
            "Too soon to optimize"
        );

        // Analyze current position performance
        uint256 currentYield = _calculateCurrentYield(position.poolId, 0); // Simplified
        uint256 optimalYield = _findOptimalYield(position.poolId, position.config.strategy);

        // Check if optimization is beneficial
        if (optimalYield > currentYield + YIELD_IMPROVEMENT_THRESHOLD) {
            _executeOptimization(_optimizedPositionId, optimalYield);
        }

        position.lastOptimization = block.timestamp;
    }

    /**
     * @dev Automatic rebalancing based on market conditions
     */
    function autoRebalance(bytes32 _optimizedPositionId, RebalanceTrigger _trigger) 
        external 
        nonReentrant 
    {
        OptimizedPosition storage position = optimizedPositions[_optimizedPositionId];
        require(position.isActive, "Position not active");
        require(position.config.autoRebalance, "Auto rebalance not enabled");

        uint256 oldYield = position.currentYield;
        
        // Execute rebalancing based on trigger
        if (_trigger == RebalanceTrigger.PRICE_DEVIATION) {
            _rebalanceForPriceDeviation(_optimizedPositionId);
        } else if (_trigger == RebalanceTrigger.VOLATILITY_SPIKE) {
            _rebalanceForVolatility(_optimizedPositionId);
        } else if (_trigger == RebalanceTrigger.YIELD_OPPORTUNITY) {
            _rebalanceForYieldOpportunity(_optimizedPositionId);
        }

        uint256 newYield = _calculateCurrentYield(position.poolId, 0);
        position.currentYield = newYield;
        position.lastRebalance = block.timestamp;

        emit AutoRebalanceExecuted(_optimizedPositionId, _trigger, oldYield, newYield);
    }

    /**
     * @dev Detect and register yield opportunities across pools
     */
    function detectYieldOpportunities(bytes32[] calldata _poolIds) external {
        for (uint256 i = 0; i < _poolIds.length; i++) {
            bytes32 poolId = _poolIds[i];
            
            // Calculate potential yield for this pool
            uint256 estimatedAPY = _calculatePotentialYield(poolId);
            uint256 riskScore = _assessPoolRisk(poolId);
            uint256 confidence = _calculateConfidence(poolId);

            // Only register if yield is attractive and risk is acceptable
            if (estimatedAPY > 500 && riskScore < 7000) { // 5% APY, <70% risk
                YieldOpportunity memory opportunity = YieldOpportunity({
                    poolId: poolId,
                    estimatedAPY: estimatedAPY,
                    liquidityRequired: 100000 * 1e18, // 100k minimum
                    riskScore: riskScore,
                    confidence: confidence,
                    validUntil: block.timestamp + 24 hours,
                    isActive: true
                });

                poolYieldOpportunities[poolId].push(opportunity);
                emit YieldOpportunityDetected(poolId, estimatedAPY, riskScore);
            }
        }
    }

    /**
     * @dev Update market analytics for optimization decisions
     */
    function updateMarketAnalytics(bytes32 _poolId) external {
        MarketAnalytics storage analytics = poolAnalytics[_poolId];
        
        // Calculate market metrics (simplified implementation)
        analytics.volatility = _calculateVolatility(_poolId);
        analytics.volume24h = _getVolume24h(_poolId);
        analytics.averageSpread = _calculateAverageSpread(_poolId);
        analytics.liquidityDepth = _getLiquidityDepth(_poolId);
        analytics.priceImpact = _calculatePriceImpact(_poolId);
        analytics.lastUpdated = block.timestamp;
    }

    /**
     * @dev Get optimization recommendations for a position
     */
    function getOptimizationRecommendations(bytes32 _optimizedPositionId) 
        external 
        view 
        returns (
            bool shouldRebalance,
            uint256 recommendedYield,
            OptimizationStrategy recommendedStrategy,
            string memory reason
        ) 
    {
        OptimizedPosition memory position = optimizedPositions[_optimizedPositionId];
        require(position.isActive, "Position not active");

        MarketAnalytics memory analytics = poolAnalytics[position.poolId];
        
        // Analyze current conditions
        if (analytics.volatility > VOLATILITY_THRESHOLD) {
            return (true, 0, OptimizationStrategy.CONSERVATIVE, "High volatility detected");
        }
        
        uint256 optimalYield = _findOptimalYield(position.poolId, position.config.strategy);
        if (optimalYield > position.currentYield + YIELD_IMPROVEMENT_THRESHOLD) {
            return (true, optimalYield, position.config.strategy, "Better yield opportunity available");
        }

        return (false, position.currentYield, position.config.strategy, "Position is optimally positioned");
    }

    /**
     * @dev Update optimization configuration for a position
     */
    function updateOptimizationConfig(
        bytes32 _optimizedPositionId,
        OptimizationConfig calldata _newConfig
    ) external onlyPositionOwner(_optimizedPositionId) {
        OptimizedPosition storage position = optimizedPositions[_optimizedPositionId];
        require(position.isActive, "Position not active");
        
        position.config = _newConfig;
        emit OptimizationConfigUpdated(_optimizedPositionId, _newConfig.strategy);
    }

    /**
     * @dev Get position performance metrics
     */
    function getPositionMetrics(bytes32 _optimizedPositionId) 
        external 
        view 
        returns (
            uint256 currentYield,
            uint256 totalFeesEarned,
            uint256 impermanentLoss,
            uint256 capitalEfficiency,
            uint256 performanceScore
        ) 
    {
        OptimizedPosition memory position = optimizedPositions[_optimizedPositionId];
        require(position.isActive, "Position not active");

        return (
            position.currentYield,
            position.totalFeesEarned,
            position.impermanentLoss,
            position.capitalEfficiency,
            _calculatePerformanceScore(_optimizedPositionId)
        );
    }

    // Internal optimization functions

    function _executeOptimization(bytes32 _optimizedPositionId, uint256 _targetYield) internal {
        OptimizedPosition storage position = optimizedPositions[_optimizedPositionId];
        
        // Calculate optimization fee
        uint256 fee = (position.totalFeesEarned * optimizationFee) / 10000;
        totalFeesCollected += fee;
        
        // Update position yield
        position.currentYield = _targetYield;
        position.capitalEfficiency = _calculateCapitalEfficiency(position.poolId, 0, 0);
    }

    function _rebalanceForPriceDeviation(bytes32 _optimizedPositionId) internal {
        // Implementation for price deviation rebalancing
        OptimizedPosition storage position = optimizedPositions[_optimizedPositionId];
        position.lastRebalance = block.timestamp;
    }

    function _rebalanceForVolatility(bytes32 _optimizedPositionId) internal {
        // Implementation for volatility-based rebalancing
        OptimizedPosition storage position = optimizedPositions[_optimizedPositionId];
        position.lastRebalance = block.timestamp;
    }

    function _rebalanceForYieldOpportunity(bytes32 _optimizedPositionId) internal {
        // Implementation for yield opportunity rebalancing
        OptimizedPosition storage position = optimizedPositions[_optimizedPositionId];
        position.lastRebalance = block.timestamp;
    }

    // Analytics and calculation functions

    function _calculateCurrentYield(bytes32 _poolId, uint128 _liquidity) internal view returns (uint256) {
        // Simplified yield calculation - in production would use complex fee analysis
        return 800; // 8% APY placeholder
    }

    function _findOptimalYield(bytes32 _poolId, OptimizationStrategy _strategy) internal view returns (uint256) {
        // Find optimal yield based on strategy and market conditions
        if (_strategy == OptimizationStrategy.AGGRESSIVE) {
            return 1200; // 12% APY for aggressive
        } else if (_strategy == OptimizationStrategy.BALANCED) {
            return 900;  // 9% APY for balanced
        } else {
            return 600;  // 6% APY for conservative
        }
    }

    function _calculateCapitalEfficiency(bytes32 _poolId, uint128 _liquidity, uint256 _totalValue) internal view returns (uint256) {
        // Calculate capital efficiency score (0-10000)
        return 7500; // 75% efficiency placeholder
    }

    function _calculatePotentialYield(bytes32 _poolId) internal view returns (uint256) {
        // Calculate potential yield for a pool
        return 850; // 8.5% APY placeholder
    }

    function _assessPoolRisk(bytes32 _poolId) internal view returns (uint256) {
        // Assess pool risk (0-10000)
        return 4000; // 40% risk placeholder
    }

    function _calculateConfidence(bytes32 _poolId) internal view returns (uint256) {
        // Calculate confidence in yield estimate
        return 8500; // 85% confidence placeholder
    }

    function _calculateVolatility(bytes32 _poolId) internal view returns (uint256) {
        // Calculate 30-day volatility
        return 1500; // 15% volatility placeholder
    }

    function _getVolume24h(bytes32 _poolId) internal view returns (uint256) {
        // Get 24-hour volume
        return 1000000 * 1e18; // 1M volume placeholder
    }

    function _calculateAverageSpread(bytes32 _poolId) internal view returns (uint256) {
        // Calculate average spread
        return 30; // 0.3% spread placeholder
    }

    function _getLiquidityDepth(bytes32 _poolId) internal view returns (uint256) {
        // Get total liquidity depth
        return 5000000 * 1e18; // 5M liquidity placeholder
    }

    function _calculatePriceImpact(bytes32 _poolId) internal view returns (uint256) {
        // Calculate price impact for standard trade
        return 50; // 0.5% price impact placeholder
    }

    function _calculatePerformanceScore(bytes32 _optimizedPositionId) internal view returns (uint256) {
        // Calculate overall performance score
        return 8200; // 82% performance score placeholder
    }

    function _initializeDefaultConfigs() internal {
        // Conservative strategy
        defaultConfigs[OptimizationStrategy.CONSERVATIVE] = OptimizationConfig({
            strategy: OptimizationStrategy.CONSERVATIVE,
            targetYield: 600,           // 6% APY
            maxSlippage: 100,           // 1% max slippage
            rebalanceThreshold: 500,    // 5% price deviation
            minLiquidity: 10000 * 1e18, // 10k minimum
            maxLiquidity: 100000 * 1e18, // 100k maximum
            autoRebalance: true,
            yieldOptimization: true,
            lastOptimization: 0
        });

        // Balanced strategy
        defaultConfigs[OptimizationStrategy.BALANCED] = OptimizationConfig({
            strategy: OptimizationStrategy.BALANCED,
            targetYield: 900,           // 9% APY
            maxSlippage: 200,           // 2% max slippage
            rebalanceThreshold: 750,    // 7.5% price deviation
            minLiquidity: 25000 * 1e18, // 25k minimum
            maxLiquidity: 500000 * 1e18, // 500k maximum
            autoRebalance: true,
            yieldOptimization: true,
            lastOptimization: 0
        });

        // Aggressive strategy
        defaultConfigs[OptimizationStrategy.AGGRESSIVE] = OptimizationConfig({
            strategy: OptimizationStrategy.AGGRESSIVE,
            targetYield: 1200,          // 12% APY
            maxSlippage: 500,           // 5% max slippage
            rebalanceThreshold: 1000,   // 10% price deviation
            minLiquidity: 50000 * 1e18, // 50k minimum
            maxLiquidity: 1000000 * 1e18, // 1M maximum
            autoRebalance: true,
            yieldOptimization: true,
            lastOptimization: 0
        });
    }

    // Admin functions

    function setOptimizationFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 200, "Fee too high"); // Max 2%
        optimizationFee = _newFee;
    }

    function setPerformanceFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 2000, "Fee too high"); // Max 20%
        performanceFee = _newFee;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(owner(), _amount);
    }
} 