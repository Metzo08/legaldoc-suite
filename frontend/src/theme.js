/**
 * Système de thème Premium LegalDoc Suite
 * Design épuré, professionnel et moderne
 */
import { createTheme, alpha } from '@mui/material/styles';

// Palette Ultra-Premium & Radiante
const colors = {
    primary: '#6366f1', // Indigo Vibrant
    secondary: '#f59e0b', // Ambre Éclatant
    success: '#10b981',
    info: '#3b82f6',
    warning: '#f59e0b',
    error: '#ef4444',
    background: {
        light: '#f8fafc',
        dark: '#030712' // Slate 950 pour un noir profond "spatial"
    },
    paper: {
        light: 'rgba(255, 255, 255, 0.8)',
        dark: 'rgba(15, 23, 42, 0.75)' // Slate 900 semi-transparent
    }
};

export const createCustomTheme = (mode, primaryColor, secondaryColor) => {
    const isLight = mode === 'light';

    const activePrimary = primaryColor && primaryColor.startsWith('#') ? primaryColor : colors.primary;
    const activeSecondary = secondaryColor && secondaryColor.startsWith('#') ? secondaryColor : colors.secondary;

    return createTheme({
        palette: {
            mode,
            primary: {
                main: activePrimary,
                light: alpha(activePrimary, 0.5),
                dark: alpha(activePrimary, 0.9),
                contrastText: '#ffffff',
            },
            secondary: {
                main: activeSecondary,
                light: alpha(activeSecondary, 0.5),
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
            divider: isLight ? alpha('#000000', 0.06) : 'rgba(255, 255, 255, 0.05)',
        },
        typography: {
            fontFamily: "'Plus Jakarta Sans', 'Inter', 'Roboto', sans-serif",
            h1: { fontWeight: 800, fontSize: '2.5rem', letterSpacing: '-0.04em', color: isLight ? '#1e293b' : '#fff' },
            h2: { fontWeight: 800, fontSize: '2rem', letterSpacing: '-0.03em', color: isLight ? '#1e293b' : '#fff' },
            h3: { fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.02em', color: isLight ? '#1e293b' : '#fff' },
            body1: { fontSize: '1rem', lineHeight: 1.6 },
            body2: { fontSize: '0.875rem', lineHeight: 1.5 },
            button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0.02em' },
        },
        shape: { borderRadius: 16 },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        transition: 'background-color 0.3s ease',
                        backgroundColor: isLight ? '#f8fafc' : '#030712',
                        backgroundImage: isLight 
                            ? 'radial-gradient(at 0% 0%, hsla(210,100%,98%,1) 0, transparent 50%), radial-gradient(at 100% 100%, hsla(210,100%,96%,1) 0, transparent 50%)'
                            : `radial-gradient(at 0% 0%, ${alpha(activePrimary, 0.15)} 0, transparent 50%), 
                               radial-gradient(at 100% 0%, ${alpha(activeSecondary, 0.10)} 0, transparent 50%),
                               radial-gradient(at 50% 100%, ${alpha(activePrimary, 0.05)} 0, transparent 50%)`,
                        backgroundAttachment: 'fixed',
                        scrollbarColor: isLight ? "#cbd5e1 #f1f5f9" : "#334155 #030712",
                        "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
                            width: "8px",
                            height: "8px",
                        },
                        "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
                            backgroundColor: isLight ? "#cbd5e1" : "#334155",
                            borderRadius: "10px",
                            border: `2px solid ${isLight ? "#f1f5f9" : "#030712"}`,
                        },
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        boxShadow: isLight
                            ? '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)'
                            : '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        border: isLight 
                            ? '1px solid rgba(255, 255, 255, 0.3)' 
                            : '1px solid rgba(255, 255, 255, 0.08)',
                    },
                    elevation0: { boxShadow: 'none', border: 'none', background: 'transparent', backdropFilter: 'none' },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 24,
                        background: isLight 
                            ? 'rgba(255, 255, 255, 0.7)' 
                            : 'rgba(30, 41, 59, 0.4)',
                        border: isLight 
                            ? '1px solid rgba(255, 255, 255, 0.5)' 
                            : '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                            transform: 'translateY(-4px) scale(1.01)',
                            boxShadow: isLight
                                ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                                : `0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 0 20px ${alpha(activePrimary, 0.2)}`,
                            border: isLight 
                                ? '1px solid rgba(255, 255, 255, 0.8)' 
                                : `1px solid ${alpha(activePrimary, 0.3)}`,
                        },
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        padding: '10px 24px',
                        boxShadow: 'none',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': { 
                            boxShadow: isLight ? 'none' : `0 0 15px ${alpha(activePrimary, 0.4)}`,
                            transform: 'translateY(-1px)',
                        },
                    },
                    containedPrimary: {
                        background: `linear-gradient(135deg, ${activePrimary} 0%, ${alpha(activePrimary, 0.8)} 100%)`,
                        '&:hover': {
                            background: `linear-gradient(135deg, ${alpha(activePrimary, 0.9)} 0%, ${activePrimary} 100%)`,
                        },
                    },
                },
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        borderRadius: 24,
                        background: isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(15, 23, 42, 0.8)',
                        backdropFilter: 'blur(20px)',
                    },
                },
            },
            MuiDialogTitle: {
                styleOverrides: {
                    root: {
                        background: `linear-gradient(135deg, ${activePrimary} 0%, ${activeSecondary} 100%)`,
                        color: '#fff',
                        padding: '24px 32px',
                    },
                },
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        backgroundColor: isLight ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.03)',
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: alpha(activePrimary, 0.5),
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: activePrimary,
                            boxShadow: `0 0 0 4px ${alpha(activePrimary, 0.1)}`,
                        },
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundColor: isLight ? 'rgba(255, 255, 255, 0.7)' : 'rgba(3, 7, 18, 0.7)',
                        backdropFilter: 'blur(12px)',
                        borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`,
                        boxShadow: 'none',
                    },
                },
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        backgroundColor: isLight ? '#ffffff' : 'rgba(3, 7, 18, 0.9)',
                        backdropFilter: 'blur(20px)',
                        borderRight: `1px solid ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`,
                    },
                },
            },
            MuiListItemButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        margin: '4px 12px',
                        transition: 'all 0.2s ease',
                        '&.Mui-selected': {
                            background: `linear-gradient(135deg, ${alpha(activePrimary, 0.2)} 0%, ${alpha(activePrimary, 0.05)} 100%)`,
                            color: isLight ? activePrimary : '#fff',
                            '&:hover': {
                                background: `linear-gradient(135deg, ${alpha(activePrimary, 0.3)} 0%, ${alpha(activePrimary, 0.1)} 100%)`,
                            },
                            '& .MuiListItemIcon-root': {
                                color: activePrimary,
                                transform: 'scale(1.1)',
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

