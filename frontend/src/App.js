import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { LiquidityPoolProvider } from './contexts/LiquidityPoolContext';
import { YieldStrategyProvider } from './contexts/YieldStrategyContext';
import { PortfolioProvider } from './contexts/PortfolioContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/App.css';

// Lazy load pages instead of direct imports
const HomePage = lazy(() => import('./pages/HomePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const LiquidityPoolPage = lazy(() => import('./pages/LiquidityPoolPage'));
const YieldStrategyPage = lazy(() => import('./pages/YieldStrategyPage'));
const TradingPage = lazy(() => import('./pages/TradingPage'));
const AssetCreationPage = lazy(() => import('./pages/AssetCreationWizardPage'));
const SmartAccountPage = lazy(() => import('./pages/SmartAccountPage'));
const ContractExplorerPage = lazy(() => import('./pages/ContractExplorerPage'));
const EnvironmentalAssetPage = lazy(() => import('./pages/EnvironmentalAssetPage'));
const ImpactDashboardPage = lazy(() => import('./pages/ImpactDashboardPage'));
const AnalyticsDashboardPage = lazy(() => import('./pages/AnalyticsDashboardPage'));
const MarketplacePage = lazy(() => import('./pages/MarketplacePage'));
const EnvironmentalMarketplacePage = lazy(() => import('./pages/EnvironmentalMarketplacePage'));
const AssetDetailPage = lazy(() => import('./pages/AssetDetailPage'));
const PlatformPage = lazy(() => import('./pages/PlatformPage').then(module => ({ default: module.PlatformPage })));

// Loading component for suspense fallback
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
    <CircularProgress />
  </Box>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PortfolioProvider>
          <LiquidityPoolProvider>
            <YieldStrategyProvider>
              <Router>
                <div className="d-flex flex-column min-vh-100">
                  <Header />
                  <main className="flex-grow-1">
                    <Suspense fallback={<LoadingFallback />}>
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/marketplace" element={<MarketplacePage />} />
                        <Route path="/portfolio" element={<PortfolioPage />} />
                        <Route path="/trading" element={<TradingPage />} />
                        
                        {/* About Page Route */}
                        <Route path="/about" element={<AboutPage />} />
                        
                        {/* Asset Detail Routes */}
                        <Route path="/assets/:id" element={<AssetDetailPage />} />
                        
                        {/* Asset Creation Route */}
                        <Route path="/assets/create" element={<AssetCreationPage />} />
                        
                        {/* Environmental Asset Routes */}
                        <Route path="/environmental/marketplace" element={<EnvironmentalMarketplacePage />} />
                        <Route path="/environmental/assets/:assetId" element={<EnvironmentalAssetPage />} />
                        <Route path="/environmental/impact" element={<ImpactDashboardPage />} />

                        {/* Smart Account Route */}
                        <Route path="/smart-account" element={<SmartAccountPage />} />
                        
                        {/* Liquidity Pool Route */}
                        <Route path="/liquidity" element={<LiquidityPoolPage />} />
                        
                        {/* Yield Strategy Route */}
                        <Route path="/yield" element={<YieldStrategyPage />} />
                        
                        {/* Contract Explorer Route */}
                        <Route path="/contracts" element={<ContractExplorerPage />} />
                        
                        <Route path="/analytics" element={<AnalyticsDashboardPage />} />
                        
                        {/* Documentation Route */}
                        <Route path="/docs" element={<PlatformPage />} />
                        
                        <Route path="*" element={
                          <Container className="py-5 text-center">
                            <h1 className="display-1">404</h1>
                            <h2>Page Not Found</h2>
                            <p className="lead">The page you are looking for does not exist.</p>
                          </Container>
                        } />
                      </Routes>
                    </Suspense>
                  </main>
                  <Footer />
                </div>
              </Router>
            </YieldStrategyProvider>
          </LiquidityPoolProvider>
        </PortfolioProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
 