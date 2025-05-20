import { AssetClass } from './assetTypes';

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface TimeSeriesDataPoint {
  date: number; // timestamp
  value: number;
}

export interface AssetDistribution {
  assetClass: AssetClass;
  totalValue: number;
  percentage: number;
  count: number;
}

export interface YieldMetric {
  assetClass: AssetClass;
  averageYield: number;
  totalYieldGenerated: number;
  yieldTrend: TimeSeriesDataPoint[];
}

export interface RiskMetric {
  riskLevel: number;
  totalValue: number;
  percentage: number;
  expectedYield: number;
}

export interface LiquidityMetric {
  assetClass: AssetClass;
  liquidityDepth: number;
  liquidityVolume: number; 
  averageSlippage: number;
}

export interface NetworkMetric {
  chainId: number;
  chainName: string;
  txCount: number;
  totalValue: number;
  gasSpent: number;
}

export interface EnvironmentalMetric {
  carbonOffset: number; // tons CO2
  renewableEnergyGenerated: number; // MWh
  landAreaProtected: number; // hectares
  waterSaved: number; // liters
  impactScore: number; // 0-100
}

export interface PlatformMetrics {
  totalValueLocked: number;
  totalAssetCount: number;
  totalUserCount: number;
  totalTransactionCount: number;
  dailyActiveUsers: number;
  averageYield: number;
  totalFeesGenerated: number;
  environmentalImpact: EnvironmentalMetric;
  valueHistory: TimeSeriesDataPoint[];
  userGrowthHistory: TimeSeriesDataPoint[];
  transactionHistory: TimeSeriesDataPoint[];
  assetDistribution: AssetDistribution[];
  yieldMetrics: YieldMetric[];
  riskMetrics: RiskMetric[];
  liquidityMetrics: LiquidityMetric[];
  networkMetrics: NetworkMetric[];
} 