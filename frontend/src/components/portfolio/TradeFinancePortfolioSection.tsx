import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  CardHeader,
  Typography, 
  Button,
  Divider,
  CircularProgress,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon,
  ArrowForward as ArrowForwardIcon,
  CalendarToday as CalendarTodayIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

import { useTradeFinance } from '../../contexts/TradeFinanceContext';
import { TradeFinancePosition } from '../../types/tradeFinance';
import Grid from '../../utils/mui-shims';
import { formatDate } from '../../utils/dateUtils';

// Add a computed property to the position for UI display
interface PositionWithYield extends TradeFinancePosition {
  computedYield: number;
}

interface TradeFinancePortfolioSectionProps {
  maxItems?: number;
  height?: number | string;
}

const TradeFinancePortfolioSection: React.FC<TradeFinancePortfolioSectionProps> = ({ 
  maxItems = 5,
  height = 'auto'
}) => {
  const { positions, assets, loading, error } = useTradeFinance();
  
  // Calculate portfolio summary metrics
  const calculateSummary = () => {
    if (!positions || positions.length === 0) {
      return {
        totalInvested: 0,
        expectedReturn: 0,
        expectedYield: 0,
        positionsCount: 0,
        assetCount: 0
      };
    }
    
    const totalInvested = positions.reduce((sum, pos) => sum + pos.investmentAmount, 0);
    const expectedReturn = positions.reduce((sum, pos) => sum + pos.expectedReturn, 0);
    const expectedYield = ((expectedReturn - totalInvested) / totalInvested) * 100;
    
    // Count unique assets
    const uniqueAssets = new Set(positions.map(pos => pos.assetId));
    
    return {
      totalInvested,
      expectedReturn,
      expectedYield,
      positionsCount: positions.length,
      assetCount: uniqueAssets.size
    };
  };
  
  // Format currency
  const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  // Format percentage
  const formatPercent = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };
  
  // Calculate yield for a position
  const calculatePositionYield = (position: TradeFinancePosition): number => {
    return ((position.expectedReturn - position.investmentAmount) / position.investmentAmount) * 100;
  };
  
  // Get asset name for a position
  const getAssetName = (position: TradeFinancePosition): string => {
    const asset = assets.find(a => a.id === position.assetId);
    return asset ? asset.name : 'Unknown Asset';
  };
  
  // Get asset type for a position
  const getAssetType = (position: TradeFinancePosition): string => {
    const asset = assets.find(a => a.id === position.assetId);
    return asset ? asset.assetType.replace(/_/g, ' ') : 'Unknown';
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ height }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ height }}>
        Failed to load trade finance portfolio data
      </Alert>
    );
  }
  
  const summary = calculateSummary();
  
  // Prepare positions with computed yield and sort by maturity date
  const enhancedPositions: PositionWithYield[] = positions.map(position => ({
    ...position,
    computedYield: calculatePositionYield(position)
  }));
  
  const sortedPositions = [...enhancedPositions].sort((a, b) => {
    // Convert to timestamps for comparison if they're Date objects
    const dateA = a.expectedMaturityDate instanceof Date ? a.expectedMaturityDate.getTime() : a.expectedMaturityDate;
    const dateB = b.expectedMaturityDate instanceof Date ? b.expectedMaturityDate.getTime() : b.expectedMaturityDate;
    return dateA - dateB;
  });
  
  const topPositions = sortedPositions.slice(0, maxItems);
  
  return (
    <Card sx={{ height, display: 'flex', flexDirection: 'column' }}>
      <CardHeader 
        title="Trade Finance Portfolio" 
        titleTypographyProps={{ variant: 'h6' }}
        action={
          <Button 
            component={Link} 
            to="/trade-finance/portfolio" 
            endIcon={<ArrowForwardIcon />}
            size="small"
          >
            View All
          </Button>
        }
      />
      
      <Divider />
      
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {positions.length === 0 ? (
          <Box textAlign="center" py={2} display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{ flexGrow: 1 }}>
            <AccountBalanceIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
            <Typography variant="subtitle1" gutterBottom>
              No Trade Finance Investments
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Diversify your portfolio with trade finance assets
            </Typography>
            <Button 
              component={Link} 
              to="/trade-finance" 
              variant="outlined" 
              size="small"
            >
              Browse Assets
            </Button>
          </Box>
        ) : (
          <>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6} md={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Invested
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(summary.totalInvested)}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Expected Return
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(summary.expectedReturn)}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Expected Yield
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="h6" color="success.main">
                      {formatPercent(summary.expectedYield)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Positions
                  </Typography>
                  <Typography variant="h6">
                    {summary.positionsCount} in {summary.assetCount} assets
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Typography variant="subtitle2" sx={{ my: 1 }}>
              Upcoming Maturities
            </Typography>
            
            <List disablePadding sx={{ flexGrow: 1, overflow: 'auto' }}>
              {topPositions.map((position) => (
                <ListItem
                  key={position.assetId + '-' + position.acquisitionDate.getTime()}
                  divider
                  component={Link}
                  to={`/trade-finance/assets/${position.assetId}`}
                  sx={{ 
                    textDecoration: 'none', 
                    color: 'text.primary',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <ListItemText
                    primary={getAssetName(position)}
                    secondary={
                      <Box component="span" display="flex" alignItems="center">
                        <Chip 
                          label={getAssetType(position)} 
                          size="small" 
                          sx={{ mr: 1, height: 20, fontSize: '0.7rem' }} 
                        />
                        <Box component="span" display="flex" alignItems="center" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                          <CalendarTodayIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                          {formatDate(position.expectedMaturityDate)}
                        </Box>
                      </Box>
                    }
                    primaryTypographyProps={{ 
                      variant: 'body2',
                      noWrap: true,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  />
                  <ListItemSecondaryAction>
                    <Box textAlign="right">
                      <Typography variant="body2">
                        {formatCurrency(position.expectedReturn)}
                      </Typography>
                      <Typography variant="caption" color="success.main">
                        +{formatPercent(position.computedYield)}
                      </Typography>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TradeFinancePortfolioSection; 