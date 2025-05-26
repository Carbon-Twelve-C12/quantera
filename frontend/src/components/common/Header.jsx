import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Dashboard,
  SwapHoriz,
  Inventory,
  Wallet,
  Assignment,
  Settings,
  Logout,
  LoginOutlined,
  ForestOutlined,
  BarChart,
  Code as CodeIcon,
  Pool as PoolIcon,
  AddCircleOutline as AddIcon,
  Description as DocumentIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const { connectWallet, address, disconnectWallet } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorElUser, setAnchorElUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    logout();
    disconnectWallet();
    navigate('/');
  };

  const handleLogin = () => {
    navigate('/login');
  };
  
  const handleCreateAsset = () => {
    navigate('/assets/create');
  };

  const mainNavigationItems = [
    { label: 'Home', path: '/' },
    { label: 'Marketplace', path: '/marketplace' },
    { label: 'Trading', path: '/trading' },
    { label: 'Portfolio', path: '/portfolio' },
    { label: 'Documentation', path: '/docs' },
  ];
  
  const environmentalNavigationItems = [
    { label: 'Environmental Marketplace', path: '/environmental/marketplace', icon: <ForestOutlined /> },
    { label: 'Impact Dashboard', path: '/environmental/impact', icon: <BarChart /> },
  ];
  
  const tradeFinanceNavigationItems = [
    { label: 'Trade Finance Marketplace', path: '/tradefinance/marketplace', icon: <AccountBalanceIcon /> },
    { label: 'Create Trade Finance Asset', path: '/tradefinance/create', icon: <AddIcon /> },
  ];
  
  const smartAccountNavigationItems = [
    { label: 'Smart Account', path: '/smart-account', icon: <CodeIcon /> },
    { label: 'Liquidity Pools', path: '/liquidity', icon: <PoolIcon /> },
    { label: 'Create Asset', path: '/assets/create', icon: <AddIcon /> },
    { label: 'Contract Explorer', path: '/contracts', icon: <DocumentIcon /> },
  ];

  const userMenuItems = [
    { label: 'Profile', path: '/profile', icon: <AccountCircle /> },
    { label: 'Settings', path: '/settings', icon: <Settings /> },
  ];

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation" onClick={handleDrawerToggle}>
      <List>
        {mainNavigationItems.map((item) => (
          <ListItem
            button
            key={item.label}
            component={RouterLink}
            to={item.path}
            selected={location.pathname === item.path}
          >
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
      
      <Divider />
      
      <Typography variant="subtitle2" color="text.secondary" sx={{ px: 2, py: 1 }}>
        Environmental Assets
      </Typography>
      
      <List>
        {environmentalNavigationItems.map((item) => (
          <ListItem
            button
            key={item.label}
            component={RouterLink}
            to={item.path}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
      
      <Divider />
      
      <Typography variant="subtitle2" color="text.secondary" sx={{ px: 2, py: 1 }}>
        Trade Finance
      </Typography>
      
      <List>
        {tradeFinanceNavigationItems.map((item) => (
          <ListItem
            button
            key={item.label}
            component={RouterLink}
            to={item.path}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
      
      <Divider />
      
      <Typography variant="subtitle2" color="text.secondary" sx={{ px: 2, py: 1 }}>
        Smart Tools
      </Typography>
      
      <List>
        {smartAccountNavigationItems.map((item) => (
          <ListItem
            button
            key={item.label}
            component={RouterLink}
            to={item.path}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
      
      <Divider />
      
      {currentUser ? (
        <List>
          {userMenuItems.map((item) => (
            <ListItem
              button
              key={item.label}
              component={RouterLink}
              to={item.path}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
          <ListItem button onClick={handleLogout}>
            <ListItemIcon>
              <Logout />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        </List>
      ) : (
        <List>
          <ListItem button onClick={handleLogin}>
            <ListItemIcon>
              <LoginOutlined />
            </ListItemIcon>
            <ListItemText primary="Login" />
          </ListItem>
        </List>
      )}
    </Box>
  );

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo for all screen sizes */}
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              fontWeight: 700,
              color: 'primary.main',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            QUANTERA
          </Typography>

          {/* Mobile menu button */}
          {isMobile && (
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton
                size="large"
                aria-label="menu"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleDrawerToggle}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
            </Box>
          )}

          {/* Desktop navigation */}
          {!isMobile && (
            <>
              <Box sx={{ flexGrow: 1, display: 'flex' }}>
                {mainNavigationItems.map((item) => (
                  <Button
                    key={item.label}
                    component={RouterLink}
                    to={item.path}
                    sx={{
                      my: 2,
                      mx: 1,
                      color: 'text.primary',
                      display: 'block',
                      fontWeight: location.pathname === item.path ? 700 : 500,
                      borderBottom:
                        location.pathname === item.path
                          ? `2px solid ${theme.palette.primary.main}`
                          : '2px solid transparent',
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
                
                {/* Environmental Assets Dropdown */}
                <Button
                  key="environmental"
                  component={RouterLink}
                  to="/environmental/marketplace"
                  sx={{
                    my: 2,
                    mx: 1,
                    color: 'text.primary',
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: location.pathname.includes('/environmental') ? 700 : 500,
                    borderBottom:
                      location.pathname.includes('/environmental')
                        ? `2px solid ${theme.palette.primary.main}`
                        : '2px solid transparent',
                  }}
                  startIcon={<ForestOutlined />}
                >
                  Environmental Assets
                </Button>
                
                {/* Trade Finance Button */}
                <Button
                  key="tradefinance"
                  component={RouterLink}
                  to="/tradefinance/marketplace"
                  sx={{
                    my: 2,
                    mx: 1,
                    color: 'text.primary',
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: location.pathname.includes('/tradefinance') ? 700 : 500,
                    borderBottom:
                      location.pathname.includes('/tradefinance')
                        ? `2px solid ${theme.palette.primary.main}`
                        : '2px solid transparent',
                  }}
                  startIcon={<AccountBalanceIcon />}
                >
                  Trade Finance
                </Button>
                
                {/* Smart Account Button */}
                <Button
                  key="smart-account"
                  component={RouterLink}
                  to="/smart-account"
                  sx={{
                    my: 2,
                    mx: 1,
                    color: 'text.primary',
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: location.pathname.includes('/smart-account') ? 700 : 500,
                    borderBottom:
                      location.pathname.includes('/smart-account')
                        ? `2px solid ${theme.palette.primary.main}`
                        : '2px solid transparent',
                  }}
                  startIcon={<CodeIcon />}
                >
                  Smart Account
                </Button>
                
                {/* Contract Explorer Button */}
                <Button
                  key="contract-explorer"
                  component={RouterLink}
                  to="/contracts"
                  sx={{
                    my: 2,
                    mx: 1,
                    color: 'text.primary',
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: location.pathname.includes('/contracts') ? 700 : 500,
                    borderBottom:
                      location.pathname.includes('/contracts')
                        ? `2px solid ${theme.palette.primary.main}`
                        : '2px solid transparent',
                  }}
                  startIcon={<DocumentIcon />}
                >
                  Contract Explorer
                </Button>
                
                {/* Create Asset Button */}
                <Button
                  key="create-asset"
                  component={RouterLink}
                  to="/assets/create"
                  variant="contained"
                  color="primary"
                  sx={{
                    my: 2,
                    mx: 1,
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: 500,
                  }}
                  startIcon={<AddIcon />}
                >
                  Create Asset
                </Button>
              </Box>

              <Box sx={{ flexGrow: 0 }}>
                {currentUser ? (
                  <>
                    <Tooltip title="Open settings">
                      <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                        <Avatar
                          alt={currentUser.name || 'User'}
                          src={currentUser.avatar || ''}
                        />
                      </IconButton>
                    </Tooltip>
                    <Menu
                      sx={{ mt: '45px' }}
                      id="menu-appbar"
                      anchorEl={anchorElUser}
                      anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                      keepMounted
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                      open={Boolean(anchorElUser)}
                      onClose={handleCloseUserMenu}
                    >
                      {userMenuItems.map((item) => (
                        <MenuItem
                          key={item.label}
                          onClick={() => {
                            handleCloseUserMenu();
                            navigate(item.path);
                          }}
                        >
                          <ListItemIcon>{item.icon}</ListItemIcon>
                          <Typography textAlign="center">{item.label}</Typography>
                        </MenuItem>
                      ))}
                      <MenuItem onClick={handleLogout}>
                        <ListItemIcon>
                          <Logout />
                        </ListItemIcon>
                        <Typography textAlign="center">Logout</Typography>
                      </MenuItem>
                    </Menu>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleLogin}
                    startIcon={<LoginOutlined />}
                  >
                    Login
                  </Button>
                )}
              </Box>
            </>
          )}
        </Toolbar>
      </Container>

      {/* Mobile drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={handleDrawerToggle}>
        {drawer}
      </Drawer>
    </AppBar>
  );
};

export default Header; 