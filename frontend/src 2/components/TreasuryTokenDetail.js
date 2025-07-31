import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Row, Col, Button, Badge, Table, Tabs, Tab, Alert, Spinner } from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data for development - will be replaced with API calls
const mockTokenDetail = {
  tokenId: '0x123',
  name: '10-Year Treasury Note',
  symbol: 'TNOTE-10Y',
  treasuryType: 'TNOTE',
  currentPrice: '980.25',
  faceValue: '1000.00',
  yieldRate: 3.5,
  issuanceDate: new Date('2023-01-15').getTime() / 1000,
  maturityDate: new Date('2033-01-15').getTime() / 1000,
  status: 'ACTIVE',
  issuer: '0x8901234567890123456789012345678901234567',
  description: 'U.S. Treasury 10-Year Note issued by the Department of Treasury. This security offers a fixed interest rate paid semi-annually and is backed by the full faith and credit of the United States government.',
  totalSupply: '10000000',
  circulatingSupply: '9850000',
  lastDistribution: new Date('2023-06-15').getTime() / 1000,
  nextDistribution: new Date('2023-12-15').getTime() / 1000,
  priceHistory: [
    { date: '2023-01', price: 990.50 },
    { date: '2023-02', price: 985.75 },
    { date: '2023-03', price: 982.25 },
    { date: '2023-04', price: 978.50 },
    { date: '2023-05', price: 975.00 },
    { date: '2023-06', price: 978.75 },
    { date: '2023-07', price: 980.25 },
  ],
};

