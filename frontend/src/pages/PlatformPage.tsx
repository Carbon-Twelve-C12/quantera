import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Chip
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { 
  Shield,
  TrendingUp,
  ArrowRight,
  Book,
  Cpu,
  ShoppingCart,
  PlusCircle,
  PieChart,
  Layers,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeroSection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)',
  color: '#ffffff',
  padding: '80px 0 60px',
  position: 'relative',
  overflow: 'hidden',
}));

const HeroContent = styled(Box)({
  position: 'relative',
  zIndex: 1,
  textAlign: 'center',
});

const HeroTitle = styled(Typography)({
  fontSize: '3rem',
  fontWeight: 700,
  marginBottom: '16px',
  fontFamily: 'Inter, sans-serif',
  
  '@media (max-width: 768px)': {
    fontSize: '2rem',
  },
});

const HeroSubtitle = styled(Typography)({
  fontSize: '1.125rem',
  marginBottom: '32px',
  opacity: 0.9,
  maxWidth: '600px',
  margin: '0 auto 32px',
  lineHeight: 1.6,
});

const GetStartedButton = styled(Button)({
  background: '#ffffff',
  color: '#1a237e',
  fontWeight: 600,
  padding: '12px 32px',
  borderRadius: '8px',
  fontSize: '1rem',
  textTransform: 'none',
  
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.9)',
  },
});

const SectionContainer = styled(Container)({
  padding: '60px 0',
});

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '2rem',
  fontWeight: 700,
  color: theme.palette.mode === 'dark' ? '#ffffff' : '#263238',
  textAlign: 'center',
  marginBottom: '48px',
  fontFamily: 'Inter, sans-serif',
}));

const CategoryCard = styled(Card)(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
  borderRadius: '12px',
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 2px 16px rgba(0, 0, 0, 0.3)' 
    : '0 2px 16px rgba(26, 35, 126, 0.08)',
  border: theme.palette.mode === 'dark' 
    ? '1px solid rgba(255, 255, 255, 0.1)' 
    : '1px solid rgba(26, 35, 126, 0.08)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  height: '100%',
  cursor: 'pointer',
  
  '&:hover': {
    boxShadow: theme.palette.mode === 'dark' 
      ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
      : '0 8px 32px rgba(26, 35, 126, 0.12)',
    transform: 'translateY(-2px)',
    borderColor: '#1a237e',
  },
}));

const CategoryIcon = styled(Box)({
  width: '48px',
  height: '48px',
  borderRadius: '8px',
  background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '16px',
  color: '#ffffff',
});

const CategoryTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.125rem',
  fontWeight: 600,
  color: theme.palette.mode === 'dark' ? '#ffffff' : '#263238',
  marginBottom: '8px',
  fontFamily: 'Inter, sans-serif',
}));

const CategoryDescription = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#607d8b',
  lineHeight: 1.5,
  marginBottom: '16px',
}));

const ViewDocsButton = styled(Button)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#ffffff' : '#1a237e',
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '0.875rem',
  padding: '4px 0',
  
  '&:hover': {
    background: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.1)' 
      : 'rgba(26, 35, 126, 0.04)',
  },
}));

const NewBadge = styled(Chip)({
  background: '#4caf50',
  color: '#ffffff',
  fontSize: '0.75rem',
  height: '20px',
  fontWeight: 600,
});

const HelpSection = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.02)' 
    : 'rgba(26, 35, 126, 0.02)',
  padding: '60px 0',
  textAlign: 'center',
}));

