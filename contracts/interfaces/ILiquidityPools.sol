// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "./IAssetFactory.sol";

/**
 * @title ILiquidityPools
 * @dev Interface for the Liquidity Pools contract, which manages liquidity for asset trading
 * with advanced features like concentrated liquidity positions and dynamic fees.
 */
interface ILiquidityPools {
    /**
     * @dev Structure to store a liquidity pool's configuration
     */
    struct PoolConfig {
        bytes32 poolId;
        address tokenA;       // Address of the first token in the pair
        address tokenB;       // Address of the second token in the pair
        IAssetFactory.AssetClass assetClassA;  // Asset class of token A
        IAssetFactory.AssetClass assetClassB;  // Asset class of token B
        uint24 feeTier;       // Fee tier in basis points (e.g., 30 = 0.3%)
        uint160 initialSqrtPrice;  // Initial price for the pool
        uint24 tickSpacing;  // Spacing between ticks for concentrated liquidity
        bool active;         // Whether the pool is active
        address owner;       // Owner of the pool, can change parameters
    }
    
    /**
     * @dev Structure to store a liquidity position
     * Gas optimization: Pack related fields together and use smaller uint types
     * where appropriate to reduce storage slots used
     */
    struct Position {
        bytes32 positionId;   // Unique identifier for the position
        bytes32 poolId;       // ID of the pool this position belongs to
        address owner;        // Address of the position owner
        
        // Gas optimization: Pack tick boundaries in one slot (each int24 uses 3 bytes)
        int24 lowerTick;      // Lower tick boundary for concentrated liquidity
        int24 upperTick;      // Upper tick boundary for concentrated liquidity
        
        // Gas optimization: Pack these fields in one slot (16 + 16 + 4 = 36 bytes)
        uint128 liquidity;    // Amount of liquidity provided
        uint32 createdAt;     // Timestamp when position was created (reduced from uint256)
        
        // Gas optimization: Pack fee accumulator fields together when implementing
        uint128 tokensOwedA;  // Fees collected for token A (reduced from uint256)
        uint128 tokensOwedB;  // Fees collected for token B (reduced from uint256)
        
        // Fee growth tracking fields will be added here in the implementation
    }
    
    /**
     * @dev Structure to store a pool's current state
     * Gas optimization: Pack related fields together and use smaller uint types
     * where appropriate to reduce storage slots used
     */
    struct PoolState {
        uint160 sqrtPriceX96;    // Current sqrt price
        int24 tick;              // Current tick
        
        // Gas optimization: Pack these fields in one slot (2 + 16 + 4 = 22 bytes)
        uint16 observationIndex; // Index of last oracle observation
        uint128 totalLiquidity;  // Total liquidity in the pool
        uint32 lastUpdated;      // Timestamp of last update (reduced from uint256)
        
        // These will remain uint256 as they can grow to large values
        uint256 volumeTokenA;    // Total volume of token A
        uint256 volumeTokenB;    // Total volume of token B
        
        // Use uint128 for fee tracking as they rarely exceed 128 bits in practice
        uint128 feesCollectedA;  // Total fees collected for token A 
        uint128 feesCollectedB;  // Total fees collected for token B
    }
    
    /**
     * @dev Emitted when a new liquidity pool is created
     */
    event PoolCreated(
        bytes32 indexed poolId,
        address indexed tokenA,
        address indexed tokenB,
        uint24 feeTier,
        uint160 initialSqrtPrice,
        uint24 tickSpacing,
        address owner
    );
    
    /**
     * @dev Emitted when a pool's fee tier is changed
     */
    event FeeChanged(
        bytes32 indexed poolId,
        uint24 oldFeeTier,
        uint24 newFeeTier
    );
    
    /**
     * @dev Emitted when liquidity is added to a pool
     */
    event LiquidityAdded(
        bytes32 indexed poolId,
        bytes32 indexed positionId,
        address indexed owner,
        int24 lowerTick,
        int24 upperTick,
        uint128 liquidity,
        uint256 amountA,
        uint256 amountB
    );
    
    /**
     * @dev Emitted when liquidity is removed from a pool
     */
    event LiquidityRemoved(
        bytes32 indexed poolId,
        bytes32 indexed positionId,
        address indexed owner,
        int24 lowerTick,
        int24 upperTick,
        uint128 liquidity,
        uint256 amountA,
        uint256 amountB
    );
    
    /**
     * @dev Emitted when a swap occurs
     */
    event Swap(
        bytes32 indexed poolId,
        address indexed sender,
        address indexed recipient,
        int256 amountA,
        int256 amountB,
        uint160 sqrtPriceX96,
        uint128 liquidity,
        int24 tick
    );
    
