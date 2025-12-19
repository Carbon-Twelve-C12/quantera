import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { PlatformMetrics } from '../types/analyticsTypes';
import { mockPlatformMetrics } from '../data/mockAnalyticsData';
import { logger } from '../utils/logger';
import { FeatureFlags, withMockFallback } from '../utils/featureFlags';
import api from '../api/api';

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

  const fetchAnalytics = useCallback(async () => {
    // Check if feature is enabled
    if (!FeatureFlags.isEnabled('ANALYTICS')) {
      logger.debug('Analytics feature is disabled');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logger.debug('Fetching analytics data', { timeframe });

      const data = await withMockFallback(
        'analytics',
        async () => {
          const response = await api.get(`/api/v1/analytics/platform?timeframe=${timeframe}`);
          return response.data;
        },
        () => mockPlatformMetrics
      );

      setPlatformMetrics(data);
      logger.info('Analytics data loaded', { timeframe });
    } catch (err) {
      const errorMessage = 'Failed to load analytics data. Please try again later.';
      logger.error(errorMessage, err instanceof Error ? err : new Error(String(err)));
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  const refreshAnalytics = useCallback(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Initial data fetch
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

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