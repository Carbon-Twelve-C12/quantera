import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  FormControl,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
  TextField,
  CircularProgress,
  Divider,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  ForestOutlined,
  NatureOutlined,
  WbSunnyOutlined,
  WaterOutlined,
  BarChart,
  ShowChart,
  RecyclingOutlined,
} from '@mui/icons-material';
import api from '../../api/api';

const SustainableYieldStrategies = ({ 
  onStrategySelect, 
  assetType = null,
  assetId = null,
  amount = null
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [strategies, setStrategies] = useState([]);
  const [error, setError] = useState(null);
  
  // Filter states
  const [selectedAssetTypes, setSelectedAssetTypes] = useState(assetType ? [assetType] : []);
  const [minRetirementPercentage, setMinRetirementPercentage] = useState(0);
  const [carbonNegativeOnly, setCarbonNegativeOnly] = useState(false);
  
  // Impact calculation dialog
  const [impactDialogOpen, setImpactDialogOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [investmentAmount, setInvestmentAmount] = useState(amount || '1000');
  const [durationDays, setDurationDays] = useState('365');
  const [impactResults, setImpactResults] = useState(null);
  const [impactLoading, setImpactLoading] = useState(false);

  const fetchStrategies = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build request payload
      const payload = {
        environmental_asset_types: selectedAssetTypes,
        min_retirement_percentage: minRetirementPercentage > 0 ? minRetirementPercentage.toString() : null,
        carbon_negative_only: carbonNegativeOnly,
      };
      
      // Call the API
      const response = await api.post('/yield/strategies/sustainable', payload);
      setStrategies(response.data.strategies || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching sustainable yield strategies:', err);
      setError('Failed to load sustainable yield strategies');
      setLoading(false);
      
      // For demo purposes, set mock data if API fails
      setMockStrategies();
    }
  }, [selectedAssetTypes, minRetirementPercentage, carbonNegativeOnly]);

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);
  
  const setMockStrategies = () => {
    const mockStrategies = [
      {
        strategy_id: '0x0000000000000000000000000000000000000000000000000000000000000001',
        name: 'Carbon Credits Yield Optimizer',
        description: 'High-impact strategy that optimizes yield while automatically retiring a portion of carbon credits to maximize environmental impact.',
        risk_level: 'MODERATE',
        is_public: true,
        is_active: true,
        creation_date: 1646092800,
        performance_fee: '200',
        metadata_uri: 'ipfs://Qm...',
        environmental_metadata: {
          asset_type: 'CarbonCredit',
          certification_standard: 'Verra',
          impact_multiplier: '120',
          carbon_negative: true,
          retirement_percentage: '20',
          sdg_alignment: {
            '13': '90',
            '15': '80',
          }
        }
      },
      {
        strategy_id: '0x0000000000000000000000000000000000000000000000000000000000000002',
        name: 'Biodiversity Protection Yield',
        description: 'Strategy focused on biodiversity credits with automatic compounding and partial retirement to fund conservation projects.',
        risk_level: 'CONSERVATIVE',
        is_public: true,
        is_active: true,
        creation_date: 1651449600,
        performance_fee: '150',
        metadata_uri: 'ipfs://Qm...',
        environmental_metadata: {
          asset_type: 'BiodiversityCredit',
          certification_standard: 'Gold Standard',
          impact_multiplier: '130',
          carbon_negative: false,
          retirement_percentage: '15',
          sdg_alignment: {
            '14': '95',
            '15': '90',
          }
        }
      },
      {
        strategy_id: '0x0000000000000000000000000000000000000000000000000000000000000003',
        name: 'Renewable Energy Certificate Optimizer',
        description: 'Focuses on maximizing yield from renewable energy certificates while supporting new clean energy projects.',
        risk_level: 'AGGRESSIVE',
        is_public: true,
        is_active: true,
        creation_date: 1656633600,
        performance_fee: '300',
        metadata_uri: 'ipfs://Qm...',
        environmental_metadata: {
          asset_type: 'RenewableEnergyCertificate',
          certification_standard: 'I-REC',
          impact_multiplier: '110',
          carbon_negative: true,
          retirement_percentage: '10',
          sdg_alignment: {
            '7': '95',
            '9': '75',
            '13': '85',
          }
        }
      },
      {
        strategy_id: '0x0000000000000000000000000000000000000000000000000000000000000004',
        name: 'Water Rights Conservation Yield',
        description: 'Strategy designed to generate yield from water rights while ensuring sustainable water resource management.',
        risk_level: 'MODERATE',
        is_public: true,
        is_active: true,
        creation_date: 1659312000,
        performance_fee: '250',
        metadata_uri: 'ipfs://Qm...',
        environmental_metadata: {
          asset_type: 'WaterRight',
          certification_standard: 'AWS',
          impact_multiplier: '125',
          carbon_negative: false,
          retirement_percentage: '25',
          sdg_alignment: {
            '6': '95',
            '14': '80',
          }
        }
      },
    ];
    
    setStrategies(mockStrategies);
  };
  
  const handleApplyFilters = () => {
    fetchStrategies();
  };
  
  const handleResetFilters = () => {
    setSelectedAssetTypes([]);
    setMinRetirementPercentage(0);
    setCarbonNegativeOnly(false);
  };
  
  const handleAssetTypeChange = (event) => {
    setSelectedAssetTypes(event.target.value);
  };
  
  const handleRetirementPercentageChange = (event, newValue) => {
    setMinRetirementPercentage(newValue);
  };
  
  const handleCarbonNegativeChange = (event) => {
    setCarbonNegativeOnly(event.target.checked);
  };
  
  const handleSelectStrategy = (strategy) => {
    if (onStrategySelect) {
      onStrategySelect(strategy);
    }
  };
  
  const handleCalculateImpact = (strategy) => {
    setSelectedStrategy(strategy);
    setImpactDialogOpen(true);
  };
  
  const handleCloseImpactDialog = () => {
    setImpactDialogOpen(false);
    setImpactResults(null);
  };
  
  const handleSubmitImpactCalculation = async () => {
    if (!selectedStrategy) return;
    
    try {
      setImpactLoading(true);
      
      // Build request payload
      const payload = {
        strategy_id: selectedStrategy.strategy_id,
        investment_amount: investmentAmount,
        duration_days: durationDays,
      };
      
      // Call the API
      const response = await api.post('/yield/strategies/impact', payload);
      setImpactResults(response.data);
      setImpactLoading(false);
    } catch (err) {
      console.error('Error calculating environmental impact:', err);
      setImpactLoading(false);
      
      // For demo purposes, set mock data if API fails
      setMockImpactResults();
    }
  };
  
  const setMockImpactResults = () => {
    const mockResults = {
      strategy_id: selectedStrategy.strategy_id,
      strategy_name: selectedStrategy.name,
      investment_amount: investmentAmount,
      duration_days: durationDays,
      impact_metrics: {
        carbon_offset_tons: '12',
        land_area_protected_hectares: '2',
        renewable_energy_mwh: '25',
        auto_retired_credits: (parseInt(investmentAmount) * parseInt(selectedStrategy.environmental_metadata.retirement_percentage) / 100).toString()
      },
      environmental_metadata: selectedStrategy.environmental_metadata
    };
    
    setImpactResults(mockResults);
  };
  
  const getAssetTypeIcon = (type) => {
    switch (type) {
      case 'CarbonCredit':
        return <ForestOutlined />;
      case 'BiodiversityCredit':
        return <NatureOutlined />;
      case 'RenewableEnergyCertificate':
        return <WbSunnyOutlined />;
      case 'WaterRight':
        return <WaterOutlined />;
      default:
        return <ForestOutlined />;
    }
  };
  
  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'CONSERVATIVE':
        return theme.palette.info.main;
      case 'MODERATE':
        return theme.palette.warning.main;
      case 'AGGRESSIVE':
        return theme.palette.error.main;
      default:
        return theme.palette.primary.main;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Sustainable Yield Strategies
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        These strategies are specially designed for environmental assets to generate yield while maximizing positive environmental impact.
      </Typography>
      
      {/* Filters */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filter Strategies
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Asset Types</InputLabel>
                <Select
                  multiple
                  value={selectedAssetTypes}
                  onChange={handleAssetTypeChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip 
                          key={value} 
                          label={value.replace(/([A-Z])/g, ' $1').trim()} 
                          size="small" 
                          icon={getAssetTypeIcon(value)}
                        />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="CarbonCredit">Carbon Credits</MenuItem>
                  <MenuItem value="BiodiversityCredit">Biodiversity Credits</MenuItem>
                  <MenuItem value="RenewableEnergyCertificate">Renewable Energy Certificates</MenuItem>
                  <MenuItem value="WaterRight">Water Rights</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography gutterBottom>
                Minimum Retirement Percentage: {minRetirementPercentage}%
              </Typography>
              <Slider
                value={minRetirementPercentage}
                onChange={handleRetirementPercentageChange}
                min={0}
                max={50}
                valueLabelDisplay="auto"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={carbonNegativeOnly}
                    onChange={handleCarbonNegativeChange}
                  />
                }
                label="Carbon Negative Only"
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={handleResetFilters}>
              Reset Filters
            </Button>
            <Button variant="contained" onClick={handleApplyFilters}>
              Apply Filters
            </Button>
          </Box>
        </CardContent>
      </Card>
      
      {/* Strategies List */}
      {strategies.length === 0 ? (
        <Alert severity="info">
          No sustainable yield strategies match your criteria.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {strategies.map((strategy) => (
            <Grid item xs={12} md={6} key={strategy.strategy_id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Chip 
                      icon={getAssetTypeIcon(strategy.environmental_metadata.asset_type)} 
                      label={strategy.environmental_metadata.asset_type.replace(/([A-Z])/g, ' $1').trim()} 
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    
                    <Chip 
                      label={strategy.risk_level} 
                      size="small"
                      sx={{ 
                        bgcolor: getRiskLevelColor(strategy.risk_level),
                        color: 'white',
                      }}
                    />
                  </Box>
                  
                  <Typography variant="h6" gutterBottom>
                    {strategy.name}
                  </Typography>
                  
                  <Typography variant="body2" paragraph>
                    {strategy.description}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Tooltip title="Percentage of yield automatically retired for environmental benefit">
                        <Box>
                          <Typography variant="body2" color="text.secondary">Auto-Retirement:</Typography>
                          <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                            <RecyclingOutlined fontSize="small" sx={{ mr: 0.5 }} />
                            {strategy.environmental_metadata.retirement_percentage}%
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Tooltip title="Performance fee taken from yield">
                        <Box>
                          <Typography variant="body2" color="text.secondary">Performance Fee:</Typography>
                          <Typography variant="body1">
                            {(parseInt(strategy.performance_fee) / 100).toFixed(2)}%
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Tooltip title="Multiplier applied to environmental impact">
                        <Box>
                          <Typography variant="body2" color="text.secondary">Impact Multiplier:</Typography>
                          <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                            <BarChart fontSize="small" sx={{ mr: 0.5 }} />
                            {(parseInt(strategy.environmental_metadata.impact_multiplier) / 100).toFixed(2)}x
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Tooltip title="Carbon negative strategies remove more carbon than they emit">
                        <Box>
                          <Typography variant="body2" color="text.secondary">Carbon Negative:</Typography>
                          <Typography variant="body1">
                            {strategy.environmental_metadata.carbon_negative ? 'Yes' : 'No'}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Grid>
                  </Grid>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    SDG Alignment
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {strategy.environmental_metadata.sdg_alignment && 
                      Object.entries(strategy.environmental_metadata.sdg_alignment).map(([sdg, value]) => (
                        <Tooltip 
                          key={sdg} 
                          title={`SDG ${sdg}: ${getSdgName(parseInt(sdg))}`}
                        >
                          <Chip
                            label={`SDG ${sdg}`}
                            size="small"
                            sx={{ 
                              bgcolor: getSdgColor(parseInt(sdg)),
                              color: 'white',
                            }}
                          />
                        </Tooltip>
                      ))
                    }
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto' }}>
                    <Button
                      variant="outlined"
                      startIcon={<ShowChart />}
                      onClick={() => handleCalculateImpact(strategy)}
                    >
                      Calculate Impact
                    </Button>
                    
                    <Button
                      variant="contained"
                      onClick={() => handleSelectStrategy(strategy)}
                    >
                      Select Strategy
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Impact Calculation Dialog */}
      <Dialog open={impactDialogOpen} onClose={handleCloseImpactDialog} maxWidth="md">
        <DialogTitle>
          Calculate Environmental Impact
        </DialogTitle>
        <DialogContent>
          {selectedStrategy && (
            <>
              <DialogContentText paragraph>
                Calculate the potential environmental impact of applying the <strong>{selectedStrategy.name}</strong> strategy to your investment.
              </DialogContentText>
              
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Investment Amount"
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    fullWidth
                    InputProps={{
                      startAdornment: "$",
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Time Period (Days)"
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    fullWidth
                  />
                </Grid>
              </Grid>
              
              {!impactResults && !impactLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <Button 
                    variant="contained" 
                    onClick={handleSubmitImpactCalculation}
                    disabled={!investmentAmount || !durationDays}
                  >
                    Calculate Impact
                  </Button>
                </Box>
              )}
              
              {impactLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              )}
              
              {impactResults && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Projected Environmental Impact
                  </Typography>
                  
                  <Alert severity="info" sx={{ mb: 3 }}>
                    Impact is calculated based on the amount invested, time period, and the strategy's specific impact parameters.
                  </Alert>
                  
                  <Grid container spacing={3}>
                    {impactResults.impact_metrics.carbon_offset_tons && parseInt(impactResults.impact_metrics.carbon_offset_tons) > 0 && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                          <ForestOutlined color="success" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="h5" gutterBottom>
                            {parseInt(impactResults.impact_metrics.carbon_offset_tons).toLocaleString()} tons
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Carbon Offset (CO₂e)
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    
                    {impactResults.impact_metrics.land_area_protected_hectares && parseInt(impactResults.impact_metrics.land_area_protected_hectares) > 0 && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                          <NatureOutlined color="success" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="h5" gutterBottom>
                            {parseInt(impactResults.impact_metrics.land_area_protected_hectares).toLocaleString()} ha
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Land Area Protected
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    
                    {impactResults.impact_metrics.renewable_energy_mwh && parseInt(impactResults.impact_metrics.renewable_energy_mwh) > 0 && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                          <WbSunnyOutlined color="warning" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="h5" gutterBottom>
                            {parseInt(impactResults.impact_metrics.renewable_energy_mwh).toLocaleString()} MWh
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Renewable Energy
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    
                    {impactResults.impact_metrics.auto_retired_credits && parseInt(impactResults.impact_metrics.auto_retired_credits) > 0 && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                          <RecyclingOutlined color="primary" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="h5" gutterBottom>
                            {parseInt(impactResults.impact_metrics.auto_retired_credits).toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Auto-Retired Credits
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                  
                  <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Equivalent to:
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2">
                          • {(parseInt(impactResults.impact_metrics.carbon_offset_tons) * 4).toLocaleString()} trees grown for 10 years
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2">
                          • {(parseInt(impactResults.impact_metrics.carbon_offset_tons) * 113).toLocaleString()} gallons of gasoline not consumed
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2">
                          • {(parseInt(impactResults.impact_metrics.carbon_offset_tons) * 1126).toLocaleString()} miles not driven by an average car
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImpactDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Helper function to get SDG colors
const getSdgColor = (sdg) => {
  const sdgColors = {
    1: '#e5243b', // No Poverty
    2: '#DDA63A', // Zero Hunger
    3: '#4C9F38', // Good Health
    4: '#C5192D', // Quality Education
    5: '#FF3A21', // Gender Equality
    6: '#26BDE2', // Clean Water
    7: '#FCC30B', // Affordable Energy
    8: '#A21942', // Decent Work
    9: '#FD6925', // Industry, Innovation
    10: '#DD1367', // Reduced Inequalities
    11: '#FD9D24', // Sustainable Cities
    12: '#BF8B2E', // Responsible Consumption
    13: '#3F7E44', // Climate Action
    14: '#0A97D9', // Life Below Water
    15: '#56C02B', // Life on Land
    16: '#00689D', // Peace, Justice
    17: '#19486A', // Partnerships
  };
  
  return sdgColors[sdg] || '#888888';
};

// Helper function to get SDG names
const getSdgName = (sdg) => {
  const sdgNames = {
    1: 'No Poverty',
    2: 'Zero Hunger',
    3: 'Good Health and Well-being',
    4: 'Quality Education',
    5: 'Gender Equality',
    6: 'Clean Water and Sanitation',
    7: 'Affordable and Clean Energy',
    8: 'Decent Work and Economic Growth',
    9: 'Industry, Innovation and Infrastructure',
    10: 'Reduced Inequalities',
    11: 'Sustainable Cities and Communities',
    12: 'Responsible Consumption and Production',
    13: 'Climate Action',
    14: 'Life Below Water',
    15: 'Life on Land',
    16: 'Peace, Justice and Strong Institutions',
    17: 'Partnerships for the Goals',
  };
  
  return sdgNames[sdg] || '';
};

export default SustainableYieldStrategies; 