import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './WalletContext';
import L2BridgeABI from '../api/abis/L2Bridge.json';
import { L2BridgeGasOptimizer__factory } from '../api/typechain';
import { MessageStatus, OrderDetails, GasEstimation, ChainInfo } from '../api/l2bridge.types';

interface L2BridgeContextType {
  // Bridge information
  bridgeAddress: string | null;
  bridgeContract: ethers.Contract | null;
  gasOptimizerAddress: string | null;
  gasOptimizerContract: ethers.Contract | null;
  
  // Chain information
  supportedChains: ChainInfo[];
  getSupportedChains: () => Promise<ChainInfo[]>;
  getChainInfo: (chainId: number) => Promise<ChainInfo>;
  
  // Bridging operations
  bridgeOrder: (order: OrderDetails) => Promise<ethers.ContractTransaction>;
  getOrdersByUser: (userAddress: string) => Promise<string[]>;
  
  // Message handling
  getMessageStatus: (messageId: string) => Promise<MessageStatus>;
  getMessageDetails: (messageId: string) => Promise<any>;
  
  // Gas estimation
  estimateBridgingGas: (
    chainId: number,
    dataSize: number,
    useBlob: boolean
  ) => Promise<GasEstimation>;
  calculateOptimalDataFormat: (
    chainId: number,
    dataSize: number
  ) => Promise<boolean>;
  
  // Loading state
  isLoading: boolean;
}

// Default context value
const defaultContextValue: L2BridgeContextType = {
  bridgeAddress: null,
  bridgeContract: null,
  gasOptimizerAddress: null,
  gasOptimizerContract: null,
  supportedChains: [],
  getSupportedChains: async () => [],
  getChainInfo: async () => ({} as ChainInfo),
  bridgeOrder: async () => ({} as ethers.ContractTransaction),
  getOrdersByUser: async () => [],
  getMessageStatus: async () => MessageStatus.PENDING,
  getMessageDetails: async () => ({}),
  estimateBridgingGas: async () => ({} as GasEstimation),
  calculateOptimalDataFormat: async () => false,
  isLoading: false,
};

// Create context
const L2BridgeContext = createContext<L2BridgeContextType>(defaultContextValue);

// Contract addresses (should be environment variables in a real application)
const L2_BRIDGE_ADDRESS = '0x1234567890123456789012345678901234567890'; // Replace with actual address
const L2_GAS_OPTIMIZER_ADDRESS = '0x0987654321098765432109876543210987654321'; // Replace with actual address

