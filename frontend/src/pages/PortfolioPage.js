import React from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaWallet, FaChartLine, FaExchangeAlt } from 'react-icons/fa';

// Mock portfolio data
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
  // In a real application, this would check the authentication status
  const isAuthenticated = false;

  if (!isAuthenticated) {
    return (
      <Container className="py-5">
        <Card className="border-0 shadow-sm text-center p-5">
          <Card.Body>
            <FaWallet size={64} className="text-muted mb-4" />
            <h2>Connect Your Wallet</h2>
            <p className="lead mb-4">
              Please connect your Ethereum wallet to view your treasury token portfolio.
            </p>
            <Button variant="primary" size="lg">Connect Wallet</Button>
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
              <div className="rounded-circle bg-primary bg-opacity-10 p-3 mb-3">
                <FaWallet className="text-primary" size={30} />
              </div>
              <h2 className="mb-1">${MOCK_PORTFOLIO.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
              <p className="text-muted mb-0">Total Portfolio Value</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex flex-column align-items-center justify-content-center p-4">
              <div className="rounded-circle bg-success bg-opacity-10 p-3 mb-3">
                <FaChartLine className="text-success" size={30} />
              </div>
              <h2 className="mb-1">${MOCK_PORTFOLIO.totalYield.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
              <p className="text-muted mb-0">Total Yield Earned</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex flex-column align-items-center justify-content-center p-4">
              <div className="rounded-circle bg-info bg-opacity-10 p-3 mb-3">
                <FaExchangeAlt className="text-info" size={30} />
              </div>
              <h2 className="mb-1">{MOCK_PORTFOLIO.yieldRate.toFixed(2)}%</h2>
              <p className="text-muted mb-0">Average Yield Rate</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header>
          <h4 className="mb-0">Treasury Holdings</h4>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="align-middle mb-0">
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
              {MOCK_PORTFOLIO.holdings.map((holding) => (
                <tr key={holding.id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <div>
                        <div className="fw-bold">{holding.name}</div>
                        <div className="small text-muted d-flex align-items-center">
                          {holding.symbol}
                          <Badge bg="secondary" className="ms-2">
                            {holding.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{holding.quantity}</td>
                  <td>${holding.price}</td>
                  <td>${holding.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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
      
      <Alert variant="info" className="d-flex align-items-center">
        <FaWallet className="me-3 fs-4" />
        <div>
          <h5 className="mb-1">Yield Distribution</h5>
          <p className="mb-0">
            Your next yield distribution is scheduled for December 15, 2023. Yields are automatically 
            distributed to your wallet address.
          </p>
        </div>
      </Alert>
    </Container>
  );
};

export default PortfolioPage;