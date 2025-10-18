import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import reportService from '../services/reportService';

// Async thunks
export const fetchReportsForSession = createAsyncThunk(
  'reports/fetchForSession',
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await reportService.getReportsForSession(sessionId);
      return { sessionId, reports: response.data.reports };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch reports'
      );
    }
  }
);

export const fetchReportsForMultipleSessions = createAsyncThunk(
  'reports/fetchForMultipleSessions',
  async (sessionIds, { rejectWithValue }) => {
    try {
      // Fetch reports for multiple sessions in parallel
      const promises = sessionIds.map(sessionId => 
        reportService.getReportsForSession(sessionId)
          .then(response => ({ sessionId, reports: response.data.reports }))
          .catch(error => ({ sessionId, reports: [], error: error.message }))
      );
      
      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch reports for sessions'
      );
    }
  }
);

export const fetchReportById = createAsyncThunk(
  'reports/fetchById',
  async (reportId, { rejectWithValue }) => {
    try {
      const response = await reportService.getReportById(reportId);
      return response.data.report;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch report'
      );
    }
  }
);

export const updateReport = createAsyncThunk(
  'reports/update',
  async ({ reportId, updateData }, { rejectWithValue }) => {
    try {
      const response = await reportService.updateReport(reportId, updateData);
      return response.data.report;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update report'
      );
    }
  }
);

export const approveReport = createAsyncThunk(
  'reports/approve',
  async ({ reportId, approvalNotes }, { rejectWithValue }) => {
    try {
      const response = await reportService.approveReport(reportId, approvalNotes);
      return response.data.report;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to approve report'
      );
    }
  }
);

// Initial state
const initialState = {
  // Map of sessionId -> reports array
  reportsBySession: {},
  // Map of reportId -> report object
  reportsById: {},
  // Current report being viewed/edited
  currentReport: null,
  // Loading states
  isLoading: false,
  isLoadingSession: {}, // Map of sessionId -> boolean
  // Errors
  error: null,
  sessionErrors: {}, // Map of sessionId -> error message
};

// Report slice
const reportSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSessionError: (state, action) => {
      const sessionId = action.payload;
      delete state.sessionErrors[sessionId];
    },
    clearCurrentReport: (state) => {
      state.currentReport = null;
    },
    // Helper to update a report in all relevant places
    updateReportInState: (state, action) => {
      const updatedReport = action.payload;
      const reportId = updatedReport.id;
      const sessionId = updatedReport.session_id;

      // Update in reportsById
      state.reportsById[reportId] = updatedReport;

      // Update in reportsBySession
      if (state.reportsBySession[sessionId]) {
        const index = state.reportsBySession[sessionId].findIndex(r => r.id === reportId);
        if (index !== -1) {
          state.reportsBySession[sessionId][index] = updatedReport;
        }
      }

      // Update currentReport if it's the same report
      if (state.currentReport?.id === reportId) {
        state.currentReport = updatedReport;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch reports for single session
      .addCase(fetchReportsForSession.pending, (state, action) => {
        const sessionId = action.meta.arg;
        state.isLoadingSession[sessionId] = true;
        delete state.sessionErrors[sessionId];
      })
      .addCase(fetchReportsForSession.fulfilled, (state, action) => {
        const { sessionId, reports } = action.payload;
        state.isLoadingSession[sessionId] = false;
        state.reportsBySession[sessionId] = reports;
        
        // Also store in reportsById for easy access
        reports.forEach(report => {
          state.reportsById[report.id] = report;
        });
      })
      .addCase(fetchReportsForSession.rejected, (state, action) => {
        const sessionId = action.meta.arg;
        state.isLoadingSession[sessionId] = false;
        state.sessionErrors[sessionId] = action.payload;
      })

      // Fetch reports for multiple sessions
      .addCase(fetchReportsForMultipleSessions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReportsForMultipleSessions.fulfilled, (state, action) => {
        state.isLoading = false;
        
        action.payload.forEach(result => {
          const { sessionId, reports, error } = result;
          
          if (error) {
            state.sessionErrors[sessionId] = error;
          } else {
            state.reportsBySession[sessionId] = reports;
            // Store in reportsById
            reports.forEach(report => {
              state.reportsById[report.id] = report;
            });
          }
          
          state.isLoadingSession[sessionId] = false;
        });
      })
      .addCase(fetchReportsForMultipleSessions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch single report by ID
      .addCase(fetchReportById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReportById.fulfilled, (state, action) => {
        state.isLoading = false;
        const report = action.payload;
        state.currentReport = report;
        state.reportsById[report.id] = report;
        
        // Also update in reportsBySession if exists
        const sessionId = report.session_id;
        if (state.reportsBySession[sessionId]) {
          const index = state.reportsBySession[sessionId].findIndex(r => r.id === report.id);
          if (index !== -1) {
            state.reportsBySession[sessionId][index] = report;
          } else {
            state.reportsBySession[sessionId].push(report);
          }
        }
      })
      .addCase(fetchReportById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update report
      .addCase(updateReport.fulfilled, (state, action) => {
        const updatedReport = action.payload;
        reportSlice.caseReducers.updateReportInState(state, { payload: updatedReport });
      })

      // Approve report
      .addCase(approveReport.fulfilled, (state, action) => {
        const approvedReport = action.payload;
        reportSlice.caseReducers.updateReportInState(state, { payload: approvedReport });
      })

      // Reset on logout
      .addCase('auth/logout', () => {
        return initialState;
      });
  }
});

// Actions
export const { 
  clearError, 
  clearSessionError, 
  clearCurrentReport,
  updateReportInState
} = reportSlice.actions;

// Selectors
export const selectReportsBySession = (sessionId) => (state) => 
  state.reports.reportsBySession[sessionId] || [];

export const selectReportById = (reportId) => (state) => 
  state.reports.reportsById[reportId];

export const selectCurrentReport = (state) => state.reports.currentReport;

export const selectIsLoadingReports = (state) => state.reports.isLoading;

export const selectIsLoadingSessionReports = (sessionId) => (state) => 
  state.reports.isLoadingSession[sessionId] || false;

export const selectReportsError = (state) => state.reports.error;

export const selectSessionReportsError = (sessionId) => (state) => 
  state.reports.sessionErrors[sessionId];

// Helper selectors for session page
export const selectAvailableReportsForSession = (sessionId) => (state) => {
  const reports = state.reports.reportsBySession[sessionId] || [];
  return {
    adviser: reports.find(r => r.type === 'adviser'),
    client: reports.find(r => r.type === 'client'),
    summary: reports.find(r => r.type === 'summary') // Future feature
  };
};

export const selectHasReportsForSession = (sessionId) => (state) => {
  const reports = state.reports.reportsBySession[sessionId] || [];
  return reports.length > 0;
};

export default reportSlice.reducer;
