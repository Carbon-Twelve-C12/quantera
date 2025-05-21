import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Tab,
  Tabs,
  CircularProgress,
  Divider,
  Alert
} from '@mui/material';
import Grid from '../utils/mui-shims';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { 
  Refresh as RefreshIcon,
  InsertChartOutlined as ChartIcon
} from '@mui/icons-material';
import MetricsPanel from '../components/analytics/MetricsPanel';
import DistributionChart from '../components/analytics/DistributionChart';
import PerformanceChart from '../components/portfolio/PerformanceChart';
import EnvironmentalImpactPanel from '../components/analytics/EnvironmentalImpactPanel';
import YieldAnalyticsPanel from '../components/analytics/YieldAnalyticsPanel';
import LiquidityAnalyticsPanel from '../components/analytics/LiquidityAnalyticsPanel';
import RiskAnalyticsPanel from '../components/analytics/RiskAnalyticsPanel';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Time range options
const TIME_RANGES = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '180d', label: '180 Days' },
  { value: '1y', label: '1 Year' }
];

// Tab values
const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'yield', label: 'Yield Analytics' },
  { value: 'liquidity', label: 'Liquidity' },
  { value: 'risk', label: 'Risk Analysis' },
  { value: 'environmental', label: 'Environmental Impact' }
];

const AnalyticsDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { 
    platformMetrics, 
    loading, 
    error, 
    refreshAnalytics,
    timeframe,
    setTimeframe
  } = useAnalytics();

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  const handleTimeframeChange = (event: React.MouseEvent<HTMLElement>, newTimeframe: string) => {
    if (newTimeframe !== null) {
      setTimeframe(newTimeframe);
    }
  };

  // Helper to format a timestamp for chart labels
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading Analytics Data...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={refreshAnalytics}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  if (!platformMetrics) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="info">
          No analytics data available at this time.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Platform Analytics
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Comprehensive metrics and insights for the Quantera platform
          </Typography>
        </Box>
        
        <Button 
          startIcon={<RefreshIcon />}
          onClick={refreshAnalytics}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Time range selection */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 1 }}
        >
          {TABS.map((tab) => (
            <Tab key={tab.value} value={tab.value} label={tab.label} />
          ))}
        </Tabs>
        
        <ToggleButtonGroup
          value={timeframe}
          exclusive
          onChange={handleTimeframeChange}
          aria-label="timeframe"
          size="small"
        >
          {TIME_RANGES.map((range) => (
            <ToggleButton key={range.value} value={range.value} aria-label={range.label}>
              {range.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Divider sx={{ mb: 4 }} />
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Metrics Panel */}
          <Box sx={{ mb: 4 }}>
            <MetricsPanel 
              totalValueLocked={platformMetrics.totalValueLocked}
              totalAssetCount={platformMetrics.totalAssetCount}
              totalUserCount={platformMetrics.totalUserCount}
              averageYield={platformMetrics.averageYield}
              totalFeesGenerated={platformMetrics.totalFeesGenerated}
              environmentalImpact={{
                carbonOffset: platformMetrics.environmentalImpact.carbonOffset,
                impactScore: platformMetrics.environmentalImpact.impactScore
              }}
            />
          </Box>
          
          {/* Charts */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={8}>
              <PerformanceChart 
                performanceHistory={platformMetrics.valueHistory}
                title="Total Value Locked (TVL)"
                height={300}
                showYield={false}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <DistributionChart 
                distribution={platformMetrics.assetDistribution}
                title="Asset Distribution"
                height={300}
                valueType="value"
              />
            </Grid>
          </Grid>
          
          {/* Additional Metrics */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <PerformanceChart 
                performanceHistory={platformMetrics.userGrowthHistory}
                title="User Growth"
                height={250}
                showYield={false}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <PerformanceChart 
                performanceHistory={platformMetrics.transactionHistory}
                title="Transaction Volume"
                height={250}
                showYield={false}
              />
            </Grid>
          </Grid>
        </>
      )}
      
      {/* Yield Analytics Tab */}
      {activeTab === 'yield' && (
        <YieldAnalyticsPanel yieldMetrics={platformMetrics.yieldMetrics} />
      )}
      
      {/* Liquidity Tab */}
      {activeTab === 'liquidity' && (
        <LiquidityAnalyticsPanel liquidityMetrics={platformMetrics.liquidityMetrics} />
      )}
      
      {/* Risk Analysis Tab */}
      {activeTab === 'risk' && (
        <RiskAnalyticsPanel 
          riskMetrics={platformMetrics.riskMetrics}
          liquidityMetrics={platformMetrics.liquidityMetrics}
          assetDistribution={platformMetrics.assetDistribution}
        />
      )}
      
      {/* Environmental Impact Tab */}
      {activeTab === 'environmental' && (
        <EnvironmentalImpactPanel environmentalMetrics={platformMetrics.environmentalImpact} />
      )}
    </Container>
  );
};

export default AnalyticsDashboardPage; 