// Provider component
export const L2BridgeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { provider, signer, chainId, account, isConnected } = useWallet();
  
  const [bridgeContract, setBridgeContract] = useState<ethers.Contract | null>(null);
  const [gasOptimizerContract, setGasOptimizerContract] = useState<ethers.Contract | null>(null);
  const [supportedChains, setSupportedChains] = useState<ChainInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Initialize contracts when provider/signer changes
  useEffect(() => {
    if (!provider) return;
    
    const initContracts = async () => {
      try {
        setIsLoading(true);
        
        // Initialize L2Bridge contract
        const bridge = new ethers.Contract(
          L2_BRIDGE_ADDRESS,
          L2BridgeABI,
          signer || provider
        );
        setBridgeContract(bridge);
        
        // Initialize L2BridgeGasOptimizer contract
        const gasOptimizer = L2BridgeGasOptimizer__factory.connect(
          L2_GAS_OPTIMIZER_ADDRESS,
          signer || provider
        );
        setGasOptimizerContract(gasOptimizer);
        
        // Load supported chains
        const chains = await loadSupportedChains(bridge);
        setSupportedChains(chains);
      } catch (error) {
        console.error('Failed to initialize L2Bridge contracts', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initContracts();
  }, [provider, signer]);
  
  // Load supported chains
  const loadSupportedChains = async (bridge: ethers.Contract): Promise<ChainInfo[]> => {
    if (!bridge) return [];
    
    try {
      // In a real implementation, this would call bridge.getSupportedChains()
      // For now, we'll return mock data
      return [
        {
          chainId: 10,
          chainType: 0, // OPTIMISM
          name: 'Optimism',
          bridgeAddress: '0x1234567890123456789012345678901234567890',
          rollupAddress: '0x0000000000000000000000000000000000000000',
          verificationBlocks: 6,
          gasTokenSymbol: 'ETH',
          nativeTokenPriceUsd: ethers.utils.parseEther('2000'),
          averageBlockTime: 2,
          blob_enabled: true,
          maxMessageSize: 131072
        },
        {
          chainId: 42161,
          chainType: 1, // ARBITRUM
          name: 'Arbitrum One',
          bridgeAddress: '0x1234567890123456789012345678901234567890',
          rollupAddress: '0x0000000000000000000000000000000000000000',
          verificationBlocks: 15,
          gasTokenSymbol: 'ETH',
          nativeTokenPriceUsd: ethers.utils.parseEther('2000'),
          averageBlockTime: 1,
          blob_enabled: false,
          maxMessageSize: 131072
        }
      ];
    } catch (error) {
      console.error('Failed to load supported chains', error);
      return [];
    }
  };
  
  // Get chain information
  const getChainInfo = async (chainId: number): Promise<ChainInfo> => {
    if (!bridgeContract) throw new Error('Bridge contract not initialized');
    
    try {
      // In a real implementation, this would call bridge.getChainInfo(chainId)
      // For now, we'll filter from the supported chains array
      const chain = supportedChains.find(c => c.chainId === chainId);
      if (!chain) throw new Error(`Chain ID ${chainId} not supported`);
      
      return chain;
    } catch (error) {
      console.error(`Failed to get chain info for ${chainId}`, error);
      throw error;
    }
  };
  
  // Bridge an order
  const bridgeOrder = async (order: OrderDetails): Promise<ethers.ContractTransaction> => {
    if (!bridgeContract || !signer) throw new Error('Bridge contract not initialized or signer not available');
    
    try {
      // In a real implementation, this would check if useBlob is true and add appropriate gas parameters
      const gasEstimation = await estimateBridgingGas(
        order.destinationChainId,
        1000, // Assuming 1KB data size
        true // Try with blob
      );
      
      // Prepare transaction options
      const options: ethers.PayableOverrides = {
        gasLimit: gasEstimation.useBlob ? gasEstimation.blobGasLimit : gasEstimation.callDataGasLimit
      };
      
      // Execute the transaction
      return await bridgeContract.bridgeOrder(order, options);
    } catch (error) {
      console.error('Failed to bridge order', error);
      throw error;
    }
  };
  
  // Get orders by user
  const getOrdersByUser = async (userAddress: string): Promise<string[]> => {
    if (!bridgeContract) throw new Error('Bridge contract not initialized');
    
    try {
      // In a real implementation, this would call bridge.getOrdersByUser(userAddress)
      // For now, we'll return mock data
      return [
        ethers.utils.id(`${userAddress}-1`),
        ethers.utils.id(`${userAddress}-2`),
        ethers.utils.id(`${userAddress}-3`)
      ];
    } catch (error) {
      console.error(`Failed to get orders for user ${userAddress}`, error);
      throw error;
    }
  };
  
  // Get message status
  const getMessageStatus = async (messageId: string): Promise<MessageStatus> => {
    if (!bridgeContract) throw new Error('Bridge contract not initialized');
    
    try {
      // In a real implementation, this would call bridge.getMessageStatus(messageId)
      // For now, we'll return a mock status
      return MessageStatus.CONFIRMED;
    } catch (error) {
      console.error(`Failed to get message status for ${messageId}`, error);
      throw error;
    }
  };
  
  // Get message details
  const getMessageDetails = async (messageId: string): Promise<any> => {
    if (!bridgeContract) throw new Error('Bridge contract not initialized');
    
    try {
      // In a real implementation, this would call bridge.getMessageDetails(messageId)
      // For now, we'll return mock data
      return {
        messageId,
        sender: account || ethers.constants.AddressZero,
        sourceChainId: chainId || 1,
        destinationChainId: 10, // Optimism
        related_id: messageId,
        data: '0x',
        timestamp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        status: MessageStatus.CONFIRMED,
        statusMessage: '',
        useBlob: true,
        amount: ethers.utils.parseEther('0.1') // For UI display
      };
    } catch (error) {
      console.error(`Failed to get message details for ${messageId}`, error);
      throw error;
    }
  };
  
  // Estimate gas for bridging
  const estimateBridgingGas = async (
    chainId: number,
    dataSize: number,
    useBlob: boolean
  ): Promise<GasEstimation> => {
    if (!bridgeContract) throw new Error('Bridge contract not initialized');
    
    try {
      // In a real implementation, this would call bridge.estimateBridgingGas(chainId, dataSize, useBlob)
      // For now, we'll return mock data
      const chain = await getChainInfo(chainId);
      
      const isOptimal = await calculateOptimalDataFormat(chainId, dataSize);
      
      // Use the requested format or the optimal one if different
      const shouldUseBlob = useBlob !== undefined ? useBlob : isOptimal;
      
      // Calculate blob gas limit (simplified)
      const blobGasLimit = shouldUseBlob
        ? Math.ceil(dataSize / 131072) * 131072 // 131072 = 2^17
        : 0;
      
      // Calculate calldata gas limit (simplified)
      const callDataGasLimit = Math.ceil(dataSize * 16); // 16 gas per byte
      
      // Calculate cost in USD (simplified)
      const gasPrice = ethers.utils.parseUnits('10', 'gwei');
      const blobGasPrice = ethers.utils.parseUnits('1', 'gwei');
      
      const ethPrice = chain.nativeTokenPriceUsd.div(ethers.utils.parseEther('1'));
      
      const estimatedGasCost = shouldUseBlob
        ? blobGasLimit * Number(ethers.utils.formatUnits(blobGasPrice, 'gwei'))
        : callDataGasLimit * Number(ethers.utils.formatUnits(gasPrice, 'gwei'));
      
      const estimatedUsdCost = estimatedGasCost * Number(ethers.utils.formatEther(ethPrice));
      
      return {
        useBlob: shouldUseBlob,
        blobGasLimit,
        callDataGasLimit,
        estimatedGasCost,
        estimatedUsdCost
      };
    } catch (error) {
      console.error(`Failed to estimate gas for chain ${chainId}`, error);
      throw error;
    }
  };
  
  // Calculate optimal data format
  const calculateOptimalDataFormat = async (
    chainId: number,
    dataSize: number
  ): Promise<boolean> => {
    if (!bridgeContract) throw new Error('Bridge contract not initialized');
    
    try {
      // In a real implementation, this would call bridge.calculateOptimalDataFormat(chainId, dataSize)
      // For now, we'll use a simple threshold
      const chain = await getChainInfo(chainId);
      
      // Use blob if the chain supports it and the data is large enough
      return chain.blob_enabled && dataSize > 100000; // 100KB threshold
    } catch (error) {
      console.error(`Failed to calculate optimal data format for chain ${chainId}`, error);
      throw error;
    }
  };
  
  // Create context value
  const contextValue: L2BridgeContextType = {
    bridgeAddress: L2_BRIDGE_ADDRESS,
    bridgeContract,
    gasOptimizerAddress: L2_GAS_OPTIMIZER_ADDRESS,
    gasOptimizerContract,
    supportedChains,
    getSupportedChains: async () => supportedChains,
    getChainInfo,
    bridgeOrder,
    getOrdersByUser,
    getMessageStatus,
    getMessageDetails,
    estimateBridgingGas,
    calculateOptimalDataFormat,
    isLoading
  };
  
  return (
    <L2BridgeContext.Provider value={contextValue}>
      {children}
    </L2BridgeContext.Provider>
  );
};

// Hook for using the context
export const useL2Bridge = () => useContext(L2BridgeContext); 