import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { logger } from '../utils/logger';

// WebSocket Event Types
export enum WebSocketEventType {
  L2_MESSAGE_STATUS_UPDATE = 'L2MessageStatusUpdate',
  SMART_ACCOUNT_OPERATION = 'SmartAccountOperation',
  SMART_ACCOUNT_DELEGATE_ADDED = 'SmartAccountDelegateAdded',
  SMART_ACCOUNT_DELEGATE_REMOVED = 'SmartAccountDelegateRemoved'
}

// WebSocket Event Data
export interface L2MessageStatusUpdate {
  message_id: string;
  status: string;
  chain_id: number;
  timestamp: number;
}

export interface SmartAccountOperation {
  account_id: string;
  operation_id: string;
  operation_type: string;
  timestamp: number;
  executor: string;
}

export interface SmartAccountDelegateAdded {
  account_id: string;
  delegate: string;
  owner: string;
}

export interface SmartAccountDelegateRemoved {
  account_id: string;
  delegate: string;
  owner: string;
}

// WebSocket Event
export interface WebSocketEvent {
  type: WebSocketEventType;
  payload: L2MessageStatusUpdate | SmartAccountOperation | SmartAccountDelegateAdded | SmartAccountDelegateRemoved;
}

// Subscription Topics
export enum SubscriptionTopic {
  L2_MESSAGES = 'l2_messages',
  SMART_ACCOUNTS = 'smart_accounts',
  USER = 'user',
  L2_MESSAGE = 'l2_message',
  L2_CHAIN = 'l2_chain',
  SMART_ACCOUNT = 'smart_account'
}

// WebSocket Context State
interface WebSocketContextState {
  isConnected: boolean;
  subscribe: (topic: string) => void;
  unsubscribe: (topic: string) => void;
  lastEvent: WebSocketEvent | null;
  events: WebSocketEvent[];
  subscriptions: string[];
  reconnect: () => void;
}

// WebSocket Context
const WebSocketContext = createContext<WebSocketContextState | undefined>(undefined);

// WebSocket Provider Props
interface WebSocketProviderProps {
  children: ReactNode;
  url?: string;
}

