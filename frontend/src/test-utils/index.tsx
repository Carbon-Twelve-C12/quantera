/**
 * Test Utilities
 *
 * Provides reusable testing utilities including:
 * - Mock context providers
 * - Custom render functions
 * - Common test data factories
 *
 * USAGE:
 *   import { renderWithProviders, mockWallet, mockAuth } from '@/test-utils';
 *
 *   test('my test', () => {
 *     renderWithProviders(<MyComponent />, {
 *       wallet: { connected: true, address: '0x123' }
 *     });
 *   });
 */

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';

// =============================================================================
// Mock Data Factories
// =============================================================================

export const mockWalletAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

export const createMockWallet = (overrides = {}) => ({
  address: mockWalletAddress,
  provider: {},
  chainId: 1,
  connected: true,
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn(),
  switchChain: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

export const createMockAuth = (overrides = {}) => ({
  isAuthenticated: true,
  user: {
    id: 'user-123',
    walletAddress: mockWalletAddress,
    role: 'user',
  },
  token: 'mock-jwt-token',
  login: jest.fn().mockResolvedValue(undefined),
  logout: jest.fn(),
  loading: false,
  error: null,
  ...overrides,
});

export const createMockTheme = (overrides = {}) => ({
  theme: 'dark',
  toggleTheme: jest.fn(),
  ...overrides,
});

export const createMockL2Bridge = (overrides = {}) => ({
  chains: [
    { chainId: 10, name: 'Optimism', enabled: true, bridgeAddress: '0x...', blobEnabled: true },
    { chainId: 42161, name: 'Arbitrum', enabled: true, bridgeAddress: '0x...', blobEnabled: false },
  ],
  selectedChain: { chainId: 10, name: 'Optimism', enabled: true, bridgeAddress: '0x...', blobEnabled: true },
  setSelectedChain: jest.fn(),
  isBridging: false,
  orders: [],
  bridgeOrder: jest.fn().mockResolvedValue({ orderId: 'order-123' }),
  estimateBridgingGas: jest.fn().mockResolvedValue({
    useBlob: true,
    blobGasLimit: '500000',
    callDataGasLimit: '1000000',
    estimatedCompressedSize: '700',
  }),
  getOrdersByUser: jest.fn().mockResolvedValue([]),
  getMessageDetails: jest.fn().mockResolvedValue({
    messageId: 'message-1',
    status: 'PENDING',
    timestamp: Date.now(),
  }),
  getSupportedChains: jest.fn().mockResolvedValue([]),
  transactions: [],
  isWebSocketConnected: true,
  messagesLoading: false,
  messagesError: null,
  ...overrides,
});

export const createMockPortfolio = (overrides = {}) => ({
  holdings: [],
  transactions: [],
  totalValue: 0,
  loading: false,
  error: null,
  refreshPortfolio: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

export const createMockLiquidityPool = (overrides = {}) => ({
  pools: [],
  userPositions: [],
  loading: false,
  error: null,
  addLiquidity: jest.fn().mockResolvedValue(undefined),
  removeLiquidity: jest.fn().mockResolvedValue(undefined),
  refreshPools: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

export const createMockYieldStrategy = (overrides = {}) => ({
  strategies: [],
  userStrategies: [],
  loading: false,
  error: null,
  applyStrategy: jest.fn().mockResolvedValue(undefined),
  withdrawStrategy: jest.fn().mockResolvedValue(undefined),
  refreshStrategies: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

export const createMockTradeFinance = (overrides = {}) => ({
  instruments: [],
  loading: false,
  error: null,
  createInstrument: jest.fn().mockResolvedValue(undefined),
  refreshInstruments: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

export const createMockWebSocket = (overrides = {}) => ({
  isConnected: true,
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  send: jest.fn(),
  lastMessage: null,
  ...overrides,
});

export const createMockAnalytics = (overrides = {}) => ({
  trackEvent: jest.fn(),
  trackPageView: jest.fn(),
  setUser: jest.fn(),
  ...overrides,
});

// =============================================================================
// Mock Context Implementations
// =============================================================================

// These can be used with jest.mock() in individual test files
export const mockContexts = {
  WalletContext: {
    useWallet: () => createMockWallet(),
  },
  AuthContext: {
    useAuth: () => createMockAuth(),
  },
  ThemeContext: {
    useTheme: () => createMockTheme(),
  },
  L2BridgeContext: {
    useL2Bridge: () => createMockL2Bridge(),
    MessageStatus: {
      PENDING: 'PENDING',
      PROCESSING: 'PROCESSING',
      CONFIRMED: 'CONFIRMED',
      FAILED: 'FAILED',
    },
  },
  PortfolioContext: {
    usePortfolio: () => createMockPortfolio(),
  },
  LiquidityPoolContext: {
    useLiquidityPool: () => createMockLiquidityPool(),
  },
  YieldStrategyContext: {
    useYieldStrategy: () => createMockYieldStrategy(),
  },
  TradeFinanceContext: {
    useTradeFinance: () => createMockTradeFinance(),
  },
  WebSocketContext: {
    useWebSocket: () => createMockWebSocket(),
  },
  AnalyticsContext: {
    useAnalytics: () => createMockAnalytics(),
  },
};

// =============================================================================
// Provider Wrapper Components
// =============================================================================

interface MockProviderProps {
  children: ReactNode;
}

// Create mock context providers
const MockWalletProvider: React.FC<MockProviderProps> = ({ children }) => <>{children}</>;
const MockAuthProvider: React.FC<MockProviderProps> = ({ children }) => <>{children}</>;
const MockThemeProvider: React.FC<MockProviderProps> = ({ children }) => <>{children}</>;

// =============================================================================
// Render Options
// =============================================================================

export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Initial route for MemoryRouter */
  route?: string;
  /** Use BrowserRouter instead of MemoryRouter */
  useBrowserRouter?: boolean;
  /** Mock wallet state overrides */
  wallet?: Partial<ReturnType<typeof createMockWallet>>;
  /** Mock auth state overrides */
  auth?: Partial<ReturnType<typeof createMockAuth>>;
  /** Mock theme state overrides */
  theme?: Partial<ReturnType<typeof createMockTheme>>;
}

/**
 * Custom render function that wraps components with common providers
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    route = '/',
    useBrowserRouter = false,
    wallet,
    auth,
    theme,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  const Router = useBrowserRouter ? BrowserRouter : MemoryRouter;
  const routerProps = useBrowserRouter ? {} : { initialEntries: [route] };

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Router {...routerProps}>
        {children}
      </Router>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    // Return mock state for assertions
    mockWallet: wallet ? createMockWallet(wallet) : createMockWallet(),
    mockAuth: auth ? createMockAuth(auth) : createMockAuth(),
    mockTheme: theme ? createMockTheme(theme) : createMockTheme(),
  };
}

/**
 * Render with BrowserRouter (convenience function)
 */
export function renderWithRouter(ui: ReactElement, options?: Omit<CustomRenderOptions, 'useBrowserRouter'>) {
  return renderWithProviders(ui, { ...options, useBrowserRouter: true });
}

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Wait for async operations to complete
 * Useful for avoiding act() warnings
 */
export async function waitForAsync(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Flush all pending promises
 */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

/**
 * Create a mock API response
 */
export function createMockApiResponse<T>(data: T, status = 200) {
  return {
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {},
  };
}

/**
 * Create a mock API error
 */
export function createMockApiError(message: string, status = 500) {
  const error = new Error(message) as Error & { response?: unknown };
  error.response = {
    data: { message },
    status,
    statusText: 'Error',
  };
  return error;
}

// =============================================================================
// Mock Data for Common Entities
// =============================================================================

export const mockTreasury = {
  token_id: 'treasury-1',
  name: 'US Treasury Bond 2025',
  symbol: 'T2025',
  treasury_type: 'tbill',
  current_price: '100.00',
  yield_rate: 450, // 4.50%
  maturity_date: Math.floor(new Date('2025-12-31').getTime() / 1000),
  status: 'Active',
  issuer: 'US Treasury',
  currency: 'USD',
};

export const mockEnvironmentalAsset = {
  asset_id: 'carbon-1',
  name: 'Amazon Forest Carbon Credits',
  asset_type: 'Carbon Credit',
  project_type: 'Forest Conservation',
  price_per_unit: 25,
  available_units: 1000,
  total_units: 5000,
  verification_standard: 'VCS',
  annual_reduction: 1000,
  category: 'environmental_assets',
};

export const mockPortfolioHolding = {
  id: 'holding-1',
  assetId: 'treasury-1',
  assetName: 'US Treasury Bond 2025',
  quantity: 100,
  averagePrice: 99.50,
  currentValue: 10000,
  profitLoss: 50,
  profitLossPercent: 0.5,
};

export const mockTransaction = {
  id: 'tx-1',
  type: 'buy',
  assetId: 'treasury-1',
  assetName: 'US Treasury Bond 2025',
  quantity: 10,
  price: 100,
  timestamp: new Date().toISOString(),
  status: 'completed',
  txHash: '0x123...',
};

// =============================================================================
// Re-export testing library utilities
// =============================================================================

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
