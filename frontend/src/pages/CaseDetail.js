import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths,
    subMonths, isSameMonth, isToday, parseISO
} from 'date-fns';
import { fr } from 'date-fns/locale';
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
    alpha,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    ToggleButton,
    ToggleButtonGroup
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
    CloudUpload as UploadIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Balance as BalanceIcon,
    History as HistoryIcon,
    CalendarMonth as CalendarIcon,
    List as ListIcon,
    Circle as CircleIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { casesAPI, documentsAPI, deadlinesAPI, decisionsAPI, agendaAPI } from '../services/api';
import authService from '../services/authService';
import DiligenceManager from '../components/DiligenceManager';

const CHAMBRE_COLORS = {
    CA_CORRECTIONNEL: { label: 'CA Correctionnel', color: '#2196f3', icon: '⚖️' },
    CA_CRIMINELLE: { label: 'CA Criminelle', color: '#f44336', icon: '🔴' },
    CA_SOCIAL: { label: 'CA Social', color: '#4caf50', icon: '🤝' },
    TRIBUNAL_TRAVAIL: { label: 'Tribunal Travail', color: '#ff9800', icon: '👷' },
    FDTR: { label: 'FDTR', color: '#9c27b0', icon: '📋' },
    TRIBUNAL_COMMERCE: { label: 'Tribunal de Commerce', color: '#00bcd4', icon: '💼' },
    TRIBUNAL_INSTANCE: { label: "Tribunal d'Instance", color: '#795548', icon: '🏛️' },
    TRIBUNAL_GRANDE_INSTANCE: { label: 'TGI', color: '#3f51b5', icon: '🏛️' },
    COUR_SUPREME: { label: 'Cour Suprême', color: '#b71c1c', icon: '👨‍⚖️' },
    AUTRE: { label: 'Autre', color: '#607d8b', icon: '📌' },
};

const STATUT_CONFIG = {
    PREVU: { label: 'Prévu', color: '#2196f3', icon: '📅' },
    REPORTE: { label: 'Reporté', color: '#ff9800', icon: '🔄' },
    TERMINE: { label: 'Terminé', color: '#4caf50', icon: '✅' },
    ANNULE: { label: 'Annulé', color: '#f44336', icon: '❌' },
};

const CaseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [caseData, setCaseData] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [hearings, setHearings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Decisions state
    const [decisions, setDecisions] = useState([]);
    const [decisionDialog, setDecisionDialog] = useState(false);
    const [editingDecision, setEditingDecision] = useState(null);
    const [decisionForm, setDecisionForm] = useState({
        decision_type: 'INSTANCE',
        date_decision: '',
        juridiction: '',
        numero_decision: '',
        resultat: '',
        observations: ''
    });

    // Agenda Section state
    const [agendaViewMode, setAgendaViewMode] = useState('list');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    const [historyData, setHistoryData] = useState(null);

    const currentUser = authService.getCurrentUser();
    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.is_staff || false;

    const loadCaseData = useCallback(async () => {
        try {
            setLoading(true);
            const [caseRes, docsRes, hearingsRes] = await Promise.all([
                casesAPI.getOne(id),
                documentsAPI.getAll({ case: id }),
                agendaAPI.getAll({ case: id })
            ]);
            setCaseData(caseRes.data);
            setDocuments(Array.isArray(docsRes.data.results) ? docsRes.data.results : (Array.isArray(docsRes.data) ? docsRes.data : []));
            setHearings(Array.isArray(hearingsRes.data.results) ? hearingsRes.data.results : (Array.isArray(hearingsRes.data) ? hearingsRes.data : []));
            // Les décisions sont incluses dans le detail du dossier
            setDecisions(caseRes.data.decisions || []);
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

    // Decision handlers
    const handleOpenDecisionDialog = (decision = null) => {
        if (decision) {
            setEditingDecision(decision);
            setDecisionForm({
                decision_type: decision.decision_type,
                date_decision: decision.date_decision || '',
                juridiction: decision.juridiction || '',
                numero_decision: decision.numero_decision || '',
                resultat: decision.resultat || '',
                observations: decision.observations || ''
            });
        } else {
            setEditingDecision(null);
            setDecisionForm({
                decision_type: 'INSTANCE',
                date_decision: '',
                juridiction: '',
                numero_decision: '',
                resultat: '',
                observations: ''
            });
        }
        setDecisionDialog(true);
    };

    const handleSaveDecision = async () => {
        try {
            const data = {
                ...decisionForm,
                case: parseInt(id),
                date_decision: decisionForm.date_decision || null
            };
            if (editingDecision) {
                await decisionsAPI.update(editingDecision.id, data);
            } else {
                await decisionsAPI.create(data);
            }
            setDecisionDialog(false);
            loadCaseData();
        } catch (error) {
            console.error('Erreur sauvegarde décision:', error);
            alert('Erreur lors de la sauvegarde de la décision. Vérifiez les champs et réessayez.');
        }
    };

    const handleDeleteDecision = async (decisionId) => {
        if (!window.confirm('Voulez-vous vraiment supprimer cette décision ?')) return;
        try {
            await decisionsAPI.delete(decisionId);
            loadCaseData();
        } catch (error) {
            console.error('Erreur suppression décision:', error);
            alert('Erreur lors de la suppression.');
        }
    };

    const handleOpenHistory = async () => {
        if (!caseData?.reference) return;
        try {
            const res = await agendaAPI.historiqueDossier({ dossier_numero: caseData.reference });
            setHistoryData(res.data);
            setHistoryDialogOpen(true);
        } catch (err) {
            console.error('Erreur chargement historique:', err);
        }
    };


    // Grouper les décisions par type
    const instanceDecisions = decisions.filter(d => d.decision_type === 'INSTANCE');
    const appelDecisions = decisions.filter(d => d.decision_type === 'APPEL');
    const pourvoiDecisions = decisions.filter(d => d.decision_type === 'POURVOI');
    const maxRows = Math.max(instanceDecisions.length, appelDecisions.length, pourvoiDecisions.length, 1);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!caseData) return null;

    const renderDecisionCell = (decision) => {
        if (!decision) return (
            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>—</Typography>
        );
        return (
            <Box sx={{ position: 'relative', '&:hover .decision-actions': { opacity: 1 } }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {decision.juridiction || 'Juridiction non définie'}
                </Typography>
                {decision.date_decision && (
                    <Typography variant="caption" color="text.secondary" display="block">
                        {new Date(decision.date_decision).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Typography>
                )}
                {decision.numero_decision && (
                    <Typography variant="caption" color="text.secondary" display="block">
                        N° {decision.numero_decision}
                    </Typography>
                )}
                {decision.resultat && (
                    <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600, display: 'block', mt: 0.5 }}>
                        {decision.resultat}
                    </Typography>
                )}
                {decision.observations && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                        {decision.observations}
                    </Typography>
                )}
                <Box
                    className="decision-actions"
                    sx={{
                        position: 'absolute', top: 0, right: 0,
                        opacity: 0, transition: 'opacity 0.2s',
                        display: 'flex', gap: 0.5
                    }}
                >
                    <Tooltip title="Modifier">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenDecisionDialog(decision); }}>
                            <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer">
                        <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDeleteDecision(decision.id); }}>
                            <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
        );
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            {/* Fil d'ariane & Navigation */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 1 }}>
                        <Link underline="hover" color="inherit" onClick={() => navigate('/cases')} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <FolderIcon sx={{ mr: 0.5, color: ['CIVIL', 'COMMERCIAL', 'SOCIAL'].includes(caseData.category) ? '#facc15' : '#1d4ed8' }} fontSize="inherit" />
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
                                                    bgcolor: ['CIVIL', 'COMMERCIAL', 'SOCIAL'].includes(caseData.category) ? '#fefce8' : '#eff6ff',
                                                    color: ['CIVIL', 'COMMERCIAL', 'SOCIAL'].includes(caseData.category) ? '#a16207' : '#1d4ed8',
                                                    fontWeight: 700,
                                                    border: '1px solid',
                                                    borderColor: ['CIVIL', 'COMMERCIAL', 'SOCIAL'].includes(caseData.category) ? '#facc15' : '#3b82f6'
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

                        {/* Agenda du Dossier */}
                        <Grid item xs={12}>
                            <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <GavelIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 800 }}>Agenda du Dossier</Typography>
                                            <Typography variant="caption" color="text.secondary">Gestion des audiences et procédures</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ToggleButtonGroup
                                            size="small"
                                            value={agendaViewMode}
                                            exclusive
                                            onChange={(e, v) => v && setAgendaViewMode(v)}
                                            sx={{ mr: 1, '& .MuiToggleButton-root': { py: 0.5, px: 1.5 } }}
                                        >
                                            <ToggleButton value="list">
                                                <ListIcon sx={{ mr: 0.5, fontSize: 18 }} /> Liste
                                            </ToggleButton>
                                            <ToggleButton value="calendar">
                                                <CalendarIcon sx={{ mr: 0.5, fontSize: 18 }} /> Calendrier
                                            </ToggleButton>
                                        </ToggleButtonGroup>
                                        <Tooltip title="Historique">
                                            <IconButton size="small" onClick={handleOpenHistory}>
                                                <HistoryIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            startIcon={<AddIcon />}
                                            onClick={() => navigate(`/agenda?caseId=${id}`)}
                                            sx={{ borderRadius: 2, fontWeight: 700 }}
                                        >
                                            Gérer
                                        </Button>
                                    </Box>
                                </Box>

                                {agendaViewMode === 'list' ? (
                                    <Box>
                                        {hearings.length > 0 ? (
                                            <List disablePadding>
                                                {[...hearings].sort((a, b) => new Date(a.date_audience) - new Date(b.date_audience)).map((hearing) => {
                                                    const isPast = new Date(hearing.date_audience) < new Date().setHours(0, 0, 0, 0);
                                                    const cfg = CHAMBRE_COLORS[hearing.type_chambre] || CHAMBRE_COLORS.AUTRE;
                                                    const statCfg = STATUT_CONFIG[hearing.statut] || STATUT_CONFIG.PREVU;

                                                    return (
                                                        <ListItem
                                                            key={hearing.id}
                                                            divider
                                                            sx={{
                                                                px: 0,
                                                                py: 2,
                                                                opacity: isPast && hearing.statut !== 'TERMINE' ? 0.7 : 1
                                                            }}
                                                        >
                                                            <ListItemIcon sx={{ minWidth: 45 }}>
                                                                <Box sx={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    alignItems: 'center',
                                                                    bgcolor: alpha(cfg.color, 0.1),
                                                                    borderRadius: 2,
                                                                    p: 1,
                                                                    minWidth: 45,
                                                                    border: '1px solid',
                                                                    borderColor: alpha(cfg.color, 0.2)
                                                                }}>
                                                                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: cfg.color, textTransform: 'uppercase' }}>
                                                                        {format(parseISO(hearing.date_audience), 'MMM', { locale: fr })}
                                                                    </Typography>
                                                                    <Typography sx={{ fontSize: '1.1rem', fontWeight: 900, color: cfg.color, lineHeight: 1 }}>
                                                                        {format(parseISO(hearing.date_audience), 'dd')}
                                                                    </Typography>
                                                                </Box>
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                sx={{ ml: 2 }}
                                                                primary={
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                                        <Typography variant="subtitle2" fontWeight={800} sx={{ color: 'text.primary' }}>
                                                                            {hearing.title}
                                                                        </Typography>
                                                                        <Chip
                                                                            label={hearing.heure_audience.slice(0, 5)}
                                                                            size="small"
                                                                            variant="outlined"
                                                                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                                                                        />
                                                                    </Box>
                                                                }
                                                                secondary={
                                                                    <Box>
                                                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                            <CircleIcon sx={{ fontSize: 8, color: cfg.color }} />
                                                                            {cfg.label} {hearing.location ? ` • ${hearing.location}` : ''}
                                                                        </Typography>
                                                                        {hearing.notes && (
                                                                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic', opacity: 0.8 }}>
                                                                                "{hearing.notes}"
                                                                            </Typography>
                                                                        )}
                                                                    </Box>
                                                                }
                                                            />
                                                            <Box sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
                                                                <Chip
                                                                    label={statCfg.label}
                                                                    color={hearing.statut === 'TERMINE' ? "success" : (hearing.statut === 'REPORTE' ? "warning" : "primary")}
                                                                    size="small"
                                                                    variant={hearing.statut === 'ANNULE' ? 'outlined' : 'filled'}
                                                                    sx={{ fontWeight: 800, fontSize: '0.65rem', height: 22 }}
                                                                />
                                                                {isPast && hearing.statut === 'PREVU' && (
                                                                    <Typography variant="caption" color="error.main" sx={{ fontWeight: 700, fontSize: '0.6rem' }}>
                                                                        En retard
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        </ListItem>
                                                    );
                                                })}
                                            </List>
                                        ) : (
                                            <Box sx={{ textAlign: 'center', py: 5, opacity: 0.6 }}>
                                                <CalendarIcon sx={{ fontSize: 48, mb: 1, color: 'text.disabled' }} />
                                                <Typography variant="body2">Aucun événement programmé pour ce dossier.</Typography>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{ mt: 2, borderRadius: 2 }}
                                                    onClick={() => navigate(`/agenda?caseId=${id}`)}
                                                >
                                                    Ajouter une audience
                                                </Button>
                                            </Box>
                                        )}
                                    </Box>
                                ) : (
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
                                            <IconButton size="small" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeftIcon /></IconButton>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, minWidth: 120, textAlign: 'center', textTransform: 'capitalize' }}>
                                                {format(currentMonth, 'MMMM yyyy', { locale: fr })}
                                            </Typography>
                                            <IconButton size="small" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRightIcon /></IconButton>
                                        </Box>

                                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                                            {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map(d => (
                                                <Typography key={d} variant="caption" sx={{ textAlign: 'center', fontWeight: 700, p: 0.5, color: 'text.secondary' }}>{d}</Typography>
                                            ))}
                                            {(() => {
                                                const monthStart = startOfMonth(currentMonth);
                                                const monthEnd = endOfMonth(currentMonth);
                                                const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
                                                const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
                                                const days = [];
                                                let d = calStart;
                                                while (d <= calEnd) {
                                                    const dayEvents = hearings.filter(h => h.date_audience === format(d, 'yyyy-MM-dd'));
                                                    const isCurrentMonth = isSameMonth(d, monthStart);
                                                    const active = isToday(d);
                                                    days.push(
                                                        <Box
                                                            key={d.toISOString()}
                                                            sx={{
                                                                aspectRatio: '1/1',
                                                                border: '1px solid',
                                                                borderColor: active ? 'primary.main' : 'divider',
                                                                borderRadius: 1,
                                                                p: 0.5,
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                bgcolor: active ? alpha('#6366f1', 0.1) : (isCurrentMonth ? 'transparent' : alpha('#000', 0.03)),
                                                                opacity: isCurrentMonth ? 1 : 0.4,
                                                                cursor: 'pointer',
                                                                '&:hover': { bgcolor: alpha('#6366f1', 0.05) }
                                                            }}
                                                            onClick={() => dayEvents.length > 0 && setAgendaViewMode('list')}
                                                        >
                                                            <Typography sx={{ fontSize: '0.7rem', fontWeight: active ? 800 : 500 }}>
                                                                {format(d, 'd')}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', gap: 0.3, flexWrap: 'wrap', justifyContent: 'center', mt: 0.3 }}>
                                                                {dayEvents.slice(0, 3).map(ev => (
                                                                    <Box
                                                                        key={ev.id}
                                                                        sx={{
                                                                            width: 4, height: 4,
                                                                            borderRadius: '50%',
                                                                            bgcolor: (CHAMBRE_COLORS[ev.type_chambre] || CHAMBRE_COLORS.AUTRE).color
                                                                        }}
                                                                    />
                                                                ))}
                                                            </Box>
                                                        </Box>
                                                    );
                                                    d = addDays(d, 1);
                                                }
                                                return days;
                                            })()}
                                        </Box>
                                    </Box>
                                )}
                            </Paper>
                        </Grid>

                        {/* ===== DECISIONS ===== */}
                        <Grid item xs={12}>
                            <Paper sx={{
                                p: 3,
                                borderRadius: 4,
                                border: '2px solid',
                                borderColor: 'primary.main',
                                bgcolor: alpha('#6366f1', 0.06),
                                boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 4px 20px rgba(99,102,241,0.15)' : 'none'
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <BalanceIcon sx={{ color: 'primary.main' }} />
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                            Décisions
                                        </Typography>
                                        <Chip
                                            label={`N° ${caseData.reference}`}
                                            size="small"
                                            sx={{
                                                fontWeight: 700,
                                                bgcolor: alpha('#6366f1', 0.1),
                                                color: 'primary.main'
                                            }}
                                        />
                                    </Box>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={() => handleOpenDecisionDialog()}
                                        sx={{
                                            fontWeight: 700,
                                            bgcolor: 'primary.main',
                                            color: 'primary.contrastText',
                                            '&:hover': { bgcolor: 'primary.dark', transform: 'scale(1.03)' },
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        + Ajouter une décision
                                    </Button>
                                </Box>

                                <TableContainer>
                                    <Table size="small" sx={{
                                        '& .MuiTableCell-head': {
                                            fontWeight: 800,
                                            fontSize: '0.85rem',
                                            borderBottom: '2px solid',
                                            borderColor: 'divider',
                                            py: 1.5
                                        },
                                        '& .MuiTableCell-body': {
                                            verticalAlign: 'top',
                                            py: 1.5,
                                            borderRight: '1px solid',
                                            borderRightColor: 'divider',
                                            '&:last-child': { borderRight: 'none' }
                                        }
                                    }}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ width: '33%', bgcolor: alpha('#2196f3', 0.06) }}>Instance</TableCell>
                                                <TableCell sx={{ width: '33%', bgcolor: alpha('#ff9800', 0.06) }}>Appel</TableCell>
                                                <TableCell sx={{ width: '33%', bgcolor: alpha('#f44336', 0.06) }}>Pourvoi</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {decisions.length > 0 ? (
                                                Array.from({ length: maxRows }).map((_, rowIndex) => (
                                                    <TableRow key={rowIndex} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                        <TableCell>{renderDecisionCell(instanceDecisions[rowIndex])}</TableCell>
                                                        <TableCell>{renderDecisionCell(appelDecisions[rowIndex])}</TableCell>
                                                        <TableCell>{renderDecisionCell(pourvoiDecisions[rowIndex])}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                                                        <BalanceIcon sx={{ fontSize: 40, mb: 1, display: 'block', mx: 'auto', color: 'primary.main', opacity: 0.5 }} />
                                                        <Typography variant="body2" sx={{ mb: 1.5, color: 'text.secondary' }}>Aucune décision enregistrée.</Typography>
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            startIcon={<AddIcon />}
                                                            onClick={() => handleOpenDecisionDialog()}
                                                            sx={{ fontWeight: 700 }}
                                                        >
                                                            Ajouter une première décision
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
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

                        {/* Sous-dossiers */}
                        <Grid item xs={12}>
                            <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                                        <FolderIcon sx={{ mr: 1, color: 'info.main' }} /> Sous-dossiers
                                    </Typography>
                                    {!caseData.parent_case && (
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<AddIcon />}
                                            onClick={() => navigate(`/cases?parentId=${id}&new=true`)}
                                        >
                                            Ajouter un sous-dossier
                                        </Button>
                                    )}
                                </Box>

                                {caseData.sub_cases && caseData.sub_cases.length > 0 ? (
                                    <List disablePadding>
                                        {caseData.sub_cases.map((subCase) => (
                                            <ListItem
                                                key={subCase.id}
                                                divider
                                                sx={{
                                                    px: 2,
                                                    borderRadius: 2,
                                                    mb: 1,
                                                    cursor: 'pointer',
                                                    '&:hover': { bgcolor: 'action.hover' }
                                                }}
                                                onClick={() => navigate(`/cases/${subCase.id}`)}
                                            >
                                                <ListItemIcon sx={{ minWidth: 40 }}>
                                                    <FolderIcon sx={{ color: 'text.disabled' }} />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={subCase.title || subCase.reference}
                                                    secondary={`Réf: ${subCase.reference} • ${subCase.category}`}
                                                    primaryTypographyProps={{ fontWeight: 700 }}
                                                />
                                                <Chip
                                                    label={subCase.status}
                                                    size="small"
                                                    color={subCase.status === 'OUVERT' ? 'success' : 'default'}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Box sx={{ textAlign: 'center', py: 3, opacity: 0.7 }}>
                                        <Typography variant="body2">
                                            {caseData.parent_case
                                                ? "Ceci est un sous-dossier."
                                                : "Aucun sous-dossier pour le moment."}
                                        </Typography>
                                    </Box>
                                )}
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
                            <Button fullWidth variant="outlined" startIcon={<EventIcon />} onClick={() => navigate(`/deadlines?caseId=${id}&new=true`)}>
                                Gérer les échéances
                            </Button>
                        </Paper>
                    </Box>
                </Grid>
            </Grid>

            {/* Dialog Ajouter/Modifier Décision */}
            <Dialog
                open={decisionDialog}
                onClose={() => setDecisionDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <BalanceIcon />
                    {editingDecision ? 'Modifier la décision' : 'Nouvelle décision'}
                    <Chip
                        label={caseData?.reference}
                        size="small"
                        sx={{ ml: 'auto', bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700 }}
                    />
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2.5} sx={{ mt: 0 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Type de décision"
                                select
                                fullWidth
                                required
                                value={decisionForm.decision_type}
                                onChange={(e) => setDecisionForm({ ...decisionForm, decision_type: e.target.value })}
                            >
                                <MenuItem value="INSTANCE">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#2196f3' }} />
                                        Instance
                                    </Box>
                                </MenuItem>
                                <MenuItem value="APPEL">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ff9800' }} />
                                        Appel
                                    </Box>
                                </MenuItem>
                                <MenuItem value="POURVOI">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#f44336' }} />
                                        Pourvoi
                                    </Box>
                                </MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Date de la décision"
                                type="date"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={decisionForm.date_decision}
                                onChange={(e) => setDecisionForm({ ...decisionForm, date_decision: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Juridiction"
                                fullWidth
                                value={decisionForm.juridiction}
                                onChange={(e) => setDecisionForm({ ...decisionForm, juridiction: e.target.value })}
                                placeholder="Ex: Tribunal de Grande Instance"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Numéro de la décision"
                                fullWidth
                                value={decisionForm.numero_decision}
                                onChange={(e) => setDecisionForm({ ...decisionForm, numero_decision: e.target.value })}
                                placeholder="Ex: 2024/0123"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Résultat / Dispositif"
                                fullWidth
                                multiline
                                rows={2}
                                value={decisionForm.resultat}
                                onChange={(e) => setDecisionForm({ ...decisionForm, resultat: e.target.value })}
                                placeholder="Ex: Condamnation, Relaxe, Rejet..."
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Observations"
                                fullWidth
                                multiline
                                rows={2}
                                value={decisionForm.observations}
                                onChange={(e) => setDecisionForm({ ...decisionForm, observations: e.target.value })}
                                placeholder="Notes et observations complémentaires"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDecisionDialog(false)}>
                        Annuler
                    </Button>
                    <Button onClick={handleSaveDecision} variant="contained">
                        {editingDecision ? 'Mettre à jour' : 'Enregistrer'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog Historique Agenda */}
            <Dialog
                open={historyDialogOpen}
                onClose={() => setHistoryDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HistoryIcon color="primary" />
                    Historique de l'Agenda du Dossier {historyData?.dossier_numero}
                    <IconButton size="small" onClick={() => setHistoryDialogOpen(false)} sx={{ ml: 'auto' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {historyData && (
                        <Box>
                            <Typography sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CalendarIcon fontSize="small" /> Audiences ({historyData.entries?.length || 0})
                            </Typography>
                            {historyData.entries?.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {[...historyData.entries].sort((a, b) => new Date(b.date_audience) - new Date(a.date_audience)).map(entry => {
                                        const cfg = CHAMBRE_COLORS[entry.type_chambre] || CHAMBRE_COLORS.AUTRE;
                                        const statCfg = STATUT_CONFIG[entry.statut] || STATUT_CONFIG.PREVU;
                                        return (
                                            <Paper key={entry.id} variant="outlined" sx={{
                                                p: 2,
                                                borderLeft: `4px solid ${statCfg.color}`,
                                                bgcolor: alpha(statCfg.color, 0.02)
                                            }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Box>
                                                        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem' }}>
                                                            {format(parseISO(entry.date_audience), 'eeee d MMMM yyyy', { locale: fr })}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            {entry.heure_audience?.substring(0, 5)} — {cfg.label}
                                                        </Typography>
                                                        {entry.motif_report && (
                                                            <Typography variant="caption" sx={{ color: '#ff9800', fontWeight: 700, mt: 0.5, display: 'block' }}>
                                                                Motif du report : {entry.motif_report}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    <Chip
                                                        label={statCfg.label}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: alpha(statCfg.color, 0.1),
                                                            color: statCfg.color,
                                                            fontWeight: 800,
                                                            fontSize: '0.6rem'
                                                        }}
                                                    />
                                                </Box>
                                            </Paper>
                                        );
                                    })}
                                </Box>
                            ) : (
                                <Typography variant="body2" sx={{ textAlign: 'center', py: 2, opacity: 0.6 }}>
                                    Aucun historique d'audiences disponible.
                                </Typography>
                            )}

                            <Typography sx={{ fontWeight: 800, mb: 1, mt: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <HistoryIcon fontSize="small" /> Journal des modifications
                            </Typography>
                            <Box sx={{ bgcolor: alpha('#000', 0.02), borderRadius: 2, p: 1 }}>
                                {historyData.history?.length > 0 ? (
                                    historyData.history.map((h, idx) => (
                                        <Box key={h.id} sx={{
                                            display: 'flex',
                                            gap: 2,
                                            py: 1,
                                            px: 1,
                                            borderBottom: idx === historyData.history.length - 1 ? 'none' : '1px solid',
                                            borderColor: 'divider',
                                            alignItems: 'center'
                                        }}>
                                            <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', minWidth: 100, fontWeight: 700 }}>
                                                {h.date_action && format(parseISO(h.date_action), 'dd/MM/yy HH:mm')}
                                            </Typography>
                                            <Chip label={h.type_action_display} size="small" sx={{ fontSize: '0.6rem', height: 18, fontWeight: 700 }} />
                                            <Typography sx={{ fontSize: '0.75rem', flex: 1, fontWeight: 500 }}>{h.commentaire}</Typography>
                                            <Typography sx={{ fontSize: '0.7rem', color: 'primary.main', fontWeight: 700 }}>{h.utilisateur_name}</Typography>
                                        </Box>
                                    ))
                                ) : (
                                    <Typography variant="caption" sx={{ textAlign: 'center', display: 'block', py: 1, opacity: 0.5 }}>
                                        Aucune modification enregistrée dans le journal.
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setHistoryDialogOpen(false)} variant="contained" size="small">Fermer</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CaseDetail;
