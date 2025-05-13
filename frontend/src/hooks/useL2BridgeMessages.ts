import { useState, useEffect, useCallback } from 'react';
import { useWebSocket, WebSocketEventType, L2MessageStatusUpdate, SubscriptionTopic } from '../contexts/WebSocketContext';
import api from '../api/api';

export interface L2Message {
  messageId: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REJECTED';
  sourceChainId: number;
  destinationChainId: number;
  sender: string;
  timestamp: number;
  transactionHash: string;
  confirmationTimestamp?: number;
  failureReason?: string;
}

export interface UseL2BridgeMessagesResult {
  messages: L2Message[];
  loading: boolean;
  error: string | null;
  refreshMessages: () => Promise<void>;
  getMessageDetails: (messageId: string) => Promise<L2Message | null>;
}

/**
 * Hook to manage L2 bridge messages with real-time updates via WebSocket
 * @param chainId Optional chain ID to filter messages
 * @param userAddress Optional user address to filter messages
 */
export const useL2BridgeMessages = (
  chainId?: number,
  userAddress?: string
): UseL2BridgeMessagesResult => {
  const [messages, setMessages] = useState<L2Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { subscribe, unsubscribe, events } = useWebSocket();
  
  // Filter WebSocket events for L2 message updates
  const messageStatusUpdates = events.filter(
    event => event.type === WebSocketEventType.L2_MESSAGE_STATUS_UPDATE
  ) as Array<{ type: WebSocketEventType.L2_MESSAGE_STATUS_UPDATE, payload: L2MessageStatusUpdate }>;
  
  // Fetch messages from API
  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let endpoint = '/api/trading/l2/messages';
      
      // Add query parameters if filtering by chain or user
      const params = new URLSearchParams();
      if (chainId) params.append('chainId', chainId.toString());
      if (userAddress) params.append('userAddress', userAddress);
      
      const queryString = params.toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;
      
      const response = await api.get(url);
      // First convert to unknown, then assert as the correct type
      setMessages((response.data as unknown) as L2Message[]);
    } catch (err) {
      console.error('Error fetching L2 messages:', err);
      setError('Failed to load L2 messages');
      
      // Set empty messages array on error
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [chainId, userAddress]);
  
  // Get details for a specific message
  const getMessageDetails = useCallback(async (messageId: string): Promise<L2Message | null> => {
    try {
      const response = await api.get(`/api/trading/l2/messages/${messageId}`);
      // First convert to unknown, then assert as the correct type
      return (response.data as unknown) as L2Message;
    } catch (err) {
      console.error(`Error fetching message details for ${messageId}:`, err);
      return null;
    }
  }, []);

  // Update message when WebSocket events are received
  useEffect(() => {
    messageStatusUpdates.forEach(event => {
      const update = event.payload;
      setMessages(prevMessages => 
        prevMessages.map(message => 
          message.messageId === update.message_id
            ? {
                ...message,
                status: update.status as 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REJECTED',
                timestamp: update.timestamp
              }
            : message
        )
      );
    });
  }, [messageStatusUpdates]);

  // Subscribe to L2 messages topics
  useEffect(() => {
    // Subscribe to general L2 messages topic
    subscribe(SubscriptionTopic.L2_MESSAGES);
    
    // Subscribe to chain-specific topic if chainId is provided
    if (chainId) {
      subscribe(`${SubscriptionTopic.L2_CHAIN}:${chainId}`);
    }
    
    // Initial fetch
    fetchMessages();
    
    return () => {
      // Cleanup subscriptions
      unsubscribe(SubscriptionTopic.L2_MESSAGES);
      if (chainId) {
        unsubscribe(`${SubscriptionTopic.L2_CHAIN}:${chainId}`);
      }
    };
  }, [chainId, subscribe, unsubscribe, fetchMessages]);

  return {
    messages,
    loading,
    error,
    refreshMessages: fetchMessages,
    getMessageDetails
  };
};