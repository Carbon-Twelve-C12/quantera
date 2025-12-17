/**
 * Input Validation Utilities for Quantera Platform
 *
 * Provides comprehensive validation for:
 * - Ethereum addresses
 * - Financial amounts
 * - Form inputs (XSS prevention)
 * - API payloads
 *
 * SECURITY: All validators sanitize input and prevent injection attacks.
 */

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string | number;
}

/**
 * Ethereum address validation
 * Validates checksummed and non-checksummed addresses
 */
export function validateEthereumAddress(address: string): ValidationResult {
  if (!address || typeof address !== 'string') {
    return { valid: false, error: 'Address is required' };
  }

  const trimmed = address.trim();

  // Check basic format
  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    return { valid: false, error: 'Invalid Ethereum address format' };
  }

  // Return with lowercase sanitized version
  return {
    valid: true,
    sanitized: trimmed.toLowerCase(),
  };
}

/**
 * Validate a financial amount
 * Ensures positive numbers within reasonable bounds
 */
export function validateAmount(
  amount: string | number,
  options: {
    min?: number;
    max?: number;
    decimals?: number;
    allowZero?: boolean;
  } = {}
): ValidationResult {
  const { min = 0, max = Number.MAX_SAFE_INTEGER, decimals = 18, allowZero = false } = options;

  // Convert to number
  const numValue = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Check if valid number
  if (isNaN(numValue) || !isFinite(numValue)) {
    return { valid: false, error: 'Invalid number format' };
  }

  // Check bounds
  if (!allowZero && numValue <= 0) {
    return { valid: false, error: 'Amount must be greater than zero' };
  }

  if (numValue < min) {
    return { valid: false, error: `Amount must be at least ${min}` };
  }

  if (numValue > max) {
    return { valid: false, error: `Amount must not exceed ${max}` };
  }

  // Check decimal places
  const parts = String(amount).split('.');
  if (parts[1] && parts[1].length > decimals) {
    return { valid: false, error: `Maximum ${decimals} decimal places allowed` };
  }

  return {
    valid: true,
    sanitized: numValue,
  };
}

/**
 * Sanitize text input to prevent XSS
 * Escapes HTML entities and removes dangerous patterns
 */
export function sanitizeText(input: string, options: { maxLength?: number; allowNewlines?: boolean } = {}): ValidationResult {
  const { maxLength = 10000, allowNewlines = false } = options;

  if (!input || typeof input !== 'string') {
    return { valid: true, sanitized: '' };
  }

  let sanitized = input
    // Remove null bytes
    .replace(/\0/g, '')
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    // Remove potential script injection patterns
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+=/gi, '');

  // Handle newlines
  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\r\n]/g, ' ');
  }

  // Trim and enforce max length
  sanitized = sanitized.trim().slice(0, maxLength);

  return {
    valid: true,
    sanitized,
  };
}

/**
 * Validate token/asset ID format
 * Alphanumeric with hyphens and underscores
 */
export function validateAssetId(id: string): ValidationResult {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'Asset ID is required' };
  }

  const trimmed = id.trim();

  // Allow alphanumeric, hyphens, underscores
  if (!/^[a-zA-Z0-9\-_]{1,100}$/.test(trimmed)) {
    return { valid: false, error: 'Invalid asset ID format' };
  }

  return {
    valid: true,
    sanitized: trimmed,
  };
}

/**
 * Validate transaction hash format
 */
export function validateTransactionHash(hash: string): ValidationResult {
  if (!hash || typeof hash !== 'string') {
    return { valid: false, error: 'Transaction hash is required' };
  }

  const trimmed = hash.trim();

  if (!/^0x[a-fA-F0-9]{64}$/.test(trimmed)) {
    return { valid: false, error: 'Invalid transaction hash format' };
  }

  return {
    valid: true,
    sanitized: trimmed.toLowerCase(),
  };
}

