import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PlatformMetrics } from '../types/analyticsTypes';
import { mockPlatformMetrics } from '../data/mockAnalyticsData';

interface AnalyticsContextType {
  platformMetrics: PlatformMetrics | null;
  loading: boolean;
  error: string | null;
  refreshAnalytics: () => void;
  timeframe: string;
  setTimeframe: (timeframe: string) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const [platformMetrics, setPlatformMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string>('30d');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In production, this would be an API call
      // const response = await fetch('/api/analytics/platform?timeframe=' + timeframe);
      // const data = await response.json();
      
      // Using mock data for development
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
      setPlatformMetrics(mockPlatformMetrics);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalytics = () => {
    fetchAnalytics();
  };

  // Initial data fetch
  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const value = {
    platformMetrics,
    loading,
    error,
    refreshAnalytics,
    timeframe,
    setTimeframe
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  
  return context;
}; 