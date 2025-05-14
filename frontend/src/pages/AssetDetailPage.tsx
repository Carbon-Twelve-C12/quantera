import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { treasuries as MOCK_TREASURIES } from '../data/mockTreasuriesData.js';
import { environmentalAssets as MOCK_ENVIRONMENTAL_ASSETS } from '../data/mockEnvironmentalAssetsData.js';
import { TreasuryDetail, EnvironmentalAsset } from '../data/assetInterfaces';
import { useTheme } from '../contexts/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import { Modal, Button, Form } from 'react-bootstrap';

// Combined type for asset details
type AssetDetail = TreasuryDetail | EnvironmentalAsset;

// Transaction fee tiers
const TRANSACTION_FEE_TIERS = {
  standard: 0.005, // 0.5%
  silver: 0.003,   // 0.3%
  gold: 0.002,     // 0.2%
  platinum: 0.001  // 0.1%
};

// User trading volume tiers (in USD)
const VOLUME_TIERS = {
  standard: 0,
  silver: 100000,    // $100k
  gold: 1000000,     // $1M
  platinum: 10000000 // $10M
};

// Purchase modal props
interface PurchaseModalProps {
  show: boolean;
  onHide: () => void;
  asset: AssetDetail;
  onPurchase: (quantity: number) => void;
  userTier: keyof typeof TRANSACTION_FEE_TIERS;
}

