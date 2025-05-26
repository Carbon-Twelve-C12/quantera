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
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { 
  Home,
  ArrowRight,
  CheckCircle,
  Search,
  Filter,
  TrendingUp,
  Shield,
  ChevronDown,
  Info,
  Eye,
  Heart,
  DollarSign,
  MapPin
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

const CodeBlock = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f8f9fa',
  border: theme.palette.mode === 'dark' 
    ? '1px solid rgba(255, 255, 255, 0.1)' 
    : '1px solid #e9ecef',
  borderRadius: '4px',
  padding: '16px',
  fontFamily: 'Monaco, Consolas, "Courier New", monospace',
  fontSize: '0.875rem',
  overflow: 'auto',
  marginBottom: '16px',
  color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#333333',
  whiteSpace: 'pre-line',
  lineHeight: 1.6,
}));

export const MarketplaceGuidePage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>('browsing');

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  const marketplaceFeatures = [
    {
      icon: <Search size={20} />,
      title: 'Advanced Search',
      description: 'Find assets quickly with powerful search and filtering capabilities'
    },
    {
      icon: <Filter size={20} />,
      title: 'Smart Filters',
      description: 'Filter by asset type, price range, yield potential, and risk level'
    },
    {
      icon: <Eye size={20} />,
      title: 'Detailed Views',
      description: 'Comprehensive asset information with documentation and analytics'
    },
    {
      icon: <Heart size={20} />,
      title: 'Watchlists',
      description: 'Save and track your favorite assets for future investment'
    },
    {
      icon: <TrendingUp size={20} />,
      title: 'Performance Tracking',
      description: 'Monitor asset performance and historical price movements'
    },
    {
      icon: <Shield size={20} />,
      title: 'Verified Assets',
      description: 'All assets undergo compliance verification and due diligence'
    }
  ];

  const assetCategories = [
    { name: 'Real Estate', count: '150+', description: 'Residential and commercial properties' },
    { name: 'Commodities', count: '75+', description: 'Precious metals and agricultural products' },
    { name: 'Art & Collectibles', count: '200+', description: 'Fine art and rare collectibles' },
    { name: 'Business Assets', count: '50+', description: 'Equipment and intellectual property' },
    { name: 'Infrastructure', count: '25+', description: 'Energy and transportation projects' },
    { name: 'Carbon Credits', count: '100+', description: 'Environmental and sustainability assets' }
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
              Marketplace Guide
            </Typography>
          </Breadcrumbs>
        </BreadcrumbContainer>

        {/* Page Header */}
        <PageTitle>Marketplace Guide</PageTitle>
        <PageSubtitle>
          Learn how to navigate, search, and trade on the Quantera marketplace. Discover tokenized 
          real-world assets and build your investment portfolio with confidence.
        </PageSubtitle>

        <InfoBox>
          <Info size={20} color="#ff9800" />
          <Box>
            <Typography variant="body2" sx={{ 
              fontWeight: 600, 
              marginBottom: '4px',
              color: theme.palette.mode === 'dark' ? '#ffffff' : '#263238'
            }}>
              Development Status: Testing Phase
            </Typography>
            <Typography variant="body2" sx={{ 
              color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#607d8b' 
            }}>
              Smart contracts will soon be audited by leading security firms. The assets currently 
              listed on the marketplace are for testing purposes only and should not be considered 
              as investment opportunities.
            </Typography>
          </Box>
        </InfoBox>

        {/* Marketplace Features Overview */}
        <SectionTitle>Marketplace Features</SectionTitle>
        <Grid container spacing={3} sx={{ marginBottom: '40px' }}>
          {marketplaceFeatures.map((feature, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
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

        {/* Asset Categories */}
        <SectionTitle>Available Asset Categories</SectionTitle>
        <TableContainer component={Paper} sx={{ marginBottom: '40px' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ background: 'rgba(26, 35, 126, 0.05)' }}>
                <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Available Assets</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assetCategories.map((category, index) => (
                <TableRow key={index}>
                  <TableCell sx={{ fontWeight: 600 }}>{category.name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={category.count} 
                      size="small" 
                      sx={{ background: '#e8f5e8', color: '#2e7d32' }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#607d8b' }}>
                    {category.description}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Detailed Guides */}
        
        {/* Browsing & Discovery */}
        <Accordion 
          expanded={expandedAccordion === 'browsing'} 
          onChange={handleAccordionChange('browsing')}
          sx={{ marginBottom: '16px' }}
        >
          <AccordionSummary expandIcon={<ChevronDown />}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Browsing & Discovery</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" sx={{ 
              color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#455a64', 
              lineHeight: 1.7, 
              marginBottom: '24px' 
            }}>
              The Quantera marketplace offers multiple ways to discover and explore tokenized assets. 
              Whether you're looking for specific asset types or exploring new investment opportunities, 
              our tools make it easy to find what you need.
            </Typography>

            <SectionTitle sx={{ fontSize: '1.25rem' }}>Navigation Methods</SectionTitle>
            <List sx={{ marginBottom: '24px' }}>
              <ListItem>
                <ListItemIcon><Search size={20} color="#4caf50" /></ListItemIcon>
                <ListItemText 
                  primary="Search Bar" 
                  secondary="Use keywords to search for specific assets, locations, or asset types"
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
                <ListItemIcon><Filter size={20} color="#4caf50" /></ListItemIcon>
                <ListItemText 
                  primary="Category Filters" 
                  secondary="Browse by asset category: Real Estate, Commodities, Art, Business Assets"
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
                <ListItemIcon><DollarSign size={20} color="#4caf50" /></ListItemIcon>
                <ListItemText 
                  primary="Price Range" 
                  secondary="Filter assets by minimum investment amount and total value"
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
                <ListItemIcon><MapPin size={20} color="#4caf50" /></ListItemIcon>
                <ListItemText 
                  primary="Geographic Location" 
                  secondary="Find assets in specific countries, regions, or cities"
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
                  primary="Yield Potential" 
                  secondary="Sort by expected annual yield and historical performance"
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

            <SectionTitle sx={{ fontSize: '1.25rem' }}>Quick Start Guide</SectionTitle>
            <CodeBlock>
              {`1. Visit the Marketplace
   Navigate to /marketplace from the main menu

2. Browse Categories
   Click on asset category cards or use the category filter

3. Apply Filters
   Use price range, location, and yield filters to narrow results

4. Search Specific Assets
   Enter keywords in the search bar for targeted results

5. View Asset Details
   Click on any asset card to see detailed information`}
            </CodeBlock>
          </AccordionDetails>
        </Accordion>

        {/* Asset Evaluation */}
        <Accordion 
          expanded={expandedAccordion === 'evaluation'} 
          onChange={handleAccordionChange('evaluation')}
          sx={{ marginBottom: '16px' }}
        >
          <AccordionSummary expandIcon={<ChevronDown />}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Asset Evaluation & Due Diligence</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" sx={{ 
              color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#455a64', 
              lineHeight: 1.7, 
              marginBottom: '24px' 
            }}>
              Every asset on the Quantera marketplace undergoes thorough evaluation and compliance 
              verification. Learn how to review asset information and make informed investment decisions.
            </Typography>

            <SectionTitle sx={{ fontSize: '1.25rem' }}>Asset Information Available</SectionTitle>
            <List sx={{ marginBottom: '24px' }}>
              <ListItem>
                <ListItemIcon><CheckCircle size={20} color="#4caf50" /></ListItemIcon>
                <ListItemText 
                  primary="Asset Documentation" 
                  secondary="Legal documents, ownership certificates, and compliance reports"
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
                  primary="Financial Performance" 
                  secondary="Historical returns, cash flow data, and yield projections"
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
                  primary="Risk Assessment" 
                  secondary="Risk ratings, market analysis, and volatility metrics"
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
                  primary="Market Data" 
                  secondary="Current pricing, trading volume, and liquidity information"
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

        {/* Trading & Investment */}
        <Accordion 
          expanded={expandedAccordion === 'trading'} 
          onChange={handleAccordionChange('trading')}
          sx={{ marginBottom: '16px' }}
        >
          <AccordionSummary expandIcon={<ChevronDown />}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Trading & Investment Process</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" sx={{ 
              color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#455a64', 
              lineHeight: 1.7, 
              marginBottom: '24px' 
            }}>
              Once you've found an asset you want to invest in, the trading process is straightforward 
              and secure. All transactions are processed on-chain with full transparency.
            </Typography>

            <SectionTitle sx={{ fontSize: '1.25rem' }}>Investment Process</SectionTitle>
            <Typography variant="body1" sx={{ 
              color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#455a64', 
              lineHeight: 1.7, 
              marginBottom: '16px' 
            }}>
              1. <strong>Connect Wallet:</strong> Connect your Web3 wallet (MetaMask, WalletConnect, etc.)
            </Typography>
            <Typography variant="body1" sx={{ 
              color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#455a64', 
              lineHeight: 1.7, 
              marginBottom: '16px' 
            }}>
              2. <strong>Review Asset Details:</strong> Carefully review all asset information and documentation
            </Typography>
            <Typography variant="body1" sx={{ 
              color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#455a64', 
              lineHeight: 1.7, 
              marginBottom: '16px' 
            }}>
              3. <strong>Choose Investment Amount:</strong> Select the number of tokens you want to purchase
            </Typography>
            <Typography variant="body1" sx={{ 
              color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#455a64', 
              lineHeight: 1.7, 
              marginBottom: '16px' 
            }}>
              4. <strong>Confirm Transaction:</strong> Review fees and confirm the transaction in your wallet
            </Typography>
            <Typography variant="body1" sx={{ 
              color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#455a64', 
              lineHeight: 1.7, 
              marginBottom: '24px' 
            }}>
              5. <strong>Track Investment:</strong> Monitor your investment in your portfolio dashboard
            </Typography>

            <SectionTitle sx={{ fontSize: '1.25rem' }}>Trading Features</SectionTitle>
            <List sx={{ marginBottom: '24px' }}>
              <ListItem>
                <ListItemIcon><CheckCircle size={20} color="#4caf50" /></ListItemIcon>
                <ListItemText 
                  primary="Instant Settlement" 
                  secondary="Transactions settle immediately on the blockchain"
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
                  primary="Low Fees" 
                  secondary="Competitive trading fees with transparent pricing"
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
                  primary="Fractional Ownership" 
                  secondary="Invest in high-value assets with small minimum amounts"
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
        <SectionTitle>Start Exploring the Marketplace</SectionTitle>
        <Typography variant="body1" sx={{ 
          color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#455a64', 
          lineHeight: 1.7, 
          marginBottom: '24px' 
        }}>
          Ready to start investing in tokenized real-world assets? Visit the marketplace to explore 
          available opportunities and begin building your portfolio.
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
                  Visit Marketplace
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#607d8b',
                  marginBottom: '16px'
                }}>
                  Browse 600+ verified tokenized assets and start investing today
                </Typography>
                <Button 
                  variant="contained" 
                  size="small"
                  sx={{
                    background: 'linear-gradient(135deg, #1A5276 0%, #3498DB 100%)',
                    textTransform: 'none'
                  }}
                >
                  Explore Assets
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
            }} onClick={() => navigate('/docs/platform-features')}>
              <CardContent>
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  marginBottom: '8px',
                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#263238'
                }}>
                  Platform Features
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#607d8b',
                  marginBottom: '16px'
                }}>
                  Learn about all platform features including portfolio and yield tools
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
                  Learn More
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DocumentationContainer>
    </Box>
  );
}; 