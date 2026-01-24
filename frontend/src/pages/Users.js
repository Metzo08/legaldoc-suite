import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNotification } from '../context/NotificationContext';
import {
    Box,
    Paper,
    Button,
    Typography,
    Grid,
    Chip,
    Tabs,
    Tab
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
    Person as UserIcon,
    AdminPanelSettings as AdminIcon,
    ToggleOn as ActiveIcon,
    ToggleOff as InactiveIcon,
    Security as SecurityIcon
} from '@mui/icons-material';
import { usersAPI } from '../services/api';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import StatCard from '../components/StatCard';
import UserDialog from '../components/UserDialog';
import RolePermissionsTable from '../components/RolePermissionsTable';
import authService from '../services/authService';

function Users() {
    const { showNotification } = useNotification();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // État pour la suppression
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    // État pour le filtrage
    const [filterRole, setFilterRole] = useState('ALL');

    // État pour les onglets
    const [tabValue, setTabValue] = useState(0);

    const currentUser = authService.getCurrentUser();
    const isAdmin = currentUser?.role === 'ADMIN';

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await usersAPI.getAll();
            setUsers(response.data.results || response.data);
        } catch (err) {
            console.error(err);
            showNotification("Erreur lors du chargement des utilisateurs.", "error");
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleOpenDialog = (user = null) => {
        setSelectedUser(user);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedUser(null);
    };

    const handleSaveUser = async (userData) => {
        try {
            if (selectedUser) {
                await usersAPI.update(selectedUser.id, userData);
                showNotification("Utilisateur mis à jour.");
            } else {
                await usersAPI.create(userData);
                showNotification("Utilisateur créé avec succès !");
            }
            handleCloseDialog();
            loadData();
        } catch (err) {
            console.error(err);
            showNotification(err.response?.data?.detail || "Erreur lors de l'enregistrement", "error");
        }
    };

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await usersAPI.delete(userToDelete.id);
            showNotification("Utilisateur supprimé.");
            setDeleteDialogOpen(false);
            setUserToDelete(null);
            loadData();
        } catch (err) {
            console.error(err);
            showNotification("Erreur lors de la suppression.", "error");
        }
    };

    const handleToggleStatus = async (user) => {
        try {
            if (user.is_active) {
                await usersAPI.deactive(user.id);
                showNotification("Utilisateur désactivé.");
            } else {
                await usersAPI.activate(user.id);
                showNotification("Utilisateur activé.");
            }
            loadData();
        } catch (err) {
            console.error(err);
            showNotification("Erreur lors du changement de statut.", "error");
        }
    };

    const getRoleConfig = (role) => {
        const configs = {
            'ADMIN': { label: 'Administrateur', color: 'error', icon: <AdminIcon fontSize="small" /> },
            'AVOCAT': { label: 'Avocat', color: 'primary', icon: <UserIcon fontSize="small" /> },
            'COLLABORATEUR': { label: 'Collaborateur', color: 'info', icon: <UserIcon fontSize="small" /> },
            'SECRETAIRE': { label: 'Secrétaire', color: 'success', icon: <UserIcon fontSize="small" /> },
            'CLIENT': { label: 'Client', color: 'default', icon: <UserIcon fontSize="small" /> }
        };
        return configs[role] || { label: role, color: 'default', icon: <UserIcon fontSize="small" /> };
    };

    const columns = [
        {
            field: 'username',
            headerName: 'Utilisateur',
            flex: 1,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: 'primary.light',
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 1.5,
                        fontWeight: 'bold',
                        fontSize: '0.8rem'
                    }}>
                        {params.row.first_name?.[0] || params.value[0].toUpperCase()}
                    </Box>
                    <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {params.row.first_name} {params.row.last_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            @{params.value}
                        </Typography>
                    </Box>
                </Box>
            )
        },
        { field: 'email', headerName: 'Email', flex: 1.2 },
        {
            field: 'role',
            headerName: 'Rôle',
            width: 150,
            renderCell: (params) => {
                const config = getRoleConfig(params.value);
                return (
                    <Chip
                        icon={config.icon}
                        label={config.label}
                        color={config.color}
                        size="small"
                        variant="outlined"
                    />
                );
            }
        },
        {
            field: 'is_active',
            headerName: 'Statut',
            width: 120,
            renderCell: (params) => (
                <Chip
                    label={params.value ? "Actif" : "Inactif"}
                    color={params.value ? "success" : "default"}
                    size="small"
                    icon={params.value ? <ActiveIcon /> : <InactiveIcon />}
                />
            )
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            width: 150,
            getActions: (params) => [
                <GridActionsCellItem
                    icon={<EditIcon />}
                    label="Modifier"
                    onClick={() => handleOpenDialog(params.row)}
                    color="primary"
                />,
                <GridActionsCellItem
                    icon={params.row.is_active ? <InactiveIcon /> : <ActiveIcon />}
                    label={params.row.is_active ? "Désactiver" : "Activer"}
                    onClick={() => handleToggleStatus(params.row)}
                    color="warning"
                    disabled={!isAdmin && params.row.role === 'ADMIN'}
                />,
                <GridActionsCellItem
                    icon={<DeleteIcon />}
                    label="Supprimer"
                    onClick={() => handleDeleteClick(params.row)}
                    color="error"
                    disabled={params.row.role === 'ADMIN'}
                />,
            ],
        },
    ];

    // Stats
    const totalUsers = users.length;
    const activeUsersCount = users.filter(u => u.is_active).length;
    const adminUsersCount = users.filter(u => u.role === 'ADMIN').length;

    const filteredUsers = useMemo(() => {
        if (filterRole === 'ALL') return users;
        if (filterRole === 'ACTIVE') return users.filter(u => u.is_active);
        return users.filter(u => u.role === filterRole);
    }, [users, filterRole]);

    return (
        <Box sx={{ width: '100%', pb: 3 }}>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3
            }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
                        Utilisateurs & rôles
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Gérez les membres de votre cabinet, leurs accès et leurs permissions.
                    </Typography>
                </Box>
                {/* Seul l'admin peut ajouter des utilisateurs directement */}
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    sx={{ borderRadius: 2, px: 3, py: 1 }}
                >
                    Nouvel utilisateur
                </Button>
            </Box>

            {/* Onglets de navigation */}
            <Paper sx={{ mb: 3, borderRadius: 2 }}>
                <Tabs
                    value={tabValue}
                    onChange={(e, v) => setTabValue(v)}
                    indicatorColor="primary"
                    textColor="primary"
                    sx={{ px: 2 }}
                >
                    <Tab label="Liste des utilisateurs" icon={<UserIcon />} iconPosition="start" />
                    <Tab label="Gestion des permissions" icon={<SecurityIcon />} iconPosition="start" />
                </Tabs>
            </Paper>

            {/* Contenu - Onglet Utilisateurs */}
            {tabValue === 0 && (
                <>
                    {/* Summary Cards */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} sm={4}>
                            <Box onClick={() => setFilterRole('ALL')} sx={{ cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)' }, opacity: filterRole === 'ALL' ? 1 : 0.6 }}>
                                <StatCard
                                    title="Total utilisateurs"
                                    value={totalUsers}
                                    icon={<UserIcon color="primary" />}
                                    color="primary"
                                    sx={{ border: filterRole === 'ALL' ? '2px solid' : 'none', borderColor: 'primary.main', borderRadius: 2 }}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Box onClick={() => setFilterRole('ACTIVE')} sx={{ cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)' }, opacity: filterRole === 'ACTIVE' ? 1 : 0.6 }}>
                                <StatCard
                                    title="Membres actifs"
                                    value={activeUsersCount}
                                    icon={<ActiveIcon color="success" />}
                                    color="success"
                                    sx={{ border: filterRole === 'ACTIVE' ? '2px solid' : 'none', borderColor: 'success.main', borderRadius: 2 }}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Box onClick={() => setFilterRole('ADMIN')} sx={{ cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)' }, opacity: filterRole === 'ADMIN' ? 1 : 0.6 }}>
                                <StatCard
                                    title="Administrateurs"
                                    value={adminUsersCount}
                                    icon={<AdminIcon color="error" />}
                                    color="error"
                                    sx={{ border: filterRole === 'ADMIN' ? '2px solid' : 'none', borderColor: 'error.main', borderRadius: 2 }}
                                />
                            </Box>
                        </Grid>
                    </Grid>


                    <Paper sx={{ height: 600, width: '100%', borderRadius: 3, overflow: 'hidden', boxShadow: 3 }}>
                        <DataGrid
                            rows={filteredUsers}
                            columns={columns}
                            loading={loading}
                            initialState={{
                                pagination: {
                                    paginationModel: { page: 0, pageSize: 10 },
                                },
                            }}
                            pageSizeOptions={[10, 25, 50]}
                            disableRowSelectionOnClick
                            slots={{ toolbar: GridToolbar }}
                            slotProps={{
                                toolbar: {
                                    showQuickFilter: true,
                                    quickFilterProps: { debounceMs: 500 },
                                },
                            }}
                            localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                            sx={{
                                border: 0,
                                '& .MuiDataGrid-columnHeaders': {
                                    backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc',
                                    color: 'text.primary',
                                    fontWeight: 700,
                                },
                                '& .MuiDataGrid-row:hover': {
                                    backgroundColor: 'action.hover',
                                }
                            }}
                        />
                    </Paper>
                </>
            )}

            {/* Contenu - Onglet Permissions */}
            {tabValue === 1 && (
                <RolePermissionsTable />
            )}

            <UserDialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                onSave={handleSaveUser}
                userToEdit={selectedUser}
            />

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleConfirmDelete}
                title="cet utilisateur"
                itemName={userToDelete?.username}
            />
        </Box>
    );
}

export default Users;
