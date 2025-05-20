import { 
  PlatformMetrics,
  TimeSeriesDataPoint, 
  AssetDistribution,
  YieldMetric,
  RiskMetric,
  LiquidityMetric,
  NetworkMetric,
  EnvironmentalMetric
} from '../types/analyticsTypes';
import { AssetClass } from '../types/assetTypes';

// Helper to generate time series data with a trend
const generateTimeSeriesData = (
  days: number, 
  startValue: number, 
  volatility: number = 0.02, 
  trend: number = 0.001
): TimeSeriesDataPoint[] => {
  const now = Date.now();
  const msInDay = 24 * 60 * 60 * 1000;
  const result: TimeSeriesDataPoint[] = [];
  
  let currentValue = startValue;
  
  for (let i = days; i >= 0; i--) {
    const date = now - (i * msInDay);
    const randomFactor = 1 + (Math.random() * volatility * 2 - volatility);
    const trendFactor = 1 + (trend * (days - i));
    
    currentValue = currentValue * randomFactor * trendFactor;
    
    result.push({
      date,
      value: currentValue
    });
  }
  
  return result;
};

// Create environmental metrics
const mockEnvironmentalMetric: EnvironmentalMetric = {
  carbonOffset: 2450.75,
  renewableEnergyGenerated: 1825.3,
  landAreaProtected: 326.5,
  waterSaved: 3750000,
  impactScore: 82
};

// Create asset distribution
const mockAssetDistribution: AssetDistribution[] = [
  {
    assetClass: AssetClass.TREASURY,
    totalValue: 3250000,
    percentage: 65,
    count: 8
  },
  {
    assetClass: AssetClass.REAL_ESTATE,
    totalValue: 750000,
    percentage: 15,
    count: 2
  },
  {
    assetClass: AssetClass.ENVIRONMENTAL_ASSET,
    totalValue: 500000,
    percentage: 10,
    count: 4
  },
  {
    assetClass: AssetClass.TRADE_FINANCE,
    totalValue: 350000,
    percentage: 7,
    count: 3
  },
  {
    assetClass: AssetClass.CUSTOM,
    totalValue: 150000,
    percentage: 3,
    count: 1
  }
];

// Create yield metrics
const mockYieldMetrics: YieldMetric[] = [
  {
    assetClass: AssetClass.TREASURY,
    averageYield: 4.25,
    totalYieldGenerated: 138125,
    yieldTrend: generateTimeSeriesData(90, 4.0, 0.005, 0.0005)
  },
  {
    assetClass: AssetClass.REAL_ESTATE,
    averageYield: 7.15,
    totalYieldGenerated: 53625,
    yieldTrend: generateTimeSeriesData(90, 7.0, 0.01, 0.0003)
  },
  {
    assetClass: AssetClass.ENVIRONMENTAL_ASSET,
    averageYield: 5.75,
    totalYieldGenerated: 28750,
    yieldTrend: generateTimeSeriesData(90, 5.5, 0.008, 0.0006)
  },
  {
    assetClass: AssetClass.TRADE_FINANCE,
    averageYield: 6.25,
    totalYieldGenerated: 21875,
    yieldTrend: generateTimeSeriesData(90, 6.0, 0.012, 0.0005)
  },
  {
    assetClass: AssetClass.CUSTOM,
    averageYield: 8.50,
    totalYieldGenerated: 12750,
    yieldTrend: generateTimeSeriesData(90, 8.0, 0.015, 0.001)
  }
];

// Create risk metrics
const mockRiskMetrics: RiskMetric[] = [
  {
    riskLevel: 1,
    totalValue: 2000000,
    percentage: 40,
    expectedYield: 3.75
  },
  {
    riskLevel: 2,
    totalValue: 1500000,
    percentage: 30,
    expectedYield: 5.25
  },
  {
    riskLevel: 3,
    totalValue: 1000000,
    percentage: 20,
    expectedYield: 6.5
  },
  {
    riskLevel: 4,
    totalValue: 500000,
    percentage: 10,
    expectedYield: 8.25
  }
];

// Create liquidity metrics
const mockLiquidityMetrics: LiquidityMetric[] = [
  {
    assetClass: AssetClass.TREASURY,
    liquidityDepth: 1250000,
    liquidityVolume: 325000,
    averageSlippage: 0.12
  },
  {
    assetClass: AssetClass.REAL_ESTATE,
    liquidityDepth: 350000,
    liquidityVolume: 85000,
    averageSlippage: 0.45
  },
  {
    assetClass: AssetClass.ENVIRONMENTAL_ASSET,
    liquidityDepth: 200000,
    liquidityVolume: 45000,
    averageSlippage: 0.38
  },
  {
    assetClass: AssetClass.TRADE_FINANCE,
    liquidityDepth: 150000,
    liquidityVolume: 35000,
    averageSlippage: 0.52
  },
  {
    assetClass: AssetClass.CUSTOM,
    liquidityDepth: 75000,
    liquidityVolume: 15000,
    averageSlippage: 0.65
  }
];

// Create network metrics
const mockNetworkMetrics: NetworkMetric[] = [
  {
    chainId: 1,
    chainName: 'Ethereum',
    txCount: 12500,
    totalValue: 2500000,
    gasSpent: 38.5
  },
  {
    chainId: 10,
    chainName: 'Optimism',
    txCount: 8750,
    totalValue: 1750000,
    gasSpent: 15.2
  },
  {
    chainId: 42161,
    chainName: 'Arbitrum',
    txCount: 5250,
    totalValue: 750000,
    gasSpent: 9.8
  }
];

// Complete platform metrics
export const mockPlatformMetrics: PlatformMetrics = {
  totalValueLocked: 5000000,
  totalAssetCount: 18,
  totalUserCount: 1250,
  totalTransactionCount: 26500,
  dailyActiveUsers: 325,
  averageYield: 5.85,
  totalFeesGenerated: 85000,
  environmentalImpact: mockEnvironmentalMetric,
  valueHistory: generateTimeSeriesData(180, 2500000, 0.01, 0.002),
  userGrowthHistory: generateTimeSeriesData(180, 500, 0.015, 0.003),
  transactionHistory: generateTimeSeriesData(180, 5000, 0.02, 0.004),
  assetDistribution: mockAssetDistribution,
  yieldMetrics: mockYieldMetrics,
  riskMetrics: mockRiskMetrics,
  liquidityMetrics: mockLiquidityMetrics,
  networkMetrics: mockNetworkMetrics
}; 