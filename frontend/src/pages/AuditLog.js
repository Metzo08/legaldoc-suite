import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNotification } from '../context/NotificationContext';
import {
    Box,
    Paper,
    Typography,
    Chip,
    Grid,
    TextField,
    MenuItem,
    Button
} from '@mui/material';
import {
    DataGrid,
    GridToolbar,
    frFR
} from '@mui/x-data-grid';
import {
    History as HistoryIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Download as DownloadIcon,
    Share as ShareIcon,
    Security as SecurityIcon,
    Fingerprint as FingerprintIcon
} from '@mui/icons-material';
import { auditAPI } from '../services/api';
import StatCard from '../components/StatCard';

function AuditLog() {
    const { showNotification } = useNotification();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // État pour le filtrage
    const [filterAction, setFilterAction] = useState('ALL');
    const [filterUser, setFilterUser] = useState('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const loadLogs = useCallback(async () => {
        try {
            setLoading(true);
            const response = await auditAPI.getAll();
            setLogs(response.data.results || response.data);
        } catch (error) {
            console.error('Erreur chargement logs:', error);
            showNotification("Erreur lors du chargement des logs.", "error");
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    const getActionConfig = (action) => {
        const configs = {
            'CREATE': { label: 'CRÉATION', color: 'success', icon: <AddIcon fontSize="small" /> },
            'UPDATE': { label: 'MODIFICATION', color: 'info', icon: <EditIcon fontSize="small" /> },
            'DELETE': { label: 'SUPPRESSION', color: 'error', icon: <DeleteIcon fontSize="small" /> },
            'VIEW': { label: 'CONSULTATION', color: 'default', icon: <ViewIcon fontSize="small" /> },
            'DOWNLOAD': { label: 'TÉLÉCHARGEMENT', color: 'primary', icon: <DownloadIcon fontSize="small" /> },
            'SHARE': { label: 'PARTAGE', color: 'warning', icon: <ShareIcon fontSize="small" /> },
            'PERMISSION': { label: 'PERMISSION', color: 'secondary', icon: <SecurityIcon fontSize="small" /> },
        };
        return configs[action] || { label: action, color: 'default', icon: <HistoryIcon fontSize="small" /> };
    };

    const columns = [
        {
            field: 'timestamp',
            headerName: 'Date & Heure',
            width: 180,
            valueGetter: (params) => new Date(params.value).toLocaleString('fr-FR'),
        },
        {
            field: 'user_name',
            headerName: 'Utilisateur',
            width: 150,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FingerprintIcon fontSize="small" color="action" />
                    <Typography variant="body2">{params.value || 'Système'}</Typography>
                </Box>
            )
        },
        {
            field: 'action',
            headerName: 'Action',
            width: 150,
            renderCell: (params) => {
                const config = getActionConfig(params.value);
                return (
                    <Chip
                        label={config.label}
                        color={config.color}
                        size="small"
                        icon={config.icon}
                        variant="outlined"
                    />
                );
            }
        },
        {
            field: 'document_title',
            headerName: 'Document',
            flex: 1,
            renderCell: (params) => params.value || '-'
        },
        {
            field: 'case_reference',
            headerName: 'Dossier',
            width: 130,
            renderCell: (params) => params.value ? (
                <Chip
                    label={params.value}
                    size="small"
                    sx={{
                        fontWeight: 600,
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'action.selected' : 'grey.100',
                        color: (theme) => theme.palette.mode === 'dark' ? 'primary.light' : 'text.primary',
                        border: '1px solid',
                        borderColor: 'divider'
                    }}
                />
            ) : '-'
        },
        {
            field: 'ip_address',
            headerName: 'Adresse IP',
            width: 130,
            renderCell: (params) => (
                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                    {params.value}
                </Typography>
            )
        }
    ];

    // Stats
    const totalLogs = logs.length;
    const todayLogs = logs.filter(log => new Date(log.timestamp).toDateString() === new Date().toDateString()).length;
    const securityEvents = logs.filter(log => ['DELETE', 'PERMISSION'].includes(log.action)).length;

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesAction = filterAction === 'ALL' || log.action === filterAction;
            const matchesUser = filterUser === 'ALL' || log.user_name === filterUser;

            let matchesDate = true;
            if (startDate || endDate) {
                const logDate = new Date(log.timestamp);
                if (startDate && logDate < new Date(startDate)) matchesDate = false;
                if (endDate && logDate > new Date(endDate)) matchesDate = false;
            }

            return matchesAction && matchesUser && matchesDate;
        });
    }, [logs, filterAction, filterUser, startDate, endDate]);

    const uniqueUsers = useMemo(() => {
        const users = new Set(logs.map(l => l.user_name).filter(Boolean));
        return Array.from(users).sort();
    }, [logs]);

    return (
        <Box sx={{ width: '100%', pb: 3 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
                    Journal d'audit
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Suivi complet des activités et de la sécurité de la plateforme.
                </Typography>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                    <StatCard
                        title="Total activités"
                        value={totalLogs}
                        icon={<HistoryIcon color="primary" />}
                        color="primary"
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <StatCard
                        title="Activités aujourd'hui"
                        value={todayLogs}
                        icon={<HistoryIcon color="success" />}
                        color="success"
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <StatCard
                        title="Événements sécurité"
                        value={securityEvents}
                        icon={<SecurityIcon color="error" />}
                        color="error"
                    />
                </Grid>
            </Grid>

            {/* Filters Bar */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                    select
                    label="Action"
                    size="small"
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    sx={{ minWidth: 150 }}
                >
                    <MenuItem value="ALL">Toutes les actions</MenuItem>
                    <MenuItem value="CREATE">Création</MenuItem>
                    <MenuItem value="UPDATE">Modification</MenuItem>
                    <MenuItem value="DELETE">Suppression</MenuItem>
                    <MenuItem value="VIEW">Consultation</MenuItem>
                    <MenuItem value="DOWNLOAD">Téléchargement</MenuItem>
                    <MenuItem value="SHARE">Partage</MenuItem>
                    <MenuItem value="PERMISSION">Permission</MenuItem>
                </TextField>

                <TextField
                    select
                    label="Utilisateur"
                    size="small"
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                    sx={{ minWidth: 150 }}
                >
                    <MenuItem value="ALL">Tous les utilisateurs</MenuItem>
                    {uniqueUsers.map(user => <MenuItem key={user} value={user}>{user}</MenuItem>)}
                </TextField>

                <TextField
                    label="Du"
                    type="date"
                    size="small"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                />

                <TextField
                    label="Au"
                    type="date"
                    size="small"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                />

                <Button
                    size="small"
                    onClick={() => { setFilterAction('ALL'); setFilterUser('ALL'); setStartDate(''); setEndDate(''); }}
                    sx={{ ml: 'auto' }}
                >
                    Réinitialiser
                </Button>
            </Paper>

            <Paper sx={{ height: 600, width: '100%', borderRadius: 3, overflow: 'hidden', boxShadow: 3 }}>
                <DataGrid
                    rows={filteredLogs}
                    columns={columns}
                    loading={loading}
                    initialState={{
                        sorting: {
                            sortModel: [{ field: 'timestamp', sort: 'desc' }],
                        },
                        pagination: {
                            paginationModel: { page: 0, pageSize: 25 },
                        },
                    }}
                    pageSizeOptions={[25, 50, 100]}
                    disableRowSelectionOnClick
                    slots={{ toolbar: GridToolbar }}
                    slotProps={{
                        toolbar: {
                            showQuickFilter: true,
                            quickFilterProps: { debounceMs: 500, placeholder: "Rechercher dans les logs..." },
                        },
                    }}
                    localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                    sx={{
                        border: 0,
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc',
                            fontWeight: 700,
                        },
                    }}
                />
            </Paper>
        </Box>
    );
}

export default AuditLog;
