/**
 * Feature Flags System
 *
 * Centralized feature flag management for controlling feature availability,
 * mock data fallback, and gradual rollout of new features.
 *
 * USAGE:
 *   import { FeatureFlags, shouldUseMockData } from './featureFlags';
 *
 *   if (FeatureFlags.isEnabled('TRADE_FINANCE')) {
 *     // Feature is enabled
 *   }
 *
 *   const data = shouldUseMockData('portfolio')
 *     ? getMockPortfolio()
 *     : await fetchPortfolio();
 */

import { logger } from './logger';

// =============================================================================
// Feature Flag Definitions
// =============================================================================

/**
 * All available feature flags
 */
export type FeatureFlagName =
  | 'TRADE_FINANCE'
  | 'RISK_DASHBOARD'
  | 'ENVIRONMENTAL_ASSETS'
  | 'YIELD_STRATEGIES'
  | 'LIQUIDITY_POOLS'
  | 'SMART_ACCOUNTS'
  | 'ANALYTICS'
  | 'L2_BRIDGE'
  | 'PORTFOLIO'
  | 'MARKETPLACE';

/**
 * API service names for mock fallback control
 */
export type ApiServiceName =
  | 'portfolio'
  | 'tradeFinance'
  | 'yieldStrategy'
  | 'riskService'
  | 'environmental'
  | 'analytics'
  | 'liquidity'
  | 'treasury'
  | 'marketplace';

// =============================================================================
// Environment Detection
// =============================================================================

const ENV = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

// =============================================================================
// Feature Flag Configuration
// =============================================================================

interface FeatureFlagConfig {
  /** Whether the feature is enabled */
  enabled: boolean;
  /** Whether to fall back to mock data if API fails */
  mockFallback: boolean;
  /** Description for logging/debugging */
  description: string;
}

/**
 * Load feature flag from environment variable
 */
const loadFlag = (envVar: string, defaultValue: boolean = false): boolean => {
  const value = process.env[envVar];
  if (value === undefined) return defaultValue;
  return value === 'true';
};

/**
 * Feature flag configurations loaded from environment
 */
const featureFlagConfigs: Record<FeatureFlagName, FeatureFlagConfig> = {
  TRADE_FINANCE: {
    enabled: loadFlag('REACT_APP_FF_TRADE_FINANCE', true),
    mockFallback: !ENV.isProduction,
    description: 'Trade finance asset marketplace',
  },
  RISK_DASHBOARD: {
    enabled: loadFlag('REACT_APP_FF_RISK_DASHBOARD', true),
    mockFallback: !ENV.isProduction,
    description: 'Portfolio risk analysis dashboard',
  },
  ENVIRONMENTAL_ASSETS: {
    enabled: loadFlag('REACT_APP_FF_ENVIRONMENTAL_ASSETS', true),
    mockFallback: !ENV.isProduction,
    description: 'Carbon credits and environmental assets',
  },
  YIELD_STRATEGIES: {
    enabled: loadFlag('REACT_APP_FF_YIELD_STRATEGIES', true),
    mockFallback: !ENV.isProduction,
    description: 'Automated yield optimization strategies',
  },
  LIQUIDITY_POOLS: {
    enabled: loadFlag('REACT_APP_FF_LIQUIDITY_POOLS', true),
    mockFallback: !ENV.isProduction,
    description: 'AMM liquidity pool functionality',
  },
  SMART_ACCOUNTS: {
    enabled: loadFlag('REACT_APP_FF_SMART_ACCOUNTS', true),
    mockFallback: !ENV.isProduction,
    description: 'Smart account management',
  },
  ANALYTICS: {
    enabled: loadFlag('REACT_APP_FF_ANALYTICS', true),
    mockFallback: !ENV.isProduction,
    description: 'Platform analytics and metrics',
  },
  L2_BRIDGE: {
    enabled: loadFlag('REACT_APP_FF_L2_BRIDGE', true),
    mockFallback: !ENV.isProduction,
    description: 'Layer 2 bridging functionality',
  },
  PORTFOLIO: {
    enabled: loadFlag('REACT_APP_FF_PORTFOLIO', true),
    mockFallback: !ENV.isProduction,
    description: 'Portfolio management features',
  },
  MARKETPLACE: {
    enabled: loadFlag('REACT_APP_FF_MARKETPLACE', true),
    mockFallback: !ENV.isProduction,
    description: 'Asset marketplace and trading',
  },
};

/**
 * Mapping of API services to their controlling feature flags
 */
const serviceToFeatureMap: Record<ApiServiceName, FeatureFlagName> = {
  portfolio: 'PORTFOLIO',
  tradeFinance: 'TRADE_FINANCE',
  yieldStrategy: 'YIELD_STRATEGIES',
  riskService: 'RISK_DASHBOARD',
  environmental: 'ENVIRONMENTAL_ASSETS',
  analytics: 'ANALYTICS',
  liquidity: 'LIQUIDITY_POOLS',
  treasury: 'MARKETPLACE',
  marketplace: 'MARKETPLACE',
};

// =============================================================================
// Feature Flags API
// =============================================================================

