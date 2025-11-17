import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { authAPI } from '../api/api';

// Types for auth context
interface User {
  id: string;
  username: string;
  role: string;
  permissions?: string[];
  walletAddress?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  walletAddress: string | null;
  loginWithWallet: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  token: null,
  walletAddress: null,
  loginWithWallet: async () => {},
  logout: async () => {},
  isLoading: false,
  error: null,
  clearError: () => {},
});

// Custom hook for using the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      const savedAddress = localStorage.getItem('walletAddress');
      
      if (savedToken && savedUser) {
        try {
          // Validate token with backend
          const validation = await authAPI.validateToken(savedToken);
          
          if (validation.valid) {
            setUser(JSON.parse(savedUser));
            setToken(savedToken);
            setWalletAddress(savedAddress);
            setIsAuthenticated(true);
          } else {
            // Token is invalid, clear everything
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('walletAddress');
          }
        } catch (err) {
          console.error('Token validation failed:', err);
          // Clear invalid session
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('walletAddress');
        }
      }
    };
    
    initializeAuth();
  }, []);

  // Wallet-based authentication (Phase 3C)
  const loginWithWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 1. Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }
      
      // 2. Request account access
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      console.log('Connected wallet:', address);
      
      // 3. Request challenge from backend
      const challengeData = await authAPI.requestChallenge(address);
      console.log('Challenge received from backend');
      
      // 4. Sign the challenge message
      const signature = await signer.signMessage(challengeData.challenge);
      console.log('Message signed by wallet');
      
      // 5. Verify signature and get JWT token
      const authData = await authAPI.verifySignature(address, signature);
      console.log('Authentication successful');
      
      // 6. Create user object
      const user: User = {
        id: authData.wallet_address,
        username: `${authData.wallet_address.substring(0, 6)}...${authData.wallet_address.substring(38)}`,
        role: authData.role || 'user',
        walletAddress: authData.wallet_address,
      };
      
      // 7. Store in localStorage
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('walletAddress', authData.wallet_address);
      
      // 8. Update state
      setUser(user);
      setToken(authData.token);
      setWalletAddress(authData.wallet_address);
      setIsAuthenticated(true);
      
      console.log('Login complete');
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle specific errors with user-friendly messages
      if (err.message?.includes('MetaMask')) {
        setError('MetaMask not found. Please install MetaMask extension.');
      } else if (err.code === 4001) {
        setError('Signature rejected. Please approve the signature request to login.');
      } else if (err.code === -32002) {
        setError('MetaMask is already processing a request. Please check MetaMask.');
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please try again.');
      } else if (err.response?.status === 400) {
        setError('Invalid wallet address format.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
      
      // Clear any partial state
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
      setWalletAddress(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function with backend session revocation
  const logout = async () => {
    try {
      // Call backend to revoke session if we have a token
      if (token) {
        await authAPI.logout(token);
        console.log('Session revoked on backend');
      }
    } catch (err) {
      console.error('Logout error:', err);
      // Continue with local logout even if backend call fails
    } finally {
      // Clear local state
      setUser(null);
      setToken(null);
      setWalletAddress(null);
      setIsAuthenticated(false);
      
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('walletAddress');
    }
  };
  
  // Clear error message
  const clearError = () => {
    setError(null);
  };

  // Handle MetaMask account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected wallet
          console.log('Wallet disconnected');
          logout();
        } else if (accounts[0] !== walletAddress) {
          // User switched accounts - require re-authentication
          console.log('Account changed, logging out');
          logout();
        }
      };
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, [walletAddress]);

  const value = {
    isAuthenticated,
    user,
    token,
    walletAddress,
    loginWithWallet,
    logout,
    isLoading,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 