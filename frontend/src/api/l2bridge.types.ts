/**
 * L2Bridge Types
 * These types are used for the L2Bridge functionality
 */

// Use string type for large numbers
type BigNumberish = string;

/**
 * MessageStatus enum
 */
export enum MessageStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  CONFIRMED = "CONFIRMED",
  FAILED = "FAILED"
}

/**
 * Details of a currency used in a chain
 */
export interface Currency {
  name: string;
  symbol: string;
  decimals: number;
}

/**
 * Information about a blockchain network
 */
export interface ChainInfo {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: Currency;
  blob_enabled?: boolean; // Whether the chain supports EIP-7691 blob data
}

/**
 * Gas estimation for a bridge transaction
 */
export interface GasEstimation {
  gasAmount: string;
  gasCost: string;
  gasPrice: string;
  estimatedTimeSeconds: number;
  estimatedUsdCost?: number;
  useBlob?: boolean;
  blobGasLimit?: string;
  callDataGasLimit?: string;
}

/**
 * Details of an order being bridged
 */
export interface OrderDetails {
  orderId: string;
  fromChainId: number;
  toChainId: number;
  amount: string;
  tokenAddress: string;
  recipient: string;
  timestamp: number;
  status: MessageStatus;
  txHash: string;
  messageId?: string;
}

/**
 * Response from the bridge message status API
 */
export interface MessageStatusResponse {
  messageId: string;
  status: MessageStatus;
  fromChainId: number;
  toChainId: number;
  timestamp: number;
  txHash: string;
}

/**
 * Request to estimate gas for a bridge transaction
 */
export interface GasEstimateRequest {
  fromChainId: number;
  toChainId: number;
  dataSize: number;
  useBlob: boolean;
}

/**
 * Request to bridge an order to another chain
 */
export interface BridgeOrderRequest {
  fromChainId: number;
  toChainId: number;
  recipient: string;
  amount: string;
  tokenAddress?: string; // Optional, defaults to native token
  treasuryId?: string; // Optional treasury ID for treasury tokens
}

/**
 * Response from the order bridging API
 */
export interface BridgeOrderResponse {
  orderId: string;
  messageId: string;
  txHash: string;
  status: MessageStatus;
} 