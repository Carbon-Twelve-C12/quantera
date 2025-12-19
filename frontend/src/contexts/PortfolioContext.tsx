import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  PortfolioSummary,
  AssetHolding,
  Transaction,
  YieldDistribution,
  PortfolioPerformance,
  ImpactMetrics
} from '../types/portfolioTypes';
import {
  mockPortfolioSummary,
  mockTransactions,
  mockYieldDistributions,
  mockPortfolioPerformance,
  mockImpactMetrics
} from '../data/mockPortfolioData';
import { useAuth } from './AuthContext';
import api from '../api/api';
import { logger } from '../utils/logger';
import { FeatureFlags, withMockFallback } from '../utils/featureFlags';

// Define the context state shape
interface PortfolioContextType {
  portfolio: PortfolioSummary | null;
  transactions: Transaction[];
  yieldDistributions: YieldDistribution[];
  performance: PortfolioPerformance | null;
  impactMetrics: ImpactMetrics | null;
  loading: boolean;
  error: string | null;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  getAssetById: (id: string) => AssetHolding | undefined;
  getTransactionsByAsset: (assetId: string) => Transaction[];
  getYieldsByAsset: (assetId: string) => YieldDistribution[];
  refreshPortfolio: () => void;
}

// Create the context
const PortfolioContext = createContext<PortfolioContextType | null>(null);

// Create the provider component
export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, walletAddress } = useAuth();
  
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [yieldDistributions, setYieldDistributions] = useState<YieldDistribution[]>([]);
  const [performance, setPerformance] = useState<PortfolioPerformance | null>(null);
  const [impactMetrics, setImpactMetrics] = useState<ImpactMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Function to refresh portfolio data (defined BEFORE useEffect)
  const refreshPortfolio = useCallback(async () => {
    if (!walletAddress) {
      // No wallet connected, clear data
      setPortfolio(null);
      setTransactions([]);
      setYieldDistributions([]);
      setPerformance(null);
      setImpactMetrics(null);
      setLoading(false);
      return;
    }

    // Check if feature is enabled
    if (!FeatureFlags.isEnabled('PORTFOLIO')) {
      logger.debug('Portfolio feature is disabled');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logger.debug('Fetching portfolio data', { walletAddress });

      // Fetch all portfolio data with mock fallback
      const [portfolioData, txData, yieldData, perfData, impactData] = await Promise.all([
        withMockFallback(
          'portfolio',
          async () => {
            const response = await api.get(`/api/v1/portfolio/${walletAddress}`);
            return response.data;
          },
          () => mockPortfolioSummary
        ),
        withMockFallback(
          'portfolio',
          async () => {
            const response = await api.get(`/api/v1/portfolio/${walletAddress}/transactions`);
            return response.data.transactions || [];
          },
          () => mockTransactions
        ),
        withMockFallback(
          'portfolio',
          async () => {
            const response = await api.get(`/api/v1/portfolio/${walletAddress}/yield`);
            return response.data.yield_distributions || [];
          },
          () => mockYieldDistributions
        ),
        withMockFallback(
          'portfolio',
          async () => {
            const response = await api.get(`/api/v1/portfolio/${walletAddress}/performance`);
            return response.data;
          },
          () => mockPortfolioPerformance
        ),
        withMockFallback(
          'portfolio',
          async () => {
            const response = await api.get(`/api/v1/portfolio/${walletAddress}/impact`);
            return response.data;
          },
          () => mockImpactMetrics
        )
      ]);

      setPortfolio(portfolioData);
      setTransactions(txData);
      setYieldDistributions(yieldData);
      setPerformance(perfData);
      setImpactMetrics(impactData);

      logger.info('Portfolio data loaded', {
        holdingsCount: portfolioData?.holdings?.length || 0,
        transactionsCount: txData.length
      });

      setLoading(false);
    } catch (err) {
      const errorMessage = 'Failed to load portfolio data';
      logger.error(errorMessage, err instanceof Error ? err : new Error(String(err)), { walletAddress });
      setError(errorMessage);
      setLoading(false);
    }
  }, [walletAddress]);

  // Load portfolio data when wallet address changes
  useEffect(() => {
    refreshPortfolio();
  }, [refreshPortfolio, walletAddress]);

  // Helper to get a specific asset by ID
  const getAssetById = (id: string) => {
    return portfolio?.holdings.find(asset => asset.id === id);
  };

  // Helper to get transactions for a specific asset
  const getTransactionsByAsset = (assetId: string) => {
    return transactions.filter(tx => tx.assetId === assetId);
  };

  // Helper to get yields for a specific asset
  const getYieldsByAsset = (assetId: string) => {
    return yieldDistributions.filter(yd => yd.assetId === assetId);
  };

  // Context value
  const value = {
    portfolio,
    transactions,
    yieldDistributions,
    performance,
    impactMetrics,
    loading,
    error,
    activeFilter,
    setActiveFilter,
    getAssetById,
    getTransactionsByAsset,
    getYieldsByAsset,
    refreshPortfolio
  };

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
};

// Custom hook to use the portfolio context
export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (context === null) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};

export default PortfolioContext; 