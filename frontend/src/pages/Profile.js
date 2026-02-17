import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Avatar,
    Button,
    Divider,
    Switch,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Security as SecurityIcon
} from '@mui/icons-material';
import { useNotification } from '../context/NotificationContext';
import { usersAPI } from '../services/api';
import authService from '../services/authService';

function Profile() {
    const { showNotification } = useNotification();
    const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
    const [loading, setLoading] = useState(false);

    // 2FA states
    const [twoFactorDialogOpen, setTwoFactorDialogOpen] = useState(false);
    const [qrCodeData, setQrCodeData] = useState(null);
    const [otpCode, setOtpCode] = useState('');
    const [isActivating, setIsActivating] = useState(false);

    // Disable 2FA states
    const [disableDialogOpen, setDisableDialogOpen] = useState(false);
    const [password, setPassword] = useState('');

    const handleSetup2FA = async () => {
        try {
            setLoading(true);
            const response = await usersAPI.setup2FA();
            setQrCodeData(response.data);
            setTwoFactorDialogOpen(true);
        } catch (err) {
            console.error(err);
            showNotification("Erreur lors de la configuration 2FA.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm2FA = async () => {
        try {
            setIsActivating(true);
            await usersAPI.confirm2FA({ otp_code: otpCode });
            showNotification("Authentification à deux facteurs activée !");
            setTwoFactorDialogOpen(false);
            setOtpCode('');
            // Mettre à jour l'utilisateur local
            const updatedUser = { ...currentUser, two_factor_enabled: true };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setCurrentUser(updatedUser);
        } catch (err) {
            console.error(err);
            showNotification(err.response?.data?.detail || "Code invalide.", "error");
        } finally {
            setIsActivating(false);
        }
    };

    const handleDisable2FA = async () => {
        try {
            setLoading(true);
            await usersAPI.disable2FA({ password });
            showNotification("Authentification à deux facteurs désactivée.");
            setDisableDialogOpen(false);
            setPassword('');
            // Mettre à jour l'utilisateur local
            const updatedUser = { ...currentUser, two_factor_enabled: false };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setCurrentUser(updatedUser);
        } catch (err) {
            console.error(err);
            showNotification(err.response?.data?.password || "Erreur lors de la désactivation.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
            <Typography variant="h4" fontWeight="800" sx={{ mb: 4 }}>
                Mon profil
            </Typography>

            <Grid container spacing={4}>
                {/* Informations de base */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, height: '100%' }}>
                        <Avatar
                            sx={{
                                width: 100,
                                height: 100,
                                mx: 'auto',
                                mb: 2,
                                bgcolor: 'primary.main',
                                fontSize: '2.5rem'
                            }}
                        >
                            {currentUser?.username?.[0].toUpperCase()}
                        </Avatar>
                        <Typography variant="h6" fontWeight="bold">
                            {currentUser?.first_name} {currentUser?.last_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            @{currentUser?.username}
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="caption" display="block" color="text.secondary" textAlign="left">
                            Email
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }} textAlign="left">
                            {currentUser?.email}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary" textAlign="left">
                            Rôle
                        </Typography>
                        <Typography variant="body2" textAlign="left">
                            {currentUser?.role}
                        </Typography>
                    </Paper>
                </Grid>

                {/* Sécurité */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 4, borderRadius: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <SecurityIcon color="primary" sx={{ mr: 1 }} />
                            <Typography variant="h6" fontWeight="bold">Sécurité</Typography>
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Authentification à deux facteurs (2FA)
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Ajoutez une couche de sécurité supplémentaire à votre compte en utilisant une application d'authentification.
                                </Typography>
                            </Box>
                            <Switch
                                checked={currentUser?.two_factor_enabled || false}
                                onChange={() => currentUser?.two_factor_enabled ? setDisableDialogOpen(true) : handleSetup2FA()}
                                color="primary"
                            />
                        </Box>

                        {currentUser?.two_factor_enabled ? (
                            <Alert severity="success" sx={{ mt: 2 }}>
                                La 2FA est actuellement active sur votre compte.
                            </Alert>
                        ) : (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                La 2FA n'est pas encore activée. Nous vous recommandons de l'activer pour protéger vos données.
                            </Alert>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Dialog Setup 2FA */}
            <Dialog open={twoFactorDialogOpen} onClose={() => setTwoFactorDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Configuration de la 2FA</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 3 }}>
                        1. Scannez ce QR Code avec votre application d'authentification (Google Authenticator, Authy, etc.).
                    </Typography>

                    {qrCodeData && (
                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                            <img src={qrCodeData.qr_code} alt="QR Code 2FA" style={{ maxWidth: '100%', height: 'auto', border: '1px solid #ddd' }} />
                            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                                Secret : {qrCodeData.secret}
                            </Typography>
                        </Box>
                    )}

                    <Typography variant="body2" sx={{ mb: 2 }}>
                        2. Entrez le code à 6 chiffres généré par l'application pour confirmer.
                    </Typography>

                    <TextField
                        fullWidth
                        label="Code de confirmation"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        inputProps={{ maxLength: 6 }}
                        variant="outlined"
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTwoFactorDialogOpen(false)}>Annuler</Button>
                    <Button
                        onClick={handleConfirm2FA}
                        variant="contained"
                        disabled={otpCode.length !== 6 || isActivating}
                    >
                        {isActivating ? <CircularProgress size={24} /> : "Activer la 2FA"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog Disable 2FA */}
            <Dialog open={disableDialogOpen} onClose={() => setDisableDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>Désactiver la 2FA</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 3 }}>
                        Pour désactiver l'authentification à deux facteurs, veuillez confirmer votre mot de passe.
                    </Typography>
                    <TextField
                        fullWidth
                        type="password"
                        label="Mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        variant="outlined"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDisableDialogOpen(false)}>Annuler</Button>
                    <Button
                        onClick={handleDisable2FA}
                        color="error"
                        variant="contained"
                        disabled={!password || loading}
                    >
                        Désactiver
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default Profile;
