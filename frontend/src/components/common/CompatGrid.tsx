import React from 'react';
import { Grid as MuiGrid, SxProps, Theme } from '@mui/material';

// Create a custom Grid component that fixes the TypeScript issues with MUI v7
interface CompatGridProps {
  children: React.ReactNode;
  container?: boolean;
  item?: boolean;
  xs?: number | boolean;
  sm?: number | boolean;
  md?: number | boolean;
  lg?: number | boolean;
  xl?: number | boolean;
  spacing?: number;
  sx?: SxProps<Theme>;
  key?: string | number;
}

const CompatGrid: React.FC<CompatGridProps> = ({
  children,
  container,
  item,
  xs,
  sm,
  md,
  lg,
  xl,
  spacing,
  sx,
  key,
  ...props
}) => {
  // Convert item props to sx grid column if necessary
  let updatedSx = { ...sx };
  
  if (item) {
    const gridColumn: Record<string, string> = {};
    if (xs !== undefined) gridColumn.xs = `span ${xs}`;
    if (sm !== undefined) gridColumn.sm = `span ${sm}`;
    if (md !== undefined) gridColumn.md = `span ${md}`;
    if (lg !== undefined) gridColumn.lg = `span ${lg}`;
    if (xl !== undefined) gridColumn.xl = `span ${xl}`;
    
    // Only update sx if we have gridColumn values
    if (Object.keys(gridColumn).length > 0) {
      updatedSx = { 
        ...updatedSx,
        gridColumn
      };
    }
  }

  return (
    <MuiGrid
      container={container}
      spacing={spacing}
      sx={updatedSx}
      key={key}
      {...props}
    >
      {children}
    </MuiGrid>
  );
};

export default CompatGrid; 