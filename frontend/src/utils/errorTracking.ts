/**
 * Error Tracking Utility
 *
 * Centralized error tracking with support for:
 * - Sentry integration (when available)
 * - Fallback to custom error reporting
 * - User context enrichment
 * - Breadcrumb trail
 * - Performance monitoring
 *
 * SETUP:
 *   1. Install Sentry: npm install @sentry/react
 *   2. Set REACT_APP_SENTRY_DSN environment variable
 *   3. Import and call initErrorTracking() in index.js
 *
 * USAGE:
 *   import { captureException, captureMessage, setUser } from '@/utils/errorTracking';
 *
 *   // Capture an error
 *   captureException(error, { component: 'PaymentForm' });
 *
 *   // Capture a message
 *   captureMessage('User completed onboarding', 'info');
 *
 *   // Set user context
 *   setUser({ id: '123', walletAddress: '0x...' });
 */

import { ENV } from './config';
import { logger } from './logger';

// =============================================================================
// Types
// =============================================================================

export type Severity = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

export interface UserContext {
  id?: string;
  walletAddress?: string;
  email?: string;
  [key: string]: unknown;
}

export interface ErrorContext {
  /** Component or module where error occurred */
  component?: string;
  /** Action being performed */
  action?: string;
  /** Additional context data */
  [key: string]: unknown;
}

export interface Breadcrumb {
  type: 'navigation' | 'http' | 'user' | 'error' | 'info';
  category: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

interface SentryLike {
  init: (options: Record<string, unknown>) => void;
  captureException: (error: Error, context?: Record<string, unknown>) => string;
  captureMessage: (message: string, level?: string) => string;
  setUser: (user: UserContext | null) => void;
  setTag: (key: string, value: string) => void;
  setContext: (name: string, context: Record<string, unknown>) => void;
  addBreadcrumb: (breadcrumb: Record<string, unknown>) => void;
  configureScope: (callback: (scope: unknown) => void) => void;
}

// =============================================================================
// State
// =============================================================================

let isInitialized = false;
let Sentry: SentryLike | null = null;
let currentUser: UserContext | null = null;
const breadcrumbs: Breadcrumb[] = [];
const MAX_BREADCRUMBS = 100;

// =============================================================================
// Initialization
// =============================================================================

/**
 * Initialize error tracking
 * Call this once at application startup
 */
export async function initErrorTracking(): Promise<void> {
  if (isInitialized) {
    logger.warn('Error tracking already initialized');
    return;
  }

  const dsn = process.env.REACT_APP_SENTRY_DSN;

  if (dsn) {
    try {
      // Dynamically import Sentry to avoid bundle size impact if not used
      // Use variable to prevent TypeScript from statically analyzing the import
      const sentryPackage = '@sentry/react';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SentryModule = await import(/* webpackIgnore: true */ sentryPackage).catch(() => null) as any;

      if (SentryModule) {
        Sentry = SentryModule as SentryLike;

        Sentry.init({
          dsn,
          environment: process.env.NODE_ENV,
          release: process.env.REACT_APP_VERSION || '0.0.0',

          // Performance monitoring
          tracesSampleRate: ENV.isProduction ? 0.1 : 1.0,

          // Session replay (if available)
          replaysSessionSampleRate: ENV.isProduction ? 0.1 : 0,
          replaysOnErrorSampleRate: 1.0,

          // Filter out noisy errors
          ignoreErrors: [
            // Browser extensions
            /^chrome-extension:\/\//,
            /^moz-extension:\/\//,
            // Network errors (handled separately)
            'NetworkError',
            'Failed to fetch',
            // User cancelled actions
            'AbortError',
            'User denied',
            'User rejected',
          ],

          // Before sending, sanitize sensitive data
          beforeSend(event: Record<string, unknown>) {
            // Remove wallet private keys or sensitive data
            const extra = event.extra as Record<string, unknown> | undefined;
            if (extra) {
              const sensitiveKeys = ['privateKey', 'mnemonic', 'seed', 'password', 'token'];
              for (const key of sensitiveKeys) {
                if (key in extra) {
                  extra[key] = '[REDACTED]';
                }
              }
            }
            return event;
          },
        });

        logger.info('Sentry error tracking initialized');
      } else {
        logger.info('@sentry/react not installed, using fallback error tracking');
      }
    } catch (error) {
      logger.warn('Failed to initialize Sentry, using fallback error tracking', { error });
      Sentry = null;
    }
  } else {
    logger.info('Sentry DSN not configured, using fallback error tracking');
  }

  isInitialized = true;
}

// =============================================================================
// Error Capture
// =============================================================================

/**
 * Capture an exception and send to error tracking service
 */
export function captureException(
  error: Error | unknown,
  context?: ErrorContext
): string {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  const eventId = generateEventId();

  // Log locally
  logger.error('Exception captured', errorObj, {
    eventId,
    ...context,
  });

  // Add breadcrumb
  addBreadcrumb({
    type: 'error',
    category: 'exception',
    message: errorObj.message,
    data: context,
  });

  // Send to Sentry if available
  if (Sentry) {
    try {
      return Sentry.captureException(errorObj, {
        extra: context,
        tags: {
          component: context?.component,
          action: context?.action,
        },
      });
    } catch {
      // Sentry failed, continue with fallback
    }
  }

  // Fallback: send to our own endpoint
  sendToFallbackEndpoint('exception', {
    eventId,
    error: {
      name: errorObj.name,
      message: errorObj.message,
      stack: errorObj.stack,
    },
    context,
    user: currentUser,
    breadcrumbs: breadcrumbs.slice(-20),
  });

  return eventId;
}

/**
 * Capture a message (non-error event)
 */
export function captureMessage(
  message: string,
  level: Severity = 'info',
  context?: ErrorContext
): string {
  const eventId = generateEventId();

  // Log locally
  const logMethod = level === 'error' || level === 'fatal' ? 'error' :
                   level === 'warning' ? 'warn' :
                   level === 'debug' ? 'debug' : 'info';
  logger[logMethod](message, { eventId, ...context });

  // Send to Sentry if available
  if (Sentry) {
    try {
      Sentry.setContext('custom', context || {});
      return Sentry.captureMessage(message, level);
    } catch {
      // Sentry failed, continue with fallback
    }
  }

  // Fallback for important messages
  if (level === 'error' || level === 'fatal' || level === 'warning') {
    sendToFallbackEndpoint('message', {
      eventId,
      message,
      level,
      context,
      user: currentUser,
    });
  }

  return eventId;
}

// =============================================================================
// User Context
// =============================================================================

/**
 * Set the current user context for error tracking
 */
export function setUser(user: UserContext | null): void {
  currentUser = user;

  if (Sentry) {
    try {
      Sentry.setUser(user);
    } catch {
      // Ignore Sentry errors
    }
  }

  if (user) {
    logger.info('User context set', { userId: user.id, walletAddress: user.walletAddress });
  } else {
    logger.info('User context cleared');
  }
}

/**
 * Get the current user context
 */
export function getUser(): UserContext | null {
  return currentUser;
}

// =============================================================================
// Tags and Context
// =============================================================================

/**
 * Set a tag that will be included with all future events
 */
export function setTag(key: string, value: string): void {
  if (Sentry) {
    try {
      Sentry.setTag(key, value);
    } catch {
      // Ignore Sentry errors
    }
  }
}

/**
 * Set additional context for future events
 */
export function setContext(name: string, context: Record<string, unknown>): void {
  if (Sentry) {
    try {
      Sentry.setContext(name, context);
    } catch {
      // Ignore Sentry errors
    }
  }
}

// =============================================================================
// Breadcrumbs
// =============================================================================

/**
 * Add a breadcrumb to the trail
 * Breadcrumbs help understand what happened before an error
 */
export function addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
  const entry: Breadcrumb = {
    ...breadcrumb,
    timestamp: Date.now(),
  };

