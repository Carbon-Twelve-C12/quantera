import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Breadcrumbs,
  Link,
  Card,
  CardContent,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
  ChevronDown,
  AlertTriangle
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

const WarningBox = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'dark' 
    ? 'rgba(255, 152, 0, 0.2)' 
    : 'rgba(255, 152, 0, 0.1)',
  border: theme.palette.mode === 'dark' 
    ? '1px solid rgba(255, 152, 0, 0.4)' 
    : '1px solid rgba(255, 152, 0, 0.2)',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
}));

export const SmartContractsPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>('overview');

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

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
              Smart Contracts
            </Typography>
          </Breadcrumbs>
        </BreadcrumbContainer>

        {/* Page Header */}
        <PageTitle>Smart Contracts</PageTitle>
        <PageSubtitle>
          Technical documentation for Quantera's smart contract architecture and blockchain infrastructure.
        </PageSubtitle>

        <WarningBox>
          <AlertTriangle size={20} color="#ff9800" />
          <Box>
            <Typography variant="body2" sx={{ 
              fontWeight: 600, 
              marginBottom: '4px',
              color: theme.palette.mode === 'dark' ? '#ffffff' : '#263238'
            }}>
              Development Status
            </Typography>
            <Typography variant="body2" sx={{ 
              color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#607d8b' 
            }}>
              Smart contracts are currently in development. This documentation outlines the planned 
              architecture and will be updated as development progresses.
            </Typography>
          </Box>
        </WarningBox>

        {/* Overview */}
        <Accordion 
          expanded={expandedAccordion === 'overview'} 
          onChange={handleAccordionChange('overview')}
          sx={{ marginBottom: '16px' }}
        >
          <AccordionSummary expandIcon={<ChevronDown />}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Architecture Overview</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" sx={{ 
              color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#455a64', 
              lineHeight: 1.7, 
              marginBottom: '24px' 
            }}>
              Quantera's smart contract architecture will be built on a modular design that supports 
              the platform's core features including asset tokenization, marketplace functionality, 
              portfolio management, yield generation, and liquidity provision.
            </Typography>

            <SectionTitle sx={{ marginTop: '24px', fontSize: '1.25rem' }}>Planned Contract Modules</SectionTitle>
            <List>
              <ListItem>
                <ListItemIcon><CheckCircle size={20} color="#4caf50" /></ListItemIcon>
                <ListItemText 
                  primary="Asset Tokenization Contracts" 
                  secondary="ERC-3643 compliant tokens for real-world asset representation"
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
                  primary="Marketplace Contracts" 
                  secondary="Decentralized marketplace for asset trading and discovery"
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
                  primary="Portfolio Management" 
                  secondary="Smart contracts for portfolio tracking and management"
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
                  primary="Yield Generation" 
                  secondary="DeFi protocols for generating yield on tokenized assets"
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
                  primary="Liquidity Provision" 
                  secondary="Automated market makers and liquidity pools"
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
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ margin: '40px 0' }} />

        {/* Next Steps */}
        <SectionTitle>Related Documentation</SectionTitle>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              cursor: 'pointer', 
              '&:hover': { boxShadow: 3 },
              background: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
              border: theme.palette.mode === 'dark' 
                ? '1px solid rgba(255, 255, 255, 0.1)' 
                : '1px solid rgba(26, 35, 126, 0.08)'
            }} onClick={() => navigate('/docs/overview')}>
              <CardContent>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  marginBottom: '8px',
                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#263238'
                }}>
                  Project Overview
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#607d8b' 
                }}>
                  Learn about Quantera's platform architecture and core principles
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
                  Platform Features
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#607d8b' 
                }}>
                  Comprehensive guide to all platform features and capabilities
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DocumentationContainer>
    </Box>
  );
}; 