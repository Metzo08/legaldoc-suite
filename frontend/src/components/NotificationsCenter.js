import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconButton,
    Badge,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Typography,
    Divider,
    Box,
    Chip,
    CircularProgress,
    alpha
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Description as DocumentIcon,
    Folder as FolderIcon,
    Person as PersonIcon,
    History as HistoryIcon
} from '@mui/icons-material';
import { notificationsAPI } from '../services/api';
import { ThemeContext } from '../App';
import { useNotification } from '../context/NotificationContext';

function NotificationsCenter() {
    const { darkMode } = useContext(ThemeContext);
    const { playNotificationSound } = useNotification();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const prevNotificationsRef = React.useRef([]);

    const fetchNotifications = useCallback(async () => {
        try {
            if (notifications.length === 0) setLoading(true);
            const response = await notificationsAPI.getAll();
            const data = Array.isArray(response.data.results) ? response.data.results : (Array.isArray(response.data) ? response.data : []);

            // Détecter si de nouvelles notifications non lues sont arrivées pour jouer le son
            const unreadNew = data.filter(n => !n.is_read && !prevNotificationsRef.current.find(pn => pn.id === n.id));
            if (unreadNew.length > 0) {
                playNotificationSound();
            }
            prevNotificationsRef.current = data;

            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [notifications.length, playNotificationSound]);

    useEffect(() => {
        fetchNotifications();
        // Optionnel : rafraîchir toutes les 2 minutes
        const interval = setInterval(fetchNotifications, 120000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsAPI.markAllRead();
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        try {
            if (!notification.is_read) {
                await notificationsAPI.markRead(notification.id);
                setNotifications(notifications.map(n =>
                    n.id === notification.id ? { ...n, is_read: true } : n
                ));
            }
            handleClose();
            // Navigation intelligente
            if (notification.entity_type === 'CASE' && notification.entity_id) {
                navigate(`/cases`); // On pourrait ajouter des filtres ici
            } else if (notification.entity_type === 'DOCUMENT' && notification.entity_id) {
                navigate(`/documents`);
            } else if (notification.entity_type === 'DEADLINE') {
                navigate('/agenda');
            }
        } catch (error) {
            console.error('Error handling notification click:', error);
        }
    };

    const getIcon = (notification) => {
        const { entity_type, level } = notification;
        const color = level === 'ERROR' ? 'error' : (level === 'WARNING' ? 'warning' : 'primary');

        switch (entity_type) {
            case 'DOCUMENT': return <DocumentIcon color={color} />;
            case 'CASE': return <FolderIcon color={color} />;
            case 'DEADLINE': return <HistoryIcon color={color} />;
            case 'CLIENT': return <PersonIcon color={color} />;
            default: return <NotificationsIcon color="action" />;
        }
    };

    const formatCurrentTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMin = Math.floor(diffMs / 60000);

        if (diffMin < 1) return 'À l\'instant';
        if (diffMin < 60) return `Il y a ${diffMin} min`;
        if (diffMin < 1440) return `Il y a ${Math.floor(diffMin / 60)}h`;
        return date.toLocaleDateString();
    };

    return (
        <>
            <IconButton
                onClick={handleClick}
                sx={{ color: darkMode ? 'secondary.main' : 'inherit' }}
            >
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                    sx: {
                        width: 380,
                        maxHeight: 500,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                        borderRadius: 2
                    },
                }}
            >
                <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Notifications
                    </Typography>
                    {unreadCount > 0 && (
                        <Chip
                            label={`${unreadCount} nouvelle${unreadCount > 1 ? 's' : ''}`}
                            size="small"
                            color="error"
                            variant="filled"
                            onClick={handleMarkAllAsRead}
                            sx={{ cursor: 'pointer', fontWeight: 600 }}
                        />
                    )}
                </Box>
                <Divider />

                {loading && notifications.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <CircularProgress size={30} />
                    </Box>
                ) : notifications.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1, opacity: 0.5 }} />
                        <Typography color="text.secondary">
                            Aucune activité récente
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ py: 1 }}>
                        {notifications.map((notification) => (
                            <MenuItem
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                sx={{
                                    py: 1.5,
                                    px: 2,
                                    borderLeft: notification.is_read ? '4px solid transparent' : (theme) => `4px solid ${theme.palette.primary.main}`,
                                    bgcolor: notification.is_read ? 'transparent' : (theme) => darkMode ? alpha(theme.palette.primary.main, 0.05) : alpha(theme.palette.primary.main, 0.03),
                                    whiteSpace: 'normal',
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 44 }}>
                                    {getIcon(notification)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: notification.is_read ? 600 : 800, color: 'text.primary' }}>
                                                {notification.title}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.disabled', ml: 1 }}>
                                                {formatCurrentTime(notification.created_at)}
                                            </Typography>
                                        </Box>
                                    }
                                    secondary={
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                mt: 0.5,
                                                fontWeight: notification.is_read ? 400 : 500,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                lineHeight: 1.4
                                            }}
                                        >
                                            {notification.message}
                                        </Typography>
                                    }
                                />
                            </MenuItem>
                        ))}
                        <Divider sx={{ my: 1 }} />
                        <MenuItem
                            sx={{ justifyContent: 'center', py: 1 }}
                            onClick={() => {
                                // Rediriger vers la page complète du journal d'audit
                                handleClose();
                                navigate('/audit');
                            }}
                        >
                            <Typography variant="body2" color="primary" fontWeight="600">
                                Voir tout le journal d'audit
                            </Typography>
                        </MenuItem>
                    </Box>
                )}
            </Menu>
        </>
    );
}

export default NotificationsCenter;
