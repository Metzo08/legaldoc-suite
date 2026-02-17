import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import {
    Box,
    Paper,
    Typography,
    TextField,
    MenuItem,
    Grid,
    Chip,
    IconButton,
    InputAdornment,
    Tooltip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Autocomplete,
    alpha,
    Tabs,
    Tab
} from '@mui/material';
import {
    Search as SearchIcon,
    Gavel as GavelIcon,
    Clear as ClearIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { decisionsAPI, casesAPI } from '../services/api';
import authService from '../services/authService';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';

const SECTIONS = {
    'GENERALE': { label: 'Décisions Générales', color: '#1a73e8' },
    'CABINET_INSTRUCTION': { label: 'Cabinets d\'Instruction', color: '#1a73e8' }
};

function Decisions() {
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    // States
    const [decisions, setDecisions] = useState([]);
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('GENERALE');
    const [cabinetFilter, setCabinetFilter] = useState('ALL');

    // Dialog States
    const [openDialog, setOpenDialog] = useState(false);
    const [editingDecision, setEditingDecision] = useState(null);
    const [formData, setFormData] = useState({
        case: null,
        decision_type: 'INSTANCE',
        date_decision: new Date().toISOString().split('T')[0],
        juridiction: '',
        numero_decision: '',
        resultat: '',
        observations: '',
        section: 'GENERALE',
        cabinet_number: '',
        infraction_motif: '',
        mesure: ''
    });

    const [deleteDialog, setDeleteDialog] = useState(false);
    const [decisionToDelete, setDecisionToDelete] = useState(null);

    // Auth
    authService.getCurrentUser();

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                section: activeTab
            };
            if (activeTab === 'CABINET_INSTRUCTION' && cabinetFilter !== 'ALL') {
                params.cabinet_number = cabinetFilter;
            }
            if (searchTerm) params.search = searchTerm;

            const [decisionsRes, casesRes] = await Promise.all([
                decisionsAPI.getAll(params),
                casesAPI.getAll()
            ]);

            setDecisions(Array.isArray(decisionsRes.data.results) ? decisionsRes.data.results : (Array.isArray(decisionsRes.data) ? decisionsRes.data : []));
            setCases(Array.isArray(casesRes.data.results) ? casesRes.data.results : (Array.isArray(casesRes.data) ? casesRes.data : []));
        } catch (error) {
            console.error('Erreur chargement:', error);
            showNotification("Erreur lors du chargement des données.", "error");
        } finally {
            setLoading(false);
        }
    }, [activeTab, cabinetFilter, searchTerm, showNotification]);

    useEffect(() => {
        const handler = setTimeout(() => {
            loadData();
        }, 300);
        return () => clearTimeout(handler);
    }, [loadData]);

    const handleOpenDialog = (decision = null) => {
        if (decision) {
            setEditingDecision(decision);
            const selectedCase = cases.find(c => c.id === decision.case);
            setFormData({
                case: selectedCase || { id: decision.case, reference: decision.case_reference },
                decision_type: decision.decision_type,
                date_decision: decision.date_decision || '',
                juridiction: decision.juridiction || '',
                numero_decision: decision.numero_decision || '',
                resultat: decision.resultat || '',
                observations: decision.observations || '',
                section: decision.section || 'GENERALE',
                cabinet_number: decision.cabinet_number || '',
                infraction_motif: decision.infraction_motif || '',
                mesure: decision.mesure || ''
            });
        } else {
            setEditingDecision(null);
            setFormData({
                case: null,
                decision_type: 'INSTANCE',
                date_decision: new Date().toISOString().split('T')[0],
                juridiction: '',
                numero_decision: '',
                resultat: '',
                observations: '',
                section: activeTab,
                cabinet_number: activeTab === 'CABINET_INSTRUCTION' ? (cabinetFilter !== 'ALL' ? cabinetFilter : '1') : '',
                infraction_motif: '',
                mesure: ''
            });
        }
        setOpenDialog(true);
    };

    const handleSave = async () => {
        if (!formData.case) {
            showNotification("Veuillez sélectionner un dossier.", "warning");
            return;
        }
        try {
            const data = {
                ...formData,
                case: formData.case.id,
                cabinet_number: formData.section === 'CABINET_INSTRUCTION' ? formData.cabinet_number : null
            };
            if (editingDecision) {
                await decisionsAPI.update(editingDecision.id, data);
                showNotification("Décision mise à jour.");
            } else {
                await decisionsAPI.create(data);
                showNotification("Décision ajoutée.");
            }
            setOpenDialog(false);
            loadData();
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            showNotification("Erreur lors de l'enregistrement.", "error");
        }
    };

    const handleDelete = async () => {
        try {
            await decisionsAPI.delete(decisionToDelete.id);
            showNotification("Décision supprimée.");
            setDeleteDialog(false);
            loadData();
        } catch (error) {
            showNotification("Erreur lors de la suppression.", "error");
        }
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setCabinetFilter('ALL');
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
        });
    };

    // Style helper for LEDGER look
    const redTextStyle = { color: '#d32f2f', fontWeight: 800 };
    const blueTextStyle = { color: '#1976d2', fontWeight: 600 };

    return (
        <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main', mb: 1, letterSpacing: '-0.02em' }}>
                        Décisions rendues
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Registre digitalisé des décisions de justice et instructions.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    sx={{ borderRadius: 2, px: 3, fontWeight: 700, background: 'linear-gradient(135deg, #1a73e8, #0d47a1)' }}
                >
                    Nouvelle entrée
                </Button>
            </Box>

            {/* Onglets de Section */}
            <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                sx={{
                    mb: 3,
                    borderBottom: 1,
                    borderColor: 'divider',
                    '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: '1rem' }
                }}
            >
                {Object.entries(SECTIONS).map(([key, value]) => (
                    <Tab key={key} label={value.label} value={key} />
                ))}
            </Tabs>

            {/* Barre de Filtres */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={activeTab === 'CABINET_INSTRUCTION' ? 4 : 6}>
                        <TextField
                            fullWidth
                            placeholder="Rechercher par parties, N° ou résultat..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: searchTerm && (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setSearchTerm('')}>
                                            <ClearIcon />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                            size="small"
                        />
                    </Grid>
                    {activeTab === 'CABINET_INSTRUCTION' && (
                        <Grid item xs={12} md={3}>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Filtrer par Cabinet"
                                value={cabinetFilter}
                                onChange={(e) => setCabinetFilter(e.target.value)}
                            >
                                <MenuItem value="ALL">Tous les cabinets</MenuItem>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                                    <MenuItem key={n} value={n.toString()}>{n === 1 ? '1er' : `${n}ème`} Cabinet</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    )}
                    <Grid item xs={12} md={activeTab === 'CABINET_INSTRUCTION' ? 5 : 6} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {(searchTerm || cabinetFilter !== 'ALL') && (
                            <Button
                                startIcon={<ClearIcon />}
                                onClick={handleClearFilters}
                                color="inherit"
                                sx={{ textTransform: 'none', fontWeight: 600, mr: 2 }}
                            >
                                Réinitialiser
                            </Button>
                        )}
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            {decisions.length} entrée(s) trouvée(s)
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* Tableau des Décisions */}
            <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }} elevation={0}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead sx={{ bgcolor: alpha('#f8fafc', 0.8) }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Date</TableCell>
                            {activeTab === 'CABINET_INSTRUCTION' ? (
                                <>
                                    <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>N° Cab.</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Prévenu / Parties</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Infraction / Motif</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Mesure</TableCell>
                                </>
                            ) : (
                                <>
                                    <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Code / Type</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Parties</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Objet / Détail</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Dossier</TableCell>
                                </>
                            )}
                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Statut / Résultat</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                                    <CircularProgress size={40} />
                                    <Typography sx={{ mt: 2, fontWeight: 600 }} color="text.secondary">Synchronisation du registre...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : decisions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                                    <Box sx={{ opacity: 0.3 }}>
                                        <GavelIcon sx={{ fontSize: 80, mb: 1 }} />
                                        <Typography variant="h6" fontWeight={800}>Registre vide</Typography>
                                        <Typography variant="body2">Aucune décision enregistrée dans cette section.</Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            decisions.map((decision) => {
                                const isRendered = !!decision.resultat;
                                return (
                                    <TableRow
                                        key={decision.id}
                                        hover
                                        sx={{
                                            '&:last-child td, &:last-child th': { border: 0 },
                                            bgcolor: isRendered ? '#fefce8' : 'inherit', // Surlignage jaune clair (LEDGER STYLE)
                                            transition: 'background-color 0.3s',
                                            '&:hover': { bgcolor: isRendered ? '#fef9c3' : alpha('#f1f5f9', 0.5) }
                                        }}
                                    >
                                        <TableCell>
                                            <Typography variant="body2" sx={redTextStyle}>
                                                {formatDate(decision.date_decision)}
                                            </Typography>
                                        </TableCell>

                                        {activeTab === 'CABINET_INSTRUCTION' ? (
                                            <>
                                                <TableCell>
                                                    <Chip label={`${decision.cabinet_number}${decision.cabinet_number === 1 ? 'er' : 'ème'}`} size="small" variant="outlined" sx={{ fontWeight: 800, color: 'primary.main', borderColor: 'primary.main' }} />
                                                </TableCell>
                                                <TableCell sx={{ minWidth: 200 }}>
                                                    <Typography variant="body2" sx={blueTextStyle}>
                                                        {decision.case_details?.represented_party || decision.client_name || '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {decision.infraction_motif || '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#4b5563' }}>
                                                        {decision.mesure || '—'}
                                                    </Typography>
                                                </TableCell>
                                            </>
                                        ) : (
                                            <>
                                                <TableCell>
                                                    <Typography variant="body2" sx={redTextStyle}>
                                                        {decision.numero_decision || decision.decision_type || '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ minWidth: 200 }}>
                                                    <Typography variant="body2" sx={blueTextStyle}>
                                                        {decision.case_details?.represented_party || '—'} <span style={{ color: '#94a3b8' }}>vs</span> {decision.case_details?.adverse_party || '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontWeight: 500, maxWidth: 200, noWrap: true, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {decision.observations || '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{ fontWeight: 800, cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                                                        onClick={() => navigate(`/cases/${decision.case}`)}
                                                    >
                                                        {decision.case_reference}
                                                    </Typography>
                                                </TableCell>
                                            </>
                                        )}

                                        <TableCell>
                                            {isRendered ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Chip label="RENDUE" size="small" sx={{ bgcolor: '#4caf50', color: '#white', fontWeight: 900, fontSize: '0.65rem' }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'success.dark' }}>
                                                        {decision.resultat}
                                                    </Typography>
                                                </Box>
                                            ) : (
                                                <Typography variant="caption" color="text.disabled" fontWeight={700}>EN ATTENTE</Typography>
                                            )}
                                        </TableCell>

                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                                <Tooltip title="Modifier">
                                                    <IconButton size="small" onClick={() => handleOpenDialog(decision)} color="primary">
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Supprimer">
                                                    <IconButton size="small" onClick={() => { setDecisionToDelete(decision); setDeleteDialog(true); }} color="error">
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Dialog de Création/Edition */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 900, bgcolor: alpha('#1a73e8', 0.05), borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <GavelIcon color="primary" />
                    {editingDecision ? 'Modifier l\'entrée' : 'Enregistrer une nouvelle décision / mesure'}
                </DialogTitle>
                <DialogContent sx={{ mt: 1, px: 3, pb: 4 }}>
                    <Grid container spacing={4} sx={{ mt: 0.5 }}>
                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                options={cases}
                                getOptionLabel={(option) => `${option.reference} - ${option.title}`}
                                value={formData.case}
                                onChange={(event, newValue) => setFormData({ ...formData, case: newValue })}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Dossier concerné *"
                                        variant="outlined"
                                        size="small"
                                        fullWidth
                                        sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}
                                    />
                                )}
                                disabled={!!editingDecision}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                select
                                fullWidth
                                label="Section du registre *"
                                value={formData.section}
                                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                size="small"
                                sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}
                            >
                                {Object.entries(SECTIONS)
                                    .filter(([key]) => key !== 'TI_FAMILLE')
                                    .map(([key, value]) => (
                                        <MenuItem key={key} value={key} sx={{ py: 1.5 }}>{value.label}</MenuItem>
                                    ))
                                }
                            </TextField>
                        </Grid>

                        {formData.section === 'CABINET_INSTRUCTION' && (
                            <Grid item xs={12} md={4}>
                                <TextField
                                    select
                                    fullWidth
                                    label="N° Cabinet *"
                                    value={formData.cabinet_number}
                                    onChange={(e) => setFormData({ ...formData, cabinet_number: e.target.value })}
                                    size="small"
                                    sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                                        <MenuItem key={n} value={n.toString()} sx={{ py: 1 }}>{n === 1 ? '1er' : `${n}ème`} Cabinet</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        )}

                        <Grid item xs={12} md={formData.section === 'CABINET_INSTRUCTION' ? 4 : 6}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Date de décision *"
                                value={formData.date_decision}
                                onChange={(e) => setFormData({ ...formData, date_decision: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                size="small"
                                sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}
                            />
                        </Grid>

                        <Grid item xs={12} md={formData.section === 'CABINET_INSTRUCTION' ? 4 : 6}>
                            <TextField
                                fullWidth
                                label={formData.section === 'CABINET_INSTRUCTION' ? "Code Instruction" : "Code / Type procédure"}
                                value={formData.numero_decision}
                                onChange={(e) => setFormData({ ...formData, numero_decision: e.target.value })}
                                size="small"
                                placeholder="ex: FDRE, TR REF..."
                                sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}
                            />
                        </Grid>

                        {formData.section === 'CABINET_INSTRUCTION' && (
                            <>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Infraction / Motif"
                                        value={formData.infraction_motif}
                                        onChange={(e) => setFormData({ ...formData, infraction_motif: e.target.value })}
                                        size="small"
                                        multiline
                                        rows={2}
                                        sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Mesure prise"
                                        value={formData.mesure}
                                        onChange={(e) => setFormData({ ...formData, mesure: e.target.value })}
                                        size="small"
                                        multiline
                                        rows={2}
                                        placeholder="ex: Mandat de dépôt, Liberté provisoire"
                                        sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}
                                    />
                                </Grid>
                            </>
                        )}

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Résultat / Dispositif (Surligne si rempli)"
                                value={formData.resultat}
                                onChange={(e) => setFormData({ ...formData, resultat: e.target.value })}
                                multiline
                                rows={3}
                                size="small"
                                placeholder="Indiquez ici le résultat final pour surligner automatiquement la ligne en jaune..."
                                sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Observations Additionnelles"
                                value={formData.observations}
                                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                                multiline
                                rows={2}
                                size="small"
                                sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3, bgcolor: alpha('#000', 0.02), borderTop: '1px solid #e2e8f0' }}>
                    <Button onClick={() => setOpenDialog(false)} color="inherit" sx={{ fontWeight: 700 }}>Annuler</Button>
                    <Button onClick={handleSave} variant="contained" sx={{ px: 4, borderRadius: 2, fontWeight: 900, background: 'linear-gradient(135deg, #1a73e8, #0d47a1)' }}>
                        {editingDecision ? 'Mettre à jour' : 'Enregistrer dans l\'agenda'}
                    </Button>
                </DialogActions>
            </Dialog>

            <DeleteConfirmDialog
                open={deleteDialog}
                onClose={() => setDeleteDialog(false)}
                onConfirm={handleDelete}
                title="Supprimer l'entrée"
                message="Souhaitez-vous vraiment retirer cette décision du registre ?"
            />
        </Box>
    );
}

export default Decisions;
