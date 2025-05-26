/**
 * Application configuration
 */

// WalletKit configuration
export const WALLET_CONFIG = {
  projectId: 'quantera-platform', // Replace with your actual Reown project ID in production
  appName: 'Quantera',
  appDescription: 'Tokenized Financial Products',
  appUrl: 'https://quantera.finance',
  appIcon: 'https://quantera.finance/logo.png'
};

// Supported chains
export const SUPPORTED_CHAINS = {
  ETHEREUM: 'eip155:1',
  OPTIMISM: 'eip155:10',
  ARBITRUM: 'eip155:42161',
}; 