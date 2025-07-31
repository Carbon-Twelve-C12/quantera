import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-auto">
      <Container>
        <Row>
          <Col md={4} className="mb-3 mb-md-0">
            <h5>Quantera</h5>
            <p className="text-muted">
              A blockchain-based platform for tokenizing financial assets, starting with U.S. Treasury securities.
            </p>
          </Col>
          <Col md={3} className="mb-3 mb-md-0">
            <h5>Resources</h5>
            <ul className="list-unstyled">
              <li><a href="/docs/whitepaper.pdf" className="text-muted">Whitepaper</a></li>
              <li><a href="/docs/api-docs.pdf" className="text-muted">API Documentation</a></li>
              <li><a href="https://github.com/mjohnson518/vault" className="text-muted">GitHub</a></li>
            </ul>
          </Col>
          <Col md={3} className="mb-3 mb-md-0">
            <h5>Legal</h5>
            <ul className="list-unstyled">
              <li><a href="/legal/terms" className="text-muted">Terms of Service</a></li>
              <li><a href="/legal/privacy" className="text-muted">Privacy Policy</a></li>
              <li><a href="/legal/disclosures" className="text-muted">Disclosures</a></li>
            </ul>
          </Col>
          <Col md={2}>
            <h5>Connect</h5>
            <ul className="list-unstyled">
              <li><a href="mailto:hello@marcjohnson.xyz" className="text-muted">Contact</a></li>
              <li><a href="https://bsky.app/quantera" className="text-muted">BlueSky</a></li>
              <li><a href="https://discord.gg/quantera" className="text-muted">Discord</a></li>
            </ul>
          </Col>
        </Row>
        <hr className="my-3 bg-secondary" />
        <div className="text-center text-muted small">
          <p className="mb-0">© {new Date().getFullYear()} Quantera. All rights reserved.</p>
          <p className="mb-0">
            Enhanced with Ethereum Pectra: EIP-7702, EIP-7691, EIP-2537
          </p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer; 