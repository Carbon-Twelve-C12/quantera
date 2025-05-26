import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Chip
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { styled, useTheme } from '@mui/material/styles';
import { 
  ArrowLeft,
  CheckCircle,
  PieChart,
  TrendingUp,
  BarChart3,
  Target,
  Shield,
  Activity,
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PageHeader = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'dark' 
    ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
    : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
  padding: '60px 0 40px',
  borderBottom: theme.palette.mode === 'dark' 
    ? '1px solid rgba(255, 255, 255, 0.1)'
    : '1px solid rgba(0, 0, 0, 0.1)',
}));

const Breadcrumb = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '24px',
  color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#6c757d',
  fontSize: '0.875rem',
}));

const PageTitle = styled(Typography)(({ theme }) => ({
  fontSize: '2.5rem',
  fontWeight: 700,
  color: theme.palette.mode === 'dark' ? '#ffffff' : '#212529',
  marginBottom: '16px',
  fontFamily: 'Inter, sans-serif',
}));

const PageDescription = styled(Typography)(({ theme }) => ({
  fontSize: '1.125rem',
  color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#6c757d',
  lineHeight: 1.6,
  maxWidth: '800px',
}));

const ContentSection = styled(Container)({
  padding: '60px 0',
});

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.75rem',
  fontWeight: 600,
  color: theme.palette.mode === 'dark' ? '#ffffff' : '#212529',
  marginBottom: '24px',
  fontFamily: 'Inter, sans-serif',
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
  borderRadius: '12px',
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 2px 16px rgba(0, 0, 0, 0.3)' 
    : '0 2px 16px rgba(0, 0, 0, 0.1)',
  border: theme.palette.mode === 'dark' 
    ? '1px solid rgba(255, 255, 255, 0.1)' 
    : '1px solid rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  height: '100%',
  
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.palette.mode === 'dark' 
      ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
      : '0 8px 32px rgba(0, 0, 0, 0.15)',
  },
}));

const InfoCard = styled(Card)(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
  borderRadius: '12px',
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 2px 16px rgba(0, 0, 0, 0.3)' 
    : '0 2px 16px rgba(0, 0, 0, 0.1)',
  border: theme.palette.mode === 'dark' 
    ? '1px solid rgba(255, 255, 255, 0.1)' 
    : '1px solid rgba(0, 0, 0, 0.1)',
  marginBottom: '24px',
}));

