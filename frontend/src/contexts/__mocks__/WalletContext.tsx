/**
 * Mock WalletContext for testing
 */
import React, { createContext } from 'react';

// Mock provider object
const mockProvider = {
  getSigner: jest.fn().mockReturnValue({
    getAddress: jest.fn().mockResolvedValue('0x742d35Cc6634C0532925a3b844Bc454e4438f44e'),
    signMessage: jest.fn().mockResolvedValue('0xsignature'),
  }),
  getNetwork: jest.fn().mockResolvedValue({ chainId: 1, name: 'mainnet' }),
  getBalance: jest.fn().mockResolvedValue('1500000000000000000'),
};

// Mock wallet state factory - can be customized per test
export const createMockWallet = (overrides = {}) => ({
  // Core properties
  address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  connected: true,
  balance: '1.5',
  network: 'mainnet',
  tradingVolume: 120000,
  // Additional properties that some components expect
  provider: mockProvider,
  chainId: 1,
  // Methods
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn(),
  switchNetwork: jest.fn().mockResolvedValue(undefined),
  switchChain: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

// Default mock state
const mockWalletState = createMockWallet();

// Create mock context
const WalletContext = createContext(mockWalletState);

// Mock useWallet hook - can be overridden in tests via jest.spyOn
export const useWallet = jest.fn(() => mockWalletState);

// Mock provider that just renders children
export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <WalletContext.Provider value={mockWalletState}>
    {children}
  </WalletContext.Provider>
);

export default WalletContext;
