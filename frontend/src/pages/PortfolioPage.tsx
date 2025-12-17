import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  Paper,
  CircularProgress,
  Tab,
  Tabs,
  LinearProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Wallet,
  TrendingUp,
  PieChart,
  Leaf,
  RefreshCw,
  LayoutDashboard,
  LineChart,
  ShieldAlert,
  Coins,
  Briefcase,
  ArrowUpRight,
  Droplets,
  TreeDeciduous,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePortfolio } from '../contexts/PortfolioContext';
import {
  PerformanceChart,
  AssetAllocation,
  TransactionHistory,
  YieldDistributionCard,
  AssetList,
  PortfolioAnalytics,
  RiskAnalysis,
  YieldMetrics,
  TradeFinancePortfolioSection,
  TradeFinanceAnalytics
} from '../components/portfolio';
import CompatGrid from '../components/common/CompatGrid';

const Grid = CompatGrid;

// Swiss Precision Styled Components
const PageContainer = styled(Box)({
  minHeight: '100vh',
  background: 'var(--surface-base)',
  paddingBottom: '80px',
});

const PageHeader = styled(Box)({
  padding: '32px 0 24px',
  borderBottom: '1px solid var(--surface-subtle)',
  marginBottom: '32px',
});

const HeaderContent = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '16px',
  flexWrap: 'wrap',
});

