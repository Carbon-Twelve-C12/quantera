import React from 'react';
import { List, ListItem, ListItemButton, ListItemText, Paper, Typography, Box, Chip } from '@mui/material';
import { SmartAccount } from '../../pages/SmartAccountPage';

interface AccountListProps {
  accounts: SmartAccount[];
  selectedAccountId: string | undefined;
  onSelectAccount: (account: SmartAccount) => void;
}

const AccountList: React.FC<AccountListProps> = ({ 
  accounts, 
  selectedAccountId, 
  onSelectAccount 
}) => {
  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  // Get status color
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
    <Paper 
      sx={{ 
        width: { xs: '100%', md: '300px' }, 
        maxHeight: '600px', 
        overflow: 'auto' 
      }}
      elevation={2}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6">My Smart Accounts</Typography>
      </Box>
      
      <List disablePadding>
        {accounts.map((account) => (
          <ListItem 
            key={account.id}
            disablePadding
            divider
          >
            <ListItemButton 
              selected={selectedAccountId === account.id}
              onClick={() => onSelectAccount(account)}
            >
              <ListItemText 
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" noWrap>{account.name}</Typography>
                    <Chip 
                      label={account.status} 
                      size="small" 
                      color={getStatusColor(account.status) as any}
                      sx={{ ml: 1 }}
                    />
                  </Box>
                }
                secondary={
                  <>
                    <Typography variant="caption" component="div">
                      Created: {formatDate(account.createdAt)}
                    </Typography>
                    <Typography variant="caption" component="div">
                      Balance: {account.balance} ETH
                    </Typography>
                  </>
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      {accounts.length === 0 && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No accounts found
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default AccountList; 