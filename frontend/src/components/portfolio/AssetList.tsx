import React, { useState } from 'react';
import { 
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Chip,
  Paper,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  TableSortLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  Visibility as VisibilityIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AssetHolding } from '../../types/portfolioTypes';
import { AssetClass } from '../../types/assetTypes';

interface AssetListProps {
  assets: AssetHolding[];
  title?: string;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

type Order = 'asc' | 'desc';
type OrderBy = 'name' | 'value' | 'yield' | 'price' | 'quantity';

const AssetList: React.FC<AssetListProps> = ({
  assets,
  title = 'Assets',
  activeFilter,
  onFilterChange
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // State for sorting, filtering, and search
  const [orderBy, setOrderBy] = useState<OrderBy>('value');
  const [order, setOrder] = useState<Order>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dropdown menu state for asset actions
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  
  // Handler for sorting
  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  
  // Handler for opening asset action menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, assetId: string) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedAssetId(assetId);
  };
  
  // Handler for closing asset action menu
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedAssetId(null);
  };
  
  // Handler for showing asset details
  const handleViewDetails = (assetId: string, category: string) => {
    handleMenuClose();
    if (category === 'environmental') {
      navigate(`/environmental/assets/${assetId}`);
    } else {
      navigate(`/assets/${assetId}`);
    }
  };
  
  // Handler for trading an asset
  const handleTradeAsset = (assetId: string) => {
    handleMenuClose();
    navigate(`/trading?asset=${assetId}`);
  };
  
  // Handler for filter change
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    onFilterChange(newValue);
  };
  
  // Filter assets by category and search query
  const getFilteredAssets = () => {
    return assets.filter(asset => {
      // Apply category filter
      if (activeFilter !== 'all' && asset.category !== activeFilter) {
        return false;
      }
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          asset.name.toLowerCase().includes(query) ||
          asset.symbol.toLowerCase().includes(query) ||
          asset.type.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  };
  
  // Sort assets
  const getSortedAssets = () => {
    const filteredAssets = getFilteredAssets();
    
    return filteredAssets.sort((a, b) => {
      let comparison = 0;
      
      switch (orderBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'value':
          comparison = a.value - b.value;
          break;
        case 'yield':
          const yieldA = a.yield || 0;
          const yieldB = b.yield || 0;
          comparison = yieldA - yieldB;
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        default:
          comparison = a.value - b.value;
      }
      
      return order === 'asc' ? comparison : -comparison;
    });
  };
  
  const sortedAssets = getSortedAssets();
  
  // Helper to get asset type color
  const getAssetTypeColor = (category: string) => {
    switch (category) {
      case 'treasury':
        return 'primary';
      case 'real_estate':
        return 'info';
      case 'environmental':
        return 'success';
      case 'trade_finance':
        return 'warning';
      case 'corporate_bond':
        return 'secondary';
      default:
        return 'default';
    }
  };
  
  // Helper for asset detail URL
  const getAssetDetailPath = (assetId: string, category: string) => {
    return category === 'environmental' 
      ? `/environmental/assets/${assetId}` 
      : `/assets/${assetId}`;
  };
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: theme.shadows[1]
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{title}</Typography>
          
          <TextField
            size="small"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              sx: { 
                borderRadius: 4,
                fontSize: '0.875rem',
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.03)'
              }
            }}
            sx={{ width: 200 }}
          />
        </Box>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeFilter}
            onChange={handleTabChange}
            aria-label="asset category tabs"
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2 }}
          >
            <Tab label="All Assets" value="all" />
            <Tab label="Treasury" value="treasury" />
            <Tab label="Real Estate" value="real_estate" />
            <Tab label="Environmental" value="environmental" />
            <Tab label="Trade Finance" value="trade_finance" />
            <Tab label="Corporate Bonds" value="corporate_bond" />
          </Tabs>
        </Box>
        
        <TableContainer component={Paper} sx={{ boxShadow: 'none', bgcolor: 'transparent' }}>
          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'name'}
                    direction={orderBy === 'name' ? order : 'asc'}
                    onClick={() => handleRequestSort('name')}
                  >
                    Asset
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'quantity'}
                    direction={orderBy === 'quantity' ? order : 'asc'}
                    onClick={() => handleRequestSort('quantity')}
                  >
                    Quantity
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'price'}
                    direction={orderBy === 'price' ? order : 'asc'}
                    onClick={() => handleRequestSort('price')}
                  >
                    Price
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'value'}
                    direction={orderBy === 'value' ? order : 'asc'}
                    onClick={() => handleRequestSort('value')}
                  >
                    Value
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'yield'}
                    direction={orderBy === 'yield' ? order : 'asc'}
                    onClick={() => handleRequestSort('yield')}
                  >
                    Yield
                  </TableSortLabel>
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedAssets.length > 0 ? (
                sortedAssets.map((asset) => (
                  <TableRow 
                    key={asset.id} 
                    hover
                    onClick={() => navigate(getAssetDetailPath(asset.id, asset.category))}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box 
                          component="img"
                          src={`/images/assets/${asset.category === 'environmental' 
                            ? 'environmental' 
                            : asset.category === 'real_estate'
                            ? 'real-estate'
                            : asset.category === 'trade_finance'
                            ? 'invoice'
                            : asset.category === 'treasury'
                            ? 'treasury'
                            : 'asset-placeholder'}.jpg`}
                          alt={asset.name}
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: '8px',
                            objectFit: 'cover',
                            mr: 2
                          }}
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            e.currentTarget.src = '/images/assets/asset-placeholder.jpg';
                          }}
                        />
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {asset.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary" mr={1}>
                              {asset.symbol}
                            </Typography>
                            <Chip
                              label={asset.type}
                              size="small"
                              color={getAssetTypeColor(asset.category) as any}
                              variant="outlined"
                              sx={{ height: 20, '& .MuiChip-label': { px: 1, py: 0 } }}
                            />
                          </Box>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {asset.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight="medium">
                        ${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {asset.category === 'environmental' ? (
                        <Chip
                          icon={<TrendingUpIcon sx={{ fontSize: '1rem !important' }} />}
                          label="Impact"
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ height: 24 }}
                        />
                      ) : (
                        <Box>
                          <Typography variant="body1" color="success.main" fontWeight="medium">
                            {asset.yield ? `${asset.yield.toFixed(2)}%` : '-'}
                          </Typography>
                          {asset.yieldAmount && (
                            <Typography variant="body2" color="text.secondary">
                              ${asset.yieldAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, asset.id)}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      {searchQuery 
                        ? 'No assets match your search criteria' 
                        : 'No assets found in this category'
                      }
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {assets.length > 0 && (
          <Box sx={{ p: 2, textAlign: 'right' }}>
            <Button
              variant="text"
              color="primary"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/marketplace')}
            >
              Discover More Assets
            </Button>
          </Box>
        )}
      </CardContent>
      
      {/* Asset Actions Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem 
          onClick={() => selectedAssetId && handleViewDetails(
            selectedAssetId, 
            assets.find(a => a.id === selectedAssetId)?.category || ''
          )}
        >
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedAssetId && handleTradeAsset(selectedAssetId)}>
          <ListItemIcon>
            <ShoppingCartIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Trade</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default AssetList; 