import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme
} from '@mui/material';
import Grid from '../../utils/mui-shims';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  BarChart as BarChartIcon,
  Toll as TollIcon,
  Forest as ForestIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

interface MetricItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  subtitle?: string;
}

const MetricItem: React.FC<MetricItemProps> = ({ icon, label, value, color, subtitle }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderRadius: '50%',
          bgcolor: `${color}15`, // Using transparency
          color: color,
          width: 48,
          height: 48,
          mr: 2,
          flexShrink: 0
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h6" fontWeight="medium">
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

interface MetricsPanelProps {
  totalValueLocked: number;
  totalAssetCount: number;
  totalUserCount: number;
  averageYield: number;
  totalFeesGenerated: number;
  environmentalImpact: {
    carbonOffset: number;
    impactScore: number;
  };
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({
  totalValueLocked,
  totalAssetCount,
  totalUserCount,
  averageYield,
  totalFeesGenerated,
  environmentalImpact
}) => {
  const theme = useTheme();

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short'
    }).format(num);
  };

  return (
    <Card 
      elevation={0} 
      sx={{ 
        p: 3, 
        border: '1px solid', 
        borderColor: 'divider',
        borderRadius: 2,
        backgroundColor: (theme) => theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.05)' 
          : 'rgba(0, 0, 0, 0.02)'
      }}
    >
      <Typography variant="h6" component="h2" gutterBottom>
        Platform Metrics
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} sm={6} md={4}>
          <MetricItem
            icon={<TrendingUpIcon />}
            label="Total Value Locked"
            value={formatCurrency(totalValueLocked)}
            color={theme.palette.primary.main}
            subtitle="Across all assets"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <MetricItem
            icon={<AssessmentIcon />}
            label="Total Assets"
            value={formatNumber(totalAssetCount)}
            color={theme.palette.info.main}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <MetricItem
            icon={<PeopleIcon />}
            label="Total Users"
            value={formatNumber(totalUserCount)}
            color={theme.palette.secondary.main}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <MetricItem
            icon={<BarChartIcon />}
            label="Average Yield"
            value={`${averageYield.toFixed(2)}%`}
            color={theme.palette.success.main}
            subtitle="Platform-wide"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <MetricItem
            icon={<TollIcon />}
            label="Total Fees Generated"
            value={formatCurrency(totalFeesGenerated)}
            color="#FF9800" // Orange
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <MetricItem
            icon={<ForestIcon />}
            label="Carbon Offset"
            value={`${environmentalImpact.carbonOffset.toFixed(1)} tons`}
            color="#10b981" // Environmental green
            subtitle={`Impact Score: ${environmentalImpact.impactScore}/100`}
          />
        </Grid>
      </Grid>
    </Card>
  );
};

export default MetricsPanel; 