import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Box, 
  Button, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemText,
  ListItemIcon,
  useMediaQuery,
  useTheme,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Menu as MenuIcon, 
  X as Close, 
  TrendingUp, 
  BarChart3, 
  Building2, 
  User, 
  Settings, 
  LogOut,
  Bell,
  Wallet,
  FileText
} from 'lucide-react';
import { WalletConnect } from '../wallet/WalletConnect';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)',
  boxShadow: '0 4px 24px rgba(26, 35, 126, 0.15)',
  backdropFilter: 'blur(20px)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  position: 'fixed',
  zIndex: theme.zIndex.appBar,
}));

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  minHeight: '72px',
  padding: '0 16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  
  [theme.breakpoints.up('md')]: {
    minHeight: '80px',
    padding: '0 32px',
  },
}));

const Logo = styled(Box)(({ theme }) => ({
  fontSize: '24px',
  fontWeight: 700,
  color: '#ffffff',
  letterSpacing: '-0.5px',
  fontFamily: 'Inter, sans-serif',
  cursor: 'pointer',
  
  [theme.breakpoints.up('md')]: {
    fontSize: '28px',
  },
}));

const DesktopNav = styled(Box)(({ theme }) => ({
  display: 'none',
  alignItems: 'center',
  gap: theme.spacing(1),
  
  [theme.breakpoints.up('md')]: {
    display: 'flex',
  },
}));

const MobileNav = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
}));

const NavButton = styled(Button)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.9)',
  fontSize: '16px',
  fontWeight: 500,
  padding: '12px 20px',
  margin: '0 4px',
  borderRadius: '8px',
  textTransform: 'none',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    transform: 'translateY(-1px)',
  },
  
  '&.active': {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: '#ffffff',
  },
}));

const MobileMenuButton = styled(IconButton)({
  color: '#ffffff',
  padding: '8px',
  
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

const NotificationButton = styled(IconButton)({
  color: 'rgba(255, 255, 255, 0.9)',
  padding: '8px',
  
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
  },
});

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 280,
    background: 'linear-gradient(180deg, #1a237e 0%, #3f51b5 100%)',
    color: '#ffffff',
    borderRight: 'none',
  },
}));

const DrawerHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
});

const DrawerLogo = styled(Typography)({
  fontSize: '24px',
  fontWeight: 700,
  color: '#ffffff',
  fontFamily: 'Inter, sans-serif',
});

const StyledList = styled(List)({
  padding: '16px 0',
});

const StyledListItem = styled(ListItem)(({ theme }) => ({
  padding: '12px 20px',
  margin: '4px 16px',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  '&.active': {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
}));

const UserSection = styled(Box)({
  padding: '16px 20px',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  marginTop: 'auto',
});

const UserInfo = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '16px',
});

const UserName = styled(Typography)({
  fontSize: '16px',
  fontWeight: 600,
  color: '#ffffff',
});

const UserEmail = styled(Typography)({
  fontSize: '14px',
  color: 'rgba(255, 255, 255, 0.7)',
});

interface NavigationItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

interface MobileOptimizedHeaderProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  notifications?: number;
}

