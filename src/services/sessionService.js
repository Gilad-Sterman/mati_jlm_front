import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if this is NOT a login request
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      
      if (!isLoginRequest) {
        // Token expired or invalid on authenticated request
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export const sessionService = {
  // Create new session with file upload
  async createSession(sessionData) {
    const formData = new FormData();
    
    // Add file
    formData.append('file', sessionData.file);
    
    // Add session fields
    if (sessionData.title) {
      formData.append('title', sessionData.title);
    }
    
    // Handle client data - either existing client ID or new client data
    if (sessionData.client_id) {
      formData.append('client_id', sessionData.client_id);
    } else if (sessionData.newClient) {
      // Add new client data as JSON string
      formData.append('newClient', JSON.stringify(sessionData.newClient));
    }
    
    const response = await api.post('/sessions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Get all sessions
  async getSessions(params = {}) {
    const response = await api.get('/sessions', { params });
    return response.data;
  },

  // Get session by ID
  async getSessionById(id) {
    const response = await api.get(`/sessions/${id}`);
    return response.data;
  },

  // Search sessions
  async searchSessions(query) {
    const response = await api.get('/sessions/search', {
      params: { q: query }
    });
    return response.data;
  },

  // Get session statistics
  async getSessionStats() {
    const response = await api.get('/sessions/stats');
    return response.data;
  },

  // Update session
  async updateSession(id, data) {
    const response = await api.put(`/sessions/${id}`, data);
    return response.data;
  },

  // Delete session (admin only)
  async deleteSession(id) {
    const response = await api.delete(`/sessions/${id}`);
    return response.data;
  }
};

export default sessionService;
