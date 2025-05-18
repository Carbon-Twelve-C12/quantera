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

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create base axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://api.quantera.io/v1',
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
      // Redirect to login or refresh token
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default api;

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