import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSearch, FaFilter, FaPercentage, FaClock, FaDollarSign, FaTree, FaWater } from 'react-icons/fa';
import ImageWithFallback from '../components/common/ImageWithFallback';
import { treasuries } from '../data/mockTreasuriesData';
import { environmentalAssets } from '../data/mockEnvironmentalAssetsData';

// Custom styles for cards
const cardStyles = {
  transition: 'all 0.3s ease',
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: 'var(--card-bg)',
  color: 'var(--text-color)',
  borderColor: 'var(--border-color)'
};

const cardHoverStyles = {
  transform: 'translateY(-8px)',
  boxShadow: '0 10px 20px var(--shadow-color), 0 4px 8px var(--shadow-color)'
};

const MarketplacePage = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [assets, setAssets] = useState([]);

  // Map treasuries and environmental assets to a common format
  useEffect(() => {
    const mappedTreasuries = treasuries.map(treasury => ({
      id: treasury.token_id,
      name: treasury.name,
      symbol: treasury.symbol,
      maturity: getMaturityLabel(treasury.treasury_type),
      maturityDate: new Date(treasury.maturity_date * 1000).toISOString().split('T')[0],
      yield: (treasury.yield_rate / 100).toFixed(2),
      price: treasury.current_price,
      faceValue: treasury.face_value,
      type: getTreasuryTypeLabel(treasury.treasury_type),
      image: treasury.treasury_type === 'realestate' 
        ? '/images/assets/real-estate.jpg'
        : treasury.treasury_type === 'tradefinance'
        ? '/images/assets/trade-finance.jpg'
        : `/images/treasury-${treasury.treasury_type}.jpg`,
      treasury_details: treasury
    }));

    const mappedEnvironmentalAssets = environmentalAssets.map(env => {
      // Determine correct image path based on asset ID
      let imagePath = '/images/asset-placeholder.jpg';
      switch(env.asset_id) {
        case "0x5f0f0e0d0c0b0a09080706050403020100000005":
          imagePath = "/images/treasuries/amazon-rainforest.jpg";
          break;
        case "0x5f0f0e0d0c0b0a09080706050403020100000006":
          imagePath = "/images/treasuries/mangrove-restoration.jpg";
          break;
        case "0x5f0f0e0d0c0b0a09080706050403020100000007":
          imagePath = "/images/treasuries/highland-watershed.jpg";
          break;
        case "0x5f0f0e0d0c0b0a09080706050403020100000008":
          imagePath = "/images/treasuries/morocco-solar.jpg";
          break;
        default:
          if (env.image_url) {
            imagePath = env.image_url;
          }
      }

      return {
        id: env.asset_id,
        name: env.project_name,
        symbol: env.project_id.substring(0, 9),
        maturity: 'Perpetual',
        maturityDate: 'N/A',
        yield: parseFloat(env.change_24h.replace('+', '').replace('%', '')),
        price: env.price_per_unit,
        faceValue: Math.ceil(parseFloat(env.price_per_unit) * 1.1), // Approximation for display
        type: 'Environmental',
        image: imagePath,
        description: env.description,
        environmentalAssetId: env.asset_id,
        impactMetrics: {
          carbonOffset: env.impact_metrics?.carbon_offset_tons / parseInt(env.total_supply),
          landProtected: env.impact_metrics?.land_area_protected_hectares / parseInt(env.total_supply),
          waterProtected: env.impact_metrics?.water_protected_liters / parseInt(env.total_supply),
          sdgAlignment: Object.keys(env.impact_metrics?.sdg_alignment || {}).map(Number)
        }
      };
    });

    // Split treasuries by type for ordering
    const moneyMarketAssets = mappedTreasuries.filter(t => t.type === 'Money Market');
    const otherTreasuryAssets = mappedTreasuries.filter(t => t.type !== 'Money Market');
    
    // Set assets with money market first, followed by treasuries, then environmental
    setAssets([...moneyMarketAssets, ...otherTreasuryAssets, ...mappedEnvironmentalAssets]);
  }, []);

  // Convert treasury_type to user-friendly label
  const getTreasuryTypeLabel = (type) => {
    switch (type) {
      case 'tbill': return 'T-Bill';
      case 'tnote': return 'T-Note';
      case 'tbond': return 'T-Bond';
      case 'moneymarket': return 'Money Market';
      case 'realestate': return 'Real Estate';
      case 'tradefinance': return 'Trade Finance';
      default: return type;
    }
  };

  // Get maturity label based on treasury type
  const getMaturityLabel = (type) => {
    switch (type) {
      case 'tbill': return '3 months';
      case 'tnote': return '5 years';
      case 'tbond': return '30 years';
      case 'moneymarket': return 'Daily';
      case 'realestate': return '10 years';
      case 'tradefinance': return '180 days';
      default: return 'Varies';
    }
  };

  const filteredAssets = assets.filter(asset => {
    // Filter by type
    if (filter !== 'all' && asset.type !== filter) return false;
    
    // Filter by search term
    if (searchTerm && !asset.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !asset.symbol.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const getBadgeColor = (type) => {
    switch (type) {
      case 'T-Bill': return 'info';
      case 'T-Note': return 'primary';
      case 'T-Bond': return 'warning';
      case 'Money Market': return 'secondary';
      case 'Real Estate': return 'danger';
      case 'Trade Finance': return 'dark';
      case 'Environmental': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <Container fluid className="py-5" style={{ maxWidth: '1400px' }}>
      <h1 className="mb-4">Asset Marketplace</h1>
      
      <Row className="mb-5">
        <Col md={6} className="mb-3 mb-md-0">
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search by name or symbol"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={6} className="d-flex align-items-center">
          <FaFilter className="me-2 text-primary" />
          <Form.Select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Asset Types</option>
            <option value="T-Bill">T-Bills</option>
            <option value="T-Note">T-Notes</option>
            <option value="T-Bond">T-Bonds</option>
            <option value="Money Market">Money Market</option>
            <option value="Real Estate">Real Estate</option>
            <option value="Trade Finance">Trade Finance</option>
            <option value="Environmental">Environmental Assets</option>
          </Form.Select>
        </Col>
      </Row>
      
      {filteredAssets.length === 0 ? (
        <div className="text-center py-5">
          <p className="lead">No assets match your search criteria.</p>
        </div>
      ) : (
        <Row xs={1} md={2} lg={4} xl={4} className="g-4 mx-0 mx-md-2">
          {filteredAssets.map((asset) => (
            <Col key={asset.id} className="mb-4">
              <Card 
                className={`h-100 border-0 shadow hover-card marketplace-card ${asset.type === 'Environmental' ? 'environmental-card' : ''}`}
                style={{ 
                  minHeight: '425px', 
                  ...cardStyles,
                  ':hover': cardHoverStyles
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 10px 20px var(--shadow-color), 0 4px 8px var(--shadow-color)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px var(--shadow-color)';
                }}
              >
                <div className="card-img-container" style={{ height: '180px', overflow: 'hidden', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
                  <ImageWithFallback 
                    src={asset.image} 
                    alt={asset.name}
                    assetId={asset.id}
                    className="card-img-top"
                    style={{ height: "100%", objectFit: "cover" }}
                  />
                </div>
                <Card.Body className="px-4 py-3">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <Card.Title style={{ fontSize: '1rem', height: '40px', overflow: 'hidden', marginBottom: '0', color: 'var(--text-color)' }}>{asset.name}</Card.Title>
                    <Badge bg={getBadgeColor(asset.type)} style={{ padding: '0.4em 0.6em', fontSize: '0.7rem' }}>{asset.type}</Badge>
                  </div>
                  <Card.Subtitle className="mb-3" style={{ fontSize: '0.85rem', color: 'var(--muted-color)' }}>{asset.symbol}</Card.Subtitle>
                  
                  <div className="mb-3 flex-grow-1">
                    <div className="d-flex justify-content-between mb-2">
                      <div className="d-flex align-items-center">
                        <FaPercentage className="text-success me-2" />
                        <span style={{ color: 'var(--text-color)' }}>Yield</span>
                      </div>
                      <span className="fw-bold" style={{ color: 'var(--text-color)' }}>{asset.yield}%</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <div className="d-flex align-items-center">
                        <FaClock className="text-primary me-2" />
                        <span style={{ color: 'var(--text-color)' }}>Maturity</span>
                      </div>
                      <span style={{ color: 'var(--text-color)' }}>{asset.maturity}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-3">
                      <div className="d-flex align-items-center">
                        <FaDollarSign className="text-danger me-2" />
                        <span style={{ color: 'var(--text-color)' }}>Price</span>
                      </div>
                      <span style={{ color: 'var(--text-color)' }}>${asset.price}</span>
                    </div>
                    
                    {asset.type === 'Environmental' && asset.impactMetrics && (
                      <div className="environmental-metrics mt-2 p-2" style={{ backgroundColor: 'var(--gray-100)', borderRadius: '4px' }}>
                        <div className="d-flex align-items-center mb-1">
                          <FaTree className="environmental-impact-icon carbon-offset-icon me-1" style={{ fontSize: '0.8rem', color: 'var(--success-color)' }} />
                          <small className="fw-bold" style={{ fontSize: '0.75rem', color: 'var(--success-color)' }}>Environmental Impact:</small>
                        </div>
                        {asset.impactMetrics.carbonOffset && (
                          <small className="d-block mb-1" style={{ fontSize: '0.7rem', color: 'var(--text-color)' }}>• {asset.impactMetrics.carbonOffset.toFixed(2)} tons CO₂ offset</small>
                        )}
                        {asset.impactMetrics.landProtected && (
                          <small className="d-block mb-1" style={{ fontSize: '0.7rem', color: 'var(--text-color)' }}>• {asset.impactMetrics.landProtected.toFixed(2)} hectares protected</small>
                        )}
                        {asset.impactMetrics.waterProtected && (
                          <small className="d-block mb-1" style={{ fontSize: '0.7rem', color: 'var(--text-color)' }}>
                            <FaWater className="environmental-impact-icon water-protection-icon me-1" style={{ fontSize: '0.7rem', color: 'var(--primary-color)' }} />
                            {(asset.impactMetrics.waterProtected / 1000).toFixed(1) > 0 
                              ? `${(asset.impactMetrics.waterProtected / 1000).toFixed(1)}kL`
                              : `${asset.impactMetrics.waterProtected}L`} water protected
                          </small>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="btn-container">
                    {asset.type === 'Environmental' ? (
                      <Button 
                        as={Link} 
                        to={`/assets/${asset.id}`}
                        variant="success"
                        className="w-100"
                        style={{ borderRadius: '6px', padding: '0.5rem' }}
                      >
                        View Environmental Details
                      </Button>
                    ) : (
                      <Button 
                        as={Link} 
                        to={`/assets/${asset.id}`}
                        variant="primary"
                        className="w-100"
                        style={{ borderRadius: '6px', padding: '0.5rem' }}
                      >
                        View Details
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default MarketplacePage;