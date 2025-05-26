import React, { useState, useEffect } from 'react';
import { Button, Menu, MenuItem, Box, Typography, Avatar, Alert, Snackbar } from '@mui/material';
import { styled } from '@mui/material/styles';
import { AccountBalanceWallet, ExpandMore, Warning } from '@mui/icons-material';

const WalletButton = styled(Button)({
  background: 'rgba(255, 255, 255, 0.15)',
  color: '#ffffff',
  borderRadius: '12px',
  padding: '8px 16px',
  fontWeight: 600,
  textTransform: 'none',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  backdropFilter: 'blur(10px)',
  
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.2)',
    transform: 'translateY(-1px)',
  },
});

const ConnectedButton = styled(Button)({
  background: 'rgba(255, 255, 255, 0.15)',
  color: '#ffffff',
  borderRadius: '12px',
  padding: '8px 16px',
  fontWeight: 600,
  textTransform: 'none',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  backdropFilter: 'blur(10px)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.2)',
  },
});

const WalletInfo = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
});

const WalletAddress = styled(Typography)({
  fontSize: '14px',
  fontWeight: 600,
  color: '#ffffff',
});

const WalletBalance = styled(Typography)({
  fontSize: '12px',
  color: 'rgba(255, 255, 255, 0.8)',
});

const NetworkChip = styled(Box)({
  background: 'rgba(0, 188, 212, 0.2)',
  color: '#00bcd4',
  padding: '2px 8px',
  borderRadius: '6px',
  fontSize: '10px',
  fontWeight: 600,
  textTransform: 'uppercase',
});

// Supported networks for cross-chain testing
const SUPPORTED_NETWORKS = {
  '0x1': { name: 'Ethereum', symbol: 'ETH' },
  '0xAA36A7': { name: 'Sepolia', symbol: 'SEP' },
  '0x89': { name: 'Polygon', symbol: 'MATIC' },
  '0x13881': { name: 'Mumbai', symbol: 'MATIC' },
  '0xA86A': { name: 'Avalanche', symbol: 'AVAX' },
  '0xA869': { name: 'Fuji', symbol: 'AVAX' },
  '0xA4B1': { name: 'Arbitrum', symbol: 'ETH' },
  '0x66EEE': { name: 'Arb Sepolia', symbol: 'ETH' },
  '0xA': { name: 'Optimism', symbol: 'ETH' },
  '0xAA37DC': { name: 'OP Sepolia', symbol: 'ETH' },
};

