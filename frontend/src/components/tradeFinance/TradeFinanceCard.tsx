import React, { useState } from 'react';
import { useTradeFinance } from '../../contexts/TradeFinanceContext';
import { TradeFinanceAsset, TradeFinanceAssetType } from '../../types/tradeFinance';
import { 
  Card, 
  CardContent, 
  CardActions, 
  Typography, 
  Button, 
  Chip, 
  Box, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  LinearProgress,
} from '@mui/material';
import Grid from '../../utils/mui-shims';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PaidIcon from '@mui/icons-material/Paid';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import InventoryIcon from '@mui/icons-material/Inventory';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import FactoryIcon from '@mui/icons-material/Factory';

interface TradeFinanceCardProps {
  asset: TradeFinanceAsset;
}

const getAssetTypeIcon = (type: TradeFinanceAssetType) => {
  switch (type) {
    case TradeFinanceAssetType.LETTER_OF_CREDIT:
      return <AccountBalanceIcon />;
    case TradeFinanceAssetType.INVOICE_RECEIVABLE:
      return <ReceiptLongIcon />;
    case TradeFinanceAssetType.WAREHOUSE_RECEIPT:
      return <InventoryIcon />;
    case TradeFinanceAssetType.BILL_OF_LADING:
      return <DirectionsBoatIcon />;
    case TradeFinanceAssetType.EXPORT_CREDIT:
      return <LocalShippingIcon />;
    case TradeFinanceAssetType.SUPPLY_CHAIN_FINANCE:
      return <FactoryIcon />;
    default:
      return <PaidIcon />;
  }
};

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const TradeFinanceCard: React.FC<TradeFinanceCardProps> = ({ asset }) => {
  const { purchaseAsset } = useTradeFinance();
  const [openDialog, setOpenDialog] = useState(false);
  const [units, setUnits] = useState<number>(1);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setUnits(1);
    setError(null);
    setSuccess(false);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleUnitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setUnits(Math.min(value, asset.fractionalUnits));
    }
  };

  const handlePurchase = async () => {
    if (units <= 0 || units > asset.fractionalUnits) {
      setError('Invalid number of units');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Hardcoded user address for demo purposes, in real app would come from wallet context
      const userAddress = '0x1234567890123456789012345678901234567890';
      const result = await purchaseAsset(asset.id, userAddress, units);
      
      if (result) {
        setSuccess(true);
        setTimeout(() => {
          handleCloseDialog();
        }, 2000);
      } else {
        setError('Failed to complete purchase');
      }
    } catch (err) {
      setError('An error occurred during the purchase');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const totalPrice = asset.minimumInvestment * units;
  const percentFilled = (asset.fractionalUnits - asset.fractionalUnits) / asset.fractionalUnits * 100;

  return (
    <>
      <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Chip 
              icon={getAssetTypeIcon(asset.assetType)}
              label={asset.assetType.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              ).join(' ')}
              color="primary"
              size="small"
            />
            <Chip 
              icon={<AssessmentIcon />}
              label={`Risk: ${asset.riskRating}/10`}
              color={asset.riskRating <= 3 ? "success" : asset.riskRating <= 7 ? "warning" : "error"}
              size="small"
            />
          </Box>
          
          <Typography variant="h6" component="h2" gutterBottom>
            {asset.description}
          </Typography>
          
          <Box mt={2} mb={1}>
            <Grid container spacing={2}>
              <Grid xs={6} item>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PaidIcon fontSize="small" />
                  Value: {asset.nominalValue.toLocaleString()} {asset.currency}
                </Typography>
              </Grid>
              <Grid xs={6} item>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocalOfferIcon fontSize="small" />
                  Yield: {asset.yieldRate}%
                </Typography>
              </Grid>
              <Grid xs={6} item>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarTodayIcon fontSize="small" />
                  Maturity: {formatDate(asset.maturityDate)}
                </Typography>
              </Grid>
              <Grid xs={6} item>
                <Typography variant="body2" color="text.secondary">
                  Min Investment: {asset.minimumInvestment} {asset.settlementCurrency}
                </Typography>
              </Grid>
            </Grid>
          </Box>
          
          <Box mt={2}>
            <Typography variant="body2" gutterBottom>
              Funding Progress
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={percentFilled} 
              sx={{ height: 8, borderRadius: 1 }}
            />
            <Box display="flex" justifyContent="space-between" mt={0.5}>
              <Typography variant="caption" color="text.secondary">
                {asset.fractionalUnits} units available
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Math.round(percentFilled)}% filled
              </Typography>
            </Box>
          </Box>
        </CardContent>
        
        <CardActions>
          <Button 
            size="small" 
            color="primary" 
            variant="contained"
            fullWidth
            onClick={handleOpenDialog}
          >
            Invest Now
          </Button>
        </CardActions>
      </Card>

      {/* Purchase Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Invest in {asset.description}</DialogTitle>
        <DialogContent>
          {processing && <LinearProgress sx={{ mb: 2 }} />}
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Investment successful! Processing your transaction...
            </Alert>
          )}
          
          <Box mb={3}>
            <Typography variant="body2" gutterBottom>
              Asset Details:
            </Typography>
            <Grid container spacing={1}>
              <Grid xs={6} item>
                <Typography variant="body2" color="text.secondary">
                  Type: {asset.assetType.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                  ).join(' ')}
                </Typography>
              </Grid>
              <Grid xs={6} item>
                <Typography variant="body2" color="text.secondary">
                  Risk Rating: {asset.riskRating}/10
                </Typography>
              </Grid>
              <Grid xs={6} item>
                <Typography variant="body2" color="text.secondary">
                  Yield Rate: {asset.yieldRate}%
                </Typography>
              </Grid>
              <Grid xs={6} item>
                <Typography variant="body2" color="text.secondary">
                  Maturity: {formatDate(asset.maturityDate)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
          
          <TextField
            label="Number of Units"
            type="number"
            fullWidth
            value={units}
            onChange={handleUnitsChange}
            inputProps={{ min: 1, max: asset.fractionalUnits }}
            sx={{ mb: 2 }}
            disabled={processing || success}
          />
          
          <Typography variant="body2" gutterBottom>
            Price per Unit: {asset.minimumInvestment} {asset.settlementCurrency}
          </Typography>
          
          <Typography variant="h6" color="primary" gutterBottom>
            Total Investment: {totalPrice} {asset.settlementCurrency}
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            Expected Return: {(totalPrice * (1 + asset.yieldRate / 100)).toFixed(2)} {asset.settlementCurrency}
          </Typography>
          
          <Typography variant="caption" color="text.secondary" display="block" mt={2}>
            Settlement currency: {asset.settlementCurrency}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={processing}>
            Cancel
          </Button>
          <Button 
            onClick={handlePurchase} 
            color="primary" 
            variant="contained"
            disabled={processing || success || units <= 0}
          >
            Confirm Investment
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TradeFinanceCard; 