import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Spinner, Alert } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { FaChartLine, FaClock, FaFileContract, FaExchangeAlt, FaInfoCircle } from 'react-icons/fa';

// Mock data for a specific treasury token
const getMockTreasury = (id) => {
  const treasuries = {
    '0x1': {
      id: '0x1',
      name: '3-Month T-Bill',
      symbol: 'TBILL3M',
      maturity: '3 months',
      maturityDate: '2023-12-15',
      issueDate: '2023-09-15',
      yield: 3.75,
      price: 98.25,
      faceValue: 100,
      supply: '10,000,000',
      availableSupply: '8,500,000',
      type: 'T-Bill',
      description: 'Short-term U.S. Treasury Bill with 3-month maturity period sold at a discount to face value.',
      image: 'https://images.unsplash.com/photo-1620228885847-9eab2a1adddc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      contractAddress: '0xabc123def456789abcdef123456789abcdef1234',
      transactions: [
        { type: 'Issue', date: '2023-09-15', amount: '10,000,000 tokens', price: '$98.25' },
        { type: 'Trade', date: '2023-09-17', amount: '500,000 tokens', price: '$98.30' },
        { type: 'Trade', date: '2023-09-22', amount: '750,000 tokens', price: '$98.42' },
        { type: 'Trade', date: '2023-09-30', amount: '250,000 tokens', price: '$98.60' },
      ]
    },
    '0x2': {
      id: '0x2',
      name: '2-Year T-Note',
      symbol: 'TNOTE2Y',
      maturity: '2 years',
      maturityDate: '2025-09-15',
      issueDate: '2023-09-15',
      yield: 4.15,
      price: 95.75,
      faceValue: 100,
      supply: '25,000,000',
      availableSupply: '20,000,000',
      type: 'T-Note',
      description: 'Medium-term U.S. Treasury Note with 2-year maturity period and semi-annual interest payments.',
      image: 'https://images.unsplash.com/photo-1618044733300-9472054094ee?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      contractAddress: '0xdef456789abcdef123456789abcdef123456789ab',
      transactions: [
        { type: 'Issue', date: '2023-09-15', amount: '25,000,000 tokens', price: '$95.75' },
        { type: 'Trade', date: '2023-09-18', amount: '1,200,000 tokens', price: '$95.82' },
        { type: 'Trade', date: '2023-09-25', amount: '2,300,000 tokens', price: '$95.90' },
        { type: 'Trade', date: '2023-10-02', amount: '1,500,000 tokens', price: '$96.05' },
      ]
    },
    '0x3': {
      id: '0x3',
      name: '10-Year T-Bond',
      symbol: 'TBOND10Y',
      maturity: '10 years',
      maturityDate: '2033-09-15',
      issueDate: '2023-09-15',
      yield: 4.65,
      price: 92.50,
      faceValue: 100,
      supply: '50,000,000',
      availableSupply: '45,000,000',
      type: 'T-Bond',
      description: 'Long-term U.S. Treasury Bond with 10-year maturity period and semi-annual interest payments.',
      image: 'https://images.unsplash.com/photo-1618044619888-009e412ff12a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      contractAddress: '0x123456789abcdef123456789abcdef123456789cd',
      transactions: [
        { type: 'Issue', date: '2023-09-15', amount: '50,000,000 tokens', price: '$92.50' },
        { type: 'Trade', date: '2023-09-20', amount: '1,500,000 tokens', price: '$92.65' },
        { type: 'Trade', date: '2023-09-28', amount: '2,500,000 tokens', price: '$92.80' },
        { type: 'Trade', date: '2023-10-05', amount: '1,000,000 tokens', price: '$93.10' },
      ]
    }
  };
  
  return treasuries[id] || null;
};

