import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const techniqueService = {
    // Get all techniques with optional filters
    getTechniques: async (filters = {}) => {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams(filters);

        const response = await axios.get(`${API_URL}/techniques?${params}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    },

    // Get single technique by ID
    getTechniqueById: async (id) => {
        const token = localStorage.getItem('token');

        const response = await axios.get(`${API_URL}/techniques/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    }
};

export default techniqueService;