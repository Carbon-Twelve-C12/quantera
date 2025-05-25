import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  LinearProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  TrendingUp,
  TrendingDown,
  SwapHoriz as Exchange,
  Timeline as Activity,
  BarChart as BarChart3,
  Settings,
  Info,
  CheckCircle,
  Warning as AlertCircle,
  Add,
  Refresh,
  Visibility,
  AccountBalance,
  CurrencyExchange,
} from '@mui/icons-material';
import { ProfessionalChart } from '../charts/ProfessionalChart';

// Styled components
const DashboardContainer = styled(Box)({
  padding: '32px',
  background: 'linear-gradient(135deg, rgba(26, 35, 126, 0.02) 0%, rgba(63, 81, 181, 0.02) 100%)',
  minHeight: '100vh',
});

const StyledCard = styled(Card)(({ theme }) => ({
  background: '#ffffff',
  borderRadius: '16px',
  boxShadow: '0 4px 24px rgba(26, 35, 126, 0.08)',
  border: '1px solid rgba(26, 35, 126, 0.08)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  
  '&:hover': {
    boxShadow: '0 8px 40px rgba(26, 35, 126, 0.12)',
    transform: 'translateY(-2px)',
  },
}));

const MetricCard = styled(StyledCard)({
  position: 'relative',
  overflow: 'hidden',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)',
  },
});

const ExchangeTypeBadge = styled(Chip)<{ exchangeType: string }>(({ exchangeType }) => {
  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'traditional': return { bg: '#e8f5e8', color: '#2e7d32', border: '#2e7d32' };
      case 'digital': return { bg: '#e3f2fd', color: '#1976d2', border: '#1976d2' };
      case 'dex': return { bg: '#f3e5f5', color: '#7b1fa2', border: '#7b1fa2' };
      case 'hybrid': return { bg: '#fff8e1', color: '#f57c00', border: '#f57c00' };
      default: return { bg: '#fafafa', color: '#616161', border: '#616161' };
    }
  };
  
  const colors = getTypeColor(exchangeType);
  return {
    backgroundColor: colors.bg,
    color: colors.color,
    border: `1px solid ${colors.border}`,
    fontWeight: 600,
    fontSize: '12px',
  };
});

const ActionButton = styled(Button)({
  background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)',
  color: '#ffffff',
  borderRadius: '8px',
  padding: '12px 24px',
  fontWeight: 600,
  textTransform: 'none',
  
  '&:hover': {
    background: 'linear-gradient(135deg, #0d47a1 0%, #303f9f 100%)',
    transform: 'translateY(-1px)',
  },
  
  '&:disabled': {
    background: '#e0e0e0',
    color: '#9e9e9e',
  },
});

// Types
interface Exchange {
  name: string;
  type: 'Traditional' | 'Digital' | 'DEX' | 'Hybrid';
  jurisdiction: string;
  isActive: boolean;
  volume24h: string;
  averageSpread: number;
  uptime: number;
  listingFee: string;
}

interface AssetListing {
  assetAddress: string;
  symbol: string;
  name: string;
  exchanges: string[];
  arbitrageEnabled: boolean;
  priceToleranceBps: number;
  totalVolume24h: string;
  priceVariance: number;
  isActive: boolean;
}

interface ArbitrageOpportunity {
  asset: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  priceDifference: number;
  estimatedProfit: number;
  confidence: number;
  riskScore: number;
  timestamp: string;
}

