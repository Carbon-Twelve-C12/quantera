import { 
  PortfolioSummary, 
  AssetHolding, 
  Transaction, 
  YieldDistribution,
  PortfolioPerformance,
  ImpactMetrics
} from '../types/portfolioTypes';

// Helper to generate dates
const NOW = Date.now();
const DAY = 24 * 60 * 60 * 1000;

// Generate performance history for 6 months
const generatePerformanceHistory = (
  startValue: number, 
  volatility: number = 0.02, 
  upwardTrend: number = 0.0005
) => {
  const history = [];
  let currentValue = startValue;
  
  // Generate daily data points for the past 180 days
  for (let i = 180; i >= 0; i--) {
    const date = NOW - (i * DAY);
    const randomFactor = 1 + ((Math.random() - 0.5) * volatility);
    const trendFactor = 1 + (upwardTrend * (180 - i));
    
    currentValue = currentValue * randomFactor * trendFactor;
    
    history.push({
      date,
      value: Math.round(currentValue * 100) / 100,
      yield: Math.round((currentValue * 0.045 / 365) * 100) / 100
    });
  }
  
  return history;
};

// Generate mock holdings
export const mockHoldings: AssetHolding[] = [
  {
    id: '0x1',
    name: '3-Month T-Bill',
    symbol: 'TBILL3M',
    quantity: 50,
    price: 98.25,
    value: 4912.50,
    yield: 3.75,
    yieldAmount: 184.22,
    maturity: '2023-12-15',
    type: 'T-Bill',
    category: 'treasury',
    assetClass: 'TREASURY',
    acquisitionDate: NOW - (30 * DAY),
    acquisitionPrice: 97.85,
    performanceHistory: generatePerformanceHistory(97.85, 0.005, 0.0002),
    allocation: 12
  },
  {
    id: '0x2',
    name: '2-Year T-Note',
    symbol: 'TNOTE2Y',
    quantity: 120,
    price: 95.75,
    value: 11490.00,
    yield: 4.15,
    yieldAmount: 476.84,
    maturity: '2025-09-15',
    type: 'T-Note',
    category: 'treasury',
    assetClass: 'TREASURY',
    acquisitionDate: NOW - (60 * DAY),
    acquisitionPrice: 94.25,
    performanceHistory: generatePerformanceHistory(94.25, 0.008, 0.0003),
    allocation: 28
  },
  {
    id: '0x3',
    name: '10-Year T-Bond',
    symbol: 'TBOND10Y',
    quantity: 100,
    price: 92.50,
    value: 9250.00,
    yield: 4.65,
    yieldAmount: 430.13,
    maturity: '2033-09-15',
    type: 'T-Bond',
    category: 'treasury',
    assetClass: 'TREASURY',
    acquisitionDate: NOW - (90 * DAY),
    acquisitionPrice: 90.15,
    performanceHistory: generatePerformanceHistory(90.15, 0.012, 0.0004),
    allocation: 22
  },
  {
    id: '0x4',
    name: 'Skyline Tower Commercial',
    symbol: 'SKYTWR',
    quantity: 10,
    price: 500.00,
    value: 5000.00,
    yield: 7.25,
    yieldAmount: 362.50,
    type: 'Commercial Property',
    category: 'real_estate',
    assetClass: 'REAL_ESTATE',
    acquisitionDate: NOW - (120 * DAY),
    acquisitionPrice: 480.00,
    performanceHistory: generatePerformanceHistory(480.00, 0.006, 0.0004),
    allocation: 12
  },
  {
    id: '0x5f0f0e0d0c0b0a09080706050403020100000005',
    name: 'Amazon Rainforest Carbon Credits',
    symbol: 'AMZN-CC',
    quantity: 50,
    price: 24.75,
    value: 1237.50,
    type: 'Carbon Credit',
    category: 'environmental',
    assetClass: 'ENVIRONMENTAL_ASSET',
    impactMetrics: {
      carbonOffset: 50.0,
      landProtected: 3.0,
      waterSaved: 500000
    },
    certificationStandard: 'Verra',
    vintage: 2023,
    sdgAlignment: [13, 15],
    acquisitionDate: NOW - (45 * DAY),
    acquisitionPrice: 22.50,
    performanceHistory: generatePerformanceHistory(22.50, 0.018, 0.0006),
    allocation: 3
  },
  {
    id: '0x5f0f0e0d0c0b0a09080706050403020100000006',
    name: 'Blue Carbon Mangrove Credits',
    symbol: 'BLUE-C',
    quantity: 45,
    price: 18.50,
    value: 832.50,
    type: 'Biodiversity Credit',
    category: 'environmental',
    assetClass: 'ENVIRONMENTAL_ASSET',
    impactMetrics: {
      carbonOffset: 22.5,
      landProtected: 0.6,
      waterSaved: 900000
    },
    certificationStandard: 'Gold Standard',
    vintage: 2023,
    sdgAlignment: [13, 14, 15],
    acquisitionDate: NOW - (30 * DAY),
    acquisitionPrice: 17.25,
    performanceHistory: generatePerformanceHistory(17.25, 0.02, 0.0005),
    allocation: 2
  },
  {
    id: 'lcsc001',
    name: 'Taiwan Semiconductor Supply Chain Finance',
    symbol: 'TSMC-SCF',
    quantity: 5,
    price: 1000.00,
    value: 5000.00,
    yield: 8.50,
    yieldAmount: 425.00,
    maturity: '2023-12-20',
    type: 'Supply Chain Finance',
    category: 'trade_finance',
    assetClass: 'INVOICE',
    acquisitionDate: NOW - (15 * DAY),
    acquisitionPrice: 995.00,
    performanceHistory: generatePerformanceHistory(995.00, 0.004, 0.0003),
    allocation: 12,
    imageUrl: '/images/assets/supply-chain-finance/taiwan-semiconductor.jpg'
  },
  {
    id: 're-mixeduse-seattle-2023',
    name: 'Harbor District Mixed-Use Development',
    symbol: 'HDMD-2023',
    quantity: 10,
    price: 420.00,
    value: 4200.00,
    yield: 8.20,
    yieldAmount: 344.40,
    type: 'Mixed-Use Property',
    category: 'real_estate',
    assetClass: 'REAL_ESTATE',
    acquisitionDate: NOW - (10 * DAY),
    acquisitionPrice: 415.00,
    performanceHistory: generatePerformanceHistory(415.00, 0.005, 0.0004),
    allocation: 10,
    imageUrl: '/images/assets/harbor-district/mixed-use-development.jpg'
  }
];

