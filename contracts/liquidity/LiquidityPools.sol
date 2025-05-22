// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "../interfaces/ILiquidityPools.sol";
import "../interfaces/IAssetFactory.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title LiquidityPools
 * @dev Implementation of the Liquidity Pools contract with concentrated liquidity features
 * similar to Uniswap v3. This contract allows for efficient capital utilization and 
 * custom fee tiers for different asset pairs.
 * 
 * Gas Optimization (v0.9.6):
 * - Improved storage layout with packed storage variables
 * - Optimized tick bitmap operations for gas efficiency
 * - Reduced storage reads in price calculations with local caching
 * - Added batch operations for fee collection and liquidity management
 * - Implemented efficient storage access patterns
 */
contract LiquidityPools is ILiquidityPools, AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;
    
    // Roles
    bytes32 public constant POOL_CREATOR_ROLE = keccak256("POOL_CREATOR_ROLE");
    bytes32 public constant FEE_MANAGER_ROLE = keccak256("FEE_MANAGER_ROLE");
    bytes32 public constant PROTOCOL_FEE_MANAGER_ROLE = keccak256("PROTOCOL_FEE_MANAGER_ROLE");
    
    // Custom errors for gas efficiency
    error InvalidFeeTier(uint24 feeTier, uint24 minFeeTier, uint24 maxFeeTier);
    error PoolNotFound(bytes32 poolId);
    error Unauthorized(address caller, bytes32 requiredRole);
    error InvalidZeroAddress();
    error InvalidTickRange(int24 lowerTick, int24 upperTick);
    error InvalidTickSpacing(int24 tick, uint24 tickSpacing);
    error InsufficientLiquidity(uint128 available, uint128 required);
    error PriceLimitReached(uint160 price, uint160 limit);
    error PositionNotFound(bytes32 positionId);
    error NotPositionOwner(address caller, address owner);
    error AmountTooLow(uint256 amount, uint256 minAmount);
    
    // Asset factory reference
    IAssetFactory public immutable assetFactory;
    
    // Pool storage
    mapping(bytes32 => PoolConfig) private _poolConfigs;
    mapping(bytes32 => PoolState) private _poolStates;
    bytes32[] private _allPoolIds;
    
    // Position storage
    mapping(bytes32 => Position) private _positions;
    mapping(address => bytes32[]) private _userPositions;
    mapping(bytes32 => bytes32[]) private _poolPositions;
    
    // Token-pool mappings
    mapping(address => bytes32[]) private _tokenPools;
    mapping(IAssetFactory.AssetClass => bytes32[]) private _assetClassPools;
    
    // Gas optimization: Use bitmap for tick tracking instead of arrays
    // tickBitmap[poolId][wordPos] => bitmap where each bit represents if the tick is initialized
    mapping(bytes32 => mapping(int16 => uint256)) private _tickBitmap;
    
    // Gas optimization: Cache fee growth and rewards for active ticks
    mapping(bytes32 => mapping(int24 => FeeGrowthCache)) private _tickFeeGrowth;
    
    // Gas optimization: Packed fee growth accumulator structure
    struct FeeGrowthCache {
        uint128 feeGrowthOutside0X128;
        uint128 feeGrowthOutside1X128;
        uint32 lastUpdated;
    }
    
    // Protocol fee (in basis points, e.g., 10 = 0.1%)
    uint16 public protocolFee = 10;
    address public protocolFeeRecipient;
    
    // Tick math constants
    int24 public constant MIN_TICK = -887272;
    int24 public constant MAX_TICK = 887272;
    
    // Gas optimization: Word size for tick bitmap
    int24 private constant TICK_BITMAP_WORD_SIZE = 256;
    
    // Counters for generating unique IDs
    Counters.Counter private _poolIdCounter;
    Counters.Counter private _positionIdCounter;
    
    // Gas optimization: Global accumulator tracking fee growth across all pools
    uint256 public globalFeeGrowth0;
    uint256 public globalFeeGrowth1;
    
    // Gas optimization: Efficient tick math constants
    uint256 private constant Q96 = 2**96;
    
    // Events (additional events for optimization features)
    event BatchFeesCollected(address indexed owner, bytes32[] positionIds, uint256 totalAmount0, uint256 totalAmount1);
    event TickBitmapUpdated(bytes32 indexed poolId, int24 tick, bool initialized);
    event TickBitmapWordUpdated(bytes32 indexed poolId, int16 wordPos, uint256 word);
    event ProtocolFeeUpdated(uint16 oldProtocolFee, uint16 newProtocolFee);
    event ProtocolFeeRecipientUpdated(address oldFeeRecipient, address newFeeRecipient);
    
    /**
     * @dev Constructor
     * @param assetFactoryAddress Address of the AssetFactory contract
     * @param feeRecipient Address to receive protocol fees
     */
    constructor(address assetFactoryAddress, address feeRecipient) {
        // Validate input parameters using custom errors for better gas efficiency
        if (assetFactoryAddress == address(0)) {
            revert InvalidZeroAddress();
        }
        if (feeRecipient == address(0)) {
            revert InvalidZeroAddress();
        }
        
        // Gas optimization: Use immutable for address that doesn't change
        assetFactory = IAssetFactory(assetFactoryAddress);
        protocolFeeRecipient = feeRecipient;
        
        // Setup roles
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(POOL_CREATOR_ROLE, msg.sender);
        _setupRole(FEE_MANAGER_ROLE, msg.sender);
        _setupRole(PROTOCOL_FEE_MANAGER_ROLE, msg.sender);
    }
    
    /**
     * @dev Creates a new liquidity pool
     * @param tokenA Address of the first token in the pair
     * @param tokenB Address of the second token in the pair
     * @param assetClassA Asset class of token A
     * @param assetClassB Asset class of token B
     * @param feeTier Fee tier in basis points
     * @param initialSqrtPrice Initial price for the pool
     * @param tickSpacing Spacing between ticks for concentrated liquidity
     * @return poolId ID of the created pool
     */
    function createPool(
        address tokenA,
        address tokenB,
        IAssetFactory.AssetClass assetClassA,
        IAssetFactory.AssetClass assetClassB,
        uint24 feeTier,
        uint160 initialSqrtPrice,
        uint24 tickSpacing
    ) external override nonReentrant returns (bytes32 poolId) {
        require(hasRole(POOL_CREATOR_ROLE, msg.sender), "LiquidityPools: must have pool creator role");
        require(tokenA != address(0) && tokenB != address(0), "LiquidityPools: token addresses cannot be zero");
        require(tokenA != tokenB, "LiquidityPools: tokens cannot be identical");
        require(feeTier > 0 && feeTier <= 10000, "LiquidityPools: invalid fee tier");
        require(initialSqrtPrice > 0, "LiquidityPools: initial sqrt price must be greater than zero");
        require(tickSpacing > 0, "LiquidityPools: tick spacing must be greater than zero");
        
        // Sort tokens to ensure consistent pool creation
        if (tokenA > tokenB) {
            (tokenA, tokenB) = (tokenB, tokenA);
            (assetClassA, assetClassB) = (assetClassB, assetClassA);
        }
        
        // Gas optimization: Generate poolId more efficiently
        _poolIdCounter.increment();
        uint256 counterValue = _poolIdCounter.current();
        poolId = keccak256(abi.encodePacked(
            counterValue,
            tokenA,
            tokenB,
            feeTier
        ));
        
        // Create pool configuration
        PoolConfig storage config = _poolConfigs[poolId];
        config.poolId = poolId;
        config.tokenA = tokenA;
        config.tokenB = tokenB;
        config.assetClassA = assetClassA;
        config.assetClassB = assetClassB;
        config.feeTier = feeTier;
        config.initialSqrtPrice = initialSqrtPrice;
        config.tickSpacing = tickSpacing;
        config.active = true;
        config.owner = msg.sender;
        
        // Initialize pool state
        int24 initialTick = _getTickAtSqrtRatio(initialSqrtPrice);
        PoolState storage state = _poolStates[poolId];
        state.sqrtPriceX96 = initialSqrtPrice;
        state.tick = initialTick;
        state.lastUpdated = uint32(block.timestamp); // Gas optimization: Cast to uint32 to save storage
        state.observationIndex = 0;
        state.totalLiquidity = 0;
        state.volumeTokenA = 0;
        state.volumeTokenB = 0;
        state.feesCollectedA = 0;
        state.feesCollectedB = 0;
        
        // Gas optimization: Initialize the bitmap for the initial tick
        _initializeTickRange(poolId, initialTick, initialTick, tickSpacing);
        
        // Add to indexes
        _allPoolIds.push(poolId);
        _tokenPools[tokenA].push(poolId);
        _tokenPools[tokenB].push(poolId);
        _assetClassPools[assetClassA].push(poolId);
        _assetClassPools[assetClassB].push(poolId);
        
        emit PoolCreated(poolId, tokenA, tokenB, feeTier, initialSqrtPrice, tickSpacing, msg.sender);
        
        return poolId;
    }
    
    /**
     * @dev Adds liquidity to a specific pool
     * @param poolId ID of the pool
     * @param lowerTick Lower tick boundary for concentrated liquidity
     * @param upperTick Upper tick boundary for concentrated liquidity
     * @param amount0Desired Desired amount of token A to add
     * @param amount1Desired Desired amount of token B to add
     * @param amount0Min Minimum amount of token A to add
     * @param amount1Min Minimum amount of token B to add
     * @return positionId ID of the created position
     * @return liquidity Amount of liquidity actually added
     * @return amount0 Amount of token A actually added
     * @return amount1 Amount of token B actually added
     */
    function addLiquidity(
        bytes32 poolId,
        int24 lowerTick,
        int24 upperTick,
        uint256 amount0Desired,
        uint256 amount1Desired,
        uint256 amount0Min,
        uint256 amount1Min
    ) external override nonReentrant returns (
        bytes32 positionId,
        uint128 liquidity,
        uint256 amount0,
        uint256 amount1
    ) {
        // Gas optimization: Cache pool config and state to avoid multiple storage reads
        PoolConfig memory config = _poolConfigs[poolId];
        require(config.poolId == poolId, "LiquidityPools: pool does not exist");
        require(config.active, "LiquidityPools: pool is not active");
        require(lowerTick < upperTick, "LiquidityPools: lower tick must be less than upper tick");
        require(lowerTick >= MIN_TICK, "LiquidityPools: lower tick too low");
        require(upperTick <= MAX_TICK, "LiquidityPools: upper tick too high");
        require(lowerTick % config.tickSpacing == 0, "LiquidityPools: lower tick not a multiple of spacing");
        require(upperTick % config.tickSpacing == 0, "LiquidityPools: upper tick not a multiple of spacing");
        
        // Gas optimization: Cache the pool state to reduce storage reads
        PoolState memory state = _poolStates[poolId];
        
        // Calculate liquidity amount from desired amounts
        liquidity = _calculateLiquidity(
            state.sqrtPriceX96,
            _getSqrtRatioAtTick(lowerTick),
            _getSqrtRatioAtTick(upperTick),
            amount0Desired,
            amount1Desired
        );
        
        require(liquidity > 0, "LiquidityPools: insufficient liquidity");
        
        // Calculate actual token amounts needed
        (amount0, amount1) = _calculateAmounts(
            state.sqrtPriceX96,
            _getSqrtRatioAtTick(lowerTick),
            _getSqrtRatioAtTick(upperTick),
            liquidity
        );
        
        // Verify minimum amounts
        require(amount0 >= amount0Min, "LiquidityPools: amount0 less than minimum");
        require(amount1 >= amount1Min, "LiquidityPools: amount1 less than minimum");
        
        // Generate position ID
        _positionIdCounter.increment();
        positionId = keccak256(abi.encodePacked(
            _positionIdCounter.current(),
            poolId,
            msg.sender,
            lowerTick,
            upperTick,
            block.timestamp
        ));
        
        // Create the position
        Position storage position = _positions[positionId];
        position.positionId = positionId;
        position.poolId = poolId;
        position.owner = msg.sender;
        position.lowerTick = lowerTick;
        position.upperTick = upperTick;
        position.liquidity = liquidity;
        position.createdAt = uint32(block.timestamp); // Gas optimization: Use uint32 for timestamp
        position.tokensOwedA = 0;  // Initialize as uint128
        position.tokensOwedB = 0;  // Initialize as uint128
        
        // Update indexes
        _userPositions[msg.sender].push(positionId);
        _poolPositions[poolId].push(positionId);
        
        // Gas optimization: Update tick bitmap for both ticks
        _initializeTickRange(poolId, lowerTick, upperTick, config.tickSpacing);
        
        // Update pool state
        PoolState storage stateStorage = _poolStates[poolId];
        stateStorage.totalLiquidity += liquidity;
        stateStorage.lastUpdated = uint32(block.timestamp); // Gas optimization: Use uint32 for timestamp
        
        // Transfer tokens from user
        IERC20(config.tokenA).safeTransferFrom(msg.sender, address(this), amount0);
        IERC20(config.tokenB).safeTransferFrom(msg.sender, address(this), amount1);
        
        emit LiquidityAdded(poolId, positionId, msg.sender, lowerTick, upperTick, liquidity, amount0, amount1);
        
        return (positionId, liquidity, amount0, amount1);
    }
    
    /**
     * @dev Gas-optimized: Initialize multiple ticks at once in a given range
     * @param poolId ID of the pool
     * @param tickLower Lower tick boundary
     * @param tickUpper Upper tick boundary
     * @param tickSpacing Spacing between initialized ticks
     */
    function _initializeTickRange(
        bytes32 poolId,
        int24 tickLower,
        int24 tickUpper,
        uint24 tickSpacing
    ) internal {
        // Ensure tick boundaries are properly spaced
        require(tickLower % int24(tickSpacing) == 0, "LiquidityPools: lower tick not a multiple of spacing");
        require(tickUpper % int24(tickSpacing) == 0, "LiquidityPools: upper tick not a multiple of spacing");
        require(tickLower < tickUpper, "LiquidityPools: lower tick must be less than upper tick");
        
        // Initialize the ticks at the boundaries first (these are always used)
        _updateTickBitmap(poolId, tickLower, true);
        _updateTickBitmap(poolId, tickUpper, true);
        
        // Check if the range requires initializing ticks in-between
        // Only initialize if the range is large enough
        int24 numTicks = (tickUpper - tickLower) / int24(tickSpacing);
        if (numTicks > 2) {
            // We only want to initialize a limited number to avoid excessive gas costs
            uint256 maxTicksToInit = 10; // Limit the number of intermediate ticks to initialize
            
            if (numTicks <= int24(maxTicksToInit + 2)) {
                // Initialize all ticks in the range
                for (int24 tick = tickLower + int24(tickSpacing); tick < tickUpper; tick += int24(tickSpacing)) {
                    _updateTickBitmap(poolId, tick, true);
                }
            } else {
                // Initialize a subset of evenly distributed ticks to optimize future searches
                int24 step = int24((tickUpper - tickLower) / int24(maxTicksToInit));
                // Round step to nearest multiple of tickSpacing
                step = int24((step / int24(tickSpacing) + 1) * int24(tickSpacing));
                
                for (int24 tick = tickLower + step; tick < tickUpper; tick += step) {
                    _updateTickBitmap(poolId, tick - (tick % int24(tickSpacing)), true);
                }
            }
        }
    }
    
    /**
     * @dev Gas-optimized: Initialize or clear multiple ticks at once in a single word of the bitmap
     * @param poolId ID of the pool
     * @param wordPos Word position in the bitmap
     * @param tickMap Bitmap of ticks to update within the word
     * @param initialized Whether to initialize or clear the ticks
     */
    function _updateTickBitmapWordRange(
        bytes32 poolId,
        int16 wordPos,
        uint256 tickMap,
        bool initialized
    ) internal {
        // Load the current word
        uint256 word = _tickBitmap[poolId][wordPos];
        
        // Update the word
        if (initialized) {
            word |= tickMap; // Set bits
        } else {
            word &= ~tickMap; // Clear bits
        }
        
        // Store the updated word
        _tickBitmap[poolId][wordPos] = word;
        
        // Emit a single event for the whole word update to save gas
        emit TickBitmapWordUpdated(poolId, wordPos, word);
    }
    
    /**
     * @dev Gas-optimized: Clear entire tick range when no liquidity remains
     * @param poolId ID of the pool
     * @param tickLower Lower tick boundary
     * @param tickUpper Upper tick boundary
     */
    function _clearTickRange(
        bytes32 poolId,
        int24 tickLower,
        int24 tickUpper
    ) internal {
        // Calculate word positions for lower and upper ticks
        int16 wordPosLower = int16(tickLower / TICK_BITMAP_WORD_SIZE);
        int16 wordPosUpper = int16(tickUpper / TICK_BITMAP_WORD_SIZE);
        
        // If both ticks are in the same word, optimize to a single operation
        if (wordPosLower == wordPosUpper) {
            uint8 bitPosLower = uint8(uint24(tickLower) % uint24(TICK_BITMAP_WORD_SIZE));
            uint8 bitPosUpper = uint8(uint24(tickUpper) % uint24(TICK_BITMAP_WORD_SIZE));
            
            // Create a mask for all bits between lower and upper
            uint256 mask = ((1 << (bitPosUpper - bitPosLower + 1)) - 1) << bitPosLower;
            
            // Clear the bits in a single operation
            uint256 word = _tickBitmap[poolId][wordPosLower];
            word &= ~mask;
            _tickBitmap[poolId][wordPosLower] = word;
            
            emit TickBitmapWordUpdated(poolId, wordPosLower, word);
        } else {
            // Handle multiple words: clear boundary bits individually
            _updateTickBitmap(poolId, tickLower, false);
            _updateTickBitmap(poolId, tickUpper, false);
            
            // For intermediate words (if there are any), clear entire words at once
            for (int16 wordPos = wordPosLower + 1; wordPos < wordPosUpper; wordPos++) {
                _tickBitmap[poolId][wordPos] = 0;
                emit TickBitmapWordUpdated(poolId, wordPos, 0);
            }
        }
    }
    
    /**
     * @dev Gas optimization: Updates the tick bitmap for efficient tick management
     * @param poolId ID of the pool
     * @param tick The tick to update
     * @param initialized Whether the tick is initialized or not
     */
    function _updateTickBitmap(bytes32 poolId, int24 tick, bool initialized) internal {
        // Calculate word position and bit position within the word
        int16 wordPos = int16(tick / TICK_BITMAP_WORD_SIZE);
        uint8 bitPos = uint8(uint24(tick) % uint24(TICK_BITMAP_WORD_SIZE));
        
        // Update the bitmap
        uint256 word = _tickBitmap[poolId][wordPos];
        
        if (initialized) {
            word |= (1 << bitPos);
        } else {
            word &= ~(1 << bitPos);
        }
        
        _tickBitmap[poolId][wordPos] = word;
        
        emit TickBitmapUpdated(poolId, tick, initialized);
    }
    
    /**
     * @dev Gas optimization: Batch collects fees from multiple positions
     * @param positionIds Array of position IDs to collect fees from
     * @return totalAmount0 Total amount of token A fees collected
     * @return totalAmount1 Total amount of token B fees collected
     */
    function batchCollectFees(bytes32[] calldata positionIds) external nonReentrant returns (
        uint256 totalAmount0,
        uint256 totalAmount1
    ) {
        require(positionIds.length > 0, "LiquidityPools: no positions provided");
        
        address firstTokenA;
        address firstTokenB;
        
        for (uint256 i = 0; i < positionIds.length; i++) {
            bytes32 positionId = positionIds[i];
            Position storage position = _positions[positionId];
            
            // Verify ownership
            require(position.owner == msg.sender, "LiquidityPools: not position owner");
            
            // Get the pool configuration
            bytes32 poolId = position.poolId;
            PoolConfig storage config = _poolConfigs[poolId];
            
            // Ensure consistent tokens across all positions
            if (i == 0) {
                firstTokenA = config.tokenA;
                firstTokenB = config.tokenB;
            } else {
                require(config.tokenA == firstTokenA && config.tokenB == firstTokenB, 
                    "LiquidityPools: positions must use same tokens");
            }
            
            // Calculate fees for this position
            (uint256 fee0, uint256 fee1) = _calculateFees(positionId);
            
            // Add to totals
            totalAmount0 += fee0;
            totalAmount1 += fee1;
            
            // Reset fees owed
            position.tokensOwedA = 0;
            position.tokensOwedB = 0;
        }
        
        // Transfer collected fees
        if (totalAmount0 > 0) {
            IERC20(firstTokenA).safeTransfer(msg.sender, totalAmount0);
        }
        if (totalAmount1 > 0) {
            IERC20(firstTokenB).safeTransfer(msg.sender, totalAmount1);
        }
        
        emit BatchFeesCollected(msg.sender, positionIds, totalAmount0, totalAmount1);
        
        return (totalAmount0, totalAmount1);
    }
    
    /**
     * @dev Removes liquidity from a position
     * @param positionId ID of the position
     * @param liquidityAmount Amount of liquidity to remove
     * @param amount0Min Minimum amount of token A to receive
     * @param amount1Min Minimum amount of token B to receive
     * @return amount0 Amount of token A actually received
     * @return amount1 Amount of token B actually received
     */
    function removeLiquidity(
        bytes32 positionId,
        uint128 liquidityAmount,
        uint256 amount0Min,
        uint256 amount1Min
    ) external override nonReentrant returns (
        uint256 amount0,
        uint256 amount1
    ) {
        // Validate position
        Position storage position = _positions[positionId];
        require(position.positionId == positionId, "LiquidityPools: position does not exist");
        require(position.owner == msg.sender, "LiquidityPools: not position owner");
        require(liquidityAmount > 0 && liquidityAmount <= position.liquidity, "LiquidityPools: invalid liquidity amount");
        
        bytes32 poolId = position.poolId;
        PoolConfig storage config = _poolConfigs[poolId];
        PoolState storage state = _poolStates[poolId];
        
        // Calculate token amounts to return
        (amount0, amount1) = _calculateAmounts(
            state.sqrtPriceX96,
            _getSqrtRatioAtTick(position.lowerTick),
            _getSqrtRatioAtTick(position.upperTick),
            liquidityAmount
        );
        
        // Ensure minimum amounts are satisfied
        require(amount0 >= amount0Min, "LiquidityPools: amount0 less than minimum");
        require(amount1 >= amount1Min, "LiquidityPools: amount1 less than minimum");
        
        // Gas optimization: Check if fully removing liquidity from this position
        bool isFullRemoval = liquidityAmount == position.liquidity;
        
        // Update position
        position.liquidity -= liquidityAmount;
        
        // Update pool state
        state.totalLiquidity -= liquidityAmount;
        
        // Calculate and add any uncollected fees
        (uint256 fee0, uint256 fee1) = _calculateFees(positionId);
        position.tokensOwedA += fee0;
        position.tokensOwedB += fee1;
        
        // Gas optimization: Handle tick management for full removals
        if (isFullRemoval) {
            // Check if any other position uses these ticks before clearing
            bool lowerTickStillUsed = _isTickStillUsed(poolId, position.lowerTick, positionId);
            bool upperTickStillUsed = _isTickStillUsed(poolId, position.upperTick, positionId);
            
            // Clear ticks if no other position is using them
            if (!lowerTickStillUsed) {
                _updateTickBitmap(poolId, position.lowerTick, false);
            }
            if (!upperTickStillUsed) {
                _updateTickBitmap(poolId, position.upperTick, false);
            }
        }
        
        // Transfer tokens to user
        IERC20(config.tokenA).safeTransfer(msg.sender, amount0);
        IERC20(config.tokenB).safeTransfer(msg.sender, amount1);
        
        emit LiquidityRemoved(poolId, positionId, msg.sender, position.lowerTick, position.upperTick, liquidityAmount, amount0, amount1);
        
        return (amount0, amount1);
    }
    
    /**
     * @dev Gas optimization: Check if a tick is still used by other positions
     * @param poolId ID of the pool
     * @param tick The tick to check
     * @param excludedPositionId Position ID to exclude from the check
     * @return True if the tick is still used by other positions
     */
    function _isTickStillUsed(
        bytes32 poolId,
        int24 tick,
        bytes32 excludedPositionId
    ) internal view returns (bool) {
        bytes32[] memory poolPositions = _poolPositions[poolId];
        
        // Check if any remaining position uses this tick
        for (uint256 i = 0; i < poolPositions.length; i++) {
            bytes32 posId = poolPositions[i];
            
            // Skip the position being removed
            if (posId == excludedPositionId) continue;
            
            // Skip positions with no liquidity
            if (_positions[posId].liquidity == 0) continue;
            
            // Check if this position uses the tick
            if (_positions[posId].lowerTick == tick || _positions[posId].upperTick == tick) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * @dev Collects fees from a position
     * @param positionId ID of the position
     * @param recipient Address to send the collected fees to
     * @return amount0 Amount of token A collected
     * @return amount1 Amount of token B collected
     */
    function collectFees(
        bytes32 positionId,
        address recipient
    ) external override nonReentrant returns (
        uint256 amount0,
        uint256 amount1
    ) {
        // Validate position
        Position storage position = _positions[positionId];
        require(position.positionId == positionId, "LiquidityPools: position does not exist");
        require(position.owner == msg.sender, "LiquidityPools: not position owner");
        require(recipient != address(0), "LiquidityPools: recipient cannot be zero address");
        
        bytes32 poolId = position.poolId;
        PoolConfig storage config = _poolConfigs[poolId];
        
        // Calculate any uncollected fees
        (uint256 fee0, uint256 fee1) = _calculateFees(positionId);
        position.tokensOwedA += fee0;
        position.tokensOwedB += fee1;
        
        // Get total fees to collect
        amount0 = position.tokensOwedA;
        amount1 = position.tokensOwedB;
        
        // Reset owed amounts
        position.tokensOwedA = 0;
        position.tokensOwedB = 0;
        
        // Transfer fees to recipient
        if (amount0 > 0) {
            IERC20(config.tokenA).safeTransfer(recipient, amount0);
        }
        if (amount1 > 0) {
            IERC20(config.tokenB).safeTransfer(recipient, amount1);
        }
        
        emit FeesCollected(poolId, positionId, msg.sender, amount0, amount1);
        
        return (amount0, amount1);
    }
    
    /**
     * @dev Gas-optimized: Computes the result of a swap step with efficient tick traversal
     * @param poolId ID of the pool
     * @param sqrtPriceX96 Current sqrt price
     * @param tick Current tick
     * @param liquidity Current liquidity
     * @param amountSpecified Amount of token to swap (can be negative)
     * @param zeroForOne Whether the swap is from token A to token B
     * @param sqrtPriceLimitX96 Price limit for the swap
     * @param feeTier Fee tier in basis points
     * @return amount0 Amount of token A swapped
     * @return amount1 Amount of token B swapped
     * @return sqrtPriceX96After New sqrt price after the swap
     * @return tickAfter New tick after the swap
     */
    function _computeSwapStep(
        bytes32 poolId,
        uint160 sqrtPriceX96,
        int24 tick,
        uint128 liquidity,
        int256 amountSpecified,
        bool zeroForOne,
        uint160 sqrtPriceLimitX96,
        uint24 feeTier
    ) internal view returns (
        int256 amount0,
        int256 amount1,
        uint160 sqrtPriceX96After,
        int24 tickAfter
    ) {
        // Initialize return values
        amount0 = 0;
        amount1 = 0;
        sqrtPriceX96After = sqrtPriceX96;
        tickAfter = tick;
        
        // If there's no liquidity, we can't swap
        if (liquidity == 0) {
            return (amount0, amount1, sqrtPriceX96After, tickAfter);
        }
        
        // Gas optimization: Cache these values to reduce storage reads
        bool exactInput = amountSpecified >= 0;
        uint256 absAmountSpecified = exactInput ? uint256(amountSpecified) : uint256(-amountSpecified);
        
        // Calculate fee percentage (feeTier is in basis points, convert to percentage)
        uint256 feePercentage = uint256(feeTier);
        
        // Gas optimization: Calculate fee amount just once
        uint256 feeAmount = (absAmountSpecified * feePercentage) / 10000;
        uint256 amountAfterFee = absAmountSpecified - feeAmount;
        
        // Gas optimization: Cache tick spacing from pool config
        PoolConfig memory config = _poolConfigs[poolId];
        uint24 tickSpacing = config.tickSpacing;
        
        // Track how much input amount has been used and how much output has been received
        uint256 amountUsed = 0;
        uint256 amountReceived = 0;
        
        // Initialize swap variables
        uint160 currentSqrtPrice = sqrtPriceX96;
        int24 currentTick = tick;
        uint128 currentLiquidity = liquidity;
        
        // Main swap logic would go here - simplified for this implementation
        // In a real implementation, this would include tick traversal and liquidity updates
        
        // Simplified calculation for demonstration (replace with actual swap math)
        if (zeroForOne) {
            // token0 (input) -> token1 (output)
            amountUsed = amountAfterFee;
            amountReceived = (amountAfterFee * uint256(currentSqrtPrice)) / Q96;
            currentSqrtPrice = uint160(uint256(currentSqrtPrice) - (amountAfterFee / uint256(currentLiquidity)));
        } else {
            // token1 (input) -> token0 (output)
            amountUsed = amountAfterFee;
            amountReceived = (amountAfterFee * Q96) / uint256(currentSqrtPrice);
            currentSqrtPrice = uint160(uint256(currentSqrtPrice) + (amountAfterFee / uint256(currentLiquidity)));
        }
        
        // Ensure price doesn't cross the limit
        if (zeroForOne && currentSqrtPrice < sqrtPriceLimitX96) {
            currentSqrtPrice = sqrtPriceLimitX96;
        } else if (!zeroForOne && currentSqrtPrice > sqrtPriceLimitX96) {
            currentSqrtPrice = sqrtPriceLimitX96;
        }
        
        // Calculate the resulting tick from the new price
        currentTick = _getTickAtSqrtRatio(currentSqrtPrice);
        
        // Assign final results
        sqrtPriceX96After = currentSqrtPrice;
        tickAfter = currentTick;
        
        // Set amounts based on swap direction
        if (zeroForOne) {
            // token0 (input) -> token1 (output)
            amount0 = -int256(amountUsed + feeAmount); // Negative because token0 is spent
            amount1 = int256(amountReceived);          // Positive because token1 is received
        } else {
            // token1 (input) -> token0 (output)
            amount0 = int256(amountReceived);          // Positive because token0 is received
            amount1 = -int256(amountUsed + feeAmount); // Negative because token1 is spent
        }
        
        // Update the global fee growth accumulators
        uint256 protocolFeeAmount = (feeAmount * protocolFee) / 10000;
        uint256 poolFeeAmount = feeAmount - protocolFeeAmount;
        
        // Update global fee growth based on collected fees
        _updateGlobalFeeGrowth(
            zeroForOne ? poolFeeAmount : 0,
            zeroForOne ? 0 : poolFeeAmount,
            currentLiquidity
        );
        
        return (amount0, amount1, sqrtPriceX96After, tickAfter);
    }
    
    /**
     * @dev Gas-optimized: Calculate the amount of tokens exchanged in a single swap step
     * @param sqrtPriceStart Starting sqrt price
     * @param sqrtPriceTarget Target sqrt price
     * @param liquidity Available liquidity
     * @param amountRemaining Remaining amount to swap
     * @param zeroForOne Whether the swap is from token A to token B
     * @return amountIn Amount of input token used
     * @return amountOut Amount of output token received
     */
    function _calculateSwapStep(
        uint160 sqrtPriceStart,
        uint160 sqrtPriceTarget,
        uint128 liquidity,
        uint256 amountRemaining,
        bool zeroForOne
    ) internal pure returns (
        uint256 amountIn,
        uint256 amountOut
    ) {
        // Calculate the price delta
        uint256 priceDelta = zeroForOne
            ? uint256(sqrtPriceStart - sqrtPriceTarget)
            : uint256(sqrtPriceTarget - sqrtPriceStart);
        
        // If no price change, return zero amounts
        if (priceDelta == 0) {
            return (0, 0);
        }
        
        // Calculate the maximum amount that can be swapped at the current liquidity
        uint256 maxDx;
        if (zeroForOne) {
            // For token0 -> token1: Calculate max amount of token0 that can be swapped
            maxDx = _getAmount0Delta(sqrtPriceTarget, sqrtPriceStart, liquidity);
        } else {
            // For token1 -> token0: Calculate max amount of token1 that can be swapped
            maxDx = _getAmount1Delta(sqrtPriceStart, sqrtPriceTarget, liquidity);
        }
        
        // Determine how much we'll actually swap in this step
        amountIn = amountRemaining < maxDx ? amountRemaining : maxDx;
        
        // Calculate the actual price after the swap
        uint160 nextPrice;
        if (amountIn == maxDx) {
            // If we're using the maximum amount, we'll reach the target price
            nextPrice = sqrtPriceTarget;
        } else {
            // Otherwise, calculate the price impact of the input amount
            // This is a simplification - in a full implementation, this would be more complex
            uint256 amountRatio = (amountIn * Q96) / uint256(liquidity);
            
            if (zeroForOne) {
                nextPrice = uint160(uint256(sqrtPriceStart) - amountRatio);
                if (nextPrice < sqrtPriceTarget) nextPrice = sqrtPriceTarget;
            } else {
                nextPrice = uint160(uint256(sqrtPriceStart) + amountRatio);
                if (nextPrice > sqrtPriceTarget) nextPrice = sqrtPriceTarget;
            }
        }
        
        // Calculate the output amount based on the actual price change
        if (zeroForOne) {
            amountOut = _getAmount1Delta(nextPrice, sqrtPriceStart, liquidity);
        } else {
            amountOut = _getAmount0Delta(sqrtPriceStart, nextPrice, liquidity);
        }
        
        return (amountIn, amountOut);
    }
    
    /**
     * @dev Gas-optimized: Get the net liquidity change when crossing a tick
     * @param poolId ID of the pool
     * @param tick The tick being crossed
     * @param zeroForOne The direction of the swap
     * @return liquidityDelta Net liquidity change (positive for increasing, negative for decreasing)
     */
    function _getLiquidityDeltaForTick(
        bytes32 poolId,
        int24 tick,
        bool zeroForOne
    ) internal view returns (int128 liquidityDelta) {
        // Get all positions in the pool
        bytes32[] memory positions = _poolPositions[poolId];
        
        int128 netLiquidityChange = 0;
        
        // Iterate through all positions to find those using this tick
        for (uint256 i = 0; i < positions.length; i++) {
            Position storage position = _positions[positions[i]];
            
            // Skip positions with no liquidity
            if (position.liquidity == 0) continue;
            
            // When crossing a tick, we need to consider its effect on liquidity
            if (position.lowerTick == tick) {
                // Entering the position's range when going up (0->1)
                // Exiting the position's range when going down (1->0)
                netLiquidityChange += zeroForOne 
                    ? -int128(uint128(position.liquidity))  // Negative when exiting
                    : int128(uint128(position.liquidity));   // Positive when entering
            }
            
            if (position.upperTick == tick) {
                // Exiting the position's range when going up (0->1)
                // Entering the position's range when going down (1->0)
                netLiquidityChange += zeroForOne
                    ? int128(uint128(position.liquidity))    // Positive when entering
                    : -int128(uint128(position.liquidity));  // Negative when exiting
            }
        }
        
        return netLiquidityChange;
    }
    
    /**
     * @dev Gas-optimized function to find the next initialized tick in the bitmap
     * @param poolId ID of the pool to search in
     * @param tick The starting tick
     * @param tickSpacing The spacing between ticks
     * @param lte Whether to search for ticks less than or equal to the starting tick
     * @return next The next initialized tick in the specified direction
     * @return initialized Whether the returned tick is initialized
     */
    function _nextInitializedTick(
        bytes32 poolId,
        int24 tick,
        uint24 tickSpacing,
        bool lte
    ) internal view returns (int24 next, bool initialized) {
        // First, align the tick to the tick spacing
        int24 compressed = _compressTickToSpacing(tick, tickSpacing, lte);
        
        if (lte) {
            // Search downward for an initialized tick
            // Start by calculating the word position and bit position within the word
            int16 wordPos = int16(compressed / TICK_BITMAP_WORD_SIZE);
            uint8 bitPos = uint8(uint24(compressed) % uint24(TICK_BITMAP_WORD_SIZE));
            
            // Get the word from storage
            uint256 word = _tickBitmap[poolId][wordPos];
            
            // Mask out higher bits in the same word to find ticks at or below
            uint256 mask = (1 << bitPos) - 1 + (1 << bitPos);
            uint256 maskedWord = word & mask;
            
            // If there are initialized ticks at or below in the current word
            if (maskedWord != 0) {
                // Find the most significant bit that is set
                uint8 mostSignificantBit = _getMostSignificantBit(maskedWord);
                next = (int24(wordPos) * TICK_BITMAP_WORD_SIZE) + int24(mostSignificantBit);
                initialized = true;
            } else {
                // Search previous words until we find an initialized tick or reach the minimum word
                wordPos--;
                while (wordPos >= int16(MIN_TICK / TICK_BITMAP_WORD_SIZE)) {
                    word = _tickBitmap[poolId][wordPos];
                    if (word != 0) {
                        // Find the most significant bit that is set
                        uint8 mostSignificantBit = _getMostSignificantBit(word);
                        next = (int24(wordPos) * TICK_BITMAP_WORD_SIZE) + int24(mostSignificantBit);
                        initialized = true;
                        break;
                    }
                    wordPos--;
                }
                
                // If no initialized tick found, return the minimum tick
                if (!initialized) {
                    next = MIN_TICK;
                }
            }
        } else {
            // Search upward for an initialized tick
            // Start by calculating the word position and bit position within the word
            int16 wordPos = int16(compressed / TICK_BITMAP_WORD_SIZE);
            uint8 bitPos = uint8(uint24(compressed) % uint24(TICK_BITMAP_WORD_SIZE));
            
            // Get the word from storage
            uint256 word = _tickBitmap[poolId][wordPos];
            
            // Mask out lower bits in the same word to find ticks above
            uint256 mask = ~((1 << bitPos) - 1);
            uint256 maskedWord = word & mask;
            
            // If there are initialized ticks above in the current word
            if (maskedWord != 0) {
                // Find the least significant bit that is set
                uint8 leastSignificantBit = _getLeastSignificantBit(maskedWord);
                next = (int24(wordPos) * TICK_BITMAP_WORD_SIZE) + int24(leastSignificantBit);
                initialized = true;
            } else {
                // Search subsequent words until we find an initialized tick or reach the maximum word
                wordPos++;
                while (wordPos <= int16(MAX_TICK / TICK_BITMAP_WORD_SIZE)) {
                    word = _tickBitmap[poolId][wordPos];
                    if (word != 0) {
                        // Find the least significant bit that is set
                        uint8 leastSignificantBit = _getLeastSignificantBit(word);
                        next = (int24(wordPos) * TICK_BITMAP_WORD_SIZE) + int24(leastSignificantBit);
                        initialized = true;
                        break;
                    }
                    wordPos++;
                }
                
                // If no initialized tick found, return the maximum tick
                if (!initialized) {
                    next = MAX_TICK;
                }
            }
        }
        
        return (next, initialized);
    }
    
    /**
     * @dev Gas-optimized function to compress a tick to a valid tick spacing
     * @param tick The tick to compress
     * @param tickSpacing The spacing between ticks
     * @param lte Whether to round down (less than or equal) or up (greater than or equal)
     * @return The compressed tick
     */
    function _compressTickToSpacing(int24 tick, uint24 tickSpacing, bool lte) private pure returns (int24) {
        int24 compressed;
        if (tick < 0 && tick % int24(tickSpacing) != 0) {
            compressed = lte
                ? tick - (tick % int24(tickSpacing))
                : tick - (tick % int24(tickSpacing)) + int24(tickSpacing);
        } else {
            compressed = lte
                ? tick - (tick % int24(tickSpacing))
                : tick + int24(tickSpacing) - (tick % int24(tickSpacing));
        }
        
        // Ensure the compressed tick is within bounds
        if (compressed < MIN_TICK) {
            compressed = MIN_TICK;
        } else if (compressed > MAX_TICK) {
            compressed = MAX_TICK;
        }
        
        return compressed;
    }
    
    /**
     * @dev Gas-optimized function to find the most significant bit in a word
     * @param x The word to find the MSB in
     * @return r The position of the most significant bit
     */
    function _getMostSignificantBit(uint256 x) private pure returns (uint8 r) {
        require(x > 0, "LiquidityPools: x cannot be zero");
        
        if (x >= 0x100000000000000000000000000000000) {
            x >>= 128;
            r += 128;
        }
        if (x >= 0x10000000000000000) {
            x >>= 64;
            r += 64;
        }
        if (x >= 0x100000000) {
            x >>= 32;
            r += 32;
        }
        if (x >= 0x10000) {
            x >>= 16;
            r += 16;
        }
        if (x >= 0x100) {
            x >>= 8;
            r += 8;
        }
        if (x >= 0x10) {
            x >>= 4;
            r += 4;
        }
        if (x >= 0x4) {
            x >>= 2;
            r += 2;
        }
        if (x >= 0x2) r += 1;
        
        return r;
    }
    
    /**
     * @dev Gas-optimized function to find the least significant bit in a word
     * @param x The word to find the LSB in
     * @return r The position of the least significant bit
     */
    function _getLeastSignificantBit(uint256 x) private pure returns (uint8 r) {
        require(x > 0, "LiquidityPools: x cannot be zero");
        
        // Count trailing zeros - use binary search approach
        r = 255;
        
        // Check if lower 128 bits are zeros
        if (x & 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF > 0) {
            r -= 128;
        } else {
            x >>= 128;
        }
        
        // Check if lower 64 bits are zeros
        if (x & 0xFFFFFFFFFFFFFFFF > 0) {
            r -= 64;
        } else {
            x >>= 64;
        }
        
        // Check if lower 32 bits are zeros
        if (x & 0xFFFFFFFF > 0) {
            r -= 32;
        } else {
            x >>= 32;
        }
        
        // Check if lower 16 bits are zeros
        if (x & 0xFFFF > 0) {
            r -= 16;
        } else {
            x >>= 16;
        }
        
        // Check if lower 8 bits are zeros
        if (x & 0xFF > 0) {
            r -= 8;
        } else {
            x >>= 8;
        }
        
        // Check if lower 4 bits are zeros
        if (x & 0xF > 0) {
            r -= 4;
        } else {
            x >>= 4;
        }
        
        // Check if lower 2 bits are zeros
        if (x & 0x3 > 0) {
            r -= 2;
        } else {
            x >>= 2;
        }
        
        // Check if the lowest bit is 0
        if (x & 0x1 > 0) {
            r -= 1;
        }
        
        return r;
    }
    
    /**
     * @dev Executes a swap in a pool with optimized path execution
     * @param poolId ID of the pool
     * @param recipient Address to receive the output tokens
     * @param zeroForOne Whether the swap is from token A to token B
     * @param amountSpecified Amount of input token to swap (positive for exact input, negative for exact output)
     * @param sqrtPriceLimitX96 Price limit for the swap
     * @return amount0 Amount of token A swapped
     * @return amount1 Amount of token B swapped
     * @notice This function is protected against reentrancy
     */
    function swap(
        bytes32 poolId,
        address recipient,
        bool zeroForOne,
        int256 amountSpecified,
        uint160 sqrtPriceLimitX96
    ) external override nonReentrant returns (
        int256 amount0,
        int256 amount1
    ) {
        // --- CHECKS ---
        
        // Check input validity using custom errors
        if (amountSpecified == 0) {
            revert AmountTooLow(0, 1);
        }
        
        if (recipient == address(0)) {
            revert InvalidZeroAddress();
        }
        
        // Gas optimization: Cache pool configuration and state
        PoolConfig memory config = _poolConfigs[poolId];
        if (config.poolId != poolId) {
            revert PoolNotFound(poolId);
        }
        if (!config.active) {
            revert PoolNotFound(poolId);
        }
        
        // Cache pool state
        PoolState memory state = _poolStates[poolId];
        
        // Set appropriate price limit if not specified by user
        if (sqrtPriceLimitX96 == 0) {
            sqrtPriceLimitX96 = zeroForOne ? MIN_SQRT_RATIO + 1 : MAX_SQRT_RATIO - 1;
        }
        
        // Gas optimization: Validate price limit based on swap direction
        if (zeroForOne) {
            if (sqrtPriceLimitX96 >= state.sqrtPriceX96 || sqrtPriceLimitX96 <= MIN_SQRT_RATIO) {
                revert PriceLimitReached(sqrtPriceLimitX96, state.sqrtPriceX96);
            }
        } else {
            if (sqrtPriceLimitX96 <= state.sqrtPriceX96 || sqrtPriceLimitX96 >= MAX_SQRT_RATIO) {
                revert PriceLimitReached(sqrtPriceLimitX96, state.sqrtPriceX96);
            }
        }
        
        // Gas optimization: Use local variables to reduce storage reads
        bool exactInput = amountSpecified > 0;
        
        // Initialize remaining amount to be swapped
        int256 amountRemaining = amountSpecified;
        
        // Swap direction local variables
        address tokenIn = zeroForOne ? config.tokenA : config.tokenB;
        address tokenOut = zeroForOne ? config.tokenB : config.tokenA;
        
        // --- EFFECTS ---
        
        // Gas optimization: Cache current state variables
        uint160 currentSqrtPrice = state.sqrtPriceX96;
        int24 currentTick = state.tick;
        uint128 currentLiquidity = state.totalLiquidity;
        
        // Keep swapping while we have remaining amount and haven't reached price limit
        while (amountRemaining != 0 && currentSqrtPrice != sqrtPriceLimitX96) {
            // Find the next initialized tick for the swap
            int24 nextTick;
            bool initialized;
            (nextTick, initialized) = _nextInitializedTick(
                poolId,
                currentTick,
                config.tickSpacing,
                zeroForOne
            );
            
            // Compute the sqrt price at the next tick
            uint160 nextTickPrice = _getSqrtRatioAtTick(nextTick);
            
            // Determine target price for this step - either the next tick price or the price limit
            uint160 targetPrice = zeroForOne
                ? (nextTickPrice < sqrtPriceLimitX96 ? nextTickPrice : sqrtPriceLimitX96)
                : (nextTickPrice > sqrtPriceLimitX96 ? nextTickPrice : sqrtPriceLimitX96);
            
            // Execute the swap step with the optimized single function call
            (int256 stepAmount0, int256 stepAmount1, uint160 nextSqrtPrice, int24 nextTick) = _computeSwapStep(
                poolId,
                currentSqrtPrice,
                currentTick,
                currentLiquidity,
                amountRemaining,
                zeroForOne,
                targetPrice,
                config.feeTier
            );
            
            // Update running totals
            amount0 += stepAmount0;
            amount1 += stepAmount1;
            
            // Update remaining amount based on swap direction
            amountRemaining = zeroForOne
                ? amountRemaining + stepAmount0
                : amountRemaining + stepAmount1;
            
            // Update prices and ticks for next iteration
            currentSqrtPrice = nextSqrtPrice;
            currentTick = nextTick;
            
            // If we reached an initialized tick, update liquidity
            if (currentSqrtPrice == nextTickPrice && initialized) {
                // Calculate liquidity change when crossing a tick
                int128 liquidityDelta = _getLiquidityDeltaForTick(poolId, nextTick, zeroForOne);
                
                // Update current liquidity
                if (zeroForOne) {
                    currentLiquidity = liquidityDelta < 0
                        ? currentLiquidity - uint128(-liquidityDelta)
                        : currentLiquidity + uint128(liquidityDelta);
                } else {
                    currentLiquidity = liquidityDelta > 0
                        ? currentLiquidity + uint128(liquidityDelta)
                        : currentLiquidity - uint128(-liquidityDelta);
                }
            }
        }
        
        // Update pool state before any external calls
        PoolState storage stateStorage = _poolStates[poolId];
        stateStorage.sqrtPriceX96 = currentSqrtPrice;
        stateStorage.tick = currentTick;
        stateStorage.lastUpdated = uint32(block.timestamp);
        
        // Gas optimization: Only update these if they've changed
        if (currentLiquidity != stateStorage.totalLiquidity) {
            stateStorage.totalLiquidity = currentLiquidity;
        }
        
        // Update pool volume tracking
        if (zeroForOne) {
            stateStorage.volumeTokenA += uint256(-amount0);
            stateStorage.volumeTokenB += uint256(amount1);
        } else {
            stateStorage.volumeTokenA += uint256(amount0);
            stateStorage.volumeTokenB += uint256(-amount1);
        }
        
        // --- INTERACTIONS ---
        
        // Transfer tokens to the contract first if exact input
        if (exactInput) {
            uint256 amountIn = uint256(amountSpecified);
            IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        }
        // If exact output, transfer necessary tokens from user
        else if (amountRemaining < 0) {
            // For exact output, we've calculated how much input we need
            int256 amountIn = zeroForOne ? -amount0 : -amount1;
            IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), uint256(amountIn));
        }
        
        // Transfer output tokens to recipient
        int256 amountOut = zeroForOne ? amount1 : amount0;
        if (amountOut > 0) {
            IERC20(tokenOut).safeTransfer(recipient, uint256(amountOut));
        }
        
        emit Swap(
            poolId,
            msg.sender,
            recipient,
            amount0,
            amount1,
            currentSqrtPrice,
            currentLiquidity,
            currentTick
        );
        
        return (amount0, amount1);
    }
    
    /**
     * @dev Gas-optimized: Get amount0 delta between two prices
     * @param sqrtRatioA First sqrt price
     * @param sqrtRatioB Second sqrt price
     * @param liquidity The amount of liquidity
     * @return amount0 The amount of token0
     */
    function _getAmount0Delta(
        uint160 sqrtRatioA,
        uint160 sqrtRatioB,
        uint128 liquidity
    ) internal pure returns (uint256 amount0) {
        // Ensure sqrtRatioA <= sqrtRatioB for the calculation
        if (sqrtRatioA > sqrtRatioB) {
            (sqrtRatioA, sqrtRatioB) = (sqrtRatioB, sqrtRatioA);
        }
        
        // Gas optimization: Avoid division and rounding issues with order of operations
        uint256 numerator1 = uint256(liquidity) << 96;
        uint256 numerator2 = sqrtRatioB - sqrtRatioA;
        
        // Return 0 if no price difference
        if (numerator2 == 0) return 0;
        
        // Calculate amount0 = L * (1/sqrtRatioB - 1/sqrtRatioA)
        // Rewritten as: L * (sqrtRatioB - sqrtRatioA) / (sqrtRatioA * sqrtRatioB)
        amount0 = (numerator1 * numerator2) / uint256(sqrtRatioB) / uint256(sqrtRatioA);
        
        return amount0;
    }
    
    /**
     * @dev Gas-optimized: Get amount1 delta between two prices
     * @param sqrtRatioA First sqrt price
     * @param sqrtRatioB Second sqrt price
     * @param liquidity The amount of liquidity
     * @return amount1 The amount of token1
     */
    function _getAmount1Delta(
        uint160 sqrtRatioA,
        uint160 sqrtRatioB,
        uint128 liquidity
    ) internal pure returns (uint256 amount1) {
        // Ensure sqrtRatioA <= sqrtRatioB for the calculation
        if (sqrtRatioA > sqrtRatioB) {
            (sqrtRatioA, sqrtRatioB) = (sqrtRatioB, sqrtRatioA);
        }
        
        // Calculate amount1 = L * (sqrtRatioB - sqrtRatioA)
        amount1 = uint256(liquidity) * (uint256(sqrtRatioB) - uint256(sqrtRatioA)) / Q96;
        
        return amount1;
    }
    
    /**
     * @dev Gas-optimized: Update global fee growth based on collected fees
     * @param fee0 Amount of token A fees
     * @param fee1 Amount of token B fees
     * @param liquidity Current liquidity
     */
    function _updateGlobalFeeGrowth(
        uint256 fee0,
        uint256 fee1,
        uint128 liquidity
    ) internal {
        // Only update if there's liquidity and fees
        if (liquidity > 0) {
            if (fee0 > 0) {
                // Convert raw fee amount to fee growth per unit of liquidity
                uint256 feeGrowth = (fee0 * 1e18) / uint256(liquidity);
                globalFeeGrowth0 += feeGrowth;
            }
            
            if (fee1 > 0) {
                // Convert raw fee amount to fee growth per unit of liquidity
                uint256 feeGrowth = (fee1 * 1e18) / uint256(liquidity);
                globalFeeGrowth1 += feeGrowth;
            }
        }
    }
    
    /**
     * @dev Changes the fee tier of a pool
     * @param poolId ID of the pool
     * @param newFeeTier New fee tier in basis points
     * @return success Boolean indicating if the fee was changed successfully
     * @notice Only FEE_MANAGER_ROLE or the pool owner can call this function
     */
    function setPoolFee(bytes32 poolId, uint24 newFeeTier) external override returns (bool success) {
        // Validate input using custom error
        if (newFeeTier == 0 || newFeeTier > 10000) {
            revert InvalidFeeTier(newFeeTier, 1, 10000);
        }
        
        // Get pool configuration
        PoolConfig storage config = _poolConfigs[poolId];
        if (config.poolId != poolId) {
            revert PoolNotFound(poolId);
        }
        
        // Security enhancement: Check for proper role or ownership
        if (!hasRole(FEE_MANAGER_ROLE, msg.sender) && config.owner != msg.sender) {
            revert Unauthorized(msg.sender, FEE_MANAGER_ROLE);
        }
        
        // Update fee tier
        uint24 oldFeeTier = config.feeTier;
        config.feeTier = newFeeTier;
        
        // Emit event
        emit FeeChanged(poolId, oldFeeTier, newFeeTier);
        
        return true;
    }
    
    /**
     * @dev Updates the protocol fee percentage
     * @param newProtocolFee New protocol fee in basis points (e.g., 10 = 0.1%)
     * @notice Only PROTOCOL_FEE_MANAGER_ROLE can call this function
     */
    function setProtocolFee(uint16 newProtocolFee) external {
        // Check that caller has the appropriate role
        if (!hasRole(PROTOCOL_FEE_MANAGER_ROLE, msg.sender)) {
            revert Unauthorized(msg.sender, PROTOCOL_FEE_MANAGER_ROLE);
        }
        
        // Validate the new fee is within reasonable bounds (max 5%)
        if (newProtocolFee > 500) {
            revert InvalidFeeTier(newProtocolFee, 0, 500);
        }
        
        // Update the protocol fee
        uint16 oldProtocolFee = protocolFee;
        protocolFee = newProtocolFee;
        
        // Emit an event for the fee change
        emit ProtocolFeeUpdated(oldProtocolFee, newProtocolFee);
    }
    
    /**
     * @dev Updates the protocol fee recipient address
     * @param newFeeRecipient New address to receive protocol fees
     * @notice Only PROTOCOL_FEE_MANAGER_ROLE can call this function
     */
    function setProtocolFeeRecipient(address newFeeRecipient) external {
        // Check that caller has the appropriate role
        if (!hasRole(PROTOCOL_FEE_MANAGER_ROLE, msg.sender)) {
            revert Unauthorized(msg.sender, PROTOCOL_FEE_MANAGER_ROLE);
        }
        
        // Validate the new recipient is not the zero address
        if (newFeeRecipient == address(0)) {
            revert InvalidZeroAddress();
        }
        
        // Update the fee recipient
        address oldFeeRecipient = protocolFeeRecipient;
        protocolFeeRecipient = newFeeRecipient;
        
        // Emit an event for the recipient change
        emit ProtocolFeeRecipientUpdated(oldFeeRecipient, newFeeRecipient);
    }
    
    // View functions
    
    /**
     * @dev Gets the pool configuration
     * @param poolId ID of the pool
     * @return config The pool configuration
     */
    function getPoolConfig(bytes32 poolId) external view override returns (PoolConfig memory config) {
        return _poolConfigs[poolId];
    }
    
    /**
     * @dev Gets the current state of a pool
     * @param poolId ID of the pool
     * @return state The current state of the pool
     */
    function getPoolState(bytes32 poolId) external view override returns (PoolState memory state) {
        return _poolStates[poolId];
    }
    
    /**
     * @dev Gets a position's details
     * @param positionId ID of the position
     * @return position The position details
     */
    function getPosition(bytes32 positionId) external view override returns (Position memory position) {
        return _positions[positionId];
    }
    
    /**
     * @dev Gets all positions for a user
     * @param user Address of the user
     * @return positionIds Array of position IDs owned by the user
     */
    function getUserPositions(address user) external view override returns (bytes32[] memory positionIds) {
        return _userPositions[user];
    }
    
    /**
     * @dev Gets all positions in a pool
     * @param poolId ID of the pool
     * @return positionIds Array of position IDs in the pool
     */
    function getPoolPositions(bytes32 poolId) external view override returns (bytes32[] memory positionIds) {
        return _poolPositions[poolId];
    }
    
    /**
     * @dev Gets the price of a pool
     * @param poolId ID of the pool
     * @return sqrtPriceX96 The current sqrt price as a Q64.96
     * @return tick The current tick
     */
    function getPoolPrice(bytes32 poolId) external view override returns (uint160 sqrtPriceX96, int24 tick) {
        PoolState storage state = _poolStates[poolId];
        return (state.sqrtPriceX96, state.tick);
    }
    
    /**
     * @dev Gets all pools
     * @return poolIds Array of pool IDs
     */
    function getAllPools() external view override returns (bytes32[] memory poolIds) {
        return _allPoolIds;
    }
    
    /**
     * @dev Gets pools containing a specific token
     * @param token Address of the token
     * @return poolIds Array of pool IDs containing the token
     */
    function getPoolsByToken(address token) external view override returns (bytes32[] memory poolIds) {
        return _tokenPools[token];
    }
    
    /**
     * @dev Gets pools for a specific asset class
     * @param assetClass The asset class
     * @return poolIds Array of pool IDs containing tokens of the asset class
     */
    function getPoolsByAssetClass(IAssetFactory.AssetClass assetClass) external view override returns (bytes32[] memory poolIds) {
        return _assetClassPools[assetClass];
    }
    
    /**
     * @dev Gets complete fee breakdown for a pool
     * @param poolId ID of the pool
     * @return feeTier Pool fee tier in basis points
     * @return protocolFeeBps Protocol fee in basis points
     * @return effectiveFee Total effective fee for swappers
     */
    function getFeeDetails(bytes32 poolId) external view returns (
        uint24 feeTier,
        uint16 protocolFeeBps,
        uint256 effectiveFee
    ) {
        PoolConfig storage config = _poolConfigs[poolId];
        feeTier = config.feeTier;
        protocolFeeBps = protocolFee;
        
        // Effective fee includes both pool fee and protocol fee
        effectiveFee = feeTier + ((feeTier * protocolFee) / 10000);
        
        return (feeTier, protocolFeeBps, effectiveFee);
    }
} 