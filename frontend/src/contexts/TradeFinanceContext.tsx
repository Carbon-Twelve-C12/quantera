import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { tradeFinanceClient } from '../api/tradeFinance/tradeFinanceClient';
import { 
  TradeFinanceAsset, 
  TradeFinancePosition, 
  TradeFinanceAnalytics,
  TradeFinanceAssetType
} from '../types/tradeFinance';

// TODO: Replace with real API call
// const fetchTradeFinanceAssets = async () => {
//   const response = await api.getTradeFinanceAssets();
//   return response.data;
// };

// Temporary mock data - will be replaced with API integration
const mockTradeFinanceAssets: TradeFinanceAsset[] = [
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
  }
];

interface TradeFinanceContextValue {
  assets: TradeFinanceAsset[];
  positions: TradeFinancePosition[];
  analytics: TradeFinanceAnalytics | null;
  loading: boolean;
  error: string | null;
  filteredAssets: TradeFinanceAsset[];
  selectedAssetType: TradeFinanceAssetType | null;
  refreshData: () => Promise<void>;
  setSelectedAssetType: (type: TradeFinanceAssetType | null) => void;
  getAssetById: (id: string) => TradeFinanceAsset | undefined;
  purchaseAsset: (assetId: string, userAddress: string, units: number) => Promise<boolean>;
}

const TradeFinanceContext = createContext<TradeFinanceContextValue | undefined>(undefined);

export const useTradeFinance = (): TradeFinanceContextValue => {
  const context = useContext(TradeFinanceContext);
  if (context === undefined) {
    throw new Error('useTradeFinance must be used within a TradeFinanceProvider');
  }
  return context;
};

interface TradeFinanceProviderProps {
  children: ReactNode;
  userAddress?: string;
}

export const TradeFinanceProvider: React.FC<TradeFinanceProviderProps> = ({ 
  children,
  userAddress = '0x1234567890123456789012345678901234567890' // Default address for development
}) => {
  const [assets, setAssets] = useState<TradeFinanceAsset[]>([]);
  const [positions, setPositions] = useState<TradeFinancePosition[]>([]);
  const [analytics, setAnalytics] = useState<TradeFinanceAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssetType, setSelectedAssetType] = useState<TradeFinanceAssetType | null>(null);

  const filteredAssets = selectedAssetType 
    ? assets.filter(asset => asset.assetType === selectedAssetType)
    : assets;

  const refreshData = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const [assetsData, positionsData, analyticsData] = await Promise.all([
        tradeFinanceClient.getTradeFinanceAssets(),
        tradeFinanceClient.getUserTradeFinancePositions(userAddress),
        tradeFinanceClient.getTradeFinanceAnalytics()
      ]);

      setAssets(assetsData);
      setPositions(positionsData);
      setAnalytics(analyticsData);
    } catch (err) {
      setError('Failed to load trade finance data');
      console.error('TradeFinance data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [userAddress]);

  const getAssetById = (id: string): TradeFinanceAsset | undefined => {
    return assets.find(asset => asset.id === id);
  };

  const purchaseAsset = async (
    assetId: string, 
    userAddress: string, 
    units: number
  ): Promise<boolean> => {
    try {
      const result = await tradeFinanceClient.purchaseTradeFinanceAsset(
        assetId,
        userAddress,
        units
      );
      
      if (result.success) {
        await refreshData(); // Refresh data after successful purchase
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error purchasing asset:', err);
      setError('Failed to purchase asset');
      return false;
    }
  };

  const value = {
    assets,
    positions,
    analytics,
    loading,
    error,
    filteredAssets,
    selectedAssetType,
    refreshData,
    setSelectedAssetType,
    getAssetById,
    purchaseAsset
  };

  return (
    <TradeFinanceContext.Provider value={value}>
      {children}
    </TradeFinanceContext.Provider>
  );
};

export default TradeFinanceProvider; 