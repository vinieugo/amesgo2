import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Collapse
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  Group as GroupIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  ExitToApp as LogoutIcon,
  Visibility as TrackingIcon,
  Assessment as ReportIcon,
  ExpandLess,
  ExpandMore,
  Restaurant as MealIcon,
  PeopleAlt as PatientsIcon
} from '@mui/icons-material';

import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';

const drawerWidth = 240;

interface LayoutProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const Layout: React.FC<LayoutProps> = ({ toggleTheme, isDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [reportsOpen, setReportsOpen] = useState(
    location.pathname.startsWith('/reports')
  );
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };
  
  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      roles: [UserRole.ADMIN, UserRole.CLIENT]
    },
    {
      text: 'Cadastrar Paciente',
      icon: <PersonAddIcon />,
      path: '/patients/register',
      roles: [UserRole.ADMIN, UserRole.CLIENT, UserRole.REGISTER]
    },
    {
      text: 'Pacientes em Atendimento',
      icon: <TrackingIcon />,
      path: '/patients/tracking',
      roles: [UserRole.ADMIN, UserRole.CLIENT, UserRole.REGISTER]
    },
    {
      text: 'Listar Pacientes',
      icon: <PersonIcon />,
      path: '/patients',
      roles: [UserRole.ADMIN, UserRole.CLIENT]
    },
    {
      text: 'Relatórios',
      icon: <ReportIcon />,
      path: '/reports',
      roles: [UserRole.ADMIN, UserRole.CLIENT],
      subItems: [
        {
          text: 'Relatório de Pacientes',
          icon: <PatientsIcon />,
          path: '/reports',
          roles: [UserRole.ADMIN, UserRole.CLIENT]
        },
        {
          text: 'Relatório de Refeições',
          icon: <MealIcon />,
          path: '/reports/meals',
          roles: [UserRole.ADMIN, UserRole.CLIENT]
        }
      ]
    },
    {
      text: 'Gerenciar Usuários',
      icon: <GroupIcon />,
      path: '/users',
      roles: [UserRole.ADMIN]
    }
  ];
  
  // Filtrar itens de menu com base na função do usuário
  const filteredMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );
  
  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Sistema Amesgo
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {filteredMenuItems.map((item) => (
          <React.Fragment key={item.text}>
            <ListItem disablePadding>
              {item.subItems ? (
                <ListItemButton 
                  onClick={() => setReportsOpen(!reportsOpen)}
                  sx={{
                    bgcolor: location.pathname.startsWith(item.path) ? 
                      'rgba(255, 255, 255, 0.08)' : 'transparent'
                  }}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                  {reportsOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
              ) : (
                <ListItemButton 
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) {
                      setMobileOpen(false);
                    }
                  }}
                  sx={{
                    bgcolor: location.pathname === item.path ? 
                      'rgba(255, 255, 255, 0.08)' : 'transparent'
                  }}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              )}
            </ListItem>
            
            {item.subItems && (
              <Collapse in={reportsOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.subItems.map((subItem) => (
                    <ListItemButton 
                      key={subItem.text}
                      sx={{ pl: 4, bgcolor: location.pathname === subItem.path ? 
                        'rgba(255, 255, 255, 0.08)' : 'transparent' }}
                      onClick={() => {
                        navigate(subItem.path);
                        if (isMobile) {
                          setMobileOpen(false);
                        }
                      }}
                    >
                      <ListItemIcon>
                        {subItem.icon}
                      </ListItemIcon>
                      <ListItemText primary={subItem.text} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
    </div>
  );
  
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {user?.role === UserRole.ADMIN && 'Administrador'}
            {user?.role === UserRole.CLIENT && 'Cliente'}
            {user?.role === UserRole.REGISTER && 'Cadastro'}
          </Typography>
          
          <Tooltip title="Alternar tema">
            <IconButton color="inherit" onClick={toggleTheme}>
              {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.secondary.main }}>
                {user?.username.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Typography variant="body2" sx={{ ml: 1, display: { xs: 'none', sm: 'block' } }}>
              {user?.username}
            </Typography>
            <Menu
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Sair</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="menu items"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Melhor desempenho em dispositivos móveis
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout; 