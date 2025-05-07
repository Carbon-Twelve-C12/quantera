import React, { useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSearch, FaFilter, FaPercentage, FaClock, FaDollarSign } from 'react-icons/fa';
import ImageWithFallback from '../components/common/ImageWithFallback';

// Updated images with more reliable sources
const MOCK_TREASURIES = [
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
];

const MarketplacePage = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTreasuries = MOCK_TREASURIES.filter(treasury => {
    // Filter by type
    if (filter !== 'all' && treasury.type !== filter) return false;
    
    // Filter by search term
    if (searchTerm && !treasury.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !treasury.symbol.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const getBadgeColor = (type) => {
    switch (type) {
      case 'T-Bill': return 'info';
      case 'T-Note': return 'primary';
      case 'T-Bond': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <Container className="py-4">
      <h1 className="mb-4">Treasury Token Marketplace</h1>
      
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
            <option value="all">All Treasury Types</option>
            <option value="T-Bill">T-Bills</option>
            <option value="T-Note">T-Notes</option>
            <option value="T-Bond">T-Bonds</option>
          </Form.Select>
        </Col>
      </Row>
      
      {filteredTreasuries.length === 0 ? (
        <div className="text-center py-5">
          <p className="lead">No treasury tokens match your search criteria.</p>
        </div>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {filteredTreasuries.map((treasury) => (
            <Col key={treasury.id}>
              <Card className="h-100 border-0 shadow-sm hover-card">
                <ImageWithFallback 
                  src={treasury.image} 
                  alt={treasury.name}
                  height="180"
                  className="card-img-top"
                />
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Card.Title className="mb-0">{treasury.name}</Card.Title>
                    <Badge bg={getBadgeColor(treasury.type)}>{treasury.type}</Badge>
                  </div>
                  <Card.Subtitle className="mb-3 text-muted">{treasury.symbol}</Card.Subtitle>
                  
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <div className="d-flex align-items-center">
                        <FaPercentage className="text-success me-2" />
                        <span>Yield</span>
                      </div>
                      <span className="fw-bold">{treasury.yield}%</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <div className="d-flex align-items-center">
                        <FaClock className="text-primary me-2" />
                        <span>Maturity</span>
                      </div>
                      <span>{treasury.maturity}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <div className="d-flex align-items-center">
                        <FaDollarSign className="text-danger me-2" />
                        <span>Price</span>
                      </div>
                      <span>${treasury.price}</span>
                    </div>
                  </div>
                  
                  <div className="d-grid">
                    <Button 
                      as={Link} 
                      to={`/treasury/${treasury.id}`}
                      variant="primary"
                    >
                      View Details
                    </Button>
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