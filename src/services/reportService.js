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

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

class ReportService {
  /**
   * Get ALL reports at once - much simpler!
   */
  async getAllReports() {
    try {
      const response = await api.get('/reports');
      return response.data;
    } catch (error) {
      console.error('Error fetching all reports:', error);
      throw error;
    }
  }

  /**
   * Get all reports for a specific session
   */
  async getReportsForSession(sessionId) {
    try {
      const response = await api.get(`/reports/session/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reports for session:', error);
      throw error;
    }
  }

  /**
   * Get a specific report by ID
   */
  async getReportById(reportId) {
    try {
      const response = await api.get(`/reports/${reportId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching report:', error);
      throw error;
    }
  }

  /**
   * Update a report
   */
  async updateReport(reportId, updateData) {
    try {
      const response = await api.put(`/reports/${reportId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating report:', error);
      throw error;
    }
  }

  /**
   * Approve a report
   */
  async approveReport(reportId, approvalNotes = null) {
    try {
      const response = await api.post(`/reports/${reportId}/approve`, {
        approval_notes: approvalNotes
      });
      return response.data;
    } catch (error) {
      console.error('Error approving report:', error);
      throw error;
    }
  }

  /**
   * Regenerate a report using AI
   */
  async regenerateReport(reportId) {
    try {
      const response = await api.post(`/reports/${reportId}/regenerate`);
      return response.data;
    } catch (error) {
      console.error('Error regenerating report:', error);
      throw error;
    }
  }

  /**
   * Get all reports (with pagination)
   */
  async getReports(params = {}) {
    try {
      const response = await api.get('/reports', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const reportService = new ReportService();
export default reportService;
