import React from 'react';
import { TradeFinanceAnalytics, TradeFinanceAssetType } from '../../types/tradeFinance';
import { 
  Box, 
  Paper, 
  Typography, 
  Divider, 
  Skeleton,
  useTheme,
  LinearProgress
} from '@mui/material';
import Grid from '../../utils/mui-shims';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PublicIcon from '@mui/icons-material/Public';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ScheduleIcon from '@mui/icons-material/Schedule';
import BarChartIcon from '@mui/icons-material/BarChart';

interface TradeFinanceAnalyticsPanelProps {
  analytics: TradeFinanceAnalytics;
}

// Updated asset type labels to match the current enum values
const assetTypeLabels: Record<TradeFinanceAssetType, string> = {
  [TradeFinanceAssetType.EXPORT_FINANCING]: 'Export Financing',
  [TradeFinanceAssetType.IMPORT_FINANCING]: 'Import Financing',
  [TradeFinanceAssetType.INVENTORY_FINANCING]: 'Inventory Financing',
  [TradeFinanceAssetType.SUPPLY_CHAIN_FINANCE]: 'Supply Chain Finance'
};

// Risk level labels for risk distribution chart
const riskLabels: Record<number, string> = {
  1: 'Very Low',
  2: 'Low',
  3: 'Moderate-Low',
  4: 'Moderate',
  5: 'Moderate-High',
  6: 'Medium-High',
  7: 'High',
  8: 'Very High',
  9: 'Extreme',
  10: 'Maximum'
};

// Country codes to full names (sample map)
const countryNames: Record<string, string> = {
  'BR': 'Brazil',
  'FR': 'France',
  'CO': 'Colombia',
  'US': 'United States',
  'SG': 'Singapore',
  'CN': 'China',
  'IN': 'India',
  'DE': 'Germany',
  'GB': 'United Kingdom',
  'JP': 'Japan',
  'AU': 'Australia'
};

const TradeFinanceAnalyticsPanel: React.FC<TradeFinanceAnalyticsPanelProps> = ({ analytics }) => {
  const theme = useTheme();

  if (!analytics) {
    return (
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Market Analytics
        </Typography>
        <Grid container spacing={3}>
          {[...Array(4)].map((_, index) => (
            <Grid xs={12} sm={6} md={3} key={index} item>
              <Skeleton variant="rectangular" height={100} />
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1
    }).format(amount);
  };

  const formatYield = (yieldValue: number): string => {
    return `${yieldValue.toFixed(2)}%`;
  };

  const formatMaturity = (days: number): string => {
    if (days < 30) {
      return `${days} days`;
    } else if (days < 365) {
      return `${Math.round(days / 30)} months`;
    } else {
      return `${(days / 365).toFixed(1)} years`;
    }
  };

  return (
    <Paper 
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
        Trade Finance Analytics
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticItem
            icon={<TrendingUpIcon />}
            label="Total Volume"
            value={formatCurrency(analytics.totalVolume)}
            color="#4CAF50"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticItem
            icon={<AccountBalanceIcon />}
            label="Active Assets"
            value={analytics.activeAssets.toString()}
            color="#2196F3"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticItem
            icon={<BarChartIcon />}
            label="Average Yield"
            value={formatYield(analytics.averageYield)}
            color="#FF9800"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticItem
            icon={<ScheduleIcon />}
            label="Average Maturity"
            value={formatMaturity(analytics.averageMaturity)}
            color="#9C27B0"
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

interface AnalyticItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

const AnalyticItem: React.FC<AnalyticItemProps> = ({ icon, label, value, color }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
          mr: 2
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
      </Box>
    </Box>
  );
};

export default TradeFinanceAnalyticsPanel; 