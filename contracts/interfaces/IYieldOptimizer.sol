// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "./IAssetFactory.sol";

/**
 * @title IYieldOptimizer
 * @dev Interface for the Yield Optimizer contract, which manages yield strategies
 * including auto-compounding, portfolio rebalancing, and yield farming.
 */
interface IYieldOptimizer {
    /**
     * @dev Enum for strategy risk levels
     */
    enum RiskLevel {
        CONSERVATIVE,    // Minimal risk, stable but lower yield
        MODERATE,        // Balanced risk/reward
        AGGRESSIVE,      // Higher risk, potentially higher yield
        CUSTOM          // Custom risk profile
    }
    
    /**
     * @dev Enum for yield source types
     */
    enum YieldSourceType {
        NATIVE,         // Yield from the asset itself (e.g., treasury yield)
        LIQUIDITY_POOL, // Yield from providing liquidity
        LENDING,        // Yield from lending
        STAKING,        // Yield from staking
        FARMING,        // Yield from yield farming
        CUSTOM         // Custom yield source
    }
    
    /**
     * @dev Structure to store a yield strategy configuration
     */
    struct StrategyConfig {
        bytes32 strategyId;
        string name;
        string description;
        address creator;
        RiskLevel riskLevel;
        bool isPublic;
        bool isActive;
        uint256 creationDate;
        uint256 performanceFee;  // In basis points (e.g., 1000 = 10%)
        string metadataURI;
        YieldSourceType[] supportedSources;
        IAssetFactory.AssetClass[] supportedAssetClasses;
    }
    
    /**
     * @dev Structure to store a user's strategy application
     */
    struct UserStrategy {
        bytes32 userStrategyId;
        bytes32 strategyId;
        address user;
        address[] assets;         // Array of asset addresses
        uint256[] allocationPercentages;  // Percentages for each asset in basis points
        uint256 totalValue;       // Total value of assets in the strategy
        uint256 startDate;
        uint256 lastHarvestDate;
        uint256 totalYield;       // Total yield generated
        uint256 totalFeesPaid;    // Total fees paid
        bool autoCompound;
        uint256 compoundFrequency;  // In seconds
        bool isActive;
    }
    
    /**
     * @dev Structure to store performance metrics for a strategy
     */
    struct PerformanceMetrics {
        bytes32 strategyId;
        uint256 totalValue;      // Total value of assets in the strategy
        uint256 totalYield;      // Total yield generated
        uint256 annualizedReturn;  // Annualized return in basis points
        uint256 volatility;      // Volatility in basis points
        uint256 sharpeRatio;     // Sharpe ratio in basis points
        uint256 maxDrawdown;     // Maximum drawdown in basis points
        uint256 totalUsers;      // Number of users using the strategy
        uint256 updateTimestamp;  // When metrics were last updated
    }
    
    /**
     * @dev Emitted when a new strategy is created
     */
    event StrategyCreated(
        bytes32 indexed strategyId,
        address indexed creator,
        string name,
        RiskLevel riskLevel,
        bool isPublic
    );
    
    /**
     * @dev Emitted when a strategy is updated
     */
    event StrategyUpdated(
        bytes32 indexed strategyId,
        bool isPublic,
        bool isActive,
        uint256 performanceFee,
        string metadataURI
    );
    
    /**
     * @dev Emitted when a user applies a strategy
     */
    event StrategyApplied(
        bytes32 indexed strategyId,
        bytes32 indexed userStrategyId,
        address indexed user,
        address[] assets,
        uint256[] allocationPercentages,
        bool autoCompound,
        uint256 compoundFrequency
    );
    
    /**
     * @dev Emitted when a strategy is harvested (yields are realized)
     */
    event StrategyHarvested(
        bytes32 indexed userStrategyId,
        address indexed user,
        uint256 yieldAmount,
        uint256 feeAmount,
        bool autoCompounded
    );
    
