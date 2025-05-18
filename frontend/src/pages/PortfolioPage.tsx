import React from 'react';
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
  CircularProgress
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  PieChart as PieChartIcon,
  ForestOutlined as ForestIcon,
  RefreshOutlined as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { usePortfolio } from '../contexts/PortfolioContext';
import { 
  PerformanceChart, 
  AssetAllocation, 
  TransactionHistory, 
  YieldDistributionCard,
  AssetList 
} from '../components/portfolio';
import CompatGrid from '../components/common/CompatGrid';

// Use CompatGrid instead of MUI Grid
const Grid = CompatGrid;

const PortfolioPage: React.FC = () => {
  const navigate = useNavigate();
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
      
      {/* Portfolio Summary Cards */}
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

      {/* Yield and Transactions */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <YieldDistributionCard 
            yieldDistributions={yieldDistributions} 
            title="Upcoming Yield Distributions"
          />
        </Grid>
        <Grid item xs={12} md={8}>
          <TransactionHistory 
            transactions={transactions} 
            title="Recent Transactions"
          />
        </Grid>
      </Grid>

      {/* Environmental Impact Section (conditionally shown) */}
      {impactMetrics && portfolio.holdings.some(asset => asset.category === 'environmental') && (
        <Box sx={{ mt: 4 }}>
          <Card sx={{ 
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: 1 
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Environmental Impact Summary
              </Typography>
              
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    textAlign: 'center', 
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(16, 185, 129, 0.1)',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                  }}>
                    <ForestIcon sx={{ color: '#10b981', fontSize: 40, mb: 1 }} />
                    <Typography variant="h5" gutterBottom>
                      {impactMetrics.totalCarbonOffset.toFixed(1)} tons
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Carbon Offset (CO₂e)
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    textAlign: 'center', 
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(22, 163, 74, 0.1)',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                  }}>
                    <ForestIcon sx={{ color: '#16a34a', fontSize: 40, mb: 1 }} />
                    <Typography variant="h5" gutterBottom>
                      {impactMetrics.totalLandProtected.toFixed(1)} ha
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Land Area Protected
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    textAlign: 'center', 
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(14, 165, 233, 0.1)',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                  }}>
                    <ForestIcon sx={{ color: '#0ea5e9', fontSize: 40, mb: 1 }} />
                    <Typography variant="h5" gutterBottom>
                      {(impactMetrics.totalWaterSaved / 1000).toFixed(0)} kL
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Water Protected
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button 
                  variant="outlined" 
                  color="success" 
                  component={Link}
                  to="/environmental/impact"
                >
                  View Detailed Impact Dashboard
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Container>
  );
};

export default PortfolioPage; 