import React, { useState } from 'react';
import { AppBar, Toolbar, Box, Button, IconButton, Menu, MenuItem, Avatar, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Notifications,
  Settings,
  AccountCircle,
} from '@mui/icons-material';
import { Sun, Moon, ChevronDown, X } from 'lucide-react';
import { WalletConnect } from '../wallet/WalletConnect';
import { useTheme } from '../../contexts/ThemeContext';

// Swiss Precision Header - Clean, minimal, dark-first
const StyledAppBar = styled(AppBar)({
  background: 'var(--surface-base)',
  boxShadow: 'none',
  borderBottom: '1px solid var(--surface-subtle)',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 'var(--z-fixed)',
});

const StyledToolbar = styled(Toolbar)({
  minHeight: '64px',
  padding: '0 24px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  maxWidth: '1536px',
  margin: '0 auto',
  width: '100%',

  '@media (max-width: 768px)': {
    padding: '0 16px',
    minHeight: '56px',
  },
});

const Logo = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  cursor: 'pointer',
});

const LogoMark = styled(Box)({
  width: '32px',
  height: '32px',
  background: 'var(--accent-primary)',
  borderRadius: 'var(--radius-md)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--font-display)',
  fontWeight: 700,
  fontSize: '18px',
  color: 'var(--text-inverse)',
});

const LogoText = styled(Box)({
  fontFamily: 'var(--font-display)',
  fontSize: '20px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  letterSpacing: '-0.02em',

  '@media (max-width: 480px)': {
    display: 'none',
  },
});

const NavContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',

  '@media (max-width: 1024px)': {
    display: 'none',
  },
});

const NavButton = styled(Button)<{ active?: boolean }>(({ active }) => ({
  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
  fontSize: '14px',
  fontWeight: 500,
  fontFamily: 'var(--font-body)',
  padding: '8px 16px',
  borderRadius: 'var(--radius-md)',
  textTransform: 'none',
  transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  background: 'transparent',
  minWidth: 'auto',

  '&:hover': {
    background: 'var(--surface-overlay)',
    color: 'var(--text-primary)',
  },

  ...(active && {
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: '4px',
      left: '16px',
      right: '16px',
      height: '2px',
      background: 'var(--accent-primary)',
      borderRadius: '1px',
    },
  }),
}));

const ActionsContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

const ActionButton = styled(IconButton)({
  color: 'var(--text-secondary)',
  padding: '8px',
  borderRadius: 'var(--radius-md)',
  transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',

  '&:hover': {
    background: 'var(--surface-overlay)',
    color: 'var(--text-primary)',
  },

  '& svg': {
    width: '20px',
    height: '20px',
  },
});

const NotificationButton = styled(ActionButton)({
  position: 'relative',

  '&::after': {
    content: '""',
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '6px',
    height: '6px',
    background: 'var(--accent-primary)',
    borderRadius: '50%',
  },
});

const MobileMenuButton = styled(IconButton)({
  display: 'none',
  color: 'var(--text-secondary)',
  padding: '8px',
  borderRadius: 'var(--radius-md)',

  '@media (max-width: 1024px)': {
    display: 'flex',
  },

  '&:hover': {
    background: 'var(--surface-overlay)',
    color: 'var(--text-primary)',
  },
});

const StyledMenu = styled(Menu)({
  '& .MuiPaper-root': {
    background: 'var(--surface-elevated)',
    border: '1px solid var(--surface-subtle)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    marginTop: '8px',
    minWidth: '200px',
  },
});

const StyledMenuItem = styled(MenuItem)({
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  color: 'var(--text-primary)',
  padding: '10px 16px',
  transition: 'background 150ms',

  '&:hover': {
    background: 'var(--surface-overlay)',
  },

  '&.Mui-selected': {
    background: 'var(--accent-muted)',
    color: 'var(--accent-primary)',

    '&:hover': {
      background: 'var(--accent-muted)',
    },
  },
});

const UserMenuHeader = styled(Box)({
  padding: '16px',
  borderBottom: '1px solid var(--surface-subtle)',
});

const UserInfo = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
});

const UserAvatar = styled(Avatar)({
  width: '40px',
  height: '40px',
  background: 'var(--accent-muted)',
  color: 'var(--accent-primary)',
  fontFamily: 'var(--font-display)',
  fontWeight: 600,
  fontSize: '16px',
});

const UserDetails = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

const UserName = styled(Box)({
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--text-primary)',
});

const UserEmail = styled(Box)({
  fontFamily: 'var(--font-body)',
  fontSize: '12px',
  color: 'var(--text-tertiary)',
});

const MenuDivider = styled(Divider)({
  borderColor: 'var(--surface-subtle)',
  margin: '4px 0',
});

const DangerMenuItem = styled(StyledMenuItem)({
  color: 'var(--status-error)',

  '&:hover': {
    background: 'var(--status-error-muted)',
  },
});

