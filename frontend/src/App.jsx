import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';

// Layout Components
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import GlobalStyles from './styles/GlobalStyles';

// Page Components
import HomePage from './pages/HomePage';
import MarketplacePage from './pages/MarketplacePage';
import TreasuryDetailPage from './pages/TreasuryDetailPage';
import PortfolioPage from './pages/PortfolioPage';
import TradingPage from './pages/TradingPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';
import EnvironmentalMarketplacePage from './pages/EnvironmentalMarketplacePage';
import EnvironmentalAssetPage from './pages/EnvironmentalAssetPage';
import ImpactDashboardPage from './pages/ImpactDashboardPage';

// Trade Finance Components
import TradeFinanceMarketplace from './components/tradeFinance/TradeFinanceMarketplace';
import { TradeFinanceProvider } from './contexts/TradeFinanceContext';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { WalletProvider } from './contexts/WalletContext';
import { NotificationProvider } from './contexts/NotificationProvider';
import { ThemeProvider } from './contexts/ThemeContext';

// Trade Finance Route Component (with context provider)
const TradeFinanceRoute = () => (
  <TradeFinanceProvider>
    <TradeFinanceMarketplace />
  </TradeFinanceProvider>
);

const App = () => {
  return (
    <ThemeProvider>
      <GlobalStyles />
      <AuthProvider>
        <WalletProvider>
          <NotificationProvider>
            <Router>
              <Box display="flex" flexDirection="column" minHeight="100vh">
                <Header />
                <Box component="main" flexGrow={1} mt={2} mb={4}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/marketplace" element={<MarketplacePage />} />
                    <Route path="/treasury/:treasuryId" element={<TreasuryDetailPage />} />
                    <Route path="/portfolio" element={<PortfolioPage />} />
                    <Route path="/trading" element={<TradingPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    
                    {/* Environmental Asset Routes */}
                    <Route path="/environmental/marketplace" element={<EnvironmentalMarketplacePage />} />
                    <Route path="/environmental/assets/:assetId" element={<EnvironmentalAssetPage />} />
                    <Route path="/environmental/impact" element={<ImpactDashboardPage />} />
                    
                    {/* Trade Finance Routes */}
                    <Route path="/tradefinance/marketplace" element={<TradeFinanceRoute />} />
                    
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Box>
                <Footer />
              </Box>
            </Router>
          </NotificationProvider>
        </WalletProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App; 