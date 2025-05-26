import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { 
  Download, 
  Shield, 
  TrendingUp, 
  Globe, 
  CheckCircle, 
  FileText,
  Code,
  BarChart3,
  Lock,
  Users,
  Zap
} from 'lucide-react';

const HeroSection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)',
  color: '#ffffff',
  padding: '120px 0 80px',
  position: 'relative',
  overflow: 'hidden',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
  },
}));

const HeroContent = styled(Box)({
  position: 'relative',
  zIndex: 1,
  textAlign: 'center',
});

const HeroTitle = styled(Typography)({
  fontSize: '3.5rem',
  fontWeight: 700,
  marginBottom: '24px',
  fontFamily: 'Inter, sans-serif',
  
  '@media (max-width: 768px)': {
    fontSize: '2.5rem',
  },
});

const HeroSubtitle = styled(Typography)({
  fontSize: '1.25rem',
  marginBottom: '40px',
  opacity: 0.9,
  maxWidth: '800px',
  margin: '0 auto 40px',
  lineHeight: 1.6,
});

const StatsContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  gap: '60px',
  marginTop: '60px',
  
  '@media (max-width: 768px)': {
    flexDirection: 'column',
    gap: '30px',
  },
});

const StatItem = styled(Box)({
  textAlign: 'center',
});

const StatNumber = styled(Typography)({
  fontSize: '2.5rem',
  fontWeight: 700,
  color: '#00bcd4',
  marginBottom: '8px',
});

const StatLabel = styled(Typography)({
  fontSize: '1rem',
  opacity: 0.8,
});

const SectionContainer = styled(Container)({
  padding: '80px 0',
});

const SectionTitle = styled(Typography)({
  fontSize: '2.5rem',
  fontWeight: 700,
  color: '#263238',
  textAlign: 'center',
  marginBottom: '20px',
  fontFamily: 'Inter, sans-serif',
});

const SectionSubtitle = styled(Typography)({
  fontSize: '1.125rem',
  color: '#607d8b',
  textAlign: 'center',
  marginBottom: '60px',
  maxWidth: '800px',
  margin: '0 auto 60px',
  lineHeight: 1.6,
});

const DocumentCard = styled(Card)(({ theme }) => ({
  background: '#ffffff',
  borderRadius: '16px',
  boxShadow: '0 4px 24px rgba(26, 35, 126, 0.08)',
  border: '1px solid rgba(26, 35, 126, 0.08)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  height: '100%',
  
  '&:hover': {
    boxShadow: '0 8px 40px rgba(26, 35, 126, 0.12)',
    transform: 'translateY(-4px)',
  },
}));

const DocumentIcon = styled(Box)({
  width: '60px',
  height: '60px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '20px',
  color: '#ffffff',
});

const DocumentTitle = styled(Typography)({
  fontSize: '1.25rem',
  fontWeight: 600,
  color: '#263238',
  marginBottom: '12px',
  fontFamily: 'Inter, sans-serif',
});

const DocumentDescription = styled(Typography)({
  fontSize: '0.875rem',
  color: '#607d8b',
  lineHeight: 1.5,
  marginBottom: '20px',
});

const DownloadButton = styled(Button)({
  background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)',
  color: '#ffffff',
  borderRadius: '8px',
  padding: '8px 16px',
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '0.875rem',
  
  '&:hover': {
    background: 'linear-gradient(135deg, #0d47a1 0%, #303f9f 100%)',
  },
});

const FeatureCard = styled(Card)({
  background: '#ffffff',
  borderRadius: '16px',
  boxShadow: '0 2px 16px rgba(26, 35, 126, 0.06)',
  border: '1px solid rgba(26, 35, 126, 0.06)',
  padding: '32px',
  textAlign: 'center',
  height: '100%',
});

const FeatureIcon = styled(Box)({
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  background: 'rgba(26, 35, 126, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 24px',
  color: '#1a237e',
});

const PerformanceTable = styled(TableContainer)({
  background: '#ffffff',
  borderRadius: '12px',
  boxShadow: '0 2px 16px rgba(26, 35, 126, 0.06)',
  border: '1px solid rgba(26, 35, 126, 0.06)',
});

const ContactSection = styled(Box)({
  background: 'linear-gradient(135deg, rgba(26, 35, 126, 0.03) 0%, rgba(63, 81, 181, 0.03) 100%)',
  padding: '80px 0',
  borderRadius: '24px',
  margin: '80px 0',
});

