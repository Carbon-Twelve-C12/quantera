/**
 * Quantera Platform - Swiss Precision Theme System
 * Theme context for managing light/dark mode across the application
 * Dark mode is the primary theme
 */
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Get system color scheme preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return 'dark'; // Default to dark if no system preference
};

// Resolve theme value (handle 'system' option)
const resolveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize theme from localStorage or default to 'dark'
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const savedTheme = localStorage.getItem('quantera-theme');
    if (savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'system') {
      return savedTheme;
    }
    return 'dark'; // Default to dark mode (Swiss Precision)
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => resolveTheme(theme));

  // Apply theme to document
  const applyTheme = useCallback((resolved: 'light' | 'dark') => {
    const root = document.documentElement;
    const body = document.body;

    // Set data-theme attribute (used by CSS custom properties)
    root.setAttribute('data-theme', resolved);
    body.setAttribute('data-theme', resolved);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', resolved === 'dark' ? '#09090B' : '#FFFFFF');
    }

    // Add/remove class for any legacy CSS that needs it
    if (resolved === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = () => {
      const newResolved = getSystemTheme();
      setResolvedTheme(newResolved);
      applyTheme(newResolved);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, applyTheme]);

  // Update localStorage and apply theme when theme changes
  useEffect(() => {
    localStorage.setItem('quantera-theme', theme);
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, [theme, applyTheme]);

  // Apply theme on initial mount
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prevTheme => {
      // Toggle between light and dark (skip system when toggling)
      const currentResolved = resolveTheme(prevTheme);
      return currentResolved === 'light' ? 'dark' : 'light';
    });
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const value = {
    theme,
    resolvedTheme,
    toggleTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Custom hook to use the theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider;
