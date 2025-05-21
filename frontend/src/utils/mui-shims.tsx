import React from 'react';
import { Grid as MuiGrid, GridProps as MuiGridProps } from '@mui/material';

// Create a type for our component that extends the MUI Grid props
interface ExtendedGridProps extends MuiGridProps {
  item?: boolean;
}

// Create a wrapper component that correctly passes props to MUI Grid
const Grid: React.FC<ExtendedGridProps> = ({ children, item, ...props }) => {
  return (
    <MuiGrid {...(item ? { item: true } : {})} {...props}>
      {children}
    </MuiGrid>
  );
};

export default Grid; 