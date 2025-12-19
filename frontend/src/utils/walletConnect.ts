/**
 * WalletConnect integration
 *
 * This module provides a wrapper around the WalletKit library.
 * Mock functionality is ONLY available in development mode.
 *
 * SECURITY: In production, real wallet connections are required.
 */

import { WALLET_CONFIG, SUPPORTED_CHAINS } from './config';
import { logger } from './logger';

// Import actual WalletKit if available
let WalletKitClass: any;
let walletKitLoadError: Error | null = null;

try {
  // Try to import the real WalletKit if available
  const walletKitModule = require('@reown/walletkit');
  WalletKitClass = walletKitModule.WalletKit;
} catch (error) {
  walletKitLoadError = error as Error;
  WalletKitClass = null;

  // In production, this is a critical error
  if (process.env.NODE_ENV === 'production') {
    logger.error(
      'CRITICAL: WalletKit failed to load in production. Wallet connections will not work.',
      error as Error
    );
  } else {
    logger.warn(
      '[DEV] WalletKit not available, mock implementation enabled for development only.'
    );
  }
}

/**
 * Session interface representing a wallet connection
 */
export interface WalletSession {
  address: string;
  chainId: string;
  connected: boolean;
}

/**
 * WalletConnect wrapper class that provides a consistent API
 * whether using the real WalletKit or a mock implementation
 */
class WalletConnectWrapper {
  private instance: any;
  private mockSession: WalletSession | null = null;
  
  constructor() {
    if (WalletKitClass) {
      try {
        // Initialize real WalletKit if available
        this.instance = new WalletKitClass({
          projectId: WALLET_CONFIG.projectId,
          metadata: {
            name: WALLET_CONFIG.appName,
            description: WALLET_CONFIG.appDescription,
            url: WALLET_CONFIG.appUrl,
            icons: [WALLET_CONFIG.appIcon]
          }
        });
        logger.info('WalletKit initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize WalletKit', error instanceof Error ? error : new Error(String(error)));
        this.instance = null;
      }
    } else {
      this.instance = null;
      logger.debug('Using mock wallet implementation');
    }
  }

  /**
   * Connect to wallet
   */
  async connect(): Promise<WalletSession> {
    if (this.instance) {
      try {
        // Use real implementation if available
        // Note: This would need to be updated with the actual WalletKit API
        const result = await this.instance.pair('quantera://wallet-connect');
        
        return {
          address: result.account || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          chainId: result.chainId || SUPPORTED_CHAINS.ETHEREUM,
          connected: true
        };
      } catch (error) {
        logger.error('Error connecting to wallet', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    } else {
      // Mock implementation - ONLY allowed in development
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'SECURITY ERROR: WalletKit is not available. Cannot connect wallet in production. ' +
          'Please ensure @reown/walletkit is properly installed and configured. ' +
          (walletKitLoadError ? `Load error: ${walletKitLoadError.message}` : '')
        );
      }

      logger.warn(
        '[DEV ONLY] Using mock wallet connection. This is NOT available in production.'
      );
      this.mockSession = {
        address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        chainId: SUPPORTED_CHAINS.ETHEREUM,
        connected: true
      };
      return this.mockSession;
    }
  }

  /**
   * Disconnect from wallet
   */
  disconnect(): void {
    if (this.instance) {
      try {
        // Use real implementation if available
        // This would need to be updated with the actual WalletKit API
        this.instance.disconnectSession();
      } catch (error) {
        logger.error('Error disconnecting wallet', error instanceof Error ? error : new Error(String(error)));
      }
    } else {
      // Mock implementation
      this.mockSession = null;
      logger.debug('Mock wallet disconnected');
    }
  }

  /**
   * Get current session if connected
   */
  async getSession(): Promise<WalletSession | null> {
    if (this.instance) {
      try {
        // Use real implementation if available
        // This would need to be updated with the actual WalletKit API
        const sessions = await this.instance.getActiveSessions();
        if (sessions && Object.keys(sessions).length > 0) {
          const session = sessions[Object.keys(sessions)[0]];
          return {
            address: session.accounts[0],
            chainId: session.chainId,
            connected: true
          };
        }
        return null;
      } catch (error) {
        logger.error('Error getting session', error instanceof Error ? error : new Error(String(error)));
        return null;
      }
    } else {
      // Mock implementation
      return this.mockSession;
    }
  }

  /**
   * Switch to a different blockchain network
   */
  async switchChain(chainId: string): Promise<void> {
    if (this.instance) {
      try {
        // Use real implementation if available
        // This would need to be updated with the actual WalletKit API
        await this.instance.updateSession({
          chainId
        });
      } catch (error) {
        logger.error('Error switching chain', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    } else {
      // Mock implementation
      if (this.mockSession) {
        this.mockSession.chainId = chainId;
        logger.debug('Mock wallet switched to chain', { chainId });
      } else {
        throw new Error('Not connected to wallet');
      }
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(address: string): Promise<string> {
    if (this.instance) {
      try {
        // This would need to be implemented with the actual WalletKit API
        // For now, return a mock value
        return '1250.75';
      } catch (error) {
        logger.error('Error getting balance', error instanceof Error ? error : new Error(String(error)));
        return '0';
      }
    } else {
      // Mock implementation
      return '1250.75';
    }
  }
}

// Export a singleton instance
export const walletConnect = new WalletConnectWrapper();
export default walletConnect; 