/**
 * Validate email address format
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const trimmed = email.trim().toLowerCase();

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(trimmed) || trimmed.length > 254) {
    return { valid: false, error: 'Invalid email format' };
  }

  return {
    valid: true,
    sanitized: trimmed,
  };
}

/**
 * Validate a date string or timestamp
 */
export function validateDate(
  date: string | number | Date,
  options: { minDate?: Date; maxDate?: Date; allowFuture?: boolean; allowPast?: boolean } = {}
): ValidationResult {
  const { allowFuture = true, allowPast = true } = options;

  let dateObj: Date;

  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'number') {
    // Assume Unix timestamp in seconds if small enough
    const timestamp = date < 1e12 ? date * 1000 : date;
    dateObj = new Date(timestamp);
  } else {
    dateObj = new Date(date);
  }

  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  const now = new Date();

  if (!allowFuture && dateObj > now) {
    return { valid: false, error: 'Date cannot be in the future' };
  }

  if (!allowPast && dateObj < now) {
    return { valid: false, error: 'Date cannot be in the past' };
  }

  if (options.minDate && dateObj < options.minDate) {
    return { valid: false, error: `Date must be after ${options.minDate.toISOString()}` };
  }

  if (options.maxDate && dateObj > options.maxDate) {
    return { valid: false, error: `Date must be before ${options.maxDate.toISOString()}` };
  }

  return {
    valid: true,
    sanitized: dateObj.toISOString(),
  };
}

/**
 * Validate URL format
 */
export function validateUrl(url: string, options: { allowedProtocols?: string[] } = {}): ValidationResult {
  const { allowedProtocols = ['https'] } = options;

  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const trimmed = url.trim();

  try {
    const parsed = new URL(trimmed);

    if (!allowedProtocols.includes(parsed.protocol.replace(':', ''))) {
      return { valid: false, error: `URL must use ${allowedProtocols.join(' or ')} protocol` };
    }

    return {
      valid: true,
      sanitized: parsed.href,
    };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validate integer within range
 */
export function validateInteger(
  value: string | number,
  options: { min?: number; max?: number } = {}
): ValidationResult {
  const { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = options;

  const numValue = typeof value === 'string' ? parseInt(value, 10) : value;

  if (isNaN(numValue) || !Number.isInteger(numValue)) {
    return { valid: false, error: 'Value must be an integer' };
  }

  if (numValue < min) {
    return { valid: false, error: `Value must be at least ${min}` };
  }

  if (numValue > max) {
    return { valid: false, error: `Value must not exceed ${max}` };
  }

  return {
    valid: true,
    sanitized: numValue,
  };
}

/**
 * Validate enum value
 */
export function validateEnum<T extends string>(value: string, allowedValues: readonly T[]): ValidationResult {
  if (!value || typeof value !== 'string') {
    return { valid: false, error: 'Value is required' };
  }

  const trimmed = value.trim();

  if (!allowedValues.includes(trimmed as T)) {
    return { valid: false, error: `Value must be one of: ${allowedValues.join(', ')}` };
  }

  return {
    valid: true,
    sanitized: trimmed,
  };
}

/**
 * Compose multiple validators
 */
export function composeValidators(...validators: ((value: unknown) => ValidationResult)[]): (value: unknown) => ValidationResult {
  return (value: unknown) => {
    for (const validator of validators) {
      const result = validator(value);
      if (!result.valid) {
        return result;
      }
    }
    return { valid: true };
  };
}

/**
 * Validate object against schema
 */
export interface ValidationSchema {
  [key: string]: {
    required?: boolean;
    validator: (value: unknown) => ValidationResult;
  };
}

export function validateObject(
  obj: Record<string, unknown>,
  schema: ValidationSchema
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const [key, config] of Object.entries(schema)) {
    const value = obj[key];

    if (config.required && (value === undefined || value === null || value === '')) {
      errors[key] = `${key} is required`;
      continue;
    }

    if (value !== undefined && value !== null && value !== '') {
      const result = config.validator(value);
      if (!result.valid && result.error) {
        errors[key] = result.error;
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