const PageTitle = styled(Typography)({
  fontFamily: 'var(--font-display)',
  fontSize: '28px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  letterSpacing: '-0.01em',
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

const StyledTabs = styled(Tabs)({
  borderBottom: '1px solid var(--surface-subtle)',
  marginBottom: '32px',

  '& .MuiTabs-indicator': {
    backgroundColor: 'var(--accent-primary)',
    height: '2px',
  },

  '& .MuiTab-root': {
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    fontSize: '14px',
    color: 'var(--text-secondary)',
    textTransform: 'none',
    minHeight: '48px',
    padding: '12px 20px',
    gap: '8px',
    transition: 'color 150ms',

    '&.Mui-selected': {
      color: 'var(--text-primary)',
    },

    '&:hover': {
      color: 'var(--text-primary)',
    },

    '& .MuiTab-iconWrapper': {
      marginRight: '8px',
    },
  },
});

const StatCard = styled(Card)({
  background: 'var(--surface-elevated)',
  border: '1px solid var(--surface-subtle)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'none',
  height: '100%',
  transition: 'border-color 150ms',

  '&:hover': {
    borderColor: 'var(--surface-hover)',
  },
});

const StatCardContent = styled(CardContent)({
  padding: '24px !important',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '16px',
});

const StatIconWrapper = styled(Box)<{ variant?: 'primary' | 'success' | 'info' | 'environmental' }>(
  ({ variant = 'primary' }) => ({
    width: '48px',
    height: '48px',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

    ...(variant === 'primary' && {
      background: 'var(--accent-muted)',
      color: 'var(--accent-primary)',
    }),
    ...(variant === 'success' && {
      background: 'var(--status-success-muted)',
      color: 'var(--status-success)',
    }),
    ...(variant === 'info' && {
      background: 'var(--status-info-muted)',
      color: 'var(--status-info)',
    }),
    ...(variant === 'environmental' && {
      background: 'var(--accent-muted)',
      color: 'var(--accent-primary)',
    }),
  })
);

const StatValue = styled(Typography)({
  fontFamily: 'var(--font-mono)',
  fontSize: '24px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  letterSpacing: '-0.02em',
});

const StatLabel = styled(Typography)({
  fontFamily: 'var(--font-body)',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--text-tertiary)',
});

const SectionCard = styled(Card)({
  background: 'var(--surface-elevated)',
  border: '1px solid var(--surface-subtle)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'none',
  overflow: 'hidden',
});

const SectionTitle = styled(Typography)({
  fontFamily: 'var(--font-display)',
  fontSize: '16px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  marginBottom: '16px',
});

const EmptyStateCard = styled(Card)({
  background: 'var(--surface-elevated)',
  border: '1px solid var(--surface-subtle)',
  borderRadius: 'var(--radius-xl)',
  boxShadow: 'none',
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

const primaryButtonStyles = {
  background: 'var(--accent-primary)',
  color: '#000',
  borderRadius: 'var(--radius-md)',
  padding: '12px 24px',
  fontFamily: 'var(--font-body)',
  fontWeight: 500,
  fontSize: '14px',
  textTransform: 'none',
  transition: 'background 150ms',
  '&:hover': {
    background: 'var(--accent-hover)',
  },
};

const secondaryButtonStyles = {
  background: 'transparent',
  color: 'var(--text-primary)',
  border: '1px solid var(--surface-subtle)',
  borderRadius: 'var(--radius-md)',
  padding: '12px 24px',
  fontFamily: 'var(--font-body)',
  fontWeight: 500,
  fontSize: '14px',
  textTransform: 'none',
  transition: 'all 150ms',
  '&:hover': {
    background: 'var(--surface-overlay)',
    borderColor: 'var(--surface-hover)',
  },
};

const StrategyCard = styled(Box)<{ variant?: 'success' | 'info' | 'warning' }>(
  ({ variant = 'success' }) => ({
    padding: '20px',
    borderRadius: 'var(--radius-lg)',
    marginBottom: '16px',
    border: '1px solid var(--surface-subtle)',
    transition: 'border-color 150ms',

    ...(variant === 'success' && {
      background: 'var(--status-success-muted)',
      borderColor: 'rgba(34, 197, 94, 0.2)',
    }),
    ...(variant === 'info' && {
      background: 'var(--status-info-muted)',
      borderColor: 'rgba(59, 130, 246, 0.2)',
    }),
    ...(variant === 'warning' && {
      background: 'var(--status-warning-muted)',
      borderColor: 'rgba(245, 158, 11, 0.2)',
    }),

    '&:hover': {
      ...(variant === 'success' && {
        borderColor: 'rgba(34, 197, 94, 0.4)',
      }),
      ...(variant === 'info' && {
        borderColor: 'rgba(59, 130, 246, 0.4)',
      }),
      ...(variant === 'warning' && {
        borderColor: 'rgba(245, 158, 11, 0.4)',
      }),
    },

    '&:last-child': {
      marginBottom: 0,
    },
  })
);

const ImpactCard = styled(Box)<{ variant?: 'carbon' | 'land' | 'water' }>(
  ({ variant = 'carbon' }) => ({
    textAlign: 'center',
    padding: '24px',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--surface-subtle)',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',

    ...(variant === 'carbon' && {
      background: 'var(--accent-muted)',
    }),
    ...(variant === 'land' && {
      background: 'var(--status-success-muted)',
    }),
    ...(variant === 'water' && {
      background: 'var(--status-info-muted)',
    }),
  })
);

const SDGCard = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '16px',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--surface-overlay)',
  border: '1px solid var(--surface-subtle)',
});

const ProjectCard = styled(Box)({
  padding: '20px',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--surface-overlay)',
  border: '1px solid var(--surface-subtle)',
  height: '100%',
});

