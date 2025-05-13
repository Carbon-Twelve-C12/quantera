import React, { useState } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Button, 
  TextField, 
  Divider, 
  FormControl,
  FormHelperText,
  CircularProgress
} from '@mui/material';
import { TemplateParameter } from '../../pages/SmartAccountPage';

interface CodeEditorProps {
  code: string;
  templateParameters: TemplateParameter[];
  onCodeChange: (newCode: string) => void;
  onDeploy: (params: Record<string, string>) => Promise<void>;
  isDeploying: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  templateParameters,
  onCodeChange,
  onDeploy,
  isDeploying
}) => {
  const [editorValue, setEditorValue] = useState<string>(code);
  const [parameters, setParameters] = useState<Record<string, string>>(() => {
    // Initialize parameters with default values if available
    const initialParams: Record<string, string> = {};
    templateParameters.forEach(param => {
      initialParams[param.name] = param.defaultValue || '';
    });
    return initialParams;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle code changes
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setEditorValue(newCode);
    onCodeChange(newCode);
  };

  // Handle parameter changes
  const handleParameterChange = (name: string, value: string) => {
    setParameters(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this parameter if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate parameters before deployment
  const validateParameters = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Check if any required parameters are empty
    templateParameters.forEach(param => {
      if (!parameters[param.name] || parameters[param.name].trim() === '') {
        newErrors[param.name] = 'This field is required';
        isValid = false;
      } else {
        // Validate based on parameter type
        switch (param.type) {
          case 'address':
            // Basic Ethereum address validation (starts with 0x followed by 40 hex chars)
            if (!/^0x[a-fA-F0-9]{40}$/.test(parameters[param.name])) {
              newErrors[param.name] = 'Invalid Ethereum address';
              isValid = false;
            }
            break;
          case 'uint256':
            // Validate it's a positive number
            if (!/^\d+$/.test(parameters[param.name])) {
              newErrors[param.name] = 'Must be a positive number';
              isValid = false;
            }
            break;
          case 'bool':
            // Validate it's 'true' or 'false'
            if (parameters[param.name] !== 'true' && parameters[param.name] !== 'false') {
              newErrors[param.name] = 'Must be "true" or "false"';
              isValid = false;
            }
            break;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Handle deployment
  const handleDeploy = async () => {
    if (!validateParameters()) return;
    await onDeploy(parameters);
  };

  return (
    <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }} elevation={2}>
      <Typography variant="h6" gutterBottom>
        Customize Your Smart Account
      </Typography>
      
      <Box sx={{ mt: 2, mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Template Parameters
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {templateParameters.map((param) => (
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 16px)' } }} key={param.name}>
              <FormControl fullWidth error={!!errors[param.name]}>
                <TextField
                  label={param.name}
                  value={parameters[param.name] || ''}
                  onChange={(e) => handleParameterChange(param.name, e.target.value)}
                  placeholder={param.type}
                  error={!!errors[param.name]}
                  disabled={isDeploying}
                  size="small"
                  fullWidth
                />
                {errors[param.name] && (
                  <FormHelperText>{errors[param.name]}</FormHelperText>
                )}
                <FormHelperText>{param.description}</FormHelperText>
              </FormControl>
            </Box>
          ))}
        </Box>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle2" gutterBottom>
        Smart Account Code
      </Typography>
      <TextField
        multiline
        rows={12}
        value={editorValue}
        onChange={handleCodeChange}
        fullWidth
        variant="outlined"
        InputProps={{
          sx: {
            fontFamily: 'monospace',
            fontSize: '0.875rem'
          }
        }}
        disabled={isDeploying}
        sx={{ mb: 3, flexGrow: 1 }}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleDeploy}
          disabled={isDeploying}
          startIcon={isDeploying ? <CircularProgress size={20} /> : undefined}
        >
          {isDeploying ? 'Deploying...' : 'Deploy Smart Account'}
        </Button>
      </Box>
    </Paper>
  );
};

export default CodeEditor; 