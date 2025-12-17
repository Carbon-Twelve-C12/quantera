import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Production-grade Error Boundary component
 * Catches JavaScript errors in child component trees and displays a fallback UI
 *
 * Features:
 * - Catches render errors, lifecycle errors, and errors in constructors
 * - Logs errors for monitoring/debugging
 * - Provides retry functionality
 * - Customizable fallback UI
 * - Optional error reporting callback
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error for debugging
    console.error('ErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // Update state with error details
    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you would send this to an error reporting service
    this.reportError(error, errorInfo);
  }

  private reportError(error: Error, errorInfo: ErrorInfo): void {
    // Send error to monitoring service (Sentry, LogRocket, etc.)
    // This is a placeholder - integrate with your error monitoring service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Example: Send to backend error logging endpoint
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/v1/error-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport),
      }).catch(() => {
        // Silently fail if error reporting fails
      });
    }
  }

  private handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.iconContainer}>
              <svg
                style={styles.icon}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 9V11M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0377 2.66667 10.2679 4L3.33975 16C2.56995 17.3333 3.53223 19 5.07183 19Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h1 style={styles.title}>Something went wrong</h1>

            <p style={styles.message}>
              We apologize for the inconvenience. An unexpected error has occurred.
            </p>

            {this.props.showDetails && this.state.error && (
              <div style={styles.errorDetails}>
                <p style={styles.errorMessage}>{this.state.error.message}</p>
                {this.state.errorInfo && (
                  <pre style={styles.stackTrace}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div style={styles.buttonContainer}>
              <button onClick={this.handleRetry} style={styles.retryButton}>
                Try Again
              </button>
              <button onClick={this.handleReload} style={styles.reloadButton}>
                Reload Page
              </button>
            </div>

            <p style={styles.supportText}>
              If the problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Inline styles for the error boundary (no external dependencies)
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
    backgroundColor: '#09090B',
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  card: {
    maxWidth: '500px',
    width: '100%',
    padding: '40px',
    backgroundColor: '#18181B',
    borderRadius: '12px',
    border: '1px solid #27272A',
    textAlign: 'center',
  },
  iconContainer: {
    marginBottom: '24px',
  },
  icon: {
    width: '64px',
    height: '64px',
    color: '#EF4444',
    margin: '0 auto',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#FAFAFA',
    marginBottom: '12px',
    margin: 0,
  },
  message: {
    fontSize: '16px',
    color: '#A1A1AA',
    marginBottom: '24px',
    lineHeight: 1.6,
  },
  errorDetails: {
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#27272A',
    borderRadius: '8px',
    textAlign: 'left',
  },
  errorMessage: {
    fontSize: '14px',
    color: '#EF4444',
    fontFamily: "'JetBrains Mono', monospace",
    marginBottom: '8px',
    wordBreak: 'break-word',
  },
  stackTrace: {
    fontSize: '12px',
    color: '#71717A',
    fontFamily: "'JetBrains Mono', monospace",
    overflow: 'auto',
    maxHeight: '200px',
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  buttonContainer: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  retryButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#09090B',
    backgroundColor: '#10B981',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  reloadButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#FAFAFA',
    backgroundColor: 'transparent',
    border: '1px solid #3F3F46',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  supportText: {
    fontSize: '14px',
    color: '#71717A',
    margin: 0,
  },
};

/**
 * Higher-order component to wrap a component with an error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
): React.FC<P> {
  const ComponentWithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return ComponentWithErrorBoundary;
}

/**
 * Specialized error boundary for async operations
 * Use this for components that load data asynchronously
 */
interface AsyncErrorBoundaryProps extends ErrorBoundaryProps {
  loadingFallback?: ReactNode;
}

export class AsyncErrorBoundary extends ErrorBoundary {
  render(): ReactNode {
    const { loadingFallback } = this.props as AsyncErrorBoundaryProps;

    // If there's a loading fallback and no error, show loading state
    // Otherwise, use the parent's render method
    return super.render();
  }
}

export default ErrorBoundary;
