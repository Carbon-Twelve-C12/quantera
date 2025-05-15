import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableRow,
  Divider,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert
} from '@mui/material';
import { AssetClass, TokenomicsConfig } from '../../types/assetTypes';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import StarIcon from '@mui/icons-material/Star';
import PermIdentityIcon from '@mui/icons-material/PermIdentity';
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
    customFields: Record<string, any>;
  };
  tokenomicsData: TokenomicsConfig;
  selectedModules: string[];
}

// Mock function to get module name from ID
const getModuleName = (moduleId: string): string => {
  const modules: Record<string, string> = {
    'kyc-aml-basic': 'KYC/AML Basic',
    'kyc-aml-advanced': 'KYC/AML Advanced',
    'accredited-investor': 'Accredited Investor Verification',
    'transfer-restrictions': 'Transfer Restrictions',
    'tax-reporting': 'Tax Reporting',
    'jurisdiction-restriction': 'Jurisdiction Restrictions',
    'environmental-certification': 'Environmental Asset Certification'
  };
  
  return modules[moduleId] || moduleId;
};

const AssetSummary: React.FC<AssetSummaryProps> = ({ 
  assetData, 
  tokenomicsData, 
  selectedModules 
}) => {
  // Format date from timestamp
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Calculate the estimated gas cost
  const calculateGasCost = (): number => {
    // This is a simple mock calculation
    // In a real app, this would be based on asset complexity and current gas prices
    let baseCost = 0.05; // Base cost in ETH
    
    // Add cost for each enabled feature
    if (tokenomicsData.hasTransferRestrictions) baseCost += 0.01;
    if (tokenomicsData.hasDividends) baseCost += 0.015;
    if (tokenomicsData.hasMaturity) baseCost += 0.005;
    if (tokenomicsData.hasRoyalties) baseCost += 0.01;
    
    // Add cost for each selected module
    baseCost += selectedModules.length * 0.008;
    
    return parseFloat(baseCost.toFixed(4));
  };
  
  // Check if required fields are filled
  const hasRequiredFields = (): boolean => {
    return !!(
      assetData.name &&
      assetData.symbol &&
      assetData.totalSupply &&
      assetData.assetClass
    );
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review & Create
      </Typography>
      <Typography variant="body1" paragraph>
        Review the details of your asset before creating it. Please verify all information is correct.
      </Typography>
      
      {!hasRequiredFields() && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Some required fields are missing. Please go back and complete all required information.
        </Alert>
      )}
      
      <CompatGrid container spacing={4}>
        {/* Basic Asset Information */}
        <CompatGrid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Asset Information
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold', width: '40%' }}>
                      Asset Class
                    </TableCell>
                    <TableCell>
                      {assetData.assetClass && (
                        <Chip 
                          label={assetData.assetClass.replace('_', ' ')} 
                          color="primary" 
                          size="small" 
                        />
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                      Name
                    </TableCell>
                    <TableCell>{assetData.name || '-'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                      Symbol
                    </TableCell>
                    <TableCell>{assetData.symbol || '-'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                      Total Supply
                    </TableCell>
                    <TableCell>
                      {assetData.totalSupply ? `${assetData.totalSupply} (${assetData.decimals} decimals)` : '-'}
                    </TableCell>
                  </TableRow>
                  {assetData.faceValue && (
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                        Face Value
                      </TableCell>
                      <TableCell>${assetData.faceValue}</TableCell>
                    </TableRow>
                  )}
                  {assetData.yieldRate && (
                    <TableRow>
                      <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                        Yield Rate
                      </TableCell>
                      <TableCell>{assetData.yieldRate}%</TableCell>
                    </TableRow>
                  )}
                  {tokenomicsData.hasMaturity && (
                    <>
                      <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                          Issuance Date
                        </TableCell>
                        <TableCell>{formatDate(assetData.issuanceDate)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                          Maturity Date
                        </TableCell>
                        <TableCell>{formatDate(assetData.maturityDate)}</TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              Description
            </Typography>
            <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
              {assetData.description || 'No description provided.'}
            </Typography>
            
            {assetData.metadataURI && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Metadata URI
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                  {assetData.metadataURI}
                </Typography>
              </>
            )}
          </Paper>
        </CompatGrid>
        
        {/* Tokenomics */}
        <CompatGrid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Tokenomics
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  {tokenomicsData.hasTransferRestrictions ? 
                    <CheckCircleIcon color="success" /> : 
                    <CancelIcon color="disabled" />
                  }
                </ListItemIcon>
                <ListItemText 
                  primary="Transfer Restrictions" 
                  secondary={tokenomicsData.hasTransferRestrictions ? 
                    "Enabled - Token transfers will be restricted based on compliance rules" : 
                    "Disabled - Tokens can be freely transferred"
                  }
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  {tokenomicsData.hasDividends ? 
                    <CheckCircleIcon color="success" /> : 
                    <CancelIcon color="disabled" />
                  }
                </ListItemIcon>
                <ListItemText 
                  primary="Dividend Distribution" 
                  secondary={tokenomicsData.hasDividends ? 
                    `Enabled - ${tokenomicsData.customTokenomics?.dividendFrequency || 'Quarterly'} distribution` : 
                    "Disabled - No dividend distribution"
                  }
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  {tokenomicsData.hasMaturity ? 
                    <CheckCircleIcon color="success" /> : 
                    <CancelIcon color="disabled" />
                  }
                </ListItemIcon>
                <ListItemText 
                  primary="Maturity Date" 
                  secondary={tokenomicsData.hasMaturity ? 
                    `Enabled - Matures on ${formatDate(assetData.maturityDate)}` : 
                    "Disabled - No maturity date"
                  }
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  {tokenomicsData.hasRoyalties ? 
                    <CheckCircleIcon color="success" /> : 
                    <CancelIcon color="disabled" />
                  }
                </ListItemIcon>
                <ListItemText 
                  primary="Secondary Market Royalties" 
                  secondary={tokenomicsData.hasRoyalties ? 
                    `Enabled - ${tokenomicsData.customTokenomics?.royaltyRate || 2}% royalty on secondary sales` : 
                    "Disabled - No royalties on secondary market sales"
                  }
                />
              </ListItem>
              
              <Divider sx={{ my: 2 }} />
              
              <ListItem>
                <ListItemIcon>
                  <AttachMoneyIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Transaction Fee Rate" 
                  secondary={`${(tokenomicsData.feeRate / 100).toFixed(2)}% fee on transactions`}
                />
              </ListItem>
              
              {tokenomicsData.feeRecipient && (
                <ListItem>
                  <ListItemIcon>
                    <PermIdentityIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Fee Recipient" 
                    secondary={tokenomicsData.feeRecipient}
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </CompatGrid>
        
        {/* Compliance Modules */}
        <CompatGrid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Selected Compliance Modules
            </Typography>
            {selectedModules.length > 0 ? (
              <List>
                {selectedModules.map((moduleId) => (
                  <ListItem key={moduleId}>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary={getModuleName(moduleId)} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No optional compliance modules selected.
              </Typography>
            )}
          </Paper>
        </CompatGrid>
        
        {/* Deployment Cost Estimate */}
        <CompatGrid item xs={12} md={6}>
          <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <StarIcon sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Deployment Cost Estimate
                </Typography>
              </Box>
              <Divider sx={{ bgcolor: 'primary.contrastText', opacity: 0.1, my: 1 }} />
              <Typography variant="body2" paragraph>
                Estimated gas cost to deploy your asset:
              </Typography>
              <Typography variant="h4" component="div" gutterBottom>
                {calculateGasCost()} ETH
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                This is an estimate based on current gas prices and the complexity of your asset configuration.
                Actual costs may vary at the time of deployment.
              </Typography>
            </CardContent>
          </Card>
        </CompatGrid>
      </CompatGrid>
    </Box>
  );
};

export default AssetSummary; 