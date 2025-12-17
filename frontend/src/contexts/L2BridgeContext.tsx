import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useWebSocket, SubscriptionTopic } from './WebSocketContext';
import { useL2BridgeMessages } from '../hooks/useL2BridgeMessages';

// Define types for L2Bridge context
export interface ChainInfo {
  chainId: number;
  name: string;
  enabled: boolean;
  bridgeAddress: string;
  blobEnabled: boolean;
}

export interface OrderDetails {
  orderId: string;
  treasuryId: string;
  userAddress: string;
  isBuy: boolean;
  amount: string;
  price: string;
}

export interface MessageStatus {
  messageId: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REJECTED';
}

export interface GasEstimation {
  useBlob: boolean;
  blobGasLimit: string;
  callDataGasLimit: string;
  estimatedCompressedSize: string;
}

export interface MessageDetails {
  messageId: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REJECTED';
  timestamp: number;
  source: string;
  destination: string;
  data?: Record<string, unknown>;
}

export interface Transaction {
  id: string;
  type: string;
  status: string;
  timestamp: number;
  chainId: number;
  error?: string;
}

// L2Bridge context type
interface L2BridgeContextType {
  chains: ChainInfo[];
  selectedChain: ChainInfo | null;
  setSelectedChain: (chain: ChainInfo) => void;
  isBridging: boolean;
  orders: OrderDetails[];
  bridgeOrder: (order: OrderDetails) => Promise<void>;
  estimateBridgingGas: (dataSize: number, dataType: number) => Promise<GasEstimation>;
  getOrdersByUser: (userAddress: string) => Promise<string[]>;
  getMessageDetails: (messageId: string) => Promise<MessageDetails>;
  getSupportedChains: () => Promise<ChainInfo[]>;
  transactions: Transaction[];
  isWebSocketConnected: boolean;
  messagesLoading: boolean;
  messagesError: string | null;
}

// Create context
const L2BridgeContext = createContext<L2BridgeContextType>({
  chains: [],
  selectedChain: null,
  setSelectedChain: () => {},
  isBridging: false,
  orders: [],
  bridgeOrder: async () => {},
  estimateBridgingGas: async () => ({
    useBlob: false,
    blobGasLimit: "0",
    callDataGasLimit: "0",
    estimatedCompressedSize: "0"
  }),
  getOrdersByUser: async () => [],
  getMessageDetails: async () => ({ messageId: '', status: 'PENDING', timestamp: 0, source: '', destination: '' }),
  getSupportedChains: async () => [],
  transactions: [],
  isWebSocketConnected: false,
  messagesLoading: true,
  messagesError: null
});

export const L2BridgeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [chains, setChains] = useState<ChainInfo[]>([
    { chainId: 10, name: 'Optimism', enabled: true, bridgeAddress: '0x...', blobEnabled: true },
    { chainId: 42161, name: 'Arbitrum', enabled: true, bridgeAddress: '0x...', blobEnabled: false },
    { chainId: 137, name: 'Polygon', enabled: true, bridgeAddress: '0x...', blobEnabled: true }
  ]);
  const [selectedChain, setSelectedChain] = useState<ChainInfo | null>(chains[0]);
  const [isBridging, setIsBridging] = useState(false);
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const { address } = useWallet();
  const { isConnected: isWebSocketConnected } = useWebSocket();
  const { messages, loading: messagesLoading, error: messagesError } = useL2BridgeMessages(
    selectedChain?.chainId, 
    address || undefined
  );
  
  // Get supported chains
  const getSupportedChains = async (): Promise<ChainInfo[]> => {
    // In a real implementation, this would call an API
    // For now, just return the local state
    return chains.filter(chain => chain.enabled);
  };
  
  // Bridge an order to L2
  const bridgeOrder = async (order: OrderDetails) => {
    setIsBridging(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Bridging order:', order);
      setIsBridging(false);
    } catch (error) {
      console.error('Error bridging order:', error);
      setIsBridging(false);
    }
  };
  
  // Estimate gas for bridging operation
  const estimateBridgingGas = async (dataSize: number, dataType: number): Promise<GasEstimation> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      useBlob: dataSize > 100000,
      blobGasLimit: "500000",
      callDataGasLimit: "1000000",
      estimatedCompressedSize: (dataSize * 0.7).toString()
    };
  };
  
  // Get orders by user
  const getOrdersByUser = async (userAddress: string): Promise<string[]> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return ['order1', 'order2', 'order3'];
  };
  
  // Get message details
  const getMessageDetails = async (messageId: string): Promise<MessageDetails> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      messageId,
      status: 'PENDING',
      timestamp: Date.now(),
      source: 'Ethereum',
      destination: selectedChain?.name || 'Unknown'
    };
  };

  // Update transactions from WebSocket messages
  useEffect(() => {
    if (messages.length > 0) {
      // Map messages to transactions format
      const messageTransactions = messages.map(message => ({
        id: message.messageId,
        type: 'bridge',
        status: message.status.toLowerCase(),
        timestamp: message.timestamp,
        chainId: message.destinationChainId,
        error: message.failureReason || undefined
      }));
      
      // Update transactions state with real-time data
      setTransactions(prevTransactions => {
        // Create a map of existing transactions for easy lookup
        const existingTransactionsMap = new Map(
          prevTransactions.map(tx => [tx.id, tx] as [string, Transaction])
        );
        
        // Update existing transactions with new data
        messageTransactions.forEach(tx => {
          const existing = existingTransactionsMap.get(tx.id);
          existingTransactionsMap.set(tx.id, {
            ...(existing || {}),
            ...tx
          } as Transaction);
        });
        
        // Convert map back to array and sort by timestamp (newest first)
        return Array.from(existingTransactionsMap.values())
          .sort((a, b) => b.timestamp - a.timestamp);
      });
    }
  }, [messages]);
  
  const contextValue: L2BridgeContextType = {
    chains,
    selectedChain,
    setSelectedChain,
    isBridging,
    orders,
    bridgeOrder,
    estimateBridgingGas,
    getOrdersByUser,
    getMessageDetails,
    getSupportedChains,
    transactions,
    isWebSocketConnected,
    messagesLoading,
    messagesError
  };
  
  return (
    <L2BridgeContext.Provider value={contextValue}>
      {children}
    </L2BridgeContext.Provider>
  );
};

export const useL2Bridge = () => useContext(L2BridgeContext);

export default L2BridgeContext; 