import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  Tab,
  Tabs
} from '@mui/material';
import {
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { PortfolioPerformance } from '../../types/portfolioTypes';
import CompatGrid from '../common/CompatGrid';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';

ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, BarElement);

// Use CompatGrid instead of MUI Grid
const Grid = CompatGrid;

interface PortfolioAnalyticsProps {
  performance: PortfolioPerformance;
  assetAllocation: {[key: string]: number};
  assetValuesByCategory: {[key: string]: number};
}

const PortfolioAnalytics: React.FC<PortfolioAnalyticsProps> = ({
  performance,
  assetAllocation,
  assetValuesByCategory
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Asset allocation chart data
  const allocationChartData = {
    labels: Object.keys(assetAllocation).map(key => {
      // Convert snake_case to Title Case
      return key.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }),
    datasets: [
      {
        data: Object.values(assetAllocation),
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.info.main,
          theme.palette.secondary.main,
          '#9c27b0', // purple
          '#795548', // brown
        ],
        borderWidth: 1,
        borderColor: theme.palette.background.paper
      }
    ]
  };

  // Performance by category bar chart
  const categoryValueData = {
    labels: Object.keys(assetValuesByCategory).map(key => {
      // Convert snake_case to Title Case
      return key.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }),
    datasets: [
      {
        label: 'Value ($)',
        data: Object.values(assetValuesByCategory),
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.info.main,
          theme.palette.secondary.main,
          '#9c27b0', // purple
          '#795548', // brown
        ],
        borderWidth: 1,
        borderColor: theme.palette.background.paper
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: theme.palette.text.primary,
          padding: 15
        }
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: theme.palette.text.secondary
        }
      },
      y: {
        grid: {
          color: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: theme.palette.text.secondary,
          callback: (value: any) => {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };

  return (
    <Card sx={{ 
      height: '100%',
      bgcolor: 'background.paper',
      color: 'text.primary',
      boxShadow: theme.shadows[1]
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Portfolio Analytics</Typography>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            aria-label="portfolio analytics tabs"
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minWidth: 'auto',
                px: 2
              }
            }}
          >
            <Tab label="Performance" />
            <Tab label="Allocation" />
            <Tab label="By Category" />
          </Tabs>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {tabValue === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Total Return</Typography>
                  <Tooltip title="Total value increase since inception">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h5" component="div" sx={{ mr: 1 }}>
                    ${performance.totalReturn.toLocaleString()}
                  </Typography>
                  <Chip
                    icon={performance.totalReturnPercentage >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                    label={formatPercentage(performance.totalReturnPercentage)}
                    color={performance.totalReturnPercentage >= 0 ? "success" : "error"}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Annualized Return</Typography>
                  <Tooltip title="Yearly return rate based on current performance">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="h5" component="div">
                  {formatPercentage(performance.annualizedReturn)}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Volatility</Typography>
                  <Tooltip title="Measure of price variation over time">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="h5" component="div">
                  {performance.volatility.toFixed(2)}%
                </Typography>
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Sharpe Ratio</Typography>
                  <Tooltip title="Risk-adjusted return measure">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="h5" component="div">
                  {performance.sharpeRatio.toFixed(2)}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Performance by Period</Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Daily</Typography>
                  <Typography 
                    variant="body1" 
                    color={performance.periods.daily >= 0 ? "success.main" : "error.main"}
                  >
                    {formatPercentage(performance.periods.daily)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Weekly</Typography>
                  <Typography 
                    variant="body1" 
                    color={performance.periods.weekly >= 0 ? "success.main" : "error.main"}
                  >
                    {formatPercentage(performance.periods.weekly)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Monthly</Typography>
                  <Typography 
                    variant="body1" 
                    color={performance.periods.monthly >= 0 ? "success.main" : "error.main"}
                  >
                    {formatPercentage(performance.periods.monthly)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Quarterly</Typography>
                  <Typography 
                    variant="body1" 
                    color={performance.periods.quarterly >= 0 ? "success.main" : "error.main"}
                  >
                    {formatPercentage(performance.periods.quarterly)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Yearly</Typography>
                  <Typography 
                    variant="body1" 
                    color={performance.periods.yearly >= 0 ? "success.main" : "error.main"}
                  >
                    {formatPercentage(performance.periods.yearly)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">All Time</Typography>
                  <Typography 
                    variant="body1" 
                    color={performance.periods.allTime >= 0 ? "success.main" : "error.main"}
                  >
                    {formatPercentage(performance.periods.allTime)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        )}

        {tabValue === 1 && (
          <Box sx={{ height: 300, position: 'relative' }}>
            <Doughnut data={allocationChartData} options={chartOptions as any} />
          </Box>
        )}

        {tabValue === 2 && (
          <Box sx={{ height: 300, position: 'relative' }}>
            <Bar data={categoryValueData} options={barChartOptions as any} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioAnalytics; 