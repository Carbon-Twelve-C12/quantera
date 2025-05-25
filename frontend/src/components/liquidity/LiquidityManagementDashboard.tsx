import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  TrendingUp,
  TrendingDown,
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Target,
  Shield,
  DollarSign,
  Clock,
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';

// Styled components with professional WEF-inspired design
const DashboardContainer = styled(Container)(({ theme }) => ({
  padding: '32px 24px',
  background: 'linear-gradient(135deg, rgba(26, 35, 126, 0.02) 0%, rgba(63, 81, 181, 0.02) 100%)',
  minHeight: '100vh',
}));

const MetricCard = styled(Card)(({ theme }) => ({
  background: '#ffffff',
  borderRadius: '16px',
  boxShadow: '0 4px 24px rgba(26, 35, 126, 0.08)',
  border: '1px solid rgba(26, 35, 126, 0.06)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  
  '&:hover': {
    boxShadow: '0 8px 40px rgba(26, 35, 126, 0.12)',
    transform: 'translateY(-2px)',
  },
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)',
  },
}));

const ChartCard = styled(Card)(({ theme }) => ({
  background: '#ffffff',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 2px 16px rgba(26, 35, 126, 0.06)',
  border: '1px solid rgba(26, 35, 126, 0.06)',
  height: '400px',
}));

const StatusChip = styled(Chip)<{ status: string }>(({ status }) => ({
  fontWeight: 600,
  fontSize: '12px',
  ...(status === 'optimal' && {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
  }),
  ...(status === 'warning' && {
    backgroundColor: '#fff3e0',
    color: '#f57c00',
  }),
  ...(status === 'critical' && {
    backgroundColor: '#ffebee',
    color: '#d32f2f',
  }),
  ...(status === 'stable' && {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
  }),
}));

const ActionButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)',
  color: '#ffffff',
  borderRadius: '8px',
  padding: '8px 16px',
  fontWeight: 600,
  textTransform: 'none',
  
  '&:hover': {
    background: 'linear-gradient(135deg, #0d47a1 0%, #303f9f 100%)',
    transform: 'translateY(-1px)',
  },
}));

// Types
interface LiquidityPool {
  poolId: string;
  tokenA: string;
  tokenB: string;
  feeTier: number;
  totalLiquidity: number;
  currentPrice: number;
  price24hChange: number;
  volume24h: number;
  fees24h: number;
  apyEstimate: number;
  marketCondition: 'optimal' | 'stable' | 'volatile' | 'illiquid' | 'stressed';
}

interface OptimizedPosition {
  positionId: string;
  poolId: string;
  strategy: 'conservative' | 'balanced' | 'aggressive' | 'custom';
  currentYield: number;
  targetYield: number;
  capitalEfficiency: number;
  impermanentLoss: number;
  totalFeesEarned: number;
  performanceScore: number;
  lastRebalance: string;
  nextRebalanceDue: string;
  needsAttention: boolean;
}

interface YieldOpportunity {
  poolId: string;
  estimatedApy: number;
  riskScore: number;
  confidenceLevel: number;
  liquidityRequired: number;
  timeHorizon: string;
  marketCondition: string;
}

interface MarketAnalytics {
  poolId: string;
  volatility30d: number;
  volume24h: number;
  averageSpread: number;
  liquidityDepth: number;
  priceImpact1k: number;
  priceImpact10k: number;
  priceImpact100k: number;
  tradeCount24h: number;
  uniqueTraders24h: number;
  marketCondition: string;
}

interface PortfolioAnalytics {
  totalValueLocked: number;
  totalYieldEarned: number;
  averageApy: number;
  totalImpermanentLoss: number;
  capitalEfficiencyScore: number;
  riskScore: number;
  diversificationScore: number;
  activePositions: number;
  pendingRebalances: number;
}

interface LiquidityRecommendation {
  recommendationType: string;
  priority: 'High' | 'Medium' | 'Low';
  action: string;
  reason: string;
  expectedImprovement: number;
  riskLevel: string;
  timeSensitive: boolean;
}

const LiquidityManagementDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [selectedStrategy, setSelectedStrategy] = useState('all');
  
  // Mock data - in production would come from API
  const [portfolioAnalytics, setPortfolioAnalytics] = useState<PortfolioAnalytics>({
    totalValueLocked: 2450000,
    totalYieldEarned: 125000,
    averageApy: 8.7,
    totalImpermanentLoss: -2.3,
    capitalEfficiencyScore: 78.5,
    riskScore: 42.0,
    diversificationScore: 85.0,
    activePositions: 12,
    pendingRebalances: 3,
  });

  const [liquidityPools] = useState<LiquidityPool[]>([
    {
      poolId: 'pool_1',
      tokenA: 'USDC',
      tokenB: 'ETH',
      feeTier: 30,
      totalLiquidity: 15000000,
      currentPrice: 2450.50,
      price24hChange: 2.3,
      volume24h: 2500000,
      fees24h: 7500,
      apyEstimate: 12.5,
      marketCondition: 'optimal',
    },
    {
      poolId: 'pool_2',
      tokenA: 'USDT',
      tokenB: 'BTC',
      feeTier: 30,
      totalLiquidity: 8500000,
      currentPrice: 43250.75,
      price24hChange: -1.2,
      volume24h: 1800000,
      fees24h: 5400,
      apyEstimate: 9.8,
      marketCondition: 'stable',
    },
    {
      poolId: 'pool_3',
      tokenA: 'DAI',
      tokenB: 'WETH',
      feeTier: 50,
      totalLiquidity: 3200000,
      currentPrice: 2448.90,
      price24hChange: 4.7,
      volume24h: 950000,
      fees24h: 4750,
      apyEstimate: 15.2,
      marketCondition: 'volatile',
    },
  ]);

  const [optimizedPositions] = useState<OptimizedPosition[]>([
    {
      positionId: 'pos_1',
      poolId: 'pool_1',
      strategy: 'balanced',
      currentYield: 11.8,
      targetYield: 12.5,
      capitalEfficiency: 82.3,
      impermanentLoss: -1.2,
      totalFeesEarned: 45000,
      performanceScore: 87.5,
      lastRebalance: '2024-01-15',
      nextRebalanceDue: '2024-01-22',
      needsAttention: false,
    },
    {
      positionId: 'pos_2',
      poolId: 'pool_2',
      strategy: 'conservative',
      currentYield: 8.9,
      targetYield: 9.8,
      capitalEfficiency: 75.1,
      impermanentLoss: -0.8,
      totalFeesEarned: 32000,
      performanceScore: 78.2,
      lastRebalance: '2024-01-10',
      nextRebalanceDue: '2024-01-20',
      needsAttention: true,
    },
    {
      positionId: 'pos_3',
      poolId: 'pool_3',
      strategy: 'aggressive',
      currentYield: 14.2,
      targetYield: 15.2,
      capitalEfficiency: 88.7,
      impermanentLoss: -3.1,
      totalFeesEarned: 48000,
      performanceScore: 92.1,
      lastRebalance: '2024-01-18',
      nextRebalanceDue: '2024-01-25',
      needsAttention: false,
    },
  ]);

  const [yieldOpportunities] = useState<YieldOpportunity[]>([
    {
      poolId: 'pool_new_1',
      estimatedApy: 18.5,
      riskScore: 65.0,
      confidenceLevel: 82.0,
      liquidityRequired: 100000,
      timeHorizon: '24h',
      marketCondition: 'volatile',
    },
    {
      poolId: 'pool_new_2',
      estimatedApy: 13.2,
      riskScore: 35.0,
      confidenceLevel: 91.0,
      liquidityRequired: 250000,
      timeHorizon: '7d',
      marketCondition: 'stable',
    },
  ]);

  const [recommendations] = useState<LiquidityRecommendation[]>([
    {
      recommendationType: 'Rebalancing',
      priority: 'High',
      action: 'Rebalance',
      reason: 'Position has drifted outside optimal range',
      expectedImprovement: 2.5,
      riskLevel: 'Low',
      timeSensitive: true,
    },
    {
      recommendationType: 'Yield Optimization',
      priority: 'Medium',
      action: 'Optimize',
      reason: 'Better yield opportunity available in similar risk profile',
      expectedImprovement: 1.8,
      riskLevel: 'Medium',
      timeSensitive: false,
    },
    {
      recommendationType: 'Risk Management',
      priority: 'High',
      action: 'Reduce',
      reason: 'High volatility detected in aggressive positions',
      expectedImprovement: 0.0,
      riskLevel: 'High',
      timeSensitive: true,
    },
  ]);

  // Mock chart data
  const yieldChartData = [
    { date: '2024-01-01', yield: 8.2, target: 9.0 },
    { date: '2024-01-02', yield: 8.5, target: 9.0 },
    { date: '2024-01-03', yield: 8.8, target: 9.0 },
    { date: '2024-01-04', yield: 9.1, target: 9.0 },
    { date: '2024-01-05', yield: 8.9, target: 9.0 },
    { date: '2024-01-06', yield: 9.3, target: 9.0 },
    { date: '2024-01-07', yield: 9.6, target: 9.0 },
  ];

  const riskDistributionData = [
    { name: 'Conservative', value: 35, color: '#4caf50' },
    { name: 'Balanced', value: 45, color: '#2196f3' },
    { name: 'Aggressive', value: 20, color: '#ff9800' },
  ];

  const liquidityDistributionData = [
    { pool: 'USDC/ETH', liquidity: 45000, apy: 12.5 },
    { pool: 'USDT/BTC', liquidity: 32000, apy: 9.8 },
    { pool: 'DAI/WETH', liquidity: 48000, apy: 15.2 },
    { pool: 'USDC/USDT', liquidity: 25000, apy: 6.2 },
  ];

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // Refresh data
        console.log('Refreshing liquidity data...');
      }, refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    console.log('Manual refresh triggered');
  };

  const handleOptimizePosition = (positionId: string) => {
    console.log('Optimizing position:', positionId);
  };

  const handleRebalancePosition = (positionId: string) => {
    console.log('Rebalancing position:', positionId);
  };

  const getStatusColor = (condition: string) => {
    switch (condition) {
      case 'optimal': return 'optimal';
      case 'stable': return 'stable';
      case 'volatile': return 'warning';
      case 'illiquid': return 'warning';
      case 'stressed': return 'critical';
      default: return 'stable';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <DashboardContainer maxWidth="xl">
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#263238', mb: 1 }}>
            Advanced Liquidity Management
          </Typography>
          <Typography variant="h6" sx={{ color: '#607d8b' }}>
            Institutional-grade liquidity optimization and analytics
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                color="primary"
              />
            }
            label="Auto Refresh"
          />
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Interval</InputLabel>
            <Select
              value={refreshInterval}
              label="Interval"
              onChange={(e) => setRefreshInterval(e.target.value as number)}
            >
              <MenuItem value={15}>15s</MenuItem>
              <MenuItem value={30}>30s</MenuItem>
              <MenuItem value={60}>1m</MenuItem>
              <MenuItem value={300}>5m</MenuItem>
            </Select>
          </FormControl>
          
          <IconButton onClick={handleRefresh} sx={{ color: '#1a237e' }}>
            <RefreshCw />
          </IconButton>
        </Box>
      </Box>

      {/* Portfolio Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <DollarSign size={24} color="#1a237e" />
                <StatusChip label="Active" status="optimal" size="small" />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#263238', mb: 1 }}>
                {formatCurrency(portfolioAnalytics.totalValueLocked)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#607d8b' }}>
                Total Value Locked
              </Typography>
            </CardContent>
          </MetricCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <TrendingUp size={24} color="#4caf50" />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp size={16} color="#4caf50" />
                  <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 600 }}>
                    +{formatPercentage(portfolioAnalytics.averageApy)}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#263238', mb: 1 }}>
                {formatPercentage(portfolioAnalytics.averageApy)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#607d8b' }}>
                Average APY
              </Typography>
            </CardContent>
          </MetricCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Target size={24} color="#2196f3" />
                <Typography variant="caption" sx={{ color: '#2196f3', fontWeight: 600 }}>
                  {formatPercentage(portfolioAnalytics.capitalEfficiencyScore)}
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#263238', mb: 1 }}>
                {portfolioAnalytics.activePositions}
              </Typography>
              <Typography variant="body2" sx={{ color: '#607d8b' }}>
                Active Positions
              </Typography>
            </CardContent>
          </MetricCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Shield size={24} color="#ff9800" />
                {portfolioAnalytics.pendingRebalances > 0 && (
                  <StatusChip label={`${portfolioAnalytics.pendingRebalances} Pending`} status="warning" size="small" />
                )}
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#263238', mb: 1 }}>
                {formatPercentage(portfolioAnalytics.riskScore)}
              </Typography>
              <Typography variant="body2" sx={{ color: '#607d8b' }}>
                Portfolio Risk Score
              </Typography>
            </CardContent>
          </MetricCard>
        </Grid>
      </Grid>

      {/* Alerts */}
      {portfolioAnalytics.pendingRebalances > 0 && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3, borderRadius: '12px' }}
          action={
            <Button color="inherit" size="small">
              Review
            </Button>
          }
        >
          {portfolioAnalytics.pendingRebalances} position(s) require rebalancing for optimal performance
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Portfolio Overview" icon={<PieChart size={20} />} iconPosition="start" />
          <Tab label="Position Management" icon={<BarChart3 size={20} />} iconPosition="start" />
          <Tab label="Yield Opportunities" icon={<Zap size={20} />} iconPosition="start" />
          <Tab label="Market Analytics" icon={<Activity size={20} />} iconPosition="start" />
          <Tab label="Recommendations" icon={<Target size={20} />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Yield Performance Chart */}
          <Grid item xs={12} md={8}>
            <ChartCard>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Yield Performance vs Target
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={yieldChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(26, 35, 126, 0.1)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="yield" stroke="#1a237e" strokeWidth={3} dot={{ fill: '#1a237e' }} />
                  <Line type="monotone" dataKey="target" stroke="#ff9800" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>

          {/* Risk Distribution */}
          <Grid item xs={12} md={4}>
            <ChartCard>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Strategy Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={riskDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {riskDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2 }}>
                {riskDistributionData.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, backgroundColor: item.color, borderRadius: '50%' }} />
                      <Typography variant="body2">{item.name}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.value}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </ChartCard>
          </Grid>

          {/* Liquidity Distribution */}
          <Grid item xs={12}>
            <ChartCard sx={{ height: 'auto', p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Liquidity Distribution by Pool
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={liquidityDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(26, 35, 126, 0.1)" />
                  <XAxis dataKey="pool" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="liquidity" stroke="#1a237e" fill="rgba(26, 35, 126, 0.1)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          {/* Position Management Table */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: '16px', overflow: 'hidden' }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 3, borderBottom: '1px solid rgba(26, 35, 126, 0.1)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Optimized Positions
                  </Typography>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Pool</TableCell>
                        <TableCell>Strategy</TableCell>
                        <TableCell>Current Yield</TableCell>
                        <TableCell>Target Yield</TableCell>
                        <TableCell>Capital Efficiency</TableCell>
                        <TableCell>Performance Score</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {optimizedPositions.map((position) => (
                        <TableRow key={position.positionId}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {position.poolId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={position.strategy} 
                              size="small"
                              sx={{ textTransform: 'capitalize' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {formatPercentage(position.currentYield)}
                              </Typography>
                              {position.currentYield >= position.targetYield ? (
                                <TrendingUp size={16} color="#4caf50" />
                              ) : (
                                <TrendingDown size={16} color="#f44336" />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>{formatPercentage(position.targetYield)}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={position.capitalEfficiency} 
                                sx={{ width: 60, height: 6, borderRadius: 3 }}
                              />
                              <Typography variant="body2">
                                {formatPercentage(position.capitalEfficiency)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>
                              {position.performanceScore.toFixed(1)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {position.needsAttention ? (
                              <StatusChip label="Needs Attention" status="warning" size="small" />
                            ) : (
                              <StatusChip label="Optimal" status="optimal" size="small" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button 
                                size="small" 
                                variant="outlined"
                                onClick={() => handleOptimizePosition(position.positionId)}
                              >
                                Optimize
                              </Button>
                              {position.needsAttention && (
                                <Button 
                                  size="small" 
                                  variant="contained"
                                  onClick={() => handleRebalancePosition(position.positionId)}
                                >
                                  Rebalance
                                </Button>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          {/* Yield Opportunities */}
          <Grid item xs={12}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              High-Yield Opportunities
            </Typography>
            <Grid container spacing={3}>
              {yieldOpportunities.map((opportunity, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <MetricCard>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {opportunity.poolId}
                        </Typography>
                        <StatusChip 
                          label={opportunity.marketCondition} 
                          status={getStatusColor(opportunity.marketCondition)} 
                          size="small" 
                        />
                      </Box>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50', mb: 1 }}>
                          {formatPercentage(opportunity.estimatedApy)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#607d8b' }}>
                          Estimated APY
                        </Typography>
                      </Box>

                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6}>
                          <Typography variant="body2" sx={{ color: '#607d8b', mb: 1 }}>
                            Risk Score
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={opportunity.riskScore} 
                              sx={{ 
                                width: 60, 
                                height: 6, 
                                borderRadius: 3,
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: opportunity.riskScore > 70 ? '#f44336' : 
                                                 opportunity.riskScore > 40 ? '#ff9800' : '#4caf50'
                                }
                              }}
                            />
                            <Typography variant="body2">
                              {opportunity.riskScore.toFixed(0)}%
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" sx={{ color: '#607d8b', mb: 1 }}>
                            Confidence
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {opportunity.confidenceLevel.toFixed(0)}%
                          </Typography>
                        </Grid>
                      </Grid>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="body2" sx={{ color: '#607d8b' }}>
                          Min. Liquidity: {formatCurrency(opportunity.liquidityRequired)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#607d8b' }}>
                          Horizon: {opportunity.timeHorizon}
                        </Typography>
                      </Box>

                      <ActionButton fullWidth>
                        Explore Opportunity
                      </ActionButton>
                    </CardContent>
                  </MetricCard>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          {/* Market Analytics */}
          <Grid item xs={12}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              Real-Time Market Analytics
            </Typography>
            <Card sx={{ borderRadius: '16px', overflow: 'hidden' }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 3, borderBottom: '1px solid rgba(26, 35, 126, 0.1)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Pool Performance Metrics
                  </Typography>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Pool</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>24h Change</TableCell>
                        <TableCell>Volume 24h</TableCell>
                        <TableCell>Liquidity</TableCell>
                        <TableCell>APY</TableCell>
                        <TableCell>Condition</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {liquidityPools.map((pool) => (
                        <TableRow key={pool.poolId}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {pool.tokenA}/{pool.tokenB}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#607d8b' }}>
                              {formatPercentage(pool.feeTier / 100)} fee
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              ${pool.currentPrice.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {pool.price24hChange >= 0 ? (
                                <TrendingUp size={16} color="#4caf50" />
                              ) : (
                                <TrendingDown size={16} color="#f44336" />
                              )}
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 600,
                                  color: pool.price24hChange >= 0 ? '#4caf50' : '#f44336'
                                }}
                              >
                                {pool.price24hChange >= 0 ? '+' : ''}{formatPercentage(pool.price24hChange)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{formatCurrency(pool.volume24h)}</TableCell>
                          <TableCell>{formatCurrency(pool.totalLiquidity)}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>
                              {formatPercentage(pool.apyEstimate)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <StatusChip 
                              label={pool.marketCondition} 
                              status={getStatusColor(pool.marketCondition)} 
                              size="small" 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 4 && (
        <Grid container spacing={3}>
          {/* Recommendations */}
          <Grid item xs={12}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              Optimization Recommendations
            </Typography>
            <Grid container spacing={3}>
              {recommendations.map((rec, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <Card sx={{ borderRadius: '16px', height: '100%' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {rec.priority === 'High' && <AlertTriangle size={20} color="#f44336" />}
                          {rec.priority === 'Medium' && <Info size={20} color="#ff9800" />}
                          {rec.priority === 'Low' && <CheckCircle size={20} color="#4caf50" />}
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {rec.recommendationType}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <StatusChip 
                            label={rec.priority} 
                            status={rec.priority === 'High' ? 'critical' : rec.priority === 'Medium' ? 'warning' : 'optimal'} 
                            size="small" 
                          />
                          {rec.timeSensitive && <Clock size={16} color="#ff9800" />}
                        </Box>
                      </Box>

                      <Typography variant="body2" sx={{ color: '#607d8b', mb: 2 }}>
                        {rec.reason}
                      </Typography>

                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ color: '#607d8b', mb: 1 }}>
                          Expected Improvement
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#4caf50' }}>
                          +{formatPercentage(rec.expectedImprovement)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="body2" sx={{ color: '#607d8b' }}>
                          Risk Level: {rec.riskLevel}
                        </Typography>
                        {rec.timeSensitive && (
                          <Typography variant="caption" sx={{ color: '#ff9800', fontWeight: 600 }}>
                            Time Sensitive
                          </Typography>
                        )}
                      </Box>

                      <ActionButton fullWidth>
                        {rec.action}
                      </ActionButton>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      )}
    </DashboardContainer>
  );
};

export default LiquidityManagementDashboard; 