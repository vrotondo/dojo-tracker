import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

const sessionService = {
    getSessions: async (filters = {}) => {
        const params = new URLSearchParams(filters);
        const response = await api.get(`/training/sessions?${params}`);
        return response.data;
    },

    getSession: async (sessionId) => {
        const response = await api.get(`/training/sessions/${sessionId}`);
        return response.data;
    },

    createSession: async (sessionData) => {
        const response = await api.post('/training/sessions', sessionData);
        return response.data;
    },

    updateSession: async (sessionId, sessionData) => {
        const response = await api.put(`/training/sessions/${sessionId}`, sessionData);
        return response.data;
    },

    deleteSession: async (sessionId) => {
        const response = await api.delete(`/training/sessions/${sessionId}`);
        return response.data;
    },

    getSessionStats: async () => {
        const response = await api.get('/training/sessions/stats');
        return response.data;
    }
};

export default sessionService;