import React, { useState } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Tabs, 
  Tab, 
  Button, 
  Card, 
  CardContent 
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WorkIcon from '@mui/icons-material/Work';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

import TradeFinanceMarketplace from '../components/tradeFinance/TradeFinanceMarketplace';
import TradeFinancePortfolio from '../components/tradeFinance/TradeFinancePortfolio';
import TradeFinanceTradingInterface from '../components/tradeFinance/TradeFinanceTradingInterface';
import { TradeFinanceProvider } from '../contexts/TradeFinanceContext';

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
  
  // Benefits data
  const benefits = [
    {
      title: "Trade Finance Tokenization",
      description: "Transform traditional trade finance instruments into tokenized assets for increased liquidity and fractionalized ownership.",
      icon: <AccountBalanceIcon fontSize="large" color="primary" />
    },
    {
      title: "Global Access & Liquidity",
      description: "Access trade finance investments worldwide with improved liquidity through blockchain-based tokenization and instant settlement.",
      icon: <AttachMoneyIcon fontSize="large" color="primary" />
    },
    {
      title: "Transparent Risk Profiles",
      description: "Detailed risk scoring and complete transparency for all trade finance instruments, with real-time performance tracking.",
      icon: <TrendingUpIcon fontSize="large" color="primary" />
    },
    {
      title: "Supply Chain Efficiency",
      description: "Support business growth and supply chain finance worldwide while earning competitive yields on short-term trade finance investments.",
      icon: <WorkIcon fontSize="large" color="primary" />
    }
  ];
  
  return (
    <TradeFinanceProvider>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        {/* Hero Section */}
        <Box
          sx={{
            height: 300,
            borderRadius: 2,
            overflow: 'hidden',
            position: 'relative',
            mb: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(/images/assets/trade-finance-hero.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            textAlign: 'center',
            p: 4
          }}
        >
          <Box>
            <Typography variant="h2" color="white" gutterBottom>
              Trade Finance Platform
            </Typography>
            <Typography variant="h6" color="white" sx={{ mb: 4, maxWidth: 700, mx: 'auto' }}>
              Invest in tokenized trade finance instruments with real-time liquidity and settlement
            </Typography>
            <Button 
              variant="contained" 
              size="large" 
              onClick={() => setTabValue(0)}
              sx={{ mr: 2 }}
            >
              Explore Marketplace
            </Button>
            <Button 
              variant="outlined" 
              color="inherit" 
              size="large"
              onClick={() => setTabValue(1)}
              sx={{ color: 'white', borderColor: 'white' }}
            >
              View Your Portfolio
            </Button>
          </Box>
        </Box>
        
        {/* Benefits Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Benefits of Tokenized Trade Finance
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4, maxWidth: 800, mx: 'auto' }}>
            Unlock the power of blockchain-based trade finance with our innovative platform that connects investors with global trade opportunities.
          </Typography>
          
          <Grid container spacing={3}>
            {benefits.map((benefit, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box sx={{ mb: 2 }}>
                      {benefit.icon}
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {benefit.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {benefit.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
        
        {/* Main Tabs */}
        <Paper sx={{ width: '100%', mb: 4 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            aria-label="trade finance tabs"
          >
            <Tab label="Marketplace" id="trade-finance-tab-0" />
            <Tab label="Portfolio" id="trade-finance-tab-1" />
            <Tab label="Trading" id="trade-finance-tab-2" />
          </Tabs>
          
          <TabPanel value={tabValue} index={0}>
            <TradeFinanceMarketplace />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 3 }}>
              <TradeFinancePortfolio />
            </Box>
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: 3 }}>
              <TradeFinanceTradingInterface />
            </Box>
          </TabPanel>
        </Paper>
      </Container>
    </TradeFinanceProvider>
  );
};

export default TradeFinancePage; 