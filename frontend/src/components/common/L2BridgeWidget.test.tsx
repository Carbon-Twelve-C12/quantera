import React from 'react';
import { render, screen } from '@testing-library/react';
import L2BridgeWidget from './L2BridgeWidget';

// Mock the context hooks
jest.mock('../../contexts/WalletContext', () => ({
  useWallet: () => ({
    address: '0x1234567890123456789012345678901234567890',
    provider: {},
    chainId: 1,
    connected: true,
    connect: jest.fn(),
    disconnect: jest.fn(),
  }),
}));

jest.mock('../../contexts/L2BridgeContext', () => ({
  useL2Bridge: () => ({
    chains: [
      { chainId: 10, name: 'Optimism', enabled: true, bridgeAddress: '0x...', blobEnabled: true },
      { chainId: 42161, name: 'Arbitrum', enabled: true, bridgeAddress: '0x...', blobEnabled: false },
    ],
    selectedChain: { chainId: 10, name: 'Optimism', enabled: true, bridgeAddress: '0x...', blobEnabled: true },
    setSelectedChain: jest.fn(),
    isBridging: false,
    orders: [],
    bridgeOrder: jest.fn(),
    estimateBridgingGas: jest.fn().mockResolvedValue({
      useBlob: true,
      blobGasLimit: "500000",
      callDataGasLimit: "1000000",
      estimatedCompressedSize: "700"
    }),
    getOrdersByUser: jest.fn().mockResolvedValue(['order1', 'order2']),
    getMessageDetails: jest.fn().mockResolvedValue({
      messageId: 'message1',
      status: 'PENDING',
      timestamp: Date.now(),
    }),
    getSupportedChains: jest.fn().mockResolvedValue([
      { chainId: 10, name: 'Optimism', enabled: true, bridgeAddress: '0x...', blobEnabled: true },
      { chainId: 42161, name: 'Arbitrum', enabled: true, bridgeAddress: '0x...', blobEnabled: false },
    ]),
    transactions: [],
    isWebSocketConnected: true,
    messagesLoading: false,
    messagesError: null,
  }),
  MessageStatus: {
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    CONFIRMED: "CONFIRMED",
    FAILED: "FAILED"
  }
}));

describe('L2BridgeWidget', () => {
  it('renders the bridge widget', async () => {
    render(<L2BridgeWidget />);
    
    // Check if the component renders main elements
    expect(screen.getByText('Bridge to L2')).toBeInTheDocument();
    expect(screen.getByText('Bridge your assets to Layer 2 networks for faster and cheaper transactions.')).toBeInTheDocument();
    expect(screen.getByLabelText('Treasury ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bridge' })).toBeInTheDocument();
    expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
  });
}); 