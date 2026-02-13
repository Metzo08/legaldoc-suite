import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Cleaned
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Paper,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Grid,
    Chip,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CheckCircle as CheckIcon,
    ExpandMore as ExpandMoreIcon,
    Event as EventIcon,
    Gavel as GavelIcon,
    Schedule as UpcomingIcon
} from '@mui/icons-material';
import { deadlinesAPI, casesAPI } from '../services/api';
import StatCard from '../components/StatCard';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';

function Audiences() {
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialSearch = searchParams.get('search') || '';

    const [audiences, setAudiences] = useState([]);
    const [cases, setCases] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingAudience, setEditingAudience] = useState(null);
    const [formData, setFormData] = useState({
        case: '',
        title: '',
        jurisdiction: '',
        courtroom: '',
        action_requested: '',
        result: '',
        description: '',
        deadline_type: 'AUDIENCE',
        due_date: '',
        reminder_days: 1,
        // Champs décision
        record_decision: false,
        decision_type: 'INSTANCE',
        decision_date: '',
        decision_number: '',
        decision_resultat: '',
        decision_observations: ''
    });

    const [deleteDialog, setDeleteDialog] = useState(false);
    const [audienceToDelete, setAudienceToDelete] = useState(null);

    // États pour le filtrage
    const [filterMode, setFilterMode] = useState('ALL'); // 'ALL', 'UPCOMING', 'COMPLETED'
    const [selectedCaseId, setSelectedCaseId] = useState('ALL');
    const [selectedJurisdiction, setSelectedJurisdiction] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState(initialSearch);

    const loadData = useCallback(async () => {
        try {
            const [deadlinesRes, casesRes] = await Promise.all([
                deadlinesAPI.getAll(),
                casesAPI.getAll()
            ]);
            // Filter only AUDIENCE type for this page
            const allDeadlines = Array.isArray(deadlinesRes.data.results) ? deadlinesRes.data.results : (Array.isArray(deadlinesRes.data) ? deadlinesRes.data : []);
            setAudiences(allDeadlines.filter(d => d.deadline_type === 'AUDIENCE'));
            setCases(Array.isArray(casesRes.data.results) ? casesRes.data.results : (Array.isArray(casesRes.data) ? casesRes.data : []));
        } catch (error) {
            console.error('Erreur chargement:', error);
            showNotification("Erreur lors du chargement des audiences.", "error");
        }
    }, [showNotification]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Auto-open logic based on URL params
    useEffect(() => {
        const isNew = searchParams.get('new') === 'true';
        const caseId = searchParams.get('caseId');

        if (isNew && caseId && caseId !== 'undefined' && !isNaN(parseInt(caseId))) {
            setFormData(prev => ({
                ...prev,
                case: parseInt(caseId)
            }));
            setOpenDialog(true);
        }
    }, [searchParams]);

    const handleOpenDialog = (audience = null) => {
        if (audience) {
            setEditingAudience(audience);
            const date = new Date(audience.due_date);
            const formattedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
                .toISOString()
                .slice(0, 16);

            setFormData({
                case: audience.case,
                title: audience.title,
                jurisdiction: audience.jurisdiction || '',
                courtroom: audience.courtroom || '',
                action_requested: audience.action_requested || '',
                result: audience.result || '',
                description: audience.description || '',
                deadline_type: 'AUDIENCE',
                due_date: formattedDate,
                reminder_days: audience.reminder_days || 1,
                record_decision: !!audience.decision,
                decision_type: audience.decision?.decision_type || 'INSTANCE',
                decision_date: audience.decision?.date_decision || '',
                decision_number: audience.decision?.numero_decision || '',
                decision_resultat: audience.decision?.resultat || '',
                decision_observations: audience.decision?.observations || ''
            });
        } else {
            setEditingAudience(null);
            setFormData({
                case: '',
                title: 'Audience de plaidoirie',
                jurisdiction: 'Tribunal Hors Classe de Dakar',
                courtroom: 'Salle 1',
                action_requested: '',
                result: '',
                description: '',
                deadline_type: 'AUDIENCE',
                due_date: '',
                reminder_days: 1,
                record_decision: false,
                decision_type: 'INSTANCE',
                decision_date: '',
                decision_number: '',
                decision_resultat: '',
                decision_observations: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingAudience(null);
    };

    const handleSubmit = async () => {
        try {
            if (editingAudience) {
                const payload = { ...formData };
                if (formData.record_decision) {
                    payload.decision = {
                        decision_type: formData.decision_type,
                        date_decision: formData.decision_date || null,
                        numero_decision: formData.decision_number,
                        resultat: formData.decision_resultat,
                        observations: formData.decision_observations
                    };
                }
                await deadlinesAPI.update(editingAudience.id, payload);
                showNotification("Audience mise à jour.");
            } else {
                await deadlinesAPI.create(formData);
                showNotification("Audience ajoutée à l'agenda !");
            }
            handleCloseDialog();
            loadData();
        } catch (error) {
            console.error('Erreur enregistrement audience:', error);
            showNotification("Erreur lors de l'enregistrement.", "error");
        }
    };

    const handleDeleteClick = (audience) => {
        setAudienceToDelete(audience);
        setDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await deadlinesAPI.delete(audienceToDelete.id);
            showNotification("Audience supprimée.");
            setDeleteDialog(false);
            setAudienceToDelete(null);
            loadData();
        } catch (error) {
            console.error('Erreur suppression audience:', error);
            showNotification("Erreur lors de la suppression.", "error");
        }
    };

    const handleToggleComplete = async (audience) => {
        try {
            await deadlinesAPI.update(audience.id, { is_completed: !audience.is_completed });
            showNotification(audience.is_completed ? "Audience marquée comme non passée." : "Audience marquée comme terminée.");
            loadData();
        } catch (error) {
            console.error('Erreur statut audience:', error);
            showNotification("Erreur lors de la modification du statut.", "error");
        }
    };

    const getCaseCategory = (caseId) => {
        const found = cases.find(c => c.id === caseId);
        return found?.category || 'CIVIL';
    };

    // Grouping by date
    const filteredAudiences = useMemo(() => {
        let base = audiences;

        // Filtre par mode (Toutes vs À venir)
        if (filterMode === 'UPCOMING') {
            base = base.filter(a => !a.is_completed);
        } else if (filterMode === 'COMPLETED') {
            base = base.filter(a => a.is_completed);
        }

        // Filtre par dossier spécifique
        if (selectedCaseId !== 'ALL') {
            base = base.filter(a => a.case === selectedCaseId);
        }

        // Filtre par juridiction
        if (selectedJurisdiction !== 'ALL') {
            base = base.filter(a => a.jurisdiction === selectedJurisdiction);
        }

        if (!searchTerm) return base;
        const lower = searchTerm.toLowerCase();
        return base.filter(a =>
            a.title.toLowerCase().includes(lower) ||
            a.case_reference?.toLowerCase().includes(lower) ||
            a.jurisdiction?.toLowerCase().includes(lower) ||
            a.description?.toLowerCase().includes(lower)
        );
    }, [audiences, searchTerm, filterMode, selectedCaseId, selectedJurisdiction]);

    const groupedAudiences = filteredAudiences.reduce((groups, audience) => {
        const date = new Date(audience.due_date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        if (!groups[date]) groups[date] = [];
        groups[date].push(audience);
        return groups;
    }, {});

    const jurisdictions = useMemo(() => {
        const set = new Set(audiences.map(a => a.jurisdiction).filter(Boolean));
        return Array.from(set).sort();
    }, [audiences]);

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>Audiences</Typography>
                    <Typography variant="body1" color="text.secondary">Agenda des audiences et diligences judiciaires.</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ borderRadius: 2 }}>Nouvelle audience</Button>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                    <Box onClick={() => { setFilterMode('ALL'); setSelectedCaseId('ALL'); setSelectedJurisdiction('ALL'); }} sx={{ cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)' }, opacity: filterMode === 'ALL' && selectedCaseId === 'ALL' && selectedJurisdiction === 'ALL' ? 1 : 0.6 }}>
                        <StatCard title="Total audiences" value={audiences.length} icon={<GavelIcon color="primary" />} color="primary" sx={{ border: (filterMode === 'ALL' && selectedCaseId === 'ALL' && selectedJurisdiction === 'ALL') ? '2px solid' : 'none', borderColor: 'primary.main', borderRadius: 2 }} />
                    </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Box onClick={() => setFilterMode('UPCOMING')} sx={{ cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)' }, opacity: filterMode === 'UPCOMING' ? 1 : 0.6 }}>
                        <StatCard title="Audiences à venir" value={audiences.filter(a => !a.is_completed).length} icon={<UpcomingIcon color="info" />} color="info" sx={{ border: filterMode === 'UPCOMING' ? '2px solid' : 'none', borderColor: 'info.main', borderRadius: 2 }} />
                    </ Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Box onClick={() => setFilterMode('COMPLETED')} sx={{ cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)' }, opacity: filterMode === 'COMPLETED' ? 1 : 0.6 }}>
                        <StatCard title="Audiences terminées" value={audiences.filter(a => a.is_completed).length} icon={<CheckIcon color="success" />} color="success" sx={{ border: filterMode === 'COMPLETED' ? '2px solid' : 'none', borderColor: 'success.main', borderRadius: 2 }} />
                    </Box>
                </Grid>
            </Grid>

            {/* Filter Bar */}
            <Paper sx={{ p: 2, mb: 4, borderRadius: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', boxShadow: 2 }}>
                <TextField
                    size="small"
                    placeholder="Rechercher une audience..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ flexGrow: 1, minWidth: 200 }}
                />

                <TextField
                    select
                    label="Statut"
                    size="small"
                    value={filterMode}
                    onChange={(e) => setFilterMode(e.target.value)}
                    sx={{ minWidth: 150 }}
                >
                    <MenuItem value="ALL">Tous les statuts</MenuItem>
                    <MenuItem value="UPCOMING">À venir</MenuItem>
                    <MenuItem value="COMPLETED">Terminées</MenuItem>
                </TextField>

                <TextField
                    select
                    label="Juridiction"
                    size="small"
                    value={selectedJurisdiction}
                    onChange={(e) => setSelectedJurisdiction(e.target.value)}
                    sx={{ minWidth: 150 }}
                >
                    <MenuItem value="ALL">Toutes les juridictions</MenuItem>
                    {jurisdictions.map(j => <MenuItem key={j} value={j}>{j}</MenuItem>)}
                </TextField>

                <TextField
                    select
                    label="Dossier"
                    size="small"
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                    sx={{ minWidth: 150 }}
                >
                    <MenuItem value="ALL">Tous les dossiers</MenuItem>
                    {cases.map(c => <MenuItem key={c.id} value={c.id}>{c.reference}</MenuItem>)}
                </TextField>

                <Button
                    variant="text"
                    onClick={() => {
                        setSearchTerm('');
                        setFilterMode('ALL');
                        setSelectedCaseId('ALL');
                        setSelectedJurisdiction('ALL');
                    }}
                >
                    Réinitialiser
                </Button>
            </Paper>

            {Object.keys(groupedAudiences).length > 0 ? Object.keys(groupedAudiences).map((date) => (
                <Box key={date} sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', color: 'primary.main', fontWeight: 700 }}>
                        <EventIcon sx={{ mr: 1 }} /> {date}
                    </Typography>
                    <Grid container spacing={2}>
                        {groupedAudiences[date].map((audience) => {
                            const category = getCaseCategory(audience.case);
                            const isYellow = ['CIVIL', 'COMMERCIAL', 'SOCIAL'].includes(category);
                            const isBlue = ['PENAL', 'CORRECTIONNEL'].includes(category);
                            const categoryLabel = category.charAt(0) + category.slice(1).toLowerCase();

                            return (
                                <Grid item xs={12} md={6} key={audience.id}>
                                    <Card sx={{
                                        borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none',
                                        position: 'relative', overflow: 'hidden',
                                        '&:before': {
                                            content: '""', position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                                            bgcolor: isYellow ? '#facc15' : (isBlue ? '#1d4ed8' : 'primary.main')
                                        }
                                    }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="caption" sx={{ color: isYellow ? '#a16207' : '#1d4ed8', fontWeight: 800, textTransform: 'uppercase' }}>
                                                    {categoryLabel} • {new Date(audience.due_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </Typography>
                                                <Box>
                                                    <Tooltip title="Terminée"><IconButton size="small" onClick={() => handleToggleComplete(audience)} color={audience.is_completed ? "success" : "default"}><CheckIcon fontSize="small" /></IconButton></Tooltip>
                                                    <IconButton size="small" onClick={() => handleOpenDialog(audience)} color="primary"><EditIcon fontSize="small" /></IconButton>
                                                    <IconButton size="small" onClick={() => handleDeleteClick(audience)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                                                </Box>
                                            </Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>{audience.title}</Typography>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                onClick={() => navigate(`/cases?search=${encodeURIComponent(audience.case_reference)}`)}
                                                sx={{ mb: 1, cursor: 'pointer', '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}
                                            >
                                                <strong>Dossier:</strong> {audience.case_reference}
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                <Chip label={audience.jurisdiction || 'Tribunal'} size="small" variant="outlined" />
                                                <Chip label={audience.courtroom || 'S.1'} size="small" variant="outlined" />
                                                {audience.is_completed && <Chip label="Passée" color="success" size="small" />}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Box>
            )) : (
                <Box sx={{ textAlign: 'center', py: 10, bgcolor: 'action.hover', borderRadius: 4 }}>
                    <Typography color="text.secondary">Aucune audience programmée.</Typography>
                </Box>
            )}

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{editingAudience ? 'Modifier l\'audience' : 'Nouvelle audience'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}><TextField label="Dossier" select fullWidth value={formData.case} onChange={(e) => setFormData({ ...formData, case: e.target.value })} required>{cases.map((c) => <MenuItem key={c.id} value={c.id}>{c.reference} - {c.title}</MenuItem>)}</TextField></Grid>
                        <Grid item xs={12}><TextField label="Objet de l'audience" fullWidth value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></Grid>
                        <Grid item xs={12} sm={6}><TextField label="Juridiction" fullWidth value={formData.jurisdiction} onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })} /></Grid>
                        <Grid item xs={12} sm={6}><TextField label="Salle" fullWidth value={formData.courtroom} onChange={(e) => setFormData({ ...formData, courtroom: e.target.value })} /></Grid>
                        <Grid item xs={12} sm={6}><TextField label="Date & Heure" type="datetime-local" fullWidth value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} required InputLabelProps={{ shrink: true }} /></Grid>
                        <Grid item xs={12}><TextField label="Diligence demandée" fullWidth value={formData.action_requested} onChange={(e) => setFormData({ ...formData, action_requested: e.target.value })} /></Grid>

                        {editingAudience && (
                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Accordion expanded={formData.record_decision} onChange={(e, expanded) => setFormData({ ...formData, record_decision: expanded })} sx={{ bgcolor: 'action.hover', borderRadius: 2 }}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <GavelIcon sx={{ color: formData.decision_type === 'APPEL' ? '#ed6c02' : formData.decision_type === 'POURVOI' ? '#d32f2f' : '#2196f3' }} />
                                            <Typography sx={{ fontWeight: 700 }}>Décision rendue</Typography>
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    select
                                                    fullWidth
                                                    label="Type de décision"
                                                    value={formData.decision_type}
                                                    onChange={(e) => setFormData({ ...formData, decision_type: e.target.value })}
                                                >
                                                    <MenuItem value="INSTANCE" sx={{ color: '#2196f3', fontWeight: 'bold' }}>Instance</MenuItem>
                                                    <MenuItem value="APPEL" sx={{ color: '#ed6c02', fontWeight: 'bold' }}>Appel</MenuItem>
                                                    <MenuItem value="POURVOI" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>Pourvoi</MenuItem>
                                                </TextField>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    fullWidth
                                                    type="date"
                                                    label="Date de décision"
                                                    value={formData.decision_date}
                                                    onChange={(e) => setFormData({ ...formData, decision_date: e.target.value })}
                                                    InputLabelProps={{ shrink: true }}
                                                />
                                            </Grid>
                                            <Grid item xs={12}>
                                                <TextField
                                                    fullWidth
                                                    label="Numéro de la décision"
                                                    value={formData.decision_number}
                                                    onChange={(e) => setFormData({ ...formData, decision_number: e.target.value })}
                                                    placeholder="Rempli par la personne qui reporte les décisions"
                                                />
                                            </Grid>
                                            <Grid item xs={12}>
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    rows={3}
                                                    label="Résultat / Dispositif"
                                                    value={formData.decision_resultat}
                                                    onChange={(e) => setFormData({ ...formData, decision_resultat: e.target.value })}
                                                />
                                            </Grid>
                                            <Grid item xs={12}>
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    rows={2}
                                                    label="Observations (Décision)"
                                                    value={formData.decision_observations}
                                                    onChange={(e) => setFormData({ ...formData, decision_observations: e.target.value })}
                                                />
                                            </Grid>
                                        </Grid>
                                    </AccordionDetails>
                                </Accordion>
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions><Button onClick={handleCloseDialog}>Annuler</Button><Button onClick={handleSubmit} variant="contained">Enregistrer</Button></DialogActions>
            </Dialog>

            <DeleteConfirmDialog open={deleteDialog} onClose={() => setDeleteDialog(false)} onConfirm={handleConfirmDelete} title="cette audience" itemName={audienceToDelete?.title} />
        </Box>
    );
}

export default Audiences;