interface PriceData {
  exchange: string;
  price: number;
  volume24h: number;
  spread: number;
  timestamp: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const DualListingDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [assetListings, setAssetListings] = useState<AssetListing[]>([]);
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [addExchangeDialogOpen, setAddExchangeDialogOpen] = useState(false);
  const [addListingDialogOpen, setAddListingDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockExchanges: Exchange[] = [
      {
        name: 'NYSE',
        type: 'Traditional',
        jurisdiction: 'US',
        isActive: true,
        volume24h: '$2.5B',
        averageSpread: 5,
        uptime: 99.9,
        listingFee: '$500K',
      },
      {
        name: 'Coinbase Pro',
        type: 'Digital',
        jurisdiction: 'US',
        isActive: true,
        volume24h: '$1.2B',
        averageSpread: 8,
        uptime: 99.5,
        listingFee: '$50K',
      },
      {
        name: 'Uniswap V3',
        type: 'DEX',
        jurisdiction: 'Global',
        isActive: true,
        volume24h: '$800M',
        averageSpread: 15,
        uptime: 100.0,
        listingFee: '$5K',
      },
      {
        name: 'FTX',
        type: 'Hybrid',
        jurisdiction: 'Bahamas',
        isActive: false,
        volume24h: '$0',
        averageSpread: 0,
        uptime: 0,
        listingFee: '$100K',
      },
    ];

    const mockListings: AssetListing[] = [
      {
        assetAddress: '0x1234...5678',
        symbol: 'QTRE',
        name: 'Quantera Real Estate Token',
        exchanges: ['NYSE', 'Coinbase Pro', 'Uniswap V3'],
        arbitrageEnabled: true,
        priceToleranceBps: 100,
        totalVolume24h: '$2.5M',
        priceVariance: 25,
        isActive: true,
      },
      {
        assetAddress: '0x5678...9012',
        symbol: 'QTSY',
        name: 'Quantera Treasury Securities',
        exchanges: ['NYSE', 'Coinbase Pro'],
        arbitrageEnabled: true,
        priceToleranceBps: 50,
        totalVolume24h: '$1.8M',
        priceVariance: 15,
        isActive: true,
      },
    ];

    const mockArbitrageOpportunities: ArbitrageOpportunity[] = [
      {
        asset: 'QTRE',
        buyExchange: 'Uniswap V3',
        sellExchange: 'Coinbase Pro',
        buyPrice: 99.85,
        sellPrice: 100.25,
        priceDifference: 40,
        estimatedProfit: 350,
        confidence: 85,
        riskScore: 25,
        timestamp: '2024-01-15T14:30:00Z',
      },
      {
        asset: 'QTSY',
        buyExchange: 'Coinbase Pro',
        sellExchange: 'NYSE',
        buyPrice: 101.20,
        sellPrice: 101.45,
        priceDifference: 25,
        estimatedProfit: 180,
        confidence: 92,
        riskScore: 15,
        timestamp: '2024-01-15T14:28:00Z',
      },
    ];

    const mockPriceData: PriceData[] = [
      { exchange: 'NYSE', price: 100.15, volume24h: 1500000, spread: 5, timestamp: '2024-01-15T14:30:00Z' },
      { exchange: 'Coinbase Pro', price: 100.25, volume24h: 800000, spread: 8, timestamp: '2024-01-15T14:30:00Z' },
      { exchange: 'Uniswap V3', price: 99.85, volume24h: 200000, spread: 15, timestamp: '2024-01-15T14:30:00Z' },
    ];

    setExchanges(mockExchanges);
    setAssetListings(mockListings);
    setArbitrageOpportunities(mockArbitrageOpportunities);
    setPriceData(mockPriceData);
    setSelectedAsset('QTRE');
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefreshPrices = async () => {
    setLoading(true);
    try {
      // Simulate price refresh
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Update price data with small variations
      setPriceData(prev => prev.map(data => ({
        ...data,
        price: data.price + (Math.random() - 0.5) * 0.5,
        timestamp: new Date().toISOString(),
      })));
    } catch (error) {
      console.error('Failed to refresh prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]/g, '')) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numAmount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#4caf50';
    if (confidence >= 60) return '#ff9800';
    return '#f44336';
  };

  const getRiskColor = (risk: number) => {
    if (risk <= 20) return '#4caf50';
    if (risk <= 40) return '#ff9800';
    return '#f44336';
  };

  return (
    <DashboardContainer>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#263238', mb: 1 }}>
          Dual-Listing Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage cross-exchange listings and monitor arbitrage opportunities
        </Typography>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Active Exchanges
                </Typography>
                <AccountBalance sx={{ color: '#1a237e' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a237e', mb: 1 }}>
                {exchanges.filter(e => e.isActive).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                of {exchanges.length} registered
              </Typography>
            </CardContent>
          </MetricCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Listed Assets
                </Typography>
                <Exchange sx={{ color: '#1a237e' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a237e', mb: 1 }}>
                {assetListings.filter(a => a.isActive).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Dual-listed assets
              </Typography>
            </CardContent>
          </MetricCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Arbitrage Opportunities
                </Typography>
                <CurrencyExchange sx={{ color: '#4caf50' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a237e', mb: 1 }}>
                {arbitrageOpportunities.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active opportunities
              </Typography>
            </CardContent>
          </MetricCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Total Volume 24h
                </Typography>
                <BarChart3 sx={{ color: '#1a237e' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a237e', mb: 1 }}>
                $4.3M
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp sx={{ color: '#4caf50', fontSize: 16 }} />
                <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 600 }}>
                  +12.5%
                </Typography>
              </Box>
            </CardContent>
          </MetricCard>
        </Grid>
      </Grid>

      {/* Main Content */}
      <StyledCard>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
            <Tab label="Exchanges" />
            <Tab label="Asset Listings" />
            <Tab label="Price Monitoring" />
            <Tab label="Arbitrage" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Exchanges Tab */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Registered Exchanges
            </Typography>
            <ActionButton
              startIcon={<Add />}
              onClick={() => setAddExchangeDialogOpen(true)}
            >
              Add Exchange
            </ActionButton>
          </Box>

          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Exchange</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Jurisdiction</strong></TableCell>
                  <TableCell><strong>Volume 24h</strong></TableCell>
                  <TableCell><strong>Avg Spread</strong></TableCell>
                  <TableCell><strong>Uptime</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {exchanges.map((exchange) => (
                  <TableRow key={exchange.name}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {exchange.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <ExchangeTypeBadge exchangeType={exchange.type} label={exchange.type} />
                    </TableCell>
                    <TableCell>{exchange.jurisdiction}</TableCell>
                    <TableCell>{exchange.volume24h}</TableCell>
                    <TableCell>{exchange.averageSpread}bp</TableCell>
                    <TableCell>{formatPercentage(exchange.uptime)}</TableCell>
                    <TableCell>
                      <Chip
                        label={exchange.isActive ? 'Active' : 'Inactive'}
                        color={exchange.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Asset Listings Tab */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Dual-Listed Assets
            </Typography>
            <ActionButton
              startIcon={<Add />}
              onClick={() => setAddListingDialogOpen(true)}
            >
              Add Listing
            </ActionButton>
          </Box>

          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Asset</strong></TableCell>
                  <TableCell><strong>Exchanges</strong></TableCell>
                  <TableCell><strong>Volume 24h</strong></TableCell>
                  <TableCell><strong>Price Variance</strong></TableCell>
                  <TableCell><strong>Arbitrage</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assetListings.map((listing) => (
                  <TableRow key={listing.assetAddress}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {listing.symbol}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {listing.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {listing.exchanges.map((exchange) => (
                          <Chip key={exchange} label={exchange} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>{listing.totalVolume24h}</TableCell>
                    <TableCell>{listing.priceVariance}bp</TableCell>
                    <TableCell>
                      <Chip
                        label={listing.arbitrageEnabled ? 'Enabled' : 'Disabled'}
                        color={listing.arbitrageEnabled ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={listing.isActive ? 'Active' : 'Inactive'}
                        color={listing.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Price Monitoring Tab */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Cross-Exchange Price Monitoring
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Asset</InputLabel>
                <Select
                  value={selectedAsset}
                  label="Asset"
                  onChange={(e) => setSelectedAsset(e.target.value)}
                >
                  {assetListings.map((listing) => (
                    <MenuItem key={listing.symbol} value={listing.symbol}>
                      {listing.symbol}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <ActionButton
                startIcon={<Refresh />}
                onClick={handleRefreshPrices}
                disabled={loading}
                size="small"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </ActionButton>
            </Box>
          </Box>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <ProfessionalChart
                title={`${selectedAsset} Price Comparison`}
                subtitle="Real-time prices across exchanges"
                data={priceData.map(data => ({
                  exchange: data.exchange,
                  price: data.price,
                }))}
                dataKey="price"
                xAxisKey="exchange"
                height={300}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Current Prices
                </Typography>
                
                {priceData.map((data) => (
                  <Box key={data.exchange} sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {data.exchange}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a237e' }}>
                      {formatCurrency(data.price)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Spread: {data.spread}bp
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* Arbitrage Tab */}
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Arbitrage Opportunities
          </Typography>

          {arbitrageOpportunities.length === 0 ? (
            <Alert severity="info">
              No arbitrage opportunities detected at this time.
            </Alert>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Asset</strong></TableCell>
                    <TableCell><strong>Buy From</strong></TableCell>
                    <TableCell><strong>Sell To</strong></TableCell>
                    <TableCell><strong>Price Diff</strong></TableCell>
                    <TableCell><strong>Est. Profit</strong></TableCell>
                    <TableCell><strong>Confidence</strong></TableCell>
                    <TableCell><strong>Risk</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {arbitrageOpportunities.map((opportunity, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {opportunity.asset}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{opportunity.buyExchange}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatCurrency(opportunity.buyPrice)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{opportunity.sellExchange}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatCurrency(opportunity.sellPrice)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 600 }}>
                          {opportunity.priceDifference}bp
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 600 }}>
                          {formatCurrency(opportunity.estimatedProfit)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ color: getConfidenceColor(opportunity.confidence), fontWeight: 600 }}
                          >
                            {opportunity.confidence}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ color: getRiskColor(opportunity.riskScore), fontWeight: 600 }}
                        >
                          {opportunity.riskScore}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </StyledCard>

      {/* Add Exchange Dialog */}
      <Dialog open={addExchangeDialogOpen} onClose={() => setAddExchangeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Register New Exchange</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Exchange Name"
                placeholder="e.g., Binance"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Exchange Type</InputLabel>
                <Select label="Exchange Type">
                  <MenuItem value="Traditional">Traditional</MenuItem>
                  <MenuItem value="Digital">Digital</MenuItem>
                  <MenuItem value="DEX">DEX</MenuItem>
                  <MenuItem value="Hybrid">Hybrid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Jurisdiction"
                placeholder="e.g., US, EU, Global"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="API Endpoint"
                placeholder="https://api.exchange.com"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Minimum Volume"
                placeholder="1000000"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Listing Fee"
                placeholder="50000"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch />}
                label="Supports Real-time Data"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddExchangeDialogOpen(false)}>Cancel</Button>
          <ActionButton onClick={() => setAddExchangeDialogOpen(false)}>
            Register Exchange
          </ActionButton>
        </DialogActions>
      </Dialog>

      {/* Add Listing Dialog */}
      <Dialog open={addListingDialogOpen} onClose={() => setAddListingDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Dual Listing</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Asset Address"
                placeholder="0x..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Symbol"
                placeholder="e.g., QTRE"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                placeholder="e.g., Quantera Real Estate"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Exchanges</InputLabel>
                <Select
                  multiple
                  label="Exchanges"
                  value={[]}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {exchanges.filter(e => e.isActive).map((exchange) => (
                    <MenuItem key={exchange.name} value={exchange.name}>
                      {exchange.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price Tolerance (bp)"
                placeholder="100"
                type="number"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Min Arbitrage Amount"
                placeholder="1000"
                type="number"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Enable Arbitrage Detection"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddListingDialogOpen(false)}>Cancel</Button>
          <ActionButton onClick={() => setAddListingDialogOpen(false)}>
            Create Listing
          </ActionButton>
        </DialogActions>
      </Dialog>
    </DashboardContainer>
  );
}; 