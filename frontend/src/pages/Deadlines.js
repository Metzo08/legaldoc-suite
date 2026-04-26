import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Grid,
    Chip,
    IconButton,
    Tooltip,
    CircularProgress,
    alpha
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CheckCircle as CheckIcon,
    Event as EventIcon,
    EventBusy as OverdueIcon,
    Schedule as UpcomingIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import { deadlinesAPI, casesAPI, clientsAPI } from '../services/api';
import StatCard from '../components/StatCard';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';

function Deadlines() {
    const { showNotification } = useNotification();
    const [deadlines, setDeadlines] = useState([]);
    const [stats, setStats] = useState({ total: 0, overdue: 0, upcoming: 0 });
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const navigate = useNavigate();
    const [editingDeadline, setEditingDeadline] = useState(null);
    const [formData, setFormData] = useState({
        case: '',
        title: '',
        description: '',
        deadline_type: 'AUTRE',
        due_date: '',
        reminder_days: 7
    });

    // Delete dialog state
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [deadlineToDelete, setDeadlineToDelete] = useState(null);

    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

    const [filterMode, setFilterMode] = useState('ALL');

    const filteredDeadlines = useMemo(() => {
        let base = deadlines;

        // Interactive Filter
        if (filterMode === 'OVERDUE') {
            base = base.filter(d => !d.is_completed && d.is_overdue);
        } else if (filterMode === 'UPCOMING') {
            base = base.filter(d => !d.is_completed && !d.is_overdue);
        }

        if (!searchTerm) return base;
        const lower = searchTerm.toLowerCase();
        return base.filter(d =>
            d.title.toLowerCase().includes(lower) ||
            d.case_reference?.toLowerCase().includes(lower)
        );
    }, [deadlines, searchTerm, filterMode]);

    const deadlineTypes = [
        { value: 'AUDIENCE', label: 'Audience' },
        { value: 'DEPOT', label: 'Dépôt de pièce' },
        { value: 'REPONSE', label: 'Réponse à notifier' },
        { value: 'DELAI', label: 'Délai de recours' },
        { value: 'AUTRE', label: 'Autre' }
    ];

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [deadlinesRes, casesRes, statsRes] = await Promise.all([
                deadlinesAPI.getAll(),
                casesAPI.getAll(),
                clientsAPI.getDashboardStats()
            ]);
            setDeadlines(Array.isArray(deadlinesRes.data.results) ? deadlinesRes.data.results : (Array.isArray(deadlinesRes.data) ? deadlinesRes.data : []));
            setCases(Array.isArray(casesRes.data.results) ? casesRes.data.results : (Array.isArray(casesRes.data) ? casesRes.data : []));
            
            if (statsRes.data?.deadlines_stats) {
                setStats(statsRes.data.deadlines_stats);
            }
        } catch (error) {
            console.error('Erreur chargement:', error);
            showNotification("Erreur lors du chargement des données.", "error");
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Auto-open logic based on URL params
    useEffect(() => {
        const isNew = searchParams.get('new') === 'true';
        const caseId = searchParams.get('caseId');

        if (isNew) {
            setFormData(prev => ({
                ...prev,
                case: caseId || prev.case
            }));
            setOpenDialog(true);
        }
    }, [searchParams]);

    const handleOpenDialog = (deadline = null) => {
        if (deadline) {
            setEditingDeadline(deadline);
            // Ensure date format is correct for datetime-local (YYYY-MM-DDThh:mm)
            const date = new Date(deadline.due_date);
            const formattedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
                .toISOString()
                .slice(0, 16);

            setFormData({
                case: deadline.case,
                title: deadline.title,
                description: deadline.description || '',
                deadline_type: deadline.deadline_type,
                due_date: formattedDate,
                reminder_days: deadline.reminder_days
            });
        } else {
            setEditingDeadline(null);
            setFormData({
                case: '',
                title: '',
                description: '',
                deadline_type: 'AUTRE',
                due_date: '',
                reminder_days: 7
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingDeadline(null);
    };

    const handleSubmit = async () => {
        try {
            if (editingDeadline) {
                await deadlinesAPI.update(editingDeadline.id, formData);
                showNotification("Échéance mise à jour.");
            } else {
                await deadlinesAPI.create(formData);
                showNotification("Échéance créée avec succès !");
            }
            handleCloseDialog();
            loadData();
        } catch (error) {
            console.error('Erreur enregistrement échéance:', error);
            showNotification("Erreur lors de l'enregistrement.", "error");
        }
    };

    const handleDeleteClick = (deadline) => {
        setDeadlineToDelete(deadline);
        setDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await deadlinesAPI.delete(deadlineToDelete.id);
            showNotification("Échéance supprimée.");
            setDeleteDialog(false);
            setDeadlineToDelete(null);
            loadData();
        } catch (error) {
            console.error('Erreur suppression échéance:', error);
            showNotification("Erreur lors de la suppression.", "error");
        }
    };

    const handleToggleComplete = async (deadline) => {
        try {
            await deadlinesAPI.update(deadline.id, { is_completed: !deadline.is_completed });
            showNotification(deadline.is_completed ? "Échéance marquée comme non terminée." : "Échéance marquée comme terminée !");
            loadData();
        } catch (error) {
            console.error('Erreur modification statut:', error);
            showNotification("Erreur lors de la modification du statut.", "error");
        }
    };

    const getCaseCategory = (caseId) => {
        const found = cases.find(c => c.id === caseId);
        return found?.category || 'CIVIL';
    };

    const getDeadlineTypeLabel = (type) => {
        const found = deadlineTypes.find(t => t.value === type);
        return found ? found.label : type;
    };

    const getStatusInfo = (deadline) => {
        if (deadline.is_completed) return { label: 'Terminée', color: 'success', icon: <CheckIcon /> };
        if (deadline.is_overdue) return { label: 'En retard', color: 'error', icon: <OverdueIcon /> };
        return { label: 'À venir', color: 'info', icon: <UpcomingIcon /> };
    };

    if (loading && deadlines.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h2" sx={{ 
                        fontWeight: 900, 
                        mb: 1,
                        background: (theme) => `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${alpha(theme.palette.text.primary, 0.6)} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        Échéances
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.8 }}>
                        Suivez les délais critiques de vos dossiers.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>
                    <TextField
                        size="small"
                        placeholder="Rechercher une échéance..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: <SearchIcon sx={{ color: 'text.disabled', mr: 1, fontSize: 20 }} />
                        }}
                        sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
                    />
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ borderRadius: 2 }}>Nouvelle échéance</Button>
                </Box>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                    <Box onClick={() => setFilterMode('ALL')} sx={{ cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)' }, opacity: filterMode === 'ALL' ? 1 : 0.6 }}>
                        <StatCard
                            title="Total échéances"
                            value={stats.total}
                            icon={<EventIcon color="primary" />}
                            color="primary"
                            sx={{ border: filterMode === 'ALL' ? '2px solid' : 'none', borderColor: 'primary.main', borderRadius: 2 }}
                        />
                    </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Box onClick={() => setFilterMode('OVERDUE')} sx={{ cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)' }, opacity: filterMode === 'OVERDUE' ? 1 : 0.6 }}>
                        <StatCard
                            title="En retard"
                            value={stats.overdue}
                            icon={<OverdueIcon color="error" />}
                            color="error"
                            sx={{ border: filterMode === 'OVERDUE' ? '2px solid' : 'none', borderColor: 'error.main', borderRadius: 2 }}
                        />
                    </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Box onClick={() => setFilterMode('UPCOMING')} sx={{ cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)' }, opacity: filterMode === 'UPCOMING' ? 1 : 0.6 }}>
                        <StatCard
                            title="À venir"
                            value={stats.upcoming}
                            icon={<UpcomingIcon color="info" />}
                            color="info"
                            sx={{ border: filterMode === 'UPCOMING' ? '2px solid' : 'none', borderColor: 'info.main', borderRadius: 2 }}
                        />
                    </Box>
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {filteredDeadlines.map((deadline) => {
                    const status = getStatusInfo(deadline);
                    const category = getCaseCategory(deadline.case);
                    const isYellow = ['CIVIL', 'COMMERCIAL', 'SOCIAL', 'TI_FAMILLE'].includes(category);
                    const isBlue = ['PENAL', 'CORRECTIONNEL'].includes(category);
                    const categoryLabel = (typeof category === 'string' && category.length > 0) 
                        ? (category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()) 
                        : 'Dossier';

                    return (
                        <Grid item xs={12} sm={6} md={4} key={deadline.id}>
                            <Card sx={{
                                borderRadius: 4,
                                border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                                bgcolor: (theme) => theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.6) : '#fff',
                                backdropFilter: 'blur(10px)',
                                boxShadow: (theme) => theme.palette.mode === 'dark' 
                                    ? '0 8px 32px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.05)'
                                    : '0 8px 24px rgba(149, 157, 165, 0.1)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                overflow: 'hidden',
                                '&:hover': {
                                    transform: 'translateY(-6px)',
                                    boxShadow: (theme) => theme.palette.mode === 'dark'
                                        ? `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`
                                        : `0 12px 30px ${alpha(theme.palette.primary.main, 0.1)}`,
                                    '&:before': {
                                        height: 8,
                                    }
                                },
                                '&:before': {
                                    content: '""',
                                    position: 'absolute',
                                    left: 0,
                                    right: 0,
                                    top: 0,
                                    height: 4,
                                    bgcolor: isYellow ? '#facc15' : (isBlue ? '#1d4ed8' : 'primary.main'),
                                    transition: 'height 0.3s ease'
                                }
                            }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                            <Chip 
                                                label={getDeadlineTypeLabel(deadline.deadline_type)} 
                                                size="small" 
                                                variant="outlined"
                                                sx={{ 
                                                    fontWeight: 700, 
                                                    fontSize: '0.65rem',
                                                    borderColor: (theme) => alpha(theme.palette.text.primary, 0.1),
                                                    bgcolor: (theme) => alpha(theme.palette.text.primary, 0.02)
                                                }}
                                            />
                                            <Typography variant="caption" sx={{ 
                                                color: isYellow ? '#a16207' : (isBlue ? '#1d4ed8' : 'primary.main'), 
                                                fontWeight: 800,
                                                letterSpacing: '0.05em',
                                                fontSize: '0.7rem'
                                            }}>
                                                {categoryLabel}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <Tooltip title="Marquer comme terminée">
                                                <IconButton size="small" onClick={() => handleToggleComplete(deadline)} sx={{ bgcolor: alpha(deadline.is_completed ? '#10b981' : '#6b7280', 0.1), color: deadline.is_completed ? "#10b981" : "inherit" }}>
                                                    <CheckIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </Tooltip>
                                            <IconButton size="small" onClick={() => handleOpenDialog(deadline)} sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                                                <EditIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => handleDeleteClick(deadline)} sx={{ bgcolor: (theme) => alpha(theme.palette.error.main, 0.1), color: 'error.main' }}>
                                                <DeleteIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                    <Typography variant="h6" sx={{ 
                                        fontWeight: 800, 
                                        mb: 1.5, 
                                        color: deadline.is_completed ? 'text.disabled' : 'text.primary',
                                        lineHeight: 1.3,
                                        fontSize: '1.1rem'
                                    }}>
                                        {deadline.title}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        onClick={() => navigate(`/cases?search=${encodeURIComponent(deadline.case_reference)}`)}
                                        sx={{ 
                                            mb: 3, 
                                            cursor: 'pointer', 
                                            fontWeight: 600,
                                            fontSize: '0.85rem',
                                            '&:hover': { color: 'primary.main', textDecoration: 'underline' } 
                                        }}
                                    >
                                        Dossier : {deadline.case_reference}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            p: '6px 12px',
                                            borderRadius: '12px',
                                            bgcolor: (theme) => alpha(theme.palette.text.primary, 0.04)
                                        }}>
                                            <EventIcon sx={{ fontSize: 16, mr: 1, opacity: 0.6 }} />
                                            <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                                {new Date(deadline.due_date).toLocaleDateString('fr-FR')}
                                            </Typography>
                                        </Box>
                                        <Chip 
                                            label={status.label} 
                                            color={status.color} 
                                            size="small" 
                                            icon={React.cloneElement(status.icon, { sx: { fontSize: 16 } })}
                                            sx={{ fontWeight: 800, px: 0.5 }}
                                        />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{editingDeadline ? 'Modifier l\'échéance' : 'Nouvelle échéance'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}><TextField label="Dossier" select fullWidth value={formData.case} onChange={(e) => setFormData({ ...formData, case: e.target.value })} required>{cases.map((c) => <MenuItem key={c.id} value={c.id}>{c.reference} - {c.title}</MenuItem>)}</TextField></Grid>
                        <Grid item xs={12}><TextField label="Titre" fullWidth value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></Grid>
                        <Grid item xs={12} sm={6}><TextField label="Type" select fullWidth value={formData.deadline_type} onChange={(e) => setFormData({ ...formData, deadline_type: e.target.value })} required>{deadlineTypes.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}</TextField></Grid>
                        <Grid item xs={12} sm={6}><TextField label="Date d'échéance" type="datetime-local" fullWidth value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} required InputLabelProps={{ shrink: true }} /></Grid>
                        <Grid item xs={12}><TextField label="Rappel (jours avant)" type="number" fullWidth value={formData.reminder_days} onChange={(e) => setFormData({ ...formData, reminder_days: parseInt(e.target.value) })} /></Grid>
                        <Grid item xs={12}><TextField label="Description" fullWidth multiline rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></Grid>
                    </Grid>
                </DialogContent>
                <DialogActions><Button onClick={handleCloseDialog}>Annuler</Button><Button onClick={handleSubmit} variant="contained">Enregistrer</Button></DialogActions>
            </Dialog>

            <DeleteConfirmDialog open={deleteDialog} onClose={() => setDeleteDialog(false)} onConfirm={handleConfirmDelete} title="cette échéance" itemName={deadlineToDelete?.title} />
        </Box>
    );
}

export default Deadlines;
