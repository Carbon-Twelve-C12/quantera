import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Alert,
  Divider,
  useTheme
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  PieChart as PieChartIcon,
  ForestOutlined as ForestIcon,
  WaterOutlined as WaterIcon,
  BarChart as BarChartIcon,
  Wallet as WalletIcon,
  Insights as InsightsIcon,
  EmojiNature as NatureIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';

// Mock portfolio data
const MOCK_PORTFOLIO = {
  totalValue: 25675.50,
  totalYield: 978.25,
  yieldRate: 3.81,
  impactScore: 85,
  carbonOffset: 150.8,
  holdings: [
    {
      id: '0x1',
      name: '3-Month T-Bill',
      symbol: 'TBILL3M',
      quantity: 50,
      price: 98.25,
      value: 4912.50,
      yield: 3.75,
      yieldAmount: 184.22,
      maturity: '2023-12-15',
      type: 'T-Bill',
      category: 'treasury'
    },
    {
      id: '0x2',
      name: '2-Year T-Note',
      symbol: 'TNOTE2Y',
      quantity: 120,
      price: 95.75,
      value: 11490.00,
      yield: 4.15,
      yieldAmount: 476.84,
      maturity: '2025-09-15',
      type: 'T-Note',
      category: 'treasury'
    },
    {
      id: '0x3',
      name: '10-Year T-Bond',
      symbol: 'TBOND10Y',
      quantity: 100,
      price: 92.50,
      value: 9250.00,
      yield: 4.65,
      yieldAmount: 430.13,
      maturity: '2033-09-15',
      type: 'T-Bond',
      category: 'treasury'
    },
    {
      id: '0x5f0f0e0d0c0b0a09080706050403020100000005',
      name: 'Amazon Rainforest Carbon Credits',
      symbol: 'AMZN-CC',
      quantity: 50,
      price: 24.75,
      value: 1237.50,
      yield: 0,
      yieldAmount: 0,
      impactMetrics: {
        carbonOffset: 50.0,
        landProtected: 3.0,
        waterSaved: 500000
      },
      certificationStandard: 'Verra',
      type: 'Carbon Credit',
      category: 'environmental',
      vintage: 2023,
      sdgAlignment: [13, 15]
    },
    {
      id: '0x5f0f0e0d0c0b0a09080706050403020100000006',
      name: 'Blue Carbon Mangrove Credits',
      symbol: 'BLUE-C',
      quantity: 45,
      price: 18.50,
      value: 832.50,
      yield: 0,
      yieldAmount: 0,
      impactMetrics: {
        carbonOffset: 22.5,
        landProtected: 0.6,
        waterSaved: 900000
      },
      certificationStandard: 'Gold Standard',
      type: 'Biodiversity Credit',
      category: 'environmental',
      vintage: 2023,
      sdgAlignment: [13, 14, 15]
    }
  ]
};

const PortfolioPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const theme = useTheme();
  const { theme: appTheme } = useAppTheme();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Filter assets based on tab
  const filteredAssets = MOCK_PORTFOLIO.holdings.filter(asset => {
    if (tabValue === 0) return true; // All assets
    if (tabValue === 1) return asset.category === 'treasury'; // Treasury only
    if (tabValue === 2) return asset.category === 'environmental'; // Environmental only
    return true;
  });

  // Calculate environmental impact
  const totalCarbonOffset = MOCK_PORTFOLIO.holdings
    .filter(asset => asset.category === 'environmental')
    .reduce((sum, asset) => sum + (asset.impactMetrics?.carbonOffset || 0), 0);
  
  const totalLandProtected = MOCK_PORTFOLIO.holdings
    .filter(asset => asset.category === 'environmental')
    .reduce((sum, asset) => sum + (asset.impactMetrics?.landProtected || 0), 0);
  
  const totalWaterSaved = MOCK_PORTFOLIO.holdings
    .filter(asset => asset.category === 'environmental')
    .reduce((sum, asset) => sum + (asset.impactMetrics?.waterSaved || 0), 0);

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
            <WalletIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 4 }} />
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" gutterBottom color="text.primary">
        My Portfolio
      </Typography>
      
      {/* Portfolio Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%', 
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderColor: 'divider' 
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                borderRadius: '50%',
                bgcolor: theme.palette.primary.main + '20',
                p: 1.5,
                width: 60,
                height: 60,
                mx: 'auto',
                mb: 2
              }}>
                <AccountBalanceIcon color="primary" fontSize="large" />
              </Box>
              <Typography variant="h5" component="div" gutterBottom color="text.primary">
                ${MOCK_PORTFOLIO.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
            borderColor: 'divider'
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                borderRadius: '50%',
                bgcolor: theme.palette.success.main + '20',
                p: 1.5,
                width: 60,
                height: 60,
                mx: 'auto',
                mb: 2
              }}>
                <TrendingUpIcon color="success" fontSize="large" />
              </Box>
              <Typography variant="h5" component="div" gutterBottom color="text.primary">
                ${MOCK_PORTFOLIO.totalYield.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
            borderColor: 'divider'
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                borderRadius: '50%',
                bgcolor: theme.palette.info.main + '20',
                p: 1.5,
                width: 60,
                height: 60,
                mx: 'auto',
                mb: 2
              }}>
                <PieChartIcon color="info" fontSize="large" />
              </Box>
              <Typography variant="h5" component="div" gutterBottom color="text.primary">
                {MOCK_PORTFOLIO.yieldRate.toFixed(2)}%
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
            borderColor: 'divider' 
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
                {totalCarbonOffset.toFixed(1)} tons
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Carbon Offset
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Environmental Impact Summary */}
      <Card sx={{ 
        mb: 4, 
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderColor: 'divider' 
      }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="text.primary">
            Environmental Impact Summary
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 2,
                borderRadius: 2,
                bgcolor: appTheme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                boxShadow: appTheme === 'dark' ? '0 4px 6px rgba(0, 0, 0, 0.2)' : '0 4px 6px rgba(0, 0, 0, 0.05)'
              }}>
                <ForestIcon sx={{ color: '#10b981', fontSize: 40, mb: 1 }} />
                <Typography variant="h5" gutterBottom color="text.primary">
                  {totalCarbonOffset.toFixed(1)} tons
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
                bgcolor: appTheme === 'dark' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(22, 163, 74, 0.05)',
                boxShadow: appTheme === 'dark' ? '0 4px 6px rgba(0, 0, 0, 0.2)' : '0 4px 6px rgba(0, 0, 0, 0.05)'
              }}>
                <NatureIcon sx={{ color: '#16a34a', fontSize: 40, mb: 1 }} />
                <Typography variant="h5" gutterBottom color="text.primary">
                  {totalLandProtected.toFixed(1)} ha
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
                bgcolor: appTheme === 'dark' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(14, 165, 233, 0.05)',
                boxShadow: appTheme === 'dark' ? '0 4px 6px rgba(0, 0, 0, 0.2)' : '0 4px 6px rgba(0, 0, 0, 0.05)'
              }}>
                <WaterIcon sx={{ color: '#0ea5e9', fontSize: 40, mb: 1 }} />
                <Typography variant="h5" gutterBottom color="text.primary">
                  {(totalWaterSaved / 1000).toFixed(0)} kL
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
              color="primary" 
              startIcon={<BarChartIcon />}
              component={Link}
              to="/environmental/impact"
            >
              View Detailed Impact Dashboard
            </Button>
          </Box>
        </CardContent>
      </Card>
      
      {/* Holdings Tabs and Table */}
      <Card sx={{ 
        mb: 4, 
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderColor: 'divider' 
      }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="portfolio tabs"
          >
            <Tab label="All Assets" />
            <Tab label="Treasury Securities" />
            <Tab label="Environmental Assets" />
          </Tabs>
        </Box>
        
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Asset</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Value</TableCell>
                <TableCell align="right">{tabValue === 2 ? 'Impact' : 'Yield'}</TableCell>
                <TableCell align="right">{tabValue === 2 ? 'Vintage' : 'Maturity'}</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAssets.map((asset) => (
                <TableRow key={asset.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body1" fontWeight="medium" color="text.primary">
                        {asset.name}
                      </Typography>
                      <Box display="flex" alignItems="center" mt={0.5}>
                        <Typography variant="body2" color="text.secondary" mr={1}>
                          {asset.symbol}
                        </Typography>
                        <Chip 
                          label={asset.type} 
                          size="small" 
                          color={asset.category === 'environmental' ? 'success' : 'primary'}
                          variant="outlined" 
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">{asset.quantity}</TableCell>
                  <TableCell align="right">${asset.price}</TableCell>
                  <TableCell align="right">${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell align="right">
                    {asset.category === 'environmental' ? (
                      <Typography color="success.main" variant="body2">
                        {asset.impactMetrics.carbonOffset} tons CO₂
                      </Typography>
                    ) : (
                      <>
                        <Typography color="success.main" fontWeight="medium">
                          {asset.yield}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ${asset.yieldAmount}
                        </Typography>
                      </>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {asset.category === 'environmental' ? asset.vintage : asset.maturity}
                  </TableCell>
                  <TableCell align="right">
                    <Box display="flex" gap={1} justifyContent="flex-end">
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => {
                          if (asset.category === 'environmental') {
                            navigate(`/environmental/assets/${asset.id}`);
                          } else {
                            navigate(`/treasury/${asset.id}`);
                          }
                        }}
                      >
                        Details
                      </Button>
                      <Button 
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<ShoppingCartIcon />}
                        onClick={() => navigate('/trading')}
                      >
                        Trade
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
      
      <Alert 
        severity="info" 
        sx={{
          display: 'flex',
          alignItems: 'center',
          bgcolor: appTheme === 'dark' ? 'rgba(30, 136, 229, 0.15)' : 'rgba(30, 136, 229, 0.1)',
          color: 'text.primary',
          '& .MuiAlert-icon': {
            color: appTheme === 'dark' ? '#90caf9' : '#1e88e5'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <InsightsIcon sx={{ mr: 2, fontSize: 28 }} />
          <Box>
            <Typography variant="h6" component="div" fontSize={18}>
              Yield Distribution
            </Typography>
            <Typography variant="body2">
              Your next yield distribution is scheduled for December 15, 2023. Yields are automatically 
              distributed to your wallet address.
            </Typography>
          </Box>
        </Box>
      </Alert>
    </Container>
  );
};

export default PortfolioPage;