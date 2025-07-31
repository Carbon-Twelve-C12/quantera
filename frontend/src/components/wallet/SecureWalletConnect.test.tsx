import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SecureWalletConnect } from './SecureWalletConnect';
import { ThemeContext } from '../../contexts/ThemeContext';
import { BrowserProvider } from 'ethers';

// Mock ethers
jest.mock('ethers', () => ({
  BrowserProvider: jest.fn(),
  verifyMessage: jest.fn()
}));

// Mock window.ethereum
const mockEthereum = {
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
  isMetaMask: true
};

// Theme context wrapper
const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = {
    theme: 'light',
    toggleTheme: jest.fn()
  };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

describe('SecureWalletConnect', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup window.ethereum
    (window as any).ethereum = mockEthereum;
    
    // Setup localStorage mock
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.removeItem = jest.fn();
  });

  afterEach(() => {
    delete (window as any).ethereum;
  });

  it('renders connect button when not connected', () => {
    render(
      <ThemeWrapper>
        <SecureWalletConnect />
      </ThemeWrapper>
    );

    expect(screen.getByText(/Connect Wallet/i)).toBeInTheDocument();
  });

  it('shows "No Wallet" when ethereum is not available', () => {
    delete (window as any).ethereum;
    
    render(
      <ThemeWrapper>
        <SecureWalletConnect />
      </ThemeWrapper>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('No Wallet');
  });

  it('connects wallet successfully', async () => {
    const mockAccounts = ['0x1234567890abcdef1234567890abcdef12345678'];
    const mockChainId = '0x1';
    
    mockEthereum.request
      .mockResolvedValueOnce(mockAccounts) // eth_requestAccounts
      .mockResolvedValueOnce(mockChainId); // eth_chainId
    
    render(
      <ThemeWrapper>
        <SecureWalletConnect />
      </ThemeWrapper>
    );

    const connectButton = screen.getByText(/Connect Wallet/i);
    fireEvent.click(connectButton);

    await waitFor(() => {
      expect(mockEthereum.request).toHaveBeenCalledWith({ method: 'eth_requestAccounts' });
      expect(mockEthereum.request).toHaveBeenCalledWith({ method: 'eth_chainId' });
    });
  });

  it('handles connection error gracefully', async () => {
    mockEthereum.request.mockRejectedValueOnce(new Error('User rejected request'));
    
    render(
      <ThemeWrapper>
        <SecureWalletConnect />
      </ThemeWrapper>
    );

    const connectButton = screen.getByText(/Connect Wallet/i);
    fireEvent.click(connectButton);

    await waitFor(() => {
      expect(mockEthereum.request).toHaveBeenCalledWith({ method: 'eth_requestAccounts' });
    });
  });

  it('displays connected address correctly', async () => {
    const mockAddress = '0x1234567890abcdef1234567890abcdef12345678';
    
    // Mock already connected state
    Storage.prototype.getItem = jest.fn(() => JSON.stringify({
      address: mockAddress,
      chainId: 1,
      timestamp: Date.now()
    }));
    
    render(
      <ThemeWrapper>
        <SecureWalletConnect />
      </ThemeWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/0x1234...5678/i)).toBeInTheDocument();
    });
  });

  it('disconnects wallet when clicking disconnect', async () => {
    const mockAddress = '0x1234567890abcdef1234567890abcdef12345678';
    
    // Mock connected state
    Storage.prototype.getItem = jest.fn(() => JSON.stringify({
      address: mockAddress,
      chainId: 1,
      timestamp: Date.now()
    }));
    
    render(
      <ThemeWrapper>
        <SecureWalletConnect />
      </ThemeWrapper>
    );

    // Wait for connected state
    await waitFor(() => {
      expect(screen.getByText(/0x1234...5678/i)).toBeInTheDocument();
    });

    // Click the connected button to open menu
    const connectedButton = screen.getByText(/0x1234...5678/i);
    fireEvent.click(connectedButton);

    // Click disconnect
    const disconnectButton = screen.getByText(/Disconnect/i);
    fireEvent.click(disconnectButton);

    await waitFor(() => {
      expect(Storage.prototype.removeItem).toHaveBeenCalledWith('quantera-wallet-session');
      expect(screen.getByText(/Connect Wallet/i)).toBeInTheDocument();
    });
  });

  it('shows correct security indicator for supported network', async () => {
    const mockAddress = '0x1234567890abcdef1234567890abcdef12345678';
    
    // Mock connected state on mainnet (chainId: 1)
    Storage.prototype.getItem = jest.fn(() => JSON.stringify({
      address: mockAddress,
      chainId: 1,
      timestamp: Date.now()
    }));
    
    render(
      <ThemeWrapper>
        <SecureWalletConnect />
      </ThemeWrapper>
    );

    await waitFor(() => {
      const securityIndicator = screen.getByTestId('security-indicator');
      expect(securityIndicator).toHaveStyle({ backgroundColor: expect.stringContaining('4caf50') });
    });
  });

  it('shows warning for unsupported network', async () => {
    const mockAddress = '0x1234567890abcdef1234567890abcdef12345678';
    
    // Mock connected state on unsupported network
    Storage.prototype.getItem = jest.fn(() => JSON.stringify({
      address: mockAddress,
      chainId: 999,
      timestamp: Date.now()
    }));
    
    render(
      <ThemeWrapper>
        <SecureWalletConnect />
      </ThemeWrapper>
    );

    await waitFor(() => {
      const securityIndicator = screen.getByTestId('security-indicator');
      expect(securityIndicator).toHaveStyle({ backgroundColor: expect.stringContaining('ff9800') });
    });
  });

  it('handles account change events', async () => {
    const initialAddress = '0x1111111111111111111111111111111111111111';
    const newAddress = '0x2222222222222222222222222222222222222222';
    
    // Mock initial connected state
    Storage.prototype.getItem = jest.fn(() => JSON.stringify({
      address: initialAddress,
      chainId: 1,
      timestamp: Date.now()
    }));
    
    render(
      <ThemeWrapper>
        <SecureWalletConnect />
      </ThemeWrapper>
    );

    // Simulate account change
    const accountsChangedHandler = mockEthereum.on.mock.calls.find(
      call => call[0] === 'accountsChanged'
    )?.[1];
    
    if (accountsChangedHandler) {
      accountsChangedHandler([newAddress]);
    }

    await waitFor(() => {
      expect(screen.getByText(/0x2222...2222/i)).toBeInTheDocument();
    });
  });

  it('handles chain change events', async () => {
    const mockAddress = '0x1234567890abcdef1234567890abcdef12345678';
    
    // Mock initial connected state
    Storage.prototype.getItem = jest.fn(() => JSON.stringify({
      address: mockAddress,
      chainId: 1,
      timestamp: Date.now()
    }));
    
    render(
      <ThemeWrapper>
        <SecureWalletConnect />
      </ThemeWrapper>
    );

    // Simulate chain change
    const chainChangedHandler = mockEthereum.on.mock.calls.find(
      call => call[0] === 'chainChanged'
    )?.[1];
    
    if (chainChangedHandler) {
      chainChangedHandler('0x5'); // Goerli
    }

    await waitFor(() => {
      expect(Storage.prototype.setItem).toHaveBeenCalledWith(
        'quantera-wallet-session',
        expect.stringContaining('"chainId":5')
      );
    });
  });
});