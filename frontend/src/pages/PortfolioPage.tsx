import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Button,
  Alert,
  Paper,
  LinearProgress,
  CircularProgress,
  Tab,
  Tabs,
  useTheme
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  PieChart as PieChartIcon,
  ForestOutlined as ForestIcon,
  RefreshOutlined as RefreshIcon,
  Dashboard as DashboardIcon,
  AssessmentOutlined as AssessmentIcon,
  StackedLineChartOutlined as StackedLineChartIcon,
  MonetizationOnOutlined as MonetizationOnIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { usePortfolio } from '../contexts/PortfolioContext';
import { 
  PerformanceChart, 
  AssetAllocation, 
  TransactionHistory, 
  YieldDistributionCard,
  AssetList,
  PortfolioAnalytics,
  RiskAnalysis,
  YieldMetrics,
  TradeFinancePortfolioSection,
  TradeFinanceAnalytics
} from '../components/portfolio';
import CompatGrid from '../components/common/CompatGrid';

// Use CompatGrid instead of MUI Grid
const Grid = CompatGrid;

const PortfolioPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const auth = useAuth();
  // Using type assertion since currentUser exists in implementation but not in TypeScript definition
  const currentUser = (auth as any).currentUser;
  
  const { 
    portfolio,
    transactions,
    yieldDistributions,
    performance,
    impactMetrics,
    loading,
    error,
    activeFilter,
    setActiveFilter,
    refreshPortfolio
  } = usePortfolio();

  // Dashboard view state
  const [dashboardView, setDashboardView] = useState<string>('overview');

  const handleDashboardChange = (event: React.SyntheticEvent, newValue: string) => {
    setDashboardView(newValue);
  };

  // Check if user is authenticated
  if (!currentUser) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Card sx={{ 
          p: 5, 
          borderRadius: 2,
          bgcolor: 'background.paper',
          color: 'text.primary'
        }}>
          <CardContent>
            <AccountBalanceIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 4 }} />
            <Typography variant="h4" gutterBottom>
              Connect Your Wallet
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              Please connect your Ethereum wallet to view your treasury token portfolio.
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              onClick={() => {}} // Would trigger wallet connection
            >
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Paper sx={{ p: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <CircularProgress />
          <Typography variant="h6">Loading Portfolio Data...</Typography>
        </Paper>
      </Container>
    );
  }

  // Show error state
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={refreshPortfolio}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  // No portfolio data
  if (!portfolio) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Card sx={{ 
          p: 5, 
          borderRadius: 2,
          bgcolor: 'background.paper',
          color: 'text.primary'
        }}>
          <CardContent>
            <AccountBalanceIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 4 }} />
            <Typography variant="h4" gutterBottom>
              No Assets Yet
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              You don't have any assets in your portfolio yet. Explore the marketplace to get started.
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              component={Link}
              to="/marketplace"
            >
              Explore Marketplace
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // Calculate asset values by category for analytics
  const calculateAssetValuesByCategory = () => {
    const valuesByCategory: {[key: string]: number} = {};
    
    portfolio.holdings.forEach(asset => {
      valuesByCategory[asset.category] = (valuesByCategory[asset.category] || 0) + asset.value;
    });
    
    return valuesByCategory;
  };

  const assetValuesByCategory = calculateAssetValuesByCategory();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          My Portfolio
        </Typography>
        
        <Button 
          startIcon={<RefreshIcon />}
          onClick={refreshPortfolio}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>
      
      {/* Dashboard Tabs */}
      <Box sx={{ width: '100%', mb: 3 }}>
        <Tabs
          value={dashboardView}
          onChange={handleDashboardChange}
          aria-label="portfolio dashboard tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 500,
              minHeight: 48,
              minWidth: 110
            }
          }}
        >
          <Tab 
            icon={<DashboardIcon />} 
            iconPosition="start" 
            label="Overview" 
            value="overview" 
          />
          <Tab 
            icon={<StackedLineChartIcon />} 
            iconPosition="start" 
            label="Analytics" 
            value="analytics" 
          />
          <Tab 
            icon={<AssessmentIcon />} 
            iconPosition="start" 
            label="Risk Analysis" 
            value="risk" 
          />
          <Tab 
            icon={<MonetizationOnIcon />} 
            iconPosition="start" 
            label="Yield" 
            value="yield" 
          />
          <Tab 
            icon={<AccountBalanceWalletIcon />} 
            iconPosition="start" 
            label="Trade Finance" 
            value="tradefinance" 
          />
          {impactMetrics && portfolio.holdings.some(asset => asset.category === 'environmental') && (
            <Tab 
              icon={<ForestIcon />} 
              iconPosition="start" 
              label="Environmental Impact" 
              value="environmental" 
            />
          )}
        </Tabs>
      </Box>
      
      {/* Portfolio Summary Cards - Visible on all views */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: 1
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                borderRadius: '50%',
                bgcolor: 'primary.main' + '20',
                p: 1.5,
                width: 60,
                height: 60,
                mx: 'auto',
                mb: 2
              }}>
                <AccountBalanceIcon color="primary" fontSize="large" />
              </Box>
              <Typography variant="h5" component="div" gutterBottom color="text.primary">
                ${portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Portfolio Value
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: 1
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                borderRadius: '50%',
                bgcolor: 'success.main' + '20',
                p: 1.5,
                width: 60,
                height: 60,
                mx: 'auto',
                mb: 2
              }}>
                <TrendingUpIcon color="success" fontSize="large" />
              </Box>
              <Typography variant="h5" component="div" gutterBottom color="text.primary">
                ${portfolio.totalYield.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Yield Earned
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: 1
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                borderRadius: '50%',
                bgcolor: 'info.main' + '20',
                p: 1.5,
                width: 60,
                height: 60,
                mx: 'auto',
                mb: 2
              }}>
                <PieChartIcon color="info" fontSize="large" />
              </Box>
              <Typography variant="h5" component="div" gutterBottom color="text.primary">
                {portfolio.yieldRate.toFixed(2)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average Yield Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: 1
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                borderRadius: '50%',
                bgcolor: '#10b981' + '20', // Environmental green with transparency
                p: 1.5,
                width: 60,
                height: 60,
                mx: 'auto',
                mb: 2
              }}>
                <ForestIcon sx={{ color: '#10b981' }} fontSize="large" />
              </Box>
              <Typography variant="h5" component="div" gutterBottom color="text.primary">
                {portfolio.carbonOffset?.toFixed(1) || 0} tons
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Carbon Offset
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Overview Dashboard View */}
      {dashboardView === 'overview' && (
        <>
          {/* Charts and Data */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={8}>
              <PerformanceChart 
                performanceHistory={portfolio.performanceHistory} 
                title="Portfolio Performance"
                height={300}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <AssetAllocation 
                assetAllocation={portfolio.assetAllocation} 
                title="Asset Allocation"
                height={300}
              />
            </Grid>
          </Grid>

          {/* Asset List */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <AssetList 
                assets={portfolio.holdings} 
                title="Your Assets"
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
              />
            </Grid>
          </Grid>

          {/* Trade Finance, Yield, and Transactions */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <YieldDistributionCard 
                yieldDistributions={yieldDistributions} 
                title="Upcoming Yield Distributions"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TradeFinancePortfolioSection 
                maxItems={3}
                height={400}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TransactionHistory 
                transactions={transactions} 
                title="Recent Transactions"
              />
            </Grid>
          </Grid>
        </>
      )}

      {/* Analytics Dashboard View */}
      {dashboardView === 'analytics' && performance && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <PortfolioAnalytics 
              performance={performance} 
              assetAllocation={portfolio.assetAllocation}
              assetValuesByCategory={assetValuesByCategory}
            />
          </Grid>
          <Grid item xs={12}>
            <PerformanceChart 
              performanceHistory={portfolio.performanceHistory} 
              title="Detailed Portfolio Performance"
              height={400}
            />
          </Grid>
          <Grid item xs={12}>
            <TransactionHistory 
              transactions={transactions} 
              title="Complete Transaction History"
            />
          </Grid>
        </Grid>
      )}

      {/* Risk Analysis Dashboard View */}
      {dashboardView === 'risk' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <RiskAnalysis holdings={portfolio.holdings} />
          </Grid>
          <Grid item xs={12} md={6}>
            <AssetAllocation 
              assetAllocation={portfolio.assetAllocation} 
              title="Portfolio Diversification"
              height={300}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              height: '100%',
              bgcolor: 'background.paper',
              color: 'text.primary',
              boxShadow: theme.shadows[1]
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Risk Mitigation Strategies</Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Diversify further</strong> across additional asset classes to reduce concentration risk.
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Balance maturity dates</strong> to manage reinvestment risk and liquidity needs.
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Consider environmental assets</strong> to hedge against climate transition risks.
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Evaluate yield strategies</strong> to optimize return relative to risk.
                    </Typography>
                  </Box>
                  <Box component="li">
                    <Typography variant="body2">
                      <strong>Monitor market trends</strong> and rebalance positions accordingly.
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    component={Link}
                    to="/marketplace"
                  >
                    Explore Diversification Options
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Yield Dashboard View */}
      {dashboardView === 'yield' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <YieldMetrics 
              holdings={portfolio.holdings}
              yieldDistributions={yieldDistributions}
              totalYield={portfolio.totalYield}
              averageYieldRate={portfolio.yieldRate}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              height: '100%',
              bgcolor: 'background.paper',
              color: 'text.primary',
              boxShadow: theme.shadows[1]
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Yield Optimization Strategies</Typography>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 171, 85, 0.08)' : 'rgba(0, 171, 85, 0.08)',
                    mb: 2
                  }}>
                    <Typography variant="subtitle2" gutterBottom color="success.main">
                      Auto-Compounding
                    </Typography>
                    <Typography variant="body2">
                      Automatically reinvest yield distributions to accelerate growth through compound interest.
                    </Typography>
                    <Button 
                      size="small" 
                      color="success" 
                      sx={{ mt: 1 }}
                      component={Link}
                      to="/yield-strategies"
                    >
                      Explore Strategy
                    </Button>
                  </Box>

                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.08)' : 'rgba(33, 150, 243, 0.08)',
                    mb: 2
                  }}>
                    <Typography variant="subtitle2" gutterBottom color="info.main">
                      Yield Laddering
                    </Typography>
                    <Typography variant="body2">
                      Distribute investments across different maturities to balance yield and liquidity.
                    </Typography>
                    <Button 
                      size="small" 
                      color="info" 
                      sx={{ mt: 1 }}
                      component={Link}
                      to="/yield-strategies"
                    >
                      Explore Strategy
                    </Button>
                  </Box>

                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 171, 0, 0.08)' : 'rgba(255, 171, 0, 0.08)'
                  }}>
                    <Typography variant="subtitle2" gutterBottom color="warning.main">
                      Yield Aggregation
                    </Typography>
                    <Typography variant="body2">
                      Dynamically allocate assets to highest yielding options while managing risk exposure.
                    </Typography>
                    <Button 
                      size="small" 
                      color="warning" 
                      sx={{ mt: 1 }}
                      component={Link}
                      to="/yield-strategies"
                    >
                      Explore Strategy
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <YieldDistributionCard 
              yieldDistributions={yieldDistributions} 
              title="Detailed Yield Schedule"
            />
          </Grid>
        </Grid>
      )}

      {/* Trade Finance Dashboard View */}
      {dashboardView === 'tradefinance' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ 
              bgcolor: 'background.paper',
              color: 'text.primary',
              boxShadow: theme.shadows[1]
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Trade Finance Portfolio</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Your trade finance investments provide exposure to short-term, high-yield assets backed by real-world trade activities.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <TradeFinanceAnalytics height={400} />
          </Grid>
          
          <Grid item xs={12}>
            <TradeFinancePortfolioSection height={500} maxItems={10} />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              height: '100%',
              bgcolor: 'background.paper',
              color: 'text.primary',
              boxShadow: theme.shadows[1]
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Benefits of Trade Finance</Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Low Correlation</strong> to traditional asset classes and market volatility
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Short Duration</strong> with typical maturities of 30-180 days
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Asset-Backed</strong> by real-world trade flows and goods
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Attractive Yields</strong> compared to other fixed-income investments
                    </Typography>
                  </Box>
                  <Box component="li">
                    <Typography variant="body2">
                      <strong>Portfolio Diversification</strong> across industries and geographies
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    component={Link}
                    to="/trade-finance"
                  >
                    Explore Trade Finance Assets
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              height: '100%',
              bgcolor: 'background.paper',
              color: 'text.primary',
              boxShadow: theme.shadows[1]
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Risk Considerations</Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Counterparty Risk:</strong> Carefully evaluate the creditworthiness of trade parties
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Country Risk:</strong> Consider political and economic stability of countries involved
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Documentation Risk:</strong> Ensure proper verification of trade documents
                    </Typography>
                  </Box>
                  <Box component="li" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>Liquidity Risk:</strong> Secondary market may have limited liquidity
                    </Typography>
                  </Box>
                  <Box component="li">
                    <Typography variant="body2">
                      <strong>Fraud Risk:</strong> Rely on our KYC and verification processes
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    component={Link}
                    to="/trade-finance/portfolio"
                  >
                    View Detailed Analytics
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Environmental Impact Dashboard View */}
      {dashboardView === 'environmental' && impactMetrics && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ 
              bgcolor: 'background.paper',
              color: 'text.primary',
              boxShadow: 1 
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Environmental Impact Dashboard
                </Typography>
                
                <Box sx={{ mt: 3 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ 
                        textAlign: 'center', 
                        p: 3,
                        borderRadius: 2,
                        bgcolor: 'rgba(16, 185, 129, 0.1)',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                      }}>
                        <ForestIcon sx={{ color: '#10b981', fontSize: 48, mb: 1 }} />
                        <Typography variant="h4" gutterBottom>
                          {impactMetrics.totalCarbonOffset.toFixed(1)} tons
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Carbon Offset (CO₂e)
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Equivalent to:
                          </Typography>
                          <Typography variant="body1" fontWeight="medium" color="success.main" sx={{ mt: 0.5 }}>
                            {(impactMetrics.totalCarbonOffset * 2.3).toFixed(0)} trees planted
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Box sx={{ 
                        textAlign: 'center', 
                        p: 3,
                        borderRadius: 2,
                        bgcolor: 'rgba(22, 163, 74, 0.1)',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                      }}>
                        <ForestIcon sx={{ color: '#16a34a', fontSize: 48, mb: 1 }} />
                        <Typography variant="h4" gutterBottom>
                          {impactMetrics.totalLandProtected.toFixed(1)} ha
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Land Area Protected
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Equivalent to:
                          </Typography>
                          <Typography variant="body1" fontWeight="medium" color="success.main" sx={{ mt: 0.5 }}>
                            {(impactMetrics.totalLandProtected * 1.4).toFixed(1)} football fields
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Box sx={{ 
                        textAlign: 'center', 
                        p: 3,
                        borderRadius: 2,
                        bgcolor: 'rgba(14, 165, 233, 0.1)',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                      }}>
                        <ForestIcon sx={{ color: '#0ea5e9', fontSize: 48, mb: 1 }} />
                        <Typography variant="h4" gutterBottom>
                          {(impactMetrics.totalWaterSaved / 1000).toFixed(0)} kL
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Water Protected
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Equivalent to:
                          </Typography>
                          <Typography variant="body1" fontWeight="medium" color="info.main" sx={{ mt: 0.5 }}>
                            {((impactMetrics.totalWaterSaved / 1000) / 2.5).toFixed(0)} households' yearly use
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Sustainable Development Goals Impact
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      {Object.entries(impactMetrics.sdgContributions).map(([sdgNumber, score]) => (
                        <Grid item xs={6} sm={4} md={3} key={sdgNumber}>
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            p: 2,
                            borderRadius: 2,
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                          }}>
                            <Box
                              component="img"
                              src={`/images/sdg/sdg-${sdgNumber}.png`}
                              alt={`SDG ${sdgNumber}`}
                              sx={{ 
                                width: 60, 
                                height: 60, 
                                mb: 1,
                                borderRadius: '50%',
                                objectFit: 'cover'
                              }}
                            />
                            <Typography variant="body2" fontWeight="medium">
                              SDG {sdgNumber}
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={score} 
                              sx={{ 
                                width: '100%', 
                                mt: 1, 
                                height: 6, 
                                borderRadius: 3,
                                backgroundColor: theme.palette.mode === 'dark' 
                                  ? 'rgba(255, 255, 255, 0.1)' 
                                  : 'rgba(0, 0, 0, 0.1)',
                              }}
                            />
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {score}/100
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                  
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Impact by Project
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      {impactMetrics.impactByProject.map((project, index) => (
                        <Grid item xs={12} md={6} key={project.projectId}>
                          <Box sx={{ 
                            p: 2, 
                            borderRadius: 2,
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                            height: '100%'
                          }}>
                            <Typography variant="subtitle1" gutterBottom>
                              {project.projectName}
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={4}>
                                <Typography variant="body2" color="text.secondary">
                                  Carbon Offset
                                </Typography>
                                <Typography variant="body1" fontWeight="medium" color="success.main">
                                  {project.carbonOffset.toFixed(1)} tons
                                </Typography>
                              </Grid>
                              {project.landProtected && (
                                <Grid item xs={4}>
                                  <Typography variant="body2" color="text.secondary">
                                    Land Protected
                                  </Typography>
                                  <Typography variant="body1" fontWeight="medium" color="success.main">
                                    {project.landProtected.toFixed(1)} ha
                                  </Typography>
                                </Grid>
                              )}
                              {project.waterSaved && (
                                <Grid item xs={4}>
                                  <Typography variant="body2" color="text.secondary">
                                    Water Saved
                                  </Typography>
                                  <Typography variant="body1" fontWeight="medium" color="info.main">
                                    {(project.waterSaved / 1000).toFixed(0)} kL
                                  </Typography>
                                </Grid>
                              )}
                            </Grid>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Box>
                
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                  <Button 
                    variant="contained" 
                    color="success" 
                    component={Link}
                    to="/environmental/marketplace"
                    size="large"
                  >
                    Explore Environmental Assets
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default PortfolioPage; 