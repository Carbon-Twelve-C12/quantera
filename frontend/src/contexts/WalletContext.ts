import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define wallet context state interface
interface WalletContextState {
  connected: boolean;
  address: string | null;
  provider: any;
  signer: any;
  chainId: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

// Create context with default values
const WalletContext = createContext<WalletContextState>({
  connected: false,
  address: null,
  provider: null,
  signer: null,
  chainId: null,
  connect: async () => {},
  disconnect: () => {},
});

// Provider component interface
interface WalletProviderProps {
  children: ReactNode;
}

// Hook to use wallet context
export const useWallet = () => useContext(WalletContext);

// Export context for provider implementation
export default WalletContext; 