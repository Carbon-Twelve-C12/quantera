import React, { useState } from 'react';
import { Button, Menu, MenuItem, Box, Typography, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import { AccountBalanceWallet, ExpandMore } from '@mui/icons-material';

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

export const WalletConnect: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState('0.00');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleConnect = async () => {
    try {
      // Simulate wallet connection
      // In real implementation, this would use Web3 libraries
      const mockAddress = '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4';
      const mockBalance = '1,234.56';
      
      setWalletAddress(mockAddress);
      setBalance(mockBalance);
      setIsConnected(true);
      
      console.log('Wallet connected:', mockAddress);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setWalletAddress('');
    setBalance('0.00');
    setMenuAnchor(null);
    console.log('Wallet disconnected');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <WalletButton
        onClick={handleConnect}
        startIcon={<AccountBalanceWallet />}
      >
        Connect Wallet
      </WalletButton>
    );
  }

  return (
    <>
      <ConnectedButton onClick={handleMenuOpen}>
        <Avatar 
          sx={{ 
            width: 24, 
            height: 24, 
            bgcolor: '#00bcd4',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          {walletAddress.slice(2, 4).toUpperCase()}
        </Avatar>
        <WalletInfo>
          <WalletAddress>{formatAddress(walletAddress)}</WalletAddress>
          <WalletBalance>{balance} ETH</WalletBalance>
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
            minWidth: '200px',
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
              {balance} ETH
            </Typography>
          </Box>
        </MenuItem>
        
        <MenuItem onClick={handleMenuClose}>
          View on Explorer
        </MenuItem>
        
        <MenuItem onClick={handleMenuClose}>
          Copy Address
        </MenuItem>
        
        <MenuItem onClick={handleDisconnect} sx={{ color: '#f44336' }}>
          Disconnect
        </MenuItem>
      </Menu>
    </>
  );
}; 