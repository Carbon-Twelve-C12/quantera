import React, { useState } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Divider, 
  Button, 
  Chip, 
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  IconButton
} from '@mui/material';
import { SmartAccount } from '../../pages/SmartAccountPage';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import DeleteIcon from '@mui/icons-material/Delete';

interface AccountDetailsProps {
  account: SmartAccount;
  onRevokeAccount: (accountId: string) => Promise<void>;
  onToggleStatus: (accountId: string, newStatus: 'ACTIVE' | 'PAUSED') => Promise<void>;
}

const AccountDetails: React.FC<AccountDetailsProps> = ({ 
  account, 
  onRevokeAccount,
  onToggleStatus
}) => {
  const [openRevokeDialog, setOpenRevokeDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [copyTooltip, setCopyTooltip] = useState('Copy to clipboard');

  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  // Truncate address for display
  const truncateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Copy account ID to clipboard
  const handleCopyId = () => {
    navigator.clipboard.writeText(account.id);
    setCopyTooltip('Copied!');
    setTimeout(() => setCopyTooltip('Copy to clipboard'), 2000);
  };

  // Toggle account status
  const handleToggleStatus = async () => {
    setActionLoading(true);
    try {
      const newStatus = account.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      await onToggleStatus(account.id, newStatus);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle account revocation
  const handleRevoke = async () => {
    setActionLoading(true);
    try {
      await onRevokeAccount(account.id);
      setOpenRevokeDialog(false);
    } finally {
      setActionLoading(false);
    }
  };

  // Determine status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PAUSED':
        return 'warning';
      case 'REVOKED':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Paper sx={{ flex: 1, p: 3 }} elevation={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{account.name}</Typography>
        <Chip 
          label={account.status} 
          color={getStatusColor(account.status) as any} 
        />
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Account ID
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ mr: 1 }}>
            {truncateAddress(account.id)}
          </Typography>
          <Tooltip title={copyTooltip}>
            <IconButton size="small" onClick={handleCopyId}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Owner
        </Typography>
        <Typography variant="body2">
          {truncateAddress(account.owner)}
        </Typography>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Balance
        </Typography>
        <Typography variant="body2">
          {account.balance} ETH
        </Typography>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Created At
        </Typography>
        <Typography variant="body2">
          {formatDate(account.createdAt)}
        </Typography>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Delegates
        </Typography>
        {account.delegates.length > 0 ? (
          <List dense disablePadding>
            {account.delegates.map((delegate, index) => (
              <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                <ListItemText 
                  primary={truncateAddress(delegate)}
                />
                <IconButton size="small" edge="end" aria-label="remove delegate">
                  <PersonRemoveIcon fontSize="small" />
                </IconButton>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No delegates assigned
          </Typography>
        )}
        <Button 
          startIcon={<PersonAddIcon />}
          size="small"
          sx={{ mt: 1 }}
        >
          Add Delegate
        </Button>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          color={account.status === 'ACTIVE' ? 'warning' : 'success'}
          startIcon={account.status === 'ACTIVE' ? <PauseCircleIcon /> : <PlayCircleIcon />}
          onClick={handleToggleStatus}
          disabled={actionLoading || account.status === 'REVOKED'}
        >
          {account.status === 'ACTIVE' ? 'Pause Account' : 'Activate Account'}
        </Button>
        
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => setOpenRevokeDialog(true)}
          disabled={actionLoading || account.status === 'REVOKED'}
        >
          Revoke Account
        </Button>
      </Box>
      
      {/* Revoke Confirmation Dialog */}
      <Dialog
        open={openRevokeDialog}
        onClose={() => setOpenRevokeDialog(false)}
      >
        <DialogTitle>Revoke Smart Account</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to revoke this smart account? This action cannot be undone.
          </DialogContentText>
          <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 'bold' }}>
            {account.name}
          </Typography>
          <Typography variant="body2">
            ID: {truncateAddress(account.id)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenRevokeDialog(false)} 
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRevoke} 
            color="error" 
            disabled={actionLoading}
            autoFocus
          >
            Revoke
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AccountDetails; 