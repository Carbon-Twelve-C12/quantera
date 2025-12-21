/**
 * Mock ThemeContext for testing
 */
import React, { createContext } from 'react';

// Mock theme state factory
export const createMockTheme = (overrides = {}) => ({
  theme: 'dark' as const,
  resolvedTheme: 'dark' as const,
  toggleTheme: jest.fn(),
  setTheme: jest.fn(),
  ...overrides,
});

// Default mock state
const mockThemeState = createMockTheme();

// Create mock context
const ThemeContext = createContext(mockThemeState);

// Mock useTheme hook
export const useTheme = jest.fn(() => mockThemeState);

// Mock provider
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeContext.Provider value={mockThemeState}>
    {children}
  </ThemeContext.Provider>
);

export default ThemeContext;