export const PlatformPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const documentationCategories = [
    {
      icon: <Book size={24} />,
      title: 'Project Overview',
      description: 'Introduction to Quantera, its purpose, and architecture',
      isNew: false,
      path: '/docs/overview'
    },
    {
      icon: <FileText size={24} />,
      title: 'Platform Features',
      description: 'Comprehensive guide to marketplace, portfolio, yield, and liquidity features',
      isNew: true,
      path: '/docs/platform-features'
    },
    {
      icon: <Cpu size={24} />,
      title: 'Smart Contracts',
      description: 'Technical documentation for blockchain infrastructure and contracts',
      isNew: false,
      path: '/docs/smart-contracts'
    },
    {
      icon: <ShoppingCart size={24} />,
      title: 'Marketplace Guide',
      description: 'How to discover, evaluate, and trade tokenized assets',
      isNew: false,
      path: '/docs/marketplace-guide'
    },
    {
      icon: <PlusCircle size={24} />,
      title: 'Asset Creation',
      description: 'Step-by-step guide to tokenizing your real-world assets',
      isNew: false,
      path: '/docs/asset-creation'
    },
    {
      icon: <PieChart size={24} />,
      title: 'Portfolio Management',
      description: 'Track and optimize your tokenized asset portfolio',
      isNew: false,
      path: '/docs/portfolio-management'
    },
    {
      icon: <TrendingUp size={24} />,
      title: 'Yield & Liquidity',
      description: 'Earn returns through yield generation and liquidity provision',
      isNew: false,
      path: '/docs/yield-liquidity'
    },
    {
      icon: <Shield size={24} />,
      title: 'Security & Compliance',
      description: 'Security architecture, audits, and regulatory compliance',
      isNew: false,
      path: '/docs/security'
    },
    {
      icon: <Layers size={24} />,
      title: 'Cross-Chain',
      description: 'Multi-blockchain support and interoperability features',
      isNew: false,
      path: '/docs/cross-chain'
    }
  ];

  const handleCategoryClick = (path: string) => {
    // Navigate to the specific documentation page
    // For unimplemented pages, redirect to placeholder
    const implementedPaths = [
      '/docs/overview', 
      '/docs/smart-contracts', 
      '/docs/platform-features', 
      '/docs/marketplace-guide',
      '/docs/asset-creation',
      '/docs/portfolio-management',
      '/docs/yield-liquidity'
    ];
    
    if (implementedPaths.includes(path)) {
      navigate(path);
    } else {
      navigate('/docs/placeholder');
    }
  };

  return (
    <Box>
      {/* Hero Section */}
      <HeroSection>
        <Container maxWidth="lg">
          <HeroContent>
            <HeroTitle>
              Quantera Documentation
            </HeroTitle>
            <HeroSubtitle>
              Welcome to the official Quantera documentation. This resource hub provides
              information about the feautres of the Quantera asset tokenization platform.
            </HeroSubtitle>
            
            <GetStartedButton
              startIcon={<ArrowRight size={20} />}
              onClick={() => handleCategoryClick('/docs/overview')}
            >
              Get Started with Quantera
            </GetStartedButton>
          </HeroContent>
        </Container>
      </HeroSection>

      {/* Documentation Categories */}
      <SectionContainer maxWidth="lg">
        <SectionTitle>Documentation</SectionTitle>

        <Grid container spacing={3}>
          {documentationCategories.map((category, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <CategoryCard onClick={() => handleCategoryClick(category.path)}>
                <CardContent sx={{ padding: '24px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <CategoryIcon>
                      {category.icon}
                    </CategoryIcon>
                    {category.isNew && <NewBadge label="New" />}
                  </Box>
                  
                  <CategoryTitle>{category.title}</CategoryTitle>
                  <CategoryDescription>{category.description}</CategoryDescription>
                  
                  <ViewDocsButton 
                    endIcon={<ArrowRight size={16} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCategoryClick(category.path);
                    }}
                  >
                    View Documentation
                  </ViewDocsButton>
                </CardContent>
              </CategoryCard>
            </Grid>
          ))}
        </Grid>
      </SectionContainer>

      {/* Help Section */}
      <HelpSection>
        <Container maxWidth="md">
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            marginBottom: '16px', 
            color: theme.palette.mode === 'dark' ? '#ffffff' : '#263238' 
          }}>
            Need More Help?
          </Typography>
          <Typography variant="body1" sx={{ 
            color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#607d8b', 
            marginBottom: '32px', 
            lineHeight: 1.6 
          }}>
            Can't find what you're looking for in the documentation? Reach out to the Quantera 
            community for assistance.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)',
                color: '#ffffff',
                fontWeight: 600,
                padding: '12px 24px',
                textTransform: 'none',
              }}
              onClick={() => window.open('https://github.com/Carbon-Twelve-C12/quantera', '_blank')}
            >
              GitHub Repository
            </Button>
          </Box>
        </Container>
      </HelpSection>
    </Box>
  );
}; 