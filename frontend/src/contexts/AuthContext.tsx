import React, { createContext, useContext, useState, useEffect } from 'react';

// Types for auth context
interface User {
  id: string;
  username: string;
  role: string;
  permissions?: string[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  userAddress: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  token: null,
  userAddress: null,
  login: async () => {},
  logout: () => {},
  isLoading: false,
  error: null,
});

// Custom hook for using the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>('0x1234567890123456789012345678901234567890');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    const storedAddress = localStorage.getItem('auth_address');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
        
        if (storedAddress) {
          setUserAddress(storedAddress);
        }
      } catch (err) {
        // Invalid stored user, clear storage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_address');
      }
    }
    
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Mock API call - replace with real API call
      // const response = await fetch('http://localhost:3030/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ username, password }),
      // });
      
      // if (!response.ok) {
      //   throw new Error('Invalid credentials');
      // }
      
      // const data = await response.json();
      
      // Mock successful login for development
      const mockUser: User = {
        id: '1',
        username,
        role: username.includes('admin') ? 'admin' : 'user',
      };
      
      const mockToken = 'mock_jwt_token';
      const mockAddress = '0x1234567890123456789012345678901234567890';
      
      // Store in localStorage
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
      localStorage.setItem('auth_address', mockAddress);
      
      // Update state
      setToken(mockToken);
      setUser(mockUser);
      setUserAddress(mockAddress);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_address');
    
    // Reset state
    setToken(null);
    setUser(null);
    setUserAddress(null);
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    user,
    token,
    userAddress,
    login,
    logout,
    isLoading,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 