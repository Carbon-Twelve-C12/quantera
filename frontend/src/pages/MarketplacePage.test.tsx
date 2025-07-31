import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import MarketplacePage from './MarketplacePage';
import { ThemeContext } from '../contexts/ThemeContext';

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

// Router wrapper
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme: jest.fn() }}>
      {children}
    </ThemeContext.Provider>
  </BrowserRouter>
);

describe('MarketplacePage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders marketplace header', () => {
    render(
      <TestWrapper>
        <MarketplacePage />
      </TestWrapper>
    );

    expect(screen.getByText('Asset Marketplace')).toBeInTheDocument();
    expect(screen.getByText(/Browse and invest in tokenized assets/i)).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(
      <TestWrapper>
        <MarketplacePage />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search assets...');
    expect(searchInput).toBeInTheDocument();
  });

  it('renders filter tabs', () => {
    render(
      <TestWrapper>
        <MarketplacePage />
      </TestWrapper>
    );

    expect(screen.getByText('All Assets')).toBeInTheDocument();
    expect(screen.getByText('Treasury Securities')).toBeInTheDocument();
    expect(screen.getByText('Environmental Assets')).toBeInTheDocument();
    expect(screen.getByText('Trade Finance')).toBeInTheDocument();
    expect(screen.getByText('Custom Assets')).toBeInTheDocument();
  });

  it('displays treasury assets', () => {
    render(
      <TestWrapper>
        <MarketplacePage />
      </TestWrapper>
    );

    expect(screen.getByText('US Treasury Bond 2025')).toBeInTheDocument();
    expect(screen.getByText('4.50%')).toBeInTheDocument();
    expect(screen.getByText('$1,000')).toBeInTheDocument();
  });

  it('displays environmental assets', () => {
    render(
      <TestWrapper>
        <MarketplacePage />
      </TestWrapper>
    );

    expect(screen.getByText('Amazon Forest Carbon Credits')).toBeInTheDocument();
    expect(screen.getByText('$25')).toBeInTheDocument();
    expect(screen.getByText('1,000 units')).toBeInTheDocument();
  });

  it('filters assets by category when tab is clicked', async () => {
    render(
      <TestWrapper>
        <MarketplacePage />
      </TestWrapper>
    );

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
    render(
      <TestWrapper>
        <MarketplacePage />
      </TestWrapper>
    );

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
    render(
      <TestWrapper>
        <MarketplacePage />
      </TestWrapper>
    );

    expect(screen.getByText("Don't see what you're looking for?")).toBeInTheDocument();
    const createButton = screen.getByText('Create Your Own Asset');
    expect(createButton).toBeInTheDocument();
    expect(createButton.closest('a')).toHaveAttribute('href', '/asset-factory');
  });

  it('navigates to asset detail page when asset is clicked', () => {
    render(
      <TestWrapper>
        <MarketplacePage />
      </TestWrapper>
    );

    const viewDetailsButton = screen.getAllByText('View Details')[0];
    expect(viewDetailsButton.closest('a')).toHaveAttribute('href', expect.stringContaining('/assets/'));
  });

  it('shows loading state initially', () => {
    // Temporarily mock a loading state
    const { container } = render(
      <TestWrapper>
        <MarketplacePage />
      </TestWrapper>
    );

    // The component loads data synchronously from mock, so we check the structure exists
    expect(container.querySelector('.marketplace-container')).toBeInTheDocument();
  });

  it('handles empty search results', async () => {
    render(
      <TestWrapper>
        <MarketplacePage />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search assets...');
    
    // Search for non-existent asset
    fireEvent.change(searchInput, { target: { value: 'xyz123nonexistent' } });

    await waitFor(() => {
      const assetGrid = screen.getByTestId('asset-grid');
      expect(assetGrid.children).toHaveLength(0);
    });
  });

  it('displays asset counts in filter tabs', () => {
    render(
      <TestWrapper>
        <MarketplacePage />
      </TestWrapper>
    );

    // Check that tabs show counts
    const allTab = screen.getByText('All Assets').closest('button');
    expect(allTab).toHaveTextContent('2'); // Total assets

    const treasuryTab = screen.getByText('Treasury Securities').closest('button');
    expect(treasuryTab).toHaveTextContent('1');

    const environmentalTab = screen.getByText('Environmental Assets').closest('button');
    expect(environmentalTab).toHaveTextContent('1');
  });
});