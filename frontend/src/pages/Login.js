import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    InputAdornment,
    IconButton,
    Grid,
    Paper
} from '@mui/material';
import { Visibility, VisibilityOff, Lock, Person } from '@mui/icons-material';
import authService from '../services/authService';
import { useNotification } from '../context/NotificationContext';
import Footer from '../components/Footer';

function Login({ setIsAuthenticated, cabinetInfo }) {
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // 2FA states
    const [is2FARequired, setIs2FARequired] = useState(false);
    const [otpCode, setOtpCode] = useState('');

    // Helper to fix image URLs
    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        if (path.startsWith('/images/')) return path;

        // Use the same dynamic logic as apiClient/authService
        const apiBase = process.env.REACT_APP_API_URL ||
            (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:8001/api' : '/api');
        const backendBase = apiBase.replace('/api', '');

        // Fix: Prepend /media/ if missing for backend paths
        let finalPath = path;
        if (!path.startsWith('/media/') && !path.startsWith('media/')) {
            finalPath = `/media/${path.startsWith('/') ? path.substring(1) : path}`;
        } else if (path.startsWith('media/')) {
            finalPath = `/${path}`;
        }

        return `${backendBase}${finalPath}`;
    };

    // DONNÉES DE DÉMONSTRATION
    const demoCabinet = {
        name: "Cabinet de Maître Ibrahima Mbengue",
        description: "L'excellence juridique au cœur de Dakar. Un cabinet de référence alliant rigueur, dévouement et expertise stratégique pour la défense de vos intérêts et l'accompagnement de vos ambitions.",
        primary_color: "#0f172a",
        secondary_color: "#c29b61",
        logo: null
    };

    const isDefault = false;
    const apiName = cabinetInfo?.branding?.name?.trim() || '';
    const isDefaultName = apiName === '' || apiName === 'Mon Cabinet';
    const hasApiData = !isDefaultName;
    const cabinetName = hasApiData ? cabinetInfo.branding.name : demoCabinet.name;
    const description = hasApiData ? (cabinetInfo.branding.description || demoCabinet.description) : demoCabinet.description;
    const logoUrl = cabinetInfo?.branding?.logo || null;
    const primaryColor = hasApiData ? (cabinetInfo.branding.primary_color || demoCabinet.primary_color) : demoCabinet.primary_color;
    const secondaryColor = hasApiData ? (cabinetInfo.branding.secondary_color || demoCabinet.secondary_color) : demoCabinet.secondary_color;
    const APP_VERSION = "v1.2";

    // Fallback team
    const defaultTeam = [
        {
            id: 'demo1',
            name: "Maître Ibrahima MBENGUE",
            role: "Avocat à la cour",
            photo: "/images/team/ibrahima_mbengue.jpg",
            email: "maitreimbengue@gmail.com"
        },
        {
            id: 'demo2',
            name: "Me Khady SENE",
            role: "Avocate collaboratrice",
            photo: "/images/team/khady_sene.jpg",
            email: "khadysene@gmail.com"
        },
        {
            id: 'demo3',
            name: "M. Augustin François NDAO",
            role: "Juriste Interne",
            photo: "/images/team/augustin_ndao.jpg",
            email: "francoisndao@gmail.com",
            linkedin_url: "https://www.linkedin.com/in/augustin-f-ndao/"
        },
        {
            id: 'demo4',
            name: "M. Médoune MBENGUE",
            role: "Clerc principal et secrétaire général",
            photo: "/images/team/medoune_mbengue_v3.jpg",
            email: "medounembengue111@icloud.com"
        }
    ];

    const displayTeam = (cabinetInfo?.team && cabinetInfo.team.length > 0) ? cabinetInfo.team : defaultTeam;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (is2FARequired) {
                // Étape 2 : Vérification OTP
                await authService.verifyOTP(username, password, otpCode);
                setIsAuthenticated(true);
                showNotification("Connexion réussie ! Bienvenue.", "success");
                navigate('/dashboard');
            } else {
                // Étape 1 : Login standard
                const result = await authService.login(username, password);

                if (result.two_factor_required) {
                    setIs2FARequired(true);
                    showNotification("Authentification à deux facteurs requise.", "info");
                } else {
                    setIsAuthenticated(true);
                    showNotification("Connexion réussie ! Bienvenue.", "success");
                    navigate('/dashboard');
                }
            }
        } catch (err) {
            console.error('DEBUG - Login Full Error:', err);
            console.error('DEBUG - Response Data:', err.response?.data);
            console.error('DEBUG - Response Status:', err.response?.status);

            let message = 'Erreur de connexion. Veuillez réessayer.';
            if (err.response?.status === 401) {
                message = 'Identifiants incorrects. Veuillez réessayer.';
            } else if (err.response?.status === 403) {
                message = 'Erreur de protection CSRF ou accès refusé.';
            } else if (err.response?.data?.detail) {
                message = err.response.data.detail;
            } else if (err.response?.data?.otp_code) {
                message = "Code de sécurité invalide.";
            }
            showNotification(message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
            overflowY: 'auto',
            width: '100%',
        }}>
            <Container maxWidth="lg" sx={{ py: 4, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Grid container spacing={4} alignItems="center">
                    <Grid item xs={12} md={7} sx={{ color: 'white' }}>
                        <Box sx={{ mb: 4 }}>
                            <Box
                                component="img"
                                src={logoUrl ? getImageUrl(logoUrl) : "/images/logo_v2.png"}
                                sx={{
                                    height: 100,
                                    maxWidth: 300,
                                    objectFit: 'contain',
                                    mb: 2,
                                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                                }}
                            />
                            <Typography variant="h2" fontWeight="800" sx={{ mb: 2, color: '#ffffff !important', textTransform: 'none' }}>{cabinetName}</Typography>
                            <Typography variant="h5" sx={{ opacity: 1, mb: 4, maxWidth: '90%', color: '#ffffff !important' }}>{description}</Typography>

                            <Box sx={{ mt: 6 }}>
                                <Typography variant="h6" sx={{ mb: 3, borderBottom: '2px solid rgba(255,255,255,0.3)', display: 'inline-block', pb: 1, color: '#ffffff !important' }}>Notre équipe</Typography>
                                <Grid container spacing={2}>
                                    {displayTeam.map((member) => (
                                        <Grid item xs={12} sm={6} key={member.id}>
                                            <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', color: 'white', display: 'flex', alignItems: 'center', minHeight: 80, height: 80 }}>
                                                {member.photo ? (
                                                    <Box
                                                        component="img"
                                                        src={getImageUrl(member.photo)}
                                                        sx={{
                                                            width: 50,
                                                            height: 50,
                                                            borderRadius: '50%',
                                                            objectFit: 'cover',
                                                            mr: 2,
                                                            border: '2px solid rgba(255,255,255,0.5)',
                                                            flexShrink: 0
                                                        }}
                                                    />
                                                ) : (
                                                    <Person sx={{ width: 50, height: 50, p: 1, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: '50%', mr: 2, flexShrink: 0 }} />
                                                )}
                                                <Box sx={{ overflow: 'hidden', flex: 1 }}>
                                                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#ffffff !important', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name}</Typography>
                                                    <Typography variant="caption" sx={{ opacity: 1, color: '#ffffff !important', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{member.role}</Typography>
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={5}>
                        <Card elevation={12} sx={{ borderRadius: 4, bgcolor: 'rgba(255,255,255,0.95)' }}>
                            <CardContent sx={{ p: 4 }}>
                                <Box sx={{ textAlign: 'center', mb: 3 }}>
                                    <Typography variant="h5" fontWeight="700" color="primary">Espace membres</Typography>
                                    <Typography variant="body2" color="text.secondary">Connexion réservée aux avocats et collaborateurs</Typography>
                                </Box>

                                <form onSubmit={handleSubmit}>
                                    {!is2FARequired ? (
                                        <>
                                            <TextField
                                                fullWidth
                                                label="Nom d'utilisateur"
                                                margin="normal"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                required
                                                InputProps={{ startAdornment: <InputAdornment position="start"><Person color="action" /></InputAdornment> }}
                                            />
                                            <TextField
                                                fullWidth
                                                label="Mot de passe"
                                                type={showPassword ? 'text' : 'password'}
                                                margin="normal"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </>
                                    ) : (
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="body2" sx={{ mb: 2, textAlign: 'center' }}>
                                                Entrez le code à 6 chiffres généré par votre application d'authentification.
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                label="Code de sécurité"
                                                autoFocus
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value)}
                                                required
                                                inputProps={{ maxLength: 6, style: { fontSize: '1.5rem', textAlign: 'center', letterSpacing: '0.5rem' } }}
                                                InputProps={{ startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment> }}
                                            />
                                            <Button
                                                onClick={() => setIs2FARequired(false)}
                                                sx={{ mt: 1, textTransform: 'none' }}
                                                size="small"
                                            >
                                                Retour au login
                                            </Button>
                                        </Box>
                                    )}

                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        disabled={loading}
                                        sx={{ mt: 3, mb: 2, py: 1.5, fontWeight: 700, borderRadius: 2 }}
                                    >
                                        {loading ? 'Connexion...' : 'Se connecter'}
                                    </Button>
                                </form>
                            </CardContent>
                            <Box sx={{ pb: 3, textAlign: 'center' }}>
                                <Button color="secondary" onClick={() => navigate('/')} sx={{ textTransform: 'none' }}>← Retour au site vitrine</Button>
                                <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 1, fontWeight: 'bold' }}>
                                    version {APP_VERSION}
                                </Typography>
                            </Box>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
            <Footer variant="dark" />
        </Box>
    );
}

export default Login;
