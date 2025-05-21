import React from 'react';
import { Box, BoxProps } from '@mui/material';

interface TimelineProps extends BoxProps {
  position?: 'alternate' | 'left' | 'right';
}

export const Timeline: React.FC<TimelineProps> = ({ children, position = 'alternate', ...props }) => {
  return (
    <Box 
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        margin: 0,
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export const TimelineItem: React.FC<BoxProps> = ({ children, ...props }) => {
  return (
    <Box 
      sx={{ 
        display: 'flex',
        position: 'relative',
        minHeight: '70px',
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export const TimelineSeparator: React.FC<BoxProps> = ({ children, ...props }) => {
  return (
    <Box 
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export const TimelineConnector: React.FC<BoxProps> = ({ ...props }) => {
  return (
    <Box 
      sx={{ 
        width: '2px',
        backgroundColor: 'divider',
        flexGrow: 1,
        ...props.sx
      }}
      {...props}
    />
  );
};

export const TimelineContent: React.FC<BoxProps> = ({ children, ...props }) => {
  return (
    <Box 
      sx={{ 
        padding: 2,
        flexGrow: 1,
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

interface TimelineDotProps extends BoxProps {
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'grey';
  variant?: 'filled' | 'outlined';
}

export const TimelineDot: React.FC<TimelineDotProps> = ({ 
  color = 'grey', 
  variant = 'filled',
  ...props 
}) => {
  return (
    <Box 
      sx={{ 
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: variant === 'filled' ? `${color}.main` : 'background.paper',
        border: variant === 'outlined' ? `2px solid` : 'none',
        borderColor: variant === 'outlined' ? `${color}.main` : 'transparent',
        margin: '8px 0',
        ...props.sx
      }}
      {...props}
    />
  );
};

export const TimelineOppositeContent: React.FC<BoxProps> = ({ children, color = 'text.secondary', ...props }) => {
  return (
    <Box 
      sx={{ 
        padding: 2,
        color,
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Box>
  );
}; 