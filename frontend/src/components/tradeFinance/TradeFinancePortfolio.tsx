import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Divider, 
  Chip, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress,
  Button,
  Alert,
  Stack,
  CardHeader,
  Avatar,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  MoreVert as MoreVertIcon,
  Timeline as TimelineIcon,
  AccountBalance as AccountBalanceIcon,
  CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

import { useTradeFinance } from '../../contexts/TradeFinanceContext';
import { TradeFinancePosition, TradeFinanceAsset } from '../../types/tradeFinance';

// Chart.js components would be imported here in a real implementation
// For this demo, we'll just create placeholders for the charts

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
      id={`portfolio-tabpanel-${index}`}
      aria-labelledby={`portfolio-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const TradeFinancePortfolio: React.FC = () => {
  const { positions, assets, loading, error } = useTradeFinance();
  const [tabValue, setTabValue] = useState(0);
  
  // Calculate portfolio summary metrics
  const calculateSummary = () => {
    if (!positions || positions.length === 0) {
      return {
        totalInvested: 0,
        expectedReturn: 0,
        expectedYield: 0,
        averageMaturity: 0,
        positionsCount: 0,
        assetCount: 0
      };
    }
    
    const totalInvested = positions.reduce((sum, pos) => sum + pos.investmentAmount, 0);
    const expectedReturn = positions.reduce((sum, pos) => sum + pos.expectedReturn, 0);
    const expectedYield = ((expectedReturn - totalInvested) / totalInvested) * 100;
    
    // Calculate average maturity in days
    const now = new Date();
    const avgMaturity = positions.reduce((sum, pos) => {
      const maturityDate = new Date(pos.expectedMaturityDate);
      const daysToMaturity = Math.max(0, Math.ceil((maturityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      return sum + daysToMaturity;
    }, 0) / positions.length;
    
    // Count unique assets
    const uniqueAssets = new Set(positions.map(pos => pos.assetId));
    
    return {
      totalInvested,
      expectedReturn,
      expectedYield,
      averageMaturity: avgMaturity,
      positionsCount: positions.length,
      assetCount: uniqueAssets.size
    };
  };
  
  // Get asset details for a position
  const getAssetDetails = (assetId: string): TradeFinanceAsset | undefined => {
    return assets.find(asset => asset.id === assetId);
  };
  
  // Format currency
  const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  // Format percentage
  const formatPercent = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };
  
  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Calculate days until maturity
  const getDaysToMaturity = (date: Date): number => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };
  
  // Get portfolio allocation by asset type
  const getAssetTypeAllocation = (): {type: string, value: number, percentage: number}[] => {
    if (!positions || positions.length === 0) return [];
    
    const totalInvested = positions.reduce((sum, pos) => sum + pos.investmentAmount, 0);
    const allocationMap = new Map<string, number>();
    
    positions.forEach(position => {
      const asset = getAssetDetails(position.assetId);
      if (asset) {
        const assetType = asset.assetType;
        const currentValue = allocationMap.get(assetType) || 0;
        allocationMap.set(assetType, currentValue + position.investmentAmount);
      }
    });
    
    const result: {type: string, value: number, percentage: number}[] = [];
    allocationMap.forEach((value, type) => {
      result.push({
        type,
        value,
        percentage: (value / totalInvested) * 100
      });
    });
    
    return result.sort((a, b) => b.value - a.value);
  };
  
  // Placeholder chart component for asset allocation
  const AssetAllocationChart: React.FC = () => {
    return (
      <Box sx={{ 
        height: 250, 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.paper',
        borderRadius: 1,
        p: 2,
        border: '1px dashed',
        borderColor: 'divider'
      }}>
        <Typography variant="body2" color="text.secondary">
          [Asset Allocation Pie Chart]
        </Typography>
      </Box>
    );
  };
  
  // Placeholder chart component for portfolio value over time
  const PortfolioValueChart: React.FC = () => {
    return (
      <Box sx={{ 
        height: 250, 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.paper',
        borderRadius: 1,
        p: 2,
        border: '1px dashed',
        borderColor: 'divider'
      }}>
        <Typography variant="body2" color="text.secondary">
          [Portfolio Value Time Series Chart]
        </Typography>
      </Box>
    );
  };
  
  // Placeholder chart component for yield distribution
  const YieldDistributionChart: React.FC = () => {
    return (
      <Box sx={{ 
        height: 250, 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.paper',
        borderRadius: 1,
        p: 2,
        border: '1px dashed',
        borderColor: 'divider'
      }}>
        <Typography variant="body2" color="text.secondary">
          [Yield Distribution Bar Chart]
        </Typography>
      </Box>
    );
  };
  
  // Placeholder chart component for maturity timeline
  const MaturityTimelineChart: React.FC = () => {
    return (
      <Box sx={{ 
        height: 250, 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.paper',
        borderRadius: 1,
        p: 2,
        border: '1px dashed',
        borderColor: 'divider'
      }}>
        <Typography variant="body2" color="text.secondary">
          [Maturity Timeline Chart]
        </Typography>
      </Box>
    );
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }
  
  const summary = calculateSummary();
  const assetTypeAllocation = getAssetTypeAllocation();
  
  return (
    <Box>
      <Paper sx={{ mb: 4 }}>
        <Typography variant="h5" component="h1" sx={{ p: 3, pb: 2 }}>
          Trade Finance Portfolio
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="portfolio tabs"
          >
            <Tab label="Overview" id="portfolio-tab-0" />
            <Tab label="Positions" id="portfolio-tab-1" />
            <Tab label="Analytics" id="portfolio-tab-2" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          {positions.length === 0 ? (
            <Box textAlign="center" py={4}>
              <AccountBalanceIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Trade Finance Investments Yet
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Start growing your portfolio by investing in tokenized trade finance assets.
              </Typography>
              <Button 
                component={Link} 
                to="/trade-finance" 
                variant="contained" 
                color="primary"
              >
                Browse Trade Finance Assets
              </Button>
            </Box>
          ) : (
            <>
              {/* Portfolio Summary Cards */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Total Invested
                      </Typography>
                      <Typography variant="h5" component="div" fontWeight="bold">
                        {formatCurrency(summary.totalInvested)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {summary.positionsCount} positions in {summary.assetCount} assets
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Expected Return
                      </Typography>
                      <Typography variant="h5" component="div" fontWeight="bold">
                        {formatCurrency(summary.expectedReturn)}
                      </Typography>
                      <Box display="flex" alignItems="center" sx={{ mt: 1 }}>
                        <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="success.main">
                          {formatPercent(summary.expectedYield)} yield
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Average Maturity
                      </Typography>
                      <Typography variant="h5" component="div" fontWeight="bold">
                        {Math.round(summary.averageMaturity)} days
                      </Typography>
                      <Box display="flex" alignItems="center" sx={{ mt: 1 }}>
                        <CalendarTodayIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          Weighted average
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent sx={{ height: '100%' }}>
                      <Button 
                        component={Link} 
                        to="/trade-finance" 
                        variant="outlined" 
                        fullWidth 
                        sx={{ height: '100%' }}
                      >
                        Explore New Investments
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              {/* Portfolio Charts */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Card>
                    <CardHeader
                      title="Portfolio Value Over Time"
                      titleTypographyProps={{ variant: 'h6' }}
                      action={
                        <IconButton aria-label="settings">
                          <MoreVertIcon />
                        </IconButton>
                      }
                    />
                    <CardContent>
                      <PortfolioValueChart />
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardHeader
                      title="Asset Allocation"
                      titleTypographyProps={{ variant: 'h6' }}
                    />
                    <CardContent>
                      <AssetAllocationChart />
                      <Box sx={{ mt: 2 }}>
                        {assetTypeAllocation.map(item => (
                          <Box 
                            key={item.type} 
                            sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              mt: 1 
                            }}
                          >
                            <Box display="flex" alignItems="center">
                              <Box 
                                sx={{ 
                                  width: 12, 
                                  height: 12, 
                                  borderRadius: '50%',
                                  bgcolor: `${item.type === 'SUPPLY_CHAIN_FINANCE' ? 'primary.main' : 
                                            item.type === 'EXPORT_FINANCING' ? 'success.main' :
                                            item.type === 'IMPORT_FINANCING' ? 'warning.main' : 'info.main'}`,
                                  mr: 1
                                }} 
                              />
                              <Typography variant="body2">
                                {item.type.replace(/_/g, ' ')}
                              </Typography>
                            </Box>
                            <Typography variant="body2" fontWeight="medium">
                              {formatPercent(item.percentage)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              {/* Recent Positions */}
              <Card sx={{ mt: 3 }}>
                <CardHeader
                  title="Recent Positions"
                  titleTypographyProps={{ variant: 'h6' }}
                  action={
                    <Button 
                      size="small" 
                      onClick={() => setTabValue(1)}
                    >
                      View All
                    </Button>
                  }
                />
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Asset</TableCell>
                        <TableCell align="right">Investment</TableCell>
                        <TableCell align="right">Expected Return</TableCell>
                        <TableCell align="right">Yield</TableCell>
                        <TableCell>Maturity</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {positions.slice(0, 5).map((position) => {
                        const asset = getAssetDetails(position.assetId);
                        if (!asset) return null;
                        
                        const yieldValue = ((position.expectedReturn - position.investmentAmount) / position.investmentAmount) * 100;
                        
                        return (
                          <TableRow key={position.assetId}>
                            <TableCell>
                              <Box display="flex" alignItems="center">
                                <Avatar 
                                  src={asset.imageUrl} 
                                  alt={asset.name}
                                  variant="rounded"
                                  sx={{ width: 40, height: 40, mr: 2 }}
                                />
                                <Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {asset.name}
                                  </Typography>
                                  <Chip 
                                    label={asset.assetType.replace(/_/g, ' ')} 
                                    size="small" 
                                    sx={{ mt: 0.5 }}
                                  />
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(position.investmentAmount)}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(position.expectedReturn)}
                            </TableCell>
                            <TableCell align="right">
                              <Box display="flex" alignItems="center" justifyContent="flex-end">
                                {yieldValue > 0 ? (
                                  <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                                ) : (
                                  <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                                )}
                                <Typography 
                                  variant="body2" 
                                  color={yieldValue > 0 ? "success.main" : "error.main"}
                                >
                                  {formatPercent(yieldValue)}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formatDate(position.expectedMaturityDate)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {getDaysToMaturity(position.expectedMaturityDate)} days left
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Button 
                                component={Link} 
                                to={`/assets/${position.assetId}`}
                                size="small"
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {positions.length === 0 ? (
            <Alert severity="info">
              You don't have any trade finance positions yet. Browse available assets to start investing.
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Asset</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Units Owned</TableCell>
                    <TableCell align="right">Investment</TableCell>
                    <TableCell align="right">Expected Return</TableCell>
                    <TableCell align="right">Yield</TableCell>
                    <TableCell>Acquisition Date</TableCell>
                    <TableCell>Maturity Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {positions.map((position) => {
                    const asset = getAssetDetails(position.assetId);
                    if (!asset) return null;
                    
                    const yieldValue = ((position.expectedReturn - position.investmentAmount) / position.investmentAmount) * 100;
                    
                    return (
                      <TableRow key={position.assetId}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar 
                              src={asset.imageUrl} 
                              alt={asset.name}
                              variant="rounded"
                              sx={{ width: 32, height: 32, mr: 1 }}
                            />
                            <Typography variant="body2" fontWeight="medium">
                              {asset.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={asset.assetType.replace(/_/g, ' ')} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell align="right">
                          {position.unitsOwned}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(position.investmentAmount)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(position.expectedReturn)}
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" alignItems="center" justifyContent="flex-end">
                            {yieldValue > 0 ? (
                              <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                            ) : (
                              <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                            )}
                            <Typography 
                              variant="body2" 
                              color={yieldValue > 0 ? "success.main" : "error.main"}
                            >
                              {formatPercent(yieldValue)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {formatDate(position.acquisitionDate)}
                        </TableCell>
                        <TableCell>
                          <Box>
                            {formatDate(position.expectedMaturityDate)}
                            <Typography variant="body2" color="text.secondary">
                              {getDaysToMaturity(position.expectedMaturityDate)} days left
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1}>
                            <Button 
                              component={Link} 
                              to={`/assets/${position.assetId}`}
                              size="small"
                            >
                              Details
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          {positions.length === 0 ? (
            <Alert severity="info">
              You don't have any trade finance positions yet. Analytics will be available after you make investments.
            </Alert>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader
                    title="Yield Distribution"
                    titleTypographyProps={{ variant: 'h6' }}
                  />
                  <CardContent>
                    <YieldDistributionChart />
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader
                    title="Maturity Timeline"
                    titleTypographyProps={{ variant: 'h6' }}
                  />
                  <CardContent>
                    <MaturityTimelineChart />
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card>
                  <CardHeader
                    title="Performance Metrics"
                    titleTypographyProps={{ variant: 'h6' }}
                  />
                  <CardContent>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Metric</TableCell>
                            <TableCell align="right">Value</TableCell>
                            <TableCell>Description</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>Total Investment</TableCell>
                            <TableCell align="right">{formatCurrency(summary.totalInvested)}</TableCell>
                            <TableCell>Total capital allocated to trade finance assets</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Expected Return</TableCell>
                            <TableCell align="right">{formatCurrency(summary.expectedReturn)}</TableCell>
                            <TableCell>Expected value at maturity of all positions</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Expected Yield</TableCell>
                            <TableCell align="right">{formatPercent(summary.expectedYield)}</TableCell>
                            <TableCell>Percentage return across all positions</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Average Maturity</TableCell>
                            <TableCell align="right">{Math.round(summary.averageMaturity)} days</TableCell>
                            <TableCell>Weighted average time to maturity</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Annualized Yield</TableCell>
                            <TableCell align="right">
                              {formatPercent((summary.expectedYield / summary.averageMaturity) * 365)}
                            </TableCell>
                            <TableCell>Expected yield on an annualized basis</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default TradeFinancePortfolio; 