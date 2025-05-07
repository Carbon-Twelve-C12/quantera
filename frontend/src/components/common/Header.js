import React from 'react';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { Link, NavLink } from 'react-router-dom';
import { FaWallet, FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../../contexts/ThemeContext';

const Header = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="py-3">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          <span className="text-primary">Q</span>uantera Platform
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/" end>
              Home
            </Nav.Link>
            <Nav.Link as={NavLink} to="/marketplace">
              Marketplace
            </Nav.Link>
            <Nav.Link as={NavLink} to="/portfolio">
              Portfolio
            </Nav.Link>
          </Nav>
          <div className="d-flex align-items-center">
            <div 
              onClick={toggleTheme} 
              className="theme-toggle-btn me-3"
              aria-label="Toggle theme"
              role="button"
              tabIndex={0}
            >
              <div className={`theme-toggle-icon ${theme === 'light' ? 'light' : 'dark'}`}>
                {theme === 'light' ? <FaSun size={12} /> : <FaMoon size={12} />}
              </div>
            </div>
            <Button variant="outline-primary">
              <FaWallet className="me-2" />
              Connect Wallet
            </Button>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header; 