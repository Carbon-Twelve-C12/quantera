import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Badge,
  Stepper,
  Step,
  StepLabel,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  AccountBalance,
  TrendingUp,
  Warning,
  CheckCircle,
  Schedule,
  Assessment,
  Add,
  Refresh,
  Visibility,
  Edit,
  Delete,
  Download,
  Shield,
  Group,
  CreditCard,
  ShowChart,
  PieChart,
  BarChart,
  Timeline,
  Notifications,
  Security,
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
});

const RiskChip = styled(Chip)<{ riskLevel: string }>(({ riskLevel }) => {
  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return { bg: '#e8f5e8', color: '#2e7d32' };
      case 'medium': return { bg: '#fff8e1', color: '#f57c00' };
      case 'high': return { bg: '#ffebee', color: '#d32f2f' };
      case 'critical': return { bg: '#f3e5f5', color: '#7b1fa2' };
      default: return { bg: '#fafafa', color: '#616161' };
    }
  };
  
  const colors = getRiskColor(riskLevel);
  return {
    backgroundColor: colors.bg,
    color: colors.color,
    fontWeight: 600,
    fontSize: '12px',
  };
});

const PositionChip = styled(Chip)<{ positionType: string }>(({ positionType }) => {
  const getPositionColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'long': return { bg: '#e8f5e8', color: '#2e7d32' };
      case 'short': return { bg: '#ffebee', color: '#d32f2f' };
      default: return { bg: '#fafafa', color: '#616161' };
    }
  };
  
  const colors = getPositionColor(positionType);
  return {
    backgroundColor: colors.bg,
    color: colors.color,
    fontWeight: 600,
    fontSize: '12px',
  };
});

// Types
interface PrimeAccount {
  institution: string;
  institutionName: string;
  accountType: 'Individual' | 'Omnibus' | 'Segregated' | 'Prime_Services';
  creditLimit: string;
  currentExposure: string;
  availableCredit: string;
  maintenanceMarginRatio: number;
  initialMarginRatio: number;
  isActive: boolean;
  jurisdiction: string;
  riskScore: number;
  lastActivity: string;
}

interface CrossMarginPosition {
  asset: string;
  position: string;
  entryPrice: string;
  currentPrice: string;
  unrealizedPnL: string;
  requiredMargin: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  timestamp: string;
}

interface CreditFacility {
  facilityType: 'Securities_Lending' | 'Repo_Financing' | 'Margin_Lending' | 'Bridge_Financing' | 'Working_Capital';
  limit: string;
  utilized: string;
  interestRate: number;
  maturityDate: string;
  isActive: boolean;
  terms: string;
}

interface RiskMetrics {
  portfolioValue: string;
  totalExposure: string;
  leverageRatio: number;
  concentrationRisk: number;
  liquidityRisk: number;
  marketRisk: number;
  creditRisk: number;
  overallRiskScore: number;
  lastCalculated: string;
}

interface MarginCallAlert {
  institution: string;
  requiredMargin: string;
  availableMargin: string;
  shortfall: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  deadline: string;
  createdAt: string;
}