export const FeatureFlags = {
  /**
   * Check if a feature is enabled
   */
  isEnabled(feature: FeatureFlagName): boolean {
    const config = featureFlagConfigs[feature];
    return config?.enabled ?? false;
  },

  /**
   * Check if a feature allows mock fallback
   */
  allowsMockFallback(feature: FeatureFlagName): boolean {
    const config = featureFlagConfigs[feature];
    return config?.mockFallback ?? false;
  },

  /**
   * Get all enabled features (for debugging)
   */
  getEnabledFeatures(): FeatureFlagName[] {
    return (Object.keys(featureFlagConfigs) as FeatureFlagName[]).filter(
      (flag) => featureFlagConfigs[flag].enabled
    );
  },

  /**
   * Get feature configuration (for debugging)
   */
  getConfig(feature: FeatureFlagName): FeatureFlagConfig | undefined {
    return featureFlagConfigs[feature];
  },

  /**
   * Log all feature flag states (for debugging)
   */
  logFeatureStates(): void {
    logger.info('Feature flag states', {
      environment: process.env.NODE_ENV,
      flags: Object.entries(featureFlagConfigs).map(([name, config]) => ({
        name,
        enabled: config.enabled,
        mockFallback: config.mockFallback,
      })),
    });
  },
};

// =============================================================================
// Mock Data Fallback Control
// =============================================================================

/**
 * Track API failures to determine when to use mock data
 */
const apiFailureCount: Record<ApiServiceName, number> = {
  portfolio: 0,
  tradeFinance: 0,
  yieldStrategy: 0,
  riskService: 0,
  environmental: 0,
  analytics: 0,
  liquidity: 0,
  treasury: 0,
  marketplace: 0,
};

/** Maximum failures before forcing mock fallback */
const MAX_FAILURES_BEFORE_MOCK = 3;

/** Reset failure counts after this many ms */
const FAILURE_RESET_MS = 60000; // 1 minute

// Reset failure counts periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    Object.keys(apiFailureCount).forEach((key) => {
      apiFailureCount[key as ApiServiceName] = 0;
    });
  }, FAILURE_RESET_MS);
}

/**
 * Record an API failure for a service
 */
export function recordApiFailure(service: ApiServiceName): void {
  apiFailureCount[service] = (apiFailureCount[service] || 0) + 1;
  logger.warn(`API failure recorded for ${service}`, {
    service,
    failureCount: apiFailureCount[service],
    willUseMock: apiFailureCount[service] >= MAX_FAILURES_BEFORE_MOCK,
  });
}

/**
 * Record an API success for a service (resets failure count)
 */
export function recordApiSuccess(service: ApiServiceName): void {
  if (apiFailureCount[service] > 0) {
    apiFailureCount[service] = 0;
    logger.debug(`API success recorded for ${service}, failure count reset`);
  }
}

/**
 * Determine if mock data should be used for a service
 *
 * Returns true if:
 * - Global mock mode is enabled (dev only)
 * - Feature allows mock fallback AND API has failed too many times
 * - Environment is test
 */
export function shouldUseMockData(service: ApiServiceName): boolean {
  // Always use mocks in test environment
  if (ENV.isTest) {
    return true;
  }

  // Check global mock override (only in development)
  const globalMockMode =
    process.env.REACT_APP_USE_MOCKS === 'true' && ENV.isDevelopment;
  if (globalMockMode) {
    return true;
  }

  // Never use mocks in production unless explicitly configured per-service
  if (ENV.isProduction) {
    return false;
  }

  // Check if feature allows mock fallback
  const featureFlag = serviceToFeatureMap[service];
  if (!FeatureFlags.allowsMockFallback(featureFlag)) {
    return false;
  }

  // Check if API has failed too many times
  return apiFailureCount[service] >= MAX_FAILURES_BEFORE_MOCK;
}

/**
 * Wrap an async API call with mock fallback
 *
 * USAGE:
 *   const data = await withMockFallback(
 *     'portfolio',
 *     () => api.getPortfolio(walletAddress),
 *     () => getMockPortfolio()
 *   );
 */
export async function withMockFallback<T>(
  service: ApiServiceName,
  apiCall: () => Promise<T>,
  getMockData: () => T,
  options: { silent?: boolean } = {}
): Promise<T> {
  // Check if we should use mock data preemptively
  if (shouldUseMockData(service)) {
    if (!options.silent) {
      logger.debug(`Using mock data for ${service} (mock mode enabled)`);
    }
    return getMockData();
  }

  try {
    const result = await apiCall();
    recordApiSuccess(service);
    return result;
  } catch (error) {
    recordApiFailure(service);

    // Check if we can fall back to mock data
    const featureFlag = serviceToFeatureMap[service];
    if (FeatureFlags.allowsMockFallback(featureFlag)) {
      if (!options.silent) {
        logger.warn(`API call failed for ${service}, using mock fallback`, {
          service,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      return getMockData();
    }

    // No fallback allowed, rethrow
    throw error;
  }
}

// =============================================================================
// Feature Gate Component Helper
// =============================================================================

/**
 * Check if a feature should be visible to users
 * Combines feature flag check with any additional conditions
 */
export function isFeatureVisible(
  feature: FeatureFlagName,
  additionalConditions: boolean = true
): boolean {
  return FeatureFlags.isEnabled(feature) && additionalConditions;
}

// =============================================================================
// Debug Utilities
// =============================================================================

// Log feature flags on startup in development
if (ENV.isDevelopment && typeof window !== 'undefined') {
  // Use setTimeout to ensure logger is initialized
  setTimeout(() => {
    FeatureFlags.logFeatureStates();
  }, 0);
}

export default FeatureFlags;