const TreasuryTokenDetail = () => {
  const { tokenId } = useParams();
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTokenDetails = async () => {
      try {
        setLoading(true);
        // In a real application, this would be an API call
        // const response = await api.getTreasuryTokenById(tokenId);
        // setToken(response.data);
        
        // Simulating API call with mock data
        setTimeout(() => {
          setToken(mockTokenDetail);
          setLoading(false);
        }, 500);
      } catch (error) {
        setError('Failed to fetch treasury token details');
        setLoading(false);
      }
    };

    fetchTokenDetails();
  }, [tokenId]);

  // Format date
  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Format address
  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Calculate time remaining until maturity
  const getTimeRemaining = (maturityTimestamp) => {
    const now = Math.floor(Date.now() / 1000);
    const remainingSecs = maturityTimestamp - now;
    
    if (remainingSecs <= 0) {
      return 'Matured';
    }
    
    const days = Math.floor(remainingSecs / 86400);
    const years = (days / 365).toFixed(1);
    
    return `${days} days (${years} years)`;
  };

  // Format status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge bg="success">Active</Badge>;
      case 'MATURED':
        return <Badge bg="warning">Matured</Badge>;
      case 'REDEEMED':
        return <Badge bg="secondary">Redeemed</Badge>;
      default:
        return <Badge bg="light">Unknown</Badge>;
    }
  };
  
  // Format treasury type
  const formatTreasuryType = (type) => {
    switch (type) {
      case 'TBILL':
        return 'Treasury Bill';
      case 'TNOTE':
        return 'Treasury Note';
      case 'TBOND':
        return 'Treasury Bond';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger mt-3" role="alert">
        {error}
      </div>
    );
  }

  if (!token) {
    return (
      <Alert variant="warning">
        Treasury token with ID {tokenId} not found.
      </Alert>
    );
  }

  return (
    <div className="treasury-token-detail mt-4">
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h3>{token.name} <small className="text-muted">{token.symbol}</small></h3>
            {getStatusBadge(token.status)}
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={8}>
              <p className="lead">{token.description}</p>
              <Row className="mt-4">
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Header>Price Information</Card.Header>
                    <Card.Body>
                      <Table borderless>
                        <tbody>
                          <tr>
                            <td>Current Price:</td>
                            <td className="text-end fw-bold">${parseFloat(token.currentPrice).toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td>Face Value:</td>
                            <td className="text-end">${parseFloat(token.faceValue).toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td>Yield Rate:</td>
                            <td className="text-end">{token.yieldRate.toFixed(2)}%</td>
                          </tr>
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Header>Time Information</Card.Header>
                    <Card.Body>
                      <Table borderless>
                        <tbody>
                          <tr>
                            <td>Issuance Date:</td>
                            <td className="text-end">{formatDate(token.issuanceDate)}</td>
                          </tr>
                          <tr>
                            <td>Maturity Date:</td>
                            <td className="text-end">{formatDate(token.maturityDate)}</td>
                          </tr>
                          <tr>
                            <td>Time to Maturity:</td>
                            <td className="text-end">{getTimeRemaining(token.maturityDate)}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>
            <Col md={4}>
              <Card className="mb-3">
                <Card.Header>Actions</Card.Header>
                <Card.Body>
                  {token.status === 'ACTIVE' && (
                    <>
                      <Button variant="success" className="w-100 mb-2">Buy</Button>
                      <Button variant="primary" className="w-100 mb-2">Sell</Button>
                    </>
                  )}
                  
                  {token.status === 'MATURED' && (
                    <Button variant="warning" className="w-100 mb-2">Redeem</Button>
                  )}
                  
                  <Button variant="outline-secondary" className="w-100 mb-2">Add to Watchlist</Button>
                  
                  {token.status === 'ACTIVE' && (
                    <Button variant="outline-primary" className="w-100">Set up Smart Account</Button>
                  )}
                </Card.Body>
              </Card>
              
              <Card>
                <Card.Header>Token Details</Card.Header>
                <Card.Body>
                  <Table borderless size="sm">
                    <tbody>
                      <tr>
                        <td>Token ID:</td>
                        <td className="text-end text-truncate" style={{ maxWidth: '150px' }}>{token.tokenId}</td>
                      </tr>
                      <tr>
                        <td>Type:</td>
                        <td className="text-end">{formatTreasuryType(token.treasuryType)}</td>
                      </tr>
                      <tr>
                        <td>Issuer:</td>
                        <td className="text-end">{formatAddress(token.issuer)}</td>
                      </tr>
                      <tr>
                        <td>Total Supply:</td>
                        <td className="text-end">{parseInt(token.totalSupply).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td>Circulating:</td>
                        <td className="text-end">{parseInt(token.circulatingSupply).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Tabs
            defaultActiveKey="price-history"
            className="mb-3 mt-4"
          >
            <Tab eventKey="price-history" title="Price History">
              <Card>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={token.priceHistory}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={['auto', 'auto']} />
                      <Tooltip formatter={(value) => ['$' + value.toFixed(2), 'Price']} />
                      <Legend />
                      <Line type="monotone" dataKey="price" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Tab>
            <Tab eventKey="yield-distribution" title="Yield Distribution">
              <Card>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <h5>Yield Distribution Schedule</h5>
                      <Table striped bordered>
                        <thead>
                          <tr>
                            <th>Event</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Last Distribution</td>
                            <td>{formatDate(token.lastDistribution)}</td>
                          </tr>
                          <tr>
                            <td>Next Distribution</td>
                            <td>{formatDate(token.nextDistribution)}</td>
                          </tr>
                          <tr>
                            <td>Final Distribution</td>
                            <td>{formatDate(token.maturityDate)}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </Col>
                    <Col md={6}>
                      <h5>Yield Information</h5>
                      <p>
                        This {formatTreasuryType(token.treasuryType)} pays a yield of {token.yieldRate.toFixed(2)}% annually.
                        For {token.treasuryType === 'TNOTE' || token.treasuryType === 'TBOND' ? 'notes and bonds' : 'bills'}, 
                        yield is distributed {token.treasuryType === 'TBILL' ? 'at maturity' : 'semi-annually'}.
                      </p>
                      <Alert variant="info">
                        <strong>Estimated Yield:</strong> Holding 1 token until maturity would yield approximately 
                        ${(parseFloat(token.faceValue) * (token.yieldRate / 100) * ((token.maturityDate - token.issuanceDate) / 31536000)).toFixed(2)}.
                      </Alert>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Tab>
            <Tab eventKey="transactions" title="Transactions">
              <Card>
                <Card.Body>
                  <Alert variant="secondary">
                    Transaction history will be available here. Connect your wallet to see your transactions.
                  </Alert>
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </div>
  );
};

export default TreasuryTokenDetail; 