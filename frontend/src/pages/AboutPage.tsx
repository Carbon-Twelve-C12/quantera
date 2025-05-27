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
    'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)' : 
    'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)'};
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

const CardTitle = styled(Typography)<{ isDarkMode?: boolean }>`
  color: ${props => props.isDarkMode ? '#3498DB' : '#1a237e'};
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

const HighlightBox = styled(Box)<{ isDarkMode?: boolean }>`
  background: ${props => props.isDarkMode ? 
    'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)' : 
    'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)'};
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin: 3rem auto;
  max-width: 900px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(26, 35, 126, 0.2);
`;

const StyledList = styled(List)`
  width: 100%;
  padding: 0.75rem 0 0.5rem 0.5rem;
  list-style-type: none;
`;

const StyledListItem = styled(ListItem)<{ isDarkMode?: boolean }>`
  display: flex;
  padding: 0.4rem 0;
  margin-left: 0;
  align-items: center;
  &:before {
    content: "•";
    color: ${props => props.isDarkMode ? '#3498DB' : '#1a237e'};
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
      title: "Institutional Infrastructure",
      description: "Built from the ground up with institutional investors in mind, featuring advanced compliance frameworks, custody solutions, and professional-grade risk management tools."
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
      title: "Intelligent Yield Optimization",
      description: "Our platform includes a sophisticated yield strategy marketplace and auto-compounding features, enabling asset holders to maximize returns through customizable yield-generating strategies."
    },
    {
      title: "Environmental Asset Support",
      description: "Quantera offers specialized features for carbon credits, biodiversity credits, renewable energy certificates, and other environmental assets including impact tracking and verification."
    }
  ];

  const institutionalAdvantages = [
    {
      title: "Professional-Grade Infrastructure",
      description: "Enterprise-ready platform with institutional-grade security, compliance frameworks, and operational excellence designed for sophisticated investors."
    },
    {
      title: "Advanced Risk Management",
      description: "Comprehensive risk assessment tools with real-time monitoring, automated alerts, and sophisticated analytics for portfolio-level risk management."
    },
    {
      title: "Regulatory Compliance",
      description: "Built-in compliance with global regulatory frameworks including MiCA, SEC, FCA, and other major jurisdictions with automated reporting and verification."
    },
    {
      title: "Multi-Asset Universe",
      description: "Support for traditional securities, real estate, bonds, commodities, and environmental assets all within a unified institutional platform."
    },
    {
      title: "Transparent Operations",
      description: "Complete transparency with real-time reporting, immutable audit trails, and verifiable on-chain operations - no more 'trust us' black boxes."
    },
    {
      title: "Capital Efficiency",
      description: "Advanced portfolio management features and intelligent asset allocation strategies designed to optimize capital efficiency for institutional portfolios."
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
      title: "Institutional Services",
      description: "Professional-grade services including advanced custody solutions, portfolio management, and institutional-grade risk analytics."
    },
    {
      title: "Liquidity Pools",
      description: "Advanced AMM with concentrated liquidity positions for optimal capital efficiency and reduced slippage."
    },
    {
      title: "Compliance Engine",
      description: "Multi-jurisdiction regulatory compliance with automated verification, reporting, and risk assessment capabilities."
    },
    {
      title: "L2 Bridge",
      description: "Cross-chain integration with blob data support and optimized gas utilization for efficient asset transfers."
    }
  ];

  const benefits = [
    {
      title: "Institutional Infrastructure",
      description: "Built from the ground up for institutional investors with professional-grade services, custody solutions, and regulatory compliance frameworks."
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
      title: "Superior Capital Efficiency",
      description: "Advanced portfolio management and intelligent asset allocation strategies designed to optimize capital utilization for institutional investors."
    },
    {
      title: "Accelerated Settlement",
      description: "Our technology reduces transaction settlement times from days to minutes, increasing capital efficiency and reducing counterparty risk."
    }
  ];

  const useCases = [
    {
      title: "Institutional Asset Managers",
      description: "Professional-grade tokenization platform with advanced compliance, custody solutions, and institutional-grade portfolio management tools."
    },
    {
      title: "Family Offices & Wealth Managers",
      description: "Sophisticated asset management capabilities with multi-asset support, advanced analytics, and institutional-grade risk management."
    },
    {
      title: "Pension Funds & Endowments",
      description: "Institutional custody solutions with comprehensive compliance frameworks, transparent reporting, and professional-grade operational controls."
    },
    {
      title: "Corporate Treasury Managers",
      description: "Access enhanced yield on treasury holdings through optimized strategies while maintaining appropriate risk parameters and regulatory compliance."
    },
    {
      title: "Real Estate Developers",
      description: "Fractionally tokenize properties with automated dividend distribution, professional-grade custody, and institutional investor access."
    },
    {
      title: "Environmental Asset Issuers",
      description: "Create, track, and trade carbon credits, biodiversity credits, and renewable energy certificates with transparent impact verification."
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
    "Enterprise-Grade Security: 19 critical vulnerabilities identified and fixed",
    "WCAG AAA Accessibility: Complete theme standardization with 7:1 contrast ratios",
    "Advanced Liquidity Solutions with multi-strategy optimization (6-12% APY)",
    "Dynamic fee structures with market condition-based adjustments",
    "Professional institutional dashboard with comprehensive portfolio management",
    "Real-time market analytics and automated rebalancing systems",
    "Enhanced wallet connectivity with secure authentication protocols",
    "Complete cross-chain functionality and institutional-grade infrastructure",
    "Comprehensive security testing and enterprise deployment readiness",
    "Advanced compliance engine supporting global regulatory frameworks"
  ];

  const futureDevelopmentItems = [
    "Enhanced Frontend Components and Mobile Optimization",
    "Security audits and testnet deployment preparation", 
    "Mainnet deployment and institutional marketplace launch",
    "Institutional client onboarding and market maker partnerships",
    "Advanced derivatives and structured products support",
    "Integration with traditional financial infrastructure providers",
    "Cross-asset portfolio optimization and advanced analytics",
    "Direct integration with institutional exchanges and market data providers"
  ];

  return (
    <>
      {/* Hero Section */}
      <Hero isDarkMode={isDarkMode}>
        <Container maxWidth="lg">
          <Typography variant="h2" gutterBottom>
            Revolutionizing Asset Tokenization
          </Typography>
          <Typography variant="h6" sx={{ maxWidth: '800px', mx: 'auto', mb: 3 }}>
            Quantera delivers institutional-grade tokenization infrastructure for the modern economy.
          </Typography>
          <Typography variant="body1" sx={{ maxWidth: '700px', mx: 'auto', opacity: 0.9 }}>
            Professional-grade compliance, advanced risk management, instant settlement, and transparent operations 
            - everything institutional investors need, but faster, more efficient, and completely transparent.
          </Typography>
        </Container>
      </Hero>

      {/* Institutional Infrastructure Highlight */}
      <Section isDarkMode={isDarkMode}>
        <Container maxWidth="lg">
          <HighlightBox isDarkMode={isDarkMode}>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
              Institutional Infrastructure Revolution
            </Typography>
            <Typography variant="h6" sx={{ mb: 2, opacity: 0.95 }}>
              "Building the Bloomberg Terminal of tokenized assets"
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
              Traditional financial infrastructure is stuck in the past with slow settlement, opaque operations, and limited transparency. 
              Quantera delivers institutional-grade services with blockchain efficiency, complete transparency, and professional-grade tools.
            </Typography>
            <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>Seconds</Typography>
                <Typography variant="body2">Settlement vs Days</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>100%</Typography>
                <Typography variant="body2">Transparent Operations</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>24/7</Typography>
                <Typography variant="body2">Real-Time Monitoring</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>Global</Typography>
                <Typography variant="body2">Multi-Jurisdiction</Typography>
              </Box>
            </Box>
          </HighlightBox>
        </Container>
      </Section>

      {/* About Section */}
      <Section isDarkMode={isDarkMode} isAlternate>
        <Container maxWidth="lg">
          <SectionTitle variant="h3" sx={{ 
            color: isDarkMode ? '#3498DB' : '#1a237e' 
          }}>
            About Quantera
          </SectionTitle>
          
          <Box sx={{ maxWidth: '800px', mx: 'auto', mb: 4 }}>
            <Typography variant="body1" paragraph>
              Quantera represents the next evolution in institutional finance - a comprehensive ecosystem that brings 
              professional-grade tokenization services into the blockchain era. We're not just another tokenization platform; 
              we're building the institutional infrastructure that the tokenized economy needs to scale.
            </Typography>
            <Typography variant="body1" paragraph>
              Our platform combines the sophistication of traditional financial services with the transparency, speed, 
              and efficiency of blockchain technology. From advanced compliance and custody solutions to real-time risk 
              management and instant settlement, Quantera delivers everything institutional investors expect, 
              but with the superpowers that only blockchain can provide.
            </Typography>
          </Box>
          
          <NoticeBox isDarkMode={isDarkMode}>
            <Typography variant="h6" sx={{ 
              color: isDarkMode ? '#3498DB' : '#1a237e',
              marginBottom: '8px'
            }}>
              Platform Status: Version 1.3.0 - Enterprise Security Ready
            </Typography>
            <Typography variant="body2">
              Quantera has successfully reached Version 1.3.0 with comprehensive security enhancements and enterprise-grade infrastructure. 
              Our institutional-grade platform features advanced security protocols, multi-strategy optimization (6-12% APY targets), 
              dynamic fee structures, real-time market analytics, and a professional dashboard with comprehensive portfolio management. 
              The platform is production-ready for institutional deployment with advanced compliance frameworks, custody solutions, and professional-grade risk management tools implemented for qualified investors.
            </Typography>
          </NoticeBox>
        </Container>
      </Section>

      {/* Institutional Advantages */}
      <Section isDarkMode={isDarkMode}>
        <Container maxWidth="lg">
          <SectionTitle variant="h3" sx={{ 
            color: isDarkMode ? '#3498DB' : '#1a237e' 
          }}>
            Institutional Advantages
          </SectionTitle>
          <SectionDescription variant="body1">
            Discover how Quantera's institutional-grade features deliver superior performance compared to traditional providers.
          </SectionDescription>
          
          <CardContainer>
            {institutionalAdvantages.map((advantage, index) => (
              <FeatureCard 
                key={index} 
                elevation={3} 
                isDarkMode={isDarkMode} 
                sx={{ 
                  border: `2px solid ${isDarkMode ? '#3498DB' : '#1a237e'}`,
                  background: isDarkMode ? 
                    'linear-gradient(135deg, rgba(52, 152, 219, 0.1) 0%, rgba(63, 81, 181, 0.1) 100%)' :
                    'linear-gradient(135deg, rgba(26, 35, 126, 0.02) 0%, rgba(63, 81, 181, 0.02) 100%)'
                }}
              >
                <CardTitle variant="h5" isDarkMode={isDarkMode}>
                  {advantage.title}
                </CardTitle>
                <CardContent variant="body2">
                  {advantage.description}
                </CardContent>
              </FeatureCard>
            ))}
          </CardContainer>
        </Container>
      </Section>

      {/* Core Features Section */}
      <Section isDarkMode={isDarkMode} isAlternate>
        <Container maxWidth="lg">
          <SectionTitle variant="h3" sx={{ 
            color: isDarkMode ? '#3498DB' : '#1a237e' 
          }}>
            Core Platform Features
          </SectionTitle>
          <SectionDescription variant="body1">
            Quantera provides a comprehensive suite of institutional-grade features designed to transform traditional financial services.
          </SectionDescription>
          
          <CardContainer>
            {features.map((feature, index) => (
              <FeatureCard key={index} elevation={2} isDarkMode={isDarkMode}>
                <CardTitle variant="h5" isDarkMode={isDarkMode}>
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
          <SectionTitle variant="h3" sx={{ 
            color: isDarkMode ? '#3498DB' : '#1a237e' 
          }}>
            The Quantera Advantage
          </SectionTitle>
          <SectionDescription variant="body1">
            Discover the key benefits that set Quantera apart from traditional financial infrastructure.
          </SectionDescription>
          
          <CardContainer>
            {benefits.map((benefit, index) => (
              <FeatureCard 
                key={index} 
                elevation={3} 
                isDarkMode={isDarkMode} 
                sx={{ 
                  border: `1px solid ${isDarkMode ? '#3498DB' : '#1a237e'}`
                }}
              >
                <CardTitle variant="h5" isDarkMode={isDarkMode}>
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
          <SectionTitle variant="h3" sx={{ 
            color: isDarkMode ? '#3498DB' : '#1a237e' 
          }}>
            Technical Architecture
          </SectionTitle>
          <SectionDescription variant="body1">
            Explore the technical architecture and components that power Quantera's institutional infrastructure.
          </SectionDescription>
          
          <CardContainer>
            {architecture.map((item, index) => (
              <FeatureCard key={index} elevation={2} isDarkMode={isDarkMode}>
                <CardTitle variant="h5" isDarkMode={isDarkMode}>
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
          <SectionTitle variant="h3" sx={{ 
            color: isDarkMode ? '#3498DB' : '#1a237e' 
          }}>
            Institutional Use Cases
          </SectionTitle>
          <SectionDescription variant="body1">
            Learn how different types of institutional investors can leverage Quantera's prime brokerage infrastructure.
          </SectionDescription>
          
          <CardContainer>
            {useCases.map((useCase, index) => (
              <FeatureCard key={index} elevation={2} isDarkMode={isDarkMode}>
                <CardTitle variant="h5" isDarkMode={isDarkMode}>
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
          <SectionTitle variant="h3" sx={{ 
            color: isDarkMode ? '#3498DB' : '#1a237e' 
          }}>
            Financial Products
          </SectionTitle>
          <SectionDescription variant="body1">
            Quantera supports a diverse range of financial product tokenization, each with purpose-built features to meet institutional needs.
          </SectionDescription>
          
          <CardContainer>
            {financialProducts.map((product, index) => (
              <FeatureCard key={index} elevation={2} isDarkMode={isDarkMode}>
                <CardTitle variant="h5" isDarkMode={isDarkMode}>
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
              Create Asset
            </Button>
          </Box>
        </Container>
      </Section>

      {/* Roadmap Section */}
      <Section isDarkMode={isDarkMode}>
        <Container maxWidth="lg">
          <SectionTitle variant="h3" sx={{ 
            color: isDarkMode ? '#3498DB' : '#1a237e' 
          }}>
            Platform Status & Vision
          </SectionTitle>
          <SectionDescription variant="body1">
            Quantera has reached Version 1.3.0 with comprehensive security enhancements and enterprise-grade infrastructure:
          </SectionDescription>
          
          <CardContainer>
            <FeatureCard 
              elevation={2} 
              isDarkMode={isDarkMode} 
              sx={{ width: { xs: '100%', md: 'calc(50% - 16px)' } }}
            >
              <CardTitle variant="h5" isDarkMode={isDarkMode}>
                Current Capabilities (v1.3.0)
              </CardTitle>
              <StyledList>
                {currentFocusItems.map((item, index) => (
                  <StyledListItem key={index} isDarkMode={isDarkMode}>{item}</StyledListItem>
                ))}
              </StyledList>
            </FeatureCard>
            
            <FeatureCard 
              elevation={2} 
              isDarkMode={isDarkMode} 
              sx={{ width: { xs: '100%', md: 'calc(50% - 16px)' } }}
            >
              <CardTitle variant="h5" isDarkMode={isDarkMode}>
                Future Development
              </CardTitle>
              <StyledList>
                {futureDevelopmentItems.map((item, index) => (
                  <StyledListItem key={index} isDarkMode={isDarkMode}>{item}</StyledListItem>
                ))}
              </StyledList>
            </FeatureCard>
          </CardContainer>
        </Container>
      </Section>
    </>
  );
};

export default AboutPage; 