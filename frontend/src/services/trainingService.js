import axios from 'axios';

const API_URL = 'http://localhost:5000/api/training';

const trainingService = {
    // Get all videos for the current user
    getVideos: async (filters = {}) => {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams(filters);

        const response = await axios.get(`${API_URL}/videos?${params}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    },

    // Get single video by ID
    getVideo: async (videoId) => {
        const token = localStorage.getItem('token');

        const response = await axios.get(`${API_URL}/videos/${videoId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    },

    // Upload a new video
    uploadVideo: async (formData) => {
        const token = localStorage.getItem('token');

        const response = await axios.post(`${API_URL}/videos`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data;
    },

    // Update video metadata
    updateVideo: async (videoId, data) => {
        const token = localStorage.getItem('token');

        const response = await axios.put(`${API_URL}/videos/${videoId}`, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    },

    // Delete a video
    deleteVideo: async (videoId) => {
        const token = localStorage.getItem('token');

        const response = await axios.delete(`${API_URL}/videos/${videoId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    },

    // Get video stream URL
    getVideoStreamUrl: (videoId) => {
        const token = localStorage.getItem('token');
        return `${API_URL}/videos/${videoId}/stream?token=${token}`;
    }
};

export default trainingService;