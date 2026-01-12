import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    alpha
} from '@mui/material';
import {
    ArrowForward as ArrowIcon,
    Close as CloseIcon
} from '@mui/icons-material';

const WorkflowRedirectDialog = ({ open, onClose, onConfirm, title, message, confirmText, cancelText, icon }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    padding: 1,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                }
            }}
        >
            <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
                <Box sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2
                }}>
                    {icon || <ArrowIcon color="primary" sx={{ fontSize: 32 }} />}
                </Box>
                <Typography variant="h5" fontWeight="800" sx={{ color: 'text.primary' }}>
                    {title}
                </Typography>
            </DialogTitle>
            <DialogContent sx={{ textAlign: 'center', pt: 1 }}>
                <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
                    {message}
                </Typography>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="inherit"
                    startIcon={<CloseIcon />}
                    sx={{ borderRadius: 2, px: 3 }}
                >
                    {cancelText || 'Plus tard'}
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color="primary"
                    endIcon={<ArrowIcon />}
                    sx={{ borderRadius: 2, px: 3, fontWeight: 'bold' }}
                >
                    {confirmText || 'Continuer'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default WorkflowRedirectDialog;
