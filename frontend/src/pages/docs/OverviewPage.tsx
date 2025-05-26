import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Breadcrumbs,
  Link,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { 
  Home,
  ArrowRight,
  CheckCircle,
  Shield,
  Globe,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DocumentationContainer = styled(Container)({
  padding: '40px 0 80px',
  maxWidth: '1200px',
});

const BreadcrumbContainer = styled(Box)(({ theme }) => ({
  padding: '20px 0',
  borderBottom: theme.palette.mode === 'dark' 
    ? '1px solid rgba(255, 255, 255, 0.1)' 
    : '1px solid rgba(26, 35, 126, 0.1)',
  marginBottom: '40px',
}));

const PageTitle = styled(Typography)(({ theme }) => ({
  fontSize: '2.5rem',
  fontWeight: 700,
  color: theme.palette.mode === 'dark' ? '#ffffff' : '#263238',
  marginBottom: '16px',
  fontFamily: 'Inter, sans-serif',
}));

const PageSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.125rem',
  color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#607d8b',
  lineHeight: 1.6,
  marginBottom: '40px',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.5rem',
  fontWeight: 600,
  color: theme.palette.mode === 'dark' ? '#ffffff' : '#263238',
  marginBottom: '16px',
  marginTop: '40px',
  fontFamily: 'Inter, sans-serif',
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
  borderRadius: '8px',
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
    : '0 2px 8px rgba(26, 35, 126, 0.06)',
  border: theme.palette.mode === 'dark' 
    ? '1px solid rgba(255, 255, 255, 0.1)' 
    : '1px solid rgba(26, 35, 126, 0.08)',
  height: '100%',
}));

