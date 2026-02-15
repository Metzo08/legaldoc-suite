import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Box, Typography, Paper, Button, IconButton, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, MenuItem, Chip, Tooltip, Badge, Grid,
    ToggleButton, ToggleButtonGroup, Select, FormControl, InputLabel,
    Alert, useTheme, alpha, Card, CardContent, Snackbar, InputAdornment,
    LinearProgress
} from '@mui/material';
import {
    ChevronLeft, ChevronRight, Today as TodayIcon, Add as AddIcon,
    CalendarMonth as CalendarIcon, ViewWeek as WeekIcon, ViewDay as DayIcon,
    AccessTime as TimeIcon, LocationOn as LocationIcon,
    Delete as DeleteIcon, Edit as EditIcon, Circle as CircleIcon,
    Search as SearchIcon, Gavel as GavelIcon, EventRepeat as ReportIcon,
    CheckCircle as CheckIcon, Cancel as CancelIcon, History as HistoryIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import {
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths,
    subMonths, addWeeks, subWeeks, isSameMonth, isToday, parseISO,
    getYear, setYear
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { agendaAPI, casesAPI } from '../services/api';

// ═══════ CONFIG ═══════
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

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8h-18h

const emptyForm = {
    title: '', event_type: 'AUDIENCE', type_chambre: 'CA_CORRECTIONNEL', type_chambre_autre: '',
    dossier_numero: '', dossier_nom: '', date_audience: '', heure_audience: '09:00',
    case: '', notes: '', location: '', color: '#2196f3', statut: 'PREVU'
};

function Agenda() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // ── State ──
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedYear, setSelectedYear] = useState(getYear(new Date()));
    const [viewMode, setViewMode] = useState('month');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cases, setCases] = useState([]);
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

    // Dialogs
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [formData, setFormData] = useState({ ...emptyForm });
    const [selectedDay, setSelectedDay] = useState(null);
    const [dayDialogOpen, setDayDialogOpen] = useState(false);
    const [reportDialogOpen, setReportDialogOpen] = useState(false);
    const [reportTarget, setReportTarget] = useState(null);
    const [reportForm, setReportForm] = useState({ nouvelle_date: '', nouvelle_heure: '09:00', motif: '', notes: '' });
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    const [historyData, setHistoryData] = useState(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [chambreFilter, setChambreFilter] = useState('ALL');
    const [statutFilter, setStatutFilter] = useState('ALL');
    const [searchParams] = useSearchParams();

    const currentYear = getYear(new Date());
    const years = useMemo(() => {
        const arr = [];
        for (let y = currentYear + 1; y >= currentYear - 5; y--) arr.push(y);
        return arr;
    }, [currentYear]);

    const showNotif = (message, severity = 'success') => setSnack({ open: true, message, severity });

    // ── Data Loading ──
    const loadEvents = useCallback(async () => {
        setLoading(true);
        try {
            const month = format(currentDate, 'M');
            const params = { year: selectedYear, month };
            if (searchQuery) params.search = searchQuery;
            if (chambreFilter !== 'ALL') params.type_chambre = chambreFilter;
            if (statutFilter !== 'ALL') params.statut = statutFilter;
            const res = await agendaAPI.getAll(params);
            const data = res.data?.results || res.data || [];
            setEvents(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Erreur chargement agenda:', err);
        } finally {
            setLoading(false);
        }
    }, [currentDate, selectedYear, searchQuery, chambreFilter, statutFilter]);

    const loadCases = useCallback(async () => {
        try {
            const res = await casesAPI.getAll({ page_size: 500 });
            setCases(res.data?.results || res.data || []);
        } catch (err) { console.error(err); }
    }, []);

    useEffect(() => { loadEvents(); }, [loadEvents]);
    useEffect(() => { loadCases(); }, [loadCases]);

    useEffect(() => {
        const caseId = searchParams.get('caseId');
        if (caseId && cases.length > 0) {
            const foundCase = cases.find(c => c.id === parseInt(caseId));
            if (foundCase) {
                setFormData(p => ({
                    ...p,
                    case: foundCase.id,
                    dossier_numero: foundCase.reference,
                    dossier_nom: foundCase.title
                }));
                setDialogOpen(true);
            }
        }
    }, [searchParams, cases]);

    // ── Navigation ──
    const goToday = () => { setCurrentDate(new Date()); setSelectedYear(currentYear); };
    const navigate = (dir) => {
        if (viewMode === 'month') setCurrentDate(prev => dir > 0 ? addMonths(prev, 1) : subMonths(prev, 1));
        else if (viewMode === 'week') setCurrentDate(prev => dir > 0 ? addWeeks(prev, 1) : subWeeks(prev, 1));
        else setCurrentDate(prev => addDays(prev, dir));
    };
    const handleYearChange = (yr) => { setSelectedYear(yr); setCurrentDate(setYear(currentDate, yr)); };

    // ── Events for day ──
    const getEventsForDay = (day) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        return events.filter(ev => ev.date_audience === dayStr);
    };

    // ── Calendar Grid ──
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        const days = []; let d = calStart;
        while (d <= calEnd) { days.push(d); d = addDays(d, 1); }
        return days;
    }, [currentDate]);

    const weekDays = useMemo(() => {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    }, [currentDate]);

    // ── CRUD Handlers ──
    const openCreateDialog = (day) => {
        const dateStr = format(day || new Date(), 'yyyy-MM-dd');
        setEditingEvent(null);
        setFormData({ ...emptyForm, date_audience: dateStr });
        setDialogOpen(true);
    };

    const openEditDialog = (ev) => {
        setEditingEvent(ev);
        setFormData({
            title: ev.title || '', event_type: ev.event_type || 'AUDIENCE',
            type_chambre: ev.type_chambre || 'AUTRE', type_chambre_autre: ev.type_chambre_autre || '',
            dossier_numero: ev.dossier_numero || '', dossier_nom: ev.dossier_nom || '',
            date_audience: ev.date_audience || '', heure_audience: ev.heure_audience?.substring(0, 5) || '09:00',
            case: ev.case || '', notes: ev.notes || '', location: ev.location || '',
            color: ev.color || '#2196f3', statut: ev.statut || 'PREVU'
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload = { ...formData, case: formData.case || null };
            if (editingEvent) {
                await agendaAPI.update(editingEvent.id, payload);
                showNotif('Audience modifiée avec succès');
            } else {
                await agendaAPI.create(payload);
                showNotif('Audience créée avec succès');
            }
            setDialogOpen(false);
            loadEvents();
        } catch (err) {
            const detail = err.response?.data;
            showNotif(detail ? JSON.stringify(detail) : 'Erreur lors de la sauvegarde', 'error');
        }
    };

    const handleDelete = async (ev) => {
        if (!window.confirm(`Supprimer l'audience "${ev.dossier_numero || ev.title}" ?`)) return;
        try {
            await agendaAPI.delete(ev.id);
            showNotif('Audience supprimée');
            loadEvents();
            setDayDialogOpen(false);
        } catch (err) { showNotif('Erreur lors de la suppression', 'error'); }
    };

    // ── Report Handler ──
    const openReportDialog = (ev) => {
        setReportTarget(ev);
        setReportForm({ nouvelle_date: '', nouvelle_heure: '09:00', motif: '', notes: '' });
        setReportDialogOpen(true);
    };

    const handleReport = async () => {
        if (!reportForm.nouvelle_date) { showNotif('La nouvelle date est obligatoire', 'error'); return; }
        try {
            await agendaAPI.reporter(reportTarget.id, reportForm);
            showNotif(`Audience reportée au ${reportForm.nouvelle_date}`);
            setReportDialogOpen(false);
            setDayDialogOpen(false);
            loadEvents();
        } catch (err) { showNotif('Erreur lors du report', 'error'); }
    };

    // ── Status Handlers ──
    const handleTerminer = async (ev) => {
        try {
            await agendaAPI.terminer(ev.id);
            showNotif('Audience marquée comme terminée');
            loadEvents(); setDayDialogOpen(false);
        } catch (err) { showNotif('Erreur', 'error'); }
    };

    const handleAnnuler = async (ev) => {
        if (!window.confirm('Annuler cette audience ?')) return;
        try {
            await agendaAPI.annuler(ev.id, {});
            showNotif('Audience annulée');
            loadEvents(); setDayDialogOpen(false);
        } catch (err) { showNotif('Erreur', 'error'); }
    };

    // ── History ──
    const openHistory = async (dossierNumero) => {
        try {
            const res = await agendaAPI.historiqueDossier({ dossier_numero: dossierNumero });
            setHistoryData(res.data);
            setHistoryDialogOpen(true);
        } catch (err) { showNotif('Erreur chargement historique', 'error'); }
    };

    // ── Stats ──
    const stats = useMemo(() => {
        const s = { total: events.length, prevu: 0, reporte: 0, termine: 0, annule: 0 };
        events.forEach(e => {
            if (e.statut === 'PREVU') s.prevu++;
            else if (e.statut === 'REPORTE') s.reporte++;
            else if (e.statut === 'TERMINE') s.termine++;
            else if (e.statut === 'ANNULE') s.annule++;
        });
        return s;
    }, [events]);

    // ═══════ EVENT CHIP ═══════
    const EventChip = ({ ev, compact }) => {
        const cfg = CHAMBRE_COLORS[ev.type_chambre] || CHAMBRE_COLORS.AUTRE;
        const statCfg = STATUT_CONFIG[ev.statut] || STATUT_CONFIG.PREVU;
        return (
            <Tooltip title={
                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{ev.dossier_numero || ev.title}</Typography>
                    <Typography variant="caption" display="block">{cfg.icon} {cfg.label}</Typography>
                    {ev.dossier_nom && <Typography variant="caption" display="block">👥 {ev.dossier_nom}</Typography>}
                    <Typography variant="caption" display="block">🕐 {ev.heure_audience?.substring(0, 5)} · {statCfg.icon} {statCfg.label}</Typography>
                </Box>
            } arrow>
                <Box
                    onClick={(e) => { e.stopPropagation(); setSelectedDay(parseISO(ev.date_audience)); setDayDialogOpen(true); }}
                    sx={{
                        display: 'flex', alignItems: 'center', gap: 0.5,
                        px: 0.8, py: 0.2, mb: 0.3, borderRadius: '6px',
                        bgcolor: alpha(cfg.color, isDark ? 0.25 : 0.15),
                        borderLeft: `3px solid ${cfg.color}`,
                        cursor: 'pointer', transition: 'all 0.15s', overflow: 'hidden',
                        opacity: ev.statut === 'ANNULE' ? 0.5 : ev.statut === 'REPORTE' ? 0.7 : 1,
                        textDecoration: ev.statut === 'ANNULE' ? 'line-through' : 'none',
                        '&:hover': { bgcolor: alpha(cfg.color, isDark ? 0.4 : 0.25), transform: 'scale(1.02)' },
                    }}
                >
                    <Typography sx={{ fontSize: '0.65rem', lineHeight: 1 }}>{cfg.icon}</Typography>
                    <Typography noWrap sx={{
                        fontSize: compact ? '0.65rem' : '0.7rem', fontWeight: 600,
                        color: isDark ? alpha(cfg.color, 1) : cfg.color, lineHeight: 1.3,
                    }}>
                        {compact && ev.heure_audience ? ev.heure_audience.substring(0, 5) + ' ' : ''}{ev.dossier_numero || ev.title}
                    </Typography>
                    {ev.statut === 'REPORTE' && <Typography sx={{ fontSize: '0.55rem' }}>🔄</Typography>}
                    {ev.statut === 'TERMINE' && <Typography sx={{ fontSize: '0.55rem' }}>✅</Typography>}
                </Box>
            </Tooltip>
        );
    };

    // ═══════ MONTH VIEW ═══════
    const MonthView = () => (
        <Box sx={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
            borderRadius: 3, overflow: 'hidden',
        }}>
            {DAYS_FR.map(d => (
                <Box key={d} sx={{
                    py: 1.2, textAlign: 'center', fontWeight: 700, fontSize: '0.8rem',
                    bgcolor: isDark ? alpha('#6366f1', 0.15) : alpha('#6366f1', 0.08),
                    color: isDark ? '#a5b4fc' : '#4338ca',
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                }}>{d}</Box>
            ))}
            {calendarDays.map((day, idx) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isActive = isToday(day);
                return (
                    <Box key={idx}
                        onClick={() => { setSelectedDay(day); setDayDialogOpen(true); }}
                        sx={{
                            minHeight: 100, p: 0.5,
                            borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}`,
                            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}`,
                            bgcolor: isActive ? alpha('#6366f1', isDark ? 0.12 : 0.06) : !isCurrentMonth ? (isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)') : 'transparent',
                            cursor: 'pointer', transition: 'background 0.15s', opacity: isCurrentMonth ? 1 : 0.4,
                            '&:hover': { bgcolor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)' },
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.3 }}>
                            <Typography sx={{
                                fontSize: '0.8rem', fontWeight: isActive ? 800 : 500,
                                color: isActive ? '#6366f1' : 'text.secondary',
                                bgcolor: isActive ? alpha('#6366f1', 0.15) : 'transparent',
                                borderRadius: '50%', width: 26, height: 26,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>{format(day, 'd')}</Typography>
                            {dayEvents.length > 0 && (
                                <Badge badgeContent={dayEvents.length} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }} />
                            )}
                        </Box>
                        {dayEvents.slice(0, 3).map(ev => <EventChip key={ev.id} ev={ev} compact />)}
                        {dayEvents.length > 3 && (
                            <Typography sx={{ fontSize: '0.6rem', color: 'text.disabled', pl: 0.5, fontWeight: 600 }}>
                                +{dayEvents.length - 3} autres
                            </Typography>
                        )}
                    </Box>
                );
            })}
        </Box>
    );

    // ═══════ WEEK VIEW ═══════
    const WeekView = () => (
        <Box sx={{
            display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
            borderRadius: 3, overflow: 'hidden',
        }}>
            <Box sx={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`, bgcolor: isDark ? alpha('#6366f1', 0.1) : alpha('#6366f1', 0.05) }} />
            {weekDays.map((d, i) => (
                <Box key={i} sx={{
                    py: 1, textAlign: 'center',
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                    bgcolor: isToday(d) ? alpha('#6366f1', isDark ? 0.2 : 0.1) : (isDark ? alpha('#6366f1', 0.1) : alpha('#6366f1', 0.05)),
                }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: isToday(d) ? '#6366f1' : 'text.secondary' }}>{DAYS_FR[i]}</Typography>
                    <Typography sx={{ fontSize: '1.1rem', fontWeight: isToday(d) ? 800 : 500, color: isToday(d) ? '#6366f1' : 'text.primary' }}>{format(d, 'd')}</Typography>
                </Box>
            ))}
            {HOURS.map(hour => (
                <React.Fragment key={hour}>
                    <Box sx={{ py: 1, px: 0.5, textAlign: 'right', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc'}`, color: 'text.disabled', fontSize: '0.7rem', fontWeight: 600 }}>{hour}h</Box>
                    {weekDays.map((d, i) => {
                        const dayEvents = getEventsForDay(d).filter(ev => {
                            if (!ev.heure_audience) return hour === 8;
                            return parseInt(ev.heure_audience.substring(0, 2), 10) === hour;
                        });
                        return (
                            <Box key={i} onClick={() => openCreateDialog(d)} sx={{
                                minHeight: 48, p: 0.3,
                                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc'}`,
                                borderLeft: `1px solid ${isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc'}`,
                                cursor: 'pointer', '&:hover': { bgcolor: isDark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.03)' },
                            }}>
                                {dayEvents.map(ev => <EventChip key={ev.id} ev={ev} compact={false} />)}
                            </Box>
                        );
                    })}
                </React.Fragment>
            ))}
        </Box>
    );

    // ═══════ DAY VIEW ═══════
    const DayView = () => (
        <Box sx={{ border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`, borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ py: 1.5, textAlign: 'center', bgcolor: isDark ? alpha('#6366f1', 0.15) : alpha('#6366f1', 0.08) }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: isDark ? '#a5b4fc' : '#4338ca', textTransform: 'capitalize' }}>
                    {format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
                </Typography>
            </Box>
            {HOURS.map(hour => {
                const hourEvents = getEventsForDay(currentDate).filter(ev => {
                    if (!ev.heure_audience) return hour === 8;
                    return parseInt(ev.heure_audience.substring(0, 2), 10) === hour;
                });
                return (
                    <Box key={hour} onClick={() => openCreateDialog(currentDate)} sx={{
                        display: 'flex', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}`,
                        cursor: 'pointer', '&:hover': { bgcolor: isDark ? 'rgba(99,102,241,0.04)' : 'rgba(99,102,241,0.02)' },
                    }}>
                        <Box sx={{ width: 70, py: 1.5, textAlign: 'right', pr: 1.5, color: 'text.disabled', fontSize: '0.8rem', fontWeight: 600, borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}` }}>{hour}:00</Box>
                        <Box sx={{ flex: 1, p: 0.5, minHeight: 52 }}>
                            {hourEvents.map(ev => <EventChip key={ev.id} ev={ev} compact={false} />)}
                        </Box>
                    </Box>
                );
            })}
        </Box>
    );

    // ═══════ RENDER ═══════
    return (
        <Box sx={{ pb: 4 }}>
            {/* ── HEADER ── */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <GavelIcon sx={{ fontSize: 36, color: '#6366f1' }} />
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-0.02em' }}>Agenda juridique</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Gestion des audiences et procès</Typography>
                    </Box>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => openCreateDialog()}
                    sx={{ borderRadius: 2, px: 3, fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    Nouvelle audience
                </Button>
            </Box>

            {/* ── STATS CARDS ── */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Total', value: stats.total, color: '#6366f1', icon: '📊', filter: 'ALL' },
                    { label: 'Prévues', value: stats.prevu, color: '#2196f3', icon: '📅', filter: 'PREVU' },
                    { label: 'Reportées', value: stats.reporte, color: '#ff9800', icon: '🔄', filter: 'REPORTE' },
                    { label: 'Terminées', value: stats.termine, color: '#4caf50', icon: '✅', filter: 'TERMINE' },
                    { label: 'Annulées', value: stats.annule, color: '#f44336', icon: '❌', filter: 'ANNULE' },
                ].map(s => (
                    <Grid item xs={6} sm={2.4} key={s.label}>
                        <Paper
                            elevation={statutFilter === s.filter ? 4 : 0}
                            onClick={() => setStatutFilter(s.filter)}
                            sx={{
                                p: 2, borderRadius: 3, textAlign: 'center',
                                border: `1px solid ${statutFilter === s.filter ? s.color : (isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0')}`,
                                background: statutFilter === s.filter
                                    ? (isDark ? alpha(s.color, 0.15) : alpha(s.color, 0.08))
                                    : (isDark ? alpha(s.color, 0.08) : alpha(s.color, 0.04)),
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                position: 'relative',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: `0 8px 16px ${alpha(s.color, 0.15)}`,
                                    background: isDark ? alpha(s.color, 0.12) : alpha(s.color, 0.06),
                                }
                            }}>
                            {statutFilter === s.filter && (
                                <Box sx={{
                                    position: 'absolute', top: 8, right: 8,
                                    width: 8, height: 8, borderRadius: '50%',
                                    bgcolor: s.color
                                }} />
                            )}
                            <Typography sx={{ fontSize: '1.5rem' }}>{s.icon}</Typography>
                            <Typography sx={{ fontWeight: 900, fontSize: '1.5rem', color: s.color }}>{s.value}</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600 }}>{s.label}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* ── TOOLBAR ── */}
            <Paper elevation={0} sx={{
                p: 2, mb: 3, borderRadius: 3,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                        <InputLabel>Année</InputLabel>
                        <Select value={selectedYear} label="Année" onChange={(e) => handleYearChange(e.target.value)}>
                            {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <IconButton onClick={() => navigate(-1)} size="small"><ChevronLeft /></IconButton>
                    <Button onClick={goToday} size="small" variant="outlined" startIcon={<TodayIcon />} sx={{ textTransform: 'none', fontWeight: 600 }}>Aujourd'hui</Button>
                    <IconButton onClick={() => navigate(1)} size="small"><ChevronRight /></IconButton>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', textTransform: 'capitalize', minWidth: 180 }}>
                        {viewMode === 'month' && format(currentDate, 'MMMM yyyy', { locale: fr })}
                        {viewMode === 'week' && `Semaine du ${format(weekDays[0], 'd MMM', { locale: fr })}`}
                        {viewMode === 'day' && format(currentDate, 'EEEE d MMM yyyy', { locale: fr })}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <TextField size="small" placeholder="Rechercher..." value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
                        sx={{ minWidth: 180 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Chambre</InputLabel>
                        <Select value={chambreFilter} label="Chambre" onChange={(e) => setChambreFilter(e.target.value)}>
                            <MenuItem value="ALL">Toutes</MenuItem>
                            {Object.entries(CHAMBRE_COLORS).map(([key, cfg]) => (
                                <MenuItem key={key} value={key}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CircleIcon sx={{ fontSize: 10, color: cfg.color }} />{cfg.label}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Statut</InputLabel>
                        <Select value={statutFilter} label="Statut" onChange={(e) => setStatutFilter(e.target.value)}>
                            <MenuItem value="ALL">Tous</MenuItem>
                            {Object.entries(STATUT_CONFIG).map(([key, cfg]) => (
                                <MenuItem key={key} value={key}>{cfg.icon} {cfg.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <ToggleButtonGroup value={viewMode} exclusive onChange={(e, v) => v && setViewMode(v)} size="small">
                        <ToggleButton value="month"><CalendarIcon sx={{ mr: 0.5, fontSize: 18 }} />Mois</ToggleButton>
                        <ToggleButton value="week"><WeekIcon sx={{ mr: 0.5, fontSize: 18 }} />Semaine</ToggleButton>
                        <ToggleButton value="day"><DayIcon sx={{ mr: 0.5, fontSize: 18 }} />Jour</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Paper>

            {/* ── LOADING ── */}
            {loading && <LinearProgress sx={{ mb: 1, borderRadius: 2 }} />}

            {/* ── CALENDAR ── */}
            <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}` }}>
                {viewMode === 'month' && <MonthView />}
                {viewMode === 'week' && <WeekView />}
                {viewMode === 'day' && <DayView />}
            </Paper>

            {/* ── LÉGENDE ── */}
            <Paper elevation={0} sx={{ p: 2, mt: 2, borderRadius: 3, border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}` }}>
                <Typography sx={{ fontWeight: 800, mb: 1, fontSize: '0.85rem' }}>🎨 Chambres</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                    {Object.entries(CHAMBRE_COLORS).map(([key, cfg]) => (
                        <Chip key={key} label={`${cfg.icon} ${cfg.label}`} size="small"
                            onClick={() => setChambreFilter(chambreFilter === key ? 'ALL' : key)}
                            sx={{
                                bgcolor: alpha(cfg.color, chambreFilter === key ? 0.4 : (isDark ? 0.2 : 0.12)),
                                color: isDark ? alpha(cfg.color, 1) : cfg.color,
                                fontWeight: 600, fontSize: '0.7rem', border: `1px solid ${alpha(cfg.color, 0.3)}`,
                                cursor: 'pointer',
                            }} />
                    ))}
                </Box>
            </Paper>

            {/* ═══ DAY DETAIL DIALOG ═══ */}
            <Dialog open={dayDialogOpen} onClose={() => setDayDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GavelIcon />
                        <span>{selectedDay && format(selectedDay, 'EEEE d MMMM yyyy', { locale: fr })}</span>
                    </Box>
                    <IconButton onClick={() => setDayDialogOpen(false)} size="small"><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    {selectedDay && getEventsForDay(selectedDay).length === 0 ? (
                        <Typography sx={{ py: 3, textAlign: 'center', color: 'text.disabled' }}>Aucune audience ce jour</Typography>
                    ) : (
                        selectedDay && getEventsForDay(selectedDay).map(ev => {
                            const cfg = CHAMBRE_COLORS[ev.type_chambre] || CHAMBRE_COLORS.AUTRE;
                            const statCfg = STATUT_CONFIG[ev.statut] || STATUT_CONFIG.PREVU;
                            return (
                                <Card key={ev.id} elevation={0} sx={{
                                    mb: 1.5, border: `1px solid ${alpha(cfg.color, 0.3)}`,
                                    borderLeft: `4px solid ${cfg.color}`, borderRadius: 2,
                                    opacity: ev.statut === 'ANNULE' ? 0.6 : 1,
                                }}>
                                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Box sx={{ flex: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{cfg.icon} {ev.dossier_numero || ev.title}</Typography>
                                                    <Chip label={statCfg.label} size="small" sx={{
                                                        bgcolor: alpha(statCfg.color, 0.15), color: statCfg.color,
                                                        fontWeight: 700, fontSize: '0.65rem', height: 22,
                                                    }} />
                                                </Box>
                                                {ev.dossier_nom && <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mb: 0.3 }}>👥 {ev.dossier_nom}</Typography>}
                                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                                        <TimeIcon sx={{ fontSize: 13 }} />{ev.heure_audience?.substring(0, 5)}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{cfg.label}</Typography>
                                                    {ev.location && <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                                        <LocationIcon sx={{ fontSize: 13 }} />{ev.location}
                                                    </Typography>}
                                                </Box>
                                                {ev.notes && <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled', mt: 0.5, fontStyle: 'italic' }}>{ev.notes}</Typography>}
                                                {ev.reporte_de_info && (
                                                    <Typography sx={{ fontSize: '0.7rem', color: '#ff9800', mt: 0.5 }}>
                                                        🔄 Reporté depuis le {ev.reporte_de_info.date_audience}
                                                    </Typography>
                                                )}
                                                {ev.nb_reports > 0 && (
                                                    <Typography sx={{ fontSize: '0.7rem', color: '#ff9800', mt: 0.3 }}>
                                                        ↪ {ev.nb_reports} report(s) suivant(s)
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.1, bgcolor: alpha(theme.palette.divider, 0.05), borderRadius: 1.5, p: 0.2 }}>
                                                <Tooltip title="Modifier"><IconButton size="small" onClick={() => { setDayDialogOpen(false); openEditDialog(ev); }}><EditIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                                                {ev.statut === 'PREVU' && (
                                                    <>
                                                        <Tooltip title="Reporter"><IconButton size="small" onClick={() => openReportDialog(ev)} sx={{ color: '#ff9800' }}><ReportIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                                                        <Tooltip title="Terminer"><IconButton size="small" onClick={() => handleTerminer(ev)} sx={{ color: '#4caf50' }}><CheckIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                                                        <Tooltip title="Annuler"><IconButton size="small" onClick={() => handleAnnuler(ev)} sx={{ color: '#f44336' }}><CancelIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                                                    </>
                                                )}
                                                <Tooltip title="Supprimer"><IconButton size="small" onClick={() => handleDelete(ev)} color="error"><DeleteIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                                            </Box>
                                        </Box>
                                        {ev.dossier_numero && (
                                            <Button size="small" startIcon={<HistoryIcon />} onClick={() => openHistory(ev.dossier_numero)}
                                                sx={{ mt: 1, textTransform: 'none', fontSize: '0.7rem' }}>
                                                Historique du dossier
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </DialogContent>
                <DialogActions>
                    <Button variant="contained" startIcon={<AddIcon />}
                        onClick={() => { setDayDialogOpen(false); openCreateDialog(selectedDay); }}>
                        Ajouter ici
                    </Button>
                    <Button onClick={() => setDayDialogOpen(false)}>Fermer</Button>
                </DialogActions>
            </Dialog>

            {/* ═══ CREATE / EDIT DIALOG ═══ */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingEvent ? <><EditIcon sx={{ mr: 1 }} />Modifier l'audience</> : <><AddIcon sx={{ mr: 1 }} />Nouvelle audience</>}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField label="Type de chambre" select fullWidth required value={formData.type_chambre}
                            onChange={e => {
                                const t = e.target.value;
                                const cfg = CHAMBRE_COLORS[t] || CHAMBRE_COLORS.AUTRE;
                                setFormData(p => ({ ...p, type_chambre: t, color: cfg.color }));
                            }}>
                            {Object.entries(CHAMBRE_COLORS).map(([key, cfg]) => (
                                <MenuItem key={key} value={key}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CircleIcon sx={{ fontSize: 10, color: cfg.color }} />{cfg.icon} {cfg.label}
                                    </Box>
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField label="Statut" select fullWidth required value={formData.statut}
                            onChange={e => setFormData(p => ({ ...p, statut: e.target.value }))}>
                            {Object.entries(STATUT_CONFIG).map(([key, cfg]) => (
                                <MenuItem key={key} value={key}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {cfg.icon} {cfg.label}
                                    </Box>
                                </MenuItem>
                            ))}
                        </TextField>
                        {formData.type_chambre === 'AUTRE' && (
                            <TextField label="Précisez la chambre" fullWidth value={formData.type_chambre_autre}
                                onChange={e => setFormData(p => ({ ...p, type_chambre_autre: e.target.value }))} />
                        )}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField label="Numéro de dossier" fullWidth required value={formData.dossier_numero}
                                onChange={e => setFormData(p => ({ ...p, dossier_numero: e.target.value }))} />
                            <TextField label="Titre" fullWidth required value={formData.title}
                                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} />
                        </Box>
                        <TextField label="Nom du dossier / parties" fullWidth required value={formData.dossier_nom}
                            onChange={e => setFormData(p => ({ ...p, dossier_nom: e.target.value }))} />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField label="Date de l'audience" type="date" fullWidth required
                                InputLabelProps={{ shrink: true }} value={formData.date_audience}
                                onChange={e => setFormData(p => ({ ...p, date_audience: e.target.value }))} />
                            <TextField label="Heure de l'audience" type="time" fullWidth required
                                InputLabelProps={{ shrink: true }} value={formData.heure_audience}
                                onChange={e => setFormData(p => ({ ...p, heure_audience: e.target.value }))} />
                        </Box>
                        <TextField label="Dossier lié (optionnel)" select fullWidth value={formData.case}
                            onChange={e => setFormData(p => ({ ...p, case: e.target.value }))}>
                            <MenuItem value="">— Aucun —</MenuItem>
                            {Array.isArray(cases) && cases.map(c => (
                                <MenuItem key={c.id} value={c.id}>{c.reference} — {c.title}</MenuItem>
                            ))}
                        </TextField>
                        <TextField label="Lieu" fullWidth value={formData.location}
                            onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} />
                        <TextField label="Notes et observations" fullWidth multiline rows={3} value={formData.notes}
                            onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
                    <Button variant="contained" onClick={handleSave}
                        disabled={!formData.date_audience || !formData.heure_audience || !formData.title}>
                        {editingEvent ? 'Modifier' : 'Créer'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ═══ REPORT DIALOG ═══ */}
            <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle><ReportIcon sx={{ mr: 1, color: '#ff9800' }} />Reporter l'audience</DialogTitle>
                <DialogContent>
                    {reportTarget && (
                        <Box sx={{ mb: 2 }}>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                <Typography variant="subtitle2">{reportTarget.dossier_numero} — {reportTarget.dossier_nom}</Typography>
                                <Typography variant="caption">
                                    Date actuelle : {reportTarget.date_audience} à {reportTarget.heure_audience?.substring(0, 5)}
                                </Typography>
                            </Alert>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField label="Nouvelle date" type="date" fullWidth required
                                        InputLabelProps={{ shrink: true }} value={reportForm.nouvelle_date}
                                        onChange={e => setReportForm(p => ({ ...p, nouvelle_date: e.target.value }))} />
                                    <TextField label="Nouvelle heure" type="time" fullWidth required
                                        InputLabelProps={{ shrink: true }} value={reportForm.nouvelle_heure}
                                        onChange={e => setReportForm(p => ({ ...p, nouvelle_heure: e.target.value }))} />
                                </Box>
                                <TextField label="Motif du report" fullWidth multiline rows={2} value={reportForm.motif}
                                    onChange={e => setReportForm(p => ({ ...p, motif: e.target.value }))} />
                                <TextField label="Notes pour la nouvelle audience" fullWidth multiline rows={2} value={reportForm.notes}
                                    onChange={e => setReportForm(p => ({ ...p, notes: e.target.value }))} />
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReportDialogOpen(false)}>Annuler</Button>
                    <Button variant="contained" onClick={handleReport} disabled={!reportForm.nouvelle_date}
                        sx={{ bgcolor: '#ff9800', '&:hover': { bgcolor: '#f57c00' } }}>
                        Reporter
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ═══ HISTORY DIALOG ═══ */}
            <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle><HistoryIcon sx={{ mr: 1 }} />Historique du dossier {historyData?.dossier_numero}</DialogTitle>
                <DialogContent>
                    {historyData && (
                        <Box>
                            <Typography sx={{ fontWeight: 700, mb: 1 }}>📅 Audiences ({historyData.entries?.length || 0})</Typography>
                            {historyData.entries?.map(entry => {
                                const cfg = CHAMBRE_COLORS[entry.type_chambre] || CHAMBRE_COLORS.AUTRE;
                                const statCfg = STATUT_CONFIG[entry.statut] || STATUT_CONFIG.PREVU;
                                return (
                                    <Card key={entry.id} elevation={0} sx={{
                                        mb: 1, borderLeft: `4px solid ${statCfg.color}`,
                                        border: `1px solid ${alpha(statCfg.color, 0.3)}`, borderRadius: 2,
                                    }}>
                                        <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                                                        {entry.date_audience} à {entry.heure_audience?.substring(0, 5)} — {cfg.label}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{entry.dossier_nom}</Typography>
                                                    {entry.motif_report && <Typography sx={{ fontSize: '0.7rem', color: '#ff9800', fontStyle: 'italic' }}>Motif : {entry.motif_report}</Typography>}
                                                </Box>
                                                <Chip label={statCfg.label} size="small" sx={{ bgcolor: alpha(statCfg.color, 0.15), color: statCfg.color, fontWeight: 700 }} />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                            <Typography sx={{ fontWeight: 700, mb: 1, mt: 2 }}>📝 Journal des modifications ({historyData.history?.length || 0})</Typography>
                            {historyData.history?.map(h => (
                                <Box key={h.id} sx={{ display: 'flex', gap: 1, py: 0.8, borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', minWidth: 120 }}>
                                        {h.date_action && format(parseISO(h.date_action), 'dd/MM/yy HH:mm')}
                                    </Typography>
                                    <Chip label={h.type_action_display} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
                                    <Typography sx={{ fontSize: '0.75rem', flex: 1 }}>{h.commentaire}</Typography>
                                    <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{h.utilisateur_name}</Typography>
                                </Box>
                            ))}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions><Button onClick={() => setHistoryDialogOpen(false)}>Fermer</Button></DialogActions>
            </Dialog>

            {/* ── SNACKBAR ── */}
            <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ width: '100%' }}>
                    {snack.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default Agenda;
