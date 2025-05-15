import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  Chip,
  List,
  ListItem,
  ListItemText,
  Avatar
} from '@mui/material';
import { AssetClass } from '../../types/assetTypes';
import CompatGrid from '../common/CompatGrid';

interface AssetSummaryProps {
  assetData: {
    assetClass: AssetClass;
    templateId: string;
    name: string;
    symbol: string;
    description: string;
    totalSupply: string;
    decimals: number;
    faceValue: string;
    issuanceDate: number;
    maturityDate: number;
    yieldRate: string;
    metadataURI: string;
    imageUrl: string;
    customFields: Record<string, any>;
  };
  tokenomicsData: {
    hasTransferRestrictions: boolean;
    hasDividends: boolean;
    hasMaturity: boolean;
    hasRoyalties: boolean;
    feeRate: number;
    feeRecipient: string;
    customTokenomics: Record<string, any>;
  };
  selectedModules: string[];
}

const AssetSummary: React.FC<AssetSummaryProps> = ({
  assetData,
  tokenomicsData,
  selectedModules
}) => {
  // Helper function to format date from timestamp
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Function to generate human-readable module names
  const getModuleName = (moduleId: string): string => {
    const moduleNames: Record<string, string> = {
      'kyc-aml': 'KYC/AML Verification',
      'accredited-investor': 'Accredited Investor',
      'transfer-restriction': 'Transfer Restrictions',
      'tax-withholding': 'Tax Withholding',
      'environmental-verification': 'Environmental Verification'
    };
    
    return moduleNames[moduleId] || moduleId;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Asset Details
      </Typography>
      <Typography variant="body1" paragraph>
        Please review all information before creating your {assetData.assetClass.replace('_', ' ').toLowerCase()} asset.
      </Typography>

      <CompatGrid container spacing={3}>
        {/* Asset Image */}
        <CompatGrid item xs={12}>
          <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Asset Image
            </Typography>
            <Divider sx={{ my: 1.5, mb: 3 }} />
            
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                mb: 2
              }}
            >
              <Box
                component="img"
                src={assetData.imageUrl || `/images/assets/${assetData.assetClass.toLowerCase().replace('_', '-')}.jpg`}
                alt={assetData.name}
                sx={{
                  width: '100%',
                  maxWidth: 400,
                  height: 200,
                  objectFit: 'cover',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.src = '/images/assets/placeholder.jpg';
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              This image will represent your asset in listings and the marketplace
            </Typography>
          </Paper>
        </CompatGrid>

        {/* Asset Basic Information */}
        <CompatGrid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Basic Information
            </Typography>
            <Divider sx={{ my: 1.5 }} />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Asset Class
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {assetData.assetClass.replace('_', ' ')}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Asset Name
              </Typography>
              <Typography variant="body1">
                {assetData.name || '[Not Set]'}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Symbol
              </Typography>
              <Typography variant="body1">
                {assetData.symbol || '[Not Set]'}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Description
              </Typography>
              <Typography variant="body1">
                {assetData.description || '[Not Set]'}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Total Supply
              </Typography>
              <Typography variant="body1">
                {assetData.totalSupply ? `${assetData.totalSupply} tokens` : '[Not Set]'}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Decimals
              </Typography>
              <Typography variant="body1">
                {assetData.decimals}
              </Typography>
            </Box>
          </Paper>
        </CompatGrid>

        {/* Asset Specific Information */}
        <CompatGrid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {assetData.assetClass.replace('_', ' ')} Specific Details
            </Typography>
            <Divider sx={{ my: 1.5 }} />
            
            {assetData.assetClass === AssetClass.TREASURY && (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Face Value
                  </Typography>
                  <Typography variant="body1">
                    {assetData.faceValue ? `$${assetData.faceValue}` : '[Not Set]'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Yield Rate
                  </Typography>
                  <Typography variant="body1">
                    {assetData.yieldRate ? `${assetData.yieldRate}%` : '[Not Set]'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Issuance Date
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(assetData.issuanceDate)}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Maturity Date
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(assetData.maturityDate)}
                  </Typography>
                </Box>
              </>
            )}
            
            {assetData.assetClass === AssetClass.ENVIRONMENTAL_ASSET && (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Certification Standard
                  </Typography>
                  <Typography variant="body1">
                    {assetData.customFields?.certificationStandard || '[Not Set]'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Vintage Year
                  </Typography>
                  <Typography variant="body1">
                    {assetData.customFields?.vintageYear || '[Not Set]'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Project ID
                  </Typography>
                  <Typography variant="body1">
                    {assetData.customFields?.projectId || '[Not Set]'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Project Location
                  </Typography>
                  <Typography variant="body1">
                    {assetData.customFields?.projectLocation || '[Not Set]'}
                  </Typography>
                </Box>
              </>
            )}
            
            {assetData.assetClass === AssetClass.REAL_ESTATE && (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Property Address
                  </Typography>
                  <Typography variant="body1">
                    {assetData.customFields?.propertyAddress || '[Not Set]'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Property Type
                  </Typography>
                  <Typography variant="body1">
                    {assetData.customFields?.propertyType || '[Not Set]'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Square Footage
                  </Typography>
                  <Typography variant="body1">
                    {assetData.customFields?.squareFootage ? `${assetData.customFields.squareFootage} sq ft` : '[Not Set]'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Appraisal Value
                  </Typography>
                  <Typography variant="body1">
                    {assetData.customFields?.appraisalValue ? `$${assetData.customFields.appraisalValue}` : '[Not Set]'}
                  </Typography>
                </Box>
              </>
            )}
          </Paper>
        </CompatGrid>

        {/* Tokenomics Information */}
        <CompatGrid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Tokenomics
            </Typography>
            <Divider sx={{ my: 1.5 }} />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Features
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {tokenomicsData.hasTransferRestrictions && (
                  <Chip label="Transfer Restrictions" size="small" />
                )}
                {tokenomicsData.hasDividends && (
                  <Chip label="Dividends" size="small" />
                )}
                {tokenomicsData.hasMaturity && (
                  <Chip label="Maturity" size="small" />
                )}
                {tokenomicsData.hasRoyalties && (
                  <Chip label="Royalties" size="small" />
                )}
                {!tokenomicsData.hasTransferRestrictions && 
                  !tokenomicsData.hasDividends && 
                  !tokenomicsData.hasMaturity && 
                  !tokenomicsData.hasRoyalties && (
                    <Typography variant="body2">[No special features]</Typography>
                )}
              </Box>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Transaction Fee
              </Typography>
              <Typography variant="body1">
                {(tokenomicsData.feeRate / 100).toFixed(2)}%
              </Typography>
            </Box>
            
            {tokenomicsData.feeRecipient && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Fee Recipient
                </Typography>
                <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                  {tokenomicsData.feeRecipient}
                </Typography>
              </Box>
            )}
            
            {tokenomicsData.hasRoyalties && tokenomicsData.customTokenomics?.royaltyRate && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Royalty Rate
                </Typography>
                <Typography variant="body1">
                  {tokenomicsData.customTokenomics.royaltyRate}%
                </Typography>
              </Box>
            )}
            
            {tokenomicsData.hasDividends && tokenomicsData.customTokenomics?.dividendFrequency && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Dividend Frequency
                </Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                  {tokenomicsData.customTokenomics.dividendFrequency}
                </Typography>
              </Box>
            )}
          </Paper>
        </CompatGrid>

        {/* Compliance & Modules */}
        <CompatGrid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Compliance & Modules
            </Typography>
            <Divider sx={{ my: 1.5 }} />
            
            {selectedModules.length > 0 ? (
              <List dense>
                {selectedModules.map((moduleId) => (
                  <ListItem key={moduleId}>
                    <ListItemText
                      primary={getModuleName(moduleId)}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No compliance modules selected
              </Typography>
            )}
          </Paper>
        </CompatGrid>
      </CompatGrid>
    </Box>
  );
};

export default AssetSummary;