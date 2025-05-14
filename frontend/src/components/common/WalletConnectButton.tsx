import React from 'react';
import { Button } from 'react-bootstrap';
import { useWallet } from '../../contexts/WalletContext';
import { useTheme } from '../../contexts/ThemeContext';

interface WalletConnectButtonProps {
  className?: string;
  variant?: string;
  size?: 'sm' | 'lg';
}

const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({
  className = '',
  variant = 'primary',
  size,
}) => {
  const { connected, address, connect, disconnect } = useWallet();
  const { theme } = useTheme();
  
  // Format address for display (0x1234...5678)
  const formatAddress = (address: string | null): string => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Handle connect/disconnect
  const handleWalletAction = async () => {
    if (connected) {
      disconnect();
    } else {
      await connect();
    }
  };
  
  // Adjust button style based on theme
  const buttonStyle = theme === 'dark' 
    ? { borderColor: connected ? '#28a745' : '#007bff' } 
    : {};
    
  return (
    <Button
      variant={connected ? 'outline-success' : `outline-${variant}`}
      className={`wallet-connect-button ${className}`}
      onClick={handleWalletAction}
      size={size}
      style={buttonStyle}
    >
      {connected ? (
        <span className="d-flex align-items-center">
          <span className="connection-dot connected me-2" />
          {formatAddress(address)}
        </span>
      ) : (
        <span className="d-flex align-items-center">
          <span className="connection-dot disconnected me-2" />
          Connect Wallet
        </span>
      )}
    </Button>
  );
};

export default WalletConnectButton; 