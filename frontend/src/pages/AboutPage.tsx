import React from 'react';
import { Box, Container, Typography, Paper, List, ListItem, ListItemText, Alert } from '@mui/material';
import CompatGrid from '../components/common/CompatGrid';
import styled from '@emotion/styled';
import { useTheme } from '../contexts/ThemeContext';

// Theme-aware styled components
const Hero = styled.div<{ isDarkMode?: boolean }>`
  background: ${props => props.isDarkMode ? 
    'linear-gradient(135deg, #1A237E 0%, #303F9F 100%)' : 
    'linear-gradient(135deg, #1A5276 0%, #3498DB 100%)'};
  color: white;
  padding: 5rem 0;
  text-align: center;
`;

const Section = styled.section<{ isDarkMode?: boolean }>`
  padding: 4rem 0;
  background-color: ${props => props.isDarkMode ? '#121212' : '#ffffff'};
  color: ${props => props.isDarkMode ? '#ffffff' : 'inherit'};
`;

const LightSection = styled(Section)<{ isDarkMode?: boolean }>`
  background-color: ${props => props.isDarkMode ? '#1E1E1E' : '#F5F5F5'};
`;

const DarkSection = styled(Section)<{ isDarkMode?: boolean }>`
  background-color: ${props => props.isDarkMode ? '#121212' : '#FFFFFF'};
`;

// Base card styling to ensure consistency
const StyledCard = styled(Paper)<{ isDarkMode?: boolean }>`
  height: 100%;
  width: 100%;
  background-color: ${props => props.isDarkMode ? '#242424' : '#FFFFFF'};
  color: ${props => props.isDarkMode ? '#E0E0E0' : 'inherit'};
  box-shadow: ${props => props.isDarkMode ? 
    '0 4px 8px rgba(0, 0, 0, 0.5)' : 
    '0 4px 8px rgba(0, 0, 0, 0.1)'};
  display: flex;
  flex-direction: column;
  border-radius: 8px;
`;

const FeatureCard = styled(StyledCard)`
  padding: 2rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  &:hover {
    transform: translateY(-5px);
    box-shadow: ${props => props.isDarkMode ? 
      '0 8px 16px rgba(0, 0, 0, 0.7)' : 
      '0 8px 16px rgba(0, 0, 0, 0.2)'};
  }
`;

const ArchCard = styled(StyledCard)`
  padding: 1.5rem;
  border-top: 4px solid #1A5276;
`;

const ComparisonCard = styled(StyledCard)`
  padding: 2rem;
  margin-bottom: 2rem;
`;

const UseCase = styled(StyledCard)`
  padding: 1.5rem;
  border-left: 4px solid #27AE60;
`;

const TimelineItem = styled(StyledCard)`
  padding: 2rem;
`;

const AdvantageCard = styled(StyledCard)`
  padding: 2rem;
  border-left: 4px solid #1A5276;
  margin-bottom: 1rem;
`;

const DisclaimerBox = styled(Box)<{ isDarkMode?: boolean }>`
  background-color: ${props => props.isDarkMode ? '#2C3E50' : '#EBF5FB'};
  border: 1px solid ${props => props.isDarkMode ? '#34495E' : '#AED6F1'};
  padding: 1.5rem;
  border-radius: 8px;
  margin: 2rem 0;
`;

// Custom Grid container to ensure consistent layouts
const GridContainer = styled(CompatGrid)`
  width: 100%;
  margin: 0 auto;
`;

