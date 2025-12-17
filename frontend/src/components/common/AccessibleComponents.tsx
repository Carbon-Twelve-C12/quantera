/**
 * Accessible Components for Quantera Platform
 *
 * WCAG 2.1 AA Compliant Components:
 * - SkipLink: Skip to main content navigation
 * - VisuallyHidden: Hide content visually but keep for screen readers
 * - AccessibleIcon: Icons with proper ARIA handling
 * - LiveRegion: Dynamic content announcements
 * - AccessibleModal: Fully accessible modal dialog
 */

import React, { useEffect, useRef, ReactNode } from 'react';
import { useFocusTrap, useEscapeKey, useAnnounce } from '../../hooks/useAccessibility';

/**
 * Skip Link - Allows keyboard users to skip navigation
 */
interface SkipLinkProps {
  targetId?: string;
  children?: ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({
  targetId = 'main-content',
  children = 'Skip to main content',
}) => {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus();
      // Remove tabindex after focus to maintain natural tab order
      target.addEventListener(
        'blur',
        () => {
          target.removeAttribute('tabindex');
        },
        { once: true }
      );
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className="skip-link"
      style={{
        position: 'absolute',
        top: '-40px',
        left: '16px',
        zIndex: 9999,
        padding: '8px 16px',
        backgroundColor: 'var(--accent-primary, #10B981)',
        color: '#000',
        textDecoration: 'none',
        fontWeight: 600,
        borderRadius: 'var(--radius-md, 6px)',
        transition: 'top 0.2s ease',
      }}
      onFocus={(e) => {
        e.currentTarget.style.top = '16px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = '-40px';
      }}
    >
      {children}
    </a>
  );
};

/**
 * Visually Hidden - Hides content visually but keeps it accessible
 * Use for screen reader only text
 */
interface VisuallyHiddenProps {
  children: ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

export const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({ children, as: Component = 'span' }) => {
  return (
    <Component
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {children}
    </Component>
  );
};

/**
 * Accessible Icon - Properly handles icon accessibility
 */
interface AccessibleIconProps {
  icon: ReactNode;
  label?: string;
  isDecorative?: boolean;
  className?: string;
}

export const AccessibleIcon: React.FC<AccessibleIconProps> = ({
  icon,
  label,
  isDecorative = false,
  className,
}) => {
  if (isDecorative) {
    return (
      <span className={className} aria-hidden="true" role="presentation">
        {icon}
      </span>
    );
  }

  return (
    <span className={className} role="img" aria-label={label}>
      {icon}
    </span>
  );
};

/**
 * Live Region - Announces dynamic content changes
 */
interface LiveRegionProps {
  children: ReactNode;
  politeness?: 'polite' | 'assertive';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all' | 'additions text' | 'additions removals' | 'removals text' | 'text additions' | 'text removals' | 'removals additions';
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  politeness = 'polite',
  atomic = true,
  relevant = 'additions text',
}) => {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
    >
      {children}
    </div>
  );
};

/**
 * Accessible Modal - Fully accessible modal dialog
 */
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  closeLabel?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  closeLabel = 'Close modal',
  size = 'md',
}) => {
  const focusTrapRef = useFocusTrap(isOpen);
  const titleId = useRef(`modal-title-${Math.random().toString(36).substr(2, 9)}`);
  const { announceAssertive } = useAnnounce();

  // Handle escape key
  useEscapeKey(onClose, isOpen);

  // Announce modal opening
  useEffect(() => {
    if (isOpen) {
      announceAssertive(`${title} dialog opened`);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, title, announceAssertive]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: '400px',
    md: '500px',
    lg: '700px',
    xl: '900px',
  };

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
    >
      <div
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId.current}
        className="modal-content"
        style={{
          backgroundColor: 'var(--surface-elevated, #18181B)',
          borderRadius: 'var(--radius-xl, 12px)',
          border: '1px solid var(--surface-subtle, #3F3F46)',
          maxWidth: sizeStyles[size],
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid var(--surface-subtle, #3F3F46)',
          }}
        >
          <h2
            id={titleId.current}
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text-primary, #FAFAFA)',
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label={closeLabel}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
              borderRadius: 'var(--radius-md, 6px)',
              color: 'var(--text-secondary, #A1A1AA)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M15 5L5 15M5 5l10 10" />
            </svg>
          </button>
        </header>
        <div style={{ padding: '20px' }}>{children}</div>
      </div>
    </div>
  );
};

/**
 * Accessible Form Field - Label and input with proper ARIA
 */
