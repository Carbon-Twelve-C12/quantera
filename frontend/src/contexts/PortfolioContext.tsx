import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const auth = useAuth();
  // Using type assertion since currentUser exists in implementation but not in TypeScript definition
  const currentUser = (auth as any).currentUser;
  
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [yieldDistributions, setYieldDistributions] = useState<YieldDistribution[]>([]);
  const [performance, setPerformance] = useState<PortfolioPerformance | null>(null);
  const [impactMetrics, setImpactMetrics] = useState<ImpactMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Load portfolio data when user changes
  useEffect(() => {
    if (currentUser) {
      refreshPortfolio();
    } else {
      // Clear data if user is not logged in
      setPortfolio(null);
      setTransactions([]);
      setYieldDistributions([]);
      setPerformance(null);
      setImpactMetrics(null);
    }
  }, [currentUser]);

  // Function to refresh portfolio data
  const refreshPortfolio = () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, these would be API calls
      // For now, we use mock data
      setTimeout(() => {
        setPortfolio(mockPortfolioSummary);
        setTransactions(mockTransactions);
        setYieldDistributions(mockYieldDistributions);
        setPerformance(mockPortfolioPerformance);
        setImpactMetrics(mockImpactMetrics);
        setLoading(false);
      }, 500); // Simulate API delay
    } catch (err) {
      setError('Failed to load portfolio data');
      setLoading(false);
    }
  };

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