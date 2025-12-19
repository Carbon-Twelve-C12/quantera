import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, Box, Button, Card, CardContent } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  TrendingUp,
  Shield,
  ArrowLeftRight,
  ArrowRight,
  Coins,
  Globe,
  Lock,
  Zap,
  BarChart3,
  Leaf
} from 'lucide-react';
import CompatGrid from '../components/common/CompatGrid';
import FractionalizedCube from '../components/common/FractionalizedCube';

const Grid = CompatGrid;

// Swiss Precision Styled Components
const PageContainer = styled(Box)({
  minHeight: '100vh',
  background: 'var(--surface-base)',
});

const HeroSection = styled(Box)({
  background: 'var(--surface-base)',
  position: 'relative',
  overflow: 'hidden',
  paddingTop: '80px',
  paddingBottom: '100px',

  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    width: '60%',
    height: '100%',
    background: 'radial-gradient(ellipse at 80% 20%, rgba(16, 185, 129, 0.12) 0%, transparent 50%)',
    pointerEvents: 'none',
  },

  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '40%',
    height: '60%',
    background: 'radial-gradient(ellipse at 20% 100%, rgba(99, 102, 241, 0.08) 0%, transparent 50%)',
    pointerEvents: 'none',
  },
});

const HeroContent = styled(Box)({
  position: 'relative',
  zIndex: 1,
  maxWidth: '560px',
});

const HeroGrid = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '40px',

  '@media (max-width: 960px)': {
    flexDirection: 'column',
    textAlign: 'center',
  },
});

const CubeWrapper = styled(Box)({
  flex: '0 0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',

  '@media (max-width: 960px)': {
    order: -1,
    marginBottom: '24px',
    transform: 'scale(0.8)',
  },

  '@media (max-width: 600px)': {
    transform: 'scale(0.6)',
  },
});

const HeroLabel = styled(Box)({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 16px',
  background: 'var(--accent-muted)',
  borderRadius: 'var(--radius-full)',
  marginBottom: '24px',
  color: 'var(--accent-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: '13px',
  fontWeight: 500,
});

const HeroTitle = styled(Typography)({
  fontFamily: 'var(--font-display)',
  fontSize: '56px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  letterSpacing: '-0.03em',
  lineHeight: 1.1,
  marginBottom: '24px',

  '@media (max-width: 768px)': {
    fontSize: '40px',
  },
});

const HeroAccent = styled('span')({
  color: 'var(--accent-primary)',
});

const HeroSubtitle = styled(Typography)({
  fontFamily: 'var(--font-body)',
  fontSize: '20px',
  color: 'var(--text-secondary)',
  lineHeight: 1.6,
  marginBottom: '40px',
  maxWidth: '560px',
});

const HeroActions = styled(Box)({
  display: 'flex',
  gap: '16px',
  flexWrap: 'wrap',
});

const primaryButtonStyles = {
  background: 'var(--accent-primary)',
  color: '#000',
  borderRadius: 'var(--radius-md)',
  padding: '14px 28px',
  fontFamily: 'var(--font-body)',
  fontWeight: 500,
  fontSize: '15px',
  textTransform: 'none',
  transition: 'all 150ms',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  '&:hover': {
    background: 'var(--accent-hover)',
    transform: 'translateY(-1px)',
  },
};

const secondaryButtonStyles = {
  background: 'transparent',
  color: 'var(--text-primary)',
  border: '1px solid var(--surface-subtle)',
  borderRadius: 'var(--radius-md)',
  padding: '14px 28px',
  fontFamily: 'var(--font-body)',
  fontWeight: 500,
  fontSize: '15px',
  textTransform: 'none',
  transition: 'all 150ms',
  '&:hover': {
    background: 'var(--surface-overlay)',
    borderColor: 'var(--surface-hover)',
  },
};

const StatsBar = styled(Box)({
  display: 'flex',
  gap: '48px',
  marginTop: '64px',
  paddingTop: '32px',
  borderTop: '1px solid var(--surface-subtle)',
  flexWrap: 'wrap',
});

const StatItem = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

const StatValue = styled(Typography)({
  fontFamily: 'var(--font-mono)',
  fontSize: '32px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  letterSpacing: '-0.02em',
});

const StatLabel = styled(Typography)({
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  color: 'var(--text-tertiary)',
});

const Section = styled(Box)({
  padding: '100px 0',
});

const SectionHeader = styled(Box)({
  textAlign: 'center',
  marginBottom: '64px',
});