// Generate mock transactions
export const mockTransactions: Transaction[] = [
  {
    id: 'tx1',
    type: 'buy',
    assetId: '0x1',
    assetName: '3-Month T-Bill',
    assetSymbol: 'TBILL3M',
    quantity: 50,
    price: 97.85,
    totalValue: 4892.50,
    timestamp: NOW - (30 * DAY),
    status: 'completed',
    txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  },
  {
    id: 'tx2',
    type: 'buy',
    assetId: '0x2',
    assetName: '2-Year T-Note',
    assetSymbol: 'TNOTE2Y',
    quantity: 120,
    price: 94.25,
    totalValue: 11310.00,
    timestamp: NOW - (60 * DAY),
    status: 'completed',
    txHash: '0x2345678901abcdef2345678901abcdef2345678901abcdef2345678901abcdef'
  },
  {
    id: 'tx3',
    type: 'yield',
    assetId: '0x1',
    assetName: '3-Month T-Bill',
    assetSymbol: 'TBILL3M',
    quantity: 0,
    price: 0,
    totalValue: 45.55,
    timestamp: NOW - (15 * DAY),
    status: 'completed',
    txHash: '0x3456789012abcdef3456789012abcdef3456789012abcdef3456789012abcdef'
  },
  {
    id: 'tx4',
    type: 'buy',
    assetId: '0x5f0f0e0d0c0b0a09080706050403020100000005',
    assetName: 'Amazon Rainforest Carbon Credits',
    assetSymbol: 'AMZN-CC',
    quantity: 50,
    price: 22.50,
    totalValue: 1125.00,
    timestamp: NOW - (45 * DAY),
    status: 'completed',
    txHash: '0x4567890123abcdef4567890123abcdef4567890123abcdef4567890123abcdef'
  },
  {
    id: 'tx5',
    type: 'retirement',
    assetId: '0x5f0f0e0d0c0b0a09080706050403020100000005',
    assetName: 'Amazon Rainforest Carbon Credits',
    assetSymbol: 'AMZN-CC',
    quantity: 10,
    price: 23.65,
    totalValue: 236.50,
    timestamp: NOW - (10 * DAY),
    status: 'completed',
    txHash: '0x5678901234abcdef5678901234abcdef5678901234abcdef5678901234abcdef'
  },
  {
    id: 'tx6',
    type: 'buy',
    assetId: 'lcsc001',
    assetName: 'Taiwan Semiconductor Supply Chain Finance',
    assetSymbol: 'TSMC-SCF',
    quantity: 5,
    price: 995.00,
    totalValue: 4975.00,
    timestamp: NOW - (15 * DAY),
    status: 'completed',
    txHash: '0x6789012345abcdef6789012345abcdef6789012345abcdef6789012345abcdef'
  },
  {
    id: 'tx7',
    type: 'buy',
    assetId: 're-mixeduse-seattle-2023',
    assetName: 'Harbor District Mixed-Use Development',
    assetSymbol: 'HDMD-2023',
    quantity: 10,
    price: 415.00,
    totalValue: 4150.00,
    timestamp: NOW - (10 * DAY),
    status: 'completed',
    txHash: '0x7890123456abcdef7890123456abcdef7890123456abcdef7890123456abcdef'
  }
];

