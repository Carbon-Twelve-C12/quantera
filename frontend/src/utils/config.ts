/**
 * Application configuration
 *
 * SINGLE SOURCE OF TRUTH for all configuration values.
 * All other modules should import from this file.
 */

// =============================================================================
// API Configuration - Single source of truth
// =============================================================================

/**
 * Validate and return the API base URL
 * Enforces HTTPS in production for security
 */
const getApiBaseUrl = (): string => {
  const apiUrl = process.env.REACT_APP_API_URL;

  // In production, require explicit configuration
  if (process.env.NODE_ENV === 'production') {
    if (!apiUrl) {
      throw new Error(
        'CONFIGURATION ERROR: REACT_APP_API_URL environment variable is required in production.'
      );
    }
    if (!apiUrl.startsWith('https://')) {
      throw new Error(
        'SECURITY ERROR: REACT_APP_API_URL must use HTTPS in production.'
      );
    }
  }

  // Default to localhost for development
  return apiUrl || 'http://localhost:3001';
};

export const API_CONFIG = {
  /** Base URL for all API requests */
  baseUrl: getApiBaseUrl(),

  /** Request timeout in milliseconds */
  timeout: 30000,

  /** API version prefix */
  version: 'v1',

  /** Full API URL with version */
  get fullUrl(): string {
    return `${this.baseUrl}/api/${this.version}`;
  },
};

// =============================================================================
// WalletKit Configuration
// =============================================================================

export const WALLET_CONFIG = {
  projectId: process.env.REACT_APP_WALLETKIT_PROJECT_ID || 'quantera-platform',
  appName: 'Quantera',
  appDescription: 'Tokenized Financial Products',
  appUrl: 'https://quantera.finance',
  appIcon: 'https://quantera.finance/logo.png',
};

// =============================================================================
// Supported Blockchain Networks
// =============================================================================

export const SUPPORTED_CHAINS = {
  ETHEREUM: 'eip155:1',
  OPTIMISM: 'eip155:10',
  ARBITRUM: 'eip155:42161',
};

// =============================================================================
// Feature Flags
// =============================================================================

export const FEATURE_FLAGS = {
  TRADE_FINANCE: process.env.REACT_APP_FF_TRADE_FINANCE === 'true',
  RISK_DASHBOARD: process.env.REACT_APP_FF_RISK_DASHBOARD === 'true',
  ENVIRONMENTAL_ASSETS: process.env.REACT_APP_FF_ENVIRONMENTAL_ASSETS === 'true',
  USE_MOCKS: process.env.REACT_APP_USE_MOCKS === 'true' && process.env.NODE_ENV !== 'production',
};

// =============================================================================
// Environment Detection
// =============================================================================

export const ENV = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
}; 