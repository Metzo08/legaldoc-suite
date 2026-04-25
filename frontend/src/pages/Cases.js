import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import {
    Box,
    Paper,
    Button,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Grid,
    Chip,
    alpha,
    Card
} from '@mui/material';
import {
    DataGrid,
    GridActionsCellItem,
    GridToolbar,
    frFR
} from '@mui/x-data-grid';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Folder as FolderIcon,
    CloudUpload as UploadIcon,
    SmartToy as BotIcon,
    KeyboardArrowRight
} from '@mui/icons-material';
import { casesAPI, clientsAPI } from '../services/api';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import WorkflowRedirectDialog from '../components/WorkflowRedirectDialog';
import AIChatDialog from '../components/AIChatDialog';
import StatCard from '../components/StatCard';
import authService from '../services/authService';

function Cases() {
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialSearch = searchParams.get('search') || '';

    // Vérifier si l'utilisateur est administrateur
    const currentUser = authService.getCurrentUser();
    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.is_staff || currentUser?.is_superuser || false;

    const [cases, setCases] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [caseStats, setCaseStats] = useState({ civil: 0, penal: 0 });
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [currentCase, setCurrentCase] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        reference: '',
        client: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        our_lawyers: '',
        category: 'CIVIL',
        represented_party: '',
        adverse_party: '',
        adverse_lawyer: '',
        external_reference: '',
        description: '',
        fees: '',
        status: 'OUVERT',
        parent_case: null,
        opened_date: new Date().toISOString().split('T')[0]
    });

    const [deleteDialog, setDeleteDialog] = useState(false);
    const [caseToDelete, setCaseToDelete] = useState(null);

    // Workflow Redirect State
    const [redirectDialog, setRedirectDialog] = useState({ open: false, caseId: null });

    // AI Chat State
    const [chatDialog, setChatDialog] = useState({ open: false, caseId: null, caseRef: '' });

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [casesRes, clientsRes, statsRes] = await Promise.all([
                casesAPI.getAll(),
                clientsAPI.getAll(),
                clientsAPI.getDashboardStats()
            ]);
            const fetchedCases = Array.isArray(casesRes.data.results) ? casesRes.data.results : (Array.isArray(casesRes.data) ? casesRes.data : []);
            const fetchedClients = Array.isArray(clientsRes.data.results) ? clientsRes.data.results : (Array.isArray(clientsRes.data) ? clientsRes.data : []);
            
            setCases(fetchedCases);
            setClients(fetchedClients);
            
            // Récupérer le compte total si disponible (Pagination DRF)
            if (casesRes.data.count !== undefined) {
                setTotalCount(casesRes.data.count);
            } else {
                setTotalCount(fetchedCases.length);
            }

            if (statsRes.data) {
                setCaseStats({
                    civil: statsRes.data.civil_cases || 0,
                    penal: statsRes.data.penal_cases || 0
                });
            }
            
            return { fetchedCases, fetchedClients };
        } catch (error) {
            console.error('Erreur chargement:', error);
            showNotification("Erreur lors du chargement des données.", "error");
            return null;
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        loadData().then((data) => {
            if (!data) return;
            const { fetchedCases } = data;
            const clientId = searchParams.get('clientId');
            const parentId = searchParams.get('parentId');
            const isNew = searchParams.get('new') === 'true';

            if (isNew) {
                if (parentId) {
                    // Si on crée un sous-dossier, on cherche le parent pour le client
                    const parentCase = fetchedCases.find(c => c.id === parseInt(parentId));
                    setFormData(prev => ({
                        ...prev,
                        client: parentCase?.client || '',
                        parent_case: parseInt(parentId),
                        opened_date: new Date().toISOString().split('T')[0]
                    }));
                    setOpenDialog(true);
                } else if (clientId) {
                    setFormData(prev => ({
                        ...prev,
                        client: parseInt(clientId),
                        opened_date: new Date().toISOString().split('T')[0]
                    }));
                    setOpenDialog(true);
                }
            }
        });
    }, [loadData, searchParams]);

    const handleOpenDialog = (caseItem = null) => {
        if (caseItem) {
            setCurrentCase(caseItem);
            setFormData({
                title: caseItem.title || '',
                reference: caseItem.reference,
                client: caseItem.client,
                contact_name: caseItem.contact_name || '',
                contact_email: caseItem.contact_email || '',
                contact_phone: caseItem.contact_phone || '',
                our_lawyers: caseItem.our_lawyers || '',
                category: caseItem.category,
                represented_party: caseItem.represented_party || '',
                adverse_party: caseItem.adverse_party || '',
                adverse_lawyer: caseItem.adverse_lawyer || '',
                external_reference: caseItem.external_reference || '',
                description: caseItem.description || '',
                fees: caseItem.fees || '',
                status: caseItem.status,
                parent_case: caseItem.parent_case || null,
                opened_date: caseItem.opened_date
            });
        } else {
            setCurrentCase(null);
            setFormData({
                title: '',
                reference: '',
                client: '',
                contact_name: '',
                contact_email: '',
                contact_phone: '',
                our_lawyers: '',
                category: 'CIVIL',
                represented_party: '',
                adverse_party: '',
                adverse_lawyer: '',
                external_reference: '',
                description: '',
                fees: '',
                status: 'OUVERT',
                parent_case: null,
                opened_date: new Date().toISOString().split('T')[0]
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleSubmit = async () => {
        try {
            // Préparer les données à envoyer (exclure les honoraires si non-admin)
            const dataToSend = { ...formData };
            if (!(isAdmin || currentUser?.role === 'ADMIN')) {
                delete dataToSend.fees;
            }

            if (currentCase) {
                await casesAPI.update(currentCase.id, dataToSend);
                showNotification("Dossier mis à jour.");
            } else {
                const response = await casesAPI.create(dataToSend);
                const newCase = response.data;
                showNotification("Dossier créé avec succès !");

                // Ouvrir le dialogue de redirection premium
                setTimeout(() => {
                    setRedirectDialog({ open: true, caseId: newCase.id });
                }, 500);
            }
            handleCloseDialog();
            loadData();
        } catch (error) {
            console.error('Erreur enregistrement dossier:', error);
            const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            showNotification(`Erreur lors de l'enregistrement: ${errorMsg}`, "error");
        }
    };

    const handleAnalyzeCase = (caseItem) => {
        setChatDialog({ open: true, caseId: caseItem.id, caseRef: caseItem.reference });
    };

    const handleDeleteClick = (caseItem) => {
        setCaseToDelete(caseItem);
        setDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await casesAPI.delete(caseToDelete.id);
            showNotification("Dossier supprimé.");
            setDeleteDialog(false);
            setCaseToDelete(null);
            loadData();
        } catch (error) {
            console.error('Erreur suppression dossier:', error);
            showNotification("Erreur lors de la suppression.", "error");
        }
    };

    // Fonction pour obtenir le label, la couleur et l'icône de catégorie
    const getCategoryDisplay = (category) => {
        const categories = {
            'CIVIL': { label: 'Civil', color: '#1d4ed8', bg: '#eff6ff', border: '#3b82f6', icon: <FolderIcon sx={{ fontSize: 16 }} /> },
            'CORRECTIONNEL': { label: 'Correctionnel', color: '#ea580c', bg: '#fff7ed', border: '#fb923c', icon: <FolderIcon sx={{ fontSize: 16 }} /> },
            'PENAL': { label: 'Pénal', color: '#dc2626', bg: '#fef2f2', border: '#f87171', icon: <FolderIcon sx={{ fontSize: 16 }} /> },
            'COMMERCIAL': { label: 'Commercial', color: '#15803d', bg: '#f0fdf4', border: '#4ade80', icon: <FolderIcon sx={{ fontSize: 16 }} /> },
            'SOCIAL': { label: 'Social', color: '#7e22ce', bg: '#faf5ff', border: '#c084fc', icon: <FolderIcon sx={{ fontSize: 16 }} /> },
            'TI_FAMILLE': { label: 'TI Famille', color: '#be185d', bg: '#fdf2f8', border: '#f472b6', icon: <FolderIcon sx={{ fontSize: 16 }} /> }
        };

        const config = categories[category] || { label: category, color: '#6b7280', bg: '#f9fafb', border: '#d1d5db', icon: <FolderIcon sx={{ fontSize: 16 }} /> };
        
        return config;
    };

    const columns = [

        {
            field: 'reference',
            headerName: 'Numéro dossier',
            width: 140,
            renderCell: (params) => {
                const { color } = getCategoryDisplay(params.row.category);
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, mr: 1.5, boxShadow: `0 0 5px ${color}` }} />
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{params.value}</Typography>
                    </Box>
                );
            }
        },
        { field: 'title', headerName: 'Intitulé de l\'affaire', flex: 2, minWidth: 200 },
        {
            field: 'client_name',
            headerName: 'Client',
            flex: 1,
            minWidth: 150,
            renderCell: (params) => (
                <Typography
                    variant="body2"
                    onClick={() => navigate(`/clients?search=${encodeURIComponent(params.value)}`)}
                    sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                >
                    {params.value}
                </Typography>
            )
        },
        {
            field: 'category',
            headerName: 'Catégorie',
            width: 150,
            renderCell: (params) => {
                const { label, color, bg, border, icon } = getCategoryDisplay(params.value);
                return (
                    <Chip
                        icon={icon}
                        label={label}
                        size="small"
                        sx={{
                            bgcolor: bg,
                            color: color,
                            fontWeight: 800,
                            fontSize: '0.7rem',
                            border: '1px solid',
                            borderColor: border,
                            '& .MuiChip-icon': { color: color }
                        }}
                    />
                );
            }
        },
        {
            field: 'adverse_party',
            headerName: 'Partie adverse',
            flex: 1,
            minWidth: 150
        },
        {
            field: 'status',
            headerName: 'Statut',
            width: 120,
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    color={params.value === 'OUVERT' ? 'success' : 'default'}
                    size="small"
                />
            )
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            width: 240,
            getActions: (params) => [
                <GridActionsCellItem icon={<KeyboardArrowRight sx={{ fontSize: 28, color: 'text.primary' }} />} label="Ouvrir" onClick={() => navigate(`/cases/${params.id}`)} />,
                <GridActionsCellItem icon={<BotIcon sx={{ color: 'secondary.main', fontSize: 26 }} />} label="Avocat IA Expert" onClick={() => handleAnalyzeCase(params.row)} />,
                <GridActionsCellItem icon={<UploadIcon color="info" />} label="Ajouter un document" onClick={() => navigate(`/documents?caseId=${params.id}&new=true`)} />,
                <GridActionsCellItem icon={<EditIcon color="warning" />} label="Modifier" onClick={() => handleOpenDialog(params.row)} />,
                <GridActionsCellItem icon={<DeleteIcon color="error" />} label="Supprimer" onClick={() => handleDeleteClick(params.row)} />,
            ],
        },
    ];

    const totalCases = totalCount;
    // Dossiers civils = civil + commercial + social (jaune)
    const civilCases = caseStats.civil;
    const penalCases = caseStats.penal;

    const [filterMode, setFilterMode] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState(initialSearch);

    const [filterModel, setFilterModel] = useState({
        items: [],
        quickFilterValues: searchTerm ? [searchTerm] : [],
    });

    useEffect(() => {
        setFilterModel({
            items: [],
            quickFilterValues: searchTerm ? [searchTerm] : [],
        });
    }, [searchTerm]);

    const filteredCases = useMemo(() => {
        let base = cases;

        // Interactive Filter
        if (filterMode === 'OUVERT') {
            base = base.filter(c => c.status === 'OUVERT');
        } else if (filterMode === 'CIVIL') {
            // Jaune = civil, commercial, social
            base = base.filter(c => ['CIVIL', 'COMMERCIAL', 'SOCIAL', 'TI_FAMILLE'].includes(c.category));
        } else if (filterMode === 'CORRECTIONNEL') {
            // Bleu = pénal, correctionnel
            base = base.filter(c => ['PENAL', 'CORRECTIONNEL'].includes(c.category));
        }

        return base;
    }, [cases, filterMode]);

    useEffect(() => {
        const filterParam = searchParams.get('filter');
        if (filterParam && ['OUVERT', 'CIVIL', 'CORRECTIONNEL'].includes(filterParam)) {
            setFilterMode(filterParam);
        }
    }, [searchParams]);

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
                        Dossiers
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, opacity: 0.8 }}>
                        Gérez vos dossiers juridiques et leur suivi.
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ borderRadius: '12px', px: 3, py: 1.5, fontWeight: 700 }}>Nouveau dossier</Button>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4} md={4}>
                    <Box onClick={() => setFilterMode('ALL')} sx={{ cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)' }, opacity: filterMode === 'ALL' ? 1 : 0.6 }}>
                        <StatCard
                            title="Total dossiers"
                            value={totalCases}
                            icon={<FolderIcon color="primary" />}
                            color="primary"
                            sx={{ border: filterMode === 'ALL' ? '2px solid' : 'none', borderColor: 'primary.main', borderRadius: 2 }}
                        />
                    </Box>
                </Grid>
                <Grid item xs={12} sm={4} md={4}>
                    <Box onClick={() => setFilterMode('CIVIL')} sx={{ cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)' }, opacity: filterMode === 'CIVIL' ? 1 : 0.6 }}>
                        <StatCard
                            title="Civil & autres"
                            value={civilCases}
                            icon={<FolderIcon sx={{ color: '#facc15' }} />}
                            color="warning"
                            sx={{ border: filterMode === 'CIVIL' ? '2px solid' : 'none', borderColor: 'warning.main', borderRadius: 2 }}
                        />
                    </Box>
                </Grid>
                <Grid item xs={12} sm={4} md={4}>
                    <Box onClick={() => setFilterMode('CORRECTIONNEL')} sx={{ cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)' }, opacity: filterMode === 'CORRECTIONNEL' ? 1 : 0.6 }}>
                        <StatCard
                            title="Pénal & correctionnel"
                            value={penalCases}
                            icon={<FolderIcon sx={{ color: '#1d4ed8' }} />}
                            color="info"
                            sx={{ border: filterMode === 'CORRECTIONNEL' ? '2px solid' : 'none', borderColor: 'info.main', borderRadius: 2 }}
                        />
                    </Box>
                </Grid>
            </Grid>

            <Card sx={{ height: 600, width: '100%', mb: 4, borderRadius: '16px', overflow: 'hidden', boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 10px 40px rgba(0,0,0,0.4)' : '0 10px 40px rgba(99, 102, 241, 0.1)' }}>
                <DataGrid
                    rows={filteredCases}
                    columns={columns}
                    loading={loading}
                    onRowClick={(params) => navigate(`/cases/${params.id}`)}
                    filterModel={filterModel}
                    onFilterModelChange={(newModel) => {
                        setFilterModel(newModel);
                        setSearchTerm(newModel.quickFilterValues?.[0] || '');
                    }}
                    initialState={{
                        pagination: { paginationModel: { page: 0, pageSize: 10 } },
                    }}
                    pageSizeOptions={[10, 25, 50]}
                    disableRowSelectionOnClick
                    slots={{ toolbar: GridToolbar }}
                    slotProps={{
                        toolbar: {
                            showQuickFilter: true,
                            quickFilterProps: {
                                debounceMs: 500,
                                placeholder: "Rechercher...",
                                onChange: (e) => setSearchTerm(e.target.value)
                            }
                        }
                    }}
                    localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                    sx={{ border: 0, '& .MuiDataGrid-columnHeaders': { backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', fontWeight: 700 } }}
                />
            </Paper>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>{currentCase ? 'Modifier le dossier' : 'Nouveau dossier'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        {/* Colonne gauche */}
                        <Grid item xs={12}>
                            <TextField
                                label="Intitulé de l'affaire"
                                fullWidth
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ex: Divorce Epoux X, Litige Commercial Y..."
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Numéro dossier"
                                fullWidth
                                value={formData.reference}
                                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                helperText={!currentCase ? "Laissez vide pour auto-génération" : ""}
                                placeholder={!currentCase ? "Auto-généré si vide" : ""}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Catégorie"
                                select
                                fullWidth
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                required
                            >
                                <MenuItem value="CIVIL">Civil</MenuItem>
                                <MenuItem value="COMMERCIAL">Commercial</MenuItem>
                                <MenuItem value="SOCIAL">Social</MenuItem>
                                <MenuItem value="PENAL">Pénal</MenuItem>
                                <MenuItem value="CORRECTIONNEL">Correctionnel</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Dossier principal"
                                select
                                fullWidth
                                value={formData.parent_case || ''}
                                onChange={(e) => setFormData({ ...formData, parent_case: e.target.value || null })}
                                helperText="Sélectionnez pour créer un sous-dossier"
                            >
                                <MenuItem value=""><em>Aucun (dossier principal)</em></MenuItem>
                                {cases.filter(c => !c.parent_case).map((c) => (
                                    <MenuItem key={c.id} value={c.id}>{c.reference} - {c.title}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Client"
                                select
                                fullWidth
                                value={formData.client}
                                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                                required
                            >
                                {clients.map((c) => (
                                    <MenuItem key={c.id} value={c.id}>
                                        {c.name} {c.email ? `(${c.email})` : `(ID: ${c.id})`}
                                    </MenuItem>
                                ))}
                                <MenuItem onClick={() => navigate('/clients?new=true')} sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                    + Créer un nouveau client
                                </MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Partie représentée"
                                fullWidth
                                value={formData.represented_party}
                                onChange={(e) => setFormData({ ...formData, represented_party: e.target.value })}
                                placeholder="Le client ou une autre entité"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Partie adverse"
                                fullWidth
                                value={formData.adverse_party}
                                onChange={(e) => setFormData({ ...formData, adverse_party: e.target.value })}
                            />
                        </Grid>

                        {/* Personne à contacter */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                                Personne à contacter
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Nom du contact"
                                fullWidth
                                value={formData.contact_name}
                                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                placeholder="Nom de la personne à contacter"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Email du contact"
                                fullWidth
                                type="email"
                                value={formData.contact_email}
                                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                placeholder="email@exemple.com"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Téléphone du contact"
                                fullWidth
                                value={formData.contact_phone}
                                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                placeholder="+221 77 XXX XX XX"
                            />
                        </Grid>

                        {/* Avocats à mes côtés */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Avocats à mes côtés"
                                fullWidth
                                multiline
                                rows={2}
                                value={formData.our_lawyers}
                                onChange={(e) => setFormData({ ...formData, our_lawyers: e.target.value })}
                                placeholder="Noms des avocats collaborant sur ce dossier"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Avocat(s) partie adverse"
                                fullWidth
                                multiline
                                rows={2}
                                value={formData.adverse_lawyer}
                                onChange={(e) => setFormData({ ...formData, adverse_lawyer: e.target.value })}
                                placeholder="Avocat(s) de la partie adverse"
                            />
                        </Grid>

                        {/* Description */}
                        <Grid item xs={12}>
                            <TextField
                                label="Description"
                                fullWidth
                                multiline
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </Grid>

                        {/* Honoraires - visible uniquement par l'administrateur */}
                        {(isAdmin || currentUser?.role === 'ADMIN') && (
                            <Grid item xs={12}>
                                <TextField
                                    label="Honoraires (FCFA)"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    value={formData.fees}
                                    onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
                                    placeholder="Montant des honoraires en Francs CFA"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: 'rgba(255, 193, 7, 0.05)',
                                            '& fieldset': {
                                                borderColor: 'warning.main'
                                            }
                                        }
                                    }}
                                    helperText="Visible uniquement par l'administrateur"
                                />
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Annuler</Button>
                    <Button onClick={handleSubmit} variant="contained">Enregistrer</Button>
                </DialogActions>
            </Dialog>

            <DeleteConfirmDialog
                open={deleteDialog}
                onClose={() => setDeleteDialog(false)}
                onConfirm={handleConfirmDelete}
                title="Supprimer le dossier"
                message={`Êtes-vous sûr de vouloir supprimer ${caseToDelete?.reference} ? Cette action est irréversible.`}
            />

            <WorkflowRedirectDialog
                open={redirectDialog.open}
                onClose={() => setRedirectDialog({ ...redirectDialog, open: false })}
                onConfirm={() => {
                    setRedirectDialog({ ...redirectDialog, open: false });
                    navigate(`/documents?caseId=${redirectDialog.caseId}&new=true`);
                }}
                title="Pièces Jointes"
                message="Le dossier a été ouvert avec succès. Souhaitez-vous y ajouter des documents immédiatement ?"
                confirmText="Ajouter des documents"
                cancelText="Plus tard"
            />

            <AIChatDialog
                open={chatDialog.open}
                onClose={() => setChatDialog({ ...chatDialog, open: false })}
                caseId={chatDialog.caseId}
                caseReference={chatDialog.caseRef}
            />
        </Box>
    );
}

export default Cases;