const SectionTitle = styled(Typography)({
  fontFamily: 'var(--font-display)',
  fontSize: '36px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  letterSpacing: '-0.02em',
  marginBottom: '16px',
});

const SectionSubtitle = styled(Typography)({
  fontFamily: 'var(--font-body)',
  fontSize: '18px',
  color: 'var(--text-secondary)',
  maxWidth: '560px',
  margin: '0 auto',
  lineHeight: 1.6,
});

const FeatureCard = styled(Card)({
  background: 'var(--surface-elevated)',
  border: '1px solid var(--surface-subtle)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'none',
  height: '100%',
  transition: 'border-color 250ms, box-shadow 250ms',

  '&:hover': {
    borderColor: 'var(--surface-hover)',
    boxShadow: 'var(--shadow-glow)',
  },
});

const FeatureCardContent = styled(CardContent)({
  padding: '32px !important',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
});

const FeatureIcon = styled(Box)({
  width: '56px',
  height: '56px',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--accent-muted)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '24px',
  color: 'var(--accent-primary)',
});

const FeatureTitle = styled(Typography)({
  fontFamily: 'var(--font-display)',
  fontSize: '18px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  marginBottom: '12px',
});

const FeatureDescription = styled(Typography)({
  fontFamily: 'var(--font-body)',
  fontSize: '15px',
  color: 'var(--text-secondary)',
  lineHeight: 1.6,
});

const BenefitSection = styled(Box)({
  padding: '100px 0',
  background: 'var(--surface-elevated)',
  borderTop: '1px solid var(--surface-subtle)',
  borderBottom: '1px solid var(--surface-subtle)',
});

const BenefitItem = styled(Box)({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '16px',
  marginBottom: '32px',

  '&:last-child': {
    marginBottom: 0,
  },
});

const BenefitIcon = styled(Box)({
  width: '40px',
  height: '40px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--surface-overlay)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  color: 'var(--accent-primary)',
});

const BenefitContent = styled(Box)({
  flex: 1,
});

const BenefitTitle = styled(Typography)({
  fontFamily: 'var(--font-display)',
  fontSize: '16px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  marginBottom: '4px',
});

const BenefitDescription = styled(Typography)({
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  color: 'var(--text-secondary)',
  lineHeight: 1.5,
});

const CTASection = styled(Box)({
  padding: '100px 0',
  textAlign: 'center',
  position: 'relative',

  '&::before': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    height: '400px',
    background: 'radial-gradient(ellipse, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
});

const CTACard = styled(Box)({
  background: 'var(--surface-elevated)',
  border: '1px solid var(--surface-subtle)',
  borderRadius: 'var(--radius-xl)',
  padding: '64px',
  maxWidth: '640px',
  margin: '0 auto',
  position: 'relative',
});

const CTATitle = styled(Typography)({
  fontFamily: 'var(--font-display)',
  fontSize: '32px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  letterSpacing: '-0.02em',
  marginBottom: '16px',
});

const CTADescription = styled(Typography)({
  fontFamily: 'var(--font-body)',
  fontSize: '16px',
  color: 'var(--text-secondary)',
  marginBottom: '32px',
  lineHeight: 1.6,
});

