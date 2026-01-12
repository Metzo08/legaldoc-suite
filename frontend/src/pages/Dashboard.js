import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    TextField,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Checkbox,
    MenuItem
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
    Contrast as ContrastIcon,
    Note as NoteIcon,
    Save as SaveIcon,
    Delete as DeleteIcon,
    AddCircle as AddIcon,
    NoteAdd as NoteAddIcon
} from '@mui/icons-material';
import { clientsAPI, casesAPI, documentsAPI, deadlinesAPI, tagsAPI, diligencesAPI } from '../services/api';
import StatCard from '../components/StatCard';

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
        correctionnel: 0
    });

    // État pour la prévisualisation
    const [previewDialog, setPreviewDialog] = useState(false);
    const [previewDoc, setPreviewDoc] = useState(null);
    const [imageZoom, setImageZoom] = useState(null);
    const [imageEnhance, setImageEnhance] = useState(false);

    // État pour le Pense-bête (Diligences) - Backend
    const [diligences, setDiligences] = useState([]);
    const [allCases, setAllCases] = useState([]);
    const [newItemText, setNewItemText] = useState('');
    const [selectedCase, setSelectedCase] = useState('');

    const addDiligence = async () => {
        if (!newItemText.trim()) return;
        try {
            const data = {
                title: newItemText.trim(),
                case: selectedCase || null
            };
            const response = await diligencesAPI.create(data);
            setDiligences([response.data, ...diligences]);
            setNewItemText('');
            setSelectedCase('');
        } catch (error) {
            console.error('Erreur creation diligence:', error);
        }
    };

    const toggleDiligence = async (id, currentStatus) => {
        try {
            await diligencesAPI.update(id, { is_completed: !currentStatus });
            setDiligences(diligences.map(item =>
                item.id === id ? { ...item, is_completed: !currentStatus } : item
            ));
        } catch (error) {
            console.error('Erreur update diligence:', error);
        }
    };

    const deleteDiligence = async (id) => {
        try {
            await diligencesAPI.delete(id);
            setDiligences(diligences.filter(item => item.id !== id));
        } catch (error) {
            console.error('Erreur suppression diligence:', error);
        }
    };

    const handlePreview = (doc) => {
        setPreviewDoc(doc);
        setImageZoom(null);
        setImageEnhance(false);
        setPreviewDialog(true);
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
            const [clientsRes, casesRes, documentsRes, deadlinesRes, tagsRes, diligencesRes] = await Promise.all([
                clientsAPI.getAll(),
                casesAPI.getAll(),
                documentsAPI.getAll({ ordering: '-created_at', page_size: 5 }),
                deadlinesAPI.getAll({ upcoming_days: 7, is_completed: false }),
                tagsAPI.getAll(),
                diligencesAPI.getAll()
            ]);

            const allCasesData = casesRes.data.results || casesRes.data;
            setAllCases(allCasesData);
            setDiligences(diligencesRes.data.results || diligencesRes.data);

            setStats({
                clients: clientsRes.data.count || clientsRes.data.length,
                cases: casesRes.data.count || casesRes.data.length,
                documents: documentsRes.data.count || documentsRes.data.length,
                deadlines: deadlinesRes.data.count || deadlinesRes.data.length,
                tags: tagsRes.data.count || tagsRes.data.length
            });

            const civilCases = allCasesData.filter(c => c.category === 'CIVIL');
            const correctionnelCases = allCasesData.filter(c => c.category === 'CORRECTIONNEL');
            setCasesByCategory({
                civil: civilCases.length,
                correctionnel: correctionnelCases.length
            });

            setRecentDocuments(documentsRes.data.results || documentsRes.data);
            setUpcomingDeadlines((deadlinesRes.data.results || deadlinesRes.data).slice(0, 5));

            const allTags = tagsRes.data.results || tagsRes.data;
            const sortedTags = allTags
                .sort((a, b) => (b.document_count + b.case_count) - (a.document_count + a.case_count))
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
                        trend="up"
                        trendValue="12%"
                        onClick={() => navigate('/clients')}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Dossiers"
                        value={stats.cases}
                        icon={<FolderIcon />}
                        color="secondary"
                        secondaryValue={`${casesByCategory.civil} Civil / ${casesByCategory.correctionnel} Corr.`}
                        onClick={() => navigate('/cases')}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Documents"
                        value={stats.documents}
                        icon={<DescriptionIcon />}
                        color="info"
                        trend="up"
                        trendValue="8%"
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
                        height: 420,
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
                        height: 420,
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

                {/* Pense-bête (Notes rapides) */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{
                        p: 3,
                        height: 420,
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 4,
                        border: '1px solid',
                        borderColor: 'divider',
                        boxShadow: 'none',
                        bgcolor: '#fff9c4' // Post-it yellow
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha('#fbc02d', 0.1), color: '#fbc02d', mr: 2 }}>
                                <NoteIcon />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'black' }}>
                                Pense-bête (Diligences)
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    placeholder="Ajouter une nouvelle diligence..."
                                    value={newItemText}
                                    onChange={(e) => setNewItemText(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            addDiligence();
                                        }
                                    }}
                                    variant="standard"
                                    fullWidth
                                    autoComplete="off"
                                    InputProps={{
                                        disableUnderline: true,
                                        sx: { fontFamily: 'inherit', fontSize: '1rem', color: 'black', bgcolor: alpha('#000', 0.05), px: 1, py: 0.5, borderRadius: 1 }
                                    }}
                                />
                                <IconButton onClick={addDiligence} color="primary" sx={{ color: 'black' }}>
                                    <AddIcon />
                                </IconButton>
                            </Box>
                            <TextField
                                select
                                size="small"
                                value={selectedCase}
                                onChange={(e) => setSelectedCase(e.target.value)}
                                variant="standard"
                                fullWidth
                                InputProps={{
                                    disableUnderline: true,
                                    sx: { fontSize: '0.75rem', color: 'black', opacity: 0.7 }
                                }}
                                SelectProps={{
                                    displayEmpty: true,
                                    sx: { '& .MuiSelect-select': { py: 0.5 } }
                                }}
                            >
                                <MenuItem value=""><em>-- Aucun dossier lié --</em></MenuItem>
                                {allCases.map((c) => (
                                    <MenuItem key={c.id} value={c.id}>{c.reference} - {c.title}</MenuItem>
                                ))}
                            </TextField>
                        </Box>

                        <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
                            {diligences.length > 0 ? (
                                <List disablePadding>
                                    {diligences.map((item) => (
                                        <ListItem
                                            key={item.id}
                                            disablePadding
                                            secondaryAction={
                                                <IconButton edge="end" aria-label="delete" onClick={() => deleteDiligence(item.id)}>
                                                    <DeleteIcon sx={{ color: 'black', opacity: 0.6 }} />
                                                </IconButton>
                                            }
                                            sx={{ py: 0.5 }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 32 }}>
                                                <Checkbox
                                                    edge="start"
                                                    checked={item.is_completed}
                                                    tabIndex={-1}
                                                    disableRipple
                                                    onChange={() => toggleDiligence(item.id, item.is_completed)}
                                                    sx={{ color: 'black', '&.Mui-checked': { color: 'black' } }}
                                                />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={item.title}
                                                secondary={item.case_reference ? `Dossier: ${item.case_reference}` : null}
                                                secondaryTypographyProps={{ sx: { fontSize: '0.7rem', fontWeight: 700, opacity: 0.8, color: 'black' } }}
                                                sx={{
                                                    color: 'black',
                                                    textDecoration: item.is_completed ? 'line-through' : 'none',
                                                    opacity: item.is_completed ? 0.6 : 1
                                                }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 4, opacity: 0.7 }}>
                                    <NoteAddIcon sx={{ fontSize: 40, color: 'black', mb: 1 }} />
                                    <Typography variant="body2" sx={{ color: 'black' }}>
                                        Ajoutez vos premières diligences ici.
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', opacity: 0.6 }}>
                            <Typography variant="caption" sx={{ color: 'black', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <SaveIcon fontSize="inherit" /> Synchronisé avec le serveur
                            </Typography>
                        </Box>
                    </Paper>
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
                <DialogContent dividers sx={{ p: 0, bgcolor: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
                    {previewDoc && (
                        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: imageZoom ? 'flex-start' : 'center', overflow: 'auto', p: 2 }}>
                            {previewDoc.file_extension?.toLowerCase() === '.pdf' ? (
                                <iframe
                                    src={previewDoc.file_url}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 'none' }}
                                    title="PDF Preview"
                                />
                            ) : ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(previewDoc.file_extension?.toLowerCase().replace('.', '')) ? (
                                <img
                                    src={previewDoc.file_url}
                                    alt={previewDoc.title}
                                    style={{
                                        maxWidth: imageZoom ? 'none' : '100%',
                                        maxHeight: imageZoom ? 'none' : '100%',
                                        width: imageZoom ? `${imageZoom}%` : 'auto',
                                        objectFit: 'contain',
                                        filter: imageEnhance ? 'contrast(1.5) brightness(1.05) grayscale(0.2)' : 'none',
                                        transition: 'width 0.2s, filter 0.2s'
                                    }}
                                />
                            ) : (
                                <Box sx={{ textAlign: 'center', p: 4 }}>
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        Aperçu non disponible pour ce type de fichier.
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}

export default Dashboard;
