import React from 'react';
import { 
  Box, 
  Typography, 
  FormGroup, 
  FormControlLabel, 
  Switch, 
  Slider, 
  TextField,
  InputAdornment,
  Paper,
  Tooltip,
  Divider,
  Collapse
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { TokenomicsConfig } from '../../types/assetTypes';
import CompatGrid from '../common/CompatGrid';

interface TokenomicsConfigurationProps {
  tokenomicsData: TokenomicsConfig;
  onChange: (field: string, value: any) => void;
}

const TokenomicsConfiguration: React.FC<TokenomicsConfigurationProps> = ({ tokenomicsData, onChange }) => {
  // Helper function to handle switch changes
  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.name, event.target.checked);
  };

  // Helper function to handle fee rate changes
  const handleFeeRateChange = (event: Event, newValue: number | number[]) => {
    onChange('feeRate', newValue);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Tokenomics Configuration
      </Typography>
      <Typography variant="body1" paragraph>
        Configure the economic properties for your asset token.
      </Typography>

      <FormGroup sx={{ mb: 4 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
          Token Features
        </Typography>
        <CompatGrid container spacing={2}>
          <CompatGrid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={tokenomicsData.hasTransferRestrictions}
                  onChange={(e) => onChange('hasTransferRestrictions', e.target.checked)}
                  color="primary"
                />
              }
              label="Transfer Restrictions"
            />
            <Typography variant="caption" color="text.secondary" display="block">
              Limit who can receive tokens (e.g., accredited investors only)
            </Typography>
          </CompatGrid>
          
          <CompatGrid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={tokenomicsData.hasDividends}
                  onChange={(e) => onChange('hasDividends', e.target.checked)}
                  color="primary"
                />
              }
              label="Dividend Distribution"
            />
            <Typography variant="caption" color="text.secondary" display="block">
              Enable periodic dividend/yield payments to holders
            </Typography>
          </CompatGrid>
          
          <CompatGrid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={tokenomicsData.hasMaturity}
                  onChange={(e) => onChange('hasMaturity', e.target.checked)}
                  color="primary"
                />
              }
              label="Maturity Date"
            />
            <Typography variant="caption" color="text.secondary" display="block">
              Token has a fixed maturity/expiration date
            </Typography>
          </CompatGrid>
          
          <CompatGrid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={tokenomicsData.hasRoyalties}
                  onChange={(e) => onChange('hasRoyalties', e.target.checked)}
                  color="primary"
                />
              }
              label="Royalty Mechanism"
            />
            <Typography variant="caption" color="text.secondary" display="block">
              Automatic royalties on secondary market transactions
            </Typography>
          </CompatGrid>
        </CompatGrid>
      </FormGroup>

      <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
        Fee Configuration
      </Typography>
      <CompatGrid container spacing={3}>
        <CompatGrid item xs={12} md={6}>
          <TextField
            label="Transaction Fee Rate"
            type="number"
            fullWidth
            value={tokenomicsData.feeRate}
            onChange={(e) => onChange('feeRate', Number(e.target.value))}
            InputProps={{
              endAdornment: <InputAdornment position="end">basis points</InputAdornment>,
            }}
            helperText="Fee charged on each transfer (100 basis points = 1%)"
            inputProps={{ min: 0, max: 1000, step: 1 }}
          />
        </CompatGrid>
        
        <CompatGrid item xs={12} md={6}>
          <TextField
            label="Fee Recipient Address"
            fullWidth
            value={tokenomicsData.feeRecipient}
            onChange={(e) => onChange('feeRecipient', e.target.value)}
            helperText="Ethereum address to receive collected fees"
          />
        </CompatGrid>
      </CompatGrid>

      {tokenomicsData.hasRoyalties && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle2" gutterBottom>
            Royalty Configuration
          </Typography>
          <CompatGrid container spacing={3}>
            <CompatGrid item xs={12} md={6}>
              <TextField
                label="Royalty Rate"
                type="number"
                fullWidth
                value={tokenomicsData.customTokenomics.royaltyRate || 0}
                onChange={(e) => onChange('customTokenomics', {
                  ...tokenomicsData.customTokenomics,
                  royaltyRate: Number(e.target.value)
                })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                helperText="Percentage of each trade sent to royalty recipient"
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
            </CompatGrid>
            
            <CompatGrid item xs={12} md={6}>
              <TextField
                label="Royalty Recipient"
                fullWidth
                value={tokenomicsData.customTokenomics.royaltyRecipient || ''}
                onChange={(e) => onChange('customTokenomics', {
                  ...tokenomicsData.customTokenomics,
                  royaltyRecipient: e.target.value
                })}
                helperText="Address to receive royalty payments"
              />
            </CompatGrid>
          </CompatGrid>
        </Box>
      )}

      {tokenomicsData.hasDividends && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle2" gutterBottom>
            Dividend Configuration
          </Typography>
          <CompatGrid container spacing={3}>
            <CompatGrid item xs={12} md={6}>
              <TextField
                label="Distribution Frequency"
                select
                fullWidth
                SelectProps={{ native: true }}
                value={tokenomicsData.customTokenomics.dividendFrequency || 'monthly'}
                onChange={(e) => onChange('customTokenomics', {
                  ...tokenomicsData.customTokenomics,
                  dividendFrequency: e.target.value
                })}
                helperText="How often dividends are distributed"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
                <option value="manual">Manual (on-demand)</option>
              </TextField>
            </CompatGrid>
            
            <CompatGrid item xs={12} md={6}>
              <TextField
                label="Automatic Reinvestment"
                select
                fullWidth
                SelectProps={{ native: true }}
                value={tokenomicsData.customTokenomics.autoReinvest ? 'true' : 'false'}
                onChange={(e) => onChange('customTokenomics', {
                  ...tokenomicsData.customTokenomics,
                  autoReinvest: e.target.value === 'true'
                })}
                helperText="Option to automatically reinvest dividends"
              >
                <option value="false">Disabled</option>
                <option value="true">Enabled</option>
              </TextField>
            </CompatGrid>
          </CompatGrid>
        </Box>
      )}
    </Box>
  );
};

export default TokenomicsConfiguration; 