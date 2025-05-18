import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardActions, Typography, Button, Chip, Box } from '@mui/material';
import { TradeFinanceAsset } from '../../types/tradeFinance';

interface TradeFinanceCardProps {
  asset: TradeFinanceAsset;
}

const TradeFinanceCard: React.FC<TradeFinanceCardProps> = ({ asset }) => {
  // Format yield as percentage
  const formatYield = (yieldValue: number): string => {
    return `${(yieldValue / 100).toFixed(2)}%`;
  };

  // Format date
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      boxShadow: 2,
      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 4,
      }
    }}>
      <Box 
        sx={{ 
          height: 140, 
          backgroundImage: `url(${asset.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative'
        }}
      >
        <Chip 
          label={asset.assetType} 
          size="small" 
          color="primary"
          sx={{ 
            position: 'absolute',
            top: 10,
            right: 10,
            fontWeight: 'bold'
          }}
        />
      </Box>
      
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
          {asset.name}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {asset.description.length > 120 
            ? `${asset.description.substring(0, 120)}...` 
            : asset.description}
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Yield:</Typography>
            <Typography variant="body2" fontWeight="bold" color="success.main">
              {formatYield(asset.yieldRate)}
            </Typography>
          </Box>
          
          <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Maturity:</Typography>
            <Typography variant="body2">
              {formatDate(asset.maturityDate)}
            </Typography>
          </Box>
          
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">Price:</Typography>
            <Typography variant="body2" fontWeight="bold">
              ${asset.currentPrice}
            </Typography>
          </Box>
        </Box>
      </CardContent>
      
      <CardActions>
        <Button 
          size="small" 
          component={Link} 
          to={`/assets/${asset.id}`}
          sx={{ mr: 1 }}
        >
          View Details
        </Button>
        <Button 
          size="small" 
          variant="contained" 
          color="primary"
        >
          Invest Now
        </Button>
      </CardActions>
    </Card>
  );
};

export default TradeFinanceCard; 