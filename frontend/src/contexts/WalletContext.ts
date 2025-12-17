import { createContext, useContext, type ReactNode } from 'react';
import type { BrowserProvider, JsonRpcSigner } from 'ethers';

// Define wallet context state interface
interface WalletContextState {
  connected: boolean;
  address: string | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
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

// Hook to use wallet context
export const useWallet = () => useContext(WalletContext);

// Export context for provider implementation
export default WalletContext; 