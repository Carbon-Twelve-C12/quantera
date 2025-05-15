import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Tabs, 
  Tab, 
  TextField, 
  InputAdornment,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Card,
  CardContent,
  Divider,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  Stack,
  Link
} from '@mui/material';
import CompatGrid from '../components/common/CompatGrid';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import CodeIcon from '@mui/icons-material/Code';
import SecurityIcon from '@mui/icons-material/Security';
import DescriptionIcon from '@mui/icons-material/Description';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import TokenIcon from '@mui/icons-material/Token';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import StorageIcon from '@mui/icons-material/Storage';
import ArticleIcon from '@mui/icons-material/Article';
import LaunchIcon from '@mui/icons-material/Launch';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';

// Import for code syntax highlighting
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

interface Contract {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  version: string;
  audited: boolean;
  deploymentDate: string;
  code: string;
  abiUrl: string;
  etherscanUrl: string;
  functions: Function[];
}

interface Function {
  name: string;
  description: string;
  inputs: FunctionParameter[];
  outputs: FunctionParameter[];
  visibility: string;
  stateMutability: string;
}

interface FunctionParameter {
  name: string;
  type: string;
  description: string;
}

// Mock data for contracts
const mockContracts: Contract[] = [
  {
    id: 'l2bridge',
    name: 'L2Bridge',
    description: 'Facilitates asset bridging between Layer 1 and Layer 2 networks',
    category: 'infrastructure',
    address: '0x1234567890123456789012345678901234567890',
    version: '1.0.0',
    audited: true,
    deploymentDate: '2023-11-15',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract L2Bridge is Ownable {
    // Events
    event Deposit(address indexed user, address indexed token, uint256 amount);
    event Withdrawal(address indexed user, address indexed token, uint256 amount);
    
    // State variables
    mapping(address => mapping(address => uint256)) public deposits;
    
    // External functions
    function deposit(address token, uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        deposits[msg.sender][token] += amount;
        emit Deposit(msg.sender, token, amount);
    }
    
    function withdraw(address token, uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(deposits[msg.sender][token] >= amount, "Insufficient balance");
        deposits[msg.sender][token] -= amount;
        IERC20(token).transfer(msg.sender, amount);
        emit Withdrawal(msg.sender, token, amount);
    }
}`,
    abiUrl: 'https://api.quantera.io/abi/L2Bridge.json',
    etherscanUrl: 'https://etherscan.io/address/0x1234567890123456789012345678901234567890',
    functions: [
      {
        name: 'deposit',
        description: 'Deposits tokens from L1 to be bridged to L2',
        inputs: [
          { name: 'token', type: 'address', description: 'The token contract address' },
          { name: 'amount', type: 'uint256', description: 'Amount of tokens to deposit' }
        ],
        outputs: [],
        visibility: 'external',
        stateMutability: 'nonpayable'
      },
      {
        name: 'withdraw',
        description: 'Withdraws tokens from the bridge back to L1',
        inputs: [
          { name: 'token', type: 'address', description: 'The token contract address' },
          { name: 'amount', type: 'uint256', description: 'Amount of tokens to withdraw' }
        ],
        outputs: [],
        visibility: 'external',
        stateMutability: 'nonpayable'
      }
    ]
  },
  {
    id: 'smartaccount',
    name: 'SmartAccount',
    description: 'Account abstraction implementation for Quantera platform',
    category: 'accounts',
    address: '0x0987654321098765432109876543210987654321',
    version: '2.1.0',
    audited: true,
    deploymentDate: '2023-12-01',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SmartAccount is ReentrancyGuard {
    using ECDSA for bytes32;
    
    address public owner;
    uint256 public nonce;
    
    constructor(address _owner) {
        owner = _owner;
    }
    
    function executeTransaction(
        address target,
        uint256 value,
        bytes calldata data,
        bytes calldata signature
    ) external nonReentrant returns (bytes memory) {
        // Verify signature
        bytes32 hash = keccak256(abi.encodePacked(target, value, data, nonce));
        address signer = hash.toEthSignedMessageHash().recover(signature);
        require(signer == owner, "Invalid signature");
        
        // Increment nonce
        nonce++;
        
        // Execute transaction
        (bool success, bytes memory result) = target.call{value: value}(data);
        require(success, "Transaction failed");
        
        return result;
    }
}`,
    abiUrl: 'https://api.quantera.io/abi/SmartAccount.json',
    etherscanUrl: 'https://etherscan.io/address/0x0987654321098765432109876543210987654321',
    functions: [
      {
        name: 'executeTransaction',
        description: 'Executes a transaction on behalf of the account owner',
        inputs: [
          { name: 'target', type: 'address', description: 'Target contract address' },
          { name: 'value', type: 'uint256', description: 'ETH value to send' },
          { name: 'data', type: 'bytes', description: 'Transaction data' },
          { name: 'signature', type: 'bytes', description: 'Owner signature' }
        ],
        outputs: [
          { name: '', type: 'bytes', description: 'Transaction result data' }
        ],
        visibility: 'external',
        stateMutability: 'nonpayable'
      }
    ]
  },
  {
    id: 'assetfactory',
    name: 'AssetFactory',
    description: 'Factory contract for creating new tokenized assets',
    category: 'assets',
    address: '0x5678901234567890123456789012345678901234',
    version: '1.2.0',
    audited: true,
    deploymentDate: '2023-10-10',
    code: `// Code snippet...`,
    abiUrl: 'https://api.quantera.io/abi/AssetFactory.json',
    etherscanUrl: 'https://etherscan.io/address/0x5678901234567890123456789012345678901234',
    functions: []
  },
  {
    id: 'treasurymanager',
    name: 'TreasuryManager',
    description: 'Manages treasury asset issuance and redemption',
    category: 'treasury',
    address: '0x4567890123456789012345678901234567890123',
    version: '1.0.0',
    audited: false,
    deploymentDate: '2023-12-15',
    code: `// Code snippet...`,
    abiUrl: 'https://api.quantera.io/abi/TreasuryManager.json',
    etherscanUrl: 'https://etherscan.io/address/0x4567890123456789012345678901234567890123',
    functions: []
  },
  {
    id: 'liquiditypair',
    name: 'ConcentratedLiquidityPair',
    description: 'Implements concentrated liquidity AMM functionality',
    category: 'liquidity',
    address: '0x3456789012345678901234567890123456789012',
    version: '1.1.0',
    audited: true,
    deploymentDate: '2023-09-20',
    code: `// Code snippet...`,
    abiUrl: 'https://api.quantera.io/abi/ConcentratedLiquidityPair.json',
    etherscanUrl: 'https://etherscan.io/address/0x3456789012345678901234567890123456789012',
    functions: []
  },
];

