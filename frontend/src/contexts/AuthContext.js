import React, { createContext, useContext, useState } from 'react';

// Create a context for authentication
const AuthContext = createContext(null);

// Create a provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState({
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    username: 'User',
    isConnected: true,
    balance: {
      eth: '1.245',
      usdc: '5000.00'
    }
  });

  // Mock login/logout functions
  const login = (address) => {
    setCurrentUser({
      address,
      username: 'User',
      isConnected: true,
      balance: {
        eth: '1.245',
        usdc: '5000.00'
      }
    });
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    return true;
  };

  // Values to be provided to consumers
  const value = {
    currentUser,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext; 