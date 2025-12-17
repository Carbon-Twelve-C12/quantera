/**
 * Form Validation Hook for Quantera Platform
 *
 * Provides a React hook for form validation with:
 * - Real-time validation
 * - Touch tracking
 * - Error display logic
 * - Submit validation
 */

import { useState, useCallback, useMemo } from 'react';
import { ValidationResult, ValidationSchema, validateObject } from '../utils/validation';

/**
 * Field state for form validation
 */
interface FieldState {
  value: unknown;
  touched: boolean;
  error: string | null;
}

/**
 * Form state type
 */
type FormState<T extends Record<string, unknown>> = {
  [K in keyof T]: FieldState;
};

/**
 * Hook return type
 */
interface UseFormValidationReturn<T extends Record<string, unknown>> {
  values: T;
  errors: Record<keyof T, string | null>;
  touched: Record<keyof T, boolean>;
  isValid: boolean;
  isDirty: boolean;
  setFieldValue: (field: keyof T, value: unknown) => void;
  setFieldTouched: (field: keyof T) => void;
  validateField: (field: keyof T) => ValidationResult;
  validateAll: () => boolean;
  reset: () => void;
  getFieldProps: (field: keyof T) => {
    value: unknown;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur: () => void;
    error: boolean;
    helperText: string | null;
  };
}

/**
 * Form validation hook
 */
export function useFormValidation<T extends Record<string, unknown>>(
  initialValues: T,
  schema: ValidationSchema
): UseFormValidationReturn<T> {
  // Initialize form state
  const initialState = useMemo(() => {
    const state: Partial<FormState<T>> = {};
    for (const key of Object.keys(initialValues) as Array<keyof T>) {
      state[key] = {
        value: initialValues[key],
        touched: false,
        error: null,
      };
    }
    return state as FormState<T>;
  }, []);

  const [formState, setFormState] = useState<FormState<T>>(initialState);

  // Get current values
  const values = useMemo(() => {
    const vals: Partial<T> = {};
    for (const key of Object.keys(formState) as Array<keyof T>) {
      vals[key] = formState[key].value as T[keyof T];
    }
    return vals as T;
  }, [formState]);

  // Get current errors
  const errors = useMemo(() => {
    const errs: Record<keyof T, string | null> = {} as Record<keyof T, string | null>;
    for (const key of Object.keys(formState) as Array<keyof T>) {
      errs[key] = formState[key].error;
    }
    return errs;
  }, [formState]);

  // Get touched state
  const touched = useMemo(() => {
    const t: Record<keyof T, boolean> = {} as Record<keyof T, boolean>;
    for (const key of Object.keys(formState) as Array<keyof T>) {
      t[key] = formState[key].touched;
    }
    return t;
  }, [formState]);

  // Check if form is valid (no errors)
  const isValid = useMemo(() => {
    return Object.values(errors).every((error) => error === null);
  }, [errors]);

  // Check if form is dirty (values changed from initial)
  const isDirty = useMemo(() => {
    for (const key of Object.keys(formState) as Array<keyof T>) {
      if (formState[key].value !== initialValues[key]) {
        return true;
      }
    }
    return false;
  }, [formState, initialValues]);

  // Validate a single field
  const validateField = useCallback(
    (field: keyof T): ValidationResult => {
      const fieldKey = String(field);
      const schemaEntry = schema[fieldKey];

      if (!schemaEntry) {
        return { valid: true };
      }

      const value = formState[field].value;

      // Check required
      if (schemaEntry.required && (value === undefined || value === null || value === '')) {
        return { valid: false, error: `${fieldKey} is required` };
      }

      // Run validator if value exists
      if (value !== undefined && value !== null && value !== '') {
        return schemaEntry.validator(value);
      }

      return { valid: true };
    },
    [formState, schema]
  );

  // Set field value and validate
  const setFieldValue = useCallback(
    (field: keyof T, value: unknown) => {
      setFormState((prev) => {
        const fieldKey = String(field);
        const schemaEntry = schema[fieldKey];
        let error: string | null = null;

        // Validate if schema exists
        if (schemaEntry) {
          if (schemaEntry.required && (value === undefined || value === null || value === '')) {
            error = `${fieldKey} is required`;
          } else if (value !== undefined && value !== null && value !== '') {
            const result = schemaEntry.validator(value);
            error = result.valid ? null : (result.error || 'Invalid value');
          }
        }

        return {
          ...prev,
          [field]: {
            ...prev[field],
            value,
            error,
          },
        };
      });
    },
    [schema]
  );

  // Set field as touched
  const setFieldTouched = useCallback((field: keyof T) => {
    setFormState((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        touched: true,
      },
    }));
  }, []);

  // Validate all fields
  const validateAll = useCallback((): boolean => {
    const result = validateObject(values as Record<string, unknown>, schema);

    setFormState((prev) => {
      const newState = { ...prev };
      for (const key of Object.keys(newState) as Array<keyof T>) {
        newState[key] = {
          ...newState[key],
          touched: true,
          error: result.errors[String(key)] || null,
        };
      }
      return newState;
    });

    return result.valid;
  }, [values, schema]);

  // Reset form to initial values
  const reset = useCallback(() => {
    setFormState(initialState);
  }, [initialState]);

  // Get props for a form field
  const getFieldProps = useCallback(
    (field: keyof T) => ({
      value: formState[field].value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFieldValue(field, e.target.value);
      },
      onBlur: () => {
        setFieldTouched(field);
      },
      error: formState[field].touched && formState[field].error !== null,
      helperText: formState[field].touched ? formState[field].error : null,
    }),
    [formState, setFieldValue, setFieldTouched]
  );

  return {
    values,
    errors,
    touched,
    isValid,
    isDirty,
    setFieldValue,
    setFieldTouched,
    validateField,
    validateAll,
    reset,
    getFieldProps,
  };
}

/**
 * Common validation schemas for reuse
 */
export const commonSchemas = {
  ethereumAddress: {
    required: true,
    validator: (value: unknown) => {
      const address = String(value);
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return { valid: false, error: 'Invalid Ethereum address' };
      }
      return { valid: true, sanitized: address.toLowerCase() };
    },
  },

  positiveAmount: {
    required: true,
    validator: (value: unknown) => {
      const num = Number(value);
      if (isNaN(num) || num <= 0) {
        return { valid: false, error: 'Amount must be greater than zero' };
      }
      return { valid: true, sanitized: num };
    },
  },

  email: {
    required: true,
    validator: (value: unknown) => {
      const email = String(value).trim().toLowerCase();
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
      if (!emailRegex.test(email)) {
        return { valid: false, error: 'Invalid email format' };
      }
      return { valid: true, sanitized: email };
    },
  },

  nonEmptyString: {
    required: true,
    validator: (value: unknown) => {
      const str = String(value).trim();
      if (str.length === 0) {
        return { valid: false, error: 'This field cannot be empty' };
      }
      return { valid: true, sanitized: str };
    },
  },
};
