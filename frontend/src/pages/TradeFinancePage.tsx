import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  Card,
  CardContent
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Landmark,
  Coins,
  TrendingUp,
  Globe,
  ArrowRight,
  FileText,
  Briefcase,
  LineChart
} from 'lucide-react';
import CompatGrid from '../components/common/CompatGrid';

import TradeFinanceMarketplace from '../components/tradeFinance/TradeFinanceMarketplace';
import TradeFinancePortfolio from '../components/tradeFinance/TradeFinancePortfolio';
import TradeFinanceTradingInterface from '../components/tradeFinance/TradeFinanceTradingInterface';
import { TradeFinanceProvider } from '../contexts/TradeFinanceContext';

const Grid = CompatGrid;

// Swiss Precision Styled Components
const PageContainer = styled(Box)({
  minHeight: '100vh',
  background: 'var(--surface-base)',
  paddingBottom: '80px',
});

const HeroSection = styled(Box)({
  background: 'var(--surface-elevated)',
  borderBottom: '1px solid var(--surface-subtle)',
  padding: '64px 0',
  marginBottom: '48px',
  position: 'relative',
  overflow: 'hidden',

  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    width: '50%',
    height: '100%',
    background: 'radial-gradient(ellipse at 100% 0%, rgba(16, 185, 129, 0.08) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
});

const HeroContent = styled(Box)({
  position: 'relative',
  zIndex: 1,
  maxWidth: '720px',
});

const HeroTitle = styled(Typography)({
  fontFamily: 'var(--font-display)',
  fontSize: '40px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  letterSpacing: '-0.02em',
  marginBottom: '16px',
  lineHeight: 1.1,
});

const HeroSubtitle = styled(Typography)({
  fontFamily: 'var(--font-body)',
  fontSize: '18px',
  color: 'var(--text-secondary)',
  lineHeight: 1.6,
  marginBottom: '32px',
});

const HeroActions = styled(Box)({
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
});

const PrimaryButton = styled(Button)({
  background: 'var(--accent-primary)',
  color: '#000',
  borderRadius: 'var(--radius-md)',
  padding: '12px 24px',
  fontFamily: 'var(--font-body)',
  fontWeight: 500,
  fontSize: '14px',
  textTransform: 'none',
  transition: 'background 150ms',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',

  '&:hover': {
    background: 'var(--accent-hover)',
  },
});

const SecondaryButton = styled(Button)({
  background: 'transparent',
  color: 'var(--text-primary)',
  border: '1px solid var(--surface-subtle)',
  borderRadius: 'var(--radius-md)',
  padding: '12px 24px',
  fontFamily: 'var(--font-body)',
  fontWeight: 500,
  fontSize: '14px',
  textTransform: 'none',
  transition: 'all 150ms',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',

  '&:hover': {
    background: 'var(--surface-overlay)',
    borderColor: 'var(--surface-hover)',
  },
});

const SectionHeader = styled(Box)({
  textAlign: 'center',
  marginBottom: '40px',
});

const SectionTitle = styled(Typography)({
  fontFamily: 'var(--font-display)',
  fontSize: '28px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  letterSpacing: '-0.01em',
  marginBottom: '12px',
});

const SectionSubtitle = styled(Typography)({
  fontFamily: 'var(--font-body)',
  fontSize: '15px',
  color: 'var(--text-secondary)',
  maxWidth: '640px',
  margin: '0 auto',
  lineHeight: 1.6,
});

const BenefitCard = styled(Card)({
  background: 'var(--surface-elevated)',
  border: '1px solid var(--surface-subtle)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'none',
  height: '100%',
  transition: 'border-color 200ms, box-shadow 200ms',

  '&:hover': {
    borderColor: 'var(--surface-hover)',
    boxShadow: 'var(--shadow-glow)',
  },
});

const BenefitCardContent = styled(CardContent)({
  padding: '28px !important',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
});

const BenefitIcon = styled(Box)({
  width: '48px',
  height: '48px',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--accent-muted)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '20px',
  color: 'var(--accent-primary)',
});

const BenefitTitle = styled(Typography)({
  fontFamily: 'var(--font-display)',
  fontSize: '16px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  marginBottom: '12px',
});

const BenefitDescription = styled(Typography)({
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  color: 'var(--text-secondary)',
  lineHeight: 1.6,
});

const TabsContainer = styled(Paper)({
  background: 'var(--surface-elevated)',
  border: '1px solid var(--surface-subtle)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'none',
  overflow: 'hidden',
});

