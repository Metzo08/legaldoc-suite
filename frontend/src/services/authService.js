/**
 * Service d'authentification pour gérer les tokens JWT et les appels API.
 */
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class AuthService {
    /**
     * Connexion utilisateur.
     */
    async login(username, password) {
        const response = await axios.post(`${API_URL}/auth/login/`, {
            username,
            password
        });

        if (response.data.access) {
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);

            // Décoder le token pour obtenir les infos utilisateur
            const decoded = jwtDecode(response.data.access);
            localStorage.setItem('user', JSON.stringify(decoded));
        }

        return response.data;
    }

    /**
     * Déconnexion utilisateur.
     */
    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    }

    /**
     * Récupère le token d'accès.
     */
    getAccessToken() {
        return localStorage.getItem('access_token');
    }

    /**
     * Récupère le token de rafraîchissement.
     */
    getRefreshToken() {
        return localStorage.getItem('refresh_token');
    }

    /**
     * Vérifie si l'utilisateur est connecté.
     */
    isAuthenticated() {
        const token = this.getAccessToken();
        if (!token) return false;

        try {
            const decoded = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            return decoded.exp > currentTime;
        } catch (error) {
            return false;
        }
    }

    /**
     * Récupère l'utilisateur actuel.
     */
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        if (userStr) return JSON.parse(userStr);
        return null;
    }

    /**
     * Rafraîchit le token d'accès.
     */
    async refreshToken() {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await axios.post(`${API_URL}/auth/refresh/`, {
                refresh: refreshToken
            });

            if (response.data.access) {
                localStorage.setItem('access_token', response.data.access);
                return response.data.access;
            }
        } catch (error) {
            this.logout();
            throw error;
        }
    }
}

export default new AuthService();
