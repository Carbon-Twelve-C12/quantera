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
import { ThemeProvider as BootstrapThemeProvider } from './contexts/ThemeContext';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { AuthProvider } from './contexts/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/App.css';

// Create a Material-UI theme to be used with environmental components
const muiTheme = createTheme({
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
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
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

function App() {
  return (
    <BootstrapThemeProvider>
      <MuiThemeProvider theme={muiTheme}>
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
      </MuiThemeProvider>
    </BootstrapThemeProvider>
  );
}

export default App;
 