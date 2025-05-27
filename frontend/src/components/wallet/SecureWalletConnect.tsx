import React, { useState, useEffect } from 'react';
import { Button, Menu, MenuItem, Box, Typography, Avatar, Alert, Snackbar, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { AccountBalanceWallet, ExpandMore, Warning, Security, Verified } from '@mui/icons-material';
import { ethers } from 'ethers';
import { useSecureAuth } from '../../contexts/SecureAuthContext';

// Styled components
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
  
  '&:disabled': {
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.5)',
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

const SecurityIndicator = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 6px',
  borderRadius: '4px',
  fontSize: '10px',
  fontWeight: 600,
  textTransform: 'uppercase',
});

// Supported networks with security validation
const SUPPORTED_NETWORKS = {
  '0x1': { name: 'Ethereum', symbol: 'ETH', secure: true },
  '0xAA36A7': { name: 'Sepolia', symbol: 'ETH', secure: true },
  '0x89': { name: 'Polygon', symbol: 'MATIC', secure: true },
  '0x13881': { name: 'Mumbai', symbol: 'MATIC', secure: true },
  '0xA86A': { name: 'Avalanche', symbol: 'AVAX', secure: true },
  '0xA869': { name: 'Fuji', symbol: 'AVAX', secure: true },
  '0xA4B1': { name: 'Arbitrum', symbol: 'ETH', secure: true },
  '0x66EEE': { name: 'Arbitrum Sepolia', symbol: 'ETH', secure: true },
  '0xA': { name: 'Optimism', symbol: 'ETH', secure: true },
  '0xAA37DC': { name: 'OP Sepolia', symbol: 'ETH', secure: true },
} as const;

