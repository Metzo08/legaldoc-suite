/**
 * Client API configuré avec intercepteurs pour l'authentification JWT.
 */
import axios from 'axios';
import authService from './authService';

const API_URL = process.env.REACT_APP_API_URL ||
    (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:8000/api' : '/api');

// Créer une instance axios
const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercepteur pour ajouter le token JWT à chaque requête
apiClient.interceptors.request.use(
    (config) => {
        const token = authService.getAccessToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepteur pour gérer le rafraîchissement du token
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Si erreur 401 et pas déjà tenté de rafraîchir
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                await authService.refreshToken();
                const token = authService.getAccessToken();
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                // Rafraîchissement échoué, rediriger vers login
                authService.logout();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
