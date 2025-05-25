// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title MarketMakerIncentives
 * @dev Addresses WEF report's identification of secondary market liquidity as key barrier
 * Implements incentive mechanisms for market makers to improve liquidity provision
 * Features tiered rewards based on performance metrics: volume, uptime, spread tightness
 */
contract MarketMakerIncentives is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Math for uint256;

    // Market maker performance tiers
    enum PerformanceTier { 
        BRONZE,     // Entry level
        SILVER,     // Good performance
        GOLD,       // Excellent performance
        PLATINUM,   // Elite performance
        DIAMOND     // Exceptional performance
    }

    // Market maker registration and performance data
    struct MarketMaker {
        address marketMaker;
        uint256 registrationTimestamp;
        uint256 totalVolume;
        uint256 totalTrades;
        uint256 uptimeScore;           // Percentage (0-10000 = 0-100%)
        uint256 averageSpread;         // Basis points
        uint256 lastActivityTimestamp;
        PerformanceTier currentTier;
        bool isActive;
        bool isVerified;               // KYC/compliance verification
        uint256 totalRewardsEarned;
        uint256 totalRewardsClaimed;
    }

    // Performance tracking for reward calculation
    struct PerformanceMetrics {
        uint256 dailyVolume;
        uint256 dailyTrades;
        uint256 dailyUptime;           // Minutes active
        uint256 dailyAverageSpread;    // Basis points
        uint256 lastUpdateTimestamp;
        uint256 consecutiveDaysActive;
        mapping(uint256 => uint256) hourlyActivity; // Hour -> activity score
    }

    // Tier requirements and multipliers
    struct TierRequirements {
        uint256 minimumVolume;         // Minimum daily volume
        uint256 minimumUptime;         // Minimum uptime percentage (0-10000)
        uint256 maximumSpread;         // Maximum average spread (basis points)
        uint256 minimumTrades;         // Minimum daily trades
        uint256 rewardMultiplier;      // Reward multiplier (10000 = 1x)
        uint256 bonusMultiplier;       // Additional bonus multiplier
    }

    // Reward pool configuration
    struct RewardPool {
        IERC20 rewardToken;
        uint256 totalPool;
        uint256 dailyAllocation;
        uint256 distributedToday;
        uint256 lastDistributionDate;
        bool isActive;
    }

    // State variables
    mapping(address => MarketMaker) public marketMakers;
    mapping(address => PerformanceMetrics) public performanceMetrics;
    mapping(PerformanceTier => TierRequirements) public tierRequirements;
    mapping(address => RewardPool) public rewardPools;
    
    address[] public registeredMarketMakers;
    address[] public activeRewardTokens;
    
    // Performance tracking
    mapping(address => mapping(uint256 => uint256)) public dailyVolumes; // MM -> day -> volume
    mapping(address => mapping(uint256 => uint256)) public dailyRewards;  // MM -> day -> rewards
    
    // Global metrics
    uint256 public totalMarketMakers;
    uint256 public totalActiveMarketMakers;
    uint256 public totalVolumeAllTime;
    uint256 public totalRewardsDistributed;
    
    // Configuration
    uint256 public constant UPTIME_PRECISION = 10000;     // 100.00%
    uint256 public constant SPREAD_PRECISION = 10000;     // 100.00 basis points
    uint256 public constant REWARD_PRECISION = 10000;     // 1.0000x multiplier
    uint256 public constant SECONDS_PER_DAY = 86400;
    uint256 public constant HOURS_PER_DAY = 24;
    
    uint256 public minimumRegistrationStake;
    uint256 public inactivityThreshold = 7 days;
    uint256 public performanceUpdateInterval = 1 hours;

    // Events
    event MarketMakerRegistered(
        address indexed marketMaker,
        uint256 timestamp,
        uint256 stake
    );
    
    event MarketMakerDeregistered(
        address indexed marketMaker,
        uint256 timestamp,
        string reason
    );
    
    event PerformanceUpdated(
        address indexed marketMaker,
        uint256 volume,
        uint256 trades,
        uint256 uptime,
        uint256 averageSpread,
        PerformanceTier newTier
    );
    
    event RewardsCalculated(
        address indexed marketMaker,
        address indexed rewardToken,
        uint256 amount,
        PerformanceTier tier,
        uint256 multiplier
    );
    
    event RewardsClaimed(
        address indexed marketMaker,
        address indexed rewardToken,
        uint256 amount
    );
    
    event TierUpgraded(
        address indexed marketMaker,
        PerformanceTier oldTier,
        PerformanceTier newTier
    );
    
    event RewardPoolAdded(
        address indexed rewardToken,
        uint256 totalPool,
        uint256 dailyAllocation
    );

    // Modifiers
    modifier onlyRegisteredMarketMaker() {
        require(marketMakers[msg.sender].isActive, "Not a registered market maker");
        _;
    }

    modifier onlyVerifiedMarketMaker() {
        require(marketMakers[msg.sender].isVerified, "Market maker not verified");
        _;
    }

    constructor(uint256 _minimumStake) {
        minimumRegistrationStake = _minimumStake;
        _initializeTierRequirements();
    }

    /**
     * @dev Register as a market maker with required stake
     */
    function registerMarketMaker() external payable nonReentrant whenNotPaused {
        require(msg.value >= minimumRegistrationStake, "Insufficient registration stake");
        require(!marketMakers[msg.sender].isActive, "Already registered");

        marketMakers[msg.sender] = MarketMaker({
            marketMaker: msg.sender,
            registrationTimestamp: block.timestamp,
            totalVolume: 0,
            totalTrades: 0,
            uptimeScore: 0,
            averageSpread: 0,
            lastActivityTimestamp: block.timestamp,
            currentTier: PerformanceTier.BRONZE,
            isActive: true,
            isVerified: false, // Requires separate verification
            totalRewardsEarned: 0,
            totalRewardsClaimed: 0
        });

        performanceMetrics[msg.sender].lastUpdateTimestamp = block.timestamp;
        
        registeredMarketMakers.push(msg.sender);
        totalMarketMakers++;
        totalActiveMarketMakers++;

        emit MarketMakerRegistered(msg.sender, block.timestamp, msg.value);
    }

    /**
     * @dev Update market maker performance metrics
     * Called by authorized oracle or the market maker themselves
     */
    function updatePerformance(
        address _marketMaker,
        uint256 _volume,
        uint256 _trades,
        uint256 _uptimeMinutes,
        uint256 _averageSpread
    ) external onlyOwner {
        require(marketMakers[_marketMaker].isActive, "Market maker not active");
        
        MarketMaker storage mm = marketMakers[_marketMaker];
        PerformanceMetrics storage metrics = performanceMetrics[_marketMaker];
        
        // Update cumulative metrics
        mm.totalVolume += _volume;
        mm.totalTrades += _trades;
        mm.lastActivityTimestamp = block.timestamp;
        
        // Update daily metrics
        uint256 today = block.timestamp / SECONDS_PER_DAY;
        dailyVolumes[_marketMaker][today] += _volume;
        
        // Calculate uptime score (percentage of day active)
        uint256 uptimePercentage = (_uptimeMinutes * UPTIME_PRECISION) / (HOURS_PER_DAY * 60);
        mm.uptimeScore = (mm.uptimeScore + uptimePercentage) / 2; // Moving average
        
        // Update average spread (moving average)
        if (mm.averageSpread == 0) {
            mm.averageSpread = _averageSpread;
        } else {
            mm.averageSpread = (mm.averageSpread * 7 + _averageSpread * 3) / 10; // Weighted average
        }
        
        // Update daily metrics
        metrics.dailyVolume = _volume;
        metrics.dailyTrades = _trades;
        metrics.dailyUptime = _uptimeMinutes;
        metrics.dailyAverageSpread = _averageSpread;
        metrics.lastUpdateTimestamp = block.timestamp;
        
        // Check for tier upgrade
        PerformanceTier newTier = _calculateTier(_marketMaker);
        if (newTier != mm.currentTier) {
            PerformanceTier oldTier = mm.currentTier;
            mm.currentTier = newTier;
            emit TierUpgraded(_marketMaker, oldTier, newTier);
        }
        
        emit PerformanceUpdated(
            _marketMaker,
            _volume,
            _trades,
            uptimePercentage,
            _averageSpread,
            mm.currentTier
        );
    }

    /**
     * @dev Calculate and distribute rewards for a market maker
     */
    function calculateRewards(
        address _marketMaker,
        address _rewardToken
    ) external onlyOwner returns (uint256) {
        require(marketMakers[_marketMaker].isActive, "Market maker not active");
        require(marketMakers[_marketMaker].isVerified, "Market maker not verified");
        require(rewardPools[_rewardToken].isActive, "Reward pool not active");
        
        MarketMaker storage mm = marketMakers[_marketMaker];
        RewardPool storage pool = rewardPools[_rewardToken];
        TierRequirements memory tierReq = tierRequirements[mm.currentTier];
        
        // Check if daily allocation is available
        uint256 today = block.timestamp / SECONDS_PER_DAY;
        if (pool.lastDistributionDate != today) {
            pool.distributedToday = 0;
            pool.lastDistributionDate = today;
        }
        
        // Calculate base reward based on volume and tier
        uint256 dailyVolume = dailyVolumes[_marketMaker][today];
        uint256 baseReward = (dailyVolume * pool.dailyAllocation) / _getTotalDailyVolume();
        
        // Apply tier multiplier
        uint256 tierMultiplier = tierReq.rewardMultiplier;
        uint256 rewardAmount = (baseReward * tierMultiplier) / REWARD_PRECISION;
        
        // Apply performance bonuses
        uint256 bonusMultiplier = _calculateBonusMultiplier(_marketMaker);
        rewardAmount = (rewardAmount * bonusMultiplier) / REWARD_PRECISION;
        
        // Check pool availability
        require(
            pool.distributedToday + rewardAmount <= pool.dailyAllocation,
            "Daily allocation exceeded"
        );
        require(rewardAmount <= pool.totalPool, "Insufficient pool balance");
        
        // Update state
        mm.totalRewardsEarned += rewardAmount;
        pool.distributedToday += rewardAmount;
        pool.totalPool -= rewardAmount;
        dailyRewards[_marketMaker][today] += rewardAmount;
        totalRewardsDistributed += rewardAmount;
        
        emit RewardsCalculated(
            _marketMaker,
            _rewardToken,
            rewardAmount,
            mm.currentTier,
            tierMultiplier
        );
        
        return rewardAmount;
    }

    /**
     * @dev Claim accumulated rewards
     */
    function claimRewards(address _rewardToken) external onlyRegisteredMarketMaker nonReentrant {
        MarketMaker storage mm = marketMakers[msg.sender];
        require(mm.isVerified, "Market maker not verified");
        
        uint256 claimableAmount = mm.totalRewardsEarned - mm.totalRewardsClaimed;
        require(claimableAmount > 0, "No rewards to claim");
        
        mm.totalRewardsClaimed += claimableAmount;
        
        IERC20(_rewardToken).safeTransfer(msg.sender, claimableAmount);
        
        emit RewardsClaimed(msg.sender, _rewardToken, claimableAmount);
    }

    /**
     * @dev Add a new reward pool
     */
    function addRewardPool(
        address _rewardToken,
        uint256 _totalPool,
        uint256 _dailyAllocation
    ) external onlyOwner {
        require(_rewardToken != address(0), "Invalid reward token");
        require(_totalPool > 0, "Invalid total pool");
        require(_dailyAllocation > 0, "Invalid daily allocation");
        require(_dailyAllocation <= _totalPool, "Daily allocation exceeds total pool");
        
        rewardPools[_rewardToken] = RewardPool({
            rewardToken: IERC20(_rewardToken),
            totalPool: _totalPool,
            dailyAllocation: _dailyAllocation,
            distributedToday: 0,
            lastDistributionDate: block.timestamp / SECONDS_PER_DAY,
            isActive: true
        });
        
        activeRewardTokens.push(_rewardToken);
        
        // Transfer tokens to contract
        IERC20(_rewardToken).safeTransferFrom(msg.sender, address(this), _totalPool);
        
        emit RewardPoolAdded(_rewardToken, _totalPool, _dailyAllocation);
    }

    /**
     * @dev Verify a market maker for compliance
     */
    function verifyMarketMaker(address _marketMaker) external onlyOwner {
        require(marketMakers[_marketMaker].isActive, "Market maker not active");
        marketMakers[_marketMaker].isVerified = true;
    }

    /**
     * @dev Deregister a market maker
     */
    function deregisterMarketMaker(address _marketMaker, string memory _reason) external onlyOwner {
        require(marketMakers[_marketMaker].isActive, "Market maker not active");
        
        marketMakers[_marketMaker].isActive = false;
        totalActiveMarketMakers--;
        
        emit MarketMakerDeregistered(_marketMaker, block.timestamp, _reason);
    }

    /**
     * @dev Get market maker performance summary
     */
    function getMarketMakerSummary(address _marketMaker) external view returns (
        PerformanceTier tier,
        uint256 totalVolume,
        uint256 totalTrades,
        uint256 uptimeScore,
        uint256 averageSpread,
        uint256 totalRewards,
        uint256 claimableRewards,
        bool isVerified
    ) {
        MarketMaker memory mm = marketMakers[_marketMaker];
        return (
            mm.currentTier,
            mm.totalVolume,
            mm.totalTrades,
            mm.uptimeScore,
            mm.averageSpread,
            mm.totalRewardsEarned,
            mm.totalRewardsEarned - mm.totalRewardsClaimed,
            mm.isVerified
        );
    }

    /**
     * @dev Get tier requirements
     */
    function getTierRequirements(PerformanceTier _tier) external view returns (TierRequirements memory) {
        return tierRequirements[_tier];
    }

    /**
     * @dev Get total daily volume across all market makers
     */
    function getTotalDailyVolume() external view returns (uint256) {
        return _getTotalDailyVolume();
    }

    // Internal functions

    function _initializeTierRequirements() internal {
        // Bronze tier (entry level)
        tierRequirements[PerformanceTier.BRONZE] = TierRequirements({
            minimumVolume: 10_000 * 10**18,      // $10K daily
            minimumUptime: 5000,                  // 50%
            maximumSpread: 100,                   // 1% spread
            minimumTrades: 10,                    // 10 trades/day
            rewardMultiplier: 10000,              // 1.0x
            bonusMultiplier: 10000                // 1.0x
        });

        // Silver tier
        tierRequirements[PerformanceTier.SILVER] = TierRequirements({
            minimumVolume: 50_000 * 10**18,       // $50K daily
            minimumUptime: 7000,                  // 70%
            maximumSpread: 75,                    // 0.75% spread
            minimumTrades: 25,                    // 25 trades/day
            rewardMultiplier: 12500,              // 1.25x
            bonusMultiplier: 11000                // 1.1x
        });

        // Gold tier
        tierRequirements[PerformanceTier.GOLD] = TierRequirements({
            minimumVolume: 200_000 * 10**18,      // $200K daily
            minimumUptime: 8500,                  // 85%
            maximumSpread: 50,                    // 0.5% spread
            minimumTrades: 50,                    // 50 trades/day
            rewardMultiplier: 15000,              // 1.5x
            bonusMultiplier: 12500                // 1.25x
        });

        // Platinum tier
        tierRequirements[PerformanceTier.PLATINUM] = TierRequirements({
            minimumVolume: 1_000_000 * 10**18,    // $1M daily
            minimumUptime: 9500,                  // 95%
            maximumSpread: 30,                    // 0.3% spread
            minimumTrades: 100,                   // 100 trades/day
            rewardMultiplier: 20000,              // 2.0x
            bonusMultiplier: 15000                // 1.5x
        });

        // Diamond tier (elite)
        tierRequirements[PerformanceTier.DIAMOND] = TierRequirements({
            minimumVolume: 5_000_000 * 10**18,    // $5M daily
            minimumUptime: 9800,                  // 98%
            maximumSpread: 20,                    // 0.2% spread
            minimumTrades: 200,                   // 200 trades/day
            rewardMultiplier: 30000,              // 3.0x
            bonusMultiplier: 20000                // 2.0x
        });
    }

    function _calculateTier(address _marketMaker) internal view returns (PerformanceTier) {
        MarketMaker memory mm = marketMakers[_marketMaker];
        uint256 today = block.timestamp / SECONDS_PER_DAY;
        uint256 dailyVolume = dailyVolumes[_marketMaker][today];
        
        // Check Diamond tier
        TierRequirements memory diamond = tierRequirements[PerformanceTier.DIAMOND];
        if (dailyVolume >= diamond.minimumVolume &&
            mm.uptimeScore >= diamond.minimumUptime &&
            mm.averageSpread <= diamond.maximumSpread &&
            performanceMetrics[_marketMaker].dailyTrades >= diamond.minimumTrades) {
            return PerformanceTier.DIAMOND;
        }
        
        // Check Platinum tier
        TierRequirements memory platinum = tierRequirements[PerformanceTier.PLATINUM];
        if (dailyVolume >= platinum.minimumVolume &&
            mm.uptimeScore >= platinum.minimumUptime &&
            mm.averageSpread <= platinum.maximumSpread &&
            performanceMetrics[_marketMaker].dailyTrades >= platinum.minimumTrades) {
            return PerformanceTier.PLATINUM;
        }
        
        // Check Gold tier
        TierRequirements memory gold = tierRequirements[PerformanceTier.GOLD];
        if (dailyVolume >= gold.minimumVolume &&
            mm.uptimeScore >= gold.minimumUptime &&
            mm.averageSpread <= gold.maximumSpread &&
            performanceMetrics[_marketMaker].dailyTrades >= gold.minimumTrades) {
            return PerformanceTier.GOLD;
        }
        
        // Check Silver tier
        TierRequirements memory silver = tierRequirements[PerformanceTier.SILVER];
        if (dailyVolume >= silver.minimumVolume &&
            mm.uptimeScore >= silver.minimumUptime &&
            mm.averageSpread <= silver.maximumSpread &&
            performanceMetrics[_marketMaker].dailyTrades >= silver.minimumTrades) {
            return PerformanceTier.SILVER;
        }
        
        // Default to Bronze
        return PerformanceTier.BRONZE;
    }

    function _calculateBonusMultiplier(address _marketMaker) internal view returns (uint256) {
        PerformanceMetrics memory metrics = performanceMetrics[_marketMaker];
        uint256 bonusMultiplier = REWARD_PRECISION; // Start with 1.0x
        
        // Consecutive days bonus (up to 50% bonus for 30+ days)
        if (metrics.consecutiveDaysActive >= 30) {
            bonusMultiplier += 5000; // +50%
        } else if (metrics.consecutiveDaysActive >= 14) {
            bonusMultiplier += 2500; // +25%
        } else if (metrics.consecutiveDaysActive >= 7) {
            bonusMultiplier += 1000; // +10%
        }
        
        // High uptime bonus
        MarketMaker memory mm = marketMakers[_marketMaker];
        if (mm.uptimeScore >= 9800) { // 98%+
            bonusMultiplier += 2000; // +20%
        } else if (mm.uptimeScore >= 9500) { // 95%+
            bonusMultiplier += 1000; // +10%
        }
        
        // Tight spread bonus
        if (mm.averageSpread <= 10) { // 0.1% or tighter
            bonusMultiplier += 1500; // +15%
        } else if (mm.averageSpread <= 25) { // 0.25% or tighter
            bonusMultiplier += 750; // +7.5%
        }
        
        return bonusMultiplier;
    }

    function _getTotalDailyVolume() internal view returns (uint256) {
        uint256 today = block.timestamp / SECONDS_PER_DAY;
        uint256 totalVolume = 0;
        
        for (uint256 i = 0; i < registeredMarketMakers.length; i++) {
            address mm = registeredMarketMakers[i];
            if (marketMakers[mm].isActive) {
                totalVolume += dailyVolumes[mm][today];
            }
        }
        
        return totalVolume > 0 ? totalVolume : 1; // Avoid division by zero
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
     * @dev Emergency withdrawal function
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(owner(), _amount);
    }
} 