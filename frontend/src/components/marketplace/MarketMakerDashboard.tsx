import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  TrendingUp,
  TrendingDown,
  EmojiEvents as Award,
  AccessTime as Clock,
  AttachMoney as DollarSign,
  Timeline as Activity,
  People as Users,
  BarChart as BarChart3,
  Settings,
  Info,
  CheckCircle,
  Warning as AlertCircle,
  Star,
} from '@mui/icons-material';
import { ProfessionalChart } from '../charts/ProfessionalChart';

// Styled components
const DashboardContainer = styled(Box)({
  padding: '32px',
  background: 'linear-gradient(135deg, rgba(26, 35, 126, 0.02) 0%, rgba(63, 81, 181, 0.02) 100%)',
  minHeight: '100vh',
});

const StyledCard = styled(Card)(({ theme }) => ({
  background: '#ffffff',
  borderRadius: '16px',
  boxShadow: '0 4px 24px rgba(26, 35, 126, 0.08)',
  border: '1px solid rgba(26, 35, 126, 0.08)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  
  '&:hover': {
    boxShadow: '0 8px 40px rgba(26, 35, 126, 0.12)',
    transform: 'translateY(-2px)',
  },
}));

const MetricCard = styled(StyledCard)({
  position: 'relative',
  overflow: 'hidden',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)',
  },
});

const TierBadge = styled(Chip)<{ tier: string }>(({ tier }) => {
  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'diamond': return { bg: '#e1f5fe', color: '#0277bd', border: '#0277bd' };
      case 'platinum': return { bg: '#f3e5f5', color: '#7b1fa2', border: '#7b1fa2' };
      case 'gold': return { bg: '#fff8e1', color: '#f57c00', border: '#f57c00' };
      case 'silver': return { bg: '#fafafa', color: '#616161', border: '#616161' };
      default: return { bg: '#efebe9', color: '#5d4037', border: '#5d4037' };
    }
  };
  
  const colors = getTierColor(tier);
  return {
    backgroundColor: colors.bg,
    color: colors.color,
    border: `1px solid ${colors.border}`,
    fontWeight: 600,
    fontSize: '12px',
  };
});

const ActionButton = styled(Button)({
  background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)',
  color: '#ffffff',
  borderRadius: '8px',
  padding: '12px 24px',
  fontWeight: 600,
  textTransform: 'none',
  
  '&:hover': {
    background: 'linear-gradient(135deg, #0d47a1 0%, #303f9f 100%)',
    transform: 'translateY(-1px)',
  },
  
  '&:disabled': {
    background: '#e0e0e0',
    color: '#9e9e9e',
  },
});

// Types
interface MarketMakerProfile {
  address: string;
  registrationTimestamp: string;
  totalVolume: string;
  totalTrades: number;
  uptimeScore: number;
  averageSpread: number;
  currentTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  isActive: boolean;
  isVerified: boolean;
  totalRewardsEarned: string;
  totalRewardsClaimed: string;
}

interface PerformanceMetrics {
  dailyVolume: string;
  dailyTrades: number;
  dailyUptimeMinutes: number;
  dailyAverageSpread: number;
  consecutiveDaysActive: number;
}

