import React, { useState } from 'react';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    InputAdornment,
    alpha
} from '@mui/material';
import {
    Search as SearchIcon,
    Download as DownloadIcon,
    Visibility as ViewIcon,
    Description as DescriptionIcon
} from '@mui/icons-material';
import { DataGrid, GridActionsCellItem, frFR } from '@mui/x-data-grid';
import { documentsAPI } from '../services/api';
import { useNotification } from '../context/NotificationContext';

function Search() {
    const { showNotification } = useNotification();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setSearched(true);

        try {
            const response = await documentsAPI.search(query);
            setResults(response.data.results || []);
        } catch (error) {
            console.error('Erreur recherche:', error);
            showNotification("Erreur lors de la recherche.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (doc) => {
        try {
            const response = await documentsAPI.download(doc.id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', doc.file_name);
            document.body.appendChild(link);
            link.click();
            link.remove();
            showNotification("Téléchargement lancé.");
        } catch (error) {
            console.error('Erreur téléchargement:', error);
            showNotification("Erreur lors du téléchargement.", "error");
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 octets';
        const k = 1024;
        const sizes = ['octets', 'Ko', 'Mo', 'Go'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const columns = [
        {
            field: 'title',
            headerName: 'Titre',
            flex: 1.5,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionIcon color="primary" fontSize="small" />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{params.value}</Typography>
                </Box>
            )
        },
        { field: 'case_title', headerName: 'Dossier', flex: 1 },
        { field: 'client_name', headerName: 'Client', flex: 1 },
        {
            field: 'document_type',
            headerName: 'Type',
            width: 120,
            renderCell: (params) => (
                <Typography variant="caption" sx={{
                    px: 1, py: 0.5, borderRadius: 1,
                    bgcolor: 'action.hover', fontWeight: 700
                }}>
                    {params.value}
                </Typography>
            )
        },
        {
            field: 'file_size',
            headerName: 'Taille',
            width: 100,
            valueFormatter: (params) => formatFileSize(params.value)
        },
        {
            field: 'created_at',
            headerName: 'Date',
            width: 120,
            valueFormatter: (params) => new Date(params.value).toLocaleDateString('fr-FR')
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            width: 100,
            getActions: (params) => [
                <GridActionsCellItem
                    icon={<DownloadIcon />}
                    label="Télécharger"
                    onClick={() => handleDownload(params.row)}
                    color="primary"
                />,
                <GridActionsCellItem
                    icon={<ViewIcon />}
                    label="Voir"
                    onClick={() => showNotification("Prévisualisation bientôt disponible")}
                />,
            ],
        },
    ];

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                    Recherche intelligente
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Recherchez dans le contenu OCR et les métadonnées de tous vos documents.
                </Typography>
            </Box>

            {/* Barre de recherche */}
            <Paper sx={{
                p: { xs: 2, md: 4 },
                mb: 4,
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: 'none',
                background: (theme) => theme.palette.mode === 'dark'
                    ? alpha(theme.palette.background.paper, 0.5)
                    : '#fff'
            }}>
                <form onSubmit={handleSearch}>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                        <TextField
                            fullWidth
                            placeholder="Mots-clés, nom de fichier, contenu..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="primary" />
                                    </InputAdornment>
                                ),
                                sx: { borderRadius: 3, height: 56 }
                            }}
                            autoFocus
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={loading || !query.trim()}
                            sx={{
                                minWidth: 160,
                                height: 56,
                                borderRadius: 3,
                                boxShadow: '0 8px 16px -4px rgba(26, 35, 126, 0.3)'
                            }}
                        >
                            {loading ? 'Recherche...' : 'Rechercher'}
                        </Button>
                    </Box>
                </form>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', fontStyle: 'italic' }}>
                    Note : la recherche inclut les textes extraits par OCR des scans et images.
                </Typography>
            </Paper>

            {/* Résultats */}
            {searched && (
                <Paper sx={{
                    height: 500,
                    width: '100%',
                    borderRadius: 4,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 'none'
                }}>
                    <DataGrid
                        rows={results}
                        columns={columns}
                        loading={loading}
                        pageSizeOptions={[10, 25, 50]}
                        initialState={{
                            pagination: { paginationModel: { pageSize: 10 } },
                        }}
                        localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                        disableRowSelectionOnClick
                        sx={{
                            border: 'none',
                            '& .MuiDataGrid-columnHeaders': {
                                bgcolor: 'action.hover',
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                            },
                            '& .MuiDataGrid-cell': {
                                borderColor: 'divider',
                            }
                        }}
                    />
                </Paper>
            )}

            {!searched && !loading && (
                <Box sx={{ textAlign: 'center', py: 10, opacity: 0.5 }}>
                    <SearchIcon sx={{ fontSize: 80, color: 'divider', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        Prêt pour une nouvelle recherche ?
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

export default Search;
