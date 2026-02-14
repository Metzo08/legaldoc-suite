import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    Button,
    Divider,
    CircularProgress,
    Alert,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Settings as SettingsIcon,
    Save as SaveIcon,
    Business as BusinessIcon,
    Palette as PaletteIcon,
    PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import { useNotification } from '../context/NotificationContext';
import { cabinetAPI } from '../services/api';

function Settings() {
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        siret: '',
        description: '',
        primary_color: '#1a237e',
        secondary_color: '#c29b61'
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await cabinetAPI.getSettings();
            setSettings(response.data);
        } catch (error) {
            console.error('Erreur chargement paramètres:', error);
            showNotification('Erreur lors du chargement des paramètres.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            // On utilise FormData car l'API attend du multipart/form-data pour le logo potentiel
            const formData = new FormData();
            formData.append('name', settings.name || '');
            formData.append('address', settings.address || '');
            formData.append('phone', settings.phone || '');
            formData.append('email', settings.email || '');
            formData.append('siret', settings.siret || '');
            formData.append('description', settings.description || '');
            formData.append('primary_color', settings.primary_color || '#1a237e');
            formData.append('secondary_color', settings.secondary_color || '#c29b61');

            await cabinetAPI.updateSettings(formData);
            showNotification('Paramètres enregistrés avec succès !');
        } catch (error) {
            console.error('Erreur sauvegarde paramètres:', error);
            showNotification('Erreur lors de la sauvegarde.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>Paramètres du cabinet</Typography>
                <Typography variant="body1" color="text.secondary">Gérez les informations légales et l'identité visuelle de votre cabinet.</Typography>
            </Box>

            <form onSubmit={handleSubmit}>
                <Grid container spacing={4}>
                    {/* Informations générales */}
                    <Grid item xs={12} md={7}>
                        <Paper sx={{ p: 3, borderRadius: 4, mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <BusinessIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="h6" fontWeight="bold">Informations générales</Typography>
                            </Box>
                            <Divider sx={{ mb: 3 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Nom du cabinet"
                                        name="name"
                                        value={settings.name || ''}
                                        onChange={handleChange}
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label="Adresse"
                                        name="address"
                                        value={settings.address || ''}
                                        onChange={handleChange}
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Téléphone"
                                        name="phone"
                                        value={settings.phone || ''}
                                        onChange={handleChange}
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Email de contact"
                                        name="email"
                                        value={settings.email || ''}
                                        onChange={handleChange}
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="N° SIRET"
                                        name="siret"
                                        value={settings.siret || ''}
                                        onChange={handleChange}
                                        variant="outlined"
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Branding et Design */}
                    <Grid item xs={12} md={5}>
                        <Paper sx={{ p: 3, borderRadius: 4, mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <PaletteIcon color="secondary" sx={{ mr: 1 }} />
                                <Typography variant="h6" fontWeight="bold">Identité visuelle</Typography>
                            </Box>
                            <Divider sx={{ mb: 3 }} />

                            <Typography variant="subtitle2" sx={{ mb: 2 }}>Couleurs de l'interface</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        type="color"
                                        label="Couleur principale"
                                        name="primary_color"
                                        value={settings.primary_color || '#1a237e'}
                                        onChange={handleChange}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        type="color"
                                        label="Couleur secondaire"
                                        name="secondary_color"
                                        value={settings.secondary_color || '#c29b61'}
                                        onChange={handleChange}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                            </Grid>

                            <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
                                Ces couleurs seront appliquées à l'ensemble de la plateforme (boutons, en-têtes, etc.) après le prochain rechargement.
                            </Alert>
                        </Paper>

                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                disabled={saving}
                                sx={{ borderRadius: 3, px: 4, py: 1.5, fontWeight: 'bold' }}
                            >
                                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </form>
        </Box>
    );
}

export default Settings;
