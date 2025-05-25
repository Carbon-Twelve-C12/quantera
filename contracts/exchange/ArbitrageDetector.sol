// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./DualListingManager.sol";

/**
 * @title ArbitrageDetector
 * @dev Real-time arbitrage opportunity detection system
 * Works in conjunction with DualListingManager to identify profitable trading opportunities
 * Implements advanced algorithms for cross-exchange price analysis and profit calculation
 */
contract ArbitrageDetector is Ownable, Pausable {
    using Math for uint256;

    // Reference to the DualListingManager contract
    DualListingManager public dualListingManager;

    // Arbitrage detection configuration
    struct DetectionConfig {
        uint256 minProfitThresholdBps;      // Minimum profit threshold in basis points
        uint256 maxPriceAgeSec;             // Maximum age of price data in seconds
        uint256 minVolumeThreshold;         // Minimum volume threshold for consideration
        uint256 maxSlippageBps;             // Maximum acceptable slippage in basis points
        bool isActive;                      // Whether detection is active for this asset
    }

    // Enhanced arbitrage opportunity with additional metrics
    struct EnhancedArbitrageOpportunity {
        address asset;
        string buyExchange;
        string sellExchange;
        uint256 buyPrice;
        uint256 sellPrice;
        uint256 priceDifference;            // In basis points
        uint256 estimatedProfit;            // Estimated profit after all costs
        uint256 maxTradeSize;               // Maximum trade size based on liquidity
        uint256 confidence;                 // Confidence score (0-10000)
        uint256 timeToExpiry;               // Estimated time until opportunity expires
        uint256 riskScore;                  // Risk assessment score (0-10000)
        uint256 timestamp;
        bool isHighFrequency;               // Whether this is a high-frequency opportunity
    }

    // Market depth information for better arbitrage calculation
    struct MarketDepth {
        uint256[] bidPrices;
        uint256[] bidSizes;
        uint256[] askPrices;
        uint256[] askSizes;
        uint256 totalBidVolume;
        uint256 totalAskVolume;
        uint256 timestamp;
    }

    // Historical arbitrage performance tracking
    struct ArbitrageStats {
        uint256 totalOpportunities;
        uint256 successfulTrades;
        uint256 totalProfit;
        uint256 averageProfit;
        uint256 successRate;                // In basis points
        uint256 lastUpdated;
    }

    // State variables
    mapping(address => DetectionConfig) public detectionConfigs;
    mapping(address => EnhancedArbitrageOpportunity[]) public assetOpportunities;
    mapping(address => mapping(string => MarketDepth)) public marketDepths;
    mapping(address => ArbitrageStats) public arbitrageStats;
    mapping(bytes32 => bool) public processedOpportunities;
    
    address[] public monitoredAssets;
    EnhancedArbitrageOpportunity[] public activeOpportunities;
    
    // Configuration parameters
    uint256 public constant MAX_OPPORTUNITIES_PER_ASSET = 10;
    uint256 public constant OPPORTUNITY_EXPIRY_TIME = 300; // 5 minutes
    uint256 public constant HIGH_FREQUENCY_THRESHOLD = 30; // 30 seconds
    uint256 public constant MIN_CONFIDENCE_SCORE = 7000; // 70%
    
    // Detection algorithm parameters
    uint256 public detectionInterval = 30; // 30 seconds
    uint256 public lastDetectionRun;
    bool public autoDetectionEnabled = true;

    // Events
    event ArbitrageOpportunityDetected(
        bytes32 indexed opportunityId,
        address indexed asset,
        string buyExchange,
        string sellExchange,
        uint256 estimatedProfit,
        uint256 confidence,
        uint256 riskScore
    );
    
    event OpportunityExpired(
        bytes32 indexed opportunityId,
        address indexed asset,
        uint256 timestamp
    );
    
    event DetectionConfigUpdated(
        address indexed asset,
        uint256 minProfitThresholdBps,
        uint256 maxPriceAgeSec,
        bool isActive
    );
    
    event MarketDepthUpdated(
        address indexed asset,
        string indexed exchange,
        uint256 totalBidVolume,
        uint256 totalAskVolume,
        uint256 timestamp
    );
    
    event ArbitrageStatsUpdated(
        address indexed asset,
        uint256 totalOpportunities,
        uint256 successRate,
        uint256 averageProfit
    );

    // Modifiers
    modifier validAsset(address asset) {
        require(asset != address(0), "Invalid asset address");
        require(detectionConfigs[asset].isActive, "Asset not monitored");
        _;
    }

    constructor(address _dualListingManager) {
        require(_dualListingManager != address(0), "Invalid DualListingManager address");
        dualListingManager = DualListingManager(_dualListingManager);
    }

    /**
     * @dev Configure arbitrage detection for an asset
     */
    function configureDetection(
        address _asset,
        uint256 _minProfitThresholdBps,
        uint256 _maxPriceAgeSec,
        uint256 _minVolumeThreshold,
        uint256 _maxSlippageBps,
        bool _isActive
    ) external onlyOwner {
        require(_asset != address(0), "Invalid asset address");
        require(_minProfitThresholdBps > 0, "Profit threshold must be positive");
        require(_maxPriceAgeSec > 0, "Price age limit must be positive");

        detectionConfigs[_asset] = DetectionConfig({
            minProfitThresholdBps: _minProfitThresholdBps,
            maxPriceAgeSec: _maxPriceAgeSec,
            minVolumeThreshold: _minVolumeThreshold,
            maxSlippageBps: _maxSlippageBps,
            isActive: _isActive
        });

        // Add to monitored assets if not already present
        bool isMonitored = false;
        for (uint256 i = 0; i < monitoredAssets.length; i++) {
            if (monitoredAssets[i] == _asset) {
                isMonitored = true;
                break;
            }
        }
        
        if (!isMonitored && _isActive) {
            monitoredAssets.push(_asset);
        }

        emit DetectionConfigUpdated(_asset, _minProfitThresholdBps, _maxPriceAgeSec, _isActive);
    }

    /**
     * @dev Run arbitrage detection for all monitored assets
     */
    function runArbitrageDetection() external {
        require(
            block.timestamp - lastDetectionRun >= detectionInterval || msg.sender == owner(),
            "Detection interval not reached"
        );

        lastDetectionRun = block.timestamp;

        for (uint256 i = 0; i < monitoredAssets.length; i++) {
            address asset = monitoredAssets[i];
            if (detectionConfigs[asset].isActive) {
                _detectArbitrageForAsset(asset);
            }
        }
    }

    /**
     * @dev Detect arbitrage opportunities for a specific asset
     */
    function detectArbitrageForAsset(address _asset) external validAsset(_asset) {
        _detectArbitrageForAsset(_asset);
    }

    /**
     * @dev Get enhanced arbitrage opportunities for an asset
     */
    function getArbitrageOpportunities(
        address _asset
    ) external view validAsset(_asset) returns (EnhancedArbitrageOpportunity[] memory) {
        return assetOpportunities[_asset];
    }

    /**
     * @dev Get the best arbitrage opportunity for an asset
     */
    function getBestArbitrageOpportunity(
        address _asset
    ) external view validAsset(_asset) returns (EnhancedArbitrageOpportunity memory bestOpportunity, bool found) {
        EnhancedArbitrageOpportunity[] memory opportunities = assetOpportunities[_asset];
        
        uint256 bestProfit = 0;
        uint256 bestIndex = 0;
        
        for (uint256 i = 0; i < opportunities.length; i++) {
            if (opportunities[i].estimatedProfit > bestProfit && 
                opportunities[i].confidence >= MIN_CONFIDENCE_SCORE &&
                block.timestamp - opportunities[i].timestamp <= OPPORTUNITY_EXPIRY_TIME) {
                bestProfit = opportunities[i].estimatedProfit;
                bestIndex = i;
                found = true;
            }
        }
        
        if (found) {
            bestOpportunity = opportunities[bestIndex];
        }
    }

    /**
     * @dev Update market depth for an exchange
     */
    function updateMarketDepth(
        address _asset,
        string memory _exchange,
        uint256[] memory _bidPrices,
        uint256[] memory _bidSizes,
        uint256[] memory _askPrices,
        uint256[] memory _askSizes
    ) external {
        require(_bidPrices.length == _bidSizes.length, "Bid arrays length mismatch");
        require(_askPrices.length == _askSizes.length, "Ask arrays length mismatch");

        uint256 totalBidVolume = 0;
        uint256 totalAskVolume = 0;

        for (uint256 i = 0; i < _bidSizes.length; i++) {
            totalBidVolume += _bidSizes[i];
        }

        for (uint256 i = 0; i < _askSizes.length; i++) {
            totalAskVolume += _askSizes[i];
        }

        marketDepths[_asset][_exchange] = MarketDepth({
            bidPrices: _bidPrices,
            bidSizes: _bidSizes,
            askPrices: _askPrices,
            askSizes: _askSizes,
            totalBidVolume: totalBidVolume,
            totalAskVolume: totalAskVolume,
            timestamp: block.timestamp
        });

        emit MarketDepthUpdated(_asset, _exchange, totalBidVolume, totalAskVolume, block.timestamp);
    }

    /**
     * @dev Calculate arbitrage profit with slippage consideration
     */
    function calculateProfitWithSlippage(
        address _asset,
        string memory _buyExchange,
        string memory _sellExchange,
        uint256 _amount
    ) external view returns (uint256 estimatedProfit, uint256 slippage) {
        MarketDepth memory buyDepth = marketDepths[_asset][_buyExchange];
        MarketDepth memory sellDepth = marketDepths[_asset][_sellExchange];

        // Calculate average buy price with slippage
        (uint256 avgBuyPrice, uint256 buySlippage) = _calculateAveragePrice(
            buyDepth.askPrices,
            buyDepth.askSizes,
            _amount,
            true // buying
        );

        // Calculate average sell price with slippage
        (uint256 avgSellPrice, uint256 sellSlippage) = _calculateAveragePrice(
            sellDepth.bidPrices,
            sellDepth.bidSizes,
            _amount,
            false // selling
        );

        slippage = buySlippage + sellSlippage;

        if (avgSellPrice > avgBuyPrice) {
            estimatedProfit = (avgSellPrice - avgBuyPrice) * _amount / 1e18;
        }
    }

    /**
     * @dev Get arbitrage statistics for an asset
     */
    function getArbitrageStats(address _asset) external view returns (ArbitrageStats memory) {
        return arbitrageStats[_asset];
    }

    /**
     * @dev Update arbitrage statistics after trade execution
     */
    function updateArbitrageStats(
        address _asset,
        bool _successful,
        uint256 _profit
    ) external {
        // Only allow DualListingManager or owner to update stats
        require(
            msg.sender == address(dualListingManager) || msg.sender == owner(),
            "Unauthorized stats update"
        );

        ArbitrageStats storage stats = arbitrageStats[_asset];
        stats.totalOpportunities++;
        
        if (_successful) {
            stats.successfulTrades++;
            stats.totalProfit += _profit;
            stats.averageProfit = stats.totalProfit / stats.successfulTrades;
        }
        
        stats.successRate = (stats.successfulTrades * 10000) / stats.totalOpportunities;
        stats.lastUpdated = block.timestamp;

        emit ArbitrageStatsUpdated(
            _asset,
            stats.totalOpportunities,
            stats.successRate,
            stats.averageProfit
        );
    }

    /**
     * @dev Set auto-detection enabled/disabled
     */
    function setAutoDetectionEnabled(bool _enabled) external onlyOwner {
        autoDetectionEnabled = _enabled;
    }

    /**
     * @dev Update detection interval
     */
    function updateDetectionInterval(uint256 _newInterval) external onlyOwner {
        require(_newInterval >= 10, "Interval too short"); // Minimum 10 seconds
        detectionInterval = _newInterval;
    }

    /**
     * @dev Clean up expired opportunities
     */
    function cleanupExpiredOpportunities() external {
        for (uint256 i = 0; i < monitoredAssets.length; i++) {
            address asset = monitoredAssets[i];
            _cleanupExpiredOpportunitiesForAsset(asset);
        }
    }

    // Internal functions

    /**
     * @dev Internal function to detect arbitrage for a specific asset
     */
    function _detectArbitrageForAsset(address _asset) internal {
        DetectionConfig memory config = detectionConfigs[_asset];
        
        // Get cross-exchange prices from DualListingManager
        (
            string[] memory exchangeNames,
            uint256[] memory prices,
            uint256[] memory volumes,
            uint256[] memory spreads,
            uint256[] memory timestamps
        ) = dualListingManager.getCrossExchangePrices(_asset);

        // Clean up expired opportunities first
        _cleanupExpiredOpportunitiesForAsset(_asset);

        // Find arbitrage opportunities
        for (uint256 i = 0; i < exchangeNames.length; i++) {
            for (uint256 j = i + 1; j < exchangeNames.length; j++) {
                // Skip if price data is too old
                if (block.timestamp - timestamps[i] > config.maxPriceAgeSec ||
                    block.timestamp - timestamps[j] > config.maxPriceAgeSec) {
                    continue;
                }

                // Skip if volume is too low
                if (volumes[i] < config.minVolumeThreshold ||
                    volumes[j] < config.minVolumeThreshold) {
                    continue;
                }

                // Check for arbitrage opportunity
                if (prices[i] != prices[j]) {
                    (uint256 buyIndex, uint256 sellIndex) = prices[i] < prices[j] ? (i, j) : (j, i);
                    
                    uint256 priceDifference = ((prices[sellIndex] - prices[buyIndex]) * 10000) / prices[buyIndex];
                    
                    if (priceDifference >= config.minProfitThresholdBps) {
                        _createArbitrageOpportunity(
                            _asset,
                            exchangeNames[buyIndex],
                            exchangeNames[sellIndex],
                            prices[buyIndex],
                            prices[sellIndex],
                            volumes[buyIndex],
                            volumes[sellIndex],
                            config
                        );
                    }
                }
            }
        }
    }

    /**
     * @dev Create an enhanced arbitrage opportunity
     */
    function _createArbitrageOpportunity(
        address _asset,
        string memory _buyExchange,
        string memory _sellExchange,
        uint256 _buyPrice,
        uint256 _sellPrice,
        uint256 _buyVolume,
        uint256 _sellVolume,
        DetectionConfig memory _config
    ) internal {
        // Calculate maximum trade size based on available liquidity
        uint256 maxTradeSize = _buyVolume < _sellVolume ? _buyVolume : _sellVolume;
        maxTradeSize = maxTradeSize / 10; // Conservative estimate (10% of volume)

        // Calculate estimated profit with slippage
        (uint256 estimatedProfit, uint256 slippage) = this.calculateProfitWithSlippage(
            _asset,
            _buyExchange,
            _sellExchange,
            maxTradeSize
        );

        // Skip if slippage is too high
        if (slippage > _config.maxSlippageBps) {
            return;
        }

        // Calculate confidence score based on various factors
        uint256 confidence = _calculateConfidenceScore(
            _buyPrice,
            _sellPrice,
            _buyVolume,
            _sellVolume,
            slippage,
            _config
        );

        // Calculate risk score
        uint256 riskScore = _calculateRiskScore(slippage, _buyVolume, _sellVolume);

        // Determine if this is a high-frequency opportunity
        bool isHighFrequency = block.timestamp - lastDetectionRun <= HIGH_FREQUENCY_THRESHOLD;

        EnhancedArbitrageOpportunity memory opportunity = EnhancedArbitrageOpportunity({
            asset: _asset,
            buyExchange: _buyExchange,
            sellExchange: _sellExchange,
            buyPrice: _buyPrice,
            sellPrice: _sellPrice,
            priceDifference: ((_sellPrice - _buyPrice) * 10000) / _buyPrice,
            estimatedProfit: estimatedProfit,
            maxTradeSize: maxTradeSize,
            confidence: confidence,
            timeToExpiry: OPPORTUNITY_EXPIRY_TIME,
            riskScore: riskScore,
            timestamp: block.timestamp,
            isHighFrequency: isHighFrequency
        });

        // Only add if confidence is above minimum threshold
        if (confidence >= MIN_CONFIDENCE_SCORE) {
            // Limit number of opportunities per asset
            if (assetOpportunities[_asset].length >= MAX_OPPORTUNITIES_PER_ASSET) {
                // Remove oldest opportunity
                for (uint256 i = 0; i < assetOpportunities[_asset].length - 1; i++) {
                    assetOpportunities[_asset][i] = assetOpportunities[_asset][i + 1];
                }
                assetOpportunities[_asset].pop();
            }

            assetOpportunities[_asset].push(opportunity);
            activeOpportunities.push(opportunity);

            bytes32 opportunityId = keccak256(abi.encodePacked(
                _asset,
                _buyExchange,
                _sellExchange,
                block.timestamp
            ));

            emit ArbitrageOpportunityDetected(
                opportunityId,
                _asset,
                _buyExchange,
                _sellExchange,
                estimatedProfit,
                confidence,
                riskScore
            );
        }
    }

    /**
     * @dev Calculate confidence score for an arbitrage opportunity
     */
    function _calculateConfidenceScore(
        uint256 _buyPrice,
        uint256 _sellPrice,
        uint256 _buyVolume,
        uint256 _sellVolume,
        uint256 _slippage,
        DetectionConfig memory _config
    ) internal pure returns (uint256) {
        uint256 confidence = 10000; // Start with 100%

        // Reduce confidence based on price difference (too good to be true)
        uint256 priceDiff = ((_sellPrice - _buyPrice) * 10000) / _buyPrice;
        if (priceDiff > 500) { // > 5%
            confidence = confidence * 8000 / 10000; // Reduce by 20%
        }

        // Reduce confidence based on slippage
        if (_slippage > _config.maxSlippageBps / 2) {
            confidence = confidence * 9000 / 10000; // Reduce by 10%
        }

        // Reduce confidence based on volume imbalance
        uint256 volumeRatio = _buyVolume > _sellVolume ? 
            (_sellVolume * 10000) / _buyVolume : 
            (_buyVolume * 10000) / _sellVolume;
        
        if (volumeRatio < 5000) { // Less than 50% ratio
            confidence = confidence * 8500 / 10000; // Reduce by 15%
        }

        return confidence;
    }

    /**
     * @dev Calculate risk score for an arbitrage opportunity
     */
    function _calculateRiskScore(
        uint256 _slippage,
        uint256 _buyVolume,
        uint256 _sellVolume
    ) internal pure returns (uint256) {
        uint256 riskScore = 0;

        // Risk increases with slippage
        riskScore += _slippage / 10; // 1 risk point per 10 bps slippage

        // Risk increases with volume imbalance
        uint256 volumeRatio = _buyVolume > _sellVolume ? 
            (_sellVolume * 10000) / _buyVolume : 
            (_buyVolume * 10000) / _sellVolume;
        
        if (volumeRatio < 5000) {
            riskScore += 2000; // High risk for volume imbalance
        }

        return riskScore > 10000 ? 10000 : riskScore; // Cap at 100%
    }

    /**
     * @dev Calculate average price with slippage
     */
    function _calculateAveragePrice(
        uint256[] memory _prices,
        uint256[] memory _sizes,
        uint256 _amount,
        bool _isBuying
    ) internal pure returns (uint256 avgPrice, uint256 slippage) {
        if (_prices.length == 0 || _amount == 0) {
            return (0, 0);
        }

        uint256 remainingAmount = _amount;
        uint256 totalCost = 0;
        uint256 totalFilled = 0;
        uint256 bestPrice = _prices[0];

        for (uint256 i = 0; i < _prices.length && remainingAmount > 0; i++) {
            uint256 fillAmount = remainingAmount > _sizes[i] ? _sizes[i] : remainingAmount;
            totalCost += fillAmount * _prices[i];
            totalFilled += fillAmount;
            remainingAmount -= fillAmount;
        }

        if (totalFilled > 0) {
            avgPrice = totalCost / totalFilled;
            
            // Calculate slippage
            if (_isBuying) {
                slippage = avgPrice > bestPrice ? ((avgPrice - bestPrice) * 10000) / bestPrice : 0;
            } else {
                slippage = bestPrice > avgPrice ? ((bestPrice - avgPrice) * 10000) / bestPrice : 0;
            }
        }
    }

    /**
     * @dev Clean up expired opportunities for an asset
     */
    function _cleanupExpiredOpportunitiesForAsset(address _asset) internal {
        EnhancedArbitrageOpportunity[] storage opportunities = assetOpportunities[_asset];
        
        for (uint256 i = opportunities.length; i > 0; i--) {
            if (block.timestamp - opportunities[i-1].timestamp > OPPORTUNITY_EXPIRY_TIME) {
                bytes32 opportunityId = keccak256(abi.encodePacked(
                    _asset,
                    opportunities[i-1].buyExchange,
                    opportunities[i-1].sellExchange,
                    opportunities[i-1].timestamp
                ));
                
                emit OpportunityExpired(opportunityId, _asset, block.timestamp);
                
                // Remove expired opportunity
                for (uint256 j = i-1; j < opportunities.length - 1; j++) {
                    opportunities[j] = opportunities[j + 1];
                }
                opportunities.pop();
            }
        }
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
} 