// Generate mock yield distributions
export const mockYieldDistributions: YieldDistribution[] = [
  {
    id: 'yd1',
    assetId: '0x1',
    assetName: '3-Month T-Bill',
    amount: 45.55,
    yieldRate: 3.75,
    distributionDate: NOW - (15 * DAY),
    nextDistributionDate: NOW + (15 * DAY),
    frequency: 'monthly'
  },
  {
    id: 'yd2',
    assetId: '0x2',
    assetName: '2-Year T-Note',
    amount: 118.75,
    yieldRate: 4.15,
    distributionDate: NOW - (15 * DAY),
    nextDistributionDate: NOW + (75 * DAY),
    frequency: 'quarterly'
  },
  {
    id: 'yd3',
    assetId: '0x3',
    assetName: '10-Year T-Bond',
    amount: 214.57,
    yieldRate: 4.65,
    distributionDate: NOW - (15 * DAY),
    nextDistributionDate: NOW + (75 * DAY),
    frequency: 'quarterly'
  }
];

// Generate mock portfolio performance metrics
export const mockPortfolioPerformance: PortfolioPerformance = {
  totalReturn: 3865.20,
  totalReturnPercentage: 9.25,
  timeWeightedReturn: 8.75,
  annualizedReturn: 12.45,
  volatility: 3.75,
  sharpeRatio: 1.85,
  periods: {
    daily: 0.04,
    weekly: 0.35,
    monthly: 1.25,
    quarterly: 3.85,
    yearly: 12.45,
    allTime: 14.35
  }
};

// Generate mock impact metrics
export const mockImpactMetrics: ImpactMetrics = {
  totalCarbonOffset: 72.5,
  totalLandProtected: 3.6,
  totalWaterSaved: 1400000,
  biodiversityScore: 78,
  communityImpact: 85,
  sdgContributions: {
    13: 85, // Climate Action
    14: 65, // Life Below Water
    15: 80  // Life on Land
  },
  impactByProject: [
    {
      projectId: '0x5f0f0e0d0c0b0a09080706050403020100000005',
      projectName: 'Amazon Rainforest Conservation',
      carbonOffset: 50,
      landProtected: 3.0,
      waterSaved: 500000
    },
    {
      projectId: '0x5f0f0e0d0c0b0a09080706050403020100000006',
      projectName: 'Mangrove Restoration Project',
      carbonOffset: 22.5,
      landProtected: 0.6,
      waterSaved: 900000
    }
  ]
};

// Calculate total portfolio value and yield
const calculatePortfolioValue = () => {
  const totalValue = mockHoldings.reduce((sum, asset) => sum + asset.value, 0);
  const totalYield = mockHoldings.reduce((sum, asset) => sum + (asset.yieldAmount || 0), 0);
  const yieldRate = totalYield / totalValue * 100;
  
  // Calculate asset allocation percentages
  const assetAllocation: {[key: string]: number} = {};
  mockHoldings.forEach(asset => {
    assetAllocation[asset.category] = (assetAllocation[asset.category] || 0) + asset.allocation!;
  });
  
  return {
    totalValue,
    totalYield,
    yieldRate,
    assetAllocation,
    impactScore: 85,
    carbonOffset: mockImpactMetrics.totalCarbonOffset,
    performanceHistory: generatePerformanceHistory(totalValue - 3865.20, 0.01, 0.0004),
    holdings: mockHoldings
  };
};

// Complete mock portfolio summary
export const mockPortfolioSummary: PortfolioSummary = calculatePortfolioValue(); 