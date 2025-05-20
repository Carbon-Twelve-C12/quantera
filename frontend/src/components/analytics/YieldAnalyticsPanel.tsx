import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import Grid from '../../utils/mui-shims';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { 
  Timeline as TrendIcon,
  StackedBarChart as BarIcon 
} from '@mui/icons-material';
import { YieldMetric, TimeSeriesDataPoint } from '../../types/analyticsTypes';
import { AssetClass } from '../../types/assetTypes';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Asset class colors and labels
const ASSET_COLORS = {
  [AssetClass.TREASURY]: '#3498db', // Blue
  [AssetClass.REAL_ESTATE]: '#e74c3c', // Red
  [AssetClass.ENVIRONMENTAL_ASSET]: '#2ecc71', // Green
  [AssetClass.TRADE_FINANCE]: '#f39c12', // Yellow
  [AssetClass.CUSTOM]: '#9b59b6', // Purple
  [AssetClass.CORPORATE_BOND]: '#1abc9c', // Teal
  [AssetClass.IP_RIGHT]: '#d35400', // Orange
  [AssetClass.INVOICE]: '#8e44ad', // Purple
  [AssetClass.COMMODITY]: '#2c3e50', // Dark Blue
  [AssetClass.INFRASTRUCTURE]: '#16a085', // Green
};

// Human-readable asset class names
const ASSET_LABELS = {
  [AssetClass.TREASURY]: 'Treasury',
  [AssetClass.REAL_ESTATE]: 'Real Estate',
  [AssetClass.ENVIRONMENTAL_ASSET]: 'Environmental Assets',
  [AssetClass.TRADE_FINANCE]: 'Trade Finance',
  [AssetClass.CUSTOM]: 'Custom Assets',
  [AssetClass.CORPORATE_BOND]: 'Corporate Bonds',
  [AssetClass.IP_RIGHT]: 'IP Rights',
  [AssetClass.INVOICE]: 'Invoices',
  [AssetClass.COMMODITY]: 'Commodities',
  [AssetClass.INFRASTRUCTURE]: 'Infrastructure',
};

interface YieldAnalyticsPanelProps {
  yieldMetrics: YieldMetric[];
}

