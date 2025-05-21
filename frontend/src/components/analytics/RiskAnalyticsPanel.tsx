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
  Tooltip,
  IconButton,
  Chip,
  Divider
} from '@mui/material';
import Grid from '../../utils/mui-shims';
import { Doughnut, Bar, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';
import { 
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  ShowChart as ShowChartIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  TrendingDown as TrendingDownIcon,
  Bolt as BoltIcon
} from '@mui/icons-material';
import { RiskMetric, LiquidityMetric, AssetDistribution } from '../../types/analyticsTypes';
import { AssetClass } from '../../types/assetTypes';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
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

// Risk levels
const RISK_LEVELS = ['Low', 'Moderate', 'Elevated', 'High'];
const RISK_COLORS = ['#2ecc71', '#3498db', '#f39c12', '#e74c3c'];

interface RiskScore {
  category: string;
  description: string;
  score: number;
  color: string;
}

interface RiskAnalyticsPanelProps {
  riskMetrics: RiskMetric[];
  liquidityMetrics?: LiquidityMetric[];
  assetDistribution?: AssetDistribution[];
}

const RiskAnalyticsPanel: React.FC<RiskAnalyticsPanelProps> = ({
  riskMetrics,
  liquidityMetrics = [],
  assetDistribution = []
}) => {
  const theme = useTheme();
  const [chartType, setChartType] = useState<'doughnut' | 'bar' | 'radar'>('doughnut');

  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newType: 'doughnut' | 'bar' | 'radar' | null
  ) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  // Calculate overall portfolio risk metrics
  const totalValue = riskMetrics.reduce((sum, metric) => sum + metric.totalValue, 0);
  const weightedRiskLevel = riskMetrics.reduce(
    (sum, metric) => sum + (metric.riskLevel * metric.totalValue),
    0
  ) / totalValue;

  // Calculate risk distribution
  const getRiskDistributionData = () => {
    return {
      labels: riskMetrics.map((metric) => `Risk Level ${metric.riskLevel} (${RISK_LEVELS[metric.riskLevel - 1]})`),
      datasets: [{
        data: riskMetrics.map((metric) => metric.percentage),
        backgroundColor: riskMetrics.map((metric) => RISK_COLORS[metric.riskLevel - 1]),
        borderColor: theme.palette.background.paper,
        borderWidth: 1
      }]
    };
  };

  // Calculate risk vs yield data
  const getRiskVsYieldData = () => {
    return {
      labels: riskMetrics.map((metric) => `Risk Level ${metric.riskLevel} (${RISK_LEVELS[metric.riskLevel - 1]})`),
      datasets: [{
        label: 'Expected Yield (%)',
        data: riskMetrics.map((metric) => metric.expectedYield),
        backgroundColor: riskMetrics.map((metric) => RISK_COLORS[metric.riskLevel - 1]),
        borderColor: theme.palette.mode === 'dark' ? '#333' : '#fff',
        borderWidth: 1
      }]
    };
  };

  // Calculate risk profile data for radar chart
  // We'll use a calculated risk score across different dimensions
  const getRiskProfileData = () => {
    // Calculate risk scores from various metrics
    const concentrationRisk = calculateConcentrationRisk();
    const liquidityRisk = calculateLiquidityRisk();
    const volatilityRisk = calculateVolatilityRisk();
    const maturityRisk = calculateMaturityRisk();
    const marketRisk = calculateMarketRisk();
    
    return {
      labels: ['Concentration Risk', 'Liquidity Risk', 'Volatility Risk', 'Maturity Risk', 'Market Risk'],
      datasets: [{
        label: 'Portfolio Risk Profile',
        data: [
          concentrationRisk,
          liquidityRisk,
          volatilityRisk,
          maturityRisk,
          marketRisk
        ],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255, 99, 132, 1)',
        pointRadius: 4
      }]
    };
  };

  // Calculate risk scores
  // These would ideally use actual data calculations, but for this mock we're using simplified formulas
  const calculateConcentrationRisk = (): number => {
    // Higher concentration in fewer asset classes = higher risk
    // If we have 5+ asset classes with meaningful distribution, risk is lower
    if (!assetDistribution || assetDistribution.length === 0) return 50;
    
    const numAssetClasses = assetDistribution.length;
    const topAssetPercentage = assetDistribution[0]?.percentage || 0;
    
    // Score 0-100 where higher is more risky
    return Math.min(100, Math.max(0, 
      (numAssetClasses < 3 ? 60 : numAssetClasses < 5 ? 40 : 20) + 
      (topAssetPercentage > 70 ? 40 : topAssetPercentage > 50 ? 30 : topAssetPercentage > 30 ? 20 : 10)
    ));
  };

  const calculateLiquidityRisk = (): number => {
    // Lower liquidity depth = higher risk
    if (!liquidityMetrics || liquidityMetrics.length === 0) return 50;
    
    const totalLiquidityDepth = liquidityMetrics.reduce((sum, metric) => sum + metric.liquidityDepth, 0);
    const totalValue = riskMetrics.reduce((sum, metric) => sum + metric.totalValue, 0);
    
    // Liquidity as percentage of total value
    const liquidityRatio = totalLiquidityDepth / totalValue;
    
    // Score 0-100 where higher is more risky
    return Math.min(100, Math.max(0, 
      liquidityRatio < 0.1 ? 90 : 
      liquidityRatio < 0.25 ? 70 : 
      liquidityRatio < 0.5 ? 50 : 
      liquidityRatio < 0.75 ? 30 : 10
    ));
  };

  const calculateVolatilityRisk = (): number => {
    // Higher weighted risk level = higher volatility
    // Use the weighted risk level as a proxy
    return Math.min(100, Math.max(0, weightedRiskLevel * 25));
  };

  const calculateMaturityRisk = (): number => {
    // This would ideally be calculated from actual maturity data
    // For this mock, we'll use risk level as a proxy
    const shortTermExposure = riskMetrics
      .filter(metric => metric.riskLevel >= 3)
      .reduce((sum, metric) => sum + metric.percentage, 0);
    
    // Score 0-100 where higher is more risky
    return Math.min(100, Math.max(0, 
      shortTermExposure > 50 ? 80 : 
      shortTermExposure > 30 ? 60 : 
      shortTermExposure > 15 ? 40 : 20
    ));
  };

  const calculateMarketRisk = (): number => {
    // Proxy using average expected yield as indicator of market risk
    const avgExpectedYield = riskMetrics.reduce(
      (sum, metric) => sum + (metric.expectedYield * metric.percentage / 100), 
      0
    );
    
    // Higher yield often correlates with higher market risk
    // Score 0-100 where higher is more risky
    return Math.min(100, Math.max(0,
      avgExpectedYield > 10 ? 85 :
      avgExpectedYield > 8 ? 70 :
      avgExpectedYield > 6 ? 55 :
      avgExpectedYield > 4 ? 40 : 25
    ));
  };

  // Calculate risk scores for display
  const riskScores: RiskScore[] = [
    {
      category: 'Concentration Risk',
      description: 'Risk due to high exposure to specific asset classes',
      score: calculateConcentrationRisk(),
      color: '#e74c3c'
    },
    {
      category: 'Liquidity Risk',
      description: 'Risk due to difficulty in converting assets to cash quickly',
      score: calculateLiquidityRisk(),
      color: '#f39c12'
    },
    {
      category: 'Volatility Risk',
      description: 'Risk due to price fluctuations over time',
      score: calculateVolatilityRisk(),
      color: '#9b59b6'
    },
    {
      category: 'Maturity Risk',
      description: 'Risk related to asset maturity timeframes',
      score: calculateMaturityRisk(),
      color: '#3498db'
    },
    {
      category: 'Market Risk',
      description: 'Risk due to general market conditions',
      score: calculateMarketRisk(),
      color: '#2ecc71'
    }
  ];

  // Calculate overall risk score
  const overallRiskScore = Math.round(
    (riskScores.reduce((sum, score) => sum + score.score, 0)) / riskScores.length
  );

  // Determine risk level based on overall score
  const getRiskLevel = (score: number): { level: string; color: string } => {
    if (score < 30) return { level: 'Low', color: '#2ecc71' };
    if (score < 50) return { level: 'Moderate', color: '#3498db' };
    if (score < 70) return { level: 'Elevated', color: '#f39c12' };
    return { level: 'High', color: '#e74c3c' };
  };

  const riskLevel = getRiskLevel(overallRiskScore);

  // Chart options
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: theme.palette.text.primary,
          padding: 15
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ${value.toFixed(1)}%`;
          }
        }
      }
    }
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
            return `Expected Yield: ${context.raw.toFixed(2)}%`;
          }
        }
      }
    },
    scales: {
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
            return value.toFixed(1) + '%';
          }
        }
      },
      x: {
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

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          display: false,
          stepSize: 20
        },
        pointLabels: {
          color: theme.palette.text.primary,
          font: {
            size: 11
          }
        },
        grid: {
          color: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.05)',
        },
        angleLines: {
          color: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(0, 0, 0, 0.1)',
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `Risk Level: ${context.raw}/100`;
          }
        }
      }
    }
  };

  return (
    <Box>
      {/* Risk Summary Card */}
      <Card 
        sx={{ 
          p: 3, 
          mb: 4,
          border: '1px solid', 
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: theme.palette.mode === 'dark' 
            ? `${riskLevel.color}10` 
            : `${riskLevel.color}08`
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ color: riskLevel.color }}>
          Risk Analysis Summary
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Overall Risk Score
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                <Typography variant="h4" sx={{ color: riskLevel.color, mr: 1 }}>
                  {overallRiskScore}/100
                </Typography>
                <Chip 
                  label={riskLevel.level} 
                  size="small"
                  sx={{ 
                    bgcolor: `${riskLevel.color}20`,
                    color: riskLevel.color,
                    fontWeight: 'medium'
                  }} 
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={overallRiskScore}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  mb: 1,
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(0, 0, 0, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: riskLevel.color
                  }
                }}
              />
              <Typography variant="body2" color="text.secondary">
                Based on portfolio composition and market factors
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Weighted Risk Level
              </Typography>
              <Typography variant="h4" color={RISK_COLORS[Math.round(weightedRiskLevel) - 1]} sx={{ my: 1 }}>
                {weightedRiskLevel.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average risk level weighted by asset value
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Risk-Adjusted Yield
              </Typography>
              <Typography variant="h4" color="primary" sx={{ my: 1 }}>
                {(riskMetrics.reduce((sum, metric) => sum + (metric.expectedYield * metric.totalValue), 0) / totalValue).toFixed(2)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Expected yield considering current risk profile
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
        <Typography variant="h6">Risk Metrics Visualization</Typography>

        <ToggleButtonGroup
          value={chartType}
          exclusive
          onChange={handleChartTypeChange}
          aria-label="chart type"
          size="small"
        >
          <ToggleButton value="doughnut" aria-label="doughnut chart">
            <PieChartIcon sx={{ mr: 1 }} />
            Risk Distribution
          </ToggleButton>
          <ToggleButton value="bar" aria-label="bar chart">
            <BarChartIcon sx={{ mr: 1 }} />
            Risk vs Yield
          </ToggleButton>
          <ToggleButton value="radar" aria-label="radar chart">
            <ShowChartIcon sx={{ mr: 1 }} />
            Risk Profile
          </ToggleButton>
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
          {chartType === 'doughnut' && (
            <Doughnut data={getRiskDistributionData()} options={doughnutOptions as any} />
          )}
          {chartType === 'bar' && (
            <Bar data={getRiskVsYieldData()} options={barOptions as any} />
          )}
          {chartType === 'radar' && (
            <Radar data={getRiskProfileData()} options={radarOptions as any} />
          )}
        </Box>
      </Card>

      {/* Risk Metrics Table */}
      <Card 
        sx={{ 
          border: '1px solid', 
          borderColor: 'divider',
          borderRadius: 2
        }}
      >
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Risk Metrics Breakdown
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {riskScores.map((score, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          color: score.color,
                          display: 'flex',
                          alignItems: 'center',
                          mr: 1 
                        }}
                      >
                        {index === 0 ? <SecurityIcon /> :
                         index === 1 ? <BoltIcon /> :
                         index === 2 ? <TrendingDownIcon /> :
                         index === 3 ? <WarningIcon /> :
                         <InfoIcon />}
                      </Box>
                      <Typography variant="body2" color="text.secondary">{score.category}</Typography>
                    </Box>
                    <Tooltip title={score.description}>
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={score.score} 
                      sx={{ 
                        height: 4, 
                        borderRadius: 2, 
                        flexGrow: 1,
                        mr: 2,
                        bgcolor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.1)' 
                          : 'rgba(0, 0, 0, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: score.color
                        }
                      }}
                    />
                    <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'right' }}>
                      {score.score}/100
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" gutterBottom>
            Asset Risk Levels
          </Typography>
          
          <TableContainer component={Paper} elevation={0} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Risk Level</TableCell>
                  <TableCell align="right">Portfolio %</TableCell>
                  <TableCell align="right">Total Value</TableCell>
                  <TableCell align="right">Expected Yield</TableCell>
                  <TableCell align="right">Risk-Adjusted Return</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {riskMetrics.map((metric) => {
                  const riskLevel = RISK_LEVELS[metric.riskLevel - 1];
                  const riskColor = RISK_COLORS[metric.riskLevel - 1];
                  // Simple Sharpe ratio approximation (using risk level as volatility proxy)
                  const riskAdjustedReturn = (metric.expectedYield / metric.riskLevel).toFixed(2);
                  
                  return (
                    <TableRow key={metric.riskLevel}>
                      <TableCell
                        sx={{
                          borderLeft: `4px solid ${riskColor}`
                        }}
                      >
                        <Typography fontWeight="medium">
                          {riskLevel} (Level {metric.riskLevel})
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {metric.percentage.toFixed(1)}%
                      </TableCell>
                      <TableCell align="right">
                        ${metric.totalValue.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {metric.expectedYield.toFixed(2)}%
                      </TableCell>
                      <TableCell align="right">
                        {riskAdjustedReturn}
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

export default RiskAnalyticsPanel; 