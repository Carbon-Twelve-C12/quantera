import React from 'react';
import { Box, Container, Typography as MuiTypography, Paper, List, ListItem, Button } from '@mui/material';
import styled from '@emotion/styled';
import { useTheme } from '../contexts/ThemeContext';

// Base styled components
const Section = styled.section<{ isDarkMode?: boolean; isAlternate?: boolean }>`
  padding: 4rem 0;
  background-color: ${props => {
    if (props.isDarkMode) {
      return props.isAlternate ? '#1E1E1E' : '#121212';
    }
    return props.isAlternate ? '#F5F5F5' : '#ffffff';
  }};
  color: ${props => props.isDarkMode ? '#ffffff' : 'inherit'};
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    max-width: 800px;
    height: 1px;
    background-color: ${props => props.isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
  }
`;

const Hero = styled.div<{ isDarkMode?: boolean }>`
  background: ${props => props.isDarkMode ? 
    'linear-gradient(135deg, #1A237E 0%, #303F9F 100%)' : 
    'linear-gradient(135deg, #1A5276 0%, #3498DB 100%)'};
  color: white;
  padding: 5rem 0;
  text-align: center;
`;

const Typography = styled(MuiTypography)`
  text-align: center;
`;

const SectionTitle = styled(Typography)`
  margin-bottom: 1.5rem;
  font-weight: 600;
`;

const SectionDescription = styled(Typography)`
  max-width: 800px;
  margin: 0 auto 3rem auto;
`;

// Card layout components
const CardContainer = styled(Box)`
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  justify-content: center;
  margin: 0 auto;
  max-width: 1200px;
`;

const FeatureCard = styled(Paper)<{ isDarkMode?: boolean }>`
  background-color: ${props => props.isDarkMode ? '#242424' : '#FFFFFF'};
  color: ${props => props.isDarkMode ? '#E0E0E0' : 'inherit'};
  box-shadow: ${props => props.isDarkMode ? 
    '0 4px 8px rgba(0, 0, 0, 0.5)' : 
    '0 4px 8px rgba(0, 0, 0, 0.1)'};
  border-radius: 8px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  width: calc(33.33% - 16px);
  min-height: 220px;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: ${props => props.isDarkMode ? 
      '0 8px 16px rgba(0, 0, 0, 0.6)' : 
      '0 8px 16px rgba(0, 0, 0, 0.2)'};
  }
  
  @media (max-width: 960px) {
    width: calc(50% - 16px);
  }
  
  @media (max-width: 600px) {
    width: 100%;
  }
`;

const CardTitle = styled(Typography)`
  color: #3498DB;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const CardContent = styled(Typography)`
  flex-grow: 1;
`;

// Special components
const NoticeBox = styled(Box)<{ isDarkMode?: boolean }>`
  background-color: ${props => props.isDarkMode ? '#2C3E50' : '#EBF5FB'};
  border: 1px solid ${props => props.isDarkMode ? '#34495E' : '#AED6F1'};
  padding: 1.5rem;
  border-radius: 8px;
  margin: 2rem auto;
  max-width: 800px;
`;

const StyledList = styled(List)`
  width: 100%;
  padding: 0.75rem 0 0.5rem 0.5rem;
  list-style-type: none;
`;

const StyledListItem = styled(ListItem)`
  display: flex;
  padding: 0.4rem 0;
  margin-left: 0;
  align-items: center;
  &:before {
    content: "•";
    color: #3498DB;
    font-weight: bold;
    display: inline-block; 
    width: 1em;
    margin-right: 0.5em;
    font-size: 1.2em;
  }
