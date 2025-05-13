import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CircularProgress, 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  TextField, 
  Typography, 
  Stack,
  Alert,
  Chip,
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useWallet } from '../../contexts/WalletContext';
import { useL2Bridge } from '../../contexts/L2BridgeContext';
import { MessageStatus } from '../../api/l2bridge.types';
import type { 
  GasEstimation, 
  OrderDetails, 
  BridgeTransaction 
} from '../../api/l2bridge.types';

// Utility functions to replace ethers
const formatEther = (value: string): string => {
  // Simple implementation to format wei to ether
  const num = parseFloat(value);
  return (num / 1e18).toFixed(6);
};

const parseEther = (value: string): string => {
  // Simple implementation to parse ether to wei
  const num = parseFloat(value);
  return (num * 1e18).toString();
};

const utils = {
  commify: (value: string | number): string => {
    // Add commas to number
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  },
  id: (value: string): string => {
    // Simple hash function for demo
    return `id-${Math.floor(Math.random() * 1000000)}`;
  },
  formatBytes32String: (value: string): string => {
    // Pad string to 32 bytes
    return value.padEnd(64, '0');
  }
};

// Message status badges with appropriate colors
const StatusBadge = ({ status }: { status: MessageStatus }) => {
  const getColor = () => {
    switch (status) {
      case MessageStatus.PENDING:
        return 'warning';
      case MessageStatus.CONFIRMED:
        return 'success';
      case MessageStatus.FAILED:
        return 'error';
      case MessageStatus.PROCESSING:
        return 'info';
      default:
        return 'default';
    }
  };

  const getLabel = () => {
    switch (status) {
      case MessageStatus.PENDING:
        return 'Pending';
      case MessageStatus.CONFIRMED:
        return 'Confirmed';
      case MessageStatus.FAILED:
        return 'Failed';
      case MessageStatus.PROCESSING:
        return 'Processing';
      default:
        return 'Unknown';
    }
  };

  return (
    <Chip 
      label={getLabel()} 
      color={getColor()} 
      size="small" 
      variant="outlined"
    />
  );
};

