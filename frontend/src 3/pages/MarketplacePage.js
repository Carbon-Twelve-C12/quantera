import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaClock, FaPercent, FaDollarSign } from 'react-icons/fa';

// Mock data for treasury tokens since backend is not available
const MOCK_TREASURIES = [
  {
    id: '0x1',
    name: '3-Month T-Bill',
    symbol: 'TBILL3M',
    maturity: '3 months',
    yield: 3.75,
    price: 98.25,
    faceValue: 100,
    supply: '10,000,000',
    type: 'T-Bill',
    image: 'https://images.unsplash.com/photo-1620228885847-9eab2a1adddc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '0x2',
    name: '2-Year T-Note',
    symbol: 'TNOTE2Y',
    maturity: '2 years',
    yield: 4.15,
    price: 95.75,
    faceValue: 100,
    supply: '25,000,000',
    type: 'T-Note',
    image: 'https://images.unsplash.com/photo-1618044733300-9472054094ee?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '0x3',
    name: '10-Year T-Bond',
    symbol: 'TBOND10Y',
    maturity: '10 years',
    yield: 4.65,
    price: 92.50,
    faceValue: 100,
    supply: '50,000,000',
    type: 'T-Bond',
    image: 'https://images.unsplash.com/photo-1618044619888-009e412ff12a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '0x4',
    name: '6-Month T-Bill',
    symbol: 'TBILL6M',
    maturity: '6 months',
    yield: 4.05,
    price: 97.50,
    faceValue: 100,
    supply: '15,000,000',
    type: 'T-Bill',
    image: 'https://images.unsplash.com/photo-1633158829025-4b9735c15582?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
  }
];

const MarketplacePage = () => {
  const [treasuries, setTreasuries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Simulating API call
    const fetchTreasuries = async () => {
      try {
        // In a real implementation, we would call the API:
        // const response = await treasuryApi.getAllTreasuries();
        // setTreasuries(response);
        
        // Using mock data instead
        setTimeout(() => {
          setTreasuries(MOCK_TREASURIES);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching treasuries:', error);
        setLoading(false);
      }
    };

    fetchTreasuries();
  }, []);

  const filteredTreasuries = filter === 'all' 
    ? treasuries
    : treasuries.filter(treasury => treasury.type === filter);

  return (
    <Container className="py-4">
      <h1 className="mb-4">Treasury Token Marketplace</h1>
      
      <Row className="mb-4">
        <Col>
          <Form.Group>
            <Form.Label>Filter by Type</Form.Label>
            <Form.Select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Treasury Types</option>
              <option value="T-Bill">T-Bills</option>
              <option value="T-Note">T-Notes</option>
              <option value="T-Bond">T-Bonds</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={8}>
          <p className="mb-0">
            Browse available U.S. Treasury tokens for purchase and trading. Each token represents
            partial ownership of the underlying treasury security.
          </p>
        </Col>
      </Row>
      
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading treasury tokens...</p>
        </div>
      ) : filteredTreasuries.length === 0 ? (
        <div className="text-center py-5">
          <p>No treasury tokens found matching your filter.</p>
        </div>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {filteredTreasuries.map((treasury) => (
            <Col key={treasury.id}>
              <Card className="h-100 treasury-card">
                <Card.Img 
                  variant="top" 
                  src={treasury.image} 
                  height="180"
                  style={{ objectFit: 'cover' }}
                />
                <Card.Header>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold">{treasury.name}</span>
                    <Badge bg="light" text="dark">{treasury.symbol}</Badge>
                  </div>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <div className="d-flex align-items-center">
                        <FaPercent className="text-success me-2" />
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
                  <div className="d-grid gap-2">
                    <Button 
                      as={Link} 
                      to={`/treasury/${treasury.id}`} 
                      variant="primary"
                    >
                      View Details
                    </Button>
                    <Button 
                      as={Link} 
                      to={`/trade/${treasury.id}`} 
                      variant="outline-success"
                    >
                      Trade
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