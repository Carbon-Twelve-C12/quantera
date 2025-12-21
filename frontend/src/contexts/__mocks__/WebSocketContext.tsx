/**
 * Mock WebSocketContext for testing
 */
import React, { createContext } from 'react';

// Subscription topics enum
export const SubscriptionTopic = {
  SMART_ACCOUNTS: 'smart_accounts',
  SMART_ACCOUNT: 'smart_account',
  PORTFOLIO: 'portfolio',
  MARKET_DATA: 'market_data',
  LIQUIDITY_POOLS: 'liquidity_pools',
} as const;

// Message status enum
export const MessageStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED',
} as const;

// Types
export interface SmartAccountOperation {
  operation_id: string;
  account_id: string;
  operation_type: string;
  timestamp: number;
  executor: string;
}

export interface WebSocketEvent {
  type: string;
  payload: unknown;
}

// Mock WebSocket state factory
export const createMockWebSocket = (overrides = {}) => ({
  isConnected: true,
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  send: jest.fn(),
  events: [] as WebSocketEvent[],
  lastMessage: null,
  ...overrides,
});

// Default mock state
const mockWebSocketState = createMockWebSocket();

// Create mock context
const WebSocketContext = createContext(mockWebSocketState);

// Mock useWebSocket hook
export const useWebSocket = jest.fn(() => mockWebSocketState);

// Mock provider
export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <WebSocketContext.Provider value={mockWebSocketState}>
    {children}
  </WebSocketContext.Provider>
);

export default WebSocketContext;