// Chain selector component
const ChainSelector = ({ 
  chains, 
  selectedChain, 
  onChange 
}: { 
  chains: any[], 
  selectedChain: number, 
  onChange: (chainId: number) => void 
}) => {
  return (
    <FormControl fullWidth variant="outlined" size="small">
      <InputLabel>Destination Chain</InputLabel>
      <Select
        value={selectedChain || ''}
        onChange={(e) => onChange(Number(e.target.value))}
        label="Destination Chain"
      >
        {chains.map((chain) => (
          <MenuItem key={chain.chainId} value={chain.chainId}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography>{chain.name}</Typography>
              {chain.blob_enabled && (
                <Tooltip title="Supports blob data for efficient bridging">
                  <Chip label="Blob" size="small" color="info" />
                </Tooltip>
              )}
            </Stack>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

// Gas estimation display
const GasEstimation = ({ estimation }: { estimation: any }) => {
  if (!estimation) return null;

  return (
    <Card variant="outlined" sx={{ mt: 2, backgroundColor: '#f8f9fa' }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Gas Estimation
        </Typography>
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2">Data Format:</Typography>
            <Typography variant="body2" fontWeight="bold">
              {estimation.useBlob ? 'Blob Data' : 'Call Data'}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2">Estimated Cost:</Typography>
            <Typography variant="body2" fontWeight="bold">
              ${estimation.estimatedUsdCost.toFixed(4)} USD
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2">Gas Limit:</Typography>
            <Typography variant="body2" fontWeight="bold">
              {estimation.useBlob 
                ? `${utils.commify(estimation.blobGasLimit)} (blob)` 
                : utils.commify(estimation.callDataGasLimit)}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

// Recent transactions list
const RecentTransactions = ({ 
  transactions, 
  onRefresh 
}: { 
  transactions: any[], 
  onRefresh: () => void 
}) => {
  return (
    <Box mt={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle1">Recent Transactions</Typography>
        <IconButton size="small" onClick={onRefresh}>
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Stack>
      <Divider />
      {transactions.length === 0 ? (
        <Typography variant="body2" color="text.secondary" py={2} textAlign="center">
          No recent transactions
        </Typography>
      ) : (
        <Stack spacing={1} mt={2}>
          {transactions.map((tx) => (
            <Card key={tx.messageId} variant="outlined">
              <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                      {tx.orderId.slice(0, 8)}...{tx.orderId.slice(-6)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(tx.timestamp * 1000).toLocaleString()}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2">
                      {formatEther(tx.amount)} ETH
                    </Typography>
                    <StatusBadge status={tx.status} />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};

// Main L2BridgeWidget component
const L2BridgeWidget = () => {
  const { address: account, provider, chainId } = useWallet();
  const { 
    getSupportedChains, 
    estimateBridgingGas, 
    bridgeOrder, 
    getOrdersByUser,
    getMessageDetails
  } = useL2Bridge();

  // State variables
  const [chains, setChains] = useState<any[]>([]);
  const [selectedChain, setSelectedChain] = useState<number | null>(null);
  const [amount, setAmount] = useState<string>('0.1');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [gasEstimation, setGasEstimation] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [treasuryId, setTreasuryId] = useState<string>('');
  const [isLoadingEstimation, setIsLoadingEstimation] = useState<boolean>(false);

  // Load supported chains
  useEffect(() => {
    const loadChains = async () => {
      try {
        const chains = await getSupportedChains();
        setChains(chains);
        if (chains.length > 0) {
          setSelectedChain(chains[0].chainId);
        }
      } catch (error) {
        console.error('Failed to load chains', error);
        setError('Failed to load supported chains. Please try again later.');
      }
    };

    loadChains();
  }, [getSupportedChains]);

  // Load user's orders
  const loadUserOrders = async () => {
    if (!account) return;

    try {
      const orderIds = await getOrdersByUser(account);
      
      // Get details for each order
      const orders = await Promise.all(
        orderIds.map(async (orderId: string) => {
          const message = await getMessageDetails(orderId);
          return {
            ...message,
            orderId
          };
        })
      );

      // Sort by timestamp (newest first)
      orders.sort((a: any, b: any) => b.timestamp - a.timestamp);
      
      setRecentTransactions(orders.slice(0, 5)); // Only show 5 most recent
    } catch (error) {
      console.error('Failed to load user orders', error);
    }
  };

  // Load user orders when account changes
  useEffect(() => {
    if (account) {
      loadUserOrders();
    }
  }, [account]);

  // Update gas estimation when amount or chain changes
  useEffect(() => {
    const updateGasEstimation = async () => {
      if (!selectedChain || !amount || parseFloat(amount) <= 0) {
        setGasEstimation(null);
        return;
      }

      setIsLoadingEstimation(true);
      try {
        // Assuming a standard order data size
        const dataSize = 1000; // 1KB
        
        // Get gas estimation with correct parameters (dataSize, dataType)
        const estimation = await estimateBridgingGas(
          dataSize, 
          1 // Using 1 as dataType (assuming 1=blob data)
        );
        
        setGasEstimation(estimation);
      } catch (error) {
        console.error('Failed to estimate gas', error);
      } finally {
        setIsLoadingEstimation(false);
      }
    };

    updateGasEstimation();
  }, [selectedChain, amount, estimateBridgingGas]);

  // Handle bridge action
  const handleBridge = async () => {
    if (!account || !provider || !selectedChain) {
      setError('Please connect your wallet and select a destination chain.');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    if (!treasuryId) {
      setError('Please enter a treasury ID.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Create order object matching the OrderDetails interface
      const order = {
        orderId: utils.id(Date.now().toString()), // Generate a temporary ID
        treasuryId: treasuryId,
        userAddress: account,
        isBuy: true,
        amount: amount,
        price: '0' // Not used for bridging
      };
      
      // Call bridgeOrder with the order object
      await bridgeOrder(order);
      setSuccess(`Order bridged successfully!`);
      
      // Refresh recent transactions
      await loadUserOrders();
    } catch (error: any) {
      console.error('Bridge error:', error);
      setError(`Failed to bridge: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card sx={{ width: '100%', maxWidth: 500, mx: 'auto', mt: 4 }}>
      <CardContent>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h5" gutterBottom>
              Bridge to L2
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bridge your assets to Layer 2 networks for faster and cheaper transactions.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          <TextField
            label="Treasury ID"
            variant="outlined"
            fullWidth
            value={treasuryId}
            onChange={(e) => setTreasuryId(e.target.value)}
            disabled={isLoading}
            size="small"
            placeholder="Enter your treasury ID"
          />

          <TextField
            label="Amount"
            variant="outlined"
            type="number"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isLoading}
            size="small"
            InputProps={{
              endAdornment: (
                <Typography variant="body2" color="text.secondary">
                  ETH
                </Typography>
              ),
            }}
          />

          <ChainSelector
            chains={chains}
            selectedChain={selectedChain!}
            onChange={setSelectedChain}
          />

          {isLoadingEstimation ? (
            <Box display="flex" justifyContent="center" py={2}>
              <CircularProgress size={24} />
            </Box>
          ) : gasEstimation ? (
            <GasEstimation estimation={gasEstimation} />
          ) : null}

          <Button
            variant="contained"
            color="primary"
            fullWidth
            disabled={isLoading || !account || !selectedChain}
            onClick={handleBridge}
            sx={{ mt: 2 }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Bridge'}
          </Button>

          <RecentTransactions 
            transactions={recentTransactions} 
            onRefresh={loadUserOrders} 
          />
        </Stack>
      </CardContent>
    </Card>
  );
};

export default L2BridgeWidget; 