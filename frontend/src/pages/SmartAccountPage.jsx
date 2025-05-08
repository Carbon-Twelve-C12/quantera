import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Tabs, 
  Tab, 
  TextField, 
  MenuItem, 
  CircularProgress, 
  Divider, 
  Alert, 
  Chip
} from '@mui/material';
import {
  Code as CodeIcon,
  PlayArrow as ExecuteIcon,
  Refresh as ResetIcon,
  Save as SaveIcon,
  History as HistoryIcon,
  FileCopy as TemplateIcon,
  Settings as SettingsIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-monokai';

// Sample account templates
const ACCOUNT_TEMPLATES = [
  {
    id: 'yield-reinvestment',
    name: 'Yield Reinvestment',
    description: 'Automatically reinvest yield from treasuries into the same asset',
    code: `// Yield Reinvestment Smart Account Template
// This template automatically reinvests yield from treasuries back into the same asset

function onYieldReceived(event) {
  const { treasury, amount, user } = event;
  
  // Check if yield amount is above minimum threshold
  if (amount > MIN_INVESTMENT_AMOUNT) {
    // Purchase more of the same treasury
    market.placeBuyOrder({
      treasuryId: treasury.id,
      amount: amount,
      price: treasury.currentPrice,
      user: user
    });
    
    // Log the reinvestment
    logger.info(\`Reinvested \${amount} into \${treasury.name}\`);
  } else {
    logger.info(\`Yield amount \${amount} below minimum threshold\`);
  }
}

// Configuration parameters
const MIN_INVESTMENT_AMOUNT = 10; // Minimum amount to reinvest
`
  },
  {
    id: 'portfolio-rebalancing',
    name: 'Portfolio Rebalancing',
    description: 'Automatically rebalance portfolio to maintain target allocation',
    code: `// Portfolio Rebalancing Smart Account Template
// This template automatically rebalances your portfolio to maintain target allocations

// Target allocation for each asset class (in percentage)
const TARGET_ALLOCATION = {
  'T-BILL': 40,
  'T-NOTE': 30, 
  'T-BOND': 20,
  'ENVIRONMENTAL': 10
};

// Tolerance before rebalancing (in percentage points)
const REBALANCE_TOLERANCE = 5;

function onPortfolioUpdate(event) {
  const { portfolio } = event;
  
  // Calculate current allocation
  const totalValue = portfolio.getTotalValue();
  const currentAllocation = {};
  
  portfolio.assets.forEach(asset => {
    const assetClass = asset.type;
    if (!currentAllocation[assetClass]) {
      currentAllocation[assetClass] = 0;
    }
    currentAllocation[assetClass] += (asset.value / totalValue) * 100;
  });
  
  // Check if rebalancing is needed
  let rebalancingNeeded = false;
  Object.keys(TARGET_ALLOCATION).forEach(assetClass => {
    const target = TARGET_ALLOCATION[assetClass];
    const current = currentAllocation[assetClass] || 0;
    
    if (Math.abs(target - current) > REBALANCE_TOLERANCE) {
      rebalancingNeeded = true;
    }
  });
  
  // Perform rebalancing if needed
  if (rebalancingNeeded) {
    logger.info("Rebalancing portfolio to match target allocation");
    
    // For each asset class, buy or sell to match target allocation
    Object.keys(TARGET_ALLOCATION).forEach(assetClass => {
      const target = TARGET_ALLOCATION[assetClass];
      const current = currentAllocation[assetClass] || 0;
      const targetValue = (totalValue * target) / 100;
      const currentValue = (totalValue * current) / 100;
      const valueDifference = targetValue - currentValue;
      
      if (valueDifference > 0) {
        // Need to buy more of this asset class
        portfolio.getBestAsset(assetClass).then(asset => {
          market.placeBuyOrder({
            treasuryId: asset.id,
            amount: valueDifference / asset.currentPrice,
            price: asset.currentPrice
          });
        });
      } else if (valueDifference < 0) {
        // Need to sell some of this asset class
        portfolio.getAssetsOfType(assetClass).then(assets => {
          // Sort by performance and sell worst performers first
          assets.sort((a, b) => a.performance - b.performance);
          
          let remainingToSell = Math.abs(valueDifference);
          for (const asset of assets) {
            if (remainingToSell <= 0) break;
            
            const sellAmount = Math.min(asset.value, remainingToSell);
            market.placeSellOrder({
              treasuryId: asset.id,
              amount: sellAmount / asset.currentPrice,
              price: asset.currentPrice
            });
            remainingToSell -= sellAmount;
          }
        });
      }
    });
  }
}
`
  },
  {
    id: 'environmental-impact',
    name: 'Environmental Impact Maximizer',
    description: 'Automatically allocate a portion of yields to maximize environmental impact',
    code: `// Environmental Impact Maximizer Smart Account Template
// This template automatically allocates a portion of yields to maximize environmental impact

// Configuration parameters
const IMPACT_ALLOCATION_PERCENTAGE = 25; // Percentage of yield to allocate to environmental assets
const MIN_YIELD_THRESHOLD = 50; // Minimum yield amount to trigger allocation
const PREFERRED_IMPACT_METRICS = ['carbon_offset_tons', 'land_area_protected_hectares']; // Prioritize these metrics

function onYieldReceived(event) {
  const { treasury, amount, user } = event;
  
  // Check if yield amount is above minimum threshold
  if (amount > MIN_YIELD_THRESHOLD) {
    // Calculate amount to allocate to environmental assets
    const allocationAmount = (amount * IMPACT_ALLOCATION_PERCENTAGE) / 100;
    
    // Get best environmental assets based on impact metrics
    environmentalAssets.getBestByImpact(PREFERRED_IMPACT_METRICS)
      .then(assets => {
        if (assets.length > 0) {
          // Distribute allocation across top 3 assets
          const topAssets = assets.slice(0, 3);
          const amountPerAsset = allocationAmount / topAssets.length;
          
          topAssets.forEach(asset => {
            // Purchase environmental asset
            market.placeBuyOrder({
              treasuryId: asset.id,
              amount: amountPerAsset / asset.currentPrice,
              price: asset.currentPrice,
              user: user
            });
            
            // Log the investment
            logger.info(\`Invested \${amountPerAsset} into environmental asset \${asset.name} for impact\`);
          });
          
          // Consider retiring a small portion for direct impact
          if (allocationAmount > 100) {
            const retirementAmount = allocationAmount * 0.1; // 10% of environmental allocation
            const retirementAsset = assets[0]; // Use highest impact asset
            
            environmentalAssets.retire({
              assetId: retirementAsset.id,
              amount: retirementAmount / retirementAsset.currentPrice,
              reason: "Automated impact maximization",
              user: user
            });
            
            logger.info(\`Retired \${retirementAmount} worth of \${retirementAsset.name} for direct environmental impact\`);
          }
        } else {
          logger.warn("No suitable environmental assets found for impact allocation");
        }
      });
      
    // Reinvest remaining yield
    const remainingAmount = amount - allocationAmount;
    market.placeBuyOrder({
      treasuryId: treasury.id,
      amount: remainingAmount / treasury.currentPrice,
      price: treasury.currentPrice,
      user: user
    });
  } else {
    logger.info(\`Yield amount \${amount} below minimum threshold for impact allocation\`);
  }
}
`
  }
];

const SmartAccountPage = () => {
  const { currentUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [editorContent, setEditorContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [accountStatus, setAccountStatus] = useState('inactive');
  const [deploymentStatus, setDeploymentStatus] = useState('');
  const [executionOutput, setExecutionOutput] = useState([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [editorTheme, setEditorTheme] = useState('github');
  
  // Load user's smart account if available
  useEffect(() => {
    if (currentUser) {
      // In real implementation, fetch the user's smart account code from backend
      // For demo, we'll just use the first template
      setAccountStatus('active');
      setEditorContent(ACCOUNT_TEMPLATES[0].code);
      setSelectedTemplate(ACCOUNT_TEMPLATES[0].id);
    }
  }, [currentUser]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleTemplateChange = (event) => {
    const templateId = event.target.value;
    setSelectedTemplate(templateId);
    
    if (templateId) {
      const template = ACCOUNT_TEMPLATES.find(t => t.id === templateId);
      setEditorContent(template.code);
    }
  };
  
  const handleDeploy = () => {
    setIsDeploying(true);
    setDeploymentStatus('deploying');
    
    // Simulate deployment process
    setTimeout(() => {
      setIsDeploying(false);
      setDeploymentStatus('success');
      setAccountStatus('active');
      
      // Add deployment success to execution output
      setExecutionOutput(prev => [...prev, {
        type: 'info',
        message: `Smart account deployed successfully at ${new Date().toISOString()}`
      }]);
      
      // Reset deployment status after 3 seconds
      setTimeout(() => {
        setDeploymentStatus('');
      }, 3000);
    }, 2000);
  };
  
  const handleExecute = () => {
    setIsExecuting(true);
    
    // Simulate execution process
    setTimeout(() => {
      setIsExecuting(false);
      
      // Add execution results to output
      setExecutionOutput(prev => [
        ...prev, 
        {
          type: 'info',
          message: `Execution started at ${new Date().toISOString()}`
        },
        {
          type: 'success',
          message: `Successfully processed portfolio balance assessment`
        },
        {
          type: 'info',
          message: `Current allocation: T-BILL: 42%, T-NOTE: 28%, T-BOND: 18%, ENVIRONMENTAL: 12%`
        },
        {
          type: 'info',
          message: `No rebalancing needed, all allocations within tolerance`
        }
      ]);
    }, 2000);
  };
  
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the editor? This will discard any unsaved changes.')) {
      if (selectedTemplate) {
        const template = ACCOUNT_TEMPLATES.find(t => t.id === selectedTemplate);
        setEditorContent(template.code);
      } else {
        setEditorContent('');
      }
    }
  };
  
  const handleSave = () => {
    // In a real implementation, this would save the code to the backend
    setExecutionOutput(prev => [...prev, {
      type: 'success',
      message: `Smart account code saved successfully at ${new Date().toISOString()}`
    }]);
  };
  
  const handleClearOutput = () => {
    setExecutionOutput([]);
  };
  
  const getDeploymentStatusColor = () => {
    switch (deploymentStatus) {
      case 'deploying':
        return 'warning';
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };
  
  const getDeploymentStatusText = () => {
    switch (deploymentStatus) {
      case 'deploying':
        return 'Deploying...';
      case 'success':
        return 'Deployed Successfully';
      case 'error':
        return 'Deployment Failed';
      default:
        return '';
    }
  };
  
  const getStatusBadge = () => {
    switch (accountStatus) {
      case 'active':
        return <Chip label="Active" color="success" size="small" />;
      case 'inactive':
        return <Chip label="Inactive" color="default" size="small" />;
      case 'error':
        return <Chip label="Error" color="error" size="small" />;
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" gutterBottom>
        Smart Account Dashboard
        <Box component="span" sx={{ ml: 2 }}>
          {getStatusBadge()}
        </Box>
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Create and manage automated behaviors for your portfolio using smart accounts.
        These programmable accounts can automate trading strategies, yield reinvestment, and more.
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="smart account tabs">
          <Tab icon={<CodeIcon />} iconPosition="start" label="Code Editor" />
          <Tab icon={<HistoryIcon />} iconPosition="start" label="Execution History" />
          <Tab icon={<SettingsIcon />} iconPosition="start" label="Settings" />
        </Tabs>
      </Box>
      
      {/* Code Editor Tab */}
      <Box sx={{ display: tabValue === 0 ? 'block' : 'none' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={9}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">
                    Smart Account Code
                  </Typography>
                  <Box>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      color="primary"
                      onClick={() => setEditorTheme(editorTheme === 'github' ? 'monokai' : 'github')}
                      sx={{ mr: 1 }}
                    >
                      Toggle Theme
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      color="error"
                      onClick={handleReset}
                      startIcon={<ResetIcon />}
                      sx={{ mr: 1 }}
                    >
                      Reset
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      color="primary"
                      onClick={handleSave}
                      startIcon={<SaveIcon />}
                    >
                      Save
                    </Button>
                  </Box>
                </Box>
                
                <AceEditor
                  mode="javascript"
                  theme={editorTheme}
                  name="smart-account-editor"
                  onChange={setEditorContent}
                  value={editorContent}
                  width="100%"
                  height="500px"
                  fontSize={14}
                  showPrintMargin={false}
                  showGutter={true}
                  highlightActiveLine={true}
                  setOptions={{
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: true,
                    showLineNumbers: true,
                    tabSize: 2,
                  }}
                />
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    {deploymentStatus && (
                      <Chip 
                        label={getDeploymentStatusText()} 
                        color={getDeploymentStatusColor()} 
                        sx={{ mr: 1 }}
                      />
                    )}
                  </Box>
                  <Box>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={handleDeploy}
                      disabled={isDeploying || !editorContent}
                      startIcon={isDeploying ? <CircularProgress size={20} color="inherit" /> : null}
                      sx={{ mr: 1 }}
                    >
                      {isDeploying ? 'Deploying...' : 'Deploy'}
                    </Button>
                    <Button 
                      variant="contained" 
                      color="success"
                      onClick={handleExecute}
                      disabled={isExecuting || accountStatus !== 'active'}
                      startIcon={isExecuting ? <CircularProgress size={20} color="inherit" /> : <ExecuteIcon />}
                    >
                      {isExecuting ? 'Executing...' : 'Execute'}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">
                    Execution Output
                  </Typography>
                  <Button 
                    variant="text" 
                    size="small" 
                    onClick={handleClearOutput}
                  >
                    Clear
                  </Button>
                </Box>
                
                <Box 
                  sx={{ 
                    bgcolor: '#f5f5f5', 
                    p: 2, 
                    borderRadius: 1,
                    height: '200px',
                    overflowY: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                  }}
                >
                  {executionOutput.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      No execution output yet. Deploy and execute your smart account to see results here.
                    </Typography>
                  ) : (
                    executionOutput.map((output, index) => (
                      <Box 
                        key={index}
                        sx={{ 
                          mb: 1, 
                          color: output.type === 'error' ? 'error.main' : 
                                 output.type === 'success' ? 'success.main' : 
                                 'text.primary'
                        }}
                      >
                        {output.message}
                      </Box>
                    ))
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Templates
                </Typography>
                <TextField
                  select
                  fullWidth
                  label="Choose a template"
                  value={selectedTemplate}
                  onChange={handleTemplateChange}
                  helperText="Select a pre-built template to get started"
                  margin="normal"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {ACCOUNT_TEMPLATES.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name}
                    </MenuItem>
                  ))}
                </TextField>
                
                {selectedTemplate && (
                  <Box mt={2}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {ACCOUNT_TEMPLATES.find(t => t.id === selectedTemplate)?.description}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Documentation
                </Typography>
                <Typography variant="body2" paragraph>
                  Smart accounts enable you to automate complex behaviors for your portfolio.
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Available APIs:
                </Typography>
                <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                  <Typography component="li" variant="body2">
                    <strong>market</strong> - Place orders, check prices
                  </Typography>
                  <Typography component="li" variant="body2">
                    <strong>portfolio</strong> - Get holdings, value, performance
                  </Typography>
                  <Typography component="li" variant="body2">
                    <strong>environmentalAssets</strong> - Manage environmental assets
                  </Typography>
                  <Typography component="li" variant="body2">
                    <strong>logger</strong> - Log messages and debug
                  </Typography>
                </Box>
                
                <Button 
                  variant="outlined" 
                  fullWidth
                  startIcon={<InfoIcon />}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    window.alert('Full documentation would open here');
                  }}
                >
                  View Full Documentation
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
      
      {/* Execution History Tab */}
      <Box sx={{ display: tabValue === 1 ? 'block' : 'none' }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Execution History
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              This section shows the history of your smart account executions, including triggers, actions taken, and results.
            </Alert>
            
            {/* Sample execution history entries */}
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1">
                    Portfolio Rebalancing
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Today, 2:15 PM
                  </Typography>
                </Box>
                <Typography variant="body2" gutterBottom>
                  Trigger: Portfolio update event
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Rebalanced portfolio: Sold 5 T-BILL units, Purchased 3 ENVIRONMENTAL units
                </Typography>
                <Chip label="Completed" color="success" size="small" />
              </CardContent>
            </Card>
            
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1">
                    Yield Reinvestment
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Yesterday, 10:45 AM
                  </Typography>
                </Box>
                <Typography variant="body2" gutterBottom>
                  Trigger: Yield received event ($125.50)
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Reinvested $125.50 into T-NOTE treasury
                </Typography>
                <Chip label="Completed" color="success" size="small" />
              </CardContent>
            </Card>
            
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1">
                    Environmental Impact Allocation
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last Week, 3:30 PM
                  </Typography>
                </Box>
                <Typography variant="body2" gutterBottom>
                  Trigger: Yield received event ($350.75)
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Allocated $87.69 to Environmental Assets, Retired 0.5 carbon credits
                </Typography>
                <Chip label="Completed" color="success" size="small" />
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </Box>
      
      {/* Settings Tab */}
      <Box sx={{ display: tabValue === 2 ? 'block' : 'none' }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Smart Account Settings
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Execution Settings
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <TextField
                    select
                    fullWidth
                    label="Execution Mode"
                    value="automatic"
                    margin="normal"
                  >
                    <MenuItem value="automatic">Automatic</MenuItem>
                    <MenuItem value="manual">Manual Only</MenuItem>
                    <MenuItem value="approval">Require Approval</MenuItem>
                  </TextField>
                  <TextField
                    select
                    fullWidth
                    label="Execution Frequency Limit"
                    value="daily"
                    margin="normal"
                  >
                    <MenuItem value="hourly">Hourly</MenuItem>
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="none">No Limit</MenuItem>
                  </TextField>
                  <TextField
                    type="number"
                    fullWidth
                    label="Gas Price Limit (gwei)"
                    defaultValue="50"
                    margin="normal"
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Notification Settings
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <TextField
                    select
                    fullWidth
                    label="Execution Notifications"
                    value="all"
                    margin="normal"
                  >
                    <MenuItem value="all">All Executions</MenuItem>
                    <MenuItem value="errors">Errors Only</MenuItem>
                    <MenuItem value="none">None</MenuItem>
                  </TextField>
                  <TextField
                    select
                    fullWidth
                    label="Notification Method"
                    value="email"
                    margin="normal"
                  >
                    <MenuItem value="email">Email</MenuItem>
                    <MenuItem value="push">Push Notification</MenuItem>
                    <MenuItem value="both">Both</MenuItem>
                  </TextField>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Security Settings
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <TextField
                    select
                    fullWidth
                    label="Transaction Value Limit"
                    value="1000"
                    margin="normal"
                  >
                    <MenuItem value="100">$100</MenuItem>
                    <MenuItem value="500">$500</MenuItem>
                    <MenuItem value="1000">$1,000</MenuItem>
                    <MenuItem value="5000">$5,000</MenuItem>
                    <MenuItem value="unlimited">Unlimited</MenuItem>
                  </TextField>
                  <TextField
                    select
                    fullWidth
                    label="Require Multi-Signature for High Value"
                    value="yes"
                    margin="normal"
                  >
                    <MenuItem value="yes">Yes</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                  </TextField>
                </Box>
              </Grid>
            </Grid>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button variant="outlined" sx={{ mr: 1 }}>
                Cancel
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => {
                  setExecutionOutput(prev => [...prev, {
                    type: 'success',
                    message: `Settings saved successfully at ${new Date().toISOString()}`
                  }]);
                }}
              >
                Save Settings
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default SmartAccountPage; 