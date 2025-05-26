import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FaWallet, FaSun, FaMoon, FaWater } from 'react-icons/fa';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  IconButton,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import PoolIcon from '@mui/icons-material/Pool';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DescriptionIcon from '@mui/icons-material/Description';
import InfoIcon from '@mui/icons-material/Info';

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const navItems = [
    { title: 'Marketplace', path: '/marketplace', icon: <StorefrontIcon /> },
    { title: 'Portfolio', path: '/portfolio', icon: <AccountBalanceWalletIcon /> },
    { title: 'Liquidity', path: '/liquidity', icon: <PoolIcon /> },
    { title: 'Yield', path: '/yield', icon: <TrendingUpIcon /> },
    { title: 'Create Asset', path: '/assets/create', icon: <DescriptionIcon /> },
    { title: 'Contract Explorer', path: '/contracts', icon: <DescriptionIcon /> },
    { title: 'Documentation', path: '/docs', icon: <DescriptionIcon /> },
    { title: 'About', path: '/about', icon: <InfoIcon /> }
  ];

  const drawer = (
    <Box onClick={toggleDrawer} sx={{ textAlign: 'center', width: 250 }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        <span style={{ color: '#1E2885' }}>Q</span>uantera 
      </Typography>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.title} component={NavLink} to={item.path} sx={{
            color: 'text.primary',
            textDecoration: 'none',
            '&.active': {
              color: 'primary.main',
              fontWeight: 'bold'
            }
          }}>
            {item.icon && <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>}
            <ListItemText primary={item.title} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        backgroundColor: '#000000',
        color: '#ffffff',
        top: 0,
        zIndex: 1100
      }}
      elevation={1}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2 } }}>
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              sx={{ color: '#ffffff', p: { xs: 0.5, sm: 1 } }}
              aria-label="open menu"
              edge="start"
              onClick={toggleDrawer}
            >
              <MenuIcon />
            </IconButton>

            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                ml: 1,
                fontWeight: 700,
                color: '#ffffff',
                textDecoration: 'none',
              }}
            >
              <span style={{ color: '#1E2885', fontWeight: 'bold' }}>Q</span>uantera
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              onClick={toggleTheme} 
              sx={{
                position: 'relative',
                width: '50px',
                height: '26px',
                mr: 1,
                borderRadius: '20px',
                backgroundColor: 'var(--primary-color)',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                padding: '0 4px',
              }}
              aria-label="Toggle theme"
              role="button"
              tabIndex={0}
            >
              <Box sx={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.3s ease',
                transform: theme === 'light' ? 'translateX(0)' : 'translateX(24px)',
                color: theme === 'light' ? '#f59e0b' : '#1e40af',
              }}>
                {theme === 'light' ? <FaSun size={12} /> : <FaMoon size={12} />}
              </Box>
            </Box>
            <Button 
              variant="outlined" 
              size="small"
              sx={{
                ml: 1,
                color: '#ffffff',
                borderColor: '#ffffff',
                '&:hover': {
                  borderColor: '#ffffff',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                }
              }}
              startIcon={<FaWallet />}
            >
              Connect Wallet
            </Button>
          </Box>

          <Drawer
            anchor="left"
            open={drawerOpen}
            onClose={toggleDrawer}
          >
            {drawer}
          </Drawer>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header; 