export const MobileOptimizedHeader: React.FC<MobileOptimizedHeaderProps> = ({
  currentPath = '/',
  onNavigate,
  user,
  notifications = 0,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const navigationItems: NavigationItem[] = [
    { label: 'Marketplace', icon: <TrendingUp size={20} />, path: '/marketplace' },
    { label: 'Portfolio', icon: <BarChart3 size={20} />, path: '/portfolio' },
    { label: 'Analytics', icon: <BarChart3 size={20} />, path: '/analytics' },
    { label: 'Documentation', icon: <FileText size={20} />, path: '/docs' },
    { label: 'Institutional', icon: <Building2 size={20} />, path: '/institutional' },
  ];

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleNavigate = (path: string) => {
    onNavigate?.(path);
    setMobileMenuOpen(false);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const renderDesktopNav = () => (
    <DesktopNav>
      {navigationItems.map((item) => (
        <NavButton
          key={item.path}
          onClick={() => handleNavigate(item.path)}
          className={currentPath === item.path ? 'active' : ''}
        >
          {item.label}
          {item.badge && (
            <Badge 
              badgeContent={item.badge} 
              color="error" 
              sx={{ ml: 1 }}
            />
          )}
        </NavButton>
      ))}
    </DesktopNav>
  );

  const renderMobileNav = () => (
    <MobileNav>
      <NotificationButton>
        <Badge badgeContent={notifications} color="error">
          <Bell size={20} />
        </Badge>
      </NotificationButton>
      
      <MobileMenuButton onClick={handleMobileMenuToggle}>
        <MenuIcon size={24} />
      </MobileMenuButton>
    </MobileNav>
  );

  const renderMobileDrawer = () => (
    <StyledDrawer
      anchor="right"
      open={mobileMenuOpen}
      onClose={handleMobileMenuToggle}
    >
      <DrawerHeader>
        <DrawerLogo>Quantera</DrawerLogo>
        <IconButton onClick={handleMobileMenuToggle} sx={{ color: '#ffffff' }}>
          <Close size={24} />
        </IconButton>
      </DrawerHeader>

      <StyledList>
        {navigationItems.map((item) => (
          <StyledListItem
            key={item.path}
            onClick={() => handleNavigate(item.path)}
            className={currentPath === item.path ? 'active' : ''}
          >
            <ListItemIcon sx={{ color: '#ffffff', minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '16px',
                fontWeight: 500,
                color: '#ffffff',
              }}
            />
            {item.badge && (
              <Badge badgeContent={item.badge} color="error" />
            )}
          </StyledListItem>
        ))}
      </StyledList>

      {user && (
        <UserSection>
          <UserInfo>
            <Avatar 
              src={user.avatar} 
              sx={{ width: 40, height: 40 }}
            >
              {user.name.charAt(0)}
            </Avatar>
            <Box>
              <UserName>{user.name}</UserName>
              <UserEmail>{user.email}</UserEmail>
            </Box>
          </UserInfo>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              startIcon={<Wallet size={16} />}
              sx={{ 
                color: '#ffffff', 
                justifyContent: 'flex-start',
                textTransform: 'none',
              }}
            >
              Wallet
            </Button>
            <Button
              startIcon={<Settings size={16} />}
              sx={{ 
                color: '#ffffff', 
                justifyContent: 'flex-start',
                textTransform: 'none',
              }}
            >
              Settings
            </Button>
            <Button
              startIcon={<LogOut size={16} />}
              sx={{ 
                color: '#ffffff', 
                justifyContent: 'flex-start',
                textTransform: 'none',
              }}
            >
              Sign Out
            </Button>
          </Box>
        </UserSection>
      )}
    </StyledDrawer>
  );

  const renderUserMenu = () => (
    <Menu
      anchorEl={userMenuAnchor}
      open={Boolean(userMenuAnchor)}
      onClose={handleUserMenuClose}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      PaperProps={{
        sx: {
          mt: 1,
          minWidth: 200,
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(26, 35, 126, 0.15)',
        },
      }}
    >
      {user && (
        <>
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {user.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
          <Divider />
        </>
      )}
      
      <MenuItem onClick={handleUserMenuClose}>
        <User size={16} style={{ marginRight: 8 }} />
        Profile
      </MenuItem>
      <MenuItem onClick={handleUserMenuClose}>
        <Wallet size={16} style={{ marginRight: 8 }} />
        Wallet
      </MenuItem>
      <MenuItem onClick={handleUserMenuClose}>
        <Settings size={16} style={{ marginRight: 8 }} />
        Settings
      </MenuItem>
      <Divider />
      <MenuItem onClick={handleUserMenuClose}>
        <LogOut size={16} style={{ marginRight: 8 }} />
        Sign Out
      </MenuItem>
    </Menu>
  );

  return (
    <>
      <StyledAppBar>
        <StyledToolbar>
          <Logo onClick={() => handleNavigate('/')}>
            Quantera
          </Logo>
          
          {renderDesktopNav()}
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {!isMobile && (
              <>
                <NotificationButton>
                  <Badge badgeContent={notifications} color="error">
                    <Bell size={20} />
                  </Badge>
                </NotificationButton>
                
                {user && (
                  <IconButton onClick={handleUserMenuOpen} sx={{ p: 0.5 }}>
                    <Avatar 
                      src={user.avatar} 
                      sx={{ width: 32, height: 32 }}
                    >
                      {user.name.charAt(0)}
                    </Avatar>
                  </IconButton>
                )}
              </>
            )}
            
            <WalletConnect />
            
            {isMobile && renderMobileNav()}
          </Box>
        </StyledToolbar>
      </StyledAppBar>

      {isMobile && renderMobileDrawer()}
      {!isMobile && renderUserMenu()}
    </>
  );
}; 