  // Add to local store
  breadcrumbs.push(entry);
  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs.shift();
  }

  // Add to Sentry if available
  if (Sentry) {
    try {
      Sentry.addBreadcrumb({
        type: breadcrumb.type,
        category: breadcrumb.category,
        message: breadcrumb.message,
        data: breadcrumb.data,
        level: 'info',
      });
    } catch {
      // Ignore Sentry errors
    }
  }
}

/**
 * Get recent breadcrumbs
 */
export function getBreadcrumbs(limit = 20): Breadcrumb[] {
  return breadcrumbs.slice(-limit);
}

// =============================================================================
// Helpers
// =============================================================================

function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function sendToFallbackEndpoint(
  type: 'exception' | 'message',
  data: Record<string, unknown>
): Promise<void> {
  if (!ENV.isProduction) {
    return; // Only send in production
  }

  try {
    await fetch('/api/v1/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        ...data,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
      keepalive: true,
    });
  } catch {
    // Silently fail - error reporting should never break the app
  }
}

// =============================================================================
// React Integration Helpers
// =============================================================================

/**
 * Create an error handler for React error boundaries
 */
export function createErrorBoundaryHandler(componentName: string) {
  return (error: Error, errorInfo: { componentStack: string }) => {
    captureException(error, {
      component: componentName,
      componentStack: errorInfo.componentStack,
    });
  };
}

/**
 * Wrap an async function with error tracking
 */
export function withErrorTracking<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: ErrorContext
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureException(error, context);
      throw error;
    }
  }) as T;
}

// =============================================================================
// Auto-capture Global Errors
// =============================================================================

if (typeof window !== 'undefined') {
  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    captureException(event.reason || new Error('Unhandled Promise Rejection'), {
      component: 'global',
      action: 'unhandledrejection',
    });
  });

  // Capture global errors
  window.addEventListener('error', (event) => {
    // Ignore errors from external scripts
    if (event.filename && !event.filename.includes(window.location.origin)) {
      return;
    }

    captureException(event.error || new Error(event.message), {
      component: 'global',
      action: 'error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });
}

export default {
  init: initErrorTracking,
  captureException,
  captureMessage,
  setUser,
  getUser,
  setTag,
  setContext,
  addBreadcrumb,
  getBreadcrumbs,
  createErrorBoundaryHandler,
  withErrorTracking,
};
