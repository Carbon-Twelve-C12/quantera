import React from 'react';
import '@testing-library/jest-dom';
import { TreasuryList } from './index';
import { treasuryService } from '../api/treasuryService';
import {
  renderWithProviders,
  screen,
  fireEvent,
  waitFor,
} from '../test-utils';

// Mock the treasury service
jest.mock('../api/treasuryService', () => ({
  treasuryService: {
    listTreasuries: jest.fn(),
  },
}));

// Mock data
const mockTreasuries = [
  {
    token_id: '1',
    name: 'Treasury 1',
    symbol: 'T1',
    treasury_type: 'tbill',
    current_price: '100.00',
    yield_rate: 305,
    maturity_date: Math.floor(new Date('2023-12-31').getTime() / 1000),
    status: 'Active',
  },
  {
    token_id: '2',
    name: 'Treasury 2',
    symbol: 'T2',
    treasury_type: 'tnote',
    current_price: '200.00',
    yield_rate: 287,
    maturity_date: Math.floor(new Date('2024-06-30').getTime() / 1000),
    status: 'Pending',
  },
];

describe('TreasuryList Component', () => {
  beforeEach(() => {
    // Reset mock and set default implementation
    jest.clearAllMocks();
    (treasuryService.listTreasuries as jest.Mock).mockResolvedValue(mockTreasuries);
  });

  test('renders loading state initially', () => {
    renderWithProviders(<TreasuryList />);
    expect(screen.getByText(/loading treasuries/i)).toBeInTheDocument();
  });

  test('renders treasuries after loading', async () => {
    renderWithProviders(<TreasuryList />);

    // Wait for treasuries to load
    await waitFor(() => {
      expect(screen.queryByText(/loading treasuries/i)).not.toBeInTheDocument();
    });

    // Check if treasuries are rendered
    expect(screen.getByText('Treasury 1')).toBeInTheDocument();
    expect(screen.getByText('Treasury 2')).toBeInTheDocument();
  });

  test('filters treasuries by type', async () => {
    // Set up mock implementation for filtered data
    const filteredMockTreasuries = [mockTreasuries[0]]; // Only the tbill
    (treasuryService.listTreasuries as jest.Mock)
      .mockResolvedValueOnce(mockTreasuries)
      .mockResolvedValueOnce(filteredMockTreasuries);

    renderWithProviders(<TreasuryList />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('Treasury 1')).toBeInTheDocument();
    });

    // Change type filter to tbill
    fireEvent.change(screen.getByLabelText(/type:/i), { target: { value: 'tbill' } });

    // Check if filter was applied correctly
    await waitFor(() => {
      expect(treasuryService.listTreasuries).toHaveBeenCalledWith('tbill', undefined, undefined, 10, 0);
    });
  });

  test('handles error state', async () => {
    // Mock error response
    (treasuryService.listTreasuries as jest.Mock).mockRejectedValue(new Error('Failed to load treasuries'));

    renderWithProviders(<TreasuryList />);

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/failed to load treasuries/i)).toBeInTheDocument();
    });
  });

  test('shows empty state when no data', async () => {
    // Mock empty response
    (treasuryService.listTreasuries as jest.Mock).mockResolvedValue([]);

    renderWithProviders(<TreasuryList />);

    // Check if empty state is displayed
    await waitFor(() => {
      expect(screen.getByText(/no treasuries found/i)).toBeInTheDocument();
    });
  });

  test('pagination works correctly', async () => {
    renderWithProviders(<TreasuryList initialLimit={1} />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('Treasury 1')).toBeInTheDocument();
    });

    // Click next page button
    fireEvent.click(screen.getByText('Next'));

    // Check if second page was requested
    await waitFor(() => {
      expect(treasuryService.listTreasuries).toHaveBeenCalledWith(undefined, undefined, undefined, 1, 1);
    });
  });
});
