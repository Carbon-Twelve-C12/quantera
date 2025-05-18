import React from 'react';
import { Grid as MuiGrid, GridProps } from '@mui/material';

// Creates a wrapper component for MUI Grid that accepts the same props
// but removes TypeScript errors related to 'item' property
const Grid: React.FC<any> = (props) => {
  const { children, xs, sm, md, lg, xl, ...rest } = props;
  
  // Convert numeric width props to Grid's system
  const gridProps: GridProps = {
    ...rest,
    ...(xs ? { xs } : {}),
    ...(sm ? { sm } : {}),
    ...(md ? { md } : {}),
    ...(lg ? { lg } : {}),
    ...(xl ? { xl } : {})
  };
  
  return <MuiGrid {...gridProps}>{children}</MuiGrid>;
};

export default Grid; 