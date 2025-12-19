/**
 * Validation Hooks
 *
 * React hooks for form validation using the validation utilities.
 * Provides real-time validation, debouncing, and error state management.
 *
 * USAGE:
 *   const { value, error, isValid, onChange, validate } = useValidatedInput({
 *     validator: validateEthereumAddress,
 *     initialValue: '',
 *   });
 *
 *   <input value={value} onChange={onChange} />
 *   {error && <span className="error">{error}</span>}
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  ValidationResult,
  validateEthereumAddress,
  validateAmount,
  validateUrl,
  validateEmail,
  validateAssetId,
  sanitizeText,
  validateObject,
  ValidationSchema,
} from '../utils/validation';

// =============================================================================
// Types
// =============================================================================

export type ValidatorFn<T = string> = (value: T) => ValidationResult;

export interface UseValidatedInputOptions<T = string> {
  /** Validation function */
  validator: ValidatorFn<T>;
  /** Initial value */
  initialValue?: T;
  /** Validate on mount */
  validateOnMount?: boolean;
  /** Validate on change */
  validateOnChange?: boolean;
  /** Validate on blur */
  validateOnBlur?: boolean;
  /** Debounce validation (ms) */
  debounceMs?: number;
  /** Transform value before validation */
  transform?: (value: T) => T;
  /** Callback when validation completes */
  onValidate?: (result: ValidationResult) => void;
}

export interface UseValidatedInputReturn<T = string> {
  /** Current value */
  value: T;
  /** Sanitized value (if validation passed) */
  sanitizedValue: T | undefined;
  /** Current error message */
  error: string | undefined;
  /** Whether current value is valid */
  isValid: boolean;
  /** Whether field has been touched */
  isTouched: boolean;
  /** Whether validation is in progress (for async/debounced) */
  isValidating: boolean;
  /** Change handler for input */
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  /** Direct value setter */
  setValue: (value: T) => void;
  /** Blur handler */
  onBlur: () => void;
  /** Manually trigger validation */
  validate: () => ValidationResult;
  /** Reset to initial value */
  reset: () => void;
  /** Clear error without resetting value */
  clearError: () => void;
}

// =============================================================================
// useValidatedInput Hook
// =============================================================================

