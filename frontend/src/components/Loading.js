import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const Loading = ({ message = "Chargement..." }) => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                minHeight: '200px',
                width: '100%',
                gap: 2
            }}
        >
            <CircularProgress size={40} thickness={4} color="primary" />
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {message}
            </Typography>
        </Box>
    );
};

export default Loading;