    /**
     * @dev Emitted when fees are collected from a position
     */
    event FeesCollected(
        bytes32 indexed poolId,
        bytes32 indexed positionId,
        address indexed owner,
        uint256 amountA,
        uint256 amountB
    );
    
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
    ) external returns (bytes32 poolId);
    
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
    ) external returns (
        bytes32 positionId,
        uint128 liquidity,
        uint256 amount0,
        uint256 amount1
    );
    
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
    ) external returns (
        uint256 amount0,
        uint256 amount1
    );
    
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
    ) external returns (
        uint256 amount0,
        uint256 amount1
    );
    
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
    ) external returns (
        int256 amount0,
        int256 amount1
    );
    
    /**
     * @dev Gets the pool configuration
     * @param poolId ID of the pool
     * @return config The pool configuration
     */
    function getPoolConfig(bytes32 poolId) external view returns (PoolConfig memory config);
    
    /**
     * @dev Gets the current state of a pool
     * @param poolId ID of the pool
     * @return state The current state of the pool
     */
    function getPoolState(bytes32 poolId) external view returns (PoolState memory state);
    
    /**
     * @dev Gets a position's details
     * @param positionId ID of the position
     * @return position The position details
     */
    function getPosition(bytes32 positionId) external view returns (Position memory position);
    
    /**
     * @dev Gets all positions for a user
     * @param user Address of the user
     * @return positionIds Array of position IDs owned by the user
     */
    function getUserPositions(address user) external view returns (bytes32[] memory positionIds);
    
    /**
     * @dev Gets all positions in a pool
     * @param poolId ID of the pool
     * @return positionIds Array of position IDs in the pool
     */
    function getPoolPositions(bytes32 poolId) external view returns (bytes32[] memory positionIds);
    
    /**
     * @dev Gets the price of a pool
     * @param poolId ID of the pool
     * @return sqrtPriceX96 The current sqrt price as a Q64.96
     * @return tick The current tick
     */
    function getPoolPrice(bytes32 poolId) external view returns (uint160 sqrtPriceX96, int24 tick);
    
    /**
     * @dev Gets all pools
     * @return poolIds Array of pool IDs
     */
    function getAllPools() external view returns (bytes32[] memory poolIds);
    
    /**
     * @dev Gets pools containing a specific token
     * @param token Address of the token
     * @return poolIds Array of pool IDs containing the token
     */
    function getPoolsByToken(address token) external view returns (bytes32[] memory poolIds);
    
    /**
     * @dev Gets pools for a specific asset class
     * @param assetClass The asset class
     * @return poolIds Array of pool IDs containing tokens of the asset class
     */
    function getPoolsByAssetClass(IAssetFactory.AssetClass assetClass) external view returns (bytes32[] memory poolIds);
    
    /**
     * @dev Changes the fee tier of a pool
     * @param poolId ID of the pool
     * @param newFeeTier New fee tier in basis points
     * @return success Boolean indicating if the fee was changed successfully
     */
    function setPoolFee(bytes32 poolId, uint24 newFeeTier) external returns (bool success);
    
    /**
     * @dev Calculates the amount of liquidity for a given amount of token A and B
     * @param poolId ID of the pool
     * @param lowerTick Lower tick boundary
     * @param upperTick Upper tick boundary
     * @param amount0 Amount of token A
     * @param amount1 Amount of token B
     * @return liquidity Amount of liquidity that can be added
     */
    function calculateLiquidity(
        bytes32 poolId,
        int24 lowerTick,
        int24 upperTick,
        uint256 amount0,
        uint256 amount1
    ) external view returns (uint128 liquidity);
    
    /**
     * @dev Calculates the amount of token A and B for a given amount of liquidity
     * @param poolId ID of the pool
     * @param lowerTick Lower tick boundary
     * @param upperTick Upper tick boundary
     * @param liquidity Amount of liquidity
     * @return amount0 Amount of token A
     * @return amount1 Amount of token B
     */
    function calculateAmounts(
        bytes32 poolId,
        int24 lowerTick,
        int24 upperTick,
        uint128 liquidity
    ) external view returns (uint256 amount0, uint256 amount1);
    
    /**
     * @dev Simulates a swap to determine output amounts
     * @param poolId ID of the pool
     * @param zeroForOne Whether the swap is from token A to token B
     * @param amountSpecified Amount of input token
     * @return amount0 Expected amount of token A
     * @return amount1 Expected amount of token B
     * @return sqrtPriceX96After Expected price after the swap
     * @return tickAfter Expected tick after the swap
     * @return liquidityAfter Expected liquidity after the swap
     */
    function quoteSwap(
        bytes32 poolId,
        bool zeroForOne,
        int256 amountSpecified
    ) external view returns (
        int256 amount0,
        int256 amount1,
        uint160 sqrtPriceX96After,
        int24 tickAfter,
        uint128 liquidityAfter
    );
} 