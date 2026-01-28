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
    Chip
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
    Visibility as ViewIcon
} from '@mui/icons-material';
import { casesAPI, clientsAPI } from '../services/api';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import WorkflowRedirectDialog from '../components/WorkflowRedirectDialog';
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

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [casesRes, clientsRes] = await Promise.all([
                casesAPI.getAll(),
                clientsAPI.getAll()
            ]);
            const fetchedCases = casesRes.data.results || casesRes.data;
            const fetchedClients = clientsRes.data.results || clientsRes.data;
            setCases(fetchedCases);
            setClients(fetchedClients);
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
            showNotification("Erreur lors de l'enregistrement.", "error");
        }
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

    // Fonction pour obtenir le label et la couleur de catégorie
    const getCategoryDisplay = (category) => {
        // Jaune pour civil/commercial/social, Bleu pour pénal/correctionnel
        const isYellow = ['CIVIL', 'COMMERCIAL', 'SOCIAL'].includes(category);
        const labels = {
            'CIVIL': 'Civil',
            'COMMERCIAL': 'Commercial',
            'SOCIAL': 'Social',
            'PENAL': 'Pénal',
            'CORRECTIONNEL': 'Correctionnel'
        };
        return {
            label: labels[category] || category,
            isYellow
        };
    };

    const columns = [
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            width: 160,
            getActions: (params) => [
                <GridActionsCellItem icon={<ViewIcon color="primary" />} label="Détails" onClick={() => navigate(`/cases/${params.id}`)} />,
                <GridActionsCellItem icon={<UploadIcon color="info" />} label="Ajouter un document" onClick={() => navigate(`/documents?caseId=${params.id}&new=true`)} />,
                <GridActionsCellItem icon={<EditIcon />} label="Modifier" onClick={() => handleOpenDialog(params.row)} color="primary" />,
                <GridActionsCellItem icon={<DeleteIcon />} label="Supprimer" onClick={() => handleDeleteClick(params.row)} color="error" />,
            ],
        },
        {
            field: 'reference',
            headerName: 'Numéro dossier',
            width: 160,
            renderCell: (params) => {
                const isYellow = ['CIVIL', 'COMMERCIAL', 'SOCIAL'].includes(params.row.category);
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FolderIcon sx={{ color: isYellow ? '#facc15' : '#1d4ed8', mr: 1, fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{params.value}</Typography>
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
            width: 130,
            renderCell: (params) => {
                const { label, isYellow } = getCategoryDisplay(params.value);
                return (
                    <Chip
                        label={label}
                        size="small"
                        sx={{
                            bgcolor: isYellow ? '#fefce8' : '#eff6ff',
                            color: isYellow ? '#a16207' : '#1d4ed8',
                            fontWeight: 'bold',
                            border: '1px solid',
                            borderColor: isYellow ? '#facc15' : '#3b82f6'
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
    ];

    const totalCases = cases.length;
    const openCases = cases.filter(c => c.status === 'OUVERT').length;
    // Dossiers civils = civil + commercial + social (jaune)
    const civilCases = cases.filter(c => ['CIVIL', 'COMMERCIAL', 'SOCIAL'].includes(c.category)).length;
    const penalCases = cases.filter(c => ['PENAL', 'CORRECTIONNEL'].includes(c.category)).length;

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
            base = base.filter(c => ['CIVIL', 'COMMERCIAL', 'SOCIAL'].includes(c.category));
        } else if (filterMode === 'CORRECTIONNEL') {
            // Bleu = pénal, correctionnel
            base = base.filter(c => ['PENAL', 'CORRECTIONNEL'].includes(c.category));
        }

        return base;
    }, [cases, filterMode]);

    // Initialiser le filtre depuis l'URL si présent
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
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>Dossiers</Typography>
                    <Typography variant="body1" color="text.secondary">Gérez vos dossiers juridiques et leur suivi.</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ borderRadius: 2 }}>Nouveau dossier</Button>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
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
                <Grid item xs={12} sm={6} md={3}>
                    <Box onClick={() => setFilterMode('OUVERT')} sx={{ cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)' }, opacity: filterMode === 'OUVERT' ? 1 : 0.6 }}>
                        <StatCard
                            title="Dossiers ouverts"
                            value={openCases}
                            icon={<FolderIcon color="success" />}
                            color="success"
                            sx={{ border: filterMode === 'OUVERT' ? '2px solid' : 'none', borderColor: 'success.main', borderRadius: 2 }}
                        />
                    </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Box onClick={() => setFilterMode('CIVIL')} sx={{ cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)' }, opacity: filterMode === 'CIVIL' ? 1 : 0.6 }}>
                        <StatCard
                            title="Civil & Autres"
                            value={civilCases}
                            icon={<FolderIcon sx={{ color: '#facc15' }} />}
                            color="warning"
                            sx={{ border: filterMode === 'CIVIL' ? '2px solid' : 'none', borderColor: 'warning.main', borderRadius: 2 }}
                        />
                    </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Box onClick={() => setFilterMode('CORRECTIONNEL')} sx={{ cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)' }, opacity: filterMode === 'CORRECTIONNEL' ? 1 : 0.6 }}>
                        <StatCard
                            title="Pénal & Correctionnel"
                            value={penalCases}
                            icon={<FolderIcon sx={{ color: '#1d4ed8' }} />}
                            color="info"
                            sx={{ border: filterMode === 'CORRECTIONNEL' ? '2px solid' : 'none', borderColor: 'info.main', borderRadius: 2 }}
                        />
                    </Box>
                </Grid>
            </Grid>

            <Paper sx={{ height: 600, width: '100%', borderRadius: 3, overflow: 'hidden', boxShadow: 3 }}>
                <DataGrid
                    rows={filteredCases}
                    columns={columns}
                    loading={loading}
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
                                label="Dossier Principal"
                                select
                                fullWidth
                                value={formData.parent_case || ''}
                                onChange={(e) => setFormData({ ...formData, parent_case: e.target.value || null })}
                                helperText="Sélectionnez pour créer un sous-dossier"
                            >
                                <MenuItem value=""><em>Aucun (Dossier Principal)</em></MenuItem>
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
                                {clients.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
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
        </Box>
    );
}

export default Cases;
