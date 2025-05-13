import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid as MuiGrid,
  Tabs,
  Tab,
  Chip,
  Button,
  FormControl,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
  Slider,
  TextField,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Tooltip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  SelectChangeEvent
} from '@mui/material';
import {
  ForestOutlined,
  NatureOutlined,
  WbSunnyOutlined,
  WaterOutlined,
  BarChart,
  ShowChart,
  RecyclingOutlined,
  FilterList,
  CalculateOutlined,
  CompareArrows,
  TrendingUp,
  AccountBalance,
  Home,
  ShoppingCart,
  WaterDrop,
  Check,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { useYieldStrategy, YieldStrategy, ApplyStrategyParams } from '../contexts/YieldStrategyContext';
import CompatGrid from '../components/common/CompatGrid';

// Create a Grid component that handles both container and item props
const Grid = MuiGrid;

const YieldStrategyPage: React.FC = () => {
  const theme = useTheme();
  const {
    strategies,
    userStrategies,
    filteredStrategies,
    selectedStrategy,
    impactResults,
    filters,
    loading,
    error,
    fetchStrategies,
    fetchUserStrategies,
    applyStrategy,
    calculateImpact,
    setFilters,
    resetFilters,
    setSelectedStrategy
  } = useYieldStrategy();

  // Local state
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showImpactDialog, setShowImpactDialog] = useState<boolean>(false);
  const [showApplyDialog, setShowApplyDialog] = useState<boolean>(false);
  
  // Impact calculation state
  const [investmentAmount, setInvestmentAmount] = useState<string>('1000');
  const [durationDays, setDurationDays] = useState<string>('365');
  
  // Apply strategy state
  const [assetId, setAssetId] = useState<string>('');
  const [applyAmount, setApplyAmount] = useState<string>('1000');
  const [applyDuration, setApplyDuration] = useState<string>('365');
  
  // Mock assets for demo
  const mockAssets = [
    { id: '0xasset1', name: 'Treasury Bill - 3 Month', balance: '50000000000000000000' },
    { id: '0xasset2', name: 'Treasury Note - 5 Year', balance: '25000000000000000000' },
    { id: '0xasset3', name: 'Real Estate Token - Commercial', balance: '10000000000000000000' },
    { id: '0xasset4', name: 'Gold Token', balance: '5000000000000000000' },
    { id: '0xasset5', name: 'Carbon Credit - Verra', balance: '20000000000000000000' },
    { id: '0xasset6', name: 'Biodiversity Credit - Rainforest', balance: '15000000000000000000' },
    { id: '0xasset7', name: 'Renewable Energy Certificate - Solar', balance: '30000000000000000000' },
  ];
  
  // Filter state
  const [localFilters, setLocalFilters] = useState({
    asset_class: [] as number[],
    risk_level: [] as string[],
    min_annual_yield: 0,
    max_fee: 100,
    environmental_only: false,
    auto_compound_only: false,
    asset_type: [] as string[],
    min_retirement_percentage: 0,
    carbon_negative_only: false
  });
  
  // Load data on component mount
  useEffect(() => {
    fetchStrategies();
    fetchUserStrategies();
  }, []);
  
  // Update local filters from context
  useEffect(() => {
    setLocalFilters({
      asset_class: filters.asset_class || [],
      risk_level: filters.risk_level || [],
      min_annual_yield: filters.min_annual_yield || 0,
      max_fee: filters.max_fee || 100,
      environmental_only: filters.environmental_only || false,
      auto_compound_only: filters.auto_compound_only || false,
      asset_type: filters.asset_type || [],
      min_retirement_percentage: filters.min_retirement_percentage || 0,
      carbon_negative_only: filters.carbon_negative_only || false
    });
  }, [filters]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Handle applying filters
  const handleApplyFilters = () => {
    setFilters(localFilters);
    setShowFilters(false);
  };
  
  // Handle resetting filters
  const handleResetFilters = () => {
    resetFilters();
    setShowFilters(false);
  };
  
  // Handle filter changes
  const handleAssetClassChange = (event: SelectChangeEvent<number[]>) => {
    setLocalFilters(prev => ({
      ...prev,
      asset_class: event.target.value as number[]
    }));
  };
  
  const handleRiskLevelChange = (event: SelectChangeEvent<string[]>) => {
    setLocalFilters(prev => ({
      ...prev,
      risk_level: event.target.value as string[]
    }));
  };
  
  const handleMinYieldChange = (event: Event, newValue: number | number[]) => {
    setLocalFilters(prev => ({
      ...prev,
      min_annual_yield: newValue as number
    }));
  };
  
  const handleMaxFeeChange = (event: Event, newValue: number | number[]) => {
    setLocalFilters(prev => ({
      ...prev,
      max_fee: newValue as number
    }));
  };
  
  const handleEnvironmentalOnlyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalFilters(prev => ({
      ...prev,
      environmental_only: event.target.checked
    }));
  };
  
  const handleAutoCompoundOnlyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalFilters(prev => ({
      ...prev,
      auto_compound_only: event.target.checked
    }));
  };
  
  const handleAssetTypeChange = (event: SelectChangeEvent<string[]>) => {
    setLocalFilters(prev => ({
      ...prev,
      asset_type: event.target.value as string[]
    }));
  };
  
  const handleMinRetirementChange = (event: Event, newValue: number | number[]) => {
    setLocalFilters(prev => ({
      ...prev,
      min_retirement_percentage: newValue as number
    }));
  };
  
  const handleCarbonNegativeOnlyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalFilters(prev => ({
      ...prev,
      carbon_negative_only: event.target.checked
    }));
  };
  
  // Handle selecting a strategy for impact calculation
  const handleCalculateImpact = (strategy: YieldStrategy) => {
    setSelectedStrategy(strategy);
    setShowImpactDialog(true);
  };
  
  // Handle submitting impact calculation
  const handleSubmitImpactCalculation = async () => {
    if (!selectedStrategy) return;
    
    await calculateImpact(
      selectedStrategy.strategy_id,
      investmentAmount,
      durationDays
    );
  };
  
  // Handle closing impact dialog
  const handleCloseImpactDialog = () => {
    setShowImpactDialog(false);
  };
  
  // Handle selecting a strategy for application
  const handleSelectStrategy = (strategy: YieldStrategy) => {
    setSelectedStrategy(strategy);
    setShowApplyDialog(true);
  };
  
  // Handle submitting strategy application
  const handleApplyStrategy = async () => {
    if (!selectedStrategy || !assetId) return;
    
    const params: ApplyStrategyParams = {
      strategy_id: selectedStrategy.strategy_id,
      asset_id: assetId,
      amount: applyAmount,
      duration_days: applyDuration
    };
    
    await applyStrategy(params);
    setShowApplyDialog(false);
  };
  
  // Handle closing apply dialog
  const handleCloseApplyDialog = () => {
    setShowApplyDialog(false);
  };
  
  // Format percentage from basis points
  const formatPercentage = (basisPoints: string) => {
    const percentage = parseFloat(basisPoints) / 100;
    return `${percentage.toFixed(2)}%`;
  };
  
  // Format token amounts for display
  const formatTokenAmount = (amount: string) => {
    const amountBigInt = BigInt(amount);
    const whole = amountBigInt / BigInt(10 ** 18);
    const fraction = amountBigInt % BigInt(10 ** 18);
    
    // Format with 2 decimal places
    const fractionStr = fraction.toString().padStart(18, '0').substring(0, 2);
    
    return `${whole.toString()}.${fractionStr}`;
  };
  
  // Get asset class icon
  const getAssetClassIcon = (assetClass?: number) => {
    switch (assetClass) {
      case 0: return <AccountBalance />;
      case 1: return <Home />;
      case 2: return <ShoppingCart />;
      case 3: return <CompareArrows />;
      case 4: return <WaterDrop />;
      default: return <TrendingUp />;
    }
  };
  
  // Get asset class name
  const getAssetClassName = (assetClass?: number) => {
    switch (assetClass) {
      case 0: return 'Treasury';
      case 1: return 'Real Estate';
      case 2: return 'Commodity';
      case 3: return 'Stablecoin';
      case 4: return 'Environmental';
      default: return 'Unknown';
    }
  };
  
  // Get environmental asset type icon
  const getAssetTypeIcon = (type?: string) => {
    switch (type) {
      case 'CarbonCredit': return <ForestOutlined />;
      case 'BiodiversityCredit': return <NatureOutlined />;
      case 'RenewableEnergyCertificate': return <WbSunnyOutlined />;
      case 'WaterRight': return <WaterOutlined />;
      default: return <ForestOutlined />;
    }
  };
  
  // Get risk level color
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'CONSERVATIVE': return theme.palette.info.main;
      case 'MODERATE': return theme.palette.warning.main;
      case 'AGGRESSIVE': return theme.palette.error.main;
      default: return theme.palette.primary.main;
    }
  };
  
  // Render filter panel
  const renderFilterPanel = () => {
    return (
      <Card sx={{ mb: 4, display: showFilters ? 'block' : 'none' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filter Strategies
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <CompatGrid container spacing={3}>
            <CompatGrid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Asset Class</InputLabel>
                <Select
                  multiple
                  value={localFilters.asset_class}
                  onChange={handleAssetClassChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as number[]).map((value) => (
                        <Chip 
                          key={value} 
                          label={getAssetClassName(value)} 
                          size="small" 
                          icon={getAssetClassIcon(value)}
                        />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value={0}>Treasury</MenuItem>
                  <MenuItem value={1}>Real Estate</MenuItem>
                  <MenuItem value={2}>Commodity</MenuItem>
                  <MenuItem value={3}>Stablecoin</MenuItem>
                  <MenuItem value={4}>Environmental</MenuItem>
                </Select>
              </FormControl>
            </CompatGrid>
            
            <CompatGrid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Risk Level</InputLabel>
                <Select
                  multiple
                  value={localFilters.risk_level}
                  onChange={handleRiskLevelChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip 
                          key={value} 
                          label={value.charAt(0) + value.slice(1).toLowerCase()} 
                          size="small" 
                          sx={{ bgcolor: getRiskLevelColor(value), color: 'white' }}
                        />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="CONSERVATIVE">Conservative</MenuItem>
                  <MenuItem value="MODERATE">Moderate</MenuItem>
                  <MenuItem value="AGGRESSIVE">Aggressive</MenuItem>
                </Select>
              </FormControl>
            </CompatGrid>
            
            <CompatGrid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={localFilters.auto_compound_only}
                    onChange={handleAutoCompoundOnlyChange}
                  />
                }
                label="Auto-Compound Only"
              />
            </CompatGrid>
            
            <CompatGrid item xs={12} md={6}>
              <Typography gutterBottom>
                Minimum Annual Yield: {localFilters.min_annual_yield}%
              </Typography>
              <Slider
                value={localFilters.min_annual_yield}
                onChange={handleMinYieldChange}
                min={0}
                max={10}
                step={0.25}
                valueLabelDisplay="auto"
              />
            </CompatGrid>
            
            <CompatGrid item xs={12} md={6}>
              <Typography gutterBottom>
                Maximum Fee: {localFilters.max_fee}%
              </Typography>
              <Slider
                value={localFilters.max_fee}
                onChange={handleMaxFeeChange}
                min={0}
                max={5}
                step={0.1}
                valueLabelDisplay="auto"
              />
            </CompatGrid>
            
            <CompatGrid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={localFilters.environmental_only}
                    onChange={handleEnvironmentalOnlyChange}
                  />
                }
                label="Environmental Strategies Only"
              />
            </CompatGrid>
            
            {localFilters.environmental_only && (
              <>
                <CompatGrid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Asset Type</InputLabel>
                    <Select
                      multiple
                      value={localFilters.asset_type}
                      onChange={handleAssetTypeChange}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as string[]).map((value) => (
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
                </CompatGrid>
                
                <CompatGrid item xs={12} md={4}>
                  <Typography gutterBottom>
                    Minimum Retirement: {localFilters.min_retirement_percentage}%
                  </Typography>
                  <Slider
                    value={localFilters.min_retirement_percentage}
                    onChange={handleMinRetirementChange}
                    min={0}
                    max={50}
                    valueLabelDisplay="auto"
                  />
                </CompatGrid>
                
                <CompatGrid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={localFilters.carbon_negative_only}
                        onChange={handleCarbonNegativeOnlyChange}
                      />
                    }
                    label="Carbon Negative Only"
                  />
                </CompatGrid>
              </>
            )}
          </CompatGrid>
          
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
    );
  };
  
  // Render impact calculation dialog
  const renderImpactDialog = () => {
    return (
      <Dialog open={showImpactDialog} onClose={handleCloseImpactDialog} maxWidth="md">
        <DialogTitle>
          Calculate Environmental Impact
        </DialogTitle>
        <DialogContent>
          {selectedStrategy && (
            <>
              <DialogContentText paragraph>
                Calculate the potential environmental impact of applying the <strong>{selectedStrategy.name}</strong> strategy to your investment.
              </DialogContentText>
              
              <CompatGrid container spacing={3} sx={{ mb: 3 }}>
                <CompatGrid item xs={12} sm={6}>
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
                </CompatGrid>
                <CompatGrid item xs={12} sm={6}>
                  <TextField
                    label="Time Period (Days)"
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    fullWidth
                  />
                </CompatGrid>
              </CompatGrid>
              
              {!impactResults && !loading && (
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
              
              {loading && (
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
                  
                  <CompatGrid container spacing={3}>
                    {impactResults.impact_metrics.carbon_offset_tons && parseInt(impactResults.impact_metrics.carbon_offset_tons) > 0 && (
                      <CompatGrid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                          <ForestOutlined color="success" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="h5" gutterBottom>
                            {parseInt(impactResults.impact_metrics.carbon_offset_tons).toLocaleString()} tons
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Carbon Offset (CO₂e)
                          </Typography>
                        </Box>
                      </CompatGrid>
                    )}
                    
                    {impactResults.impact_metrics.land_area_protected_hectares && parseInt(impactResults.impact_metrics.land_area_protected_hectares) > 0 && (
                      <CompatGrid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                          <NatureOutlined color="success" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="h5" gutterBottom>
                            {parseInt(impactResults.impact_metrics.land_area_protected_hectares).toLocaleString()} ha
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Land Area Protected
                          </Typography>
                        </Box>
                      </CompatGrid>
                    )}
                    
                    {impactResults.impact_metrics.renewable_energy_mwh && parseInt(impactResults.impact_metrics.renewable_energy_mwh) > 0 && (
                      <CompatGrid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                          <WbSunnyOutlined color="warning" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="h5" gutterBottom>
                            {parseInt(impactResults.impact_metrics.renewable_energy_mwh).toLocaleString()} MWh
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Renewable Energy
                          </Typography>
                        </Box>
                      </CompatGrid>
                    )}
                    
                    {impactResults.impact_metrics.auto_retired_credits && parseInt(impactResults.impact_metrics.auto_retired_credits) > 0 && (
                      <CompatGrid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                          <RecyclingOutlined color="primary" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="h5" gutterBottom>
                            {parseInt(impactResults.impact_metrics.auto_retired_credits).toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Auto-Retired Credits
                          </Typography>
                        </Box>
                      </CompatGrid>
                    )}
                  </CompatGrid>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImpactDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  // Render apply strategy dialog
  const renderApplyDialog = () => {
    return (
      <Dialog open={showApplyDialog} onClose={handleCloseApplyDialog} maxWidth="md">
        <DialogTitle>
          Apply Strategy
        </DialogTitle>
        <DialogContent>
          {selectedStrategy && (
            <>
              <DialogContentText paragraph>
                Apply the <strong>{selectedStrategy.name}</strong> strategy to one of your assets.
              </DialogContentText>
              
              <CompatGrid container spacing={3} sx={{ mb: 3 }}>
                <CompatGrid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Select Asset</InputLabel>
                    <Select
                      value={assetId}
                      onChange={(e) => setAssetId(e.target.value)}
                    >
                      {mockAssets.map((asset) => (
                        <MenuItem key={asset.id} value={asset.id}>
                          {asset.name} - Balance: {formatTokenAmount(asset.balance)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </CompatGrid>
                
                <CompatGrid item xs={12} sm={6}>
                  <TextField
                    label="Investment Amount"
                    type="number"
                    value={applyAmount}
                    onChange={(e) => setApplyAmount(e.target.value)}
                    fullWidth
                    InputProps={{
                      startAdornment: "$",
                    }}
                  />
                </CompatGrid>
                
                <CompatGrid item xs={12} sm={6}>
                  <TextField
                    label="Time Period (Days)"
                    type="number"
                    value={applyDuration}
                    onChange={(e) => setApplyDuration(e.target.value)}
                    fullWidth
                  />
                </CompatGrid>
              </CompatGrid>
              
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Strategy Details
                  </Typography>
                  
                  <CompatGrid container spacing={2}>
                    <CompatGrid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Asset Class:</Typography>
                      <Typography variant="body1">
                        {getAssetClassName(selectedStrategy.asset_class)}
                      </Typography>
                    </CompatGrid>
                    
                    <CompatGrid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Risk Level:</Typography>
                      <Typography variant="body1">
                        {selectedStrategy.risk_level.charAt(0) + selectedStrategy.risk_level.slice(1).toLowerCase()}
                      </Typography>
                    </CompatGrid>
                    
                    <CompatGrid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Annual Yield:</Typography>
                      <Typography variant="body1">
                        {selectedStrategy.annual_yield_percentage}%
                      </Typography>
                    </CompatGrid>
                    
                    <CompatGrid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Performance Fee:</Typography>
                      <Typography variant="body1">
                        {formatPercentage(selectedStrategy.performance_fee)}
                      </Typography>
                    </CompatGrid>
                    
                    <CompatGrid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Auto-Compound:</Typography>
                      <Typography variant="body1">
                        {selectedStrategy.auto_compound ? 'Yes' : 'No'}
                      </Typography>
                    </CompatGrid>
                    
                    {selectedStrategy.environmental_metadata && (
                      <CompatGrid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Retirement Percentage:</Typography>
                        <Typography variant="body1">
                          {selectedStrategy.environmental_metadata.retirement_percentage}%
                        </Typography>
                      </CompatGrid>
                    )}
                  </CompatGrid>
                </CardContent>
              </Card>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                Your estimated yield over the term will be approximately {
                  selectedStrategy.annual_yield_percentage 
                    ? ((parseFloat(applyAmount) * parseFloat(selectedStrategy.annual_yield_percentage) / 100) * (parseInt(applyDuration) / 365)).toFixed(2)
                    : '0.00'
                }.
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseApplyDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleApplyStrategy}
            disabled={!assetId || !applyAmount}
          >
            Apply Strategy
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  // Render strategy cards
  const renderStrategyCard = (strategy: YieldStrategy) => {
    return (
      <CompatGrid item xs={12} md={6} lg={4} key={strategy.strategy_id}>
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Chip 
                icon={getAssetClassIcon(strategy.asset_class)} 
                label={getAssetClassName(strategy.asset_class)} 
                size="small"
                color="primary"
                variant="outlined"
              />
              
              <Chip 
                label={strategy.risk_level.charAt(0) + strategy.risk_level.slice(1).toLowerCase()} 
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
            
            <CompatGrid container spacing={2}>
              <CompatGrid item xs={6}>
                <Typography variant="body2" color="text.secondary">Annual Yield:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                  {strategy.annual_yield_percentage}%
                </Typography>
              </CompatGrid>
              
              <CompatGrid item xs={6}>
                <Typography variant="body2" color="text.secondary">Fee:</Typography>
                <Typography variant="body1">
                  {formatPercentage(strategy.performance_fee)}
                </Typography>
              </CompatGrid>
              
              <CompatGrid item xs={6}>
                <Typography variant="body2" color="text.secondary">Auto-Compound:</Typography>
                <Typography variant="body1">
                  {strategy.auto_compound ? <Check color="success" /> : 'No'}
                </Typography>
              </CompatGrid>
              
              <CompatGrid item xs={6}>
                <Typography variant="body2" color="text.secondary">Min Deposit:</Typography>
                <Typography variant="body1">
                  {strategy.min_deposit ? formatTokenAmount(strategy.min_deposit) : 'N/A'}
                </Typography>
              </CompatGrid>
              
              {strategy.environmental_metadata && (
                <>
                  <CompatGrid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" color="text.secondary">Environmental Impact:</Typography>
                  </CompatGrid>
                  
                  <CompatGrid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getAssetTypeIcon(strategy.environmental_metadata.asset_type)}
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {strategy.environmental_metadata.asset_type.replace(/([A-Z])/g, ' $1').trim()}
                      </Typography>
                    </Box>
                  </CompatGrid>
                  
                  <CompatGrid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Auto-Retirement:</Typography>
                    <Typography variant="body1">
                      {strategy.environmental_metadata.retirement_percentage}%
                    </Typography>
                  </CompatGrid>
                </>
              )}
            </CompatGrid>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              {strategy.environmental_metadata && (
                <Button
                  variant="outlined"
                  startIcon={<CalculateOutlined />}
                  onClick={() => handleCalculateImpact(strategy)}
                  size="small"
                >
                  Impact
                </Button>
              )}
              
              <Button
                variant="contained"
                onClick={() => handleSelectStrategy(strategy)}
                size="small"
                sx={{ ml: 'auto' }}
              >
                Apply Strategy
              </Button>
            </Box>
          </CardContent>
        </Card>
      </CompatGrid>
    );
  };
  
  // Render user strategies table
  const renderUserStrategiesTable = () => {
    return (
      <TableContainer component={Paper}>
        <Table aria-label="my strategies table">
          <TableHead>
            <TableRow>
              <TableCell>Strategy</TableCell>
              <TableCell>Asset</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Est. Yield</TableCell>
              <TableCell align="right">Est. Impact</TableCell>
              <TableCell align="right">Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {userStrategies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No strategies applied yet.
                </TableCell>
              </TableRow>
            ) : (
              userStrategies.map((strategy) => {
                const assetName = mockAssets.find(a => a.id === strategy.asset_id)?.name || 'Unknown Asset';
                const strategyDetails = strategies.find(s => s.strategy_id === strategy.strategy_id);
                
                return (
                  <TableRow key={strategy.transaction_id}>
                    <TableCell>
                      {strategyDetails?.name || 'Unknown Strategy'}
                    </TableCell>
                    <TableCell>{assetName}</TableCell>
                    <TableCell align="right">{formatTokenAmount(strategy.amount)}</TableCell>
                    <TableCell align="right">
                      {strategy.estimated_yield ? formatTokenAmount(strategy.estimated_yield) : 'N/A'}
                    </TableCell>
                    <TableCell align="right">
                      {strategy.estimated_impact?.carbon_offset_tons 
                        ? `${strategy.estimated_impact.carbon_offset_tons} tons CO₂` 
                        : 'N/A'}
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={strategy.status}
                        color={
                          strategy.status === 'COMPLETED' 
                            ? 'success' 
                            : strategy.status === 'PENDING' 
                              ? 'warning' 
                              : 'error'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {strategyDetails?.environmental_metadata && (
                        <Tooltip title="View Impact">
                          <IconButton size="small" onClick={() => handleCalculateImpact(strategyDetails)}>
                            <CalculateOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Yield Strategy Marketplace
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {renderFilterPanel()}
      
      <Box sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="yield strategy tabs"
        >
          <Tab label="All Strategies" />
          <Tab label="My Strategies" />
        </Tabs>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {activeTab === 0 && (
            filteredStrategies.length > 0 ? (
              <CompatGrid container spacing={3}>
                {filteredStrategies.map(renderStrategyCard)}
              </CompatGrid>
            ) : (
              <Alert severity="info">
                No strategies match your current filters. Try adjusting or resetting your filters.
              </Alert>
            )
          )}
          
          {activeTab === 1 && renderUserStrategiesTable()}
        </>
      )}
      
      {renderImpactDialog()}
      {renderApplyDialog()}
    </Container>
  );
};

export default YieldStrategyPage; 