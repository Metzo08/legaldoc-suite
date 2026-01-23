import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Grid,
    Typography,
    Paper,
    Breadcrumbs,
    Link,
    Chip,
    Divider,
    IconButton,
    Button,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    CircularProgress,
    alpha
} from '@mui/material';
import {
    NavigateNext as NavigateNextIcon,
    Folder as FolderIcon,
    Person as PersonIcon,
    Description as DescriptionIcon,
    Gavel as GavelIcon,
    Event as EventIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    CloudUpload as UploadIcon
} from '@mui/icons-material';
import { casesAPI, documentsAPI } from '../services/api';
import authService from '../services/authService';
import DiligenceManager from '../components/DiligenceManager';

const CaseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [caseData, setCaseData] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    const currentUser = authService.getCurrentUser();
    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.is_staff || false;

    const loadCaseData = useCallback(async () => {
        try {
            setLoading(true);
            const [caseRes, docsRes] = await Promise.all([
                casesAPI.getOne(id),
                documentsAPI.getAll({ case: id })
            ]);
            setCaseData(caseRes.data);
            setDocuments(docsRes.data.results || docsRes.data);
        } catch (error) {
            console.error('Erreur chargement détail dossier:', error);
            if (error.response?.status === 404) {
                navigate('/cases');
            }
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        loadCaseData();
    }, [loadCaseData]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!caseData) return null;

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Fil d'ariane & Navigation */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 1 }}>
                        <Link underline="hover" color="inherit" onClick={() => navigate('/cases')} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <FolderIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                            Dossiers
                        </Link>
                        <Typography color="text.primary">{caseData.reference}</Typography>
                    </Breadcrumbs>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>{caseData.title}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/cases')}>Retour</Button>
                    <Button variant="contained" startIcon={<EditIcon />} onClick={() => navigate(`/cases?id=${id}&edit=true`)}>Modifier</Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Colonne Gauche : Infos Clés & Parties */}
                <Grid item xs={12} md={8}>
                    <Grid container spacing={3}>
                        {/* Carte Infos Globales */}
                        <Grid item xs={12}>
                            <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center' }}>
                                    <GavelIcon sx={{ mr: 1, color: 'primary.main' }} /> Informations Générales
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">Statut</Typography>
                                        <Box sx={{ mt: 0.5 }}>
                                            <Chip label={caseData.status} color={caseData.status === 'OUVERT' ? 'success' : 'default'} size="small" sx={{ fontWeight: 700 }} />
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">Catégorie</Typography>
                                        <Box sx={{ mt: 0.5 }}>
                                            <Chip
                                                label={caseData.category}
                                                size="small"
                                                sx={{
                                                    bgcolor: ['CIVIL', 'COMMERCIAL', 'SOCIAL', 'PENAL'].includes(caseData.category) ? '#fff9c4' : '#e3f2fd',
                                                    color: ['CIVIL', 'COMMERCIAL', 'SOCIAL', 'PENAL'].includes(caseData.category) ? '#fbc02d' : '#1976d2',
                                                    fontWeight: 700,
                                                    border: '1px solid',
                                                    borderColor: ['CIVIL', 'COMMERCIAL', 'SOCIAL', 'PENAL'].includes(caseData.category) ? '#fbc02d' : '#1976d2'
                                                }}
                                            />
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">Référence Cabinet</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{caseData.reference}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">Date d'ouverture</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                            {new Date(caseData.opened_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </Typography>
                                    </Grid>
                                </Grid>

                                <Divider sx={{ my: 3 }} />

                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center' }}>
                                    <PersonIcon sx={{ mr: 1, color: 'primary.main' }} /> Parties Impliquées
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">Client (Surnom/Nom)</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main', cursor: 'pointer' }} onClick={() => navigate(`/clients?search=${encodeURIComponent(caseData.client_name)}`)}>
                                            {caseData.client_name}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">Partie représentée</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{caseData.represented_party || 'Non spécifié'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">Partie adverse</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{caseData.adverse_party || 'Non spécifié'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">Avocat(s) adverse(s)</Typography>
                                        <Typography variant="body2">{caseData.adverse_lawyer || 'Aucun information'}</Typography>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>

                        {/* Contacts & Collaboration */}
                        <Grid item xs={12}>
                            <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Collaboration et Contacts</Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary' }}>Personne à contacter</Typography>
                                        <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>{caseData.contact_name || 'Aucun contact direct'}</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                <EmailIcon sx={{ fontSize: 16, mr: 1, color: 'text.disabled' }} />
                                                <Typography variant="caption">{caseData.contact_email || 'Pas d\'email'}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <PhoneIcon sx={{ fontSize: 16, mr: 1, color: 'text.disabled' }} />
                                                <Typography variant="caption">{caseData.contact_phone || 'Pas de téléphone'}</Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary' }}>Avocats à nos côtés</Typography>
                                        <Box sx={{ p: 2, bgcolor: alpha('#6366f1', 0.05), borderRadius: 2, borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
                                            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{caseData.our_lawyers || 'Aucun avocat collaborateur spécifié'}</Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>

                        {/* Honoraires (Admin Only) */}
                        {isAdmin && caseData.fees && (
                            <Grid item xs={12}>
                                <Paper sx={{
                                    p: 3,
                                    borderRadius: 4,
                                    border: '1px solid',
                                    borderColor: 'warning.light',
                                    bgcolor: alpha('#fbc02d', 0.05)
                                }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'warning.dark' }}>Honoraires</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 800 }}>{caseData.fees}</Typography>
                                    <Typography variant="caption" color="text.secondary">Information confidentielle - Visible uniquement par l'administrateur</Typography>
                                </Paper>
                            </Grid>
                        )}
                    </Grid>
                </Grid>

                {/* Colonne Droite : Pense-bête & Documents */}
                <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Pense-bête dédié */}
                        <DiligenceManager
                            caseId={parseInt(id)}
                            title="Notes sur le dossier"
                        />

                        {/* Documents du dossier */}
                        <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>Documents</Typography>
                                <IconButton color="primary" size="small" onClick={() => navigate(`/documents?caseId=${id}&new=true`)}>
                                    <UploadIcon />
                                </IconButton>
                            </Box>

                            {documents.length > 0 ? (
                                <List disablePadding>
                                    {documents.slice(0, 5).map((doc) => (
                                        <ListItem
                                            key={doc.id}
                                            disableGutters
                                            sx={{
                                                cursor: 'pointer',
                                                '&:hover .MuiTypography-root': { color: 'primary.main' }
                                            }}
                                            onClick={() => navigate(`/documents?search=${encodeURIComponent(doc.title)}`)}
                                        >
                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                <DescriptionIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={doc.title}
                                                secondary={new Date(doc.created_at).toLocaleDateString()}
                                                primaryTypographyProps={{ variant: 'body2', fontWeight: 600, noWrap: true }}
                                                secondaryTypographyProps={{ variant: 'caption' }}
                                            />
                                        </ListItem>
                                    ))}
                                    {documents.length > 5 && (
                                        <Button fullWidth size="small" sx={{ mt: 1 }} onClick={() => navigate(`/documents?caseId=${id}`)}>
                                            Voir les {documents.length} documents
                                        </Button>
                                    )}
                                </List>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 4, opacity: 0.5 }}>
                                    <DescriptionIcon sx={{ fontSize: 40, mb: 1 }} />
                                    <Typography variant="body2">Aucun document lié</Typography>
                                </Box>
                            )}
                        </Paper>

                        {/* Échéances */}
                        <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Échéances</Typography>
                            <Button fullWidth variant="outlined" startIcon={<EventIcon />} onClick={() => navigate(`/deadlines?caseId=${id}`)}>
                                Gérer les échéances
                            </Button>
                        </Paper>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default CaseDetail;