// Proper typing for MetaMask ethereum object
interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, listener: (...args: any[]) => void) => void;
  removeListener: (event: string, listener: (...args: any[]) => void) => void;
  selectedAddress?: string;
  networkVersion?: string;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export const WalletConnect: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState('0.00');
  const [chainId, setChainId] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if wallet is already connected on component mount
  useEffect(() => {
    checkConnection();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const checkConnection = async () => {
    try {
      if (!window.ethereum) return;
      
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsConnected(true);
        await updateBalance(accounts[0]);
        await updateChainId();
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const handleConnect = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsConnected(true);
        await updateBalance(accounts[0]);
        await updateChainId();
        console.log('Wallet connected:', accounts[0]);
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      if (error.code === 4001) {
        setError('Connection rejected by user');
      } else {
        setError('Failed to connect wallet. Please try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const updateBalance = async (address: string) => {
    try {
      if (!window.ethereum) return;
      
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      
      // Convert from wei to ether
      const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
      setBalance(balanceInEth.toFixed(4));
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance('0.00');
    }
  };

  const updateChainId = async () => {
    try {
      if (!window.ethereum) return;
      
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      setChainId(chainId);
    } catch (error) {
      console.error('Error fetching chain ID:', error);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      handleDisconnect();
    } else {
      setWalletAddress(accounts[0]);
      updateBalance(accounts[0]);
    }
  };

  const handleChainChanged = (chainId: string) => {
    setChainId(chainId);
    // Refresh balance when network changes
    if (walletAddress) {
      updateBalance(walletAddress);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setWalletAddress('');
    setBalance('0.00');
    setChainId('');
    setMenuAnchor(null);
    console.log('Wallet disconnected');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setError('Address copied to clipboard!');
      setTimeout(() => setError(''), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
    handleMenuClose();
  };

  const viewOnExplorer = () => {
    let explorerUrl = 'https://etherscan.io';
    
    // Set explorer URL based on network
    switch (chainId) {
      case '0xAA36A7': // Sepolia
        explorerUrl = 'https://sepolia.etherscan.io';
        break;
      case '0x89': // Polygon
        explorerUrl = 'https://polygonscan.com';
        break;
      case '0x13881': // Mumbai
        explorerUrl = 'https://mumbai.polygonscan.com';
        break;
      case '0xA86A': // Avalanche
        explorerUrl = 'https://snowtrace.io';
        break;
      case '0xA869': // Fuji
        explorerUrl = 'https://testnet.snowtrace.io';
        break;
      case '0xA4B1': // Arbitrum
        explorerUrl = 'https://arbiscan.io';
        break;
      case '0x66EEE': // Arbitrum Sepolia
        explorerUrl = 'https://sepolia.arbiscan.io';
        break;
      case '0xA': // Optimism
        explorerUrl = 'https://optimistic.etherscan.io';
        break;
      case '0xAA37DC': // Optimism Sepolia
        explorerUrl = 'https://sepolia-optimism.etherscan.io';
        break;
    }
    
    window.open(`${explorerUrl}/address/${walletAddress}`, '_blank');
    handleMenuClose();
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getCurrentNetwork = () => {
    return SUPPORTED_NETWORKS[chainId as keyof typeof SUPPORTED_NETWORKS] || { name: 'Unknown', symbol: 'ETH' };
  };

  const isNetworkSupported = () => {
    return chainId in SUPPORTED_NETWORKS;
  };

  if (!isConnected) {
    return (
      <>
        <WalletButton
          onClick={handleConnect}
          disabled={isConnecting}
          startIcon={<AccountBalanceWallet />}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </WalletButton>
        
        <Snackbar 
          open={!!error} 
          autoHideDuration={6000} 
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        </Snackbar>
      </>
    );
  }

  const currentNetwork = getCurrentNetwork();

  return (
    <>
      <ConnectedButton onClick={handleMenuOpen}>
        <Avatar 
          sx={{ 
            width: 24, 
            height: 24, 
            bgcolor: isNetworkSupported() ? '#00bcd4' : '#ff9800',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          {walletAddress.slice(2, 4).toUpperCase()}
        </Avatar>
        <WalletInfo>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WalletAddress>{formatAddress(walletAddress)}</WalletAddress>
            {!isNetworkSupported() && <Warning sx={{ fontSize: 14, color: '#ff9800' }} />}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WalletBalance>{balance} {currentNetwork.symbol}</WalletBalance>
            <NetworkChip>{currentNetwork.name}</NetworkChip>
          </Box>
        </WalletInfo>
        <ExpandMore />
      </ConnectedButton>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 8px 40px rgba(26, 35, 126, 0.12)',
            border: '1px solid rgba(26, 35, 126, 0.08)',
            marginTop: '8px',
            minWidth: '250px',
          },
        }}
      >
        <MenuItem onClick={handleMenuClose}>
          <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#263238' }}>
              Wallet Address
            </Typography>
            <Typography variant="caption" sx={{ color: '#607d8b', fontFamily: 'monospace' }}>
              {walletAddress}
            </Typography>
          </Box>
        </MenuItem>
        
        <MenuItem onClick={handleMenuClose}>
          <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#263238' }}>
              Balance
            </Typography>
            <Typography variant="caption" sx={{ color: '#607d8b' }}>
              {balance} {currentNetwork.symbol}
            </Typography>
          </Box>
        </MenuItem>
        
        <MenuItem onClick={handleMenuClose}>
          <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#263238' }}>
              Network
            </Typography>
            <Typography variant="caption" sx={{ color: isNetworkSupported() ? '#607d8b' : '#ff9800' }}>
              {currentNetwork.name} {!isNetworkSupported() && '(Unsupported)'}
            </Typography>
          </Box>
        </MenuItem>
        
        <MenuItem onClick={viewOnExplorer}>
          View on Explorer
        </MenuItem>
        
        <MenuItem onClick={copyAddress}>
          Copy Address
        </MenuItem>
        
        <MenuItem onClick={handleDisconnect} sx={{ color: '#f44336' }}>
          Disconnect
        </MenuItem>
      </Menu>
      
      <Snackbar 
        open={!!error && error.includes('copied')} 
        autoHideDuration={2000} 
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}; 