// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "../interfaces/IYieldOptimizer.sol";
import "../interfaces/IAssetFactory.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title YieldOptimizer
 * @dev Implementation of the Yield Optimizer contract that manages yield strategies
 * including auto-compounding, portfolio rebalancing, and yield farming.
 * 
 * Security Enhancements (v0.9.7):
 * - Added custom errors for gas-efficient error handling
 * - Enhanced role-based access control in critical functions
 * - Improved input validation with custom errors
 * - Added additional security checks for parameter validation
 * - Applied checks-effects-interactions pattern for better security
 */
contract YieldOptimizer is IYieldOptimizer, AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;
    
    // Roles
    bytes32 public constant STRATEGY_CREATOR_ROLE = keccak256("STRATEGY_CREATOR_ROLE");
    bytes32 public constant PERFORMANCE_UPDATER_ROLE = keccak256("PERFORMANCE_UPDATER_ROLE");
    bytes32 public constant AUTO_COMPOUNDER_ROLE = keccak256("AUTO_COMPOUNDER_ROLE");
    
    // Custom errors for gas efficiency
    error Unauthorized(address caller, bytes32 requiredRole);
    error InvalidZeroAddress(string paramName);
    error EmptyInput(string paramName);
    error InvalidParameter(string paramName, string reason);
    error StrategyNotFound(bytes32 strategyId);
    error UserStrategyNotFound(bytes32 userStrategyId);
    error NotStrategyOwner(address caller, address owner);
    error NotUserStrategyOwner(address caller, address owner);
    error StrategyNotActive(bytes32 strategyId);
    error UserStrategyNotActive(bytes32 userStrategyId);
    error PerformanceFeeTooHigh(uint256 fee, uint256 maxFee);
    error AllocationMismatch(uint256 total);
    error AssetNotSupported(address asset);
    error CompoundFrequencyTooLow(uint256 provided, uint256 minimum);
    error ArrayLengthMismatch(uint256 assetsLength, uint256 allocationsLength);
    error InvalidStrategy(bytes32 strategyId, string reason);
    error ArraysMustMatch();
    
    // Asset factory reference
    IAssetFactory public assetFactory;
    
    // Strategy storage
    mapping(bytes32 => StrategyConfig) private _strategyConfigs;
    mapping(RiskLevel => bytes32[]) private _strategiesByRiskLevel;
    mapping(address => bytes32[]) private _strategiesByCreator;
    mapping(bool => bytes32[]) private _strategiesByVisibility; // true = public strategies
    mapping(IAssetFactory.AssetClass => bytes32[]) private _strategiesByAssetClass;
    mapping(YieldSourceType => bytes32[]) private _strategiesByYieldSource;
    bytes32[] private _allStrategyIds;
    
    // User strategy storage
    mapping(bytes32 => UserStrategy) private _userStrategies;
    mapping(address => bytes32[]) private _userStrategyIds;
    mapping(bytes32 => bytes32[]) private _strategyUsers; // strategy ID -> user strategy IDs
    
    // Performance metrics storage
    mapping(bytes32 => PerformanceMetrics) private _performanceMetrics;
    
    // Counters for generating unique IDs
    Counters.Counter private _strategyIdCounter;
    Counters.Counter private _userStrategyIdCounter;
    
    // Protocol fee (in basis points, e.g., 500 = 5%)
    uint16 public protocolFee = 500;
    address public protocolFeeRecipient;
    
    // Constants
    uint256 private constant MAX_PERFORMANCE_FEE = 5000; // 50%
    uint256 private constant TOTAL_ALLOCATION_BASIS_POINTS = 10000; // 100%
    uint256 private constant MIN_COMPOUND_FREQUENCY = 1 hours;
    
    /**
     * @dev Constructor
     * @param assetFactoryAddress Address of the AssetFactory contract
     * @param feeRecipient Address to receive protocol fees
     */
    constructor(address assetFactoryAddress, address feeRecipient) {
        if (assetFactoryAddress == address(0)) {
            revert InvalidZeroAddress("assetFactoryAddress");
        }
        if (feeRecipient == address(0)) {
            revert InvalidZeroAddress("feeRecipient");
        }
        
        assetFactory = IAssetFactory(assetFactoryAddress);
        protocolFeeRecipient = feeRecipient;
        
        // Setup roles
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(STRATEGY_CREATOR_ROLE, msg.sender);
        _setupRole(PERFORMANCE_UPDATER_ROLE, msg.sender);
        _setupRole(AUTO_COMPOUNDER_ROLE, msg.sender);
    }
    
    /**
     * @dev Creates a new yield strategy
     * @param name Name of the strategy
     * @param description Description of the strategy
     * @param riskLevel Risk level of the strategy
     * @param isPublic Whether the strategy is publicly available
     * @param performanceFee Performance fee in basis points
     * @param metadataURI URI pointing to the strategy metadata
     * @param supportedSources Array of supported yield source types
     * @param supportedAssetClasses Array of supported asset classes
     * @return strategyId ID of the created strategy
     */
    function createStrategy(
        string calldata name,
        string calldata description,
        RiskLevel riskLevel,
        bool isPublic,
        uint256 performanceFee,
        string calldata metadataURI,
        YieldSourceType[] calldata supportedSources,
        IAssetFactory.AssetClass[] calldata supportedAssetClasses
    ) external override nonReentrant returns (bytes32 strategyId) {
        // Check role authorization
        if (!hasRole(STRATEGY_CREATOR_ROLE, msg.sender)) {
            revert Unauthorized(msg.sender, STRATEGY_CREATOR_ROLE);
        }
        
        // Validate input parameters
        if (bytes(name).length == 0) {
            revert EmptyInput("name");
        }
        if (bytes(description).length == 0) {
            revert EmptyInput("description");
        }
        if (bytes(metadataURI).length == 0) {
            revert EmptyInput("metadataURI");
        }
        if (performanceFee > MAX_PERFORMANCE_FEE) {
            revert PerformanceFeeTooHigh(performanceFee, MAX_PERFORMANCE_FEE);
        }
        if (supportedSources.length == 0) {
            revert EmptyInput("supportedSources");
        }
        if (supportedAssetClasses.length == 0) {
            revert EmptyInput("supportedAssetClasses");
        }
        
        // Generate unique strategy ID
        _strategyIdCounter.increment();
        strategyId = keccak256(abi.encodePacked(
            _strategyIdCounter.current(),
            msg.sender,
            name,
            block.timestamp
        ));
        
        // Create strategy configuration - effects before interactions pattern
        StrategyConfig storage config = _strategyConfigs[strategyId];
        config.strategyId = strategyId;
        config.name = name;
        config.description = description;
        config.creator = msg.sender;
        config.riskLevel = riskLevel;
        config.isPublic = isPublic;
        config.isActive = true;
        config.creationDate = block.timestamp;
        config.performanceFee = performanceFee;
        config.metadataURI = metadataURI;
        
        // Store supported sources and asset classes
        for (uint256 i = 0; i < supportedSources.length; i++) {
            config.supportedSources.push(supportedSources[i]);
            _strategiesByYieldSource[supportedSources[i]].push(strategyId);
        }
        
        for (uint256 i = 0; i < supportedAssetClasses.length; i++) {
            config.supportedAssetClasses.push(supportedAssetClasses[i]);
            _strategiesByAssetClass[supportedAssetClasses[i]].push(strategyId);
        }
        
        // Add to indexes
        _allStrategyIds.push(strategyId);
        _strategiesByRiskLevel[riskLevel].push(strategyId);
        _strategiesByCreator[msg.sender].push(strategyId);
        _strategiesByVisibility[isPublic].push(strategyId);
        
        // Initialize performance metrics
        PerformanceMetrics storage metrics = _performanceMetrics[strategyId];
        metrics.strategyId = strategyId;
        metrics.updateTimestamp = block.timestamp;
        
        emit StrategyCreated(strategyId, msg.sender, name, riskLevel, isPublic);
        
        return strategyId;
    }
    
    /**
     * @dev Updates an existing strategy
     * @param strategyId ID of the strategy to update
     * @param isPublic New public status
     * @param isActive New active status
     * @param performanceFee New performance fee in basis points
     * @param metadataURI New metadata URI
     * @return success Boolean indicating if the update was successful
     */
    function updateStrategy(
        bytes32 strategyId,
        bool isPublic,
        bool isActive,
        uint256 performanceFee,
        string calldata metadataURI
    ) external override nonReentrant returns (bool success) {
        StrategyConfig storage config = _strategyConfigs[strategyId];
        
        // Check strategy exists
        if (config.strategyId != strategyId) {
            revert StrategyNotFound(strategyId);
        }
        
        // Check authorization
        if (config.creator != msg.sender && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert NotStrategyOwner(msg.sender, config.creator);
        }
        
        // Validate input parameters
        if (performanceFee > MAX_PERFORMANCE_FEE) {
            revert PerformanceFeeTooHigh(performanceFee, MAX_PERFORMANCE_FEE);
        }
        if (bytes(metadataURI).length == 0) {
            revert EmptyInput("metadataURI");
        }
        
        // Update public visibility in indexes if changed - effects before interactions pattern
        if (config.isPublic != isPublic) {
            // Remove from old visibility index
            _removeFromArray(_strategiesByVisibility[config.isPublic], strategyId);
            
            // Add to new visibility index
            _strategiesByVisibility[isPublic].push(strategyId);
            
            // Update strategy
            config.isPublic = isPublic;
        }
        
        // Update other fields
        config.isActive = isActive;
        config.performanceFee = performanceFee;
        config.metadataURI = metadataURI;
        
        emit StrategyUpdated(strategyId, isPublic, isActive, performanceFee, metadataURI);
        
        return true;
    }
    
    /**
     * @dev Applies a strategy to a user's assets
     * @param strategyId ID of the strategy to apply
     * @param assets Array of asset addresses to include in the strategy
     * @param allocationPercentages Percentage allocation for each asset in basis points
     * @param autoCompound Whether to automatically compound yields
     * @param compoundFrequency Frequency of compounding in seconds
     * @return userStrategyId ID of the user's strategy application
     */
    function applyStrategy(
        bytes32 strategyId,
        address[] calldata assets,
        uint256[] calldata allocationPercentages,
        bool autoCompound,
        uint256 compoundFrequency
    ) external override nonReentrant returns (bytes32 userStrategyId) {
        // Validate strategy exists and is active
        StrategyConfig storage config = _strategyConfigs[strategyId];
        if (config.strategyId != strategyId) {
            revert StrategyNotFound(strategyId);
        }
        if (!config.isActive) {
            revert StrategyNotActive(strategyId);
        }
        
        // Check authorization
        if (!config.isPublic && config.creator != msg.sender && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert InvalidStrategy(strategyId, "strategy is not public and caller is not creator or admin");
        }
        
        // Validate assets array
        if (assets.length == 0) {
            revert EmptyInput("assets");
        }
        
        // Validate assets and allocations arrays match
        if (assets.length != allocationPercentages.length) {
            revert ArrayLengthMismatch(assets.length, allocationPercentages.length);
        }
        
        // Validate allocation percentages sum to 100%
        uint256 totalAllocation = 0;
        for (uint256 i = 0; i < allocationPercentages.length; i++) {
            totalAllocation += allocationPercentages[i];
        }
        if (totalAllocation != TOTAL_ALLOCATION_BASIS_POINTS) {
            revert AllocationMismatch(totalAllocation);
        }
        
        // Validate auto-compound frequency
        if (autoCompound && compoundFrequency < MIN_COMPOUND_FREQUENCY) {
            revert CompoundFrequencyTooLow(compoundFrequency, MIN_COMPOUND_FREQUENCY);
        }
        
        // Validate assets
        for (uint256 i = 0; i < assets.length; i++) {
            if (assets[i] == address(0)) {
                revert InvalidZeroAddress("asset");
            }
            if (!assetFactory.isAsset(assets[i])) {
                revert AssetNotSupported(assets[i]);
            }
            
            // In a real implementation, we would also check asset compatibility with strategy
        }
        
        // Generate unique user strategy ID
        _userStrategyIdCounter.increment();
        userStrategyId = keccak256(abi.encodePacked(
            _userStrategyIdCounter.current(),
            strategyId,
            msg.sender,
            block.timestamp
        ));
        
        // Create user strategy - effects before interactions pattern
        UserStrategy storage userStrategy = _userStrategies[userStrategyId];
        userStrategy.userStrategyId = userStrategyId;
        userStrategy.strategyId = strategyId;
        userStrategy.user = msg.sender;
        userStrategy.assets = assets;
        userStrategy.allocationPercentages = allocationPercentages;
        userStrategy.startDate = block.timestamp;
        userStrategy.lastHarvestDate = block.timestamp;
        userStrategy.autoCompound = autoCompound;
        userStrategy.compoundFrequency = compoundFrequency;
        userStrategy.isActive = true;
        
        // Calculate total value of assets
        userStrategy.totalValue = _calculateTotalValue(assets, allocationPercentages);
        
        // Add to indexes
        _userStrategyIds[msg.sender].push(userStrategyId);
        _strategyUsers[strategyId].push(userStrategyId);
        
        // Update performance metrics
        PerformanceMetrics storage metrics = _performanceMetrics[strategyId];
        metrics.totalUsers += 1;
        metrics.totalValue += userStrategy.totalValue;
        metrics.updateTimestamp = block.timestamp;
        
        emit StrategyApplied(strategyId, userStrategyId, msg.sender, assets, allocationPercentages, autoCompound, compoundFrequency);
        
        return userStrategyId;
    }
    
    /**
     * @dev Updates a user's strategy application
     * @param userStrategyId ID of the user strategy to update
     * @param assets New array of asset addresses
     * @param allocationPercentages New percentage allocation for each asset
     * @param autoCompound New auto-compound setting
     * @param compoundFrequency New compounding frequency
     * @param isActive New active status
     * @return success Boolean indicating if the update was successful
     */
    function updateUserStrategy(
        bytes32 userStrategyId,
        address[] calldata assets,
        uint256[] calldata allocationPercentages,
        bool autoCompound,
        uint256 compoundFrequency,
        bool isActive
    ) external override nonReentrant returns (bool success) {
        // Validate user strategy exists
        UserStrategy storage userStrategy = _userStrategies[userStrategyId];
        if (userStrategy.userStrategyId != userStrategyId) {
            revert UserStrategyNotFound(userStrategyId);
        }
        
        // Validate ownership
        if (userStrategy.user != msg.sender) {
            revert NotUserStrategyOwner(msg.sender, userStrategy.user);
        }
        
        // Harvest any pending yields before updating - interactions before effects
        // This is safe because we're already checking ownership above
        (uint256 yieldAmount, uint256 feeAmount) = _harvestYield(userStrategyId, msg.sender);
        
        // Validate assets array
        if (assets.length == 0) {
            revert EmptyInput("assets");
        }
        
        // Validate assets and allocations arrays match
        if (assets.length != allocationPercentages.length) {
            revert ArrayLengthMismatch(assets.length, allocationPercentages.length);
        }
        
        // Validate allocation percentages sum to 100%
        uint256 totalAllocation = 0;
        for (uint256 i = 0; i < allocationPercentages.length; i++) {
            totalAllocation += allocationPercentages[i];
        }
        if (totalAllocation != TOTAL_ALLOCATION_BASIS_POINTS) {
            revert AllocationMismatch(totalAllocation);
        }
        
        // Validate auto-compound frequency
        if (autoCompound && compoundFrequency < MIN_COMPOUND_FREQUENCY) {
            revert CompoundFrequencyTooLow(compoundFrequency, MIN_COMPOUND_FREQUENCY);
        }
        
        // Validate assets
        bytes32 strategyId = userStrategy.strategyId;
        for (uint256 i = 0; i < assets.length; i++) {
            if (assets[i] == address(0)) {
                revert InvalidZeroAddress("asset");
            }
            if (!assetFactory.isAsset(assets[i])) {
                revert AssetNotSupported(assets[i]);
            }
            // In a real implementation, we would also check asset compatibility with strategy
        }
        
        // Update performance metrics - effects after interactions
        PerformanceMetrics storage metrics = _performanceMetrics[strategyId];
        metrics.totalValue -= userStrategy.totalValue;
        
        // Update user strategy
        userStrategy.assets = assets;
        userStrategy.allocationPercentages = allocationPercentages;
        userStrategy.totalValue = _calculateTotalValue(assets, allocationPercentages);
        userStrategy.autoCompound = autoCompound;
        userStrategy.compoundFrequency = compoundFrequency;
        
        // Handle active status change
        bool wasActive = userStrategy.isActive;
        userStrategy.isActive = isActive;
        userStrategy.lastHarvestDate = block.timestamp;
        
        // Update performance metrics based on active status change
        metrics.totalValue += userStrategy.totalValue;
        if (!wasActive && isActive) {
            metrics.totalUsers += 1;
        } else if (wasActive && !isActive) {
            metrics.totalUsers -= 1;
        }
        metrics.updateTimestamp = block.timestamp;
        
        emit UserStrategyUpdated(userStrategyId, msg.sender, assets, allocationPercentages, autoCompound, compoundFrequency, isActive);
        
        return true;
    }
    
    /**
     * @dev Harvests yields from a user's strategy
     * @param userStrategyId ID of the user strategy to harvest
     * @param recipient Address to receive the harvested yields
     * @return yieldAmount Amount of yield harvested
     * @return feeAmount Amount of fees paid
     */
    function harvestYield(
        bytes32 userStrategyId,
        address recipient
    ) external override nonReentrant returns (
        uint256 yieldAmount,
        uint256 feeAmount
    ) {
        // Validate user strategy exists and is active
        UserStrategy storage userStrategy = _userStrategies[userStrategyId];
        if (userStrategy.userStrategyId != userStrategyId) {
            revert UserStrategyNotFound(userStrategyId);
        }
        if (userStrategy.user != msg.sender) {
            revert NotUserStrategyOwner(msg.sender, userStrategy.user);
        }
        if (!userStrategy.isActive) {
            revert UserStrategyNotActive(userStrategyId);
        }
        if (recipient == address(0)) {
            revert InvalidZeroAddress("recipient");
        }
        
        return _harvestYield(userStrategyId, recipient);
    }
    
    /**
     * @dev Internal function to harvest yields
     * @param userStrategyId ID of the user strategy to harvest
     * @param recipient Address to receive the harvested yields
     * @return yieldAmount Amount of yield harvested
     * @return feeAmount Amount of fees paid
     */
    function _harvestYield(
        bytes32 userStrategyId,
        address recipient
    ) internal returns (
        uint256 yieldAmount,
        uint256 feeAmount
    ) {
        UserStrategy storage userStrategy = _userStrategies[userStrategyId];
        bytes32 strategyId = userStrategy.strategyId;
        StrategyConfig storage config = _strategyConfigs[strategyId];
        
        // Calculate pending yield
        (yieldAmount, feeAmount) = _calculateYield(userStrategyId);
        
        if (yieldAmount > 0) {
            // Update user strategy - effects before interactions pattern
            userStrategy.totalYield += yieldAmount;
            userStrategy.totalFeesPaid += feeAmount;
            userStrategy.lastHarvestDate = block.timestamp;
            
            // Process fees
            uint256 strategyFee = (feeAmount * config.performanceFee) / (config.performanceFee + protocolFee);
            uint256 protocolFeeAmount = feeAmount - strategyFee;
            
            // In a real implementation, we would transfer tokens
            // Distribute fees - in a real implementation, we would transfer tokens
            // but for simplicity, we'll just track the amounts
            
            // Update performance metrics
            PerformanceMetrics storage metrics = _performanceMetrics[strategyId];
            metrics.totalYield += yieldAmount;
            metrics.updateTimestamp = block.timestamp;
            
            emit StrategyHarvested(userStrategyId, userStrategy.user, yieldAmount, feeAmount, false);
        }
        
        return (yieldAmount, feeAmount);
    }
    
    /**
     * @dev Helper function to remove an item from an array
     * @param array The array to remove from
     * @param value The value to remove
     * @return found Whether the value was found and removed
     */
    function _removeFromArray(bytes32[] storage array, bytes32 value) internal returns (bool found) {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == value) {
                // Move the last element to the position of the element to delete
                array[i] = array[array.length - 1];
                // Remove the last element
                array.pop();
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Calculate the total value of assets
     * @param assets Array of asset addresses
     * @param allocationPercentages Array of allocation percentages
     * @return totalValue Total value of assets
     */
    function _calculateTotalValue(
        address[] memory assets,
        uint256[] memory allocationPercentages
    ) internal view returns (uint256 totalValue) {
        // Validate inputs
        if (assets.length != allocationPercentages.length) {
            revert ArraysMustMatch();
        }
        
        // In a real implementation, we would fetch token balances and prices
        // For simplicity, we'll return a dummy value
        return 1000 * 10**18; // 1000 USD in wei
    }
    
    /**
     * @dev Calculate yield and fees for a user strategy
     * @param userStrategyId ID of the user strategy
     * @return yieldAmount Amount of yield
     * @return feeAmount Amount of fees
     */
    function _calculateYield(
        bytes32 userStrategyId
    ) internal view returns (
        uint256 yieldAmount,
        uint256 feeAmount
    ) {
        UserStrategy storage userStrategy = _userStrategies[userStrategyId];
        
        // Ensure strategy exists
        if (userStrategy.userStrategyId != userStrategyId) {
            revert UserStrategyNotFound(userStrategyId);
        }
        
        bytes32 strategyId = userStrategy.strategyId;
        StrategyConfig storage config = _strategyConfigs[strategyId];
        
        // Time since last harvest
        uint256 timeElapsed = block.timestamp - userStrategy.lastHarvestDate;
        
        // In a real implementation, we would calculate actual yield based on the strategy logic
        // For simplicity, we'll use a dummy calculation
        
        // Dummy APY based on risk level
        uint256 apy;
        if (config.riskLevel == RiskLevel.CONSERVATIVE) {
            apy = 500; // 5% APY
        } else if (config.riskLevel == RiskLevel.MODERATE) {
            apy = 1000; // 10% APY
        } else if (config.riskLevel == RiskLevel.AGGRESSIVE) {
            apy = 2000; // 20% APY
        } else {
            apy = 800; // 8% APY for custom
        }
        
        // Calculate yield based on APY, time elapsed, and total value
        // yield = principal * APY * timeElapsed / (365 days)
        yieldAmount = (userStrategy.totalValue * apy * timeElapsed) / (10000 * 365 days);
        
        // Calculate fees based on yield
        uint256 totalFeePercent = config.performanceFee + protocolFee;
        feeAmount = (yieldAmount * totalFeePercent) / 10000;
        
        // Adjust yield amount to exclude fees
        yieldAmount = yieldAmount - feeAmount;
        
        return (yieldAmount, feeAmount);
    }
    
    /**
     * @dev Triggers auto-compounding for eligible strategies
     * @param userStrategyIds Array of user strategy IDs to compound
     * @return compoundedCount Number of strategies successfully compounded
     */
    function triggerAutoCompound(
        bytes32[] calldata userStrategyIds
    ) external override nonReentrant returns (uint256 compoundedCount) {
        require(hasRole(AUTO_COMPOUNDER_ROLE, msg.sender), "YieldOptimizer: must have auto compounder role");
        
        compoundedCount = 0;
        
        for (uint256 i = 0; i < userStrategyIds.length; i++) {
            bytes32 userStrategyId = userStrategyIds[i];
            UserStrategy storage userStrategy = _userStrategies[userStrategyId];
            
            // Check if strategy exists and is eligible for auto-compounding
            if (
                userStrategy.userStrategyId == userStrategyId &&
                userStrategy.isActive &&
                userStrategy.autoCompound &&
                (block.timestamp - userStrategy.lastHarvestDate) >= userStrategy.compoundFrequency
            ) {
                // Harvest yield and compound
                (uint256 yieldAmount, uint256 feeAmount) = _harvestYield(userStrategyId, address(this));
                
                if (yieldAmount > 0) {
                    // In a real implementation, we would reinvest the yield
                    // For simplicity, we'll just update the total value
                    userStrategy.totalValue += yieldAmount;
                    
                    // Update performance metrics
                    PerformanceMetrics storage metrics = _performanceMetrics[userStrategy.strategyId];
                    metrics.totalValue += yieldAmount;
                    
                    emit StrategyHarvested(userStrategyId, userStrategy.user, yieldAmount, feeAmount, true);
                    compoundedCount++;
                }
            }
        }
        
        return compoundedCount;
    }
    
    /**
     * @dev Updates performance metrics for a strategy
     * @param strategyId ID of the strategy
     * @param annualizedReturn Annualized return in basis points
     * @param volatility Volatility in basis points
     * @param sharpeRatio Sharpe ratio in basis points
     * @param maxDrawdown Maximum drawdown in basis points
     * @return success Boolean indicating if the update was successful
     */
    function updatePerformanceMetrics(
        bytes32 strategyId,
        uint256 annualizedReturn,
        uint256 volatility,
        uint256 sharpeRatio,
        uint256 maxDrawdown
    ) external returns (bool success) {
        require(hasRole(PERFORMANCE_UPDATER_ROLE, msg.sender), "YieldOptimizer: must have performance updater role");
        require(_strategyConfigs[strategyId].strategyId == strategyId, "YieldOptimizer: strategy does not exist");
        
        PerformanceMetrics storage metrics = _performanceMetrics[strategyId];
        metrics.annualizedReturn = annualizedReturn;
        metrics.volatility = volatility;
        metrics.sharpeRatio = sharpeRatio;
        metrics.maxDrawdown = maxDrawdown;
        metrics.updateTimestamp = block.timestamp;
        
        emit PerformanceUpdated(strategyId, annualizedReturn, metrics.totalValue, metrics.totalUsers);
        
        return true;
    }
    
    /**
     * @dev Set the protocol fee
     * @param newProtocolFee New protocol fee in basis points
     */
    function setProtocolFee(uint16 newProtocolFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newProtocolFee > MAX_PERFORMANCE_FEE) {
            revert PerformanceFeeTooHigh(newProtocolFee, MAX_PERFORMANCE_FEE);
        }
        protocolFee = newProtocolFee;
    }
    
    /**
     * @dev Set the protocol fee recipient
     * @param newFeeRecipient New fee recipient address
     */
    function setProtocolFeeRecipient(address newFeeRecipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newFeeRecipient == address(0)) {
            revert InvalidZeroAddress("newFeeRecipient");
        }
        protocolFeeRecipient = newFeeRecipient;
    }
    
    // View functions
    
    /**
     * @dev Gets strategy configuration
     * @param strategyId ID of the strategy
     * @return config The strategy configuration
     */
    function getStrategyConfig(bytes32 strategyId) external view override returns (StrategyConfig memory config) {
        return _strategyConfigs[strategyId];
    }
    
    /**
     * @dev Gets a user's strategy application
     * @param userStrategyId ID of the user strategy
     * @return userStrategy The user's strategy application
     */
    function getUserStrategy(bytes32 userStrategyId) external view override returns (UserStrategy memory userStrategy) {
        return _userStrategies[userStrategyId];
    }
    
    /**
     * @dev Gets all strategies for a user
     * @param user Address of the user
     * @return userStrategyIds Array of user strategy IDs
     */
    function getUserStrategies(address user) external view override returns (bytes32[] memory userStrategyIds) {
        return _userStrategyIds[user];
    }
    
    /**
     * @dev Gets performance metrics for a strategy
     * @param strategyId ID of the strategy
     * @return metrics The performance metrics
     */
    function getPerformanceMetrics(bytes32 strategyId) external view override returns (PerformanceMetrics memory metrics) {
        return _performanceMetrics[strategyId];
    }
    
    /**
     * @dev Gets all public strategies
     * @return strategyIds Array of public strategy IDs
     */
    function getPublicStrategies() external view override returns (bytes32[] memory strategyIds) {
        return _strategiesByVisibility[true];
    }
    
    /**
     * @dev Gets strategies by creator
     * @param creator Address of the creator
     * @return strategyIds Array of strategy IDs created by the specified address
     */
    function getStrategiesByCreator(address creator) external view override returns (bytes32[] memory strategyIds) {
        return _strategiesByCreator[creator];
    }
    
    /**
     * @dev Gets strategies by risk level
     * @param riskLevel Risk level to filter by
     * @return strategyIds Array of strategy IDs with the specified risk level
     */
    function getStrategiesByRiskLevel(RiskLevel riskLevel) external view override returns (bytes32[] memory strategyIds) {
        return _strategiesByRiskLevel[riskLevel];
    }
    
    /**
     * @dev Gets strategies that support a specific asset class
     * @param assetClass Asset class to filter by
     * @return strategyIds Array of strategy IDs supporting the specified asset class
     */
    function getStrategiesByAssetClass(IAssetFactory.AssetClass assetClass) external view override returns (bytes32[] memory strategyIds) {
        return _strategiesByAssetClass[assetClass];
    }
    
    /**
     * @dev Gets strategies that support a specific yield source type
     * @param sourceType Yield source type to filter by
     * @return strategyIds Array of strategy IDs supporting the specified yield source
     */
    function getStrategiesByYieldSource(YieldSourceType sourceType) external view override returns (bytes32[] memory strategyIds) {
        return _strategiesByYieldSource[sourceType];
    }
    
    /**
     * @dev Calculates the expected yield for a strategy
     * @param strategyId ID of the strategy
     * @param assets Array of asset addresses
     * @param amounts Array of asset amounts
     * @param period Period in seconds
     * @return expectedYield Expected yield amount
     * @return annualizedReturn Annualized return in basis points
     */
    function calculateExpectedYield(
        bytes32 strategyId,
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256 period
    ) external view override returns (
        uint256 expectedYield,
        uint256 annualizedReturn
    ) {
        require(_strategyConfigs[strategyId].strategyId == strategyId, "YieldOptimizer: strategy does not exist");
        require(assets.length == amounts.length, "YieldOptimizer: mismatched arrays");
        
        StrategyConfig storage config = _strategyConfigs[strategyId];
        PerformanceMetrics storage metrics = _performanceMetrics[strategyId];
        
        // In a real implementation, we would calculate expected yield based on the strategy logic
        // For simplicity, we'll use the historical annualized return
        annualizedReturn = metrics.annualizedReturn;
        if (annualizedReturn == 0) {
            // Fallback to a dummy calculation if no historical data
            if (config.riskLevel == RiskLevel.CONSERVATIVE) {
                annualizedReturn = 500; // 5% APY
            } else if (config.riskLevel == RiskLevel.MODERATE) {
                annualizedReturn = 1000; // 10% APY
            } else {
                annualizedReturn = 2000; // 20% APY
            }
        }
        
        // Calculate total value of assets
        uint256 totalValue = 0;
        for (uint256 i = 0; i < assets.length; i++) {
            // In a real implementation, we would calculate the actual value
            // For simplicity, we'll just sum the amounts
            totalValue += amounts[i];
        }
        
        // Calculate expected yield
        expectedYield = (totalValue * annualizedReturn * period) / (10000 * 365 days);
        
        return (expectedYield, annualizedReturn);
    }
    
    /**
     * @dev Gets the pending yield for a user strategy
     * @param userStrategyId ID of the user strategy
     * @return pendingYield Pending yield amount
     * @return pendingFees Pending fees amount
     */
    function getPendingYield(
        bytes32 userStrategyId
    ) external view override returns (
        uint256 pendingYield,
        uint256 pendingFees
    ) {
        require(_userStrategies[userStrategyId].userStrategyId == userStrategyId, "YieldOptimizer: user strategy does not exist");
        
        return _calculateYield(userStrategyId);
    }
    
    /**
     * @dev Checks if a strategy is suitable for specific assets
     * @param strategyId ID of the strategy
     * @param assets Array of asset addresses
     * @return isSuitable Boolean indicating if the strategy is suitable
     * @return reason Reason if not suitable
     */
    function checkStrategySuitability(
        bytes32 strategyId,
        address[] calldata assets
    ) external view override returns (
        bool isSuitable,
        string memory reason
    ) {
        StrategyConfig storage config = _strategyConfigs[strategyId];
        require(config.strategyId == strategyId, "YieldOptimizer: strategy does not exist");
        
        if (!config.isActive) {
            return (false, "Strategy is not active");
        }
        
        // In a real implementation, we would check each asset against the supported asset classes
        // For simplicity, we'll assume all assets are suitable if they exist
        for (uint256 i = 0; i < assets.length; i++) {
            if (!assetFactory.isAsset(assets[i])) {
                return (false, "Contains invalid asset");
            }
        }
        
        return (true, "");
    }
    
    /**
     * @dev Gets the users of a strategy
     * @param strategyId ID of the strategy
     * @return userCount Number of users using the strategy
     * @return totalValueLocked Total value locked in the strategy
     */
    function getStrategyUsage(
        bytes32 strategyId
    ) external view returns (
        uint256 userCount,
        uint256 totalValueLocked
    ) {
        require(_strategyConfigs[strategyId].strategyId == strategyId, "YieldOptimizer: strategy does not exist");
        
        bytes32[] storage userStrategyIds = _strategyUsers[strategyId];
        userCount = userStrategyIds.length;
        
        PerformanceMetrics storage metrics = _performanceMetrics[strategyId];
        totalValueLocked = metrics.totalValue;
        
        return (userCount, totalValueLocked);
    }
} 