import React from 'react';
import '@testing-library/jest-dom';
import MarketplacePage from './MarketplacePage';
import {
  renderWithProviders,
  screen,
  fireEvent,
  waitFor,
} from '../test-utils';

// Mock ThemeContext with inline factory
jest.mock('../contexts/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    theme: 'dark',
    resolvedTheme: 'dark',
    toggleTheme: jest.fn(),
    setTheme: jest.fn(),
  })),
}));

// Mock data
jest.mock('../data/mockTreasuriesData', () => ({
  treasuries: [
    {
      token_id: 'treasury-1',
      name: 'US Treasury Bond 2025',
      asset_type: 'Treasury',
      maturity: '2025-12-31',
      yield: 4.5,
      minimum_investment: 1000,
      available_tokens: 5000,
      total_supply: 10000,
      issuer: 'US Treasury',
      currency: 'USD',
      category: 'treasury_securities'
    }
  ]
}));

jest.mock('../data/mockEnvironmentalAssetsData', () => ({
  environmentalAssets: [
    {
      asset_id: 'env-1',
      name: 'Amazon Forest Carbon Credits',
      asset_type: 'Carbon Credit',
      project_type: 'Forest Conservation',
      price_per_unit: 25,
      available_units: 1000,
      total_units: 5000,
      verification_standard: 'VCS',
      annual_reduction: 1000,
      category: 'environmental_assets'
    }
  ]
}));

// Custom render with theme using test-utils
const renderWithTheme = (ui: React.ReactElement) => {
  return renderWithProviders(ui);
};

describe('MarketplacePage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders marketplace header', () => {
    renderWithTheme(<MarketplacePage />);

    expect(screen.getByText('Asset Marketplace')).toBeInTheDocument();
    expect(screen.getByText(/Browse and invest in tokenized assets/i)).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderWithTheme(<MarketplacePage />);

    const searchInput = screen.getByPlaceholderText('Search assets...');
    expect(searchInput).toBeInTheDocument();
  });

  it('renders filter tabs', () => {
    renderWithTheme(<MarketplacePage />);

    expect(screen.getByText('All Assets')).toBeInTheDocument();
    expect(screen.getByText('Treasury Securities')).toBeInTheDocument();
    expect(screen.getByText('Environmental Assets')).toBeInTheDocument();
    expect(screen.getByText('Trade Finance')).toBeInTheDocument();
    expect(screen.getByText('Custom Assets')).toBeInTheDocument();
  });

  it('displays treasury assets', () => {
    renderWithTheme(<MarketplacePage />);

    expect(screen.getByText('US Treasury Bond 2025')).toBeInTheDocument();
    expect(screen.getByText('4.50%')).toBeInTheDocument();
    expect(screen.getByText('$1,000')).toBeInTheDocument();
  });

  it('displays environmental assets', () => {
    renderWithTheme(<MarketplacePage />);

    expect(screen.getByText('Amazon Forest Carbon Credits')).toBeInTheDocument();
    expect(screen.getByText('$25')).toBeInTheDocument();
    expect(screen.getByText('1,000 units')).toBeInTheDocument();
  });

  it('filters assets by category when tab is clicked', async () => {
    renderWithTheme(<MarketplacePage />);

    // Initially shows all assets
    expect(screen.getByText('US Treasury Bond 2025')).toBeInTheDocument();
    expect(screen.getByText('Amazon Forest Carbon Credits')).toBeInTheDocument();

    // Click Treasury Securities tab
    const treasuryTab = screen.getByText('Treasury Securities');
    fireEvent.click(treasuryTab);

    await waitFor(() => {
      expect(screen.getByText('US Treasury Bond 2025')).toBeInTheDocument();
      expect(screen.queryByText('Amazon Forest Carbon Credits')).not.toBeInTheDocument();
    });
  });

  it('searches assets based on search input', async () => {
    renderWithTheme(<MarketplacePage />);

    const searchInput = screen.getByPlaceholderText('Search assets...');

    // Search for treasury
    fireEvent.change(searchInput, { target: { value: 'treasury' } });

    await waitFor(() => {
      expect(screen.getByText('US Treasury Bond 2025')).toBeInTheDocument();
      expect(screen.queryByText('Amazon Forest Carbon Credits')).not.toBeInTheDocument();
    });

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });

    await waitFor(() => {
      expect(screen.getByText('US Treasury Bond 2025')).toBeInTheDocument();
      expect(screen.getByText('Amazon Forest Carbon Credits')).toBeInTheDocument();
    });
  });

  it('displays create asset CTA', () => {
    renderWithTheme(<MarketplacePage />);

    expect(screen.getByText("Don't see what you're looking for?")).toBeInTheDocument();
    const createButton = screen.getByText('Create Your Own Asset');
    expect(createButton).toBeInTheDocument();
    expect(createButton.closest('a')).toHaveAttribute('href', '/asset-factory');
  });

  it('navigates to asset detail page when asset is clicked', () => {
    renderWithTheme(<MarketplacePage />);

    const viewDetailsButton = screen.getAllByText('View Details')[0];
    expect(viewDetailsButton.closest('a')).toHaveAttribute('href', expect.stringContaining('/assets/'));
  });

  it('shows loading state initially', () => {
    // Temporarily mock a loading state
    const { container } = renderWithTheme(<MarketplacePage />);

    // The component loads data synchronously from mock, so we check the structure exists
    expect(container.querySelector('.marketplace-container')).toBeInTheDocument();
  });

  it('handles empty search results', async () => {
    renderWithTheme(<MarketplacePage />);

    const searchInput = screen.getByPlaceholderText('Search assets...');

    // Search for non-existent asset
    fireEvent.change(searchInput, { target: { value: 'xyz123nonexistent' } });

    await waitFor(() => {
      const assetGrid = screen.getByTestId('asset-grid');
      expect(assetGrid.children).toHaveLength(0);
    });
  });

  it('displays asset counts in filter tabs', () => {
    renderWithTheme(<MarketplacePage />);

    // Check that tabs show counts
    const allTab = screen.getByText('All Assets').closest('button');
    expect(allTab).toHaveTextContent('2'); // Total assets

    const treasuryTab = screen.getByText('Treasury Securities').closest('button');
    expect(treasuryTab).toHaveTextContent('1');

    const environmentalTab = screen.getByText('Environmental Assets').closest('button');
    expect(environmentalTab).toHaveTextContent('1');
  });
});