`;

const AboutPage: React.FC = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Data arrays for content
  const features = [
    {
      title: "Asset-Agnostic Tokenization",
      description: "Our modular architecture allows tokenization of virtually any asset class, from treasury securities to real estate, corporate bonds, environmental assets, and more. Each asset class benefits from specialized templates and configurations."
    },
    {
      title: "Advanced Liquidity Solutions",
      description: "Quantera's liquidity pools feature concentrated liquidity positions for superior capital efficiency, optimizing the trading experience and reducing slippage for tokenized assets."
    },
    {
      title: "Intelligent Yield Optimization",
      description: "Our platform includes a sophisticated yield strategy marketplace and auto-compounding features, enabling asset holders to maximize returns through customizable yield-generating strategies."
    },
    {
      title: "Smart Account Integration",
      description: "Leveraging EIP-7702, Quantera provides programmable account logic that enables automated investment strategies, portfolio rebalancing, and sophisticated asset management capabilities."
    },
    {
      title: "Cross-Chain Interoperability",
      description: "Experience seamless asset movement across multiple blockchains with our advanced L2 Bridge, providing a unified experience with transparent gas cost estimation."
    },
    {
      title: "Environmental Asset Support",
      description: "Quantera offers specialized features for carbon credits, biodiversity credits, renewable energy certificates, and other environmental assets including impact tracking and verification."
    },
    {
      title: "Trade Finance Solutions",
      description: "Our platform provides specialized support for trade finance instruments including letters of credit, invoice receivables, warehouse receipts, and supply chain finance."
    }
  ];

  const architecture = [
    {
      title: "Asset Factory",
      description: "Modular system for creating and managing tokenized assets with customizable templates for different asset classes."
    },
    {
      title: "Treasury Registry",
      description: "Central registry for all tokenized assets with comprehensive compliance and regulatory controls."
    },
    {
      title: "Liquidity Pools",
      description: "Advanced AMM with concentrated liquidity positions for optimal capital efficiency and reduced slippage."
    },
    {
      title: "Yield Optimizer",
      description: "Strategy marketplace for yield maximization with risk parameters and auto-compounding capabilities."
    },
    {
      title: "L2 Bridge",
      description: "Cross-chain integration with blob data support and optimized gas utilization for efficient asset transfers."
    },
    {
      title: "Impact Tracker",
      description: "Measurement and verification system for environmental impacts with standardized reporting frameworks."
    }
  ];

  const benefits = [
    {
      title: "Superior Security Architecture",
      description: "Our multi-layered security infrastructure exceeds industry standards, ensuring your digital assets remain protected at all times."
    },
    {
      title: "Enhanced Transparency",
      description: "Real-time reporting and immutable transaction records provide unprecedented visibility into asset performance and history."
    },
    {
      title: "Regulatory Foresight",
      description: "Our platform is built from the ground up with regulatory compliance in mind, future-proofing your investments against evolving requirements."
    },
    {
      title: "Broader Asset Accessibility",
      description: "Quantera's flexible tokenization framework accommodates a wider range of asset classes, opening new investment frontiers."
    },
    {
      title: "Accelerated Settlement",
      description: "Our technology reduces transaction settlement times from days to minutes, increasing capital efficiency and reducing counterparty risk."
    }
  ];

  const useCases = [
    {
      title: "Institutional Asset Managers",
      description: "Tokenize traditional securities with compliance and regulatory controls while accessing enhanced liquidity and yield opportunities."
    },
    {
      title: "Environmental Asset Issuers",
      description: "Create, track, and trade carbon credits, biodiversity credits, and renewable energy certificates with transparent impact verification."
    },
    {
      title: "Real Estate Developers",
      description: "Fractionally tokenize properties with automated dividend distribution and liquidity pool integration."
    },
    {
      title: "Treasury Managers",
      description: "Access enhanced yield on treasury holdings through optimized strategies while maintaining appropriate risk parameters."
    },
    {
      title: "Cross-Chain Investors",
      description: "Move assets seamlessly between blockchain ecosystems with transparent gas costs and optimized transactions."
    },
    {
      title: "Trade Finance Participants",
      description: "Digitize and fractionally sell trade finance instruments like letters of credit, invoice receivables, and warehouse receipts with automated settlements."
    }
  ];

  const financialProducts = [
    {
      title: "Tokenized Securities",
      description: "Convert traditional securities into digital tokens with built-in compliance, automated dividends, and seamless transferability."
    },
    {
      title: "Real Estate Tokens",
      description: "Transform illiquid real estate assets into fractional, tradable tokens with automated rent distribution and transparent ownership."
    },
    {
      title: "Fund Tokens",
      description: "Enable efficient fund participation with reduced minimums, automated NAV calculations, and programmable redemption terms."
    },
    {
      title: "Environmental Assets",
      description: "Tokenize carbon credits, biodiversity credits, and renewable energy certificates with transparent impact verification."
    },
    {
      title: "Fixed Income",
      description: "Tokenize bonds, notes, and other debt instruments with automated interest payments and transparent maturity tracking."
    },
    {
      title: "Trade Finance Instruments",
      description: "Tokenize letters of credit, invoice receivables, and warehouse receipts with automated settlement and verification."
    }
  ];

  const currentFocusItems = [
    "Enhanced wallet connectivity with WalletKit integration",
    "Complete cross-chain functionality and white-label solutions",
    "Comprehensive testing, security audits, and deployment preparation",
    "Marketplace launch and partner onboarding",
    "Trade finance settlement automation and verification",
    "Tokenized Treasury and bond infrastructure with automated distributions"
  ];

  const futureDevelopmentItems = [
    "Portfolio management dashboard with cross-asset analytics",
    "Enhanced analytics and institutional risk management tools",
    "Automated trade finance KYC/AML verification framework",
    "Equity tokenization with corporate action processing",
    "Direct Treasury auction participation mechanism",
    "Cross-asset collateralization and margin management",
    "Institutional-grade custody and governance solutions",
    //"Environmental impact metrics API and verification",
    //"ESG scoring and impact visualization dashboards",
  ];

  return (
    <>
      {/* Hero Section */}
      <Hero isDarkMode={isDarkMode}>
        <Container maxWidth="lg">
          <Typography variant="h2" gutterBottom>
            Revolutionizing Asset Tokenization
          </Typography>
          <Typography variant="h6" sx={{ maxWidth: '800px', mx: 'auto' }}>
            Quantera is a comprehensive ecosystem designed to tokenize any financial product with advanced liquidity solutions, yield optimization, and cross-chain interoperability.
          </Typography>
        </Container>
      </Hero>

      {/* About Section */}
      <Section isDarkMode={isDarkMode}>
        <Container maxWidth="lg">
          <SectionTitle variant="h3" color="primary">
            About Quantera
          </SectionTitle>
          
          <Box sx={{ maxWidth: '800px', mx: 'auto', mb: 4 }}>
            <Typography variant="body1" paragraph>
              Quantera represents the next evolution in tokenized financial products. The platform is architecturally designed for multi-asset support with superior liquidity solutions, yield optimization, and cross-chain interoperability.
            </Typography>
            <Typography variant="body1" paragraph>
              Leveraging Ethereum's capabilities and extending across multiple blockchains, Quantera aims to become the leading tokenization platform globally, serving both institutional and individual investors. The platform provides specialized support for trade finance and environmental instruments, positioning Quantera at the forefront of tokenization platforms.
            </Typography>
          </Box>
          
          <NoticeBox isDarkMode={isDarkMode}>
            <Typography variant="h6" color="primary" gutterBottom>
              Platform Status: Version 0.9.8
            </Typography>
            <Typography variant="body2">
              The assets listed on this platform have not yet been fully custodied and are presented for demonstration purposes only. Quantera Finance is currently in development, and the platform features, assets, and functionalities shown may not reflect the final product. Investors should not make investment decisions based on the information presented without conducting proper due diligence.
            </Typography>
          </NoticeBox>
        </Container>
      </Section>

      {/* Core Features Section */}
      <Section isDarkMode={isDarkMode} isAlternate>
        <Container maxWidth="lg">
          <SectionTitle variant="h3" color="primary">
            Core Platform Features
          </SectionTitle>
          <SectionDescription variant="body1">
            Quantera provides a comprehensive suite of features designed to transform traditional financial assets into efficient tokenized financial products.
          </SectionDescription>
          
          <CardContainer>
            {features.map((feature, index) => (
              <FeatureCard key={index} elevation={2} isDarkMode={isDarkMode}>
                <CardTitle variant="h5" color="primary">
                  {feature.title}
                </CardTitle>
                <CardContent variant="body2">
                  {feature.description}
                </CardContent>
              </FeatureCard>
            ))}
          </CardContainer>
        </Container>
      </Section>

      {/* Key Benefits Section */}
      <Section isDarkMode={isDarkMode}>
        <Container maxWidth="lg">
          <SectionTitle variant="h3" color="primary">
            The Quantera Advantage
          </SectionTitle>
          <SectionDescription variant="body1">
            Discover the key benefits that set Quantera apart from traditional tokenization platforms.
          </SectionDescription>
          
          <CardContainer>
            {benefits.map((benefit, index) => (
              <FeatureCard 
                key={index} 
                elevation={3} 
                isDarkMode={isDarkMode} 
                sx={{ 
                  border: '1px solid #3498DB'
                }}
              >
                <CardTitle variant="h5" color="primary">
                  {benefit.title}
                </CardTitle>
                <CardContent variant="body2">
                  {benefit.description}
                </CardContent>
              </FeatureCard>
            ))}
          </CardContainer>
        </Container>
      </Section>

      {/* Technical Architecture Section */}
      <Section isDarkMode={isDarkMode} isAlternate>
        <Container maxWidth="lg">
          <SectionTitle variant="h3" color="primary">
            Technical Architecture
          </SectionTitle>
          <SectionDescription variant="body1">
            Explore the technical architecture and components that power the Quantera platform.
          </SectionDescription>
          
          <CardContainer>
            {architecture.map((item, index) => (
              <FeatureCard key={index} elevation={2} isDarkMode={isDarkMode}>
                <CardTitle variant="h5" color="primary">
                  {item.title}
                </CardTitle>
                <CardContent variant="body2">
                  {item.description}
                </CardContent>
              </FeatureCard>
            ))}
          </CardContainer>
        </Container>
      </Section>

      {/* Use Cases Section */}
      <Section isDarkMode={isDarkMode}>
        <Container maxWidth="lg">
          <SectionTitle variant="h3" color="primary">
            Use Cases & Applications
          </SectionTitle>
          <SectionDescription variant="body1">
            Learn how different types of users can leverage Quantera's platform capabilities.
          </SectionDescription>
          
          <CardContainer>
            {useCases.map((useCase, index) => (
              <FeatureCard key={index} elevation={2} isDarkMode={isDarkMode}>
                <CardTitle variant="h5" color="primary">
                  {useCase.title}
                </CardTitle>
                <CardContent variant="body2">
                  {useCase.description}
                </CardContent>
              </FeatureCard>
            ))}
          </CardContainer>
        </Container>
      </Section>

      {/* Financial Products Section */}
      <Section isDarkMode={isDarkMode} isAlternate>
        <Container maxWidth="lg">
          <SectionTitle variant="h3" color="primary">
            Financial Products
          </SectionTitle>
          <SectionDescription variant="body1">
            Quantera supports a diverse range of financial product tokenization, each with purpose-built features to meet specific market needs.
          </SectionDescription>
          
          <CardContainer>
            {financialProducts.map((product, index) => (
              <FeatureCard key={index} elevation={2} isDarkMode={isDarkMode}>
                <CardTitle variant="h5" color="primary">
                  {product.title}
                </CardTitle>
                <CardContent variant="body2">
                  {product.description}
                </CardContent>
              </FeatureCard>
            ))}
          </CardContainer>
          
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              href="/assets/create"
            >
              Create New Asset
            </Button>
          </Box>
        </Container>
      </Section>

      {/* Roadmap Section */}
      <Section isDarkMode={isDarkMode}>
        <Container maxWidth="lg">
          <SectionTitle variant="h3" color="primary">
            Roadmap & Vision
          </SectionTitle>
          <SectionDescription variant="body1">
            Quantera is currently at Version 0.9.4 with the following focus areas:
          </SectionDescription>
          
          <CardContainer>
            <FeatureCard 
              elevation={2} 
              isDarkMode={isDarkMode} 
              sx={{ width: { xs: '100%', md: 'calc(50% - 16px)' } }}
            >
              <CardTitle variant="h5" color="primary">
                Recent Achievements
              </CardTitle>
              <StyledList>
                <StyledListItem>Standardized security patterns across all core contracts</StyledListItem>
                <StyledListItem>Custom errors for gas-efficient error handling</StyledListItem>
                <StyledListItem>Enhanced role-based access control in critical functions</StyledListItem>
                <StyledListItem>Improved checks-effects-interactions pattern implementation</StyledListItem>
                <StyledListItem>Comprehensive security guidelines documentation</StyledListItem>
                <StyledListItem>Advanced analytics and ESG scoring dashboards</StyledListItem>
                <StyledListItem>Comprehensive trade finance marketplace and trading interface</StyledListItem>
                <StyledListItem>Portfolio management dashboard with cross-asset analytics</StyledListItem>
              </StyledList>
            </FeatureCard>
            
            <FeatureCard 
              elevation={2} 
              isDarkMode={isDarkMode} 
              sx={{ width: { xs: '100%', md: 'calc(50% - 16px)' } }}
            >
              <CardTitle variant="h5" color="primary">
                Current Focus & Next Steps
              </CardTitle>
              <StyledList>
                <StyledListItem>Expand test coverage to 95%+ for all contracts</StyledListItem>
                <StyledListItem>Perform cross-chain testing on testnet environments</StyledListItem>
                <StyledListItem>Validate environmental asset verification mechanisms with third-party auditors</StyledListItem>
                <StyledListItem>Complete external security audit</StyledListItem>
                <StyledListItem>Partner onboarding and marketplace launch</StyledListItem>
                <StyledListItem>Ongoing regulatory and compliance enhancements</StyledListItem>
              </StyledList>
            </FeatureCard>
          </CardContainer>
        </Container>
      </Section>
    </>
  );
};

export default AboutPage; 