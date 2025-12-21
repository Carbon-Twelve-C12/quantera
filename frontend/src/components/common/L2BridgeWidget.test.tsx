import React from 'react';
import '@testing-library/jest-dom';
import L2BridgeWidget from './L2BridgeWidget';
import {
  render,
  screen,
} from '../../test-utils';

// Mock wallet context with inline factory to ensure proper mock values
jest.mock('../../contexts/WalletContext', () => ({
  useWallet: jest.fn(() => ({
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    connected: true,
    balance: '1.5',
    network: 'mainnet',
    provider: {
      getSigner: jest.fn(),
      getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
    },
    chainId: 1,
    connect: jest.fn(),
    disconnect: jest.fn(),
    switchNetwork: jest.fn(),
  })),
  WalletProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock L2Bridge context
jest.mock('../../contexts/L2BridgeContext', () => ({
  useL2Bridge: jest.fn(() => ({
    chains: [
      { chainId: 10, name: 'Optimism', enabled: true, bridgeAddress: '0x123', blobEnabled: true },
    ],
    selectedChain: { chainId: 10, name: 'Optimism', enabled: true, bridgeAddress: '0x123', blobEnabled: true },
    setSelectedChain: jest.fn(),
    isBridging: false,
    orders: [],
    bridgeOrder: jest.fn().mockResolvedValue(undefined),
    estimateBridgingGas: jest.fn().mockResolvedValue({
      useBlob: false,
      blobGasLimit: '500000',
      callDataGasLimit: '1000000',
      estimatedCompressedSize: '70000',
    }),
    getOrdersByUser: jest.fn().mockResolvedValue([]),
    getMessageDetails: jest.fn().mockResolvedValue({
      messageId: 'msg-123',
      status: 'PENDING',
      timestamp: Date.now(),
      source: 'Ethereum',
      destination: 'Optimism',
    }),
    getSupportedChains: jest.fn().mockResolvedValue([]),
    transactions: [],
    isWebSocketConnected: true,
    messagesLoading: false,
    messagesError: null,
  })),
  L2BridgeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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
