import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useWallet } from './WalletContext';
import { MessageStatus, OrderDetails, GasEstimation, ChainInfo } from '../api/l2bridge.types';

// L2Bridge context type
interface L2BridgeContextType {
  // Bridge state
  isBridging: boolean;
  orders: OrderDetails[];
  supportedChains: ChainInfo[];
  
  // Methods
  bridgeOrder: (toChainId: number, recipient: string, amount: string) => Promise<string>;
  getOrderStatus: (orderId: string) => MessageStatus;
  estimateGas: (toChainId: number, amount: string) => Promise<GasEstimation>;
  refreshOrders: () => Promise<void>;
  
  // Additional methods needed by L2BridgeWidget
  getSupportedChains: () => Promise<ChainInfo[]>;
  estimateBridgingGas: (chainId: number, dataSize: number, useBlob: boolean) => Promise<any>;
  getOrdersByUser: (userAddress: string) => Promise<string[]>;
  getMessageDetails: (messageId: string) => Promise<any>;
}

// Create context with default values
const L2BridgeContext = createContext<L2BridgeContextType>({
  isBridging: false,
  orders: [],
  supportedChains: [],
  
  bridgeOrder: async () => '',
  getOrderStatus: () => MessageStatus.PENDING,
  estimateGas: async () => ({ 
    gasAmount: '0',
    gasCost: '0',
    gasPrice: '0',
    estimatedTimeSeconds: 0
  }),
  refreshOrders: async () => {},
  
  // Additional methods needed by L2BridgeWidget
  getSupportedChains: async () => [],
  estimateBridgingGas: async () => {},
  getOrdersByUser: async () => [],
  getMessageDetails: async () => {}
});

// Hook to use L2Bridge context
export const useL2Bridge = () => useContext(L2BridgeContext);

// Mock implementation of the L2Bridge provider
export const L2BridgeProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const { connected } = useWallet();
  const [isBridging, setIsBridging] = useState(false);
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  
  // Supported chains (mock data)
  const supportedChains: ChainInfo[] = [
    {
      chainId: 1,
      name: 'Ethereum',
      rpcUrl: 'https://mainnet.infura.io/v3/your-key',
      explorerUrl: 'https://etherscan.io',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18
      }
    },
    {
      chainId: 42161,
      name: 'Arbitrum',
      rpcUrl: 'https://arb1.arbitrum.io/rpc',
      explorerUrl: 'https://arbiscan.io',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18
      }
    }
  ];

  // Mock bridge order function
  const bridgeOrder = async (toChainId: number, recipient: string, amount: string): Promise<string> => {
    if (!connected) throw new Error('Wallet not connected');
    
    setIsBridging(true);
    try {
      // Simulate some async operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newOrder: OrderDetails = {
        orderId: `order-${Date.now()}`,
        fromChainId: 1, // Assuming from Ethereum
        toChainId,
        amount,
        tokenAddress: '0x0000000000000000000000000000000000000000', // ETH
        recipient,
        timestamp: Math.floor(Date.now() / 1000),
        status: MessageStatus.PENDING,
        txHash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`
      };
      
      setOrders(prev => [...prev, newOrder]);
      return newOrder.orderId;
    } finally {
      setIsBridging(false);
    }
  };

  // Mock get order status
  const getOrderStatus = (orderId: string): MessageStatus => {
    const order = orders.find(o => o.orderId === orderId);
    return order?.status || MessageStatus.PENDING;
  };

  // Mock gas estimation
  const estimateGas = async (toChainId: number, amount: string): Promise<GasEstimation> => {
    // Simulate some async operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      gasAmount: '200000',
      gasCost: '0.005',
      gasPrice: '25',
      estimatedTimeSeconds: 120
    };
  };

  // Mock refresh orders
  const refreshOrders = async (): Promise<void> => {
    // Simulate fetching updated orders
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update some order statuses randomly
    setOrders(prev => 
      prev.map(order => ({
        ...order,
        status: Math.random() > 0.5 ? MessageStatus.CONFIRMED : order.status
      }))
    );
  };

  return (
    <L2BridgeContext.Provider value={{
      isBridging,
      orders,
      supportedChains,
      bridgeOrder,
      getOrderStatus,
      estimateGas,
      refreshOrders,
      
      // Additional methods needed by L2BridgeWidget
      getSupportedChains: async () => supportedChains,
      estimateBridgingGas: async () => {},
      getOrdersByUser: async () => [],
      getMessageDetails: async () => {}
    }}>
      {children}
    </L2BridgeContext.Provider>
  );
};

export default L2BridgeContext; 