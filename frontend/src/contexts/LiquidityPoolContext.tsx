import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallet } from './WalletContext';

// Types for liquidity pools based on the ILiquidityPools.sol interface
export interface PoolConfig {
  poolId: string;
  tokenA: string;
  tokenB: string;
  assetClassA: number;
  assetClassB: number;
  feeTier: number;
  initialSqrtPrice: string;
  tickSpacing: number;
  active: boolean;
  owner: string;
}

export interface Position {
  positionId: string;
  poolId: string;
  owner: string;
  lowerTick: number;
  upperTick: number;
  liquidity: string;
  tokensOwedA: string;
  tokensOwedB: string;
  createdAt: number;
}

export interface PoolState {
  sqrtPriceX96: string;
  tick: number;
  observationIndex: number;
  totalLiquidity: string;
  volumeTokenA: string;
  volumeTokenB: string;
  feesCollectedA: string;
  feesCollectedB: string;
  lastUpdated: number;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
}

// Context state type
interface LiquidityPoolContextState {
  // Data
  pools: PoolConfig[];
  positions: Position[];
  poolStates: Record<string, PoolState>;
  tokens: Record<string, TokenInfo>;
  userPositions: Position[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createPool: (
    tokenA: string, 
    tokenB: string, 
    assetClassA: number, 
    assetClassB: number, 
    feeTier: number, 
    initialSqrtPrice: string, 
    tickSpacing: number
  ) => Promise<string>;
  
  addLiquidity: (
    poolId: string, 
    lowerTick: number, 
    upperTick: number, 
    amount0Desired: string, 
    amount1Desired: string,
    amount0Min: string,
    amount1Min: string
  ) => Promise<{
    positionId: string;
    liquidity: string;
    amount0: string;
    amount1: string;
  }>;
  
  removeLiquidity: (
    positionId: string, 
    liquidityAmount: string, 
    amount0Min: string, 
    amount1Min: string
  ) => Promise<{
    amount0: string;
    amount1: string;
  }>;
  
  collectFees: (
    positionId: string
  ) => Promise<{
    amount0: string;
    amount1: string;
  }>;
  
  refreshPools: () => Promise<void>;
  refreshUserPositions: () => Promise<void>;
}

// Create the context with default values
const LiquidityPoolContext = createContext<LiquidityPoolContextState>({
  pools: [],
  positions: [],
  poolStates: {},
  tokens: {},
  userPositions: [],
  isLoading: false,
  error: null,
  
  createPool: async () => "",
  addLiquidity: async () => ({ positionId: "", liquidity: "0", amount0: "0", amount1: "0" }),
  removeLiquidity: async () => ({ amount0: "0", amount1: "0" }),
  collectFees: async () => ({ amount0: "0", amount1: "0" }),
  refreshPools: async () => {},
  refreshUserPositions: async () => {},
});

// Mocked data for development
const mockTokens: Record<string, TokenInfo> = {
  "0xToken1": { 
    address: "0xToken1", 
    name: "Treasury Token", 
    symbol: "TT", 
    decimals: 18 
  },
  "0xToken2": { 
    address: "0xToken2", 
    name: "USD Coin", 
    symbol: "USDC", 
    decimals: 6 
  },
  "0xToken3": { 
    address: "0xToken3", 
    name: "Carbon Credit", 
    symbol: "CARB", 
    decimals: 18 
  },
};

const mockPools: PoolConfig[] = [
  {
    poolId: "0xpool1",
    tokenA: "0xToken1",
    tokenB: "0xToken2",
    assetClassA: 0, // Treasury
    assetClassB: 3, // Stablecoin
    feeTier: 30, // 0.3%
    initialSqrtPrice: "1000000000000000000", // 1.0
    tickSpacing: 10,
    active: true,
    owner: "0xOwner",
  },
  {
    poolId: "0xpool2",
    tokenA: "0xToken1",
    tokenB: "0xToken3",
    assetClassA: 0, // Treasury
    assetClassB: 4, // Environmental Asset
    feeTier: 50, // 0.5%
    initialSqrtPrice: "1500000000000000000", // 1.5
    tickSpacing: 20,
    active: true,
    owner: "0xOwner",
  },
];

const mockPoolStates: Record<string, PoolState> = {
  "0xpool1": {
    sqrtPriceX96: "1010000000000000000",
    tick: 100,
    observationIndex: 0,
    totalLiquidity: "1000000000000000000000", // 1000
    volumeTokenA: "5000000000000000000000", // 5000
    volumeTokenB: "5050000000000000000000", // 5050
    feesCollectedA: "15000000000000000000", // 15
    feesCollectedB: "15150000000000000000", // 15.15
    lastUpdated: Math.floor(Date.now() / 1000),
  },
  "0xpool2": {
    sqrtPriceX96: "1520000000000000000",
    tick: 200,
    observationIndex: 0,
    totalLiquidity: "500000000000000000000", // 500
    volumeTokenA: "2500000000000000000000", // 2500
    volumeTokenB: "3750000000000000000000", // 3750
    feesCollectedA: "12500000000000000000", // 12.5
    feesCollectedB: "18750000000000000000", // 18.75
    lastUpdated: Math.floor(Date.now() / 1000),
  },
};

const mockPositions: Position[] = [
  {
    positionId: "0xposition1",
    poolId: "0xpool1",
    owner: "0xUser",
    lowerTick: 50,
    upperTick: 150,
    liquidity: "500000000000000000000", // 500
    tokensOwedA: "5000000000000000000", // 5
    tokensOwedB: "5050000000000000000", // 5.05
    createdAt: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
  },
  {
    positionId: "0xposition2",
    poolId: "0xpool2",
    owner: "0xUser",
    lowerTick: 150,
    upperTick: 250,
    liquidity: "250000000000000000000", // 250
    tokensOwedA: "2500000000000000000", // 2.5
    tokensOwedB: "3750000000000000000", // 3.75
    createdAt: Math.floor(Date.now() / 1000) - 172800, // 2 days ago
  },
];

// Provider component
export const LiquidityPoolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { address, connected } = useWallet();
  
