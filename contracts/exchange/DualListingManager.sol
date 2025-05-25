// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title DualListingManager
 * @dev Enables simultaneous listing on traditional and digital exchanges
 * Addresses WEF report's recommendation for liquidity enhancement through cross-exchange integration
 * Supports arbitrage detection and automated price discovery mechanisms
 */
contract DualListingManager is Ownable, Pausable, ReentrancyGuard {
    using Math for uint256;

    // Exchange types supported by the platform
    enum ExchangeType { 
        TRADITIONAL,    // Traditional centralized exchanges (NYSE, NASDAQ, etc.)
        DIGITAL,        // Digital asset exchanges (Coinbase, Binance, etc.)
        DEX,           // Decentralized exchanges (Uniswap, SushiSwap, etc.)
        HYBRID         // Hybrid exchanges combining traditional and digital features
    }

    // Exchange information structure
    struct Exchange {
        string name;
        ExchangeType exchangeType;
        string jurisdiction;
        address oracleAddress;
        address apiEndpoint;        // For traditional exchanges, this would be an adapter contract
        uint256 minimumVolume;      // Minimum daily volume requirement
        uint256 listingFee;         // Fee for listing on this exchange
        bool isActive;
        bool supportsRealTimeData;
        uint256 lastPriceUpdate;
    }

    // Asset listing configuration
    struct AssetListing {
        address asset;
        string symbol;
        string name;
        Exchange[] exchanges;
        bool arbitrageEnabled;
        uint256 priceToleranceBps;  // Price difference tolerance in basis points
        uint256 minArbitrageAmount; // Minimum amount for arbitrage opportunities
        address[] authorizedArbitrageurs;
        uint256 totalVolume24h;
        uint256 lastArbitrageCheck;
        bool isActive;
    }

    // Price data structure for cross-exchange comparison
    struct PriceData {
        uint256 price;
        uint256 volume24h;
        uint256 timestamp;
        uint256 bid;
        uint256 ask;
        uint256 spread;             // Bid-ask spread in basis points
        bool isStale;               // Whether the price data is considered stale
    }

    // Arbitrage opportunity structure
    struct ArbitrageOpportunity {
        address asset;
        string buyExchange;         // Exchange to buy from (lower price)
        string sellExchange;        // Exchange to sell to (higher price)
        uint256 buyPrice;
        uint256 sellPrice;
        uint256 priceDifference;    // In basis points
        uint256 potentialProfit;    // Estimated profit in wei
        uint256 maxAmount;          // Maximum arbitrageable amount
        uint256 timestamp;
        bool isActive;
    }

    // State variables
    mapping(address => AssetListing) public assetListings;
    mapping(string => Exchange) public exchanges;
    mapping(address => mapping(string => PriceData)) public assetPrices; // asset -> exchange -> price data
    mapping(address => bool) public authorizedArbitrageurs;
    mapping(bytes32 => ArbitrageOpportunity) public arbitrageOpportunities;
    
    address[] public listedAssets;
    string[] public registeredExchanges;
    bytes32[] public activeArbitrageOpportunities;
    
    // Configuration parameters
    uint256 public constant MAX_PRICE_STALENESS = 300; // 5 minutes
    uint256 public constant MIN_ARBITRAGE_PROFIT_BPS = 50; // 0.5% minimum profit
    uint256 public constant ARBITRAGE_CHECK_INTERVAL = 60; // 1 minute
    uint256 public defaultPriceToleranceBps = 100; // 1% default tolerance
    
    // Fee configuration
    uint256 public platformFeeRate = 25; // 0.25% platform fee
    address public feeCollector;
    uint256 public totalFeesCollected;

    // Events
    event ExchangeRegistered(
        string indexed exchangeName,
        ExchangeType exchangeType,
        string jurisdiction,
        address oracleAddress
    );
    
    event AssetListed(
        address indexed asset,
        string symbol,
        string[] exchanges,
        bool arbitrageEnabled
    );
    
    event PriceUpdated(
        address indexed asset,
        string indexed exchangeName,
        uint256 price,
        uint256 volume24h,
        uint256 timestamp
    );
    
    event ArbitrageOpportunityDetected(
        bytes32 indexed opportunityId,
        address indexed asset,
        string buyExchange,
        string sellExchange,
        uint256 priceDifference,
        uint256 potentialProfit
    );
    
    event ArbitrageExecuted(
        bytes32 indexed opportunityId,
        address indexed arbitrageur,
        address indexed asset,
        uint256 amount,
        uint256 profit
    );
    
    event CrossExchangeVolumeUpdated(
        address indexed asset,
        uint256 totalVolume24h,
        uint256 timestamp
    );

    // Modifiers
    modifier onlyAuthorizedArbitrageur() {
        require(authorizedArbitrageurs[msg.sender], "Not authorized arbitrageur");
        _;
    }

    modifier validExchange(string memory exchangeName) {
        require(exchanges[exchangeName].isActive, "Exchange not active");
        _;
    }

    modifier validAsset(address asset) {
        require(assetListings[asset].isActive, "Asset not listed");
        _;
    }

    constructor(address _feeCollector) {
        require(_feeCollector != address(0), "Invalid fee collector");
        feeCollector = _feeCollector;
    }

    /**
     * @dev Register a new exchange for dual listing
     */
    function registerExchange(
        string memory _name,
        ExchangeType _exchangeType,
        string memory _jurisdiction,
        address _oracleAddress,
        address _apiEndpoint,
        uint256 _minimumVolume,
        uint256 _listingFee,
        bool _supportsRealTimeData
    ) external onlyOwner {
        require(bytes(_name).length > 0, "Exchange name required");
        require(_oracleAddress != address(0), "Oracle address required");
        require(!exchanges[_name].isActive, "Exchange already registered");

        exchanges[_name] = Exchange({
            name: _name,
            exchangeType: _exchangeType,
            jurisdiction: _jurisdiction,
            oracleAddress: _oracleAddress,
            apiEndpoint: _apiEndpoint,
            minimumVolume: _minimumVolume,
            listingFee: _listingFee,
            isActive: true,
            supportsRealTimeData: _supportsRealTimeData,
            lastPriceUpdate: block.timestamp
        });

        registeredExchanges.push(_name);

        emit ExchangeRegistered(_name, _exchangeType, _jurisdiction, _oracleAddress);
    }

    /**
     * @dev List an asset on multiple exchanges simultaneously
     */
    function listAssetOnExchanges(
        address _asset,
        string memory _symbol,
        string memory _name,
        string[] memory _exchangeNames,
        bool _arbitrageEnabled,
        uint256 _priceToleranceBps,
        uint256 _minArbitrageAmount
    ) external onlyOwner {
        require(_asset != address(0), "Invalid asset address");
        require(bytes(_symbol).length > 0, "Symbol required");
        require(_exchangeNames.length > 0, "At least one exchange required");
        require(!assetListings[_asset].isActive, "Asset already listed");

        // Validate all exchanges exist and are active
        Exchange[] memory selectedExchanges = new Exchange[](_exchangeNames.length);
        for (uint256 i = 0; i < _exchangeNames.length; i++) {
            require(exchanges[_exchangeNames[i]].isActive, "Exchange not active");
            selectedExchanges[i] = exchanges[_exchangeNames[i]];
        }

        assetListings[_asset] = AssetListing({
            asset: _asset,
            symbol: _symbol,
            name: _name,
            exchanges: selectedExchanges,
            arbitrageEnabled: _arbitrageEnabled,
            priceToleranceBps: _priceToleranceBps > 0 ? _priceToleranceBps : defaultPriceToleranceBps,
            minArbitrageAmount: _minArbitrageAmount,
            authorizedArbitrageurs: new address[](0),
            totalVolume24h: 0,
            lastArbitrageCheck: block.timestamp,
            isActive: true
        });

        listedAssets.push(_asset);

        emit AssetListed(_asset, _symbol, _exchangeNames, _arbitrageEnabled);
    }

    /**
     * @dev Update price data for an asset on a specific exchange
     */
    function updateAssetPrice(
        address _asset,
        string memory _exchangeName,
        uint256 _price,
        uint256 _volume24h,
        uint256 _bid,
        uint256 _ask
    ) external validExchange(_exchangeName) validAsset(_asset) {
        require(_price > 0, "Price must be greater than zero");
        require(
            msg.sender == exchanges[_exchangeName].oracleAddress || 
            msg.sender == owner(),
            "Unauthorized price update"
        );

        uint256 spread = _ask > _bid ? ((_ask - _bid) * 10000) / _bid : 0;

        assetPrices[_asset][_exchangeName] = PriceData({
            price: _price,
            volume24h: _volume24h,
            timestamp: block.timestamp,
            bid: _bid,
            ask: _ask,
            spread: spread,
            isStale: false
        });

        exchanges[_exchangeName].lastPriceUpdate = block.timestamp;

        emit PriceUpdated(_asset, _exchangeName, _price, _volume24h, block.timestamp);

        // Check for arbitrage opportunities if enabled
        if (assetListings[_asset].arbitrageEnabled) {
            _checkArbitrageOpportunities(_asset);
        }
    }

    /**
     * @dev Detect arbitrage opportunities for a specific asset
     */
    function detectArbitrageOpportunity(
        address _asset
    ) external view validAsset(_asset) returns (bool hasOpportunity, ArbitrageOpportunity memory opportunity) {
        AssetListing memory listing = assetListings[_asset];
        require(listing.arbitrageEnabled, "Arbitrage not enabled for asset");

        uint256 maxPrice = 0;
        uint256 minPrice = type(uint256).max;
        string memory buyExchange;
        string memory sellExchange;

        // Find highest and lowest prices across exchanges
        for (uint256 i = 0; i < listing.exchanges.length; i++) {
            string memory exchangeName = listing.exchanges[i].name;
            PriceData memory priceData = assetPrices[_asset][exchangeName];
            
            // Skip stale prices
            if (block.timestamp - priceData.timestamp > MAX_PRICE_STALENESS) {
                continue;
            }

            if (priceData.price > maxPrice) {
                maxPrice = priceData.price;
                sellExchange = exchangeName;
            }
            if (priceData.price < minPrice) {
                minPrice = priceData.price;
                buyExchange = exchangeName;
            }
        }

        if (maxPrice > 0 && minPrice < type(uint256).max && maxPrice > minPrice) {
            uint256 priceDifference = ((maxPrice - minPrice) * 10000) / minPrice;
            
            if (priceDifference > listing.priceToleranceBps) {
                uint256 potentialProfit = _calculateArbitrageProfit(
                    _asset, 
                    minPrice, 
                    maxPrice, 
                    listing.minArbitrageAmount
                );

                if (potentialProfit > 0) {
                    opportunity = ArbitrageOpportunity({
                        asset: _asset,
                        buyExchange: buyExchange,
                        sellExchange: sellExchange,
                        buyPrice: minPrice,
                        sellPrice: maxPrice,
                        priceDifference: priceDifference,
                        potentialProfit: potentialProfit,
                        maxAmount: listing.minArbitrageAmount,
                        timestamp: block.timestamp,
                        isActive: true
                    });
                    
                    hasOpportunity = true;
                }
            }
        }

        return (hasOpportunity, opportunity);
    }

    /**
     * @dev Execute arbitrage opportunity
     */
    function executeArbitrage(
        bytes32 _opportunityId,
        uint256 _amount
    ) external onlyAuthorizedArbitrageur nonReentrant {
        ArbitrageOpportunity storage opportunity = arbitrageOpportunities[_opportunityId];
        require(opportunity.isActive, "Opportunity not active");
        require(_amount >= assetListings[opportunity.asset].minArbitrageAmount, "Amount below minimum");
        require(block.timestamp - opportunity.timestamp <= 300, "Opportunity expired"); // 5 minutes

        // Calculate actual profit after fees
        uint256 grossProfit = (opportunity.sellPrice - opportunity.buyPrice) * _amount / 1e18;
        uint256 platformFee = (grossProfit * platformFeeRate) / 10000;
        uint256 netProfit = grossProfit - platformFee;

        require(netProfit > 0, "No profit after fees");

        // Mark opportunity as executed
        opportunity.isActive = false;

        // Update fee collection
        totalFeesCollected += platformFee;

        emit ArbitrageExecuted(_opportunityId, msg.sender, opportunity.asset, _amount, netProfit);
    }

    /**
     * @dev Get cross-exchange price comparison for an asset
     */
    function getCrossExchangePrices(
        address _asset
    ) external view validAsset(_asset) returns (
        string[] memory exchangeNames,
        uint256[] memory prices,
        uint256[] memory volumes,
        uint256[] memory spreads,
        uint256[] memory timestamps
    ) {
        AssetListing memory listing = assetListings[_asset];
        uint256 exchangeCount = listing.exchanges.length;

        exchangeNames = new string[](exchangeCount);
        prices = new uint256[](exchangeCount);
        volumes = new uint256[](exchangeCount);
        spreads = new uint256[](exchangeCount);
        timestamps = new uint256[](exchangeCount);

        for (uint256 i = 0; i < exchangeCount; i++) {
            string memory exchangeName = listing.exchanges[i].name;
            PriceData memory priceData = assetPrices[_asset][exchangeName];

            exchangeNames[i] = exchangeName;
            prices[i] = priceData.price;
            volumes[i] = priceData.volume24h;
            spreads[i] = priceData.spread;
            timestamps[i] = priceData.timestamp;
        }
    }

    /**
     * @dev Authorize an arbitrageur
     */
    function authorizeArbitrageur(address _arbitrageur) external onlyOwner {
        require(_arbitrageur != address(0), "Invalid arbitrageur address");
        authorizedArbitrageurs[_arbitrageur] = true;
    }

    /**
     * @dev Revoke arbitrageur authorization
     */
    function revokeArbitrageur(address _arbitrageur) external onlyOwner {
        authorizedArbitrageurs[_arbitrageur] = false;
    }

    /**
     * @dev Update platform fee rate
     */
    function updatePlatformFeeRate(uint256 _newFeeRate) external onlyOwner {
        require(_newFeeRate <= 500, "Fee rate cannot exceed 5%"); // Max 5%
        platformFeeRate = _newFeeRate;
    }

    /**
     * @dev Get asset listing details
     */
    function getAssetListing(address _asset) external view returns (AssetListing memory) {
        return assetListings[_asset];
    }

    /**
     * @dev Get all listed assets
     */
    function getListedAssets() external view returns (address[] memory) {
        return listedAssets;
    }

    /**
     * @dev Get all registered exchanges
     */
    function getRegisteredExchanges() external view returns (string[] memory) {
        return registeredExchanges;
    }

    // Internal functions

    /**
     * @dev Check for arbitrage opportunities for an asset
     */
    function _checkArbitrageOpportunities(address _asset) internal {
        AssetListing storage listing = assetListings[_asset];
        
        // Rate limit arbitrage checks
        if (block.timestamp - listing.lastArbitrageCheck < ARBITRAGE_CHECK_INTERVAL) {
            return;
        }

        listing.lastArbitrageCheck = block.timestamp;

        (bool hasOpportunity, ArbitrageOpportunity memory opportunity) = this.detectArbitrageOpportunity(_asset);
        
        if (hasOpportunity) {
            bytes32 opportunityId = keccak256(abi.encodePacked(
                _asset,
                opportunity.buyExchange,
                opportunity.sellExchange,
                block.timestamp
            ));

            arbitrageOpportunities[opportunityId] = opportunity;
            activeArbitrageOpportunities.push(opportunityId);

            emit ArbitrageOpportunityDetected(
                opportunityId,
                _asset,
                opportunity.buyExchange,
                opportunity.sellExchange,
                opportunity.priceDifference,
                opportunity.potentialProfit
            );
        }
    }

    /**
     * @dev Calculate potential arbitrage profit
     */
    function _calculateArbitrageProfit(
        address _asset,
        uint256 _buyPrice,
        uint256 _sellPrice,
        uint256 _amount
    ) internal view returns (uint256) {
        if (_sellPrice <= _buyPrice) {
            return 0;
        }

        uint256 grossProfit = (_sellPrice - _buyPrice) * _amount / 1e18;
        uint256 platformFee = (grossProfit * platformFeeRate) / 10000;
        
        // Estimate gas costs and exchange fees (simplified)
        uint256 estimatedCosts = grossProfit / 100; // 1% for costs
        
        if (grossProfit > platformFee + estimatedCosts) {
            return grossProfit - platformFee - estimatedCosts;
        }
        
        return 0;
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
     * @dev Withdraw collected fees
     */
    function withdrawFees() external onlyOwner {
        require(totalFeesCollected > 0, "No fees to withdraw");
        uint256 amount = totalFeesCollected;
        totalFeesCollected = 0;
        payable(feeCollector).transfer(amount);
    }
} 