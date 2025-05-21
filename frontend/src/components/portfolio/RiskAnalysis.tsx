import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Tooltip,
  IconButton,
  LinearProgress,
  useTheme
} from '@mui/material';
import {
  Info as InfoIcon,
  Security as SecurityIcon,
  Timeline as TimelineIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { AssetHolding } from '../../types/portfolioTypes';
import CompatGrid from '../common/CompatGrid';

// Use CompatGrid instead of MUI Grid
const Grid = CompatGrid;

interface RiskAnalysisProps {
  holdings: AssetHolding[];
}

interface RiskMetric {
  name: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const RiskAnalysis: React.FC<RiskAnalysisProps> = ({ holdings }) => {
  const theme = useTheme();

  // Calculate risk metrics based on holdings
  const calculateRiskMetrics = (): RiskMetric[] => {
    // 1. Concentration risk - highest percentage of portfolio in one asset
    const totalValue = holdings.reduce((sum, asset) => sum + asset.value, 0);
    const maxConcentration = Math.max(...holdings.map(asset => asset.value / totalValue * 100));
    
    // 2. Maturity risk - percentage of assets maturing in less than 3 months
    const now = new Date().getTime();
    const threeMonthsFromNow = now + (90 * 24 * 60 * 60 * 1000);
    const shortTermAssets = holdings.filter(asset => {
      if (!asset.maturity) return false;
      const maturityDate = new Date(asset.maturity).getTime();
      return maturityDate < threeMonthsFromNow;
    });
    const shortTermPercentage = shortTermAssets.reduce((sum, asset) => sum + asset.value, 0) / totalValue * 100;
    
    // 3. Diversification score - based on number of asset classes and categories
    const uniqueCategories = new Set(holdings.map(asset => asset.category)).size;
    const diversificationScore = Math.min(100, uniqueCategories * 20); // 5 categories would be 100%
    
    // 4. Environmental risk exposure - percentage of portfolio not in environmental assets
    const nonEnvironmentalPercentage = holdings
      .filter(asset => asset.category !== 'environmental')
      .reduce((sum, asset) => sum + asset.value, 0) / totalValue * 100;
    
    return [
      {
        name: 'Concentration Risk',
        value: maxConcentration,
        description: 'Percentage of portfolio in largest single holding. Lower is generally better.',
        icon: <BarChartIcon />,
        color: theme.palette.warning.main
      },
      {
        name: 'Short-term Maturity',
        value: shortTermPercentage,
        description: 'Percentage of assets maturing within 3 months. Affects liquidity and reinvestment risk.',
        icon: <TimelineIcon />,
        color: theme.palette.info.main
      },
      {
        name: 'Diversification',
        value: diversificationScore,
        description: 'Score based on asset class variety. Higher is better for risk reduction.',
        icon: <SecurityIcon />,
        color: theme.palette.success.main
      },
      {
        name: 'Climate Risk Exposure',
        value: nonEnvironmentalPercentage,
        description: 'Percentage of portfolio not in environmentally focused assets. Lower may reduce long-term climate risk.',
        icon: <SecurityIcon />,
        color: theme.palette.error.main
      }
    ];
  };

  const riskMetrics = calculateRiskMetrics();

  // Calculate overall risk score (simplified approach)
  const calculateOverallRisk = (): number => {
    const concentrationFactor = Math.min(100, riskMetrics[0].value * 2) * 0.25; // 25% weight
    const shortTermFactor = Math.abs(riskMetrics[1].value - 50) * 2 * 0.15; // 15% weight, optimal around 50%
    const diversificationFactor = (100 - riskMetrics[2].value) * 0.35; // 35% weight
    const climateFactor = riskMetrics[3].value * 0.25; // 25% weight
    
    // Lower score is better (less risk)
    return (concentrationFactor + shortTermFactor + diversificationFactor + climateFactor);
  };

  const overallRiskScore = calculateOverallRisk();
  
  // Determine risk level
  const getRiskLevel = (score: number): {label: string; color: string} => {
    if (score < 30) return { label: 'Low', color: theme.palette.success.main };
    if (score < 50) return { label: 'Moderate', color: theme.palette.info.main };
    if (score < 70) return { label: 'Elevated', color: theme.palette.warning.main };
    return { label: 'High', color: theme.palette.error.main };
  };
  
  const riskLevel = getRiskLevel(overallRiskScore);

  return (
    <Card sx={{ 
      height: '100%',
      bgcolor: 'background.paper',
      color: 'text.primary',
      boxShadow: theme.shadows[1]
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Risk Analysis</Typography>
          <Tooltip title="Analysis based on portfolio composition and market factors">
            <IconButton size="small">
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Overall Risk Score</Typography>
                <Typography 
                  variant="body2" 
                  fontWeight="medium"
                  sx={{ color: riskLevel.color }}
                >
                  {riskLevel.label}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={overallRiskScore} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(0, 0, 0, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: riskLevel.color
                  }
                }}
              />
            </Box>
          </Grid>
          
          {riskMetrics.map((metric, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box 
                      sx={{ 
                        color: metric.color,
                        display: 'flex',
                        alignItems: 'center',
                        mr: 1 
                      }}
                    >
                      {metric.icon}
                    </Box>
                    <Typography variant="body2" color="text.secondary">{metric.name}</Typography>
                  </Box>
                  <Tooltip title={metric.description}>
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={metric.value} 
                    sx={{ 
                      height: 4, 
                      borderRadius: 2, 
                      flexGrow: 1,
                      mr: 2,
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'rgba(0, 0, 0, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: metric.color
                      }
                    }}
                  />
                  <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'right' }}>
                    {metric.value.toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default RiskAnalysis; 