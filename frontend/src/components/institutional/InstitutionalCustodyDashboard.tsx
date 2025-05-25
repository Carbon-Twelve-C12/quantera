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
  Switch,
  FormControlLabel,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  AccountBalance,
  Security,
  Gavel,
  TrendingUp,
  Warning,
  CheckCircle,
  Schedule,
  Assignment,
  Add,
  Refresh,
  Visibility,
  Edit,
  Delete,
  Download,
  Shield,
  Group,
  VpnKey,
  Assessment,
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

const CustodyTypeBadge = styled(Chip)<{ custodyType: string }>(({ custodyType }) => {
  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'self_custody': return { bg: '#e8f5e8', color: '#2e7d32', border: '#2e7d32' };
      case 'third_party_custody': return { bg: '#e3f2fd', color: '#1976d2', border: '#1976d2' };
      case 'multi_sig_custody': return { bg: '#f3e5f5', color: '#7b1fa2', border: '#7b1fa2' };
      case 'hybrid_custody': return { bg: '#fff8e1', color: '#f57c00', border: '#f57c00' };
      case 'delegated_custody': return { bg: '#fce4ec', color: '#c2185b', border: '#c2185b' };
      default: return { bg: '#fafafa', color: '#616161', border: '#616161' };
    }
  };
  
  const colors = getTypeColor(custodyType);
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

const RiskScoreChip = styled(Chip)<{ riskScore: number }>(({ riskScore }) => {
  const getRiskColor = (score: number) => {
    if (score <= 30) return { bg: '#e8f5e8', color: '#2e7d32' };
    if (score <= 60) return { bg: '#fff8e1', color: '#f57c00' };
    return { bg: '#ffebee', color: '#d32f2f' };
  };
  
  const colors = getRiskColor(riskScore);
  return {
    backgroundColor: colors.bg,
    color: colors.color,
    fontWeight: 600,
  };
});

// Types
interface InstitutionalAccount {
  institutionAddress: string;
  institutionName: string;
  custodyType: 'Self_Custody' | 'Third_Party_Custody' | 'Multi_Sig_Custody' | 'Hybrid_Custody' | 'Delegated_Custody';
  segregationLevel: 'Omnibus' | 'Segregated' | 'Individually_Separated';
  custodians: string[];
  signatories: string[];
  requiredSignatures: number;
  assetBalances: Record<string, string>;
  aum: string;
  isActive: boolean;
  jurisdiction: string;
  lastActivity: string;
}

interface CustodianInfo {
  custodianAddress: string;
  name: string;
  license: string;
  jurisdiction: string;
  isActive: boolean;
  totalAssetsUnderCustody: string;
  custodyFeeRate: number;
  insuranceCoverage: string;
  regulatoryApprovals: string[];
}

interface TransactionProposal {
  proposalId: number;
  institution: string;
  asset: string;
  to: string;
  amount: string;
  description: string;
  approvers: string[];
  approvalsCount: number;
  requiredApprovals: number;
  executed: boolean;
  createdAt: string;
  expiresAt: string;
  proposalType: 'Withdrawal' | 'Transfer' | 'Asset_Authorization' | 'Custody_Arrangement_Change';
  riskScore: number;
}

