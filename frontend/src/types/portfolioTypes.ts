export interface AssetHolding {
  id: string;
  name: string;
  symbol: string;
  quantity: number;
  price: number;
  value: number;
  yield?: number;
  yieldAmount?: number;
  maturity?: string;
  type: string;
  category: 'treasury' | 'environmental' | 'real_estate' | 'trade_finance' | 'commodity' | 'corporate_bond' | 'custom';
  impactMetrics?: {
    carbonOffset?: number;
    landProtected?: number;
    waterSaved?: number;
    biodiversityScore?: number;
    communityImpact?: number;
  };
  certificationStandard?: string;
  vintage?: number;
  sdgAlignment?: number[];
  assetClass?: string;
  acquisitionDate?: number;
  acquisitionPrice?: number;
  performanceHistory?: PerformancePoint[];
  allocation?: number;
  imageUrl?: string;
}

export interface PerformancePoint {
  date: number;  // Unix timestamp
  value: number;
  yield?: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalYield: number;
  yieldRate: number;
  impactScore?: number;
  carbonOffset?: number;
  assetAllocation: {
    [key: string]: number;  // category: percentage
  };
  performanceHistory: PerformancePoint[];
  holdings: AssetHolding[];
}

export interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'yield' | 'transfer' | 'retirement';
  assetId: string;
  assetName: string;
  assetSymbol: string;
  quantity: number;
  price: number;
  totalValue: number;
  timestamp: number;
  status: 'completed' | 'pending' | 'failed';
  txHash?: string;
}

export interface YieldDistribution {
  id: string;
  assetId: string;
  assetName: string;
  amount: number;
  yieldRate: number;
  distributionDate: number;
  nextDistributionDate?: number;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
}

export interface PortfolioPerformance {
  totalReturn: number;
  totalReturnPercentage: number;
  timeWeightedReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  periods: {
    daily: number;
    weekly: number;
    monthly: number;
    quarterly: number;
    yearly: number;
    allTime: number;
  };
}

export interface ImpactMetrics {
  totalCarbonOffset: number;
  totalLandProtected: number;
  totalWaterSaved: number;
  biodiversityScore: number;
  communityImpact: number;
  sdgContributions: {
    [key: number]: number;  // SDG number: impact score
  };
  impactByProject: {
    projectId: string;
    projectName: string;
    carbonOffset: number;
    landProtected?: number;
    waterSaved?: number;
  }[];
} 