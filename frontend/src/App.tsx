import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { TreasuryList, TreasuryDetail, CreateTreasury, TreasuryComparison } from './components';
import Login from './components/Login';
import MarketplacePage from './pages/MarketplacePage';
import AssetDetailPage from './pages/AssetDetailPage';
import EnhancedLiquidityPoolPage from './pages/EnhancedLiquidityPoolPage';
import AboutPage from './pages/AboutPage';
import ContractExplorerPage from './pages/ContractExplorerPage';
import YieldStrategyPage from './pages/YieldStrategyPage';
import PortfolioPage from './pages/PortfolioPage';
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage';
import EnvironmentalAssetPage from './pages/EnvironmentalAssetPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LiquidityPoolProvider } from './contexts/LiquidityPoolContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
// Temporarily disable TypeScript's checking for this import 
// @ts-ignore
import { WalletProvider } from './contexts/WalletContext';
import WalletConnectButton from './components/common/WalletConnectButton';

// Import styles
import './App.css';
import './styles/marketplace.css';
import './styles/assetDetail.css';

// Protected Route component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) {
    return <div className="loading">Loading authentication status...</div>;
  }
  
  if (!isAuthenticated) {
    // Redirect to the login page, but save the current location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <WalletProvider>
          <LiquidityPoolProvider>
            <AnalyticsProvider>
              <Router>
                <div className="app">
                  <AppContent />
                </div>
              </Router>
            </AnalyticsProvider>
          </LiquidityPoolProvider>
        </WalletProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

// Separate component for app content to access auth context inside Router
const AppContent: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  
  return (
    <>
      <header className="app-header">
        <h1>Quantera Treasury Platform</h1>
        <nav className="main-nav">
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/treasuries">Treasuries</Link></li>
            <li><Link to="/marketplace">Marketplace</Link></li>
            <li><Link to="/liquidity">Liquidity Pools</Link></li>
            <li><Link to="/yield">Yield Strategy</Link></li>
            <li><Link to="/portfolio">Portfolio</Link></li>
            <li><Link to="/analytics">Analytics</Link></li>
            <li><Link to="/compare">Compare</Link></li>
            <li><Link to="/create">Create Treasury</Link></li>
            {isAuthenticated ? (
              <>
                <li className="user-info">
                  <span>Welcome, {user?.username}</span>
                  <button onClick={logout} className="logout-button">Logout</button>
                </li>
              </>
            ) : (
              <li><Link to="/login">Login</Link></li>
            )}
            <li className="wallet-button-container">
              <WalletConnectButton size="sm" />
            </li>
          </ul>
        </nav>
      </header>
      
      <main className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/treasuries" element={<TreasuryList />} />
          <Route path="/treasuries/:id" element={<TreasuryDetail />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/analytics" element={<AnalyticsDashboardPage />} />
          <Route path="/assets/:id" element={<AssetDetailPage />} />
          <Route path="/environmental/assets/:assetId" element={<EnvironmentalAssetPage />} />
          <Route path="/liquidity" element={<EnhancedLiquidityPoolPage />} />
          <Route path="/yield" element={<YieldStrategyPage />} />
          <Route path="/compare" element={<TreasuryComparison />} />
          <Route path="/contracts" element={<ContractExplorerPage />} />
          <Route path="/create" element={
            <ProtectedRoute>
              <CreateTreasury />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      
      <footer className="app-footer">
        <p>© 2023 Quantera - Tokenized Treasury Platform</p>
      </footer>
    </>
  );
};

// Simple home page component
const Home: React.FC = () => (
  <div className="home-page">
    <h2>Welcome to Quantera Treasury Platform</h2>
    <p>A secure platform for tokenized treasury management</p>
    <div className="home-actions">
      <Link to="/marketplace" className="button primary">Browse Marketplace</Link>
      <Link to="/treasuries" className="button secondary">Browse Treasuries</Link>
      <Link to="/portfolio" className="button secondary">View Portfolio</Link>
      <Link to="/analytics" className="button secondary">Platform Analytics</Link>
      <Link to="/liquidity" className="button secondary">Manage Liquidity</Link>
      <Link to="/create" className="button secondary">Create New Treasury</Link>
    </div>
  </div>
);

export default App; 