interface CustodyMetrics {
  totalInstitutions: number;
  totalCustodians: number;
  totalAum: string;
  averageCustodyFee: number;
  pendingProposals: number;
  executedProposals24h: number;
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
      id={`custody-tabpanel-${index}`}
      aria-labelledby={`custody-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const InstitutionalCustodyDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [institutions, setInstitutions] = useState<InstitutionalAccount[]>([]);
  const [custodians, setCustodians] = useState<CustodianInfo[]>([]);
  const [proposals, setProposals] = useState<TransactionProposal[]>([]);
  const [metrics, setMetrics] = useState<CustodyMetrics | null>(null);
  const [selectedInstitution, setSelectedInstitution] = useState<string>('');
  const [createAccountDialogOpen, setCreateAccountDialogOpen] = useState(false);
  const [createProposalDialogOpen, setCreateProposalDialogOpen] = useState(false);
  const [registerCustodianDialogOpen, setRegisterCustodianDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockInstitutions: InstitutionalAccount[] = [
      {
        institutionAddress: '0x1234...5678',
        institutionName: 'Goldman Sachs Asset Management',
        custodyType: 'Multi_Sig_Custody',
        segregationLevel: 'Individually_Separated',
        custodians: ['0xCust1...', '0xCust2...'],
        signatories: ['0xSign1...', '0xSign2...', '0xSign3...'],
        requiredSignatures: 2,
        assetBalances: {
          'QTRE': '5000000',
          'QTSY': '3000000',
          'USDC': '2000000',
        },
        aum: '10000000',
        isActive: true,
        jurisdiction: 'US',
        lastActivity: '2024-01-15T14:30:00Z',
      },
      {
        institutionAddress: '0x5678...9012',
        institutionName: 'BlackRock Institutional',
        custodyType: 'Third_Party_Custody',
        segregationLevel: 'Segregated',
        custodians: ['0xCust3...'],
        signatories: ['0xSign4...', '0xSign5...'],
        requiredSignatures: 2,
        assetBalances: {
          'QTRE': '8000000',
          'QTSY': '5000000',
        },
        aum: '13000000',
        isActive: true,
        jurisdiction: 'US',
        lastActivity: '2024-01-15T13:45:00Z',
      },
    ];

    const mockCustodians: CustodianInfo[] = [
      {
        custodianAddress: '0xCust1...',
        name: 'State Street Digital',
        license: 'NYDFS-001',
        jurisdiction: 'US',
        isActive: true,
        totalAssetsUnderCustody: '15000000',
        custodyFeeRate: 25, // 0.25%
        insuranceCoverage: '100000000',
        regulatoryApprovals: ['SEC', 'NYDFS', 'FINRA'],
      },
      {
        custodianAddress: '0xCust2...',
        name: 'Coinbase Custody',
        license: 'NYDFS-002',
        jurisdiction: 'US',
        isActive: true,
        totalAssetsUnderCustody: '8000000',
        custodyFeeRate: 30, // 0.30%
        insuranceCoverage: '50000000',
        regulatoryApprovals: ['SEC', 'NYDFS'],
      },
    ];

    const mockProposals: TransactionProposal[] = [
      {
        proposalId: 1,
        institution: '0x1234...5678',
        asset: 'QTRE',
        to: '0xRecipient1...',
        amount: '500000',
        description: 'Quarterly distribution to investors',
        approvers: ['0xSign1...'],
        approvalsCount: 1,
        requiredApprovals: 2,
        executed: false,
        createdAt: '2024-01-15T10:00:00Z',
        expiresAt: '2024-01-22T10:00:00Z',
        proposalType: 'Withdrawal',
        riskScore: 25,
      },
      {
        proposalId: 2,
        institution: '0x5678...9012',
        asset: 'QTSY',
        to: '0xRecipient2...',
        amount: '1000000',
        description: 'Rebalancing portfolio allocation',
        approvers: ['0xSign4...', '0xSign5...'],
        approvalsCount: 2,
        requiredApprovals: 2,
        executed: true,
        createdAt: '2024-01-14T15:30:00Z',
        expiresAt: '2024-01-21T15:30:00Z',
        proposalType: 'Transfer',
        riskScore: 15,
      },
    ];

    const mockMetrics: CustodyMetrics = {
      totalInstitutions: 2,
      totalCustodians: 2,
      totalAum: '23000000',
      averageCustodyFee: 27.5,
      pendingProposals: 1,
      executedProposals24h: 1,
    };

    setInstitutions(mockInstitutions);
    setCustodians(mockCustodians);
    setProposals(mockProposals);
    setMetrics(mockMetrics);
    setSelectedInstitution(mockInstitutions[0]?.institutionAddress || '');
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

  const getProposalStatusColor = (proposal: TransactionProposal) => {
    if (proposal.executed) return '#4caf50';
    if (new Date(proposal.expiresAt) < new Date()) return '#f44336';
    if (proposal.approvalsCount >= proposal.requiredApprovals) return '#ff9800';
    return '#2196f3';
  };

  const getProposalStatusText = (proposal: TransactionProposal) => {
    if (proposal.executed) return 'Executed';
    if (new Date(proposal.expiresAt) < new Date()) return 'Expired';
    if (proposal.approvalsCount >= proposal.requiredApprovals) return 'Ready to Execute';
    return 'Pending Approvals';
  };

  const selectedInstitutionData = institutions.find(inst => inst.institutionAddress === selectedInstitution);

  return (
    <DashboardContainer>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#263238', mb: 1 }}>
          Institutional Custody Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage institutional custody arrangements, multi-signature workflows, and asset security
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
                    Institutions
                  </Typography>
                  <Group sx={{ color: '#1a237e' }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a237e', mb: 1 }}>
                  {metrics.totalInstitutions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active accounts
                </Typography>
              </CardContent>
            </MetricCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MetricCard>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Pending Proposals
                  </Typography>
                  <Schedule sx={{ color: '#ff9800' }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a237e', mb: 1 }}>
                  {metrics.pendingProposals}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Awaiting approval
                </Typography>
              </CardContent>
            </MetricCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MetricCard>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Avg Custody Fee
                  </Typography>
                  <Assessment sx={{ color: '#1a237e' }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a237e', mb: 1 }}>
                  {formatPercentage(metrics.averageCustodyFee)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Annual fee rate
                </Typography>
              </CardContent>
            </MetricCard>
          </Grid>
        </Grid>
      )}

      {/* Main Content */}
      <StyledCard>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="custody dashboard tabs">
            <Tab label="Institutions" />
            <Tab label="Custodians" />
            <Tab label="Proposals" />
            <Tab label="Analytics" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Institutions Tab */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Institutional Accounts
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
                  <TableCell><strong>Custody Type</strong></TableCell>
                  <TableCell><strong>Segregation</strong></TableCell>
                  <TableCell><strong>AUM</strong></TableCell>
                  <TableCell><strong>Custodians</strong></TableCell>
                  <TableCell><strong>Multi-Sig</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {institutions.map((institution) => (
                  <TableRow key={institution.institutionAddress}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {institution.institutionName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {institution.institutionAddress}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <CustodyTypeBadge custodyType={institution.custodyType} label={institution.custodyType.replace('_', ' ')} />
                    </TableCell>
                    <TableCell>{institution.segregationLevel.replace('_', ' ')}</TableCell>
                    <TableCell>{formatCurrency(institution.aum)}</TableCell>
                    <TableCell>{institution.custodians.length}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        0/{institution.requiredSignatures}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={institution.isActive ? 'Active' : 'Inactive'}
                        color={institution.isActive ? 'success' : 'error'}
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
          {/* Custodians Tab */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Registered Custodians
            </Typography>
            <ActionButton
              startIcon={<Add />}
              onClick={() => setRegisterCustodianDialogOpen(true)}
            >
              Register Custodian
            </ActionButton>
          </Box>

          <Grid container spacing={3}>
            {custodians.map((custodian) => (
              <Grid item xs={12} md={6} key={custodian.custodianAddress}>
                <StyledCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: '#1a237e', mr: 2 }}>
                        <Shield />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {custodian.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {custodian.license} • {custodian.jurisdiction}
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Assets Under Custody
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a237e' }}>
                          {formatCurrency(custodian.totalAssetsUnderCustody)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Custody Fee
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a237e' }}>
                          {formatPercentage(custodian.custodyFeeRate)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Insurance Coverage
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(custodian.insuranceCoverage)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Regulatory Approvals
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {custodian.regulatoryApprovals.map((approval) => (
                            <Chip key={approval} label={approval} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Chip
                        label={custodian.isActive ? 'Active' : 'Inactive'}
                        color={custodian.isActive ? 'success' : 'error'}
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

        <TabPanel value={tabValue} index={2}>
          {/* Proposals Tab */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Transaction Proposals
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Institution</InputLabel>
                <Select
                  value={selectedInstitution}
                  label="Institution"
                  onChange={(e) => setSelectedInstitution(e.target.value)}
                >
                  {institutions.map((institution) => (
                    <MenuItem key={institution.institutionAddress} value={institution.institutionAddress}>
                      {institution.institutionName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <ActionButton
                startIcon={<Add />}
                onClick={() => setCreateProposalDialogOpen(true)}
              >
                Create Proposal
              </ActionButton>
            </Box>
          </Box>

          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Proposal ID</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Asset</strong></TableCell>
                  <TableCell><strong>Amount</strong></TableCell>
                  <TableCell><strong>Approvals</strong></TableCell>
                  <TableCell><strong>Risk Score</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Expires</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {proposals.map((proposal) => (
                  <TableRow key={proposal.proposalId}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        #{proposal.proposalId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={proposal.proposalType.replace('_', ' ')} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{proposal.asset}</TableCell>
                    <TableCell>{formatCurrency(proposal.amount)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          {proposal.approvalsCount}/{proposal.requiredApprovals}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(proposal.approvalsCount / proposal.requiredApprovals) * 100}
                          sx={{ width: 60, height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <RiskScoreChip riskScore={proposal.riskScore} label={`${proposal.riskScore}%`} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getProposalStatusText(proposal)}
                        size="small"
                        sx={{ 
                          backgroundColor: getProposalStatusColor(proposal) + '20',
                          color: getProposalStatusColor(proposal),
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(proposal.expiresAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {!proposal.executed && proposal.approvalsCount < proposal.requiredApprovals && (
                          <Tooltip title="Approve">
                            <IconButton size="small" color="primary">
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* Analytics Tab */}
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Custody Analytics & Reporting
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <ProfessionalChart
                title="Assets Under Management Trend"
                subtitle="Monthly AUM growth across all institutions"
                data={[
                  { month: 'Jan', aum: 18000000 },
                  { month: 'Feb', aum: 19500000 },
                  { month: 'Mar', aum: 21000000 },
                  { month: 'Apr', aum: 22500000 },
                  { month: 'May', aum: 23000000 },
                ]}
                dataKey="aum"
                xAxisKey="month"
                height={300}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <StyledCard>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Custody Distribution
                  </Typography>
                  
                  <List>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#1a237e', width: 32, height: 32 }}>
                          <VpnKey fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Multi-Sig Custody"
                        secondary="60% of institutions"
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#3f51b5', width: 32, height: 32 }}>
                          <Shield fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Third-Party Custody"
                        secondary="30% of institutions"
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#00bcd4', width: 32, height: 32 }}>
                          <Security fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Hybrid Custody"
                        secondary="10% of institutions"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>
        </TabPanel>
      </StyledCard>

      {/* Create Account Dialog */}
      <Dialog open={createAccountDialogOpen} onClose={() => setCreateAccountDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Institutional Account</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Institution Name"
                placeholder="e.g., Goldman Sachs Asset Management"
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
                <InputLabel>Custody Type</InputLabel>
                <Select label="Custody Type">
                  <MenuItem value="Self_Custody">Self Custody</MenuItem>
                  <MenuItem value="Third_Party_Custody">Third Party Custody</MenuItem>
                  <MenuItem value="Multi_Sig_Custody">Multi-Signature Custody</MenuItem>
                  <MenuItem value="Hybrid_Custody">Hybrid Custody</MenuItem>
                  <MenuItem value="Delegated_Custody">Delegated Custody</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Segregation Level</InputLabel>
                <Select label="Segregation Level">
                  <MenuItem value="Omnibus">Omnibus</MenuItem>
                  <MenuItem value="Segregated">Segregated</MenuItem>
                  <MenuItem value="Individually_Separated">Individually Separated</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Required Signatures"
                type="number"
                placeholder="2"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Compliance Hash"
                placeholder="0x..."
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

      {/* Create Proposal Dialog */}
      <Dialog open={createProposalDialogOpen} onClose={() => setCreateProposalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Transaction Proposal</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Proposal Type</InputLabel>
                <Select label="Proposal Type">
                  <MenuItem value="Withdrawal">Withdrawal</MenuItem>
                  <MenuItem value="Transfer">Transfer</MenuItem>
                  <MenuItem value="Asset_Authorization">Asset Authorization</MenuItem>
                  <MenuItem value="Custody_Arrangement_Change">Custody Arrangement Change</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Asset"
                placeholder="e.g., QTRE, QTSY"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                placeholder="1000000"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Recipient Address"
                placeholder="0x..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                placeholder="Describe the purpose of this transaction..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateProposalDialogOpen(false)}>Cancel</Button>
          <ActionButton onClick={() => setCreateProposalDialogOpen(false)}>
            Create Proposal
          </ActionButton>
        </DialogActions>
      </Dialog>

      {/* Register Custodian Dialog */}
      <Dialog open={registerCustodianDialogOpen} onClose={() => setRegisterCustodianDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Register New Custodian</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Custodian Name"
                placeholder="e.g., State Street Digital"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Custodian Address"
                placeholder="0x..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="License Number"
                placeholder="e.g., NYDFS-001"
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
              <TextField
                fullWidth
                label="Custody Fee Rate (bps)"
                type="number"
                placeholder="25"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Insurance Coverage"
                type="number"
                placeholder="100000000"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegisterCustodianDialogOpen(false)}>Cancel</Button>
          <ActionButton onClick={() => setRegisterCustodianDialogOpen(false)}>
            Register Custodian
          </ActionButton>
        </DialogActions>
      </Dialog>
    </DashboardContainer>
  );
}; 