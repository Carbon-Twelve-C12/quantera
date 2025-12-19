require('@testing-library/jest-dom');

// =============================================================================
// Suppress specific console warnings during tests
// =============================================================================

const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    // Suppress React 18 act() warnings that are often false positives
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: An update to') ||
       args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('inside a test was not wrapped in act'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    // Suppress specific warnings
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('[DEV]') ||
       args[0].includes('[SECURITY WARNING]'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// =============================================================================
// Browser API Mocks
// =============================================================================

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
};

// Mock WebSocket
global.WebSocket = class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 1; // OPEN
    this.onopen = null;
    this.onclose = null;
    this.onmessage = null;
    this.onerror = null;
  }
  send(data) {}
  close() {
    if (this.onclose) {
      this.onclose({ code: 1000, reason: 'Normal closure' });
    }
  }
  addEventListener(event, handler) {
    this[`on${event}`] = handler;
  }
  removeEventListener(event, handler) {
    if (this[`on${event}`] === handler) {
      this[`on${event}`] = null;
    }
  }
};

// Mock crypto
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: arr => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
    subtle: {
      digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
      encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
      decrypt: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
      importKey: jest.fn().mockResolvedValue({}),
      deriveKey: jest.fn().mockResolvedValue({}),
    },
  },
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// =============================================================================
// Ethereum/Web3 Mocks
// =============================================================================

// Mock window.ethereum
Object.defineProperty(window, 'ethereum', {
  value: {
    isMetaMask: true,
    request: jest.fn().mockImplementation(({ method }) => {
      switch (method) {
        case 'eth_requestAccounts':
          return Promise.resolve(['0x742d35Cc6634C0532925a3b844Bc454e4438f44e']);
        case 'eth_chainId':
          return Promise.resolve('0x1');
        case 'eth_accounts':
          return Promise.resolve(['0x742d35Cc6634C0532925a3b844Bc454e4438f44e']);
        case 'wallet_switchEthereumChain':
          return Promise.resolve(null);
        default:
          return Promise.resolve(null);
      }
    }),
    on: jest.fn(),
    removeListener: jest.fn(),
    selectedAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    chainId: '0x1',
  },
  writable: true,
});

// =============================================================================
// Environment Variables
// =============================================================================

process.env.REACT_APP_API_URL = 'http://localhost:3001';
process.env.REACT_APP_ENCRYPTION_SECRET = 'test-secret-for-jest-testing-only-32chars';
process.env.NODE_ENV = 'test';

// =============================================================================
// Global Test Utilities
// =============================================================================

// Helper to wait for async operations
global.waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Helper to flush all pending promises
global.flushPromises = () => new Promise(resolve => setImmediate(resolve));

// =============================================================================
// Cleanup
// =============================================================================

afterEach(() => {
  // Clear all mocks after each test
  jest.clearAllMocks();
  // Clear localStorage/sessionStorage
  localStorageMock.clear();
  sessionStorageMock.clear();
}); 