import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Tab,
  Tabs,
  CircularProgress,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Grid from '../utils/mui-shims';
import { useAnalytics } from '../contexts/AnalyticsContext';
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
  RefreshCw,
  LayoutDashboard,
  TrendingUp,
  Droplets,
  ShieldAlert,
  Leaf,
  BarChart3
} from 'lucide-react';
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
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '180d', label: '180D' },
  { value: '1y', label: '1Y' }
];

// Tab configuration with icons
const TABS = [
  { value: 'overview', label: 'Overview', icon: LayoutDashboard },
  { value: 'yield', label: 'Yield Analytics', icon: TrendingUp },
  { value: 'liquidity', label: 'Liquidity', icon: Droplets },
  { value: 'risk', label: 'Risk Analysis', icon: ShieldAlert },
  { value: 'environmental', label: 'Environmental Impact', icon: Leaf }
];

// Swiss Precision Styled Components
const PageContainer = styled(Box)({
  minHeight: '100vh',
  background: 'var(--surface-base)',
  paddingBottom: '80px',
});

const PageHeader = styled(Box)({
  padding: '32px 0 24px',
  borderBottom: '1px solid var(--surface-subtle)',
  marginBottom: '24px',
});

const HeaderContent = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '24px',
  flexWrap: 'wrap',
});

const HeaderLeft = styled(Box)({
  flex: 1,
});

const PageTitle = styled(Typography)({
  fontFamily: 'var(--font-display)',
  fontSize: '28px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  letterSpacing: '-0.01em',
  marginBottom: '8px',
});

const PageSubtitle = styled(Typography)({
  fontFamily: 'var(--font-body)',
  fontSize: '15px',
  color: 'var(--text-secondary)',
});

const RefreshButton = styled(Button)({
  background: 'transparent',
  border: '1px solid var(--surface-subtle)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-secondary)',
  padding: '8px 16px',
  fontFamily: 'var(--font-body)',
  fontWeight: 500,
  fontSize: '14px',
  textTransform: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'all 150ms',

  '&:hover': {
    background: 'var(--surface-overlay)',
    borderColor: 'var(--surface-hover)',
    color: 'var(--text-primary)',
  },

  '&:disabled': {
    opacity: 0.5,
  },
});

const ControlsContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '16px',
  flexWrap: 'wrap',
  marginBottom: '32px',
});

const StyledTabs = styled(Tabs)({
  minHeight: '44px',

  '& .MuiTabs-indicator': {
    backgroundColor: 'var(--accent-primary)',
    height: '2px',
  },

  '& .MuiTabs-flexContainer': {
    gap: '4px',
  },

  '& .MuiTab-root': {
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    fontSize: '14px',
    color: 'var(--text-secondary)',
    textTransform: 'none',
    minHeight: '44px',
    padding: '10px 16px',
    gap: '8px',
    transition: 'color 150ms',
    borderRadius: 'var(--radius-md) var(--radius-md) 0 0',

    '&.Mui-selected': {
      color: 'var(--text-primary)',
    },

    '&:hover': {
      color: 'var(--text-primary)',
      background: 'var(--surface-overlay)',
    },
  },
});

const TimeRangeContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '4px',
  background: 'var(--surface-overlay)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--surface-subtle)',
});

const TimeRangeButton = styled(Button)<{ selected?: boolean }>(({ selected }) => ({
  background: selected ? 'var(--surface-elevated)' : 'transparent',
  color: selected ? 'var(--text-primary)' : 'var(--text-tertiary)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  padding: '6px 12px',
  fontFamily: 'var(--font-mono)',
  fontWeight: 500,
  fontSize: '12px',
  textTransform: 'none',
  minWidth: 'auto',
  transition: 'all 150ms',
  boxShadow: selected ? 'var(--shadow-sm)' : 'none',

  '&:hover': {
    background: selected ? 'var(--surface-elevated)' : 'var(--surface-subtle)',
    color: 'var(--text-primary)',
  },
}));

const LoadingContainer = styled(Paper)({
  padding: '48px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px',
  background: 'var(--surface-elevated)',
  border: '1px solid var(--surface-subtle)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'none',
});

const EmptyStateContainer = styled(Box)({
  background: 'var(--surface-elevated)',
  border: '1px solid var(--surface-subtle)',
  borderRadius: 'var(--radius-lg)',
  padding: '48px',
  textAlign: 'center',
});

const EmptyStateIcon = styled(Box)({
  width: '80px',
  height: '80px',
  borderRadius: 'var(--radius-xl)',
  background: 'var(--surface-overlay)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 24px',
  color: 'var(--text-tertiary)',
});

const SectionDivider = styled(Box)({
  height: '1px',
  background: 'var(--surface-subtle)',
  marginBottom: '32px',
});

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

  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
  };

  // Loading state
  if (loading) {
    return (
      <PageContainer>
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <LoadingContainer>
            <CircularProgress sx={{ color: 'var(--accent-primary)' }} />
            <Typography
              sx={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                color: 'var(--text-secondary)',
              }}
            >
              Loading Analytics Data...
            </Typography>
          </LoadingContainer>
        </Container>
      </PageContainer>
    );
  }

  // Error state
  if (error) {
    return (
      <PageContainer>
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={refreshAnalytics}>
                Retry
              </Button>
            }
            sx={{
              background: 'var(--status-error-muted)',
              color: 'var(--status-error)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 'var(--radius-lg)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {error}
          </Alert>
        </Container>
      </PageContainer>
    );
  }

  // No data state
  if (!platformMetrics) {
    return (
      <PageContainer>
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <EmptyStateContainer>
            <EmptyStateIcon>
              <BarChart3 size={32} />
            </EmptyStateIcon>
            <Typography
              sx={{
                fontFamily: 'var(--font-display)',
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                mb: 1,
              }}
            >
              No Analytics Data Available
            </Typography>
            <Typography
              sx={{
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                color: 'var(--text-secondary)',
              }}
            >
              Analytics data is not available at this time. Please try again later.
            </Typography>
          </EmptyStateContainer>
        </Container>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Container maxWidth="lg">
        {/* Header */}
        <PageHeader>
          <HeaderContent>
            <HeaderLeft>
              <PageTitle>Platform Analytics</PageTitle>
              <PageSubtitle>
                Comprehensive metrics and insights for the Quantera platform
              </PageSubtitle>
            </HeaderLeft>

            <RefreshButton onClick={refreshAnalytics} disabled={loading}>
              <RefreshCw size={16} />
              Refresh
            </RefreshButton>
          </HeaderContent>
        </PageHeader>

        {/* Controls: Tabs and Time Range */}
        <ControlsContainer>
          <StyledTabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            {TABS.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                label={tab.label}
                icon={<tab.icon size={18} />}
                iconPosition="start"
              />
            ))}
          </StyledTabs>

          <TimeRangeContainer>
            {TIME_RANGES.map((range) => (
              <TimeRangeButton
                key={range.value}
                selected={timeframe === range.value}
                onClick={() => handleTimeframeChange(range.value)}
              >
                {range.label}
              </TimeRangeButton>
            ))}
          </TimeRangeContainer>
        </ControlsContainer>

        <SectionDivider />

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
    </PageContainer>
  );
};

export default AnalyticsDashboardPage;
