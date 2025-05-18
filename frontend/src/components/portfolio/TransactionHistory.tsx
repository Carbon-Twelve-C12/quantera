import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Box,
  Link,
  Paper,
  useTheme,
  Pagination
} from '@mui/material';
import {
  OpenInNew as OpenInNewIcon,
  ShoppingBag as ShoppingBagIcon,
  MonetizationOn as MonetizationOnIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
  Nature as EcoIcon
} from '@mui/icons-material';
import { Transaction } from '../../types/portfolioTypes';

interface TransactionHistoryProps {
  transactions: Transaction[];
  title?: string;
  rowsPerPage?: number;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  title = 'Transaction History',
  rowsPerPage = 5
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(1);
  
  // Sort transactions by timestamp (newest first)
  const sortedTransactions = [...transactions].sort((a, b) => b.timestamp - a.timestamp);
  
  // Paging logic
  const totalPages = Math.ceil(sortedTransactions.length / rowsPerPage);
  const displayedTransactions = sortedTransactions.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );
  
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  
  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Transaction type styling
  const getTransactionTypeStyle = (type: string) => {
    switch (type) {
      case 'buy':
        return {
          color: 'primary',
          icon: <ShoppingBagIcon fontSize="small" />,
          label: 'Buy'
        };
      case 'sell':
        return {
          color: 'secondary',
          icon: <MonetizationOnIcon fontSize="small" />,
          label: 'Sell'
        };
      case 'yield':
        return {
          color: 'success',
          icon: <MonetizationOnIcon fontSize="small" />,
          label: 'Yield'
        };
      case 'transfer':
        return {
          color: 'info',
          icon: <SendIcon fontSize="small" />,
          label: 'Transfer'
        };
      case 'retirement':
        return {
          color: 'success',
          icon: <EcoIcon fontSize="small" />,
          label: 'Retirement'
        };
      default:
        return {
          color: 'default',
          icon: <DeleteIcon fontSize="small" />,
          label: type.charAt(0).toUpperCase() + type.slice(1)
        };
    }
  };
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: theme.shadows[1]
      }}
    >
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>
        
        <TableContainer component={Paper} 
          sx={{ 
            boxShadow: 'none',
            bgcolor: 'transparent'
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Asset</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Tx</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedTransactions.map((transaction) => {
                const typeStyle = getTransactionTypeStyle(transaction.type);
                
                return (
                  <TableRow key={transaction.id} hover>
                    <TableCell>
                      {formatDate(transaction.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" component="span" fontWeight="medium">
                        {transaction.assetSymbol}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={typeStyle.icon}
                        label={typeStyle.label}
                        size="small"
                        color={typeStyle.color as any}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {transaction.type === 'yield' ? '-' : transaction.quantity}
                    </TableCell>
                    <TableCell align="right">
                      {transaction.type === 'yield' ? '-' : `$${transaction.price.toFixed(2)}`}
                    </TableCell>
                    <TableCell align="right">
                      ${transaction.totalValue.toFixed(2)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        size="small"
                        color={
                          transaction.status === 'completed' 
                            ? 'success' 
                            : transaction.status === 'pending' 
                            ? 'warning' 
                            : 'error'
                        }
                        sx={{ minWidth: '80px' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {transaction.txHash && (
                        <IconButton
                          size="small"
                          component={Link}
                          href={`https://etherscan.io/tx/${transaction.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {displayedTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No transactions found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              shape="rounded"
              size="small"
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory; 