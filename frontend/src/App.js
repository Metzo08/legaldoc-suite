import React, { useState, useEffect, createContext, useMemo, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, ThemeProvider, CssBaseline } from '@mui/material';
import { createCustomTheme } from './theme';
import authService from './services/authService';
import { cabinetAPI } from './services/api';
import Loading from './components/Loading';
import { NotificationProvider } from './context/NotificationContext';

// Lazy Loading Pages
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const ClientDashboard = lazy(() => import('./pages/ClientDashboard'));
const Clients = lazy(() => import('./pages/Clients'));
const Cases = lazy(() => import('./pages/Cases'));
const CaseDetail = lazy(() => import('./pages/CaseDetail'));
const Documents = lazy(() => import('./pages/Documents'));
const Search = lazy(() => import('./pages/Search'));
const Users = lazy(() => import('./pages/Users'));
const AuditLog = lazy(() => import('./pages/AuditLog'));
const Audiences = lazy(() => import('./pages/Audiences'));
const Tags = lazy(() => import('./pages/Tags'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Deadlines = lazy(() => import('./pages/Deadlines'));
const Profile = lazy(() => import('./pages/Profile'));
const Layout = lazy(() => import('./components/Layout'));

// Context pour le thème
export const ThemeContext = createContext({
    darkMode: false,
    toggleDarkMode: () => { },
    cabinetSettings: null
});

// Composant pour protéger les routes
const PrivateRoute = ({ children }) => {
    return authService.isAuthenticated() ? children : <Navigate to="/login" />;
};

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
    const [cabinetSettings, setCabinetSettings] = useState(null);

    // Récupérer la préférence de thème depuis localStorage
    const [darkMode, setDarkMode] = useState(() => {
        const savedMode = localStorage.getItem('darkMode');
        return savedMode === 'true';
    });

    // Charger les infos du cabinet (couleurs, logo...)
    useEffect(() => {
        const loadCabinetSettings = async () => {
            try {
                const response = await cabinetAPI.getPublicInfo();
                setCabinetSettings(response.data);
            } catch (error) {
                console.error("Erreur chargement infos cabinet:", error);
            }
        };
        loadCabinetSettings();
    }, []);

    // Sauvegarder la préférence de thème
    useEffect(() => {
        localStorage.setItem('darkMode', darkMode);
    }, [darkMode]);

    const toggleDarkMode = useMemo(() => () => {
        setDarkMode(prev => !prev);
    }, []);

    // Mémoriser le thème pour éviter les re-renders inutiles
    const theme = useMemo(
        () => createCustomTheme(
            darkMode ? 'dark' : 'light',
            cabinetSettings?.branding?.primary_color,
            cabinetSettings?.branding?.secondary_color
        ),
        [darkMode, cabinetSettings]
    );

    const themeContextValue = useMemo(
        () => ({ darkMode, toggleDarkMode, cabinetSettings }),
        [darkMode, toggleDarkMode, cabinetSettings]
    );

    useEffect(() => {
        // Vérifier l'authentification au chargement
        setIsAuthenticated(authService.isAuthenticated());
    }, []);

    return (
        <ThemeContext.Provider value={themeContextValue}>
            <ThemeProvider theme={theme}>
                <NotificationProvider>
                    <CssBaseline />
                    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
                        <Suspense fallback={
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%' }}>
                                <Loading message="Chargement de LegalDoc Suite..." />
                            </Box>
                        }>
                            <Routes>
                                {/* Route publique - Vitrine */}
                                <Route path="/" element={<LandingPage />} />

                                {/* Route publique - Connexion */}
                                <Route
                                    path="/login"
                                    element={
                                        <Login
                                            setIsAuthenticated={setIsAuthenticated}
                                            cabinetInfo={cabinetSettings}
                                        />
                                    }
                                />

                                {/* Routes protégées */}
                                <Route
                                    path="/*"
                                    element={
                                        <PrivateRoute>
                                            <Layout setIsAuthenticated={setIsAuthenticated}>
                                                <Suspense fallback={<Loading />}>
                                                    <Routes>
                                                        <Route path="/dashboard" element={
                                                            authService.getCurrentUser()?.role === 'CLIENT'
                                                                ? <ClientDashboard />
                                                                : <Dashboard />
                                                        } />
                                                        <Route path="/clients" element={<Clients />} />
                                                        <Route path="/cases" element={<Cases />} />
                                                        <Route path="/cases/:id" element={<CaseDetail />} />
                                                        <Route path="/documents" element={<Documents />} />
                                                        <Route path="/audiences" element={<Audiences />} />
                                                        <Route path="/deadlines" element={<Deadlines />} />
                                                        <Route path="/tags" element={<Tags />} />
                                                        <Route path="/tasks" element={<Tasks />} />
                                                        <Route path="/search" element={<Search />} />
                                                        <Route path="/users" element={<Users />} />
                                                        <Route path="/audit" element={<AuditLog />} />
                                                        <Route path="/profile" element={<Profile />} />
                                                        <Route path="*" element={<Navigate to="/dashboard" />} />
                                                    </Routes>
                                                </Suspense>
                                            </Layout>
                                        </PrivateRoute>
                                    }
                                />
                            </Routes>
                        </Suspense>
                    </Box>
                </NotificationProvider>
            </ThemeProvider>
        </ThemeContext.Provider>
    );
}

export default App;
