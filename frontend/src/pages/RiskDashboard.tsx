import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Tab,
  Tabs,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  AlertTitle,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Divider,
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

// Types
interface RiskMetrics {
  portfolioAddress: string;
  var95: number;
  var99: number;
  expectedShortfall: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  beta: number;
  alpha: number;
  volatility: number;
  correlationMatrix: number[][];
  liquidityScores: { [key: string]: number };
  concentrationRisk: number;
  leverageRatio: number;
  riskGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  timestamp: string;
}

interface RiskAlert {
  id: string;
  portfolioAddress: string;
  alertType: 'VaRBreach' | 'DrawdownLimit' | 'ConcentrationRisk' | 'LiquidityWarning' | 'VolatilitySpike';
  severity: 'Info' | 'Warning' | 'Critical';
  message: string;
  metricValue: number;
  threshold: number;
  timestamp: string;
}

interface HistoricalMetric {
  date: string;
  var95: number;
  sharpeRatio: number;
  volatility: number;
}

// Risk Metrics Card Component
const RiskMetricCard: React.FC<{
  title: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'success' | 'error' | 'warning' | 'info';
}> = ({ title, value, unit, trend, color = 'info' }) => {
  const theme = useTheme();
  
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUpIcon color="success" />;
    if (trend === 'down') return <TrendingDownIcon color="error" />;
    return null;
  };
  
  const getColor = () => {
    switch (color) {
      case 'success': return theme.palette.success.main;
      case 'error': return theme.palette.error.main;
      case 'warning': return theme.palette.warning.main;
      default: return theme.palette.info.main;
    }
  };
  
  return (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" color="textSecondary">
            {title}
          </Typography>
          {getTrendIcon()}
        </Box>
        <Typography 
          variant="h4" 
          style={{ color: getColor(), marginTop: 8 }}
        >
          {typeof value === 'number' ? value.toFixed(2) : value}
          {unit && <Typography variant="subtitle1" component="span"> {unit}</Typography>}
        </Typography>
      </CardContent>
    </Card>
  );
};

