import React, { createContext, useContext, useState, useEffect } from 'react';
import walletConnect from '../utils/walletConnect';
import { logger } from '../utils/logger';

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
    const init = async () => {
      const savedAddress = localStorage.getItem('wallet_address');
      const savedConnected = localStorage.getItem('wallet_connected') === 'true';
      
      if (savedConnected && savedAddress) {
        try {
          // Attempt to restore session
          const session = await walletConnect.getSession();
          
          if (session) {
            setAddress(session.address);
            setConnected(true);
            setNetwork(session.chainId);
            
            // Get user balance
            try {
              const balance = await walletConnect.getBalance(session.address);
              setBalance(balance);
              
              // Fetch trading volume - this would be from your API in production
              setTradingVolume(120000); // Mock trading volume until API integration
            } catch (err) {
              logger.warn('Failed to fetch initial balance', { error: err });
              setBalance('0');
            }
          } else {
            // Clear storage if no session
            localStorage.removeItem('wallet_address');
            localStorage.removeItem('wallet_connected');
          }
        } catch (err) {
          logger.error('Failed to restore wallet session', err instanceof Error ? err : new Error(String(err)));
          localStorage.removeItem('wallet_address');
          localStorage.removeItem('wallet_connected');
        }
      }
    };
    
    init();
  }, []);

  // Connect wallet
  const connect = async () => {
    try {
      const session = await walletConnect.connect();
      
      if (session) {
        setAddress(session.address);
        setConnected(true);
        setNetwork(session.chainId);
        
        // Get user balance
        try {
          const balance = await walletConnect.getBalance(session.address);
          setBalance(balance);
        } catch (err) {
          logger.warn('Failed to fetch balance', { error: err });
          setBalance('0');
        }
        
        // This would be fetched from your API in production
        setTradingVolume(120000); // Mock trading volume
        
        localStorage.setItem('wallet_address', session.address);
        localStorage.setItem('wallet_connected', 'true');

        logger.info('Wallet connected', { address: session.address });
      }
    } catch (error) {
      logger.error('Connection error', error instanceof Error ? error : new Error(String(error)));
      setConnected(false);
      setAddress(null);
      setBalance('0');
      setNetwork('mainnet');
      setTradingVolume(0);
      
      localStorage.removeItem('wallet_address');
      localStorage.removeItem('wallet_connected');
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    walletConnect.disconnect();
    
    setAddress(null);
    setConnected(false);
    setBalance('0');
    setNetwork('mainnet');
    setTradingVolume(0);
    
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('wallet_connected');

    logger.info('Wallet disconnected');
  };

  // Switch network
  const switchNetwork = async (chainId: string) => {
    try {
      await walletConnect.switchChain(chainId);
      setNetwork(chainId);
      
      // Update balance after network switch if connected
      if (connected && address) {
        try {
          const balance = await walletConnect.getBalance(address);
          setBalance(balance);
        } catch (err) {
          logger.warn('Failed to update balance after network switch', { error: err });
        }
      }

      logger.info('Switched to network', { chainId });
    } catch (error) {
      logger.error('Error switching network', error instanceof Error ? error : new Error(String(error)));
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

// Hook to use wallet context
export const useWallet = () => useContext(WalletContext);

export default WalletContext; 