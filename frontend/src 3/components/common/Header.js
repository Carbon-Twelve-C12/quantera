import React, { useState } from 'react';
import { Container, Navbar, Nav, Button, Spinner, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useWallet } from '../../contexts/WalletContext';
import { shortenAddress } from '../../utils/helpers';

const Header = () => {
  const { 
    address, 
    isConnecting, 
    isConnected,
    isAuthenticated,
    error,
    connectWallet,
    authenticate,
    disconnect,
    clearError
  } = useWallet();

  const [showAuthAlert, setShowAuthAlert] = useState(false);
  const navigate = useNavigate();

  const handleConnectWallet = async () => {
    clearError();
    if (!isConnected) {
      const connected = await connectWallet();
      if (connected && !isAuthenticated) {
        setShowAuthAlert(true);
      }
    } else if (isConnected && !isAuthenticated) {
      setShowAuthAlert(true);
    } else if (isConnected && isAuthenticated) {
      disconnect();
    }
  };

  const handleAuthenticate = async () => {
    clearError();
    const success = await authenticate();
    if (success) {
      setShowAuthAlert(false);
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handlePortfolioClick = () => {
    navigate('/portfolio');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <img
            src="/logo.svg"
            width="30"
            height="30"
            className="d-inline-block align-top me-2"
            alt="Quantera Logo"
          />
          Quantera
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/marketplace">Marketplace</Nav.Link>
            {isAuthenticated && (
              <>
                <Nav.Link as={Link} to="/portfolio">Portfolio</Nav.Link>
                <Nav.Link as={Link} to="/trade">Trade</Nav.Link>
              </>
            )}
          </Nav>
          <div className="d-flex align-items-center">
            {error && (
              <Alert variant="danger" className="py-1 px-2 me-2 mb-0">
                {error}
                <Button 
                  variant="link" 
                  className="p-0 ms-2 text-danger" 
                  onClick={clearError}
                  style={{ fontSize: '0.8rem' }}
                >
                  Dismiss
                </Button>
              </Alert>
            )}
            
            {isConnected && isAuthenticated && (
              <>
                <Button 
                  variant="outline-success" 
                  size="sm" 
                  className="me-2"
                  onClick={handlePortfolioClick}
                >
                  Portfolio
                </Button>
                <Button 
                  variant="outline-light" 
                  size="sm" 
                  className="me-2"
                  onClick={handleProfileClick}
                >
                  {shortenAddress(address)}
                </Button>
              </>
            )}
            
            <Button 
              variant={isConnected && isAuthenticated ? "outline-danger" : "outline-primary"}
              onClick={handleConnectWallet}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Connecting...
                </>
              ) : isConnected && isAuthenticated ? (
                'Disconnect'
              ) : isConnected ? (
                'Authenticate'
              ) : (
                'Connect Wallet'
              )}
            </Button>
          </div>
        </Navbar.Collapse>
      </Container>
      
      {showAuthAlert && isConnected && !isAuthenticated && (
        <div className="position-fixed top-0 start-0 end-0 mt-5 d-flex justify-content-center" style={{ zIndex: 1050 }}>
          <Alert 
            variant="warning" 
            className="d-flex align-items-center justify-content-between px-4"
            onClose={() => setShowAuthAlert(false)} 
            dismissible
          >
            <span>Please authenticate with your wallet to access all features</span>
            <Button 
              variant="success" 
              size="sm" 
              className="ms-3"
              onClick={handleAuthenticate}
            >
              Authenticate
            </Button>
          </Alert>
        </div>
      )}
    </Navbar>
  );
};

export default Header; 