import React, { createContext, useContext, useState, useEffect } from 'react';

// Define wallet context state interface
interface WalletContextState {
  address: string | null;
  connected: boolean;
  balance: string;
  network: string;
  tradingVolume: number;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (networkId: string) => Promise<void>;
}

// Create the context
const WalletContext = createContext<WalletContextState>({
  address: null,
  connected: false,
  balance: '0',
  network: 'mainnet',
  tradingVolume: 0,
  connect: async () => {},
  disconnect: () => {},
  switchNetwork: async () => {}
});

// Provider component
export const WalletProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [balance, setBalance] = useState('0');
  const [network, setNetwork] = useState('mainnet');
  const [tradingVolume, setTradingVolume] = useState(0);

  // Initialize from local storage
  useEffect(() => {
    const savedAddress = localStorage.getItem('wallet_address');
    const savedConnected = localStorage.getItem('wallet_connected') === 'true';
    
    if (savedConnected && savedAddress) {
      setAddress(savedAddress);
      setConnected(true);
      setBalance('1250.75');
      setNetwork('mainnet');
      setTradingVolume(120000);
    }
  }, []);

  // Connect wallet
  const connect = async () => {
    try {
      const mockAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
      
      setAddress(mockAddress);
      setConnected(true);
      setBalance('1250.75');
      setNetwork('mainnet');
      setTradingVolume(120000);
      
      localStorage.setItem('wallet_address', mockAddress);
      localStorage.setItem('wallet_connected', 'true');
      
      console.log('Wallet connected:', mockAddress);
    } catch (error) {
      console.error('Connection error:', error);
      setConnected(false);
      setAddress(null);
      setBalance('0');
      setNetwork('mainnet');
      setTradingVolume(0);
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    setAddress(null);
    setConnected(false);
    setBalance('0');
    setNetwork('mainnet');
    setTradingVolume(0);
    
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('wallet_connected');
    
    console.log('Wallet disconnected');
  };

  // Switch network
  const switchNetwork = async (networkId: string) => {
    try {
      console.log(`Switching to network: ${networkId}`);
      setNetwork(networkId);
    } catch (error) {
      console.error('Error switching network:', error);
    }
  };

  const contextValue: WalletContextState = {
    address,
    connected,
    balance,
    network,
    tradingVolume,
    connect,
    disconnect,
    switchNetwork
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

// Custom hook to use the wallet context
export const useWallet = () => useContext(WalletContext);

// Export both the context and the interfaces
export type { WalletContextState };
export default WalletContext; 