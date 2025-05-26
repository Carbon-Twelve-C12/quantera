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
  TrendingUp,
  Droplets,
  Zap,
  DollarSign,
  AlertTriangle
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

const StrategyCard = styled(Card)(({ theme }) => ({
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

export const YieldLiquidityPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const yieldStrategies = [
    {
      icon: <DollarSign size={32} />,
      title: 'Asset-Based Income',
      description: 'Earn regular income from tokenized real-world assets',
      apy: '8-15%',
      risk: 'Medium',
      lockup: 'None',
      features: [
        'Rental income from real estate tokens',
        'Dividend payments from business assets',
        'Commodity storage fees',
        'Infrastructure revenue sharing'
      ]
    },
    {
      icon: <Zap size={32} />,
      title: 'Staking Rewards',
      description: 'Stake tokens to secure the network and earn rewards',
      apy: '5-12%',
      risk: 'Low',
      lockup: '30 days',
      features: [
        'Network validation rewards',
        'Governance token staking',
        'Validator delegation',
        'Compound staking benefits'
      ]
    },
    {
      icon: <Droplets size={32} />,
      title: 'Liquidity Mining',
      description: 'Provide liquidity to earn trading fees and incentives',
      apy: '12-25%',
      risk: 'High',
      lockup: 'Flexible',
      features: [
        'Trading fee collection',
        'Liquidity incentive rewards',
        'Impermanent loss protection',
        'Multi-pool strategies'
      ]
    },
    {
      icon: <TrendingUp size={32} />,
      title: 'Yield Farming',
      description: 'Optimize returns across multiple DeFi protocols',
      apy: '15-35%',
      risk: 'High',
      lockup: 'Variable',
      features: [
        'Auto-compounding strategies',
        'Cross-protocol optimization',
        'Risk-adjusted returns',
        'Automated rebalancing'
      ]
    }
  ];

  const liquidityPools = [
    {
      pair: 'QTR/USDC',
      tvl: '$2.4M',
      apy: '18.5%',
      volume24h: '$156K',
      fees: '0.3%'
    },
    {
      pair: 'REAL/ETH',
      tvl: '$1.8M',
      apy: '22.1%',
      volume24h: '$89K',
      fees: '0.5%'
    },
    {
      pair: 'GOLD/USDT',
      tvl: '$3.1M',
      apy: '14.7%',
      volume24h: '$203K',
      fees: '0.25%'
    },
    {
      pair: 'ART/DAI',
      tvl: '$950K',
      apy: '26.3%',
      volume24h: '$67K',
      fees: '0.8%'
    }
  ];

  const riskFactors = [
    {
      title: 'Smart Contract Risk',
      description: 'Risk of bugs or vulnerabilities in smart contracts',
      mitigation: 'Multiple audits, formal verification, insurance coverage'
    },
    {
      title: 'Impermanent Loss',
      description: 'Potential loss when providing liquidity to volatile pairs',
      mitigation: 'Impermanent loss protection, stable pair selection'
    },
    {
      title: 'Market Risk',
      description: 'Risk of asset price volatility affecting returns',
      mitigation: 'Diversification, hedging strategies, risk monitoring'
    },
    {
      title: 'Liquidity Risk',
      description: 'Risk of being unable to exit positions quickly',
      mitigation: 'Deep liquidity pools, multiple exit strategies'
    }
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return '#4caf50';
      case 'Medium': return '#ff9800';
      case 'High': return '#f44336';
      default: return '#9e9e9e';
    }
  };

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
            <span>Yield & Liquidity</span>
          </Breadcrumb>
          
          <PageTitle>Yield & Liquidity</PageTitle>
          <PageDescription>
            Maximize your returns through yield generation and liquidity provision. 
            Explore various strategies to earn passive income from your tokenized assets 
            while contributing to platform liquidity.
          </PageDescription>
        </Container>
      </PageHeader>

      {/* Overview Section */}
      <ContentSection maxWidth="lg">
        <Alert 
          severity="warning" 
          sx={{ 
            marginBottom: '40px',
            background: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 152, 0, 0.1)',
            border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 152, 0, 0.3)' : '1px solid rgba(255, 152, 0, 0.3)',
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 600, marginBottom: '8px' }}>
            Risk Disclosure
          </Typography>
          <Typography variant="body2">
            Yield generation and liquidity provision involve various risks including smart contract risk, 
            impermanent loss, and market volatility. Please understand these risks before participating.
          </Typography>
        </Alert>

        <SectionTitle>Yield Generation Strategies</SectionTitle>
        <Grid container spacing={3} sx={{ marginBottom: '60px' }}>
          {yieldStrategies.map((strategy, index) => (
            <Grid item xs={12} md={6} lg={3} key={index}>
              <StrategyCard>
                <CardContent sx={{ padding: '24px' }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '16px',
                    color: '#1a237e'
                  }}>
                    {strategy.icon}
                    <Typography variant="h6" sx={{ 
                      marginLeft: '12px', 
                      fontWeight: 600,
                      color: theme.palette.mode === 'dark' ? '#ffffff' : '#212529',
                      fontSize: '1rem'
                    }}>
                      {strategy.title}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" sx={{ 
                    color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#6c757d',
                    marginBottom: '16px',
                    lineHeight: 1.5,
                    fontSize: '0.875rem'
                  }}>
                    {strategy.description}
                  </Typography>

                  <Box sx={{ marginBottom: '16px' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>APY</Typography>
                      <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 600 }}>
                        {strategy.apy}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Risk</Typography>
                      <Chip 
                        label={strategy.risk}
                        size="small"
                        sx={{ 
                          background: getRiskColor(strategy.risk),
                          color: '#ffffff',
                          fontSize: '0.7rem',
                          height: '18px'
                        }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>Lockup</Typography>
                      <Typography variant="caption">{strategy.lockup}</Typography>
                    </Box>
                  </Box>

                  <List dense>
                    {strategy.features.map((feature, idx) => (
                      <ListItem key={idx} sx={{ paddingLeft: 0, paddingY: '1px' }}>
                        <ListItemIcon sx={{ minWidth: '20px' }}>
                          <CheckCircle size={12} color="#4caf50" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={feature}
                          primaryTypographyProps={{
                            fontSize: '0.75rem',
                            color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#6c757d'
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </StrategyCard>
            </Grid>
          ))}
        </Grid>

        {/* Liquidity Pools */}
        <SectionTitle>Active Liquidity Pools</SectionTitle>
        <InfoCard>
          <CardContent sx={{ padding: '24px' }}>
            <Grid container spacing={2}>
              {liquidityPools.map((pool, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Box sx={{ 
                    padding: '16px',
                    border: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                        {pool.pair}
                      </Typography>
                      <Chip 
                        label={`${pool.apy} APY`}
                        sx={{ 
                          background: '#4caf50',
                          color: '#ffffff',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ 
                          color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#6c757d',
                          display: 'block'
                        }}>
                          TVL
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {pool.tvl}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ 
                          color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#6c757d',
                          display: 'block'
                        }}>
                          24h Volume
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {pool.volume24h}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </InfoCard>

        {/* Risk Management */}
        <SectionTitle>Risk Management</SectionTitle>
        <Grid container spacing={3} sx={{ marginBottom: '60px' }}>
          {riskFactors.map((risk, index) => (
            <Grid item xs={12} md={6} key={index}>
              <InfoCard>
                <CardContent sx={{ padding: '24px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <AlertTriangle size={20} color="#ff9800" />
                    <Typography variant="h6" sx={{ 
                      marginLeft: '8px',
                      fontWeight: 600,
                      color: theme.palette.mode === 'dark' ? '#ffffff' : '#212529'
                    }}>
                      {risk.title}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" sx={{ 
                    color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#6c757d',
                    marginBottom: '12px',
                    lineHeight: 1.5
                  }}>
                    {risk.description}
                  </Typography>

                  <Box sx={{ 
                    padding: '12px',
                    background: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                    borderRadius: '6px',
                    border: theme.palette.mode === 'dark' ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid rgba(76, 175, 80, 0.3)'
                  }}>
                    <Typography variant="caption" sx={{ 
                      fontWeight: 600,
                      color: theme.palette.mode === 'dark' ? '#ffffff' : '#212529',
                      display: 'block',
                      marginBottom: '4px'
                    }}>
                      Mitigation:
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#6c757d',
                      fontSize: '0.875rem'
                    }}>
                      {risk.mitigation}
                    </Typography>
                  </Box>
                </CardContent>
              </InfoCard>
            </Grid>
          ))}
        </Grid>

        {/* Advanced Features */}
        <SectionTitle>Advanced Yield Features</SectionTitle>
        <InfoCard>
          <CardContent sx={{ padding: '32px' }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Auto-Compounding
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Automatic reward reinvestment" />
                      </ListItem>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Compound interest optimization" />
                      </ListItem>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Gas-efficient strategies" />
                      </ListItem>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Customizable frequency" />
                      </ListItem>
                    </List>
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Yield Optimization
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Cross-protocol yield farming" />
                      </ListItem>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Dynamic strategy allocation" />
                      </ListItem>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Risk-adjusted returns" />
                      </ListItem>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Automated rebalancing" />
                      </ListItem>
                    </List>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              <Grid item xs={12} md={6}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Liquidity Management
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Impermanent loss protection" />
                      </ListItem>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Range order management" />
                      </ListItem>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Multi-pool strategies" />
                      </ListItem>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Fee tier optimization" />
                      </ListItem>
                    </List>
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Analytics & Reporting
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Real-time yield tracking" />
                      </ListItem>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Performance attribution" />
                      </ListItem>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Risk metrics monitoring" />
                      </ListItem>
                      <ListItem sx={{ paddingLeft: 0 }}>
                        <ListItemIcon><CheckCircle size={16} color="#4caf50" /></ListItemIcon>
                        <ListItemText primary="Tax reporting support" />
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
              Start Earning Yield Today
            </Typography>
            <Typography variant="body1" sx={{ 
              color: theme.palette.mode === 'dark' ? '#b0b0b0' : '#6c757d',
              marginBottom: '32px',
              maxWidth: '600px',
              margin: '0 auto 32px'
            }}>
              Explore yield generation strategies and liquidity provision opportunities. 
              Start earning passive income from your tokenized assets with professional-grade tools.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/yield')}
                sx={{
                  background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)',
                  color: '#ffffff',
                  fontWeight: 600,
                  padding: '12px 32px',
                  textTransform: 'none',
                }}
              >
                Explore Yield Strategies
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/liquidity')}
                sx={{
                  borderColor: '#1a237e',
                  color: '#1a237e',
                  fontWeight: 600,
                  padding: '12px 32px',
                  textTransform: 'none',
                }}
              >
                View Liquidity Pools
              </Button>
            </Box>
          </CardContent>
        </InfoCard>
      </ContentSection>
    </Box>
  );
}; 