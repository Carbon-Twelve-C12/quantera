import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaChartLine, FaWallet, FaExchangeAlt } from 'react-icons/fa';
import { useWallet } from '../contexts/WalletContext';

// Mock portfolio data since backend is not available
const MOCK_PORTFOLIO = {
  totalValue: 25675.50,
  totalYield: 978.25,
  yieldRate: 3.81,
  holdings: [
    {
      id: '0x1',
      name: '3-Month T-Bill',
      symbol: 'TBILL3M',
      quantity: 50,
      price: 98.25,
      value: 4912.50,
      yield: 3.75,
      yieldAmount: 184.22,
      maturity: '2023-12-15',
      type: 'T-Bill'
    },
    {
      id: '0x2',
      name: '2-Year T-Note',
      symbol: 'TNOTE2Y',
      quantity: 120,
      price: 95.75,
      value: 11490.00,
      yield: 4.15,
      yieldAmount: 476.84,
      maturity: '2025-09-15',
      type: 'T-Note'
    },
    {
      id: '0x3',
      name: '10-Year T-Bond',
      symbol: 'TBOND10Y',
      quantity: 100,
      price: 92.50,
      value: 9250.00,
      yield: 4.65,
      yieldAmount: 430.13,
      maturity: '2033-09-15',
      type: 'T-Bond'
    }
  ]
};

const PortfolioPage = () => {
  const { isConnected, account } = useWallet();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to get portfolio data
    const fetchPortfolio = async () => {
      try {
        // In a real implementation, we would call the API:
        // const response = await userApi.getPortfolio(account);
        // setPortfolio(response);
        
        // Using mock data instead
        setTimeout(() => {
          setPortfolio(MOCK_PORTFOLIO);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching portfolio:', error);
        setLoading(false);
      }
    };

    if (isConnected) {
      fetchPortfolio();
    } else {
      setLoading(false);
    }
  }, [isConnected, account]);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading portfolio data...</p>
      </Container>
    );
  }

  if (!isConnected) {
    return (
      <Container className="py-5">
        <Card className="border-0 shadow-sm text-center p-5">
          <Card.Body>
            <FaWallet size={64} className="text-muted mb-4" />
            <h2>Connect Your Wallet</h2>
            <p className="lead mb-4">
              Please connect your Ethereum wallet to view your treasury token portfolio.
            </p>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (!portfolio || portfolio.holdings.length === 0) {
    return (
      <Container className="py-5">
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center p-5">
            <FaWallet size={64} className="text-muted mb-4" />
            <h2>No Treasury Tokens Yet</h2>
            <p className="lead mb-4">
              Your portfolio is empty. Start by purchasing treasury tokens from the marketplace.
            </p>
            <Button as={Link} to="/marketplace" variant="primary" size="lg">
              Explore Marketplace
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h1 className="mb-4">My Portfolio</h1>
      
      <Row className="g-4 mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex flex-column align-items-center justify-content-center p-4">
              <FaWallet size={48} className="text-primary mb-3" />
              <h2 className="mb-1">${portfolio.totalValue.toFixed(2)}</h2>
              <p className="text-muted mb-0">Total Portfolio Value</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex flex-column align-items-center justify-content-center p-4">
              <FaChartLine size={48} className="text-success mb-3" />
              <h2 className="mb-1">${portfolio.totalYield.toFixed(2)}</h2>
              <p className="text-muted mb-0">Total Yield Earned</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex flex-column align-items-center justify-content-center p-4">
              <FaExchangeAlt size={48} className="text-info mb-3" />
              <h2 className="mb-1">{portfolio.yieldRate.toFixed(2)}%</h2>
              <p className="text-muted mb-0">Average Yield Rate</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-light">
          <h4 className="mb-0">Treasury Holdings</h4>
        </Card.Header>
        <Card.Body>
          <Table responsive hover className="align-middle">
            <thead>
              <tr>
                <th>Treasury</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Value</th>
                <th>Yield</th>
                <th>Maturity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.holdings.map((holding) => (
                <tr key={holding.id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <div>
                        <div className="fw-bold">{holding.name}</div>
                        <div className="small text-muted d-flex align-items-center">
                          {holding.symbol}
                          <Badge bg="light" text="dark" className="ms-2">
                            {holding.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{holding.quantity}</td>
                  <td>${holding.price}</td>
                  <td>${holding.value.toFixed(2)}</td>
                  <td>
                    <div className="text-success fw-bold">{holding.yield}%</div>
                    <small className="text-muted">${holding.yieldAmount}</small>
                  </td>
                  <td>{holding.maturity}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button 
                        as={Link} 
                        to={`/treasury/${holding.id}`} 
                        variant="outline-primary" 
                        size="sm"
                      >
                        Details
                      </Button>
                      <Button 
                        as={Link} 
                        to={`/trade/${holding.id}`} 
                        variant="outline-success" 
                        size="sm"
                      >
                        Trade
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      <Alert variant="info">
        <div className="d-flex align-items-center">
          <FaWallet className="me-3 fs-4" />
          <div>
            <h5 className="mb-1">Connected Wallet</h5>
            <p className="mb-0 small">
              {account ? account : 'No wallet connected'}
            </p>
          </div>
        </div>
      </Alert>
    </Container>
  );
};

export default PortfolioPage; 