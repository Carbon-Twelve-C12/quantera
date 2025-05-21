import React from 'react';
import { Grid as MuiGrid, GridProps as MuiGridProps } from '@mui/material';

// Create a type for our component that extends the MUI Grid props and includes children
interface ExtendedGridProps extends React.PropsWithChildren<MuiGridProps> {
  item?: boolean;
}

// Create a wrapper component that correctly passes props to MUI Grid
const CompatGrid: React.FC<ExtendedGridProps> = ({ children, item, ...props }) => {
  return (
    <MuiGrid {...(item ? { item: true } : {})} {...props}>
      {children}
    </MuiGrid>
  );
};

export default CompatGrid; 