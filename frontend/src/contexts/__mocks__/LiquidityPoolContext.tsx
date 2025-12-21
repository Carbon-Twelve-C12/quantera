/**
 * Mock LiquidityPoolContext for testing
 */
import React, { createContext } from 'react';

// Mock liquidity pool state factory
export const createMockLiquidityPool = (overrides = {}) => ({
  pools: [],
  positions: [],
  poolStates: {},
  tokens: {},
  userPositions: [],
  isLoading: false,
  error: null,
  createPool: jest.fn().mockResolvedValue(undefined),
  addLiquidity: jest.fn().mockResolvedValue(undefined),
  removeLiquidity: jest.fn().mockResolvedValue(undefined),
  collectFees: jest.fn().mockResolvedValue(undefined),
  refreshPools: jest.fn().mockResolvedValue(undefined),
  refreshUserPositions: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

// Default mock state
const mockLiquidityPoolState = createMockLiquidityPool();

// Create mock context
const LiquidityPoolContext = createContext(mockLiquidityPoolState);

// Mock useLiquidityPool hook
export const useLiquidityPool = jest.fn(() => mockLiquidityPoolState);

// Mock provider
export const LiquidityPoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <LiquidityPoolContext.Provider value={mockLiquidityPoolState}>
    {children}
  </LiquidityPoolContext.Provider>
);

export default LiquidityPoolContext;
