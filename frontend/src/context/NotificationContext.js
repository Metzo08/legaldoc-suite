import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, Box, Button, IconButton, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState('info'); // 'error', 'warning', 'info', 'success'

    const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3';

    const playNotificationSound = useCallback(() => {
        try {
            const audio = new Audio(NOTIFICATION_SOUND_URL);
            audio.volume = 0.5;
            audio.play().catch(e => console.warn("L'auto-play audio a été bloqué par le navigateur. Le son se jouera après une interaction utilisateur.", e));
        } catch (error) {
            console.error("Erreur lecture son:", error);
        }
    }, []);

    const showNotification = useCallback((msg, sev = 'info') => {
        setMessage(msg);
        setSeverity(sev);
        setOpen(true);
        // Jouer un son si c'est un succès ou une alerte importante
        if (sev === 'success' || sev === 'warning' || sev === 'error') {
            playNotificationSound();
        }
    }, [playNotificationSound]);

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    return (
        <NotificationContext.Provider value={{ showNotification, playNotificationSound }}>
            {children}
            <Snackbar
                open={open}
                autoHideDuration={severity === 'error' ? null : 6000}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert 
                    onClose={handleClose} 
                    severity={severity} 
                    variant="filled"
                    sx={{ 
                        width: '100%', 
                        boxShadow: 6, 
                        borderRadius: 2,
                        '& .MuiAlert-message': {
                            wordBreak: 'break-all',
                            maxWidth: '400px'
                        }
                    }}
                    action={
                        severity === 'error' ? (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button 
                                    color="inherit" 
                                    size="small" 
                                    onClick={() => {
                                        navigator.clipboard.writeText(message);
                                        showNotification("Copié dans le presse-papier !", "success");
                                    }}
                                >
                                    COPIER
                                </Button>
                                <IconButton
                                    aria-label="close"
                                    color="inherit"
                                    size="small"
                                    onClick={handleClose}
                                >
                                    <CloseIcon fontSize="inherit" />
                                </IconButton>
                            </Box>
                        ) : undefined
                    }
                >
                    {severity === 'error' && (
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            ERREUR SYSTÈME
                        </Typography>
                    )}
                    {message}
                </Alert>
            </Snackbar>
        </NotificationContext.Provider>
    );
};
