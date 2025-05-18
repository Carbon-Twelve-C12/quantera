import { 
  TradeFinanceAsset, 
  TradeFinancePosition, 
  TradeFinanceAnalytics,
  TradeFinanceAssetType,
  SettlementCurrency
} from '../../types/tradeFinance';

// Sample mock data for trade finance assets
const MOCK_ASSETS: TradeFinanceAsset[] = [
  {
    id: 'tf-001',
    name: 'Taiwan Semiconductor Supply Chain Finance',
    description: 'Supply chain financing for semiconductor component manufacturer in Taiwan with multinational technology company buyers.',
    assetType: TradeFinanceAssetType.SUPPLY_CHAIN_FINANCE,
    issuer: 'Global Trade Finance Partners',
    recipient: 'Taiwan Advanced Semiconductor Manufacturing',
    imageUrl: '/images/assets/supply-chain-finance/taiwan-semiconductor.jpg',
    yieldRate: 595, // 5.95%
    maturityDate: Math.floor(Date.now() / 1000) + (180 * 86400), // 180 days from now
    currentPrice: '95.50',
    nominalValue: 100000,
    currency: 'USD',
    fractionalUnits: 1000,
    status: 'Active',
    riskRating: 3,
    minimumInvestment: 1000,
    settlementCurrency: 'USDC'
  },
  {
    id: 'tf-002',
    name: 'German Auto Parts Export Finance',
    description: 'Export financing for German automotive parts manufacturer shipping to international markets.',
    assetType: TradeFinanceAssetType.EXPORT_FINANCING,
    issuer: 'European Trade Bank',
    recipient: 'German Precision Auto Parts GmbH',
    imageUrl: '/images/assets/supply-chain-finance/auto-parts.jpg',
    yieldRate: 475, // 4.75%
    maturityDate: Math.floor(Date.now() / 1000) + (90 * 86400), // 90 days from now
    currentPrice: '97.25',
    nominalValue: 200000,
    currency: 'EUR',
    fractionalUnits: 2000,
    status: 'Active',
    riskRating: 2,
    minimumInvestment: 500,
    settlementCurrency: 'USDC'
  },
  {
    id: 'tf-003',
    name: 'Brazilian Coffee Harvest Inventory Finance',
    description: 'Pre-export inventory financing for premium coffee producers in Brazil.',
    assetType: TradeFinanceAssetType.INVENTORY_FINANCING,
    issuer: 'South American Trade Solutions',
    recipient: 'Brazilian Coffee Exporters Association',
    imageUrl: '/images/assets/supply-chain-finance/coffee-inventory.jpg',
    yieldRate: 650, // 6.50%
    maturityDate: Math.floor(Date.now() / 1000) + (120 * 86400), // 120 days from now
    currentPrice: '94.75',
    nominalValue: 150000,
    currency: 'USD',
    fractionalUnits: 1500,
    status: 'Active',
    riskRating: 4,
    minimumInvestment: 750,
    settlementCurrency: 'USDC'
  },
  {
    id: 'tf-004',
    name: 'Japanese Electronics Import Financing',
    description: 'Import financing for electronics distributor sourcing components from Japan.',
    assetType: TradeFinanceAssetType.IMPORT_FINANCING,
    issuer: 'Asia-Pacific Trade Bank',
    recipient: 'US Electronics Distributor Inc.',
    imageUrl: '/images/assets/supply-chain-finance/electronics-import.jpg',
    yieldRate: 525, // 5.25%
    maturityDate: Math.floor(Date.now() / 1000) + (60 * 86400), // 60 days from now
    currentPrice: '96.80',
    nominalValue: 180000,
    currency: 'USD',
    fractionalUnits: 1800,
    status: 'Active',
    riskRating: 2,
    minimumInvestment: 1000,
    settlementCurrency: 'USDC'
  }
];

// Sample positions data
const MOCK_POSITIONS: TradeFinancePosition[] = [
  {
    assetId: 'tf-001',
    ownerAddress: '0x1234567890123456789012345678901234567890',
    unitsOwned: 5,
    investmentAmount: 5000,
    acquisitionDate: new Date(),
    expectedReturn: 5297.50,
    expectedMaturityDate: new Date(Date.now() + 180 * 86400 * 1000)
  }
];

// Implementation using Promise-based API design
class TradeFinanceClient {
  // Fetch all trade finance assets
  public async getTradeFinanceAssets(): Promise<TradeFinanceAsset[]> {
    // TODO: Replace with actual API call
    // This is a mock implementation
    return Promise.resolve(MOCK_ASSETS);
  }
  
  // Get trade finance asset by ID
  public async getTradeFinanceAssetById(id: string): Promise<TradeFinanceAsset | null> {
    // TODO: Replace with actual API call
    const asset = MOCK_ASSETS.find(a => a.id === id);
    return Promise.resolve(asset || null);
  }
  
  // Get user positions (assets owned)
  public async getUserTradeFinancePositions(
    userAddress: string
  ): Promise<TradeFinancePosition[]> {
    // TODO: Replace with actual API call
    const positions = MOCK_POSITIONS.filter(p => p.ownerAddress === userAddress);
    return Promise.resolve(positions);
  }
  
  // Purchase a trade finance asset
  public async purchaseTradeFinanceAsset(
    assetId: string,
    userAddress: string,
    units: number
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    // TODO: Replace with actual API call
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Hardcoded success for mock
    return Promise.resolve({
      success: true,
      transactionHash: `0x${Array(64).fill(0).map(() => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`
    });
  }
  
  // Get trade finance analytics
  public async getTradeFinanceAnalytics(): Promise<TradeFinanceAnalytics> {
    // TODO: Replace with actual API call
    return Promise.resolve({
      totalVolume: 1360000,
      activeAssets: 7,
      averageYield: 5.66,
      averageMaturity: 90,
      assetTypeDistribution: [
        {
          type: TradeFinanceAssetType.SUPPLY_CHAIN_FINANCE,
          count: 2,
          percentage: 29.8
        },
        {
          type: TradeFinanceAssetType.EXPORT_FINANCING,
          count: 2,
          percentage: 25.7
        },
        {
          type: TradeFinanceAssetType.INVENTORY_FINANCING,
          count: 1,
          percentage: 18.4
        },
        {
          type: TradeFinanceAssetType.IMPORT_FINANCING,
          count: 1,
          percentage: 26.1
        }
      ],
      countryDistribution: [
        {
          country: 'Taiwan',
          count: 2,
          percentage: 30.5
        },
        {
          country: 'Germany',
          count: 1,
          percentage: 25.2
        },
        {
          country: 'Brazil',
          count: 1,
          percentage: 15.8
        },
        {
          country: 'Japan',
          count: 1,
          percentage: 28.5
        }
      ]
    });
  }
}

export const tradeFinanceClient = new TradeFinanceClient(); 