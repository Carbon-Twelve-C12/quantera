import axios from 'axios';
import { YieldStrategy, ApplyStrategyParams, ApplyStrategyResult, YieldImpactResults } from '../contexts/YieldStrategyContext';
import {
  AssetClass,
  AssetTemplate,
  ComplianceModule,
  CreateAssetRequest,
  CreateAssetResponse,
} from '../types/assetTypes';
import { getMockTemplatesByClass } from '../data/mockTemplatesData';
import { API_CONFIG } from '../utils/config';

// Use centralized API configuration - single source of truth
const API_BASE_URL = API_CONFIG.baseUrl;

// Create base axios instance with centralized configuration
const api = axios.create({
  baseURL: API_CONFIG.baseUrl,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response typing information
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StrategiesResponse {
  strategies: YieldStrategy[];
}

export interface UserStrategiesResponse {
  strategies: ApplyStrategyResult[];
}

// Add request interceptor for auth
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle errors (e.g., refresh token, etc.)
    if (error.response?.status === 401) {
      // Token expired or invalid - clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('walletAddress');
      
      // Redirect to login page if not already there
      if (!window.location.pathname.includes('login')) {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ============================================================================
// Authentication APIs (Phase 3C)
// ============================================================================

export const authAPI = {
  /**
   * Request authentication challenge for wallet signing
   * @param walletAddress - Ethereum wallet address (0x...)
   * @returns Challenge object with message to sign
   */
  requestChallenge: async (walletAddress: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/challenge`, {
      wallet_address: walletAddress
    });
    return response.data;
  },

  /**
   * Verify wallet signature and get JWT token
   * @param walletAddress - Ethereum wallet address
   * @param signature - Signed challenge message
   * @returns Authentication data with JWT token
   */
  verifySignature: async (walletAddress: string, signature: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/verify`, {
      wallet_address: walletAddress,
      signature: signature
    });
    return response.data;
  },

  /**
   * Validate current JWT token
   * @param token - JWT token to validate
   * @returns Validation result with user data
   */
  validateToken: async (token: string) => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/auth/validate`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  /**
   * Logout and revoke session
   * @param token - JWT token to revoke
   * @returns Logout confirmation
   */
  logout: async (token: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/logout`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  }
};

// Asset Factory API
export const getTemplatesByClass = async (assetClass: AssetClass): Promise<{ templates: AssetTemplate[] }> => {
  try {
    // For development, use mock data instead of API calls
    const templates = getMockTemplatesByClass(assetClass);
    return { templates };
    
    // When backend is ready, uncomment the following:
    /*
    const response = await fetch(`${API_BASE_URL}/api/templates?assetClass=${assetClass}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch templates: ${response.statusText}`);
    }
    return await response.json();
    */
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
};

export const getCompatibleModules = async (
  templateId: string, 
  assetClass: AssetClass
): Promise<{ modules: ComplianceModule[] }> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/modules?templateId=${templateId}&assetClass=${assetClass}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch modules: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching modules:', error);
    throw error;
  }
};

export const createTemplate = async (
  name: string,
  assetClass: AssetClass,
  isPublic: boolean,
  metadataURI: string,
  description: string
): Promise<{ templateId: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        assetClass,
        isPublic,
        metadataURI,
        description
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create template: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
};

export const createAsset = async (
  request: CreateAssetRequest
): Promise<CreateAssetResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create asset: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating asset:', error);
    throw error;
  }
}; 