import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Button,
  Chip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Divider,
  Pagination,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  ForestOutlined,
  WaterOutlined,
  WbSunnyOutlined,
  NatureOutlined,
  Verified,
} from '@mui/icons-material';
import api from '../api/api';

const EnvironmentalMarketplacePage = () => {
  const navigate = useNavigate();
  
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering
  const [assetType, setAssetType] = useState('all');
  const [standard, setStandard] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 12;

  // Generate mock assets for demo
  const generateMockAssets = useCallback(() => {
    const assetTypes = [
      'CarbonCredit', 
      'BiodiversityCredit', 
      'RenewableEnergyCertificate', 
      'WaterRight'
    ];
    
    const standards = [
      'Verra', 
      'GoldStandard', 
      'ClimateActionReserve', 
      'AmericanCarbonRegistry', 
      'PlanVivo'
    ];
    
    const locations = [
      'Amazon, Brazil', 
      'Congo Basin, DRC', 
      'Borneo, Indonesia', 
      'Great Barrier Reef, Australia',
      'Sierra Nevada, USA',
      'Sumatra, Indonesia',
      'Bhutan Himalayas',
      'Atlantic Forest, Brazil'
    ];
    
    const projectPrefixes = [
      'Rainforest Conservation', 
      'Mangrove Restoration', 
      'Wind Farm', 
      'Solar Energy',
      'Biodiversity Protection',
      'Reforestation',
      'Watershed Management',
      'Sustainable Agriculture'
    ];
    
    const assets = [];
    
    for (let i = 1; i <= 24; i++) {
      const assetType = assetTypes[Math.floor(Math.random() * assetTypes.length)];
      const standard = standards[Math.floor(Math.random() * standards.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const projectPrefix = projectPrefixes[Math.floor(Math.random() * projectPrefixes.length)];
      
      const carbonValue = Math.floor(Math.random() * 50000) / 10;
      const landValue = Math.floor(Math.random() * 10000) / 10;
      const energyValue = assetType === 'RenewableEnergyCertificate' ? Math.floor(Math.random() * 5000) : 0;
      const waterValue = assetType === 'WaterRight' ? Math.floor(Math.random() * 1000000) : 0;
      
      // Create SDG alignment based on asset type
      const sdgAlignment = {};
      if (assetType === 'CarbonCredit') {
        sdgAlignment['13'] = Math.random() * 0.3 + 0.7; // Climate Action
        sdgAlignment['15'] = Math.random() * 0.3 + 0.5; // Life on Land
      } else if (assetType === 'BiodiversityCredit') {
        sdgAlignment['15'] = Math.random() * 0.3 + 0.7; // Life on Land
        sdgAlignment['14'] = Math.random() * 0.3 + 0.5; // Life Below Water
      } else if (assetType === 'RenewableEnergyCertificate') {
        sdgAlignment['7'] = Math.random() * 0.3 + 0.7; // Affordable and Clean Energy
        sdgAlignment['13'] = Math.random() * 0.3 + 0.5; // Climate Action
      } else if (assetType === 'WaterRight') {
        sdgAlignment['6'] = Math.random() * 0.3 + 0.7; // Clean Water and Sanitation
        sdgAlignment['14'] = Math.random() * 0.3 + 0.5; // Life Below Water
      }
      
      const issuanceDate = Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 15768000); // Random date within last 6 months
      
      assets.push({
        asset_id: `0x${i.toString(16).padStart(64, '0')}`,
        asset_type: assetType,
        standard: standard,
        vintage_year: 2020 + Math.floor(Math.random() * 4),
        project_id: `${standard.substring(0, 3).toUpperCase()}-${100000 + i}`,
        project_name: `${projectPrefix} Project ${i}`,
        project_location: location,
        verification_status: Math.random() > 0.2 ? 'Verified' : 'Pending',
        verification_date: issuanceDate + 86400, // One day after issuance
        registry_link: `https://example.com/registry/${i}`,
        metadata_uri: `ipfs://Qm${i}`,
        impact_metrics: {
          carbon_offset_tons: carbonValue,
          land_area_protected_hectares: landValue,
          renewable_energy_mwh: energyValue,
          water_protected_liters: waterValue,
          sdg_alignment: sdgAlignment,
          verification_date: issuanceDate + 86400,
          third_party_verifier: Math.random() > 0.2 ? standard : null,
        },
        issuance_date: issuanceDate,
        expiration_date: issuanceDate + 31536000, // One year after issuance
        retired: Math.random() > 0.9,
        total_supply: `${Math.floor(Math.random() * 10000) + 1000}`,
        available_supply: `${Math.floor(Math.random() * 1000) + 500}`,
        // Add image URLs for visuals
        image_url: getAssetImageUrl(assetType, i)
      });
    }
    
    return assets;
  }, []);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        
        // Build API query based on filters
        let endpoint = '/environmental/assets';
        if (assetType !== 'all') {
          endpoint = `/environmental/assets/type/${assetType}`;
        } else if (standard !== 'all') {
          endpoint = `/environmental/assets/standard/${standard}`;
        }
        
        // Fetch assets from API
        const response = await api.get(endpoint);
        let assetData = response.data.assets || [];
        
        // Apply search filter client-side
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          assetData = assetData.filter(asset => 
            asset.project_name.toLowerCase().includes(query) ||
            asset.project_location.toLowerCase().includes(query) ||
            asset.project_id.toLowerCase().includes(query)
          );
        }
        
        // Apply sorting
        assetData = sortAssets(assetData, sortBy);
        
        // Set total pages for pagination
        setTotalPages(Math.ceil(assetData.length / itemsPerPage));
        
        setAssets(assetData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching assets:', err);
        setError('Failed to load environmental assets');
        setLoading(false);
        
        // For demo purposes, set mock data if API fails
        const mockAssets = generateMockAssets();
        setAssets(mockAssets);
        setTotalPages(Math.ceil(mockAssets.length / itemsPerPage));
      }
    };

    fetchAssets();
  }, [assetType, standard, searchQuery, sortBy, generateMockAssets]);

  // Get asset image URL based on type
  const getAssetImageUrl = (assetType, index) => {
    // In a real application, these would be actual image URLs
    // For this demo, we're using a placeholder pattern
    const baseUrl = 'https://source.unsplash.com/featured/';
    
    switch (assetType) {
      case 'CarbonCredit':
        return `${baseUrl}600x400?forest,trees&sig=${index}`;
      case 'BiodiversityCredit':
        return `${baseUrl}600x400?wildlife,nature&sig=${index}`;
      case 'RenewableEnergyCertificate':
        return `${baseUrl}600x400?solar,wind,renewable&sig=${index}`;
      case 'WaterRight':
        return `${baseUrl}600x400?water,river,lake&sig=${index}`;
      default:
        return `${baseUrl}600x400?environment&sig=${index}`;
    }
  };
  
  // Sort assets based on selected criteria
  const sortAssets = (assetList, sortingMethod) => {
    switch (sortingMethod) {
      case 'newest':
        return [...assetList].sort((a, b) => b.issuance_date - a.issuance_date);
      case 'oldest':
        return [...assetList].sort((a, b) => a.issuance_date - b.issuance_date);
      case 'carbon_high':
        return [...assetList].sort((a, b) => b.impact_metrics.carbon_offset_tons - a.impact_metrics.carbon_offset_tons);
      case 'land_high':
        return [...assetList].sort((a, b) => b.impact_metrics.land_area_protected_hectares - a.impact_metrics.land_area_protected_hectares);
      case 'name_asc':
        return [...assetList].sort((a, b) => a.project_name.localeCompare(b.project_name));
      case 'name_desc':
        return [...assetList].sort((a, b) => b.project_name.localeCompare(a.project_name));
      default:
        return assetList;
    }
  };
  
  // Filter assets for current page
  const getCurrentPageAssets = () => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return assets.slice(startIndex, endIndex);
  };
  
  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo(0, 0);
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

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" gutterBottom>
        Environmental Asset Marketplace
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Browse, trade, and retire verified environmental assets including carbon credits, biodiversity credits, and more.
      </Typography>
      
      {/* Filters */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search Projects"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Asset Type</InputLabel>
                <Select
                  value={assetType}
                  label="Asset Type"
                  onChange={(e) => setAssetType(e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="CarbonCredit">Carbon Credits</MenuItem>
                  <MenuItem value="BiodiversityCredit">Biodiversity Credits</MenuItem>
                  <MenuItem value="RenewableEnergyCertificate">Renewable Energy Certificates</MenuItem>
                  <MenuItem value="WaterRight">Water Rights</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Standard</InputLabel>
                <Select
                  value={standard}
                  label="Standard"
                  onChange={(e) => setStandard(e.target.value)}
                >
                  <MenuItem value="all">All Standards</MenuItem>
                  <MenuItem value="Verra">Verra</MenuItem>
                  <MenuItem value="GoldStandard">Gold Standard</MenuItem>
                  <MenuItem value="ClimateActionReserve">Climate Action Reserve</MenuItem>
                  <MenuItem value="AmericanCarbonRegistry">American Carbon Registry</MenuItem>
                  <MenuItem value="PlanVivo">Plan Vivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="newest">Newest First</MenuItem>
                  <MenuItem value="oldest">Oldest First</MenuItem>
                  <MenuItem value="carbon_high">Highest Carbon Impact</MenuItem>
                  <MenuItem value="land_high">Highest Land Protection</MenuItem>
                  <MenuItem value="name_asc">Name (A-Z)</MenuItem>
                  <MenuItem value="name_desc">Name (Z-A)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Results info */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {assets.length > 0 ? (page - 1) * itemsPerPage + 1 : 0}-
          {Math.min(page * itemsPerPage, assets.length)} of {assets.length} assets
        </Typography>
        
        <Button
          startIcon={<FilterListIcon />}
          onClick={() => {
            setAssetType('all');
            setStandard('all');
            setSearchQuery('');
            setSortBy('newest');
          }}
          disabled={assetType === 'all' && standard === 'all' && !searchQuery && sortBy === 'newest'}
        >
          Clear Filters
        </Button>
      </Box>
      
      {/* Loading state */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      )}
      
      {/* Error state */}
      {error && !loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography color="error">{error}</Typography>
        </Box>
      )}
      
      {/* Empty state */}
      {!loading && !error && assets.length === 0 && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography>No environmental assets found matching your criteria</Typography>
        </Box>
      )}
      
      {/* Asset grid */}
      {!loading && !error && assets.length > 0 && (
        <Grid container spacing={3}>
          {getCurrentPageAssets().map((asset) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={asset.asset_id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardActionArea onClick={() => navigate(`/environmental/assets/${asset.asset_id}`)}>
                  <CardMedia
                    component="img"
                    height="160"
                    image={asset.image_url}
                    alt={asset.project_name}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Chip 
                        icon={getAssetTypeIcon(asset.asset_type)} 
                        label={asset.asset_type.replace(/([A-Z])/g, ' $1').trim()} 
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      
                      {asset.verification_status === 'Verified' && (
                        <Chip 
                          icon={<Verified />} 
                          label="Verified" 
                          size="small"
                          color="success"
                        />
                      )}
                    </Box>
                    
                    <Typography variant="h6" component="div" gutterBottom>
                      {asset.project_name}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {asset.project_location} • {asset.standard}
                    </Typography>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Grid container spacing={1}>
                      {asset.impact_metrics.carbon_offset_tons > 0 && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Carbon Offset:</Typography>
                          <Typography variant="body1">
                            {asset.impact_metrics.carbon_offset_tons.toLocaleString()} tons
                          </Typography>
                        </Grid>
                      )}
                      
                      {asset.impact_metrics.land_area_protected_hectares > 0 && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Land Protected:</Typography>
                          <Typography variant="body1">
                            {asset.impact_metrics.land_area_protected_hectares.toLocaleString()} ha
                          </Typography>
                        </Grid>
                      )}
                      
                      {asset.impact_metrics.renewable_energy_mwh > 0 && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Renewable Energy:</Typography>
                          <Typography variant="body1">
                            {asset.impact_metrics.renewable_energy_mwh.toLocaleString()} MWh
                          </Typography>
                        </Grid>
                      )}
                      
                      {asset.impact_metrics.water_protected_liters > 0 && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Water Protected:</Typography>
                          <Typography variant="body1">
                            {(asset.impact_metrics.water_protected_liters / 1000).toLocaleString()} kL
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Typography variant="body2" color="text.secondary">
                      Vintage: {asset.vintage_year} • Issued: {formatDate(asset.issuance_date)}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">
                      Available: {parseInt(asset.available_supply).toLocaleString()} credits
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handlePageChange} 
            color="primary" 
            size="large"
          />
        </Box>
      )}
    </Container>
  );
};

export default EnvironmentalMarketplacePage; 