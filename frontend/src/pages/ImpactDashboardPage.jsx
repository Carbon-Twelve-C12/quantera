import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  useTheme
} from '@mui/material';
import { PictureAsPdf, Share } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import ImpactDashboard from '../components/common/ImpactDashboard';

const ImpactDashboardPage = () => {
  const { currentUser } = useAuth();
  const [timeframe, setTimeframe] = useState('all');
  const theme = useTheme();
  
  // In a real implementation, we would use the actual user address
  // For this demo, we're always using a placeholder to ensure data loads
  const userAddress = currentUser?.address || '0x1234567890123456789012345678901234567890';
  
  const handleTimeframeChange = (event) => {
    setTimeframe(event.target.value);
  };
  
  const handleExportReport = () => {
    // In a real implementation, this would generate and download a PDF report
    alert('Report export functionality would be implemented here');
  };
  
  const handleShareReport = () => {
    // In a real implementation, this would open a share dialog
    alert('Report sharing functionality would be implemented here');
  };

  return (
    <Container maxWidth="lg">
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Environmental Impact Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Visualize the environmental impact of your investments across all asset types.
        </Typography>
      </Box>
      
      <Grid container spacing={3} alignItems="center" mb={3}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={timeframe}
              label="Timeframe"
              onChange={handleTimeframeChange}
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="year">Past Year</MenuItem>
              <MenuItem value="quarter">Past Quarter</MenuItem>
              <MenuItem value="month">Past Month</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Box display="flex" justifyContent={{ xs: 'flex-start', sm: 'flex-end' }} gap={2}>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdf />}
              onClick={handleExportReport}
            >
              Export Report
            </Button>
            <Button
              variant="outlined"
              startIcon={<Share />}
              onClick={handleShareReport}
            >
              Share
            </Button>
          </Box>
        </Grid>
      </Grid>
      
      <ImpactDashboard userAddress={userAddress} />
      
      <Card sx={{ mt: 4, backgroundColor: theme => theme.palette.background.paper }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Impact Reporting & Certifications
          </Typography>
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="body1" paragraph>
            All environmental impact metrics are calculated based on verified data from the underlying assets in your portfolio. 
            Each asset is certified by recognized standards such as Verra, Gold Standard, or Climate Action Reserve.
          </Typography>
          
          <Typography variant="body1" paragraph>
            The impact calculations follow these methodologies:
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Carbon Metrics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Measured in tons of CO₂ equivalent (tCO₂e)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Calculated using IPCC AR5 global warming potentials
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Verified by third-party auditors following ISO 14064-3
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Biodiversity Metrics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Measured in hectares of habitat protected or restored
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Assessed using IUCN habitat classification system
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Monitored through satellite imagery and field surveys
              </Typography>
            </Grid>
          </Grid>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Renewable Energy Metrics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Measured in megawatt-hours (MWh) of clean energy produced
              </Typography>
                <Typography variant="body2" color="text.secondary">
                • Verified through grid connection data or meter readings
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Calculated based on applicable renewable energy protocols
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Water Resource Metrics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Measured in kiloliters of water protected or conserved
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Validated through hydrological assessments
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Based on established water stewardship frameworks
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default ImpactDashboardPage; 