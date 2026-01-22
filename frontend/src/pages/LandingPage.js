import React, { useState, useEffect, useMemo } from 'react';
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

    // DONNÉES DE DÉMONSTRATION (Vitrine réaliste)
    const demoCabinet = {
        name: "CABINET DE MAITRE IBRAHIMA MBENGUE",
        description: "L'excellence juridique au cœur de Dakar. Un cabinet de référence alliant rigueur, dévouement et expertise stratégique pour la défense de vos intérêts et l'accompagnement de vos ambitions.",
        address: "35, Avenue Malick SY\nBP: 14887 Dakar Peytavin\nDakar - Sénégal",
        phone: "(+221) 33 821 97 97",
        cel: "(00221) 77.633.88.81",
        email: "maitreimbengue@gmail.com",
        opening_hours: "Lundi au Jeudi : 09h00 - 17h00\nRéception des clients : Lundi au Jeudi : 15h00 - 17h00",
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
            biography: "Avocat à la Cour, avec 35 ans d’expérience.\nBarreau du Sénégal.\nConseil inscrit à la Cour pénale internationale (CPI).\nConseil inscrit à la Cour africaine des droits de l’homme et des peuples (CADHP).\nSpécialisé en droit pénal, social et civil.",
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
            role: "Juriste Interne",
            biography: "Juriste interne spécialisé en droit des Affaires. Certifié informatique et internet par FORCE-N Sénégal.",
            photo: "/images/team/augustin_ndao.jpg",
            email: "francoisndao@gmail.com",
            linkedin_url: "https://www.linkedin.com/in/augustin-f-ndao/"
        },
        {
            id: 'member3',
            name: "M. Médoune MBENGUE",
            role: "Clerc principal et secrétaire général",
            biography: "M. Médoune Mbengue apporte une expertise solide au cabinet, fort de 15 ans d'expérience en tant que clerc principal. Il assure également, avec rigueur et dévouement, les fonctions stratégiques de secrétaire général.",
            photo: "/images/team/medoune_mbengue_v3.jpg",
            email: "medounembengue111@icloud.com"
        }
    ];

    // JSON-LD LocalBusiness Data for SEO - Memorized to prevent infinite updates
    const jsonLdData = useMemo(() => ({
        "@context": "https://schema.org",
        "@type": "LegalService",
        "name": name,
        "description": description,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "35 bis, Avenue Malick SY",
            "addressLocality": "Dakar",
            "addressCountry": "SN"
        },
        "telephone": phone,
        "email": email,
        "openingHours": openingHours || "Mo-Fr 09:00-17:00",
        "url": "https://cabinetmaitreibrahimambengue.cloud",
        "image": "https://cabinetmaitreibrahimambengue.cloud/favicon.png",
        "priceRange": "$$"
    }), [name, description, phone, email, openingHours]);

    // Use useEffect to inject JSON-LD into the head
    useEffect(() => {
        const scriptId = 'json-ld-local-business';
        let script = document.getElementById(scriptId);

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.type = 'application/ld+json';
            document.head.appendChild(script);
        }

        script.text = JSON.stringify(jsonLdData);

        return () => {
            const existingScript = document.getElementById(scriptId);
            if (existingScript) {
                document.head.removeChild(existingScript);
            }
        };
    }, [jsonLdData]);

    if (loading) {
        return (
            <Box sx={{
                display: 'flex',
                height: '100vh',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 2,
                bgcolor: '#f8faff'
            }}>
                <Box component="img" src="/favicon.png" sx={{ width: 64, height: 64, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>Chargement...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header section... */}

            {/* AppBar / Navigation */}
            <AppBar position="fixed" elevation={0} sx={{
                bgcolor: primaryColor.startsWith('#') ? primaryColor : '#0f172a',
                backdropFilter: 'blur(8px)',
                borderBottom: 'none' // Suppression du trait noir potentiel
            }}>
                <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {logoUrl ? (
                            <Box
                                component="img"
                                src={getImageUrl(logoUrl)}
                                alt={`Logo ${name}`}
                                sx={{ height: 35, width: 'auto' }}
                            />
                        ) : (
                            <Box
                                component="img"
                                src="/images/logo_v2.png"
                                alt={`Logo ${name}`}
                                sx={{ height: 35, width: 'auto' }}
                            />
                        )}
                        <Typography variant="h6" fontWeight="700" sx={{ color: 'white', letterSpacing: '-0.5px' }}>
                            {name}
                        </Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate('/login')}
                        sx={{
                            color: 'white',
                            borderColor: alpha('#ffffff', 0.5),
                            fontWeight: 600,
                            px: 3,
                            '&:hover': { borderColor: 'white', bgcolor: alpha('#ffffff', 0.1) }
                        }}
                    >
                        Connexion
                    </Button>
                </Toolbar>
            </AppBar>

            {/* Hero Section */}
            <Box sx={{
                pt: { xs: 15, md: 25 },
                pb: { xs: 15, md: 20 },
                bgcolor: primaryColor.startsWith('#') ? primaryColor : '#0f172a',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <Container maxWidth="lg">
                    <Grid container spacing={8} alignItems="center">
                        <Grid item xs={12} md={7}>
                            <Box sx={{ position: 'relative', zIndex: 2 }}>
                                <Typography
                                    component="h1" // SEO: Main Title
                                    variant="h3"
                                    fontWeight="900"
                                    gutterBottom
                                    sx={{
                                        color: 'white',
                                        fontSize: { xs: '1.8rem', md: '2.5rem' },
                                        lineHeight: 1.2,
                                        mb: 2
                                    }}
                                >
                                    {name}
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: alpha('#ffffff', 0.9),
                                        mb: 4,
                                        lineHeight: 1.6,
                                        fontWeight: 400,
                                        fontSize: '1rem',
                                        maxWidth: 550
                                    }}
                                >
                                    {description}
                                </Typography>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                                    <Button
                                        variant="contained"
                                        size="medium"
                                        onClick={() => navigate('/login')}
                                        endIcon={<ArrowForwardIcon />}
                                        sx={{
                                            bgcolor: 'white',
                                            color: primaryColor,
                                            px: 4,
                                            py: 1.5,
                                            fontSize: '1rem',
                                            fontWeight: 700,
                                            boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                                            '&:hover': { bgcolor: alpha('#ffffff', 0.9), transform: 'translateY(-2px)' }
                                        }}
                                    >
                                        Connexion
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size="medium"
                                        href="#contact"
                                        sx={{
                                            color: 'white',
                                            borderColor: alpha('#ffffff', 0.5),
                                            px: 4,
                                            py: 1.5,
                                            fontWeight: 700,
                                            borderWidth: 2,
                                            '&:hover': { borderWidth: 2, borderColor: 'white', bgcolor: alpha('#ffffff', 0.1) }
                                        }}
                                    >
                                        Nous contacter
                                    </Button>
                                </Stack>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
                            <Box sx={{
                                position: 'relative',
                            }}>
                                <Box
                                    component="img"
                                    src="/images/lady_justice_v2.png"
                                    alt="Dame Justice"
                                    sx={{
                                        width: '100%',
                                        maxWidth: 320, // Encore plus petit
                                        height: 'auto',
                                        position: 'relative',
                                        zIndex: 1,
                                        p: 1.5, // Padding pour l'effet cadre
                                        bgcolor: 'rgba(255, 255, 255, 0.05)', // Fond très léger
                                        border: '1px solid rgba(255, 255, 255, 0.2)', // Cadre fin moderne
                                        borderRadius: 4,
                                        filter: 'contrast(1.05) brightness(1.05) drop-shadow(0 15px 35px rgba(0,0,0,0.3))',
                                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                        '&:hover': {
                                            transform: 'translateY(-10px) scale(1.02)',
                                            borderColor: 'rgba(255, 255, 255, 0.4)',
                                            bgcolor: 'rgba(255, 255, 255, 0.1)'
                                        }
                                    }}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Team Section */}
            <Box sx={{ py: 15, bgcolor: '#f8faff' }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 10 }}>
                        <Typography variant="overline" fontWeight="800" sx={{ color: primaryColor, letterSpacing: 3 }}>
                            Notre équipe
                        </Typography>
                        <Typography component="h2" variant="h3" fontWeight="900" sx={{ color: '#00255c', mt: 1, mb: 3 }}>
                            Des experts à votre écoute
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#4c6180', maxWidth: 700, mx: 'auto', fontWeight: 400 }}>
                            Une équipe pluridisciplinaire dévouée à la réussite de vos projets et à la défense de vos droits.
                        </Typography>
                    </Box>

                    <Grid container spacing={4}>
                        {(team.length > 0 ? team : defaultTeam).map((member, index) => (
                            <Grid item xs={12} sm={6} md={3} key={member.id || index}>
                                <Paper
                                    elevation={4}
                                    sx={{
                                        p: 3,
                                        height: 650, // Fixed height for uniformity
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        borderRadius: 4,
                                        bgcolor: 'white',
                                        border: '2px solid',
                                        borderColor: 'grey.100',
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
                                            alt={`Portrait de ${member.name} - ${member.role}`}
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
                                    <Typography variant="subtitle1" sx={{ color: '#333333', fontWeight: 600, mb: 1.5, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {member.role}
                                    </Typography>
                                    <Divider sx={{ width: 60, mx: 'auto', mb: 2, borderColor: primaryColor }} />
                                    <Typography variant="body2" sx={{
                                        color: '#444444',
                                        mb: 2,
                                        flex: 1,
                                        lineHeight: 1.6,
                                        whiteSpace: 'pre-line'
                                    }}>
                                        {member.biography}
                                    </Typography>

                                    <Stack direction="row" spacing={1}>
                                        {member.linkedin_url && (
                                            <IconButton
                                                size="small"
                                                component="a"
                                                href={member.linkedin_url}
                                                target="_blank"
                                                sx={{ color: primaryColor, '&:hover': { bgcolor: alpha(primaryColor.startsWith('#') ? primaryColor : '#0f172a', 0.1) } }}
                                            >
                                                <LinkedIn />
                                            </IconButton>
                                        )}
                                        {member.email && (
                                            <IconButton
                                                size="small"
                                                component="a"
                                                href={`mailto:${member.email}`}
                                                sx={{ color: primaryColor, '&:hover': { bgcolor: alpha(primaryColor, 0.1) } }}
                                            >
                                                <EmailIcon />
                                            </IconButton>
                                        )}
                                    </Stack>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Contact Section */}
            <Box id="contact" sx={{ py: 15, bgcolor: 'white' }}>
                <Container maxWidth="lg">
                    <Grid container spacing={8}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="overline" fontWeight="800" sx={{ color: primaryColor, letterSpacing: 2 }}>
                                Contact
                            </Typography>
                            <Typography component="h2" variant="h3" fontWeight="900" sx={{ color: '#00255c', mt: 1, mb: 6 }}>
                                Nous trouver
                            </Typography>

                            <Stack spacing={4}>
                                <Paper elevation={0} sx={{ p: 3, bgcolor: '#f5f7fa', borderRadius: 4, display: 'flex', gap: 3, alignItems: 'center' }}>
                                    <Avatar sx={{ bgcolor: alpha(primaryColor.startsWith('#') ? primaryColor : '#0f172a', 0.1), color: primaryColor }}>
                                        <LocationIcon />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight="800" sx={{ color: '#00255c', mb: 0.5 }}>Adresse</Typography>
                                        <Typography variant="body2" sx={{ color: '#4c6180', whiteSpace: 'pre-line' }}>{address}</Typography>
                                    </Box>
                                </Paper>

                                <Paper elevation={0} sx={{ p: 3, bgcolor: '#f5f7fa', borderRadius: 4, display: 'flex', gap: 3, alignItems: 'center' }}>
                                    <Avatar sx={{ bgcolor: alpha(primaryColor.startsWith('#') ? primaryColor : '#0f172a', 0.1), color: primaryColor }}>
                                        <TimeIcon />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight="800" sx={{ color: '#00255c', mb: 0.5 }}>Horaires d'ouverture</Typography>
                                        <Typography variant="body2" sx={{ color: '#4c6180', whiteSpace: 'pre-line' }}>{openingHours}</Typography>
                                    </Box>
                                </Paper>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Paper elevation={0} sx={{
                                            p: 2,
                                            bgcolor: '#f5f7fa',
                                            borderRadius: 4,
                                            display: 'flex',
                                            gap: 2,
                                            alignItems: 'center',
                                            transition: 'all 0.3s ease',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                bgcolor: '#edf2f7',
                                                transform: 'translateY(-4px)',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                            }
                                        }}>
                                            <Avatar size="small" sx={{ bgcolor: alpha(primaryColor.startsWith('#') ? primaryColor : '#0f172a', 0.1), color: primaryColor }}>
                                                <PhoneIcon />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="caption" fontWeight="800" sx={{ color: '#4c6180', display: 'block' }}>Téléphone</Typography>
                                                <Typography variant="body2" component="a" href={`tel:${phone.replace(/\s/g, '')}`} sx={{ color: '#00255c', fontWeight: 700, textDecoration: 'none', '&:hover': { color: primaryColor } }}>{phone}</Typography>
                                            </Box>
                                        </Paper>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Paper elevation={0} sx={{
                                            p: 2,
                                            bgcolor: '#f5f7fa',
                                            borderRadius: 4,
                                            display: 'flex',
                                            gap: 2,
                                            alignItems: 'center',
                                            transition: 'all 0.3s ease',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                bgcolor: '#edf2f7',
                                                transform: 'translateY(-4px)',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                            }
                                        }}>
                                            <Avatar size="small" sx={{ bgcolor: alpha(primaryColor.startsWith('#') ? primaryColor : '#0f172a', 0.1), color: primaryColor }}>
                                                <MobileIcon />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="caption" fontWeight="800" sx={{ color: '#4c6180', display: 'block' }}>Mobile</Typography>
                                                <Typography variant="body2" component="a" href={`tel:${cel.replace(/\s/g, '')}`} sx={{ color: '#00255c', fontWeight: 700, textDecoration: 'none', '&:hover': { color: primaryColor } }}>{cel}</Typography>
                                            </Box>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Paper elevation={0} sx={{
                                            p: 2,
                                            bgcolor: '#f5f7fa',
                                            borderRadius: 4,
                                            display: 'flex',
                                            gap: 2,
                                            alignItems: 'center',
                                            transition: 'all 0.3s ease',
                                            cursor: 'pointer',
                                            '&:hover': {
                                                bgcolor: '#edf2f7',
                                                transform: 'translateY(-4px)',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                            }
                                        }}>
                                            <Avatar size="small" sx={{ bgcolor: alpha(primaryColor.startsWith('#') ? primaryColor : '#0f172a', 0.1), color: primaryColor }}>
                                                <MailIcon />
                                            </Avatar>
                                            <Box overflow="hidden">
                                                <Typography variant="caption" fontWeight="800" sx={{ color: '#4c6180', display: 'block' }}>Email</Typography>
                                                <Typography variant="body2" component="a" href={`mailto:${email}`} sx={{ color: '#00255c', fontWeight: 700, textDecoration: 'none', '&:hover': { color: primaryColor }, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</Typography>
                                            </Box>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </Stack>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Paper elevation={4} sx={{
                                height: '100%',
                                minHeight: 450,
                                borderRadius: 6,
                                overflow: 'hidden',
                                border: '8px solid white',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                            }}>
                                <iframe
                                    title="Localisation Cabinet Mbengue"
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3859.213238612!2d-17.4501382!3d14.6766894!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xec1737c7160d643%3A0xbabdee0b3635e123!2sCabinet%20maitre%20Ibrahima%20MBENGUE!5e0!3m2!1sfr!2sfr!4v1737157600000!5m2!1sfr!2sfr"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                />
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            <Footer />
        </Box>
    );
}

export default LandingPage;
