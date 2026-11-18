import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, Button, IconButton, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, MenuItem, Chip, Tooltip, Grid,
    ToggleButton, ToggleButtonGroup, Select, FormControl, InputLabel,
    ListSubheader, Alert, useTheme, alpha, Card, CardContent, Snackbar, InputAdornment,
    LinearProgress, Autocomplete, RadioGroup, Radio, FormControlLabel, useMediaQuery, Divider
} from '@mui/material';
import {
    ChevronLeft, ChevronRight, Today as TodayIcon, Add as AddIcon,
    CalendarMonth as CalendarIcon, ViewWeek as WeekIcon, ViewDay as DayIcon, ViewList as ListIcon,
    LocationOn as LocationIcon,
    Delete as DeleteIcon, Edit as EditIcon, Circle as CircleIcon,
    Search as SearchIcon, Gavel as GavelIcon, EventRepeat as ReportIcon,
    CheckCircle as CheckIcon, Cancel as CancelIcon, History as HistoryIcon,
    Close as CloseIcon, FolderOpen as FolderOpenIcon, Print as PrintIcon,
    WarningAmber as WarningIcon, EventAvailable as UpcomingIcon, ContentCopy as CopyIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import {
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths,
    subMonths, addWeeks, subWeeks, isSameMonth, isToday, parseISO, isValid,
    getYear, setYear
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { agendaAPI, casesAPI } from '../services/api';

// ═══════ CONFIG ═══════
const CHAMBRE_COLORS = {
    // TI (Tribunaux d'Instance)
    TI_DAKAR: { label: 'TI Dakar', color: '#795548', icon: '🏛️' },
    TI_PIKINE: { label: 'TI Pikine', color: '#795548', icon: '🏛️' },
    TI_GUEDIAWAYE: { label: 'TI Guédiawaye', color: '#795548', icon: '🏛️' },
    TI_RUFISQUE: { label: 'TI Rufisque', color: '#795548', icon: '🏛️' },
    TI_KEUR_MASSAR: { label: 'TI Keur Massar', color: '#795548', icon: '🏛️' },
    TI_FAMILLE: { label: 'TI Famille', color: '#795548', icon: '👨‍👩‍👧‍👦' },

    // TGI Dakar
    TGI_DAKAR_CIVIL: { label: 'TGI Dakar - Civil', color: '#3f51b5', icon: '⚖️' },
    TGI_DAKAR_STATUT_PERSONNEL: { label: 'TGI Dakar - Statut Personnel', color: '#3f51b5', icon: '👤' },
    TGI_DAKAR_FDTR: { label: 'TGI Dakar - FDTR', color: '#3f51b5', icon: '📋' },
    TGI_DAKAR_CORRECTIONNELLE: { label: 'TGI Dakar - Correctionnelle', color: '#3f51b5', icon: '👨‍⚖️' },
    TGI_DAKAR_INSTRUCTION: { label: 'TGI Dakar - Instruction', color: '#3f51b5', icon: '🔍' },
    TGI_DAKAR_REFERES: { label: 'TGI Dakar - Référés', color: '#3f51b5', icon: '⚡' },
    TGI_DAKAR_COMMERCE: { label: 'TGI Dakar - Chambre Commerciale', color: '#00bcd4', icon: '💼' },

    // TGI Pikine
    TGI_PIKINE_CIVIL: { label: 'TGI Pikine - Civil', color: '#3f51b5', icon: '⚖️' },
    TGI_PIKINE_FDTR: { label: 'TGI Pikine - FDTR', color: '#3f51b5', icon: '📋' },
    TGI_PIKINE_CORRECTIONNELLE: { label: 'TGI Pikine - Correctionnelle', color: '#3f51b5', icon: '👨‍⚖️' },
    TGI_PIKINE_INSTRUCTION: { label: 'TGI Pikine - Instruction', color: '#3f51b5', icon: '🔍' },

    // TGI Guédiawaye
    TGI_GUEDIAWAYE_CIVIL: { label: 'TGI Guédiawaye - Civil', color: '#3f51b5', icon: '⚖️' },
    TGI_GUEDIAWAYE_FDTR: { label: 'TGI Guédiawaye - FDTR', color: '#3f51b5', icon: '📋' },
    TGI_GUEDIAWAYE_CORRECTIONNELLE: { label: 'TGI Guédiawaye - Correctionnelle', color: '#3f51b5', icon: '👨‍⚖️' },
    TGI_GUEDIAWAYE_INSTRUCTION: { label: 'TGI Guédiawaye - Instruction', color: '#3f51b5', icon: '🔍' },

    // TGI Rufisque
    TGI_RUFISQUE_CIVIL: { label: 'TGI Rufisque - Civil', color: '#3f51b5', icon: '⚖️' },
    TGI_RUFISQUE_FDTR: { label: 'TGI Rufisque - FDTR', color: '#3f51b5', icon: '📋' },
    TGI_RUFISQUE_CORRECTIONNELLE: { label: 'TGI Rufisque - Correctionnelle', color: '#3f51b5', icon: '👨‍⚖️' },
    TGI_RUFISQUE_INSTRUCTION: { label: 'TGI Rufisque - Instruction', color: '#3f51b5', icon: '🔍' },

    // TGI Keur Massar
    TGI_KEUR_MASSAR_CIVIL: { label: 'TGI Keur Massar - Civil', color: '#3f51b5', icon: '⚖️' },
    TGI_KEUR_MASSAR_FDTR: { label: 'TGI Keur Massar - FDTR', color: '#3f51b5', icon: '📋' },
    TGI_KEUR_MASSAR_CORRECTIONNELLE: { label: 'TGI Keur Massar - Correctionnelle', color: '#3f51b5', icon: '👨‍⚖️' },
    TGI_KEUR_MASSAR_INSTRUCTION: { label: 'TGI Keur Massar - Instruction', color: '#3f51b5', icon: '🔍' },

    // Travail
    TRAVAIL_DAKAR: { label: 'Travail Dakar', color: '#ff9800', icon: '👷' },
    TRAVAIL_PIKINE: { label: 'Travail Pikine', color: '#ff9800', icon: '👷' },
    TRAVAIL_RUFISQUE: { label: 'Travail Rufisque', color: '#ff9800', icon: '👷' },

    // Commerce
    TRIBUNAL_COMMERCE_DAKAR: { label: 'Tribunal de Commerce de Dakar', color: '#00bcd4', icon: '💼' },

    // Cours d'Appel & Hautes Juridictions
    CA_DAKAR_CIVIL_COMM: { label: 'CA Dakar - Civile & Commerciale', color: '#2196f3', icon: '⚖️' },
    CA_DAKAR_REFERES: { label: 'CA Dakar - Référés', color: '#2196f3', icon: '⚡' },
    CA_CORRECTIONNEL: { label: 'CA Correctionnel', color: '#2196f3', icon: '⚖️' },
    CA_CRIMINELLE: { label: 'CA Criminelle', color: '#f44336', icon: '🔴' },
    CA_SOCIAL: { label: 'CA Social', color: '#4caf50', icon: '🤝' },
    COUR_SUPREME: { label: 'Cour Suprême', color: '#b71c1c', icon: '🏛️' },
    CONSEIL_CONSTITUTIONNEL: { label: 'Conseil Constitutionnel', color: '#880e4f', icon: '📜' },
    COUR_DES_COMPTES: { label: 'Cour des Comptes', color: '#4a148c', icon: '🧮' },
    PJF: { label: 'Pool Judiciaire Financier (PJF)', color: '#d84315', icon: '💼' },
    CCJA_OHADA: { label: 'CCJA - OHADA (Abidjan)', color: '#00695c', icon: '🌍' },

    // Régions du Sénégal
    TI_THIES: { label: 'TI Thiès', color: '#6d4c41', icon: '🏛️' },
    TGI_THIES: { label: 'TGI Thiès', color: '#3949ab', icon: '⚖️' },
    TRAVAIL_THIES: { label: 'Travail Thiès', color: '#fb8c00', icon: '👷' },
    CA_THIES: { label: 'CA Thiès', color: '#1e88e5', icon: '🏛️' },
    TI_MBOUR: { label: 'TI Mbour', color: '#6d4c41', icon: '🏛️' },
    TGI_MBOUR: { label: 'TGI Mbour', color: '#3949ab', icon: '⚖️' },
    TI_SAINT_LOUIS: { label: 'TI Saint-Louis', color: '#6d4c41', icon: '🏛️' },
    TGI_SAINT_LOUIS: { label: 'TGI Saint-Louis', color: '#3949ab', icon: '⚖️' },
    TRAVAIL_SAINT_LOUIS: { label: 'Travail Saint-Louis', color: '#fb8c00', icon: '👷' },
    CA_SAINT_LOUIS: { label: 'CA Saint-Louis', color: '#1e88e5', icon: '🏛️' },
    TI_KAOLACK: { label: 'TI Kaolack', color: '#6d4c41', icon: '🏛️' },
    TGI_KAOLACK: { label: 'TGI Kaolack', color: '#3949ab', icon: '⚖️' },
    TRAVAIL_KAOLACK: { label: 'Travail Kaolack', color: '#fb8c00', icon: '👷' },
    CA_KAOLACK: { label: 'CA Kaolack', color: '#1e88e5', icon: '🏛️' },
    TI_ZIGUINCHOR: { label: 'TI Ziguinchor', color: '#6d4c41', icon: '🏛️' },
    TGI_ZIGUINCHOR: { label: 'TGI Ziguinchor', color: '#3949ab', icon: '⚖️' },
    TRAVAIL_ZIGUINCHOR: { label: 'Travail Ziguinchor', color: '#fb8c00', icon: '👷' },
    CA_ZIGUINCHOR: { label: 'CA Ziguinchor', color: '#1e88e5', icon: '🏛️' },
    TI_TAMBACOUNDA: { label: 'TI Tambacounda', color: '#6d4c41', icon: '🏛️' },
    TGI_TAMBACOUNDA: { label: 'TGI Tambacounda', color: '#3949ab', icon: '⚖️' },
    CA_TAMBACOUNDA: { label: 'CA Tambacounda', color: '#1e88e5', icon: '🏛️' },
    TI_DIOURBEL: { label: 'TI Diourbel', color: '#6d4c41', icon: '🏛️' },
    TGI_DIOURBEL: { label: 'TGI Diourbel', color: '#3949ab', icon: '⚖️' },
    TI_MBACKE: { label: 'TI Mbacké', color: '#6d4c41', icon: '🏛️' },
    TI_LOUGA: { label: 'TI Louga', color: '#6d4c41', icon: '🏛️' },
    TGI_LOUGA: { label: 'TGI Louga', color: '#3949ab', icon: '⚖️' },
    TI_FATICK: { label: 'TI Fatick', color: '#6d4c41', icon: '🏛️' },
    TGI_FATICK: { label: 'TGI Fatick', color: '#3949ab', icon: '⚖️' },
    TI_KOLDA: { label: 'TI Kolda', color: '#6d4c41', icon: '🏛️' },
    TGI_KOLDA: { label: 'TGI Kolda', color: '#3949ab', icon: '⚖️' },
    TI_MATAM: { label: 'TI Matam', color: '#6d4c41', icon: '🏛️' },
    TGI_MATAM: { label: 'TGI Matam', color: '#3949ab', icon: '⚖️' },
    TI_KAFFRINE: { label: 'TI Kaffrine', color: '#6d4c41', icon: '🏛️' },
    TGI_KAFFRINE: { label: 'TGI Kaffrine', color: '#3949ab', icon: '⚖️' },
    TI_KEDOUGOU: { label: 'TI Kédougou', color: '#6d4c41', icon: '🏛️' },
    TGI_KEDOUGOU: { label: 'TGI Kédougou', color: '#3949ab', icon: '⚖️' },
    TI_SEDHIOU: { label: 'TI Sédhiou', color: '#6d4c41', icon: '🏛️' },
    TGI_SEDHIOU: { label: 'TGI Sédhiou', color: '#3949ab', icon: '⚖️' },
    AUTRE: { label: 'Autre', color: '#607d8b', icon: '📌' },
};

// Regroupement des juridictions pour les listes déroulantes (source unique)
const CHAMBRE_GROUPS = [
    { label: "TI (Tribunaux d'Instance)", keys: ['TI_DAKAR', 'TI_PIKINE', 'TI_GUEDIAWAYE', 'TI_RUFISQUE', 'TI_KEUR_MASSAR', 'TI_FAMILLE'] },
    { label: 'TGI Dakar', keys: ['TGI_DAKAR_CIVIL', 'TGI_DAKAR_STATUT_PERSONNEL', 'TGI_DAKAR_FDTR', 'TGI_DAKAR_CORRECTIONNELLE', 'TGI_DAKAR_INSTRUCTION', 'TGI_DAKAR_REFERES', 'TGI_DAKAR_COMMERCE'] },
    { label: 'TGI Pikine', keys: ['TGI_PIKINE_CIVIL', 'TGI_PIKINE_FDTR', 'TGI_PIKINE_CORRECTIONNELLE', 'TGI_PIKINE_INSTRUCTION'] },
    { label: 'TGI Guédiawaye', keys: ['TGI_GUEDIAWAYE_CIVIL', 'TGI_GUEDIAWAYE_FDTR', 'TGI_GUEDIAWAYE_CORRECTIONNELLE', 'TGI_GUEDIAWAYE_INSTRUCTION'] },
    { label: 'TGI Rufisque', keys: ['TGI_RUFISQUE_CIVIL', 'TGI_RUFISQUE_FDTR', 'TGI_RUFISQUE_CORRECTIONNELLE', 'TGI_RUFISQUE_INSTRUCTION'] },
    { label: 'TGI Keur Massar', keys: ['TGI_KEUR_MASSAR_CIVIL', 'TGI_KEUR_MASSAR_FDTR', 'TGI_KEUR_MASSAR_CORRECTIONNELLE', 'TGI_KEUR_MASSAR_INSTRUCTION'] },
    { label: 'Tribunal du Travail', keys: ['TRAVAIL_DAKAR', 'TRAVAIL_PIKINE', 'TRAVAIL_RUFISQUE'] },
    { label: 'Commerce', keys: ['TRIBUNAL_COMMERCE_DAKAR'] },
    { label: "Cours d'Appel, Hautes Juridictions & OHADA", keys: ['CA_DAKAR_CIVIL_COMM', 'CA_DAKAR_REFERES', 'CA_CORRECTIONNEL', 'CA_CRIMINELLE', 'CA_SOCIAL', 'COUR_SUPREME', 'CONSEIL_CONSTITUTIONNEL', 'COUR_DES_COMPTES', 'PJF', 'CCJA_OHADA'] },
    { label: 'Régions — Thiès & Mbour', keys: ['TI_THIES', 'TGI_THIES', 'TRAVAIL_THIES', 'CA_THIES', 'TI_MBOUR', 'TGI_MBOUR'] },
    { label: 'Régions — Saint-Louis, Louga & Matam', keys: ['TI_SAINT_LOUIS', 'TGI_SAINT_LOUIS', 'TRAVAIL_SAINT_LOUIS', 'CA_SAINT_LOUIS', 'TI_LOUGA', 'TGI_LOUGA', 'TI_MATAM', 'TGI_MATAM'] },
    { label: 'Régions — Kaolack, Fatick, Diourbel & Kaffrine', keys: ['TI_KAOLACK', 'TGI_KAOLACK', 'TRAVAIL_KAOLACK', 'CA_KAOLACK', 'TI_DIOURBEL', 'TGI_DIOURBEL', 'TI_MBACKE', 'TI_FATICK', 'TGI_FATICK', 'TI_KAFFRINE', 'TGI_KAFFRINE'] },
    { label: 'Régions — Casamance & Sénégal Oriental', keys: ['TI_ZIGUINCHOR', 'TGI_ZIGUINCHOR', 'TRAVAIL_ZIGUINCHOR', 'CA_ZIGUINCHOR', 'TI_TAMBACOUNDA', 'TGI_TAMBACOUNDA', 'CA_TAMBACOUNDA', 'TI_KOLDA', 'TGI_KOLDA', 'TI_KEDOUGOU', 'TGI_KEDOUGOU', 'TI_SEDHIOU', 'TGI_SEDHIOU'] },
    { label: 'Autre', keys: ['AUTRE'] },
];

const STATUT_CONFIG = {
    PREVU: { label: 'Prévu', color: '#2196f3', icon: '📅' },
    REPORTE: { label: 'Renvoyé', color: '#ff9800', icon: '🔄' },
    TERMINE: { label: 'Terminé', color: '#4caf50', icon: '✅' },
    ANNULE: { label: 'Annulé', color: '#f44336', icon: '❌' },
};

const EVENT_TYPES = {
    AUDIENCE: { label: 'Audience', icon: '⚖️' },
    RDV: { label: 'Rendez-vous client', icon: '🤝' },
    REUNION: { label: 'Réunion', icon: '👥' },
    DEPLACEMENT: { label: 'Déplacement', icon: '🚗' },
    AUTRE: { label: 'Autre', icon: '📌' },
};

const MOTIFS_RENVOI = [
    'Renvoi pour conclusions',
    'Renvoi pour communication de pièces',
    'Renvoi à la demande de la partie adverse',
    'Renvoi à la demande du cabinet',
    'Renvoi pour plaidoiries',
    'Renvoi pour citation / mise en cause',
    'Renvoi pour comparution des parties',
    'Composition du tribunal / empêchement',
    'Délibéré prorogé',
];

const ISSUES = [
    { value: 'PLAIDEE_DELIBERE', label: 'Plaidée — mise en délibéré', help: "Fixez la date du délibéré : elle sera ajoutée automatiquement à l'agenda." },
    { value: 'DECISION_RENDUE', label: 'Décision rendue', help: 'Pensez à enregistrer la décision dans le dossier.' },
    { value: 'RADIEE', label: 'Affaire radiée du rôle', help: '' },
    { value: 'AUTRE', label: 'Autre / audience tenue', help: '' },
];

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8h-18h

const emptyForm = {
    title: '', event_type: 'AUDIENCE', type_chambre: 'TGI_DAKAR_CIVIL', type_chambre_autre: '',
    dossier_numero: '', dossier_nom: '', date_audience: '', heure_audience: '09:00',
    case: '', avocat_assigne: '', notes: '', location: '', color: CHAMBRE_COLORS.TGI_DAKAR_CIVIL.color, statut: 'PREVU'
};

// ── Helpers ──
const ymd = (d) => format(d, 'yyyy-MM-dd');
const hhmm = (t) => (t ? String(t).substring(0, 5) : '');
const safeParse = (s) => {
    if (!s) return null;
    const d = parseISO(s);
    return isValid(d) ? d : null;
};
const formatFr = (s, pattern = 'EEEE d MMMM yyyy') => {
    const d = safeParse(s);
    return d ? format(d, pattern, { locale: fr }) : (s || '');
};
const chambreCfg = (ev) => CHAMBRE_COLORS[ev?.type_chambre] || CHAMBRE_COLORS.AUTRE;
const chambreLabel = (ev) => (ev?.type_chambre === 'AUTRE' && ev?.type_chambre_autre ? ev.type_chambre_autre : chambreCfg(ev).label);
const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sortByDateTime = (a, b) => `${a.date_audience} ${hhmm(a.heure_audience)}`.localeCompare(`${b.date_audience} ${hhmm(b.heure_audience)}`);
const extractList = (res) => {
    const data = res?.data?.results || res?.data || [];
    return Array.isArray(data) ? data : [];
};
const formatApiError = (err, fallback) => {
    const detail = err?.response?.data;
    if (!detail) return fallback;
    if (typeof detail === 'string') return detail.substring(0, 300);
    return Object.entries(detail).map(([k, v]) => `${k} : ${[].concat(v).join(' ')}`).join(' | ').substring(0, 300);
};

function Agenda() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const routerNavigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const todayStr = ymd(new Date());

    // ── State ──
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 600 ? 'list' : 'month'));
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cases, setCases] = useState([]);
    const [avocats, setAvocats] = useState([]);
    const [overdue, setOverdue] = useState([]);
    const [upcoming, setUpcoming] = useState([]);
    const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
    const [saving, setSaving] = useState(false);

    // Dialogs
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [formData, setFormData] = useState({ ...emptyForm });
    const [selectedDay, setSelectedDay] = useState(null);
    const [dayDialogOpen, setDayDialogOpen] = useState(false);
    const [reportDialogOpen, setReportDialogOpen] = useState(false);
    const [reportTarget, setReportTarget] = useState(null);
    const [reportForm, setReportForm] = useState({ nouvelle_date: '', nouvelle_heure: '09:00', motif: '', notes: '' });
    const [closeDialogOpen, setCloseDialogOpen] = useState(false);
    const [closeTarget, setCloseTarget] = useState(null);
    const [closeForm, setCloseForm] = useState({ issue: 'PLAIDEE_DELIBERE', compte_rendu: '', date_delibere: '', heure_delibere: '' });
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [cancelTarget, setCancelTarget] = useState(null);
    const [cancelMotif, setCancelMotif] = useState('');
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    const [historyData, setHistoryData] = useState(null);

    // Filters
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [chambreFilter, setChambreFilter] = useState('ALL');
    const [statutFilter, setStatutFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [avocatFilter, setAvocatFilter] = useState('ALL');

    const currentYear = getYear(new Date());
    const years = useMemo(() => {
        const arr = [];
        for (let y = currentYear + 2; y >= currentYear - 5; y--) arr.push(y);
        return arr;
    }, [currentYear]);

    const showNotif = (message, severity = 'success') => setSnack({ open: true, message, severity });

    // ── Recherche avec anti-rebond (évite un appel API à chaque frappe) ──
    useEffect(() => {
        const t = setTimeout(() => setSearchQuery(searchInput.trim()), 350);
        return () => clearTimeout(t);
    }, [searchInput]);

    // ── Plage de dates affichée (inclut les jours débordant sur les mois voisins) ──
    const range = useMemo(() => {
        let start; let end;
        if (viewMode === 'month') {
            start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
            end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
        } else if (viewMode === 'week') {
            start = startOfWeek(currentDate, { weekStartsOn: 1 });
            end = endOfWeek(currentDate, { weekStartsOn: 1 });
        } else if (viewMode === 'day') {
            start = currentDate; end = currentDate;
        } else {
            start = startOfMonth(currentDate); end = endOfMonth(currentDate);
        }
        return { from: ymd(start), to: ymd(end) };
    }, [viewMode, currentDate]);

    // ── Data Loading ──
    const loadEvents = useCallback(async () => {
        setLoading(true);
        try {
            const params = { date_from: range.from, date_to: range.to, page_size: 'all' };
            if (searchQuery) params.search = searchQuery;
            if (chambreFilter !== 'ALL') params.type_chambre = chambreFilter;
            if (statutFilter !== 'ALL') params.statut = statutFilter;
            if (typeFilter !== 'ALL') params.event_type = typeFilter;
            if (avocatFilter !== 'ALL') params.avocat_assigne = avocatFilter;
            const res = await agendaAPI.getAll(params);
            setEvents(extractList(res));
        } catch (err) {
            console.error('Erreur chargement agenda:', err);
            showNotif("Impossible de charger l'agenda. Vérifiez votre connexion.", 'error');
        } finally {
            setLoading(false);
        }
    }, [range, searchQuery, chambreFilter, statutFilter, typeFilter, avocatFilter]);

    // Audiences à venir (7 jours) et audiences passées sans issue (à régulariser)
    const loadFocus = useCallback(async () => {
        try {
            const now = new Date();
            const [overdueRes, upcomingRes] = await Promise.all([
                agendaAPI.getAll({ statut: 'PREVU', date_to: ymd(addDays(now, -1)), page_size: 'all' }),
                agendaAPI.getAll({ statut: 'PREVU', date_from: ymd(now), date_to: ymd(addDays(now, 7)), page_size: 'all' }),
            ]);
            setOverdue(extractList(overdueRes).sort(sortByDateTime));
            setUpcoming(extractList(upcomingRes).sort(sortByDateTime));
        } catch (err) {
            console.error('Erreur chargement suivi agenda:', err);
        }
    }, []);

    const loadCases = useCallback(async () => {
        try {
            const res = await casesAPI.getAll({ page_size: 'all' });
            setCases(extractList(res));
        } catch (err) { console.error(err); }
    }, []);

    const loadAvocats = useCallback(async () => {
        try {
            const res = await agendaAPI.avocats();
            setAvocats(Array.isArray(res.data) ? res.data : []);
        } catch (err) { console.error(err); }
    }, []);

    const refreshAll = useCallback(() => { loadEvents(); loadFocus(); }, [loadEvents, loadFocus]);

    useEffect(() => { loadEvents(); }, [loadEvents]);
    useEffect(() => { loadFocus(); loadCases(); loadAvocats(); }, [loadFocus, loadCases, loadAvocats]);

    // ── Liens entrants depuis les autres pages (?caseId=, ?date=, ?search=) ──
    const urlHandled = useRef(false);
    useEffect(() => {
        if (urlHandled.current) return;
        urlHandled.current = true;
        const caseId = searchParams.get('caseId');
        const dateParam = safeParse(searchParams.get('date'));
        const searchParam = searchParams.get('search');

        if (searchParam) setSearchInput(searchParam);
        if (dateParam) {
            setCurrentDate(dateParam);
            setViewMode('day');
            setSelectedDay(dateParam);
            setDayDialogOpen(true);
        }
        if (caseId && /^\d+$/.test(caseId)) {
            casesAPI.getOne(caseId).then((res) => {
                const c = res.data;
                if (!c) return;
                setEditingEvent(null);
                setFormData({
                    ...emptyForm,
                    date_audience: todayStr,
                    case: c.id,
                    dossier_numero: c.reference || '',
                    dossier_nom: c.title || '',
                    title: `Audience ${c.reference || c.title || ''}`.trim(),
                });
                setDialogOpen(true);
            }).catch(() => showNotif('Dossier introuvable', 'error'));
        }
        if (caseId || dateParam || searchParam) setSearchParams({}, { replace: true });
    }, [searchParams, setSearchParams, todayStr]);

    // ── Navigation ──
    const goToday = () => setCurrentDate(new Date());
    const shift = (dir) => {
        if (viewMode === 'month' || viewMode === 'list') setCurrentDate(prev => dir > 0 ? addMonths(prev, 1) : subMonths(prev, 1));
        else if (viewMode === 'week') setCurrentDate(prev => dir > 0 ? addWeeks(prev, 1) : subWeeks(prev, 1));
        else setCurrentDate(prev => addDays(prev, dir));
    };
    const handleYearChange = (yr) => setCurrentDate(prev => setYear(prev, yr));

    // ── Events for day ──
    const eventsByDay = useMemo(() => {
        const map = {};
        [...events].sort(sortByDateTime).forEach(ev => {
            (map[ev.date_audience] = map[ev.date_audience] || []).push(ev);
        });
        return map;
    }, [events]);
    const getEventsForDay = (day) => eventsByDay[ymd(day)] || [];
    const bucketHour = (ev) => {
        if (!ev.heure_audience) return 8;
        const h = parseInt(String(ev.heure_audience).substring(0, 2), 10);
        if (Number.isNaN(h) || h < 8) return 8;
        return h > 18 ? 18 : h;
    };

    // ── Calendar Grid ──
    const calendarDays = useMemo(() => {
        const calStart = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
        const calEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
        const days = []; let d = calStart;
        while (d <= calEnd) { days.push(d); d = addDays(d, 1); }
        return days;
    }, [currentDate]);

    const weekDays = useMemo(() => {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    }, [currentDate]);

    const openDay = (day) => { setSelectedDay(day); setDayDialogOpen(true); };

    // ── CRUD Handlers ──
    const openCreateDialog = (day, hour) => {
        setEditingEvent(null);
        setFormData({
            ...emptyForm,
            date_audience: ymd(day || new Date()),
            heure_audience: hour ? `${String(hour).padStart(2, '0')}:00` : emptyForm.heure_audience,
        });
        setDialogOpen(true);
    };

    const openEditDialog = (ev) => {
        setEditingEvent(ev);
        setFormData({
            title: ev.title || '', event_type: ev.event_type || 'AUDIENCE',
            type_chambre: ev.type_chambre || 'AUTRE', type_chambre_autre: ev.type_chambre_autre || '',
            dossier_numero: ev.dossier_numero || '', dossier_nom: ev.dossier_nom || '',
            date_audience: ev.date_audience || '', heure_audience: hhmm(ev.heure_audience) || '09:00',
            case: ev.case || '', avocat_assigne: ev.avocat_assigne || '', notes: ev.notes || '', location: ev.location || '',
            color: ev.color || chambreCfg(ev).color, statut: ev.statut || 'PREVU'
        });
        setDialogOpen(true);
    };

    const handleCaseSelect = (c) => {
        if (!c) { setFormData(p => ({ ...p, case: '' })); return; }
        setFormData(p => ({
            ...p,
            case: c.id,
            dossier_numero: c.reference || p.dossier_numero,
            dossier_nom: c.title || p.dossier_nom,
            title: p.title || `Audience ${c.reference || c.title || ''}`.trim(),
        }));
    };

    const formConflicts = useMemo(() => {
        if (!dialogOpen || !formData.date_audience) return [];
        return events.filter(e =>
            e.id !== editingEvent?.id &&
            e.statut === 'PREVU' &&
            e.date_audience === formData.date_audience &&
            hhmm(e.heure_audience) === formData.heure_audience
        );
    }, [dialogOpen, events, editingEvent, formData.date_audience, formData.heure_audience]);

    const canSave = Boolean(formData.date_audience && formData.heure_audience &&
        (formData.title.trim() || formData.dossier_numero.trim() || formData.dossier_nom.trim()));

    const handleSave = async () => {
        if (!canSave || saving) return;
        setSaving(true);
        try {
            const payload = {
                ...formData,
                title: formData.title.trim() || formData.dossier_numero.trim() || formData.dossier_nom.trim(),
                case: formData.case || null,
                avocat_assigne: formData.avocat_assigne || null,
                color: chambreCfg(formData).color,
            };
            if (editingEvent) {
                await agendaAPI.update(editingEvent.id, payload);
                showNotif('Audience modifiée avec succès');
            } else {
                await agendaAPI.create(payload);
                showNotif('Audience ajoutée à l\'agenda');
            }
            setDialogOpen(false);
            refreshAll();
        } catch (err) {
            showNotif(formatApiError(err, 'Erreur lors de la sauvegarde'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (ev) => {
        if (!window.confirm(`Supprimer définitivement « ${ev.dossier_numero || ev.title} » du ${formatFr(ev.date_audience, 'dd/MM/yyyy')} ?\nPréférez « Annuler » pour garder une trace.`)) return;
        try {
            await agendaAPI.delete(ev.id);
            showNotif('Audience supprimée');
            refreshAll();
        } catch (err) { showNotif(formatApiError(err, 'Erreur lors de la suppression'), 'error'); }
    };

    // ── Renvoi (report) ──
    const openReportDialog = (ev) => {
        setReportTarget(ev);
        setReportForm({ nouvelle_date: '', nouvelle_heure: hhmm(ev.heure_audience) || '09:00', motif: '', notes: '' });
        setReportDialogOpen(true);
    };

    const quickReportDate = (days, months = 0) => {
        const base = safeParse(reportTarget?.date_audience) || new Date();
        const ref = base < new Date() ? new Date() : base;
        const d = months ? addMonths(ref, months) : addDays(ref, days);
        setReportForm(p => ({ ...p, nouvelle_date: ymd(d) }));
    };

    const handleReport = async () => {
        if (!reportForm.nouvelle_date) { showNotif('La nouvelle date est obligatoire', 'error'); return; }
        setSaving(true);
        try {
            await agendaAPI.reporter(reportTarget.id, reportForm);
            showNotif(`Affaire renvoyée au ${formatFr(reportForm.nouvelle_date, 'dd/MM/yyyy')} à ${reportForm.nouvelle_heure}`);
            setReportDialogOpen(false);
            refreshAll();
        } catch (err) { showNotif(formatApiError(err, 'Erreur lors du renvoi'), 'error'); }
        finally { setSaving(false); }
    };

    // ── Clôture (issue de l'audience) ──
    const openCloseDialog = (ev) => {
        setCloseTarget(ev);
        setCloseForm({ issue: 'PLAIDEE_DELIBERE', compte_rendu: '', date_delibere: '', heure_delibere: hhmm(ev.heure_audience) || '09:00' });
        setCloseDialogOpen(true);
    };

    const closeNeedsDate = closeForm.issue === 'PLAIDEE_DELIBERE';

    const handleClose = async () => {
        if (closeNeedsDate && !closeForm.date_delibere) { showNotif('Indiquez la date du délibéré', 'error'); return; }
        setSaving(true);
        try {
            const payload = { issue: closeForm.issue, compte_rendu: closeForm.compte_rendu };
            if (closeNeedsDate) {
                payload.date_delibere = closeForm.date_delibere;
                payload.heure_delibere = closeForm.heure_delibere;
            }
            await agendaAPI.terminer(closeTarget.id, payload);
            setCloseDialogOpen(false);
            refreshAll();
            if (closeNeedsDate) {
                showNotif(`Audience clôturée — délibéré fixé au ${formatFr(closeForm.date_delibere, 'dd/MM/yyyy')}`);
            } else {
                showNotif('Audience clôturée');
            }
            if (closeForm.issue === 'DECISION_RENDUE' && closeTarget.case &&
                window.confirm('Ouvrir le dossier pour enregistrer la décision rendue ?')) {
                routerNavigate(`/cases/${closeTarget.case}`);
            }
        } catch (err) { showNotif(formatApiError(err, 'Erreur lors de la clôture'), 'error'); }
        finally { setSaving(false); }
    };

    // ── Annulation ──
    const openCancelDialog = (ev) => { setCancelTarget(ev); setCancelMotif(''); setCancelDialogOpen(true); };
    const handleCancel = async () => {
        setSaving(true);
        try {
            await agendaAPI.annuler(cancelTarget.id, { motif: cancelMotif || 'Audience annulée' });
            showNotif('Audience annulée');
            setCancelDialogOpen(false);
            refreshAll();
        } catch (err) { showNotif(formatApiError(err, "Erreur lors de l'annulation"), 'error'); }
        finally { setSaving(false); }
    };

    // ── History ──
    const openHistory = async (dossierNumero) => {
        try {
            const res = await agendaAPI.historiqueDossier({ dossier_numero: dossierNumero });
            setHistoryData(res.data);
            setHistoryDialogOpen(true);
        } catch (err) { showNotif('Erreur chargement historique', 'error'); }
    };

    // ── Impression du rôle ──
    const printRole = () => {
        const list = [...events].filter(e => e.statut !== 'ANNULE').sort(sortByDateTime);
        const periode = viewMode === 'day'
            ? format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })
            : `du ${formatFr(range.from, 'dd/MM/yyyy')} au ${formatFr(range.to, 'dd/MM/yyyy')}`;
        let lastDay = '';
        const rows = list.map(ev => {
            const dayHeader = ev.date_audience !== lastDay
                ? `<tr class="day"><td colspan="6">${escapeHtml(formatFr(ev.date_audience))}</td></tr>` : '';
            lastDay = ev.date_audience;
            return `${dayHeader}<tr><td>${escapeHtml(hhmm(ev.heure_audience))}</td><td>${escapeHtml(chambreLabel(ev))}</td><td>${escapeHtml(ev.dossier_numero)}</td><td>${escapeHtml(ev.dossier_nom || ev.title)}</td><td>${escapeHtml(ev.avocat_assigne_name || '—')}</td><td>${escapeHtml((STATUT_CONFIG[ev.statut] || STATUT_CONFIG.PREVU).label)}</td><td>${escapeHtml(ev.location)}</td></tr>`;
        }).join('');
        const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Rôle des audiences</title>
<style>body{font-family:Arial,Helvetica,sans-serif;padding:24px;color:#111}h1{font-size:20px;margin:0 0 4px}p{margin:0 0 16px;color:#555}
table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #ccc;padding:6px;text-align:left;vertical-align:top}
th{background:#f1f5f9}tr.day td{background:#e0e7ff;font-weight:bold;text-transform:capitalize}</style></head>
<body><h1>Rôle des audiences du cabinet</h1><p>Période ${escapeHtml(periode)} — ${list.length} audience(s)</p>
<table><thead><tr><th>Heure</th><th>Juridiction / chambre</th><th>N° dossier</th><th>Parties / objet</th><th>Avocat</th><th>Statut</th><th>Lieu</th></tr></thead>
<tbody>${rows || '<tr><td colspan="7">Aucune audience sur la période.</td></tr>'}</tbody></table></body></html>`;
        const w = window.open('', '_blank');
        if (!w) { showNotif("Autorisez les fenêtres pop-up pour imprimer le rôle", 'warning'); return; }
        w.document.open(); w.document.write(html); w.document.close();
        w.focus();
        setTimeout(() => w.print(), 300);
    };

    // ── Copier le rôle pour WhatsApp ──
    const copyWhatsAppRole = async () => {
        const list = [...events].filter(e => e.statut !== 'ANNULE').sort(sortByDateTime);
        if (list.length === 0) { showNotif('Aucune audience à copier sur cette période', 'warning'); return; }
        let lastDay = '';
        const lines = ['*⚖️ RÔLE DES AUDIENCES*', ''];
        list.forEach(ev => {
            if (ev.date_audience !== lastDay) {
                lastDay = ev.date_audience;
                lines.push(`*📅 ${formatFr(ev.date_audience).toUpperCase()}*`);
            }
            const av = ev.avocat_assigne_name ? ` | 👨‍⚖️ Me ${ev.avocat_assigne_name}` : '';
            const loc = ev.location ? ` (${ev.location})` : '';
            const dos = ev.dossier_numero ? `${ev.dossier_numero} — ` : '';
            lines.push(`• *${hhmm(ev.heure_audience)}* · ${chambreLabel(ev)}${loc}\n  ${dos}${ev.dossier_nom || ev.title}${av}`);
        });
        try {
            await navigator.clipboard.writeText(lines.join('\n'));
            showNotif(`Rôle copié (${list.length} audience(s)) — prêt à coller sur WhatsApp`);
        } catch {
            showNotif('Copie impossible : autorisez le presse-papiers dans le navigateur', 'error');
        }
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

    const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';

    // ═══════ RENDER HELPERS ═══════
    const renderChambreOptions = (withIcon) => CHAMBRE_GROUPS.flatMap(g => [
        <ListSubheader key={`h-${g.label}`} sx={{ fontWeight: 800, color: 'primary.main', bgcolor: 'background.paper', lineHeight: '36px' }}>
            {g.label}
        </ListSubheader>,
        ...g.keys.map(key => (
            <MenuItem key={key} value={key} sx={{ pl: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircleIcon sx={{ fontSize: 10, color: CHAMBRE_COLORS[key].color }} />
                    {withIcon ? `${CHAMBRE_COLORS[key].icon} ` : ''}{CHAMBRE_COLORS[key].label}
                </Box>
            </MenuItem>
        )),
    ]);

    const renderEventChip = (ev, compact) => {
        const cfg = chambreCfg(ev);
        const statCfg = STATUT_CONFIG[ev.statut] || STATUT_CONFIG.PREVU;
        const late = ev.statut === 'PREVU' && ev.date_audience < todayStr;
        return (
            <Tooltip key={ev.id} arrow title={
                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{ev.dossier_numero || ev.title}</Typography>
                    <Typography variant="caption" display="block">{cfg.icon} {chambreLabel(ev)}</Typography>
                    {ev.dossier_nom && <Typography variant="caption" display="block">👥 {ev.dossier_nom}</Typography>}
                    <Typography variant="caption" display="block">🕐 {hhmm(ev.heure_audience)} · {statCfg.icon} {statCfg.label}</Typography>
                    {late && <Typography variant="caption" display="block" sx={{ color: '#fbbf24' }}>⚠️ Issue à renseigner</Typography>}
                </Box>
            }>
                <Box
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); openDay(parseISO(ev.date_audience)); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); openDay(parseISO(ev.date_audience)); } }}
                    sx={{
                        display: 'flex', alignItems: 'center', gap: 0.5,
                        px: 0.8, py: 0.2, mb: 0.3, borderRadius: '6px',
                        bgcolor: alpha(cfg.color, isDark ? 0.25 : 0.15),
                        borderLeft: `3px solid ${late ? '#f59e0b' : cfg.color}`,
                        cursor: 'pointer', transition: 'all 0.15s', overflow: 'hidden',
                        opacity: ev.statut === 'ANNULE' ? 0.5 : ev.statut === 'REPORTE' ? 0.7 : 1,
                        textDecoration: ev.statut === 'ANNULE' ? 'line-through' : 'none',
                        '&:hover': { bgcolor: alpha(cfg.color, isDark ? 0.4 : 0.25) },
                    }}
                >
                    <Typography sx={{ fontSize: '0.65rem', lineHeight: 1 }}>{cfg.icon}</Typography>
                    <Typography noWrap sx={{
                        fontSize: compact ? '0.65rem' : '0.7rem', fontWeight: 600,
                        color: isDark ? alpha(cfg.color, 1) : cfg.color, lineHeight: 1.3,
                    }}>
                        {compact && ev.heure_audience ? `${hhmm(ev.heure_audience)} ` : ''}{ev.dossier_numero || ev.title}
                    </Typography>
                    {late && <Typography sx={{ fontSize: '0.55rem' }}>⚠️</Typography>}
                    {ev.statut === 'REPORTE' && <Typography sx={{ fontSize: '0.55rem' }}>🔄</Typography>}
                    {ev.statut === 'TERMINE' && <Typography sx={{ fontSize: '0.55rem' }}>✅</Typography>}
                </Box>
            </Tooltip>
        );
    };

    // ═══════ MONTH VIEW ═══════
    const renderMonth = () => (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
            {DAYS_FR.map(d => (
                <Box key={d} sx={{
                    py: 1.2, textAlign: 'center', fontWeight: 700, fontSize: '0.8rem',
                    bgcolor: isDark ? alpha('#6366f1', 0.15) : alpha('#6366f1', 0.08),
                    color: isDark ? '#a5b4fc' : '#4338ca',
                    borderBottom: `1px solid ${borderColor}`,
                }}>{d}</Box>
            ))}
            {calendarDays.map((day) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isActive = isToday(day);
                return (
                    <Box key={ymd(day)}
                        onClick={() => openDay(day)}
                        sx={{
                            minHeight: { xs: 58, sm: 104 }, p: 0.5, minWidth: 0,
                            borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}`,
                            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}`,
                            bgcolor: isActive ? alpha('#6366f1', isDark ? 0.12 : 0.06) : !isCurrentMonth ? (isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)') : 'transparent',
                            cursor: 'pointer', transition: 'background 0.15s', opacity: isCurrentMonth ? 1 : 0.72,
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
                            {dayEvents.length > 0 && !isMobile && (
                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: 'text.secondary' }}>{dayEvents.length}</Typography>
                            )}
                        </Box>
                        {isMobile ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.3, px: 0.3 }}>
                                {dayEvents.slice(0, 6).map(ev => (
                                    <CircleIcon key={ev.id} sx={{ fontSize: 8, color: chambreCfg(ev).color, opacity: ev.statut === 'ANNULE' ? 0.4 : 1 }} />
                                ))}
                            </Box>
                        ) : (
                            <>
                                {dayEvents.slice(0, 3).map(ev => renderEventChip(ev, true))}
                                {dayEvents.length > 3 && (
                                    <Typography sx={{ fontSize: '0.65rem', color: 'primary.main', pl: 0.5, fontWeight: 700 }}>
                                        +{dayEvents.length - 3} autre(s)
                                    </Typography>
                                )}
                            </>
                        )}
                    </Box>
                );
            })}
        </Box>
    );

    // ═══════ WEEK VIEW ═══════
    const renderWeek = () => (
        <Box sx={{ overflowX: 'auto' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '56px repeat(7, minmax(90px, 1fr))', minWidth: 700 }}>
                <Box sx={{ borderBottom: `1px solid ${borderColor}`, bgcolor: isDark ? alpha('#6366f1', 0.1) : alpha('#6366f1', 0.05) }} />
                {weekDays.map((d, i) => (
                    <Box key={i} onClick={() => openDay(d)} sx={{
                        py: 1, textAlign: 'center', cursor: 'pointer',
                        borderBottom: `1px solid ${borderColor}`,
                        bgcolor: isToday(d) ? alpha('#6366f1', isDark ? 0.2 : 0.1) : (isDark ? alpha('#6366f1', 0.1) : alpha('#6366f1', 0.05)),
                    }}>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: isToday(d) ? '#6366f1' : 'text.secondary' }}>{DAYS_FR[i]}</Typography>
                        <Typography sx={{ fontSize: '1.1rem', fontWeight: isToday(d) ? 800 : 500, color: isToday(d) ? '#6366f1' : 'text.primary' }}>{format(d, 'd')}</Typography>
                    </Box>
                ))}
                {HOURS.map(hour => (
                    <React.Fragment key={hour}>
                        <Box sx={{ py: 1, px: 0.5, textAlign: 'right', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc'}`, color: 'text.disabled', fontSize: '0.7rem', fontWeight: 600 }}>
                            {hour === 8 ? '≤8h' : hour === 18 ? '≥18h' : `${hour}h`}
                        </Box>
                        {weekDays.map((d, i) => {
                            const slotEvents = getEventsForDay(d).filter(ev => bucketHour(ev) === hour);
                            return (
                                <Box key={i} onClick={() => openCreateDialog(d, hour)} sx={{
                                    minHeight: 48, p: 0.3, minWidth: 0,
                                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc'}`,
                                    borderLeft: `1px solid ${isDark ? 'rgba(255,255,255,0.03)' : '#f1f5f9'}`,
                                    cursor: 'copy', '&:hover': { bgcolor: isDark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.03)' },
                                }}>
                                    {slotEvents.map(ev => renderEventChip(ev, false))}
                                </Box>
                            );
                        })}
                    </React.Fragment>
                ))}
            </Box>
        </Box>
    );

    // ═══════ DAY VIEW ═══════
    const renderDay = () => (
        <Box>
            <Box sx={{ py: 1.5, textAlign: 'center', bgcolor: isDark ? alpha('#6366f1', 0.15) : alpha('#6366f1', 0.08) }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: isDark ? '#a5b4fc' : '#4338ca', textTransform: 'capitalize' }}>
                    {format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
                </Typography>
            </Box>
            {HOURS.map(hour => {
                const hourEvents = getEventsForDay(currentDate).filter(ev => bucketHour(ev) === hour);
                return (
                    <Box key={hour} onClick={() => openCreateDialog(currentDate, hour)} sx={{
                        display: 'flex', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}`,
                        cursor: 'copy', '&:hover': { bgcolor: isDark ? 'rgba(99,102,241,0.04)' : 'rgba(99,102,241,0.02)' },
                    }}>
                        <Box sx={{ width: 70, py: 1.5, textAlign: 'right', pr: 1.5, color: 'text.disabled', fontSize: '0.8rem', fontWeight: 600, borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}` }}>
                            {hour === 8 ? '≤ 8:00' : hour === 18 ? '≥ 18:00' : `${hour}:00`}
                        </Box>
                        <Box sx={{ flex: 1, p: 0.5, minHeight: 52, minWidth: 0 }}>
                            {hourEvents.map(ev => renderEventChip(ev, false))}
                        </Box>
                    </Box>
                );
            })}
        </Box>
    );

    // ═══════ LIST VIEW (Rôle) ═══════
    const renderList = () => {
        const days = Object.keys(eventsByDay).sort();
        if (days.length === 0) {
            return (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                    <Typography sx={{ color: 'text.secondary', mb: 2 }}>Aucune audience sur cette période.</Typography>
                    <Button variant="outlined" startIcon={<AddIcon />} onClick={() => openCreateDialog()}>Ajouter une audience</Button>
                </Box>
            );
        }
        return (
            <Box>
                {days.map(day => (
                    <Box key={day}>
                        <Box onClick={() => openDay(parseISO(day))} sx={{
                            px: 2, py: 1, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            bgcolor: day === todayStr ? alpha('#6366f1', isDark ? 0.25 : 0.12) : (isDark ? alpha('#6366f1', 0.1) : alpha('#6366f1', 0.05)),
                            borderBottom: `1px solid ${borderColor}`,
                        }}>
                            <Typography sx={{ fontWeight: 800, textTransform: 'capitalize', fontSize: '0.9rem' }}>
                                {formatFr(day)}{day === todayStr ? " · Aujourd'hui" : ''}
                            </Typography>
                            <Chip size="small" label={`${eventsByDay[day].length} audience(s)`} sx={{ fontWeight: 700 }} />
                        </Box>
                        {eventsByDay[day].map(ev => {
                            const cfg = chambreCfg(ev);
                            const statCfg = STATUT_CONFIG[ev.statut] || STATUT_CONFIG.PREVU;
                            const late = ev.statut === 'PREVU' && ev.date_audience < todayStr;
                            return (
                                <Box key={ev.id} onClick={() => openDay(parseISO(ev.date_audience))} sx={{
                                    display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.2, cursor: 'pointer',
                                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}`,
                                    borderLeft: `4px solid ${cfg.color}`,
                                    opacity: ev.statut === 'ANNULE' ? 0.55 : 1,
                                    '&:hover': { bgcolor: 'action.hover' },
                                }}>
                                    <Typography sx={{ fontWeight: 800, minWidth: 48, fontSize: '0.9rem' }}>{hhmm(ev.heure_audience)}</Typography>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography noWrap sx={{ fontWeight: 700, fontSize: '0.88rem' }}>
                                            {ev.dossier_numero ? `${ev.dossier_numero} — ` : ''}{ev.dossier_nom || ev.title}
                                        </Typography>
                                        <Typography noWrap sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                            {cfg.icon} {chambreLabel(ev)}{ev.location ? ` · ${ev.location}` : ''}
                                        </Typography>
                                    </Box>
                                    {late && <Chip size="small" icon={<WarningIcon />} label="Issue à renseigner" color="warning" variant="outlined" sx={{ display: { xs: 'none', md: 'flex' } }} />}
                                    <Chip size="small" label={statCfg.label} sx={{ bgcolor: alpha(statCfg.color, 0.15), color: statCfg.color, fontWeight: 700 }} />
                                </Box>
                            );
                        })}
                    </Box>
                ))}
            </Box>
        );
    };

    // ── Ligne compacte (panneaux « À venir » / « À régulariser ») ──
    const renderFocusRow = (ev, withActions) => {
        const cfg = chambreCfg(ev);
        return (
            <Box key={ev.id} sx={{
                display: 'flex', alignItems: 'center', gap: 1, py: 0.8, flexWrap: 'wrap',
                borderBottom: `1px dashed ${borderColor}`, '&:last-child': { borderBottom: 'none' },
            }}>
                <Box onClick={() => { const d = parseISO(ev.date_audience); setCurrentDate(d); openDay(d); }}
                    sx={{ flex: 1, minWidth: 180, cursor: 'pointer' }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
                        <Box component="span" sx={{ color: cfg.color }}>●</Box>{' '}
                        {formatFr(ev.date_audience, 'EEE d MMM')} · {hhmm(ev.heure_audience)} — {ev.dossier_numero || ev.title}
                    </Typography>
                    <Typography noWrap sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                        {chambreLabel(ev)}{ev.dossier_nom ? ` · ${ev.dossier_nom}` : ''}
                    </Typography>
                </Box>
                {withActions && (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Button size="small" variant="outlined" color="warning" onClick={() => openReportDialog(ev)} sx={{ textTransform: 'none', minWidth: 0, px: 1 }}>Renvoyer</Button>
                        <Button size="small" variant="contained" color="success" onClick={() => openCloseDialog(ev)} sx={{ textTransform: 'none', minWidth: 0, px: 1 }}>Clôturer</Button>
                    </Box>
                )}
            </Box>
        );
    };

    const periodLabel = () => {
        if (viewMode === 'month' || viewMode === 'list') return format(currentDate, 'MMMM yyyy', { locale: fr });
        if (viewMode === 'week') return `Semaine du ${format(weekDays[0], 'd MMM', { locale: fr })} au ${format(weekDays[6], 'd MMM yyyy', { locale: fr })}`;
        return format(currentDate, 'EEEE d MMM yyyy', { locale: fr });
    };

    const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];
    const selectedCase = cases.find(c => c.id === formData.case) || null;
    const activeIssue = ISSUES.find(i => i.value === closeForm.issue);

    // ═══════ RENDER ═══════
    return (
        <Box sx={{ pb: 4 }}>
            {/* ── HEADER ── */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <GavelIcon sx={{ fontSize: 36, color: '#6366f1' }} />
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-0.02em', fontSize: { xs: '1.6rem', sm: '2.125rem' } }}>Agenda du cabinet</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Gestion des audiences et procès — renvois, délibérés et suivi des dossiers
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button variant="outlined" startIcon={<CopyIcon />} onClick={copyWhatsAppRole} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
                        Copier pour WhatsApp
                    </Button>
                    <Button variant="outlined" startIcon={<PrintIcon />} onClick={printRole} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
                        Imprimer le rôle
                    </Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => openCreateDialog()}
                        sx={{ borderRadius: 2, px: 3, fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        Nouvelle audience
                    </Button>
                </Box>
            </Box>

            {/* ── SUIVI : À VENIR / À RÉGULARISER ── */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: `1px solid ${borderColor}`, height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <UpcomingIcon sx={{ color: '#2196f3' }} />
                            <Typography sx={{ fontWeight: 800, flex: 1 }}>À venir — 7 prochains jours</Typography>
                            <Chip size="small" label={upcoming.length} color="primary" />
                        </Box>
                        {upcoming.length === 0 ? (
                            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', py: 1 }}>Aucune audience prévue dans les 7 prochains jours.</Typography>
                        ) : (
                            <Box sx={{ maxHeight: 220, overflowY: 'auto' }}>
                                {upcoming.slice(0, 20).map(ev => renderFocusRow(ev, false))}
                            </Box>
                        )}
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{
                        p: 2, borderRadius: 3, height: '100%',
                        border: `1px solid ${overdue.length ? alpha('#f59e0b', 0.6) : borderColor}`,
                        bgcolor: overdue.length ? alpha('#f59e0b', isDark ? 0.08 : 0.04) : 'transparent',
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <WarningIcon sx={{ color: overdue.length ? '#f59e0b' : 'text.disabled' }} />
                            <Typography sx={{ fontWeight: 800, flex: 1 }}>À régulariser — audiences passées sans issue</Typography>
                            <Chip size="small" label={overdue.length} color={overdue.length ? 'warning' : 'default'} />
                        </Box>
                        {overdue.length === 0 ? (
                            <Typography sx={{ fontSize: '0.85rem', color: 'success.main', py: 1 }}>✓ Toutes les audiences passées ont une issue renseignée.</Typography>
                        ) : (
                            <>
                                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 0.5 }}>
                                    Indiquez pour chacune le renvoi obtenu ou l'issue (délibéré, décision…).
                                </Typography>
                                <Box sx={{ maxHeight: 220, overflowY: 'auto' }}>
                                    {overdue.slice(0, 30).map(ev => renderFocusRow(ev, true))}
                                </Box>
                            </>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* ── STATS CARDS (période affichée) ── */}
            <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: 3 }}>
                {[
                    { label: 'Total période', value: stats.total, color: '#6366f1', icon: '📊', filter: 'ALL' },
                    { label: 'Prévues', value: stats.prevu, color: '#2196f3', icon: '📅', filter: 'PREVU' },
                    { label: 'Renvoyées', value: stats.reporte, color: '#ff9800', icon: '🔄', filter: 'REPORTE' },
                    { label: 'Terminées', value: stats.termine, color: '#4caf50', icon: '✅', filter: 'TERMINE' },
                    { label: 'Annulées', value: stats.annule, color: '#f44336', icon: '❌', filter: 'ANNULE' },
                ].map(s => {
                    const active = statutFilter === s.filter;
                    return (
                        <Grid item xs={4} sm={2.4} key={s.label}>
                            <Paper
                                elevation={active ? 4 : 0}
                                onClick={() => setStatutFilter(active && s.filter !== 'ALL' ? 'ALL' : s.filter)}
                                sx={{
                                    p: { xs: 1, sm: 1.5 }, borderRadius: 3, textAlign: 'center', cursor: 'pointer', position: 'relative',
                                    border: `1px solid ${active ? s.color : borderColor}`,
                                    background: active ? alpha(s.color, isDark ? 0.15 : 0.08) : alpha(s.color, isDark ? 0.08 : 0.04),
                                    transition: 'all 0.2s ease-in-out',
                                    '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 16px ${alpha(s.color, 0.15)}` }
                                }}>
                                <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.1rem', sm: '1.4rem' }, color: s.color }}>{s.icon} {s.value}</Typography>
                                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 600 }}>{s.label}</Typography>
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>

            {/* ── TOOLBAR ── */}
            <Paper elevation={0} sx={{
                p: 2, mb: 2, borderRadius: 3, border: `1px solid ${borderColor}`,
                display: 'flex', flexDirection: 'column', gap: 1.5,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <IconButton onClick={() => shift(-1)} size="small" aria-label="Période précédente"><ChevronLeft /></IconButton>
                        <Button onClick={goToday} size="small" variant="outlined" startIcon={<TodayIcon />} sx={{ textTransform: 'none', fontWeight: 600 }}>Aujourd'hui</Button>
                        <IconButton onClick={() => shift(1)} size="small" aria-label="Période suivante"><ChevronRight /></IconButton>
                        <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.95rem', sm: '1.1rem' }, textTransform: 'capitalize', ml: 0.5 }}>
                            {periodLabel()}
                        </Typography>
                    </Box>
                    <ToggleButtonGroup value={viewMode} exclusive onChange={(e, v) => v && setViewMode(v)} size="small">
                        <ToggleButton value="list" aria-label="Rôle"><ListIcon sx={{ mr: { sm: 0.5 }, fontSize: 18 }} /><Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Rôle</Box></ToggleButton>
                        <ToggleButton value="month" aria-label="Mois"><CalendarIcon sx={{ mr: { sm: 0.5 }, fontSize: 18 }} /><Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Mois</Box></ToggleButton>
                        <ToggleButton value="week" aria-label="Semaine"><WeekIcon sx={{ mr: { sm: 0.5 }, fontSize: 18 }} /><Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Semaine</Box></ToggleButton>
                        <ToggleButton value="day" aria-label="Jour"><DayIcon sx={{ mr: { sm: 0.5 }, fontSize: 18 }} /><Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Jour</Box></ToggleButton>
                    </ToggleButtonGroup>
                </Box>
                <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr 1fr', md: '2fr 0.9fr 1.3fr 1.1fr 1fr 1fr' } }}>
                    <TextField size="small" placeholder="N° dossier, parties, lieu…" value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment>,
                            endAdornment: searchInput ? <InputAdornment position="end"><IconButton size="small" onClick={() => setSearchInput('')} aria-label="Effacer"><CloseIcon sx={{ fontSize: 16 }} /></IconButton></InputAdornment> : null,
                        }}
                        sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}
                    />
                    <FormControl size="small">
                        <InputLabel>Année</InputLabel>
                        <Select value={getYear(currentDate)} label="Année" onChange={(e) => handleYearChange(e.target.value)}>
                            {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small">
                        <InputLabel>Juridiction</InputLabel>
                        <Select value={chambreFilter} label="Juridiction" onChange={(e) => setChambreFilter(e.target.value)}>
                            <MenuItem value="ALL">Toutes</MenuItem>
                            {renderChambreOptions(false)}
                        </Select>
                    </FormControl>
                    <FormControl size="small">
                        <InputLabel>Type</InputLabel>
                        <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value)}>
                            <MenuItem value="ALL">Tous</MenuItem>
                            {Object.entries(EVENT_TYPES).map(([key, cfg]) => <MenuItem key={key} value={key}>{cfg.icon} {cfg.label}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small">
                        <InputLabel>Avocat</InputLabel>
                        <Select value={avocatFilter} label="Avocat" onChange={(e) => setAvocatFilter(e.target.value)}>
                            <MenuItem value="ALL">Tous</MenuItem>
                            {avocats.map(a => <MenuItem key={a.id} value={String(a.id)}>👨‍⚖️ {a.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small">
                        <InputLabel>Statut</InputLabel>
                        <Select value={statutFilter} label="Statut" onChange={(e) => setStatutFilter(e.target.value)}>
                            <MenuItem value="ALL">Tous</MenuItem>
                            {Object.entries(STATUT_CONFIG).map(([key, cfg]) => (
                                <MenuItem key={key} value={key}>{cfg.icon} {cfg.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
                {(searchQuery || chambreFilter !== 'ALL' || statutFilter !== 'ALL' || typeFilter !== 'ALL' || avocatFilter !== 'ALL') && (
                    <Box>
                        <Button size="small" onClick={() => { setSearchInput(''); setChambreFilter('ALL'); setStatutFilter('ALL'); setTypeFilter('ALL'); setAvocatFilter('ALL'); }} sx={{ textTransform: 'none' }}>
                            Réinitialiser les filtres
                        </Button>
                    </Box>
                )}
            </Paper>

            {/* ── LOADING ── */}
            {loading && <LinearProgress sx={{ mb: 1, borderRadius: 2 }} />}

            {/* ── CALENDAR ── */}
            <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: `1px solid ${borderColor}` }}>
                {viewMode === 'month' && renderMonth()}
                {viewMode === 'week' && renderWeek()}
                {viewMode === 'day' && renderDay()}
                {viewMode === 'list' && renderList()}
            </Paper>
            {(viewMode === 'week' || viewMode === 'day') && (
                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 1 }}>
                    Astuce : cliquez sur un créneau vide pour programmer une audience à cette heure.
                </Typography>
            )}

            {/* ── LÉGENDE ── */}
            <Paper elevation={0} sx={{ p: 2, mt: 2, borderRadius: 3, border: `1px solid ${borderColor}` }}>
                <Typography sx={{ fontWeight: 800, mb: 1, fontSize: '0.85rem' }}>🎨 Juridictions (cliquez pour filtrer)</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                    {Object.entries(CHAMBRE_COLORS).map(([key, cfg]) => (
                        <Chip key={key} label={`${cfg.icon} ${cfg.label}`} size="small"
                            onClick={() => setChambreFilter(chambreFilter === key ? 'ALL' : key)}
                            sx={{
                                bgcolor: alpha(cfg.color, chambreFilter === key ? 0.4 : (isDark ? 0.2 : 0.12)),
                                color: isDark ? alpha(cfg.color, 1) : 'text.primary',
                                fontWeight: 700, fontSize: '0.72rem', border: `1px solid ${alpha(cfg.color, 0.45)}`,
                                cursor: 'pointer',
                            }} />
                    ))}
                </Box>
            </Paper>

            {/* ═══ DAY DETAIL DIALOG ═══ */}
            <Dialog open={dayDialogOpen} onClose={() => setDayDialogOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, textTransform: 'capitalize' }}>
                        <GavelIcon />
                        <span>{selectedDay && format(selectedDay, 'EEEE d MMMM yyyy', { locale: fr })}</span>
                    </Box>
                    <IconButton onClick={() => setDayDialogOpen(false)} size="small" aria-label="Fermer"><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {loading && <LinearProgress sx={{ mb: 1 }} />}
                    {selectedDayEvents.length === 0 ? (
                        <Typography sx={{ py: 3, textAlign: 'center', color: 'text.disabled' }}>Aucune audience ce jour</Typography>
                    ) : (
                        selectedDayEvents.map(ev => {
                            const cfg = chambreCfg(ev);
                            const statCfg = STATUT_CONFIG[ev.statut] || STATUT_CONFIG.PREVU;
                            const late = ev.statut === 'PREVU' && ev.date_audience < todayStr;
                            const typeCfg = EVENT_TYPES[ev.event_type] || EVENT_TYPES.AUDIENCE;
                            return (
                                <Card key={ev.id} elevation={0} sx={{
                                    mb: 1.5, border: `1px solid ${alpha(cfg.color, 0.3)}`,
                                    borderLeft: `4px solid ${cfg.color}`, borderRadius: 2,
                                    opacity: ev.statut === 'ANNULE' ? 0.65 : 1,
                                }}>
                                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                                            <Typography sx={{ fontWeight: 800, fontSize: '0.95rem' }}>
                                                {hhmm(ev.heure_audience)} · {ev.dossier_numero || ev.title}
                                            </Typography>
                                            <Chip label={statCfg.label} size="small" sx={{ bgcolor: alpha(statCfg.color, 0.15), color: statCfg.color, fontWeight: 700, fontSize: '0.65rem', height: 22 }} />
                                            {ev.event_type && ev.event_type !== 'AUDIENCE' && <Chip label={`${typeCfg.icon} ${typeCfg.label}`} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.65rem' }} />}
                                            {late && <Chip icon={<WarningIcon />} label="Issue à renseigner" size="small" color="warning" sx={{ height: 22, fontSize: '0.65rem' }} />}
                                        </Box>
                                        {ev.dossier_nom && <Typography sx={{ fontSize: '0.85rem', mb: 0.3 }}>👥 {ev.dossier_nom}</Typography>}
                                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{cfg.icon} {chambreLabel(ev)}</Typography>
                                            {ev.location && <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                                <LocationIcon sx={{ fontSize: 13 }} />{ev.location}
                                            </Typography>}
                                            {ev.avocat_assigne_name && <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.3 }}><PersonIcon sx={{ fontSize: 13 }} />Me {ev.avocat_assigne_name}</Typography>}
                                            {ev.case_reference && <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>📁 {ev.case_reference}</Typography>}
                                        </Box>
                                        {ev.notes && <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.5, whiteSpace: 'pre-line' }}>{ev.notes}</Typography>}
                                        {ev.reporte_de_info && (
                                            <Typography sx={{ fontSize: '0.7rem', color: '#ff9800', mt: 0.5 }}>
                                                🔄 Renvoi de l'audience du {formatFr(ev.reporte_de_info.date_audience, 'dd/MM/yyyy')}
                                            </Typography>
                                        )}
                                        {ev.motif_report && <Typography sx={{ fontSize: '0.7rem', color: '#ff9800', mt: 0.3 }}>Motif du renvoi : {ev.motif_report}</Typography>}
                                        {ev.nb_reports > 0 && (
                                            <Typography sx={{ fontSize: '0.7rem', color: '#ff9800', mt: 0.3 }}>↪ {ev.nb_reports} audience(s) suivante(s)</Typography>
                                        )}
                                        <Divider sx={{ my: 1 }} />
                                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                                            {ev.statut === 'PREVU' && (
                                                <>
                                                    <Button size="small" variant="outlined" color="warning" startIcon={<ReportIcon />} onClick={() => openReportDialog(ev)} sx={{ textTransform: 'none' }}>Renvoyer</Button>
                                                    <Button size="small" variant="outlined" color="success" startIcon={<CheckIcon />} onClick={() => openCloseDialog(ev)} sx={{ textTransform: 'none' }}>Clôturer</Button>
                                                    <Button size="small" color="error" startIcon={<CancelIcon />} onClick={() => openCancelDialog(ev)} sx={{ textTransform: 'none' }}>Annuler</Button>
                                                </>
                                            )}
                                            {ev.case && (
                                                <Button size="small" startIcon={<FolderOpenIcon />} onClick={() => routerNavigate(`/cases/${ev.case}`)} sx={{ textTransform: 'none' }}>Ouvrir le dossier</Button>
                                            )}
                                            {ev.dossier_numero && (
                                                <Button size="small" startIcon={<HistoryIcon />} onClick={() => openHistory(ev.dossier_numero)} sx={{ textTransform: 'none' }}>Historique</Button>
                                            )}
                                            <Box sx={{ flex: 1 }} />
                                            <Tooltip title="Modifier"><IconButton size="small" onClick={() => { setDayDialogOpen(false); openEditDialog(ev); }} aria-label="Modifier"><EditIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                                            <Tooltip title="Supprimer"><IconButton size="small" onClick={() => handleDelete(ev)} color="error" aria-label="Supprimer"><DeleteIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                                        </Box>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDayDialogOpen(false)}>Fermer</Button>
                    <Button variant="contained" startIcon={<AddIcon />}
                        onClick={() => { setDayDialogOpen(false); openCreateDialog(selectedDay); }}>
                        Ajouter ce jour
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ═══ CREATE / EDIT DIALOG ═══ */}
            <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
                    {editingEvent ? <><EditIcon sx={{ mr: 1 }} />Modifier l'audience</> : <><AddIcon sx={{ mr: 1 }} />Nouvelle audience</>}
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>1. Dossier</Typography>
                        <Autocomplete
                            options={cases}
                            value={selectedCase}
                            onChange={(e, v) => handleCaseSelect(v)}
                            getOptionLabel={(c) => `${c.reference || ''} — ${c.title || ''}`}
                            isOptionEqualToValue={(o, v) => o.id === v.id}
                            noOptionsText="Aucun dossier"
                            renderInput={(params) => <TextField {...params} label="Dossier du cabinet (recommandé)" helperText="Remplit automatiquement le n° et les parties, et relie l'audience au dossier" />}
                        />
                        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                            <TextField label="N° de dossier / RG" fullWidth value={formData.dossier_numero}
                                onChange={e => setFormData(p => ({ ...p, dossier_numero: e.target.value }))}
                                helperText="Sert à suivre l'historique des renvois" />
                            <TextField label="Type" select fullWidth value={formData.event_type}
                                onChange={e => setFormData(p => ({ ...p, event_type: e.target.value }))}>
                                {Object.entries(EVENT_TYPES).map(([key, cfg]) => <MenuItem key={key} value={key}>{cfg.icon} {cfg.label}</MenuItem>)}
                            </TextField>
                        </Box>
                        <TextField label="Parties (ex : X c/ Y)" fullWidth value={formData.dossier_nom}
                            onChange={e => setFormData(p => ({ ...p, dossier_nom: e.target.value }))} />
                        <TextField label="Intitulé" fullWidth value={formData.title}
                            placeholder="Ex : Plaidoiries, mise en état, comparution…"
                            onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} />

                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mt: 1 }}>2. Juridiction et date</Typography>
                        <TextField label="Juridiction / chambre" select fullWidth required value={formData.type_chambre}
                            onChange={e => setFormData(p => ({ ...p, type_chambre: e.target.value }))}>
                            {renderChambreOptions(true)}
                        </TextField>
                        {formData.type_chambre === 'AUTRE' && (
                            <TextField label="Précisez la juridiction" fullWidth value={formData.type_chambre_autre}
                                onChange={e => setFormData(p => ({ ...p, type_chambre_autre: e.target.value }))} />
                        )}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField label="Date" type="date" fullWidth required
                                InputLabelProps={{ shrink: true }} value={formData.date_audience}
                                onChange={e => setFormData(p => ({ ...p, date_audience: e.target.value }))} />
                            <TextField label="Heure" type="time" fullWidth required
                                InputLabelProps={{ shrink: true }} value={formData.heure_audience}
                                onChange={e => setFormData(p => ({ ...p, heure_audience: e.target.value }))} />
                        </Box>
                        {formConflicts.length > 0 && (
                            <Alert severity="warning">
                                Conflit d'horaire : {formConflicts.length} autre(s) audience(s) à {formData.heure_audience} ce jour
                                ({formConflicts.map(c => c.dossier_numero || c.title).join(', ')}).
                            </Alert>
                        )}
                        {!editingEvent && formData.date_audience && formData.date_audience < todayStr && (
                            <Alert severity="info">Date passée : pensez ensuite à renseigner l'issue (renvoi ou clôture).</Alert>
                        )}
                        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                            <TextField label="Avocat plaidant" select fullWidth value={formData.avocat_assigne}
                                onChange={e => setFormData(p => ({ ...p, avocat_assigne: e.target.value }))}>
                                <MenuItem value="">— Non assigné —</MenuItem>
                                {avocats.map(a => <MenuItem key={a.id} value={a.id}>👨‍⚖️ {a.name}</MenuItem>)}
                            </TextField>
                            <TextField label="Salle / lieu" fullWidth value={formData.location}
                                onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} />
                        </Box>
                        {editingEvent && (
                            <TextField label="Statut" select fullWidth value={formData.statut}
                                onChange={e => setFormData(p => ({ ...p, statut: e.target.value }))}
                                helperText="Pour un renvoi ou une clôture, utilisez plutôt les boutons dédiés (historique conservé)">
                                {Object.entries(STATUT_CONFIG).map(([key, cfg]) => (
                                    <MenuItem key={key} value={key}>{cfg.icon} {cfg.label}</MenuItem>
                                ))}
                            </TextField>
                        )}
                        <TextField label="Notes (pièces à produire, diligences…)" fullWidth multiline rows={3} value={formData.notes}
                            onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)} disabled={saving}>Annuler</Button>
                    <Button variant="contained" onClick={handleSave} disabled={!canSave || saving}>
                        {saving ? 'Enregistrement…' : (editingEvent ? 'Enregistrer' : 'Ajouter à l\'agenda')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ═══ RENVOI DIALOG ═══ */}
            <Dialog open={reportDialogOpen} onClose={() => !saving && setReportDialogOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}><ReportIcon sx={{ mr: 1, color: '#ff9800' }} />Renvoyer l'affaire</DialogTitle>
                <DialogContent dividers>
                    {reportTarget && (
                        <Box>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                <Typography variant="subtitle2">{reportTarget.dossier_numero || reportTarget.title}{reportTarget.dossier_nom ? ` — ${reportTarget.dossier_nom}` : ''}</Typography>
                                <Typography variant="caption">
                                    Audience du {formatFr(reportTarget.date_audience, 'dd/MM/yyyy')} à {hhmm(reportTarget.heure_audience)} · {chambreLabel(reportTarget)}
                                </Typography>
                            </Alert>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, mb: 1 }}>Renvoyé au :</Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                {[['+1 sem.', 7], ['+2 sem.', 14], ['+3 sem.', 21], ['+1 mois', 0, 1], ['+2 mois', 0, 2]].map(([label, days, months]) => (
                                    <Chip key={label} label={label} onClick={() => quickReportDate(days, months)} clickable variant="outlined" />
                                ))}
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField label="Nouvelle date" type="date" fullWidth required
                                        InputLabelProps={{ shrink: true }} value={reportForm.nouvelle_date}
                                        onChange={e => setReportForm(p => ({ ...p, nouvelle_date: e.target.value }))} />
                                    <TextField label="Heure" type="time" fullWidth required
                                        InputLabelProps={{ shrink: true }} value={reportForm.nouvelle_heure}
                                        onChange={e => setReportForm(p => ({ ...p, nouvelle_heure: e.target.value }))} />
                                </Box>
                                {reportForm.nouvelle_date && reportForm.nouvelle_date <= (reportTarget.date_audience || '') && (
                                    <Alert severity="warning">La nouvelle date est antérieure ou égale à l'audience d'origine.</Alert>
                                )}
                                <Autocomplete
                                    freeSolo
                                    options={MOTIFS_RENVOI}
                                    inputValue={reportForm.motif}
                                    onInputChange={(e, v) => setReportForm(p => ({ ...p, motif: v }))}
                                    renderInput={(params) => <TextField {...params} label="Motif du renvoi" placeholder="Choisir ou saisir un motif" />}
                                />
                                <TextField label="Diligences pour la prochaine audience" fullWidth multiline rows={2} value={reportForm.notes}
                                    placeholder="Ex : conclusions en réplique à déposer, pièces à communiquer…"
                                    onChange={e => setReportForm(p => ({ ...p, notes: e.target.value }))} />
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReportDialogOpen(false)} disabled={saving}>Annuler</Button>
                    <Button variant="contained" onClick={handleReport} disabled={!reportForm.nouvelle_date || saving}
                        sx={{ bgcolor: '#ff9800', '&:hover': { bgcolor: '#f57c00' } }}>
                        Confirmer le renvoi
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ═══ CLÔTURE DIALOG ═══ */}
            <Dialog open={closeDialogOpen} onClose={() => !saving && setCloseDialogOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}><CheckIcon sx={{ mr: 1, color: '#4caf50' }} />Issue de l'audience</DialogTitle>
                <DialogContent dividers>
                    {closeTarget && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Alert severity="info">
                                <Typography variant="subtitle2">{closeTarget.dossier_numero || closeTarget.title}{closeTarget.dossier_nom ? ` — ${closeTarget.dossier_nom}` : ''}</Typography>
                                <Typography variant="caption">Audience du {formatFr(closeTarget.date_audience, 'dd/MM/yyyy')} à {hhmm(closeTarget.heure_audience)} · {chambreLabel(closeTarget)}</Typography>
                            </Alert>
                            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                                L'affaire a été renvoyée ? Utilisez plutôt « Renvoyer » pour conserver la chaîne des renvois.
                            </Typography>
                            <RadioGroup value={closeForm.issue} onChange={(e) => setCloseForm(p => ({ ...p, issue: e.target.value }))}>
                                {ISSUES.map(i => <FormControlLabel key={i.value} value={i.value} control={<Radio />} label={i.label} />)}
                            </RadioGroup>
                            {activeIssue?.help && <Alert severity="success" icon={false}>{activeIssue.help}</Alert>}
                            {closeNeedsDate && (
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField label="Date du délibéré" type="date" fullWidth required InputLabelProps={{ shrink: true }}
                                        value={closeForm.date_delibere} onChange={e => setCloseForm(p => ({ ...p, date_delibere: e.target.value }))} />
                                    <TextField label="Heure" type="time" fullWidth InputLabelProps={{ shrink: true }}
                                        value={closeForm.heure_delibere} onChange={e => setCloseForm(p => ({ ...p, heure_delibere: e.target.value }))} />
                                </Box>
                            )}
                            <TextField label="Compte-rendu d'audience" fullWidth multiline rows={3} value={closeForm.compte_rendu}
                                placeholder="Ce qui s'est passé, réquisitions, demandes du tribunal…"
                                onChange={e => setCloseForm(p => ({ ...p, compte_rendu: e.target.value }))} />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCloseDialogOpen(false)} disabled={saving}>Annuler</Button>
                    <Button variant="contained" color="success" onClick={handleClose} disabled={saving || (closeNeedsDate && !closeForm.date_delibere)}>
                        Clôturer l'audience
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ═══ ANNULATION DIALOG ═══ */}
            <Dialog open={cancelDialogOpen} onClose={() => !saving && setCancelDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}><CancelIcon sx={{ mr: 1, color: '#f44336' }} />Annuler l'audience</DialogTitle>
                <DialogContent dividers>
                    <Typography sx={{ fontSize: '0.85rem', mb: 2 }}>
                        {cancelTarget?.dossier_numero || cancelTarget?.title} — {formatFr(cancelTarget?.date_audience, 'dd/MM/yyyy')} à {hhmm(cancelTarget?.heure_audience)}
                    </Typography>
                    <TextField label="Motif de l'annulation" fullWidth multiline rows={2} value={cancelMotif}
                        onChange={e => setCancelMotif(e.target.value)} placeholder="Ex : désistement, transaction, erreur de saisie…" />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCancelDialogOpen(false)} disabled={saving}>Retour</Button>
                    <Button variant="contained" color="error" onClick={handleCancel} disabled={saving}>Confirmer l'annulation</Button>
                </DialogActions>
            </Dialog>

            {/* ═══ HISTORY DIALOG ═══ */}
            <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}><HistoryIcon sx={{ mr: 1 }} />Historique du dossier {historyData?.dossier_numero}</DialogTitle>
                <DialogContent dividers>
                    {historyData && (
                        <Box>
                            <Typography sx={{ fontWeight: 700, mb: 1 }}>📅 Audiences ({historyData.entries?.length || 0})</Typography>
                            {historyData.entries?.map(entry => {
                                const statCfg = STATUT_CONFIG[entry.statut] || STATUT_CONFIG.PREVU;
                                return (
                                    <Card key={entry.id} elevation={0} sx={{
                                        mb: 1, border: `1px solid ${alpha(statCfg.color, 0.3)}`, borderLeft: `4px solid ${statCfg.color}`, borderRadius: 2,
                                    }}>
                                        <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                                                        {formatFr(entry.date_audience, 'dd/MM/yyyy')} à {hhmm(entry.heure_audience)} — {chambreLabel(entry)}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{entry.dossier_nom}</Typography>
                                                    {entry.motif_report && <Typography sx={{ fontSize: '0.7rem', color: '#ff9800', fontStyle: 'italic' }}>Motif : {entry.motif_report}</Typography>}
                                                    {entry.notes && <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', whiteSpace: 'pre-line' }}>{entry.notes}</Typography>}
                                                </Box>
                                                <Chip label={statCfg.label} size="small" sx={{ bgcolor: alpha(statCfg.color, 0.15), color: statCfg.color, fontWeight: 700 }} />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                            <Typography sx={{ fontWeight: 700, mb: 1, mt: 2 }}>📝 Journal des modifications ({historyData.history?.length || 0})</Typography>
                            {historyData.history?.map(h => (
                                <Box key={h.id} sx={{ display: 'flex', gap: 1, py: 0.8, borderBottom: '1px solid', borderColor: 'divider', flexWrap: 'wrap' }}>
                                    <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', minWidth: 110 }}>
                                        {h.date_action && safeParse(h.date_action) ? format(parseISO(h.date_action), 'dd/MM/yy HH:mm') : ''}
                                    </Typography>
                                    <Chip label={h.type_action_display} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
                                    <Typography sx={{ fontSize: '0.75rem', flex: 1, minWidth: 160 }}>{h.commentaire}</Typography>
                                    <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{h.utilisateur_name}</Typography>
                                </Box>
                            ))}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions><Button onClick={() => setHistoryDialogOpen(false)}>Fermer</Button></DialogActions>
            </Dialog>

            {/* ── SNACKBAR ── */}
            <Snackbar open={snack.open} autoHideDuration={4500} onClose={() => setSnack(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ width: '100%' }}>
                    {snack.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default Agenda;
