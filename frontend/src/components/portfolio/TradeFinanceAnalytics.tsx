import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Divider,
  Chip,
  useTheme,
  Tab,
  Tabs
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

import { useTradeFinance } from '../../contexts/TradeFinanceContext';
import { TradeFinancePosition, TradeFinanceAsset } from '../../types/tradeFinance';
import Grid from '../../utils/mui-shims';
import { getDaysBetween, getMaturityBucket } from '../../utils/dateUtils';

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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
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

type AllocationData = {
  name: string;
  value: number;
  percentage: number;
};

type MaturityBucket = {
  range: string;
  count: number;
  value: number;
};

interface TradeFinanceAnalyticsProps {
  height?: number | string;
}

const TradeFinanceAnalytics: React.FC<TradeFinanceAnalyticsProps> = ({ 
  height = 'auto'
}) => {
  const { positions, assets, loading } = useTradeFinance();
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Format currency
  const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  // Get asset details for a position
  const getAssetDetails = (assetId: string): TradeFinanceAsset | undefined => {
    return assets.find(asset => asset.id === assetId);
  };
  
  // Generate colors for charts based on theme
  const getChartColors = () => {
    if (theme.palette.mode === 'dark') {
      return ['#3f51b5', '#2196f3', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800'];
    } else {
      return ['#3f51b5', '#2196f3', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800'];
    }
  };
  
  // Calculate asset type allocation
  const calculateAssetTypeAllocation = (): AllocationData[] => {
    if (!positions || positions.length === 0 || !assets) return [];
    
    const typeMap: { [key: string]: number } = {};
    let total = 0;
    
    positions.forEach(pos => {
      const asset = getAssetDetails(pos.assetId);
      if (!asset) return;
      
      const type = asset.assetType.replace(/_/g, ' ');
      typeMap[type] = (typeMap[type] || 0) + pos.investmentAmount;
      total += pos.investmentAmount;
    });
    
    return Object.entries(typeMap).map(([name, value]) => ({
      name,
      value,
      percentage: (value / total) * 100
    })).sort((a, b) => b.value - a.value);
  };
  
  // Calculate geographic distribution
  const calculateGeographicDistribution = (): AllocationData[] => {
    if (!positions || positions.length === 0 || !assets) return [];
    
    const geoMap: { [key: string]: number } = {};
    let total = 0;
    
    positions.forEach(pos => {
      const asset = getAssetDetails(pos.assetId);
      if (!asset) return;
      
      // In a real implementation, you'd have a country or region field on the asset
      // For demo, we'll extract it from the asset name or description
      let region = 'Other';
      
      if (asset.description.includes('Asia') || asset.name.includes('Asia')) {
        region = 'Asia';
      } else if (asset.description.includes('Europe') || asset.name.includes('Europe')) {
        region = 'Europe';
      } else if (asset.description.includes('America') || asset.name.includes('America')) {
        region = 'Americas';
      } else if (asset.description.includes('Africa') || asset.name.includes('Africa')) {
        region = 'Africa';
      } else if (asset.description.includes('Taiwan')) {
        region = 'Asia';
      } else if (asset.description.includes('Harbor District')) {
        region = 'Americas';
      }
      
      geoMap[region] = (geoMap[region] || 0) + pos.investmentAmount;
      total += pos.investmentAmount;
    });
    
    return Object.entries(geoMap).map(([name, value]) => ({
      name,
      value,
      percentage: (value / total) * 100
    })).sort((a, b) => b.value - a.value);
  };
  
  // Calculate maturity distribution
  const calculateMaturityDistribution = (): MaturityBucket[] => {
    if (!positions || positions.length === 0) return [];
    
    const buckets: { [key: string]: MaturityBucket } = {
      '0-30 days': { range: '0-30 days', count: 0, value: 0 },
      '31-90 days': { range: '31-90 days', count: 0, value: 0 },
      '91-180 days': { range: '91-180 days', count: 0, value: 0 },
      '181-365 days': { range: '181-365 days', count: 0, value: 0 },
      '1+ year': { range: '1+ year', count: 0, value: 0 }
    };
    
    positions.forEach(pos => {
      // Use the utility function to get the appropriate bucket
      const bucket = getMaturityBucket(pos.expectedMaturityDate);
      
      buckets[bucket].count += 1;
      buckets[bucket].value += pos.investmentAmount;
    });
    
    return Object.values(buckets);
  };
  
  const assetTypeAllocation = calculateAssetTypeAllocation();
  const geographicDistribution = calculateGeographicDistribution();
  const maturityDistribution = calculateMaturityDistribution();
  const chartColors = getChartColors();
  
  if (loading || !positions || positions.length === 0) {
    return (
      <Card sx={{ height, display: 'flex', flexDirection: 'column' }}>
        <CardHeader title="Trade Finance Analytics" titleTypographyProps={{ variant: 'h6' }} />
        <Divider />
        <CardContent sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No trade finance positions available for analysis
          </Typography>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card sx={{ height, display: 'flex', flexDirection: 'column' }}>
      <CardHeader title="Trade Finance Analytics" titleTypographyProps={{ variant: 'h6' }} />
      <Divider />
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="trade finance analytics tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Asset Types" />
          <Tab label="Geographic Exposure" />
          <Tab label="Maturity Distribution" />
        </Tabs>
      </Box>
      
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetTypeAllocation}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                    >
                      {assetTypeAllocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(name) => `Asset Type: ${name}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Asset Type Allocation
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Distribution of your trade finance investments by asset type
                </Typography>
              </Box>
              
              {assetTypeAllocation.map((item, index) => (
                <Box key={index} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          bgcolor: chartColors[index % chartColors.length],
                          mr: 1 
                        }} 
                      />
                      <Typography variant="body2">
                        {item.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      {formatCurrency(item.value)}
                    </Typography>
                  </Box>
                  <Box 
                    sx={{ 
                      height: 4, 
                      borderRadius: 2, 
                      bgcolor: 'background.default',
                      overflow: 'hidden'
                    }}
                  >
                    <Box 
                      sx={{ 
                        height: '100%', 
                        width: `${item.percentage}%`, 
                        bgcolor: chartColors[index % chartColors.length]
                      }} 
                    />
                  </Box>
                </Box>
              ))}
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={geographicDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                    >
                      {geographicDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(name) => `Region: ${name}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Geographic Exposure
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Distribution of your trade finance investments by region
                </Typography>
              </Box>
              
              {geographicDistribution.map((item, index) => (
                <Box key={index} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          bgcolor: chartColors[index % chartColors.length],
                          mr: 1 
                        }} 
                      />
                      <Typography variant="body2">
                        {item.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      {formatCurrency(item.value)}
                    </Typography>
                  </Box>
                  <Box 
                    sx={{ 
                      height: 4, 
                      borderRadius: 2, 
                      bgcolor: 'background.default',
                      overflow: 'hidden'
                    }}
                  >
                    <Box 
                      sx={{ 
                        height: '100%', 
                        width: `${item.percentage}%`, 
                        bgcolor: chartColors[index % chartColors.length]
                      }} 
                    />
                  </Box>
                </Box>
              ))}
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={maturityDistribution}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis yAxisId="left" orientation="left" stroke={theme.palette.primary.main} />
                    <YAxis yAxisId="right" orientation="right" stroke={theme.palette.secondary.main} />
                    <Tooltip formatter={(value, name) => {
                      if (name === 'value') return formatCurrency(value as number);
                      return value;
                    }} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="count" name="Number of Positions" fill={theme.palette.primary.main} />
                    <Bar yAxisId="right" dataKey="value" name="Investment Amount" fill={theme.palette.secondary.main} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Maturity Distribution
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Distribution of your trade finance investments by time to maturity
                </Typography>
              </Box>
              
              {maturityDistribution.map((item, index) => (
                <Box key={index} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2">
                      {item.range}
                    </Typography>
                    <Box>
                      <Chip 
                        label={`${item.count} positions`} 
                        size="small" 
                        sx={{ mr: 1, fontSize: '0.75rem' }} 
                      />
                      <Chip 
                        label={formatCurrency(item.value)} 
                        size="small" 
                        color="primary"
                        sx={{ fontSize: '0.75rem' }} 
                      />
                    </Box>
                  </Box>
                </Box>
              ))}
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Maturity Strategy
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  A ladder strategy with staggered maturities can help balance liquidity needs with higher returns from longer-dated assets. Consider diversifying across multiple maturity dates to reduce reinvestment risk.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
      </CardContent>
    </Card>
  );
};

export default TradeFinanceAnalytics; 