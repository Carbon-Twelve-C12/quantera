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
  Chip,
  Divider,
  Button
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { 
  Home,
  ArrowRight,
  CheckCircle,
  ShoppingCart,
  PlusCircle,
  PieChart,
  TrendingUp,
  Droplets,
  ChevronDown,
  Info,
  BarChart3,
  Wallet
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

const InfoBox = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'dark' 
    ? 'rgba(33, 150, 243, 0.2)' 
    : 'rgba(33, 150, 243, 0.1)',
  border: theme.palette.mode === 'dark' 
    ? '1px solid rgba(33, 150, 243, 0.4)' 
    : '1px solid rgba(33, 150, 243, 0.2)',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
}));

export const PlatformFeaturesPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>('marketplace');

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  const coreFeatures = [
    {
      icon: <ShoppingCart size={20} />,
      title: 'Asset Marketplace',
      description: 'Discover, browse, and trade tokenized real-world assets with advanced filtering and search capabilities.',
      status: 'Live'
    },
    {
      icon: <PlusCircle size={20} />,
      title: 'Asset Creation',
      description: 'Tokenize real-world assets with our guided creation flow and compliance verification.',
      status: 'Live'
    },
    {
      icon: <PieChart size={20} />,
      title: 'Portfolio Management',
      description: 'Track and manage your tokenized asset portfolio with real-time analytics and performance metrics.',
      status: 'Live'
    },
    {
      icon: <TrendingUp size={20} />,
      title: 'Yield Generation',
      description: 'Earn yield on your tokenized assets through various DeFi protocols and strategies.',
      status: 'Live'
    },
    {
      icon: <Droplets size={20} />,
      title: 'Liquidity Provision',
      description: 'Provide liquidity to asset pools and earn rewards while supporting market efficiency.',
      status: 'Live'
    },
    {
      icon: <BarChart3 size={20} />,
      title: 'Analytics Dashboard',
      description: 'Comprehensive analytics and insights for your assets, portfolio performance, and market trends.',
      status: 'Live'
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
              Platform Features
            </Typography>
          </Breadcrumbs>
        </BreadcrumbContainer>

        {/* Page Header */}
        <PageTitle>Platform Features</PageTitle>
        <PageSubtitle>
          Comprehensive guide to all Quantera platform features and capabilities. Learn how to use 
          each feature to maximize your asset tokenization and investment experience.
        </PageSubtitle>

        <InfoBox>
          <Info size={20} color="#2196f3" />
          <Box>
            <Typography variant="body2" sx={{ 
              fontWeight: 600, 
              marginBottom: '4px',
              color: theme.palette.mode === 'dark' ? '#ffffff' : '#263238'
            }}>
              Platform Status: Live
            </Typography>
            <Typography variant="body2" sx={{ 
              color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#607d8b' 
            }}>
              All core platform features are live and available for use. New features are continuously 
              being added based on user feedback and market needs.
            </Typography>
          </Box>
        </InfoBox>

        {/* Core Features Overview */}
        <SectionTitle>Core Features Overview</SectionTitle>
        <Grid container spacing={3} sx={{ marginBottom: '40px' }}>
          {coreFeatures.map((feature, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <FeatureCard>
                <CardContent sx={{ padding: '20px' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <FeatureIcon>
                      {feature.icon}
                    </FeatureIcon>
                    <Chip 
                      label={feature.status} 
                      size="small" 
                      sx={{ 
                        background: '#e8f5e8', 
                        color: '#2e7d32',
                        fontWeight: 600
                      }} 
                    />
                  </Box>
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

        {/* Detailed Feature Documentation */}
        
        {/* Asset Marketplace */}
        <Accordion 
          expanded={expandedAccordion === 'marketplace'} 
          onChange={handleAccordionChange('marketplace')}
          sx={{ marginBottom: '16px' }}
        >
          <AccordionSummary expandIcon={<ChevronDown />}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Asset Marketplace</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" sx={{ 
              color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#455a64', 
              lineHeight: 1.7, 
              marginBottom: '24px' 
            }}>
              The Quantera marketplace is your gateway to discovering and trading tokenized real-world assets. 
              Browse through a curated selection of assets across multiple categories including real estate, 
              commodities, art, and more.
            </Typography>

            <SectionTitle sx={{ fontSize: '1.25rem' }}>Key Features</SectionTitle>
            <List sx={{ marginBottom: '24px' }}>
              <ListItem>
                <ListItemIcon><CheckCircle size={20} color="#4caf50" /></ListItemIcon>
                <ListItemText 
                  primary="Advanced Search & Filtering" 
                  secondary="Filter assets by category, price range, yield potential, risk level, and geographic location"
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
                  primary="Detailed Asset Information" 
                  secondary="Comprehensive asset details including documentation, compliance status, and performance history"
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
                  primary="Instant Trading" 
                  secondary="Buy and sell asset tokens instantly with competitive pricing and low fees"
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
                  primary="Watchlist & Favorites" 
                  secondary="Save assets to your watchlist and track price movements and updates"
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

            <SectionTitle sx={{ fontSize: '1.25rem' }}>How to Use the Marketplace</SectionTitle>
            <Typography variant="body1" sx={{ 
              color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#455a64', 
              lineHeight: 1.7, 
              marginBottom: '16px' 
            }}>
              1. <strong>Browse Assets:</strong> Navigate to the marketplace from the main navigation menu
            </Typography>
            <Typography variant="body1" sx={{ 
              color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#455a64', 
              lineHeight: 1.7, 
              marginBottom: '16px' 
            }}>
              2. <strong>Filter & Search:</strong> Use the search bar and filters to find assets that match your criteria
            </Typography>
            <Typography variant="body1" sx={{ 
              color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#455a64', 
              lineHeight: 1.7, 
              marginBottom: '16px' 
            }}>
              3. <strong>Review Details:</strong> Click on any asset to view detailed information, documentation, and performance data
            </Typography>
            <Typography variant="body1" sx={{ 
              color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#455a64', 
              lineHeight: 1.7, 
              marginBottom: '24px' 
            }}>
              4. <strong>Make Purchase:</strong> Connect your wallet and purchase asset tokens directly through the platform
            </Typography>
          </AccordionDetails>
        </Accordion>

        {/* Asset Creation */}
        <Accordion 
          expanded={expandedAccordion === 'creation'} 
          onChange={handleAccordionChange('creation')}
          sx={{ marginBottom: '16px' }}
        >
          <AccordionSummary expandIcon={<ChevronDown />}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Asset Creation & Tokenization</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" sx={{ 
              color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#455a64', 
              lineHeight: 1.7, 
              marginBottom: '24px' 
            }}>
              Transform your real-world assets into tradeable digital tokens with Quantera's guided asset 
              creation process. Our platform handles the technical complexity while ensuring full regulatory compliance.
            </Typography>

            <SectionTitle sx={{ fontSize: '1.25rem' }}>Supported Asset Types</SectionTitle>
            <List sx={{ marginBottom: '24px' }}>
              <ListItem>
                <ListItemIcon><CheckCircle size={20} color="#4caf50" /></ListItemIcon>
                <ListItemText 
                  primary="Real Estate" 
                  secondary="Residential, commercial, and industrial properties"
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
                  primary="Commodities" 
                  secondary="Precious metals, agricultural products, and energy resources"
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
                  primary="Art & Collectibles" 
                  secondary="Fine art, rare collectibles, and luxury items"
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
                  primary="Business Assets" 
                  secondary="Equipment, intellectual property, and revenue streams"
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

            <SectionTitle sx={{ fontSize: '1.25rem' }}>Creation Process</SectionTitle>
            <Typography variant="body1" sx={{ 
              color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#455a64', 
              lineHeight: 1.7, 
              marginBottom: '16px' 
            }}>
              1. <strong>Asset Information:</strong> Provide detailed information about your asset including valuation, documentation, and legal status
            </Typography>
            <Typography variant="body1" sx={{ 
              color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#455a64', 
              lineHeight: 1.7, 
              marginBottom: '16px' 
            }}>
              2. <strong>Compliance Verification:</strong> Our team reviews your submission for regulatory compliance and authenticity
            </Typography>
            <Typography variant="body1" sx={{ 
              color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#455a64', 
              lineHeight: 1.7, 
              marginBottom: '16px' 
            }}>
              3. <strong>Token Configuration:</strong> Set token parameters including supply, pricing, and distribution rules
            </Typography>
            <Typography variant="body1" sx={{ 
              color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#455a64', 
              lineHeight: 1.7, 
              marginBottom: '24px' 
            }}>
              4. <strong>Launch:</strong> Your tokenized asset goes live on the marketplace for trading
            </Typography>
          </AccordionDetails>
        </Accordion>

        {/* Portfolio Management */}
        <Accordion 
          expanded={expandedAccordion === 'portfolio'} 
          onChange={handleAccordionChange('portfolio')}
          sx={{ marginBottom: '16px' }}
        >
          <AccordionSummary expandIcon={<ChevronDown />}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Portfolio Management</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" sx={{ 
              color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#455a64', 
              lineHeight: 1.7, 
              marginBottom: '24px' 
            }}>
              Track, analyze, and optimize your tokenized asset portfolio with comprehensive management tools 
              and real-time analytics. Get insights into performance, diversification, and risk exposure.
            </Typography>

            <SectionTitle sx={{ fontSize: '1.25rem' }}>Portfolio Features</SectionTitle>
            <List sx={{ marginBottom: '24px' }}>
              <ListItem>
                <ListItemIcon><PieChart size={20} color="#4caf50" /></ListItemIcon>
                <ListItemText 
                  primary="Asset Allocation Overview" 
                  secondary="Visual breakdown of your portfolio by asset type, geographic region, and risk level"
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
                <ListItemIcon><TrendingUp size={20} color="#4caf50" /></ListItemIcon>
                <ListItemText 
                  primary="Performance Analytics" 
                  secondary="Track returns, yield generation, and portfolio growth over time"
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
                <ListItemIcon><BarChart3 size={20} color="#4caf50" /></ListItemIcon>
                <ListItemText 
                  primary="Risk Assessment" 
                  secondary="Comprehensive risk analysis and diversification recommendations"
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
                <ListItemIcon><Wallet size={20} color="#4caf50" /></ListItemIcon>
                <ListItemText 
                  primary="Transaction History" 
                  secondary="Complete record of all trades, yields, and portfolio changes"
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

        {/* Yield Generation */}
        <Accordion 
          expanded={expandedAccordion === 'yield'} 
          onChange={handleAccordionChange('yield')}
          sx={{ marginBottom: '16px' }}
        >
          <AccordionSummary expandIcon={<ChevronDown />}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Yield Generation</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" sx={{ 
              color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#455a64', 
              lineHeight: 1.7, 
              marginBottom: '24px' 
            }}>
              Maximize returns on your tokenized assets through various yield generation strategies. 
              From rental income to DeFi protocols, discover multiple ways to earn passive income.
            </Typography>

            <SectionTitle sx={{ fontSize: '1.25rem' }}>Yield Strategies</SectionTitle>
            <List sx={{ marginBottom: '24px' }}>
              <ListItem>
                <ListItemIcon><CheckCircle size={20} color="#4caf50" /></ListItemIcon>
                <ListItemText 
                  primary="Asset-Based Income" 
                  secondary="Earn rental income from real estate tokens or royalties from intellectual property"
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
                  primary="Staking Rewards" 
                  secondary="Stake your tokens in various protocols to earn additional rewards"
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
                  primary="Lending Protocols" 
                  secondary="Lend your tokens to earn interest through secure DeFi lending platforms"
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
                  primary="Yield Farming" 
                  secondary="Participate in liquidity mining and yield farming opportunities"
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

        {/* Liquidity Provision */}
        <Accordion 
          expanded={expandedAccordion === 'liquidity'} 
          onChange={handleAccordionChange('liquidity')}
          sx={{ marginBottom: '16px' }}
        >
          <AccordionSummary expandIcon={<ChevronDown />}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Liquidity Provision</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" sx={{ 
              color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#455a64', 
              lineHeight: 1.7, 
              marginBottom: '24px' 
            }}>
              Provide liquidity to asset trading pairs and earn fees while supporting market efficiency. 
              Our automated market maker (AMM) system ensures fair pricing and deep liquidity.
            </Typography>

            <SectionTitle sx={{ fontSize: '1.25rem' }}>Liquidity Features</SectionTitle>
            <List sx={{ marginBottom: '24px' }}>
              <ListItem>
                <ListItemIcon><Droplets size={20} color="#4caf50" /></ListItemIcon>
                <ListItemText 
                  primary="Liquidity Pools" 
                  secondary="Add liquidity to trading pairs and earn a share of trading fees"
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
                <ListItemIcon><TrendingUp size={20} color="#4caf50" /></ListItemIcon>
                <ListItemText 
                  primary="Impermanent Loss Protection" 
                  secondary="Advanced algorithms to minimize impermanent loss risks"
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
                <ListItemIcon><BarChart3 size={20} color="#4caf50" /></ListItemIcon>
                <ListItemText 
                  primary="Liquidity Mining" 
                  secondary="Earn additional rewards through liquidity mining programs"
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

        {/* Getting Started */}
        <SectionTitle>Getting Started</SectionTitle>
        <Typography variant="body1" sx={{ 
          color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#455a64', 
          lineHeight: 1.7, 
          marginBottom: '24px' 
        }}>
          Ready to start using Quantera? Follow these steps to get started with the platform:
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
            }} onClick={() => navigate('/marketplace')}>
              <CardContent>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  marginBottom: '8px',
                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#263238'
                }}>
                  Explore the Marketplace
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#607d8b',
                  marginBottom: '16px'
                }}>
                  Browse available tokenized assets and start building your portfolio
                </Typography>
                <Button 
                  variant="contained" 
                  size="small"
                  sx={{
                    background: 'linear-gradient(135deg, #1A5276 0%, #3498DB 100%)',
                    textTransform: 'none'
                  }}
                >
                  Visit Marketplace
                </Button>
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
            }} onClick={() => navigate('/create-asset')}>
              <CardContent>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  marginBottom: '8px',
                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#263238'
                }}>
                  Create Your First Asset
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#607d8b',
                  marginBottom: '16px'
                }}>
                  Tokenize your real-world assets and make them tradeable
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small"
                  sx={{
                    borderColor: '#3498DB',
                    color: '#3498DB',
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#3498DB',
                      background: 'rgba(52, 152, 219, 0.04)',
                    },
                  }}
                >
                  Start Creating
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DocumentationContainer>
    </Box>
  );
}; 