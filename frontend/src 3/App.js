import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { WalletProvider } from './contexts/WalletContext';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import LandingPage from './pages/LandingPage';
import MarketplacePage from './pages/MarketplacePage';
import TreasuryDetailPage from './pages/TreasuryDetailPage';
import PortfolioPage from './pages/PortfolioPage';
import TradingPage from './pages/TradingPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/App.css';

// Private route component to protect authenticated routes
const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('auth_token') !== null;
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <WalletProvider>
        <div className="d-flex flex-column min-vh-100">
          <Header />
          <Container className="flex-grow-1 py-4">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/treasury/:id" element={<TreasuryDetailPage />} />
              <Route 
                path="/portfolio" 
                element={
                  <PrivateRoute>
                    <PortfolioPage />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/trade/:id?" 
                element={
                  <PrivateRoute>
                    <TradingPage />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <PrivateRoute>
                    <ProfilePage />
                  </PrivateRoute>
                } 
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Container>
          <Footer />
        </div>
      </WalletProvider>
    </Router>
  );
}

export default App; 