import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Box,
  Chip,
  useTheme
} from '@mui/material';
import {
  DateRange as DateRangeIcon,
  Repeat as RepeatIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { YieldDistribution } from '../../types/portfolioTypes';

interface YieldDistributionCardProps {
  yieldDistributions: YieldDistribution[];
  title?: string;
}

const YieldDistributionCard: React.FC<YieldDistributionCardProps> = ({
  yieldDistributions,
  title = 'Upcoming Yield Distributions'
}) => {
  const theme = useTheme();
  
  // Sort by next distribution date
  const sortedDistributions = [...yieldDistributions]
    .filter(y => y.nextDistributionDate !== undefined)
    .sort((a, b) => (a.nextDistributionDate || 0) - (b.nextDistributionDate || 0));
  
  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Format frequency label
  const getFrequencyLabel = (frequency?: string) => {
    if (!frequency) return 'One-time';
    
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'annually': return 'Annually';
      default: return frequency.charAt(0).toUpperCase() + frequency.slice(1);
    }
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
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>
        
        {sortedDistributions.length > 0 ? (
          <List disablePadding>
            {sortedDistributions.map((distribution, index) => (
              <React.Fragment key={distribution.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem 
                  alignItems="flex-start"
                  sx={{ 
                    py: 1.5,
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      minWidth: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: `${theme.palette.success.main}15`,
                      borderRadius: '50%',
                      p: 1,
                      mr: 1
                    }}
                  >
                    <TrendingUpIcon 
                      fontSize="small" 
                      sx={{ color: theme.palette.success.main }}
                    />
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body1" fontWeight="medium">
                          {distribution.assetName}
                        </Typography>
                        <Typography 
                          variant="body1" 
                          fontWeight="medium"
                          color="success.main"
                        >
                          ${distribution.amount.toFixed(2)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <DateRangeIcon 
                            fontSize="small" 
                            sx={{ mr: 0.5, color: 'text.secondary', fontSize: '1rem' }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {distribution.nextDistributionDate 
                              ? formatDate(distribution.nextDistributionDate) 
                              : 'Not scheduled'
                            }
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <RepeatIcon 
                              fontSize="small" 
                              sx={{ mr: 0.5, color: 'text.secondary', fontSize: '1rem' }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {getFrequencyLabel(distribution.frequency)}
                            </Typography>
                          </Box>
                          <Chip
                            label={`${distribution.yieldRate}%`}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No upcoming yield distributions
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default YieldDistributionCard; 