import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaShieldAlt, FaExchangeAlt, FaChartLine, FaLayerGroup, FaRegFileAlt, FaCodeBranch } from 'react-icons/fa';
import { useWallet } from '../contexts/WalletContext';

const LandingPage = () => {
  const { isConnected, isAuthenticated } = useWallet();

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <div className="bg-dark text-light py-5 mb-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-5 mb-lg-0">
              <h1 className="display-4 fw-bold mb-4">Tokenized Securities on the Blockchain</h1>
              <p className="lead mb-4">
                Quantera enables fractional ownership, transparent trading, and automated yield 
                distribution of U.S. Treasury securities.
              </p>
              <div className="d-flex flex-wrap gap-3">
                {isConnected && isAuthenticated ? (
                  <Button as={Link} to="/portfolio" variant="success" size="lg">
                    Go to Portfolio
                  </Button>
                ) : (
                  <Button as={Link} to="/marketplace" variant="primary" size="lg">
                    Explore Treasury Tokens
                  </Button>
                )}
                <Button variant="outline-light" size="lg" as={Link} to="/docs/whitepaper.pdf">
                  Read Whitepaper
                </Button>
              </div>
            </Col>
            <Col lg={6} className="text-center">
              <img 
                src="/images/hero-illustration.svg" 
                alt="Treasury tokens illustration" 
                className="img-fluid"
                style={{ maxHeight: '400px' }}
                onError={(e) => {
                  // Fallback if image doesn't exist
                  e.target.style.display = 'none';
                  const parent = e.target.parentNode;
                  const div = document.createElement('div');
                  div.className = 'bg-secondary bg-opacity-25 rounded d-flex align-items-center justify-content-center';
                  div.style.height = '400px';
                  div.innerHTML = '<span className="h3 text-muted">Treasury Tokenization Platform</span>';
                  parent.appendChild(div);
                }}
              />
            </Col>
          </Row>
        </Container>
      </div>

      {/* Features Section */}
      <Container className="mb-5">
        <div className="text-center mb-5">
          <h2 className="fw-bold">Key Features</h2>
          <p className="lead text-muted">Powered by Ethereum</p>
        </div>
        
        <Row className="g-4">
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="rounded-circle bg-primary bg-opacity-10 p-3 mb-3" style={{ width: 'fit-content' }}>
                  <FaRegFileAlt className="text-primary" size={24} />
                </div>
                <h4>Tokenized Treasuries</h4>
                <p className="text-muted">
                  Own fractional shares of T-Bills, T-Notes, and T-Bonds with minimums as low as $100.
                </p>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="rounded-circle bg-success bg-opacity-10 p-3 mb-3" style={{ width: 'fit-content' }}>
                  <FaChartLine className="text-success" size={24} />
                </div>
                <h4>Automated Yield</h4>
                <p className="text-muted">
                  Receive interest distributions automatically through smart contracts without manual claiming.
                </p>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="rounded-circle bg-info bg-opacity-10 p-3 mb-3" style={{ width: 'fit-content' }}>
                  <FaExchangeAlt className="text-info" size={24} />
                </div>
                <h4>Transparent Trading</h4>
                <p className="text-muted">
                  Buy and sell treasury tokens on a transparent marketplace with real-time pricing.
                </p>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="rounded-circle bg-warning bg-opacity-10 p-3 mb-3" style={{ width: 'fit-content' }}>
                  <FaShieldAlt className="text-warning" size={24} />
                </div>
                <h4>Regulatory Compliance</h4>
                <p className="text-muted">
                  Built-in compliance framework ensures adherence to financial regulations.
                </p>
                <div className="pectra-badge">Pectra</div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="rounded-circle bg-danger bg-opacity-10 p-3 mb-3" style={{ width: 'fit-content' }}>
                  <FaCodeBranch className="text-danger" size={24} />
                </div>
                <h4>Smart Accounts (EIP-7702)</h4>
                <p className="text-muted">
                  Program your wallet to automate treasury management strategies.
                </p>
                <div className="pectra-badge">Pectra</div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="p-4">
                <div className="rounded-circle bg-primary bg-opacity-10 p-3 mb-3" style={{ width: 'fit-content' }}>
                  <FaLayerGroup className="text-primary" size={24} />
                </div>
                <h4>Layer 2 Integration (EIP-7691)</h4>
                <p className="text-muted">
                  Trade with lower fees and higher speeds using optimized L2 bridges.
                </p>
                <div className="pectra-badge">Pectra</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* How It Works Section */}
      <div className="bg-light py-5 mb-5">
        <Container>
          <div className="text-center mb-5">
            <h2 className="fw-bold">How It Works</h2>
            <p className="lead text-muted">Simple process to start earning treasury yields</p>
          </div>
          
          <Row className="justify-content-center">
            <Col lg={8}>
              <div className="position-relative pb-5">
                <div className="d-flex mb-5 position-relative">
                  <div className="step-number">1</div>
                  <div className="ms-4">
                    <h4>Connect Your Wallet</h4>
                    <p className="text-muted">
                      Connect your Ethereum wallet with support for Pectra features for the best experience.
                    </p>
                  </div>
                </div>
                
                <div className="d-flex mb-5 position-relative">
                  <div className="step-number">2</div>
                  <div className="ms-4">
                    <h4>Browse Treasury Tokens</h4>
                    <p className="text-muted">
                      Explore available treasury tokens with different maturities and yields.
                    </p>
                  </div>
                </div>
                
                <div className="d-flex mb-5 position-relative">
                  <div className="step-number">3</div>
                  <div className="ms-4">
                    <h4>Purchase Tokens</h4>
                    <p className="text-muted">
                      Buy treasury tokens with as little as $100 using ETH or stablecoins.
                    </p>
                  </div>
                </div>
                
                <div className="d-flex position-relative">
                  <div className="step-number">4</div>
                  <div className="ms-4">
                    <h4>Receive Yields</h4>
                    <p className="text-muted">
                      Automatically receive yield distributions based on the token's schedule.
                    </p>
                  </div>
                </div>
                
                <div className="step-line"></div>
              </div>
            </Col>
          </Row>
          
          <div className="text-center mt-4">
            <Button as={Link} to="/marketplace" variant="primary" size="lg">
              Get Started Now
            </Button>
          </div>
        </Container>
      </div>

      {/* CTA Section */}
      <Container className="mb-5">
        <Card className="border-0 bg-dark text-light p-5">
          <Row className="align-items-center">
            <Col lg={8} className="mb-4 mb-lg-0">
              <h2 className="mb-3">Ready to earn yields on U.S. Treasury securities?</h2>
              <p className="lead mb-0">
                Start with as little as $100 and experience the future of treasury investing.
              </p>
            </Col>
            <Col lg={4} className="text-lg-end">
              <Button as={Link} to="/marketplace" variant="light" size="lg">
                Explore Treasury Tokens
              </Button>
            </Col>
          </Row>
        </Card>
      </Container>
    </div>
  );
};

export default LandingPage; 