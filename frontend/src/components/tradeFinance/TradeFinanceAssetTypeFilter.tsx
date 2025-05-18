import React from 'react';
import { Paper, ToggleButtonGroup, ToggleButton, Typography, Box } from '@mui/material';
import { TradeFinanceAssetType } from '../../types/tradeFinance';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';
import FactoryIcon from '@mui/icons-material/Factory';
import PublicIcon from '@mui/icons-material/Public';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';

interface TradeFinanceAssetTypeFilterProps {
  selectedType: TradeFinanceAssetType | null;
  onTypeChange: (type: TradeFinanceAssetType | null) => void;
}

const TradeFinanceAssetTypeFilter: React.FC<TradeFinanceAssetTypeFilterProps> = ({
  selectedType,
  onTypeChange
}) => {
  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newType: TradeFinanceAssetType | null
  ) => {
    onTypeChange(newType);
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        mb: 3, 
        border: '1px solid', 
        borderColor: 'divider',
        borderRadius: 2
      }}
    >
      <Box mb={2}>
        <Typography variant="subtitle1" fontWeight="medium">
          Filter by Asset Type
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select a specific type of trade finance instrument or view all assets
        </Typography>
      </Box>
      
      <ToggleButtonGroup
        value={selectedType}
        exclusive
        onChange={handleChange}
        aria-label="trade finance asset type"
        sx={{ 
          flexWrap: 'wrap',
          '& .MuiToggleButtonGroup-grouped': {
            m: 0.5,
            border: 1,
            borderColor: 'divider',
            '&.Mui-selected': {
              borderColor: 'primary.main',
            }
          }
        }}
      >
        <ToggleButton value="" aria-label="all assets">
          <AllInclusiveIcon sx={{ mr: 1 }} />
          All
        </ToggleButton>
        
        <ToggleButton value={TradeFinanceAssetType.EXPORT_FINANCING} aria-label="export financing">
          <PublicIcon sx={{ mr: 1 }} />
          Export Financing
        </ToggleButton>
        
        <ToggleButton value={TradeFinanceAssetType.IMPORT_FINANCING} aria-label="import financing">
          <LocalShippingIcon sx={{ mr: 1 }} />
          Import Financing
        </ToggleButton>
        
        <ToggleButton value={TradeFinanceAssetType.INVENTORY_FINANCING} aria-label="inventory financing">
          <InventoryIcon sx={{ mr: 1 }} />
          Inventory Financing
        </ToggleButton>
        
        <ToggleButton value={TradeFinanceAssetType.SUPPLY_CHAIN_FINANCE} aria-label="supply chain finance">
          <FactoryIcon sx={{ mr: 1 }} />
          Supply Chain Finance
        </ToggleButton>
      </ToggleButtonGroup>
    </Paper>
  );
};

export default TradeFinanceAssetTypeFilter; 