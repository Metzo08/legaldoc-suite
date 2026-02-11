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
                dark: isLight ? alpha(activePrimary, 0.9) : activePrimary,
                contrastText: '#ffffff',
            },
            secondary: {
                main: activeSecondary,
                light: alpha(activeSecondary, 0.7),
                dark: alpha(activeSecondary, 0.9),
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
                            ? '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
                            : '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
                        border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.05)',
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
                        border: 'none',
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
                        fontWeight: 600,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': { boxShadow: 'none', transform: 'scale(1.02)' },
                    },
                    containedPrimary: {
                        background: isLight
                            ? activePrimary
                            : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        color: '#fff',
                        '&:hover': {
                            background: isLight
                                ? alpha(activePrimary, 0.85)
                                : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        },
                    },
                    containedSecondary: {
                        backgroundColor: activeSecondary,
                        color: '#fff',
                        '&:hover': { backgroundColor: alpha(activeSecondary, 0.85) },
                    },
                    outlinedPrimary: {
                        borderColor: isLight ? activePrimary : '#818cf8',
                        color: isLight ? activePrimary : '#a5b4fc',
                        borderWidth: '1.5px',
                        '&:hover': {
                            borderWidth: '1.5px',
                            backgroundColor: isLight ? alpha(activePrimary, 0.04) : alpha('#818cf8', 0.12),
                            borderColor: isLight ? activePrimary : '#a5b4fc',
                        },
                    },
                    outlinedSecondary: {
                        borderColor: isLight ? activeSecondary : '#d4a574',
                        color: isLight ? activeSecondary : '#e8c89e',
                        borderWidth: '1.5px',
                        '&:hover': {
                            borderWidth: '1.5px',
                            backgroundColor: isLight ? alpha(activeSecondary, 0.04) : alpha('#d4a574', 0.12),
                        },
                    },
                    textPrimary: {
                        color: isLight ? activePrimary : '#a5b4fc',
                        '&:hover': {
                            backgroundColor: isLight ? alpha(activePrimary, 0.04) : alpha('#818cf8', 0.1),
                        },
                    },
                },
            },
            // ===== DIALOG — En-tête gradient + coins arrondis =====
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        borderRadius: 16,
                        overflow: 'hidden',
                        border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(99,102,241,0.2)',
                        boxShadow: isLight
                            ? '0 25px 50px -12px rgba(0,0,0,0.15)'
                            : '0 25px 50px -12px rgba(0,0,0,0.6), 0 0 30px rgba(99,102,241,0.1)',
                    },
                },
            },
            MuiDialogTitle: {
                styleOverrides: {
                    root: {
                        fontWeight: 800,
                        fontSize: '1.15rem',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        color: '#ffffff',
                        padding: '16px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    },
                },
            },
            MuiDialogContent: {
                styleOverrides: {
                    root: {
                        padding: '24px 24px 8px 24px',
                    },
                },
            },
            MuiDialogActions: {
                styleOverrides: {
                    root: {
                        padding: '12px 24px 20px 24px',
                        gap: '8px',
                    },
                },
            },
            // ===== INPUTS — Bordures visibles en dark mode =====
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: isLight ? '#cbd5e1' : 'rgba(148,163,184,0.3)',
                            borderWidth: '1.5px',
                            transition: 'border-color 0.2s',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: isLight ? '#94a3b8' : 'rgba(165,180,252,0.5)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#6366f1',
                            borderWidth: '2px',
                        },
                    },
                },
            },
            MuiInputLabel: {
                styleOverrides: {
                    root: {
                        color: isLight ? '#64748b' : '#94a3b8',
                        '&.Mui-focused': {
                            color: '#818cf8',
                        },
                    },
                },
            },
            // ===== CHIP — Meilleur contraste dark mode =====
            MuiChip: {
                styleOverrides: {
                    root: {
                        fontWeight: 600,
                        borderRadius: 8,
                    },
                    outlinedPrimary: {
                        borderColor: isLight ? activePrimary : '#818cf8',
                        color: isLight ? activePrimary : '#a5b4fc',
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
                        textTransform: 'none',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        letterSpacing: '0.01em',
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
                        backgroundColor: '#111827',
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
                            backgroundColor: alpha(activeSecondary, 0.15),
                            color: activeSecondary,
                            '&:hover': {
                                backgroundColor: alpha(activeSecondary, 0.25),
                            },
                            '& .MuiListItemIcon-root': {
                                color: activeSecondary,
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

