/**
 * Services API pour toutes les entités.
 */
import apiClient from './apiClient';

// API Clients
export const clientsAPI = {
    getAll: (params) => apiClient.get('/documents/clients/', { params }),
    getOne: (id) => apiClient.get(`/documents/clients/${id}/`),
    create: (data) => apiClient.post('/documents/clients/', data),
    update: (id, data) => apiClient.put(`/documents/clients/${id}/`, data),
    delete: (id) => apiClient.delete(`/documents/clients/${id}/`)
};

// API Cases
export const casesAPI = {
    getAll: (params) => apiClient.get('/documents/cases/', { params }),
    getOne: (id) => apiClient.get(`/documents/cases/${id}/`),
    create: (data) => apiClient.post('/documents/cases/', data),
    update: (id, data) => apiClient.put(`/documents/cases/${id}/`, data),
    delete: (id) => apiClient.delete(`/documents/cases/${id}/`),
    chatInit: (id) => apiClient.get(`/documents/cases/${id}/chat_init/`),
    chatMessage: (id, data) => apiClient.post(`/documents/cases/${id}/chat_message/`, data)
};

// API Documents
export const documentsAPI = {
    getAll: (params) => apiClient.get('/documents/documents/', { params }),
    getOne: (id) => apiClient.get(`/documents/documents/${id}/`),
    upload: (formData) => apiClient.post('/documents/documents/', formData),
    update: (id, formData) => apiClient.patch(`/documents/documents/${id}/`, formData),
    delete: (id) => apiClient.delete(`/documents/documents/${id}/`),
    download: (id) => apiClient.get(`/documents/documents/${id}/download/`, {
        responseType: 'blob'
    }),
    search: (query) => apiClient.get('/documents/documents/search/', {
        params: { q: query }
    }),
    reprocessOcr: (id) => apiClient.post(`/documents/documents/${id}/reprocess-ocr/`)
};

// API Users
export const usersAPI = {
    getAll: (params) => apiClient.get('/users/', { params }),
    getOne: (id) => apiClient.get(`/users/${id}/`),
    getMe: () => apiClient.get('/users/me/'),
    create: (data) => apiClient.post('/users/', data),
    update: (id, data) => apiClient.patch(`/users/${id}/`, data),
    changePassword: (id, data) => apiClient.post(`/users/${id}/change_password/`, data),
    deactivate: (id) => apiClient.post(`/users/${id}/deactivate/`),
    activate: (id) => apiClient.post(`/users/${id}/activate/`),
    delete: (id) => apiClient.delete(`/users/${id}/`),
    setup2FA: () => apiClient.post('/users/setup_2fa/'),
    confirm2FA: (data) => apiClient.post('/users/confirm_2fa/', data),
    disable2FA: (data) => apiClient.post('/users/disable_2fa/', data),
    getRolePermissions: () => apiClient.get('/users/roles/'),
    updateRolePermissions: (role, data) => apiClient.patch(`/users/roles/${role}/`, data)
};

// API Audit Logs
export const auditAPI = {
    getAll: (params) => apiClient.get('/documents/audit/', { params })
};

// API Permissions
export const permissionsAPI = {
    getAll: (params) => apiClient.get('/documents/permissions/', { params }),
    create: (data) => apiClient.post('/documents/permissions/', data),
    delete: (id) => apiClient.delete(`/documents/permissions/${id}/`)
};

// API Tags
export const tagsAPI = {
    getAll: (params) => apiClient.get('/documents/tags/', { params }),
    getOne: (id) => apiClient.get(`/documents/tags/${id}/`),
    create: (data) => apiClient.post('/documents/tags/', data),
    update: (id, data) => apiClient.put(`/documents/tags/${id}/`, data),
    delete: (id) => apiClient.delete(`/documents/tags/${id}/`)
};

// API Deadlines
export const deadlinesAPI = {
    getAll: (params) => apiClient.get('/documents/deadlines/', { params }),
    getOne: (id) => apiClient.get(`/documents/deadlines/${id}/`),
    create: (data) => apiClient.post('/documents/deadlines/', data),
    update: (id, data) => apiClient.put(`/documents/deadlines/${id}/`, data),
    delete: (id) => apiClient.delete(`/documents/deadlines/${id}/`),
    complete: (id) => apiClient.post(`/documents/deadlines/${id}/complete/`),
    uncomplete: (id) => apiClient.post(`/documents/deadlines/${id}/uncomplete/`)
};

// API Document Versions
export const versionsAPI = {
    getAll: (params) => apiClient.get('/documents/versions/', { params }),
    getOne: (id) => apiClient.get(`/documents/versions/${id}/`),
    create: (formData) => apiClient.post('/documents/versions/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    delete: (id) => apiClient.delete(`/documents/versions/${id}/`)
};

// API Cabinet
export const cabinetAPI = {
    getPublicInfo: () => apiClient.get('/cabinet/public/'),
    getSettings: () => apiClient.get('/cabinet/settings/'),
    updateSettings: (data) => apiClient.patch('/cabinet/settings/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getTeam: () => apiClient.get('/cabinet/team/'),
    createTeamMember: (data) => apiClient.post('/cabinet/team/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    updateTeamMember: (id, data) => apiClient.patch(`/cabinet/team/${id}/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    deleteTeamMember: (id) => apiClient.delete(`/cabinet/team/${id}/`)
};

// API Notifications
export const notificationsAPI = {
    getAll: (params) => apiClient.get('/documents/notifications/', { params }),
    markRead: (id) => apiClient.post(`/documents/notifications/${id}/mark_as_read/`),
    markAllRead: () => apiClient.post('/documents/notifications/mark_all_as_read/')
};

export const diligencesAPI = {
    getAll: (params) => apiClient.get('/documents/diligences/', { params }),
    create: (data) => apiClient.post('/documents/diligences/', data),
    update: (id, data) => apiClient.patch(`/documents/diligences/${id}/`, data),
    delete: (id) => apiClient.delete(`/documents/diligences/${id}/`)
};

export const tasksAPI = {
    getAll: (params) => apiClient.get('/documents/tasks/', { params }),
    getOne: (id) => apiClient.get(`/documents/tasks/${id}/`),
    create: (data) => apiClient.post('/documents/tasks/', data),
    update: (id, data) => apiClient.put(`/documents/tasks/${id}/`, data),
    delete: (id) => apiClient.delete(`/documents/tasks/${id}/`)
};

export const decisionsAPI = {
    getAll: (params) => apiClient.get('/documents/decisions/', { params }),
    create: (data) => apiClient.post('/documents/decisions/', data),
    update: (id, data) => apiClient.put(`/documents/decisions/${id}/`, data),
    delete: (id) => apiClient.delete(`/documents/decisions/${id}/`)
};

export const agendaAPI = {
    getAll: (params) => apiClient.get('/documents/agenda/', { params }),
    getAggregated: (params) => apiClient.get('/documents/agenda/aggregated/', { params }),
    create: (data) => apiClient.post('/documents/agenda/', data),
    update: (id, data) => apiClient.put(`/documents/agenda/${id}/`, data),
    delete: (id) => apiClient.delete(`/documents/agenda/${id}/`)
};

