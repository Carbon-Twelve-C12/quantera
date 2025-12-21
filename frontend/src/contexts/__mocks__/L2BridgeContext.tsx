import React from 'react';

export interface ChainInfo {
  chainId: number;
  name: string;
  enabled: boolean;
  bridgeAddress: string;
  blobEnabled: boolean;
}

export interface OrderDetails {
  orderId: string;
  treasuryId: string;
  userAddress: string;
  isBuy: boolean;
  amount: string;
  price: string;
}

export interface MessageDetails {
  messageId: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REJECTED';
  timestamp: number;
  source: string;
  destination: string;
  data?: Record<string, unknown>;
}

export interface GasEstimation {
  useBlob: boolean;
  blobGasLimit: string;
  callDataGasLimit: string;
  estimatedCompressedSize: string;
}

export interface Transaction {
  id: string;
  type: string;
  status: string;
  timestamp: number;
  chainId: number;
  error?: string;
}

const mockChains: ChainInfo[] = [
  { chainId: 10, name: 'Optimism', enabled: true, bridgeAddress: '0x123', blobEnabled: true },
  { chainId: 42161, name: 'Arbitrum', enabled: true, bridgeAddress: '0x456', blobEnabled: false },
];

export const useL2Bridge = jest.fn(() => ({
  chains: mockChains,
  selectedChain: mockChains[0],
  setSelectedChain: jest.fn(),
  isBridging: false,
  orders: [],
  bridgeOrder: jest.fn().mockResolvedValue(undefined),
  estimateBridgingGas: jest.fn().mockResolvedValue({
    useBlob: false,
    blobGasLimit: "500000",
    callDataGasLimit: "1000000",
    estimatedCompressedSize: "70000"
  }),
  getOrdersByUser: jest.fn().mockResolvedValue([]),
  getMessageDetails: jest.fn().mockResolvedValue({
    messageId: 'msg-123',
    status: 'PENDING' as const,
    timestamp: Date.now(),
    source: 'Ethereum',
    destination: 'Optimism'
  }),
  getSupportedChains: jest.fn().mockResolvedValue(mockChains),
  transactions: [],
  isWebSocketConnected: true,
  messagesLoading: false,
  messagesError: null
}));

export const L2BridgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div data-testid="mock-l2bridge-provider">{children}</div>;
};

const L2BridgeContext = React.createContext({
  chains: mockChains,
  selectedChain: mockChains[0],
  setSelectedChain: jest.fn(),
  isBridging: false,
  orders: [],
  bridgeOrder: jest.fn(),
  estimateBridgingGas: jest.fn(),
  getOrdersByUser: jest.fn(),
  getMessageDetails: jest.fn(),
  getSupportedChains: jest.fn(),
  transactions: [],
  isWebSocketConnected: true,
  messagesLoading: false,
  messagesError: null
});

export default L2BridgeContext;