const AboutPage: React.FC = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <>
      <Hero isDarkMode={isDarkMode}>
        <Container maxWidth="lg">
          <Typography variant="h2" gutterBottom>
            Revolutionizing Asset Tokenization
          </Typography>
          <Typography variant="h6" sx={{ maxWidth: 800, mx: 'auto' }}>
            Quantera is a comprehensive ecosystem designed to tokenize any financial asset class with advanced liquidity solutions, yield optimization, and cross-chain interoperability.
          </Typography>
        </Container>
      </Hero>

      <Section isDarkMode={isDarkMode}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" color="primary" gutterBottom>
            About Quantera
          </Typography>
          <Typography variant="body1" align="center" paragraph sx={{ maxWidth: 800, mx: 'auto' }}>
            Quantera represents the next evolution in asset tokenization platforms. The platform is architecturally designed for multi-asset support with superior liquidity solutions, yield optimization, and cross-chain interoperability.
          </Typography>
          <Typography variant="body1" align="center" paragraph sx={{ maxWidth: 800, mx: 'auto' }}>
            Leveraging Ethereum's capabilities and extending across multiple blockchains, Quantera aims to become the leading tokenization platform globally, serving both institutional and individual investors. The platform provides specialized support for environmental assets and sustainable finance instruments, positioning Quantera at the forefront of Web3 sustainability solutions.
          </Typography>
          
          <DisclaimerBox isDarkMode={isDarkMode}>
            <Typography variant="h6" color="primary" gutterBottom>
              Important Notice
            </Typography>
            <Typography variant="body2">
              The assets listed on this platform have not yet been fully custodied and are presented for demonstration purposes only. Quantera Finance is currently in development, and the platform features, assets, and functionalities shown may not reflect the final product. Investors should not make investment decisions based on the information presented without conducting proper due diligence. The platform does not currently offer actual investment opportunities in the assets displayed.
            </Typography>
          </DisclaimerBox>
        </Container>
      </Section>

      <DarkSection isDarkMode={isDarkMode}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" color="primary" gutterBottom>
            Core Platform Features
          </Typography>
          <GridContainer container spacing={3} sx={{ mt: 4 }}>
            {/* Row 1 */}
            <CompatGrid item xs={12} md={4}>
              <FeatureCard elevation={2} isDarkMode={isDarkMode}>
                <Typography variant="h5" color="primary" gutterBottom>
                  Asset-Agnostic Tokenization
                </Typography>
                <Typography variant="body2">
                  Our modular architecture allows tokenization of virtually any asset class, from treasury securities to real estate, corporate bonds, environmental assets, intellectual property, and more. Each asset class benefits from specialized templates and configurations tailored to its unique characteristics.
                </Typography>
              </FeatureCard>
            </CompatGrid>
            <CompatGrid item xs={12} md={4}>
              <FeatureCard elevation={2} isDarkMode={isDarkMode}>
                <Typography variant="h5" color="primary" gutterBottom>
                  Advanced Liquidity Solutions
                </Typography>
                <Typography variant="body2">
                  Quantera's liquidity pools feature concentrated liquidity positions for superior capital efficiency, optimizing the trading experience and reducing slippage for tokenized assets. This enables institutional-grade liquidity for traditionally illiquid assets.
                </Typography>
              </FeatureCard>
            </CompatGrid>
            <CompatGrid item xs={12} md={4}>
              <FeatureCard elevation={2} isDarkMode={isDarkMode}>
                <Typography variant="h5" color="primary" gutterBottom>
                  Intelligent Yield Optimization
                </Typography>
                <Typography variant="body2">
                  Our platform includes a sophisticated yield strategy marketplace and auto-compounding features, enabling asset holders to maximize returns through customizable yield-generating strategies while maintaining risk parameters.
                </Typography>
              </FeatureCard>
            </CompatGrid>
            
            {/* Row 2 */}
            <CompatGrid item xs={12} md={4}>
              <FeatureCard elevation={2} isDarkMode={isDarkMode}>
                <Typography variant="h5" color="primary" gutterBottom>
                  Smart Account Integration
                </Typography>
                <Typography variant="body2">
                  Leveraging EIP-7702, Quantera provides programmable account logic that enables automated investment strategies, portfolio rebalancing, and sophisticated asset management capabilities through customizable smart account templates.
                </Typography>
              </FeatureCard>
            </CompatGrid>
            <CompatGrid item xs={12} md={4}>
              <FeatureCard elevation={2} isDarkMode={isDarkMode}>
                <Typography variant="h5" color="primary" gutterBottom>
                  Cross-Chain Interoperability
                </Typography>
                <Typography variant="body2">
                  Experience seamless asset movement across multiple blockchains with our advanced L2 Bridge, providing a unified experience with transparent gas cost estimation and optimized cross-chain transactions.
                </Typography>
              </FeatureCard>
            </CompatGrid>
            <CompatGrid item xs={12} md={4}>
              <FeatureCard elevation={2} isDarkMode={isDarkMode}>
                <Typography variant="h5" color="primary" gutterBottom>
                  Environmental Asset Support
                </Typography>
                <Typography variant="body2">
                  Quantera offers specialized features for carbon credits, biodiversity credits, renewable energy certificates, and other environmental assets, including comprehensive impact tracking, verification mechanisms, and sustainability reporting.
                </Typography>
              </FeatureCard>
            </CompatGrid>
          </GridContainer>
        </Container>
      </DarkSection>

      <Section isDarkMode={isDarkMode}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" color="primary" gutterBottom>
            Technical Architecture
          </Typography>
          <GridContainer container spacing={3} sx={{ mt: 4 }}>
            {/* Row 1 */}
            <CompatGrid item xs={12} md={4}>
              <ArchCard elevation={2} isDarkMode={isDarkMode}>
                <Typography variant="h5" color="primary" gutterBottom>
                  Asset Factory
                </Typography>
                <Typography variant="body2">
                  Modular system for creating and managing tokenized assets with customizable templates for different asset classes.
                </Typography>
              </ArchCard>
            </CompatGrid>
            <CompatGrid item xs={12} md={4}>
              <ArchCard elevation={2} isDarkMode={isDarkMode}>
                <Typography variant="h5" color="primary" gutterBottom>
                  Treasury Registry
                </Typography>
                <Typography variant="body2">
                  Central registry for all tokenized assets with comprehensive compliance and regulatory controls.
                </Typography>
              </ArchCard>
            </CompatGrid>
            <CompatGrid item xs={12} md={4}>
              <ArchCard elevation={2} isDarkMode={isDarkMode}>
                <Typography variant="h5" color="primary" gutterBottom>
                  Liquidity Pools
                </Typography>
                <Typography variant="body2">
                  Advanced AMM with concentrated liquidity positions for optimal capital efficiency and reduced slippage.
                </Typography>
              </ArchCard>
            </CompatGrid>
            
            {/* Row 2 */}
            <CompatGrid item xs={12} md={4}>
              <ArchCard elevation={2} isDarkMode={isDarkMode}>
                <Typography variant="h5" color="primary" gutterBottom>
                  Yield Optimizer
                </Typography>
                <Typography variant="body2">
                  Strategy marketplace for yield maximization with risk parameters and auto-compounding capabilities.
                </Typography>
              </ArchCard>
            </CompatGrid>
            <CompatGrid item xs={12} md={4}>
              <ArchCard elevation={2} isDarkMode={isDarkMode}>
                <Typography variant="h5" color="primary" gutterBottom>
                  L2 Bridge
                </Typography>
                <Typography variant="body2">
                  Cross-chain integration with blob data support and optimized gas utilization for efficient asset transfers.
                </Typography>
              </ArchCard>
            </CompatGrid>
            <CompatGrid item xs={12} md={4}>
              <ArchCard elevation={2} isDarkMode={isDarkMode}>
                <Typography variant="h5" color="primary" gutterBottom>
                  Impact Tracker
                </Typography>
                <Typography variant="body2">
                  Measurement and verification system for environmental impacts with standardized reporting frameworks.
                </Typography>
              </ArchCard>
            </CompatGrid>
          </GridContainer>
        </Container>
      </Section>

      <LightSection isDarkMode={isDarkMode}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" color="primary" gutterBottom sx={{ mb: 4 }}>
            The Quantera Advantage
          </Typography>
          
          <AdvantageCard elevation={2} isDarkMode={isDarkMode}>
            <Typography variant="h5" color="primary" gutterBottom>
              Superior Security Architecture
            </Typography>
            <Typography variant="body2">
              Our multi-layered security infrastructure exceeds industry standards, ensuring your digital assets remain protected at all times.
            </Typography>
          </AdvantageCard>
          
          <AdvantageCard elevation={2} isDarkMode={isDarkMode}>
            <Typography variant="h5" color="primary" gutterBottom>
              Enhanced Transparency
            </Typography>
            <Typography variant="body2">
              Real-time reporting and immutable transaction records provide unprecedented visibility into asset performance and history.
            </Typography>
          </AdvantageCard>
          
          <AdvantageCard elevation={2} isDarkMode={isDarkMode}>
            <Typography variant="h5" color="primary" gutterBottom>
              Regulatory Foresight
            </Typography>
            <Typography variant="body2">
              Our platform is built from the ground up with regulatory compliance in mind, future-proofing your investments against evolving requirements.
            </Typography>
          </AdvantageCard>
          
          <AdvantageCard elevation={2} isDarkMode={isDarkMode}>
            <Typography variant="h5" color="primary" gutterBottom>
              Broader Asset Accessibility
            </Typography>
            <Typography variant="body2">
              Quantera's flexible tokenization framework accommodates a wider range of asset classes, opening new investment frontiers.
            </Typography>
          </AdvantageCard>
          
          <AdvantageCard elevation={2} isDarkMode={isDarkMode}>
            <Typography variant="h5" color="primary" gutterBottom>
              Intuitive User Experience
            </Typography>
            <Typography variant="body2">
              Designed with both institutional and individual investors in mind, our platform simplifies complex financial processes without sacrificing sophistication.
            </Typography>
          </AdvantageCard>
          
          <AdvantageCard elevation={2} isDarkMode={isDarkMode}>
            <Typography variant="h5" color="primary" gutterBottom>
              Accelerated Settlement
            </Typography>
            <Typography variant="body2">
              Our technology reduces transaction settlement times from days to minutes, increasing capital efficiency and reducing counterparty risk.
            </Typography>
          </AdvantageCard>
          
          <Typography variant="body1" align="center" sx={{ mt: 4 }}>
            By combining cutting-edge blockchain technology with deep financial expertise, Quantera is creating the new standard for digital asset management and investment.
          </Typography>
        </Container>
      </LightSection>
      
      <DarkSection isDarkMode={isDarkMode}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" color="primary" gutterBottom>
            Competitive Advantages
          </Typography>
          <Typography variant="body1" align="center" paragraph sx={{ maxWidth: 800, mx: 'auto', mb: 5 }}>
            Quantera offers several distinct advantages that position it as the superior choice for asset tokenization.
          </Typography>

          <ComparisonCard elevation={3} isDarkMode={isDarkMode}>
            <Typography variant="h4" color="primary" gutterBottom>
              Market-Leading Asset Tokenization Platform
            </Typography>
            <Typography variant="body1" paragraph>
              Quantera differentiates itself from traditional RWA tokenization platforms with powerful advantages:
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="Broader Asset Support" 
                  secondary="Our platform supports a comprehensive range of assets including treasury securities, environmental assets, intellectual property, real estate, and more through specialized templates and configurations."
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Superior Liquidity Solutions" 
                  secondary="Concentrated liquidity pools offer significantly better capital efficiency than traditional pool designs, reducing slippage and improving trading experience even for traditionally illiquid assets."
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Advanced Yield Strategies" 
                  secondary="Unlike basic lending yield platforms, Quantera provides a comprehensive strategy marketplace with automated optimization and risk parameters to maximize returns."
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Smart Account Integration" 
                  secondary="EIP-7702 support enables programmable accounts with automated strategies not typically available in legacy tokenization platforms."
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Environmental Leadership" 
                  secondary="Specialized capabilities for carbon credits, biodiversity credits, and comprehensive impact tracking that go far beyond what most platforms offer."
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Enhanced User Experience" 
                  secondary="Our asset image upload capabilities and customizable asset creation wizard provide a more intuitive, visual interface compared to typical tokenization platforms."
                />
              </ListItem>
            </List>
          </ComparisonCard>

          <ComparisonCard elevation={3} sx={{ mt: 4 }} isDarkMode={isDarkMode}>
            <Typography variant="h4" color="primary" gutterBottom>
              Beyond Traditional Security Token Platforms
            </Typography>
            <Typography variant="body1" paragraph>
              Quantera transcends the limitations of standard security token platforms with these key advantages:
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="Integrated Liquidity Solutions" 
                  secondary="Unlike platforms focused solely on tokenization, Quantera provides integrated liquidity pools with concentrated positions, creating active markets for tokenized assets."
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Yield Optimization" 
                  secondary="Where many platforms lack native yield generation, Quantera offers sophisticated yield strategies and auto-compounding capabilities for enhanced returns."
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Cross-Chain Functionality" 
                  secondary="While most platforms operate primarily on single networks, Quantera offers seamless cross-chain asset movement with optimized gas utilization."
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Environmental Asset Focus" 
                  secondary="Our specialized support for environmental assets and impact tracking provides ESG capabilities unavailable on typical tokenization platforms."
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Open Architecture" 
                  secondary="Instead of proprietary systems, Quantera embraces open standards and interoperability, enabling broader ecosystem integration."
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Developer Ecosystem" 
                  secondary="Our comprehensive SDK and developer tools allow for extending the platform's capabilities far beyond what typical tokenization platforms provide."
                />
              </ListItem>
            </List>
          </ComparisonCard>
        </Container>
      </DarkSection>

      <Section isDarkMode={isDarkMode}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" color="primary" gutterBottom>
            Use Cases & Applications
          </Typography>
          <GridContainer container spacing={3} sx={{ mt: 4 }}>
            {/* Row 1 */}
            <CompatGrid item xs={12} md={4}>
              <UseCase elevation={2} isDarkMode={isDarkMode}>
                <Typography variant="h5" color="secondary" gutterBottom>
                  Institutional Asset Managers
                </Typography>
                <Typography variant="body2">
                  Tokenize traditional securities with compliance and regulatory controls while accessing enhanced liquidity and yield opportunities.
                </Typography>
              </UseCase>
            </CompatGrid>
            <CompatGrid item xs={12} md={4}>
              <UseCase elevation={2} isDarkMode={isDarkMode}>
                <Typography variant="h5" color="secondary" gutterBottom>
                  Environmental Asset Issuers
                </Typography>
                <Typography variant="body2">
                  Create, track, and trade carbon credits, biodiversity credits, and renewable energy certificates with transparent impact verification.
                </Typography>
              </UseCase>
            </CompatGrid>
            <CompatGrid item xs={12} md={4}>
              <UseCase elevation={2} isDarkMode={isDarkMode}>
                <Typography variant="h5" color="secondary" gutterBottom>
                  Real Estate Developers
                </Typography>
                <Typography variant="body2">
                  Fractionally tokenize properties with automated dividend distribution and liquidity pool integration.
                </Typography>
              </UseCase>
            </CompatGrid>
            
            {/* Row 2 */}
            <CompatGrid item xs={12} md={4}>
              <UseCase elevation={2} isDarkMode={isDarkMode}>
                <Typography variant="h5" color="secondary" gutterBottom>
                  Treasury Managers
                </Typography>
                <Typography variant="body2">
                  Access enhanced yield on treasury holdings through optimized strategies while maintaining appropriate risk parameters.
                </Typography>
              </UseCase>
            </CompatGrid>
            <CompatGrid item xs={12} md={4}>
              <UseCase elevation={2} isDarkMode={isDarkMode}>
                <Typography variant="h5" color="secondary" gutterBottom>
                  Cross-Chain Investors
                </Typography>
                <Typography variant="body2">
                  Move assets seamlessly between blockchain ecosystems with transparent gas costs and optimized transactions.
                </Typography>
              </UseCase>
            </CompatGrid>
            <CompatGrid item xs={12} md={4}>
              <UseCase elevation={2} isDarkMode={isDarkMode}>
                <Typography variant="h5" color="secondary" gutterBottom>
                  Impact Investors
                </Typography>
                <Typography variant="body2">
                  Track, verify, and report on environmental and social impacts of investments with standardized metrics.
                </Typography>
              </UseCase>
            </CompatGrid>
          </GridContainer>
        </Container>
      </Section>

      <DarkSection isDarkMode={isDarkMode}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" color="primary" gutterBottom>
            Roadmap & Vision
          </Typography>
          <Typography variant="body1" align="center" paragraph sx={{ maxWidth: 800, mx: 'auto', mb: 5 }}>
            Quantera is currently at Version 0.8.0 (80% complete) with the following timeline:
          </Typography>
          <GridContainer container spacing={4}>
            <CompatGrid item xs={12} md={6}>
              <TimelineItem elevation={2} isDarkMode={isDarkMode}>
                <Typography variant="h5" color="primary" gutterBottom>
                  Current Focus: Asset Creation & Management
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="Complete frontend interfaces for liquidity pools and asset creation" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Implement cross-chain functionality and white-label solutions" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Comprehensive testing, security audits, and deployment preparation" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Marketplace launch and partner onboarding" />
                  </ListItem>
                </List>
              </TimelineItem>
            </CompatGrid>
            <CompatGrid item xs={12} md={6}>
              <TimelineItem elevation={2} isDarkMode={isDarkMode}>
                <Typography variant="h5" color="primary" gutterBottom>
                  Future Developments
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="Enhanced analytics and reporting capabilities" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Environmental impact metrics API" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Portfolio management dashboard" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="ESG scoring and impact visualization dashboards" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Comprehensive monitoring system" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Validation of environmental asset verification mechanisms" />
                  </ListItem>
                </List>
              </TimelineItem>
            </CompatGrid>
          </GridContainer>
        </Container>
      </DarkSection>
    </>
  );
};

export default AboutPage; 