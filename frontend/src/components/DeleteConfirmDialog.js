import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Paper
} from '@mui/material';
import { Warning as WarningIcon, Delete as DeleteIcon } from '@mui/icons-material';

const DeleteConfirmDialog = ({ open, onClose, onConfirm, title, itemName, itemDetails }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2 }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: 'error.main',
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.1)' : '#fff4f4'
            }}>
                <WarningIcon />
                Confirmation de suppression
            </DialogTitle>

            <DialogContent sx={{ mt: 2 }}>
                <Typography variant="body1" gutterBottom>
                    Êtes-vous sûr de vouloir supprimer {title ? title : 'cet élément'} ?
                </Typography>

                <Typography variant="body2" color="text.secondary" paragraph>
                    Cette action est irréversible.
                </Typography>

                {(itemName || itemDetails) && (
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'action.hover' : '#fafafa',
                            borderColor: (theme) => theme.palette.mode === 'dark' ? 'error.dark' : 'error.light'
                        }}
                    >
                        {itemName && (
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                {itemName}
                            </Typography>
                        )}
                        {itemDetails && (
                            <Box sx={{ mt: 1 }}>
                                {itemDetails}
                            </Box>
                        )}
                    </Paper>
                )}
            </DialogContent>

            <DialogActions sx={{
                p: 2,
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'action.hover' : '#fafafa'
            }}>
                <Button onClick={onClose} variant="outlined" color="inherit">
                    Annuler
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    autoFocus
                >
                    Supprimer définitivement
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeleteConfirmDialog;
