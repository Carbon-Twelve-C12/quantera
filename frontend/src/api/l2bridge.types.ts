/**
 * L2Bridge Types
 * These types are used for the L2Bridge functionality
 */

// Use string type for large numbers
export type BigNumberish = string;

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
  gasAmount: BigNumberish;
  gasCost: BigNumberish;
  gasPrice: BigNumberish;
  estimatedTimeSeconds: number;
  estimatedUsdCost: number;
  useBlob: boolean;
  blobGasLimit: BigNumberish;
  callDataGasLimit: BigNumberish;
}

/**
 * Details of an order being bridged
 */
export interface OrderDetails {
  orderId: string;
  fromChainId: number;
  toChainId: number;
  amount: BigNumberish;
  tokenAddress?: string;
  recipient: string;
  timestamp: number;
  status: MessageStatus;
  txHash?: string;
  messageId?: string;
  treasuryId?: string;
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
  destinationChainId: number;
  failureReason?: string;
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
  amount: BigNumberish;
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

/**
 * Bridge message details
 */
export interface BridgeMessage {
  messageId: string;
  fromChainId: number;
  toChainId: number;
  sender: string;
  recipient: string;
  amount: BigNumberish;
  data: string;
  timestamp: number;
  status: MessageStatus;
  txHash: string;
  failureReason?: string;
  gasUsed?: BigNumberish;
}

/**
 * Bridge transaction data
 */
export interface BridgeTransaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'bridge';
  status: 'pending' | 'processing' | 'confirmed' | 'failed';
  timestamp: number;
  chainId: number;
  amount: BigNumberish;
  tokenAddress?: string;
  messageId?: string;
  error?: string;
}

/**
 * Bridge WebSocket event types
 */
export enum BridgeEventType {
  MESSAGE_STATUS_UPDATE = 'L2MessageStatusUpdate',
  NEW_MESSAGE = 'L2NewMessage',
  GAS_PRICE_UPDATE = 'L2GasPriceUpdate'
}

/**
 * Bridge WebSocket event
 */
export interface BridgeEvent {
  type: BridgeEventType;
  payload: MessageStatusResponse | BridgeMessage | { chainId: number; gasPrice: BigNumberish };
}

/**
 * Bridge API endpoints
 */
export enum BridgeEndpoints {
  CHAINS = '/api/l2/chains',
  ESTIMATE_GAS = '/api/l2/estimate-gas',
  BRIDGE_ORDER = '/api/l2/bridge',
  MESSAGE_STATUS = '/api/l2/message',
  USER_ORDERS = '/api/l2/user',
  TRANSACTIONS = '/api/l2/transactions'
}

/**
 * Blob data format
 */
export interface BlobData {
  data: Uint8Array;
  commitment: string;
  proof: string;
}

/**
 * L2Bridge subscription topics
 */
export enum L2BridgeSubscriptionTopic {
  L2_MESSAGES = 'l2_messages',
  L2_CHAIN = 'l2_chain',
  L2_MESSAGE = 'l2_message'
} 