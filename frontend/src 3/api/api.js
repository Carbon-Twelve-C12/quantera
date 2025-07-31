import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token in requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Treasury API calls
const treasuryApi = {
  getAllTreasuries: async (filters = {}) => {
    const response = await axiosInstance.get('/treasuries', { params: filters });
    return response.data;
  },
  
  getTreasuryById: async (treasuryId) => {
    const response = await axiosInstance.get(`/treasuries/${treasuryId}`);
    return response.data;
  },
  
  getTreasuryYield: async (treasuryId) => {
    const response = await axiosInstance.get(`/treasuries/${treasuryId}/yield`);
    return response.data;
  },
};

// User API calls
const userApi = {
  register: async (userData) => {
    const response = await axiosInstance.post('/users/register', userData);
    return response.data;
  },
  
  submitVerification: async (verificationData) => {
    const response = await axiosInstance.post('/users/verify', verificationData);
    return response.data;
  },
  
  getPortfolio: async (address) => {
    const response = await axiosInstance.get(`/users/${address}/portfolio`);
    return response.data;
  },
  
  setupSmartAccount: async (address, accountCode) => {
    const response = await axiosInstance.post(`/users/${address}/smart-account`, { account_code: accountCode });
    return response.data;
  },
};

// Trading API calls
const tradingApi = {
  getOrders: async (filters = {}) => {
    const response = await axiosInstance.get('/trading/orders', { params: filters });
    return response.data;
  },
  
  getOrderById: async (orderId) => {
    const response = await axiosInstance.get(`/trading/orders/${orderId}`);
    return response.data;
  },
  
  createBuyOrder: async (orderData) => {
    const response = await axiosInstance.post('/trading/orders', { 
      ...orderData,
      order_type: 'BUY'
    });
    return response.data;
  },
  
  createSellOrder: async (orderData) => {
    const response = await axiosInstance.post('/trading/orders', { 
      ...orderData,
      order_type: 'SELL'
    });
    return response.data;
  },
  
  cancelOrder: async (orderId) => {
    const response = await axiosInstance.post('/trading/orders/cancel', { order_id: orderId });
    return response.data;
  },
};

// Authentication API calls
const authApi = {
  getChallenge: async (address) => {
    const response = await axiosInstance.post('/auth/challenge', { wallet_address: address });
    return response.data;
  },
  
  login: async (address, signature) => {
    const response = await axiosInstance.post('/auth/login', { 
      wallet_address: address,
      signature
    });
    
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    
    return response.data;
  },
  
  logout: async () => {
    const response = await axiosInstance.post('/auth/logout');
    localStorage.removeItem('auth_token');
    return response.data;
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('auth_token');
  },
};

// Export all API endpoints
export { treasuryApi, userApi, tradingApi, authApi }; 