// Purchase modal component
const PurchaseModal: React.FC<PurchaseModalProps> = ({ 
  show, 
  onHide, 
  asset, 
  onPurchase,
  userTier
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
  const { theme } = useTheme();
  
  // Get asset name based on type
  const getAssetName = () => {
    if ('name' in asset) {
      return asset.name;
    }
    return asset.project_name;
  };
  
  // Get asset price
  const getAssetPrice = () => {
    if ('current_price' in asset) {
      return parseFloat(asset.current_price);
    }
    return parseFloat(asset.price_per_unit);
  };
  
  // Calculate subtotal
  const calculateSubtotal = () => {
    return getAssetPrice() * quantity;
  };
  
  // Calculate transaction fee
  const calculateTransactionFee = () => {
    return calculateSubtotal() * TRANSACTION_FEE_TIERS[userTier];
  };
  
  // Calculate total
  const calculateTotal = () => {
    return calculateSubtotal() + calculateTransactionFee();
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  return (
    <Modal 
      show={show} 
      onHide={onHide}
      centered
      contentClassName={theme === 'dark' ? 'bg-dark text-light' : ''}
    >
      <Modal.Header closeButton>
        <Modal.Title>Purchase Asset</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h5>{getAssetName()}</h5>
        <p className="mb-4">Complete your purchase of this tokenized asset.</p>
        
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Quantity</Form.Label>
            <Form.Control
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className={theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}
            />
          </Form.Group>
          
          <div className="cost-breakdown p-3 mb-4 border rounded">
            <h6 className="mb-3">Cost Breakdown</h6>
            
            <div className="d-flex justify-content-between mb-2">
              <span>Asset Price:</span>
              <span>{formatCurrency(getAssetPrice())}</span>
            </div>
            
            <div className="d-flex justify-content-between mb-2">
              <span>Quantity:</span>
              <span>{quantity}</span>
            </div>
            
            <div className="d-flex justify-content-between mb-2">
              <span>Subtotal:</span>
              <span>{formatCurrency(calculateSubtotal())}</span>
            </div>
            
            <div className="d-flex justify-content-between mb-2">
              <div>
                <span>Transaction Fee ({(TRANSACTION_FEE_TIERS[userTier] * 100).toFixed(2)}%):</span>
                <span className="ms-2 badge bg-info">{userTier.toUpperCase()} TIER</span>
              </div>
              <span>{formatCurrency(calculateTransactionFee())}</span>
            </div>
            
            <hr />
            
            <div className="d-flex justify-content-between fw-bold">
              <span>Total:</span>
              <span>{formatCurrency(calculateTotal())}</span>
            </div>
          </div>
          
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              id="agree-terms"
              label="I agree to the terms and conditions of this purchase"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className={theme === 'dark' ? 'text-light' : ''}
            />
          </Form.Group>
        </Form>
        
        <div className="alert alert-info">
          <small>
            <strong>Note:</strong> Transaction fees help maintain the Quantera platform and provide 
            liquidity services. Higher trading volumes qualify for reduced fee tiers.
          </small>
        </div>
        
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={() => onPurchase(quantity)}
          disabled={!agreedToTerms || quantity < 1}
        >
          Complete Purchase
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Type guards for safe property access
const hasProperty = <T extends object, K extends string>(obj: T, prop: K): obj is T & Record<K, unknown> => {
  return prop in obj;
};

// Type assertion functions to handle mock data
const asTreasuryDetail = (data: any): TreasuryDetail => data as TreasuryDetail;
const asEnvironmentalAsset = (data: any): EnvironmentalAsset => data as EnvironmentalAsset;

const AssetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [debug, setDebug] = useState<string>('');
  const { theme } = useTheme();
  const { address, connected } = useWallet();
  
  // Purchase modal state
  const [showPurchaseModal, setShowPurchaseModal] = useState<boolean>(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<boolean>(false);
  
  // Use explicit typing for tradingVolume with default value
  const tradingVolume = 120000; // Sample trading volume for demo purposes
  
  // Determine user's tier based on trading volume
  const getUserTier = (): keyof typeof TRANSACTION_FEE_TIERS => {
    if (tradingVolume >= VOLUME_TIERS.platinum) return 'platinum';
    if (tradingVolume >= VOLUME_TIERS.gold) return 'gold';
    if (tradingVolume >= VOLUME_TIERS.silver) return 'silver';
    return 'standard';
  };
  
  // Handle purchase
  const handlePurchase = (quantity: number) => {
    // In a real implementation, this would call a service to execute the purchase
    console.log(`Purchasing ${quantity} of asset ${id}`);
    setShowPurchaseModal(false);
    setPurchaseSuccess(true);
    
    // Reset success message after a delay
    setTimeout(() => {
      setPurchaseSuccess(false);
    }, 5000);
  };
  
  useEffect(() => {
    const loadAsset = async () => {
      setLoading(true);
      try {
        // First try to find it in treasuries
        const treasury = MOCK_TREASURIES.find(t => t.token_id === id);
        if (treasury) {
          setAsset(asTreasuryDetail(treasury));
          setLoading(false);
          return;
        }
        
        // Then try environmental assets
        const envAsset = MOCK_ENVIRONMENTAL_ASSETS.find(a => a.asset_id === id);
        if (envAsset) {
          setAsset(asEnvironmentalAsset(envAsset));
          setLoading(false);
          return;
        }
        
        // If we get here, asset not found
        setAsset(null);
        setDebug(`Asset not found with ID: ${id}.\nChecked treasuries (${MOCK_TREASURIES.length}) and environmental assets (${MOCK_ENVIRONMENTAL_ASSETS.length})`);
      } catch (error) {
        console.error('Error loading asset:', error);
        setDebug(`Error loading asset: ${error}`);
        setAsset(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadAsset();
  }, [id]);
  
  // Format date
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString();
  };
  
  // Format yield rate
  const formatYield = (yieldRate?: number) => {
    if (yieldRate === undefined) return 'N/A';
    return `${(yieldRate / 100).toFixed(2)}%`;
  };
  
  // Determine if this is a TreasuryDetail
  const isTreasury = (asset: AssetDetail): asset is TreasuryDetail => {
    return 'treasury_type' in asset;
  };
  
  // Determine if this is an EnvironmentalAsset
  const isEnvironmental = (asset: AssetDetail): asset is EnvironmentalAsset => {
    return 'asset_type' in asset && 'project_name' in asset;
  };
  
  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  
  // Format total supply
  const formatTotalSupply = (supply: string) => {
    return supply.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  if (loading) {
    return <div className="loading">Loading asset details...</div>;
  }
  
  if (!asset) {
    return (
      <div className="not-found">
        <h2>Asset Not Found</h2>
        <p>We couldn't find the asset you're looking for. It may have been removed or the URL is incorrect.</p>
        <pre className="debug-info" style={{ 
          background: '#f5f5f5', 
          padding: '10px', 
          border: '1px solid #ddd', 
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '12px',
          whiteSpace: 'pre-wrap',
          margin: '20px 0'
        }}>{debug}</pre>
        <Link to="/marketplace" className="button primary">Return to Marketplace</Link>
      </div>
    );
  }
  
  return (
    <div className={`asset-detail ${theme === 'dark' ? 'dark-theme' : ''}`}>
      {/* Asset header */}
      <div className="asset-header">
        <div className="asset-header-content">
          <h1>
            {isTreasury(asset) ? asset.name : asset.project_name}
            <span className="asset-type-badge">
              {isTreasury(asset) ? asset.treasury_type : asset.asset_type}
            </span>
          </h1>
          
          <div className="asset-meta">
            {isTreasury(asset) && (
              <>
                <div className="meta-item">
                  <span className="meta-label">Symbol:</span>
                  <span className="meta-value">{asset.symbol}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Yield:</span>
                  <span className="meta-value yield">{formatYield(asset.yield_rate)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Maturity:</span>
                  <span className="meta-value">{formatDate(asset.maturity_date)}</span>
                </div>
              </>
            )}
            
            {isEnvironmental(asset) && (
              <>
                <div className="meta-item">
                  <span className="meta-label">Project:</span>
                  <span className="meta-value">{asset.project_name}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Location:</span>
                  <span className="meta-value">{asset.project_location}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Standard:</span>
                  <span className="meta-value">{asset.standard}</span>
                </div>
              </>
            )}
            
            <div className="meta-item price">
              <span className="meta-label">Price:</span>
              <span className="meta-value">
                ${isTreasury(asset) ? asset.current_price : asset.price_per_unit}
              </span>
            </div>
          </div>
        </div>
        
        {hasProperty(asset, 'image_url') && asset.image_url && (
          <div className="asset-image-container">
            <img src={asset.image_url} alt={isTreasury(asset) ? asset.name : asset.project_name} className="asset-image" />
          </div>
        )}
      </div>
      
      {/* Purchase success message */}
      {purchaseSuccess && (
        <div className="purchase-success">
          <div className="success-message">
            <span className="success-icon">✓</span>
            <span className="success-text">Purchase completed successfully!</span>
          </div>
        </div>
      )}
      
      {/* Asset tabs */}
      <div className="asset-tabs">
        <div className="tab-headers">
          <button 
            className={`tab-header ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleTabChange('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-header ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => handleTabChange('details')}
          >
            Details
          </button>
          <button 
            className={`tab-header ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => handleTabChange('documents')}
          >
            Documents
          </button>
          {isEnvironmental(asset) && (
            <button 
              className={`tab-header ${activeTab === 'impact' ? 'active' : ''}`}
              onClick={() => handleTabChange('impact')}
            >
              Impact
            </button>
          )}
          <button 
            className={`tab-header ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => handleTabChange('performance')}
          >
            Performance
          </button>
        </div>
        
        <div className="tab-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="description-section">
                <h2>Description</h2>
                <p>{asset.description}</p>
              </div>
              
              {isTreasury(asset) && (
                <div className="treasury-info">
                  <h3>Issuer Information</h3>
                  <p className="issuer-description">{asset.issuer_description}</p>
                  
                  <div className="info-grid">
                    <div className="info-item">
                      <div className="info-label">Issuer</div>
                      <div className="info-value">{asset.issuer}</div>
                    </div>
                    
                    <div className="info-item">
                      <div className="info-label">Auction Date</div>
                      <div className="info-value">{formatDate(asset.auction_date)}</div>
                    </div>
                    
                    <div className="info-item">
                      <div className="info-label">Settlement Date</div>
                      <div className="info-value">{formatDate(asset.settlement_date)}</div>
                    </div>
                    
                    <div className="info-item">
                      <div className="info-label">Face Value</div>
                      <div className="info-value">${asset.face_value}</div>
                    </div>
                    
                    <div className="info-item">
                      <div className="info-label">Minimum Bid</div>
                      <div className="info-value">${asset.minimum_bid}</div>
                    </div>
                    
                    <div className="info-item">
                      <div className="info-label">Issuance Size</div>
                      <div className="info-value">
                        ${parseInt(asset.issuance_size).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {isEnvironmental(asset) && (
                <div className="project-info">
                  <h3>Project Information</h3>
                  <p className="project-description">{hasProperty(asset, 'project_description') ? asset.project_description : asset.description}</p>
                  
                  <div className="info-grid">
                    <div className="info-item">
                      <div className="info-label">Project Developer</div>
                      <div className="info-value">{asset.project_developer}</div>
                    </div>
                    
                    <div className="info-item">
                      <div className="info-label">Methodology</div>
                      <div className="info-value">{asset.methodology}</div>
                    </div>
                    
                    <div className="info-item">
                      <div className="info-label">Registry</div>
                      <div className="info-value">
                        <a href={asset.registry_link} target="_blank" rel="noopener noreferrer">
                          View on Registry
                        </a>
                      </div>
                    </div>
                    
                    <div className="info-item">
                      <div className="info-label">Issuance Date</div>
                      <div className="info-value">{formatDate(asset.issuance_date)}</div>
                    </div>
                    
                    <div className="info-item">
                      <div className="info-label">Expiration</div>
                      <div className="info-value">{formatDate(asset.expiration_date)}</div>
                    </div>
                    
                    <div className="info-item">
                      <div className="info-label">Available Supply</div>
                      <div className="info-value">
                        {parseInt(asset.available_supply).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  {hasProperty(asset, 'co_benefits') && asset.co_benefits && (
                    <div className="co-benefits">
                      <h4>Co-Benefits</h4>
                      <ul className="benefits-list">
                        {asset.co_benefits.map((benefit, index) => (
                          <li key={index} className="benefit-item">{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="details-tab">
              {isTreasury(asset) && (
                <div className="details-section">
                  <h3>Treasury Details</h3>
                  
                  <div className="detail-grid">
                    <div className="detail-item">
                      <div className="detail-label">Token ID</div>
                      <div className="detail-value">{asset.token_id}</div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">Token Address</div>
                      <div className="detail-value address">{asset.token_address}</div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">Treasury Type</div>
                      <div className="detail-value">{asset.treasury_type}</div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">Total Supply</div>
                      <div className="detail-value">
                        {parseInt(asset.total_supply).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">Yield Rate</div>
                      <div className="detail-value">{formatYield(asset.yield_rate)}</div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">Custody Fee</div>
                      <div className="detail-value">{asset.custody_fee}% per annum</div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">Liquidity Rating</div>
                      <div className="detail-value">{asset.liquidity_rating}</div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">Risk Rating</div>
                      <div className="detail-value">{asset.risk_rating}</div>
                    </div>
                  </div>
                </div>
              )}
              
              {isEnvironmental(asset) && (
                <div className="details-section">
                  <div className="detail-grid">
                    <div className="detail-item">
                      <div className="detail-label">Asset ID</div>
                      <div className="detail-value">{asset.asset_id}</div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">Asset Type</div>
                      <div className="detail-value">{asset.asset_type}</div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">Project ID</div>
                      <div className="detail-value">{asset.project_id}</div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">Registry</div>
                      <div className="detail-value">
                        <a href={asset.registry_link} target="_blank" rel="noopener noreferrer">
                          View on Registry
                        </a>
                      </div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">Issuance Date</div>
                      <div className="detail-value">{formatDate(asset.issuance_date)}</div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">Expiration Date</div>
                      <div className="detail-value">{formatDate(asset.expiration_date)}</div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">Total Supply</div>
                      <div className="detail-value">
                        {parseInt(asset.total_supply).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">Available Supply</div>
                      <div className="detail-value">{parseInt(asset.available_supply).toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div className="security-details">
                    <h3>Security Details</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <div className="detail-label">Token Standard</div>
                        <div className="detail-value">{asset.security_details.token_standard}</div>
                      </div>
                      
                      <div className="detail-item">
                        <div className="detail-label">Contract Address</div>
                        <div className="detail-value address">{asset.security_details.contract_address}</div>
                      </div>
                      
                      <div className="detail-item">
                        <div className="detail-label">Blockchain</div>
                        <div className="detail-value">{asset.security_details.blockchain}</div>
                      </div>
                      
                      <div className="detail-item">
                        <div className="detail-label">Token ID</div>
                        <div className="detail-value">{asset.security_details.token_id}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="documents-tab">
              <h3>Documentation & Resources</h3>
              
              {isTreasury(asset) && asset.documents && (
                <div className="documents-list">
                  {asset.documents.map((doc, index) => (
                    <a 
                      key={index}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="document-item"
                    >
                      <div className="document-icon">
                        {doc.type === 'PDF' && <span className="pdf-icon">PDF</span>}
                        {doc.type === 'DOC' && <span className="doc-icon">DOC</span>}
                        {doc.type === 'TXT' && <span className="txt-icon">TXT</span>}
                      </div>
                      <div className="document-info">
                        <div className="document-name">{doc.name}</div>
                        <div className="document-meta">
                          <span className="document-type">{doc.type}</span>
                          <span className="document-size">{doc.size_kb} KB</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
              
              {isEnvironmental(asset) && asset.certification_documents && (
                <div className="documents-list">
                  {asset.certification_documents.map((doc, index) => (
                    <a 
                      key={index}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="document-item"
                    >
                      <div className="document-icon">
                        <span className="pdf-icon">PDF</span>
                      </div>
                      <div className="document-info">
                        <div className="document-name">{doc.name}</div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Impact Tab (only for environmental assets) */}
          {activeTab === 'impact' && isEnvironmental(asset) && (
            <div className="impact-tab">
              <h3>Environmental Impact</h3>
              
              <div className="impact-metrics">
                {(Array.isArray(asset.impact_metrics) ? asset.impact_metrics : []).map((metric: any, index: number) => (
                  <div key={index} className="metric-card">
                    <div className="metric-icon">
                      {/* Placeholder for an icon */}
                      <span className="icon">🌍</span>
                    </div>
                    <div className="metric-content">
                      <div className="metric-value">{metric.value}</div>
                      <div className="metric-label">{metric.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              {isEnvironmental(asset) && hasProperty(asset, 'sdg_alignment') && asset.sdg_alignment && (
                <div className="sdg-alignment">
                  <h4>Sustainable Development Goals</h4>
                  <div className="sdg-icons">
                    {asset.sdg_alignment.map((sdg: number, index: number) => (
                      <div key={index} className="sdg-icon-wrapper" title={`SDG ${sdg}: ${getSdgName(sdg)}`}>
                        <img 
                          src={`/images/sdg/sdg-${sdg}.png`} 
                          alt={`SDG ${sdg}`}
                          className="sdg-icon"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {isEnvironmental(asset) && hasProperty(asset, 'project_updates') && asset.project_updates && (
                <div className="project-updates">
                  <h4>Project Updates</h4>
                  
                  {asset.project_updates.map((update: any, index: number) => (
                    <div key={index} className="update-item">
                      <div className="update-content">
                        <div>
                          <h3 className="update-title">{update.title}</h3>
                          <div>
                            {formatDate(update.date)}
                          </div>
                        </div>
                        <p className="update-text">{update.content}</p>
                        <div className="update-author">- {update.author}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="performance-tab">
              <h3>Performance Analysis</h3>
              
              {isTreasury(asset) && (
                <div className="price-history">
                  <h4>Price History</h4>
                  {/* Placeholder for chart */}
                  <div className="chart-placeholder">
                    Historical price chart would be displayed here
                  </div>
                  
                  <h4>Recent Trades</h4>
                  <div className="recent-trades">
                    <table className="trades-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Quantity</th>
                          <th>Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {asset.recent_trades.map((trade, index) => (
                          <tr key={index} className={`trade-${trade.type.toLowerCase()}`}>
                            <td>{formatDate(trade.date)}</td>
                            <td className={`trade-type ${trade.type.toLowerCase()}`}>
                              {trade.type}
                            </td>
                            <td>{parseInt(trade.quantity).toLocaleString()}</td>
                            <td>${trade.price}</td>
                            <td>
                              ${(parseFloat(trade.quantity) * parseFloat(trade.price)).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {isEnvironmental(asset) && (
                <div className="price-history">
                  <h4>Price History</h4>
                  {/* Placeholder for chart */}
                  <div className="chart-placeholder">
                    Historical price chart would be displayed here
                  </div>
                  
                  <h4>Market Statistics</h4>
                  <div className="market-stats">
                    <div className="stat-item">
                      <div className="stat-label">24h Volume</div>
                      <div className="stat-value">${asset.volume_24h}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">24h Change</div>
                      <div className={`stat-value ${asset.change_24h && parseFloat(asset.change_24h) >= 0 ? 'positive' : 'negative'}`}>
                        {asset.change_24h && (parseFloat(asset.change_24h) >= 0 ? '+' : '')}{asset.change_24h}%
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">Market Cap</div>
                      <div className="stat-value">
                        ${(parseFloat(asset.price_per_unit) * parseInt(asset.total_supply)).toLocaleString()}
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">All-Time High</div>
                      <div className="stat-value">${hasProperty(asset, 'all_time_high') ? asset.all_time_high : 'N/A'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="asset-actions">
        <Link to="/marketplace" className="button secondary">Back to Marketplace</Link>
        <button 
          className="button primary"
          onClick={() => connected ? setShowPurchaseModal(true) : alert('Please connect your wallet to purchase assets')}
        >
          Invest Now
        </button>
      </div>
      
      {/* Purchase Modal */}
      <PurchaseModal
        show={showPurchaseModal}
        onHide={() => setShowPurchaseModal(false)}
        asset={asset}
        onPurchase={handlePurchase}
        userTier={getUserTier()}
      />
    </div>
  );
};

// Helper function to get SDG name
const getSdgName = (sdgNumber: number): string => {
  const sdgNames: Record<number, string> = {
    1: 'No Poverty',
    2: 'Zero Hunger',
    3: 'Good Health and Well-being',
    4: 'Quality Education',
    5: 'Gender Equality',
    6: 'Clean Water and Sanitation',
    7: 'Affordable and Clean Energy',
    8: 'Decent Work and Economic Growth',
    9: 'Industry, Innovation and Infrastructure',
    10: 'Reduced Inequalities',
    11: 'Sustainable Cities and Communities',
    12: 'Responsible Consumption and Production',
    13: 'Climate Action',
    14: 'Life Below Water',
    15: 'Life on Land',
    16: 'Peace, Justice and Strong Institutions',
    17: 'Partnerships for the Goals'
  };
  
  return sdgNames[sdgNumber] || `SDG ${sdgNumber}`;
};

export default AssetDetailPage; 