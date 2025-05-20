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
  Paper,
  LinearProgress,
  Divider
} from '@mui/material';
import Grid from '../../utils/mui-shims';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import {
  Assessment as AssessmentIcon,
  CompareArrows as CompareArrowsIcon,
  ShowChart as ShowChartIcon,
  Waves as WavesIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { LiquidityMetric } from '../../types/analyticsTypes';
import { AssetClass } from '../../types/assetTypes';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Asset class colors and labels - keep consistent with other components
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

interface LiquidityMetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  change?: number;
  color?: string;
}

const LiquidityMetricCard: React.FC<LiquidityMetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  change,
  color = '#3498db'
}) => {
  const theme = useTheme();
  
  return (
    <Card
      elevation={0}
      sx={{
        p: 2,
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Box
          sx={{
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            bgcolor: `${color}20`,
            color: color
          }}
        >
          {icon}
        </Box>
      </Box>
      
      <Typography variant="h4" sx={{ fontWeight: 'medium', mb: 0.5 }}>
        {value}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
        {subtitle}
      </Typography>
      
      {change !== undefined && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <Typography
            variant="body2"
            sx={{
              color: change >= 0 ? 'success.main' : 'error.main',
              fontWeight: 'medium',
              mr: 1
            }}
          >
            {change >= 0 ? '+' : ''}{change}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            vs. previous period
          </Typography>
        </Box>
      )}
    </Card>
  );
};

interface SlippageIndicatorProps {
  value: number;
  assetClass: AssetClass;
}

const SlippageIndicator: React.FC<SlippageIndicatorProps> = ({ value, assetClass }) => {
  const theme = useTheme();
  const color = ASSET_COLORS[assetClass] || theme.palette.primary.main;
  
  // Determine rating based on slippage (lower is better)
  const getRating = (slippage: number): string => {
    if (slippage < 0.2) return 'Excellent';
    if (slippage < 0.4) return 'Good';
    if (slippage < 0.6) return 'Average';
    if (slippage < 0.8) return 'Below Average';
    return 'Poor';
  };
  
  // Calculate a normalized score for the progress bar (inverted since lower slippage is better)
  const normalizedScore = Math.max(0, Math.min(100, (1 - value) * 100));
  
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" fontWeight="medium">
          {getRating(value)}
        </Typography>
        <Typography variant="body2">
          {(value * 100).toFixed(2)}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={normalizedScore}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
          '& .MuiLinearProgress-bar': {
            bgcolor: color
          }
        }}
      />
    </Box>
  );
};

interface LiquidityAnalyticsPanelProps {
  liquidityMetrics: LiquidityMetric[];
}