  const [pools, setPools] = useState<PoolConfig[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [poolStates, setPoolStates] = useState<Record<string, PoolState>>({});
  const [tokens, setTokens] = useState<Record<string, TokenInfo>>({});
  const [userPositions, setUserPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load mock data on mount
  useEffect(() => {
    setPools(mockPools);
    setPoolStates(mockPoolStates);
    setTokens(mockTokens);
    
    // Set user positions if we have an address
    if (address) {
      setUserPositions(mockPositions.filter(p => p.owner.toLowerCase() === address.toLowerCase()));
    } else {
      setUserPositions([]);
    }
  }, [address]);
  
  // Function to create a new pool
  const createPool = async (
    tokenA: string, 
    tokenB: string, 
    assetClassA: number, 
    assetClassB: number, 
    feeTier: number, 
    initialSqrtPrice: string, 
    tickSpacing: number
  ): Promise<string> => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would call the contract
      console.log("Creating new pool", { tokenA, tokenB, assetClassA, assetClassB, feeTier, initialSqrtPrice, tickSpacing });
      
      // Mock implementation - just return a new pool ID
      const newPoolId = `0xpool${pools.length + 1}`;
      const newPool: PoolConfig = {
        poolId: newPoolId,
        tokenA,
        tokenB,
        assetClassA,
        assetClassB,
        feeTier,
        initialSqrtPrice,
        tickSpacing,
        active: true,
        owner: address || "0xUnknown",
      };
      
      // Update pools state
      setPools(prevPools => [...prevPools, newPool]);
      
      // Create an initial pool state
      const newPoolState: PoolState = {
        sqrtPriceX96: initialSqrtPrice,
        tick: 0,
        observationIndex: 0,
        totalLiquidity: "0",
        volumeTokenA: "0",
        volumeTokenB: "0",
        feesCollectedA: "0",
        feesCollectedB: "0",
        lastUpdated: Math.floor(Date.now() / 1000),
      };
      
      // Update pool states
      setPoolStates(prevStates => ({
        ...prevStates,
        [newPoolId]: newPoolState
      }));
      
      return newPoolId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error creating pool";
      setError(errorMessage);
      console.error("Error creating pool:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to add liquidity to a pool
  const addLiquidity = async (
    poolId: string, 
    lowerTick: number, 
    upperTick: number, 
    amount0Desired: string, 
    amount1Desired: string,
    amount0Min: string,
    amount1Min: string
  ) => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would call the contract
      console.log("Adding liquidity", { poolId, lowerTick, upperTick, amount0Desired, amount1Desired, amount0Min, amount1Min });
      
      // Mock implementation
      const newPositionId = `0xposition${positions.length + 1}`;
      const newPosition: Position = {
        positionId: newPositionId,
        poolId,
        owner: address || "0xUnknown",
        lowerTick,
        upperTick,
        liquidity: amount0Desired, // Simplified for mock
        tokensOwedA: "0",
        tokensOwedB: "0",
        createdAt: Math.floor(Date.now() / 1000),
      };
      
      // Update positions state
      setPositions(prevPositions => [...prevPositions, newPosition]);
      
      // Update user positions if this is for the current user
      if (address) {
        setUserPositions(prevPositions => [...prevPositions, newPosition]);
      }
      
      // Update pool state to reflect new liquidity
      setPoolStates(prevStates => {
        const poolState = prevStates[poolId];
        if (poolState) {
          const totalLiquidity = BigInt(poolState.totalLiquidity) + BigInt(amount0Desired);
          return {
            ...prevStates,
            [poolId]: {
              ...poolState,
              totalLiquidity: totalLiquidity.toString(),
              lastUpdated: Math.floor(Date.now() / 1000),
            }
          };
        }
        return prevStates;
      });
      
      return {
        positionId: newPositionId,
        liquidity: amount0Desired,
        amount0: amount0Desired,
        amount1: amount1Desired,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error adding liquidity";
      setError(errorMessage);
      console.error("Error adding liquidity:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to remove liquidity from a position
  const removeLiquidity = async (
    positionId: string, 
    liquidityAmount: string, 
    amount0Min: string, 
    amount1Min: string
  ) => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would call the contract
      console.log("Removing liquidity", { positionId, liquidityAmount, amount0Min, amount1Min });
      
      // Mock implementation
      const position = positions.find(p => p.positionId === positionId);
      
      if (!position) {
        throw new Error("Position not found");
      }
      
      // Calculate amounts (simplified for mock)
      const amount0 = liquidityAmount;
      const amount1 = liquidityAmount;
      
      // Update position liquidity
      const updatedPositions = positions.map(p => {
        if (p.positionId === positionId) {
          const remainingLiquidity = BigInt(p.liquidity) - BigInt(liquidityAmount);
          return {
            ...p,
            liquidity: remainingLiquidity.toString(),
          };
        }
        return p;
      });
      
      setPositions(updatedPositions);
      
      // Update user positions if needed
      if (address) {
        setUserPositions(updatedPositions.filter(p => p.owner.toLowerCase() === address.toLowerCase()));
      }
      
      // Update pool state
      setPoolStates(prevStates => {
        const poolState = prevStates[position.poolId];
        if (poolState) {
          const totalLiquidity = BigInt(poolState.totalLiquidity) - BigInt(liquidityAmount);
          return {
            ...prevStates,
            [position.poolId]: {
              ...poolState,
              totalLiquidity: totalLiquidity.toString(),
              lastUpdated: Math.floor(Date.now() / 1000),
            }
          };
        }
        return prevStates;
      });
      
      return { amount0, amount1 };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error removing liquidity";
      setError(errorMessage);
      console.error("Error removing liquidity:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to collect fees from a position
  const collectFees = async (positionId: string) => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would call the contract
      console.log("Collecting fees", { positionId });
      
      // Mock implementation
      const position = positions.find(p => p.positionId === positionId);
      
      if (!position) {
        throw new Error("Position not found");
      }
      
      const amount0 = position.tokensOwedA;
      const amount1 = position.tokensOwedB;
      
      // Update position to clear owed tokens
      const updatedPositions = positions.map(p => {
        if (p.positionId === positionId) {
          return {
            ...p,
            tokensOwedA: "0",
            tokensOwedB: "0",
          };
        }
        return p;
      });
      
      setPositions(updatedPositions);
      
      // Update user positions if needed
      if (address) {
        setUserPositions(updatedPositions.filter(p => p.owner.toLowerCase() === address.toLowerCase()));
      }
      
      return { amount0, amount1 };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error collecting fees";
      setError(errorMessage);
      console.error("Error collecting fees:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to refresh pools data
  const refreshPools = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would call the API
      console.log("Refreshing pools data");
      
      // For now, we'll just use the mock data
      setPools(mockPools);
      setPoolStates(mockPoolStates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error refreshing pools";
      setError(errorMessage);
      console.error("Error refreshing pools:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to refresh user positions
  const refreshUserPositions = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would call the API
      console.log("Refreshing user positions");
      
      // For now, we'll just use the mock data
      if (address) {
        setUserPositions(mockPositions.filter(p => p.owner.toLowerCase() === address.toLowerCase()));
      } else {
        setUserPositions([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error refreshing user positions";
      setError(errorMessage);
      console.error("Error refreshing user positions:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <LiquidityPoolContext.Provider
      value={{
        pools,
        positions,
        poolStates,
        tokens,
        userPositions,
        isLoading,
        error,
        
        createPool,
        addLiquidity,
        removeLiquidity,
        collectFees,
        refreshPools,
        refreshUserPositions,
      }}
    >
      {children}
    </LiquidityPoolContext.Provider>
  );
};

// Custom hook to use the context
export const useLiquidityPool = () => useContext(LiquidityPoolContext); 