// Correlation Heatmap Component
const CorrelationHeatmap: React.FC<{ matrix: number[][] }> = ({ matrix }) => {
  const theme = useTheme();
  
  const getColor = (value: number) => {
    if (value > 0.7) return theme.palette.error.main;
    if (value > 0.3) return theme.palette.warning.main;
    if (value > -0.3) return theme.palette.grey[500];
    if (value > -0.7) return theme.palette.info.main;
    return theme.palette.primary.main;
  };
  
  return (
    <Box>
      <Grid container spacing={0.5}>
        {matrix.map((row, i) => (
          <Grid key={i} item xs={12}>
            <Grid container spacing={0.5}>
              {row.map((cell, j) => (
                <Grid key={`${i}-${j}`} item>
                  <Tooltip title={`Asset ${i+1} vs Asset ${j+1}: ${cell.toFixed(2)}`}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        backgroundColor: getColor(cell),
                        opacity: Math.abs(cell),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          transition: 'transform 0.2s',
                        },
                      }}
                    >
                      <Typography variant="caption" sx={{ color: 'white' }}>
                        {cell.toFixed(1)}
                      </Typography>
                    </Box>
                  </Tooltip>
                </Grid>
              ))}
            </Grid>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// Main Risk Dashboard Component
const RiskDashboard: React.FC = () => {
  const theme = useTheme();
  const { walletAddress, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [timeframe, setTimeframe] = useState('1D');
  const [selectedPortfolio, setSelectedPortfolio] = useState(walletAddress || '0x1234567890123456789012345678901234567890');
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalMetric[]>([]);
  const [socket, setSocket] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Update portfolio when wallet address changes
  useEffect(() => {
    if (walletAddress) {
      setSelectedPortfolio(walletAddress);
    }
  }, [walletAddress]);
  
  // Fetch risk metrics
  const fetchRiskMetrics = useCallback(async () => {
    if (!selectedPortfolio) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setApiError(null);
    try {
      // Call risk service directly (port 8001)
      const response = await fetch(`http://localhost:8001/api/v2/risk/portfolio/${selectedPortfolio}`);
      if (!response.ok) {
        throw new Error(`Risk service unavailable (HTTP ${response.status})`);
      }
      const data = await response.json();
      // Risk service returns data directly, not wrapped in { success, data }
      setRiskMetrics(data);
    } catch (error) {
      console.error('Failed to fetch risk metrics:', error);
      setApiError(error instanceof Error ? error.message : 'Failed to connect to risk service');
      // Keep any existing metrics on error
    } finally {
      setLoading(false);
    }
  }, [selectedPortfolio]);
  
  // Fetch risk alerts
  const fetchRiskAlerts = useCallback(async () => {
    try {
      // Call risk service directly (port 8001)
      const response = await fetch(`http://localhost:8001/api/v2/risk/alerts/${selectedPortfolio}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      // Risk service returns alerts array directly
      setRiskAlerts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch risk alerts:', error);
      setRiskAlerts([]);
    }
  }, [selectedPortfolio]);
  
  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io('ws://localhost:8001', {
      transports: ['websocket'],
    });
    
    newSocket.on('connect', () => {
      console.log('Connected to Risk Service WebSocket');
    });
    
    newSocket.on('risk-update', (metrics: RiskMetrics) => {
      if (metrics.portfolioAddress === selectedPortfolio) {
        setRiskMetrics(metrics);
      }
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, [selectedPortfolio]);
  
  // Fetch data on component mount and portfolio change
  useEffect(() => {
    if (!selectedPortfolio) return;
    
    fetchRiskMetrics();
    fetchRiskAlerts();
    
    // TODO PHASE 5: Fetch historical data from risk service
    // For now, generate mock historical data (risk service may not provide historical endpoint yet)
    const mockHistorical: HistoricalMetric[] = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      mockHistorical.push({
        date: date.toISOString().split('T')[0],
        var95: 0.05 + Math.random() * 0.05,
        sharpeRatio: 0.8 + Math.random() * 0.4,
        volatility: 0.15 + Math.random() * 0.1,
      });
    }
    setHistoricalData(mockHistorical);
  }, [selectedPortfolio, fetchRiskMetrics, fetchRiskAlerts]);
  
  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Risk Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Portfolio: ${selectedPortfolio}`, 20, 35);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 45);
    
    if (riskMetrics) {
      doc.text(`VaR (95%): ${riskMetrics.var95.toFixed(4)}`, 20, 60);
      doc.text(`Sharpe Ratio: ${riskMetrics.sharpeRatio.toFixed(2)}`, 20, 70);
      doc.text(`Max Drawdown: ${riskMetrics.maxDrawdown.toFixed(4)}`, 20, 80);
      doc.text(`Risk Grade: ${riskMetrics.riskGrade}`, 20, 90);
    }
    
    doc.save('risk-report.pdf');
  };
  
  // Export to Excel
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet([riskMetrics]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Risk Metrics');
    
    // Add historical data
    const wsHistory = XLSX.utils.json_to_sheet(historicalData);
    XLSX.utils.book_append_sheet(wb, wsHistory, 'Historical Data');
    
    XLSX.writeFile(wb, 'risk-report.xlsx');
  };
  
  // Get risk grade color
  const getRiskGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return theme.palette.success.main;
      case 'B': return theme.palette.info.main;
      case 'C': return theme.palette.warning.main;
      case 'D': return theme.palette.warning.dark;
      case 'F': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };
  
  // Mock data for visualizations
  const mockRiskMetrics: RiskMetrics = riskMetrics || {
    portfolioAddress: selectedPortfolio,
    var95: 0.0823,
    var99: 0.1245,
    expectedShortfall: 0.1567,
    sharpeRatio: 1.24,
    sortinoRatio: 1.56,
    maxDrawdown: 0.1834,
    beta: 0.95,
    alpha: 0.02,
    volatility: 0.2145,
    correlationMatrix: [
      [1.00, 0.65, 0.32, 0.18],
      [0.65, 1.00, 0.45, 0.22],
      [0.32, 0.45, 1.00, 0.38],
      [0.18, 0.22, 0.38, 1.00],
    ],
    liquidityScores: {
      '0xAsset1': 85,
      '0xAsset2': 72,
      '0xAsset3': 93,
      '0xAsset4': 68,
    },
    concentrationRisk: 0.35,
    leverageRatio: 1.5,
    riskGrade: 'B',
    timestamp: new Date().toISOString(),
  };
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Risk Management Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Real-time portfolio risk metrics and monitoring
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={timeframe}
              label="Timeframe"
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <MenuItem value="1D">1 Day</MenuItem>
              <MenuItem value="1W">1 Week</MenuItem>
              <MenuItem value="1M">1 Month</MenuItem>
              <MenuItem value="3M">3 Months</MenuItem>
              <MenuItem value="1Y">1 Year</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchRiskMetrics}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportToPDF}
          >
            Export PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportToExcel}
          >
            Export Excel
          </Button>
        </Box>
      </Box>
      
      {/* Loading State */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      
      {/* API Connection Error */}
      {apiError && !loading && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setApiError(null)}>
          <AlertTitle>Risk Service Connection Issue</AlertTitle>
          {apiError}. Please ensure the risk service is running on port 8001.
        </Alert>
      )}
      
      {/* Wallet Not Connected */}
      {!walletAddress && !loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <AlertTitle>Wallet Not Connected</AlertTitle>
          Please connect your wallet to view your portfolio risk metrics.
        </Alert>
      )}
      
      {/* Risk Alerts */}
      {riskAlerts.length > 0 && (
        <Box mb={3}>
          {riskAlerts.slice(0, 3).map((alert) => (
            <Alert 
              key={alert.id} 
              severity={alert.severity.toLowerCase() as any}
              sx={{ mb: 1 }}
            >
              <AlertTitle>{alert.alertType}</AlertTitle>
              {alert.message}
            </Alert>
          ))}
        </Box>
      )}
      
      {/* Key Metrics Grid */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={2}>
          <RiskMetricCard
            title="VaR (95%)"
            value={mockRiskMetrics.var95}
            unit="%"
            color="warning"
            trend={mockRiskMetrics.var95 > 0.08 ? 'up' : 'down'}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <RiskMetricCard
            title="Sharpe Ratio"
            value={mockRiskMetrics.sharpeRatio}
            color="success"
            trend={mockRiskMetrics.sharpeRatio > 1.0 ? 'up' : 'down'}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <RiskMetricCard
            title="Max Drawdown"
            value={mockRiskMetrics.maxDrawdown}
            unit="%"
            color="error"
            trend="neutral"
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <RiskMetricCard
            title="Volatility"
            value={mockRiskMetrics.volatility}
            unit="%"
            color="info"
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <RiskMetricCard
            title="Beta"
            value={mockRiskMetrics.beta}
            color="info"
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <Box display="flex" flexDirection="column" alignItems="center">
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Risk Grade
            </Typography>
            <Chip
              label={mockRiskMetrics.riskGrade}
              sx={{
                backgroundColor: getRiskGradeColor(mockRiskMetrics.riskGrade),
                color: 'white',
                fontSize: '1.5rem',
                height: 60,
                width: 60,
                borderRadius: '50%',
              }}
            />
          </Box>
        </Grid>
      </Grid>
      
      {/* Tabbed Content */}
      <Paper sx={{ mt: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="Risk Overview" icon={<AssessmentIcon />} iconPosition="start" />
          <Tab label="VaR Analysis" icon={<SecurityIcon />} iconPosition="start" />
          <Tab label="Correlations" icon={<SettingsIcon />} iconPosition="start" />
          <Tab label="Risk Limits" icon={<WarningIcon />} iconPosition="start" />
        </Tabs>
        
        <Box p={3}>
          {/* Risk Overview Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom>
                  Risk Metrics Trend
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="var95" 
                      stroke={theme.palette.error.main} 
                      name="VaR 95%"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sharpeRatio" 
                      stroke={theme.palette.success.main} 
                      name="Sharpe Ratio"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="volatility" 
                      stroke={theme.palette.warning.main} 
                      name="Volatility"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom>
                  Liquidity Scores
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={Object.entries(mockRiskMetrics.liquidityScores).map(([asset, score]) => ({
                    asset: asset.slice(0, 8),
                    score,
                  }))}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="asset" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar 
                      name="Liquidity" 
                      dataKey="score" 
                      stroke={theme.palette.primary.main} 
                      fill={theme.palette.primary.light} 
                      fillOpacity={0.6} 
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Grid>
            </Grid>
          )}
          
          {/* VaR Analysis Tab */}
          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Value at Risk Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { confidence: '95%', value: mockRiskMetrics.var95 },
                    { confidence: '99%', value: mockRiskMetrics.var99 },
                    { confidence: 'ES', value: mockRiskMetrics.expectedShortfall },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="confidence" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="value" fill={theme.palette.error.main}>
                      <Cell fill={theme.palette.warning.main} />
                      <Cell fill={theme.palette.error.light} />
                      <Cell fill={theme.palette.error.dark} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Risk Metrics Comparison
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={[
                    { metric: 'VaR', value: mockRiskMetrics.var95 * 100 },
                    { metric: 'Sharpe', value: mockRiskMetrics.sharpeRatio * 25 },
                    { metric: 'Sortino', value: mockRiskMetrics.sortinoRatio * 20 },
                    { metric: 'Beta', value: mockRiskMetrics.beta * 50 },
                    { metric: 'Alpha', value: mockRiskMetrics.alpha * 500 },
                    { metric: 'Volatility', value: mockRiskMetrics.volatility * 100 },
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis />
                    <Radar 
                      name="Current" 
                      dataKey="value" 
                      stroke={theme.palette.primary.main} 
                      fill={theme.palette.primary.main} 
                      fillOpacity={0.6} 
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Grid>
            </Grid>
          )}
          
          {/* Correlations Tab */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Asset Correlation Matrix
              </Typography>
              <CorrelationHeatmap matrix={mockRiskMetrics.correlationMatrix} />
              <Box mt={3}>
                <Typography variant="body2" color="textSecondary">
                  Correlation values range from -1 (negative correlation) to 1 (positive correlation).
                  High positive correlations indicate assets that move together, increasing portfolio risk.
                </Typography>
              </Box>
            </Box>
          )}
          
          {/* Risk Limits Tab */}
          {activeTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Risk Limit Monitoring
                </Typography>
                <Box>
                  {[
                    { metric: 'VaR (95%)', current: mockRiskMetrics.var95, limit: 0.10, unit: '%' },
                    { metric: 'Max Drawdown', current: mockRiskMetrics.maxDrawdown, limit: 0.20, unit: '%' },
                    { metric: 'Concentration Risk', current: mockRiskMetrics.concentrationRisk, limit: 0.40, unit: '%' },
                    { metric: 'Leverage Ratio', current: mockRiskMetrics.leverageRatio, limit: 2.0, unit: 'x' },
                  ].map((item) => (
                    <Box key={item.metric} mb={3}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">{item.metric}</Typography>
                        <Typography variant="body2">
                          {(item.current * (item.unit === '%' ? 100 : 1)).toFixed(2)}{item.unit} / {(item.limit * (item.unit === '%' ? 100 : 1)).toFixed(2)}{item.unit}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min((item.current / item.limit) * 100, 100)}
                        color={item.current > item.limit * 0.8 ? 'error' : 'success'}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default RiskDashboard;
