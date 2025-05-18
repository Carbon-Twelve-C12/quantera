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

interface TradeFinanceAnalyticsPanelProps {
  analytics: TradeFinanceAnalytics | null;
}

const assetTypeLabels: Record<TradeFinanceAssetType, string> = {
  [TradeFinanceAssetType.LETTER_OF_CREDIT]: 'Letters of Credit',
  [TradeFinanceAssetType.INVOICE_RECEIVABLE]: 'Invoice Receivables',
  [TradeFinanceAssetType.WAREHOUSE_RECEIPT]: 'Warehouse Receipts',
  [TradeFinanceAssetType.BILL_OF_LADING]: 'Bills of Lading',
  [TradeFinanceAssetType.EXPORT_CREDIT]: 'Export Credits',
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
          {[...Array(6)].map((_, index) => (
            <Grid xs={12} sm={6} md={4} key={index} item>
              <Skeleton variant="rectangular" height={100} />
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  }

  return (
    <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <ShowChartIcon sx={{ mr: 1 }} color="primary" />
        <Typography variant="h6">
          Trade Finance Market Analytics
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Grid container spacing={3}>
        {/* Key Metrics */}
        <Grid xs={12} sm={6} md={3} item>
          <Box>
            <Box display="flex" alignItems="center" mb={1}>
              <AccountBalanceWalletIcon sx={{ mr: 1 }} color="primary" />
              <Typography variant="subtitle2">Total Value Locked</Typography>
            </Box>
            <Typography variant="h5" color="primary" fontWeight="bold">
              ${analytics.totalValueLocked.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Across {analytics.activeAssets} active assets
            </Typography>
          </Box>
        </Grid>
        
        <Grid xs={12} sm={6} md={3} item>
          <Box>
            <Box display="flex" alignItems="center" mb={1}>
              <LocalOfferIcon sx={{ mr: 1 }} color="primary" />
              <Typography variant="subtitle2">Average Yield</Typography>
            </Box>
            <Typography variant="h5" color="primary" fontWeight="bold">
              {analytics.averageYield.toFixed(2)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Annual percentage rate (APR)
            </Typography>
          </Box>
        </Grid>
        
        <Grid xs={12} sm={6} md={3} item>
          <Box>
            <Box display="flex" alignItems="center" mb={1}>
              <TimelineIcon sx={{ mr: 1 }} color="primary" />
              <Typography variant="subtitle2">Average Term</Typography>
            </Box>
            <Typography variant="h5" color="primary" fontWeight="bold">
              {analytics.averageTerm} days
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Average time to maturity
            </Typography>
          </Box>
        </Grid>
        
        <Grid xs={12} sm={6} md={3} item>
          <Box>
            <Box display="flex" alignItems="center" mb={1}>
              <AssessmentIcon sx={{ mr: 1 }} color="primary" />
              <Typography variant="subtitle2">Risk Profile</Typography>
            </Box>
            <Typography variant="h5" color="primary" fontWeight="bold">
              Moderate
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg. risk rating: 3.15/10
            </Typography>
          </Box>
        </Grid>
        
        <Grid xs={12} item>
          <Divider sx={{ my: 2 }} />
        </Grid>
        
        {/* Asset Type Distribution */}
        <Grid xs={12} md={6} item>
          <Typography variant="subtitle2" gutterBottom>
            Asset Type Distribution
          </Typography>
          
          {Object.entries(analytics.assetTypeDistribution)
            .filter(([_, value]) => value > 0)
            .sort(([_, a], [__, b]) => b - a)
            .map(([type, percentage]) => (
              <Box key={type} mb={1}>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2">
                    {assetTypeLabels[type as TradeFinanceAssetType]}
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {percentage}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{
                    height: 8,
                    borderRadius: 1,
                    bgcolor: theme.palette.background.paper,
                    '& .MuiLinearProgress-bar': {
                      bgcolor: theme.palette.primary.main
                    }
                  }}
                />
              </Box>
            ))}
        </Grid>
        
        {/* Risk Distribution */}
        <Grid xs={12} md={6} item>
          <Typography variant="subtitle2" gutterBottom>
            Risk Distribution
          </Typography>
          
          {Object.entries(analytics.riskDistribution)
            .filter(([_, value]) => value > 0)
            .sort(([risk1], [risk2]) => Number(risk1) - Number(risk2))
            .map(([risk, percentage]) => (
              <Box key={risk} mb={1}>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2">
                    {riskLabels[Number(risk)] || `Risk ${risk}`}
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {percentage}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{
                    height: 8,
                    borderRadius: 1,
                    bgcolor: theme.palette.background.paper,
                    '& .MuiLinearProgress-bar': {
                      bgcolor: Number(risk) <= 3 
                        ? theme.palette.success.main 
                        : Number(risk) <= 7 
                          ? theme.palette.warning.main 
                          : theme.palette.error.main
                    }
                  }}
                />
              </Box>
            ))}
        </Grid>
        
        <Grid xs={12} item>
          <Divider sx={{ my: 2 }} />
        </Grid>
        
        {/* Geographic Distribution */}
        <Grid xs={12} item>
          <Box display="flex" alignItems="center" mb={2}>
            <PublicIcon sx={{ mr: 1 }} color="primary" />
            <Typography variant="subtitle2">
              Geographic Distribution
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            {Object.entries(analytics.geographicDistribution)
              .filter(([_, value]) => value > 0)
              .sort(([_, a], [__, b]) => b - a)
              .map(([countryCode, percentage]) => (
                <Grid xs={6} sm={4} md={3} lg={2} key={countryCode} item>
                  <Box 
                    sx={{ 
                      p: 1.5, 
                      borderRadius: 1, 
                      bgcolor: 'background.paper',
                      border: 1,
                      borderColor: 'divider'
                    }}
                  >
                    <Typography variant="body2" gutterBottom>
                      {countryNames[countryCode] || countryCode}
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {percentage}%
                    </Typography>
                  </Box>
                </Grid>
              ))}
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default TradeFinanceAnalyticsPanel; 