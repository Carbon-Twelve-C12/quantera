import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Tooltip,
  IconButton,
  Chip,
  useTheme,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import {
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { AssetHolding, YieldDistribution } from '../../types/portfolioTypes';
import CompatGrid from '../common/CompatGrid';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

// Use CompatGrid instead of MUI Grid
const Grid = CompatGrid;

interface YieldMetricsProps {
  holdings: AssetHolding[];
  yieldDistributions: YieldDistribution[];
  totalYield: number;
  averageYieldRate: number;
}

const YieldMetrics: React.FC<YieldMetricsProps> = ({
  holdings,
  yieldDistributions,
  totalYield,
  averageYieldRate
}) => {
  const theme = useTheme();
  const [yieldView, setYieldView] = useState<'rate' | 'amount'>('rate');

  const handleYieldViewChange = (
    event: React.MouseEvent<HTMLElement>,
    newView: 'rate' | 'amount' | null
  ) => {
    if (newView !== null) {
      setYieldView(newView);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Filter assets with yield
  const assetsWithYield = holdings.filter(asset => asset.yield !== undefined);

  // Calculate upcoming yield distributions for the next 30 days
  const now = Date.now();
  const thirtyDaysFromNow = now + (30 * 24 * 60 * 60 * 1000);
  const upcomingDistributions = yieldDistributions
    .filter(distribution => distribution.nextDistributionDate && distribution.nextDistributionDate > now && distribution.nextDistributionDate < thirtyDaysFromNow)
    .sort((a, b) => a.nextDistributionDate! - b.nextDistributionDate!);

  const totalUpcomingYield = upcomingDistributions.reduce((sum, distribution) => sum + distribution.amount, 0);

  // Calculate monthly yield forecast for the next 3 months
  const monthlyForecast = [];
  for (let i = 0; i < 3; i++) {
    const month = new Date(now);
    month.setMonth(month.getMonth() + i);
    const monthName = month.toLocaleDateString('en-US', { month: 'short' });
    
    let monthlyYield = 0;
    for (const asset of assetsWithYield) {
      if (asset.yield && asset.value) {
        const assetYield = asset.value * (asset.yield / 100) / 12;
        monthlyYield += assetYield;
      }
    }
    
    monthlyForecast.push({
      month: monthName,
      yield: monthlyYield
    });
  }

  // Prepare chart data
  const chartData = {
    labels: yieldView === 'rate' 
      ? assetsWithYield.map(asset => asset.symbol)
      : assetsWithYield.map(asset => asset.symbol),
    datasets: [
      {
        label: yieldView === 'rate' ? 'Yield Rate (%)' : 'Yield Amount ($)',
        data: yieldView === 'rate'
          ? assetsWithYield.map(asset => asset.yield)
          : assetsWithYield.map(asset => asset.yieldAmount),
        backgroundColor: theme.palette.success.main,
        borderColor: theme.palette.success.dark,
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (yieldView === 'rate') {
              label += context.parsed.y.toFixed(2) + '%';
            } else {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
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
            if (yieldView === 'rate') {
              return value + '%';
            } else {
              return '$' + value.toLocaleString();
            }
          }
        }
      }
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
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
          <Typography variant="h6">Yield Performance</Typography>
          <ToggleButtonGroup
            value={yieldView}
            exclusive
            onChange={handleYieldViewChange}
            size="small"
            aria-label="yield view"
          >
            <ToggleButton value="rate" aria-label="yield rate">
              Rate
            </ToggleButton>
            <ToggleButton value="amount" aria-label="yield amount">
              Amount
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Total Yield Earned</Typography>
                <Tooltip title="Total yield earned across all assets">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="h5" component="div" color="success.main">
                {formatCurrency(totalYield)}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Average Yield Rate</Typography>
                <Tooltip title="Weighted average yield rate across portfolio">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="h5" component="div" color="success.main">
                {averageYieldRate.toFixed(2)}%
              </Typography>
            </Box>

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Next 30-Day Forecast</Typography>
                <Tooltip title="Projected yield over the next 30 days">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="h5" component="div" color="success.main">
                {formatCurrency(totalUpcomingYield)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={8}>
            <Box sx={{ height: 250 }}>
              <Bar data={chartData} options={chartOptions as any} />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Upcoming Yield Distributions
            </Typography>
            {upcomingDistributions.length > 0 ? (
              <Box>
                {upcomingDistributions.map((distribution, index) => (
                  <Box 
                    key={distribution.id}
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      borderBottom: index < upcomingDistributions.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                      py: 1.5
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: '50%', 
                          bgcolor: 'success.main' + '20',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2
                        }}
                      >
                        <MoneyIcon color="success" />
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {distribution.assetName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <CalendarIcon sx={{ fontSize: '0.875rem', mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(distribution.nextDistributionDate!)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body1" fontWeight="medium">
                        {formatCurrency(distribution.amount)}
                      </Typography>
                      <Chip
                        icon={<TrendingUpIcon />}
                        label={`${distribution.yieldRate.toFixed(2)}%`}
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ height: 20, '& .MuiChip-label': { px: 1, py: 0 } }}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No yield distributions scheduled in the next 30 days
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              3-Month Yield Forecast
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              {monthlyForecast.map((month, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    textAlign: 'center',
                    bgcolor: 'success.main' + '10',
                    borderRadius: 2,
                    p: 2,
                    width: '30%'
                  }}
                >
                  <Typography variant="body1" fontWeight="medium" color="text.secondary">
                    {month.month}
                  </Typography>
                  <Typography variant="h6" color="success.main" sx={{ mt: 1 }}>
                    {formatCurrency(month.yield)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default YieldMetrics; 