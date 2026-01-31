import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Paper,
    Avatar,
    IconButton,
    CircularProgress,
    Tooltip
} from '@mui/material';
import {
    Send as SendIcon,
    Close as CloseIcon,
    SmartToy as BotIcon,
    Person as PersonIcon,
    DeleteSweep as ClearIcon
} from '@mui/icons-material';
import { casesAPI } from '../services/api';

function AIChatDialog({ open, onClose, caseId, caseReference }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialiser la session quand le dialogue s'ouvre
    useEffect(() => {
        if (open && caseId && !sessionId) {
            initSession();
        }
        if (!open) {
            // Reset quand on ferme (optionnel, ou garder l'historique)
            // setMessages([]); 
            // setSessionId(null);
        }
    }, [open, caseId]);

    const initSession = async () => {
        try {
            setInitializing(true);
            setMessages([{ role: 'model', text: 'Analyse du dossier en cours... Veuillez patienter.' }]);

            const response = await casesAPI.chatInit(caseId);

            if (response.data && response.data.session_id) {
                setSessionId(response.data.session_id);
                setMessages([
                    {
                        role: 'model',
                        text: `Analyse terminée (${response.data.doc_count} documents). Je suis prêt à répondre à vos questions sur le dossier ${caseReference || ''}.`
                    }
                ]);
            }
        } catch (error) {
            console.error("Erreur init chat:", error);
            const errorMessage = error.response?.data?.detail || error.message || "Erreur lors de l'analyse du dossier.";
            setMessages([{ role: 'model', text: `Erreur d'initialisation: ${errorMessage}`, error: true }]);
        } finally {
            setInitializing(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || !sessionId || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        try {
            // Préparer l'historique pour le backend (format Gemini attendu : role, parts)
            // On exclut les messages d'erreur ou de chargement UI
            const history = messages
                .filter(m => !m.error)
                .map(m => ({
                    role: m.role,
                    parts: [m.text]
                }));

            const response = await casesAPI.chatMessage(caseId, {
                session_id: sessionId,
                message: userMsg,
                history: history
            });

            if (response.data && response.data.response) {
                setMessages(prev => [...prev, { role: 'model', text: response.data.response }]);
            } else {
                setMessages(prev => [...prev, { role: 'model', text: "Je n'ai pas compris la réponse.", error: true }]);
            }
        } catch (error) {
            console.error("Erreur chat:", error);
            const errorMessage = error.response?.data?.detail || error.message || "Erreur lors de la communication avec l'assistant.";
            setMessages(prev => [...prev, { role: 'model', text: `Erreur: ${errorMessage}`, error: true }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleClearHistory = () => {
        setMessages([]);
        setSessionId(null);
        initSession();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { height: '80vh', borderRadius: 3, display: 'flex', flexDirection: 'column' } }}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}><BotIcon /></Avatar>
                    <Box>
                        <Typography variant="h6">Avocat IA expert au barreau du Sénégal</Typography>
                        <Typography variant="caption" color="text.secondary">Dossier: {caseReference}</Typography>
                    </Box>
                </Box>
                <Box>
                    <Tooltip title="Réinitialiser la conversation">
                        <IconButton onClick={handleClearHistory} sx={{ mr: 1 }}><ClearIcon /></IconButton>
                    </Tooltip>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.default' : '#f5f7fa' }}>
                <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {messages.map((msg, index) => (
                        <Box key={index} sx={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', mb: 1 }}>
                            {msg.role === 'model' && (
                                <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: msg.error ? 'error.main' : 'secondary.main', fontSize: '1rem' }}>
                                    <BotIcon fontSize="small" />
                                </Avatar>
                            )}
                            <Paper sx={{
                                p: 2,
                                maxWidth: '80%',
                                borderRadius: 2,
                                borderTopLeftRadius: msg.role === 'user' ? 2 : 0,
                                borderTopRightRadius: msg.role === 'model' ? 2 : 0,
                                bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                                color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                                boxShadow: 1
                            }}>
                                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{msg.text}</Typography>
                            </Paper>
                            {msg.role === 'user' && (
                                <Avatar sx={{ width: 32, height: 32, ml: 1, bgcolor: 'primary.dark', fontSize: '1rem' }}>
                                    <PersonIcon fontSize="small" />
                                </Avatar>
                            )}
                        </Box>
                    ))}
                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1, ml: 5 }}>
                            <Box sx={{ display: 'flex', gap: 0.5, p: 1.5, bgcolor: 'background.paper', borderRadius: 2 }}>
                                <CircularProgress size={10} color="secondary" />
                                <CircularProgress size={10} color="secondary" sx={{ animationDelay: '0.1s' }} />
                                <CircularProgress size={10} color="secondary" sx={{ animationDelay: '0.2s' }} />
                            </Box>
                        </Box>
                    )}
                    <div ref={messagesEndRef} />
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
                <TextField
                    fullWidth
                    placeholder={initializing ? "Chargement du contexte..." : "Posez une question sur le dossier..."}
                    variant="outlined"
                    size="small"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading || initializing}
                    sx={{ mr: 1, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    InputProps={{
                        endAdornment: (
                            <IconButton onClick={handleSend} disabled={loading || !input.trim() || initializing} color="primary">
                                <SendIcon />
                            </IconButton>
                        )
                    }}
                />
            </DialogActions>
        </Dialog>
    );
}

export default AIChatDialog;
