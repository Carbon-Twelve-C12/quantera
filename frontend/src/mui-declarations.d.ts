// Fix for MUI v7 Grid component typings
import { ElementType } from 'react';
import { Theme, SxProps } from '@mui/material/styles';

declare module '@mui/material/Grid' {
  export interface GridProps {
    item?: boolean;
    container?: boolean;
    xs?: number | boolean;
    sm?: number | boolean;
    md?: number | boolean;
    lg?: number | boolean;
    xl?: number | boolean;
    spacing?: number;
    component?: ElementType;
    sx?: SxProps<Theme>;
  }
} 