// Mobile drawer styles
const MobileDrawer = styled(Box)<{ open: boolean }>(({ open }) => ({
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  maxWidth: '320px',
  background: 'var(--surface-elevated)',
  borderLeft: '1px solid var(--surface-subtle)',
  transform: open ? 'translateX(0)' : 'translateX(100%)',
  transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  zIndex: 1200,
  display: 'flex',
  flexDirection: 'column',
}));

const MobileDrawerBackdrop = styled(Box)<{ open: boolean }>(({ open }) => ({
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(4px)',
  opacity: open ? 1 : 0,
  visibility: open ? 'visible' : 'hidden',
  transition: 'opacity 300ms, visibility 300ms',
  zIndex: 1199,
}));

const MobileDrawerHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px',
  borderBottom: '1px solid var(--surface-subtle)',
});

const MobileDrawerTitle = styled(Box)({
  fontFamily: 'var(--font-display)',
  fontSize: '16px',
  fontWeight: 600,
  color: 'var(--text-primary)',
});

const MobileNavItem = styled(Box)<{ active?: boolean }>(({ active }) => ({
  padding: '12px 16px',
  fontFamily: 'var(--font-body)',
  fontSize: '15px',
  fontWeight: 500,
  color: active ? 'var(--accent-primary)' : 'var(--text-primary)',
  background: active ? 'var(--accent-muted)' : 'transparent',
  cursor: 'pointer',
  transition: 'all 150ms',

  '&:hover': {
    background: active ? 'var(--accent-muted)' : 'var(--surface-overlay)',
  },
}));

const Spacer = styled(Box)({
  height: '64px',

  '@media (max-width: 768px)': {
    height: '56px',
  },
});

interface HeaderProps {
  activeRoute?: string;
  onNavigate?: (route: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeRoute = 'marketplace', onNavigate }) => {
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();

  const navigationItems = [
    { label: 'Marketplace', route: 'marketplace' },
    { label: 'Portfolio', route: 'portfolio' },
    { label: 'Analytics', route: 'analytics' },
    { label: 'Trade Finance', route: 'trade-finance' },
    { label: 'Docs', route: 'docs' },
  ];

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
    setMobileDrawerOpen(false);
  };

  return (
    <>
      <StyledAppBar elevation={0}>
        <StyledToolbar>
          <Logo onClick={() => handleNavigation('home')}>
            <LogoMark>Q</LogoMark>
            <LogoText>Quantera</LogoText>
          </Logo>

          <NavContainer>
            {navigationItems.map((item) => (
              <NavButton
                key={item.route}
                active={activeRoute === item.route}
                onClick={() => handleNavigation(item.route)}
                disableRipple
              >
                {item.label}
              </NavButton>
            ))}
          </NavContainer>

          <ActionsContainer>
            <ActionButton onClick={toggleTheme} aria-label="Toggle theme">
              {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
            </ActionButton>

            <NotificationButton aria-label="Notifications">
              <Notifications />
            </NotificationButton>

            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <WalletConnect />
            </Box>

            <ActionButton onClick={handleUserMenuOpen} aria-label="User menu">
              <AccountCircle />
            </ActionButton>

            <MobileMenuButton onClick={() => setMobileDrawerOpen(true)} aria-label="Open menu">
              <MenuIcon />
            </MobileMenuButton>
          </ActionsContainer>
        </StyledToolbar>
      </StyledAppBar>

      {/* User Menu */}
      <StyledMenu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <UserMenuHeader>
          <UserInfo>
            <UserAvatar>U</UserAvatar>
            <UserDetails>
              <UserName>User Account</UserName>
              <UserEmail>user@quantera.io</UserEmail>
            </UserDetails>
          </UserInfo>
        </UserMenuHeader>
        <StyledMenuItem onClick={handleUserMenuClose}>Account Settings</StyledMenuItem>
        <StyledMenuItem onClick={handleUserMenuClose}>Compliance Status</StyledMenuItem>
        <StyledMenuItem onClick={handleUserMenuClose}>Security</StyledMenuItem>
        <MenuDivider />
        <DangerMenuItem onClick={handleUserMenuClose}>Sign Out</DangerMenuItem>
      </StyledMenu>

      {/* Mobile Drawer */}
      <MobileDrawerBackdrop open={mobileDrawerOpen} onClick={() => setMobileDrawerOpen(false)} />
      <MobileDrawer open={mobileDrawerOpen}>
        <MobileDrawerHeader>
          <MobileDrawerTitle>Menu</MobileDrawerTitle>
          <ActionButton onClick={() => setMobileDrawerOpen(false)} aria-label="Close menu">
            <X />
          </ActionButton>
        </MobileDrawerHeader>

        <Box sx={{ flex: 1, py: 1 }}>
          {navigationItems.map((item) => (
            <MobileNavItem
              key={item.route}
              active={activeRoute === item.route}
              onClick={() => handleNavigation(item.route)}
            >
              {item.label}
            </MobileNavItem>
          ))}
        </Box>

        <Box sx={{ p: 2, borderTop: '1px solid var(--surface-subtle)' }}>
          <WalletConnect />
        </Box>
      </MobileDrawer>

      {/* Spacer */}
      <Spacer />
    </>
  );
};

export default Header;
