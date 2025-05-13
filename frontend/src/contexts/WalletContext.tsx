import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

// Define interface for Web3Provider
interface Web3Provider extends ethers.BrowserProvider {
  getSigner(): Promise<ethers.JsonRpcSigner>;
}

// Define Ethereum Window interface
interface EthereumWindow extends Window {
  ethereum?: {
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, listener: (...args: any[]) => void) => void;
    removeListener: (event: string, listener: (...args: any[]) => void) => void;
    isMetaMask?: boolean;
  };
}

// Wallet state interface
export interface WalletState {
  connected: boolean;
  address: string | null;
  provider: Web3Provider | null;
  signer: ethers.JsonRpcSigner | null;
  chainId: number | null;
  balance: string | null;
  connecting: boolean;
  error: string | null;
}

// Wallet context interface
export interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<boolean>;
  refreshBalance: () => Promise<void>;
}

// Default context values
const defaultContext: WalletContextType = {
  connected: false,
  address: null,
  provider: null,
  signer: null,
  chainId: null,
  balance: null,
  connecting: false,
  error: null,
  connect: async () => {},
  disconnect: () => {},
  switchChain: async () => false,
  refreshBalance: async () => {},
};

// Create context
const WalletContext = createContext<WalletContextType>(defaultContext);

// Props interface
interface WalletProviderProps {
  children: ReactNode;
}

// Provider component
export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [state, setState] = useState<WalletState>({
    connected: false,
    address: null,
    provider: null,
    signer: null,
    chainId: null,
    balance: null,
    connecting: false,
    error: null,
  });

  // Initialize from local storage if available
  useEffect(() => {
    const storedAddress = localStorage.getItem('walletAddress');
    if (storedAddress) {
      connect().catch(console.error);
    }
  }, []);

  // Refresh user balance
  const refreshBalance = async () => {
    if (state.provider && state.address) {
      try {
        const balance = await state.provider.getBalance(state.address);
        setState(prev => ({
          ...prev,
          balance: ethers.formatEther(balance),
        }));
      } catch (error) {
        console.error('Error getting balance:', error);
      }
    }
  };

  // Setup chain change listener
  useEffect(() => {
    const handleChainChanged = (chainId: string) => {
      console.log('Chain changed to:', chainId);
      window.location.reload();
    };

    const ethereum = (window as EthereumWindow).ethereum;
    if (ethereum) {
      ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (ethereum) {
        ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  // Setup account change listener
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      console.log('Accounts changed:', accounts);
      if (accounts.length === 0) {
        // User disconnected their wallet
        disconnect();
      } else if (accounts[0] !== state.address) {
        // User switched accounts
        connect().catch(console.error);
      }
    };

    const ethereum = (window as EthereumWindow).ethereum;
    if (ethereum) {
      ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (ethereum) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [state.address]);

  // Connect wallet
  const connect = async () => {
    try {
      setState(prev => ({ ...prev, connecting: true, error: null }));
      const ethereum = (window as EthereumWindow).ethereum;

      if (!ethereum) {
        throw new Error('No crypto wallet found. Please install MetaMask.');
      }

      // Request accounts
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];

      // Create ethers provider
      const provider = new ethers.BrowserProvider(ethereum) as Web3Provider;
      const signer = await provider.getSigner();

      // Get network
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      // Get balance
      const balance = await provider.getBalance(address);

      setState({
        connected: true,
        address,
        provider,
        signer,
        chainId,
        balance: ethers.formatEther(balance),
        connecting: false,
        error: null,
      });

      // Save to local storage
      localStorage.setItem('walletAddress', address);
    } catch (error: any) {
      console.error('Connection error:', error);
      setState(prev => ({
        ...prev,
        connected: false,
        connecting: false,
        error: error.message || 'Failed to connect wallet',
      }));
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    localStorage.removeItem('walletAddress');
    setState({
      connected: false,
      address: null,
      provider: null,
      signer: null,
      chainId: null,
      balance: null,
      connecting: false,
      error: null,
    });
  };

  // Switch network
  const switchChain = async (chainId: number): Promise<boolean> => {
    const ethereum = (window as EthereumWindow).ethereum;
    if (!ethereum) return false;

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      return true;
    } catch (error: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        // Add the network
        try {
          // You would typically define chain parameters here
          return false;
        } catch (addError) {
          console.error('Error adding chain:', addError);
          return false;
        }
      }
      console.error('Error switching chain:', error);
      return false;
    }
  };

  const value = {
    ...state,
    connect,
    disconnect,
    switchChain,
    refreshBalance,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

// Hook to use wallet context
export const useWallet = () => useContext(WalletContext);

export default WalletContext; 