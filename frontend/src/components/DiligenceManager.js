import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    IconButton,
    TextField,
    List,
    Checkbox,
    Chip,
    Autocomplete,
    alpha,
    CircularProgress
} from '@mui/material';
import {
    Delete as DeleteIcon,
    AddCircle as AddIcon,
    Note as NoteIcon,
    NoteAdd as NoteAddIcon,
    Save as SaveIcon
} from '@mui/icons-material';
import { diligencesAPI, casesAPI } from '../services/api';

/**
 * Composant de gestion des diligences (Pense-bête).
 * Peut être utilisé sur le Dashboard ou sur une page de dossier spécifique.
 * 
 * @param {Object} props
 * @param {number} props.caseId - ID du dossier pour filtrer les diligences (optionnel)
 * @param {string} props.title - Titre affiché (défaut: "Pense-bête")
 * @param {boolean} props.showCaseLink - Afficher le lien vers le dossier (défaut: true)
 */
const DiligenceManager = ({ caseId = null, title = "Pense-bête", showCaseLink = true }) => {
    const navigate = useNavigate();
    const [diligences, setDiligences] = useState([]);
    const [allCases, setAllCases] = useState([]);
    const [newItemText, setNewItemText] = useState('');
    const [selectedCase, setSelectedCase] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const params = caseId ? { case: caseId } : {};
            const diligencesRes = await diligencesAPI.getAll(params);
            setDiligences(Array.isArray(diligencesRes.data.results) ? diligencesRes.data.results : (Array.isArray(diligencesRes.data) ? diligencesRes.data : []));

            if (!caseId) {
                const casesRes = await casesAPI.getAll();
                setAllCases(Array.isArray(casesRes.data.results) ? casesRes.data.results : (Array.isArray(casesRes.data) ? casesRes.data : []));
            }
        } catch (error) {
            console.error('Erreur chargement diligences:', error);
        } finally {
            setLoading(false);
        }
    }, [caseId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const addDiligence = async () => {
        if (!newItemText.trim()) return;
        try {
            const data = {
                title: newItemText.trim(),
                case: caseId || (selectedCase ? selectedCase.id : null)
            };
            const response = await diligencesAPI.create(data);
            setDiligences([response.data, ...diligences]);
            setNewItemText('');
            setSelectedCase(null);
        } catch (error) {
            console.error('Erreur creation diligence:', error);
        }
    };

    const toggleDiligence = async (id, currentStatus) => {
        try {
            await diligencesAPI.update(id, { is_completed: !currentStatus });
            setDiligences(diligences.map(item =>
                item.id === id ? { ...item, is_completed: !currentStatus } : item
            ));
        } catch (error) {
            console.error('Erreur update diligence:', error);
        }
    };

    const deleteDiligence = async (id) => {
        try {
            await diligencesAPI.delete(id);
            setDiligences(diligences.filter(item => item.id !== id));
        } catch (error) {
            console.error('Erreur suppression diligence:', error);
        }
    };

    if (loading && diligences.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={24} sx={{ color: '#fbc02d' }} />
            </Box>
        );
    }

    return (
        <Paper sx={{
            p: 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 4,
            border: '1px solid',
            borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(251, 192, 45, 0.3)' : 'rgba(251, 192, 45, 0.2)',
            boxShadow: (theme) => `0 4px 20px ${alpha('#fbc02d', 0.05)}`,
            bgcolor: (theme) => theme.palette.mode === 'dark' ? alpha('#fbc02d', 0.02) : '#fffdf7',
            position: 'relative',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '5px',
                height: '100%',
                bgcolor: '#fbc02d',
                borderRadius: '4px 0 0 4px'
            }
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box sx={{ p: 1, borderRadius: 3, bgcolor: alpha('#fbc02d', 0.15), color: '#fbc02d', mr: 2 }}>
                    <NoteIcon sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                        {title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {caseId ? "Notes pour ce dossier" : "Diligences et rappels stratégiques"}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                mb: 3,
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
                <TextField
                    placeholder="Que faut-il faire ?"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            addDiligence();
                        }
                    }}
                    variant="standard"
                    fullWidth
                    InputProps={{
                        disableUnderline: true,
                        sx: { fontWeight: 700, mb: caseId ? 0 : 1.5, fontSize: '0.95rem' }
                    }}
                />

                {!caseId && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Autocomplete
                            size="small"
                            options={allCases}
                            getOptionLabel={(option) => option ? `${option.reference} - ${option.title}` : ''}
                            value={selectedCase}
                            isOptionEqualToValue={(option, value) => option.id === value?.id}
                            onChange={(event, newValue) => {
                                setSelectedCase(newValue);
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Lier à un dossier..."
                                    variant="outlined"
                                    sx={{
                                        minWidth: 200,
                                        '& .MuiOutlinedInput-root': {
                                            height: 32,
                                            fontSize: '0.75rem',
                                            borderRadius: 2,
                                            bgcolor: 'action.hover',
                                            '& fieldset': { border: 'none' },
                                            '&:hover fieldset': { border: 'none' },
                                            '&.Mui-focused fieldset': { border: '1px solid', borderColor: alpha('#fbc02d', 0.5) }
                                        }
                                    }}
                                />
                            )}
                            sx={{ flex: 1 }}
                        />
                        <IconButton
                            onClick={addDiligence}
                            disabled={!newItemText.trim()}
                            sx={{
                                title: "Ajouter",
                                bgcolor: '#fbc02d',
                                color: 'white',
                                width: 32,
                                height: 32,
                                '&:hover': { bgcolor: '#f9a825', transform: 'scale(1.05)' },
                                transition: 'all 0.2s',
                                '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' }
                            }}
                        >
                            <AddIcon fontSize="small" />
                        </IconButton>
                    </Box>
                )}

                {caseId && newItemText.trim() && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <IconButton
                            onClick={addDiligence}
                            sx={{
                                bgcolor: '#fbc02d',
                                color: 'white',
                                width: 32,
                                height: 32,
                                '&:hover': { bgcolor: '#f9a825' }
                            }}
                        >
                            <AddIcon fontSize="small" />
                        </IconButton>
                    </Box>
                )}
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5, minHeight: 150 }}>
                {diligences.length > 0 ? (
                    <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {diligences.map((item) => (
                            <Paper
                                key={item.id}
                                elevation={0}
                                sx={{
                                    p: 1.5,
                                    borderRadius: 3,
                                    border: '1px solid',
                                    borderColor: item.is_completed ? 'divider' : alpha('#fbc02d', 0.15),
                                    bgcolor: item.is_completed ? alpha('#000', 0.01) : 'background.paper',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                        borderColor: '#fbc02d',
                                        transform: 'translateX(4px)',
                                        boxShadow: '0 4px 12px rgba(251, 192, 45, 0.1)'
                                    }
                                }}
                            >
                                <Checkbox
                                    checked={item.is_completed}
                                    onChange={() => toggleDiligence(item.id, item.is_completed)}
                                    size="small"
                                    sx={{
                                        p: 0,
                                        mr: 1.5,
                                        color: '#fbc02d',
                                        '&.Mui-checked': { color: '#fbc02d' }
                                    }}
                                />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 700,
                                            textDecoration: item.is_completed ? 'line-through' : 'none',
                                            color: item.is_completed ? 'text.secondary' : 'text.primary',
                                            display: 'block',
                                            noWrap: true,
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        {item.title}
                                    </Typography>
                                    {!caseId && showCaseLink && item.case_reference && (() => {
                                        const category = item.case_category || 'CIVIL';
                                        const isYellow = ['CIVIL', 'COMMERCIAL', 'SOCIAL', 'TI_FAMILLE'].includes(category);
                                        const isBlue = ['PENAL', 'CORRECTIONNEL'].includes(category);
                                        return (
                                            <Chip
                                                label={item.case_reference}
                                                size="small"
                                                variant="outlined"
                                                onClick={() => navigate(`/cases/${item.case}`)}
                                                sx={{
                                                    height: 18,
                                                    fontSize: '0.6rem',
                                                    fontWeight: 800,
                                                    mt: 0.5,
                                                    color: isYellow ? '#a16207' : (isBlue ? '#1d4ed8' : 'primary.main'),
                                                    borderColor: isYellow ? '#facc15' : (isBlue ? '#3b82f6' : 'divider'),
                                                    bgcolor: isYellow ? '#fefce8' : (isBlue ? '#eff6ff' : 'action.hover'),
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        bgcolor: isYellow ? '#fef9c3' : (isBlue ? '#dbeafe' : 'action.selected'),
                                                        borderColor: isYellow ? '#facc15' : (isBlue ? '#3b82f6' : 'primary.main')
                                                    }
                                                }}
                                            />
                                        );
                                    })()}
                                </Box>
                                <IconButton
                                    size="small"
                                    onClick={() => deleteDiligence(item.id)}
                                    sx={{
                                        color: 'text.disabled',
                                        transition: 'all 0.2s',
                                        '&:hover': { color: 'error.main', bgcolor: alpha('#dc2626', 0.05) },
                                        opacity: 0.5
                                    }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Paper>
                        ))}
                    </List>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 4, opacity: 0.4 }}>
                        <NoteAddIcon sx={{ fontSize: 48, mb: 1, color: '#fbc02d' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Aucune note enregistrée.</Typography>
                    </Box>
                )}
            </Box>

            <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.disabled', display: 'flex', alignItems: 'center', gap: 0.6, fontWeight: 600 }}>
                    <SaveIcon sx={{ fontSize: 12 }} /> Synchronisation chiffrée active
                </Typography>
            </Box>
        </Paper>
    );
};

export default DiligenceManager;
