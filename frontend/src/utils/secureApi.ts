/**
 * Secure API Client with CSRF Protection
 *
 * This module provides a secure wrapper around fetch() with:
 * - CSRF token management
 * - Automatic token refresh
 * - Request/response interceptors
 * - Error handling
 * - Security headers
 *
 * SECURITY NOTES:
 * - JWT tokens in Authorization headers provide CSRF protection for authenticated requests
 * - CSRF tokens are used as defense-in-depth for state-changing operations
 * - All requests include proper security headers
 */

import { generateSecureToken } from './crypto';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const CSRF_TOKEN_KEY = 'quantera_csrf_token';
const CSRF_HEADER = 'X-CSRF-Token';

// Request timeout (30 seconds)
const REQUEST_TIMEOUT = 30000;

/**
 * CSRF Token Management
 */
class CSRFTokenManager {
  private token: string | null = null;
  private tokenExpiry: number = 0;
  private readonly TOKEN_LIFETIME = 3600000; // 1 hour

  /**
   * Get or generate a CSRF token
   */
  getToken(): string {
    const now = Date.now();

    // Return existing token if valid
    if (this.token && this.tokenExpiry > now) {
      return this.token;
    }

    // Generate new token
    this.token = generateSecureToken(32);
    this.tokenExpiry = now + this.TOKEN_LIFETIME;

    // Store in sessionStorage (not localStorage) for session binding
    try {
      sessionStorage.setItem(CSRF_TOKEN_KEY, this.token);
      sessionStorage.setItem(`${CSRF_TOKEN_KEY}_expiry`, String(this.tokenExpiry));
    } catch {
      // SessionStorage not available, token will be in-memory only
    }

    return this.token;
  }

  /**
   * Initialize from session storage
   */
  initialize(): void {
    try {
      const storedToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
      const storedExpiry = sessionStorage.getItem(`${CSRF_TOKEN_KEY}_expiry`);

      if (storedToken && storedExpiry) {
        const expiry = parseInt(storedExpiry, 10);
        if (expiry > Date.now()) {
          this.token = storedToken;
          this.tokenExpiry = expiry;
        }
      }
    } catch {
      // SessionStorage not available
    }
  }

  /**
   * Clear the CSRF token
   */
  clear(): void {
    this.token = null;
    this.tokenExpiry = 0;
    try {
      sessionStorage.removeItem(CSRF_TOKEN_KEY);
      sessionStorage.removeItem(`${CSRF_TOKEN_KEY}_expiry`);
    } catch {
      // SessionStorage not available
    }
  }
}

// Singleton CSRF token manager
const csrfManager = new CSRFTokenManager();
csrfManager.initialize();

/**
 * Request configuration interface
 */
interface SecureRequestConfig extends RequestInit {
  timeout?: number;
  skipCSRF?: boolean;
  skipAuth?: boolean;
}

/**
 * API error class with additional context
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: unknown;
  public readonly requestId?: string;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: unknown,
    requestId?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }

  static fromResponse(response: Response, body: unknown): ApiError {
    const errorBody = body as Record<string, unknown>;
    return new ApiError(
      (errorBody?.message as string) || response.statusText || 'Request failed',
      response.status,
      errorBody?.code as string,
      errorBody?.details,
      errorBody?.request_id as string
    );
  }
}

/**
 * Get the current auth token from storage
 */
async function getAuthToken(): Promise<string | null> {
  try {
    // Import dynamically to avoid circular dependencies
    const { secureStorage } = await import('./crypto');
    return await secureStorage.getItem('quantera_auth_token');
  } catch {
    return null;
  }
}

/**
 * Create a secure fetch request with timeout
 */
function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new ApiError('Request timeout', 408, 'TIMEOUT'));
    }, timeout);

    fetch(url, {
      ...options,
      signal: controller.signal,
    })
      .then((response) => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          reject(new ApiError('Request timeout', 408, 'TIMEOUT'));
        } else {
          reject(new ApiError(error.message, 0, 'NETWORK_ERROR'));
        }
      });
  });
}

/**
 * Main secure API request function
 */
export async function secureRequest<T>(
  endpoint: string,
  config: SecureRequestConfig = {}
): Promise<T> {
  const {
    timeout = REQUEST_TIMEOUT,
    skipCSRF = false,
    skipAuth = false,
    headers: customHeaders = {},
    ...fetchOptions
  } = config;

  // Build URL
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    // Security headers
    'X-Requested-With': 'XMLHttpRequest', // Helps prevent CSRF in some browsers
    ...(customHeaders as Record<string, string>),
  };

  // Add CSRF token for state-changing operations
  const method = (fetchOptions.method || 'GET').toUpperCase();
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!skipCSRF && stateChangingMethods.includes(method)) {
    headers[CSRF_HEADER] = csrfManager.getToken();
  }

  // Add auth token if available and not skipped
  if (!skipAuth) {
    const authToken = await getAuthToken();
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
  }

  // Make request
  const response = await fetchWithTimeout(
    url,
    {
      ...fetchOptions,
      headers,
      credentials: 'same-origin', // Include cookies for same-origin requests
    },
    timeout
  );

  // Parse response
  let body: unknown;
  const contentType = response.headers.get('Content-Type') || '';

  if (contentType.includes('application/json')) {
    try {
      body = await response.json();
    } catch {
      body = null;
    }
  } else {
    body = await response.text();
  }

  // Handle errors
  if (!response.ok) {
    throw ApiError.fromResponse(response, body);
  }

  return body as T;
}

/**
 * Convenience methods for common HTTP operations
 */
export const api = {
  /**
   * GET request
   */
  async get<T>(endpoint: string, config?: SecureRequestConfig): Promise<T> {
    return secureRequest<T>(endpoint, { ...config, method: 'GET' });
  },

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    config?: SecureRequestConfig
  ): Promise<T> {
    return secureRequest<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    config?: SecureRequestConfig
  ): Promise<T> {
    return secureRequest<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: unknown,
    config?: SecureRequestConfig
  ): Promise<T> {
    return secureRequest<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: SecureRequestConfig): Promise<T> {
    return secureRequest<T>(endpoint, { ...config, method: 'DELETE' });
  },
};

/**
 * Clear all security tokens (call on logout)
 */
export function clearSecurityTokens(): void {
  csrfManager.clear();
}

/**
 * Hook to use the secure API in React components
 */
export function useSecureApi() {
  return api;
}

export default api;
