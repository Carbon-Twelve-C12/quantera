import React from 'react';
import '@testing-library/jest-dom';
import PortfolioPage from './PortfolioPage';
import {
  renderWithProviders,
  screen,
  fireEvent,
  waitFor,
} from '../test-utils';
import { useWallet, createMockWallet } from '../contexts/WalletContext';

// Mock chart.js
jest.mock('react-chartjs-2', () => ({
  Pie: () => <div data-testid="mock-pie-chart">Pie Chart</div>,
  Line: () => <div data-testid="mock-line-chart">Line Chart</div>,
  Bar: () => <div data-testid="mock-bar-chart">Bar Chart</div>
}));

// Mock contexts with inline factories
jest.mock('../contexts/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    theme: 'dark',
    resolvedTheme: 'dark',
    toggleTheme: jest.fn(),
    setTheme: jest.fn(),
  })),
}));

jest.mock('../contexts/WalletContext', () => ({
  useWallet: jest.fn(() => ({
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    connected: true,
    balance: '1.5',
    provider: { getSigner: jest.fn() },
    chainId: 1,
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
  createMockWallet: (overrides = {}) => ({
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    connected: true,
    balance: '1.5',
    provider: { getSigner: jest.fn() },
    chainId: 1,
    connect: jest.fn(),
    disconnect: jest.fn(),
    ...overrides,
  }),
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
    },
    loading: false,
    error: null,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn(),
  })),
}));

// Helper to render with wrapper
const renderWithTestWrapper = (ui, { walletValue } = {}) => {
  // Set up the mock for this render
  if (walletValue) {
    useWallet.mockReturnValue(walletValue);
  } else {
    useWallet.mockReturnValue(createMockWallet({
      connected: true,
      address: '0x1234567890abcdef1234567890abcdef12345678',
    }));
  }
  return renderWithProviders(ui);
};

describe('PortfolioPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders portfolio header', () => {
    renderWithTestWrapper(<PortfolioPage />);

    expect(screen.getByText('Portfolio Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Comprehensive view of your tokenized assets/i)).toBeInTheDocument();
  });

  it('shows connect wallet message when not connected', () => {
    const disconnectedWallet = createMockWallet({ connected: false });
    renderWithTestWrapper(<PortfolioPage />, { walletValue: disconnectedWallet });

    expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument();
    expect(screen.getByText(/Please connect your wallet to view your portfolio/i)).toBeInTheDocument();
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });

  it('displays portfolio overview cards', () => {
    renderWithTestWrapper(<PortfolioPage />);

    // Check overview cards
    expect(screen.getByText('Total Portfolio Value')).toBeInTheDocument();
    expect(screen.getByText('Total Yield Generated')).toBeInTheDocument();
    expect(screen.getByText('Active Positions')).toBeInTheDocument();
    expect(screen.getByText('Average APY')).toBeInTheDocument();
  });

  it('renders all portfolio tabs', () => {
    renderWithTestWrapper(<PortfolioPage />);

    expect(screen.getByText('All Assets')).toBeInTheDocument();
    expect(screen.getByText('Treasury Securities')).toBeInTheDocument();
    expect(screen.getByText('Environmental Assets')).toBeInTheDocument();
    expect(screen.getByText('Trade Finance')).toBeInTheDocument();
    expect(screen.getByText('Yield Strategies')).toBeInTheDocument();
  });

  it('switches tabs when clicked', async () => {
    renderWithTestWrapper(<PortfolioPage />);

    // Click Treasury Securities tab
    const treasuryTab = screen.getByText('Treasury Securities');
    fireEvent.click(treasuryTab);

    await waitFor(() => {
      expect(screen.getByText('Treasury Portfolio Overview')).toBeInTheDocument();
    });

    // Click Environmental Assets tab
    const envTab = screen.getByText('Environmental Assets');
    fireEvent.click(envTab);

    await waitFor(() => {
      expect(screen.getByText('Environmental Asset Distribution')).toBeInTheDocument();
    });
  });

  it('displays asset allocation chart', () => {
    renderWithTestWrapper(<PortfolioPage />);

    expect(screen.getByText('Asset Allocation')).toBeInTheDocument();
    expect(screen.getByTestId('mock-pie-chart')).toBeInTheDocument();
  });

  it('displays performance chart', () => {
    renderWithTestWrapper(<PortfolioPage />);

    expect(screen.getByText('Portfolio Performance')).toBeInTheDocument();
    expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
  });

  it('renders asset holdings table', () => {
    renderWithTestWrapper(<PortfolioPage />);

    // Check table headers
    expect(screen.getByText('Asset Name')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('Current Value')).toBeInTheDocument();
    expect(screen.getByText('24h Change')).toBeInTheDocument();
    expect(screen.getByText('APY')).toBeInTheDocument();
  });

  it('displays mock portfolio data', () => {
    renderWithTestWrapper(<PortfolioPage />);

    // Check for some mock assets
    expect(screen.getByText('US Treasury Bond 2025')).toBeInTheDocument();
    expect(screen.getByText('Amazon Rainforest Credits')).toBeInTheDocument();
  });

  it('shows positive and negative price changes correctly', () => {
    renderWithTestWrapper(<PortfolioPage />);

    // Look for positive change (green)
    const positiveChange = screen.getByText('+2.50%');
    expect(positiveChange).toHaveClass('positive');

    // Look for negative change (red)
    const negativeChange = screen.getByText('-0.50%');
    expect(negativeChange).toHaveClass('negative');
  });

  it('calculates total portfolio value correctly', () => {
    renderWithTestWrapper(<PortfolioPage />);

    // The mock data should show specific total
    expect(screen.getByText('$125,750.00')).toBeInTheDocument();
  });

  it('displays yield strategies tab content', async () => {
    renderWithTestWrapper(<PortfolioPage />);

    const yieldTab = screen.getByText('Yield Strategies');
    fireEvent.click(yieldTab);

    await waitFor(() => {
      expect(screen.getByText('Active Yield Strategies')).toBeInTheDocument();
      expect(screen.getByText('Total Yield Generated')).toBeInTheDocument();
      expect(screen.getByText('Average Strategy APY')).toBeInTheDocument();
    });
  });

  it('displays trade finance specific metrics', async () => {
    renderWithTestWrapper(<PortfolioPage />);

    const tradeFinanceTab = screen.getByText('Trade Finance');
    fireEvent.click(tradeFinanceTab);

    await waitFor(() => {
      expect(screen.getByText('Trade Finance Overview')).toBeInTheDocument();
      expect(screen.getByText('Active Positions')).toBeInTheDocument();
      expect(screen.getByText('Average Maturity')).toBeInTheDocument();
    });
  });

  it('shows empty state when no assets in category', async () => {
    renderWithTestWrapper(<PortfolioPage />);

    // Mock empty custom assets
    const customTab = screen.getByText('Custom Assets');
    fireEvent.click(customTab);

    await waitFor(() => {
      expect(screen.getByText(/No custom assets in your portfolio/i)).toBeInTheDocument();
    });
  });

  it('handles wallet connection from portfolio page', () => {
    const mockConnect = jest.fn();
    const disconnectedWallet = createMockWallet({ connected: false, connect: mockConnect });

    renderWithTestWrapper(<PortfolioPage />, { walletValue: disconnectedWallet });

    const connectButton = screen.getByText('Connect Wallet');
    fireEvent.click(connectButton);

    expect(mockConnect).toHaveBeenCalledTimes(1);
  });
});