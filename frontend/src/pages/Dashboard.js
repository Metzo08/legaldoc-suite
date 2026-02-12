import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import mammoth from 'mammoth';
import {
    Box,
    Grid,
    Typography,
    CircularProgress,
    Paper,
    Chip,
    LinearProgress,
    alpha,
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Tooltip,
    Button
} from '@mui/material';
import {
    People as PeopleIcon,
    Folder as FolderIcon,
    Description as DescriptionIcon,
    Event as EventIcon,
    Label as LabelIcon,
    CheckCircle as CheckCircleIcon,
    Close as CloseIcon,
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon,
    RestartAlt as ResetIcon,
    Contrast as ContrastIcon
} from '@mui/icons-material';
import { clientsAPI, casesAPI, documentsAPI, deadlinesAPI, tagsAPI } from '../services/api';
import StatCard from '../components/StatCard';
import DiligenceManager from '../components/DiligenceManager';

function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        clients: 0,
        cases: 0,
        documents: 0,
        deadlines: 0,
        tags: 0
    });
    const [loading, setLoading] = useState(true);
    const [recentDocuments, setRecentDocuments] = useState([]);
    const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
    const [topTags, setTopTags] = useState([]);
    const [casesByCategory, setCasesByCategory] = useState({
        civil: 0,
        penal: 0
    });

    // État pour la prévisualisation
    const [previewDialog, setPreviewDialog] = useState(false);
    const [previewDoc, setPreviewDoc] = useState(null);
    const [imageZoom, setImageZoom] = useState(null);
    const [imageEnhance, setImageEnhance] = useState(false);
    const [wordContent, setWordContent] = useState('');
    const [wordLoading, setWordLoading] = useState(false);


    const handlePreview = async (doc) => {
        setPreviewDoc(doc);
        setImageZoom(null);
        setImageEnhance(false);
        setWordContent('');
        setPreviewDialog(true);

        const extension = (doc.file_extension || doc.title?.split('.').pop() || '').toLowerCase().replace('.', '');

        if (extension.includes('doc')) {
            try {
                setWordLoading(true);
                const response = await fetch(doc.file_url);
                const arrayBuffer = await response.arrayBuffer();
                const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
                setWordContent(result.value);
            } catch (error) {
                console.error('Erreur conversion Word:', error);
                setWordContent('<p style="color: red;">Erreur lors de la lecture du document Word.</p>');
            } finally {
                setWordLoading(false);
            }
        }
    };

    const handleZoomIn = () => setImageZoom(prev => (prev || 100) + 25);
    const handleZoomOut = () => setImageZoom(prev => Math.max(25, (prev || 100) - 25));
    const handleResetZoom = () => {
        setImageZoom(null);
        setImageEnhance(false);
    };
    const toggleEnhance = () => setImageEnhance(prev => !prev);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [clientsRes, casesRes, documentsRes, deadlinesRes, tagsRes] = await Promise.all([
                clientsAPI.getAll(),
                casesAPI.getAll(),
                documentsAPI.getAll({ ordering: '-created_at', page_size: 5 }),
                deadlinesAPI.getAll({ upcoming_days: 7, is_completed: false }),
                tagsAPI.getAll()
            ]);

            const allCasesData = Array.isArray(casesRes.data.results) ? casesRes.data.results : (Array.isArray(casesRes.data) ? casesRes.data : []);

            setStats({
                clients: clientsRes.data.count || (Array.isArray(clientsRes.data) ? clientsRes.data.length : 0),
                cases: casesRes.data.count || (Array.isArray(casesRes.data) ? casesRes.data.length : 0),
                documents: documentsRes.data.count || (Array.isArray(documentsRes.data) ? documentsRes.data.length : 0),
                deadlines: deadlinesRes.data.count || (Array.isArray(deadlinesRes.data) ? deadlinesRes.data.length : 0),
                tags: tagsRes.data.count || (Array.isArray(tagsRes.data) ? tagsRes.data.length : 0)
            });

            // Groupe Civil & Autres (Civil, Commercial, Social)
            const civilCases = allCasesData.filter(c => c && ['CIVIL', 'COMMERCIAL', 'SOCIAL'].includes(c.category));
            // Groupe Pénal & Correctionnel
            const penalCases = allCasesData.filter(c => c && ['PENAL', 'CORRECTIONNEL'].includes(c.category));
            setCasesByCategory({
                civil: civilCases.length,
                penal: penalCases.length
            });

            setRecentDocuments(Array.isArray(documentsRes.data.results) ? documentsRes.data.results : (Array.isArray(documentsRes.data) ? documentsRes.data : []));
            const deadlinesList = Array.isArray(deadlinesRes.data.results) ? deadlinesRes.data.results : (Array.isArray(deadlinesRes.data) ? deadlinesRes.data : []);
            setUpcomingDeadlines(deadlinesList.slice(0, 5));

            const allTags = Array.isArray(tagsRes.data.results) ? tagsRes.data.results : (Array.isArray(tagsRes.data) ? tagsRes.data : []);
            const sortedTags = [...allTags]
                .sort((a, b) => ((b.document_count || 0) + (b.case_count || 0)) - ((a.document_count || 0) + (a.case_count || 0)))
                .slice(0, 5);
            setTopTags(sortedTags);

        } catch (error) {
            console.error('Erreur chargement dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDeadlineColor = (deadline) => {
        if (deadline.is_overdue) return 'error';
        if (deadline.days_remaining <= 1) return 'warning';
        return 'info';
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>Tableau de bord</Typography>
                <Typography variant="body1" color="text.secondary">Bienvenue dans votre gestionnaire de cabinet juridique.</Typography>
            </Box>

            {/* Statistiques principales */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Clients"
                        value={stats.clients}
                        icon={<PeopleIcon />}
                        color="primary"
                        onClick={() => navigate('/clients')}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper
                        elevation={0}
                        sx={{
                            height: '100%',
                            p: 3,
                            borderRadius: 4,
                            border: '1px solid',
                            borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                            transition: 'all 0.3s',
                            cursor: 'pointer',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 12px 24px -10px rgba(0,0,0,0.5)' : '0 12px 24px -10px rgba(0,0,0,0.1)'
                            },
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onClick={() => navigate('/cases')}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 3,
                                bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.1),
                                color: 'secondary.main'
                            }}>
                                <FolderIcon fontSize="medium" />
                            </Box>
                        </Box>

                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.5 }}>Dossiers</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 2 }}>{stats.cases}</Typography>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                                label={`Civil & Autres: ${casesByCategory.civil}`}
                                size="small"
                                onClick={(e) => { e.stopPropagation(); navigate('/cases?filter=CIVIL'); }}
                                sx={{
                                    bgcolor: '#fefce8', color: '#a16207', fontWeight: 800, border: '1px solid #facc15',
                                    '&:hover': { bgcolor: '#fef9c3' }
                                }}
                            />
                            <Chip
                                label={`Pénal & Corr.: ${casesByCategory.penal}`}
                                size="small"
                                onClick={(e) => { e.stopPropagation(); navigate('/cases?filter=CORRECTIONNEL'); }}
                                sx={{
                                    bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 800, border: '1px solid #3b82f6',
                                    '&:hover': { bgcolor: '#dbeafe' }
                                }}
                            />
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Documents"
                        value={stats.documents}
                        icon={<DescriptionIcon />}
                        color="info"
                        onClick={() => navigate('/documents')}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Échéances urgentes"
                        value={upcomingDeadlines.length}
                        icon={<EventIcon />}
                        color="warning"
                        secondaryValue="Prochains 7 jours"
                        onClick={() => navigate('/deadlines')}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Échéances à venir */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{
                        p: 3,
                        height: 480,
                        overflow: 'auto',
                        borderRadius: 4,
                        border: '1px solid',
                        borderColor: 'divider',
                        boxShadow: 'none'
                    }}>
                        <Box
                            onClick={() => navigate('/deadlines')}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                mb: 3,
                                cursor: 'pointer',
                                '&:hover': {
                                    opacity: 0.8
                                }
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha('#fbc02d', 0.1), color: '#fbc02d', mr: 2 }}>
                                    <EventIcon />
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                    Échéances à venir
                                </Typography>
                            </Box>
                            <Chip label="7 jours" size="small" variant="outlined" />
                        </Box>

                        {upcomingDeadlines.length > 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {upcomingDeadlines.map((deadline) => (
                                    <Box
                                        key={deadline.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/deadlines?search=${encodeURIComponent(deadline.title)}`);
                                        }}
                                        sx={{
                                            p: 2,
                                            borderRadius: 3,
                                            bgcolor: 'action.hover',
                                            transition: 'all 0.2s',
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: 'action.selected' }
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                {deadline.title}
                                            </Typography>
                                            <Chip
                                                label={deadline.days_remaining === 0 ? "Aujourd'hui" : `${deadline.days_remaining}j`}
                                                size="small"
                                                color={getDeadlineColor(deadline)}
                                                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                                            />
                                        </Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                            Réf: {deadline.case_reference}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(deadline.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <CheckCircleIcon sx={{ fontSize: 48, color: 'success.light', mb: 2, opacity: 0.5 }} />
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                    Tout est à jour ! Aucune échéance urgente.
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Tags populaires */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{
                        p: 3,
                        height: 480,
                        overflow: 'auto',
                        borderRadius: 4,
                        border: '1px solid',
                        borderColor: 'divider',
                        boxShadow: 'none'
                    }}>
                        <Box
                            onClick={() => navigate('/tags')}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 3,
                                cursor: 'pointer',
                                '&:hover': {
                                    opacity: 0.8
                                }
                            }}
                        >
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha('#6366f1', 0.1), color: '#6366f1', mr: 2 }}>
                                <LabelIcon />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Tags les plus utilisés
                            </Typography>
                        </Box>

                        {topTags.length > 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {topTags.map((tag) => {
                                    const totalUsage = tag.document_count + tag.case_count;
                                    const maxUsage = Math.max(...topTags.map(t => t.document_count + t.case_count));
                                    const percentage = (totalUsage / maxUsage) * 100;

                                    return (
                                        <Box
                                            key={tag.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/documents?search=${encodeURIComponent(tag.name)}`);
                                            }}
                                            sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Chip
                                                    label={tag.name}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: alpha(tag.color, 0.1),
                                                        color: tag.color,
                                                        fontWeight: 700,
                                                        border: `1px solid ${tag.color}`,
                                                        height: 24
                                                    }}
                                                />
                                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                                    {totalUsage} usages
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={percentage}
                                                sx={{
                                                    height: 8,
                                                    borderRadius: 4,
                                                    bgcolor: (theme) => alpha(theme.palette.divider, 0.5),
                                                    '& .MuiLinearProgress-bar': {
                                                        bgcolor: tag.color,
                                                        borderRadius: 4
                                                    }
                                                }}
                                            />
                                        </Box>
                                    );
                                })}
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <LabelIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2, opacity: 0.3 }} />
                                <Typography variant="body2" color="text.secondary">
                                    Commencez à organiser vos dossiers avec des tags.
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Pense-bête (Diligences) */}
                <Grid item xs={12} md={6}>
                    <DiligenceManager />
                </Grid>

                {/* Documents récents */}
                <Grid item xs={12}>
                    <Paper sx={{
                        p: 3,
                        borderRadius: 4,
                        border: '1px solid',
                        borderColor: 'divider',
                        boxShadow: 'none'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha('#1a237e', 0.1), color: 'primary.main', mr: 2 }}>
                                <DescriptionIcon />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Documents récents
                            </Typography>
                        </Box>

                        {recentDocuments.length > 0 ? (
                            <Grid container spacing={2}>
                                {recentDocuments.map((doc) => (
                                    <Grid item xs={12} sm={6} md={4} key={doc.id}>
                                        <Box
                                            onClick={() => handlePreview(doc)}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                p: 2,
                                                borderRadius: 3,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                transition: 'all 0.2s',
                                                '&:hover': {
                                                    bgcolor: 'action.hover',
                                                    borderColor: 'primary.light',
                                                    cursor: 'pointer',
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: (theme) => `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`
                                                }
                                            }}
                                        >
                                            <DescriptionIcon color="primary" sx={{ mr: 2, fontSize: 32 }} />
                                            <Box sx={{ overflow: 'hidden' }}>
                                                <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700 }}>
                                                    {doc.title}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                                                    {doc.case_title}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 1 }}>
                                                    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 500 }}>
                                                        {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                                                    </Typography>
                                                    {doc.ocr_processed && (
                                                        <Chip label="OCR" size="small" variant="outlined" color="success" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 800 }} />
                                                    )}
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 6 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Aucun document n'a encore été ajouté.
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Modal de prévisualisation */}
            <Dialog
                open={previewDialog}
                onClose={() => setPreviewDialog(false)}
                maxWidth="xl"
                fullWidth
                PaperProps={{ sx: { height: '90vh' } }}
            >
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" component="div">{previewDoc?.title}</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {previewDoc && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(previewDoc.file_extension?.toLowerCase().replace('.', '')) && (
                            <>
                                <Tooltip title="Zoom arrière">
                                    <IconButton onClick={handleZoomOut}><ZoomOutIcon /></IconButton>
                                </Tooltip>
                                <Tooltip title="Zoom avant">
                                    <IconButton onClick={handleZoomIn}><ZoomInIcon /></IconButton>
                                </Tooltip>
                                <Tooltip title="Réinitialiser">
                                    <IconButton onClick={handleResetZoom}><ResetIcon /></IconButton>
                                </Tooltip>
                                <Tooltip title="Améliorer la lisibilité (Contraste)">
                                    <IconButton onClick={toggleEnhance} color={imageEnhance ? "primary" : "default"}>
                                        <ContrastIcon />
                                    </IconButton>
                                </Tooltip>
                                <Box sx={{ mx: 1, borderLeft: '1px solid #ddd' }} />
                            </>
                        )}
                        <IconButton aria-label="close" onClick={() => setPreviewDialog(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.default' : '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
                    {previewDoc && (() => {
                        const extension = (previewDoc.file_extension || previewDoc.title?.split('.').pop() || '').toLowerCase().replace('.', '');
                        const isPdf = extension === 'pdf';
                        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
                        const isWord = extension.includes('doc');

                        return (
                            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: imageZoom ? 'flex-start' : 'center', overflow: 'auto', p: 2 }}>
                                {isPdf ? (
                                    <iframe src={previewDoc.file_url} width="100%" height="100%" style={{ border: 'none', borderRadius: '8px' }} title="PDF Preview" />
                                ) : isImage ? (
                                    <img
                                        src={previewDoc.file_url}
                                        alt={previewDoc.title}
                                        style={{
                                            maxWidth: imageZoom ? 'none' : '100%',
                                            maxHeight: imageZoom ? 'none' : '100%',
                                            width: imageZoom ? `${imageZoom}%` : 'auto',
                                            objectFit: 'contain',
                                            filter: imageEnhance ? 'contrast(1.5) brightness(1.05) grayscale(0.2)' : 'none',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                        }}
                                    />
                                ) : isWord ? (
                                    <Paper sx={{ p: 4, width: '100%', maxWidth: '800px', mx: 'auto', minHeight: '100%', bgcolor: 'white', color: 'black', borderRadius: '4px', boxShadow: 3 }} elevation={2}>
                                        {wordLoading ? (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><Typography>Chargement du document Word...</Typography></Box>
                                        ) : (
                                            <div dangerouslySetInnerHTML={{ __html: wordContent }} style={{ textAlign: 'left' }} />
                                        )}
                                    </Paper>
                                ) : (
                                    <Box sx={{ textAlign: 'center', p: 4, bgcolor: 'background.paper', borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                                        <DescriptionIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                                        <Typography variant="h6" color="text.secondary" gutterBottom>
                                            Aperçu non disponible pour ce type de fichier.
                                        </Typography>
                                        <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
                                            Type détecté : {extension.toUpperCase() || 'Inconnu'}
                                        </Typography>
                                        <Button variant="contained" component="a" href={previewDoc.file_url} download>
                                            Télécharger pour voir le fichier
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </Box>
    );
}

export default Dashboard;