const StyledTabs = styled(Tabs)({
  borderBottom: '1px solid var(--surface-subtle)',
  minHeight: '56px',

  '& .MuiTabs-indicator': {
    backgroundColor: 'var(--accent-primary)',
    height: '2px',
  },

  '& .MuiTab-root': {
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    fontSize: '14px',
    color: 'var(--text-secondary)',
    textTransform: 'none',
    minHeight: '56px',
    padding: '16px 24px',
    flex: 1,
    transition: 'color 150ms, background 150ms',
    gap: '8px',

    '&.Mui-selected': {
      color: 'var(--text-primary)',
      background: 'var(--surface-overlay)',
    },

    '&:hover': {
      color: 'var(--text-primary)',
      background: 'var(--surface-overlay)',
    },
  },
});

const TabPanelContent = styled(Box)({
  padding: '24px',
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`trade-finance-tabpanel-${index}`}
      aria-labelledby={`trade-finance-tab-${index}`}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

const TradeFinancePage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const benefits = [
    {
      title: 'Trade Finance Tokenization',
      description: 'Transform traditional trade finance instruments into tokenized assets for increased liquidity and fractionalized ownership.',
      icon: <Landmark size={24} />
    },
    {
      title: 'Global Access & Liquidity',
      description: 'Access trade finance investments worldwide with improved liquidity through blockchain-based tokenization and instant settlement.',
      icon: <Globe size={24} />
    },
    {
      title: 'Transparent Risk Profiles',
      description: 'Detailed risk scoring and complete transparency for all trade finance instruments, with real-time performance tracking.',
      icon: <TrendingUp size={24} />
    },
    {
      title: 'Supply Chain Efficiency',
      description: 'Support business growth and supply chain finance worldwide while earning competitive yields on short-term investments.',
      icon: <Coins size={24} />
    }
  ];

  return (
    <TradeFinanceProvider>
      <PageContainer>
        {/* Hero Section */}
        <HeroSection>
          <Container maxWidth="lg">
            <HeroContent>
              <HeroTitle>Trade Finance Platform</HeroTitle>
              <HeroSubtitle>
                Invest in tokenized trade finance instruments with real-time liquidity
                and settlement. Access short-term, asset-backed opportunities with
                attractive yields.
              </HeroSubtitle>
              <HeroActions>
                <PrimaryButton onClick={() => setTabValue(0)}>
                  Explore Marketplace
                  <ArrowRight size={18} />
                </PrimaryButton>
                <SecondaryButton onClick={() => setTabValue(1)}>
                  View Portfolio
                </SecondaryButton>
              </HeroActions>
            </HeroContent>
          </Container>
        </HeroSection>

        <Container maxWidth="lg">
          {/* Benefits Section */}
          <Box sx={{ mb: 6 }}>
            <SectionHeader>
              <SectionTitle>Benefits of Tokenized Trade Finance</SectionTitle>
              <SectionSubtitle>
                Unlock the power of blockchain-based trade finance with our innovative
                platform that connects investors with global trade opportunities.
              </SectionSubtitle>
            </SectionHeader>

            <Grid container spacing={3}>
              {benefits.map((benefit, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <BenefitCard>
                    <BenefitCardContent>
                      <BenefitIcon>
                        {benefit.icon}
                      </BenefitIcon>
                      <BenefitTitle>{benefit.title}</BenefitTitle>
                      <BenefitDescription>{benefit.description}</BenefitDescription>
                    </BenefitCardContent>
                  </BenefitCard>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Main Tabs */}
          <TabsContainer elevation={0}>
            <StyledTabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              aria-label="trade finance tabs"
            >
              <Tab
                label="Marketplace"
                icon={<FileText size={18} />}
                iconPosition="start"
                id="trade-finance-tab-0"
              />
              <Tab
                label="Portfolio"
                icon={<Briefcase size={18} />}
                iconPosition="start"
                id="trade-finance-tab-1"
              />
              <Tab
                label="Trading"
                icon={<LineChart size={18} />}
                iconPosition="start"
                id="trade-finance-tab-2"
              />
            </StyledTabs>

            <TabPanel value={tabValue} index={0}>
              <TradeFinanceMarketplace />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <TabPanelContent>
                <TradeFinancePortfolio />
              </TabPanelContent>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <TabPanelContent>
                <TradeFinanceTradingInterface />
              </TabPanelContent>
            </TabPanel>
          </TabsContainer>
        </Container>
      </PageContainer>
    </TradeFinanceProvider>
  );
};

export default TradeFinancePage;
