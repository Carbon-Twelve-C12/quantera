import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card,
  CardContent,
  CardHeader,
  CardActionArea,
  Chip,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import { AssetClass, ComplianceModule } from '../../types/assetTypes';
import VerifiedIcon from '@mui/icons-material/Verified';
import SecurityIcon from '@mui/icons-material/Security';
import DescriptionIcon from '@mui/icons-material/Description';
import GavelIcon from '@mui/icons-material/Gavel';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PublicIcon from '@mui/icons-material/Public';
import CompatGrid from '../common/CompatGrid';

// Mock modules for different categories
const mockModules: ComplianceModule[] = [
  {
    moduleId: 'kyc-aml-basic',
    name: 'KYC/AML Basic',
    description: 'Basic identity verification and anti-money laundering checks for individuals',
    isRequired: true,
    compatibleAssetClasses: [AssetClass.TREASURY, AssetClass.CORPORATE_BOND, AssetClass.ENVIRONMENTAL_ASSET]
  },
  {
    moduleId: 'kyc-aml-advanced',
    name: 'KYC/AML Advanced',
    description: 'Enhanced KYC and AML checks for high-value investors and institutions',
    isRequired: false,
    compatibleAssetClasses: [AssetClass.TREASURY, AssetClass.CORPORATE_BOND, AssetClass.REAL_ESTATE]
  },
  {
    moduleId: 'accredited-investor',
    name: 'Accredited Investor Verification',
    description: 'Verifies investor accreditation status according to SEC requirements',
    isRequired: false,
    compatibleAssetClasses: [AssetClass.REAL_ESTATE, AssetClass.CORPORATE_BOND, AssetClass.INFRASTRUCTURE]
  },
  {
    moduleId: 'transfer-restrictions',
    name: 'Transfer Restrictions',
    description: 'Enforces rules on who can send and receive tokens',
    isRequired: false,
    compatibleAssetClasses: [
      AssetClass.TREASURY, 
      AssetClass.REAL_ESTATE, 
      AssetClass.CORPORATE_BOND, 
      AssetClass.ENVIRONMENTAL_ASSET
    ]
  },
  {
    moduleId: 'tax-reporting',
    name: 'Tax Reporting',
    description: 'Automated tax document generation and reporting',
    isRequired: false,
    compatibleAssetClasses: [AssetClass.TREASURY, AssetClass.REAL_ESTATE, AssetClass.CORPORATE_BOND]
  },
  {
    moduleId: 'jurisdiction-restriction',
    name: 'Jurisdiction Restrictions',
    description: 'Enforces geographic restrictions on token holders',
    isRequired: false,
    compatibleAssetClasses: [
      AssetClass.TREASURY, 
      AssetClass.REAL_ESTATE, 
      AssetClass.CORPORATE_BOND, 
      AssetClass.ENVIRONMENTAL_ASSET,
      AssetClass.IP_RIGHT,
      AssetClass.INVOICE,
      AssetClass.COMMODITY,
      AssetClass.INFRASTRUCTURE
    ]
  },
  {
    moduleId: 'environmental-certification',
    name: 'Environmental Asset Certification',
    description: 'Tracks and verifies environmental asset certification and standards compliance',
    isRequired: true,
    compatibleAssetClasses: [AssetClass.ENVIRONMENTAL_ASSET]
  }
];

// Icon mapping for module categories
const moduleIcons: Record<string, React.ReactNode> = {
  'kyc-aml': <VerifiedIcon fontSize="large" color="primary" />,
  'accredited': <AccountBalanceIcon fontSize="large" color="primary" />,
  'transfer': <SecurityIcon fontSize="large" color="primary" />,
  'tax': <DescriptionIcon fontSize="large" color="primary" />,
  'jurisdiction': <PublicIcon fontSize="large" color="primary" />,
  'environmental': <GavelIcon fontSize="large" color="primary" />
};

interface ComplianceModulesProps {
  templateId: string;
  assetClass: AssetClass;
  selectedModules: string[];
  onToggleModule: (moduleId: string) => void;
}

