import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Button,
    Grid,
    Paper,
    Avatar,
    Stack,
    Divider,
    IconButton,
    alpha,
    AppBar,
    Toolbar
} from '@mui/material';
import {
    LocationOn as LocationIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    AccessTime as TimeIcon,
    ArrowForward as ArrowForwardIcon,
    LinkedIn,
    PhoneAndroid as MobileIcon,
    MailOutline as MailIcon,
    Print as PrintIcon
} from '@mui/icons-material';
import { cabinetAPI } from '../services/api';
import Footer from '../components/Footer';

function LandingPage() {
    const navigate = useNavigate();
    const [cabinet, setCabinet] = useState(null);
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Only call public info which includes branding AND team
            const response = await cabinetAPI.getPublicInfo();
            setCabinet(response.data);
            setTeam(response.data.team || []);
        } catch (error) {
            console.error("Erreur chargement vitrine:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null;

    // DONNÉES DE DÉMONSTRATION (Vitrine réaliste)
    const demoCabinet = {
        name: "CABINET DE MAITRE IBRAHIMA MBENGUE",
        description: "L'excellence juridique au cœur de Dakar. Un cabinet de référence alliant rigueur, dévouement et expertise stratégique pour la défense de vos intérêts et l'accompagnement de vos ambitions.",
        address: "35 bis, Avenue Malick SY\nDakar - Sénégal\nB.P: 14887 Dakar Peytavin",
        phone: "(+221) 33 821 97 97",
        fax: "(00221) 33-821-97-97",
        cel: "(00221) 77.633.88.81",
        email: "maitreimbengue@gmail.com",
        opening_hours: "Lundi - Vendredi : 09h00 - 17h00\nRéception des clients : Lundi - Jeudi : 15h00 - 17h00",
        primary_color: "#1a237e", // Deep Blue professional
        secondary_color: "#c2185b" // Elegant accented red/pink
    };

    // MODE DYNAMIQUE (Utilise l'API, avec fallback sur démo si vide)
    // Si l'API ne répond pas ou si le nom est 'Mon Cabinet' (valeur par défaut), utiliser les données de démo
    const apiName = cabinet?.branding?.name?.trim() || '';
    const isDefaultName = apiName === '' || apiName === 'Mon Cabinet';
    const hasApiData = !isDefaultName;

    // Branding & Content - TOUJOURS utiliser demoCabinet si les données API sont absentes ou par défaut
    const name = hasApiData ? cabinet.branding.name : demoCabinet.name;
    const description = hasApiData ? (cabinet.branding.description || demoCabinet.description) : demoCabinet.description;
    const primaryColor = hasApiData ? (cabinet.branding.primary_color || demoCabinet.primary_color) : demoCabinet.primary_color;
    const secondaryColor = hasApiData ? (cabinet.branding.secondary_color || demoCabinet.secondary_color) : demoCabinet.secondary_color;
    const logoUrl = cabinet?.branding?.logo;

    // Contact - TOUJOURS utiliser demoCabinet si les données API sont absentes ou vides
    const address = (hasApiData && cabinet?.contact?.address && cabinet.contact.address.trim() !== '' && !cabinet.contact.address.includes('non renseignée')) ? cabinet.contact.address : demoCabinet.address;
    const phone = (hasApiData && cabinet?.contact?.phone) ? cabinet.contact.phone : demoCabinet.phone;
    const fax = (hasApiData && cabinet?.contact?.fax) ? cabinet.contact.fax : demoCabinet.fax;
    const cel = (hasApiData && cabinet?.contact?.cel) ? cabinet.contact.cel : demoCabinet.cel;
    const email = (hasApiData && cabinet?.contact?.email) ? cabinet.contact.email : demoCabinet.email;
    const openingHours = (hasApiData && cabinet?.contact?.opening_hours) ? cabinet.contact.opening_hours : demoCabinet.opening_hours;

    // Helper to fix image URLs
    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        // Local images in public folder (e.g., /images/team/...)
        if (path.startsWith('/images/')) return path;

        // Backend media files
        const backendBase = (process.env.REACT_APP_API_URL || 'http://localhost:8000/api').replace('/api', '');
        return `${backendBase}${path}`;
    };

    const displayLogoUrl = getImageUrl(logoUrl);

    // Fusionner l'équipe de l'API avec les données de démonstration si nécessaire
    const defaultTeam = [
        {
            id: 'member1',
            name: "Maître Ibrahima MBENGUE",
            role: "Avocat à la cour",
            biography: "Avocat à la cour avec 35 ans d’expérience. Barreau du Sénégal. Conseil inscrit à la Cours Pénale Internationale (CPI). Conseil inscrit à la Cours Africaine des Droits de l’Homme et des Peuples (CADHP). Spécialisé en droit Pénal, Social et Civil.",
            photo: "/images/team/ibrahima_mbengue.jpg",
            email: "maitreimbengue@gmail.com"
        },
        {
            id: 'member_khady',
            name: "Me Khady SENE",
            role: "Avocate collaboratrice",
            biography: "Diplômée en droit économique et des affaires. Avocat à la cour et membre de l'association des jeunes avocats du Sénégal. Membre de l'association des avocates du Sénégal, experte en contentieux pénal et des affaires.",
            photo: "/images/team/khady_sene.jpg",
            email: "ksene94042@gmail.com",
            linkedin_url: "https://www.linkedin.com/in/maitre-khady-sene-1361b514a/"
        },
        {
            id: 'member2',
            name: "M. Augustin François NDAO",
            role: "Juriste Interne / Collaborateur",
            biography: "Juriste interne spécialisé en droit des Affaires. Certifié informatique et internet par FORCE-N Sénégal, Certifié informatique et internet par FORCE-N Sénégal. Expert en gestion documentaire et transformation digitale des cabinets juridiques.",
            photo: "/images/team/augustin_ndao.jpg",
            email: "francoisndao@gmail.com",
            linkedin_url: "https://www.linkedin.com/in/augustin-f-ndao/"
        },
        {
            id: 'member3',
            name: "M. Médoune MBENGUE",
            role: "Clerc principal et secrétaire général",
            biography: "M. Médoune Mbengue apporte une expertise solide au cabinet, fort de 15 ans d'expérience en tant que clerc principal. Il assure également, avec rigueur et dévouement, les fonctions stratégiques de secrétaire général.",
            photo: "/images/team/medoune_mbengue_v2.png",
            email: "medounembengue111@icloud.com"
        }
    ];

    const displayTeam = team.length > 0 ? team : defaultTeam;

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'white',
            width: '100%',
            margin: 0,
            padding: 0,
            overflowX: 'hidden'
        }}>

            {/* Navigation Bar */}
            <AppBar position="fixed" elevation={0} sx={{ bgcolor: alpha(primaryColor, 0.95), backdropFilter: 'blur(8px)' }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', color: '#ffffff !important' }}>
                        {name}
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={() => navigate('/login')}
                        sx={{
                            color: 'white',
                            borderColor: 'white',
                            fontWeight: 'bold',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: 'white' }
                        }}
                    >
                        Connexion
                    </Button>
                </Toolbar>
            </AppBar>

            <Box sx={{
                position: 'relative',
                bgcolor: primaryColor,
                color: 'white',
                pt: { xs: 10, md: 12 },
                pb: { xs: 6, md: 8 },
                overflow: 'hidden'
            }}>
                {/* Background Decor */}
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: 0.1,
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                    zIndex: 0
                }} />

                <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                    <Grid container spacing={6} alignItems="center">
                        <Grid item xs={12} md={7}>
                            {/* Logo */}
                            <Box
                                component="img"
                                src={displayLogoUrl || "/images/logo.png"}
                                alt="Logo du Cabinet"
                                sx={{
                                    height: { xs: 60, md: 90 },
                                    maxWidth: { xs: 200, md: 280 },
                                    objectFit: 'contain',
                                    mb: 4,
                                    imageRendering: 'auto',
                                    WebkitBackfaceVisibility: 'hidden',
                                    backfaceVisibility: 'hidden',
                                    transform: 'translateZ(0)',
                                    filter: displayLogoUrl
                                        ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.2)) contrast(1.05) saturate(1.1)'
                                        : 'grayscale(100%) brightness(0.5) sepia(1) hue-rotate(200deg) saturate(3)',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'scale(1.05)',
                                        filter: displayLogoUrl
                                            ? 'contrast(1.1) saturate(1.2) drop-shadow(0 6px 15px rgba(0,0,0,0.3))'
                                            : 'grayscale(100%) brightness(0.5) sepia(1) hue-rotate(200deg) saturate(3)'
                                    }
                                }}
                            />

                            <Typography variant="h2" component="h1" fontWeight="800" sx={{ mb: 2, color: '#ffffff !important' }}>
                                {name}
                            </Typography>
                            <Typography variant="h5" sx={{ mb: 4, opacity: 1, lineHeight: 1.6, color: '#ffffff !important' }}>
                                {description || "L'excellence juridique au cœur de Dakar."}
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={() => navigate('/login')}
                                    sx={{
                                        bgcolor: 'white',
                                        color: primaryColor,
                                        fontWeight: 'bold',
                                        '&:hover': { bgcolor: 'grey.100' }
                                    }}
                                    endIcon={<ArrowForwardIcon />}
                                >
                                    Connexion
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}
                                    sx={{
                                        color: 'white',
                                        borderColor: 'white',
                                        '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
                                    }}
                                >
                                    Nous contacter
                                </Button>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
                            <Box
                                sx={{
                                    position: 'relative',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    height: 550,
                                    width: '100%',
                                    perspective: '1000px'
                                }}
                            >
                                {/* Decorative Inner Frame */}
                                <Box sx={{
                                    position: 'absolute',
                                    width: '85%',
                                    height: '90%',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: '24px',
                                    boxShadow: 'inset 0 0 20px rgba(255,255,255,0.05)',
                                    zIndex: 0
                                }} />

                                <Box component="img"
                                    src="/images/lady_justice_statue.jpg"
                                    sx={{
                                        maxWidth: '100%',
                                        height: 'auto',
                                        maxHeight: '100%',
                                        objectFit: 'contain',
                                        mixBlendMode: 'multiply',
                                        filter: 'contrast(1.1) saturate(1.1) brightness(1.05) drop-shadow(0 20px 40px rgba(0,0,0,0.5))',
                                        zIndex: 1,
                                        transform: 'scale(1.08) translateY(-10px)',
                                        transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                        '&:hover': {
                                            transform: 'scale(1.15) translateY(-20px)'
                                        }
                                    }} />

                                {/* Elegant Corner Accents */}
                                <Box sx={{
                                    position: 'absolute',
                                    bottom: 40,
                                    right: 40,
                                    width: 60,
                                    height: 60,
                                    borderBottom: '2px solid rgba(255,255,255,0.4)',
                                    borderRight: '2px solid rgba(255,255,255,0.4)',
                                    borderRadius: '0 0 12px 0',
                                    opacity: 0.6
                                }} />
                                <Box sx={{
                                    position: 'absolute',
                                    top: 40,
                                    left: 40,
                                    width: 60,
                                    height: 60,
                                    borderTop: '2px solid rgba(255,255,255,0.4)',
                                    borderLeft: '2px solid rgba(255,255,255,0.4)',
                                    borderRadius: '12px 0 0 0',
                                    opacity: 0.6
                                }} />
                            </Box>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* TEAM SECTION */}
            <Box sx={{ py: 12, bgcolor: alpha(primaryColor, 0.95), position: 'relative', color: 'white' }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 8 }}>
                        <Typography
                            variant="overline"
                            fontWeight="900"
                            sx={{
                                letterSpacing: 3,
                                color: '#ffffff !important',
                                textTransform: 'uppercase',
                                display: 'block',
                                mb: 1,
                                opacity: 0.95
                            }}
                        >
                            NOTRE ÉQUIPE
                        </Typography>
                        <Typography variant="h3" fontWeight="800" sx={{ mb: 2, color: '#ffffff !important' }}>
                            Des experts à votre écoute
                        </Typography>
                        <Typography variant="body1" sx={{ maxWidth: 600, mx: 'auto', fontSize: '1.1rem', color: '#ffffff !important', opacity: 0.95 }}>
                            Une équipe pluridisciplinaire dévouée à la réussite de vos projets et à la défense de vos droits.
                        </Typography>
                    </Box>

                    <Grid container spacing={4} justifyContent="center">
                        {displayTeam.map((member, index) => (
                            <Grid item xs={12} sm={6} md={6} key={member.id || index}>
                                <Paper
                                    elevation={4}
                                    sx={{
                                        p: 4,
                                        height: 420,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        borderRadius: 4,
                                        bgcolor: 'white',
                                        border: '2px solid',
                                        borderColor: 'grey.200',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-8px)',
                                            boxShadow: 8,
                                            borderColor: primaryColor
                                        }
                                    }}
                                >
                                    {member.photo ? (
                                        <Box
                                            component="img"
                                            src={getImageUrl(member.photo)}
                                            alt={member.name}
                                            sx={{
                                                width: 140,
                                                height: 140,
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                                mb: 2,
                                                border: '4px solid',
                                                borderColor: primaryColor,
                                                boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                                                transform: member.name.includes('Médoune') ? 'scale(1.15)' : 'none',
                                                bgcolor: member.name.includes('Médoune') ? 'grey.50' : 'transparent',
                                                padding: member.name.includes('Médoune') ? '5px' : 0
                                            }}
                                        />
                                    ) : (
                                        <Avatar
                                            sx={{
                                                width: 140,
                                                height: 140,
                                                mb: 2,
                                                bgcolor: primaryColor,
                                                fontSize: '3rem',
                                                fontWeight: 'bold',
                                                border: '4px solid',
                                                borderColor: 'grey.300',
                                                boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                                            }}
                                        >
                                            {member.name.charAt(0)}
                                        </Avatar>
                                    )}
                                    <Typography variant="h5" fontWeight="800" sx={{ color: '#1a1a1a', mb: 0.5 }}>
                                        {member.name}
                                    </Typography>
                                    <Typography variant="subtitle1" sx={{ color: '#333333', fontWeight: 600, mb: 2 }}>
                                        {member.role}
                                    </Typography>
                                    <Divider sx={{ width: 60, mx: 'auto', mb: 2, borderColor: primaryColor }} />
                                    <Typography variant="body2" sx={{ color: '#444444', mb: 2, flex: 1, lineHeight: 1.6 }}>
                                        {member.biography}
                                    </Typography>
                                    <Stack direction="row" spacing={1} justifyContent="center">
                                        {member.linkedin_url && (
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                sx={{ bgcolor: alpha(primaryColor, 0.1) }}
                                                component="a"
                                                href={member.linkedin_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <LinkedIn fontSize="small" />
                                            </IconButton>
                                        )}
                                        {member.email && (
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                sx={{ bgcolor: alpha(primaryColor, 0.1) }}
                                                component="a"
                                                href={`mailto:${member.email}`}
                                            >
                                                <EmailIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Stack>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* CONTACT SECTION */}
            <Box id="contact" sx={{ py: 8, bgcolor: 'white' }}>
                <Container maxWidth="lg">
                    <Grid container spacing={8}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="overline" color="primary" fontWeight="bold">
                                Contact
                            </Typography>
                            <Typography variant="h3" fontWeight="800" sx={{ mb: 4 }} color="black">
                                Nous trouver
                            </Typography>

                            <Stack spacing={4}>
                                <Box sx={{ display: 'flex' }}>
                                    <Box sx={{
                                        mr: 2,
                                        p: 1.5,
                                        borderRadius: 2,
                                        bgcolor: `${primaryColor}15`,
                                        color: primaryColor
                                    }}>
                                        <LocationIcon fontSize="large" />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" fontWeight="bold" color="black">Adresse</Typography>
                                        <Typography variant="body1" color="black" fontWeight="500" sx={{ whiteSpace: 'pre-line' }}>
                                            {address || "Adresse du cabinet non renseignée."}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ display: 'flex' }}>
                                    <Box sx={{
                                        mr: 2,
                                        p: 1.5,
                                        borderRadius: 2,
                                        bgcolor: `${primaryColor}15`,
                                        color: primaryColor
                                    }}>
                                        <TimeIcon fontSize="large" />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" fontWeight="bold" color="black">Horaires d'ouverture</Typography>
                                        <Typography variant="body1" color="black" fontWeight="500" sx={{ whiteSpace: 'pre-line' }}>
                                            {openingHours || "Lundi - Vendredi: 9h00 - 18h00"}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Contact Cards Grid */}
                                <Grid container spacing={2}>
                                    {/* Téléphone */}
                                    {phone && (
                                        <Grid item xs={6}>
                                            <Paper
                                                component="a"
                                                href={`tel:${phone.replace(/\s/g, '')}`}
                                                elevation={0}
                                                sx={{
                                                    p: 2,
                                                    minHeight: 72,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1.5,
                                                    borderRadius: 3,
                                                    bgcolor: alpha(primaryColor, 0.08),
                                                    textDecoration: 'none',
                                                    color: 'inherit',
                                                    transition: 'all 0.3s',
                                                    '&:hover': {
                                                        bgcolor: alpha(primaryColor, 0.15),
                                                        transform: 'translateY(-2px)'
                                                    }
                                                }}
                                            >
                                                <Box sx={{
                                                    p: 1,
                                                    borderRadius: 2,
                                                    bgcolor: primaryColor,
                                                    color: 'white',
                                                    display: 'flex'
                                                }}>
                                                    <PhoneIcon />
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Téléphone</Typography>
                                                    <Typography variant="body2" fontWeight={700} color="black">{phone}</Typography>
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    )}

                                    {/* Fax */}
                                    {fax && (
                                        <Grid item xs={6}>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 2,
                                                    minHeight: 72,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1.5,
                                                    borderRadius: 3,
                                                    bgcolor: alpha(primaryColor, 0.08)
                                                }}
                                            >
                                                <Box sx={{
                                                    p: 1,
                                                    borderRadius: 2,
                                                    bgcolor: 'secondary.main',
                                                    color: 'white',
                                                    display: 'flex'
                                                }}>
                                                    <PrintIcon />
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Fax</Typography>
                                                    <Typography variant="body2" fontWeight={700} color="black">{fax}</Typography>
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    )}

                                    {/* Mobile */}
                                    {cel && (
                                        <Grid item xs={6}>
                                            <Paper
                                                component="a"
                                                href={`tel:${cel.replace(/[.\s]/g, '')}`}
                                                elevation={0}
                                                sx={{
                                                    p: 2,
                                                    minHeight: 72,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1.5,
                                                    borderRadius: 3,
                                                    bgcolor: alpha(primaryColor, 0.08),
                                                    textDecoration: 'none',
                                                    color: 'inherit',
                                                    transition: 'all 0.3s',
                                                    '&:hover': {
                                                        bgcolor: alpha(primaryColor, 0.15),
                                                        transform: 'translateY(-2px)'
                                                    }
                                                }}
                                            >
                                                <Box sx={{
                                                    p: 1,
                                                    borderRadius: 2,
                                                    bgcolor: 'success.main',
                                                    color: 'white',
                                                    display: 'flex'
                                                }}>
                                                    <MobileIcon />
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Mobile</Typography>
                                                    <Typography variant="body2" fontWeight={700} color="black">{cel}</Typography>
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    )}

                                    {/* Email */}
                                    {email && (
                                        <Grid item xs={6}>
                                            <Paper
                                                component="a"
                                                href={`mailto:${email}`}
                                                elevation={0}
                                                sx={{
                                                    p: 2,
                                                    minHeight: 72,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1.5,
                                                    borderRadius: 3,
                                                    bgcolor: alpha(primaryColor, 0.08),
                                                    textDecoration: 'none',
                                                    color: 'inherit',
                                                    transition: 'all 0.3s',
                                                    overflow: 'hidden',
                                                    '&:hover': {
                                                        bgcolor: alpha(primaryColor, 0.15),
                                                        transform: 'translateY(-2px)'
                                                    }
                                                }}
                                            >
                                                <Box sx={{
                                                    p: 1,
                                                    borderRadius: 2,
                                                    bgcolor: 'info.main',
                                                    color: 'white',
                                                    display: 'flex',
                                                    flexShrink: 0
                                                }}>
                                                    <MailIcon />
                                                </Box>
                                                <Box sx={{ overflow: 'hidden', flex: 1 }}>
                                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Email</Typography>
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={700}
                                                        color="black"
                                                        sx={{
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        {email}
                                                    </Typography>
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    )}
                                </Grid>
                            </Stack>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            {/* REAL GOOGLE MAPS INTEGRATION */}
                            <Paper
                                elevation={2}
                                sx={{
                                    width: '100%',
                                    height: '100%',
                                    minHeight: 400,
                                    borderRadius: 4,
                                    overflow: 'hidden',
                                    border: '1px solid',
                                    borderColor: 'divider'
                                }}
                            >
                                <iframe
                                    title="Localisation Cabinet"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0, minHeight: '400px' }}
                                    loading="lazy"
                                    allowFullScreen
                                    src="https://maps.google.com/maps?q=35+bis+Avenue+Malick+SY,+Dakar,+Senegal&t=&z=15&ie=UTF8&iwloc=&output=embed"
                                ></iframe>
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            <Footer variant="dark" />
        </Box >
    );
}

export default LandingPage;