const TreasuryDetailPage = () => {
  const { id } = useParams();
  const [treasury, setTreasury] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate API call to get treasury details
    const fetchTreasuryDetails = async () => {
      try {
        // In a real implementation, we would call the API:
        // const response = await treasuryApi.getTreasuryById(id);
        // setTreasury(response);
        
        // Using mock data instead
        setTimeout(() => {
          const treasuryData = getMockTreasury(id);
          if (treasuryData) {
            setTreasury(treasuryData);
          } else {
            setError("Treasury token not found");
          }
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching treasury details:', error);
        setError("Failed to load treasury details");
        setLoading(false);
      }
    };

    fetchTreasuryDetails();
  }, [id]);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading treasury details...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button as={Link} to="/marketplace" variant="outline-danger">
              Return to Marketplace
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col md={8}>
          <h1 className="mb-2">{treasury.name}</h1>
          <p className="lead">{treasury.description}</p>
        </Col>
        <Col md={4} className="text-md-end d-flex flex-column justify-content-center">
          <div className="mb-2">
            <span className="fs-4 fw-bold text-success">${treasury.price}</span>
            <span className="text-muted ms-2">Current Price</span>
          </div>
          <div className="mb-3">
            <span className="fs-5 fw-bold text-primary">{treasury.yield}%</span>
            <span className="text-muted ms-2">Yield</span>
          </div>
          <div className="d-grid gap-2">
            <Button as={Link} to={`/trade/${treasury.id}`} variant="success">
              Trade This Treasury
            </Button>
          </div>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col md={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-primary text-white">
              <FaInfoCircle className="me-2" />
              Treasury Details
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <tbody>
                  <tr>
                    <th>Symbol:</th>
                    <td>{treasury.symbol}</td>
                  </tr>
                  <tr>
                    <th>Type:</th>
                    <td>{treasury.type}</td>
                  </tr>
                  <tr>
                    <th>Face Value:</th>
                    <td>${treasury.faceValue}</td>
                  </tr>
                  <tr>
                    <th>Issue Date:</th>
                    <td>{treasury.issueDate}</td>
                  </tr>
                  <tr>
                    <th>Maturity Date:</th>
                    <td>{treasury.maturityDate}</td>
                  </tr>
                  <tr>
                    <th>Maturity Period:</th>
                    <td>{treasury.maturity}</td>
                  </tr>
                  <tr>
                    <th>Total Supply:</th>
                    <td>{treasury.supply} tokens</td>
                  </tr>
                  <tr>
                    <th>Available Supply:</th>
                    <td>{treasury.availableSupply} tokens</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-success text-white">
              <FaChartLine className="me-2" />
              Yield & Performance
            </Card.Header>
            <Card.Body className="d-flex flex-column">
              <div className="mb-4">
                <h5>Current Yield: {treasury.yield}%</h5>
                <p>Treasury yields represent the return an investor will receive by holding the treasury security until maturity.</p>
              </div>
              
              <div className="mb-4">
                <h5>Price Information</h5>
                <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                  <span>Current Price:</span>
                  <span className="fw-bold">${treasury.price}</span>
                </div>
                <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                  <span>Face Value:</span>
                  <span className="fw-bold">${treasury.faceValue}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Discount:</span>
                  <span className="fw-bold">${(treasury.faceValue - treasury.price).toFixed(2)} ({((treasury.faceValue - treasury.price) / treasury.faceValue * 100).toFixed(2)}%)</span>
                </div>
              </div>
              
              <div className="mt-auto text-center">
                <Button as={Link} to={`/trade/${treasury.id}`} variant="outline-success" className="w-100">
                  <FaExchangeAlt className="me-2" />
                  View Trading Chart
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-dark text-white">
          <FaFileContract className="me-2" />
          Contract Information
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <h5>Contract Address</h5>
              <p className="font-monospace text-break">{treasury.contractAddress}</p>
            </Col>
            <Col md={6}>
              <h5>Token Standard</h5>
              <p>ERC-20 / EIP-7291 Treasury Standard</p>
            </Col>
          </Row>
          <div className="d-grid mt-3">
            <a 
              href={`https://etherscan.io/token/${treasury.contractAddress}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-outline-dark"
            >
              View on Etherscan
            </a>
          </div>
        </Card.Body>
      </Card>
      
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-secondary text-white">
          <FaClock className="me-2" />
          Recent Transactions
        </Card.Header>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Type</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {treasury.transactions.map((tx, index) => (
                <tr key={index}>
                  <td>{tx.type}</td>
                  <td>{tx.date}</td>
                  <td>{tx.amount}</td>
                  <td>{tx.price}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TreasuryDetailPage; 