interface PrimeBrokerageMetrics {
  totalInstitutions: number;
  totalAum: string;
  totalCreditExtended: string;
  averageLeverageRatio: number;
  marginCalls24h: number;
  activePositions: number;
  portfolioMarginAccounts: number;
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
      id={`prime-tabpanel-${index}`}
      aria-labelledby={`prime-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const PrimeBrokerageDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [primeAccounts, setPrimeAccounts] = useState<PrimeAccount[]>([]);
  const [positions, setPositions] = useState<CrossMarginPosition[]>([]);
  const [creditFacilities, setCreditFacilities] = useState<CreditFacility[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [marginCalls, setMarginCalls] = useState<MarginCallAlert[]>([]);
  const [metrics, setMetrics] = useState<PrimeBrokerageMetrics | null>(null);
  const [selectedInstitution, setSelectedInstitution] = useState<string>('');
  const [createAccountDialogOpen, setCreateAccountDialogOpen] = useState(false);
  const [openPositionDialogOpen, setOpenPositionDialogOpen] = useState(false);
  const [setupCreditDialogOpen, setSetupCreditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockPrimeAccounts: PrimeAccount[] = [
      {
        institution: '0x1234...5678',
        institutionName: 'Goldman Sachs Prime Services',
        accountType: 'Prime_Services',
        creditLimit: '50000000',
        currentExposure: '35000000',
        availableCredit: '15000000',
        maintenanceMarginRatio: 1250, // 12.5%
        initialMarginRatio: 1500,     // 15%
        isActive: true,
        jurisdiction: 'US',
        riskScore: 35,
        lastActivity: '2024-01-15T14:30:00Z',
      },
      {
        institution: '0x5678...9012',
        institutionName: 'JPMorgan Institutional Services',
        accountType: 'Segregated',
        creditLimit: '75000000',
        currentExposure: '45000000',
        availableCredit: '30000000',
        maintenanceMarginRatio: 1200,
        initialMarginRatio: 1400,
        isActive: true,
        jurisdiction: 'US',
        riskScore: 28,
        lastActivity: '2024-01-15T13:45:00Z',
      },
    ];

    const mockPositions: CrossMarginPosition[] = [
      {
        asset: 'QTRE',
        position: '1000000',
        entryPrice: '100.50',
        currentPrice: '102.75',
        unrealizedPnL: '2250000',
        requiredMargin: '15000000',
        riskLevel: 'Medium',
        timestamp: '2024-01-15T10:00:00Z',
      },
      {
        asset: 'QTSY',
        position: '-500000',
        entryPrice: '85.25',
        currentPrice: '83.10',
        unrealizedPnL: '1075000',
        requiredMargin: '6375000',
        riskLevel: 'Low',
        timestamp: '2024-01-15T11:30:00Z',
      },
      {
        asset: 'QTBOND',
        position: '2000000',
        entryPrice: '98.75',
        currentPrice: '99.20',
        unrealizedPnL: '900000',
        requiredMargin: '19840000',
        riskLevel: 'High',
        timestamp: '2024-01-15T09:15:00Z',
      },
    ];

    const mockCreditFacilities: CreditFacility[] = [
      {
        facilityType: 'Securities_Lending',
        limit: '25000000',
        utilized: '15000000',
        interestRate: 150, // 1.5%
        maturityDate: '2024-12-31T23:59:59Z',
        isActive: true,
        terms: 'Revolving credit facility for securities lending operations',
      },
      {
        facilityType: 'Margin_Lending',
        limit: '40000000',
        utilized: '28000000',
        interestRate: 300, // 3%
        maturityDate: '2025-06-30T23:59:59Z',
        isActive: true,
        terms: 'Margin lending facility with daily mark-to-market',
      },
    ];

    const mockRiskMetrics: RiskMetrics = {
      portfolioValue: '100000000',
      totalExposure: '80000000',
      leverageRatio: 320, // 3.2x
      concentrationRisk: 25,
      liquidityRisk: 15,
      marketRisk: 35,
      creditRisk: 10,
      overallRiskScore: 32,
      lastCalculated: '2024-01-15T15:00:00Z',
    };

    const mockMarginCalls: MarginCallAlert[] = [
      {
        institution: '0x1234...5678',
        requiredMargin: '18000000',
        availableMargin: '15000000',
        shortfall: '3000000',
        severity: 'High',
        deadline: '2024-01-16T12:00:00Z',
        createdAt: '2024-01-15T16:00:00Z',
      },
    ];

    const mockMetrics: PrimeBrokerageMetrics = {
      totalInstitutions: 2,
      totalAum: '175000000',
      totalCreditExtended: '43000000',
      averageLeverageRatio: 2.8,
      marginCalls24h: 1,
      activePositions: 3,
      portfolioMarginAccounts: 2,
    };

    setPrimeAccounts(mockPrimeAccounts);
    setPositions(mockPositions);
    setCreditFacilities(mockCreditFacilities);
    setRiskMetrics(mockRiskMetrics);
    setMarginCalls(mockMarginCalls);
    setMetrics(mockMetrics);
    setSelectedInstitution(mockPrimeAccounts[0]?.institution || '');
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const formatPercentage = (value: number) => {
    return `${(value / 100).toFixed(2)}%`;
  };

  const getPositionType = (position: string) => {
    return parseFloat(position) >= 0 ? 'Long' : 'Short';
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'high': return '#f44336';
      case 'critical': return '#9c27b0';
      default: return '#757575';
    }
  };

  const selectedAccountData = primeAccounts.find(acc => acc.institution === selectedInstitution);

  return (
    <DashboardContainer>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#263238', mb: 1 }}>
          Prime Brokerage Services
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Institutional-grade prime brokerage with cross-margining and advanced risk management
        </Typography>
      </Box>

      {/* Key Metrics */}
      {metrics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Total AUM
                  </Typography>
                  <AccountBalance sx={{ color: '#1a237e' }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a237e', mb: 1 }}>
                  {formatCurrency(metrics.totalAum)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Assets Under Management
                </Typography>
              </CardContent>
            </MetricCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MetricCard>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Credit Extended
                  </Typography>
                  <CreditCard sx={{ color: '#1a237e' }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a237e', mb: 1 }}>
                  {formatCurrency(metrics.totalCreditExtended)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total credit facilities
                </Typography>
              </CardContent>
            </MetricCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MetricCard>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Avg Leverage
                  </Typography>
                  <ShowChart sx={{ color: '#1a237e' }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a237e', mb: 1 }}>
                  {metrics.averageLeverageRatio.toFixed(1)}x
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Portfolio leverage ratio
                </Typography>
              </CardContent>
            </MetricCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MetricCard>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Margin Calls
                  </Typography>
                  <Badge badgeContent={metrics.marginCalls24h} color="error">
                    <Warning sx={{ color: '#ff9800' }} />
                  </Badge>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a237e', mb: 1 }}>
                  {metrics.marginCalls24h}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last 24 hours
                </Typography>
              </CardContent>
            </MetricCard>
          </Grid>
        </Grid>
      )}

      {/* Main Content */}
      <StyledCard>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="prime brokerage tabs">
            <Tab label="Accounts" />
            <Tab label="Positions" />
            <Tab label="Credit Facilities" />
            <Tab label="Risk Management" />
            <Tab label="Margin Calls" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Prime Accounts Tab */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Prime Brokerage Accounts
            </Typography>
            <ActionButton
              startIcon={<Add />}
              onClick={() => setCreateAccountDialogOpen(true)}
            >
              Create Account
            </ActionButton>
          </Box>

          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Institution</strong></TableCell>
                  <TableCell><strong>Account Type</strong></TableCell>
                  <TableCell><strong>Credit Limit</strong></TableCell>
                  <TableCell><strong>Current Exposure</strong></TableCell>
                  <TableCell><strong>Available Credit</strong></TableCell>
                  <TableCell><strong>Risk Score</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {primeAccounts.map((account) => (
                  <TableRow key={account.institution}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {account.institutionName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {account.institution}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={account.accountType.replace('_', ' ')} variant="outlined" size="small" />
                    </TableCell>
                    <TableCell>{formatCurrency(account.creditLimit)}</TableCell>
                    <TableCell>{formatCurrency(account.currentExposure)}</TableCell>
                    <TableCell>{formatCurrency(account.availableCredit)}</TableCell>
                    <TableCell>
                      <RiskChip 
                        riskLevel={account.riskScore <= 25 ? 'Low' : account.riskScore <= 50 ? 'Medium' : account.riskScore <= 75 ? 'High' : 'Critical'} 
                        label={`${account.riskScore}%`} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={account.isActive ? 'Active' : 'Inactive'}
                        color={account.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small">
                            <Edit />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Positions Tab */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Cross-Margin Positions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Institution</InputLabel>
                <Select
                  value={selectedInstitution}
                  label="Institution"
                  onChange={(e) => setSelectedInstitution(e.target.value)}
                >
                  {primeAccounts.map((account) => (
                    <MenuItem key={account.institution} value={account.institution}>
                      {account.institutionName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <ActionButton
                startIcon={<Add />}
                onClick={() => setOpenPositionDialogOpen(true)}
              >
                Open Position
              </ActionButton>
            </Box>
          </Box>

          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Asset</strong></TableCell>
                  <TableCell><strong>Position</strong></TableCell>
                  <TableCell><strong>Entry Price</strong></TableCell>
                  <TableCell><strong>Current Price</strong></TableCell>
                  <TableCell><strong>Unrealized P&L</strong></TableCell>
                  <TableCell><strong>Required Margin</strong></TableCell>
                  <TableCell><strong>Risk Level</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {positions.map((position, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {position.asset}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PositionChip 
                          positionType={getPositionType(position.position)} 
                          label={getPositionType(position.position)} 
                          size="small" 
                        />
                        <Typography variant="body2">
                          {Math.abs(parseFloat(position.position)).toLocaleString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>${parseFloat(position.entryPrice).toFixed(2)}</TableCell>
                    <TableCell>${parseFloat(position.currentPrice).toFixed(2)}</TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: parseFloat(position.unrealizedPnL) >= 0 ? '#4caf50' : '#f44336',
                          fontWeight: 600 
                        }}
                      >
                        {formatCurrency(position.unrealizedPnL)}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatCurrency(position.requiredMargin)}</TableCell>
                    <TableCell>
                      <RiskChip riskLevel={position.riskLevel} label={position.riskLevel} size="small" />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Close Position">
                          <IconButton size="small" color="error">
                            <Delete />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Credit Facilities Tab */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Credit Facilities
            </Typography>
            <ActionButton
              startIcon={<Add />}
              onClick={() => setSetupCreditDialogOpen(true)}
            >
              Setup Facility
            </ActionButton>
          </Box>

          <Grid container spacing={3}>
            {creditFacilities.map((facility, index) => (
              <Grid item xs={12} md={6} key={index}>
                <StyledCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: '#1a237e', mr: 2 }}>
                        <CreditCard />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {facility.facilityType.replace('_', ' ')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Interest Rate: {formatPercentage(facility.interestRate)}
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Credit Limit
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a237e' }}>
                          {formatCurrency(facility.limit)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Utilized
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a237e' }}>
                          {formatCurrency(facility.utilized)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Utilization
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(parseFloat(facility.utilized) / parseFloat(facility.limit)) * 100}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {((parseFloat(facility.utilized) / parseFloat(facility.limit)) * 100).toFixed(1)}% utilized
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Terms
                        </Typography>
                        <Typography variant="body2">
                          {facility.terms}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Chip
                        label={facility.isActive ? 'Active' : 'Inactive'}
                        color={facility.isActive ? 'success' : 'error'}
                        size="small"
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small">
                            <Edit />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* Risk Management Tab */}
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Risk Management & Analytics
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <ProfessionalChart
                title="Portfolio Risk Metrics"
                subtitle="Real-time risk assessment across all positions"
                data={[
                  { metric: 'Market Risk', value: riskMetrics?.marketRisk || 0 },
                  { metric: 'Credit Risk', value: riskMetrics?.creditRisk || 0 },
                  { metric: 'Liquidity Risk', value: riskMetrics?.liquidityRisk || 0 },
                  { metric: 'Concentration Risk', value: riskMetrics?.concentrationRisk || 0 },
                ]}
                dataKey="value"
                xAxisKey="metric"
                height={300}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <StyledCard>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Risk Summary
                  </Typography>
                  
                  {riskMetrics && (
                    <List>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: getRiskLevelColor('medium'), width: 32, height: 32 }}>
                            <Assessment fontSize="small" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary="Overall Risk Score"
                          secondary={`${riskMetrics.overallRiskScore}%`}
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#1a237e', width: 32, height: 32 }}>
                            <ShowChart fontSize="small" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary="Leverage Ratio"
                          secondary={`${(riskMetrics.leverageRatio / 100).toFixed(1)}x`}
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#3f51b5', width: 32, height: 32 }}>
                            <AccountBalance fontSize="small" />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary="Portfolio Value"
                          secondary={formatCurrency(riskMetrics.portfolioValue)}
                        />
                      </ListItem>
                    </List>
                  )}
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          {/* Margin Calls Tab */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Margin Call Alerts
            </Typography>
            <Button startIcon={<Refresh />} variant="outlined">
              Refresh
            </Button>
          </Box>

          {marginCalls.length > 0 ? (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Institution</strong></TableCell>
                    <TableCell><strong>Required Margin</strong></TableCell>
                    <TableCell><strong>Available Margin</strong></TableCell>
                    <TableCell><strong>Shortfall</strong></TableCell>
                    <TableCell><strong>Severity</strong></TableCell>
                    <TableCell><strong>Deadline</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {marginCalls.map((call, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {call.institution}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatCurrency(call.requiredMargin)}</TableCell>
                      <TableCell>{formatCurrency(call.availableMargin)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#f44336', fontWeight: 600 }}>
                          {formatCurrency(call.shortfall)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <RiskChip riskLevel={call.severity} label={call.severity} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(call.deadline).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Resolve">
                            <IconButton size="small" color="primary">
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="success" sx={{ mt: 2 }}>
              No active margin calls. All accounts are within required margin limits.
            </Alert>
          )}
        </TabPanel>
      </StyledCard>

      {/* Create Account Dialog */}
      <Dialog open={createAccountDialogOpen} onClose={() => setCreateAccountDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Prime Brokerage Account</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Institution Name"
                placeholder="e.g., Goldman Sachs Prime Services"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Institution Address"
                placeholder="0x..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Jurisdiction"
                placeholder="e.g., US, EU, UK"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Account Type</InputLabel>
                <Select label="Account Type">
                  <MenuItem value="Individual">Individual</MenuItem>
                  <MenuItem value="Omnibus">Omnibus</MenuItem>
                  <MenuItem value="Segregated">Segregated</MenuItem>
                  <MenuItem value="Prime_Services">Prime Services</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Credit Limit"
                type="number"
                placeholder="50000000"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Maintenance Margin (%)"
                type="number"
                placeholder="12.5"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Initial Margin (%)"
                type="number"
                placeholder="15.0"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateAccountDialogOpen(false)}>Cancel</Button>
          <ActionButton onClick={() => setCreateAccountDialogOpen(false)}>
            Create Account
          </ActionButton>
        </DialogActions>
      </Dialog>

      {/* Open Position Dialog */}
      <Dialog open={openPositionDialogOpen} onClose={() => setOpenPositionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Open New Position</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Asset"
                placeholder="e.g., QTRE, QTSY"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Position Type</InputLabel>
                <Select label="Position Type">
                  <MenuItem value="long">Long</MenuItem>
                  <MenuItem value="short">Short</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                placeholder="1000000"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Entry Price"
                type="number"
                placeholder="100.50"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPositionDialogOpen(false)}>Cancel</Button>
          <ActionButton onClick={() => setOpenPositionDialogOpen(false)}>
            Open Position
          </ActionButton>
        </DialogActions>
      </Dialog>

      {/* Setup Credit Facility Dialog */}
      <Dialog open={setupCreditDialogOpen} onClose={() => setSetupCreditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Setup Credit Facility</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Facility Type</InputLabel>
                <Select label="Facility Type">
                  <MenuItem value="Securities_Lending">Securities Lending</MenuItem>
                  <MenuItem value="Repo_Financing">Repo Financing</MenuItem>
                  <MenuItem value="Margin_Lending">Margin Lending</MenuItem>
                  <MenuItem value="Bridge_Financing">Bridge Financing</MenuItem>
                  <MenuItem value="Working_Capital">Working Capital</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Credit Limit"
                type="number"
                placeholder="25000000"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Interest Rate (%)"
                type="number"
                placeholder="1.5"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Maturity Date"
                type="date"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Terms & Conditions"
                multiline
                rows={3}
                placeholder="Describe the terms and conditions of this credit facility..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSetupCreditDialogOpen(false)}>Cancel</Button>
          <ActionButton onClick={() => setSetupCreditDialogOpen(false)}>
            Setup Facility
          </ActionButton>
        </DialogActions>
      </Dialog>
    </DashboardContainer>
  );
}; 