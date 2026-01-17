import React from 'react';
import { Box, Typography, Container, Link, alpha } from '@mui/material';

const Footer = ({ variant = 'light' }) => {
    const isDarkVariant = variant === 'dark';

    return (
        <Box
            component="footer"
            sx={{
                py: 4,
                px: 2,
                mt: 'auto',
                backgroundColor: (theme) =>
                    isDarkVariant
                        ? alpha(theme.palette.grey[900], 0.95)
                        : theme.palette.mode === 'light'
                            ? theme.palette.background.paper
                            : alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(8px)',
                borderTop: '1px solid',
                borderColor: 'divider',
                color: isDarkVariant ? 'grey.400' : 'text.secondary',
                width: '100%',
                zIndex: 10,
            }}
        >
            <Container maxWidth="lg">
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 2,
                    }}
                >
                    <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                        <Typography variant="body2" sx={{
                            fontWeight: 600,
                            letterSpacing: '0.01em',
                            color: (theme) => theme.palette.mode === 'dark' ? 'grey.300' : 'grey.800'
                        }}>
                            © 2026 Tous droits réservés.
                        </Typography>
                    </Box>
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        flexWrap: 'wrap',
                        justifyContent: 'center'
                    }}>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            Contact :
                        </Typography>
                        <Link
                            href="tel:+221776026783"
                            sx={{
                                color: (theme) => theme.palette.mode === 'dark' ? 'grey.300' : 'grey.800',
                                textDecoration: 'none',
                                fontWeight: 700,
                                fontSize: '0.875rem',
                                '&:hover': { color: 'primary.main' }
                            }}
                        >
                            77 602 67 83
                        </Link>
                        <Box sx={{ width: '1px', height: '16px', bgcolor: 'divider', mx: 1, display: { xs: 'none', sm: 'block' } }} />
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            Plateforme développée par
                        </Typography>
                        <Link
                            href="https://www.senecarte.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                color: (theme) => theme.palette.primary.main,
                                textDecoration: 'none',
                                fontWeight: 700,
                                fontSize: '0.875rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                padding: '4px 12px',
                                borderRadius: '20px',
                                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15),
                                    transform: 'translateY(-1px)',
                                    boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                                }
                            }}
                        >
                            <Box
                                component="img"
                                src="/images/senecarte.png"
                                alt="Sen-E-Carte"
                                sx={{ height: 20, verticalAlign: 'middle', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            Sen-E-Carte
                        </Link>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};

export default Footer;
