import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { tradeFinanceClient } from '../api/tradeFinance/tradeFinanceClient';
import { 
  TradeFinanceAsset, 
  TradeFinancePosition, 
  TradeFinanceAnalytics,
  TradeFinanceAssetType
} from '../types/tradeFinance';

interface TradeFinanceContextType {
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

const TradeFinanceContext = createContext<TradeFinanceContextType | undefined>(undefined);

export const useTradeFinance = (): TradeFinanceContextType => {
  const context = useContext(TradeFinanceContext);
  if (!context) {
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