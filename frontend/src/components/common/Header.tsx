import React, { useState } from 'react';
import { AppBar, Toolbar, Box, Button, IconButton, Menu, MenuItem, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Menu as MenuIcon, Notifications, Settings, AccountCircle } from '@mui/icons-material';
import { WalletConnect } from '../wallet/WalletConnect';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)',
  boxShadow: '0 4px 24px rgba(26, 35, 126, 0.15)',
  backdropFilter: 'blur(20px)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1100,
}));

const StyledToolbar = styled(Toolbar)({
  minHeight: '80px',
  padding: '0 32px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  
  '@media (max-width: 768px)': {
    padding: '0 16px',
    minHeight: '64px',
  },
});

const Logo = styled(Box)({
  fontSize: '28px',
  fontWeight: 700,
  color: '#ffffff',
  letterSpacing: '-0.5px',
  fontFamily: 'Inter, sans-serif',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  
  '&:hover': {
    transform: 'scale(1.05)',
  },
  
  '@media (max-width: 768px)': {
    fontSize: '24px',
  },
});

const NavContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  
  '@media (max-width: 768px)': {
    display: 'none',
  },
});

const MobileMenuContainer = styled(Box)({
  display: 'none',
  
  '@media (max-width: 768px)': {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
});

const NavButton = styled(Button)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.9)',
  fontSize: '16px',
  fontWeight: 500,
  padding: '12px 24px',
  margin: '0 4px',
  borderRadius: '8px',
  textTransform: 'none',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    transform: 'translateY(-2px)',
  },
  
  '&.active': {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: '#ffffff',
    
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '60%',
      height: '2px',
      background: '#00bcd4',
      borderRadius: '1px',
    },
  },
}));

const ActionButton = styled(IconButton)({
  color: 'rgba(255, 255, 255, 0.9)',
  padding: '12px',
  margin: '0 4px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    transform: 'scale(1.1)',
  },
});

const UserSection = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
});

const NotificationBadge = styled(Box)({
  position: 'relative',
  
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '8px',
    height: '8px',
    background: '#f44336',
    borderRadius: '50%',
    border: '2px solid #1a237e',
  },
});

const MobileMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    marginTop: '8px',
  },
  
  '& .MuiMenuItem-root': {
    color: 'rgba(255, 255, 255, 0.9)',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 500,
    
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      color: '#ffffff',
    },
  },
}));

interface HeaderProps {
  activeRoute?: string;
  onNavigate?: (route: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeRoute = 'marketplace', onNavigate }) => {
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const navigationItems = [
    { label: 'Marketplace', route: 'marketplace' },
    { label: 'Portfolio', route: 'portfolio' },
    { label: 'Analytics', route: 'analytics' },
    { label: 'Documentation', route: 'docs' },
    { label: 'Institutional', route: 'institutional' },
  ];

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleNavigation = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    }
    handleMobileMenuClose();
  };

  return (
    <>
      <StyledAppBar>
        <StyledToolbar>
          <Logo onClick={() => handleNavigation('home')}>
            Quantera
          </Logo>
          
          <NavContainer>
            {navigationItems.map((item) => (
              <NavButton
                key={item.route}
                className={activeRoute === item.route ? 'active' : ''}
                onClick={() => handleNavigation(item.route)}
              >
                {item.label}
              </NavButton>
            ))}
          </NavContainer>
          
          <UserSection>
            <NotificationBadge>
              <ActionButton>
                <Notifications />
              </ActionButton>
            </NotificationBadge>
            
            <ActionButton>
              <Settings />
            </ActionButton>
            
            <WalletConnect />
            
            <ActionButton onClick={handleUserMenuOpen}>
              <AccountCircle />
            </ActionButton>
            
            <MobileMenuContainer>
              <ActionButton onClick={handleMobileMenuOpen}>
                <MenuIcon />
              </ActionButton>
            </MobileMenuContainer>
          </UserSection>
        </StyledToolbar>
      </StyledAppBar>
      
      {/* Mobile Navigation Menu */}
      <MobileMenu
        anchorEl={mobileMenuAnchor}
        open={Boolean(mobileMenuAnchor)}
        onClose={handleMobileMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {navigationItems.map((item) => (
          <MenuItem
            key={item.route}
            onClick={() => handleNavigation(item.route)}
            selected={activeRoute === item.route}
          >
            {item.label}
          </MenuItem>
        ))}
      </MobileMenu>
      
      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 8px 40px rgba(26, 35, 126, 0.12)',
            border: '1px solid rgba(26, 35, 126, 0.08)',
            marginTop: '8px',
            minWidth: '200px',
          },
        }}
      >
        <MenuItem onClick={handleUserMenuClose}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#1a237e' }}>U</Avatar>
            <Box>
              <Box sx={{ fontWeight: 600, color: '#263238' }}>User Profile</Box>
              <Box sx={{ fontSize: '12px', color: '#607d8b' }}>View & Edit</Box>
            </Box>
          </Box>
        </MenuItem>
        <MenuItem onClick={handleUserMenuClose}>Account Settings</MenuItem>
        <MenuItem onClick={handleUserMenuClose}>Compliance Status</MenuItem>
        <MenuItem onClick={handleUserMenuClose}>Security</MenuItem>
        <MenuItem onClick={handleUserMenuClose} sx={{ color: '#f44336' }}>
          Sign Out
        </MenuItem>
      </Menu>
      
      {/* Spacer to prevent content from being hidden under fixed header */}
      <Box sx={{ height: { xs: '64px', md: '80px' } }} />
    </>
  );
}; 