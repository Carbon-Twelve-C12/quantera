import React from 'react';
import { GlobalStyles as MuiGlobalStyles } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const GlobalStyles = () => {
  const theme = useTheme();

  return (
    <MuiGlobalStyles
      styles={{
        // Override any CSS variables with MUI theme values
        ':root': {
          '--primary-color': theme.palette.primary.main,
          '--primary-dark': theme.palette.primary.dark,
          '--primary-light': theme.palette.primary.light,
          '--secondary-color': theme.palette.secondary.main,
          '--success-color': theme.palette.success.main,
          '--warning-color': theme.palette.warning.main,
          '--danger-color': theme.palette.error.main,
          '--dark-color': '#1e293b',
          '--light-color': theme.palette.mode === 'light' ? '#f8fafc' : '#1e1e1e',
          '--gray-100': theme.palette.mode === 'light' ? '#f1f5f9' : '#1a1a1a',
          '--gray-200': theme.palette.mode === 'light' ? '#e2e8f0' : '#2d2d2d',
          '--gray-300': theme.palette.mode === 'light' ? '#cbd5e1' : '#3d3d3d',
          '--gray-700': theme.palette.mode === 'light' ? '#334155' : '#a1a1aa',
          '--gray-900': theme.palette.mode === 'light' ? '#0f172a' : '#e5e5e5',
          
          '--bg-color': theme.palette.background.default,
          '--text-color': theme.palette.text.primary,
          '--muted-color': theme.palette.text.secondary,
          '--card-bg': theme.palette.background.paper,
          '--navbar-bg': '#1e293b',
          '--navbar-text': '#ffffff',
          '--footer-bg': '#1e293b',
          '--footer-text': '#ffffff',
          '--footer-text-muted': 'rgba(255, 255, 255, 0.7)',
          '--border-color': theme.palette.divider,
          '--shadow-color': theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.5)',
          '--hover-shadow': theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.7)',
          '--table-head-bg': theme.palette.mode === 'light' ? '#f1f5f9' : '#1a1a1a',
          '--thead-text-color': theme.palette.text.primary,
          '--badge-text': theme.palette.text.primary,
          '--hero-bg': theme.palette.primary.main,
          '--hero-text': '#ffffff',
          '--feature-icon-bg': theme.palette.mode === 'light' 
            ? 'rgba(37, 99, 235, 0.1)' 
            : 'rgba(96, 165, 250, 0.2)',
          '--feature-icon-color': theme.palette.mode === 'light' 
            ? theme.palette.primary.main 
            : theme.palette.primary.light,
          
          // Theme toggle variables
          '--theme-toggle-bg': theme.palette.primary.main,
          '--theme-toggle-light-color': '#f59e0b',
          '--theme-toggle-dark-color': '#1e40af',
        },
        
        // Global body styles
        'body': {
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
          transition: 'background-color 0.3s ease, color 0.3s ease',
        },
        
        // Custom styling for code and pre elements
        'code': {
          backgroundColor: theme.palette.mode === 'light' ? '#f1f5f9' : '#1a1a1a',
          color: theme.palette.mode === 'light' ? '#0f172a' : '#e5e5e5',
          padding: '0.2em 0.4em',
          borderRadius: '3px',
          fontSize: '0.9em',
        },
        
        'pre': {
          backgroundColor: theme.palette.mode === 'light' ? '#f1f5f9' : '#1a1a1a',
          color: theme.palette.mode === 'light' ? '#0f172a' : '#e5e5e5',
          padding: '1em',
          borderRadius: '6px',
          overflow: 'auto',
        },
        
        // Ensure links have consistent styling
        'a': {
          color: theme.palette.primary.main,
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          },
        },
        
        // Ensure smooth transitions for theme changes
        '*': {
          transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease',
        },
      }}
    />
  );
};

export default GlobalStyles; 