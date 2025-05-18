import { Grid as MuiGrid, GridProps } from '@mui/material';
import { styled } from '@mui/material/styles';

// Create a wrapper around the MUI Grid component to be compatible with xs, sm, md, lg props
interface ExtendedGridProps extends GridProps {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

const Grid = styled(MuiGrid)<ExtendedGridProps>(({ theme }) => ({}));

// Forward props from our extended interface to the appropriate MUI Grid props
Grid.defaultProps = {
  item: true
};

export default Grid; 