import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Divider, 
  Chip, 
  Button, 
  TextField, 
  CircularProgress,
  Card,
  CardContent,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Alert,
  LinearProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import BarChartIcon from '@mui/icons-material/BarChart';
import VerifiedIcon from '@mui/icons-material/Verified';
import PaymentsIcon from '@mui/icons-material/Payments';
import { 
  Timeline, 
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent 
} from '../../utils/timeline-shims';
import Grid from '../../utils/mui-shims';

import { useTradeFinance } from '../../contexts/TradeFinanceContext';
import { useAuth } from '../../contexts/AuthContext';

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
      id={`asset-tabpanel-${index}`}
      aria-labelledby={`asset-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const TradeFinanceAssetDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getAssetById, purchaseAsset, loading, error } = useTradeFinance();
  const { userAddress } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [tabValue, setTabValue] = useState(0);
  const [investmentAmount, setInvestmentAmount] = useState<number>(0);
  const [units, setUnits] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Get asset data
  const asset = id ? getAssetById(id) : undefined;
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Box display="flex" justifyContent="center" my={8}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (!asset) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>Asset Not Found</Typography>
          <Typography paragraph>
            The trade finance asset you're looking for could not be found.
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/trade-finance')}
          >
            Back to Marketplace
          </Button>
        </Paper>
      </Container>
    );
  }
  
  // Format date
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Format yield
  const formatYield = (yieldValue: number): string => {
    return `${(yieldValue / 100).toFixed(2)}%`;
  };
  
  // Calculate expected return
  const calculateExpectedReturn = (units: number): number => {
    if (!units || units <= 0) return 0;
    const unitPrice = parseFloat(asset.currentPrice);
    const investmentAmount = units * unitPrice;
    const maturityReturnPerUnit = asset.nominalValue / asset.fractionalUnits;
    return parseFloat((units * maturityReturnPerUnit).toFixed(2));
  };
  
  // Handle investment amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = parseFloat(e.target.value);
    if (isNaN(amount) || amount < 0) {
      setInvestmentAmount(0);
      setUnits(0);
      return;
    }
    
    setInvestmentAmount(amount);
    // Calculate units based on current price
    const calculatedUnits = Math.floor(amount / parseFloat(asset.currentPrice));
    setUnits(calculatedUnits);
  };
  
  // Handle units change
  const handleUnitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const unitsVal = parseInt(e.target.value);
    if (isNaN(unitsVal) || unitsVal < 0) {
      setUnits(0);
      setInvestmentAmount(0);
      return;
    }
    
    setUnits(unitsVal);
    // Calculate investment amount based on units
    const calculatedAmount = unitsVal * parseFloat(asset.currentPrice);
    setInvestmentAmount(parseFloat(calculatedAmount.toFixed(2)));
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle purchase
  const handlePurchase = async () => {
    if (!userAddress || !asset || units <= 0) return;
    
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      const result = await purchaseAsset(asset.id, userAddress, units);
      if (result) {
        setSuccessMessage(`Successfully invested in ${units} units of ${asset.name}`);
        // Reset form
        setUnits(0);
        setInvestmentAmount(0);
      } else {
        setErrorMessage('Transaction failed. Please try again.');
      }
    } catch (err) {
      setErrorMessage('An error occurred during the transaction.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box mb={4}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/trade-finance')}
          sx={{ mb: 2 }}
        >
          Back to Marketplace
        </Button>
      </Box>
      
      {/* Asset Header */}
      <Box 
        sx={{ 
          position: 'relative',
          height: 240,
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${asset.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: 2,
          mb: 4,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          px: 4,
          py: 3
        }}
      >
        <Chip 
          label={asset.assetType.replace(/_/g, ' ')} 
          color="primary"
          sx={{ 
            position: 'absolute',
            top: 16,
            right: 16
          }}
        />
        <Typography variant="h3" color="white" fontWeight="bold" gutterBottom>
          {asset.name}
        </Typography>
        <Typography variant="subtitle1" color="white">
          {asset.description}
        </Typography>
      </Box>
      
      <Grid container spacing={4}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 4 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                aria-label="asset detail tabs"
                variant="fullWidth"
              >
                <Tab label="Overview" id="asset-tab-0" />
                <Tab label="Details" id="asset-tab-1" />
                <Tab label="Transaction Timeline" id="asset-tab-2" />
              </Tabs>
            </Box>
            
            {/* Overview Tab */}
            <TabPanel value={tabValue} index={0}>
              <Typography variant="h6" gutterBottom>Asset Summary</Typography>
              <Typography paragraph>
                {asset.description}
              </Typography>
              
              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Issuer
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {asset.issuer}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Recipient
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {asset.recipient}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Key Metrics</Typography>
              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <PaymentsIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Nominal Value
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {asset.currency} {asset.nominalValue.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <BarChartIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Yield
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="success.main">
                      {formatYield(asset.yieldRate)}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <CalendarMonthIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Maturity Date
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {formatDate(asset.maturityDate)}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <PriceCheckIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Current Price
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {asset.currency} {asset.currentPrice}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </TabPanel>
            
            {/* Details Tab */}
            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>Asset Specifications</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ width: '40%', bgcolor: 'background.default' }}>
                        Asset ID
                      </TableCell>
                      <TableCell>{asset.id}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ bgcolor: 'background.default' }}>
                        Asset Type
                      </TableCell>
                      <TableCell>{asset.assetType.replace(/_/g, ' ')}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ bgcolor: 'background.default' }}>
                        Issuer
                      </TableCell>
                      <TableCell>{asset.issuer}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ bgcolor: 'background.default' }}>
                        Recipient
                      </TableCell>
                      <TableCell>{asset.recipient}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ bgcolor: 'background.default' }}>
                        Nominal Value
                      </TableCell>
                      <TableCell>{asset.currency} {asset.nominalValue.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ bgcolor: 'background.default' }}>
                        Fractional Units
                      </TableCell>
                      <TableCell>{asset.fractionalUnits.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ bgcolor: 'background.default' }}>
                        Unit Price
                      </TableCell>
                      <TableCell>{asset.currency} {asset.currentPrice}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ bgcolor: 'background.default' }}>
                        Yield Rate
                      </TableCell>
                      <TableCell>{formatYield(asset.yieldRate)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ bgcolor: 'background.default' }}>
                        Maturity Date
                      </TableCell>
                      <TableCell>{formatDate(asset.maturityDate)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ bgcolor: 'background.default' }}>
                        Settlement Currency
                      </TableCell>
                      <TableCell>{asset.settlementCurrency}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ bgcolor: 'background.default' }}>
                        Risk Rating
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Box sx={{ width: '60%', mr: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={asset.riskRating * 20} 
                              color={asset.riskRating <= 2 ? "success" : asset.riskRating <= 4 ? "warning" : "error"}
                              sx={{ height: 8, borderRadius: 5 }}
                            />
                          </Box>
                          <Typography variant="body2">
                            {asset.riskRating}/5
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ bgcolor: 'background.default' }}>
                        Minimum Investment
                      </TableCell>
                      <TableCell>{asset.currency} {asset.minimumInvestment.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ bgcolor: 'background.default' }}>
                        Status
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={asset.status} 
                          color={asset.status === 'Active' ? 'success' : asset.status === 'Pending' ? 'warning' : 'default'} 
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ mt: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  * All trade finance assets are tokenized following ERC-3643 security token standards for 
                  regulatory compliance. Smart contract audit reports are available.
                </Typography>
              </Box>
            </TabPanel>
            
            {/* Timeline Tab */}
            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" gutterBottom>Transaction Timeline</Typography>
              <Timeline position="alternate">
                <TimelineItem>
                  <TimelineOppositeContent color="text.secondary">
                    {formatDate(Date.now() / 1000 - 30 * 86400)}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color="primary" />
                    <TimelineConnector />
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="h6" component="span">
                      Origination
                    </Typography>
                    <Typography>Asset originated and verified</Typography>
                  </TimelineContent>
                </TimelineItem>
                
                <TimelineItem>
                  <TimelineOppositeContent color="text.secondary">
                    {formatDate(Date.now() / 1000 - 15 * 86400)}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color="primary" />
                    <TimelineConnector />
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="h6" component="span">
                      Tokenization
                    </Typography>
                    <Typography>Asset tokenized and listed on marketplace</Typography>
                  </TimelineContent>
                </TimelineItem>
                
                <TimelineItem>
                  <TimelineOppositeContent color="text.secondary">
                    {formatDate(Date.now() / 1000)}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color="success" />
                    <TimelineConnector />
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="h6" component="span">
                      Active Trading
                    </Typography>
                    <Typography>Available for investment</Typography>
                  </TimelineContent>
                </TimelineItem>
                
                <TimelineItem>
                  <TimelineOppositeContent color="text.secondary">
                    {formatDate(asset.maturityDate)}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot variant="outlined" />
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="h6" component="span">
                      Maturity
                    </Typography>
                    <Typography>Settlement and return of principal plus yield</Typography>
                  </TimelineContent>
                </TimelineItem>
              </Timeline>
            </TabPanel>
          </Paper>
        </Grid>
        
        {/* Investment Panel */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 24 }}>
            <Typography variant="h6" gutterBottom>
              Invest in this Asset
            </Typography>
            
            <Box sx={{ my: 2 }}>
              <Typography variant="body2" gutterBottom>
                Current Price per Unit
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {asset.currency} {asset.currentPrice}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {successMessage && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {successMessage}
              </Alert>
            )}
            
            {errorMessage && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errorMessage}
              </Alert>
            )}
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Investment Amount ({asset.currency})
              </Typography>
              <TextField
                fullWidth
                type="number"
                variant="outlined"
                value={investmentAmount}
                onChange={handleAmountChange}
                InputProps={{
                  startAdornment: <Box component="span" sx={{ mr: 1 }}>{asset.currency}</Box>,
                }}
                disabled={isSubmitting}
              />
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Units to Purchase
              </Typography>
              <TextField
                fullWidth
                type="number"
                variant="outlined"
                value={units}
                onChange={handleUnitsChange}
                disabled={isSubmitting}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Minimum investment: {asset.currency} {asset.minimumInvestment}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Expected Return at Maturity:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle1" fontWeight="bold" align="right">
                    {asset.currency} {calculateExpectedReturn(units).toLocaleString()}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Expected Yield:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle1" fontWeight="bold" color="success.main" align="right">
                    {formatYield(asset.yieldRate)}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Maturity Date:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle1" fontWeight="bold" align="right">
                    {formatDate(asset.maturityDate)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
            
            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              onClick={handlePurchase}
              disabled={
                isSubmitting || 
                !userAddress || 
                units <= 0 || 
                investmentAmount < asset.minimumInvestment
              }
              sx={{ mt: 2 }}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Invest Now'}
            </Button>
            
            <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <VerifiedIcon color="primary" sx={{ mr: 1, fontSize: 16 }} />
              <Typography variant="body2" color="text.secondary">
                Verified and Audited Smart Contracts
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TradeFinanceAssetDetails; 