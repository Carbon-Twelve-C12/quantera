import React from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { SmartAccountOperation } from '../../contexts/WebSocketContext';
import { SmartAccountOperationDetails } from '../../hooks/useSmartAccountOperations';

interface OperationsHistoryProps {
  accountId: string;
  operations: SmartAccountOperation[] | SmartAccountOperationDetails[];
}

const OperationsHistory: React.FC<OperationsHistoryProps> = ({ 
  accountId,
  operations 
}) => {
  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Truncate address for display
  const truncateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Get color for operation type
  const getOperationTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'transfer':
        return 'primary';
      case 'swap':
        return 'secondary';
      case 'delegate':
        return 'info';
      case 'undelegate':
        return 'warning';
      case 'execute':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Paper sx={{ p: 3 }} elevation={2}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Operations History
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Recent operations performed on this smart account
        </Typography>
      </Box>
      
      {operations.length > 0 ? (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Operation Type</TableCell>
                <TableCell>Operation ID</TableCell>
                <TableCell>Executor</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {operations.map((operation, index) => {
                // Determine if we're dealing with WebSocketContext operation or useSmartAccountOperations details
                const operationId = 'operation_id' in operation ? operation.operation_id : operation.operationId;
                const operationType = 'operation_type' in operation ? operation.operation_type : operation.operationType;
                const executor = 'executor' in operation ? operation.executor : operation.executedBy;
                
                return (
                  <TableRow key={operationId || index} hover>
                    <TableCell>
                      {formatDate(operation.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={operationType}
                        size="small"
                        color={getOperationTypeColor(operationType)}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={operationId}>
                        <Typography variant="body2">
                          {truncateAddress(operationId)}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={executor}>
                        <Typography variant="body2">
                          {truncateAddress(executor)}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            No operations found for this account
          </Typography>
        </Box>
      )}
      
      {/* Real-time indicator */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          mt: 2, 
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'divider'
        }}
      >
        <CircularProgress size={12} sx={{ mr: 1 }} />
        <Typography variant="caption" color="text.secondary">
          Real-time updates enabled
        </Typography>
      </Box>
    </Paper>
  );
};

export default OperationsHistory; 