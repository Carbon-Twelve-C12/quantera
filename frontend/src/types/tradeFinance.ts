// Trade Finance Types for Quantera Platform
// Aligned with ERC-3643 security token standard for regulatory compliance

export enum TradeFinanceAssetType {
  EXPORT_FINANCING = "EXPORT_FINANCING",
  IMPORT_FINANCING = "IMPORT_FINANCING",
  INVENTORY_FINANCING = "INVENTORY_FINANCING",
  SUPPLY_CHAIN_FINANCE = "SUPPLY_CHAIN_FINANCE"
}

export enum SettlementCurrency {
  USDC = 'USDC',
  USDT = 'USDT',
  EURC = 'EURC',
  USDP = 'USDP'
}

export interface TradeFinanceAsset {
  id: string;
  name: string;
  description: string;
  assetType: TradeFinanceAssetType;
  issuer: string;
  recipient: string;
  imageUrl: string;
  yieldRate: number;
  maturityDate: number;
  currentPrice: string;
  nominalValue: number;
  currency: string;
  fractionalUnits: number;
  status: 'Active' | 'Pending' | 'Completed';
  riskRating: number;
  minimumInvestment: number;
  settlementCurrency: string;
}

export interface TradeFinancePosition {
  assetId: string;
  ownerAddress: string;
  unitsOwned: number;
  investmentAmount: number;
  acquisitionDate: Date;
  expectedReturn: number;
  expectedMaturityDate: Date;
}

export interface TradeFinanceAnalytics {
  totalVolume: number;
  activeAssets: number;
  averageYield: number;
  averageMaturity: number;
  assetTypeDistribution: {
    type: TradeFinanceAssetType;
    count: number;
    percentage: number;
  }[];
  countryDistribution: {
    country: string;
    count: number;
    percentage: number;
  }[];
}

// Digital Identity Verification Interface
export interface IdentityVerification {
  userId: string;
  verificationType: 'KYC' | 'AML' | 'ACCREDITED_INVESTOR' | 'TRADE_ENTITY';
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  verificationDate?: Date;
  expirationDate?: Date;
  documentHashes: string[];
  verificationProvider: string;
  businessEntityDetails?: {
    entityName: string;
    registrationNumber: string;
    jurisdiction: string;
    entityType: string;
    incorporationDate: Date;
    tradingHistory: number; // Years
  }
} 