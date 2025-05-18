import React from 'react';
import { useTradeFinance } from '../../contexts/TradeFinanceContext';
import { TradeFinanceAssetType } from '../../types/tradeFinance';
import TradeFinanceCard from './TradeFinanceCard';
import TradeFinanceAnalyticsPanel from './TradeFinanceAnalyticsPanel';
import TradeFinanceAssetTypeFilter from './TradeFinanceAssetTypeFilter';
import { Container, Typography, Box, CircularProgress, Divider } from '@mui/material';
import Grid from '../../utils/mui-shims';

const TradeFinanceMarketplace: React.FC = () => {
  const { 
    filteredAssets, 
    loading, 
    error, 
    selectedAssetType, 
    setSelectedAssetType,
    analytics
  } = useTradeFinance();

  const getAssetTypeLabel = (type: TradeFinanceAssetType | null): string => {
    if (!type) return 'All Trade Finance Assets';
    
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Grid container spacing={3}>
        <Grid xs={12} item>
          <Typography variant="h4" component="h1" gutterBottom>
            Trade Finance Marketplace
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Invest in fractional trade finance instruments with real-time liquidity and settlement
          </Typography>
          <Divider sx={{ my: 2 }} />
        </Grid>

        {/* Analytics Panel */}
        <Grid xs={12} item>
          <TradeFinanceAnalyticsPanel analytics={analytics} />
        </Grid>

        {/* Filters */}
        <Grid xs={12} item>
          <TradeFinanceAssetTypeFilter 
            selectedType={selectedAssetType} 
            onTypeChange={setSelectedAssetType} 
          />
        </Grid>

        {/* Results title */}
        <Grid xs={12} item>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5" component="h2">
              {getAssetTypeLabel(selectedAssetType)}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {filteredAssets.length} assets available
            </Typography>
          </Box>
        </Grid>

        {/* Loading or Error State */}
        {loading && (
          <Grid xs={12} item>
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          </Grid>
        )}

        {error && (
          <Grid xs={12} item>
            <Box bgcolor="error.main" color="error.contrastText" p={2} borderRadius={1}>
              {error}
            </Box>
          </Grid>
        )}

        {/* Asset Cards */}
        {!loading && !error && filteredAssets.map(asset => (
          <Grid xs={12} md={6} lg={4} key={asset.id} item>
            <TradeFinanceCard asset={asset} />
          </Grid>
        ))}

        {/* No Results */}
        {!loading && !error && filteredAssets.length === 0 && (
          <Grid xs={12} item>
            <Box 
              display="flex" 
              justifyContent="center" 
              alignItems="center" 
              minHeight={200}
              bgcolor="background.paper"
              borderRadius={1}
              p={4}
              textAlign="center"
            >
              <Typography variant="h6" color="text.secondary">
                No trade finance assets found for the selected criteria.
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default TradeFinanceMarketplace; 