import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Link,
  Alert,
  Tabs,
  Tab,
  useTheme,
} from '@mui/material';
import {
  ForestOutlined,
  NatureOutlined,
  WbSunnyOutlined,
  WaterOutlined,
  Verified,
  OpenInNew,
  ShoppingCart,
  Download,
  RestoreFromTrash,
  History,
  Share,
  Timeline,
  MonetizationOn,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/api';
import ImpactDashboard from '../components/common/ImpactDashboard';
import SustainableYieldStrategies from '../components/common/SustainableYieldStrategies';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';

const EnvironmentalAssetPage = () => {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const theme = useTheme();
  const { theme: appTheme } = useAppTheme();
  
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Dialogs state
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [retireDialogOpen, setRetireDialogOpen] = useState(false);
  const [retireAmount, setRetireAmount] = useState('');
  const [retireReason, setRetireReason] = useState('');
  const [beneficiary, setBeneficiary] = useState('');
  const [publicRetirement, setPublicRetirement] = useState(true);
  
  // Tabs state
  const [tabValue, setTabValue] = useState(0);
  
  const setMockAssetData = useCallback(() => {
    // Set up specific assets for direct links from the marketplace
    if (assetId === '0x5f0f0e0d0c0b0a09080706050403020100000005') {
      // Amazon Rainforest Carbon Credits
      const amazonAsset = {
        asset_id: assetId,
        asset_type: 'CarbonCredit',
        standard: 'Verra',
        vintage_year: 2023,
        project_id: 'VCS-987654',
        project_name: 'Amazon Rainforest Conservation Initiative',
        project_location: 'Amazon, Brazil',
        verification_status: 'Verified',
        verification_date: Math.floor(Date.now() / 1000) - 7776000, // 90 days ago
        registry_link: 'https://registry.verra.org/app/projectDetail/VCS/987654',
        metadata_uri: 'ipfs://QmYVxS7LnrUyTD8uhdLZkwrC3romw7ZVEALeAGuTNrSJCR',
        impact_metrics: {
          carbon_offset_tons: 750000,
          land_area_protected_hectares: 45000,
          renewable_energy_mwh: 0,
          water_protected_liters: 7500000000,
          sdg_alignment: {
            "13": 0.95, // Climate Action
            "15": 0.90, // Life on Land
            "6": 0.70,  // Clean Water and Sanitation
          },
          verification_date: Math.floor(Date.now() / 1000) - 7776000,
          third_party_verifier: 'Bureau Veritas',
        },
        issuance_date: Math.floor(Date.now() / 1000) - 8000000,
        expiration_date: Math.floor(Date.now() / 1000) + 31536000, // 1 year from now
        retired: false,
        total_supply: '750000',
        available_supply: '650000',
        description: 'The Amazon Rainforest Conservation Initiative focuses on protecting critical primary forest in the heart of the Brazilian Amazon. This REDD+ project prevents deforestation through community engagement, sustainable livelihoods, and enhanced monitoring. Each credit represents one metric ton of verified CO2 emissions reduction.',
        price_per_unit: '24.75',
        image_url: 'https://images.pexels.com/photos/955657/pexels-photo-955657.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        project_developer: 'Conservation International',
        methodology: 'VM0015 - REDD+ Methodology',
        co_benefits: [
          'Biodiversity conservation',
          'Indigenous community support',
          'Watershed protection',
          'Sustainable employment',
          'Education programs'
        ],
        certification_documents: [
          { name: 'Project Design Document', url: '#pdd' },
          { name: 'Validation Report', url: '#validation' },
          { name: 'Monitoring Report', url: '#monitoring' },
          { name: 'Verification Statement', url: '#verification' },
          { name: 'Registration Statement', url: '#registration' }
        ],
        security_details: {
          token_standard: 'ERC-1155',
          contract_address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          blockchain: 'Ethereum',
          token_id: '5',
          marketplace_url: '/marketplace'
        }
      };
      
      setAsset(amazonAsset);
      return;
    }
    
    if (assetId === '0x5f0f0e0d0c0b0a09080706050403020100000006') {
      // Blue Carbon Mangrove Credits
      const mangroveAsset = {
        asset_id: assetId,
        asset_type: 'BiodiversityCredit',
        standard: 'Gold Standard',
        vintage_year: 2023,
        project_id: 'GS-123456',
        project_name: 'Blue Carbon Mangrove Restoration',
        project_location: 'Sundarban Delta, Bangladesh',
        verification_status: 'Verified',
        verification_date: Math.floor(Date.now() / 1000) - 5184000, // 60 days ago
        registry_link: 'https://registry.goldstandard.org/projects/details/123456',
        metadata_uri: 'ipfs://QmZbv9Ry7BVpFwnYYVQRKV5hH2GLd95S9LpJ5XKx9yCZSF',
        impact_metrics: {
          carbon_offset_tons: 350000,
          land_area_protected_hectares: 12000,
          renewable_energy_mwh: 0,
          water_protected_liters: 15000000000,
          sdg_alignment: {
            "13": 0.85, // Climate Action
            "14": 0.95, // Life Below Water
            "15": 0.80, // Life on Land
            "6": 0.75,  // Clean Water and Sanitation
            "1": 0.70   // No Poverty
          },
          verification_date: Math.floor(Date.now() / 1000) - 5184000,
          third_party_verifier: 'SCS Global Services',
        },
        issuance_date: Math.floor(Date.now() / 1000) - 6000000,
        expiration_date: Math.floor(Date.now() / 1000) + 31536000, // 1 year from now
        retired: false,
        total_supply: '350000',
        available_supply: '300000',
        description: 'The Blue Carbon Mangrove Restoration project focuses on rehabilitating degraded mangrove ecosystems in the Sundarban Delta. Mangroves sequester up to five times more carbon than terrestrial forests and protect coastal communities from storms and erosion. Each credit represents both carbon sequestration and biodiversity protection metrics.',
        price_per_unit: '18.50',
        image_url: 'https://images.pexels.com/photos/11842913/pexels-photo-11842913.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
        project_developer: 'Blue Carbon Initiative',
        methodology: 'VM0033 - Tidal Wetland and Seagrass Restoration',
        co_benefits: [
          'Coastal erosion protection',
          'Storm surge mitigation',
          'Marine habitat restoration',
          'Local fishery enhancement',
          'Community-based restoration jobs',
          'Ecotourism development'
        ],
        certification_documents: [
          { name: 'Project Design Document', url: '#pdd' },
          { name: 'Methodology Application', url: '#methodology' },
          { name: 'Validation Report', url: '#validation' },
          { name: 'Monitoring Report', url: '#monitoring' },
          { name: 'Verification Statement', url: '#verification' }
        ],
        security_details: {
          token_standard: 'ERC-1155',
          contract_address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          blockchain: 'Ethereum',
          token_id: '6',
          marketplace_url: '/marketplace'
        }
      };
      
      setAsset(mangroveAsset);
      return;
    }
    
    // Default mock asset for other IDs
    const mockAsset = {
      asset_id: assetId,
      asset_type: 'CarbonCredit',
      standard: 'Verra',
      vintage_year: 2022,
      project_id: 'VCS-123456',
      project_name: 'Rainforest Conservation Project',
      project_location: 'Amazon, Brazil',
      verification_status: 'Verified',
      verification_date: 1672531200, // Jan 1, 2023
      registry_link: 'https://registry.verra.org/app/projectDetail/VCS/123456',
      metadata_uri: 'ipfs://Qm...',
      impact_metrics: {
        carbon_offset_tons: 150.5,
        land_area_protected_hectares: 25.0,
        renewable_energy_mwh: 0.0,
        water_protected_liters: 0.0,
        sdg_alignment: {
          "13": 0.9, // Climate Action
          "15": 0.8, // Life on Land
        },
        verification_date: 1672531200, // Jan 1, 2023
        third_party_verifier: 'Verification Co.',
      },
      issuance_date: 1672531200, // Jan 1, 2023
      expiration_date: 1704067200, // Jan 1, 2024
      retired: false,
      total_supply: '1000',
      available_supply: '800',
      description: 'This conservation project protects critical rainforest habitat in the Amazon Basin. It prevents deforestation and supports biodiversity conservation while engaging local communities in sustainable livelihood activities.',
      price_per_unit: '25.50', // USD
      image_url: 'https://source.unsplash.com/featured/600x400?rainforest',
      project_developer: 'Green Conservation Partners',
      methodology: 'VM0015 - REDD Methodology',
      co_benefits: [
        'Biodiversity protection',
        'Community development',
        'Water conservation',
      ],
      certification_documents: [
        { name: 'Validation Report', url: '#' },
        { name: 'Monitoring Report', url: '#' },
        { name: 'Verification Statement', url: '#' },
      ]
    };
    
    setAsset(mockAsset);
  }, [assetId]);
  
  useEffect(() => {
    const fetchAsset = async () => {
      try {
        setLoading(true);
        // Fetch asset details from API
        const response = await api.get(`/environmental/assets/${assetId}`);
        setAsset(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching asset details:', err);
        setError('Failed to load asset details');
        setLoading(false);
        
        // For demo purposes, set mock data if API fails
        setMockAssetData();
      }
    };

    if (assetId) {
      fetchAsset();
    }
  }, [assetId, setMockAssetData]);
  
  // Handle buy dialog
  const handleBuyOpen = () => {
    setBuyDialogOpen(true);
  };
  
  const handleBuyClose = () => {
    setBuyDialogOpen(false);
  };
  
  // Handle retire dialog
  const handleRetireOpen = () => {
    setRetireDialogOpen(true);
  };
  
  const handleRetireClose = () => {
    setRetireDialogOpen(false);
  };
  
  const handleRetire = async () => {
    // In a real implementation, this would call the API to retire credits
    console.log('Retiring credits:', {
      assetId,
      amount: retireAmount,
      retirement_reason: retireReason,
      beneficiary: beneficiary || null,
    });
    
    // Close dialog and reset form
    setRetireDialogOpen(false);
    setRetireAmount('');
    setRetireReason('');
    setBeneficiary('');
    setPublicRetirement(true);
    
    // Show success message
    alert('Credits retired successfully!');
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Get asset type icon
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
  
  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString();
  };
  
  // Format asset type for display
  const formatAssetType = (type) => {
    if (!type) return 'N/A';
    return type.replace(/([A-Z])/g, ' $1').trim();
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

  if (!asset) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Asset not found</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Back button */}
      <Box mb={2}>
        <Button 
          variant="text" 
          onClick={() => navigate(asset.security_details?.marketplace_url || '/marketplace')}
        >
          ← Back to Marketplace
        </Button>
      </Box>
      
      {/* Asset Header */}
      <Card sx={{ 
        mb: 4, 
        overflow: 'hidden',
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderColor: 'divider'
      }}>
        <Grid container>
          <Grid item xs={12} md={5}>
            <Box 
              component="img"
              src={asset.image_url}
              alt={asset.project_name}
              sx={{ 
                width: '100%', 
                height: '100%', 
                minHeight: 250,
                objectFit: 'cover' 
              }}
            />
          </Grid>
          <Grid item xs={12} md={7}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Chip 
                    icon={getAssetTypeIcon(asset.asset_type)} 
                    label={formatAssetType(asset.asset_type)} 
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />
                  
                  {asset.verification_status === 'Verified' && (
                    <Chip 
                      icon={<Verified />} 
                      label="Verified" 
                      size="small"
                      color="success"
                      sx={{ ml: 1, mb: 1 }}
                    />
                  )}
                </Box>
                
                <Chip 
                  label={`Vintage ${asset.vintage_year}`} 
                  size="small"
                  variant="outlined"
                />
              </Box>
              
              <Typography variant="h4" component="h1" gutterBottom color="text.primary">
                {asset.project_name}
              </Typography>
              
              <Typography variant="body1" color="text.secondary" paragraph>
                {asset.project_location} • {asset.standard}
              </Typography>
              
              <Typography variant="body1" paragraph color="text.primary">
                {asset.description}
              </Typography>
              
              <Box sx={{ mt: 'auto' }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs>
                    <Typography variant="h5" color="primary">
                      ${asset.price_per_unit} <Typography component="span" variant="body2">per credit</Typography>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Available: {parseInt(asset.available_supply).toLocaleString()} credits
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      startIcon={<ShoppingCart />}
                      onClick={handleBuyOpen}
                      sx={{ mr: 1 }}
                    >
                      Buy Credits
                    </Button>
                    <Button 
                      variant="outlined" 
                      startIcon={<RestoreFromTrash />}
                      onClick={handleRetireOpen}
                    >
                      Retire
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Grid>
        </Grid>
      </Card>
      
      {/* Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="asset details tabs"
        >
          <Tab icon={<ForestOutlined />} iconPosition="start" label="Asset Details" />
          <Tab icon={<Timeline />} iconPosition="start" label="Impact Metrics" />
          <Tab icon={<MonetizationOn />} iconPosition="start" label="Yield Strategies" />
        </Tabs>
      </Box>
      
      {/* Tab Panels */}
      <Box sx={{ display: tabValue === 0 ? 'block' : 'none' }}>
        {/* Asset Details and Impact */}
        <Grid container spacing={4}>
          {/* Project Details */}
          <Grid item xs={12} md={5}>
            <Card sx={{ 
              mb: 4,
              bgcolor: 'background.paper',
              color: 'text.primary',
              borderColor: 'divider'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="text.primary">
                  Project Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'background.paper' }}>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ color: 'text.secondary' }}>Project ID</TableCell>
                        <TableCell align="right" sx={{ color: 'text.primary' }}>{asset.project_id}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ color: 'text.secondary' }}>Standard</TableCell>
                        <TableCell align="right" sx={{ color: 'text.primary' }}>{asset.standard}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ color: 'text.secondary' }}>Methodology</TableCell>
                        <TableCell align="right" sx={{ color: 'text.primary' }}>{asset.methodology}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ color: 'text.secondary' }}>Project Developer</TableCell>
                        <TableCell align="right" sx={{ color: 'text.primary' }}>{asset.project_developer}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ color: 'text.secondary' }}>Issuance Date</TableCell>
                        <TableCell align="right" sx={{ color: 'text.primary' }}>{formatDate(asset.issuance_date)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ color: 'text.secondary' }}>Expiration Date</TableCell>
                        <TableCell align="right" sx={{ color: 'text.primary' }}>{formatDate(asset.expiration_date)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ color: 'text.secondary' }}>Verification Date</TableCell>
                        <TableCell align="right" sx={{ color: 'text.primary' }}>{formatDate(asset.verification_date)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ color: 'text.secondary' }}>Verifier</TableCell>
                        <TableCell align="right" sx={{ color: 'text.primary' }}>{asset.impact_metrics.third_party_verifier || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ color: 'text.secondary' }}>Total Supply</TableCell>
                        <TableCell align="right" sx={{ color: 'text.primary' }}>{parseInt(asset.total_supply).toLocaleString()} credits</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ color: 'text.secondary' }}>Available Supply</TableCell>
                        <TableCell align="right" sx={{ color: 'text.primary' }}>{parseInt(asset.available_supply).toLocaleString()} credits</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Box sx={{ mt: 3, mb: 2 }}>
                  <Button 
                    variant="outlined"
                    size="small"
                    startIcon={<OpenInNew />}
                    component={Link}
                    href={asset.registry_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    fullWidth
                  >
                    View in Registry
                  </Button>
                </Box>
                
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }} color="text.primary">
                  Certification Documents
                </Typography>
                
                {asset.certification_documents && asset.certification_documents.length > 0 ? (
                  <Box>
                    {asset.certification_documents.map((doc, index) => (
                      <Button
                        key={index}
                        variant="text"
                        size="small"
                        startIcon={<Download />}
                        component={Link}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ mr: 1, mb: 1 }}
                      >
                        {doc.name}
                      </Button>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No documents available
                  </Typography>
                )}
              </CardContent>
            </Card>
            
            {/* Additional Actions */}
            <Card sx={{ 
              bgcolor: 'background.paper',
              color: 'text.primary',
              borderColor: 'divider'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="text.primary">
                  Additional Actions
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Button
                  variant="outlined"
                  startIcon={<History />}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  View Transaction History
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Share />}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Share Project
                </Button>
                
                {asset.security_details && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" gutterBottom color="text.primary">
                      Tokenized Security Details
                    </Typography>
                    <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'background.paper' }}>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell component="th" scope="row" sx={{ color: 'text.secondary' }}>Token Standard</TableCell>
                            <TableCell align="right" sx={{ color: 'text.primary' }}>{asset.security_details.token_standard}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row" sx={{ color: 'text.secondary' }}>Contract Address</TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.primary' }}>
                                {asset.security_details.contract_address.substring(0, 6)}...{asset.security_details.contract_address.substring(38)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row" sx={{ color: 'text.secondary' }}>Blockchain</TableCell>
                            <TableCell align="right" sx={{ color: 'text.primary' }}>{asset.security_details.blockchain}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row" sx={{ color: 'text.secondary' }}>Token ID</TableCell>
                            <TableCell align="right" sx={{ color: 'text.primary' }}>{asset.security_details.token_id}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      sx={{ mt: 2 }}
                      component={Link}
                      to={asset.security_details.marketplace_url}
                    >
                      View in Asset Marketplace
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Impact Metrics */}
          <Grid item xs={12} md={7}>
            <Card sx={{ 
              mb: 4,
              bgcolor: 'background.paper',
              color: 'text.primary',
              borderColor: 'divider'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="text.primary">
                  Environmental Impact
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  {asset.impact_metrics.carbon_offset_tons > 0 && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        textAlign: 'center', 
                        p: 2, 
                        borderRadius: 2,
                        bgcolor: appTheme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                        boxShadow: appTheme === 'dark' ? '0 4px 6px rgba(0, 0, 0, 0.2)' : '0 4px 6px rgba(0, 0, 0, 0.05)'
                      }}>
                        <ForestOutlined color="success" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h5" gutterBottom color="text.primary">
                          {asset.impact_metrics.carbon_offset_tons.toLocaleString()} tons
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Carbon Offset (CO₂e)
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  
                  {asset.impact_metrics.land_area_protected_hectares > 0 && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        textAlign: 'center', 
                        p: 2,
                        borderRadius: 2,
                        bgcolor: appTheme === 'dark' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(22, 163, 74, 0.05)',
                        boxShadow: appTheme === 'dark' ? '0 4px 6px rgba(0, 0, 0, 0.2)' : '0 4px 6px rgba(0, 0, 0, 0.05)'
                      }}>
                        <NatureOutlined color="success" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h5" gutterBottom color="text.primary">
                          {asset.impact_metrics.land_area_protected_hectares.toLocaleString()} ha
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Land Area Protected
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  
                  {asset.impact_metrics.renewable_energy_mwh > 0 && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        textAlign: 'center', 
                        p: 2,
                        borderRadius: 2,
                        bgcolor: appTheme === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)',
                        boxShadow: appTheme === 'dark' ? '0 4px 6px rgba(0, 0, 0, 0.2)' : '0 4px 6px rgba(0, 0, 0, 0.05)'
                      }}>
                        <WbSunnyOutlined color="warning" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h5" gutterBottom color="text.primary">
                          {asset.impact_metrics.renewable_energy_mwh.toLocaleString()} MWh
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Renewable Energy Generated
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  
                  {asset.impact_metrics.water_protected_liters > 0 && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        textAlign: 'center', 
                        p: 2,
                        borderRadius: 2,
                        bgcolor: appTheme === 'dark' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(14, 165, 233, 0.05)',
                        boxShadow: appTheme === 'dark' ? '0 4px 6px rgba(0, 0, 0, 0.2)' : '0 4px 6px rgba(0, 0, 0, 0.05)'
                      }}>
                        <WaterOutlined color="primary" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h5" gutterBottom color="text.primary">
                          {(asset.impact_metrics.water_protected_liters / 1000).toLocaleString()} kL
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Water Protected
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
                
                <Box sx={{ mt: 4 }}>
                  <Typography variant="subtitle1" gutterBottom color="text.primary">
                    Sustainable Development Goals Alignment
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                    {asset.impact_metrics.sdg_alignment && Object.entries(asset.impact_metrics.sdg_alignment).map(([sdg, value]) => (
                      <Chip
                        key={sdg}
                        label={`SDG ${sdg} • ${(value * 100).toFixed(0)}%`}
                        sx={{ 
                          bgcolor: getSdgColor(parseInt(sdg)),
                          color: '#fff',
                          fontWeight: 'bold'
                        }}
                      />
                    ))}
                  </Box>
                </Box>
                
                {asset.co_benefits && asset.co_benefits.length > 0 && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="subtitle1" gutterBottom color="text.primary">
                      Co-Benefits
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                      {asset.co_benefits.map((benefit, index) => (
                        <Chip
                          key={index}
                          label={benefit}
                          variant="outlined"
                          color="success"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
            
            {/* Mini Impact Dashboard */}
            <Card sx={{ 
              bgcolor: 'background.paper',
              color: 'text.primary',
              borderColor: 'divider'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="text.primary">
                  Impact of One Credit
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Equivalent to:
                      </Typography>
                      
                      <Typography variant="body1" color="text.primary">
                        • {(asset.impact_metrics.carbon_offset_tons / parseInt(asset.total_supply) * 100).toFixed(2)} kg of CO₂ offset
                      </Typography>
                      
                      <Typography variant="body1" color="text.primary">
                        • {(asset.impact_metrics.carbon_offset_tons / parseInt(asset.total_supply) * 4).toFixed(2)} trees planted
                      </Typography>
                      
                      <Typography variant="body1" color="text.primary">
                        • {(asset.impact_metrics.carbon_offset_tons / parseInt(asset.total_supply) * 2.5).toFixed(2)} gallons of gasoline not consumed
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Alert severity="info" sx={{
                      backgroundColor: appTheme === 'dark' ? 'rgba(30, 136, 229, 0.15)' : 'rgba(30, 136, 229, 0.1)',
                      color: 'text.primary',
                      '& .MuiAlert-icon': {
                        color: appTheme === 'dark' ? '#90caf9' : '#1e88e5'
                      }
                    }}>
                      Purchasing just one credit from this project makes a measurable impact on the environment and supports sustainable development goals.
                    </Alert>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
      
      <Box sx={{ display: tabValue === 1 ? 'block' : 'none' }}>
        {/* Detailed Impact Dashboard */}
        <Card sx={{ 
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderColor: 'divider'
        }}>
          <CardContent>
            <Typography variant="h5" gutterBottom color="text.primary">
              Environmental Impact Details
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <ImpactDashboard 
              userAddress={currentUser?.address || '0x0'} 
            />
          </CardContent>
        </Card>
      </Box>
      
      <Box sx={{ display: tabValue === 2 ? 'block' : 'none' }}>
        {/* Yield Strategies */}
        <Card sx={{ 
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderColor: 'divider'
        }}>
          <CardContent>
            <Typography variant="h5" gutterBottom color="text.primary">
              Generate Yield with Environmental Impact
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Apply a sustainable yield strategy to this environmental asset to generate returns while maximizing positive environmental impact.
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <SustainableYieldStrategies 
              assetType={asset.asset_type} 
              assetId={asset.asset_id}
              amount={asset.price_per_unit}
              onStrategySelect={(strategy) => {
                // Handle strategy selection (e.g., open a dialog)
                console.log('Selected strategy:', strategy);
                alert(`Strategy "${strategy.name}" selected. In a production environment, this would initiate the strategy application process.`);
              }}
            />
          </CardContent>
        </Card>
      </Box>
      
      {/* Buy Dialog */}
      <Dialog 
        open={buyDialogOpen} 
        onClose={handleBuyClose}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            color: 'text.primary',
          }
        }}
      >
        <DialogTitle>Purchase Environmental Credits</DialogTitle>
        <DialogContent>
          <DialogContentText color="text.secondary">
            You are about to purchase credits from {asset.project_name}. Each credit costs ${asset.price_per_unit}.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Quantity"
            type="number"
            fullWidth
            variant="outlined"
            InputProps={{
              sx: {
                color: 'text.primary'
              }
            }}
            InputLabelProps={{
              sx: {
                color: 'text.secondary'
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBuyClose}>Cancel</Button>
          <Button onClick={handleBuyClose} variant="contained">
            Purchase
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Retire Dialog */}
      <Dialog 
        open={retireDialogOpen} 
        onClose={handleRetireClose}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            color: 'text.primary',
          }
        }}
      >
        <DialogTitle>Retire Environmental Credits</DialogTitle>
        <DialogContent>
          <DialogContentText color="text.secondary">
            Retiring credits permanently removes them from circulation, claiming their environmental benefit. This action cannot be undone.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Quantity to Retire"
            type="number"
            fullWidth
            variant="outlined"
            value={retireAmount}
            onChange={(e) => setRetireAmount(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              sx: {
                color: 'text.primary'
              }
            }}
            InputLabelProps={{
              sx: {
                color: 'text.secondary'
              }
            }}
          />
          <TextField
            margin="dense"
            label="Retirement Reason"
            fullWidth
            variant="outlined"
            value={retireReason}
            onChange={(e) => setRetireReason(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              sx: {
                color: 'text.primary'
              }
            }}
            InputLabelProps={{
              sx: {
                color: 'text.secondary'
              }
            }}
          />
          <TextField
            margin="dense"
            label="Beneficiary (Optional)"
            fullWidth
            variant="outlined"
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              sx: {
                color: 'text.primary'
              }
            }}
            InputLabelProps={{
              sx: {
                color: 'text.secondary'
              }
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={publicRetirement}
                onChange={(e) => setPublicRetirement(e.target.checked)}
              />
            }
            label="Make this retirement public"
            sx={{ color: 'text.primary' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRetireClose}>Cancel</Button>
          <Button 
            onClick={handleRetire} 
            variant="contained"
            disabled={!retireAmount || !retireReason}
          >
            Retire Credits
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
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

export default EnvironmentalAssetPage; 