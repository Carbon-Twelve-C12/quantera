import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { treasuries as MOCK_TREASURIES } from '../data/mockTreasuriesData.js';
import { environmentalAssets as MOCK_ENVIRONMENTAL_ASSETS } from '../data/mockEnvironmentalAssetsData.js';

// Combined asset type for display
interface DisplayAsset {
  id: string;
  name: string;
  description: string;
  price: string;
  yield_rate?: number;
  image_url: string;
  asset_type: string;
  token_address?: string;
  maturity_date?: number;
  status?: string;
  change_24h?: string;
}

const MarketplacePage: React.FC = () => {
  // State
  const [displayAssets, setDisplayAssets] = useState<DisplayAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<DisplayAsset[]>([]);
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Load and combine assets on mount
  useEffect(() => {
    // Convert treasury data to display format
    const treasuryAssets: DisplayAsset[] = MOCK_TREASURIES.map(treasury => ({
      id: treasury.token_id || '',
      name: treasury.name || '',
      description: treasury.description.substring(0, 120) + '...',
      price: treasury.current_price || '',
      yield_rate: treasury.yield_rate,
      image_url: treasury.treasury_type === 'tbill' 
        ? '/images/assets/treasury-bill.jpg' 
        : treasury.treasury_type === 'tnote' 
        ? '/images/assets/treasury-note.jpg'
        : treasury.treasury_type === 'tbond'
        ? '/images/assets/treasury-bond.jpg'
        : treasury.treasury_type === 'moneymarket'
        ? '/images/assets/money-market-fund.jpg'
        : treasury.treasury_type === 'realestate'
        ? '/images/assets/real-estate.jpg'
        : treasury.treasury_type === 'tradefinance'
        ? '/images/assets/trade-finance.jpg'
        : `/images/treasury-${treasury.treasury_type || 'default'}.jpg`,
      asset_type: treasury.treasury_type || '',
      token_address: treasury.token_address || '',
      maturity_date: treasury.maturity_date,
      status: treasury.status || '',
    }));

    // Convert environmental assets to display format
    const environmentalAssets: DisplayAsset[] = MOCK_ENVIRONMENTAL_ASSETS.map(asset => ({
      id: asset.asset_id,
      name: asset.project_name,
      description: asset.description.substring(0, 120) + '...',
      price: asset.price_per_unit,
      image_url: asset.image_url,
      asset_type: asset.asset_type,
      token_address: asset.security_details.contract_address,
      change_24h: asset.change_24h,
    }));

    // Combine all assets
    const allAssets = [...treasuryAssets, ...environmentalAssets];
    setDisplayAssets(allAssets);
    setFilteredAssets(allAssets);
    setLoading(false);
  }, []);

  // Filter and sort assets when filters change
  useEffect(() => {
    let result = [...displayAssets];

    // Apply asset type filter
    if (assetTypeFilter !== 'all') {
      result = result.filter(asset => asset.asset_type.toLowerCase() === assetTypeFilter.toLowerCase());
    }

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        asset => 
          asset.name.toLowerCase().includes(term) || 
          asset.description.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortBy === 'price') {
        const priceA = parseFloat(a.price);
        const priceB = parseFloat(b.price);
        return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
      } else if (sortBy === 'yield' && a.yield_rate && b.yield_rate) {
        return sortOrder === 'asc' ? a.yield_rate - b.yield_rate : b.yield_rate - a.yield_rate;
      }
      return 0;
    });

    setFilteredAssets(result);
  }, [displayAssets, assetTypeFilter, sortBy, sortOrder, searchTerm]);

  // Format date from timestamp
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Format yield rate
  const formatYield = (yieldRate?: number) => {
    if (!yieldRate && yieldRate !== 0) return 'N/A';
    return `${(yieldRate / 100).toFixed(2)}%`;
  };

  // Get asset type display name
  const getAssetTypeDisplayName = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'tbill': return 'Treasury Bill';
      case 'tnote': return 'Treasury Note';
      case 'tbond': return 'Treasury Bond';
      case 'moneymarket': return 'Money Market Fund';
      case 'realestate': return 'Real Estate';
      case 'tradefinance': return 'Trade Finance';
      case 'carboncredit': return 'Carbon Credit';
      case 'biodiversitycredit': return 'Biodiversity Credit';
      case 'watercredit': return 'Water Credit';
      case 'renewableenergycertificate': return 'Renewable Energy Certificate';
      default: return type;
    }
  };

  // Asset type options
  const assetTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'tbill', label: 'Treasury Bills' },
    { value: 'tnote', label: 'Treasury Notes' },
    { value: 'tbond', label: 'Treasury Bonds' },
    { value: 'moneymarket', label: 'Money Market Funds' },
    { value: 'realestate', label: 'Real Estate' },
    { value: 'tradefinance', label: 'Trade Finance' },
    { value: 'CarbonCredit', label: 'Carbon Credits' },
    { value: 'BiodiversityCredit', label: 'Biodiversity Credits' },
    { value: 'WaterCredit', label: 'Water Credits' },
    { value: 'RenewableEnergyCertificate', label: 'Renewable Energy Certificates' },
  ];

  // Fallback image for assets without images
  const fallbackImage = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = "/images/asset-placeholder.jpg";
  };

  if (loading) {
    return <div className="loading">Loading marketplace assets...</div>;
  }

  return (
    <div className="marketplace">
      <div className="marketplace-header">
        <h1>Quantera Marketplace</h1>
        <p className="marketplace-description">
          Browse and invest in tokenized financial products and environmental assets with transparent impact metrics.
        </p>
      </div>

      {/* Featured Categories Section */}
      <div className="featured-categories">
        <h2>Featured Asset Categories</h2>
        <div className="category-cards">
          <div className="category-card">
            <div className="category-image">
              <img src="/images/assets/treasury-bill.jpg" alt="Treasury Securities" />
            </div>
            <h3>Treasury Securities</h3>
            <p>Tokenized government securities with yield optimization</p>
            <Link to="/marketplace" className="category-link">Browse Treasury Assets</Link>
          </div>
          
          <div className="category-card">
            <div className="category-image">
              <img src="/images/assets/trade-finance.jpg" alt="Trade Finance" onError={(e) => e.currentTarget.src = "/images/asset-placeholder.jpg"} />
            </div>
            <h3>Trade Finance</h3>
            <p>Letters of credit, invoice receivables, and supply chain finance assets</p>
            <Link to="/tradefinance/marketplace" className="category-link">Explore Trade Finance</Link>
          </div>
          
          <div className="category-card">
            <div className="category-image">
              <img src="/images/assets/real-estate.jpg" alt="Real Estate" onError={(e) => e.currentTarget.src = "/images/asset-placeholder.jpg"} />
            </div>
            <h3>Real Estate</h3>
            <p>Fractional ownership in commercial and residential properties</p>
            <Link to="/realestate/marketplace" className="category-link">View Real Estate</Link>
          </div>
          
          <div className="category-card">
            <div className="category-image">
              <img src="/images/assets/carbon-credit.jpg" alt="Environmental Assets" onError={(e) => e.currentTarget.src = "/images/asset-placeholder.jpg"} />
            </div>
            <h3>Environmental Assets</h3>
            <p>Carbon credits, biodiversity credits and renewable energy certificates</p>
            <Link to="/environmental/marketplace" className="category-link">View Environmental Assets</Link>
          </div>
        </div>
      </div>

      <div className="marketplace-filters">
        <div className="filter-group">
          <label htmlFor="asset-type">Asset Type</label>
          <select 
            id="asset-type" 
            value={assetTypeFilter}
            onChange={(e) => setAssetTypeFilter(e.target.value)}
          >
            {assetTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="sort-by">Sort By</label>
          <select 
            id="sort-by" 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="yield">Yield</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="sort-order">Order</label>
          <select 
            id="sort-order" 
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        <div className="filter-group search-group">
          <label htmlFor="search">Search</label>
          <input
            id="search"
            type="text"
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="assets-stats">
        <p>Showing {filteredAssets.length} of {displayAssets.length} assets</p>
      </div>

      <div className="assets-grid">
        {filteredAssets.length > 0 ? (
          filteredAssets.map((asset) => (
            <Link to={`/assets/${asset.id}`} key={asset.id} className="asset-card">
              <div className="asset-image-container">
                <img 
                  src={asset.image_url} 
                  alt={asset.name} 
                  className="asset-image" 
                  onError={fallbackImage}
                />
                <div className={`asset-type-badge ${asset.asset_type.toLowerCase().replace('_', '-')}`}>
                  {getAssetTypeDisplayName(asset.asset_type)}
                </div>
              </div>
              <div className="asset-content">
                <h3 className="asset-name">{asset.name}</h3>
                <p className="asset-description">{asset.description}</p>
                <div className="asset-details">
                  <div className="detail-row">
                    <span className="detail-label">Price:</span>
                    <span className="detail-value">${asset.price}</span>
                  </div>
                  
                  {asset.yield_rate !== undefined && (
                    <div className="detail-row">
                      <span className="detail-label">Yield:</span>
                      <span className="detail-value yield">{formatYield(asset.yield_rate)}</span>
                    </div>
                  )}
                  
                  {asset.change_24h && (
                    <div className="detail-row">
                      <span className="detail-label">24h Change:</span>
                      <span className={`detail-value ${asset.change_24h.startsWith('+') ? 'positive' : 'negative'}`}>
                        {asset.change_24h}
                      </span>
                    </div>
                  )}
                  
                  {asset.maturity_date && (
                    <div className="detail-row">
                      <span className="detail-label">Maturity:</span>
                      <span className="detail-value">{formatDate(asset.maturity_date)}</span>
                    </div>
                  )}
                  
                  {asset.status && (
                    <div className="detail-row">
                      <span className="detail-label">Status:</span>
                      <span className={`detail-value status-${asset.status.toLowerCase()}`}>
                        {asset.status}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="no-results">
            <p>No assets found matching your filters. Try adjusting your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplacePage; 