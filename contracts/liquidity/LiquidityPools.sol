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
 */
contract LiquidityPools is ILiquidityPools, AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;
    
    // Roles
    bytes32 public constant POOL_CREATOR_ROLE = keccak256("POOL_CREATOR_ROLE");
    bytes32 public constant FEE_MANAGER_ROLE = keccak256("FEE_MANAGER_ROLE");
    bytes32 public constant PROTOCOL_FEE_MANAGER_ROLE = keccak256("PROTOCOL_FEE_MANAGER_ROLE");
    
    // Asset factory reference
    IAssetFactory public assetFactory;
    
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
    
    // Protocol fee (in basis points, e.g., 10 = 0.1%)
    uint16 public protocolFee = 10;
    address public protocolFeeRecipient;
    
    // Tick math constants
    int24 public constant MIN_TICK = -887272;
    int24 public constant MAX_TICK = 887272;
    
    // Counters for generating unique IDs
    Counters.Counter private _poolIdCounter;
    Counters.Counter private _positionIdCounter;
    
    /**
     * @dev Constructor
     * @param assetFactoryAddress Address of the AssetFactory contract
     * @param feeRecipient Address to receive protocol fees
     */
    constructor(address assetFactoryAddress, address feeRecipient) {
        require(assetFactoryAddress != address(0), "LiquidityPools: asset factory address cannot be zero");
        require(feeRecipient != address(0), "LiquidityPools: fee recipient address cannot be zero");
        
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
        
        // Generate unique pool ID
        _poolIdCounter.increment();
        poolId = keccak256(abi.encodePacked(
            _poolIdCounter.current(),
            tokenA,
            tokenB,
            feeTier,
            block.timestamp
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
        PoolState storage state = _poolStates[poolId];
        state.sqrtPriceX96 = initialSqrtPrice;
        state.tick = _getTickAtSqrtRatio(initialSqrtPrice);
        state.lastUpdated = block.timestamp;
        
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
        // Validate pool and tick range
        PoolConfig storage config = _poolConfigs[poolId];
        require(config.poolId == poolId, "LiquidityPools: pool does not exist");
        require(config.active, "LiquidityPools: pool is not active");
        require(lowerTick < upperTick, "LiquidityPools: lower tick must be less than upper tick");
        require(lowerTick >= MIN_TICK, "LiquidityPools: lower tick too low");
        require(upperTick <= MAX_TICK, "LiquidityPools: upper tick too high");
        require(lowerTick % config.tickSpacing == 0, "LiquidityPools: lower tick not a multiple of spacing");
        require(upperTick % config.tickSpacing == 0, "LiquidityPools: upper tick not a multiple of spacing");
        
        // Calculate liquidity amount from desired amounts
        PoolState storage state = _poolStates[poolId];
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
        
        // Ensure minimum amounts are satisfied
        require(amount0 >= amount0Min, "LiquidityPools: amount0 less than minimum");
        require(amount1 >= amount1Min, "LiquidityPools: amount1 less than minimum");
        
        // Transfer tokens from user
        IERC20(config.tokenA).safeTransferFrom(msg.sender, address(this), amount0);
        IERC20(config.tokenB).safeTransferFrom(msg.sender, address(this), amount1);
        
        // Generate unique position ID
        _positionIdCounter.increment();
        positionId = keccak256(abi.encodePacked(
            _positionIdCounter.current(),
            poolId,
            msg.sender,
            lowerTick,
            upperTick,
            block.timestamp
        ));
        
        // Create position
        Position storage position = _positions[positionId];
        position.positionId = positionId;
        position.poolId = poolId;
        position.owner = msg.sender;
        position.lowerTick = lowerTick;
        position.upperTick = upperTick;
        position.liquidity = liquidity;
        position.createdAt = block.timestamp;
        
        // Update pool state
        state.totalLiquidity += liquidity;
        
        // Add to indexes
        _userPositions[msg.sender].push(positionId);
        _poolPositions[poolId].push(positionId);
        
        emit LiquidityAdded(poolId, positionId, msg.sender, lowerTick, upperTick, liquidity, amount0, amount1);
        
        return (positionId, liquidity, amount0, amount1);
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
        
        // Update position
        position.liquidity -= liquidityAmount;
        
        // Update pool state
        state.totalLiquidity -= liquidityAmount;
        
        // Calculate and add any uncollected fees
        (uint256 fee0, uint256 fee1) = _calculateFees(positionId);
        position.tokensOwedA += fee0;
        position.tokensOwedB += fee1;
        
        // Transfer tokens to user
        IERC20(config.tokenA).safeTransfer(msg.sender, amount0);
        IERC20(config.tokenB).safeTransfer(msg.sender, amount1);
        
        emit LiquidityRemoved(poolId, positionId, msg.sender, position.lowerTick, position.upperTick, liquidityAmount, amount0, amount1);
        
        return (amount0, amount1);
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
     * @dev Executes a swap in a pool
     * @param poolId ID of the pool
     * @param recipient Address to receive the output tokens
     * @param zeroForOne Whether the swap is from token A to token B
     * @param amountSpecified Amount of input token to swap
     * @param sqrtPriceLimitX96 Price limit for the swap
     * @return amount0 Amount of token A swapped
     * @return amount1 Amount of token B swapped
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
        // Validate parameters
        require(amountSpecified != 0, "LiquidityPools: amount cannot be zero");
        require(recipient != address(0), "LiquidityPools: recipient cannot be zero address");
        
        PoolConfig storage config = _poolConfigs[poolId];
        require(config.poolId == poolId, "LiquidityPools: pool does not exist");
        require(config.active, "LiquidityPools: pool is not active");
        
        PoolState storage state = _poolStates[poolId];
        
        // Set price limit based on swap direction
        if (zeroForOne) {
            require(sqrtPriceLimitX96 < state.sqrtPriceX96 && sqrtPriceLimitX96 > 0, "LiquidityPools: invalid price limit");
        } else {
            require(sqrtPriceLimitX96 > state.sqrtPriceX96, "LiquidityPools: invalid price limit");
        }
        
        // Execute swap computation
        (amount0, amount1, state.sqrtPriceX96, state.tick) = _computeSwapStep(
            poolId, 
            state.sqrtPriceX96, 
            state.tick, 
            state.totalLiquidity, 
            amountSpecified, 
            zeroForOne, 
            sqrtPriceLimitX96,
            config.feeTier
        );
        
        // Update pool state
        if (zeroForOne) {
            state.volumeTokenA += uint256(-amount0);
            state.volumeTokenB += uint256(amount1);
        } else {
            state.volumeTokenA += uint256(amount0);
            state.volumeTokenB += uint256(-amount1);
        }
        
        state.lastUpdated = block.timestamp;
        
        // Handle token transfers
        address tokenIn = zeroForOne ? config.tokenA : config.tokenB;
        address tokenOut = zeroForOne ? config.tokenB : config.tokenA;
        uint256 amountIn = zeroForOne ? uint256(-amount0) : uint256(-amount1);
        uint256 amountOut = zeroForOne ? uint256(amount1) : uint256(amount0);
        
        // Calculate protocol fee
        uint256 protocolFeeAmount = (amountIn * protocolFee) / 10000;
        uint256 actualAmountIn = amountIn - protocolFeeAmount;
        
        // Transfer tokens
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).safeTransfer(recipient, amountOut);
        
        // Transfer protocol fee if applicable
        if (protocolFeeAmount > 0) {
            IERC20(tokenIn).safeTransfer(protocolFeeRecipient, protocolFeeAmount);
        }
        
        emit Swap(poolId, msg.sender, recipient, amount0, amount1, state.sqrtPriceX96, state.totalLiquidity, state.tick);
        
        return (amount0, amount1);
    }
    
    // Placeholder implementations for math functions - will implement in subsequent parts
    function _getTickAtSqrtRatio(uint160 sqrtPriceX96) internal pure returns (int24) {
        // Placeholder - will implement price-to-tick conversion
        return 0;
    }
    
    function _getSqrtRatioAtTick(int24 tick) internal pure returns (uint160) {
        // Placeholder - will implement tick-to-price conversion
        return 0;
    }
    
    function _calculateLiquidity(
        uint160 currentSqrtPrice,
        uint160 lowerSqrtPrice,
        uint160 upperSqrtPrice,
        uint256 amount0Desired,
        uint256 amount1Desired
    ) internal pure returns (uint128) {
        // Placeholder - will implement liquidity calculation
        return 0;
    }
    
    function _calculateAmounts(
        uint160 currentSqrtPrice,
        uint160 lowerSqrtPrice,
        uint160 upperSqrtPrice,
        uint128 liquidity
    ) internal pure returns (uint256 amount0, uint256 amount1) {
        // Placeholder - will implement amount calculation
        return (0, 0);
    }
    
    function _calculateFees(bytes32 positionId) internal view returns (uint256 fee0, uint256 fee1) {
        // Placeholder - will implement fee calculation
        return (0, 0);
    }
    
    function _computeSwapStep(
        bytes32 poolId,
        uint160 sqrtPriceX96,
        int24 tick,
        uint128 liquidity,
        int256 amountSpecified,
        bool zeroForOne,
        uint160 sqrtPriceLimitX96,
        uint24 feeTier
    ) internal view returns (int256 amount0, int256 amount1, uint160 sqrtPriceX96After, int24 tickAfter) {
        // Placeholder - will implement swap computation
        return (0, 0, 0, 0);
    }
    
    /**
     * @dev Sets the protocol fee
     * @param newProtocolFee New protocol fee in basis points
     * @return success Boolean indicating if the fee was changed successfully
     */
    function setProtocolFee(uint16 newProtocolFee) external returns (bool success) {
        require(hasRole(PROTOCOL_FEE_MANAGER_ROLE, msg.sender), "LiquidityPools: must have protocol fee manager role");
        require(newProtocolFee <= 1000, "LiquidityPools: fee too high"); // Max 10%
        
        protocolFee = newProtocolFee;
        return true;
    }
    
    /**
     * @dev Sets the protocol fee recipient
     * @param newFeeRecipient New fee recipient address
     * @return success Boolean indicating if the recipient was changed successfully
     */
    function setProtocolFeeRecipient(address newFeeRecipient) external returns (bool success) {
        require(hasRole(PROTOCOL_FEE_MANAGER_ROLE, msg.sender), "LiquidityPools: must have protocol fee manager role");
        require(newFeeRecipient != address(0), "LiquidityPools: fee recipient cannot be zero address");
        
        protocolFeeRecipient = newFeeRecipient;
        return true;
    }
    
    /**
     * @dev Changes the fee tier of a pool
     * @param poolId ID of the pool
     * @param newFeeTier New fee tier in basis points
     * @return success Boolean indicating if the fee was changed successfully
     */
    function setPoolFee(bytes32 poolId, uint24 newFeeTier) external override returns (bool success) {
        require(hasRole(FEE_MANAGER_ROLE, msg.sender), "LiquidityPools: must have fee manager role");
        require(newFeeTier > 0 && newFeeTier <= 10000, "LiquidityPools: invalid fee tier");
        
        PoolConfig storage config = _poolConfigs[poolId];
        require(config.poolId == poolId, "LiquidityPools: pool does not exist");
        
        uint24 oldFeeTier = config.feeTier;
        config.feeTier = newFeeTier;
        
        emit FeeChanged(poolId, oldFeeTier, newFeeTier);
        
        return true;
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