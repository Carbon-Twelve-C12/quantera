import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { treasuries as MOCK_TREASURIES } from '../data/mockTreasuriesData.js';
import { environmentalAssets as MOCK_ENVIRONMENTAL_ASSETS } from '../data/mockEnvironmentalAssetsData.js';
import { TreasuryDetail, EnvironmentalAsset } from '../data/assetInterfaces';

// Combined type for asset details
type AssetDetail = TreasuryDetail | EnvironmentalAsset;

// Add these styles at the top of the file for SDG alignment and other environmental data
// At the beginning of the component body
const styles = {
  sdgGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
    marginTop: '20px'
  },
  sdgItem: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '15px',
    borderRadius: '8px',
    backgroundColor: '#f5f5f5',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  sdgIcon: {
    width: '60px',
    height: '60px',
    marginRight: '15px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sdgIconImg: {
    maxWidth: '100%',
    borderRadius: '4px'
  },
  sdgInfo: {
    flex: '1',
  },
  sdgNumber: {
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#555'
  },
  sdgName: {
    fontWeight: 'bold',
    fontSize: '16px',
    margin: '5px 0',
    color: '#333'
  },
  scoreBar: {
    height: '8px',
    backgroundColor: '#e1e1e1',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '8px',
    width: '100%'
  },
  scoreFill: (percentage: number) => ({
    height: '100%',
    backgroundColor: percentage > 80 ? '#4caf50' : percentage > 50 ? '#ff9800' : '#f44336',
    width: `${percentage}%`
  }),
  scorePercentage: {
    fontSize: '14px',
    marginTop: '5px',
    textAlign: 'right' as const,
    fontWeight: 'bold'
  },
  coBenefits: {
    marginTop: '20px'
  },
  benefitsList: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '10px',
    listStyle: 'none',
    padding: 0,
    margin: '15px 0'
  },
  benefitItem: {
    padding: '8px 12px',
    backgroundColor: '#e8f5e9',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#2e7d32',
    display: 'inline-block'
  },
  riskItem: {
    marginBottom: '15px',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  riskHigh: {
    backgroundColor: '#ffebee',
    borderLeft: '4px solid #f44336'
  },
  riskMedium: {
    backgroundColor: '#fff8e1',
    borderLeft: '4px solid #ff9800'
  },
  riskLow: {
    backgroundColor: '#e8f5e9',
    borderLeft: '4px solid #4caf50'
  },
  riskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  riskName: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 'bold'
  },
  riskSeverity: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#757575'
  },
  riskSeverityHigh: {
    backgroundColor: '#f44336'
  },
  riskSeverityMedium: {
    backgroundColor: '#ff9800'
  },
  riskSeverityLow: {
    backgroundColor: '#4caf50'
  },
  riskDescription: {
    margin: 0,
    fontSize: '14px',
    lineHeight: '1.5'
  }
};

const AssetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [debug, setDebug] = useState<string>('');

  // Fetch asset details
  useEffect(() => {
    if (!id) return;

    // Add debugging information
    let debugInfo = `Looking for asset with ID: ${id}\n`;
    debugInfo += `Treasury assets available: ${MOCK_TREASURIES.length}\n`;
    debugInfo += `Available treasury IDs: ${MOCK_TREASURIES.map(t => t.token_id).join(', ')}\n`;
    debugInfo += `Environmental assets available: ${MOCK_ENVIRONMENTAL_ASSETS.length}\n`;
    debugInfo += `Available environmental IDs: ${MOCK_ENVIRONMENTAL_ASSETS.map(e => e.asset_id).join(', ')}\n`;

    // Look in treasury data first
    const treasuryAsset = MOCK_TREASURIES.find(t => t.token_id === id);
    if (treasuryAsset) {
      debugInfo += `Found treasury asset: ${treasuryAsset.name}`;
      setDebug(debugInfo);
      // Use type assertion to help TypeScript understand
      setAsset(treasuryAsset as TreasuryDetail);
      setLoading(false);
      return;
    }

    // Then look in environmental assets
    const environmentalAsset = MOCK_ENVIRONMENTAL_ASSETS.find(e => e.asset_id === id);
    if (environmentalAsset) {
      debugInfo += `Found environmental asset: ${environmentalAsset.project_name}`;
      setDebug(debugInfo);
      // Use double type assertion to help TypeScript understand
      setAsset(environmentalAsset as unknown as EnvironmentalAsset);
      setLoading(false);
      return;
    }

    // If not found
    debugInfo += `No asset found with ID: ${id}`;
    setDebug(debugInfo);
    setLoading(false);
  }, [id]);

  // Format date from timestamp
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

  // Additional checks for safely accessing optional properties in the component

  // Update the renderSdgAlignment function
  const renderSdgAlignment = () => {
    if (isEnvironmental(asset) && asset.impact_metrics.sdg_alignment) {
      return (
        <div style={styles.sdgGrid}>
          {Object.entries(asset.impact_metrics.sdg_alignment).map(([sdgNumber, alignmentScore]) => {
            // Map SDG numbers to their names
            const sdgNames: Record<string, string> = {
              "1": "No Poverty",
              "2": "Zero Hunger",
              "3": "Good Health and Well-being",
              "4": "Quality Education",
              "5": "Gender Equality",
              "6": "Clean Water and Sanitation",
              "7": "Affordable and Clean Energy",
              "8": "Decent Work and Economic Growth",
              "9": "Industry, Innovation and Infrastructure",
              "10": "Reduced Inequalities",
              "11": "Sustainable Cities and Communities",
              "12": "Responsible Consumption and Production",
              "13": "Climate Action",
              "14": "Life Below Water",
              "15": "Life on Land",
              "16": "Peace, Justice and Strong Institutions",
              "17": "Partnerships for the Goals"
            };
            
            const percentage = alignmentScore * 100;
            
            return (
              <div key={sdgNumber} style={styles.sdgItem}>
                <div style={styles.sdgIcon}>
                  <img 
                    src={`/images/sdg/sdg-${sdgNumber}.png`} 
                    alt={`SDG ${sdgNumber}`} 
                    style={styles.sdgIconImg}
                    onError={(e) => {
                      e.currentTarget.src = "/images/asset-placeholder.jpg";
                    }}
                  />
                </div>
                <div style={styles.sdgInfo}>
                  <div style={styles.sdgNumber}>Goal {sdgNumber}</div>
                  <div style={styles.sdgName}>{sdgNames[sdgNumber] || `SDG ${sdgNumber}`}</div>
                  <div style={styles.scoreBar}>
                    <div style={styles.scoreFill(percentage)}></div>
                  </div>
                  <div style={styles.scorePercentage}>{Math.round(percentage)}%</div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="asset-detail-page">
      <div className="asset-detail-header">
        <div className="asset-header-content">
          <div className="asset-type-badge">
            {isTreasury(asset) 
              ? (asset.treasury_type === 'tbill' 
                ? 'Treasury Bill' 
                : asset.treasury_type === 'tnote' 
                  ? 'Treasury Note' 
                  : 'Treasury Bond')
              : asset.asset_type}
          </div>
          <h1 className="asset-title">
            {isTreasury(asset) ? asset.name : asset.project_name}
          </h1>
          <div className="asset-subtitle">
            {isTreasury(asset) ? (
              <span className="symbol">{asset.symbol}</span>
            ) : (
              <span className="location">{asset.project_location}</span>
            )}
          </div>
        </div>
        <div className="asset-header-image">
          <img 
            src={isTreasury(asset) 
              ? `/images/treasury-${asset.treasury_type}.jpg` 
              : asset.image_url
            } 
            alt={isTreasury(asset) ? asset.name : asset.project_name}
            className="asset-image"
            onError={(e) => {
              e.currentTarget.src = "/images/asset-placeholder.jpg";
            }}
          />
        </div>
      </div>

      <div className="asset-quick-stats">
        <div className="stat-card">
          <div className="stat-label">Price</div>
          <div className="stat-value">
            ${isTreasury(asset) ? asset.current_price : asset.price_per_unit}
          </div>
          {isEnvironmental(asset) && asset.change_24h && (
            <div className={`stat-change ${asset.change_24h.startsWith('+') ? 'positive' : 'negative'}`}>
              {asset.change_24h}
            </div>
          )}
        </div>

        {isTreasury(asset) && (
          <div className="stat-card">
            <div className="stat-label">Yield</div>
            <div className="stat-value yield">{formatYield(asset.yield_rate)}</div>
          </div>
        )}

        {isTreasury(asset) && (
          <div className="stat-card">
            <div className="stat-label">Maturity Date</div>
            <div className="stat-value">{formatDate(asset.maturity_date)}</div>
          </div>
        )}

        {isTreasury(asset) && (
          <div className="stat-card">
            <div className="stat-label">Status</div>
            <div className={`stat-value status-${asset.status?.toLowerCase()}`}>{asset.status}</div>
          </div>
        )}

        {isEnvironmental(asset) && (
          <div className="stat-card">
            <div className="stat-label">Standard</div>
            <div className="stat-value">{asset.standard}</div>
          </div>
        )}

        {isEnvironmental(asset) && (
          <div className="stat-card">
            <div className="stat-label">Verified</div>
            <div className="stat-value">{formatDate(asset.verification_date)}</div>
          </div>
        )}

        <div className="stat-card">
          <div className="stat-label">Total Supply</div>
          <div className="stat-value">
            {formatTotalSupply(isTreasury(asset) ? asset.total_supply : asset.total_supply)}
          </div>
        </div>
      </div>

      <div className="asset-detail-tabs">
        <div 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          Overview
        </div>
        
        <div 
          className={`tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => handleTabChange('details')}
        >
          Details
        </div>
        
        <div 
          className={`tab ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => handleTabChange('documents')}
        >
          Documents
        </div>
        
        {isEnvironmental(asset) && (
          <div 
            className={`tab ${activeTab === 'impact' ? 'active' : ''}`}
            onClick={() => handleTabChange('impact')}
          >
            Impact Metrics
          </div>
        )}
        
        {isTreasury(asset) && (
          <div 
            className={`tab ${activeTab === 'trades' ? 'active' : ''}`}
            onClick={() => handleTabChange('trades')}
          >
            Recent Trades
          </div>
        )}
        
        {isEnvironmental(asset) && asset.project_updates && asset.project_updates.length > 0 && (
          <div 
            className={`tab ${activeTab === 'updates' ? 'active' : ''}`}
            onClick={() => handleTabChange('updates')}
          >
            Project Updates
          </div>
        )}
      </div>

      <div className="asset-detail-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tab-content">
            <h2 className="section-title">Overview</h2>
            
            <div className="description-section">
              <p className="asset-description">
                {isTreasury(asset) ? asset.description : asset.description}
              </p>
              
              {isEnvironmental(asset) && asset.long_description && (
                <div className="long-description">
                  {asset.long_description.split('\n\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              )}
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
                
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">Developer</div>
                    <div className="info-value">{asset.project_developer}</div>
                  </div>
                  
                  <div className="info-item">
                    <div className="info-label">Location</div>
                    <div className="info-value">{asset.project_location}</div>
                  </div>
                  
                  <div className="info-item">
                    <div className="info-label">Country</div>
                    <div className="info-value">{asset.country}</div>
                  </div>
                  
                  <div className="info-item">
                    <div className="info-label">Methodology</div>
                    <div className="info-value">{asset.methodology}</div>
                  </div>
                  
                  <div className="info-item">
                    <div className="info-label">Vintage Year</div>
                    <div className="info-value">{asset.vintage_year}</div>
                  </div>
                  
                  <div className="info-item">
                    <div className="info-label">Verifier</div>
                    <div className="info-value">{asset.impact_metrics.third_party_verifier}</div>
                  </div>
                </div>
                
                {asset.methodology_details && (
                  <div className="methodology-details">
                    <h4>Methodology Details</h4>
                    <p>{asset.methodology_details}</p>
                  </div>
                )}
                
                {asset.co_benefits && asset.co_benefits.length > 0 && (
                  <div style={styles.coBenefits}>
                    <h4>Co-Benefits</h4>
                    <ul style={styles.benefitsList}>
                      {asset.co_benefits.map((benefit, index) => (
                        <li key={index} style={styles.benefitItem}>{benefit}</li>
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
          <div className="tab-content">
            <h2 className="section-title">Asset Details</h2>
            
            {isTreasury(asset) && (
              <div className="details-section">
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
                
                <div className="price-history">
                  <h3>Price History</h3>
                  <table className="price-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asset.historical_prices.map((price, index) => (
                        <tr key={index}>
                          <td>{formatDate(price.date)}</td>
                          <td>${price.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                
                {asset.risks && asset.risks.length > 0 && (
                  <div className="risk-assessment">
                    <h3>Risk Assessment</h3>
                    <div className="risks-list">
                      {asset.risks.map((risk, index) => {
                        const severityClass = risk.severity.toLowerCase();
                        return (
                          <div 
                            key={index} 
                            style={{
                              ...styles.riskItem,
                              ...(severityClass === 'high' ? styles.riskHigh : 
                                 severityClass === 'medium' ? styles.riskMedium : 
                                 styles.riskLow)
                            }}
                          >
                            <div style={styles.riskHeader}>
                              <h4 style={styles.riskName}>{risk.name}</h4>
                              <span style={{
                                ...styles.riskSeverity,
                                ...(severityClass === 'high' ? styles.riskSeverityHigh : 
                                   severityClass === 'medium' ? styles.riskSeverityMedium : 
                                   styles.riskSeverityLow)
                              }}>
                                {risk.severity}
                              </span>
                            </div>
                            <p style={styles.riskDescription}>{risk.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="tab-content">
            <h2 className="section-title">Documents</h2>
            
            <div className="documents-list" style={{ marginTop: '20px' }}>
              {(isEnvironmental(asset) 
                ? (asset.certification_documents || []) 
                : asset.documents
              ).map((doc, index) => {
                // Determine document icon based on type
                const getDocIcon = (type: string | undefined) => {
                  switch(type?.toLowerCase()) {
                    case 'pdf': return '📄';
                    case 'xlsx': 
                    case 'xls': return '📊';
                    case 'doc':
                    case 'docx': return '📝';
                    case 'ppt':
                    case 'pptx': return '📑';
                    default: return '📄';
                  }
                };
                
                return (
                  <a 
                    key={index} 
                    href={doc.url} 
                    className="document-item" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '15px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '8px',
                      marginBottom: '10px',
                      textDecoration: 'none',
                      color: '#333',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="document-icon" style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '4px',
                      backgroundColor: '#e3f2fd',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: '15px',
                      fontSize: '20px'
                    }}>
                      {getDocIcon(doc.type)}
                    </div>
                    <div className="document-info" style={{ flex: 1 }}>
                      <div className="document-name" style={{ fontWeight: 'bold', marginBottom: '5px' }}>{doc.name}</div>
                      <div style={{ display: 'flex', gap: '15px' }}>
                        {doc.size_kb && <div className="document-size" style={{ fontSize: '14px', color: '#666' }}>{doc.size_kb} KB</div>}
                        <div className="document-type" style={{ fontSize: '14px', color: '#666' }}>{doc.type || 'PDF'}</div>
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: '#1976d2',
                      color: 'white',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      View
                    </div>
                  </a>
                );
              })}
            </div>
            
            {/* Additional resources section */}
            {isEnvironmental(asset) && (
              <div style={{ marginTop: '40px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '20px', color: '#333' }}>Additional Resources</h3>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  <a 
                    href="#methodology" 
                    style={{
                      padding: '10px 15px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      color: '#1976d2',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>📚</span>
                    <span>Methodology Reference</span>
                  </a>
                  
                  <a 
                    href="#impact" 
                    style={{
                      padding: '10px 15px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      color: '#1976d2',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>📊</span>
                    <span>Impact Report</span>
                  </a>
                  
                  <a 
                    href={asset.registry_link || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      padding: '10px 15px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      color: '#1976d2',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>🔗</span>
                    <span>Registry Listing</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Impact Metrics Tab (for environmental assets) */}
        {activeTab === 'impact' && isEnvironmental(asset) && (
          <div className="tab-content">
            <h2 className="section-title">Impact Metrics</h2>
            
            <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div className="metric-card" style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <div className="metric-icon carbon-icon" style={{ backgroundColor: '#e3f2fd', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '15px' }}>
                  <span style={{ fontSize: '24px' }}>🌿</span>
                </div>
                <div className="metric-value" style={{ fontSize: '28px', fontWeight: 'bold', color: '#2e7d32' }}>{asset.impact_metrics.carbon_offset_tons.toLocaleString()}</div>
                <div className="metric-label" style={{ fontSize: '14px', color: '#555' }}>Tons of CO₂ Offset</div>
              </div>
              
              <div className="metric-card" style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <div className="metric-icon land-icon" style={{ backgroundColor: '#e8f5e9', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '15px' }}>
                  <span style={{ fontSize: '24px' }}>🌳</span>
                </div>
                <div className="metric-value" style={{ fontSize: '28px', fontWeight: 'bold', color: '#2e7d32' }}>{asset.impact_metrics.land_area_protected_hectares.toLocaleString()}</div>
                <div className="metric-label" style={{ fontSize: '14px', color: '#555' }}>Hectares Protected</div>
              </div>
              
              {asset.impact_metrics.renewable_energy_mwh > 0 && (
                <div className="metric-card" style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <div className="metric-icon energy-icon" style={{ backgroundColor: '#fff8e1', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '15px' }}>
                    <span style={{ fontSize: '24px' }}>⚡</span>
                  </div>
                  <div className="metric-value" style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff9800' }}>{asset.impact_metrics.renewable_energy_mwh.toLocaleString()}</div>
                  <div className="metric-label" style={{ fontSize: '14px', color: '#555' }}>MWh of Renewable Energy</div>
                </div>
              )}
              
              {asset.impact_metrics.water_protected_liters > 0 && (
                <div className="metric-card" style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <div className="metric-icon water-icon" style={{ backgroundColor: '#e3f2fd', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '15px' }}>
                    <span style={{ fontSize: '24px' }}>💧</span>
                  </div>
                  <div className="metric-value" style={{ fontSize: '28px', fontWeight: 'bold', color: '#1976d2' }}>
                    {(asset.impact_metrics.water_protected_liters / 1000000).toLocaleString()}
                  </div>
                  <div className="metric-label" style={{ fontSize: '14px', color: '#555' }}>Million Liters of Water Protected</div>
                </div>
              )}
              
              {asset.impact_metrics.biodiversity_species_protected && (
                <div className="metric-card" style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <div className="metric-icon species-icon" style={{ backgroundColor: '#f3e5f5', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '15px' }}>
                    <span style={{ fontSize: '24px' }}>🦋</span>
                  </div>
                  <div className="metric-value" style={{ fontSize: '28px', fontWeight: 'bold', color: '#9c27b0' }}>{asset.impact_metrics.biodiversity_species_protected}</div>
                  <div className="metric-label" style={{ fontSize: '14px', color: '#555' }}>Species Protected</div>
                </div>
              )}
              
              {asset.impact_metrics.jobs_created && (
                <div className="metric-card" style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <div className="metric-icon jobs-icon" style={{ backgroundColor: '#ede7f6', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '15px' }}>
                    <span style={{ fontSize: '24px' }}>👥</span>
                  </div>
                  <div className="metric-value" style={{ fontSize: '28px', fontWeight: 'bold', color: '#673ab7' }}>{asset.impact_metrics.jobs_created}</div>
                  <div className="metric-label" style={{ fontSize: '14px', color: '#555' }}>Jobs Created</div>
                </div>
              )}
            </div>
            
            <div className="sdg-alignment" style={{ marginBottom: '40px' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '22px', color: '#333' }}>UN Sustainable Development Goals Alignment</h3>
              {renderSdgAlignment()}
            </div>
            
            {asset.project_developer && (
              <div className="project-developer" style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '20px', color: '#333' }}>Project Developer</h3>
                <p style={{ fontSize: '16px', lineHeight: '1.6' }}><strong>{asset.project_developer}</strong> - {asset.project_location}, {asset.country}</p>
              </div>
            )}
            
            {asset.methodology && (
              <div className="methodology" style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '20px', color: '#333' }}>Methodology</h3>
                <p style={{ fontSize: '16px', lineHeight: '1.6' }}><strong>{asset.methodology}</strong></p>
                {asset.methodology_details && (
                  <p style={{ fontSize: '16px', lineHeight: '1.6', marginTop: '10px' }}>{asset.methodology_details}</p>
                )}
              </div>
            )}
            
            {asset.registry_link && (
              <div className="registry" style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '20px', color: '#333' }}>Registry Information</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '16px' }}><strong>Standard:</strong> {asset.standard}</div>
                  <div style={{ fontSize: '16px' }}><strong>Project ID:</strong> {asset.project_id}</div>
                  <div>
                    <a 
                      href={asset.registry_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#1976d2',
                        color: 'white',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '14px'
                      }}
                    >
                      View on Registry
                    </a>
                  </div>
                </div>
              </div>
            )}
            
            {asset.co_benefits && asset.co_benefits.length > 0 && (
              <div className="co-benefits" style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '20px', color: '#333' }}>Co-Benefits</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {asset.co_benefits.map((benefit, index) => (
                    <div 
                      key={index} 
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#e8f5e9',
                        color: '#2e7d32',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {asset.risks && asset.risks.length > 0 && (
              <div className="risk-assessment" style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '20px', color: '#333' }}>Risk Assessment</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {asset.risks.map((risk, index) => {
                    const severityColor = 
                      risk.severity === 'High' ? '#f44336' : 
                      risk.severity === 'Medium' ? '#ff9800' : 
                      '#4caf50';
                    
                    const severityBg = 
                      risk.severity === 'High' ? '#ffebee' : 
                      risk.severity === 'Medium' ? '#fff8e1' : 
                      '#e8f5e9';
                    
                    return (
                      <div 
                        key={index} 
                        style={{
                          padding: '15px',
                          backgroundColor: severityBg,
                          borderLeft: `4px solid ${severityColor}`,
                          borderRadius: '4px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <h4 style={{ margin: 0, fontSize: '18px' }}>{risk.name}</h4>
                          <span 
                            style={{
                              padding: '4px 8px',
                              backgroundColor: severityColor,
                              color: 'white',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                          >
                            {risk.severity}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>{risk.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Recent Trades Tab (for treasury assets) */}
        {activeTab === 'trades' && isTreasury(asset) && (
          <div className="tab-content">
            <h2 className="section-title">Recent Trades</h2>
            
            <table className="trades-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total Value</th>
                </tr>
              </thead>
              <tbody>
                {asset.recent_trades.map((trade, index) => (
                  <tr key={index} className={trade.type.toLowerCase()}>
                    <td>{formatDate(trade.date)}</td>
                    <td className={`trade-type ${trade.type.toLowerCase()}`}>{trade.type}</td>
                    <td>{parseInt(trade.quantity).toLocaleString()}</td>
                    <td>${trade.price}</td>
                    <td>${(parseFloat(trade.price) * parseInt(trade.quantity)).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Project Updates Tab (for environmental assets) */}
        {activeTab === 'updates' && isEnvironmental(asset) && asset.project_updates && (
          <div className="tab-content">
            <h2 className="section-title">Project Updates</h2>
            
            <div className="updates-timeline" style={{ marginTop: '20px' }}>
              {asset.project_updates.map((update, index) => (
                <div key={index} className="update-item" style={{ 
                  marginBottom: '30px',
                  borderLeft: '3px solid #1976d2',
                  paddingLeft: '25px',
                  position: 'relative'
                }}>
                  <div className="update-date" style={{
                    position: 'absolute',
                    left: '-15px',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontWeight: 'bold'
                  }}>
                    {index + 1}
                  </div>
                  <div className="update-content" style={{ 
                    backgroundColor: '#f5f5f5',
                    padding: '20px',
                    borderRadius: '8px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginBottom: '10px'
                    }}>
                      <h3 className="update-title" style={{ 
                        margin: 0,
                        fontSize: '20px',
                        color: '#333'
                      }}>{update.title}</h3>
                      <div style={{ fontSize: '14px', color: '#757575' }}>
                        {formatDate(update.date)}
                      </div>
                    </div>
                    <p className="update-text" style={{ 
                      fontSize: '16px',
                      lineHeight: '1.6',
                      margin: '0 0 10px 0'
                    }}>{update.content}</p>
                    <div className="update-author" style={{ 
                      fontSize: '14px',
                      fontWeight: 'bold',
                      fontStyle: 'italic',
                      color: '#666',
                      textAlign: 'right'
                    }}>- {update.author}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="asset-actions">
        <Link to="/marketplace" className="button secondary">Back to Marketplace</Link>
        <button className="button primary">Invest Now</button>
      </div>
    </div>
  );
};

export default AssetDetailPage; 