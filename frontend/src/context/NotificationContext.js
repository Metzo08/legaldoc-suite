import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';

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
                autoHideDuration={6000}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleClose} severity={severity} sx={{ width: '100%', boxShadow: 3, borderRadius: 2 }}>
                    {message}
                </Alert>
            </Snackbar>
        </NotificationContext.Provider>
    );
};
