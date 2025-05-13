import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import HomePage from './pages/HomePage';
import MarketplacePage from './pages/MarketplacePage';
import PortfolioPage from './pages/PortfolioPage';
import EnvironmentalAssetPage from './pages/EnvironmentalAssetPage';
import EnvironmentalMarketplacePage from './pages/EnvironmentalMarketplacePage';
import ImpactDashboardPage from './pages/ImpactDashboardPage';
import SmartAccountPage from './pages/SmartAccountPage';
import TradingPage from './pages/TradingPage';
import AssetDetailPage from './pages/AssetDetailPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="d-flex flex-column min-vh-100">
            <Header />
            <main className="flex-grow-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/marketplace" element={<MarketplacePage />} />
                <Route path="/portfolio" element={<PortfolioPage />} />
                <Route path="/trading" element={<TradingPage />} />
                
                {/* Asset Detail Routes */}
                <Route path="/assets/:id" element={<AssetDetailPage />} />
                
                {/* Environmental Asset Routes */}
                <Route path="/environmental/marketplace" element={<EnvironmentalMarketplacePage />} />
                <Route path="/environmental/assets/:assetId" element={<EnvironmentalAssetPage />} />
                <Route path="/environmental/impact" element={<ImpactDashboardPage />} />

                {/* Smart Account Route */}
                <Route path="/smart-account" element={<SmartAccountPage />} />
                
                <Route path="*" element={
                  <Container className="py-5 text-center">
                    <h1 className="display-1">404</h1>
                    <h2>Page Not Found</h2>
                    <p className="lead">The page you are looking for does not exist.</p>
                  </Container>
                } />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
 