const LiquidityAnalyticsPanel: React.FC<LiquidityAnalyticsPanelProps> = ({
  liquidityMetrics
}) => {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState<'overview' | 'comparison' | 'depth'>('overview');
  
  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: 'overview' | 'comparison' | 'depth' | null
  ) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };
  
  // Calculate platform-wide totals and averages
  const totalLiquidityDepth = liquidityMetrics.reduce((sum, metric) => sum + metric.liquidityDepth, 0);
  const totalLiquidityVolume = liquidityMetrics.reduce((sum, metric) => sum + metric.liquidityVolume, 0);
  const weightedSlippageSum = liquidityMetrics.reduce(
    (sum, metric) => sum + (metric.averageSlippage * metric.liquidityVolume),
    0
  );
  const platformAverageSlippage = totalLiquidityVolume > 0
    ? weightedSlippageSum / totalLiquidityVolume
    : 0;
  
  // Format currency 
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1
    }).format(amount);
  };
  
  // Prepare data for the liquidity depth chart
  const getLiquidityDepthChartData = () => {
    return {
      labels: liquidityMetrics.map(metric => ASSET_LABELS[metric.assetClass]),
      datasets: [
        {
          label: 'Liquidity Depth',
          data: liquidityMetrics.map(metric => metric.liquidityDepth),
          backgroundColor: liquidityMetrics.map(metric => ASSET_COLORS[metric.assetClass]),
          borderColor: liquidityMetrics.map(metric => 
            theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)'
          ),
          borderWidth: 1,
          hoverOffset: 15
        }
      ]
    };
  };
  
  // Prepare data for the liquidity volume chart
  const getLiquidityVolumeChartData = () => {
    return {
      labels: liquidityMetrics.map(metric => ASSET_LABELS[metric.assetClass]),
      datasets: [
        {
          label: 'Trading Volume',
          data: liquidityMetrics.map(metric => metric.liquidityVolume),
          backgroundColor: liquidityMetrics.map(metric => ASSET_COLORS[metric.assetClass]),
          borderWidth: 1,
          borderColor: theme.palette.mode === 'dark' ? '#333' : '#fff',
          borderRadius: 4
        }
      ]
    };
  };
  
  // Prepare data for the slippage comparison chart
  const getSlippageComparisonChartData = () => {
    return {
      labels: liquidityMetrics.map(metric => ASSET_LABELS[metric.assetClass]),
      datasets: [
        {
          label: 'Average Slippage (%)',
          data: liquidityMetrics.map(metric => metric.averageSlippage * 100),
          backgroundColor: liquidityMetrics.map(metric => ASSET_COLORS[metric.assetClass]),
          borderColor: theme.palette.mode === 'dark' ? '#333' : '#fff',
          borderWidth: 1,
          barThickness: 30
        }
      ]
    };
  };
  
  // Chart options
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: theme.palette.text.primary,
          font: {
            size: 12
          },
          padding: 15,
          boxWidth: 15,
          boxHeight: 15
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            return `${context.label}: ${formatCurrency(value)} (${((value / totalLiquidityDepth) * 100).toFixed(1)}%)`;
          }
        }
      }
    },
    cutout: '60%'
  };
  
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            return `${context.dataset.label}: ${formatCurrency(value)}`;
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
          color: theme.palette.text.secondary
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
            return formatCurrency(value);
          }
        }
      }
    }
  };
  
  const slippageBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `Slippage: ${context.raw.toFixed(2)}%`;
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
        },
        max: Math.max(...liquidityMetrics.map(m => m.averageSlippage * 100)) * 1.2 // Add some padding
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
  
  return (
    <Box>
      {/* Liquidity Summary */}
      <Card
        sx={{
          p: 3,
          mb: 4,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: theme.palette.mode === 'dark'
            ? 'rgba(66, 66, 255, 0.08)'
            : 'rgba(66, 153, 225, 0.04)'
        }}
      >
        <Typography variant="h6" gutterBottom>
          Liquidity Summary
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <LiquidityMetricCard
              title="Total Liquidity Depth"
              value={formatCurrency(totalLiquidityDepth)}
              subtitle="Total value available in liquidity pools"
              icon={<WavesIcon />}
              change={5.2}
              color="#3182CE"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} lg={3}>
            <LiquidityMetricCard
              title="Trading Volume (7d)"
              value={formatCurrency(totalLiquidityVolume)}
              subtitle="Total trading volume across all pools"
              icon={<CompareArrowsIcon />}
              change={12.8}
              color="#38A169"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} lg={3}>
            <LiquidityMetricCard
              title="Deepest Liquidity"
              value={ASSET_LABELS[liquidityMetrics.reduce(
                (max, metric) => metric.liquidityDepth > max.liquidityDepth ? metric : max,
                liquidityMetrics[0]
              ).assetClass]}
              subtitle="Asset class with highest liquidity"
              icon={<AssessmentIcon />}
              color="#805AD5"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} lg={3}>
            <LiquidityMetricCard
              title="Platform Avg. Slippage"
              value={`${(platformAverageSlippage * 100).toFixed(2)}%`}
              subtitle="Weighted average slippage across all pools"
              icon={<SpeedIcon />}
              change={platformAverageSlippage < 0.4 ? -2.5 : 2.5}
              color="#DD6B20"
            />
          </Grid>
        </Grid>
      </Card>
      
      {/* Chart Controls */}
      <Box sx={{ mb: 3 }}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          aria-label="view mode"
          size="small"
          sx={{ mb: 1 }}
        >
          <ToggleButton value="overview" aria-label="overview">
            <ShowChartIcon sx={{ mr: 1 }} />
            Pool Overview
          </ToggleButton>
          <ToggleButton value="comparison" aria-label="comparison">
            <CompareArrowsIcon sx={{ mr: 1 }} />
            Volume Analysis
          </ToggleButton>
          <ToggleButton value="depth" aria-label="depth">
            <SpeedIcon sx={{ mr: 1 }} />
            Slippage Metrics
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      {/* Overview View */}
      {viewMode === 'overview' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Card
              sx={{
                height: '100%',
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                bgcolor: 'background.paper'
              }}
            >
              <Typography variant="h6" gutterBottom>
                Liquidity Distribution
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Distribution of liquidity depth across asset classes
              </Typography>
              
              <Box sx={{ height: 320, position: 'relative' }}>
                <Doughnut 
                  data={getLiquidityDepthChartData()} 
                  options={doughnutOptions as any} 
                />
                
                {/* Center text */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    pointerEvents: 'none'
                  }}
                >
                  <Typography variant="h5" fontWeight="medium">
                    {formatCurrency(totalLiquidityDepth)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Liquidity
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={7}>
            <Card
              sx={{
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Liquidity Depth by Asset Class
                </Typography>
                
                <TableContainer component={Paper} elevation={0} sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Asset Class</TableCell>
                        <TableCell align="right">Liquidity Depth</TableCell>
                        <TableCell align="right">% of Total</TableCell>
                        <TableCell align="right">Avg. Slippage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {liquidityMetrics
                        .sort((a, b) => b.liquidityDepth - a.liquidityDepth)
                        .map((metric) => {
                          const percentOfTotal = (metric.liquidityDepth / totalLiquidityDepth) * 100;
                          
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
                                  {formatCurrency(metric.liquidityDepth)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                {percentOfTotal.toFixed(1)}%
                              </TableCell>
                              <TableCell align="right">
                                <Typography
                                  color={metric.averageSlippage < 0.4 ? 'success.main' : 
                                         metric.averageSlippage > 0.7 ? 'error.main' : 'warning.main'}
                                  fontWeight="medium"
                                >
                                  {(metric.averageSlippage * 100).toFixed(2)}%
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
          </Grid>
        </Grid>
      )}
      
      {/* Volume Analysis View */}
      {viewMode === 'comparison' && (
        <Card
          sx={{
            p: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.paper'
          }}
        >
          <Typography variant="h6" gutterBottom>
            Trading Volume by Asset Class
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            7-day trading volume across different asset classes
          </Typography>
          
          <Box sx={{ height: 400 }}>
            <Bar 
              data={getLiquidityVolumeChartData()} 
              options={barOptions as any} 
            />
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Volume Insights
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  Highest Volume Asset
                </Typography>
                <Typography variant="h6">
                  {ASSET_LABELS[liquidityMetrics.reduce(
                    (max, metric) => metric.liquidityVolume > max.liquidityVolume ? metric : max,
                    liquidityMetrics[0]
                  ).assetClass]}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatCurrency(liquidityMetrics.reduce(
                    (max, metric) => metric.liquidityVolume > max.liquidityVolume ? metric : max,
                    liquidityMetrics[0]
                  ).liquidityVolume)} in trading volume
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  Volume / Depth Ratio
                </Typography>
                <Typography variant="h6">
                  {((totalLiquidityVolume / totalLiquidityDepth) * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Higher ratios indicate more active markets
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  Most Efficient Pool
                </Typography>
                <Typography variant="h6">
                  {ASSET_LABELS[liquidityMetrics.reduce(
                    (min, metric) => metric.averageSlippage < min.averageSlippage ? metric : min,
                    liquidityMetrics[0]
                  ).assetClass]}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {(liquidityMetrics.reduce(
                    (min, metric) => metric.averageSlippage < min.averageSlippage ? metric : min,
                    liquidityMetrics[0]
                  ).averageSlippage * 100).toFixed(2)}% average slippage
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Card>
      )}
      
      {/* Slippage Metrics View */}
      {viewMode === 'depth' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                p: 3,
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                bgcolor: 'background.paper'
              }}
            >
              <Typography variant="h6" gutterBottom>
                Slippage Comparison
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Average trade slippage by asset class (lower is better)
              </Typography>
              
              <Box sx={{ height: 340 }}>
                <Bar 
                  data={getSlippageComparisonChartData()} 
                  options={slippageBarOptions as any} 
                />
              </Box>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                p: 3,
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <Typography variant="h6" gutterBottom>
                Liquidity Quality Assessment
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Detailed slippage analysis and efficiency rating
              </Typography>
              
              <TableContainer component={Paper} elevation={0} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Asset Class</TableCell>
                      <TableCell align="right">Avg. Slippage</TableCell>
                      <TableCell>Efficiency Rating</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {liquidityMetrics
                      .sort((a, b) => a.averageSlippage - b.averageSlippage)
                      .map((metric) => (
                        <TableRow key={metric.assetClass}>
                          <TableCell
                            sx={{
                              borderLeft: `4px solid ${ASSET_COLORS[metric.assetClass] || '#999'}`
                            }}
                          >
                            {ASSET_LABELS[metric.assetClass]}
                          </TableCell>
                          <TableCell align="right">
                            {(metric.averageSlippage * 100).toFixed(2)}%
                          </TableCell>
                          <TableCell sx={{ width: '45%' }}>
                            <SlippageIndicator 
                              value={metric.averageSlippage}
                              assetClass={metric.assetClass}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Platform Efficiency Score
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ flexGrow: 1, mr: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.max(0, Math.min(100, (1 - platformAverageSlippage) * 100))}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: theme.palette.primary.main
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="h6" sx={{ minWidth: 60, textAlign: 'right' }}>
                    {Math.round((1 - platformAverageSlippage) * 100)}/100
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default LiquidityAnalyticsPanel; 