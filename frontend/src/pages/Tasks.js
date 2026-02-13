import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    MenuItem, Grid, FormControl, InputLabel, Select, Tooltip,
    InputAdornment, useTheme
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Assignment as AssignmentIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import { tasksAPI, usersAPI, casesAPI } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const TaskDialog = ({ open, onClose, onSave, task, users, cases }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assigned_to: '',
        case: '',
        due_date: '',
        priority: 'MEDIUM',
        status: 'TODO'
    });

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title,
                description: task.description || '',
                assigned_to: task.assigned_to || '',
                case: task.case || '',
                due_date: task.due_date ? task.due_date.split('T')[0] : '', // Format YYYY-MM-DD
                priority: task.priority || 'MEDIUM',
                status: task.status || 'TODO'
            });
        } else {
            setFormData({
                title: '',
                description: '',
                assigned_to: '',
                case: '',
                due_date: '',
                priority: 'MEDIUM',
                status: 'TODO'
            });
        }
    }, [task]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{task ? 'Modifier la tâche' : 'Nouvelle tâche'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <TextField
                            name="title"
                            label="Titre de la tâche"
                            fullWidth
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            name="description"
                            label="Description"
                            fullWidth
                            multiline
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Assigner à</InputLabel>
                            <Select
                                name="assigned_to"
                                value={formData.assigned_to}
                                onChange={handleChange}
                                label="Assigner à"
                            >
                                <MenuItem value=""><em>Non assigné</em></MenuItem>
                                {users.map(user => (
                                    <MenuItem key={user.id} value={user.id}>
                                        {user.first_name} {user.last_name} ({user.role})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Dossier lié</InputLabel>
                            <Select
                                name="case"
                                value={formData.case}
                                onChange={handleChange}
                                label="Dossier lié"
                            >
                                <MenuItem value=""><em>Aucun</em></MenuItem>
                                {cases.map(c => (
                                    <MenuItem key={c.id} value={c.id}>
                                        {c.reference} - {c.title}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            name="due_date"
                            label="Date d'échéance"
                            type="date"
                            fullWidth
                            value={formData.due_date}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                            <InputLabel>Priorité</InputLabel>
                            <Select
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                label="Priorité"
                            >
                                <MenuItem value="LOW">Basse</MenuItem>
                                <MenuItem value="MEDIUM">Moyenne</MenuItem>
                                <MenuItem value="HIGH">Haute</MenuItem>
                                <MenuItem value="URGENT">Urgente</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                            <InputLabel>Statut</InputLabel>
                            <Select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                label="Statut"
                            >
                                <MenuItem value="TODO">À faire</MenuItem>
                                <MenuItem value="IN_PROGRESS">En cours</MenuItem>
                                <MenuItem value="REVIEW">En révision</MenuItem>
                                <MenuItem value="DONE">Terminé</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">
                    Enregistrer
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const Tasks = () => {
    const theme = useTheme();
    const { showNotification } = useNotification();
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [cases, setCases] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const [tasksRes, usersRes, casesRes] = await Promise.all([
                tasksAPI.getAll(),
                usersAPI.getAll(),
                casesAPI.getAll()
            ]);
            setTasks(Array.isArray(tasksRes.data.results) ? tasksRes.data.results : (Array.isArray(tasksRes.data) ? tasksRes.data : []));
            setUsers(Array.isArray(usersRes.data.results) ? usersRes.data.results : (Array.isArray(usersRes.data) ? usersRes.data : []));
            setCases(Array.isArray(casesRes.data.results) ? casesRes.data.results : (Array.isArray(casesRes.data) ? casesRes.data : []));
        } catch (error) {
            console.error("Erreur chargement données:", error);
            showNotification('Erreur lors du chargement des tâches', 'error');
        }
    }, [showNotification]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreate = () => {
        setCurrentTask(null);
        setDialogOpen(true);
    };

    const handleEdit = (task) => {
        setCurrentTask(task);
        setDialogOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Voulez-vous vraiment supprimer cette tâche ?')) {
            try {
                await tasksAPI.delete(id);
                showNotification('Tâche supprimée avec succès', 'success');
                fetchData();
            } catch (error) {
                showNotification('Erreur lors de la suppression', 'error');
            }
        }
    };

    const handleSave = async (data) => {
        try {
            // Convertir due_date en ISO si présent, sinon null
            const payload = {
                ...data,
                assigned_to: data.assigned_to || null,
                case: data.case || null,
                due_date: data.due_date ? new Date(data.due_date).toISOString() : null
            };

            if (currentTask) {
                await tasksAPI.update(currentTask.id, payload);
                showNotification('Tâche mise à jour', 'success');
            } else {
                await tasksAPI.create(payload);
                showNotification('Tâche créée', 'success');
            }
            setDialogOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            showNotification('Erreur lors de l\'enregistrement', 'error');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'TODO': return 'default';
            case 'IN_PROGRESS': return 'info';
            case 'REVIEW': return 'warning';
            case 'DONE': return 'success';
            default: return 'default';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'TODO': return 'À faire';
            case 'IN_PROGRESS': return 'En cours';
            case 'REVIEW': return 'En révision';
            case 'DONE': return 'Terminé';
            default: return status;
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'LOW': return '#4caf50';
            case 'MEDIUM': return '#ff9800';
            case 'HIGH': return '#f44336';
            case 'URGENT': return '#d32f2f';
            default: return theme.palette.text.secondary;
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = filterStatus ? task.status === filterStatus : true;
        return matchesSearch && matchesStatus;
    });

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    Gestion des Tâches
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                    sx={{ borderRadius: 2, px: 3 }}
                >
                    Nouvelle Tâche
                </Button>
            </Box>

            <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            placeholder="Rechercher une tâche..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Filtrer par statut</InputLabel>
                            <Select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                label="Filtrer par statut"
                            >
                                <MenuItem value="">Tous</MenuItem>
                                <MenuItem value="TODO">À faire</MenuItem>
                                <MenuItem value="IN_PROGRESS">En cours</MenuItem>
                                <MenuItem value="REVIEW">En révision</MenuItem>
                                <MenuItem value="DONE">Terminé</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
                <Table>
                    <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100' }}>
                        <TableRow>
                            <TableCell>Titre</TableCell>
                            <TableCell>Assigné à</TableCell>
                            <TableCell>Priorité</TableCell>
                            <TableCell>Date d'échéance</TableCell>
                            <TableCell>Statut</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredTasks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                    Aucune tâche trouvée.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTasks.map((task) => (
                                <TableRow key={task.id} hover>
                                    <TableCell>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                            {task.title}
                                        </Typography>
                                        {task.case_reference && (
                                            <Typography variant="caption" color="text.secondary">
                                                Dossier: {task.case_reference}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {task.assigned_to_name ? (
                                            <Chip
                                                label={task.assigned_to_name}
                                                size="small"
                                                avatar={<AssignmentIcon />}
                                                variant="outlined"
                                            />
                                        ) : (
                                            <Typography variant="caption" color="text.secondary">Non assigné</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box
                                                sx={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: '50%',
                                                    bgcolor: getPriorityColor(task.priority),
                                                    mr: 1
                                                }}
                                            />
                                            {task.priority === 'LOW' && 'Basse'}
                                            {task.priority === 'MEDIUM' && 'Moyenne'}
                                            {task.priority === 'HIGH' && 'Haute'}
                                            {task.priority === 'URGENT' && 'Urgente'}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        {task.due_date ? format(new Date(task.due_date), 'dd/MM/yyyy', { locale: fr }) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={getStatusLabel(task.status)}
                                            color={getStatusColor(task.status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Modifier">
                                            <IconButton size="small" onClick={() => handleEdit(task)} color="primary">
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Supprimer">
                                            <IconButton size="small" onClick={() => handleDelete(task.id)} color="error">
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <TaskDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSave={handleSave}
                task={currentTask}
                users={users}
                cases={cases}
            />
        </Box>
    );
};

export default Tasks;
