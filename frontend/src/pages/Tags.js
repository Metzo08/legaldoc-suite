import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    IconButton,
    CircularProgress
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Label as LabelIcon
} from '@mui/icons-material';
import { tagsAPI } from '../services/api';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';


function Tags() {
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingTag, setEditingTag] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        color: '#6366f1',
        description: ''
    });

    // État pour la suppression
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [tagToDelete, setTagToDelete] = useState(null);


    const colorPresets = [
        '#6366f1', // Indigo
        '#8b5cf6', // Violet
        '#ec4899', // Rose
        '#f43f5e', // Rouge
        '#f59e0b', // Ambre
        '#10b981', // Émeraude
        '#06b6d4', // Cyan
        '#3b82f6', // Bleu
    ];

    const loadTags = useCallback(async () => {
        try {
            setLoading(true);
            const response = await tagsAPI.getAll();
            setTags(Array.isArray(response.data.results) ? response.data.results : (Array.isArray(response.data) ? response.data : []));
        } catch (error) {
            console.error('Erreur chargement tags:', error);
            showNotification('Erreur lors du chargement des tags', 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        loadTags();
    }, [loadTags]);

    const handleOpenDialog = (tag = null) => {
        if (tag) {
            setEditingTag(tag);
            setFormData({
                name: tag.name,
                color: tag.color,
                description: tag.description || ''
            });
        } else {
            setEditingTag(null);
            setFormData({
                name: '',
                color: '#6366f1',
                description: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingTag(null);
    };

    const handleSubmit = async () => {
        try {
            if (editingTag) {
                await tagsAPI.update(editingTag.id, formData);
                showNotification("Tag mis à jour.");
            } else {
                await tagsAPI.create(formData);
                showNotification("Tag créé avec succès !");
            }
            handleCloseDialog();
            loadTags();
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            showNotification("Erreur lors de la sauvegarde du tag.", "error");
        }
    };

    const handleDeleteClick = (tag) => {
        setTagToDelete(tag);
        setDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!tagToDelete) return;
        try {
            await tagsAPI.delete(tagToDelete.id);
            showNotification("Tag supprimé.");
            setDeleteDialog(false);
            setTagToDelete(null);
            loadTags();
        } catch (error) {
            console.error('Erreur suppression:', error);
            showNotification("Erreur lors de la suppression.", "error");
        }
    };


    if (loading && tags.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

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
                        Tags
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Organisez vos documents avec des étiquettes personnalisées.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    sx={{ borderRadius: 2, px: 3, py: 1 }}
                >
                    Nouveau tag
                </Button>
            </Box>


            {/* Tags Grid */}
            <Grid container spacing={3}>
                {tags.map((tag) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={tag.id}>
                        <Card sx={{
                            height: '100%',
                            borderLeft: 6,
                            borderColor: tag.color,
                            cursor: 'pointer',
                            '&:hover': {
                                boxShadow: 6,
                                transform: 'translateY(-4px)',
                                transition: 'all 0.2s',
                                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                            }
                        }}
                            onClick={() => navigate(`/documents?search=${encodeURIComponent(tag.name)}`)}
                        >
                            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <LabelIcon sx={{ color: tag.color, mr: 1, fontSize: 20 }} />
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                            {tag.name}
                                        </Typography>
                                    </Box>
                                    {tag.description && (
                                        <Typography variant="body2" color="text.secondary">
                                            {tag.description}
                                        </Typography>
                                    )}
                                </Box>
                                <Box sx={{ display: 'flex' }}>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenDialog(tag);
                                        }}
                                        color="primary"
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteClick(tag);
                                        }}
                                        color="error"
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>

                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {tags.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <LabelIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        Aucun tag
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Créez votre premier tag pour commencer à organiser vos documents
                    </Typography>
                </Box>
            )}

            {/* Dialog Création/Édition */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingTag ? 'Modifier le tag' : 'Nouveau tag'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            label="Nom du tag"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            fullWidth
                            required
                        />

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary' }}>
                                Couleur
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                {colorPresets.map((color) => (
                                    <Box
                                        key={color}
                                        onClick={() => setFormData({ ...formData, color })}
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: '50%',
                                            bgcolor: color,
                                            cursor: 'pointer',
                                            border: '2px solid',
                                            borderColor: formData.color === color ? 'text.primary' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'transform 0.2s',
                                            '&:hover': {
                                                transform: 'scale(1.2)'
                                            }
                                        }}
                                    >
                                        {formData.color === color && (
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'white' }} />
                                        )}
                                    </Box>
                                ))}
                                <input
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    style={{
                                        width: 32,
                                        height: 32,
                                        padding: 0,
                                        border: 'none',
                                        borderRadius: '50%',
                                        cursor: 'pointer'
                                    }}
                                />
                            </Box>
                        </Box>

                        <TextField
                            label="Description (optionnel)"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            multiline
                            rows={2}
                            fullWidth
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Annuler</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={!formData.name}
                    >
                        {editingTag ? 'Modifier' : 'Créer'}
                    </Button>
                </DialogActions>
            </Dialog>

            <DeleteConfirmDialog
                open={deleteDialog}
                onClose={() => setDeleteDialog(false)}
                onConfirm={handleConfirmDelete}
                title="ce tag"
                itemName={tagToDelete?.name}
            />
        </Box>
    );
}

export default Tags;
