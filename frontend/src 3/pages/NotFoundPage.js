import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';

const NotFoundPage = () => {
  return (
    <Container className="py-5 text-center">
      <Row className="justify-content-center">
        <Col md={6}>
          <div className="py-5">
            <FaSearch size={60} className="text-muted mb-4" />
            <h1 className="display-4 mb-4">404</h1>
            <h2 className="mb-4">Page Not Found</h2>
            <p className="lead text-muted mb-5">
              The page you are looking for might have been removed, had its name changed,
              or is temporarily unavailable.
            </p>
            <div className="d-flex justify-content-center gap-3">
              <Button as={Link} to="/" variant="primary">
                Go to Home
              </Button>
              <Button as={Link} to="/marketplace" variant="outline-primary">
                Browse Treasury Tokens
              </Button>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFoundPage; 