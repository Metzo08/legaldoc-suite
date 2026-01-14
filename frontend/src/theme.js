/**
 * Système de thème Premium LegalDoc Suite
 * Design épuré, professionnel et moderne
 */
import { createTheme, alpha } from '@mui/material/styles';

// Palette Premium
const colors = {
    primary: '#0f172a', // Navy très sombre, presque noir (Sérieux, Autorité)
    secondary: '#c29b61', // Or/Bronze élégant (Prestige, Justice)
    success: '#059669',
    info: '#0284c7',
    warning: '#d97706',
    error: '#dc2626',
    background: {
        light: '#f8fafc', // Bleu-gris très très clair (plus doux que le blanc pur)
        dark: '#0f172a'
    },
    paper: {
        light: '#ffffff',
        dark: '#1e293b'
    }
};

export const createCustomTheme = (mode, primaryColor, secondaryColor) => {
    const isLight = mode === 'light';

    // Sécurité sur les couleurs (fallback sur les couleurs premium si invalides)
    const activePrimary = primaryColor && primaryColor.startsWith('#') ? primaryColor : colors.primary;
    const activeSecondary = secondaryColor && secondaryColor.startsWith('#') ? secondaryColor : colors.secondary;

    return createTheme({
        palette: {
            mode,
            primary: {
                main: activePrimary,
                light: isLight ? alpha(activePrimary, 0.7) : alpha(activePrimary, 0.8),
                dark: isLight ? alpha(activePrimary, 1.2) : activePrimary, // MUI gérera les variations si on ne précise pas trop
                contrastText: '#ffffff',
            },
            secondary: {
                main: activeSecondary,
                light: alpha(activeSecondary, 0.7),
                dark: alpha(activeSecondary, 1.2),
                contrastText: '#ffffff',
            },
            background: {
                default: isLight ? colors.background.light : colors.background.dark,
                paper: isLight ? colors.paper.light : colors.paper.dark,
            },
            text: {
                primary: isLight ? '#1e293b' : '#f1f5f9',
                secondary: isLight ? '#64748b' : '#94a3b8',
            },
            divider: isLight ? alpha('#000000', 0.06) : alpha('#ffffff', 0.08),
        },
        typography: {
            fontFamily: "'Inter', 'Plus Jakarta Sans', 'Roboto', sans-serif",
            h1: { fontWeight: 800, fontSize: '2.25rem', letterSpacing: '-0.02em', color: isLight ? '#1e293b' : '#fff' },
            h2: { fontWeight: 700, fontSize: '1.875rem', letterSpacing: '-0.01em', color: isLight ? '#1e293b' : '#fff' },
            h3: { fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.01em', color: isLight ? '#1e293b' : '#fff' },
            h4: { fontWeight: 600, fontSize: '1.25rem', color: isLight ? '#1e293b' : '#fff' },
            h5: { fontWeight: 600, fontSize: '1.125rem', color: isLight ? '#1e293b' : '#fff' },
            h6: { fontWeight: 600, fontSize: '1rem', color: isLight ? '#1e293b' : '#fff' },
            body1: { fontSize: '0.95rem', lineHeight: 1.6 },
            body2: { fontSize: '0.875rem', lineHeight: 1.5 },
            button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
        },
        shape: { borderRadius: 12 },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        scrollbarColor: isLight ? "#cbd5e1 #f1f5f9" : "#475569 #0f172a",
                        "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
                            width: "8px",
                            height: "8px",
                        },
                        "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
                            backgroundColor: isLight ? "#cbd5e1" : "#475569",
                            borderRadius: "8px",
                            border: `2px solid ${isLight ? "#f1f5f9" : "#0f172a"}`,
                        },
                        "&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track": {
                            backgroundColor: isLight ? "#f1f5f9" : "#0f172a",
                        },
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                        boxShadow: isLight
                            ? '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' // Tailwind shadow-sm est très propre
                            : '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
                        border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.05)', // Bordure ultra subtile
                    },
                    elevation0: { boxShadow: 'none', border: 'none' },
                    elevation1: {
                        boxShadow: isLight
                            ? '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
                            : '0 4px 6px -1px rgb(0 0 0 / 0.4)',
                    },
                    elevation2: {
                        boxShadow: isLight
                            ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                            : '0 10px 15px -3px rgb(0 0 0 / 0.4)',
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 16,
                        boxShadow: isLight
                            ? '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)'
                            : '0 4px 6px -1px rgb(0 0 0 / 0.4)',
                        border: 'none', // Plus de bordure moche
                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: isLight
                                ? '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)'
                                : '0 10px 15px -3px rgb(0 0 0 / 0.5)',
                        },
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                        padding: '8px 20px',
                        boxShadow: 'none',
                        '&:hover': { boxShadow: 'none' },
                    },
                    containedPrimary: {
                        backgroundColor: colors.primary,
                        '&:hover': { backgroundColor: '#1e293b' },
                    },
                    containedSecondary: {
                        color: '#fff', // Assurer un bon contraste
                    },
                },
            },
            MuiDataGrid: {
                styleOverrides: {
                    root: {
                        border: 'none',
                        backgroundColor: isLight ? '#ffffff' : '#1e293b',
                        borderRadius: 16,
                        '& .MuiDataGrid-withBorderColor': {
                            borderColor: isLight ? '#e2e8f0' : '#334155',
                        },
                    },
                    columnHeaders: {
                        backgroundColor: isLight ? '#f8fafc' : '#0f172a',
                        borderBottom: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`,
                        color: isLight ? '#475569' : '#94a3b8',
                        textTransform: 'uppercase',
                        fontSize: '0.75rem',
                        letterSpacing: '0.05em',
                    },
                    row: {
                        '&:hover': {
                            backgroundColor: isLight ? '#f1f5f9' : '#334155',
                        },
                    },
                    cell: {
                        borderBottom: `1px solid ${isLight ? '#f1f5f9' : '#334155'}`,
                    },
                    footerContainer: {
                        borderTop: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`,
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundColor: isLight ? '#ffffff' : '#0f172a',
                        color: isLight ? '#1e293b' : '#f1f5f9',
                        boxShadow: isLight
                            ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                            : '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
                        borderBottom: `1px solid ${isLight ? '#e2e8f0' : '#1e293b'}`,
                    },
                },
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        backgroundColor: '#111827', // Sidebar toujours sombre pour le contraste pro
                        color: '#e2e8f0',
                        borderRight: 'none',
                    },
                },
            },
            MuiListItemButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                        margin: '4px 8px',
                        '&.Mui-selected': {
                            backgroundColor: alpha(colors.secondary, 0.15),
                            color: colors.secondary,
                            '&:hover': {
                                backgroundColor: alpha(colors.secondary, 0.25),
                            },
                            '& .MuiListItemIcon-root': {
                                color: colors.secondary,
                            },
                        },
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        },
                    },
                },
            },
            MuiListItemIcon: {
                styleOverrides: {
                    root: {
                        color: '#94a3b8',
                        minWidth: 40,
                    },
                },
            },
        },
    });
};

export const lightTheme = createCustomTheme('light');
export const darkTheme = createCustomTheme('dark');

