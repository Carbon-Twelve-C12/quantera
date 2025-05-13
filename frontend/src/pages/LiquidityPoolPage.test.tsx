import React from 'react';
import { render, screen } from '@testing-library/react';
import LiquidityPoolPage from './LiquidityPoolPage';
import { LiquidityPoolProvider } from '../contexts/LiquidityPoolContext';

// Mock wallet provider component for tests
const MockWalletProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return <div data-testid="mock-wallet-provider">{children}</div>;
};

// Mock the chart.js module
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

// Mock react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mocked-chart" />,
}));

// Mock ThemeContext
jest.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: jest.fn()
  })
}));

// Mock the WalletContext and LiquidityPoolContext
jest.mock('../contexts/WalletContext', () => {
  return {
    useWallet: () => ({
      address: null, 
      connected: false,
      connect: jest.fn(),
      disconnect: jest.fn(),
      chainId: 1,
      balance: '0',
      connecting: false,
      error: null,
      provider: null,
      signer: null,
      switchChain: jest.fn(),
      refreshBalance: jest.fn(),
    }),
  };
});

jest.mock('../contexts/LiquidityPoolContext', () => {
  const originalModule = jest.requireActual('../contexts/LiquidityPoolContext');
  return {
    ...originalModule,
    useLiquidityPool: () => ({
      pools: [],
      positions: [],
      poolStates: {},
      tokens: {},
      userPositions: [],
      isLoading: false,
      error: null,
      createPool: jest.fn(),
      addLiquidity: jest.fn(),
      removeLiquidity: jest.fn(),
      collectFees: jest.fn(),
      refreshPools: jest.fn(),
      refreshUserPositions: jest.fn(),
    }),
    LiquidityPoolProvider: ({ children }) => <div>{children}</div>,
  };
});

describe('LiquidityPoolPage', () => {
  it('renders without crashing', () => {
    render(
      <MockWalletProvider>
        <LiquidityPoolProvider>
          <LiquidityPoolPage />
        </LiquidityPoolProvider>
      </MockWalletProvider>
    );
    
    expect(screen.getByText('Liquidity Pool Management')).toBeInTheDocument();
  });

  it('displays the pools tab by default', () => {
    render(
      <MockWalletProvider>
        <LiquidityPoolProvider>
          <LiquidityPoolPage />
        </LiquidityPoolProvider>
      </MockWalletProvider>
    );
    
    expect(screen.getByText('Available Pools')).toBeInTheDocument();
  });

  it('displays a message when no pools are available', () => {
    render(
      <MockWalletProvider>
        <LiquidityPoolProvider>
          <LiquidityPoolPage />
        </LiquidityPoolProvider>
      </MockWalletProvider>
    );
    
    expect(screen.getByText('No pools available.')).toBeInTheDocument();
  });
}); 