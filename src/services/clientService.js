import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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

export const clientService = {
  // Get clients for selection dropdown
  async getClientsForSelection(limit = 50) {
    const response = await api.get('/clients/selection', {
      params: { limit }
    });
    return response.data;
  },

  // Get all clients
  async getClients(params = {}) {
    const response = await api.get('/clients', { params });
    return response.data;
  },

  // Create new client
  async createClient(clientData) {
    const response = await api.post('/clients', clientData);
    return response.data;
  },

  // Quick create client (for upload process)
  async quickCreateClient(clientData) {
    const response = await api.post('/clients/quick', clientData);
    return response.data;
  },

  // Get client by ID
  async getClientById(id) {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },

  // Search clients
  async searchClients(query) {
    const response = await api.get('/clients/search', {
      params: { q: query }
    });
    return response.data;
  },

  // Get client statistics
  async getClientStats() {
    const response = await api.get('/clients/stats');
    return response.data;
  }
};

export default clientService;
