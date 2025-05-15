import React from 'react';
import { Box, Typography, Card, CardContent, CardMedia, CardActionArea, alpha } from '@mui/material';
import { AssetClass } from '../../types/assetTypes';
import CompatGrid from '../common/CompatGrid';

const assetClassInfo = [
  {
    class: AssetClass.TREASURY,
    title: 'Treasury',
    description: 'U.S. Treasury securities including bills, notes, and bonds',
    image: '/images/assets/treasury.jpg',
    color: '#4CAF50'
  },
  {
    class: AssetClass.REAL_ESTATE,
    title: 'Real Estate',
    description: 'Tokenized real estate properties and REITs',
    image: '/images/assets/real-estate.jpg',
    color: '#2196F3'
  },
  {
    class: AssetClass.CORPORATE_BOND,
    title: 'Corporate Bond',
    description: 'Corporate bonds and other debt instruments',
    image: '/images/assets/corporate-bond.jpg',
    color: '#3F51B5'
  },
  {
    class: AssetClass.ENVIRONMENTAL_ASSET,
    title: 'Environmental Asset',
    description: 'Carbon credits, biodiversity credits, and renewable energy certificates',
    image: '/images/assets/environmental.jpg',
    color: '#009688'
  },
  {
    class: AssetClass.IP_RIGHT,
    title: 'Intellectual Property',
    description: 'Patents, copyrights, trademarks, and other IP rights',
    image: '/images/assets/ip-rights.jpg',
    color: '#9C27B0'
  },
  {
    class: AssetClass.INVOICE,
    title: 'Invoice',
    description: 'Account receivables, invoices, and factoring',
    image: '/images/assets/invoice.jpg',
    color: '#FF9800'
  },
  {
    class: AssetClass.COMMODITY,
    title: 'Commodity',
    description: 'Physical commodities and commodity derivatives',
    image: '/images/assets/commodity.jpg',
    color: '#795548'
  },
  {
    class: AssetClass.INFRASTRUCTURE,
    title: 'Infrastructure',
    description: 'Infrastructure projects and investments',
    image: '/images/assets/infrastructure.jpg',
    color: '#607D8B'
  },
  {
    class: AssetClass.CUSTOM,
    title: 'Custom',
    description: 'Custom asset class with configurable parameters',
    image: '/images/assets/custom.jpg',
    color: '#F44336'
  }
];

interface AssetClassSelectionProps {
  selectedClass: AssetClass | '';
  onSelect: (assetClass: AssetClass) => void;
}

const AssetClassSelection: React.FC<AssetClassSelectionProps> = ({ selectedClass, onSelect }) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select Asset Class
      </Typography>
      <Typography variant="body1" paragraph>
        Choose the type of asset you want to create. This will determine the templates and parameters available in the next steps.
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ maxWidth: 1200, width: '100%' }}>
          <CompatGrid container spacing={3}>
            {assetClassInfo.map((info) => (
              <CompatGrid item xs={12} sm={6} md={4} key={info.class} sx={{ display: 'flex' }}>
                <Card 
                  sx={{ 
                    height: 320,
                    width: '100%',
                    display: 'flex', 
                    flexDirection: 'column',
                    border: selectedClass === info.class ? `2px solid ${info.color}` : 'none',
                    boxShadow: selectedClass === info.class ? 
                      `0 4px 20px ${alpha(info.color, 0.5)}` : '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                    },
                    overflow: 'hidden'
                  }}
                >
                  <CardActionArea 
                    onClick={() => onSelect(info.class)}
                    sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                  >
                    <Box sx={{ position: 'relative', height: 160 }}>
                      <CardMedia
                        component="img"
                        height="160"
                        image={info.image}
                        alt={info.title}
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          e.currentTarget.src = '/images/assets/placeholder.jpg';
                        }}
                        sx={{ 
                          objectFit: 'cover',
                          objectPosition: 'center'
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          background: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.6)), linear-gradient(to top, ${info.color}80, transparent)`,
                          display: 'flex',
                          alignItems: 'flex-end',
                          padding: 2
                        }}
                      >
                        <Typography variant="h6" sx={{ color: 'white', textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
                          {info.title}
                        </Typography>
                      </Box>
                    </Box>
                    <CardContent sx={{ 
                      flexGrow: 1, 
                      pt: 2, 
                      pb: 2, 
                      height: 120, 
                      display: 'flex', 
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      textAlign: 'center'
                    }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          textOverflow: 'ellipsis',
                          maxWidth: '90%'
                        }}
                      >
                        {info.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </CompatGrid>
            ))}
          </CompatGrid>
        </Box>
      </Box>
    </Box>
  );
};

export default AssetClassSelection; 