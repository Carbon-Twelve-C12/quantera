import React, { createContext, useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import { authApi } from '../api/api';

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
  const [address, setAddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  // Check if user was previously connected and authenticated
  useEffect(() => {
    const checkPreviousSession = async () => {
      const token = localStorage.getItem('auth_token');
      const savedAddress = localStorage.getItem('wallet_address');
      
      if (token && savedAddress && window.ethereum) {
        setIsAuthenticated(true);
        try {
          await connectWallet(true); // Silent connect
        } catch (error) {
          console.error('Failed to reconnect wallet:', error);
          setIsAuthenticated(false);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('wallet_address');
        }
      }
    };
    
    checkPreviousSession();
  }, []);

  // Handle account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          disconnect();
        } else if (accounts[0] !== address) {
          setAddress(accounts[0]);
          localStorage.setItem('wallet_address', accounts[0]);
          // User changed account - they need to re-authenticate
          setIsAuthenticated(false);
        }
      };

      const handleChainChanged = (chainIdHex) => {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [address]);

  // Support for EIP-7702 smart accounts
  const checkSmartAccountSupport = async () => {
    if (provider) {
      try {
        // Check if the provider supports EIP-7702
        const hasSmartAccountSupport = await provider.send('eth_supportedInterfaces', [['0x7702']]);
        return hasSmartAccountSupport && hasSmartAccountSupport.includes('0x7702');
      } catch (error) {
        console.error('Error checking for smart account support:', error);
        return false;
      }
    }
    return false;
  };

  // Connect wallet
  const connectWallet = async (silent = false) => {
    if (!window.ethereum) {
      if (!silent) {
        setError('No Ethereum wallet detected. Please install MetaMask or another wallet.');
      }
      return false;
    }

    try {
      if (!silent) setIsConnecting(true);
      
      // Request accounts
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Set up ethers provider and signer
      const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
      const ethersSigner = ethersProvider.getSigner();
      const network = await ethersProvider.getNetwork();
      
      setProvider(ethersProvider);
      setSigner(ethersSigner);
      setAddress(accounts[0]);
      setChainId(network.chainId);
      setIsConnected(true);
      
      localStorage.setItem('wallet_address', accounts[0]);
      
      if (!silent) setIsConnecting(false);
      return true;
    } catch (error) {
      if (!silent) {
        setError('Failed to connect wallet: ' + error.message);
        setIsConnecting(false);
      }
      return false;
    }
  };

  // Authenticate user with signature
  const authenticate = async () => {
    if (!address || !signer) {
      setError('Wallet not connected');
      return false;
    }

    try {
      // Get challenge from server
      const { challenge } = await authApi.getChallenge(address);
      
      // Sign the challenge
      const signature = await signer.signMessage(challenge);
      
      // Submit signature to server
      await authApi.login(address, signature);
      
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      setError('Authentication failed: ' + error.message);
      return false;
    }
  };

  // Disconnect wallet
  const disconnect = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setAddress(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setIsConnected(false);
    setIsAuthenticated(false);
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('wallet_address');
  };

  // Handle errors
  const clearError = () => setError(null);

  return (
    <WalletContext.Provider
      value={{
        address,
        provider,
        signer,
        chainId,
        isConnecting,
        isConnected,
        isAuthenticated,
        error,
        connectWallet,
        authenticate,
        disconnect,
        clearError,
        checkSmartAccountSupport,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContext; 