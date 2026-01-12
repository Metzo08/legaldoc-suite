import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Grid,
    FormControl,
    InputLabel,
    Select
} from '@mui/material';
import { useNotification } from '../context/NotificationContext';

const ROLES = [
    { value: 'ADMIN', label: 'Administrateur' },
    { value: 'AVOCAT', label: 'Avocat' },
    { value: 'COLLABORATEUR', label: 'Collaborateur' },
    { value: 'STAGIAIRE', label: 'Stagiaire' },
    { value: 'SECRETAIRE', label: 'Secrétaire' },
    { value: 'CLIENT', label: 'Client' },
];

function UserDialog({ open, onClose, onSave, userToEdit }) {
    const { showNotification } = useNotification();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        password_confirm: '',
        role: 'COLLABORATEUR',
        department: '',
        phone: ''
    });

    useEffect(() => {
        if (userToEdit) {
            setFormData({
                ...userToEdit,
                password: '',
                password_confirm: ''
            });
        } else {
            setFormData({
                username: '',
                email: '',
                first_name: '',
                last_name: '',
                password: '',
                password_confirm: '',
                role: 'COLLABORATEUR',
                department: '',
                phone: ''
            });
        }
    }, [userToEdit, open]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = () => {
        // Validation basique
        if (!formData.username || !formData.email) {
            showNotification('Veuillez remplir les champs obligatoires (Nom d\'utilisateur et Email)', 'warning');
            return;
        }

        if (!userToEdit) {
            if (!formData.password || formData.password !== formData.password_confirm) {
                showNotification('Les mots de passe ne correspondent pas ou sont vides', 'warning');
                return;
            }
        }

        onSave(formData);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {userToEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            name="username"
                            label="Nom d'utilisateur"
                            fullWidth
                            value={formData.username}
                            onChange={handleChange}
                            required
                            disabled={!!userToEdit}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            name="email"
                            label="Email"
                            type="email"
                            fullWidth
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            name="first_name"
                            label="Prénom"
                            fullWidth
                            value={formData.first_name}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            name="last_name"
                            label="Nom"
                            fullWidth
                            value={formData.last_name}
                            onChange={handleChange}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Rôle</InputLabel>
                            <Select
                                name="role"
                                value={formData.role}
                                label="Rôle"
                                onChange={handleChange}
                            >
                                {ROLES.map((role) => (
                                    <MenuItem key={role.value} value={role.value}>
                                        {role.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            name="phone"
                            label="Téléphone"
                            fullWidth
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            name="department"
                            label="Département / Service"
                            fullWidth
                            value={formData.department}
                            onChange={handleChange}
                        />
                    </Grid>

                    {!userToEdit && (
                        <>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    name="password"
                                    label="Mot de passe"
                                    type="password"
                                    fullWidth
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    name="password_confirm"
                                    label="Confirmer mot de passe"
                                    type="password"
                                    fullWidth
                                    value={formData.password_confirm}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                        </>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">
                    {userToEdit ? 'Mettre à jour' : 'Créer'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default UserDialog;