export function useValidatedInput<T = string>(
  options: UseValidatedInputOptions<T>
): UseValidatedInputReturn<T> {
  const {
    validator,
    initialValue = '' as T,
    validateOnMount = false,
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 0,
    transform,
    onValidate,
  } = options;

  const [value, setValueState] = useState<T>(initialValue);
  const [error, setError] = useState<string | undefined>();
  const [sanitizedValue, setSanitizedValue] = useState<T | undefined>();
  const [isTouched, setIsTouched] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Core validation function
  const performValidation = useCallback(
    (valueToValidate: T): ValidationResult => {
      const transformedValue = transform ? transform(valueToValidate) : valueToValidate;
      const result = validator(transformedValue as unknown as T);

      if (mountedRef.current) {
        if (result.valid) {
          setError(undefined);
          setSanitizedValue(result.sanitized as T | undefined);
        } else {
          setError(result.error);
          setSanitizedValue(undefined);
        }
        setIsValidating(false);
        onValidate?.(result);
      }

      return result;
    },
    [validator, transform, onValidate]
  );

  // Debounced validation
  const debouncedValidate = useCallback(
    (valueToValidate: T) => {
      if (debounceMs > 0) {
        setIsValidating(true);
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          performValidation(valueToValidate);
        }, debounceMs);
      } else {
        performValidation(valueToValidate);
      }
    },
    [debounceMs, performValidation]
  );

  // Validate on mount if requested
  useEffect(() => {
    if (validateOnMount) {
      performValidation(initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set value with optional validation
  const setValue = useCallback(
    (newValue: T) => {
      setValueState(newValue);
      if (validateOnChange) {
        debouncedValidate(newValue);
      }
    },
    [validateOnChange, debouncedValidate]
  );

  // Change handler for inputs
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const newValue = e.target.value as T;
      setValue(newValue);
    },
    [setValue]
  );

  // Blur handler
  const onBlur = useCallback(() => {
    setIsTouched(true);
    if (validateOnBlur) {
      // Cancel any pending debounced validation and validate immediately
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      performValidation(value);
    }
  }, [validateOnBlur, performValidation, value]);

  // Manual validation trigger
  const validate = useCallback(() => {
    setIsTouched(true);
    return performValidation(value);
  }, [performValidation, value]);

  // Reset to initial value
  const reset = useCallback(() => {
    setValueState(initialValue);
    setError(undefined);
    setSanitizedValue(undefined);
    setIsTouched(false);
    setIsValidating(false);
  }, [initialValue]);

  // Clear error only
  const clearError = useCallback(() => {
    setError(undefined);
  }, []);

  // Compute isValid
  const isValid = useMemo(() => !error && !isValidating, [error, isValidating]);

  return {
    value,
    sanitizedValue,
    error,
    isValid,
    isTouched,
    isValidating,
    onChange,
    setValue,
    onBlur,
    validate,
    reset,
    clearError,
  };
}

// =============================================================================
// Specialized Hooks
// =============================================================================

/**
 * Hook for Ethereum address validation
 */
export function useEthereumAddressInput(initialValue = '') {
  return useValidatedInput({
    validator: validateEthereumAddress,
    initialValue,
    debounceMs: 300,
  });
}

/**
 * Hook for financial amount validation
 */
export function useAmountInput(
  options: {
    initialValue?: string;
    min?: number;
    max?: number;
    decimals?: number;
    allowZero?: boolean;
  } = {}
) {
  const { initialValue = '', min, max, decimals, allowZero } = options;

  return useValidatedInput({
    validator: (value: string) => validateAmount(value, { min, max, decimals, allowZero }),
    initialValue,
    debounceMs: 300,
  });
}

/**
 * Hook for URL validation
 */
export function useUrlInput(
  options: {
    initialValue?: string;
    allowedProtocols?: string[];
  } = {}
) {
  const { initialValue = '', allowedProtocols } = options;

  return useValidatedInput({
    validator: (value: string) => validateUrl(value, { allowedProtocols }),
    initialValue,
    debounceMs: 300,
  });
}

/**
 * Hook for email validation
 */
export function useEmailInput(initialValue = '') {
  return useValidatedInput({
    validator: validateEmail,
    initialValue,
    debounceMs: 300,
  });
}

/**
 * Hook for asset ID validation
 */
export function useAssetIdInput(initialValue = '') {
  return useValidatedInput({
    validator: validateAssetId,
    initialValue,
    debounceMs: 300,
  });
}

/**
 * Hook for sanitized text input (XSS prevention)
 */
export function useSanitizedTextInput(
  options: {
    initialValue?: string;
    maxLength?: number;
    allowNewlines?: boolean;
  } = {}
) {
  const { initialValue = '', maxLength, allowNewlines } = options;

  return useValidatedInput({
    validator: (value: string) => sanitizeText(value, { maxLength, allowNewlines }),
    initialValue,
  });
}

// =============================================================================
// useFormValidation Hook
// =============================================================================

export interface FormFieldConfig {
  initialValue?: unknown;
  validator: ValidatorFn<unknown>;
  required?: boolean;
}

export interface UseFormValidationOptions {
  fields: Record<string, FormFieldConfig>;
  validateOnSubmit?: boolean;
}

export interface UseFormValidationReturn {
  values: Record<string, unknown>;
  errors: Record<string, string | undefined>;
  isValid: boolean;
  isDirty: boolean;
  setFieldValue: (field: string, value: unknown) => void;
  setFieldError: (field: string, error: string | undefined) => void;
  validateField: (field: string) => ValidationResult;
  validateAll: () => boolean;
  reset: () => void;
  getFieldProps: (field: string) => {
    value: unknown;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur: () => void;
    error: string | undefined;
  };
}

/**
 * Hook for form-level validation with multiple fields
 */
export function useFormValidation(options: UseFormValidationOptions): UseFormValidationReturn {
  const { fields } = options;

  // Initialize state from field configs
  const initialValues = useMemo(() => {
    const values: Record<string, unknown> = {};
    for (const [key, config] of Object.entries(fields)) {
      values[key] = config.initialValue ?? '';
    }
    return values;
  }, [fields]);

  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Check if form is dirty
  const isDirty = useMemo(() => {
    return Object.keys(fields).some(key => values[key] !== initialValues[key]);
  }, [values, initialValues, fields]);

  // Check if form is valid
  const isValid = useMemo(() => {
    return Object.keys(fields).every(key => !errors[key]);
  }, [errors, fields]);

  // Set single field value
  const setFieldValue = useCallback((field: string, value: unknown) => {
    setValues(prev => ({ ...prev, [field]: value }));

    // Validate on change
    const config = fields[field];
    if (config) {
      const result = config.validator(value);
      setErrors(prev => ({
        ...prev,
        [field]: result.valid ? undefined : result.error,
      }));
    }
  }, [fields]);

  // Set single field error
  const setFieldError = useCallback((field: string, error: string | undefined) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  // Validate single field
  const validateField = useCallback((field: string): ValidationResult => {
    const config = fields[field];
    if (!config) {
      return { valid: true };
    }

    const value = values[field];

    // Check required
    if (config.required && (value === undefined || value === null || value === '')) {
      const error = `${field} is required`;
      setErrors(prev => ({ ...prev, [field]: error }));
      return { valid: false, error };
    }

    const result = config.validator(value);
    setErrors(prev => ({
      ...prev,
      [field]: result.valid ? undefined : result.error,
    }));

    return result;
  }, [fields, values]);

  // Validate all fields
  const validateAll = useCallback((): boolean => {
    let allValid = true;
    const newErrors: Record<string, string | undefined> = {};

    for (const [key, config] of Object.entries(fields)) {
      const value = values[key];

      // Check required
      if (config.required && (value === undefined || value === null || value === '')) {
        newErrors[key] = `${key} is required`;
        allValid = false;
        continue;
      }

      const result = config.validator(value);
      if (!result.valid) {
        newErrors[key] = result.error;
        allValid = false;
      }
    }

    setErrors(newErrors);
    setTouched(Object.keys(fields).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

    return allValid;
  }, [fields, values]);

  // Reset form
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  // Get props for a field
  const getFieldProps = useCallback((field: string) => ({
    value: values[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setFieldValue(field, e.target.value),
    onBlur: () => {
      setTouched(prev => ({ ...prev, [field]: true }));
      validateField(field);
    },
    error: touched[field] ? errors[field] : undefined,
  }), [values, errors, touched, setFieldValue, validateField]);

  return {
    values,
    errors,
    isValid,
    isDirty,
    setFieldValue,
    setFieldError,
    validateField,
    validateAll,
    reset,
    getFieldProps,
  };
}

// =============================================================================
// Utility Hooks
// =============================================================================

/**
 * Hook to validate a value and memoize the result
 */
export function useValidation<T>(value: T, validator: ValidatorFn<T>): ValidationResult {
  return useMemo(() => validator(value), [value, validator]);
}

/**
 * Hook to validate an object against a schema
 */
export function useObjectValidation(
  obj: Record<string, unknown>,
  schema: ValidationSchema
): { valid: boolean; errors: Record<string, string> } {
  return useMemo(() => validateObject(obj, schema), [obj, schema]);
}

export default useValidatedInput;
