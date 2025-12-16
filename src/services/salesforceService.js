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

export const salesforceService = {
  // Lookup client data from Salesforce by business number
  async lookupClientData(businessNumber) {
    try {
      const response = await api.post('/salesforce/lookup', {
        business_number: businessNumber
      });

      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };

    } catch (error) {
      console.error('Salesforce lookup error:', error);
      
      if (error.response) {
        // Server responded with error status
        return {
          success: false,
          error: error.response.data.message || 'Failed to lookup client data'
        };
      } else if (error.request) {
        // Request timeout or network error
        return {
          success: false,
          error: 'Network error - please check your connection'
        };
      } else {
        // Other error
        return {
          success: false,
          error: error.message || 'Failed to lookup client data'
        };
      }
    }
  }
};