const YieldAnalyticsPanel: React.FC<YieldAnalyticsPanelProps> = ({
  yieldMetrics
}) => {
  const theme = useTheme();
  const [chartType, setChartType] = useState<'trend' | 'comparison'>('trend');
  const [selectedClass, setSelectedClass] = useState<AssetClass | 'all'>('all');

  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newType: 'trend' | 'comparison' | null
  ) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  const handleAssetClassChange = (
    event: React.MouseEvent<HTMLElement>,
    newClass: AssetClass | 'all' | null
  ) => {
    if (newClass !== null) {
      setSelectedClass(newClass);
    }
  };

  // Format date for chart labels
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Filter yield metrics based on selected asset class
  const filteredMetrics = selectedClass === 'all' 
    ? yieldMetrics 
    : yieldMetrics.filter(metric => metric.assetClass === selectedClass);

  // Prepare trend chart data
  const getTrendChartData = () => {
    // If all asset classes are selected, show the first asset class by default
    const metricToShow = filteredMetrics.length > 0 ? filteredMetrics[0] : null;
    
    if (!metricToShow || !metricToShow.yieldTrend.length) {
      return {
        labels: [],
        datasets: []
      };
    }

    const color = ASSET_COLORS[metricToShow.assetClass] || '#999';
    
    return {
      labels: metricToShow.yieldTrend.map(point => formatDate(point.date)),
      datasets: [
        {
          label: `${ASSET_LABELS[metricToShow.assetClass]} Yield (%)`,
          data: metricToShow.yieldTrend.map(point => point.value),
          borderColor: color,
          backgroundColor: `${color}20`,
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 5,
          borderWidth: 2
        }
      ]
    };
  };

  // Prepare comparison chart data
  const getComparisonChartData = () => {
    return {
      labels: filteredMetrics.map(metric => ASSET_LABELS[metric.assetClass] || metric.assetClass),
      datasets: [
        {
          label: 'Average Yield (%)',
          data: filteredMetrics.map(metric => metric.averageYield),
          backgroundColor: filteredMetrics.map(metric => ASSET_COLORS[metric.assetClass] || '#999'),
          borderColor: theme.palette.mode === 'dark' ? '#333' : '#fff',
          borderWidth: 1,
          barThickness: 40,
          maxBarThickness: 60
        }
      ]
    };
  };

  // Chart options
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: theme.palette.text.primary
        }
      },
      tooltip: {
        backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#fff',
        borderColor: theme.palette.divider,
        borderWidth: 1,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        callbacks: {
          label: (context: any) => {
            return `Yield: ${context.parsed.y.toFixed(2)}%`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          color: theme.palette.text.secondary,
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 7
        }
      },
      y: {
        grid: {
          color: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: theme.palette.text.secondary,
          callback: (value: any) => {
            return value.toFixed(2) + '%';
          }
        }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#fff',
        borderColor: theme.palette.divider,
        borderWidth: 1,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        callbacks: {
          label: (context: any) => {
            return `Yield: ${context.parsed.x.toFixed(2)}%`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: theme.palette.text.secondary,
          callback: (value: any) => {
            return value.toFixed(2) + '%';
          }
        }
      },
      y: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          color: theme.palette.text.secondary
        }
      }
    }
  };

  // Calculate platform-wide averages and totals
  const totalYieldGenerated = yieldMetrics.reduce((sum, metric) => sum + metric.totalYieldGenerated, 0);
  const weightedYieldSum = yieldMetrics.reduce((sum, metric) => sum + (metric.averageYield * metric.totalYieldGenerated), 0);
  const averageYield = totalYieldGenerated > 0 ? weightedYieldSum / totalYieldGenerated : 0;

  return (
    <Box>
      {/* Yield Summary Card */}
      <Card 
        sx={{ 
          p: 3, 
          mb: 4,
          border: '1px solid', 
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: theme.palette.mode === 'dark' 
            ? 'rgba(25, 118, 210, 0.08)' 
            : 'rgba(25, 118, 210, 0.04)'
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
          Yield Performance Summary
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Platform Average Yield
              </Typography>
              <Typography variant="h4" color="primary" sx={{ my: 1 }}>
                {averageYield.toFixed(2)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Weighted average across all asset classes
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Yield Generated
              </Typography>
              <Typography variant="h4" color="primary" sx={{ my: 1 }}>
                ${totalYieldGenerated.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cumulative yield across all assets
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Best Performing Asset Class
              </Typography>
              <Typography variant="h4" color="primary" sx={{ my: 1 }}>
                {ASSET_LABELS[yieldMetrics.reduce((max, metric) => 
                  metric.averageYield > max.averageYield ? metric : max, yieldMetrics[0]).assetClass]}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Highest average yield rate
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* Chart Controls */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3 
        }}
      >
        <ToggleButtonGroup
          value={chartType}
          exclusive
          onChange={handleChartTypeChange}
          aria-label="chart type"
          size="small"
        >
          <ToggleButton value="trend" aria-label="trend chart">
            <TrendIcon sx={{ mr: 1 }} />
            Yield Trend
          </ToggleButton>
          <ToggleButton value="comparison" aria-label="comparison chart">
            <BarIcon sx={{ mr: 1 }} />
            Asset Comparison
          </ToggleButton>
        </ToggleButtonGroup>

        <ToggleButtonGroup
          value={selectedClass}
          exclusive
          onChange={handleAssetClassChange}
          aria-label="asset class filter"
          size="small"
        >
          <ToggleButton value="all" aria-label="all asset classes">
            All
          </ToggleButton>
          {yieldMetrics.map((metric) => (
            <ToggleButton 
              key={metric.assetClass} 
              value={metric.assetClass} 
              aria-label={ASSET_LABELS[metric.assetClass]}
            >
              {ASSET_LABELS[metric.assetClass]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Chart */}
      <Card 
        sx={{ 
          p: 3, 
          mb: 4,
          border: '1px solid', 
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: 'background.paper',
        }}
      >
        <Box height={400}>
          {chartType === 'trend' && (
            <Line data={getTrendChartData()} options={lineOptions as any} />
          )}
          {chartType === 'comparison' && (
            <Bar data={getComparisonChartData()} options={barOptions as any} />
          )}
        </Box>
      </Card>

      {/* Yield Comparison Table */}
      <Card 
        sx={{ 
          border: '1px solid', 
          borderColor: 'divider',
          borderRadius: 2
        }}
      >
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Yield Comparison by Asset Class
          </Typography>
          
          <TableContainer component={Paper} elevation={0} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Asset Class</TableCell>
                  <TableCell align="right">Average Yield</TableCell>
                  <TableCell align="right">Total Yield Generated</TableCell>
                  <TableCell align="right">Yield Range</TableCell>
                  <TableCell align="right">vs. Platform Average</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMetrics.map((metric) => {
                  // Calculate min and max yield from trend data
                  const yieldValues = metric.yieldTrend.map(p => p.value);
                  const minYield = Math.min(...yieldValues);
                  const maxYield = Math.max(...yieldValues);
                  const vsPlatformAvg = metric.averageYield - averageYield;
                  
                  return (
                    <TableRow key={metric.assetClass}>
                      <TableCell
                        sx={{
                          borderLeft: `4px solid ${ASSET_COLORS[metric.assetClass] || '#999'}`
                        }}
                      >
                        {ASSET_LABELS[metric.assetClass]}
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="medium">
                          {metric.averageYield.toFixed(2)}%
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        ${metric.totalYieldGenerated.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {minYield.toFixed(2)}% - {maxYield.toFixed(2)}%
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          color={vsPlatformAvg > 0 ? 'success.main' : vsPlatformAvg < 0 ? 'error.main' : 'text.primary'}
                          fontWeight="medium"
                        >
                          {vsPlatformAvg > 0 ? '+' : ''}{vsPlatformAvg.toFixed(2)}%
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default YieldAnalyticsPanel; 