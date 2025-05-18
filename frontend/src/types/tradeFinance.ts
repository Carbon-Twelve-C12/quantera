// Trade Finance Types for Quantera Platform
// Aligned with ERC-3643 security token standard for regulatory compliance

export enum TradeFinanceAssetType {
  LETTER_OF_CREDIT = 'LETTER_OF_CREDIT',
  INVOICE_RECEIVABLE = 'INVOICE_RECEIVABLE',
  WAREHOUSE_RECEIPT = 'WAREHOUSE_RECEIPT',
  BILL_OF_LADING = 'BILL_OF_LADING',
  EXPORT_CREDIT = 'EXPORT_CREDIT',
  SUPPLY_CHAIN_FINANCE = 'SUPPLY_CHAIN_FINANCE'
}

export enum SettlementCurrency {
  USDC = 'USDC',
  USDT = 'USDT',
  EURC = 'EURC',
  USDP = 'USDP'
}

export interface TradeFinanceAsset {
  id: string;
  assetType: TradeFinanceAssetType;
  issuer: string;
  recipient: string;
  nominalValue: number;
  currency: string;
  maturityDate: Date;
  description: string;
  termsDocumentHash: string;
  riskRating: number; // 1-10 scale
  yieldRate: number; // Annualized percentage
  fractionalUnits: number; // Number of fractions the asset is divided into
  minimumInvestment: number;
  settlementCurrency: SettlementCurrency;
  status: 'PENDING' | 'ACTIVE' | 'MATURED' | 'DEFAULTED' | 'SETTLED';
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
  totalValueLocked: number;
  activeAssets: number;
  averageYield: number;
  averageTerm: number; // Days
  assetTypeDistribution: Record<TradeFinanceAssetType, number>;
  riskDistribution: Record<number, number>; // Key is risk rating 1-10
  geographicDistribution: Record<string, number>; // Country code to percentage
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