const FeatureIcon = styled(Box)({
  width: '40px',
  height: '40px',
  borderRadius: '8px',
  background: 'linear-gradient(135deg, #1A5276 0%, #3498DB 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '12px',
  color: '#ffffff',
});

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const coreFeatures = [
    {
      icon: <Shield size={20} />,
      title: 'Regulatory Compliance',
      description: 'ERC-3643 implementation with multi-jurisdiction support for global compliance standards.'
    },
    {
      icon: <Globe size={20} />,
      title: 'Multi-Chain Native',
      description: 'Native support for 5+ blockchain networks with seamless cross-chain interoperability.'
    },
    {
      icon: <TrendingUp size={20} />,
      title: 'Advanced Services',
      description: 'Prime brokerage, cross-margining, and sophisticated risk management tools.'
    },
    {
      icon: <Users size={20} />,
      title: 'Enterprise Ready',
      description: 'Built for institutional adoption with bank-grade security and performance.'
    },
    {
      icon: <Zap size={20} />,
      title: 'High Performance',
      description: '10,000+ TPS capability with sub-200ms API response times and 99.9% uptime.'
    },
    {
      icon: <CheckCircle size={20} />,
      title: 'Audit Ready',
      description: 'Multiple third-party security audits and comprehensive compliance monitoring.'
    }
  ];

  return (
    <Box>
      <DocumentationContainer>
        {/* Breadcrumbs */}
        <BreadcrumbContainer>
          <Breadcrumbs separator={<ArrowRight size={16} />}>
            <Link 
              color="inherit" 
              href="/docs" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                textDecoration: 'none', 
                color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#607d8b' 
              }}
            >
              <Home size={16} style={{ marginRight: '4px' }} />
              Documentation
            </Link>
            <Typography color="text.primary" sx={{ color: '#3498DB', fontWeight: 600 }}>
              Project Overview
            </Typography>
          </Breadcrumbs>
        </BreadcrumbContainer>

        {/* Page Header */}
        <PageTitle>Project Overview</PageTitle>
        <PageSubtitle>
          Quantera is a next-generation asset tokenization platform designed for institutional adoption. 
          Built with regulatory compliance, security, and cross-chain interoperability at its core.
        </PageSubtitle>

        {/* Introduction */}
        <SectionTitle>Introduction</SectionTitle>
        <Typography variant="body1" sx={{ 
          color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#455a64', 
          lineHeight: 1.7, 
          marginBottom: '24px' 
        }}>
          Quantera represents the evolution of asset tokenization, providing a comprehensive platform that bridges 
          traditional finance with decentralized technologies. Our platform enables the tokenization of real-world 
          assets while maintaining full regulatory compliance across multiple jurisdictions.
        </Typography>

        <Typography variant="body1" sx={{ 
          color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#455a64', 
          lineHeight: 1.7, 
          marginBottom: '24px' 
        }}>
          The platform is built on a foundation of security, compliance, and interoperability, making it suitable 
          for institutional adoption at scale. With support for multiple blockchain networks and advanced features 
          like prime brokerage and cross-margining, Quantera provides the infrastructure needed for the next 
          generation of financial services.
        </Typography>

        {/* Architecture Principles */}
        <SectionTitle>Architecture Principles</SectionTitle>
        <List sx={{ marginBottom: '32px' }}>
          <ListItem>
            <ListItemIcon><CheckCircle size={20} color="#4caf50" /></ListItemIcon>
            <ListItemText 
              primary="Security First" 
              secondary="Multi-layer security architecture with formal verification and continuous monitoring"
              sx={{
                '& .MuiListItemText-primary': {
                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#263238'
                },
                '& .MuiListItemText-secondary': {
                  color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#607d8b'
                }
              }}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckCircle size={20} color="#4caf50" /></ListItemIcon>
            <ListItemText 
              primary="Regulatory Compliance" 
              secondary="Built-in compliance features supporting global regulatory frameworks"
              sx={{
                '& .MuiListItemText-primary': {
                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#263238'
                },
                '& .MuiListItemText-secondary': {
                  color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#607d8b'
                }
              }}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckCircle size={20} color="#4caf50" /></ListItemIcon>
            <ListItemText 
              primary="Interoperability" 
              secondary="Native multi-chain support with seamless cross-chain asset transfers"
              sx={{
                '& .MuiListItemText-primary': {
                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#263238'
                },
                '& .MuiListItemText-secondary': {
                  color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#607d8b'
                }
              }}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckCircle size={20} color="#4caf50" /></ListItemIcon>
            <ListItemText 
              primary="Scalability" 
              secondary="High-performance architecture capable of handling institutional-scale volumes"
              sx={{
                '& .MuiListItemText-primary': {
                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#263238'
                },
                '& .MuiListItemText-secondary': {
                  color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#607d8b'
                }
              }}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckCircle size={20} color="#4caf50" /></ListItemIcon>
            <ListItemText 
              primary="Modularity" 
              secondary="Modular design allowing for easy integration and customization"
              sx={{
                '& .MuiListItemText-primary': {
                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#263238'
                },
                '& .MuiListItemText-secondary': {
                  color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#607d8b'
                }
              }}
            />
          </ListItem>
        </List>

        {/* Core Features */}
        <SectionTitle>Core Features</SectionTitle>
        <Grid container spacing={3} sx={{ marginBottom: '40px' }}>
          {coreFeatures.map((feature, index) => (
            <Grid item xs={12} md={6} key={index}>
              <FeatureCard>
                <CardContent sx={{ padding: '20px' }}>
                  <FeatureIcon>
                    {feature.icon}
                  </FeatureIcon>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600, 
                    marginBottom: '8px', 
                    color: theme.palette.mode === 'dark' ? '#ffffff' : '#263238' 
                  }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#607d8b', 
                    lineHeight: 1.5 
                  }}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </FeatureCard>
            </Grid>
          ))}
        </Grid>

        {/* Market Opportunity */}
        <SectionTitle>Market Opportunity</SectionTitle>
        <Typography variant="body1" sx={{ 
          color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#455a64', 
          lineHeight: 1.7, 
          marginBottom: '24px' 
        }}>
          The global asset tokenization market is projected to reach $16.1 trillion by 2030, driven by increasing 
          institutional adoption and regulatory clarity. Quantera is positioned to capture a significant portion 
          of this market through its comprehensive platform approach.
        </Typography>

        <Grid container spacing={3} sx={{ marginBottom: '40px' }}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', padding: '20px' }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#3498DB', marginBottom: '8px' }}>
                $16.1T
              </Typography>
              <Typography variant="body2" sx={{ 
                color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#607d8b' 
              }}>
                Market Opportunity by 2030
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', padding: '20px' }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#3498DB', marginBottom: '8px' }}>
                5+
              </Typography>
              <Typography variant="body2" sx={{ 
                color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#607d8b' 
              }}>
                Supported Blockchain Networks
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', padding: '20px' }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#3498DB', marginBottom: '8px' }}>
                99.9%
              </Typography>
              <Typography variant="body2" sx={{ 
                color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#607d8b' 
              }}>
                Platform Uptime SLA
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ margin: '40px 0' }} />

        {/* Next Steps */}
        <SectionTitle>Next Steps</SectionTitle>
        <Typography variant="body1" sx={{ 
          color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#455a64', 
          lineHeight: 1.7, 
          marginBottom: '24px' 
        }}>
          Ready to learn more about Quantera? Explore our comprehensive documentation:
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              cursor: 'pointer', 
              '&:hover': { boxShadow: 3 },
              background: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
              border: theme.palette.mode === 'dark' 
                ? '1px solid rgba(255, 255, 255, 0.1)' 
                : '1px solid rgba(26, 35, 126, 0.08)'
            }} onClick={() => navigate('/docs/smart-contracts')}>
              <CardContent>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  marginBottom: '8px',
                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#263238'
                }}>
                  Smart Contracts
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#607d8b' 
                }}>
                  Comprehensive smart contract documentation with implementation details
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              cursor: 'pointer', 
              '&:hover': { boxShadow: 3 },
              background: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
              border: theme.palette.mode === 'dark' 
                ? '1px solid rgba(255, 255, 255, 0.1)' 
                : '1px solid rgba(26, 35, 126, 0.08)'
            }} onClick={() => navigate('/docs/placeholder')}>
              <CardContent>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  marginBottom: '8px',
                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#263238'
                }}>
                  Developer Guide
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#607d8b' 
                }}>
                  Get started building on Quantera with our comprehensive developer resources
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DocumentationContainer>
    </Box>
  );
}; 