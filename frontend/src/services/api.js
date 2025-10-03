import axios from 'axios';

const API_URL = 'http://localhost:5000/api';  // ✅ CORRECT: Your backend is on 5000

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

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

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

export { register, login, getCurrentUser, getTechniques, getTechnique, createTechnique };
export default api;