interface TierRequirements {
  minimumVolume: string;
  minimumUptime: number;
  maximumSpread: number;
  minimumTrades: number;
  rewardMultiplier: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const MarketMakerDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [profile, setProfile] = useState<MarketMakerProfile | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationDialogOpen, setRegistrationDialogOpen] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate loading market maker data
    const mockProfile: MarketMakerProfile = {
      address: '0x1234...5678',
      registrationTimestamp: '2024-01-15T10:00:00Z',
      totalVolume: '2500000',
      totalTrades: 1247,
      uptimeScore: 94.5,
      averageSpread: 25.5,
      currentTier: 'Gold',
      isActive: true,
      isVerified: true,
      totalRewardsEarned: '15750',
      totalRewardsClaimed: '12000',
    };

    const mockMetrics: PerformanceMetrics = {
      dailyVolume: '125000',
      dailyTrades: 45,
      dailyUptimeMinutes: 1380, // 23 hours
      dailyAverageSpread: 22.0,
      consecutiveDaysActive: 28,
    };

    setProfile(mockProfile);
    setMetrics(mockMetrics);
    setIsRegistered(true);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      // Simulate registration process
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsRegistered(true);
      setRegistrationDialogOpen(false);
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    setLoading(true);
    try {
      // Simulate reward claiming
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Update claimed rewards
    } catch (error) {
      console.error('Claim failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getTierProgress = (currentTier: string) => {
    const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    const currentIndex = tiers.indexOf(currentTier);
    return ((currentIndex + 1) / tiers.length) * 100;
  };

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 95) return '#4caf50';
    if (uptime >= 85) return '#ff9800';
    return '#f44336';
  };

  const getSpreadColor = (spread: number) => {
    if (spread <= 25) return '#4caf50';
    if (spread <= 50) return '#ff9800';
    return '#f44336';
  };

  if (!isRegistered) {
    return (
      <DashboardContainer>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h4" sx={{ mb: 2, fontWeight: 700, color: '#263238' }}>
            Market Maker Program
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, color: '#607d8b', maxWidth: 600, mx: 'auto' }}>
            Join our elite market maker program and earn rewards for providing liquidity to the Quantera ecosystem
          </Typography>
          
          <Grid container spacing={4} sx={{ mb: 6, maxWidth: 1000, mx: 'auto' }}>
            <Grid item xs={12} md={4}>
              <MetricCard>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Award sx={{ fontSize: 48, color: '#1a237e', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Tiered Rewards
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Earn up to 3x rewards based on your performance tier
                  </Typography>
                </CardContent>
              </MetricCard>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <MetricCard>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <BarChart3 sx={{ fontSize: 48, color: '#1a237e', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Performance Tracking
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Real-time monitoring of volume, uptime, and spread metrics
                  </Typography>
                </CardContent>
              </MetricCard>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <MetricCard>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <DollarSign sx={{ fontSize: 48, color: '#1a237e', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Daily Rewards
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Automatic daily reward distribution based on performance
                  </Typography>
                </CardContent>
              </MetricCard>
            </Grid>
          </Grid>
          
          <ActionButton
            size="large"
            onClick={() => setRegistrationDialogOpen(true)}
            startIcon={<Users />}
          >
            Register as Market Maker
          </ActionButton>
        </Box>

        {/* Registration Dialog */}
        <Dialog open={registrationDialogOpen} onClose={() => setRegistrationDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Register as Market Maker</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 3 }}>
              Registration requires a minimum stake of 1 ETH. This stake demonstrates your commitment to providing quality liquidity.
            </Alert>
            
            <TextField
              fullWidth
              label="Stake Amount (ETH)"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              type="number"
              inputProps={{ min: 1, step: 0.1 }}
              sx={{ mb: 2 }}
            />
            
            <Typography variant="body2" color="text.secondary">
              By registering, you agree to maintain minimum performance standards and comply with our market making guidelines.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRegistrationDialogOpen(false)}>Cancel</Button>
            <ActionButton
              onClick={handleRegister}
              disabled={!stakeAmount || parseFloat(stakeAmount) < 1 || loading}
            >
              {loading ? 'Registering...' : 'Register & Stake'}
            </ActionButton>
          </DialogActions>
        </Dialog>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#263238', mb: 1 }}>
          Market Maker Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body1" color="text.secondary">
            {profile?.address}
          </Typography>
          <TierBadge tier={profile?.currentTier || 'Bronze'} label={profile?.currentTier} />
          {profile?.isVerified && (
            <Chip
              icon={<CheckCircle />}
              label="Verified"
              color="success"
              size="small"
            />
          )}
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Total Volume
                </Typography>
                <TrendingUp sx={{ color: '#4caf50' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a237e', mb: 1 }}>
                {formatCurrency(profile?.totalVolume || '0')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Lifetime trading volume
              </Typography>
            </CardContent>
          </MetricCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Uptime Score
                </Typography>
                <Activity sx={{ color: getUptimeColor(profile?.uptimeScore || 0) }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a237e', mb: 1 }}>
                {formatPercentage(profile?.uptimeScore || 0)}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={profile?.uptimeScore || 0}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getUptimeColor(profile?.uptimeScore || 0),
                  },
                }}
              />
            </CardContent>
          </MetricCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Avg Spread
                </Typography>
                <BarChart3 sx={{ color: getSpreadColor(profile?.averageSpread || 0) }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a237e', mb: 1 }}>
                {profile?.averageSpread.toFixed(1)}bp
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average bid-ask spread
              </Typography>
            </CardContent>
          </MetricCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Claimable Rewards
                </Typography>
                <DollarSign sx={{ color: '#4caf50' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a237e', mb: 1 }}>
                {formatCurrency(
                  (parseFloat(profile?.totalRewardsEarned || '0') - 
                   parseFloat(profile?.totalRewardsClaimed || '0')).toString()
                )}
              </Typography>
              <ActionButton
                size="small"
                onClick={handleClaimRewards}
                disabled={loading}
                sx={{ mt: 1 }}
              >
                {loading ? 'Claiming...' : 'Claim Rewards'}
              </ActionButton>
            </CardContent>
          </MetricCard>
        </Grid>
      </Grid>

      {/* Tabs */}
      <StyledCard>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
            <Tab label="Performance" />
            <Tab label="Rewards" />
            <Tab label="Requirements" />
            <Tab label="History" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Performance Tab */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <ProfessionalChart
                title="Daily Volume Trend"
                subtitle="Last 30 days trading volume"
                data={[
                  { date: '2024-01-01', volume: 95000 },
                  { date: '2024-01-02', volume: 110000 },
                  { date: '2024-01-03', volume: 125000 },
                  { date: '2024-01-04', volume: 140000 },
                  { date: '2024-01-05', volume: 135000 },
                  { date: '2024-01-06', volume: 155000 },
                  { date: '2024-01-07', volume: 170000 },
                ]}
                dataKey="volume"
                xAxisKey="date"
                height={300}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Today's Metrics
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Daily Volume
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a237e' }}>
                    {formatCurrency(metrics?.dailyVolume || '0')}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Trades Executed
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a237e' }}>
                    {metrics?.dailyTrades || 0}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Active Time
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a237e' }}>
                    {Math.floor((metrics?.dailyUptimeMinutes || 0) / 60)}h {(metrics?.dailyUptimeMinutes || 0) % 60}m
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Consecutive Days
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a237e' }}>
                    {metrics?.consecutiveDaysActive || 0} days
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Rewards Tab */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Reward Summary
                </Typography>
                
                <Box sx={{ mb: 3, p: 3, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Total Earned
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50' }}>
                    {formatCurrency(profile?.totalRewardsEarned || '0')}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3, p: 3, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Total Claimed
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a237e' }}>
                    {formatCurrency(profile?.totalRewardsClaimed || '0')}
                  </Typography>
                </Box>
                
                <Box sx={{ p: 3, backgroundColor: '#e8f5e8', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Available to Claim
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                    {formatCurrency(
                      (parseFloat(profile?.totalRewardsEarned || '0') - 
                       parseFloat(profile?.totalRewardsClaimed || '0')).toString()
                    )}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Tier Benefits
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Current Tier Progress
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={getTierProgress(profile?.currentTier || 'Bronze')}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)',
                      },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {profile?.currentTier} Tier
                  </Typography>
                </Box>
                
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>{profile?.currentTier} Tier Benefits:</strong>
                    <br />
                    • {profile?.currentTier === 'Gold' ? '1.5x' : '1.0x'} reward multiplier
                    <br />
                    • Priority support access
                    <br />
                    • Advanced analytics dashboard
                  </Typography>
                </Alert>
                
                <Typography variant="body2" color="text.secondary">
                  Maintain your performance metrics to keep your tier status and unlock higher rewards.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Requirements Tab */}
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Tier</strong></TableCell>
                  <TableCell><strong>Min Volume</strong></TableCell>
                  <TableCell><strong>Min Uptime</strong></TableCell>
                  <TableCell><strong>Max Spread</strong></TableCell>
                  <TableCell><strong>Min Trades</strong></TableCell>
                  <TableCell><strong>Multiplier</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { tier: 'Bronze', volume: '$10K', uptime: '50%', spread: '100bp', trades: '10', multiplier: '1.0x' },
                  { tier: 'Silver', volume: '$50K', uptime: '70%', spread: '75bp', trades: '25', multiplier: '1.25x' },
                  { tier: 'Gold', volume: '$200K', uptime: '85%', spread: '50bp', trades: '50', multiplier: '1.5x' },
                  { tier: 'Platinum', volume: '$1M', uptime: '95%', spread: '30bp', trades: '100', multiplier: '2.0x' },
                  { tier: 'Diamond', volume: '$5M', uptime: '98%', spread: '20bp', trades: '200', multiplier: '3.0x' },
                ].map((row) => (
                  <TableRow 
                    key={row.tier}
                    sx={{ 
                      backgroundColor: row.tier === profile?.currentTier ? 'rgba(26, 35, 126, 0.05)' : 'transparent',
                    }}
                  >
                    <TableCell>
                      <TierBadge tier={row.tier} label={row.tier} />
                    </TableCell>
                    <TableCell>{row.volume}</TableCell>
                    <TableCell>{row.uptime}</TableCell>
                    <TableCell>{row.spread}</TableCell>
                    <TableCell>{row.trades}</TableCell>
                    <TableCell>
                      <Chip 
                        label={row.multiplier} 
                        color="primary" 
                        variant="outlined" 
                        size="small" 
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* History Tab */}
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Recent Activity
          </Typography>
          
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Volume</strong></TableCell>
                  <TableCell><strong>Trades</strong></TableCell>
                  <TableCell><strong>Uptime</strong></TableCell>
                  <TableCell><strong>Rewards</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { date: '2024-01-07', volume: '$170K', trades: 52, uptime: '96%', rewards: '$425' },
                  { date: '2024-01-06', volume: '$155K', trades: 48, uptime: '94%', rewards: '$387' },
                  { date: '2024-01-05', volume: '$135K', trades: 41, uptime: '92%', rewards: '$338' },
                  { date: '2024-01-04', volume: '$140K', trades: 45, uptime: '95%', rewards: '$350' },
                  { date: '2024-01-03', volume: '$125K', trades: 38, uptime: '89%', rewards: '$312' },
                ].map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.volume}</TableCell>
                    <TableCell>{row.trades}</TableCell>
                    <TableCell>
                      <Chip 
                        label={row.uptime} 
                        color={parseFloat(row.uptime) >= 95 ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#4caf50', fontWeight: 600 }}>
                      {row.rewards}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </StyledCard>
    </DashboardContainer>
  );
}; 