const PortfolioPage: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const currentUser = (auth as any).currentUser;

  const {
    portfolio,
    transactions,
    yieldDistributions,
    performance,
    impactMetrics,
    loading,
    error,
    activeFilter,
    setActiveFilter,
    refreshPortfolio
  } = usePortfolio();

  const [dashboardView, setDashboardView] = useState<string>('overview');

  const handleDashboardChange = (event: React.SyntheticEvent, newValue: string) => {
    setDashboardView(newValue);
  };

  // Not authenticated state
  if (!currentUser) {
    return (
      <PageContainer>
        <Container maxWidth="md" sx={{ py: 8 }}>
          <EmptyStateCard>
            <EmptyStateIcon>
              <Wallet size={32} />
            </EmptyStateIcon>
            <Typography
              sx={{
                fontFamily: 'var(--font-display)',
                fontSize: '24px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                mb: 2,
              }}
            >
              Connect Your Wallet
            </Typography>
            <Typography
              sx={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                color: 'var(--text-secondary)',
                mb: 4,
                maxWidth: '400px',
                mx: 'auto',
              }}
            >
              Please connect your Ethereum wallet to view your treasury token portfolio.
            </Typography>
            <Button onClick={() => {}} sx={primaryButtonStyles}>
              Connect Wallet
            </Button>
          </EmptyStateCard>
        </Container>
      </PageContainer>
    );
  }

  // Loading state
  if (loading) {
    return (
      <PageContainer>
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Paper
            sx={{
              p: 6,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              background: 'var(--surface-elevated)',
              border: '1px solid var(--surface-subtle)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <CircularProgress sx={{ color: 'var(--accent-primary)' }} />
            <Typography
              sx={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                color: 'var(--text-secondary)',
              }}
            >
              Loading Portfolio Data...
            </Typography>
          </Paper>
        </Container>
      </PageContainer>
    );
  }

  // Error state
  if (error) {
    return (
      <PageContainer>
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={refreshPortfolio}>
                Retry
              </Button>
            }
            sx={{
              background: 'var(--status-error-muted)',
              color: 'var(--status-error)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            {error}
          </Alert>
        </Container>
      </PageContainer>
    );
  }

  // Empty portfolio state
  if (!portfolio) {
    return (
      <PageContainer>
        <Container maxWidth="md" sx={{ py: 8 }}>
          <EmptyStateCard>
            <EmptyStateIcon>
              <Briefcase size={32} />
            </EmptyStateIcon>
            <Typography
              sx={{
                fontFamily: 'var(--font-display)',
                fontSize: '24px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                mb: 2,
              }}
            >
              No Assets Yet
            </Typography>
            <Typography
              sx={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                color: 'var(--text-secondary)',
                mb: 4,
                maxWidth: '400px',
                mx: 'auto',
              }}
            >
              You don't have any assets in your portfolio yet. Explore the marketplace to get started.
            </Typography>
            <Button component={Link} to="/marketplace" sx={primaryButtonStyles}>
              Explore Marketplace
            </Button>
          </EmptyStateCard>
        </Container>
      </PageContainer>
    );
  }

  const calculateAssetValuesByCategory = () => {
    const valuesByCategory: {[key: string]: number} = {};
    portfolio.holdings.forEach(asset => {
      valuesByCategory[asset.category] = (valuesByCategory[asset.category] || 0) + asset.value;
    });
    return valuesByCategory;
  };

  const assetValuesByCategory = calculateAssetValuesByCategory();

  return (
    <PageContainer>
      <Container maxWidth="lg">
        <PageHeader>
          <HeaderContent>
            <PageTitle>My Portfolio</PageTitle>
            <RefreshButton onClick={refreshPortfolio} disabled={loading}>
              <RefreshCw size={16} />
              Refresh
            </RefreshButton>
          </HeaderContent>
        </PageHeader>

        {/* Dashboard Tabs */}
        <StyledTabs
          value={dashboardView}
          onChange={handleDashboardChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            icon={<LayoutDashboard size={18} />}
            iconPosition="start"
            label="Overview"
            value="overview"
          />
          <Tab
            icon={<LineChart size={18} />}
            iconPosition="start"
            label="Analytics"
            value="analytics"
          />
          <Tab
            icon={<ShieldAlert size={18} />}
            iconPosition="start"
            label="Risk Analysis"
            value="risk"
          />
          <Tab
            icon={<Coins size={18} />}
            iconPosition="start"
            label="Yield"
            value="yield"
          />
          <Tab
            icon={<Briefcase size={18} />}
            iconPosition="start"
            label="Trade Finance"
            value="tradefinance"
          />
          {impactMetrics && portfolio.holdings.some(asset => asset.category === 'environmental') && (
            <Tab
              icon={<Leaf size={18} />}
              iconPosition="start"
              label="Environmental Impact"
              value="environmental"
            />
          )}
        </StyledTabs>

        {/* Portfolio Summary Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <StatCardContent>
                <StatIconWrapper variant="primary">
                  <Wallet size={24} />
                </StatIconWrapper>
                <Box>
                  <StatValue>
                    ${portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </StatValue>
                  <StatLabel>Total Portfolio Value</StatLabel>
                </Box>
              </StatCardContent>
            </StatCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <StatCardContent>
                <StatIconWrapper variant="success">
                  <TrendingUp size={24} />
                </StatIconWrapper>
                <Box>
                  <StatValue>
                    ${portfolio.totalYield.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </StatValue>
                  <StatLabel>Total Yield Earned</StatLabel>
                </Box>
              </StatCardContent>
            </StatCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <StatCardContent>
                <StatIconWrapper variant="info">
                  <PieChart size={24} />
                </StatIconWrapper>
                <Box>
                  <StatValue>{portfolio.yieldRate.toFixed(2)}%</StatValue>
                  <StatLabel>Average Yield Rate</StatLabel>
                </Box>
              </StatCardContent>
            </StatCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <StatCardContent>
                <StatIconWrapper variant="environmental">
                  <Leaf size={24} />
                </StatIconWrapper>
                <Box>
                  <StatValue>{portfolio.carbonOffset?.toFixed(1) || 0} tons</StatValue>
                  <StatLabel>Carbon Offset</StatLabel>
                </Box>
              </StatCardContent>
            </StatCard>
          </Grid>
        </Grid>

        {/* Overview Dashboard View */}
        {dashboardView === 'overview' && (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={8}>
                <PerformanceChart
                  performanceHistory={portfolio.performanceHistory}
                  title="Portfolio Performance"
                  height={300}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <AssetAllocation
                  assetAllocation={portfolio.assetAllocation}
                  title="Asset Allocation"
                  height={300}
                />
              </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12}>
                <AssetList
                  assets={portfolio.holdings}
                  title="Your Assets"
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                />
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <YieldDistributionCard
                  yieldDistributions={yieldDistributions}
                  title="Upcoming Yield Distributions"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TradeFinancePortfolioSection maxItems={3} height={400} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TransactionHistory
                  transactions={transactions}
                  title="Recent Transactions"
                />
              </Grid>
            </Grid>
          </>
        )}

        {/* Analytics Dashboard View */}
        {dashboardView === 'analytics' && performance && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <PortfolioAnalytics
                performance={performance}
                assetAllocation={portfolio.assetAllocation}
                assetValuesByCategory={assetValuesByCategory}
              />
            </Grid>
            <Grid item xs={12}>
              <PerformanceChart
                performanceHistory={portfolio.performanceHistory}
                title="Detailed Portfolio Performance"
                height={400}
              />
            </Grid>
            <Grid item xs={12}>
              <TransactionHistory
                transactions={transactions}
                title="Complete Transaction History"
              />
            </Grid>
          </Grid>
        )}

        {/* Risk Analysis Dashboard View */}
        {dashboardView === 'risk' && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <RiskAnalysis holdings={portfolio.holdings} />
            </Grid>
            <Grid item xs={12} md={6}>
              <AssetAllocation
                assetAllocation={portfolio.assetAllocation}
                title="Portfolio Diversification"
                height={300}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <SectionCard>
                <CardContent sx={{ p: 3 }}>
                  <SectionTitle>Risk Mitigation Strategies</SectionTitle>
                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                    {[
                      { title: 'Diversify further', desc: 'across additional asset classes to reduce concentration risk.' },
                      { title: 'Balance maturity dates', desc: 'to manage reinvestment risk and liquidity needs.' },
                      { title: 'Consider environmental assets', desc: 'to hedge against climate transition risks.' },
                      { title: 'Evaluate yield strategies', desc: 'to optimize return relative to risk.' },
                      { title: 'Monitor market trends', desc: 'and rebalance positions accordingly.' },
                    ].map((item, index) => (
                      <Box component="li" key={index} sx={{ mb: 1.5 }}>
                        <Typography
                          sx={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '14px',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <strong style={{ color: 'var(--text-primary)' }}>{item.title}</strong> {item.desc}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Button component={Link} to="/marketplace" sx={secondaryButtonStyles}>
                      Explore Diversification Options
                    </Button>
                  </Box>
                </CardContent>
              </SectionCard>
            </Grid>
          </Grid>
        )}

        {/* Yield Dashboard View */}
        {dashboardView === 'yield' && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <YieldMetrics
                holdings={portfolio.holdings}
                yieldDistributions={yieldDistributions}
                totalYield={portfolio.totalYield}
                averageYieldRate={portfolio.yieldRate}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <SectionCard>
                <CardContent sx={{ p: 3 }}>
                  <SectionTitle>Yield Optimization Strategies</SectionTitle>

                  <StrategyCard variant="success">
                    <Typography
                      sx={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--status-success)',
                        mb: 1,
                      }}
                    >
                      Auto-Compounding
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        mb: 2,
                      }}
                    >
                      Automatically reinvest yield distributions to accelerate growth through compound interest.
                    </Typography>
                    <Button
                      component={Link}
                      to="/yield-strategies"
                      size="small"
                      sx={{
                        color: 'var(--status-success)',
                        p: 0,
                        minWidth: 'auto',
                        fontFamily: 'var(--font-body)',
                        fontSize: '13px',
                        textTransform: 'none',
                        '&:hover': { background: 'transparent', textDecoration: 'underline' },
                      }}
                    >
                      Explore Strategy <ArrowUpRight size={14} style={{ marginLeft: 4 }} />
                    </Button>
                  </StrategyCard>

                  <StrategyCard variant="info">
                    <Typography
                      sx={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--status-info)',
                        mb: 1,
                      }}
                    >
                      Yield Laddering
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        mb: 2,
                      }}
                    >
                      Distribute investments across different maturities to balance yield and liquidity.
                    </Typography>
                    <Button
                      component={Link}
                      to="/yield-strategies"
                      size="small"
                      sx={{
                        color: 'var(--status-info)',
                        p: 0,
                        minWidth: 'auto',
                        fontFamily: 'var(--font-body)',
                        fontSize: '13px',
                        textTransform: 'none',
                        '&:hover': { background: 'transparent', textDecoration: 'underline' },
                      }}
                    >
                      Explore Strategy <ArrowUpRight size={14} style={{ marginLeft: 4 }} />
                    </Button>
                  </StrategyCard>

                  <StrategyCard variant="warning">
                    <Typography
                      sx={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--status-warning)',
                        mb: 1,
                      }}
                    >
                      Yield Aggregation
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        mb: 2,
                      }}
                    >
                      Dynamically allocate assets to highest yielding options while managing risk exposure.
                    </Typography>
                    <Button
                      component={Link}
                      to="/yield-strategies"
                      size="small"
                      sx={{
                        color: 'var(--status-warning)',
                        p: 0,
                        minWidth: 'auto',
                        fontFamily: 'var(--font-body)',
                        fontSize: '13px',
                        textTransform: 'none',
                        '&:hover': { background: 'transparent', textDecoration: 'underline' },
                      }}
                    >
                      Explore Strategy <ArrowUpRight size={14} style={{ marginLeft: 4 }} />
                    </Button>
                  </StrategyCard>
                </CardContent>
              </SectionCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <YieldDistributionCard
                yieldDistributions={yieldDistributions}
                title="Detailed Yield Schedule"
              />
            </Grid>
          </Grid>
        )}

        {/* Trade Finance Dashboard View */}
        {dashboardView === 'tradefinance' && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <SectionCard>
                <CardContent sx={{ p: 3 }}>
                  <SectionTitle>Trade Finance Portfolio</SectionTitle>
                  <Typography
                    sx={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Your trade finance investments provide exposure to short-term, high-yield assets backed by real-world trade activities.
                  </Typography>
                </CardContent>
              </SectionCard>
            </Grid>

            <Grid item xs={12}>
              <TradeFinanceAnalytics height={400} />
            </Grid>

            <Grid item xs={12}>
              <TradeFinancePortfolioSection height={500} maxItems={10} />
            </Grid>

            <Grid item xs={12} md={6}>
              <SectionCard sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <SectionTitle>Benefits of Trade Finance</SectionTitle>
                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                    {[
                      { title: 'Low Correlation', desc: 'to traditional asset classes and market volatility' },
                      { title: 'Short Duration', desc: 'with typical maturities of 30-180 days' },
                      { title: 'Asset-Backed', desc: 'by real-world trade flows and goods' },
                      { title: 'Attractive Yields', desc: 'compared to other fixed-income investments' },
                      { title: 'Portfolio Diversification', desc: 'across industries and geographies' },
                    ].map((item, index) => (
                      <Box component="li" key={index} sx={{ mb: 1.5 }}>
                        <Typography
                          sx={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '14px',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <strong style={{ color: 'var(--text-primary)' }}>{item.title}</strong> {item.desc}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Button component={Link} to="/trade-finance" sx={secondaryButtonStyles}>
                      Explore Trade Finance Assets
                    </Button>
                  </Box>
                </CardContent>
              </SectionCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <SectionCard sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <SectionTitle>Risk Considerations</SectionTitle>
                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                    {[
                      { title: 'Counterparty Risk:', desc: 'Carefully evaluate the creditworthiness of trade parties' },
                      { title: 'Country Risk:', desc: 'Consider political and economic stability of countries involved' },
                      { title: 'Documentation Risk:', desc: 'Ensure proper verification of trade documents' },
                      { title: 'Liquidity Risk:', desc: 'Secondary market may have limited liquidity' },
                      { title: 'Fraud Risk:', desc: 'Rely on our KYC and verification processes' },
                    ].map((item, index) => (
                      <Box component="li" key={index} sx={{ mb: 1.5 }}>
                        <Typography
                          sx={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '14px',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <strong style={{ color: 'var(--text-primary)' }}>{item.title}</strong> {item.desc}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Button component={Link} to="/trade-finance/portfolio" sx={secondaryButtonStyles}>
                      View Detailed Analytics
                    </Button>
                  </Box>
                </CardContent>
              </SectionCard>
            </Grid>
          </Grid>
        )}

        {/* Environmental Impact Dashboard View */}
        {dashboardView === 'environmental' && impactMetrics && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <SectionCard>
                <CardContent sx={{ p: 3 }}>
                  <SectionTitle>Environmental Impact Dashboard</SectionTitle>

                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={4}>
                      <ImpactCard variant="carbon">
                        <Leaf size={40} style={{ color: 'var(--accent-primary)' }} />
                        <Typography
                          sx={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '32px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {impactMetrics.totalCarbonOffset.toFixed(1)} tons
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          Carbon Offset (CO₂e)
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Typography
                            sx={{
                              fontFamily: 'var(--font-body)',
                              fontSize: '12px',
                              color: 'var(--text-tertiary)',
                            }}
                          >
                            Equivalent to:
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '14px',
                              fontWeight: 500,
                              color: 'var(--accent-primary)',
                            }}
                          >
                            {(impactMetrics.totalCarbonOffset * 2.3).toFixed(0)} trees planted
                          </Typography>
                        </Box>
                      </ImpactCard>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <ImpactCard variant="land">
                        <TreeDeciduous size={40} style={{ color: 'var(--status-success)' }} />
                        <Typography
                          sx={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '32px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {impactMetrics.totalLandProtected.toFixed(1)} ha
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          Land Area Protected
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Typography
                            sx={{
                              fontFamily: 'var(--font-body)',
                              fontSize: '12px',
                              color: 'var(--text-tertiary)',
                            }}
                          >
                            Equivalent to:
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '14px',
                              fontWeight: 500,
                              color: 'var(--status-success)',
                            }}
                          >
                            {(impactMetrics.totalLandProtected * 1.4).toFixed(1)} football fields
                          </Typography>
                        </Box>
                      </ImpactCard>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <ImpactCard variant="water">
                        <Droplets size={40} style={{ color: 'var(--status-info)' }} />
                        <Typography
                          sx={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '32px',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {(impactMetrics.totalWaterSaved / 1000).toFixed(0)} kL
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          Water Protected
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Typography
                            sx={{
                              fontFamily: 'var(--font-body)',
                              fontSize: '12px',
                              color: 'var(--text-tertiary)',
                            }}
                          >
                            Equivalent to:
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '14px',
                              fontWeight: 500,
                              color: 'var(--status-info)',
                            }}
                          >
                            {((impactMetrics.totalWaterSaved / 1000) / 2.5).toFixed(0)} households' yearly use
                          </Typography>
                        </Box>
                      </ImpactCard>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 4 }}>
                    <SectionTitle>Sustainable Development Goals Impact</SectionTitle>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      {Object.entries(impactMetrics.sdgContributions).map(([sdgNumber, score]) => (
                        <Grid item xs={6} sm={4} md={3} key={sdgNumber}>
                          <SDGCard>
                            <Box
                              component="img"
                              src={`/images/sdg/sdg-${sdgNumber}.png`}
                              alt={`SDG ${sdgNumber}`}
                              sx={{
                                width: 60,
                                height: 60,
                                mb: 1,
                                borderRadius: '50%',
                                objectFit: 'cover',
                              }}
                            />
                            <Typography
                              sx={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: 'var(--text-primary)',
                              }}
                            >
                              SDG {sdgNumber}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={score as number}
                              sx={{
                                width: '100%',
                                mt: 1,
                                height: 4,
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: 'var(--surface-subtle)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: 'var(--accent-primary)',
                                  borderRadius: 'var(--radius-full)',
                                },
                              }}
                            />
                            <Typography
                              sx={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '12px',
                                color: 'var(--text-tertiary)',
                                mt: 0.5,
                              }}
                            >
                              {score}/100
                            </Typography>
                          </SDGCard>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>

                  <Box sx={{ mt: 4 }}>
                    <SectionTitle>Impact by Project</SectionTitle>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      {impactMetrics.impactByProject.map((project) => (
                        <Grid item xs={12} md={6} key={project.projectId}>
                          <ProjectCard>
                            <Typography
                              sx={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '15px',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                mb: 2,
                              }}
                            >
                              {project.projectName}
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={4}>
                                <Typography
                                  sx={{
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '11px',
                                    color: 'var(--text-tertiary)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    mb: 0.5,
                                  }}
                                >
                                  Carbon Offset
                                </Typography>
                                <Typography
                                  sx={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: 'var(--status-success)',
                                  }}
                                >
                                  {project.carbonOffset.toFixed(1)} tons
                                </Typography>
                              </Grid>
                              {project.landProtected && (
                                <Grid item xs={4}>
                                  <Typography
                                    sx={{
                                      fontFamily: 'var(--font-body)',
                                      fontSize: '11px',
                                      color: 'var(--text-tertiary)',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.05em',
                                      mb: 0.5,
                                    }}
                                  >
                                    Land Protected
                                  </Typography>
                                  <Typography
                                    sx={{
                                      fontFamily: 'var(--font-mono)',
                                      fontSize: '14px',
                                      fontWeight: 500,
                                      color: 'var(--status-success)',
                                    }}
                                  >
                                    {project.landProtected.toFixed(1)} ha
                                  </Typography>
                                </Grid>
                              )}
                              {project.waterSaved && (
                                <Grid item xs={4}>
                                  <Typography
                                    sx={{
                                      fontFamily: 'var(--font-body)',
                                      fontSize: '11px',
                                      color: 'var(--text-tertiary)',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.05em',
                                      mb: 0.5,
                                    }}
                                  >
                                    Water Saved
                                  </Typography>
                                  <Typography
                                    sx={{
                                      fontFamily: 'var(--font-mono)',
                                      fontSize: '14px',
                                      fontWeight: 500,
                                      color: 'var(--status-info)',
                                    }}
                                  >
                                    {(project.waterSaved / 1000).toFixed(0)} kL
                                  </Typography>
                                </Grid>
                              )}
                            </Grid>
                          </ProjectCard>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>

                  <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Button component={Link} to="/environmental/marketplace" sx={primaryButtonStyles}>
                      Explore Environmental Assets
                    </Button>
                  </Box>
                </CardContent>
              </SectionCard>
            </Grid>
          </Grid>
        )}
      </Container>
    </PageContainer>
  );
};

export default PortfolioPage;
