import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Checkbox, 
  FormControlLabel, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Chip, 
  CircularProgress, 
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VerifiedIcon from '@mui/icons-material/Verified';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import ErrorIcon from '@mui/icons-material/Error';
import CompatGrid from '../common/CompatGrid';
import { AssetClass, ComplianceModule } from '../../types/assetTypes';
import api from '../../api';

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
  const [modules, setModules] = useState<ComplianceModule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (templateId && assetClass) {
      fetchCompatibleModules();
    }
  }, [templateId, assetClass]);

  const fetchCompatibleModules = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.getCompatibleModules(templateId, assetClass);
      setModules(response.modules || []);
    } catch (err) {
      console.error('Error fetching compliance modules:', err);
      setError('Failed to load compliance modules. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // If we don't have real modules from the API yet, show these mock modules
  const mockModules: ComplianceModule[] = [
    {
      moduleId: 'kyc-aml',
      name: 'KYC/AML Verification',
      description: 'Ensures that all token holders have passed Know Your Customer and Anti-Money Laundering checks',
      isRequired: true,
      compatibleAssetClasses: [
        AssetClass.TREASURY, 
        AssetClass.REAL_ESTATE, 
        AssetClass.CORPORATE_BOND,
        AssetClass.ENVIRONMENTAL_ASSET
      ]
    },
    {
      moduleId: 'accredited-investor',
      name: 'Accredited Investor',
      description: 'Restricts token transfers to addresses that have been verified as accredited investors',
      isRequired: false,
      compatibleAssetClasses: [
        AssetClass.TREASURY, 
        AssetClass.REAL_ESTATE, 
        AssetClass.CORPORATE_BOND
      ]
    },
    {
      moduleId: 'transfer-restriction',
      name: 'Transfer Restrictions',
      description: 'Implements time-based or rule-based restrictions on token transfers',
      isRequired: false,
      compatibleAssetClasses: [
        AssetClass.TREASURY, 
        AssetClass.REAL_ESTATE, 
        AssetClass.CORPORATE_BOND,
        AssetClass.ENVIRONMENTAL_ASSET
      ]
    },
    {
      moduleId: 'tax-withholding',
      name: 'Tax Withholding',
      description: 'Automatically withholds and reports taxes on dividend distributions',
      isRequired: false,
      compatibleAssetClasses: [
        AssetClass.TREASURY, 
        AssetClass.REAL_ESTATE, 
        AssetClass.CORPORATE_BOND
      ]
    },
    {
      moduleId: 'environmental-verification',
      name: 'Environmental Verification',
      description: 'Verifies and tracks environmental credits through certification standards',
      isRequired: true,
      compatibleAssetClasses: [
        AssetClass.ENVIRONMENTAL_ASSET
      ]
    }
  ];

  // Use mock modules if none are available from API
  const availableModules = modules.length > 0 ? modules : mockModules.filter(
    module => module.compatibleAssetClasses.includes(assetClass)
  );

  if (!templateId || !assetClass) {
    return (
      <Alert severity="warning">
        Please select an asset class and template first
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

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Compliance & Modules
      </Typography>
      <Typography variant="body1" paragraph>
        Select the compliance modules to enable for your asset. Compliance modules ensure your asset adheres to regulatory requirements and implements specific functionality.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Required modules are automatically selected and cannot be disabled.
        </Typography>
      </Box>

      <CompatGrid container spacing={3}>
        {availableModules.map((module) => (
          <CompatGrid item xs={12} key={module.moduleId}>
            <Card 
              variant="outlined" 
              sx={{ 
                borderColor: module.isRequired ? 'primary.main' : 'divider',
                bgcolor: selectedModules.includes(module.moduleId) ? 'action.selected' : 'background.paper'
              }}
            >
              <CardContent sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedModules.includes(module.moduleId) || module.isRequired}
                          onChange={() => !module.isRequired && onToggleModule(module.moduleId)}
                          disabled={module.isRequired}
                          color="primary"
                        />
                      }
                      label={
                        <Typography variant="subtitle1" fontWeight="medium">
                          {module.name}
                        </Typography>
                      }
                    />
                    {module.isRequired && (
                      <Chip 
                        label="Required" 
                        size="small" 
                        color="primary" 
                        icon={<VerifiedIcon />}
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                  
                  <Box>
                    <Chip 
                      icon={module.moduleId === 'environmental-verification' ? <PublicIcon /> : <LockIcon />}
                      label={module.moduleId === 'environmental-verification' ? "Environmental" : "Regulatory"} 
                      size="small" 
                      color={module.moduleId === 'environmental-verification' ? "success" : "default"}
                      sx={{ ml: 1 }}
                    />
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ pl: 4 }}>
                  {module.description}
                </Typography>
              </CardContent>
              
              <Divider />
              
              <CardActions sx={{ justifyContent: 'flex-end', pt: 1, pb: 1 }}>
                <Button 
                  size="small" 
                  disabled={!selectedModules.includes(module.moduleId) && !module.isRequired}
                >
                  Configure
                </Button>
              </CardActions>
              
              {selectedModules.includes(module.moduleId) && module.moduleId === 'environmental-verification' && (
                <Box sx={{ px: 2, pb: 2 }}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>Verification Standards</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <CompatGrid container spacing={2}>
                        <CompatGrid item xs={12}>
                          <FormControlLabel
                            control={<Checkbox defaultChecked />}
                            label="Verra Verified Carbon Standard (VCS)"
                          />
                        </CompatGrid>
                        <CompatGrid item xs={12}>
                          <FormControlLabel
                            control={<Checkbox />}
                            label="Gold Standard"
                          />
                        </CompatGrid>
                        <CompatGrid item xs={12}>
                          <FormControlLabel
                            control={<Checkbox />}
                            label="Climate Action Reserve (CAR)"
                          />
                        </CompatGrid>
                        <CompatGrid item xs={12}>
                          <FormControlLabel
                            control={<Checkbox />}
                            label="American Carbon Registry (ACR)"
                          />
                        </CompatGrid>
                      </CompatGrid>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              )}
            </Card>
          </CompatGrid>
        ))}
        
        {availableModules.length === 0 && (
          <CompatGrid item xs={12}>
            <Alert 
              severity="info" 
              icon={<ErrorIcon />}
            >
              No compliance modules available for this asset class and template. Please contact support for assistance.
            </Alert>
          </CompatGrid>
        )}
      </CompatGrid>
    </Box>
  );
};

export default ComplianceModules; 