interface AccessibleFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const AccessibleField: React.FC<AccessibleFieldProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  hint,
  required = false,
  disabled = false,
  placeholder,
}) => {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        htmlFor={id}
        style={{
          display: 'block',
          marginBottom: '6px',
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--text-primary, #FAFAFA)',
        }}
      >
        {label}
        {required && (
          <span aria-hidden="true" style={{ color: 'var(--status-error, #EF4444)', marginLeft: '4px' }}>
            *
          </span>
        )}
        {required && <VisuallyHidden> (required)</VisuallyHidden>}
      </label>

      {hint && (
        <p
          id={hintId}
          style={{
            margin: '0 0 6px 0',
            fontSize: '13px',
            color: 'var(--text-tertiary, #71717A)',
          }}
        >
          {hint}
        </p>
      )}

      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        aria-describedby={describedBy}
        aria-invalid={error ? 'true' : undefined}
        style={{
          width: '100%',
          padding: '10px 14px',
          fontSize: '14px',
          backgroundColor: 'var(--surface-overlay, #27272A)',
          border: `1px solid ${error ? 'var(--status-error, #EF4444)' : 'var(--surface-subtle, #3F3F46)'}`,
          borderRadius: 'var(--radius-md, 6px)',
          color: 'var(--text-primary, #FAFAFA)',
          outline: 'none',
          transition: 'border-color 150ms, box-shadow 150ms',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error
            ? 'var(--status-error, #EF4444)'
            : 'var(--accent-primary, #10B981)';
          e.currentTarget.style.boxShadow = `0 0 0 3px ${
            error ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'
          }`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error
            ? 'var(--status-error, #EF4444)'
            : 'var(--surface-subtle, #3F3F46)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />

      {error && (
        <p
          id={errorId}
          role="alert"
          style={{
            margin: '6px 0 0 0',
            fontSize: '13px',
            color: 'var(--status-error, #EF4444)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M7 0C3.13 0 0 3.13 0 7s3.13 7 7 7 7-3.13 7-7S10.87 0 7 0zm.5 10.5h-1v-1h1v1zm0-2h-1v-5h1v5z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * Accessible Button - Button with loading and icon support
 */
interface AccessibleButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  ariaLabel?: string;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  loadingText = 'Loading...',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  ariaLabel,
}) => {
  const isDisabled = disabled || loading;

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'var(--font-body, inherit)',
    fontWeight: 500,
    borderRadius: 'var(--radius-md, 6px)',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: 'all 150ms ease',
    border: 'none',
    width: fullWidth ? '100%' : 'auto',
    opacity: isDisabled ? 0.6 : 1,
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: '13px' },
    md: { padding: '10px 16px', fontSize: '14px' },
    lg: { padding: '12px 24px', fontSize: '16px' },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--accent-primary, #10B981)',
      color: '#000',
    },
    secondary: {
      backgroundColor: 'transparent',
      color: 'var(--text-primary, #FAFAFA)',
      border: '1px solid var(--surface-subtle, #3F3F46)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--text-primary, #FAFAFA)',
    },
    danger: {
      backgroundColor: 'var(--status-error, #EF4444)',
      color: '#fff',
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-busy={loading}
      aria-disabled={isDisabled}
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant],
      }}
    >
      {loading ? (
        <>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
            style={{
              animation: 'spin 1s linear infinite',
            }}
          >
            <circle cx="8" cy="8" r="6" strokeOpacity="0.25" />
            <path d="M14 8a6 6 0 00-6-6" />
          </svg>
          <VisuallyHidden>{loadingText}</VisuallyHidden>
          <span aria-hidden="true">{loadingText}</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span aria-hidden="true">{icon}</span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span aria-hidden="true">{icon}</span>
          )}
        </>
      )}
    </button>
  );
};

/**
 * Accessible Progress Bar
 */
interface AccessibleProgressProps {
  value: number;
  max?: number;
  label: string;
  showValue?: boolean;
}

export const AccessibleProgress: React.FC<AccessibleProgressProps> = ({
  value,
  max = 100,
  label,
  showValue = true,
}) => {
  const percentage = Math.round((value / max) * 100);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '6px',
        }}
      >
        <span
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary, #A1A1AA)',
          }}
        >
          {label}
        </span>
        {showValue && (
          <span
            style={{
              fontSize: '13px',
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--text-primary, #FAFAFA)',
            }}
          >
            {percentage}%
          </span>
        )}
      </div>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label}: ${percentage}%`}
        style={{
          height: '8px',
          backgroundColor: 'var(--surface-overlay, #27272A)',
          borderRadius: 'var(--radius-full, 9999px)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: 'var(--accent-primary, #10B981)',
            borderRadius: 'var(--radius-full, 9999px)',
            transition: 'width 300ms ease',
          }}
        />
      </div>
    </div>
  );
};
