/**
 * Structured Logging Utility
 *
 * Production-grade logging with support for:
 * - Structured JSON logs
 * - Log levels (debug, info, warn, error)
 * - Context enrichment
 * - Environment-aware behavior
 * - Integration with external services (DataDog, etc.)
 *
 * USAGE:
 *   import { logger } from '@/utils/logger';
 *   logger.info('User logged in', { userId: '123', method: 'wallet' });
 *   logger.error('Payment failed', new Error('Insufficient funds'), { amount: 100 });
 */

import { ENV } from './config';

// =============================================================================
// Types
// =============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  environment: string;
  url: string;
  userAgent: string;
  sessionId?: string;
}

export interface LoggerConfig {
  /** Minimum log level to output */
  minLevel: LogLevel;
  /** Whether to output to console */
  consoleOutput: boolean;
  /** Whether to send logs to remote service */
  remoteLogging: boolean;
  /** Remote logging endpoint */
  remoteEndpoint?: string;
  /** Sample rate for remote logging (0-1) */
  sampleRate: number;
}

// =============================================================================
// Configuration
// =============================================================================

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: ENV.isProduction ? 'info' : 'debug',
  consoleOutput: true,
  remoteLogging: ENV.isProduction,
  remoteEndpoint: '/api/v1/logs',
  sampleRate: ENV.isProduction ? 0.1 : 1.0, // 10% sampling in production
};

// =============================================================================
// Session Management
// =============================================================================

let sessionId: string | undefined;

function getSessionId(): string {
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  return sessionId;
}

// =============================================================================
// Log Buffer for Batching
// =============================================================================

const logBuffer: LogEntry[] = [];
const BUFFER_SIZE = 10;
const FLUSH_INTERVAL = 30000; // 30 seconds

let flushTimer: ReturnType<typeof setTimeout> | null = null;

function startFlushTimer(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushLogs();
    flushTimer = null;
    if (logBuffer.length > 0) {
      startFlushTimer();
    }
  }, FLUSH_INTERVAL);
}

async function flushLogs(): Promise<void> {
  if (logBuffer.length === 0) return;

  const logsToSend = [...logBuffer];
  logBuffer.length = 0;

  if (!DEFAULT_CONFIG.remoteLogging || !DEFAULT_CONFIG.remoteEndpoint) {
    return;
  }

  try {
    await fetch(DEFAULT_CONFIG.remoteEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs: logsToSend }),
      keepalive: true, // Ensure logs are sent even on page unload
    });
  } catch {
    // Silently fail - logging should never break the app
    // Re-add failed logs to buffer for retry (with limit)
    if (logBuffer.length < BUFFER_SIZE * 2) {
      logBuffer.push(...logsToSend);
    }
  }
}

// Flush logs before page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushLogs();
  });

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushLogs();
    }
  });
}

// =============================================================================
// Core Logger Class
// =============================================================================

class Logger {
  private config: LoggerConfig;
  private globalContext: LogContext = {};

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Set global context that will be included in all log entries
   */
  setGlobalContext(context: LogContext): void {
    this.globalContext = { ...this.globalContext, ...context };
  }

  /**
   * Clear global context
   */
  clearGlobalContext(): void {
    this.globalContext = {};
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger(this.config);
    childLogger.globalContext = { ...this.globalContext, ...context };
    return childLogger;
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, undefined, context);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, undefined, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, undefined, context);
  }

  /**
   * Log an error message with optional Error object
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorObj = error instanceof Error ? error : undefined;
    this.log('error', message, errorObj, context);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    error?: Error,
    context?: LogContext
  ): void {
    // Check if this level should be logged
    if (LOG_LEVELS[level] < LOG_LEVELS[this.config.minLevel]) {
      return;
    }

    const entry = this.createLogEntry(level, message, error, context);

    // Console output
    if (this.config.consoleOutput) {
      this.outputToConsole(entry);
    }

    // Remote logging (with sampling)
    if (this.config.remoteLogging && Math.random() < this.config.sampleRate) {
      this.sendToRemote(entry);
    }
  }

  /**
   * Create a structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    error?: Error,
    context?: LogContext
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      environment: process.env.NODE_ENV || 'development',
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      sessionId: getSessionId(),
    };

    // Merge contexts
    const mergedContext = { ...this.globalContext, ...context };
    if (Object.keys(mergedContext).length > 0) {
      entry.context = mergedContext;
    }

    // Add error details
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  /**
   * Output log to console with appropriate styling
   */
  private outputToConsole(entry: LogEntry): void {
    const styles = {
      debug: 'color: #6B7280',
      info: 'color: #3B82F6',
      warn: 'color: #F59E0B',
      error: 'color: #EF4444',
    };

    const prefix = `[${entry.level.toUpperCase()}]`;
    const style = styles[entry.level];

    if (ENV.isProduction) {
      // In production, use structured output
      const consoleMethod = entry.level === 'error' ? console.error :
                           entry.level === 'warn' ? console.warn :
                           entry.level === 'debug' ? console.debug :
                           console.log;
      consoleMethod(JSON.stringify(entry));
    } else {
      // In development, use readable output
      const args: unknown[] = [`%c${prefix}`, style, entry.message];

      if (entry.context) {
        args.push(entry.context);
      }

      if (entry.error) {
        args.push('\n', entry.error);
      }

      switch (entry.level) {
        case 'debug':
          console.debug(...args);
          break;
        case 'info':
          console.info(...args);
          break;
        case 'warn':
          console.warn(...args);
          break;
        case 'error':
          console.error(...args);
          break;
      }
    }
  }

  /**
   * Send log entry to remote service
   */
  private sendToRemote(entry: LogEntry): void {
    logBuffer.push(entry);

    if (logBuffer.length >= BUFFER_SIZE) {
      flushLogs();
    } else {
      startFlushTimer();
    }
  }

  /**
   * Time a function execution
   */
  async time<T>(
    label: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.info(`${label} completed`, { ...context, durationMs: Math.round(duration) });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`${label} failed`, error, { ...context, durationMs: Math.round(duration) });
      throw error;
    }
  }

  /**
   * Log API request/response
   */
  logApiCall(
    method: string,
    url: string,
    status: number,
    durationMs: number,
    context?: LogContext
  ): void {
    const level: LogLevel = status >= 500 ? 'error' :
                           status >= 400 ? 'warn' :
                           'info';
    this.log(level, `API ${method} ${url}`, undefined, {
      ...context,
      method,
      url,
      status,
      durationMs,
    });
  }
}

// =============================================================================
// Export Singleton Instance
// =============================================================================

export const logger = new Logger();

// Also export class for creating child loggers
export { Logger };

// =============================================================================
// Helper for migrating from console.log
// =============================================================================

/**
 * Drop-in replacement for console that uses structured logging
 * Use this during migration from console.log
 */
export const log = {
  debug: (message: string, ...args: unknown[]) =>
    logger.debug(message, args.length > 0 ? { args } : undefined),
  info: (message: string, ...args: unknown[]) =>
    logger.info(message, args.length > 0 ? { args } : undefined),
  warn: (message: string, ...args: unknown[]) =>
    logger.warn(message, args.length > 0 ? { args } : undefined),
  error: (message: string, ...args: unknown[]) => {
    const error = args.find((arg) => arg instanceof Error) as Error | undefined;
    const context = args.filter((arg) => !(arg instanceof Error));
    logger.error(message, error, context.length > 0 ? { args: context } : undefined);
  },
};

export default logger;