export const SecureWalletConnect: React.FC = () => {
  const { user, isAuthenticated, login, logout, error: authError, clearError } = useSecureAuth();
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState('0.00');
  const [chainId, setChainId] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<'secure' | 'warning' | 'error'>('secure');

  // Check wallet connection on mount
  useEffect(() => {
    checkWalletConnection();
    
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

  // Update wallet info when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      setWalletAddress(user.walletAddress);
      updateBalance(user.walletAddress);
      updateChainId();
    } else {
      setWalletAddress('');
      setBalance('0.00');
      setChainId('');
    }
  }, [isAuthenticated, user]);

  const checkWalletConnection = async () => {
    try {
      if (!window.ethereum) return;
      
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0 && !isAuthenticated) {
        // Wallet is connected but not authenticated - show warning
        setSecurityStatus('warning');
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const handleConnect = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setIsConnecting(true);
    setError('');
    clearError();

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];
      
      // Validate address format
      if (!ethers.isAddress(address)) {
        throw new Error('Invalid wallet address');
      }

      // Generate authentication message
      const timestamp = Math.floor(Date.now() / 1000);
      const message = `Sign this message to authenticate with Quantera Platform.\n\nTimestamp: ${timestamp}\nAddress: ${address}`;

      // Request signature
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      });

      // Authenticate with backend
      const success = await login(address, signature, message);
      
      if (success) {
        setSecurityStatus('secure');
        console.log('Secure authentication successful:', address);
      } else {
        throw new Error(authError || 'Authentication failed');
      }

    } catch (error: any) {
      console.error('Wallet connection error:', error);
      setSecurityStatus('error');
      
      if (error.code === 4001) {
        setError('Connection rejected by user');
      } else if (error.code === -32602) {
        setError('Invalid request parameters');
      } else {
        setError(error.message || 'Failed to connect wallet. Please try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const updateBalance = async (address: string) => {
    try {
      if (!window.ethereum || !address) return;
      
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      
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
      
      // Check if network is supported and secure
      const network = SUPPORTED_NETWORKS[chainId as keyof typeof SUPPORTED_NETWORKS];
      if (!network) {
        setSecurityStatus('warning');
      } else if (network.secure) {
        setSecurityStatus('secure');
      }
    } catch (error) {
      console.error('Error fetching chain ID:', error);
      setSecurityStatus('error');
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      handleDisconnect();
    } else if (accounts[0] !== walletAddress) {
      // Account changed - require re-authentication
      handleDisconnect();
      setError('Account changed. Please reconnect to authenticate.');
    }
  };

  const handleChainChanged = (chainId: string) => {
    setChainId(chainId);
    updateChainId();
    
    // Refresh balance when network changes
    if (walletAddress) {
      updateBalance(walletAddress);
    }
  };

  const handleDisconnect = () => {
    logout();
    setSecurityStatus('secure');
    setMenuAnchor(null);
    console.log('Secure wallet disconnected');
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
    
    switch (chainId) {
      case '0xAA36A7':
        explorerUrl = 'https://sepolia.etherscan.io';
        break;
      case '0x89':
        explorerUrl = 'https://polygonscan.com';
        break;
      case '0x13881':
        explorerUrl = 'https://mumbai.polygonscan.com';
        break;
      case '0xA86A':
        explorerUrl = 'https://snowtrace.io';
        break;
      case '0xA869':
        explorerUrl = 'https://testnet.snowtrace.io';
        break;
      case '0xA4B1':
        explorerUrl = 'https://arbiscan.io';
        break;
      case '0x66EEE':
        explorerUrl = 'https://sepolia.arbiscan.io';
        break;
      case '0xA':
        explorerUrl = 'https://optimistic.etherscan.io';
        break;
      case '0xAA37DC':
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
    return SUPPORTED_NETWORKS[chainId as keyof typeof SUPPORTED_NETWORKS] || { 
      name: 'Unknown', 
      symbol: 'ETH', 
      secure: false 
    };
  };

  const getSecurityColor = () => {
    switch (securityStatus) {
      case 'secure': return '#4caf50';
      case 'warning': return '#ff9800';
      case 'error': return '#f44336';
      default: return '#4caf50';
    }
  };

  const getSecurityIcon = () => {
    switch (securityStatus) {
      case 'secure': return <Verified sx={{ fontSize: 12 }} />;
      case 'warning': return <Warning sx={{ fontSize: 12 }} />;
      case 'error': return <Security sx={{ fontSize: 12 }} />;
      default: return <Verified sx={{ fontSize: 12 }} />;
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <WalletButton
          onClick={handleConnect}
          disabled={isConnecting}
          startIcon={isConnecting ? <CircularProgress size={16} /> : <AccountBalanceWallet />}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </WalletButton>
        
        <Snackbar 
          open={!!error || !!authError} 
          autoHideDuration={6000} 
          onClose={() => {
            setError('');
            clearError();
          }}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            severity={securityStatus === 'secure' ? 'success' : 'error'} 
            onClose={() => {
              setError('');
              clearError();
            }}
          >
            {error || authError}
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
            bgcolor: getSecurityColor(),
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          {walletAddress.slice(2, 4).toUpperCase()}
        </Avatar>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
              {formatAddress(walletAddress)}
            </Typography>
            <SecurityIndicator sx={{ bgcolor: getSecurityColor() + '20', color: getSecurityColor() }}>
              {getSecurityIcon()}
              {securityStatus}
            </SecurityIndicator>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
              {balance} {currentNetwork.symbol}
            </Typography>
            <Box sx={{
              background: 'rgba(0, 188, 212, 0.2)',
              color: '#00bcd4',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}>
              {currentNetwork.name}
            </Box>
          </Box>
        </Box>
        <ExpandMore />
      </ConnectedButton>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            mt: 1,
          }
        }}
      >
        <MenuItem onClick={copyAddress} sx={{ color: '#ffffff', fontSize: '14px' }}>
          Copy Address
        </MenuItem>
        <MenuItem onClick={viewOnExplorer} sx={{ color: '#ffffff', fontSize: '14px' }}>
          View on Explorer
        </MenuItem>
        <MenuItem onClick={handleDisconnect} sx={{ color: '#ff5252', fontSize: '14px' }}>
          Disconnect
        </MenuItem>
      </Menu>

      <Snackbar 
        open={!!error} 
        autoHideDuration={3000} 
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="info" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}; 