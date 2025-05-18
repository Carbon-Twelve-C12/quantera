import apiInstance from './api';
import { 
  AssetClass, 
  AssetTemplate, 
  ComplianceModule, 
  CreateAssetRequest, 
  CreateAssetResponse 
} from '../types/assetTypes';
import { getMockTemplatesByClass } from '../data/mockTemplatesData';

// Directly export all the API functions
const api = {
  instance: apiInstance,
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