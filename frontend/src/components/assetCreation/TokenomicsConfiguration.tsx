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
        Configure the economic and governance aspects of your asset. These settings will determine how your asset behaves in the marketplace.
      </Typography>

      <CompatGrid container spacing={4}>
        {/* Left column: Toggles for token features */}
        <CompatGrid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Token Features
            </Typography>
            <FormGroup>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={tokenomicsData.hasTransferRestrictions}
                      onChange={handleSwitchChange}
                      name="hasTransferRestrictions"
                      color="primary"
                    />
                  }
                  label="Transfer Restrictions"
                />
                <Tooltip title="Limit who can send and receive tokens based on compliance rules">
                  <InfoIcon fontSize="small" color="action" sx={{ ml: 1 }} />
                </Tooltip>
              </Box>
              
              <Collapse in={tokenomicsData.hasTransferRestrictions}>
                <Box sx={{ pl: 4, pr: 2, mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Transfer restrictions allow you to control who can hold your tokens, useful for regulatory compliance.
                  </Typography>
                </Box>
              </Collapse>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={tokenomicsData.hasDividends}
                      onChange={handleSwitchChange}
                      name="hasDividends"
                      color="primary"
                    />
                  }
                  label="Dividend Distribution"
                />
                <Tooltip title="Enable automatic dividend distribution to token holders">
                  <InfoIcon fontSize="small" color="action" sx={{ ml: 1 }} />
                </Tooltip>
              </Box>
              
              <Collapse in={tokenomicsData.hasDividends}>
                <Box sx={{ pl: 4, pr: 2, mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Dividends allow asset holders to receive periodic payments based on performance or revenue generation.
                  </Typography>
                </Box>
              </Collapse>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={tokenomicsData.hasMaturity}
                      onChange={handleSwitchChange}
                      name="hasMaturity"
                      color="primary"
                    />
                  }
                  label="Maturity Date"
                />
                <Tooltip title="Set a date when the token will mature and pay out the principal amount">
                  <InfoIcon fontSize="small" color="action" sx={{ ml: 1 }} />
                </Tooltip>
              </Box>
              
              <Collapse in={tokenomicsData.hasMaturity}>
                <Box sx={{ pl: 4, pr: 2, mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Maturity enables fixed-term investments with principal repayment at the end of the term.
                  </Typography>
                </Box>
              </Collapse>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={tokenomicsData.hasRoyalties}
                      onChange={handleSwitchChange}
                      name="hasRoyalties"
                      color="primary"
                    />
                  }
                  label="Secondary Market Royalties"
                />
                <Tooltip title="Collect a percentage fee on secondary market sales">
                  <InfoIcon fontSize="small" color="action" sx={{ ml: 1 }} />
                </Tooltip>
              </Box>
              
              <Collapse in={tokenomicsData.hasRoyalties}>
                <Box sx={{ pl: 4, pr: 2, mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Royalties provide ongoing revenue from secondary market trading activity.
                  </Typography>
                </Box>
              </Collapse>
            </FormGroup>
          </Paper>
        </CompatGrid>
        
        {/* Right column: Fee configuration */}
        <CompatGrid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Fee Configuration
            </Typography>
            
            <Box sx={{ mb: 4 }}>
              <Typography id="fee-rate-slider" gutterBottom>
                Transaction Fee Rate: {(tokenomicsData.feeRate / 100).toFixed(2)}%
              </Typography>
              <Slider
                value={tokenomicsData.feeRate}
                onChange={handleFeeRateChange}
                aria-labelledby="fee-rate-slider"
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${(value / 100).toFixed(2)}%`}
                step={5}
                marks={[
                  {
                    value: 0,
                    label: '0%'
                  },
                  {
                    value: 100,
                    label: '1%'
                  },
                  {
                    value: 200,
                    label: '2%'
                  }
                ]}
                min={0}
                max={200}
              />
              <Typography variant="body2" color="text.secondary">
                Fee applied to transactions involving this asset. Industry standard is 0.25-0.50%.
              </Typography>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Box>
              <Typography gutterBottom>
                Fee Recipient Address
              </Typography>
              <TextField
                fullWidth
                placeholder="0x..."
                value={tokenomicsData.feeRecipient}
                onChange={(e) => onChange('feeRecipient', e.target.value)}
                helperText="Ethereum address that will receive transaction fees"
                sx={{ mb: 2 }}
              />
              
              <Typography variant="body2" color="text.secondary">
                If left empty, fees will be directed to the platform treasury by default.
              </Typography>
            </Box>
          </Paper>
        </CompatGrid>
        
        {/* Full width: Custom tokenomics settings */}
        <CompatGrid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Advanced Tokenomics
            </Typography>
            
            <CompatGrid container spacing={3}>
              {/* Custom fields could be dynamically rendered based on asset type */}
              {tokenomicsData.hasMaturity && (
                <CompatGrid item xs={12} md={6}>
                  <TextField
                    label="Early Redemption Fee"
                    type="number"
                    fullWidth
                    value={tokenomicsData.customTokenomics?.earlyRedemptionFee || ''}
                    onChange={(e) => onChange('customTokenomics', {
                      ...tokenomicsData.customTokenomics,
                      earlyRedemptionFee: e.target.value
                    })}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                    helperText="Fee applied when redeeming before maturity date"
                  />
                </CompatGrid>
              )}
              
              {tokenomicsData.hasDividends && (
                <CompatGrid item xs={12} md={6}>
                  <TextField
                    label="Dividend Frequency"
                    select
                    fullWidth
                    value={tokenomicsData.customTokenomics?.dividendFrequency || 'quarterly'}
                    onChange={(e) => onChange('customTokenomics', {
                      ...tokenomicsData.customTokenomics,
                      dividendFrequency: e.target.value
                    })}
                    SelectProps={{
                      native: true,
                    }}
                    helperText="How often dividends are distributed"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="biannually">Bi-annually</option>
                    <option value="annually">Annually</option>
                  </TextField>
                </CompatGrid>
              )}
              
              {tokenomicsData.hasRoyalties && (
                <CompatGrid item xs={12} md={6}>
                  <TextField
                    label="Royalty Rate"
                    type="number"
                    fullWidth
                    value={tokenomicsData.customTokenomics?.royaltyRate || ''}
                    onChange={(e) => onChange('customTokenomics', {
                      ...tokenomicsData.customTokenomics,
                      royaltyRate: e.target.value
                    })}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                    helperText="Percentage fee on secondary market transactions"
                  />
                </CompatGrid>
              )}
            </CompatGrid>
          </Paper>
        </CompatGrid>
      </CompatGrid>
    </Box>
  );
};

export default TokenomicsConfiguration; 