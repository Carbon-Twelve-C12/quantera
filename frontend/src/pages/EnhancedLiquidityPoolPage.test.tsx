import React from 'react';
import '@testing-library/jest-dom';
import EnhancedLiquidityPoolPage from './EnhancedLiquidityPoolPage';
import { LiquidityPoolProvider } from '../contexts/LiquidityPoolContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { WalletProvider } from '../contexts/WalletContext';
import {
  render,
  screen,
} from '../test-utils';

// Mock the chart.js implementation
jest.mock('chart.js/auto', () => ({
  __esModule: true,
  default: class MockChart {
    constructor() {}
    destroy() {}
  }
}));

// Mock the react-chartjs-2 component
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mock-line-chart">Chart Placeholder</div>
}));

// Mock the components we created
jest.mock('../components/common/PriceRangeSelector', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-price-range-selector">Price Range Selector</div>
}));

jest.mock('../components/common/LiquidityChart', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-liquidity-chart">Liquidity Chart</div>
}));

jest.mock('../components/common/LiquidityPositionSimulator', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-position-simulator">Position Simulator</div>
}));

// Setup the test
describe('EnhancedLiquidityPoolPage', () => {
  const renderWithProviders = () => {
    return render(
      <ThemeProvider>
        <WalletProvider>
          <LiquidityPoolProvider>
            <EnhancedLiquidityPoolPage />
          </LiquidityPoolProvider>
        </WalletProvider>
      </ThemeProvider>
    );
  };

  test('renders the page title', () => {
    renderWithProviders();
    const titleElement = screen.getByText(/Liquidity Pool Management/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('displays tabs for pools and positions', () => {
    renderWithProviders();
    expect(screen.getByText('All Pools')).toBeInTheDocument();
    expect(screen.getByText('My Positions')).toBeInTheDocument();
  });

  test('shows create pool button', () => {
    renderWithProviders();
    expect(screen.getByText('Create New Pool')).toBeInTheDocument();
  });
}); 