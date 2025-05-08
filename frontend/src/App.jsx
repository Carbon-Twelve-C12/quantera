import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';

// Layout Components
import Header from './components/common/Header';
import Footer from './components/common/Footer';

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

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { WalletProvider } from './contexts/WalletContext';
import { NotificationProvider } from './contexts/NotificationProvider';

const App = () => {
  // Create theme with light and dark mode support
  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#1E88E5',
      },
      secondary: {
        main: '#26A69A',
      },
      success: {
        main: '#66BB6A',
      },
      background: {
        default: '#f7f9fc',
        paper: '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
      },
      h2: {
        fontWeight: 700,
      },
      h3: {
        fontWeight: 600,
      },
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0 2px 12px 0 rgba(0,0,0,0.05)',
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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