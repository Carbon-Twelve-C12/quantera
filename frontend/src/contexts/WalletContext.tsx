import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Mock provider interface (in a real app, this would be from ethers or similar)
interface Provider {
  getNetwork: () => Promise<{ chainId: number }>;
  getBalance: (address: string) => Promise<string>;
  getSigner: () => any;
}

// WalletContext interface
export interface WalletContextType {
  connected: boolean;
  connecting: boolean;
  address: string | null;
  chainId: number | null;
  balance: string | null;
  provider: Provider | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<boolean>;
  sendTransaction: (to: string, amount: string, data?: string) => Promise<string | null>;
}

// Default context value
const defaultContextValue: WalletContextType = {
  connected: false,
  connecting: false,
  address: null,
  chainId: null,
  balance: null,
  provider: null,
  connect: async () => {},
  disconnect: () => {},
  switchNetwork: async () => false,
  sendTransaction: async () => null,
};

// Create context
const WalletContext = createContext<WalletContextType>(defaultContextValue);

// Hook to use wallet context
export const useWallet = () => useContext(WalletContext);

// Mock provider for development
const createMockProvider = (): Provider => {
  return {
    getNetwork: async () => ({ chainId: 1 }),
    getBalance: async () => '1000000000000000000', // 1 ETH in wei
    getSigner: () => ({
      getAddress: async () => '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      sendTransaction: async () => ({ hash: `0x${Math.random().toString(16).slice(2)}` }),
    }),
  };
};

// Provider component
export const WalletProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [connected, setConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);

  // Connect wallet
  const connect = async (): Promise<void> => {
    try {
      setConnecting(true);
      
      // In a real app, this would use window.ethereum or another provider
      const mockProvider = createMockProvider();
      const network = await mockProvider.getNetwork();
      const signer = mockProvider.getSigner();
      const userAddress = await signer.getAddress();
      const userBalance = await mockProvider.getBalance(userAddress);
      
      setProvider(mockProvider);
      setAddress(userAddress);
      setChainId(network.chainId);
      setBalance(userBalance);
      setConnected(true);
      
      // Store connection in localStorage for persistence
      localStorage.setItem('walletConnected', 'true');
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnect = (): void => {
    setConnected(false);
    setAddress(null);
    setChainId(null);
    setBalance(null);
    setProvider(null);
    localStorage.removeItem('walletConnected');
  };

  // Switch network
  const switchNetwork = async (targetChainId: number): Promise<boolean> => {
    try {
      // In a real app, this would request the user to switch networks
      console.log(`Switching to network with chainId: ${targetChainId}`);
      
      // Mock successful network switch
      setChainId(targetChainId);
      return true;
    } catch (error) {
      console.error('Error switching network:', error);
      return false;
    }
  };

  // Send transaction
  const sendTransaction = async (to: string, amount: string, data?: string): Promise<string | null> => {
    try {
      if (!provider || !connected) {
        throw new Error('Wallet not connected');
      }

      const signer = provider.getSigner();
      const tx = await signer.sendTransaction({
        to,
        value: amount,
        data: data || '0x',
      });

      return tx.hash;
    } catch (error) {
      console.error('Error sending transaction:', error);
      return null;
    }
  };

  // Check for saved connection on mount
  useEffect(() => {
    const savedConnection = localStorage.getItem('walletConnected');
    if (savedConnection === 'true') {
      connect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Context value
  const value: WalletContextType = {
    connected,
    connecting,
    address,
    chainId,
    balance,
    provider,
    connect,
    disconnect,
    switchNetwork,
    sendTransaction,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContext; 