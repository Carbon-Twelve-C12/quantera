import React from 'react';
import '@testing-library/jest-dom';
import YieldStrategyPage from './YieldStrategyPage';
import { YieldStrategyProvider } from '../contexts/YieldStrategyContext';
import {
  render,
  screen,
  fireEvent,
  createMockYieldStrategy,
} from '../test-utils';

// Mock the useYieldStrategy hook
jest.mock('../contexts/YieldStrategyContext', () => {
  const mockStrategy = {
    strategy_id: "0x1234",
    name: "Test Strategy",
    description: "Strategy for testing",
    risk_level: "MODERATE",
    is_public: true,
    is_active: true,
    creation_date: Date.now(),
    performance_fee: "100",
    metadata_uri: "ipfs://test",
    asset_class: 0,
    annual_yield_percentage: "5.0",
    auto_compound: true,
  };

  const mockUserStrategy = {
    transaction_id: "0xabcd",
    strategy_id: "0x1234",
    asset_id: "0xasset1",
    amount: "1000000000000000000",
    status: "COMPLETED",
    estimated_yield: "50000000000000000",
  };

  return {
    useYieldStrategy: () => ({
      strategies: [mockStrategy],
      userStrategies: [mockUserStrategy],
      filteredStrategies: [mockStrategy],
      selectedStrategy: null,
      impactResults: null,
      filters: {
        asset_class: [],
        risk_level: [],
        min_annual_yield: 0,
        max_fee: 100,
        environmental_only: false,
        auto_compound_only: false,
        asset_type: [],
        min_retirement_percentage: 0,
        carbon_negative_only: false
      },
      loading: false,
      error: null,
      fetchStrategies: jest.fn(),
      fetchUserStrategies: jest.fn(),
      applyStrategy: jest.fn(),
      calculateImpact: jest.fn(),
      setFilters: jest.fn(),
      resetFilters: jest.fn(),
      setSelectedStrategy: jest.fn()
    }),
    YieldStrategyProvider: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="strategy-provider">{children}</div>
    )
  };
});

// Mock ThemeContext with inline factory
jest.mock('../contexts/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    theme: 'dark',
    resolvedTheme: 'dark',
    toggleTheme: jest.fn(),
    setTheme: jest.fn(),
  })),
}));

// Mock Material-UI components
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    useTheme: () => ({
      palette: {
        primary: { main: '#1976d2', light: '#42a5f5' },
        secondary: { main: '#dc004e' },
        info: { main: '#0288d1' },
        warning: { main: '#ff9800' },
        error: { main: '#f44336' },
        success: { main: '#4caf50' },
        background: { paper: '#fff' },
        text: { primary: '#000', secondary: '#555' }
      },
      breakpoints: {
        down: () => false
      }
    }),
    // Mock Grid component to fix TypeScript errors
    Grid: ({ children, container, sx, ...props }: { children: React.ReactNode; container?: boolean; sx?: object }) => (
      <div data-testid={container ? "grid-container" : "grid-item"} style={sx as React.CSSProperties}>{children}</div>
    )
  };
});

// Mock Material-UI icons
jest.mock('@mui/icons-material/TrendingUp', () => () => 'TrendingUpIcon');
jest.mock('@mui/icons-material/AccountBalance', () => () => 'AccountBalanceIcon');
jest.mock('@mui/icons-material/ExpandMore', () => () => 'ExpandMoreIcon');
jest.mock('@mui/icons-material/ExpandLess', () => () => 'ExpandLessIcon');
jest.mock('@mui/icons-material/ForestOutlined', () => () => 'ForestOutlinedIcon');
jest.mock('@mui/icons-material/NatureOutlined', () => () => 'NatureOutlinedIcon');
jest.mock('@mui/icons-material/WbSunnyOutlined', () => () => 'WbSunnyOutlinedIcon');
jest.mock('@mui/icons-material/WaterOutlined', () => () => 'WaterOutlinedIcon');
jest.mock('@mui/icons-material/BarChart', () => () => 'BarChartIcon');
jest.mock('@mui/icons-material/ShowChart', () => () => 'ShowChartIcon');
jest.mock('@mui/icons-material/RecyclingOutlined', () => () => 'RecyclingOutlinedIcon');
jest.mock('@mui/icons-material/FilterList', () => () => 'FilterListIcon');
jest.mock('@mui/icons-material/CalculateOutlined', () => () => 'CalculateOutlinedIcon');
jest.mock('@mui/icons-material/CompareArrows', () => () => 'CompareArrowsIcon');
jest.mock('@mui/icons-material/Home', () => () => 'HomeIcon');
jest.mock('@mui/icons-material/ShoppingCart', () => () => 'ShoppingCartIcon');
jest.mock('@mui/icons-material/WaterDrop', () => () => 'WaterDropIcon');
jest.mock('@mui/icons-material/Check', () => () => 'CheckIcon');

describe('YieldStrategyPage', () => {
  it('renders without crashing', () => {
    render(
      <YieldStrategyProvider>
        <YieldStrategyPage />
      </YieldStrategyProvider>
    );

    expect(screen.getByText('Yield Strategy Marketplace')).toBeInTheDocument();
  });

  it('displays tabs for All Strategies and My Strategies', () => {
    render(
      <YieldStrategyProvider>
        <YieldStrategyPage />
      </YieldStrategyProvider>
    );

    expect(screen.getByText('All Strategies')).toBeInTheDocument();
    expect(screen.getByText('My Strategies')).toBeInTheDocument();
  });

  it('displays strategy cards when strategies are available', () => {
    render(
      <YieldStrategyProvider>
        <YieldStrategyPage />
      </YieldStrategyProvider>
    );

    expect(screen.getByText('Test Strategy')).toBeInTheDocument();
    expect(screen.getByText('Strategy for testing')).toBeInTheDocument();
  });

  it('can switch between tabs', () => {
    render(
      <YieldStrategyProvider>
        <YieldStrategyPage />
      </YieldStrategyProvider>
    );

    // Initial tab should be "All Strategies"
    expect(screen.getByText('Test Strategy')).toBeInTheDocument();

    // Click on "My Strategies" tab
    fireEvent.click(screen.getByText('My Strategies'));

    // Should show the user strategies table
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