const HomePage: React.FC = () => {
  const features = [
    {
      icon: <TrendingUp size={28} />,
      title: 'Yield Generation',
      description: 'Earn competitive yields on tokenized real-world assets with automatic distribution and transparent tracking.'
    },
    {
      icon: <Shield size={28} />,
      title: 'Institutional Security',
      description: 'Bank-grade custody solutions and regulatory compliance across all supported jurisdictions.'
    },
    {
      icon: <ArrowLeftRight size={28} />,
      title: 'Seamless Trading',
      description: 'Trade tokenized assets 24/7 with instant settlement, deep liquidity, and minimal transaction costs.'
    },
    {
      icon: <Globe size={28} />,
      title: 'Global Access',
      description: 'Access investment opportunities worldwide with blockchain-powered fractional ownership.'
    },
    {
      icon: <BarChart3 size={28} />,
      title: 'Real-Time Analytics',
      description: 'Comprehensive portfolio analytics, risk metrics, and performance tracking at your fingertips.'
    },
    {
      icon: <Leaf size={28} />,
      title: 'ESG Integration',
      description: 'Track environmental impact and invest in verified carbon credits and sustainable assets.'
    }
  ];

  const benefits = [
    {
      icon: <Lock size={20} />,
      title: 'Regulatory Compliant',
      description: 'All assets follow appropriate regulatory frameworks for their respective jurisdictions.'
    },
    {
      icon: <Zap size={20} />,
      title: 'Instant Settlement',
      description: 'Blockchain-based settlement eliminates T+2 delays for immediate ownership transfer.'
    },
    {
      icon: <Coins size={20} />,
      title: 'Fractional Ownership',
      description: 'Invest in premium assets with flexible minimums through tokenized fractions.'
    }
  ];

  return (
    <PageContainer>
      {/* Hero Section */}
      <HeroSection>
        <Container maxWidth="lg">
          <HeroGrid>
            <HeroContent>
              <HeroLabel>
                <Coins size={16} />
                Institutional-Grade Asset Tokenization
              </HeroLabel>
              <HeroTitle>
                The Future of <HeroAccent>Asset</HeroAccent> Ownership
              </HeroTitle>
              <HeroSubtitle>
                Quantera brings real-world assets to blockchain, enabling fractional ownership,
                instant settlement, and 24/7 liquidity for institutional and retail investors.
              </HeroSubtitle>
              <HeroActions>
                <Button component={Link} to="/marketplace" sx={primaryButtonStyles}>
                  Explore Marketplace
                  <ArrowRight size={18} />
                </Button>
                <Button component={Link} to="/portfolio" sx={secondaryButtonStyles}>
                  View Portfolio
                </Button>
              </HeroActions>

              <StatsBar>
                <StatItem>
                  <StatValue>$2.4B+</StatValue>
                  <StatLabel>Total Value Locked</StatLabel>
                </StatItem>
                <StatItem>
                  <StatValue>150+</StatValue>
                  <StatLabel>Tokenized Assets</StatLabel>
                </StatItem>
                <StatItem>
                  <StatValue>12.5%</StatValue>
                  <StatLabel>Average APY</StatLabel>
                </StatItem>
                <StatItem>
                  <StatValue>45K+</StatValue>
                  <StatLabel>Active Investors</StatLabel>
                </StatItem>
              </StatsBar>
            </HeroContent>

            <CubeWrapper>
              <FractionalizedCube />
            </CubeWrapper>
          </HeroGrid>
        </Container>
      </HeroSection>

      {/* Features Section */}
      <Section>
        <Container maxWidth="lg">
          <SectionHeader>
            <SectionTitle>Platform Capabilities</SectionTitle>
            <SectionSubtitle>
              A comprehensive suite of tools for tokenized asset management,
              trading, and analytics.
            </SectionSubtitle>
          </SectionHeader>

          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <FeatureCard>
                  <FeatureCardContent>
                    <FeatureIcon>
                      {feature.icon}
                    </FeatureIcon>
                    <FeatureTitle>{feature.title}</FeatureTitle>
                    <FeatureDescription>{feature.description}</FeatureDescription>
                  </FeatureCardContent>
                </FeatureCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* Benefits Section */}
      <BenefitSection>
        <Container maxWidth="lg">
          <Grid container spacing={6} sx={{ alignItems: 'center' }}>
            <Grid item xs={12} md={5}>
              <SectionTitle sx={{ textAlign: 'left', mb: 2 }}>
                Built for Institutions
              </SectionTitle>
              <SectionSubtitle sx={{ textAlign: 'left', mx: 0, mb: 4 }}>
                Quantera provides the infrastructure, compliance, and security
                that institutional investors require.
              </SectionSubtitle>
              <Button component={Link} to="/marketplace" sx={secondaryButtonStyles}>
                Learn More
              </Button>
            </Grid>
            <Grid item xs={12} md={7}>
              <Box sx={{ pl: { md: 6 } }}>
                {benefits.map((benefit, index) => (
                  <BenefitItem key={index}>
                    <BenefitIcon>
                      {benefit.icon}
                    </BenefitIcon>
                    <BenefitContent>
                      <BenefitTitle>{benefit.title}</BenefitTitle>
                      <BenefitDescription>{benefit.description}</BenefitDescription>
                    </BenefitContent>
                  </BenefitItem>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </BenefitSection>

      {/* CTA Section */}
      <CTASection>
        <Container maxWidth="lg">
          <CTACard>
            <CTATitle>Ready to Get Started?</CTATitle>
            <CTADescription>
              Connect your wallet and start exploring tokenized real-world assets.
              Join thousands of investors accessing institutional-grade opportunities.
            </CTADescription>
            <Button component={Link} to="/marketplace" sx={primaryButtonStyles}>
              Browse Marketplace
              <ArrowRight size={18} />
            </Button>
          </CTACard>
        </Container>
      </CTASection>
    </PageContainer>
  );
};

export default HomePage;
