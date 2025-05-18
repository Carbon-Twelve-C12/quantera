import React from 'react';
import { TradeFinanceAssetType } from '../../types/tradeFinance';
import { Box, ToggleButtonGroup, ToggleButton, Typography } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import InventoryIcon from '@mui/icons-material/Inventory';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import FactoryIcon from '@mui/icons-material/Factory';
import FilterAltIcon from '@mui/icons-material/FilterAlt';

interface TradeFinanceAssetTypeFilterProps {
  selectedType: TradeFinanceAssetType | null;
  onTypeChange: (type: TradeFinanceAssetType | null) => void;
}

const assetTypeConfig: {
  type: TradeFinanceAssetType;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    type: TradeFinanceAssetType.LETTER_OF_CREDIT,
    label: 'Letter of Credit',
    icon: <AccountBalanceIcon />
  },
  {
    type: TradeFinanceAssetType.INVOICE_RECEIVABLE,
    label: 'Invoice Receivable',
    icon: <ReceiptLongIcon />
  },
  {
    type: TradeFinanceAssetType.WAREHOUSE_RECEIPT,
    label: 'Warehouse Receipt',
    icon: <InventoryIcon />
  },
  {
    type: TradeFinanceAssetType.BILL_OF_LADING,
    label: 'Bill of Lading',
    icon: <DirectionsBoatIcon />
  },
  {
    type: TradeFinanceAssetType.EXPORT_CREDIT,
    label: 'Export Credit',
    icon: <LocalShippingIcon />
  },
  {
    type: TradeFinanceAssetType.SUPPLY_CHAIN_FINANCE,
    label: 'Supply Chain Finance',
    icon: <FactoryIcon />
  }
];

const TradeFinanceAssetTypeFilter: React.FC<TradeFinanceAssetTypeFilterProps> = ({
  selectedType,
  onTypeChange
}) => {
  const handleTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newType: TradeFinanceAssetType | ''
  ) => {
    onTypeChange(newType === '' ? null : newType);
  };

  return (
    <Box 
      sx={{ 
        mb: 3, 
        p: 2, 
        borderRadius: 1,
        bgcolor: 'background.paper'
      }}
    >
      <Box display="flex" alignItems="center" mb={2}>
        <FilterAltIcon sx={{ mr: 1 }} color="primary" />
        <Typography variant="subtitle1">Filter by Asset Type</Typography>
      </Box>
      
      <ToggleButtonGroup
        value={selectedType || ''}
        exclusive
        onChange={handleTypeChange}
        aria-label="asset type filter"
        fullWidth
        sx={{
          flexWrap: { xs: 'wrap', md: 'nowrap' }
        }}
      >
        {assetTypeConfig.map((config) => (
          <ToggleButton 
            key={config.type} 
            value={config.type}
            aria-label={config.label}
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 0.5, 
              padding: 1,
              margin: { xs: 0.25, md: 0 },
              flex: { xs: '1 0 40%', sm: '1 0 30%', md: 1 },
              height: { xs: 60, md: 80 }
            }}
          >
            {config.icon}
            <Typography variant="caption" noWrap>
              {config.label}
            </Typography>
          </ToggleButton>
        ))}
        
        <ToggleButton 
          value=""
          aria-label="All Types"
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 0.5, 
            padding: 1,
            margin: { xs: 0.25, md: 0 },
            flex: { xs: '1 0 40%', sm: '1 0 30%', md: 1 },
            height: { xs: 60, md: 80 }
          }}
        >
          <FilterAltIcon />
          <Typography variant="caption">All Types</Typography>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default TradeFinanceAssetTypeFilter; 