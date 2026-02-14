import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

import {
    Box,
    Paper,
    Button,
    Typography,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Chip,
    Tooltip,
    Grid,
    alpha,
    List,
    ListItem,
    ListItemText,
    Switch,
    FormControlLabel
} from '@mui/material';
import {
    DataGrid,
    GridActionsCellItem,
    GridToolbar,
    frFR
} from '@mui/x-data-grid';
import AIChatDialog from '../components/AIChatDialog';
import {
    CloudUpload as UploadIcon,
    Download as DownloadIcon,
    Delete as DeleteIcon,
    TextSnippet as OcrIcon,
    Visibility as PreviewIcon,
    Close as CloseIcon,
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon,
    RestartAlt as ResetIcon,
    Contrast as ContrastIcon,
    Description as FileIcon,
    Storage as StorageIcon,

    Edit as EditIcon,
    Add as AddIcon,
    Folder as FolderIcon,
    SmartToy as BotIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { documentsAPI, casesAPI, clientsAPI } from '../services/api';
import jsPDF from 'jspdf';
import { Document as DocxDocument, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import mammoth from 'mammoth';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import StatCard from '../components/StatCard';

// Version: 1.0.1 (Forced Refresh)
function Documents() {
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [documents, setDocuments] = useState([]);
    const [cases, setCases] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [uploadFiles, setUploadFiles] = useState([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingDocId, setEditingDocId] = useState(null);

    // État pour la création rapide de dossier
    const [quickCaseDialog, setQuickCaseDialog] = useState(false);
    const [newCaseData, setNewCaseData] = useState({ title: '', client: '' });

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        case: '',
        document_type: 'AUTRE',
        is_confidential: true,
        is_multi_page: true, // Par défaut multi-pages pour les images
        tags: ''
    });

    // État pour le modal OCR
    const [ocrDialog, setOcrDialog] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);

    // État pour la prévisualisation
    const [previewDialog, setPreviewDialog] = useState(false);
    const [previewDoc, setPreviewDoc] = useState(null);
    const [previewFileUrl, setPreviewFileUrl] = useState('');
    const [imageZoom, setImageZoom] = useState(null); // null = fit to screen
    const [imageEnhance, setImageEnhance] = useState(false); // contrast/brightness filter
    const [wordContent, setWordContent] = useState(''); // Contenu HTML pour Word
    const [wordLoading, setWordLoading] = useState(false);

    // État pour la suppression
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [docToDelete, setDocToDelete] = useState(null);

    const [chatOpen, setChatOpen] = useState(false);
    const [searchParams] = useSearchParams();
    const urlCaseId = searchParams.get('caseId');
    const selectedCaseId = formData.case || (urlCaseId ? parseInt(urlCaseId) : null);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [docsRes, casesRes, clientsRes] = await Promise.all([
                documentsAPI.getAll(),
                casesAPI.getAll(),
                clientsAPI.getAll()
            ]);
            setDocuments(Array.isArray(docsRes.data.results) ? docsRes.data.results : (Array.isArray(docsRes.data) ? docsRes.data : []));
            setCases(Array.isArray(casesRes.data.results) ? casesRes.data.results : (Array.isArray(casesRes.data) ? casesRes.data : []));
            setClients(Array.isArray(clientsRes.data.results) ? clientsRes.data.results : (Array.isArray(clientsRes.data) ? clientsRes.data : []));
        } catch (error) {
            console.error('Erreur chargement:', error);
            showNotification("Erreur lors du chargement des documents.", "error");
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    const [filterType, setFilterType] = useState('ALL');
    const initialSearch = searchParams.get('search') || '';
    const [searchTerm, setSearchTerm] = useState(initialSearch);

    const sortedDocuments = useMemo(() => {
        let base = documents;

        // Interactive Filter (Stat Cards)
        if (filterType === 'OCR') {
            base = base.filter(d => d.ocr_processed);
        } else if (filterType === 'STORAGE') {
            base = base.filter(d => d.file_size > 100 * 1024); // Gros fichiers
        }

        // IMPORTANT: We do NOT filter by search here anymore because DataGrid 
        // handles it via quickFilter. This avoids double-filtering issues.
        return base;
    }, [documents, filterType]);

    useEffect(() => {
        loadData().then(() => {
            const caseId = searchParams.get('caseId');
            const isNew = searchParams.get('new') === 'true';

            // Sanitize caseId: jump to creation only if it's a valid number
            if (caseId && isNew && caseId !== 'undefined' && !isNaN(parseInt(caseId))) {
                setFormData(prev => ({
                    ...prev,
                    case: parseInt(caseId)
                }));
                setOpenDialog(true);
            }
        });
    }, [loadData, searchParams]);

    // Force DataGrid to sync with searchTerm when it changes (URL or internal)
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

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            setUploadFiles(prev => [...prev, ...acceptedFiles]);
            // Si c'est le premier fichier ajouté et qu'il n'y a pas de titre, on pré-remplit
            if (formData.title === '' && acceptedFiles.length > 0) {
                setFormData(prev => ({ ...prev, title: acceptedFiles[0].name.split('.')[0] }));
            }
        }
    }, [formData.title]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true
    });

    const handleRemoveFile = (index) => {
        setUploadFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleOpenDialog = () => {
        setUploadFiles([]);
        setIsEditMode(false);
        setEditingDocId(null);
        setFormData({
            title: '',
            description: '',
            case: '',
            document_type: 'AUTRE',
            is_confidential: true,
            is_multi_page: true,
            tags: ''
        });
        setOpenDialog(true);
    };

    const handleEditClick = (doc) => {
        setUploadFiles([]);
        setIsEditMode(true);
        setEditingDocId(doc.id);
        setFormData({
            title: doc.title || '',
            description: doc.description || '',
            case: doc.case || '',
            document_type: doc.document_type || 'AUTRE',
            is_confidential: doc.is_confidential ?? true,
            tags: doc.tags_list?.join(', ') || ''
        });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleSubmit = async () => {
        if (!isEditMode && (uploadFiles.length === 0 || !formData.case)) {
            showNotification('Veuillez sélectionner au moins un fichier et un dossier', 'warning');
            return;
        }

        try {
            if (isEditMode) {
                // Mode édition (un seul fichier max)
                const data = new FormData();
                if (uploadFiles.length > 0) {
                    data.append('file', uploadFiles[0]);
                }
                data.append('title', formData.title);
                data.append('description', formData.description);
                data.append('case', formData.case);
                data.append('document_type', formData.document_type);
                data.append('is_confidential', formData.is_confidential);

                await documentsAPI.update(editingDocId, data);
                showNotification("Document mis à jour avec succès !");
            } else if (formData.is_multi_page && uploadFiles.length > 0) {
                // Mode Multi-Page (Regrouper en un seul document)
                setLoading(true);
                const data = new FormData();

                // On utilise le premier fichier comme fichier principal (obligatoire dans le modèle pour l'instant)
                // et tous les fichiers indexés dans 'files'
                data.append('file', uploadFiles[0]);

                uploadFiles.forEach(file => {
                    data.append('files', file);
                });

                data.append('title', formData.title || uploadFiles[0].name.split('.')[0]);
                data.append('description', formData.description || '');
                data.append('case', formData.case);
                data.append('document_type', formData.document_type);
                data.append('is_confidential', formData.is_confidential);
                data.append('is_multi_page', 'true');

                await documentsAPI.upload(data);
                showNotification(`Document multi-pages créé avec ${uploadFiles.length} pages !`);
            } else {
                // Mode Multi-Upload (Documents séparés)
                setLoading(true);
                let successCount = 0;

                for (const file of uploadFiles) {
                    const data = new FormData();
                    data.append('file', file);
                    const title = uploadFiles.length > 1 ? file.name.split('.')[0] : formData.title;
                    data.append('title', title);
                    data.append('description', formData.description);
                    data.append('case', formData.case);
                    data.append('document_type', formData.document_type);
                    data.append('is_confidential', formData.is_confidential);
                    data.append('is_multi_page', 'false');

                    try {
                        await documentsAPI.upload(data);
                        successCount++;
                    } catch (err) {
                        console.error(`Erreur upload ${file.name}:`, err);
                    }
                }

                if (successCount === uploadFiles.length) {
                    showNotification(`${successCount} documents uploadés avec succès !`);
                } else if (successCount > 0) {
                    showNotification(`${successCount}/${uploadFiles.length} documents uploadés.`, "warning");
                } else {
                    throw new Error("Aucun fichier n'a pu être uploadé.");
                }
            }
            loadData();
            handleCloseDialog();
        } catch (error) {
            console.error('Erreur soumission document:', error);
            showNotification(`Erreur lors de ${isEditMode ? 'la mise à jour' : "l'upload"}.`, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateQuickCase = async () => {
        if (!newCaseData.title || !newCaseData.client) {
            showNotification("Veuillez remplir le titre et le client", "warning");
            return;
        }
        try {
            const resp = await casesAPI.create({
                title: newCaseData.title,
                client: newCaseData.client,
                reference: `DOS-${Date.now()}`, // Simple auto-ref
                status: 'OPEN',
                description: 'Créé depuis l\'upload rapide'
            });
            const newCase = resp.data;
            setCases(prev => [newCase, ...prev]);
            setFormData(prev => ({ ...prev, case: newCase.id })); // Auto-select new case
            setQuickCaseDialog(false);
            setNewCaseData({ title: '', client: '' });
            showNotification("Dossier créé et sélectionné !");
        } catch (error) {
            console.error("Erreur création dossier:", error);
            showNotification("Erreur lors de la création du dossier", "error");
        }
    };

    const handleDeleteClick = (doc) => {
        setDocToDelete(doc);
        setDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!docToDelete) return;
        try {
            await documentsAPI.delete(docToDelete.id);
            showNotification("Document supprimé.");
            setDeleteDialog(false);
            setDocToDelete(null);
            loadData();
        } catch (error) {
            console.error('Erreur suppression:', error);
            showNotification("Erreur lors de la suppression.", "error");
        }
    };

    const handleViewOcr = (doc) => {
        setSelectedDoc(doc);
        setOcrDialog(true);
    };

    const handleAddPage = async (e) => {
        const file = e.target.files[0];
        if (!file || !selectedDoc) return;

        try {
            const data = new FormData();
            data.append('file', file);
            setLoading(true);
            await documentsAPI.addPage(selectedDoc.id, data);
            showNotification("Page ajoutée avec succès ! Traitement OCR lancé.");

            // Recharger le document pour voir la nouvelle page
            const updatedDoc = await documentsAPI.get(selectedDoc.id);
            setSelectedDoc(updatedDoc.data);
            loadData();
        } catch (error) {
            console.error("Erreur ajout page:", error);
            showNotification("Erreur lors de l'ajout de la page.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleReprocessOcr = async () => {
        if (!selectedDoc) return;
        try {
            setLoading(true);
            const response = await documentsAPI.reprocessOcr(selectedDoc.id);
            if (response.data.status === 'success') {
                showNotification("OCR relancé avec succès !");
                // Mettre à jour le document sélectionné avec les nouveaux résultats (y compris les versions)
                setSelectedDoc(prev => ({
                    ...prev,
                    ...response.data
                }));
                loadData();
            } else {
                showNotification(response.data.message || "Erreur lors du retraitement.", "error");
            }
        } catch (error) {
            console.error('Erreur retraitement OCR:', error);
            showNotification("Erreur lors de la communication avec le serveur.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = async (doc) => {
        setPreviewDoc(doc);
        setImageZoom(null);
        setImageEnhance(false);
        setWordContent('');
        setPreviewDialog(true);

        const extension = (doc.file_extension || doc.title?.split('.').pop() || '').toLowerCase().replace('.', '');

        // Déterminer l'URL du fichier à prévisualiser
        // ON GARDE L'ORIGINAL pour l'aperçu visuel (Scan)
        let previewUrl = doc.file_url;

        // Note: AskYourPDF utilisera explicitement la version searchable via son propre bouton
        setPreviewFileUrl(previewUrl);

        // Si c'est un fichier Word, charger et convertir
        if (extension.includes('doc')) {
            try {
                setWordLoading(true);
                const response = await fetch(previewUrl);
                const arrayBuffer = await response.arrayBuffer();
                const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
                setWordContent(result.value);
            } catch (error) {
                console.error('Erreur conversion Word:', error);
                setWordContent('<p style="color: red;">Erreur lors de la lecture du document Word.</p>');
            } finally {
                setWordLoading(false);
            }
        }
    };

    const handleZoomIn = () => setImageZoom(prev => (prev || 100) + 25);
    const handleZoomOut = () => setImageZoom(prev => Math.max(25, (prev || 100) - 25));
    const handleResetZoom = () => {
        setImageZoom(null);
        setImageEnhance(false);
    };
    const toggleEnhance = () => setImageEnhance(prev => !prev);

    const handleExportPDF = () => {
        if (!selectedDoc?.ocr_text) {
            showNotification('Aucun texte à exporter', 'warning');
            return;
        }
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        const maxWidth = pageWidth - 2 * margin;
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(selectedDoc.title, margin, 20);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const lines = doc.splitTextToSize(selectedDoc.ocr_text, maxWidth);
        let y = 35;
        lines.forEach(line => {
            if (y > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }
            doc.text(line, margin, y);
            y += 7;
        });
        const fileName = `OCR_${selectedDoc.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
        doc.save(fileName);
    };

    const handleExportWord = async () => {
        if (!selectedDoc?.ocr_text) {
            showNotification('Aucun texte à exporter', 'warning');
            return;
        }
        try {
            const doc = new DocxDocument({
                sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            text: selectedDoc.title,
                            heading: HeadingLevel.HEADING_1,
                            spacing: { after: 200 }
                        }),
                        new Paragraph({
                            text: '='.repeat(50),
                            spacing: { after: 200 }
                        }),
                        ...selectedDoc.ocr_text.split('\n').map(line =>
                            new Paragraph({
                                children: [
                                    new TextRun({ text: line || ' ', size: 22 })
                                ],
                                spacing: { after: 100 }
                            })
                        ),
                    ],
                }],
            });
            const blob = await Packer.toBlob(doc);
            const fileName = `OCR_${selectedDoc.title.replace(/[^a-z0-9]/gi, '_')}.docx`;
            saveAs(blob, fileName);
            showNotification("Fichier Word généré.");
        } catch (error) {
            console.error('Erreur export Word:', error);
            showNotification('Erreur lors de l\'export Word', 'error');
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 octets';
        const k = 1024;
        const sizes = ['o', 'Ko', 'Mo', 'Go'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const getDocTypeColor = (type) => {
        const colors = { 'CONTRAT': 'primary', 'JUGEMENT': 'error', 'PIECE': 'info', 'NOTE': 'warning', 'AUTRE': 'default' };
        return colors[type] || 'default';
    };

    const columns = [
        {
            field: 'case_reference',
            headerName: 'Réf. Dossier',
            width: 130,
            renderCell: (params) => (
                <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: 'monospace', bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: 1 }}>
                    {params.value}
                </Typography>
            )
        },
        {
            field: 'title',
            headerName: 'Titre',
            flex: 2,
            minWidth: 250,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', overflow: 'hidden' }}>
                    <FileIcon color="action" sx={{ mr: 1, fontSize: 20, flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {params.value}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'case_title',
            headerName: 'Dossier',
            flex: 2,
            minWidth: 300,
            renderCell: (params) => {
                const matchedCase = cases.find(c => c.id === params.row.case);
                const category = matchedCase?.category || 'AUTRE';
                const isYellow = ['CIVIL', 'COMMERCIAL', 'SOCIAL'].includes(category);
                const categoryLabel = category.charAt(0) + category.slice(1).toLowerCase();

                return (
                    <Box sx={{ width: '100%', overflow: 'hidden', py: 1 }}>
                        <Typography
                            variant="body2"
                            onClick={() => navigate(`/cases/${params.row.case}`)}
                            sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                        >
                            {params.value}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, overflow: 'hidden' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 1 }}>
                                {params.row.client_name}
                            </Typography>
                            {matchedCase?.category && (
                                <Chip
                                    label={categoryLabel}
                                    size="small"
                                    sx={{
                                        height: 16,
                                        fontSize: '0.6rem',
                                        bgcolor: isYellow ? '#fffde7' : '#e3f2fd',
                                        color: isYellow ? '#fbc02d' : '#1976d2',
                                        fontWeight: 'bold',
                                        border: '1px solid',
                                        borderColor: isYellow ? '#fbc02d' : '#1976d2',
                                        flexShrink: 0
                                    }}
                                />
                            )}
                        </Box>
                    </Box>
                );
            }
        },
        {
            field: 'document_type',
            headerName: 'Type',
            width: 120,
            renderCell: (params) => (
                <Chip label={params.value} color={getDocTypeColor(params.value)} size="small" variant="outlined" />
            )
        },
        {
            field: 'file_size',
            headerName: 'Taille',
            width: 100,
            valueFormatter: (params) => formatFileSize(params.value)
        },
        {
            field: 'tags_list',
            headerName: 'Tags',
            width: 200,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {params.value?.map((tag, index) => (
                        <Chip key={index} label={tag} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                    ))}
                </Box>
            )
        },
        {
            field: 'ocr_processed',
            headerName: 'OCR',
            width: 120,
            renderCell: (params) => (
                <Chip
                    label={params.value ? "Traité" : "Attente"}
                    color={params.value ? "success" : "warning"}
                    size="small"
                    variant={params.value ? "filled" : "outlined"}
                />
            )
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
            width: 200,
            getActions: (params) => {
                const versions = params.row.versions || [];
                const sortedVersions = [...versions].sort((a, b) => b.version_number - a.version_number);

                const actions = [
                    <GridActionsCellItem icon={<PreviewIcon />} label="Aperçu" onClick={() => handlePreview(params.row)} color="info" />,
                    <GridActionsCellItem icon={<EditIcon />} label="Modifier" onClick={() => handleEditClick(params.row)} color="warning" />,
                    <GridActionsCellItem icon={<OcrIcon />} label="OCR" onClick={() => handleViewOcr(params.row)} color="primary" />,
                ];



                actions.push(<GridActionsCellItem icon={<DeleteIcon />} label="Supprimer" onClick={() => handleDeleteClick(params.row)} color="error" />);
                return actions;
            },
        },
    ];

    const totalDocs = documents.length;
    const ocrProcessed = documents.filter(d => d.ocr_processed).length;

    return (
        <Box sx={{ width: '100%', pb: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'start', sm: 'center' }, gap: 2, mb: 3 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>Documents</Typography>
                    <Typography variant="body1" color="text.secondary">Centralisez et gérez tous vos documents juridiques.</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {selectedCaseId && (
                        <Button
                            variant="contained"
                            onClick={() => setChatOpen(true)}
                            startIcon={<BotIcon />}
                            sx={{
                                borderRadius: 2,
                                px: 3,
                                py: 1,
                                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                                boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                                color: 'white',
                                fontWeight: 'bold'
                            }}
                        >
                            Assistant IA
                        </Button>
                    )}
                    <Button variant="contained" startIcon={<UploadIcon />} onClick={handleOpenDialog} sx={{ borderRadius: 2, px: 3, py: 1, width: { xs: '100%', sm: 'auto' } }}>Uploader un document</Button>
                </Box>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                    <Box onClick={() => setFilterType('ALL')} sx={{ cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)' }, opacity: filterType === 'ALL' ? 1 : 0.6 }}>
                        <StatCard
                            title="Total documents"
                            value={totalDocs}
                            icon={<FileIcon color="primary" />}
                            color="primary"
                            sx={{ border: filterType === 'ALL' ? '2px solid' : 'none', borderColor: 'primary.main', borderRadius: 2 }}
                        />
                    </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Box onClick={() => setFilterType('OCR')} sx={{ cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)' }, opacity: filterType === 'OCR' ? 1 : 0.6 }}>
                        <StatCard
                            title="Documents analysés (OCR)"
                            value={ocrProcessed}
                            icon={<OcrIcon color="info" />}
                            color="info"
                            sx={{ border: filterType === 'OCR' ? '2px solid' : 'none', borderColor: 'info.main', borderRadius: 2 }}
                        />
                    </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Box onClick={() => setFilterType('STORAGE')} sx={{ cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'translateY(-4px)' }, opacity: filterType === 'STORAGE' ? 1 : 0.6 }}>
                        <StatCard
                            title="Gros fichiers (> 100 ko)"
                            value={formatFileSize(documents.filter(d => d.file_size > 100 * 1024).reduce((acc, curr) => acc + curr.file_size, 0))}
                            icon={<StorageIcon color="success" />}
                            color="success"
                            sx={{ border: filterType === 'STORAGE' ? '2px solid' : 'none', borderColor: 'success.main', borderRadius: 2 }}
                        />
                    </Box>
                </Grid>
            </Grid>

            <Paper sx={{ height: 600, width: '100%', borderRadius: 3, overflow: 'hidden', boxShadow: 3 }}>
                <DataGrid
                    rows={sortedDocuments}
                    columns={columns}
                    loading={loading}
                    rowHeight={65}
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
                                // Ensure search term stays in sync
                                onChange: (e) => setSearchTerm(e.target.value)
                            }
                        }
                    }}
                    localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                    sx={{
                        border: 0,
                        '& .MuiDataGrid-columnHeaders': { backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', fontWeight: 700 },
                        '& .MuiDataGrid-row:hover': { backgroundColor: 'action.hover', cursor: 'pointer' }
                    }}
                />
            </Paper>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{isEditMode ? 'Modifier le document' : 'Uploader un document'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Paper {...getRootProps()} sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: isDragActive ? 'primary.main' : 'divider', bgcolor: isDragActive ? 'action.hover' : 'background.paper', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                            <input {...getInputProps()} />
                            <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                            <Typography color="text.secondary">
                                {isEditMode
                                    ? 'Glissez-déposez pour remplacer le fichier actuel (optionnel)'
                                    : 'Glissez-déposez vos fichiers ici ou cliquez pour sélectionner'}
                            </Typography>
                        </Paper>

                        {uploadFiles.length > 0 && (
                            <Paper variant="outlined" sx={{ maxHeight: 150, overflow: 'auto', p: 1 }}>
                                <List dense>
                                    {uploadFiles.map((file, index) => (
                                        <ListItem key={index} secondaryAction={
                                            <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveFile(index)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        }>
                                            <FileIcon sx={{ mr: 2, color: 'text.secondary' }} />
                                            <ListItemText
                                                primary={file.name}
                                                secondary={formatFileSize(file.size)}
                                                primaryTypographyProps={{ noWrap: true }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Paper>
                        )}

                        <TextField label="Titre (pour fichier unique ou préfixe)" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} fullWidth />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                label="Dossier"
                                select
                                value={formData.case}
                                onChange={(e) => setFormData({ ...formData, case: e.target.value })}
                                required
                                fullWidth
                            >
                                {cases.map((c) => <MenuItem key={c.id} value={c.id}>{c.reference} - {c.title}</MenuItem>)}
                            </TextField>
                            <Tooltip title="Créer un nouveau dossier">
                                <Button variant="outlined" sx={{ minWidth: 56, px: 0 }} onClick={() => setQuickCaseDialog(true)}>
                                    <AddIcon />
                                </Button>
                            </Tooltip>
                        </Box>
                        <TextField label="Type de document" select value={formData.document_type} onChange={(e) => setFormData({ ...formData, document_type: e.target.value })} fullWidth>
                            <MenuItem value="CONTRAT">Contrat</MenuItem>
                            <MenuItem value="COURRIER">Courrier</MenuItem>
                            <MenuItem value="JUGEMENT">Jugement</MenuItem>
                            <MenuItem value="PIECE">Pièce</MenuItem>
                            <MenuItem value="NOTE">Note</MenuItem>
                            <MenuItem value="MEMOIRE">Mémoire</MenuItem>
                            <MenuItem value="ASSIGNATION">Assignation</MenuItem>
                            <MenuItem value="CONCLUSION">Conclusion</MenuItem>
                            <MenuItem value="REQUETE">Requête</MenuItem>
                            <MenuItem value="ACTE_HUISSIER">Acte d’huissier</MenuItem>
                            <MenuItem value="DOSSIER_ADVERSE">Dossier partie adverse</MenuItem>
                            <MenuItem value="CITATION">Citation</MenuItem>
                            <MenuItem value="AUTRE">Autre</MenuItem>
                        </TextField>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.is_multi_page}
                                    onChange={(e) => setFormData({ ...formData, is_multi_page: e.target.checked })}
                                    color="primary"
                                />
                            }
                            label="Regrouper en un seul document multi-pages (Scans/Photos)"
                            sx={{ mb: 1 }}
                        />
                        <TextField label="Description" multiline rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} fullWidth />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleCloseDialog} color="inherit">Annuler</Button>
                    <Button onClick={handleSubmit} variant="contained" sx={{ px: 4 }}>
                        {isEditMode ? 'Enregistrer les modifications' : 'Uploader'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={quickCaseDialog} onClose={() => setQuickCaseDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Nouveau Dossier Rapide</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Titre du dossier"
                            value={newCaseData.title}
                            onChange={(e) => setNewCaseData({ ...newCaseData, title: e.target.value })}
                            fullWidth
                            autoFocus
                        />
                        <TextField
                            label="Client"
                            select
                            value={newCaseData.client}
                            onChange={(e) => setNewCaseData({ ...newCaseData, client: e.target.value })}
                            fullWidth
                        >
                            {clients.map((c) => (
                                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                            ))}
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setQuickCaseDialog(false)}>Annuler</Button>
                    <Button onClick={handleCreateQuickCase} variant="contained" startIcon={<FolderIcon />}>Créer</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={ocrDialog} onClose={() => setOcrDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Texte OCR - {selectedDoc?.title || 'Document'}</Typography>
                    <IconButton onClick={() => setOcrDialog(false)}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ mt: 1 }}>
                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                            <Box>
                                <Chip
                                    label={selectedDoc?.ocr_processed ? "OCR traité" : "OCR en attente"}
                                    color={selectedDoc?.ocr_processed ? "success" : "warning"}
                                    sx={{ mr: 1 }}
                                />
                                <Chip label={selectedDoc?.document_type || 'N/A'} variant="outlined" sx={{ mr: 1 }} />
                                {selectedDoc?.is_multi_page && (
                                    <Chip label={`${selectedDoc?.pages?.length || 0} pages`} color="primary" variant="filled" size="small" />
                                )}
                            </Box>

                            <Box>
                                <input
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    id="add-page-ocr"
                                    type="file"
                                    onChange={handleAddPage}
                                />
                                <label htmlFor="add-page-ocr">
                                    <Button
                                        component="span"
                                        startIcon={<AddIcon />}
                                        size="small"
                                        variant="contained"
                                        disabled={loading}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        Ajouter une image/page
                                    </Button>
                                </label>
                            </Box>
                        </Box>

                        {selectedDoc?.ocr_error && (
                            <Box sx={{ p: 2, mb: 2, bgcolor: '#ffebee', borderRadius: 1 }}>
                                <Typography color="error"><strong>Erreur OCR:</strong> {selectedDoc.ocr_error}</Typography>
                            </Box>
                        )}

                        {/* Vignettes des pages */}
                        {selectedDoc?.pages && selectedDoc.pages.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" gutterBottom color="text.secondary">Aperçu des pages :</Typography>
                                <Box sx={{
                                    display: 'flex',
                                    gap: 2,
                                    overflowX: 'auto',
                                    py: 1,
                                    px: 0.5,
                                    '&::-webkit-scrollbar': { height: 6 },
                                    '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 3 }
                                }}>
                                    {selectedDoc.pages.map((p) => (
                                        <Box key={p.id} sx={{ flexShrink: 0, textAlign: 'center' }}>
                                            <Paper
                                                elevation={2}
                                                sx={{
                                                    width: 80,
                                                    height: 110,
                                                    overflow: 'hidden',
                                                    cursor: 'pointer',
                                                    border: (theme) => `2px solid ${p.ocr_text ? theme.palette.success.main : theme.palette.divider}`,
                                                    borderRadius: 1,
                                                    transition: '0.2s',
                                                    '&:hover': { transform: 'scale(1.05)', boxShadow: 4 }
                                                }}
                                                onClick={() => window.open(p.file_url, '_blank')}
                                            >
                                                <img src={p.file_url} alt={`P${p.page_number}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </Paper>
                                            <Typography variant="caption" sx={{ fontWeight: 600, mt: 0.5, display: 'block' }}>
                                                Page {p.page_number}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        )}

                        <Typography variant="subtitle2" gutterBottom>Texte intégral consolidé :</Typography>
                        <Box sx={{
                            p: 2,
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? alpha('#fff', 0.05) : '#f8f9fa',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            maxHeight: 400,
                            overflow: 'auto',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                            <Typography variant="body2" component="div" sx={{
                                whiteSpace: 'pre-wrap',
                                fontFamily: "'Courier New', Courier, monospace",
                                fontSize: '0.9rem',
                                lineHeight: 1.6,
                                color: 'text.primary'
                            }}>
                                {selectedDoc?.ocr_text || (loading ? "Traitement OCR en cours..." : "Aucun texte extrait.")}
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleReprocessOcr} startIcon={<ResetIcon />} color="primary" disabled={loading}>
                        {loading ? 'Traitement...' : 'Relancer l\'OCR'}
                    </Button>
                    <Box sx={{ flex: 1 }} />
                    {selectedDoc?.versions?.some(v => v.file_name && v.file_name.toLowerCase().includes('searchable_')) && (
                        <Button
                            onClick={() => {
                                const searchableVersion = selectedDoc.versions.find(v =>
                                    v.file_name && v.file_name.toLowerCase().includes('searchable_')
                                );
                                if (searchableVersion) {
                                    window.open(searchableVersion.file_url, '_blank');
                                }
                            }}
                            startIcon={<DownloadIcon />}
                            sx={{
                                bgcolor: '#f57c00',
                                color: 'white',
                                '&:hover': { bgcolor: '#e65100' }
                            }}
                            variant="contained"
                        >
                            PDF Recherchable (OCR)
                        </Button>
                    )}
                    <Button onClick={handleExportWord} startIcon={<DownloadIcon />} color="success">Exporter Word</Button>
                    <Button onClick={handleExportPDF} startIcon={<DownloadIcon />} color="error">Exporter PDF</Button>
                    <Button onClick={() => setOcrDialog(false)} variant="contained" color="inherit">Fermer</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} maxWidth="xl" fullWidth PaperProps={{ sx: { height: '90vh' } }}>
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6" component="div">{previewDoc?.title}</Typography>
                        {previewFileUrl.includes('Searchable_') && (
                            <Chip
                                label="Version OCR"
                                color="success"
                                size="small"
                                variant="outlined"
                                sx={{ height: 24, fontSize: '0.7rem' }}
                            />
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {previewDoc && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(previewDoc.file_extension?.toLowerCase().replace('.', '')) && (
                            <><Tooltip title="Zoom arrière"><IconButton onClick={handleZoomOut}><ZoomOutIcon /></IconButton></Tooltip><Tooltip title="Zoom avant"><IconButton onClick={handleZoomIn}><ZoomInIcon /></IconButton></Tooltip><Tooltip title="Réinitialiser"><IconButton onClick={handleResetZoom}><ResetIcon /></IconButton></Tooltip><Tooltip title="Améliorer la lisibilité (Contraste)"><IconButton onClick={toggleEnhance} color={imageEnhance ? "primary" : "default"}><ContrastIcon /></IconButton></Tooltip><Box sx={{ mx: 1, borderLeft: '1px solid #ddd' }} /></>
                        )}

                        <IconButton aria-label="close" onClick={() => setPreviewDialog(false)}><CloseIcon /></IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.default' : '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
                    {previewDoc && (() => {
                        const extension = (previewDoc.file_extension || previewDoc.title?.split('.').pop() || '').toLowerCase().replace('.', '');
                        const isPdf = extension === 'pdf';
                        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
                        const isWord = extension.includes('doc');

                        return (
                            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: imageZoom ? 'flex-start' : 'center', overflow: 'auto', p: 2 }}>
                                {isPdf ? (
                                    <iframe src={previewFileUrl} width="100%" height="100%" style={{ border: 'none', borderRadius: '8px' }} title="PDF Preview" />
                                ) : isImage ? (
                                    <img
                                        src={previewFileUrl}
                                        alt={previewDoc.title}
                                        style={{
                                            maxWidth: imageZoom ? 'none' : '100%',
                                            maxHeight: imageZoom ? 'none' : '100%',
                                            width: imageZoom ? `${imageZoom}%` : 'auto',
                                            objectFit: 'contain',
                                            filter: imageEnhance ? 'contrast(1.5) brightness(1.05) grayscale(0.2)' : 'none',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                        }}
                                    />
                                ) : isWord ? (
                                    <Paper sx={{ p: 4, width: '100%', maxWidth: '800px', mx: 'auto', minHeight: '100%', bgcolor: 'white', color: 'black', borderRadius: '4px', boxShadow: 3 }} elevation={2}>
                                        {wordLoading ? (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><Typography>Chargement du document Word...</Typography></Box>
                                        ) : (
                                            <div dangerouslySetInnerHTML={{ __html: wordContent }} style={{ textAlign: 'left' }} />
                                        )}
                                    </Paper>
                                ) : (
                                    <Box sx={{ textAlign: 'center', p: 4, bgcolor: 'background.paper', borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                                        <FileIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                                        <Typography variant="h6" color="text.secondary" gutterBottom>
                                            Aperçu non disponible pour ce type de fichier.
                                        </Typography>
                                        <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
                                            Type détecté : {extension.toUpperCase() || 'Inconnu'}
                                        </Typography>
                                        <Button variant="contained" component="a" href={previewFileUrl} download startIcon={<DownloadIcon />}>
                                            Télécharger pour voir le fichier
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* AI CHAT DIALOG */}
            {selectedCaseId && (
                <AIChatDialog
                    open={chatOpen}
                    onClose={() => setChatOpen(false)}
                    caseId={selectedCaseId}
                    caseTitle={cases.find(c => c.id === selectedCaseId)?.title || "Dossier"}
                />
            )}

            <DeleteConfirmDialog open={deleteDialog} onClose={() => setDeleteDialog(false)} onConfirm={handleConfirmDelete} title="ce document" itemName={docToDelete?.title} />
        </Box>
    );
}

export default Documents;
