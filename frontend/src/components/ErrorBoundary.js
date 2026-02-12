import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ErrorOutline as ErrorIcon } from '@mui/icons-material';

/**
 * Error Boundary global — attrape les crashs React et affiche un écran d'erreur
 * convivial au lieu d'une page blanche.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error('[ErrorBoundary] Crash attrapé:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = '/dashboard';
    };

    render() {
        if (this.state.hasError) {
            return (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '60vh',
                        p: 4,
                        textAlign: 'center'
                    }}
                >
                    <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                        Une erreur est survenue
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500 }}>
                        La page n'a pas pu se charger correctement. Cela peut être dû à un problème temporaire.
                    </Typography>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2, maxWidth: 600, overflow: 'auto', textAlign: 'left' }}>
                            <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                {this.state.error.toString()}
                                {this.state.errorInfo?.componentStack}
                            </Typography>
                        </Box>
                    )}
                    <Button variant="contained" onClick={this.handleReset}>
                        Retour au tableau de bord
                    </Button>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
