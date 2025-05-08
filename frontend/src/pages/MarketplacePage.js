import React, { useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSearch, FaFilter, FaPercentage, FaClock, FaDollarSign, FaTree, FaWater } from 'react-icons/fa';
import ImageWithFallback from '../components/common/ImageWithFallback';

// Updated images with more reliable sources
const MOCK_ASSETS = [
  {
    id: '0x1',
    name: '3-Month T-Bill',
    symbol: 'TBILL3M',
    maturity: '3 months',
    maturityDate: '2023-12-15',
    yield: 3.75,
    price: 98.25,
    faceValue: 100,
    type: 'T-Bill',
    // Use reliable image sources or hosted images
    image: 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  },
  {
    id: '0x2',
    name: '2-Year T-Note',
    symbol: 'TNOTE2Y',
    maturity: '2 years',
    maturityDate: '2025-09-15',
    yield: 4.15,
    price: 95.75,
    faceValue: 100,
    type: 'T-Note',
    image: 'https://images.pexels.com/photos/534216/pexels-photo-534216.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  },
  {
    id: '0x3',
    name: '10-Year T-Bond',
    symbol: 'TBOND10Y',
    maturity: '10 years',
    maturityDate: '2033-09-15',
    yield: 4.65,
    price: 92.50,
    faceValue: 100,
    type: 'T-Bond',
    image: 'https://images.pexels.com/photos/7788009/pexels-photo-7788009.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  },
  {
    id: '0x4',
    name: '6-Month T-Bill',
    symbol: 'TBILL6M',
    maturity: '6 months',
    maturityDate: '2024-03-15',
    yield: 4.05,
    price: 97.50,
    faceValue: 100,
    type: 'T-Bill',
    image: 'https://images.pexels.com/photos/8370752/pexels-photo-8370752.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  },
  {
    id: '0x5',
    name: 'Amazon Rainforest Carbon Credits',
    symbol: 'AMAZVCC',
    maturity: 'Perpetual',
    maturityDate: 'N/A',
    yield: 5.25,
    price: 24.75,
    faceValue: 25,
    type: 'Environmental',
    image: 'https://images.pexels.com/photos/955657/pexels-photo-955657.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    description: 'Verified carbon credits from conservation projects in the Amazon rainforest. Each credit represents 1 ton of CO2 equivalent emissions reduction.',
    environmentalAssetId: '0x5f0f0e0d0c0b0a09080706050403020100000005', // Link to environmental asset details
    impactMetrics: {
      carbonOffset: 1, // tons per token
      landProtected: 0.05, // hectares per token
      waterProtected: 250, // liters per token
      sdgAlignment: [13, 15] // SDGs supported
    }
  },
  {
    id: '0x6',
    name: 'Blue Carbon Mangrove Credits',
    symbol: 'BCMC',
    maturity: 'Perpetual',
    maturityDate: 'N/A',
    yield: 4.85,
    price: 18.50,
    faceValue: 20,
    type: 'Environmental',
    image: 'https://images.pexels.com/photos/11842913/pexels-photo-11842913.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    description: 'Verified blue carbon credits from mangrove restoration projects. Each credit represents carbon sequestration and coastal ecosystem protection.',
    environmentalAssetId: '0x5f0f0e0d0c0b0a09080706050403020100000006', // Link to environmental asset details
    impactMetrics: {
      carbonOffset: 1.5, // tons per token
      landProtected: 0.02, // hectares per token
      waterProtected: 5000, // liters per token
      sdgAlignment: [13, 14, 15] // SDGs supported
    }
  }
];

const MarketplacePage = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAssets = MOCK_ASSETS.filter(asset => {
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
      case 'Environmental': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <Container className="py-4">
      <h1 className="mb-4">Asset Marketplace</h1>
      
      <Row className="mb-4">
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
            <option value="Environmental">Environmental Assets</option>
          </Form.Select>
        </Col>
      </Row>
      
      {filteredAssets.length === 0 ? (
        <div className="text-center py-5">
          <p className="lead">No assets match your search criteria.</p>
        </div>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {filteredAssets.map((asset) => (
            <Col key={asset.id}>
              <Card className={`h-100 border-0 shadow-sm hover-card marketplace-card ${asset.type === 'Environmental' ? 'environmental-card' : ''}`}>
                <div className="card-img-container">
                  <ImageWithFallback 
                    src={asset.image} 
                    alt={asset.name}
                    className="card-img-top"
                  />
                </div>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Card.Title>{asset.name}</Card.Title>
                    <Badge bg={getBadgeColor(asset.type)}>{asset.type}</Badge>
                  </div>
                  <Card.Subtitle className="mb-3 text-muted">{asset.symbol}</Card.Subtitle>
                  
                  <div className="mb-3 flex-grow-1">
                    <div className="d-flex justify-content-between mb-2">
                      <div className="d-flex align-items-center">
                        <FaPercentage className="text-success me-2" />
                        <span>Yield</span>
                      </div>
                      <span className="fw-bold">{asset.yield}%</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <div className="d-flex align-items-center">
                        <FaClock className="text-primary me-2" />
                        <span>Maturity</span>
                      </div>
                      <span>{asset.maturity}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <div className="d-flex align-items-center">
                        <FaDollarSign className="text-danger me-2" />
                        <span>Price</span>
                      </div>
                      <span>${asset.price}</span>
                    </div>
                    
                    {asset.type === 'Environmental' && (
                      <div className="environmental-metrics">
                        <div className="d-flex align-items-center mb-1">
                          <FaTree className="environmental-impact-icon carbon-offset-icon" />
                          <small className="fw-bold text-success">Environmental Impact:</small>
                        </div>
                        {asset.impactMetrics.carbonOffset && (
                          <small className="d-block mb-1">• {asset.impactMetrics.carbonOffset} tons CO₂ offset per token</small>
                        )}
                        {asset.impactMetrics.landProtected && (
                          <small className="d-block mb-1">• {asset.impactMetrics.landProtected} hectares protected per token</small>
                        )}
                        {asset.impactMetrics.waterProtected && (
                          <small className="d-block mb-1">
                            <FaWater className="environmental-impact-icon water-protection-icon" />
                            {(asset.impactMetrics.waterProtected / 1000).toFixed(1) > 0 
                              ? `${(asset.impactMetrics.waterProtected / 1000).toFixed(1)}kL`
                              : `${asset.impactMetrics.waterProtected}L`} water protected per token
                          </small>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="btn-container">
                    {asset.type === 'Environmental' ? (
                      <Button 
                        as={Link} 
                        to={`/environmental/assets/${asset.environmentalAssetId}`}
                        variant="success"
                        className="w-100"
                      >
                        View Environmental Details
                      </Button>
                    ) : (
                      <Button 
                        as={Link} 
                        to={`/treasury/${asset.id}`}
                        variant="primary"
                        className="w-100"
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