const ComplianceModules: React.FC<ComplianceModulesProps> = ({
  templateId,
  assetClass,
  selectedModules,
  onToggleModule
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modules, setModules] = useState<ComplianceModule[]>([]);

  // In a real implementation, this would fetch modules from the API
  useEffect(() => {
    const fetchModules = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Mock API call - in real implementation, this would be:
        // const response = await api.getCompatibleModules(templateId, assetClass);
        // setModules(response.modules);
        
        // For now, filter mock modules by asset class
        const filteredModules = mockModules.filter(
          module => module.compatibleAssetClasses.includes(assetClass)
        );
        
        setTimeout(() => {
          setModules(filteredModules);
          setIsLoading(false);
        }, 500); // Simulate API delay
        
      } catch (err) {
        console.error('Error fetching compliance modules:', err);
        setError('Failed to load compliance modules. Please try again.');
        setIsLoading(false);
      }
    };
    
    if (assetClass) {
      fetchModules();
    }
  }, [templateId, assetClass]);

  // Helper to get module icon
  const getModuleIcon = (moduleId: string) => {
    if (moduleId.includes('kyc') || moduleId.includes('aml')) {
      return moduleIcons['kyc-aml'];
    } else if (moduleId.includes('accredited')) {
      return moduleIcons['accredited'];
    } else if (moduleId.includes('transfer')) {
      return moduleIcons['transfer'];
    } else if (moduleId.includes('tax')) {
      return moduleIcons['tax'];
    } else if (moduleId.includes('jurisdiction')) {
      return moduleIcons['jurisdiction'];
    } else if (moduleId.includes('environmental')) {
      return moduleIcons['environmental'];
    }
    return <SecurityIcon fontSize="large" color="primary" />;
  };

  if (!assetClass) {
    return (
      <Alert severity="warning">
        Please select an asset class first
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  // Group modules into categories: Required and Optional
  const requiredModules = modules.filter(module => module.isRequired);
  const optionalModules = modules.filter(module => !module.isRequired);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Compliance & Modules
      </Typography>
      <Typography variant="body1" paragraph>
        Select compliance modules and additional features for your {assetClass.replace('_', ' ').toLowerCase()} asset. Required modules cannot be disabled.
      </Typography>

      {/* Required Modules */}
      {requiredModules.length > 0 && (
        <Box mb={4}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Required Modules
          </Typography>
          <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              These modules are required for this asset class and cannot be disabled.
            </Alert>
            <CompatGrid container spacing={3}>
              {requiredModules.map((module) => (
                <CompatGrid item xs={12} key={module.moduleId}>
                  <Card 
                    sx={{ 
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      border: '1px solid #e0e0e0'
                    }}
                  >
                    <Box sx={{ display: 'flex', p: 2, alignItems: 'center', justifyContent: 'center', width: 80 }}>
                      {getModuleIcon(module.moduleId)}
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <CardContent sx={{ flexGrow: 1, py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" component="div">
                          {module.name}
                        </Typography>
                        <Chip 
                          label="Required" 
                          size="small" 
                          color="primary" 
                          sx={{ ml: 2 }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {module.description}
                      </Typography>
                    </CardContent>
                    <Box sx={{ display: 'flex', p: 2, alignItems: 'center' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={true}
                            disabled={true}
                            color="primary"
                          />
                        }
                        label=""
                      />
                    </Box>
                  </Card>
                </CompatGrid>
              ))}
            </CompatGrid>
          </Paper>
        </Box>
      )}

      {/* Optional Modules */}
      {optionalModules.length > 0 && (
        <Box>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Optional Modules
          </Typography>
          <CompatGrid container spacing={3}>
            {optionalModules.map((module) => (
              <CompatGrid item xs={12} key={module.moduleId}>
                <Card 
                  sx={{ 
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    border: selectedModules.includes(module.moduleId) ? '1px solid #3f51b5' : '1px solid #e0e0e0',
                    boxShadow: selectedModules.includes(module.moduleId) ? '0 4px 8px rgba(63, 81, 181, 0.2)' : 'none'
                  }}
                >
                  <Box sx={{ display: 'flex', p: 2, alignItems: 'center', justifyContent: 'center', width: 80 }}>
                    {getModuleIcon(module.moduleId)}
                  </Box>
                  <Divider orientation="vertical" flexItem />
                  <CardContent sx={{ flexGrow: 1, py: 2 }}>
                    <Typography variant="h6" component="div">
                      {module.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {module.description}
                    </Typography>
                  </CardContent>
                  <Box sx={{ display: 'flex', p: 2, alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={selectedModules.includes(module.moduleId)}
                          onChange={() => onToggleModule(module.moduleId)}
                          color="primary"
                        />
                      }
                      label=""
                    />
                  </Box>
                </Card>
              </CompatGrid>
            ))}
          </CompatGrid>
        </Box>
      )}

      {modules.length === 0 && (
        <Alert severity="info">
          No compliance modules found for {assetClass.replace('_', ' ').toLowerCase()} assets.
        </Alert>
      )}
    </Box>
  );
};

export default ComplianceModules; 