export const PortfolioManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const portfolioFeatures = [
    {
      icon: <PieChart size={32} />,
      title: 'Asset Allocation',
      description: 'Visualize and optimize your portfolio distribution across different asset classes',
      features: [
        'Interactive allocation charts',
        'Target vs. actual allocation',
        'Rebalancing recommendations',
        'Sector diversification analysis'
      ]
    },
    {
      icon: <TrendingUp size={32} />,
      title: 'Performance Analytics',
      description: 'Track portfolio performance with comprehensive metrics and benchmarking',
      features: [
        'Real-time performance tracking',
        'Historical performance analysis',
        'Benchmark comparisons',
        'Risk-adjusted returns'
      ]
    },
    {
      icon: <BarChart3 size={32} />,
      title: 'Risk Assessment',
      description: 'Monitor and manage portfolio risk with advanced analytics',
      features: [
        'Value at Risk (VaR) calculations',
        'Correlation analysis',
        'Stress testing scenarios',
        'Risk concentration alerts'
      ]
    },
    {
      icon: <Activity size={32} />,
      title: 'Transaction History',
      description: 'Complete audit trail of all portfolio transactions and activities',
      features: [
        'Detailed transaction logs',
        'Cost basis tracking',
        'Tax reporting support',
        'Export capabilities'
      ]
    },
    {
      icon: <Target size={32} />,
      title: 'Goal Tracking',
      description: 'Set and monitor investment goals with progress tracking',
      features: [
        'Custom investment goals',
        'Progress monitoring',
        'Timeline projections',
        'Achievement notifications'
      ]
    },
    {
      icon: <Shield size={32} />,
      title: 'Compliance Monitoring',
      description: 'Ensure portfolio compliance with regulatory requirements',
      features: [
        'Regulatory compliance checks',
        'Investment limits monitoring',
        'Automated reporting',
        'Audit trail maintenance'
      ]
    }
  ];

  const analyticsTools = [
    {
      category: 'Performance Metrics',
      tools: [
        'Total Return Analysis',
        'Annualized Returns',
        'Sharpe Ratio Calculation',
        'Maximum Drawdown',
        'Alpha and Beta Analysis',
        'Information Ratio'
      ]
    },
    {
      category: 'Risk Metrics',
      tools: [
        'Portfolio Volatility',
        'Value at Risk (VaR)',
        'Conditional VaR',
        'Correlation Matrix',
        'Beta Analysis',
        'Tracking Error'
      ]
    },
    {
      category: 'Attribution Analysis',
      tools: [
        'Asset Allocation Attribution',
        'Security Selection Attribution',
        'Sector Attribution',
        'Geographic Attribution',
        'Currency Attribution',
        'Interaction Effects'
      ]
    }
  ];

  const reportingFeatures = [
    {
      title: 'Portfolio Summary Reports',
      description: 'Comprehensive overview of portfolio holdings and performance',
      frequency: 'Daily, Weekly, Monthly',
      format: 'PDF, Excel, CSV'
    },
    {
      title: 'Performance Reports',
      description: 'Detailed performance analysis with benchmarking',
      frequency: 'Monthly, Quarterly',
      format: 'PDF, Interactive Dashboard'
    },
    {
      title: 'Risk Reports',
      description: 'Risk assessment and compliance monitoring reports',
      frequency: 'Weekly, Monthly',
      format: 'PDF, Excel'
    },
    {
      title: 'Tax Reports',
      description: 'Tax-optimized reporting for regulatory compliance',
      frequency: 'Quarterly, Annual',
      format: 'PDF, CSV, Tax Software Integration'
    }
  ];

  return (
    <Box>
      {/* Page Header */}
      <PageHeader>
        <Container maxWidth="lg">
          <Breadcrumb>
            <Button
              startIcon={<ArrowLeft size={16} />}
              onClick={() => navigate('/docs')}
              sx={{ 
                color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#6c757d',
                textTransform: 'none',
                padding: 0,
                minWidth: 'auto'
              }}
            >
              Documentation
            </Button>
            <span>/</span>
            <span>Portfolio Management</span>
          </Breadcrumb>
          
          <PageTitle>Portfolio Management</PageTitle>
          <PageDescription>
            Comprehensive portfolio management tools for tracking, analyzing, and optimizing 
            your tokenized asset investments. Monitor performance, manage risk, and make 
            data-driven investment decisions.
          </PageDescription>
        </Container>
      </PageHeader>

      {/* Overview Section */}
      <ContentSection maxWidth="lg">
        <Alert 
          severity="info" 
          sx={{ 
            marginBottom: '40px',
            background: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.1)',
            border: theme.palette.mode === 'dark' ? '1px solid rgba(33, 150, 243, 0.3)' : '1px solid rgba(33, 150, 243, 0.3)',
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 600, marginBottom: '8px' }}>
            Advanced Portfolio Analytics
          </Typography>
          <Typography variant="body2">
            Access professional-grade portfolio management tools typically available only to 
            institutional investors. Track performance, manage risk, and optimize your tokenized asset portfolio.
          </Typography>
        </Alert>

        <SectionTitle>Portfolio Management Features</SectionTitle>
        <Grid container spacing={3} sx={{ marginBottom: '60px' }}>
          {portfolioFeatures.map((feature, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <FeatureCard>
                <CardContent sx={{ padding: '24px' }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '16px',
                    color: '#1a237e'
                  }}>
                    {feature.icon}
                    <Typography variant="h6" sx={{ 
                      marginLeft: '12px', 
                      fontWeight: 600,
                      color: theme.palette.mode === 'dark' ? '#ffffff' : '#212529'
                    }}>
                      {feature.title}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" sx={{ 
                    color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#6c757d',
                    marginBottom: '16px',
                    lineHeight: 1.5
                  }}>
                    {feature.description}
                  </Typography>

                  <List dense>
                    {feature.features.map((item, idx) => (
                      <ListItem key={idx} sx={{ paddingLeft: 0, paddingY: '2px' }}>
                        <ListItemIcon sx={{ minWidth: '24px' }}>
                          <CheckCircle size={14} color="#4caf50" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={item}
                          primaryTypographyProps={{
                            fontSize: '0.8rem',
                            color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#6c757d'
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </FeatureCard>
            </Grid>
          ))}
        </Grid>

        {/* Analytics Tools */}
        <SectionTitle>Analytics & Metrics</SectionTitle>
        <Grid container spacing={3} sx={{ marginBottom: '60px' }}>
          {analyticsTools.map((category, index) => (
            <Grid item xs={12} md={4} key={index}>
              <InfoCard>
                <CardContent sx={{ padding: '24px' }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    marginBottom: '16px',
                    color: theme.palette.mode === 'dark' ? '#ffffff' : '#212529'
                  }}>
                    {category.category}
                  </Typography>
                  <List dense>
                    {category.tools.map((tool, idx) => (
                      <ListItem key={idx} sx={{ paddingLeft: 0, paddingY: '2px' }}>
                        <ListItemIcon sx={{ minWidth: '24px' }}>
                          <CheckCircle size={14} color="#4caf50" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={tool}
                          primaryTypographyProps={{
                            fontSize: '0.875rem',
                            color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#6c757d'
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </InfoCard>
            </Grid>
          ))}
        </Grid>

        {/* Reporting & Export */}
        <SectionTitle>Reporting & Export</SectionTitle>
        <Grid container spacing={3} sx={{ marginBottom: '60px' }}>
          {reportingFeatures.map((report, index) => (
            <Grid item xs={12} md={6} key={index}>
              <InfoCard>
                <CardContent sx={{ padding: '24px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <Download size={20} color="#1a237e" />
                    <Typography variant="h6" sx={{ 
                      marginLeft: '8px',
                      fontWeight: 600,
                      color: theme.palette.mode === 'dark' ? '#ffffff' : '#212529'
                    }}>
                      {report.title}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" sx={{ 
                    color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#6c757d',
                    marginBottom: '16px',
                    lineHeight: 1.5
                  }}>
                    {report.description}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, marginBottom: '8px', flexWrap: 'wrap' }}>
                    <Chip 
                      label={`Frequency: ${report.frequency}`}
                      size="small" 
                      sx={{ 
                        background: theme.palette.mode === 'dark' ? 'rgba(26, 35, 126, 0.3)' : 'rgba(26, 35, 126, 0.1)',
                        color: theme.palette.mode === 'dark' ? '#ffffff' : '#1a237e',
                        fontSize: '0.75rem'
                      }} 
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={`Formats: ${report.format}`}
                      size="small" 
                      sx={{ 
                        background: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.1)',
                        color: theme.palette.mode === 'dark' ? '#ffffff' : '#4caf50',
                        fontSize: '0.75rem'
                      }} 
                    />
                  </Box>
                </CardContent>
              </InfoCard>
            </Grid>
          ))}
        </Grid>

        {/* Advanced Features */}
        <SectionTitle>Advanced Portfolio Features</SectionTitle>
        <InfoCard>
          <CardContent sx={{ padding: '32px' }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Automated Rebalancing
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Set target allocation percentages" />
                      </ListItem>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Automatic rebalancing triggers" />
                      </ListItem>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Tax-efficient rebalancing" />
                      </ListItem>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Custom rebalancing schedules" />
                      </ListItem>
                    </List>
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Risk Management
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Real-time risk monitoring" />
                      </ListItem>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Automated risk alerts" />
                      </ListItem>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Stress testing scenarios" />
                      </ListItem>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Correlation analysis" />
                      </ListItem>
                    </List>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              <Grid item xs={12} md={6}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Performance Attribution
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Asset allocation attribution" />
                      </ListItem>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Security selection analysis" />
                      </ListItem>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Sector and geographic attribution" />
                      </ListItem>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Interaction effects analysis" />
                      </ListItem>
                    </List>
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Tax Optimization
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Tax-loss harvesting" />
                      </ListItem>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Cost basis optimization" />
                      </ListItem>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Tax-efficient rebalancing" />
                      </ListItem>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Automated tax reporting" />
                      </ListItem>
                    </List>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            </Grid>
          </CardContent>
        </InfoCard>

        {/* Get Started */}
        <InfoCard>
          <CardContent sx={{ padding: '32px', textAlign: 'center' }}>
            <Typography variant="h5" sx={{ 
              fontWeight: 600,
              marginBottom: '16px',
              color: theme.palette.mode === 'dark' ? '#ffffff' : '#212529'
            }}>
              Start Managing Your Portfolio
            </Typography>
            <Typography variant="body1" sx={{ 
              color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#6c757d',
              marginBottom: '32px',
              maxWidth: '600px',
              margin: '0 auto 32px'
            }}>
              Access professional-grade portfolio management tools and take control of your 
              tokenized asset investments with advanced analytics and reporting.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/portfolio')}
                sx={{
                  background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)',
                  color: '#ffffff',
                  fontWeight: 600,
                  padding: '12px 32px',
                  textTransform: 'none',
                }}
              >
                View Portfolio Dashboard
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  borderColor: '#1a237e',
                  color: '#1a237e',
                  fontWeight: 600,
                  padding: '12px 32px',
                  textTransform: 'none',
                }}
              >
                Learn More
              </Button>
            </Box>
          </CardContent>
        </InfoCard>
      </ContentSection>
    </Box>
  );
}; 