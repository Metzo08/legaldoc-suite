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
    CloudUpload as UploadIcon
} from '@mui/icons-material';
import { casesAPI, clientsAPI } from '../services/api';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import WorkflowRedirectDialog from '../components/WorkflowRedirectDialog';
import StatCard from '../components/StatCard';

function Cases() {
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialSearch = searchParams.get('search') || '';

    const [cases, setCases] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [currentCase, setCurrentCase] = useState(null);
    const [formData, setFormData] = useState({
        reference: '',
        title: '',
        client: '',
        description: '',
        category: 'CIVIL',
        status: 'OUVERT',
        opened_date: new Date().toISOString().split('T')[0],
        represented_party: '',
        adverse_party: '',
        adverse_lawyer: '',
        external_reference: ''
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
            setCases(casesRes.data.results || casesRes.data);
            setClients(clientsRes.data.results || clientsRes.data);
        } catch (error) {
            console.error('Erreur chargement:', error);
            showNotification("Erreur lors du chargement des données.", "error");
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        loadData().then(() => {
            const clientId = searchParams.get('clientId');
            const isNew = searchParams.get('new') === 'true';
            if (clientId && isNew) {
                setFormData(prev => ({
                    ...prev,
                    client: parseInt(clientId),
                    opened_date: new Date().toISOString().split('T')[0]
                }));
                setOpenDialog(true);
            }
        });
    }, [loadData, searchParams]);

    const handleOpenDialog = (caseItem = null) => {
        if (caseItem) {
            setCurrentCase(caseItem);
            setFormData({
                reference: caseItem.reference,
                title: caseItem.title,
                client: caseItem.client,
                description: caseItem.description || '',
                category: caseItem.category,
                status: caseItem.status,
                opened_date: caseItem.opened_date,
                represented_party: caseItem.represented_party || '',
                adverse_party: caseItem.adverse_party || '',
                adverse_lawyer: caseItem.adverse_lawyer || '',
                external_reference: caseItem.external_reference || ''
            });
        } else {
            setCurrentCase(null);
            setFormData({
                reference: '',
                title: '',
                client: '',
                description: '',
                category: 'CIVIL',
                status: 'OUVERT',
                opened_date: new Date().toISOString().split('T')[0],
                represented_party: '',
                adverse_party: '',
                adverse_lawyer: '',
                external_reference: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleSubmit = async () => {
        try {
            if (currentCase) {
                await casesAPI.update(currentCase.id, formData);
                showNotification("Dossier mis à jour.");
            } else {
                const response = await casesAPI.create(formData);
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

    const columns = [
        { field: 'reference', headerName: 'Référence', width: 120 },
        {
            field: 'title',
            headerName: 'Titre',
            flex: 1.5,
            minWidth: 200,
            renderCell: (params) => (
                <Typography
                    variant="body2"
                    onClick={() => navigate(`/documents?search=${encodeURIComponent(params.row.reference)}`)}
                    sx={{ fontWeight: 600, cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                >
                    {params.value}
                </Typography>
            )
        },
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
            renderCell: (params) => (
                <Chip
                    label={params.value === 'CIVIL' ? 'Civil' : 'Correctionnel'}
                    size="small"
                    sx={{
                        bgcolor: params.value === 'CIVIL' ? '#fff9c4' : '#e3f2fd',
                        color: params.value === 'CIVIL' ? '#fbc02d' : '#1976d2',
                        fontWeight: 'bold',
                        border: '1px solid',
                        borderColor: params.value === 'CIVIL' ? '#fbc02d' : '#1976d2'
                    }}
                />
            )
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
            width: 100,
            getActions: (params) => [
                <GridActionsCellItem icon={<UploadIcon color="info" />} label="Ajouter un document" onClick={() => navigate(`/documents?caseId=${params.id}&new=true`)} />,
                <GridActionsCellItem icon={<EditIcon />} label="Modifier" onClick={() => handleOpenDialog(params.row)} color="primary" />,
                <GridActionsCellItem icon={<DeleteIcon />} label="Supprimer" onClick={() => handleDeleteClick(params.row)} color="error" />,
            ],
        },
    ];

    const totalCases = cases.length;
    const openCases = cases.filter(c => c.status === 'OUVERT').length;
    const civilCases = cases.filter(c => c.category === 'CIVIL').length;
    const correctionalCases = cases.filter(c => c.category === 'CORRECTIONNEL').length;

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
            base = base.filter(c => c.category === 'CIVIL');
        } else if (filterMode === 'CORRECTIONNEL') {
            base = base.filter(c => c.category === 'CORRECTIONNEL');
        }

        return base;
    }, [cases, filterMode]);

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
                            title="Dossiers civils"
                            value={civilCases}
                            icon={<FolderIcon color="warning" />}
                            color="warning"
                            sx={{ border: filterMode === 'CIVIL' ? '2px solid' : 'none', borderColor: 'warning.main', borderRadius: 2 }}
                        />
                    </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Box onClick={() => setFilterMode('CORRECTIONNEL')} sx={{ cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)' }, opacity: filterMode === 'CORRECTIONNEL' ? 1 : 0.6 }}>
                        <StatCard
                            title="Dossiers correctionnels"
                            value={correctionalCases}
                            icon={<FolderIcon color="info" />}
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
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Référence"
                                fullWidth
                                value={formData.reference}
                                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                helperText={!currentCase ? "Laissez vide pour auto-génération" : ""}
                                placeholder={!currentCase ? "Auto-généré si vide" : ""}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}><TextField label="Titre" fullWidth value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></Grid>
                        <Grid item xs={12} sm={6}><TextField label="Client" select fullWidth value={formData.client} onChange={(e) => setFormData({ ...formData, client: e.target.value })} required>{clients.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}</TextField></Grid>
                        <Grid item xs={12} sm={6}><TextField label="Catégorie" select fullWidth value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required><MenuItem value="CIVIL">Civil</MenuItem><MenuItem value="CORRECTIONNEL">Correctionnel</MenuItem></TextField></Grid>
                        <Grid item xs={12} sm={6}><TextField label="Référence (Numéro)" fullWidth value={formData.external_reference} onChange={(e) => setFormData({ ...formData, external_reference: e.target.value })} placeholder="ex: 1234, 6778" /></Grid>
                        <Grid item xs={12} sm={6}><TextField label="Partie représentée" fullWidth value={formData.represented_party} onChange={(e) => setFormData({ ...formData, represented_party: e.target.value })} /></Grid>
                        <Grid item xs={12} sm={6}><TextField label="Partie adverse" fullWidth value={formData.adverse_party} onChange={(e) => setFormData({ ...formData, adverse_party: e.target.value })} /></Grid>
                        <Grid item xs={12} sm={6}><TextField label="Avocat partie adverse" fullWidth value={formData.adverse_lawyer} onChange={(e) => setFormData({ ...formData, adverse_lawyer: e.target.value })} /></Grid>
                        <Grid item xs={12}><TextField label="Description" fullWidth multiline rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></Grid>
                    </Grid>
                </DialogContent>
                <DialogActions><Button onClick={handleCloseDialog}>Annuler</Button><Button onClick={handleSubmit} variant="contained">Enregistrer</Button></DialogActions>
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
