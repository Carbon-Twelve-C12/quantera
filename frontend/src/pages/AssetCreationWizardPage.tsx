import React, { useState, useEffect } from 'react';
import { Box, Container, Stepper, Step, StepLabel, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { AssetClass } from '../types/assetTypes';

// Step components
import AssetClassSelection from '../components/assetCreation/AssetClassSelection';
import TemplateSelection from '../components/assetCreation/TemplateSelection';
import AssetDetails from '../components/assetCreation/AssetDetails';
import TokenomicsConfiguration from '../components/assetCreation/TokenomicsConfiguration';
import ComplianceModules from '../components/assetCreation/ComplianceModules';
import AssetSummary from '../components/assetCreation/AssetSummary';

const steps = [
  'Select Asset Class',
  'Choose Template',
  'Set Asset Details',
  'Configure Tokenomics',
  'Compliance & Modules',
  'Review & Create'
];

const AssetCreationWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [assetData, setAssetData] = useState({
    assetClass: '' as AssetClass,
    templateId: '',
    name: '',
    symbol: '',
    description: '',
    totalSupply: '',
    decimals: 18,
    faceValue: '',
    issuanceDate: Math.floor(Date.now() / 1000),
    maturityDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // Default to 1 year from now
    yieldRate: '',
    metadataURI: '',
    imageUrl: '',
    customFields: {}
  });
  
  const [tokenomicsData, setTokenomicsData] = useState({
    hasTransferRestrictions: false,
    hasDividends: false,
    hasMaturity: true,
    hasRoyalties: false,
    feeRate: 25, // 0.25% default
    feeRecipient: '',
    customTokenomics: {}
  });
  
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  
  // Fetch templates when asset class changes
  useEffect(() => {
    if (assetData.assetClass) {
      fetchTemplates(assetData.assetClass);
    }
  }, [assetData.assetClass]);
  
  const fetchTemplates = async (assetClass: AssetClass) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.getTemplatesByClass(assetClass);
      setTemplates(response.templates || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to load templates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  const handleAssetDataChange = (field: string, value: any) => {
    setAssetData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };
  
  const handleTokenomicsChange = (field: string, value: any) => {
    setTokenomicsData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };
  
  const handleModuleToggle = (moduleId: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };
  
  const handleCreateAsset = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Prepare modules configuration
      const moduleConfigs = selectedModules.map(moduleId => ({
        moduleId,
        isEnabled: true,
        moduleData: '0x'
      }));
      
      // Call API to create asset
      const response = await api.createAsset({
        templateId: assetData.templateId,
        assetParams: {
          name: assetData.name,
          symbol: assetData.symbol,
          description: assetData.description,
          totalSupply: assetData.totalSupply,
          decimals: assetData.decimals,
          faceValue: assetData.faceValue,
          issuanceDate: assetData.issuanceDate,
          maturityDate: assetData.maturityDate,
          yieldRate: assetData.yieldRate,
          metadataURI: assetData.metadataURI,
          imageUrl: assetData.imageUrl,
          customFields: assetData.customFields
        },
        tokenomics: tokenomicsData,
        modules: moduleConfigs
      });
      
      // Navigate to the newly created asset
      navigate(`/assets/${response.assetId}`);
    } catch (err) {
      console.error('Error creating asset:', err);
      setError('Failed to create asset. Please check your inputs and try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <AssetClassSelection
            selectedClass={assetData.assetClass}
            onSelect={(assetClass) => handleAssetDataChange('assetClass', assetClass)}
          />
        );
      case 1:
        return (
          <TemplateSelection
            assetClass={assetData.assetClass}
            templates={templates}
            selectedTemplateId={assetData.templateId}
            onSelect={(templateId: string) => handleAssetDataChange('templateId', templateId)}
            isLoading={isLoading}
            error={error}
          />
        );
      case 2:
        return (
          <AssetDetails
            assetData={assetData}
            onChange={handleAssetDataChange}
          />
        );
      case 3:
        return (
          <TokenomicsConfiguration
            tokenomicsData={tokenomicsData}
            onChange={handleTokenomicsChange}
          />
        );
      case 4:
        return (
          <ComplianceModules
            templateId={assetData.templateId}
            assetClass={assetData.assetClass}
            selectedModules={selectedModules}
            onToggleModule={handleModuleToggle}
          />
        );
      case 5:
        return (
          <AssetSummary
            assetData={assetData}
            tokenomicsData={tokenomicsData}
            selectedModules={selectedModules}
          />
        );
      default:
        return 'Unknown step';
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Asset
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box sx={{ mb: 4 }}>
          {getStepContent(activeStep)}
        </Box>
        
        {error && (
          <Typography color="error" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0 || isLoading}
            onClick={handleBack}
          >
            Back
          </Button>
          
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateAsset}
                disabled={isLoading}
              >
                Create Asset
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                disabled={isLoading}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default AssetCreationWizardPage; 