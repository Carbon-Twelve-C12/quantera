/**
 * Production-grade encryption utilities using Web Crypto API
 * Implements AES-GCM encryption for secure local storage
 *
 * SECURITY NOTES:
 * - This provides defense-in-depth for localStorage data
 * - The encryption key is derived from a device fingerprint + app secret
 * - This does NOT protect against XSS attacks (use HttpOnly cookies for that)
 * - For maximum security, tokens should be stored in HttpOnly cookies
 */

import { logger } from './logger';

// Encryption configuration
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for AES-GCM
const SALT_LENGTH = 16;
const KEY_DERIVATION_ITERATIONS = 100000;

// App secret - REQUIRED for production security
// DO NOT use default values - this must be explicitly configured
const APP_SECRET = (() => {
  const secret = process.env.REACT_APP_ENCRYPTION_SECRET;

  // In production, require explicit configuration
  if (process.env.NODE_ENV === 'production') {
    if (!secret) {
      throw new Error(
        'CRITICAL SECURITY ERROR: REACT_APP_ENCRYPTION_SECRET environment variable is required in production. ' +
        'Generate a secure random string of at least 32 characters.'
      );
    }
    if (secret.length < 32) {
      throw new Error(
        'CRITICAL SECURITY ERROR: REACT_APP_ENCRYPTION_SECRET must be at least 32 characters long.'
      );
    }
  }

  // In development, use a local-only secret with warning
  if (!secret) {
    logger.warn(
      '[SECURITY WARNING] REACT_APP_ENCRYPTION_SECRET not set. Using development-only fallback. ' +
      'This is NOT secure for production use.'
    );
    return 'dev-only-local-secret-do-not-use-in-production';
  }

  return secret;
})();

/**
 * Generate a device fingerprint for key derivation
 * This provides some binding to the device without being too fragile
 */
function getDeviceFingerprint(): string {
  const components: string[] = [];

  // User agent (stable across sessions)
  components.push(navigator.userAgent);

  // Screen properties (stable)
  components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Language
  components.push(navigator.language);

  // Hardware concurrency (number of logical processors)
  if (navigator.hardwareConcurrency) {
    components.push(String(navigator.hardwareConcurrency));
  }

  // Combine and hash
  return components.join('|');
}

/**
 * Derive an encryption key from the device fingerprint and app secret
 */
async function deriveKey(salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const fingerprint = getDeviceFingerprint();
  const keyMaterial = encoder.encode(`${APP_SECRET}:${fingerprint}`);

  // Import the key material
  const importedKey = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive the actual encryption key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: KEY_DERIVATION_ITERATIONS,
      hash: 'SHA-256',
    },
    importedKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypt a string value using AES-GCM
 * Returns a base64-encoded string containing: salt + iv + ciphertext
 */
export async function encryptValue(plaintext: string): Promise<string> {
  try {
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Derive the encryption key
    const key = await deriveKey(salt);

    // Encrypt the plaintext
    const encoder = new TextEncoder();
    const plaintextBytes = encoder.encode(plaintext);

    const ciphertext = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      plaintextBytes
    );

    // Combine salt + iv + ciphertext
    const combined = new Uint8Array(
      SALT_LENGTH + IV_LENGTH + ciphertext.byteLength
    );
    combined.set(salt, 0);
    combined.set(iv, SALT_LENGTH);
    combined.set(new Uint8Array(ciphertext), SALT_LENGTH + IV_LENGTH);

    // Return as base64
    return arrayBufferToBase64(combined.buffer);
  } catch (error) {
    logger.error('Encryption error', error instanceof Error ? error : new Error(String(error)));
    throw new Error('Failed to encrypt value');
  }
}

/**
 * Decrypt a value that was encrypted with encryptValue
 * Expects a base64-encoded string containing: salt + iv + ciphertext
 */
export async function decryptValue(encryptedBase64: string): Promise<string> {
  try {
    // Decode from base64
    const combined = new Uint8Array(base64ToArrayBuffer(encryptedBase64));

    // Validate minimum length
    const minLength = SALT_LENGTH + IV_LENGTH + 1;
    if (combined.length < minLength) {
      throw new Error('Invalid encrypted data: too short');
    }

    // Extract salt, iv, and ciphertext
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);

    // Derive the decryption key using the same salt
    const key = await deriveKey(salt);

    // Decrypt
    const plaintextBuffer = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext
    );

    // Decode and return
    const decoder = new TextDecoder();
    return decoder.decode(plaintextBuffer);
  } catch (error) {
    logger.error('Decryption error', error instanceof Error ? error : new Error(String(error)));
    throw new Error('Failed to decrypt value');
  }
}

/**
 * Check if Web Crypto API is available
 */
export function isCryptoAvailable(): boolean {
  return (
    typeof crypto !== 'undefined' &&
    typeof crypto.subtle !== 'undefined' &&
    typeof crypto.getRandomValues === 'function'
  );
}

/**
 * Secure storage wrapper that handles encryption automatically
 */
export const secureStorage = {
  /**
   * Store an encrypted value in localStorage
   */
  async setItem(key: string, value: string): Promise<void> {
    if (!isCryptoAvailable()) {
      // In production, refuse to store sensitive data without encryption
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'SECURITY ERROR: Web Crypto API not available. Cannot securely store sensitive data. ' +
          'Please use a modern browser that supports the Web Crypto API.'
        );
      }
      logger.warn(
        '[SECURITY WARNING] Web Crypto not available. Storing data unencrypted. ' +
        'This is NOT secure for production use.'
      );
      localStorage.setItem(key, value);
      return;
    }

    try {
      const encrypted = await encryptValue(value);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      logger.error('Secure storage setItem error', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  },

  /**
   * Retrieve and decrypt a value from localStorage
   */
  async getItem(key: string): Promise<string | null> {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) {
      return null;
    }

    if (!isCryptoAvailable()) {
      // In production, refuse to return potentially unencrypted sensitive data
      if (process.env.NODE_ENV === 'production') {
        logger.error('SECURITY ERROR: Web Crypto API not available. Cannot decrypt data.', new Error('Crypto unavailable'));
        localStorage.removeItem(key);
        return null;
      }
      logger.warn(
        '[SECURITY WARNING] Web Crypto not available. Returning potentially unencrypted value. ' +
        'This is NOT secure for production use.'
      );
      return encrypted;
    }

    try {
      return await decryptValue(encrypted);
    } catch (error) {
      // If decryption fails, the data may be corrupted or from a different device
      logger.error('Secure storage getItem error', error instanceof Error ? error : new Error(String(error)));
      // Clear the corrupted data
      localStorage.removeItem(key);
      return null;
    }
  },

  /**
   * Remove an item from localStorage
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
  },

  /**
   * Clear all items from localStorage
   */
  clear(): void {
    localStorage.clear();
  },
};

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash a value using SHA-256
 */
export async function hashValue(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToBase64(hashBuffer);
}
