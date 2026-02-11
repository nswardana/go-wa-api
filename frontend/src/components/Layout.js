import React from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  useTheme,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemButton,
  Card,
  CardContent,
  Badge,
  Stack,
  Button,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  DashboardOutlined,
  PhoneOutlined,
  MessageOutlined,
  DescriptionOutlined,
  ScheduleOutlined,
  SettingsOutlined,
  VpnKeyOutlined,
  PeopleOutlined,
  ApiOutlined,
  Send,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  AccountCircleOutlined,
  LogoutOutlined,
  NotificationsOutlined,
  SearchOutlined,
  KeyboardArrowDown,
  SmartToy
} from '@mui/icons-material';
import { useState } from 'react';

const drawerWidth = 280;

const menuItems = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: <DashboardOutlined />,
    path: '/dashboard',
    chip: null
  },
  {
    id: 'phones',
    title: 'Phone Numbers',
    icon: <PhoneOutlined />,
    path: '/phones',
    chip: null
  },
  {
    id: 'messages',
    title: 'Messages',
    icon: <MessageOutlined />,
    path: '/messages',
    chip: null
  },
  {
    id: 'contacts',
    title: 'Contacts',
    icon: <PeopleOutlined />,
    path: '/contacts',
    chip: null
  },
  {
    id: 'broadcasts',
    title: 'Broadcasts',
    icon: <Send />,
    path: '/broadcasts',
    chip: null
  },
  {
    id: 'auto-reply',
    title: 'Smart Auto-Reply',
    icon: <SmartToy />,
    path: '/auto-reply',
    chip: null
  },
  {
    id: 'templates',
    title: 'Templates',
    icon: <DescriptionOutlined />,
    path: '/templates',
    chip: null
  },
  {
    id: 'schedules',
    title: 'Scheduled Messages',
    icon: <ScheduleOutlined />,
    path: '/schedules',
    chip: null
  },
  {
    id: 'external-whatsapp',
    title: 'External WhatsApp',
    icon: <ApiOutlined />,
    path: '/external-whatsapp',
    chip: null
  },
  {
    id: 'api-keys',
    title: 'API Keys',
    icon: <VpnKeyOutlined />,
    path: '/api-keys',
    chip: null
  },
  {
    id: 'users',
    title: 'Users',
    icon: <PeopleOutlined />,
    path: '/users',
    chip: null
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: <SettingsOutlined />,
    path: '/settings',
    chip: null
  }
];

const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { isAuthenticated, logout, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleProfileMenuClose();
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Section */}
      <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 600,
            fontSize: '1.2rem'
          }}>
            E
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              ChatFlow
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Admin Dashboard
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ flexGrow: 1, py: 2 }}>
        <List sx={{ px: 2 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={isActive}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    px: 2,
                    '&.Mui-selected': {
                      backgroundColor: `${theme.palette.primary.main}08`,
                      color: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: `${theme.palette.primary.main}12`,
                      },
                      '& .MuiListItemIcon-root': {
                        color: theme.palette.primary.main,
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.title}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 500
                    }}
                  />
                  {item.chip && (
                    <Chip
                      label={item.chip}
                      size="small"
                      color="primary"
                      sx={{ ml: 1 }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* User Section */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Card sx={{ backgroundColor: `${theme.palette.primary.main}08`, border: `1px solid ${theme.palette.primary.main}20` }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                <AccountCircleOutlined />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Admin User
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  admin@chatflow.com
                </Typography>
              </Box>
              <IconButton size="small">
                <KeyboardArrowDown />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            zIndex: theme.zIndex.drawer - 1,
            lg: { display: 'none' }
          }}
          onClick={handleDrawerToggle}
        />
      )}

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{
          width: { lg: drawerWidth },
          flexShrink: { lg: 0 },
          display: { xs: 'none', lg: 'block' }
        }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'persistent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: `1px solid ${theme.palette.divider}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            width: { lg: `calc(100% - ${drawerWidth}px)` },
            ml: { lg: `${drawerWidth}px` },
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            borderBottom: `1px solid ${theme.palette.divider}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Toolbar sx={{ gap: 2 }}>
            {/* Mobile Menu Toggle */}
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { lg: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            {/* Search Bar */}
            <Box sx={{ flexGrow: 1, maxWidth: 400, display: { xs: 'none', sm: 'block' } }}>
              <Box sx={{ position: 'relative' }}>
                <Box sx={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'text.secondary'
                }}>
                  <SearchOutlined />
                </Box>
                <Box
                  component="input"
                  placeholder="Search..."
                  sx={{
                    width: '100%',
                    p: 1.5,
                    pl: 4,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    backgroundColor: theme.palette.background.default,
                    fontSize: '0.875rem',
                    '&:focus': {
                      outline: 'none',
                      borderColor: theme.palette.primary.main,
                    }
                  }}
                />
              </Box>
            </Box>

            {/* Right Actions */}
            <Stack direction="row" spacing={1} alignItems="center">
              {/* Notifications */}
              <IconButton color="inherit">
                <Badge badgeContent={4} color="error">
                  <NotificationsOutlined />
                </Badge>
              </IconButton>

              {/* Profile Menu */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  sx={{ 
                    width: 36, 
                    height: 36, 
                    bgcolor: theme.palette.primary.main,
                    cursor: 'pointer'
                  }}
                  onClick={handleProfileMenuOpen}
                >
                  <AccountCircleOutlined />
                </Avatar>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Admin User
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Administrator
                  </Typography>
                </Box>
                <IconButton size="small" onClick={handleProfileMenuOpen}>
                  <KeyboardArrowDown />
                </IconButton>
              </Box>

              {/* Profile Dropdown */}
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
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
                    minWidth: 200,
                    mt: 1,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    border: `1px solid ${theme.palette.divider}`,
                  }
                }}
              >
                <MenuItem onClick={handleProfileMenuClose}>
                  <ListItemIcon>
                    <AccountCircleOutlined fontSize="small" />
                  </ListItemIcon>
                  Profile
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutOutlined fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            backgroundColor: theme.palette.background.default,
            minHeight: '100vh',
          }}
        >
          <Toolbar />
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
