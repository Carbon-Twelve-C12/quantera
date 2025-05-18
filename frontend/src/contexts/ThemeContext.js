import React, { createContext, useState, useEffect, useContext } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

// Define light and dark themes
const createAppTheme = (mode) => {
  return createTheme({
    palette: {
      mode,
      primary: {
        // Deep blue-green primary color
        main: mode === 'light' ? '#1A5276' : '#3498DB',
      },
      secondary: {
        // Vibrant accent color
        main: mode === 'light' ? '#27AE60' : '#2ECC71', 
      },
      success: {
        main: mode === 'light' ? '#2ECC71' : '#34d399',
      },
      warning: {
        main: '#F39C12', // Warning accent color from design doc
      },
      error: {
        main: '#E74C3C', // Alert/Error accent color from design doc
      },
      background: {
        default: mode === 'light' ? '#F5F5F5' : '#121212', // Light background from design doc
        paper: mode === 'light' ? '#FFFFFF' : '#1E1E1E',
      },
      text: {
        primary: mode === 'light' ? '#333333' : '#E5E5E5', // Dark color for primary text
        secondary: mode === 'light' ? '#757575' : '#A0A0A0', // Mid-tone for secondary text
      },
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Proxima Nova", "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
      h1: {
        fontSize: '36px',
        fontWeight: 500,
      },
      h2: {
        fontSize: '32px',
        fontWeight: 500,
      },
      h3: {
        fontSize: '24px',
        fontWeight: 500,
      },
      body1: {
        fontSize: '16px',
        fontWeight: 400,
      },
      body2: {
        fontSize: '14px',
        fontWeight: 300,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 8, // Consistent with design doc (8px radius)
            boxShadow: mode === 'light' 
              ? '0 4px 8px rgba(0, 0, 0, 0.1)' 
              : '0 4px 8px rgba(0, 0, 0, 0.5)',
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            opacity: 0.1, // Subtle dividers as specified in design doc
          },
        },
      },
    },
    spacing: factor => `${8 * factor}px`, // 8px spacing system from design doc
  });
};

export const ThemeProvider = ({ children }) => {
  // Check local storage for theme preference or default to 'light'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  const muiTheme = createAppTheme(theme);

  // Update theme in localStorage when it changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    
    // Add or remove dark class from body
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [theme]);

  // Toggle between light and dark mode
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContext; 