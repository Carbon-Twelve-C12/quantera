import { useState, useEffect, useCallback } from 'react';
import { useWebSocket, SubscriptionTopic, SmartAccountOperation } from '../contexts/WebSocketContext';
import api from '../api/api';

export interface SmartAccountOperationDetails {
  operationId: string;
  accountId: string;
  operationType: string;
  timestamp: number;
  executedBy: string;
  status: 'SUCCESS' | 'FAILURE' | 'PENDING';
  gasUsed?: string;
  transactionHash?: string;
  errorMessage?: string;
}

export interface UseSmartAccountOperationsResult {
  operations: SmartAccountOperationDetails[];
  loading: boolean;
  error: string | null;
  refreshOperations: () => Promise<void>;
  getOperationDetails: (operationId: string) => Promise<SmartAccountOperationDetails | null>;
}

/**
 * Hook to manage smart account operations with real-time updates via WebSocket
 * @param accountId Optional account ID to filter operations
 */
export const useSmartAccountOperations = (
  accountId?: string
): UseSmartAccountOperationsResult => {
  const [operations, setOperations] = useState<SmartAccountOperationDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { subscribe, unsubscribe, events } = useWebSocket();
  
  // Filter WebSocket events for smart account operations
  const accountOperations = events.filter(
    event => event.type === 'SmartAccountOperation'
  ) as Array<{ type: 'SmartAccountOperation', payload: SmartAccountOperation }>;
  
  // Fetch operations from API
  const fetchOperations = useCallback(async () => {
    if (!accountId) {
      setOperations([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const url = `/api/users/smart-account/${accountId}/operations`;
      
      const response = await api.get(url);
      // First convert to unknown, then assert as the correct type
      setOperations((response.data as unknown) as SmartAccountOperationDetails[]);
    } catch (err) {
      console.error('Error fetching smart account operations:', err);
      setError('Failed to load smart account operations');
      setOperations([]);
    } finally {
      setLoading(false);
    }
  }, [accountId]);
  
  // Get details for a specific operation
  const getOperationDetails = useCallback(async (operationId: string): Promise<SmartAccountOperationDetails | null> => {
    try {
      const response = await api.get(`/api/users/smart-account/operations/${operationId}`);
      // First convert to unknown, then assert as the correct type
      return (response.data as unknown) as SmartAccountOperationDetails;
    } catch (err) {
      console.error(`Error fetching operation details for ${operationId}:`, err);
      return null;
    }
  }, []);
  
  // Update operations when WebSocket events are received
  useEffect(() => {
    accountOperations.forEach(event => {
      const operation = event.payload;
      
      // If the operation is for the current account (or no account filter is set)
      if (!accountId || operation.account_id === accountId) {
        setOperations(prevOperations => {
          // Check if operation already exists
          const exists = prevOperations.some(op => op.operationId === operation.operation_id);
          
          if (exists) {
            // Update existing operation
            return prevOperations.map(op => 
              op.operationId === operation.operation_id
                ? {
                    ...op,
                    timestamp: operation.timestamp,
                    // Update other fields as needed
                  }
                : op
            );
          } else {
            // Add new operation
            const newOperation: SmartAccountOperationDetails = {
              operationId: operation.operation_id,
              accountId: operation.account_id,
              operationType: operation.operation_type,
              timestamp: operation.timestamp,
              executedBy: operation.executor,
              status: 'SUCCESS', // Default status, adjust based on your data
            };
            
            return [...prevOperations, newOperation];
          }
        });
      }
    });
  }, [accountOperations, accountId]);
  
  // Subscribe to smart account topics
  useEffect(() => {
    // Subscribe to general smart account topic
    subscribe(SubscriptionTopic.SMART_ACCOUNTS);
    
    // Subscribe to specific account topic if accountId is provided
    if (accountId) {
      subscribe(`${SubscriptionTopic.SMART_ACCOUNT}:${accountId}`);
    }
    
    // Initial fetch
    fetchOperations();
    
    return () => {
      // Cleanup subscriptions
      unsubscribe(SubscriptionTopic.SMART_ACCOUNTS);
      if (accountId) {
        unsubscribe(`${SubscriptionTopic.SMART_ACCOUNT}:${accountId}`);
      }
    };
  }, [accountId, subscribe, unsubscribe, fetchOperations]);
  
  return {
    operations,
    loading,
    error,
    refreshOperations: fetchOperations,
    getOperationDetails
  };
};

export default useSmartAccountOperations; 