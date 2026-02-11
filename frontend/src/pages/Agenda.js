import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Typography, Paper, Button, IconButton, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, MenuItem, Chip, Tooltip, Badge, Grid,
    ToggleButton, ToggleButtonGroup, Select, FormControl, InputLabel,
    FormControlLabel, Checkbox, Alert, Divider, useTheme, alpha, Card, CardContent
} from '@mui/material';
import {
    ChevronLeft, ChevronRight, Today as TodayIcon, Add as AddIcon,
    CalendarMonth as CalendarIcon, ViewWeek as WeekIcon, ViewDay as DayIcon,
    Event as EventIcon, AccessTime as TimeIcon, LocationOn as LocationIcon,
    Archive as ArchiveIcon, Delete as DeleteIcon, Edit as EditIcon,
    Circle as CircleIcon
} from '@mui/icons-material';
import {
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths,
    subMonths, addWeeks, subWeeks, isSameMonth, isToday, parseISO,
    getYear, setYear, setHours, setMinutes
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { agendaAPI, casesAPI } from '../services/api';

// Couleurs et config par type d'événement
const EVENT_TYPES = {
    AUDIENCE: { label: 'Audience', color: '#2196f3', icon: '⚖️' },
    RDV: { label: 'RDV Client', color: '#4caf50', icon: '👤' },
    REUNION: { label: 'Réunion', color: '#9c27b0', icon: '🤝' },
    DEPLACEMENT: { label: 'Déplacement', color: '#00bcd4', icon: '🚗' },
    RAPPEL: { label: 'Rappel', color: '#78909c', icon: '🔔' },
    CONFERENCE: { label: 'Conférence', color: '#3f51b5', icon: '🎤' },
    FORMATION: { label: 'Formation', color: '#009688', icon: '📚' },
    DECISION: { label: 'Décision', color: '#ff9800', icon: '📋' },
    TACHE: { label: 'Tâche', color: '#ffc107', icon: '✅' },
    DEPOT: { label: 'Dépôt de pièce', color: '#ff9800', icon: '📁' },
    REPONSE: { label: 'Réponse', color: '#9c27b0', icon: '✉️' },
    DELAI: { label: 'Délai de recours', color: '#f44336', icon: '⏰' },
    CONGES: { label: 'Congés', color: '#78909c', icon: '🏖️' },
    AUTRE: { label: 'Autre', color: '#607d8b', icon: '📌' },
};

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7h-20h

const emptyEvent = {
    title: '', event_type: 'RDV', start_datetime: '', end_datetime: '',
    all_day: false, case: '', description: '', location: '', color: '#4caf50',
    reminder_minutes: 30
};

function Agenda() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedYear, setSelectedYear] = useState(getYear(new Date()));
    const [viewMode, setViewMode] = useState('month');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cases, setCases] = useState([]);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [formData, setFormData] = useState({ ...emptyEvent });

    // Day detail
    const [selectedDay, setSelectedDay] = useState(null);
    const [dayDialogOpen, setDayDialogOpen] = useState(false);

    // Filters
    const [typeFilter, setTypeFilter] = useState('ALL');

    // Archive years available
    const currentYear = getYear(new Date());
    const years = useMemo(() => {
        const arr = [];
        for (let y = currentYear; y >= currentYear - 5; y--) arr.push(y);
        return arr;
    }, [currentYear]);

    const isArchived = selectedYear < currentYear;

    // Load events
    const loadEvents = useCallback(async () => {
        setLoading(true);
        try {
            const month = format(currentDate, 'M');
            const res = await agendaAPI.getAggregated({ year: selectedYear, month });
            setEvents(res.data || []);
        } catch (err) {
            console.error('Erreur chargement agenda:', err);
        } finally {
            setLoading(false);
        }
    }, [currentDate, selectedYear]);

    const loadCases = useCallback(async () => {
        try {
            const res = await casesAPI.getAll({ page_size: 500 });
            setCases(res.data?.results || res.data || []);
        } catch (err) {
            console.error('Erreur chargement dossiers:', err);
        }
    }, []);

    useEffect(() => { loadEvents(); }, [loadEvents]);
    useEffect(() => { loadCases(); }, [loadCases]);

    // Navigation
    const goToday = () => {
        setCurrentDate(new Date());
        setSelectedYear(currentYear);
    };
    const navigate = (dir) => {
        if (viewMode === 'month') {
            setCurrentDate(prev => dir > 0 ? addMonths(prev, 1) : subMonths(prev, 1));
        } else if (viewMode === 'week') {
            setCurrentDate(prev => dir > 0 ? addWeeks(prev, 1) : subWeeks(prev, 1));
        } else {
            setCurrentDate(prev => addDays(prev, dir));
        }
    };

    // Year change
    const handleYearChange = (yr) => {
        setSelectedYear(yr);
        setCurrentDate(setYear(currentDate, yr));
    };

    // Filter events
    const filteredEvents = useMemo(() => {
        if (typeFilter === 'ALL') return events;
        return events.filter(e => e.event_type === typeFilter);
    }, [events, typeFilter]);

    // Events for a specific day
    const getEventsForDay = (day) => {
        const dayStr = format(day, 'yyyy-MM-dd');
        return filteredEvents.filter(ev => {
            if (!ev.start) return false;
            const evDate = ev.start.substring(0, 10);
            return evDate === dayStr;
        });
    };

    // Calendar grid for month view
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        const days = [];
        let d = calStart;
        while (d <= calEnd) {
            days.push(d);
            d = addDays(d, 1);
        }
        return days;
    }, [currentDate]);

    // Week days for week view
    const weekDays = useMemo(() => {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    }, [currentDate]);

    // Dialog handlers
    const openCreateDialog = (day) => {
        const dateStr = format(day || new Date(), "yyyy-MM-dd'T'HH:mm");
        setEditingEvent(null);
        setFormData({ ...emptyEvent, start_datetime: dateStr });
        setDialogOpen(true);
    };

    const openEditDialog = (ev) => {
        if (ev.source !== 'agenda') return; // Only edit agenda events
        setEditingEvent(ev);
        setFormData({
            title: ev.title || '',
            event_type: ev.event_type || 'RDV',
            start_datetime: ev.start ? ev.start.substring(0, 16) : '',
            end_datetime: ev.end ? ev.end.substring(0, 16) : '',
            all_day: ev.all_day || false,
            case: ev.case_id || '',
            description: ev.description || '',
            location: ev.location || '',
            color: ev.color || '#4caf50',
            reminder_minutes: 30
        });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload = {
                title: formData.title,
                event_type: formData.event_type,
                start_datetime: formData.start_datetime,
                end_datetime: formData.end_datetime || null,
                all_day: formData.all_day,
                case: formData.case || null,
                description: formData.description,
                location: formData.location,
                color: formData.color,
                reminder_minutes: formData.reminder_minutes || 0,
            };
            if (editingEvent) {
                await agendaAPI.update(editingEvent.source_id, payload);
            } else {
                await agendaAPI.create(payload);
            }
            setDialogOpen(false);
            loadEvents();
        } catch (err) {
            console.error('Erreur sauvegarde:', err);
            const detail = err.response?.data;
            const msg = detail ? JSON.stringify(detail) : 'Erreur lors de la sauvegarde';
            alert(msg);
        }
    };

    const handleDelete = async (ev) => {
        if (ev.source !== 'agenda') return;
        if (!window.confirm('Supprimer cet événement ?')) return;
        try {
            await agendaAPI.delete(ev.source_id);
            loadEvents();
            setDayDialogOpen(false);
        } catch (err) {
            console.error('Erreur suppression:', err);
        }
    };

    // Stats
    const stats = useMemo(() => {
        const s = { total: filteredEvents.length, audiences: 0, rdv: 0, deadlines: 0, decisions: 0, tasks: 0 };
        filteredEvents.forEach(e => {
            if (e.event_type === 'AUDIENCE') s.audiences++;
            else if (e.event_type === 'RDV') s.rdv++;
            else if (['DEPOT', 'REPONSE', 'DELAI', 'CONGES'].includes(e.event_type)) s.deadlines++;
            else if (e.event_type === 'DECISION') s.decisions++;
            else if (e.event_type === 'TACHE') s.tasks++;
        });
        return s;
    }, [filteredEvents]);

    // Upcoming events (next 7)
    const upcoming = useMemo(() => {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        return filteredEvents
            .filter(e => e.start && e.start.substring(0, 10) >= todayStr)
            .slice(0, 7);
    }, [filteredEvents]);

    // ═══════ EVENT CHIP ═══════
    const EventChip = ({ ev, compact }) => {
        const cfg = EVENT_TYPES[ev.event_type] || EVENT_TYPES.AUTRE;
        return (
            <Tooltip
                title={
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{ev.title}</Typography>
                        {ev.case_reference && <Typography variant="caption">📁 {ev.case_reference}</Typography>}
                        {ev.location && <Typography variant="caption" display="block">📍 {ev.location}</Typography>}
                        {ev.start && <Typography variant="caption" display="block">🕐 {format(parseISO(ev.start), 'HH:mm', { locale: fr })}</Typography>}
                    </Box>
                }
                arrow
            >
                <Box
                    onClick={(e) => { e.stopPropagation(); ev.source === 'agenda' ? openEditDialog(ev) : setDayDialogOpen(true); }}
                    sx={{
                        display: 'flex', alignItems: 'center', gap: 0.5,
                        px: 0.8, py: 0.2, mb: 0.3,
                        borderRadius: '6px',
                        bgcolor: alpha(cfg.color, isDark ? 0.25 : 0.15),
                        borderLeft: `3px solid ${cfg.color}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        '&:hover': { bgcolor: alpha(cfg.color, isDark ? 0.4 : 0.25), transform: 'scale(1.02)' },
                        overflow: 'hidden',
                    }}
                >
                    <Typography sx={{ fontSize: '0.65rem', lineHeight: 1 }}>{cfg.icon}</Typography>
                    <Typography noWrap sx={{
                        fontSize: compact ? '0.65rem' : '0.7rem',
                        fontWeight: 600,
                        color: isDark ? alpha(cfg.color, 1) : cfg.color,
                        lineHeight: 1.3,
                    }}>
                        {compact && ev.start ? format(parseISO(ev.start), 'HH:mm') + ' ' : ''}{ev.title}
                    </Typography>
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
            {/* Day headers */}
            {DAYS_FR.map(d => (
                <Box key={d} sx={{
                    py: 1.2, textAlign: 'center',
                    fontWeight: 700, fontSize: '0.8rem',
                    bgcolor: isDark ? alpha('#6366f1', 0.15) : alpha('#6366f1', 0.08),
                    color: isDark ? '#a5b4fc' : '#4338ca',
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                }}>{d}</Box>
            ))}

            {/* Calendar cells */}
            {calendarDays.map((day, idx) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isActive = isToday(day);
                return (
                    <Box
                        key={idx}
                        onClick={() => { setSelectedDay(day); setDayDialogOpen(true); }}
                        sx={{
                            minHeight: 100,
                            p: 0.5,
                            borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}`,
                            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}`,
                            bgcolor: isActive
                                ? alpha('#6366f1', isDark ? 0.12 : 0.06)
                                : !isCurrentMonth
                                    ? (isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)')
                                    : 'transparent',
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                            '&:hover': { bgcolor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)' },
                            opacity: isCurrentMonth ? 1 : 0.4,
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.3 }}>
                            <Typography sx={{
                                fontSize: '0.8rem', fontWeight: isActive ? 800 : 500,
                                color: isActive ? '#6366f1' : 'text.secondary',
                                bgcolor: isActive ? alpha('#6366f1', 0.15) : 'transparent',
                                borderRadius: '50%', width: 26, height: 26,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {format(day, 'd')}
                            </Typography>
                            {dayEvents.length > 0 && (
                                <Badge badgeContent={dayEvents.length} color="primary" sx={{
                                    '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 }
                                }} />
                            )}
                        </Box>
                        {dayEvents.slice(0, 3).map((ev, i) => (
                            <EventChip key={ev.id} ev={ev} compact />
                        ))}
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
            display: 'grid',
            gridTemplateColumns: '60px repeat(7, 1fr)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
            borderRadius: 3, overflow: 'hidden',
        }}>
            {/* Header */}
            <Box sx={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`, bgcolor: isDark ? alpha('#6366f1', 0.1) : alpha('#6366f1', 0.05) }} />
            {weekDays.map((d, i) => (
                <Box key={i} sx={{
                    py: 1, textAlign: 'center',
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                    bgcolor: isToday(d) ? alpha('#6366f1', isDark ? 0.2 : 0.1) : (isDark ? alpha('#6366f1', 0.1) : alpha('#6366f1', 0.05)),
                }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: isToday(d) ? '#6366f1' : 'text.secondary' }}>
                        {DAYS_FR[i]}
                    </Typography>
                    <Typography sx={{ fontSize: '1.1rem', fontWeight: isToday(d) ? 800 : 500, color: isToday(d) ? '#6366f1' : 'text.primary' }}>
                        {format(d, 'd')}
                    </Typography>
                </Box>
            ))}

            {/* Time slots */}
            {HOURS.map(hour => (
                <React.Fragment key={hour}>
                    <Box sx={{
                        py: 1, px: 0.5, textAlign: 'right',
                        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc'}`,
                        color: 'text.disabled', fontSize: '0.7rem', fontWeight: 600,
                    }}>
                        {hour}h
                    </Box>
                    {weekDays.map((d, i) => {
                        const dayEvents = getEventsForDay(d).filter(ev => {
                            if (!ev.start || ev.all_day) return hour === 7;
                            const h = parseInt(ev.start.substring(11, 13), 10);
                            return h === hour;
                        });
                        return (
                            <Box key={i} onClick={() => openCreateDialog(setHours(setMinutes(d, 0), hour))} sx={{
                                minHeight: 48, p: 0.3,
                                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc'}`,
                                borderLeft: `1px solid ${isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc'}`,
                                cursor: 'pointer',
                                '&:hover': { bgcolor: isDark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.03)' },
                            }}>
                                {dayEvents.map(ev => (
                                    <EventChip key={ev.id} ev={ev} compact={false} />
                                ))}
                            </Box>
                        );
                    })}
                </React.Fragment>
            ))}
        </Box>
    );

    // ═══════ DAY VIEW ═══════
    const DayView = () => (
        <Box sx={{
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
            borderRadius: 3, overflow: 'hidden',
        }}>
            <Box sx={{
                py: 1.5, textAlign: 'center',
                bgcolor: isDark ? alpha('#6366f1', 0.15) : alpha('#6366f1', 0.08),
            }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: isDark ? '#a5b4fc' : '#4338ca' }}>
                    {format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
                </Typography>
            </Box>
            {HOURS.map(hour => {
                const hourEvents = getEventsForDay(currentDate).filter(ev => {
                    if (!ev.start || ev.all_day) return hour === 7;
                    const h = parseInt(ev.start.substring(11, 13), 10);
                    return h === hour;
                });
                return (
                    <Box key={hour} onClick={() => openCreateDialog(setHours(setMinutes(currentDate, 0), hour))} sx={{
                        display: 'flex',
                        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}`,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: isDark ? 'rgba(99,102,241,0.04)' : 'rgba(99,102,241,0.02)' },
                    }}>
                        <Box sx={{
                            width: 70, py: 1.5, textAlign: 'right', pr: 1.5,
                            color: 'text.disabled', fontSize: '0.8rem', fontWeight: 600,
                            borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}`,
                        }}>
                            {hour}:00
                        </Box>
                        <Box sx={{ flex: 1, p: 0.5, minHeight: 52 }}>
                            {hourEvents.map(ev => (
                                <EventChip key={ev.id} ev={ev} compact={false} />
                            ))}
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
            <Box sx={{
                display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
                alignItems: 'center', mb: 3, gap: 2,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CalendarIcon sx={{ fontSize: 36, color: '#6366f1' }} />
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-0.02em' }}>
                            Agenda
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Cabinet de Maître Ibrahima Mbengue
                        </Typography>
                    </Box>
                </Box>

                {!isArchived && (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => openCreateDialog()}
                        sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}>
                        Nouvel événement
                    </Button>
                )}
            </Box>

            {/* Archive banner */}
            {isArchived && (
                <Alert severity="info" icon={<ArchiveIcon />} sx={{ mb: 2, borderRadius: 2 }}>
                    <Typography sx={{ fontWeight: 700 }}>
                        📦 Agenda archivé — {selectedYear}
                    </Typography>
                    <Typography variant="body2">
                        Cet agenda est en lecture seule. Les événements ne peuvent plus être modifiés.
                    </Typography>
                </Alert>
            )}

            {/* TOOLBAR */}
            <Paper elevation={0} sx={{
                p: 2, mb: 3, borderRadius: 3,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
                alignItems: 'center', gap: 2,
            }}>
                {/* Left: Year selector + Nav */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <FormControl size="small" sx={{ minWidth: 110 }}>
                        <InputLabel>Année</InputLabel>
                        <Select value={selectedYear} label="Année"
                            onChange={(e) => handleYearChange(e.target.value)}>
                            {years.map(y => (
                                <MenuItem key={y} value={y}>
                                    {y}{y < currentYear ? ' 📦' : y === currentYear ? ' ✨' : ''}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Divider orientation="vertical" flexItem />

                    <IconButton onClick={() => navigate(-1)} size="small">
                        <ChevronLeft />
                    </IconButton>
                    <Button onClick={goToday} size="small" variant="outlined" startIcon={<TodayIcon />}
                        sx={{ textTransform: 'none', fontWeight: 600 }}>
                        Aujourd'hui
                    </Button>
                    <IconButton onClick={() => navigate(1)} size="small">
                        <ChevronRight />
                    </IconButton>

                    <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', textTransform: 'capitalize', minWidth: 180 }}>
                        {viewMode === 'month' && format(currentDate, 'MMMM yyyy', { locale: fr })}
                        {viewMode === 'week' && `Semaine du ${format(weekDays[0], 'd MMM', { locale: fr })}`}
                        {viewMode === 'day' && format(currentDate, 'EEEE d MMM yyyy', { locale: fr })}
                    </Typography>
                </Box>

                {/* Right: View toggle + Filter */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Filtrer</InputLabel>
                        <Select value={typeFilter} label="Filtrer"
                            onChange={(e) => setTypeFilter(e.target.value)}>
                            <MenuItem value="ALL">Tous les types</MenuItem>
                            {Object.entries(EVENT_TYPES).map(([key, cfg]) => (
                                <MenuItem key={key} value={key}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CircleIcon sx={{ fontSize: 10, color: cfg.color }} />
                                        {cfg.label}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <ToggleButtonGroup value={viewMode} exclusive
                        onChange={(e, v) => v && setViewMode(v)} size="small">
                        <ToggleButton value="month"><CalendarIcon sx={{ mr: 0.5, fontSize: 18 }} />Mois</ToggleButton>
                        <ToggleButton value="week"><WeekIcon sx={{ mr: 0.5, fontSize: 18 }} />Semaine</ToggleButton>
                        <ToggleButton value="day"><DayIcon sx={{ mr: 0.5, fontSize: 18 }} />Jour</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Paper>

            {/* MAIN CONTENT */}
            <Grid container spacing={3}>
                {/* Calendar */}
                <Grid item xs={12} md={9}>
                    <Paper elevation={0} sx={{
                        borderRadius: 3, overflow: 'hidden',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                    }}>
                        {loading ? (
                            <Box sx={{ p: 8, textAlign: 'center' }}>
                                <Typography color="text.secondary">Chargement de l'agenda...</Typography>
                            </Box>
                        ) : (
                            <>
                                {viewMode === 'month' && <MonthView />}
                                {viewMode === 'week' && <WeekView />}
                                {viewMode === 'day' && <DayView />}
                            </>
                        )}
                    </Paper>
                </Grid>

                {/* Sidebar */}
                <Grid item xs={12} md={3}>
                    {/* Stats */}
                    <Paper elevation={0} sx={{
                        p: 2.5, borderRadius: 3, mb: 2,
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                    }}>
                        <Typography sx={{ fontWeight: 800, mb: 2, fontSize: '0.95rem' }}>
                            📊 Résumé du mois
                        </Typography>
                        {[
                            { label: 'Total événements', value: stats.total, color: '#6366f1' },
                            { label: 'Audiences', value: stats.audiences, color: '#2196f3' },
                            { label: 'RDV Client', value: stats.rdv, color: '#4caf50' },
                            { label: 'Échéances', value: stats.deadlines, color: '#f44336' },
                            { label: 'Décisions', value: stats.decisions, color: '#ff9800' },
                            { label: 'Tâches', value: stats.tasks, color: '#ffc107' },
                        ].map(s => (
                            <Box key={s.label} sx={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                py: 0.8, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'}`,
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CircleIcon sx={{ fontSize: 8, color: s.color }} />
                                    <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>{s.label}</Typography>
                                </Box>
                                <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: s.color }}>{s.value}</Typography>
                            </Box>
                        ))}
                    </Paper>

                    {/* Upcoming */}
                    <Paper elevation={0} sx={{
                        p: 2.5, borderRadius: 3, mb: 2,
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                    }}>
                        <Typography sx={{ fontWeight: 800, mb: 2, fontSize: '0.95rem' }}>
                            📋 Prochains événements
                        </Typography>
                        {upcoming.length === 0 ? (
                            <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled', fontStyle: 'italic' }}>
                                Aucun événement à venir
                            </Typography>
                        ) : (
                            upcoming.map(ev => {
                                const cfg = EVENT_TYPES[ev.event_type] || EVENT_TYPES.AUTRE;
                                return (
                                    <Box key={ev.id} sx={{
                                        display: 'flex', gap: 1, py: 0.8, alignItems: 'flex-start',
                                        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'}`,
                                    }}>
                                        <Typography sx={{ fontSize: '0.9rem', mt: 0.2 }}>{cfg.icon}</Typography>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography noWrap sx={{ fontSize: '0.78rem', fontWeight: 600 }}>{ev.title}</Typography>
                                            <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled' }}>
                                                {ev.start && format(parseISO(ev.start), 'dd/MM · HH:mm', { locale: fr })}
                                                {ev.case_reference && ` · ${ev.case_reference}`}
                                            </Typography>
                                        </Box>
                                    </Box>
                                );
                            })
                        )}
                    </Paper>

                    {/* Legend */}
                    <Paper elevation={0} sx={{
                        p: 2.5, borderRadius: 3,
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                    }}>
                        <Typography sx={{ fontWeight: 800, mb: 1.5, fontSize: '0.95rem' }}>
                            🎨 Légende
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                            {Object.entries(EVENT_TYPES).slice(0, 10).map(([key, cfg]) => (
                                <Chip key={key} label={`${cfg.icon} ${cfg.label}`} size="small" sx={{
                                    bgcolor: alpha(cfg.color, isDark ? 0.2 : 0.12),
                                    color: isDark ? alpha(cfg.color, 1) : cfg.color,
                                    fontWeight: 600, fontSize: '0.7rem',
                                    border: `1px solid ${alpha(cfg.color, 0.3)}`,
                                }} />
                            ))}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* ═══ DAY DETAIL DIALOG ═══ */}
            <Dialog open={dayDialogOpen} onClose={() => setDayDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <EventIcon sx={{ mr: 1 }} />
                    {selectedDay && format(selectedDay, 'EEEE d MMMM yyyy', { locale: fr })}
                </DialogTitle>
                <DialogContent>
                    {selectedDay && getEventsForDay(selectedDay).length === 0 ? (
                        <Typography sx={{ py: 3, textAlign: 'center', color: 'text.disabled' }}>
                            Aucun événement ce jour
                        </Typography>
                    ) : (
                        selectedDay && getEventsForDay(selectedDay).map(ev => {
                            const cfg = EVENT_TYPES[ev.event_type] || EVENT_TYPES.AUTRE;
                            return (
                                <Card key={ev.id} elevation={0} sx={{
                                    mb: 1.5, border: `1px solid ${alpha(cfg.color, 0.3)}`,
                                    borderLeft: `4px solid ${cfg.color}`, borderRadius: 2,
                                }}>
                                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Box>
                                                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                                    {cfg.icon} {ev.title}
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
                                                    {ev.start && (
                                                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                                            <TimeIcon sx={{ fontSize: 13 }} />{format(parseISO(ev.start), 'HH:mm')}
                                                        </Typography>
                                                    )}
                                                    {ev.location && (
                                                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                                            <LocationIcon sx={{ fontSize: 13 }} />{ev.location}
                                                        </Typography>
                                                    )}
                                                    {ev.case_reference && (
                                                        <Chip label={ev.case_reference} size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
                                                    )}
                                                </Box>
                                                {ev.description && (
                                                    <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled', mt: 0.5 }}>
                                                        {ev.description}
                                                    </Typography>
                                                )}
                                            </Box>
                                            {ev.source === 'agenda' && !isArchived && (
                                                <Box>
                                                    <IconButton size="small" onClick={() => openEditDialog(ev)}>
                                                        <EditIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => handleDelete(ev)} color="error">
                                                        <DeleteIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Box>
                                            )}
                                        </Box>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </DialogContent>
                <DialogActions>
                    {!isArchived && (
                        <Button variant="contained" startIcon={<AddIcon />}
                            onClick={() => { setDayDialogOpen(false); openCreateDialog(selectedDay); }}>
                            Ajouter ici
                        </Button>
                    )}
                    <Button onClick={() => setDayDialogOpen(false)}>Fermer</Button>
                </DialogActions>
            </Dialog>

            {/* ═══ CREATE / EDIT DIALOG ═══ */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingEvent ? <><EditIcon sx={{ mr: 1 }} />Modifier l'événement</> : <><AddIcon sx={{ mr: 1 }} />Nouvel événement</>}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
                        <TextField label="Titre" fullWidth required
                            value={formData.title}
                            onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                        />

                        <TextField label="Type d'événement" select fullWidth
                            value={formData.event_type}
                            onChange={e => {
                                const t = e.target.value;
                                const cfg = EVENT_TYPES[t] || EVENT_TYPES.AUTRE;
                                setFormData(p => ({ ...p, event_type: t, color: cfg.color }));
                            }}>
                            {['AUDIENCE', 'RDV', 'REUNION', 'DEPLACEMENT', 'RAPPEL', 'CONFERENCE', 'FORMATION', 'AUTRE'].map(k => (
                                <MenuItem key={k} value={k}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CircleIcon sx={{ fontSize: 10, color: EVENT_TYPES[k].color }} />
                                        {EVENT_TYPES[k].icon} {EVENT_TYPES[k].label}
                                    </Box>
                                </MenuItem>
                            ))}
                        </TextField>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField label="Début" type="datetime-local" fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={formData.start_datetime}
                                onChange={e => setFormData(p => ({ ...p, start_datetime: e.target.value }))}
                            />
                            <TextField label="Fin" type="datetime-local" fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={formData.end_datetime}
                                onChange={e => setFormData(p => ({ ...p, end_datetime: e.target.value }))}
                            />
                        </Box>

                        <FormControlLabel
                            control={<Checkbox checked={formData.all_day}
                                onChange={e => setFormData(p => ({ ...p, all_day: e.target.checked }))} />}
                            label="Journée entière"
                        />

                        <TextField label="Dossier lié" select fullWidth
                            value={formData.case}
                            onChange={e => setFormData(p => ({ ...p, case: e.target.value }))}>
                            <MenuItem value="">Aucun dossier</MenuItem>
                            {cases.map(c => (
                                <MenuItem key={c.id} value={c.id}>
                                    {c.reference} — {c.title || 'Sans titre'}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField label="Lieu" fullWidth
                            value={formData.location}
                            onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                            placeholder="Tribunal, bureau, adresse..."
                        />

                        <TextField label="Description" multiline rows={3} fullWidth
                            value={formData.description}
                            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                        />

                        <TextField label="Rappel (minutes avant)" type="number" fullWidth
                            value={formData.reminder_minutes}
                            onChange={e => setFormData(p => ({ ...p, reminder_minutes: parseInt(e.target.value) || 0 }))}
                            helperText="0 = pas de rappel"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
                    <Button variant="contained" onClick={handleSave}
                        disabled={!formData.title || !formData.start_datetime}>
                        {editingEvent ? 'Enregistrer' : 'Créer'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default Agenda;
