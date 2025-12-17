import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ethers } from 'ethers';
import { secureStorage, isCryptoAvailable } from '../utils/crypto';

// Security configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const TOKEN_STORAGE_KEY = 'quantera_auth_token';
const REFRESH_TOKEN_KEY = 'quantera_refresh_token';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

// Log crypto availability on load
if (typeof window !== 'undefined') {
  console.log(`[Security] Web Crypto API available: ${isCryptoAvailable()}`);
}

// User roles and permissions
export enum UserRole {
  ADMIN = 'Admin',
  ASSET_MANAGER = 'AssetManager',
  COMPLIANCE_OFFICER = 'ComplianceOfficer',
  INVESTOR = 'Investor',
  READ_ONLY = 'ReadOnly',
}

export enum Permission {
  CREATE_ASSET = 'CreateAsset',
  DEPLOY_ASSET = 'DeployAsset',
  VIEW_ASSET = 'ViewAsset',
  MANAGE_COMPLIANCE = 'ManageCompliance',
  VIEW_COMPLIANCE = 'ViewCompliance',
  MANAGE_INVESTORS = 'ManageInvestors',
  VIEW_INVESTORS = 'ViewInvestors',
  SYSTEM_ADMIN = 'SystemAdmin',
}

// User interface
export interface SecureUser {
  id: string;
  walletAddress: string;
  role: UserRole;
  permissions: Permission[];
  accessLevel: string;
  lastLogin: Date;
  sessionExpiry: Date;
}

// Authentication state interface
interface SecureAuthState {
  user: SecureUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (walletAddress: string, signature: string, message: string) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  hasPermission: (permission: Permission) => boolean;
  clearError: () => void;
}

// Create context
const SecureAuthContext = createContext<SecureAuthState>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => false,
  logout: () => {},
  refreshToken: async () => false,
  hasPermission: () => false,
  clearError: () => {},
});

// Custom hook to use auth context
export const useSecureAuth = () => {
  const context = useContext(SecureAuthContext);
  if (!context) {
    throw new Error('useSecureAuth must be used within a SecureAuthProvider');
  }
  return context;
};

// Auth provider component
export const SecureAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SecureUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (isAuthenticated && user) {
      const timeUntilExpiry = user.sessionExpiry.getTime() - Date.now();
      const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 60 * 1000); // 5 minutes before expiry

      const refreshTimer = setTimeout(() => {
        refreshToken();
      }, refreshTime);

      return () => clearTimeout(refreshTimer);
    }
  }, [user, isAuthenticated]);

  const initializeAuth = async () => {
    try {
      const storedToken = await getSecureItem(TOKEN_STORAGE_KEY);
      const refreshTokenValue = await getSecureItem(REFRESH_TOKEN_KEY);

      if (storedToken && refreshTokenValue) {
        // Validate token with backend
        const isValid = await validateToken(storedToken);
        if (isValid) {
          setToken(storedToken);
          await fetchUserProfile(storedToken);
        } else {
          // Try to refresh token
          const refreshed = await refreshTokenWithBackend(refreshTokenValue);
          if (!refreshed) {
            clearAuthData();
          }
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (walletAddress: string, signature: string, message: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate wallet address format
      if (!ethers.isAddress(walletAddress)) {
        throw new Error('Invalid wallet address format');
      }

      // Verify signature
      const isValidSignature = await verifySignature(walletAddress, signature, message);
      if (!isValidSignature) {
        throw new Error('Invalid signature');
      }

      // Send login request to backend
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
          signature,
          message,
          timestamp: Math.floor(Date.now() / 1000),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const loginData = await response.json();

      // Store tokens securely using AES-GCM encryption
      await setSecureItem(TOKEN_STORAGE_KEY, loginData.token);
      if (loginData.refresh_token) {
        await setSecureItem(REFRESH_TOKEN_KEY, loginData.refresh_token);
      }

      // Set user data
      const userData: SecureUser = {
        id: walletAddress,
        walletAddress,
        role: loginData.user_role,
        permissions: loginData.permissions,
        accessLevel: loginData.access_level || 'Standard',
        lastLogin: new Date(),
        sessionExpiry: new Date(loginData.expires_at),
      };

      setUser(userData);
      setToken(loginData.token);
      setIsAuthenticated(true);

      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuthData();
    // Optionally notify backend of logout
    if (token) {
      fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).catch(console.error);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = await getSecureItem(REFRESH_TOKEN_KEY);
      if (!refreshTokenValue) {
        return false;
      }

      return await refreshTokenWithBackend(refreshTokenValue);
    } catch (error) {
      console.error('Token refresh error:', error);
      clearAuthData();
      return false;
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission) || user.role === UserRole.ADMIN;
  };

  const clearError = () => {
    setError(null);
  };

  // Helper functions
  const verifySignature = async (address: string, signature: string, message: string): Promise<boolean> => {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  };

  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const profileData = await response.json();
        const userData: SecureUser = {
          id: profileData.wallet_address,
          walletAddress: profileData.wallet_address,
          role: profileData.role,
          permissions: profileData.permissions,
          accessLevel: profileData.access_level,
          lastLogin: new Date(profileData.last_login),
          sessionExpiry: new Date(profileData.session_expiry),
        };

        setUser(userData);
        setIsAuthenticated(true);
      } else {
        throw new Error('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      clearAuthData();
    }
  };

  const refreshTokenWithBackend = async (refreshTokenValue: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshTokenValue,
        }),
      });

      if (response.ok) {
        const refreshData = await response.json();
        await setSecureItem(TOKEN_STORAGE_KEY, refreshData.token);
        setToken(refreshData.token);

        // Update user session expiry
        if (user) {
          setUser({
            ...user,
            sessionExpiry: new Date(refreshData.expires_at),
          });
        }

        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  };

  const clearAuthData = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    removeSecureItem(TOKEN_STORAGE_KEY);
    removeSecureItem(REFRESH_TOKEN_KEY);
  };

  // Secure storage helpers using AES-GCM encryption via Web Crypto API
  // These are async because Web Crypto operations are asynchronous
  const setSecureItem = useCallback(async (key: string, value: string): Promise<void> => {
    try {
      await secureStorage.setItem(key, value);
    } catch (error) {
      console.error('Secure storage error:', error);
      throw error;
    }
  }, []);

  const getSecureItem = useCallback(async (key: string): Promise<string | null> => {
    try {
      return await secureStorage.getItem(key);
    } catch (error) {
      console.error('Secure retrieval error:', error);
      return null;
    }
  }, []);

  const removeSecureItem = useCallback((key: string): void => {
    try {
      secureStorage.removeItem(key);
    } catch (error) {
      console.error('Secure removal error:', error);
    }
  }, []);

  const value: SecureAuthState = {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refreshToken,
    hasPermission,
    clearError,
  };

  return (
    <SecureAuthContext.Provider value={value}>
      {children}
    </SecureAuthContext.Provider>
  );
}; 