    /**
     * @dev Emitted when a user strategy is updated
     */
    event UserStrategyUpdated(
        bytes32 indexed userStrategyId,
        address indexed user,
        address[] assets,
        uint256[] allocationPercentages,
        bool autoCompound,
        uint256 compoundFrequency,
        bool isActive
    );
    
    /**
     * @dev Emitted when strategy performance metrics are updated
     */
    event PerformanceUpdated(
        bytes32 indexed strategyId,
        uint256 annualizedReturn,
        uint256 totalValue,
        uint256 totalUsers
    );
    
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
    ) external returns (bytes32 strategyId);
    
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
    ) external returns (bool success);
    
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
    ) external returns (bytes32 userStrategyId);
    
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
    ) external returns (bool success);
    
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
    ) external returns (
        uint256 yieldAmount,
        uint256 feeAmount
    );
    
    /**
     * @dev Triggers auto-compounding for eligible strategies
     * @param userStrategyIds Array of user strategy IDs to compound
     * @return compoundedCount Number of strategies successfully compounded
     */
    function triggerAutoCompound(
        bytes32[] calldata userStrategyIds
    ) external returns (uint256 compoundedCount);
    
    /**
     * @dev Gets strategy configuration
     * @param strategyId ID of the strategy
     * @return config The strategy configuration
     */
    function getStrategyConfig(bytes32 strategyId) external view returns (StrategyConfig memory config);
    
    /**
     * @dev Gets a user's strategy application
     * @param userStrategyId ID of the user strategy
     * @return userStrategy The user's strategy application
     */
    function getUserStrategy(bytes32 userStrategyId) external view returns (UserStrategy memory userStrategy);
    
    /**
     * @dev Gets all strategies for a user
     * @param user Address of the user
     * @return userStrategyIds Array of user strategy IDs
     */
    function getUserStrategies(address user) external view returns (bytes32[] memory userStrategyIds);
    
    /**
     * @dev Gets performance metrics for a strategy
     * @param strategyId ID of the strategy
     * @return metrics The performance metrics
     */
    function getPerformanceMetrics(bytes32 strategyId) external view returns (PerformanceMetrics memory metrics);
    
    /**
     * @dev Gets all public strategies
     * @return strategyIds Array of public strategy IDs
     */
    function getPublicStrategies() external view returns (bytes32[] memory strategyIds);
    
    /**
     * @dev Gets strategies by creator
     * @param creator Address of the creator
     * @return strategyIds Array of strategy IDs created by the specified address
     */
    function getStrategiesByCreator(address creator) external view returns (bytes32[] memory strategyIds);
    
    /**
     * @dev Gets strategies by risk level
     * @param riskLevel Risk level to filter by
     * @return strategyIds Array of strategy IDs with the specified risk level
     */
    function getStrategiesByRiskLevel(RiskLevel riskLevel) external view returns (bytes32[] memory strategyIds);
    
    /**
     * @dev Gets strategies that support a specific asset class
     * @param assetClass Asset class to filter by
     * @return strategyIds Array of strategy IDs supporting the specified asset class
     */
    function getStrategiesByAssetClass(IAssetFactory.AssetClass assetClass) external view returns (bytes32[] memory strategyIds);
    
    /**
     * @dev Gets strategies that support a specific yield source type
     * @param sourceType Yield source type to filter by
     * @return strategyIds Array of strategy IDs supporting the specified yield source
     */
    function getStrategiesByYieldSource(YieldSourceType sourceType) external view returns (bytes32[] memory strategyIds);
    
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
    ) external view returns (
        uint256 expectedYield,
        uint256 annualizedReturn
    );
    
    /**
     * @dev Gets the pending yield for a user strategy
     * @param userStrategyId ID of the user strategy
     * @return pendingYield Pending yield amount
     * @return pendingFees Pending fees amount
     */
    function getPendingYield(
        bytes32 userStrategyId
    ) external view returns (
        uint256 pendingYield,
        uint256 pendingFees
    );
    
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
    ) external view returns (
        bool isSuitable,
        string memory reason
    );
} 