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
  const { walletAddress, isAuthenticated } = useAuth();

  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [yieldDistributions, setYieldDistributions] = useState<YieldDistribution[]>([]);
  const [performance, setPerformance] = useState<PortfolioPerformance | null>(null);
  const [impactMetrics, setImpactMetrics] = useState<ImpactMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Function to refresh portfolio data - defined BEFORE useEffect
  const refreshPortfolio = useCallback(async () => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try backend API first
      console.log('Fetching portfolio from backend for:', walletAddress);
      const portfolioResponse = await api.get(`/api/v1/portfolio/${walletAddress}`);
      setPortfolio(portfolioResponse.data);

      // Fetch transactions
      const txResponse = await api.get(`/api/v1/portfolio/${walletAddress}/transactions`);
      setTransactions(txResponse.data.transactions || []);

      // Fetch yield distributions
      const yieldResponse = await api.get(`/api/v1/portfolio/${walletAddress}/yield`);
      setYieldDistributions(yieldResponse.data.yield_distributions || []);

      // Fetch performance
      const perfResponse = await api.get(`/api/v1/portfolio/${walletAddress}/performance`);
      setPerformance(perfResponse.data);

      // Fetch impact metrics
      const impactResponse = await api.get(`/api/v1/portfolio/${walletAddress}/impact`);
      setImpactMetrics(impactResponse.data);

      console.log('Portfolio loaded from backend successfully');
    } catch (err) {
      // Fall back to mock data if backend unavailable
      console.warn('Backend unavailable, using mock data:', err);
      setPortfolio(mockPortfolioSummary);
      setTransactions(mockTransactions);
      setYieldDistributions(mockYieldDistributions);
      setPerformance(mockPortfolioPerformance);
      setImpactMetrics(mockImpactMetrics);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  // Load portfolio data when wallet changes
  useEffect(() => {
    if (isAuthenticated && walletAddress) {
      refreshPortfolio();
    } else {
      // Clear data if user is not logged in
      setPortfolio(null);
      setTransactions([]);
      setYieldDistributions([]);
      setPerformance(null);
      setImpactMetrics(null);
      setLoading(false);
    }
  }, [isAuthenticated, walletAddress, refreshPortfolio]);

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