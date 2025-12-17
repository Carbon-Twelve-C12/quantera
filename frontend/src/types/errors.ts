/**
 * Shared Error Types for Quantera Platform
 *
 * These types provide type-safe error handling across the application.
 */

/**
 * Standard API error response from backend
 */
export interface ApiErrorResponse {
  message?: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
  request_id?: string;
}

/**
 * Axios error structure for type-safe error handling
 */
export interface AxiosLikeError {
  message: string;
  name: string;
  code?: string | number;
  response?: {
    status: number;
    statusText: string;
    data?: ApiErrorResponse | string;
  };
  request?: unknown;
}

/**
 * Web3/Ethereum error structure
 */
export interface Web3Error extends Error {
  code?: number | string;
  reason?: string;
  data?: unknown;
}

/**
 * MetaMask specific error codes
 */
export const MetaMaskErrorCodes = {
  USER_REJECTED_REQUEST: 4001,
  RESOURCE_UNAVAILABLE: -32002,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
} as const;

/**
 * Type guard to check if an error is an AxiosLikeError
 */
export function isAxiosError(error: unknown): error is AxiosLikeError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as AxiosLikeError).response?.status === 'number'
  );
}

/**
 * Type guard to check if an error is a Web3Error
 */
export function isWeb3Error(error: unknown): error is Web3Error {
  return (
    error instanceof Error &&
    ('code' in error || 'reason' in error)
  );
}

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === 'object' && data?.message) {
      return data.message;
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
}
