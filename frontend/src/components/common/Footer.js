import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FaGithub, FaTwitter, FaDiscord } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-dark py-4 mt-auto">
      <Container>
        <Row className="align-items-center">
          <Col md={6} className="mb-3 mb-md-0">
            <h5 className="mb-0 text-white">
              <span className="text-primary">Q</span>uantera Platform
            </h5>
            <p className="text-white-50 mb-0">
              Tokenized Securities on Ethereum
            </p>
          </Col>
          <Col md={6} className="text-md-end">
            <div className="d-flex justify-content-md-end gap-3 mb-3">
              <a href="https://github.com/mjohnson518/vault" className="text-white">
                <FaGithub size={24} />
              </a>
              <a href="#" className="text-white">
                <FaTwitter size={24} />
              </a>
              <a href="#" className="text-white">
                <FaDiscord size={24} />
              </a>
            </div>
            <p className="mb-0 text-white-50">
              &copy; {new Date().getFullYear()} Quantera. All rights reserved.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer; 