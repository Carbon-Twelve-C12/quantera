import apiInstance from './api';
import { 
  AssetClass, 
  AssetTemplate, 
  ComplianceModule, 
  CreateAssetRequest, 
  CreateAssetResponse 
} from '../types/assetTypes';
import { getMockTemplatesByClass } from '../data/mockTemplatesData';

// API Base URL - should be set from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// Directly export all the API functions
const api = {
  instance: apiInstance,
  
  // Asset Management APIs
  getAssets: async () => {
    return apiInstance.get('/assets');
  },
  
  getAssetById: async (id: string) => {
    return apiInstance.get(`/assets/${id}`);
  },
  
  // Trade Finance APIs
  getTradeFinanceAssets: async () => {
    return apiInstance.get('/tradefinance/assets');
  },
  
  getTradeFinanceAssetById: async (id: string) => {
    return apiInstance.get(`/tradefinance/assets/${id}`);
  },
  
  // Portfolio APIs
  getPortfolio: async (address: string) => {
    return apiInstance.get(`/users/${address}/portfolio`);
  },
  
  // Yield Strategy APIs
  getYieldStrategies: async () => {
    return apiInstance.get('/yield/strategies');
  },
  
  applyYieldStrategy: async (strategyId: string, assetId: string, amount: number) => {
    return apiInstance.post('/yield/strategies/apply', {
      strategyId,
      assetId,
      amount
    });
  },
  
  // Environmental Asset APIs
  getEnvironmentalAssets: async () => {
    return apiInstance.get('/environmental/assets');
  },
  
  getEnvironmentalImpact: async (assetId: string) => {
    return apiInstance.get(`/environmental/impact/${assetId}`);
  },
  getTemplatesByClass: async (assetClass: AssetClass): Promise<{ templates: AssetTemplate[] }> => {
    // Use mock data for templates
    const templates = getMockTemplatesByClass(assetClass);
    return {
      templates
    };
  },
  getCompatibleModules: async (
    templateId: string, 
    assetClass: AssetClass
  ): Promise<{ modules: ComplianceModule[] }> => {
    // Simulate API call
    return {
      modules: []
    };
  },
  createTemplate: async (
    name: string,
    assetClass: AssetClass,
    isPublic: boolean,
    metadataURI: string,
    description: string
  ): Promise<{ templateId: string }> => {
    // Simulate API call
    return {
      templateId: 'template-' + Date.now()
    };
  },
  createAsset: async (request: CreateAssetRequest): Promise<CreateAssetResponse> => {
    // Simulate API call
    return {
      assetId: 'asset-' + Date.now(),
      contractAddress: '0x' + Math.random().toString(16).slice(2, 42),
      transactionHash: '0x' + Math.random().toString(16).slice(2, 66)
    };
  }
};

export default api; 