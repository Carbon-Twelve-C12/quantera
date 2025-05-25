// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./LiquidityPools.sol";

/**
 * @title DynamicFeeStructure
 * @dev Dynamic fee calculation based on market conditions for optimal trading costs
 * Implements volatility-based fees, liquidity incentives, and time-based adjustments
 * Addresses WEF report's emphasis on efficient market structure and fair pricing
 */
contract DynamicFeeStructure is Ownable, Pausable {
    using Math for uint256;

    // Fee calculation models
    enum FeeModel {
        STATIC,            // Fixed fee regardless of conditions
        VOLATILITY_BASED,  // Fee adjusts based on volatility
        LIQUIDITY_BASED,   // Fee adjusts based on liquidity depth
        HYBRID,            // Combination of volatility and liquidity
        TIME_WEIGHTED      // Fee adjusts based on time and market conditions
    }

    // Market condition assessment
    enum MarketCondition {
        STABLE,            // Low volatility, high liquidity
        VOLATILE,          // High volatility, normal liquidity
        ILLIQUID,          // Normal volatility, low liquidity
        STRESSED,          // High volatility, low liquidity
        OPTIMAL            // Low volatility, high liquidity
    }

    // Fee tier configuration
    struct FeeTier {
        uint24 baseFee;            // Base fee in basis points
        uint24 minFee;             // Minimum fee in basis points
        uint24 maxFee;             // Maximum fee in basis points
        uint256 volumeThreshold;   // Volume threshold for this tier
        uint256 liquidityThreshold; // Liquidity threshold for this tier
        bool isActive;
    }

    // Dynamic fee parameters
    struct DynamicFeeParams {
        FeeModel model;
        uint256 volatilityMultiplier;    // Multiplier for volatility impact (basis points)
        uint256 liquidityMultiplier;     // Multiplier for liquidity impact (basis points)
        uint256 timeDecayFactor;         // Time-based decay factor
        uint256 maxAdjustment;           // Maximum fee adjustment (basis points)
        uint256 updateInterval;          // Minimum time between updates
        bool isActive;
    }

    // Pool-specific fee configuration
    struct PoolFeeConfig {
        bytes32 poolId;
        FeeModel feeModel;
        FeeTier[] feeTiers;
        DynamicFeeParams dynamicParams;
        uint256 lastUpdate;
        uint256 currentFee;              // Current calculated fee
        MarketCondition currentCondition;
        bool customConfig;               // Whether pool has custom configuration
    }

    // Market data for fee calculation
    struct MarketData {
        uint256 price;                   // Current price
        uint256 volatility;              // 24-hour volatility (basis points)
        uint256 volume24h;               // 24-hour volume
        uint256 liquidityDepth;          // Current liquidity depth
        uint256 averageSpread;           // Average bid-ask spread
        uint256 tradeCount24h;           // Number of trades in 24h
        uint256 lastUpdated;
    }

    // Fee calculation result
    struct FeeCalculationResult {
        uint24 calculatedFee;            // Final calculated fee
        uint24 baseFee;                  // Base fee before adjustments
        int256 volatilityAdjustment;     // Volatility-based adjustment
        int256 liquidityAdjustment;      // Liquidity-based adjustment
        int256 timeAdjustment;           // Time-based adjustment
        MarketCondition marketCondition;
        uint256 calculationTimestamp;
    }

    // State variables
    LiquidityPools public liquidityPools;
    mapping(bytes32 => PoolFeeConfig) public poolFeeConfigs;
    mapping(bytes32 => MarketData) public poolMarketData;
    mapping(FeeModel => DynamicFeeParams) public defaultFeeParams;
    mapping(uint256 => FeeTier) public globalFeeTiers;
    
    // Global parameters
    uint256 public constant MAX_FEE = 1000;                    // 10% maximum fee
    uint256 public constant MIN_FEE = 1;                       // 0.01% minimum fee
    uint256 public constant VOLATILITY_THRESHOLD_LOW = 500;    // 5% low volatility
    uint256 public constant VOLATILITY_THRESHOLD_HIGH = 2000;  // 20% high volatility
    uint256 public constant LIQUIDITY_THRESHOLD_LOW = 100000 * 1e18;  // 100k low liquidity
    uint256 public constant LIQUIDITY_THRESHOLD_HIGH = 1000000 * 1e18; // 1M high liquidity
    
    // Fee collection
    uint256 public totalFeesCollected;
    address public feeCollector;
    uint256 public protocolFeeShare = 1000;                    // 10% protocol fee share

    // Events
    event FeeCalculated(
        bytes32 indexed poolId,
        uint24 oldFee,
        uint24 newFee,
        MarketCondition condition
    );
    
    event FeeModelUpdated(
        bytes32 indexed poolId,
        FeeModel oldModel,
        FeeModel newModel
    );
    
    event MarketDataUpdated(
        bytes32 indexed poolId,
        uint256 volatility,
        uint256 liquidityDepth
    );
    
    event FeeTierAdded(
        bytes32 indexed poolId,
        uint24 baseFee,
        uint256 volumeThreshold
    );

    // Modifiers
    modifier validPool(bytes32 _poolId) {
        require(_poolId != bytes32(0), "Invalid pool ID");
        _;
    }

    modifier validFeeModel(FeeModel _model) {
        require(_model <= FeeModel.TIME_WEIGHTED, "Invalid fee model");
        _;
    }

    constructor(address _liquidityPools, address _feeCollector) {
        require(_liquidityPools != address(0), "Invalid liquidity pools address");
        require(_feeCollector != address(0), "Invalid fee collector address");
        
        liquidityPools = LiquidityPools(_liquidityPools);
        feeCollector = _feeCollector;
        
        _initializeDefaultParams();
        _initializeGlobalFeeTiers();
    }

    /**
     * @dev Calculate dynamic fee for a specific pool and trade
     */
    function calculateDynamicFee(
        bytes32 _poolId,
        uint256 _tradeSize,
        bool _isBuy
    ) external view validPool(_poolId) returns (FeeCalculationResult memory) {
        PoolFeeConfig memory config = poolFeeConfigs[_poolId];
        MarketData memory marketData = poolMarketData[_poolId];
        
        // Use default config if pool doesn't have custom configuration
        if (!config.customConfig) {
            config.feeModel = FeeModel.HYBRID;
            config.dynamicParams = defaultFeeParams[FeeModel.HYBRID];
        }

        // Calculate base fee from tier structure
        uint24 baseFee = _getBaseFeeFromTiers(_poolId, _tradeSize);
        
        // Calculate market condition
        MarketCondition condition = _assessMarketCondition(marketData);
        
        // Apply dynamic adjustments based on fee model
        int256 totalAdjustment = 0;
        int256 volatilityAdjustment = 0;
        int256 liquidityAdjustment = 0;
        int256 timeAdjustment = 0;

        if (config.feeModel == FeeModel.VOLATILITY_BASED || config.feeModel == FeeModel.HYBRID) {
            volatilityAdjustment = _calculateVolatilityAdjustment(marketData, config.dynamicParams);
            totalAdjustment += volatilityAdjustment;
        }

        if (config.feeModel == FeeModel.LIQUIDITY_BASED || config.feeModel == FeeModel.HYBRID) {
            liquidityAdjustment = _calculateLiquidityAdjustment(marketData, config.dynamicParams, _tradeSize);
            totalAdjustment += liquidityAdjustment;
        }

        if (config.feeModel == FeeModel.TIME_WEIGHTED) {
            timeAdjustment = _calculateTimeAdjustment(marketData, config.dynamicParams);
            totalAdjustment += timeAdjustment;
        }

        // Apply maximum adjustment limit
        if (totalAdjustment > int256(config.dynamicParams.maxAdjustment)) {
            totalAdjustment = int256(config.dynamicParams.maxAdjustment);
        } else if (totalAdjustment < -int256(config.dynamicParams.maxAdjustment)) {
            totalAdjustment = -int256(config.dynamicParams.maxAdjustment);
        }

        // Calculate final fee
        int256 finalFeeInt = int256(uint256(baseFee)) + totalAdjustment;
        uint24 finalFee;

        if (finalFeeInt < int256(MIN_FEE)) {
            finalFee = uint24(MIN_FEE);
        } else if (finalFeeInt > int256(MAX_FEE)) {
            finalFee = uint24(MAX_FEE);
        } else {
            finalFee = uint24(uint256(finalFeeInt));
        }

        return FeeCalculationResult({
            calculatedFee: finalFee,
            baseFee: baseFee,
            volatilityAdjustment: volatilityAdjustment,
            liquidityAdjustment: liquidityAdjustment,
            timeAdjustment: timeAdjustment,
            marketCondition: condition,
            calculationTimestamp: block.timestamp
        });
    }

    /**
     * @dev Update market data for a pool
     */
    function updateMarketData(
        bytes32 _poolId,
        uint256 _price,
        uint256 _volatility,
        uint256 _volume24h,
        uint256 _liquidityDepth,
        uint256 _averageSpread,
        uint256 _tradeCount24h
    ) external validPool(_poolId) {
        MarketData storage data = poolMarketData[_poolId];
        
        data.price = _price;
        data.volatility = _volatility;
        data.volume24h = _volume24h;
        data.liquidityDepth = _liquidityDepth;
        data.averageSpread = _averageSpread;
        data.tradeCount24h = _tradeCount24h;
        data.lastUpdated = block.timestamp;

        emit MarketDataUpdated(_poolId, _volatility, _liquidityDepth);
        
        // Update pool fee if using dynamic model
        _updatePoolFee(_poolId);
    }

    /**
     * @dev Configure fee model for a specific pool
     */
    function configurePoolFeeModel(
        bytes32 _poolId,
        FeeModel _feeModel,
        DynamicFeeParams calldata _params
    ) external onlyOwner validPool(_poolId) validFeeModel(_feeModel) {
        PoolFeeConfig storage config = poolFeeConfigs[_poolId];
        
        FeeModel oldModel = config.feeModel;
        config.poolId = _poolId;
        config.feeModel = _feeModel;
        config.dynamicParams = _params;
        config.customConfig = true;
        config.lastUpdate = block.timestamp;

        emit FeeModelUpdated(_poolId, oldModel, _feeModel);
    }

    /**
     * @dev Add fee tier for a pool
     */
    function addFeeTier(
        bytes32 _poolId,
        uint24 _baseFee,
        uint24 _minFee,
        uint24 _maxFee,
        uint256 _volumeThreshold,
        uint256 _liquidityThreshold
    ) external onlyOwner validPool(_poolId) {
        require(_baseFee >= _minFee && _baseFee <= _maxFee, "Invalid fee range");
        require(_minFee >= MIN_FEE && _maxFee <= MAX_FEE, "Fee out of bounds");

        PoolFeeConfig storage config = poolFeeConfigs[_poolId];
        
        config.feeTiers.push(FeeTier({
            baseFee: _baseFee,
            minFee: _minFee,
            maxFee: _maxFee,
            volumeThreshold: _volumeThreshold,
            liquidityThreshold: _liquidityThreshold,
            isActive: true
        }));

        emit FeeTierAdded(_poolId, _baseFee, _volumeThreshold);
    }

    /**
     * @dev Get current fee for a pool
     */
    function getCurrentFee(bytes32 _poolId) external view validPool(_poolId) returns (uint24) {
        PoolFeeConfig memory config = poolFeeConfigs[_poolId];
        
        if (config.customConfig) {
            return uint24(config.currentFee);
        } else {
            // Return default fee for pools without custom configuration
            return 30; // 0.3% default fee
        }
    }

    /**
     * @dev Get market condition for a pool
     */
    function getMarketCondition(bytes32 _poolId) external view validPool(_poolId) returns (MarketCondition) {
        MarketData memory data = poolMarketData[_poolId];
        return _assessMarketCondition(data);
    }

    /**
     * @dev Get fee calculation breakdown for transparency
     */
    function getFeeBreakdown(bytes32 _poolId, uint256 _tradeSize) 
        external 
        view 
        validPool(_poolId) 
        returns (
            uint24 baseFee,
            int256 volatilityAdjustment,
            int256 liquidityAdjustment,
            uint24 finalFee,
            MarketCondition condition
        ) 
    {
        FeeCalculationResult memory result = this.calculateDynamicFee(_poolId, _tradeSize, true);
        
        return (
            result.baseFee,
            result.volatilityAdjustment,
            result.liquidityAdjustment,
            result.calculatedFee,
            result.marketCondition
        );
    }

    // Internal calculation functions

    function _getBaseFeeFromTiers(bytes32 _poolId, uint256 _tradeSize) internal view returns (uint24) {
        PoolFeeConfig memory config = poolFeeConfigs[_poolId];
        
        // If pool has custom tiers, use them
        if (config.feeTiers.length > 0) {
            for (uint256 i = 0; i < config.feeTiers.length; i++) {
                FeeTier memory tier = config.feeTiers[i];
                if (tier.isActive && _tradeSize >= tier.volumeThreshold) {
                    return tier.baseFee;
                }
            }
            // Return first tier if no threshold met
            return config.feeTiers[0].baseFee;
        } else {
            // Use global tiers
            return _getGlobalBaseFee(_tradeSize);
        }
    }

    function _getGlobalBaseFee(uint256 _tradeSize) internal view returns (uint24) {
        // Simplified tier structure - in production would be more sophisticated
        if (_tradeSize >= 1000000 * 1e18) {        // 1M+ trade
            return 10;  // 0.1% for large trades
        } else if (_tradeSize >= 100000 * 1e18) {  // 100k+ trade
            return 20;  // 0.2% for medium trades
        } else {
            return 30;  // 0.3% for small trades
        }
    }

    function _assessMarketCondition(MarketData memory _data) internal pure returns (MarketCondition) {
        bool highVolatility = _data.volatility > VOLATILITY_THRESHOLD_HIGH;
        bool lowVolatility = _data.volatility < VOLATILITY_THRESHOLD_LOW;
        bool highLiquidity = _data.liquidityDepth > LIQUIDITY_THRESHOLD_HIGH;
        bool lowLiquidity = _data.liquidityDepth < LIQUIDITY_THRESHOLD_LOW;

        if (lowVolatility && highLiquidity) {
            return MarketCondition.OPTIMAL;
        } else if (highVolatility && lowLiquidity) {
            return MarketCondition.STRESSED;
        } else if (highVolatility) {
            return MarketCondition.VOLATILE;
        } else if (lowLiquidity) {
            return MarketCondition.ILLIQUID;
        } else {
            return MarketCondition.STABLE;
        }
    }

    function _calculateVolatilityAdjustment(
        MarketData memory _data,
        DynamicFeeParams memory _params
    ) internal pure returns (int256) {
        if (_data.volatility == 0) return 0;

        // Higher volatility = higher fees
        int256 volatilityDelta = int256(_data.volatility) - int256(VOLATILITY_THRESHOLD_LOW);
        int256 adjustment = (volatilityDelta * int256(_params.volatilityMultiplier)) / 10000;
        
        return adjustment;
    }

    function _calculateLiquidityAdjustment(
        MarketData memory _data,
        DynamicFeeParams memory _params,
        uint256 _tradeSize
    ) internal pure returns (int256) {
        if (_data.liquidityDepth == 0) return int256(_params.maxAdjustment); // Max penalty for no liquidity

        // Lower liquidity = higher fees, but also consider trade size impact
        uint256 liquidityRatio = (_data.liquidityDepth * 10000) / LIQUIDITY_THRESHOLD_HIGH;
        uint256 tradeSizeImpact = (_tradeSize * 10000) / _data.liquidityDepth;

        int256 liquidityAdjustment = int256(10000 - liquidityRatio) * int256(_params.liquidityMultiplier) / 10000;
        int256 impactAdjustment = int256(tradeSizeImpact) * int256(_params.liquidityMultiplier) / 10000;

        return liquidityAdjustment + impactAdjustment;
    }

    function _calculateTimeAdjustment(
        MarketData memory _data,
        DynamicFeeParams memory _params
    ) internal view returns (int256) {
        if (_data.lastUpdated == 0) return 0;

        // Fees increase with time since last update (stale data penalty)
        uint256 timeSinceUpdate = block.timestamp - _data.lastUpdated;
        uint256 timeDecayHours = timeSinceUpdate / 3600; // Convert to hours
        
        int256 adjustment = int256(timeDecayHours * _params.timeDecayFactor);
        
        return adjustment;
    }

    function _updatePoolFee(bytes32 _poolId) internal {
        PoolFeeConfig storage config = poolFeeConfigs[_poolId];
        
        if (!config.customConfig || !config.dynamicParams.isActive) {
            return;
        }

        // Check if enough time has passed since last update
        if (block.timestamp < config.lastUpdate + config.dynamicParams.updateInterval) {
            return;
        }

        // Calculate new fee with standard trade size
        FeeCalculationResult memory result = this.calculateDynamicFee(_poolId, 10000 * 1e18, true);
        
        uint24 oldFee = uint24(config.currentFee);
        config.currentFee = result.calculatedFee;
        config.currentCondition = result.marketCondition;
        config.lastUpdate = block.timestamp;

        emit FeeCalculated(_poolId, oldFee, result.calculatedFee, result.marketCondition);
    }

    function _initializeDefaultParams() internal {
        // Volatility-based model
        defaultFeeParams[FeeModel.VOLATILITY_BASED] = DynamicFeeParams({
            model: FeeModel.VOLATILITY_BASED,
            volatilityMultiplier: 100,    // 1% adjustment per 1% volatility
            liquidityMultiplier: 0,
            timeDecayFactor: 0,
            maxAdjustment: 200,           // Max 2% adjustment
            updateInterval: 1 hours,
            isActive: true
        });

        // Liquidity-based model
        defaultFeeParams[FeeModel.LIQUIDITY_BASED] = DynamicFeeParams({
            model: FeeModel.LIQUIDITY_BASED,
            volatilityMultiplier: 0,
            liquidityMultiplier: 150,     // 1.5% adjustment per liquidity ratio
            timeDecayFactor: 0,
            maxAdjustment: 300,           // Max 3% adjustment
            updateInterval: 30 minutes,
            isActive: true
        });

        // Hybrid model
        defaultFeeParams[FeeModel.HYBRID] = DynamicFeeParams({
            model: FeeModel.HYBRID,
            volatilityMultiplier: 75,     // 0.75% adjustment per 1% volatility
            liquidityMultiplier: 100,     // 1% adjustment per liquidity ratio
            timeDecayFactor: 0,
            maxAdjustment: 250,           // Max 2.5% adjustment
            updateInterval: 15 minutes,
            isActive: true
        });

        // Time-weighted model
        defaultFeeParams[FeeModel.TIME_WEIGHTED] = DynamicFeeParams({
            model: FeeModel.TIME_WEIGHTED,
            volatilityMultiplier: 50,
            liquidityMultiplier: 50,
            timeDecayFactor: 10,          // 0.1% per hour of stale data
            maxAdjustment: 400,           // Max 4% adjustment
            updateInterval: 5 minutes,
            isActive: true
        });
    }

    function _initializeGlobalFeeTiers() internal {
        // Small trades (< 10k)
        globalFeeTiers[0] = FeeTier({
            baseFee: 30,                  // 0.3%
            minFee: 20,                   // 0.2%
            maxFee: 50,                   // 0.5%
            volumeThreshold: 0,
            liquidityThreshold: 0,
            isActive: true
        });

        // Medium trades (10k - 100k)
        globalFeeTiers[1] = FeeTier({
            baseFee: 25,                  // 0.25%
            minFee: 15,                   // 0.15%
            maxFee: 40,                   // 0.4%
            volumeThreshold: 10000 * 1e18,
            liquidityThreshold: 0,
            isActive: true
        });

        // Large trades (100k+)
        globalFeeTiers[2] = FeeTier({
            baseFee: 20,                  // 0.2%
            minFee: 10,                   // 0.1%
            maxFee: 30,                   // 0.3%
            volumeThreshold: 100000 * 1e18,
            liquidityThreshold: 0,
            isActive: true
        });
    }

    // Admin functions

    function setProtocolFeeShare(uint256 _newShare) external onlyOwner {
        require(_newShare <= 5000, "Fee share too high"); // Max 50%
        protocolFeeShare = _newShare;
    }

    function setFeeCollector(address _newCollector) external onlyOwner {
        require(_newCollector != address(0), "Invalid address");
        feeCollector = _newCollector;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencySetFee(bytes32 _poolId, uint24 _fee) external onlyOwner {
        require(_fee >= MIN_FEE && _fee <= MAX_FEE, "Fee out of bounds");
        poolFeeConfigs[_poolId].currentFee = _fee;
    }
} 