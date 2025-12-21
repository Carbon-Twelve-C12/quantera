import React from 'react';
import '@testing-library/jest-dom';
import LiquidityPoolPage from './LiquidityPoolPage';
import { LiquidityPoolProvider } from '../contexts/__mocks__/LiquidityPoolContext';
import {
  render,
  screen,
} from '../test-utils';

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

// Mock contexts - Jest will use __mocks__ versions
jest.mock('../contexts/ThemeContext');
jest.mock('../contexts/WalletContext');
jest.mock('../contexts/LiquidityPoolContext');

describe('LiquidityPoolPage', () => {
  it('renders without crashing', () => {
    render(
      <LiquidityPoolProvider>
        <LiquidityPoolPage />
      </LiquidityPoolProvider>
    );

    expect(screen.getByText('Liquidity Pool Management')).toBeInTheDocument();
  });

  it('displays the pools tab by default', () => {
    render(
      <LiquidityPoolProvider>
        <LiquidityPoolPage />
      </LiquidityPoolProvider>
    );

    expect(screen.getByText('Available Pools')).toBeInTheDocument();
  });

  it('displays a message when no pools are available', () => {
    render(
      <LiquidityPoolProvider>
        <LiquidityPoolPage />
      </LiquidityPoolProvider>
    );

    expect(screen.getByText('No pools available.')).toBeInTheDocument();
  });
}); 