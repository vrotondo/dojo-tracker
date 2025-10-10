import axios from 'axios';

const API_URL = 'http://localhost:5000/api/progress';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};

const progressService = {
    // Get all progress for current user
    getAllProgress: async (filters = {}) => {
        try {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.favorites) params.append('favorites', 'true');

            const queryString = params.toString();
            const url = queryString ? `${API_URL}/techniques?${queryString}` : `${API_URL}/techniques`;

            const response = await axios.get(url, getAuthHeader());
            return response.data;
        } catch (error) {
            console.error('Error fetching progress:', error);
            throw error;
        }
    },

    // Get progress for a specific technique
    getTechniqueProgress: async (techniqueId) => {
        try {
            const response = await axios.get(
                `${API_URL}/techniques/${techniqueId}`,
                getAuthHeader()
            );
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                // Not tracking this technique yet
                return { tracking: false, progress: null };
            }
            console.error('Error fetching technique progress:', error);
            throw error;
        }
    },

    // Start tracking a technique
    startTracking: async (techniqueId) => {
        try {
            const response = await axios.post(
                `${API_URL}/techniques/${techniqueId}`,
                {},
                getAuthHeader()
            );
            return response.data;
        } catch (error) {
            console.error('Error starting tracking:', error);
            throw error;
        }
    },

    // Update technique progress
    updateProgress: async (techniqueId, updates) => {
        try {
            const response = await axios.put(
                `${API_URL}/techniques/${techniqueId}`,
                updates,
                getAuthHeader()
            );
            return response.data;
        } catch (error) {
            console.error('Error updating progress:', error);
            throw error;
        }
    },

    // Stop tracking a technique
    stopTracking: async (techniqueId) => {
        try {
            const response = await axios.delete(
                `${API_URL}/techniques/${techniqueId}`,
                getAuthHeader()
            );
            return response.data;
        } catch (error) {
            console.error('Error stopping tracking:', error);
            throw error;
        }
    },

    // Get progress statistics
    getStats: async () => {
        try {
            const response = await axios.get(
                `${API_URL}/stats`,
                getAuthHeader()
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching progress stats:', error);
            throw error;
        }
    },

    // Mark technique as practiced
    markPracticed: async (techniqueId, duration = null) => {
        try {
            const updates = { mark_practiced: true };
            if (duration) {
                updates.practice_duration = duration;
            }

            const response = await axios.put(
                `${API_URL}/techniques/${techniqueId}`,
                updates,
                getAuthHeader()
            );
            return response.data;
        } catch (error) {
            console.error('Error marking as practiced:', error);
            throw error;
        }
    }
};

export default progressService;