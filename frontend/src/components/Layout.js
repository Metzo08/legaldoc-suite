import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Avatar,
    Menu,
    MenuItem,
    Tooltip
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    Folder as FolderIcon,
    Description as DescriptionIcon,
    Search as SearchIcon,
    Person as PersonIcon,
    Assignment as AssignmentIcon,
    Logout as LogoutIcon,
    Brightness4 as DarkModeIcon,
    Brightness7 as LightModeIcon,
    Label as LabelIcon,
    AssignmentTurnedIn as TaskIcon,
    CalendarMonth as CalendarMonthIcon
} from '@mui/icons-material';
import authService from '../services/authService';
import { ThemeContext } from '../App';
import NotificationsCenter from './NotificationsCenter';
import Footer from './Footer';


const drawerWidth = 260;



const menuItems = [
    { text: 'Tableau de bord', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Agenda', icon: <CalendarMonthIcon />, path: '/agenda' },
    { text: 'Tâches', icon: <TaskIcon />, path: '/tasks' },
    { text: 'Clients', icon: <PeopleIcon />, path: '/clients' },
    { text: 'Dossiers', icon: <FolderIcon />, path: '/cases' },
    { text: 'Documents', icon: <DescriptionIcon />, path: '/documents' },
    { text: 'Tags', icon: <LabelIcon />, path: '/tags', excludeClient: true },
    { text: 'Recherche', icon: <SearchIcon />, path: '/search', excludeClient: true },
    { text: 'Utilisateurs', icon: <PersonIcon />, path: '/users', adminOnly: true },
    { text: 'Journal d\'audit', icon: <AssignmentIcon />, path: '/audit', excludeClient: true },
];

function Layout({ children }) {
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const { darkMode, toggleDarkMode } = useContext(ThemeContext);

    const currentUser = authService.getCurrentUser();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleMenuClick = (path) => {
        navigate(path);
        setMobileOpen(false);
    };

    const handleProfileMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleProfileMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const drawer = (
        <Box>
            {/* Logo */}
            <Box sx={{
                p: 3,
                textAlign: 'center',
                color: 'white',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                {/* Logo removed as it was causing 404 */}
                <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                    LegalDoc
                </Typography>
                <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.2em', fontSize: '0.7rem', textTransform: 'none' }}>
                    Suite
                </Typography>
            </Box>

            {/* Menu de navigation */}
            <List sx={{ px: 2, py: 3 }}>
                {menuItems.map((item) => {
                    // Cacher les éléments admin si l'utilisateur n'est pas admin
                    if (item.adminOnly && currentUser?.role !== 'ADMIN') {
                        return null;
                    }

                    // Cacher les éléments exclus pour les clients
                    if (item.excludeClient && currentUser?.role === 'CLIENT') {
                        return null;
                    }

                    return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                onClick={() => handleMenuClick(item.path)}
                                sx={{
                                    // Styling is handled by theme.js MuiListItemButton override
                                }}
                            >
                                <ListItemIcon>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{
                                        fontWeight: 500,
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', width: '100%' }}>
            {/* Barre d'application */}
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: (theme) => theme.palette.mode === 'light' ? 'white' : 'background.paper',
                    color: 'text.primary',
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
                        {/* Le titre peut être dynamique selon la page */}
                    </Typography>

                    {/* Notifications Center */}
                    <NotificationsCenter />

                    {/* Toggle Dark Mode */}
                    <Tooltip title={darkMode ? "Mode clair" : "Mode sombre"}>
                        <IconButton
                            onClick={toggleDarkMode}
                            sx={{
                                mr: 2,
                                color: darkMode ? 'secondary.main' : 'inherit'
                            }}
                        >
                            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                        </IconButton>
                    </Tooltip>

                    {/* Profil utilisateur */}
                    <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0.5 }}>
                        <Avatar sx={{
                            bgcolor: darkMode ? 'secondary.main' : 'primary.main',
                            color: darkMode ? 'primary.main' : '#fff',
                            fontWeight: 700,
                            boxShadow: darkMode ? '0 0 10px rgba(194,155,97,0.3)' : 'none'
                        }}>
                            {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                        </Avatar>
                    </IconButton>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleProfileMenuClose}
                    >
                        <MenuItem disabled>
                            <Typography variant="body2">{currentUser?.username || 'Utilisateur'}</Typography>
                        </MenuItem>
                        <MenuItem onClick={() => { handleMenuClick('/profile'); handleProfileMenuClose(); }}>
                            <ListItemIcon>
                                <PersonIcon fontSize="small" />
                            </ListItemIcon>
                            Mon Profil
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={handleLogout}>
                            <ListItemIcon>
                                <LogoutIcon fontSize="small" />
                            </ListItemIcon>
                            Déconnexion
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            {/* Drawer */}
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            >
                {/* Mobile drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true,
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>

                {/* Desktop drawer */}
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

            {/* Contenu principal */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    height: '100vh',
                    overflowY: 'auto',
                    bgcolor: 'background.default',
                    position: 'relative'
                }}
            >
                <Box sx={{ p: { xs: 2, sm: 3 }, flexGrow: 1 }}>
                    <Toolbar /> {/* Espace pour l'AppBar */}
                    {children}
                </Box>
                <Footer />
            </Box>
        </Box>
    );
}

export default Layout;
