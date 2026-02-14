import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Paper,
    Button,
    Chip
} from '@mui/material';
import {
    Folder as FolderIcon,
    Description as DescriptionIcon,
    CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { casesAPI, documentsAPI } from '../services/api';
import authService from '../services/authService';

function ClientDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        cases: 0,
        documents: 0
    });
    const [loading, setLoading] = useState(true);
    const [recentDocuments, setRecentDocuments] = useState([]);
    const [activeCases, setActiveCases] = useState([]);
    const currentUser = authService.getCurrentUser();

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [casesRes, documentsRes] = await Promise.all([
                casesAPI.getAll(),
                documentsAPI.getAll({ ordering: '-created_at', page_size: 5 })
            ]);

            const allCases = Array.isArray(casesRes.data.results) ? casesRes.data.results : (Array.isArray(casesRes.data) ? casesRes.data : []);
            const myActiveCases = allCases.filter(c => c.status !== 'CLOS' && c.status !== 'ARCHIVE');

            setStats({
                cases: allCases.length,
                documents: documentsRes.data.count || documentsRes.data.length
            });

            setActiveCases(myActiveCases.slice(0, 3));
            setRecentDocuments(Array.isArray(documentsRes.data.results) ? documentsRes.data.results : (Array.isArray(documentsRes.data) ? documentsRes.data : []));

        } catch (error) {
            console.error('Erreur chargement dashboard client:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{
                mb: 4,
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'start', sm: 'center' },
                gap: 2
            }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                        Bonjour, {currentUser?.first_name || 'Client'}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Bienvenue sur votre espace personnel LegalDoc
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<CloudUploadIcon />}
                    onClick={() => navigate('/documents')}
                    sx={{ borderRadius: 2, width: { xs: '100%', sm: 'auto' } }}
                >
                    Déposer un document
                </Button>
            </Box>

            {/* Statistiques principales */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Dossiers */}
                <Grid item xs={12} sm={6}>
                    <Card sx={{
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white',
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                                        {stats.cases}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Dossiers suivis
                                    </Typography>
                                </Box>
                                <FolderIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Documents */}
                <Grid item xs={12} sm={6}>
                    <Card sx={{
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        color: 'white',
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                                        {stats.documents}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Documents partagés
                                    </Typography>
                                </Box>
                                <DescriptionIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Vos Dossiers Actifs */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <FolderIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Vos dossiers en cours
                            </Typography>
                        </Box>

                        {activeCases.length > 0 ? (
                            <Box>
                                {activeCases.map((caseItem) => (
                                    <Box key={caseItem.id} sx={{ mb: 2, pb: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                {caseItem.title}
                                            </Typography>
                                            <Chip label={caseItem.status} size="small" color="primary" variant="outlined" />
                                        </Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Réf: {caseItem.reference}
                                        </Typography>
                                    </Box>
                                ))}
                                <Button size="small" onClick={() => navigate('/cases')}>Voir tous mes dossiers</Button>
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Aucun dossier actif
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Documents Récents */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Derniers documents
                            </Typography>
                        </Box>

                        {recentDocuments.length > 0 ? (
                            <Box>
                                {recentDocuments.map((doc) => (
                                    <Box
                                        key={doc.id}
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            mb: 2,
                                            p: 1,
                                            borderRadius: 1,
                                            '&:hover': { bgcolor: 'action.hover' }
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden' }}>
                                            <DescriptionIcon color="action" fontSize="small" />
                                            <Box sx={{ overflow: 'hidden' }}>
                                                <Typography variant="subtitle2" noWrap>
                                                    {doc.title}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        {doc.ocr_processed && (
                                            <Chip label="OCR" size="small" sx={{ fontSize: '0.6rem', height: 20 }} />
                                        )}
                                    </Box>
                                ))}
                                <Button size="small" onClick={() => navigate('/documents')}>Voir tous mes documents</Button>
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Aucun document
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

export default ClientDashboard;
