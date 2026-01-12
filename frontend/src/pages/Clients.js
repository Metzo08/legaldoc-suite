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
    Avatar
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
    Person as PersonIcon,
    Business as BusinessIcon,
    Group as GroupIcon,
    Folder as FolderIcon
} from '@mui/icons-material';
import { clientsAPI } from '../services/api';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import WorkflowRedirectDialog from '../components/WorkflowRedirectDialog';
import StatCard from '../components/StatCard';

// Fonction utilitaire pour générer une couleur à partir du nom
const stringToColor = (string) => {
    let hash = 0;
    for (let i = 0; i < string.length; i += 1) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i += 1) {
        const value = (hash >> (i * 8)) & 0xff;
        color += `00${value.toString(16)}`.slice(-2);
    }
    return color;
};

const stringAvatar = (name) => {
    if (!name) return { sx: { bgcolor: '#ccc' }, children: '?' };
    return {
        sx: {
            bgcolor: stringToColor(name),
            width: 32,
            height: 32,
            fontSize: 14,
            mr: 1
        },
        children: name.split(' ').length > 1
            ? `${name.split(' ')[0][0]}${name.split(' ')[1][0]}`.toUpperCase()
            : name.substr(0, 2).toUpperCase(),
    };
};

function Clients() {
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialSearch = searchParams.get('search') || '';

    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [currentClient, setCurrentClient] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        client_type: 'PARTICULIER',
        company_registration: '',
        notes: ''
    });

    const [deleteDialog, setDeleteDialog] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);

    // Workflow Redirect State
    const [redirectDialog, setRedirectDialog] = useState({ open: false, clientId: null });

    const loadClients = useCallback(async () => {
        try {
            setLoading(true);
            const response = await clientsAPI.getAll();
            setClients(response.data.results || response.data);
        } catch (error) {
            console.error('Erreur chargement clients:', error);
            showNotification("Erreur lors du chargement des clients.", "error");
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        loadClients();
    }, [loadClients]);

    const handleOpenDialog = (client = null) => {
        if (client) {
            setCurrentClient(client);
            setFormData({
                name: client.name,
                email: client.email || '',
                phone: client.phone || '',
                address: client.address || '',
                client_type: client.client_type,
                company_registration: client.company_registration || '',
                notes: client.notes || ''
            });
        } else {
            setCurrentClient(null);
            setFormData({
                name: '',
                email: '',
                phone: '',
                address: '',
                client_type: 'PARTICULIER',
                company_registration: '',
                notes: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleSubmit = async () => {
        try {
            if (currentClient) {
                await clientsAPI.update(currentClient.id, formData);
                showNotification("Client mis à jour.");
            } else {
                const response = await clientsAPI.create(formData);
                const newClient = response.data;
                showNotification("Client créé avec succès !");

                // Ouvrir le dialogue de redirection premium
                setTimeout(() => {
                    setRedirectDialog({ open: true, clientId: newClient.id });
                }, 500);
            }
            handleCloseDialog();
            loadClients();
        } catch (error) {
            console.error('Erreur enregistrement client:', error);
            showNotification("Erreur lors de l'enregistrement.", "error");
        }
    };

    const handleDeleteClick = (client) => {
        setClientToDelete(client);
        setDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await clientsAPI.delete(clientToDelete.id);
            showNotification("Client supprimé.");
            setDeleteDialog(false);
            setClientToDelete(null);
            loadClients();
        } catch (error) {
            console.error('Erreur suppression client:', error);
            showNotification("Erreur lors de la suppression.", "error");
        }
    };

    const columns = [
        {
            field: 'name',
            headerName: 'Nom / Raison Sociale',
            flex: 1,
            renderCell: (params) => (
                <Box
                    onClick={() => navigate(`/cases?search=${encodeURIComponent(params.value)}`)}
                    sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                >
                    <Avatar {...stringAvatar(params.value)} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>{params.value}</Typography>
                </Box>
            )
        },
        { field: 'email', headerName: 'Email', flex: 1 },
        { field: 'phone', headerName: 'Téléphone', width: 150 },
        {
            field: 'client_type',
            headerName: 'Type',
            width: 150,
            renderCell: (params) => (
                <Chip
                    icon={params.value === 'ENTREPRISE' ? <BusinessIcon /> : <PersonIcon />}
                    label={params.value === 'ENTREPRISE' ? 'Entreprise' : 'Particulier'}
                    size="small"
                    variant="outlined"
                    color={params.value === 'ENTREPRISE' ? 'primary' : 'default'}
                />
            )
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            width: 100,
            getActions: (params) => [
                <GridActionsCellItem icon={<FolderIcon color="info" />} label="Ouvrir un dossier" onClick={() => navigate(`/cases?clientId=${params.id}&new=true`)} />,
                <GridActionsCellItem icon={<EditIcon />} label="Modifier" onClick={() => handleOpenDialog(params.row)} color="primary" />,
                <GridActionsCellItem icon={<DeleteIcon />} label="Supprimer" onClick={() => handleDeleteClick(params.row)} color="error" />,
            ],
        },
    ];

    const [filterType, setFilterType] = useState('ALL');

    const totalClients = clients.length;
    const individualClients = clients.filter(c => c.client_type === 'PARTICULIER').length;
    const businessClients = clients.filter(c => c.client_type === 'ENTREPRISE').length;

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

    const filteredClients = useMemo(() => {
        let base = clients;
        if (filterType !== 'ALL') {
            base = base.filter(c => c.client_type === filterType);
        }
        return base;
    }, [clients, filterType]);

    return (
        <Box sx={{ width: '100%', pb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>Clients</Typography>
                    <Typography variant="body1" color="text.secondary">Gérez votre base de clients et leurs dossiers associés.</Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ borderRadius: 2, px: 3, py: 1 }}>Nouveau client</Button>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                    <Box onClick={() => setFilterType('ALL')} sx={{ cursor: 'pointer', opacity: filterType === 'ALL' ? 1 : 0.6, transition: '0.2s', '&:hover': { transform: 'translateY(-4px)', opacity: 1 } }}>
                        <StatCard title="Total clients" value={totalClients} icon={<GroupIcon color="primary" />} color="primary" sx={{ border: filterType === 'ALL' ? '2px solid' : 'none', borderColor: 'primary.main' }} />
                    </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Box onClick={() => setFilterType('PARTICULIER')} sx={{ cursor: 'pointer', opacity: filterType === 'PARTICULIER' ? 1 : 0.6, transition: '0.2s', '&:hover': { transform: 'translateY(-4px)', opacity: 1 } }}>
                        <StatCard title="Particuliers" value={individualClients} icon={<PersonIcon color="info" />} color="info" sx={{ border: filterType === 'PARTICULIER' ? '2px solid' : 'none', borderColor: 'info.main' }} />
                    </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Box onClick={() => setFilterType('ENTREPRISE')} sx={{ cursor: 'pointer', opacity: filterType === 'ENTREPRISE' ? 1 : 0.6, transition: '0.2s', '&:hover': { transform: 'translateY(-4px)', opacity: 1 } }}>
                        <StatCard title="Entreprises" value={businessClients} icon={<BusinessIcon color="success" />} color="success" sx={{ border: filterType === 'ENTREPRISE' ? '2px solid' : 'none', borderColor: 'success.main' }} />
                    </Box>
                </Grid>
            </Grid>

            <Paper sx={{ height: 600, width: '100%', borderRadius: 3, overflow: 'hidden', boxShadow: 3 }}>
                <DataGrid
                    rows={filteredClients}
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
                    sx={{
                        border: 0,
                        '& .MuiDataGrid-columnHeaders': { backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', fontWeight: 700 },
                        '& .MuiDataGrid-row:hover': { backgroundColor: 'action.hover' }
                    }}
                />
            </Paper>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>{currentClient ? 'Modifier le client' : 'Nouveau client'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}><TextField label="Nom / Raison Sociale" fullWidth value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></Grid>
                        <Grid item xs={12} sm={6}><TextField label="Type de client" select fullWidth value={formData.client_type} onChange={(e) => setFormData({ ...formData, client_type: e.target.value })} required><MenuItem value="PARTICULIER">Particulier</MenuItem><MenuItem value="ENTREPRISE">Entreprise</MenuItem></TextField></Grid>
                        <Grid item xs={12} sm={6}><TextField label="Email" type="email" fullWidth value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></Grid>
                        <Grid item xs={12} sm={6}><TextField label="Téléphone" fullWidth value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></Grid>
                        <Grid item xs={12}><TextField label="Adresse" fullWidth multiline rows={2} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></Grid>
                        {formData.client_type === 'ENTREPRISE' && <Grid item xs={12} sm={6}><TextField label="Registre du Commerce / SIRET" fullWidth value={formData.company_registration} onChange={(e) => setFormData({ ...formData, company_registration: e.target.value })} /></Grid>}
                        <Grid item xs={12}><TextField label="Notes" fullWidth multiline rows={3} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></Grid>
                    </Grid>
                </DialogContent>
                <DialogActions><Button onClick={handleCloseDialog}>Annuler</Button><Button onClick={handleSubmit} variant="contained">Enregistrer</Button></DialogActions>
            </Dialog>

            <DeleteConfirmDialog
                open={deleteDialog}
                onClose={() => setDeleteDialog(false)}
                onConfirm={handleConfirmDelete}
                title="Supprimer le client"
                message={`Êtes-vous sûr de vouloir supprimer ${clientToDelete?.name} ? Cette action est irréversible et supprimera tous les dossiers et documents associés.`}
            />

            <WorkflowRedirectDialog
                open={redirectDialog.open}
                onClose={() => setRedirectDialog({ ...redirectDialog, open: false })}
                onConfirm={() => {
                    setRedirectDialog({ ...redirectDialog, open: false });
                    navigate(`/cases?clientId=${redirectDialog.clientId}&new=true`);
                }}
                title="Dossier Client"
                message="Le client a été enregistré. Souhaitez-vous ouvrir son premier dossier maintenant ?"
                confirmText="Ouvrir un dossier"
                cancelText="Plus tard"
            />
        </Box>
    );
}

export default Clients;
