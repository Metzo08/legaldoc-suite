import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    Button,
    CircularProgress,
    Alert
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { usersAPI } from '../services/api';
import { useNotification } from '../context/NotificationContext';

// Mapping des permissions avec libellés lisibles
const PERMISSION_LABELS = {
    'can_manage_users': 'Gérer les utilisateurs',
    'can_view_fees': 'Voir les honoraires',
    'can_manage_cases': 'Créer/Modifier des dossiers',
    'can_delete_cases': 'Supprimer des dossiers',
    'can_manage_documents': 'Gérer les documents',
    'can_delete_documents': 'Supprimer des documents',
    'can_view_dashboard_stats': 'Voir les statistiques',
    'can_access_audit_log': 'Accéder au journal d\'audit'
};

const ROLES = ['ADMIN', 'AVOCAT', 'COLLABORATEUR', 'SECRETAIRE', 'CLIENT'];

const RolePermissionsTable = () => {
    const { showNotification } = useNotification();
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadPermissions = async () => {
            try {
                setLoading(true);
                const response = await usersAPI.getRolePermissions();
                // Transformer la liste en objet map { ROLE: { perm: bool } }
                const permMap = {};
                response.data.results.forEach(item => {
                    permMap[item.role] = item.permissions;
                });
                setPermissions(permMap);
            } catch (error) {
                console.error(error);
                showNotification("Erreur de chargement des permissions", "error");
            } finally {
                setLoading(false);
            }
        };

        loadPermissions();
    }, [showNotification]);

    const handleTogglePermission = (role, permKey) => {
        setPermissions(prev => ({
            ...prev,
            [role]: {
                ...prev[role],
                [permKey]: !prev[role]?.[permKey]
            }
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            // Envoyer chaque rôle modifié
            const promises = Object.entries(permissions).map(([role, perms]) =>
                usersAPI.updateRolePermissions(role, { permissions: perms })
            );
            await Promise.all(promises);
            showNotification("Permissions mises à jour avec succès !", "success");
        } catch (error) {
            console.error(error);
            showNotification("Erreur lors de la sauvegarde", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <CircularProgress />;

    return (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                    <Typography variant="h6" fontWeight="bold">Matrice des Permissions</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Définissez ce que chaque rôle est autorisé à faire.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Enregistrement...' : 'Enregistrer les changements'}
                </Button>
            </Box>

            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table size="small">
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Permission / Action</TableCell>
                            {ROLES.map(role => (
                                <TableCell key={role} align="center" sx={{ fontWeight: 'bold' }}>
                                    {role}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.entries(PERMISSION_LABELS).map(([permKey, label]) => (
                            <TableRow key={permKey} hover>
                                <TableCell>{label}</TableCell>
                                {ROLES.map(role => {
                                    const isChecked = permissions[role]?.[permKey] || false;
                                    const isDisabled = role === 'ADMIN'; // Admin a toujours tout

                                    return (
                                        <TableCell key={role} align="center">
                                            <Checkbox
                                                checked={role === 'ADMIN' ? true : isChecked}
                                                onChange={() => handleTogglePermission(role, permKey)}
                                                disabled={isDisabled}
                                                color="primary"
                                                size="small"
                                            />
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Alert severity="info" sx={{ mt: 2 }}>
                Les modifications prennent effet immédiatement pour tous les utilisateurs des rôles concernés.
            </Alert>
        </Paper>
    );
};

export default RolePermissionsTable;
