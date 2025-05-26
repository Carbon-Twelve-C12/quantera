import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaChartLine, FaShieldAlt, FaExchangeAlt } from 'react-icons/fa';
import ImageWithFallback from '../components/common/ImageWithFallback';

const HomePage = () => {
  return (
    <>
      {/* Hero Section */}
      <div className="bg-primary text-white py-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-4 mb-lg-0">
              <h1 className="display-4 fw-bold mb-3">
                Tokenized Financial Products
              </h1>
              <p className="lead mb-4">
                Quantera brings financial products to Ethereum, enabling fractional ownership, instant settlement, and 24/7 liquidity.
              </p>
              <div className="d-flex gap-3">
                <Button as={Link} to="/marketplace" variant="light" size="lg">
                  Explore Marketplace
                </Button>
                <Button as={Link} to="/portfolio" variant="outline-light" size="lg">
                  View Portfolio
                </Button>
              </div>
            </Col>
            <Col lg={6} className="text-center">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1639762681057-408e52192e55"
                alt="Digital Financial Innovation" 
                className="img-fluid rounded shadow"
                style={{ maxHeight: '400px' }}
              />
            </Col>
          </Row>
        </Container>
      </div>

      {/* Features Section */}
      <Container className="py-5">
        <h2 className="text-center mb-5">Key Features</h2>
        <Row className="g-4">
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="p-4 text-center">
                <div className="feature-icon-wrapper">
                  <FaChartLine className="feature-icon" />
                </div>
                <Card.Title>Yield Generation</Card.Title>
                <Card.Text>
                  Earn interest on your tokenized financial products with automatic yield distribution.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="p-4 text-center">
                <div className="feature-icon-wrapper">
                  <FaShieldAlt className="feature-icon" />
                </div>
                <Card.Title>Security & Compliance</Card.Title>
                <Card.Text>
                  All assets follow appropriate regulatory frameworks for their respective asset classes.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="p-4 text-center">
                <div className="feature-icon-wrapper">
                  <FaExchangeAlt className="feature-icon" />
                </div>
                <Card.Title>Seamless Trading</Card.Title>
                <Card.Text>
                  Trade tokenized assets 24/7 with instant settlement and low transaction costs.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* CTA Section */}
      <div className="py-5 bg-primary-light">
        <Container className="text-center">
          <h2 className="mb-3">Get started</h2>
          <p className="lead mb-4">
            Connect your wallet and start exploring tokenized financial products today.
          </p>
          <Button as={Link} to="/marketplace" variant="primary" size="lg">
            Browse Marketplace
          </Button>
        </Container>
      </div>
    </>
  );
};

export default HomePage;