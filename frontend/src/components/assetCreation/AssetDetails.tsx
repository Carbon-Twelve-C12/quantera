import React from 'react';
import { Box, Typography, TextField, InputAdornment, Divider } from '@mui/material';
import { AssetClass } from '../../types/assetTypes';
import CompatGrid from '../common/CompatGrid';
import ImageUploader from '../common/ImageUploader';

interface AssetDetailsProps {
  assetData: {
    assetClass: AssetClass;
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
  onChange: (field: string, value: any) => void;
}

const AssetDetails: React.FC<AssetDetailsProps> = ({ assetData, onChange }) => {
  // Helper function to convert timestamp to date string
  const timestampToDateStr = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };

  // Helper function to convert date string to timestamp
  const dateStrToTimestamp = (dateStr: string): number => {
    const date = new Date(dateStr);
    return Math.floor(date.getTime() / 1000);
  };

  const handleDateChange = (field: string, dateStr: string) => {
    onChange(field, dateStrToTimestamp(dateStr));
  };

  // Conditionally render fields based on asset class
  const renderAssetSpecificFields = () => {
    switch (assetData.assetClass) {
      case AssetClass.TREASURY:
        return (
          <>
            <CompatGrid item xs={12} md={6}>
              <TextField
                label="Face Value"
                type="number"
                fullWidth
                value={assetData.faceValue}
                onChange={(e) => onChange('faceValue', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                helperText="The face value (par value) of the treasury security"
              />
            </CompatGrid>
            <CompatGrid item xs={12} md={6}>
              <TextField
                label="Yield Rate"
                type="number"
                fullWidth
                value={assetData.yieldRate}
                onChange={(e) => onChange('yieldRate', e.target.value)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                helperText="Annual interest rate for the treasury"
              />
            </CompatGrid>
            <CompatGrid item xs={12} md={6}>
              <TextField
                label="Issuance Date"
                type="date"
                fullWidth
                value={timestampToDateStr(assetData.issuanceDate)}
                onChange={(e) => handleDateChange('issuanceDate', e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                helperText="Date when the treasury is issued"
              />
            </CompatGrid>
            <CompatGrid item xs={12} md={6}>
              <TextField
                label="Maturity Date"
                type="date"
                fullWidth
                value={timestampToDateStr(assetData.maturityDate)}
                onChange={(e) => handleDateChange('maturityDate', e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                helperText="Date when the treasury matures"
              />
            </CompatGrid>
          </>
        );

      case AssetClass.ENVIRONMENTAL_ASSET:
        return (
          <>
            <CompatGrid item xs={12} md={6}>
              <TextField
                label="Certification Standard"
                fullWidth
                value={assetData.customFields?.certificationStandard || ''}
                onChange={(e) => onChange('customFields', {
                  ...assetData.customFields,
                  certificationStandard: e.target.value
                })}
                helperText="E.g., Gold Standard, Verra VCS, etc."
              />
            </CompatGrid>
            <CompatGrid item xs={12} md={6}>
              <TextField
                label="Vintage Year"
                type="number"
                fullWidth
                value={assetData.customFields?.vintageYear || new Date().getFullYear()}
                onChange={(e) => onChange('customFields', {
                  ...assetData.customFields,
                  vintageYear: e.target.value
                })}
                helperText="Year when the environmental credit was generated"
              />
            </CompatGrid>
            <CompatGrid item xs={12} md={6}>
              <TextField
                label="Project ID"
                fullWidth
                value={assetData.customFields?.projectId || ''}
                onChange={(e) => onChange('customFields', {
                  ...assetData.customFields,
                  projectId: e.target.value
                })}
                helperText="Unique identifier of the project"
              />
            </CompatGrid>
            <CompatGrid item xs={12} md={6}>
              <TextField
                label="Project Location"
                fullWidth
                value={assetData.customFields?.projectLocation || ''}
                onChange={(e) => onChange('customFields', {
                  ...assetData.customFields,
                  projectLocation: e.target.value
                })}
                helperText="Country or region where the project is located"
              />
            </CompatGrid>
          </>
        );

      case AssetClass.REAL_ESTATE:
        return (
          <>
            <CompatGrid item xs={12} md={6}>
              <TextField
                label="Property Address"
                fullWidth
                value={assetData.customFields?.propertyAddress || ''}
                onChange={(e) => onChange('customFields', {
                  ...assetData.customFields,
                  propertyAddress: e.target.value
                })}
              />
            </CompatGrid>
            <CompatGrid item xs={12} md={6}>
              <TextField
                label="Property Type"
                fullWidth
                value={assetData.customFields?.propertyType || ''}
                onChange={(e) => onChange('customFields', {
                  ...assetData.customFields,
                  propertyType: e.target.value
                })}
                helperText="Commercial, Residential, Mixed-Use, etc."
              />
            </CompatGrid>
            <CompatGrid item xs={12} md={6}>
              <TextField
                label="Square Footage"
                type="number"
                fullWidth
                value={assetData.customFields?.squareFootage || ''}
                onChange={(e) => onChange('customFields', {
                  ...assetData.customFields,
                  squareFootage: e.target.value
                })}
              />
            </CompatGrid>
            <CompatGrid item xs={12} md={6}>
              <TextField
                label="Appraisal Value"
                type="number"
                fullWidth
                value={assetData.customFields?.appraisalValue || ''}
                onChange={(e) => onChange('customFields', {
                  ...assetData.customFields,
                  appraisalValue: e.target.value
                })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </CompatGrid>
          </>
        );

      case AssetClass.CUSTOM:
        return (
          <>
            <CompatGrid item xs={12} md={6}>
              <TextField
                label="Asset Type"
                fullWidth
                value={assetData.customFields?.assetType || ''}
                onChange={(e) => onChange('customFields', {
                  ...assetData.customFields,
                  assetType: e.target.value
                })}
                helperText="Type of custom asset (e.g., Fund, Structured Product, etc.)"
              />
            </CompatGrid>
            <CompatGrid item xs={12} md={6}>
              <TextField
                label="Custom Identifier"
                fullWidth
                value={assetData.customFields?.customIdentifier || ''}
                onChange={(e) => onChange('customFields', {
                  ...assetData.customFields,
                  customIdentifier: e.target.value
                })}
                helperText="Unique identifier in external systems"
              />
            </CompatGrid>
            <CompatGrid item xs={12} md={6}>
              <TextField
                label="Issuer Name"
                fullWidth
                value={assetData.customFields?.issuerName || ''}
                onChange={(e) => onChange('customFields', {
                  ...assetData.customFields,
                  issuerName: e.target.value
                })}
                helperText="Name of the issuing organization"
              />
            </CompatGrid>
            <CompatGrid item xs={12} md={6}>
              <TextField
                label="Expected Yield"
                type="number"
                fullWidth
                value={assetData.customFields?.expectedYield || ''}
                onChange={(e) => onChange('customFields', {
                  ...assetData.customFields,
                  expectedYield: e.target.value
                })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                helperText="Expected annual return for this asset"
              />
            </CompatGrid>
            <CompatGrid item xs={12}>
              <TextField
                label="Additional Terms"
                fullWidth
                multiline
                rows={3}
                value={assetData.customFields?.additionalTerms || ''}
                onChange={(e) => onChange('customFields', {
                  ...assetData.customFields,
                  additionalTerms: e.target.value
                })}
                helperText="Any special terms or conditions for this asset"
              />
            </CompatGrid>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Asset Details
      </Typography>
      <Typography variant="body1" paragraph>
        Enter the details of your {assetData.assetClass?.replace('_', ' ').toLowerCase()} asset.
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          Asset Image
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Upload an image that represents your asset. This image will be displayed in the marketplace and asset listings.
        </Typography>
        <ImageUploader 
          imageUrl={assetData.imageUrl} 
          onChange={(url) => onChange('imageUrl', url)}
          defaultImage={`/images/assets/${assetData.assetClass.toLowerCase().replace('_', '-')}.jpg`}
        />
      </Box>

      <Divider sx={{ my: 3 }} />
      
      <Typography variant="subtitle1" gutterBottom>
        Basic Details
      </Typography>

      <CompatGrid container spacing={3}>
        {/* Common fields for all asset types */}
        <CompatGrid item xs={12} md={6}>
          <TextField
            required
            label="Asset Name"
            fullWidth
            value={assetData.name}
            onChange={(e) => onChange('name', e.target.value)}
            helperText="Full name of your asset"
          />
        </CompatGrid>
        <CompatGrid item xs={12} md={6}>
          <TextField
            required
            label="Symbol"
            fullWidth
            value={assetData.symbol}
            onChange={(e) => onChange('symbol', e.target.value)}
            helperText="Trading symbol (up to 5 characters)"
            inputProps={{ maxLength: 5 }}
          />
        </CompatGrid>
        <CompatGrid item xs={12}>
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={assetData.description}
            onChange={(e) => onChange('description', e.target.value)}
            helperText="Detailed description of the asset"
          />
        </CompatGrid>
        <CompatGrid item xs={12} md={6}>
          <TextField
            required
            label="Total Supply"
            type="number"
            fullWidth
            value={assetData.totalSupply}
            onChange={(e) => onChange('totalSupply', e.target.value)}
            helperText="Total number of tokens to create"
          />
        </CompatGrid>
        <CompatGrid item xs={12} md={6}>
          <TextField
            required
            label="Decimals"
            type="number"
            fullWidth
            value={assetData.decimals}
            onChange={(e) => onChange('decimals', e.target.value)}
            helperText="Number of decimal places (usually 18)"
            inputProps={{ min: 0, max: 18 }}
          />
        </CompatGrid>
        <CompatGrid item xs={12}>
          <TextField
            label="Metadata URI"
            fullWidth
            value={assetData.metadataURI}
            onChange={(e) => onChange('metadataURI', e.target.value)}
            helperText="URI pointing to additional asset metadata (IPFS, HTTP, etc.)"
          />
        </CompatGrid>

        {/* Asset-specific fields */}
        {renderAssetSpecificFields()}
      </CompatGrid>
    </Box>
  );
};

export default AssetDetails; 