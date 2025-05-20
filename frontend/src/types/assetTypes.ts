export enum AssetClass {
  TREASURY = 'TREASURY',
  REAL_ESTATE = 'REAL_ESTATE',
  CORPORATE_BOND = 'CORPORATE_BOND',
  ENVIRONMENTAL_ASSET = 'ENVIRONMENTAL_ASSET',
  IP_RIGHT = 'IP_RIGHT',
  INVOICE = 'INVOICE',
  COMMODITY = 'COMMODITY',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  TRADE_FINANCE = 'TRADE_FINANCE',
  CUSTOM = 'CUSTOM'
}

export interface AssetTemplate {
  templateId: string;
  name: string;
  assetClass: AssetClass;
  creator: string;
  creationDate: number;
  isPublic: boolean;
  metadataURI: string;
  compatibleModules: string[];
}

export interface AssetParams {
  name: string;
  symbol: string;
  description: string;
  totalSupply: string;
  decimals: number;
  faceValue: string;
  issuanceDate: number;
  maturityDate: number;
  yieldRate: string;
  metadataURI: string;
  imageUrl: string;
  customFields: Record<string, any>;
}

export interface TokenomicsConfig {
  hasTransferRestrictions: boolean;
  hasDividends: boolean;
  hasMaturity: boolean;
  hasRoyalties: boolean;
  feeRate: number;
  feeRecipient: string;
  customTokenomics: Record<string, any>;
}

export interface ModuleConfig {
  moduleId: string;
  isEnabled: boolean;
  moduleData: string;
}

export interface ComplianceModule {
  moduleId: string;
  name: string;
  description: string;
  isRequired: boolean;
  compatibleAssetClasses: AssetClass[];
}

export interface CreateAssetRequest {
  templateId: string;
  assetParams: AssetParams;
  tokenomics: TokenomicsConfig;
  modules: ModuleConfig[];
}

export interface CreateAssetResponse {
  assetId: string;
  contractAddress: string;
  transactionHash: string;
}

export interface Asset {
  assetId: string;
  assetAddress: string;
  assetClass: AssetClass;
  name: string;
  symbol: string;
  totalSupply: string;
  decimals: number;
  issuer: string;
  creationDate: number;
  metadataURI: string;
  imageUrl: string;
}

export interface AssetWithDetails extends Asset {
  description: string;
  faceValue: string;
  issuanceDate: number;
  maturityDate: number;
  yieldRate: string;
  imageUrl: string;
  customFields: Record<string, any>;
  tokenomics: TokenomicsConfig;
  modules: {
    moduleId: string;
    isEnabled: boolean;
  }[];
}

export interface EnvironmentalAssetMetadata {
  assetType: string;
  certificationStandard: string;
  vintageYear: number;
  projectId: string;
  projectLocation: string;
  verificationDate: number;
  registryLink: string;
  impactMetrics: Record<string, string>;
  expirationDate?: number;
} 