// Categories for grouping contracts
const categories = [
  { id: 'accounts', name: 'Accounts', icon: <AccountBalanceWalletIcon /> },
  { id: 'assets', name: 'Assets', icon: <TokenIcon /> },
  { id: 'treasury', name: 'Treasury', icon: <LocalAtmIcon /> },
  { id: 'liquidity', name: 'Liquidity', icon: <WaterDropIcon /> },
  { id: 'infrastructure', name: 'Infrastructure', icon: <StorageIcon /> },
];

const ContractExplorerPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Filter contracts based on search and category
  const filteredContracts = mockContracts.filter(contract => {
    const matchesSearch = !searchQuery || 
      contract.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || contract.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Select a contract when clicking on it
  const handleContractSelect = (contract: Contract) => {
    setSelectedContract(contract);
    setActiveTab(0); // Reset to first tab
  };

  // Handle tab changes in contract details
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Contract Explorer
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Explore and understand the smart contracts that power the Quantera platform
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left sidebar - Categories and Contract List */}
        <CompatGrid item xs={12} md={3}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Search contracts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              Categories
            </Typography>
            <List disablePadding>
              {categories.map((category) => (
                <ListItem key={category.id} disablePadding>
                  <ListItemButton
                    selected={selectedCategory === category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    sx={{ borderRadius: 1 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {category.icon}
                    </ListItemIcon>
                    <ListItemText primary={category.name} />
                    <Chip 
                      size="small" 
                      label={mockContracts.filter(c => c.category === category.id).length} 
                      sx={{ ml: 1 }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              Contracts {filteredContracts.length > 0 && `(${filteredContracts.length})`}
            </Typography>
            
            {filteredContracts.length > 0 ? (
              <List disablePadding>
                {filteredContracts.map((contract) => (
                  <ListItem
                    key={contract.id}
                    disablePadding
                    sx={{ mb: 1 }}
                  >
                    <ListItemButton
                      selected={selectedContract?.id === contract.id}
                      onClick={() => handleContractSelect(contract)}
                      sx={{ 
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <ListItemText
                        primary={contract.name}
                        secondary={contract.description.slice(0, 60) + (contract.description.length > 60 ? '...' : '')}
                        primaryTypographyProps={{ fontWeight: 'medium' }}
                      />
                      {contract.audited && (
                        <Tooltip title="Audited">
                          <CheckCircleIcon color="success" fontSize="small" />
                        </Tooltip>
                      )}
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No contracts found
                </Typography>
              </Box>
            )}
          </Paper>
        </CompatGrid>

        {/* Right main content - Contract details */}
        <CompatGrid item xs={12} md={9}>
          {selectedContract ? (
            <Paper sx={{ p: 3 }}>
              {/* Contract header */}
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h5" component="h2">
                      {selectedContract.name}
                    </Typography>
                    <Chip 
                      label={`v${selectedContract.version}`} 
                      size="small" 
                      sx={{ ml: 2 }}
                    />
                    {selectedContract.audited ? (
                      <Chip 
                        icon={<CheckCircleIcon />}
                        label="Audited" 
                        size="small" 
                        color="success"
                        sx={{ ml: 1 }}
                      />
                    ) : (
                      <Chip 
                        icon={<WarningIcon />}
                        label="Unaudited" 
                        size="small" 
                        color="warning"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                  <Typography variant="body1" color="text.secondary">
                    {selectedContract.description}
                  </Typography>
                </Box>
                <Button 
                  variant="outlined" 
                  startIcon={<LaunchIcon />}
                  href={selectedContract.etherscanUrl}
                  target="_blank"
                >
                  View on Etherscan
                </Button>
              </Box>

              {/* Contract metadata */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <CompatGrid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Contract Address
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {selectedContract.address}
                        </Typography>
                        <IconButton size="small" sx={{ ml: 1 }}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </CompatGrid>
                <CompatGrid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Category
                      </Typography>
                      <Typography variant="body2">
                        {categories.find(c => c.id === selectedContract.category)?.name}
                      </Typography>
                    </CardContent>
                  </Card>
                </CompatGrid>
                <CompatGrid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Deployment Date
                      </Typography>
                      <Typography variant="body2">
                        {selectedContract.deploymentDate}
                      </Typography>
                    </CardContent>
                  </Card>
                </CompatGrid>
              </Grid>

              {/* Tabs for contract details */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange} 
                  aria-label="contract details tabs"
                >
                  <Tab 
                    icon={<CodeIcon />} 
                    iconPosition="start" 
                    label="Source Code" 
                  />
                  <Tab 
                    icon={<DescriptionIcon />} 
                    iconPosition="start" 
                    label="Functions" 
                  />
                  <Tab 
                    icon={<SecurityIcon />} 
                    iconPosition="start" 
                    label="Security" 
                  />
                  <Tab 
                    icon={<ArticleIcon />} 
                    iconPosition="start" 
                    label="Documentation" 
                  />
                </Tabs>
              </Box>

              {/* Tab content */}
              <Box>
                {/* Source Code Tab */}
                {activeTab === 0 && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">Source Code</Typography>
                      <Button
                        size="small"
                        endIcon={<ContentCopyIcon />}
                      >
                        Copy Code
                      </Button>
                    </Box>
                    <Box sx={{ borderRadius: 1, overflow: 'hidden' }}>
                      <SyntaxHighlighter
                        language="solidity"
                        style={atomOneDark}
                        showLineNumbers
                        customStyle={{ margin: 0 }}
                      >
                        {selectedContract.code}
                      </SyntaxHighlighter>
                    </Box>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        endIcon={<LaunchIcon />}
                        href={selectedContract.abiUrl}
                        target="_blank"
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        Download ABI
                      </Button>
                      <Button
                        variant="outlined"
                        endIcon={<LaunchIcon />}
                        href="#" // Add a dummy href to fix the type error
                        target="_blank"
                        size="small"
                      >
                        View Full Source
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* Functions Tab */}
                {activeTab === 1 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>Contract Functions</Typography>
                    {selectedContract.functions.length > 0 ? (
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="medium">
                          <TableHead>
                            <TableRow>
                              <TableCell width="20%">Function Name</TableCell>
                              <TableCell width="40%">Description</TableCell>
                              <TableCell width="20%">Inputs</TableCell>
                              <TableCell width="20%">Outputs</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedContract.functions.map((func, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                                    {func.name}
                                  </Typography>
                                  <Chip 
                                    label={func.visibility} 
                                    size="small" 
                                    sx={{ mr: 0.5, mt: 0.5 }}
                                  />
                                  <Chip 
                                    label={func.stateMutability} 
                                    size="small"
                                    sx={{ mt: 0.5 }}
                                  />
                                </TableCell>
                                <TableCell>{func.description}</TableCell>
                                <TableCell>
                                  {func.inputs.map((input, idx) => (
                                    <Tooltip
                                      key={idx}
                                      title={input.description}
                                      placement="top"
                                    >
                                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                                        <span style={{ opacity: 0.7 }}>{input.type}</span> {input.name}
                                      </Typography>
                                    </Tooltip>
                                  ))}
                                  {func.inputs.length === 0 && (
                                    <Typography variant="body2" sx={{ opacity: 0.5 }}>None</Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {func.outputs.map((output, idx) => (
                                    <Tooltip
                                      key={idx}
                                      title={output.description}
                                      placement="top"
                                    >
                                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                                        <span style={{ opacity: 0.7 }}>{output.type}</span> {output.name}
                                      </Typography>
                                    </Tooltip>
                                  ))}
                                  {func.outputs.length === 0 && (
                                    <Typography variant="body2" sx={{ opacity: 0.5 }}>None</Typography>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Box sx={{ textAlign: 'center', p: 4 }}>
                        <Typography color="text.secondary">
                          Function details not available for this contract
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Security Tab */}
                {activeTab === 2 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>Security Information</Typography>
                    <Stack spacing={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>Audit Status</Typography>
                          {selectedContract.audited ? (
                            <>
                              <Typography variant="body2" paragraph>
                                This contract has been audited by a reputable security firm and has passed all security checks.
                              </Typography>
                              <Button 
                                variant="outlined" 
                                size="small"
                                endIcon={<LaunchIcon />}
                              >
                                View Audit Report
                              </Button>
                            </>
                          ) : (
                            <Typography variant="body2" color="warning.main">
                              This contract has not yet undergone a formal security audit. Use with caution.
                            </Typography>
                          )}
                        </CardContent>
                      </Card>

                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>Security Considerations</Typography>
                          <List>
                            <ListItem>
                              <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                              <ListItemText 
                                primary="Reentrancy Protection" 
                                secondary="Uses ReentrancyGuard to prevent reentrancy attacks" 
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                              <ListItemText 
                                primary="Access Control" 
                                secondary="Properly implemented access control mechanisms" 
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                              <ListItemText 
                                primary="Integer Overflow Protection" 
                                secondary="Uses SafeMath or Solidity 0.8+ for arithmetic operations" 
                              />
                            </ListItem>
                          </List>
                        </CardContent>
                      </Card>

                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>Bug Bounty Program</Typography>
                          <Typography variant="body2" paragraph>
                            Quantera maintains an active bug bounty program for all smart contracts. Security researchers are encouraged to report vulnerabilities.
                          </Typography>
                          <Button 
                            variant="outlined" 
                            size="small"
                            endIcon={<LaunchIcon />}
                          >
                            View Bug Bounty Program
                          </Button>
                        </CardContent>
                      </Card>
                    </Stack>
                  </Box>
                )}

                {/* Documentation Tab */}
                {activeTab === 3 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>Documentation</Typography>
                    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>Overview</Typography>
                      <Typography variant="body2" paragraph>
                        The {selectedContract.name} contract is a core component of the Quantera platform that {selectedContract.description.toLowerCase()}.
                        It follows the ERC-20 standard for fungible tokens with additional functionality specific to the Quantera ecosystem.
                      </Typography>
                      <Typography variant="body2" paragraph>
                        This contract interacts with other Quantera contracts to provide a seamless experience for users.
                      </Typography>
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>Architecture Diagram</Typography>
                      <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          [Contract Architecture Diagram]
                        </Typography>
                      </Box>
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>Related Documentation</Typography>
                      <List>
                        <ListItem>
                          <ListItemIcon><ArticleIcon /></ListItemIcon>
                          <ListItemText 
                            primary={
                              <Link href="#" underline="hover">Developer Guide: Working with {selectedContract.name}</Link>
                            } 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><ArticleIcon /></ListItemIcon>
                          <ListItemText 
                            primary={
                              <Link href="#" underline="hover">Integration Example: {selectedContract.name} API</Link>
                            } 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><ArticleIcon /></ListItemIcon>
                          <ListItemText 
                            primary={
                              <Link href="#" underline="hover">Security Considerations</Link>
                            } 
                          />
                        </ListItem>
                      </List>
                    </Paper>
                  </Box>
                )}
              </Box>
            </Paper>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <CodeIcon sx={{ fontSize: 60, mb: 2, color: 'text.secondary' }} />
              <Typography variant="h6" gutterBottom>
                Select a Contract
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500 }}>
                Choose a contract from the list to view its details, source code, and documentation.
              </Typography>
            </Paper>
          )}
        </CompatGrid>
      </Grid>
    </Container>
  );
};

export default ContractExplorerPage; 