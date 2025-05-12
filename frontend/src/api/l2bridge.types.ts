/**
 * L2Bridge API TypeScript types
 */

import { BigNumber } from 'ethers';

/**
 * MessageStatus enum
 */
export enum MessageStatus {
  PENDING = 0,
  CONFIRMED = 1,
  FAILED = 2,
  EXPIRED = 3
}

/**
 * Chain information
 */
export interface ChainInfo {
  chainId: number;
  chainType: number;
  name: string;
  bridgeAddress: string;
  rollupAddress: string;
  verificationBlocks: number;
  gasTokenSymbol: string;
  nativeTokenPriceUsd: BigNumber;
  averageBlockTime: number;
  blob_enabled: boolean;
  maxMessageSize: number;
}

/**
 * Order details for bridging
 */
export interface OrderDetails {
  order_id: string;
  treasury_id: string;
  user: string;
  is_buy: boolean;
  amount: BigNumber;
  price: BigNumber;
  expiration: number;
  signature: string;
  destinationChainId: number;
}

/**
 * Cross-chain message
 */
export interface CrossChainMessage {
  messageId: string;
  sender: string;
  sourceChainId: number;
  destinationChainId: number;
  related_id: string; // Order ID or other related ID
  data: string;
  timestamp: number;
  status: MessageStatus;
  statusMessage: string;
  useBlob: boolean;
}

/**
 * Gas estimation result
 */
export interface GasEstimation {
  useBlob: boolean;
  blobGasLimit: number;
  callDataGasLimit: number;
  estimatedGasCost: number;
  estimatedUsdCost: number;
}

/**
 * L2Bridge event types
 */
export enum L2BridgeEventType {
  ORDER_BRIDGED = 'OrderBridged',
  MESSAGE_STATUS_UPDATED = 'MessageStatusUpdated',
  CHAIN_ADDED = 'ChainAdded',
  CHAIN_UPDATED = 'ChainUpdated'
}

/**
 * Order bridged event
 */
export interface OrderBridgedEvent {
  type: L2BridgeEventType.ORDER_BRIDGED;
  orderId: string;
  messageId: string;
  destinationChainId: number;
  sender: string;
  timestamp: number;
}

/**
 * Message status updated event
 */
export interface MessageStatusUpdatedEvent {
  type: L2BridgeEventType.MESSAGE_STATUS_UPDATED;
  messageId: string;
  status: MessageStatus;
  statusMessage: string;
  timestamp: number;
}

/**
 * Chain added event
 */
export interface ChainAddedEvent {
  type: L2BridgeEventType.CHAIN_ADDED;
  chainId: number;
  name: string;
  bridgeAddress: string;
  timestamp: number;
}

/**
 * Chain updated event
 */
export interface ChainUpdatedEvent {
  type: L2BridgeEventType.CHAIN_UPDATED;
  chainId: number;
  name: string;
  bridgeAddress: string;
  timestamp: number;
}

/**
 * Union type for all L2Bridge events
 */
export type L2BridgeEvent = 
  | OrderBridgedEvent
  | MessageStatusUpdatedEvent
  | ChainAddedEvent
  | ChainUpdatedEvent;

/**
 * WebSocket subscription topics
 */
export enum SubscriptionTopic {
  ALL_MESSAGES = 'l2_messages',
  SPECIFIC_MESSAGE = 'l2_message:', // Append messageId
  CHAIN = 'l2_chain:', // Append chainId
  USER = 'user:' // Append userAddress
}

/**
 * WebSocket subscription request
 */
export interface SubscriptionRequest {
  topic: string;
  auth_token?: string;
} 