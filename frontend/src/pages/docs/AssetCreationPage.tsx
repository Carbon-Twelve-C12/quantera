import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { 
  ArrowLeft,
  CheckCircle,
  DollarSign,
  Building,
  Palette,
  Zap,
  Globe
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

const AssetTypeCard = styled(Card)(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
  borderRadius: '12px',
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 2px 16px rgba(0, 0, 0, 0.3)' 
    : '0 2px 16px rgba(0, 0, 0, 0.1)',
  border: theme.palette.mode === 'dark' 
    ? '1px solid rgba(255, 255, 255, 0.1)' 
    : '1px solid rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  height: '100%',
  
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.palette.mode === 'dark' 
      ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
      : '0 8px 32px rgba(0, 0, 0, 0.15)',
  },
}));

export const AssetCreationPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const assetTypes = [
    {
      icon: <Building size={32} />,
      title: 'Real Estate',
      description: 'Residential, commercial, and industrial properties',
      examples: ['Apartment buildings', 'Office complexes', 'Retail spaces', 'Warehouses'],
      minValue: '$100,000',
      timeframe: '2-4 weeks'
    },
    {
      icon: <DollarSign size={32} />,
      title: 'Commodities',
      description: 'Physical commodities and precious metals',
      examples: ['Gold', 'Silver', 'Oil', 'Agricultural products'],
      minValue: '$50,000',
      timeframe: '1-2 weeks'
    },
    {
      icon: <Palette size={32} />,
      title: 'Art & Collectibles',
      description: 'Fine art, collectibles, and luxury items',
      examples: ['Paintings', 'Sculptures', 'Vintage cars', 'Rare wines'],
      minValue: '$25,000',
      timeframe: '3-6 weeks'
    },
    {
      icon: <Zap size={32} />,
      title: 'Business Assets',
      description: 'Revenue-generating business assets',
      examples: ['Equipment', 'Intellectual property', 'Revenue streams', 'Patents'],
      minValue: '$75,000',
      timeframe: '4-8 weeks'
    },
    {
      icon: <Globe size={32} />,
      title: 'Infrastructure',
      description: 'Infrastructure and utility assets',
      examples: ['Solar farms', 'Wind turbines', 'Telecom towers', 'Data centers'],
      minValue: '$500,000',
      timeframe: '6-12 weeks'
    }
  ];

  const creationSteps = [
    {
      label: 'Asset Evaluation',
      description: 'Initial assessment and valuation of your asset',
      details: [
        'Professional asset appraisal',
        'Legal structure review',
        'Compliance verification',
        'Market analysis'
      ]
    },
    {
      label: 'Documentation',
      description: 'Prepare and submit required documentation',
      details: [
        'Asset ownership proof',
        'Financial statements',
        'Legal documentation',
        'Insurance certificates'
      ]
    },
    {
      label: 'Token Structure',
      description: 'Define tokenization parameters and structure',
      details: [
        'Token supply and distribution',
        'Governance rights',
        'Revenue sharing model',
        'Transfer restrictions'
      ]
    },
    {
      label: 'Smart Contract Deployment',
      description: 'Deploy and configure smart contracts',
      details: [
        'ERC-3643 compliant token',
        'Compliance rules setup',
        'Transfer restrictions',
        'Governance mechanisms'
      ]
    },
    {
      label: 'Marketplace Listing',
      description: 'List your tokenized asset on the marketplace',
      details: [
        'Asset profile creation',
        'Marketing materials',
        'Pricing strategy',
        'Launch coordination'
      ]
    }
  ];

  const requirements = [
    {
      category: 'Legal Requirements',
      items: [
        'Clear asset ownership',
        'Legal entity structure',
        'Regulatory compliance',
        'Insurance coverage'
      ]
    },
    {
      category: 'Financial Requirements',
      items: [
        'Minimum asset value thresholds',
        'Financial statements (3 years)',
        'Professional valuation',
        'Audit trail documentation'
      ]
    },
    {
      category: 'Technical Requirements',
      items: [
        'Digital asset documentation',
        'Metadata standards compliance',
        'KYC/AML verification',
        'Ongoing reporting capabilities'
      ]
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
            <span>Asset Creation</span>
          </Breadcrumb>
          
          <PageTitle>Asset Creation Guide</PageTitle>
          <PageDescription>
            Learn how to tokenize your real-world assets on the Quantera platform. 
            From initial evaluation to marketplace listing, this guide covers the complete 
            asset tokenization process.
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
            Professional Guidance Available
          </Typography>
          <Typography variant="body2">
            Our asset tokenization specialists are available to guide you through the entire process. 
            Contact our team for personalized assistance and consultation.
          </Typography>
        </Alert>

        <SectionTitle>Supported Asset Types</SectionTitle>
        <Grid container spacing={3} sx={{ marginBottom: '60px' }}>
          {assetTypes.map((assetType, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <AssetTypeCard>
                <CardContent sx={{ padding: '24px' }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '16px',
                    color: '#1a237e'
                  }}>
                    {assetType.icon}
                    <Typography variant="h6" sx={{ 
                      marginLeft: '12px', 
                      fontWeight: 600,
                      color: theme.palette.mode === 'dark' ? '#ffffff' : '#212529'
                    }}>
                      {assetType.title}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" sx={{ 
                    color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#6c757d',
                    marginBottom: '16px',
                    lineHeight: 1.5
                  }}>
                    {assetType.description}
                  </Typography>

                  <Box sx={{ marginBottom: '16px' }}>
                    <Typography variant="caption" sx={{ 
                      fontWeight: 600,
                      color: theme.palette.mode === 'dark' ? '#ffffff' : '#212529',
                      display: 'block',
                      marginBottom: '8px'
                    }}>
                      Examples:
                    </Typography>
                    {assetType.examples.map((example, idx) => (
                      <Chip 
                        key={idx}
                        label={example} 
                        size="small" 
                        sx={{ 
                          margin: '2px 4px 2px 0',
                          background: theme.palette.mode === 'dark' ? 'rgba(26, 35, 126, 0.3)' : 'rgba(26, 35, 126, 0.1)',
                          color: theme.palette.mode === 'dark' ? '#ffffff' : '#1a237e',
                          fontSize: '0.75rem'
                        }} 
                      />
                    ))}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" sx={{ 
                        color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#6c757d',
                        display: 'block'
                      }}>
                        Min. Value
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 600,
                        color: theme.palette.mode === 'dark' ? '#ffffff' : '#212529'
                      }}>
                        {assetType.minValue}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" sx={{ 
                        color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#6c757d',
                        display: 'block'
                      }}>
                        Timeframe
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 600,
                        color: theme.palette.mode === 'dark' ? '#ffffff' : '#212529'
                      }}>
                        {assetType.timeframe}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </AssetTypeCard>
            </Grid>
          ))}
        </Grid>

        {/* Creation Process */}
        <SectionTitle>Asset Creation Process</SectionTitle>
        <InfoCard>
          <CardContent sx={{ padding: '32px' }}>
            <Stepper orientation="vertical">
              {creationSteps.map((step, index) => (
                <Step key={index} active={true}>
                  <StepLabel>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600,
                      color: theme.palette.mode === 'dark' ? '#ffffff' : '#212529'
                    }}>
                      {step.label}
                    </Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" sx={{ 
                      color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#6c757d',
                      marginBottom: '16px'
                    }}>
                      {step.description}
                    </Typography>
                    <List dense>
                      {step.details.map((detail, idx) => (
                        <ListItem key={idx} sx={{ paddingLeft: 0 }}>
                          <ListItemIcon sx={{ minWidth: '32px' }}>
                            <CheckCircle size={16} color="#4caf50" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={detail}
                            primaryTypographyProps={{
                              fontSize: '0.875rem',
                              color: theme.palette.mode === 'dark' ? '#ffffff' : '#212529'
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </InfoCard>

        {/* Requirements */}
        <SectionTitle>Requirements & Prerequisites</SectionTitle>
        <Grid container spacing={3} sx={{ marginBottom: '60px' }}>
          {requirements.map((req, index) => (
            <Grid item xs={12} md={4} key={index}>
              <InfoCard>
                <CardContent sx={{ padding: '24px' }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    marginBottom: '16px',
                    color: theme.palette.mode === 'dark' ? '#ffffff' : '#212529'
                  }}>
                    {req.category}
                  </Typography>
                  <List dense>
                    {req.items.map((item, idx) => (
                      <ListItem key={idx} sx={{ paddingLeft: 0 }}>
                        <ListItemIcon sx={{ minWidth: '32px' }}>
                          <CheckCircle size={16} color="#4caf50" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={item}
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

        {/* Get Started */}
        <InfoCard>
          <CardContent sx={{ padding: '32px', textAlign: 'center' }}>
            <Typography variant="h5" sx={{ 
              fontWeight: 600,
              marginBottom: '16px',
              color: theme.palette.mode === 'dark' ? '#ffffff' : '#212529'
            }}>
              Ready to Tokenize Your Assets?
            </Typography>
            <Typography variant="body1" sx={{ 
              color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#6c757d',
              marginBottom: '32px',
              maxWidth: '600px',
              margin: '0 auto 32px'
            }}>
              Start your asset tokenization journey today. Our team will guide you through 
              every step of the process to ensure a successful launch.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/assets/create')}
                sx={{
                  background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)',
                  color: '#ffffff',
                  fontWeight: 600,
                  padding: '12px 32px',
                  textTransform: 'none',
                }}
              >
                Start Asset Creation
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
                Contact Our Team
              </Button>
            </Box>
          </CardContent>
        </InfoCard>
      </ContentSection>
    </Box>
  );
}; 