// WebSocket Provider
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ 
  children, 
  url = 'ws://localhost:3031/ws' 
}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null);
  const [events, setEvents] = useState<WebSocketEvent[]>([]);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  
  const { address } = useWallet();
  
  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        logger.info('WebSocket connection established');
        setIsConnected(true);
        
        // Resubscribe to topics
        subscriptions.forEach(topic => {
          const subscriptionMessage = JSON.stringify({ topic });
          ws.send(subscriptionMessage);
        });
        
        // Subscribe to user-specific topic if wallet is connected
        if (address) {
          const userTopic = `user:${address}`;
          if (!subscriptions.includes(userTopic)) {
            const subscriptionMessage = JSON.stringify({ topic: userTopic });
            ws.send(subscriptionMessage);
            setSubscriptions(prev => [...prev, userTopic]);
          }
        }
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketEvent;
          setLastEvent(data);
          setEvents(prev => [...prev, data]);
          logger.debug('WebSocket message received', { type: data.type });
        } catch (error) {
          logger.error('Error parsing WebSocket message', error instanceof Error ? error : new Error(String(error)));
        }
      };
      
      ws.onclose = () => {
        logger.info('WebSocket connection closed');
        setIsConnected(false);
      };

      ws.onerror = (error) => {
        logger.error('WebSocket error', new Error('WebSocket connection error'));
        // Close the socket on error to trigger the onclose handler
        ws.close();
      };
      
      setSocket(ws);
      
      // Cleanup function
      return () => {
        ws.close();
      };
    } catch (error) {
      logger.error('Error initializing WebSocket', error instanceof Error ? error : new Error(String(error)));
    }
  }, [url, address, subscriptions]);
  
  // Initialize WebSocket on component mount
  useEffect(() => {
    const cleanup = initializeWebSocket();
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [initializeWebSocket]);
  
  // Handle reconnection logic separately to avoid dependency cycle
  useEffect(() => {
    if (!isConnected && socket === null) {
      const reconnectTimeout = setTimeout(() => {
        logger.debug('Attempting to reconnect WebSocket');
        initializeWebSocket();
      }, 3000);
      
      return () => clearTimeout(reconnectTimeout);
    }
  }, [isConnected, socket, initializeWebSocket]);
  
  // Subscribe to user-specific topic when wallet connects
  useEffect(() => {
    if (socket && isConnected && address) {
      const userTopic = `user:${address}`;
      if (!subscriptions.includes(userTopic)) {
        const subscriptionMessage = JSON.stringify({ topic: userTopic });
        socket.send(subscriptionMessage);
        setSubscriptions(prev => [...prev, userTopic]);
      }
    }
  }, [address, socket, isConnected, subscriptions]);
  
  // Subscribe to a topic
  const subscribe = (topic: string) => {
    if (socket && isConnected) {
      const subscriptionMessage = JSON.stringify({ topic });
      socket.send(subscriptionMessage);
      setSubscriptions(prev => [...prev, topic]);
    }
  };
  
  // Unsubscribe from a topic
  const unsubscribe = (topic: string) => {
    setSubscriptions(prev => prev.filter(t => t !== topic));
  };
  
  // Reconnect WebSocket
  const reconnect = () => {
    if (socket) {
      socket.close();
    }
    initializeWebSocket();
  };
  
  const value = {
    isConnected,
    subscribe,
    unsubscribe,
    lastEvent,
    events,
    subscriptions,
    reconnect
  };
  
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Hook to use the WebSocket context
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// Specialized hook for L2 message updates
export const useL2MessageUpdates = (messageId?: string) => {
  const { subscribe, unsubscribe, events } = useWebSocket();
  
  useEffect(() => {
    // Subscribe to general L2 messages
    subscribe(SubscriptionTopic.L2_MESSAGES);
    
    // Subscribe to specific message updates if messageId is provided
    if (messageId) {
      subscribe(`${SubscriptionTopic.L2_MESSAGE}:${messageId}`);
    }
    
    return () => {
      // Cleanup subscriptions
      unsubscribe(SubscriptionTopic.L2_MESSAGES);
      if (messageId) {
        unsubscribe(`${SubscriptionTopic.L2_MESSAGE}:${messageId}`);
      }
    };
  }, [messageId, subscribe, unsubscribe]);
  
  // Filter events for L2 message updates
  const messageUpdates = events.filter(
    event => event.type === WebSocketEventType.L2_MESSAGE_STATUS_UPDATE
  ) as Array<{ type: WebSocketEventType.L2_MESSAGE_STATUS_UPDATE, payload: L2MessageStatusUpdate }>;
  
  // Further filter for specific messageId if provided
  const filteredUpdates = messageId 
    ? messageUpdates.filter(update => update.payload.message_id === messageId)
    : messageUpdates;
  
  return filteredUpdates;
};

// Specialized hook for Smart Account operations
export const useSmartAccountOperations = (accountId?: string) => {
  const { subscribe, unsubscribe, events } = useWebSocket();
  
  useEffect(() => {
    // Subscribe to general smart account operations
    subscribe(SubscriptionTopic.SMART_ACCOUNTS);
    
    // Subscribe to specific account operations if accountId is provided
    if (accountId) {
      subscribe(`${SubscriptionTopic.SMART_ACCOUNT}:${accountId}`);
    }
    
    return () => {
      // Cleanup subscriptions
      unsubscribe(SubscriptionTopic.SMART_ACCOUNTS);
      if (accountId) {
        unsubscribe(`${SubscriptionTopic.SMART_ACCOUNT}:${accountId}`);
      }
    };
  }, [accountId, subscribe, unsubscribe]);
  
  // Filter events for smart account operations
  const operations = events.filter(
    event => event.type === WebSocketEventType.SMART_ACCOUNT_OPERATION
  ) as Array<{ type: WebSocketEventType.SMART_ACCOUNT_OPERATION, payload: SmartAccountOperation }>;
  
  // Further filter for specific accountId if provided
  const filteredOperations = accountId 
    ? operations.filter(operation => operation.payload.account_id === accountId)
    : operations;
  
  return filteredOperations;
};

export default WebSocketContext; 