export const EnterprisePage: React.FC = () => {
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>(false);

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  const documentationSuite = [
    {
      icon: <FileText size={24} />,
      title: 'Executive Summary',
      description: 'High-level platform overview for leadership teams and decision makers',
      category: 'Executive',
      pages: 12,
      classification: 'Confidential'
    },
    {
      icon: <Code size={24} />,
      title: 'Technical Architecture',
      description: 'Comprehensive technical documentation for CTOs and enterprise architects',
      category: 'Technical',
      pages: 45,
      classification: 'Technical'
    },
    {
      icon: <Shield size={24} />,
      title: 'Security Overview',
      description: 'Security architecture, audit results, and compliance framework',
      category: 'Security',
      pages: 28,
      classification: 'Restricted'
    },
    {
      icon: <BarChart3 size={24} />,
      title: 'Performance Metrics',
      description: 'Platform performance benchmarks and business intelligence',
      category: 'Analytics',
      pages: 18,
      classification: 'Internal'
    },
    {
      icon: <Globe size={24} />,
      title: 'Regulatory Framework',
      description: 'Multi-jurisdiction compliance and regulatory documentation',
      category: 'Compliance',
      pages: 35,
      classification: 'Confidential'
    },
    {
      icon: <Users size={24} />,
      title: 'Integration Guide',
      description: 'Step-by-step integration procedures and API documentation',
      category: 'Implementation',
      pages: 52,
      classification: 'Technical'
    }
  ];

  const platformFeatures = [
    {
      icon: <Shield size={32} />,
      title: 'Enterprise Security',
      description: 'Bank-grade security with multi-layer protection and comprehensive audit framework'
    },
    {
      icon: <Globe size={32} />,
      title: 'Multi-Chain Native',
      description: 'Native support for 5+ blockchain networks with seamless cross-chain interoperability'
    },
    {
      icon: <CheckCircle size={32} />,
      title: 'Regulatory Compliance',
      description: 'ERC-3643 implementation with multi-jurisdiction support for global compliance'
    },
    {
      icon: <TrendingUp size={32} />,
      title: 'Enterprise Services',
      description: 'Prime brokerage, cross-margining, and sophisticated risk management tools'
    },
    {
      icon: <Zap size={32} />,
      title: 'High Performance',
      description: '10,000+ TPS capability with <200ms API response times and 99.9% uptime'
    },
    {
      icon: <Lock size={32} />,
      title: 'Audit Ready',
      description: 'Multiple third-party security audits and comprehensive compliance monitoring'
    }
  ];

  const performanceMetrics = [
    { metric: 'API Response Time', target: '<200ms', current: '180ms', status: 'Excellent' },
    { metric: 'Cross-Chain Transfers', target: '<15 min', current: '12 min', status: 'Excellent' },
    { metric: 'Platform Uptime', target: '99.999%', current: '99.95%', status: 'Excellent' },
    { metric: 'Transaction Throughput', target: '10,000+ TPS', current: '12,000+ TPS', status: 'Excellent' },
    { metric: 'Concurrent Users', target: '1,000+', current: '1,200+', status: 'Excellent' },
    { metric: 'Security Incidents', target: '0 Critical', current: '0 Critical', status: 'Excellent' }
  ];

  return (
    <Box>
      {/* Hero Section */}
      <HeroSection>
        <Container maxWidth="lg">
          <HeroContent>
            <HeroTitle>
              Tokenized Financial Products
            </HeroTitle>
            <HeroSubtitle>
              The world's first enterprise-grade tokenization platform. 
              Delivering regulatory compliance, multi-chain interoperability, and enterprise services at scale.
            </HeroSubtitle>
            

            <StatsContainer>
              <StatItem>
                <StatNumber>$16.1T</StatNumber>
                <StatLabel>Market Opportunity by 2030</StatLabel>
              </StatItem>
              <StatItem>
                <StatNumber>5+</StatNumber>
                <StatLabel>Blockchain Networks</StatLabel>
              </StatItem>
              <StatItem>
                <StatNumber>99.999%</StatNumber>
                <StatLabel>Platform Uptime</StatLabel>
              </StatItem>
              <StatItem>
                <StatNumber>10K+</StatNumber>
                <StatLabel>Transactions per Second</StatLabel>
              </StatItem>
            </StatsContainer>
          </HeroContent>
        </Container>
      </HeroSection>

      {/* Documentation Suite */}
      <SectionContainer maxWidth="lg">
        <SectionTitle>Documentation</SectionTitle>
        <SectionSubtitle>
          Comprehensive documentation designed for decision-makers, 
          technical teams, and compliance officers.
        </SectionSubtitle>

        <Grid container spacing={4}>
          {documentationSuite.map((doc, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <DocumentCard>
                <CardContent sx={{ padding: '32px' }}>
                  <DocumentIcon>
                    {doc.icon}
                  </DocumentIcon>
                  
                  <Box sx={{ display: 'flex', gap: 1, marginBottom: '12px' }}>
                    <Chip 
                      label={doc.category} 
                      size="small" 
                      sx={{ 
                        background: 'rgba(26, 35, 126, 0.1)', 
                        color: '#1a237e',
                        fontWeight: 600 
                      }} 
                    />
                    <Chip 
                      label={`${doc.pages} pages`} 
                      size="small" 
                      variant="outlined"
                      sx={{ borderColor: 'rgba(26, 35, 126, 0.2)' }}
                    />
                  </Box>
                  
                  <DocumentTitle>{doc.title}</DocumentTitle>
                  <DocumentDescription>{doc.description}</DocumentDescription>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#607d8b' }}>
                      {doc.classification}
                    </Typography>
                    <DownloadButton startIcon={<Download size={16} />}>
                      Download
                    </DownloadButton>
                  </Box>
                </CardContent>
              </DocumentCard>
            </Grid>
          ))}
        </Grid>
      </SectionContainer>

      {/* Platform Features */}
      <Box sx={{ background: 'rgba(26, 35, 126, 0.02)', padding: '80px 0' }}>
        <Container maxWidth="lg">
          <SectionTitle>Enterprise Platform Features</SectionTitle>
          <SectionSubtitle>
            Built for enterprise scale with enterprise-grade security, compliance, and performance.
          </SectionSubtitle>

          <Grid container spacing={4}>
            {platformFeatures.map((feature, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <FeatureCard>
                  <FeatureIcon>
                    {feature.icon}
                  </FeatureIcon>
                  <Typography variant="h6" sx={{ fontWeight: 600, marginBottom: '16px', color: '#263238' }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#607d8b', lineHeight: 1.6 }}>
                    {feature.description}
                  </Typography>
                </FeatureCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Performance Metrics */}
      <SectionContainer maxWidth="lg">
        <SectionTitle>Performance Benchmarks</SectionTitle>
        <SectionSubtitle>
          Real-time performance metrics demonstrating enterprise-grade reliability and scalability.
        </SectionSubtitle>

        <Paper sx={{ 
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 16px rgba(26, 35, 126, 0.06)',
          border: '1px solid rgba(26, 35, 126, 0.06)',
        }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ background: 'rgba(26, 35, 126, 0.05)' }}>
                  <TableCell sx={{ fontWeight: 600, color: '#263238' }}>Performance Metric</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#263238' }}>Target</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#263238' }}>Current</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#263238' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {performanceMetrics.map((metric, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ fontWeight: 500 }}>{metric.metric}</TableCell>
                    <TableCell>{metric.target}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1a237e' }}>{metric.current}</TableCell>
                    <TableCell>
                      <Chip 
                        label={metric.status} 
                        size="small"
                        sx={{ 
                          background: '#e8f5e8', 
                          color: '#2e7d32',
                          fontWeight: 600 
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </SectionContainer>

      {/* Technical Specifications */}
      <Box sx={{ background: 'rgba(26, 35, 126, 0.02)', padding: '80px 0' }}>
        <Container maxWidth="lg">
          <SectionTitle>Technical Specifications</SectionTitle>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Accordion 
                expanded={expandedAccordion === 'smart-contracts'} 
                onChange={handleAccordionChange('smart-contracts')}
                sx={{ marginBottom: '16px' }}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Smart Contract Architecture</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    <ListItem>
                      <ListItemIcon><CheckCircle size={20} color="#4caf50" /></ListItemIcon>
                      <ListItemText primary="ComplianceAwareToken (ERC-3643)" secondary="T-REX Protocol implementation" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle size={20} color="#4caf50" /></ListItemIcon>
                      <ListItemText primary="UniversalBridge" secondary="Multi-protocol cross-chain interoperability" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle size={20} color="#4caf50" /></ListItemIcon>
                      <ListItemText primary="PrimeBrokerage" secondary="Enterprise services and cross-margining" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle size={20} color="#4caf50" /></ListItemIcon>
                      <ListItemText primary="SettlementAssetManager" secondary="wCBDC and stablecoin integration" />
                    </ListItem>
                  </List>
                </AccordionDetails>
              </Accordion>

              <Accordion 
                expanded={expandedAccordion === 'blockchain-support'} 
                onChange={handleAccordionChange('blockchain-support')}
                sx={{ marginBottom: '16px' }}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Multi-Chain Support</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    <ListItem>
                      <ListItemIcon><CheckCircle size={20} color="#4caf50" /></ListItemIcon>
                      <ListItemText primary="Ethereum" secondary="Primary settlement layer with full EIP support" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle size={20} color="#4caf50" /></ListItemIcon>
                      <ListItemText primary="Polygon" secondary="Low-cost transactions and high throughput" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle size={20} color="#4caf50" /></ListItemIcon>
                      <ListItemText primary="Avalanche" secondary="Enterprise-grade performance" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle size={20} color="#4caf50" /></ListItemIcon>
                      <ListItemText primary="Arbitrum & Optimism" secondary="Layer-2 scaling solutions" />
                    </ListItem>
                  </List>
                </AccordionDetails>
              </Accordion>
            </Grid>

            <Grid item xs={12} md={6}>
              <Accordion 
                expanded={expandedAccordion === 'security'} 
                onChange={handleAccordionChange('security')}
                sx={{ marginBottom: '16px' }}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Security Framework</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    <ListItem>
                      <ListItemIcon><Shield size={20} color="#4caf50" /></ListItemIcon>
                      <ListItemText primary="Multi-Party Audits" secondary="Trail of Bits, ConsenSys Diligence, OpenZeppelin" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Shield size={20} color="#4caf50" /></ListItemIcon>
                      <ListItemText primary="Formal Verification" secondary="Mathematical proof of contract correctness" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Shield size={20} color="#4caf50" /></ListItemIcon>
                      <ListItemText primary="24/7 Monitoring" secondary="Real-time security monitoring and alerting" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Shield size={20} color="#4caf50" /></ListItemIcon>
                      <ListItemText primary="Enterprise Encryption" secondary="AES-256 at rest, TLS 1.3 in transit" />
                    </ListItem>
                  </List>
                </AccordionDetails>
              </Accordion>

              <Accordion 
                expanded={expandedAccordion === 'compliance'} 
                onChange={handleAccordionChange('compliance')}
                sx={{ marginBottom: '16px' }}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Regulatory Compliance</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    <ListItem>
                      <ListItemIcon><CheckCircle size={20} color="#4caf50" /></ListItemIcon>
                      <ListItemText primary="Global Standards" secondary="MiCA, SEC, FCA, MAS, JFSA support" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle size={20} color="#4caf50" /></ListItemIcon>
                      <ListItemText primary="KYC/AML Integration" secondary="Automated identity verification" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle size={20} color="#4caf50" /></ListItemIcon>
                      <ListItemText primary="Audit Trail" secondary="Complete transaction history" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle size={20} color="#4caf50" /></ListItemIcon>
                      <ListItemText primary="Real-time Monitoring" secondary="Continuous compliance validation" />
                    </ListItem>
                  </List>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Contact Section */}
      <Container maxWidth="lg">
        <ContactSection>
          <Box sx={{ textAlign: 'center', padding: '0 40px' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, marginBottom: '20px', color: '#263238' }}>
              Ready to Transform Your Organization?
            </Typography>
            <Typography variant="h6" sx={{ color: '#607d8b', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
              Join leading organizations leveraging Quantera's enterprise-grade tokenization platform.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                sx={{
                  background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)',
                  padding: '12px 32px',
                  fontWeight: 600,
                }}
              >
                Schedule Executive Briefing
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  borderColor: '#1a237e',
                  color: '#1a237e',
                  padding: '12px 32px',
                  fontWeight: 600,
                }}
              >
                Request Technical Demo
              </Button>
            </Box>

            <Box sx={{ marginTop: '40px', display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#607d8b', marginBottom: '4px' }}>
                  Enterprise Sales
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#263238' }}>
                  enterprise@quantera.finance
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#607d8b', marginBottom: '4px' }}>
                  Technical Integration
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#263238' }}>
                  integration@quantera.finance
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#607d8b', marginBottom: '4px' }}>
                  Partnership Inquiries
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#263238' }}>
                  partnerships@quantera.finance
                </Typography>
              </Box>
            </Box>
          </Box>
        </ContactSection>
      </Container>
    </Box>
  );
}; 