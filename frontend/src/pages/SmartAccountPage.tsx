import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useSmartAccountOperations } from '../hooks/useSmartAccountOperations';
import { Container, Typography, Box, Tabs, Tab, Button, CircularProgress, Alert } from '@mui/material';
import AccountList from '../components/smartAccount/AccountList';
import AccountDetails from '../components/smartAccount/AccountDetails';
import TemplateSelector from '../components/smartAccount/TemplateSelector';
import CodeEditor from '../components/smartAccount/CodeEditor';
import OperationsHistory from '../components/smartAccount/OperationsHistory';
import api from '../api/api';

// Smart account template types
export interface SmartAccountTemplate {
  id: string;
  name: string;
  description: string;
  code: string;
  parameters: TemplateParameter[];
}

// Template parameter definition
export interface TemplateParameter {
  name: string;
  type: 'address' | 'uint256' | 'bool' | 'string';
  description: string;
  defaultValue?: string;
}

// Smart account data structure
export interface SmartAccount {
  id: string;
  owner: string;
  name: string;
  createdAt: number;
  templateId: string;
  status: 'ACTIVE' | 'PAUSED' | 'REVOKED';
  delegates: string[];
  balance: string;
}

// Value type for tab panel
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab panel component
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`smart-account-tabpanel-${index}`}
      aria-labelledby={`smart-account-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SmartAccountPage: React.FC = () => {
  const { address, connected } = useWallet();
  const [accounts, setAccounts] = useState<SmartAccount[]>([]);
  const [templates, setTemplates] = useState<SmartAccountTemplate[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<SmartAccount | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<SmartAccountTemplate | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
  const [customCode, setCustomCode] = useState<string>('');
  
  // Get operations for currently selected account
  const operations = useSmartAccountOperations(selectedAccount?.id);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Fetch user's smart accounts
  const fetchAccounts = async () => {
    if (!address) return;

    try {
      setLoading(true);
      const response = await api.get(`/api/users/${address}/smart-account`);
      setAccounts((response.data as unknown) as SmartAccount[]);
      setError(null);
    } catch (err) {
      console.error('Error fetching smart accounts:', err);
      setError('Failed to load your smart accounts');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available templates
  const fetchTemplates = async () => {
    try {
      const response = await api.get('/api/smart-account/templates');
      setTemplates((response.data as unknown) as SmartAccountTemplate[]);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setTemplates([]);
    }
  };

  // Handle account selection
  const handleAccountSelect = (account: SmartAccount) => {
    setSelectedAccount(account);
    setTabValue(0); // Switch to details tab
  };

  // Handle template selection
  const handleTemplateSelect = (template: SmartAccountTemplate) => {
    setSelectedTemplate(template);
    setCustomCode(template.code);
  };

  // Handle code changes in editor
  const handleCodeChange = (newCode: string) => {
    setCustomCode(newCode);
  };

  // Deploy new smart account
  const handleDeploy = async (params: Record<string, string>) => {
    if (!address || !selectedTemplate) return;

    try {
      setDeploymentStatus('deploying');
      await api.post(`/api/users/${address}/smart-account`, {
        templateId: selectedTemplate.id,
        parameters: params,
        customCode: customCode
      });
      
      // Refresh accounts list
      await fetchAccounts();
      setDeploymentStatus('success');
      
      // Reset state
      setTimeout(() => {
        setDeploymentStatus('idle');
        setSelectedTemplate(null);
        setCustomCode('');
        setTabValue(0); // Go to accounts list
      }, 3000);
      
    } catch (err) {
      console.error('Error deploying smart account:', err);
      setDeploymentStatus('error');
    }
  };

  // Delete/revoke smart account
  const handleRevokeAccount = async (accountId: string) => {
    try {
      await api.delete(`/api/users/${address}/smart-account/${accountId}`);
      await fetchAccounts();
      if (selectedAccount?.id === accountId) {
        setSelectedAccount(null);
      }
    } catch (err) {
      console.error('Error revoking smart account:', err);
      setError('Failed to revoke smart account');
    }
  };

  // Pause/resume smart account
  const handleToggleAccountStatus = async (accountId: string, newStatus: 'ACTIVE' | 'PAUSED') => {
    try {
      await api.put(`/api/users/${address}/smart-account/${accountId}/status`, {
        status: newStatus
      });
      await fetchAccounts();
      
      // Update selected account if it's the one being modified
      if (selectedAccount?.id === accountId) {
        setSelectedAccount(prev => 
          prev ? { ...prev, status: newStatus } : null
        );
      }
    } catch (err) {
      console.error('Error updating smart account status:', err);
      setError('Failed to update smart account status');
    }
  };

  // Fetch accounts and templates on component mount or when wallet changes
  useEffect(() => {
    if (connected && address) {
      fetchAccounts();
      fetchTemplates();
    } else {
      setAccounts([]);
      setSelectedAccount(null);
    }
  }, [connected, address, fetchAccounts, fetchTemplates]);

  if (!connected) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Smart Account Management
          </Typography>
          <Alert severity="info">
            Please connect your wallet to access Smart Account features
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Smart Account Management
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {deploymentStatus === 'success' && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Smart account deployed successfully!
          </Alert>
        )}
        
        {deploymentStatus === 'error' && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to deploy smart account. Please try again.
          </Alert>
        )}
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="smart account tabs">
            <Tab label="My Accounts" id="smart-account-tab-0" />
            <Tab label="Create New Account" id="smart-account-tab-1" />
            {selectedAccount && (
              <Tab label="Operations History" id="smart-account-tab-2" />
            )}
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : accounts.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
              <AccountList 
                accounts={accounts} 
                selectedAccountId={selectedAccount?.id} 
                onSelectAccount={handleAccountSelect}
              />
              
              {selectedAccount && (
                <AccountDetails 
                  account={selectedAccount}
                  onRevokeAccount={handleRevokeAccount}
                  onToggleStatus={handleToggleAccountStatus}
                />
              )}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', my: 4 }}>
              <Typography variant="body1" gutterBottom>
                You don't have any smart accounts yet.
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => setTabValue(1)}
                sx={{ mt: 2 }}
              >
                Create Your First Smart Account
              </Button>
            </Box>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
            <TemplateSelector 
              templates={templates} 
              selectedTemplateId={selectedTemplate?.id} 
              onSelectTemplate={handleTemplateSelect}
            />
            
            {selectedTemplate && (
              <Box sx={{ flex: 1 }}>
                <CodeEditor 
                  code={customCode} 
                  templateParameters={selectedTemplate.parameters}
                  onCodeChange={handleCodeChange}
                  onDeploy={handleDeploy}
                  isDeploying={deploymentStatus === 'deploying'}
                />
              </Box>
            )}
          </Box>
        </TabPanel>
        
        {selectedAccount && (
          <TabPanel value={tabValue} index={2}>
            <OperationsHistory 
              accountId={selectedAccount.id}
              operations={operations.operations || []}
            />
          </TabPanel>
        )}
      </Box>
    </Container>
  );
};

export default SmartAccountPage; 