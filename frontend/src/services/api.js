import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if it exists
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        console.log('Token from localStorage:', token ? 'EXISTS' : 'MISSING'); // Debug
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Added Authorization header'); // Debug
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Auth APIs
const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
};

const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
};

const getCurrentUser = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};

// Technique APIs
const getTechniques = async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/techniques?${params}`);
    return response.data;
};

const getTechnique = async (id) => {
    const response = await api.get(`/techniques/${id}`);
    return response.data;
};

const createTechnique = async (techniqueData) => {
    const response = await api.post('/techniques', techniqueData);
    return response.data;
};

// Export all functions
export { register, login, getCurrentUser, getTechniques, getTechnique, createTechnique };

export default api;