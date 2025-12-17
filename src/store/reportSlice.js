import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import reportService from '../services/reportService';

// Async thunks
// Simple function to fetch ALL reports at once
export const fetchAllReports = createAsyncThunk(
  'reports/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await reportService.getAllReports();
      return response.data.reports || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch reports'
      );
    }
  }
);

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
  async (sessionIds, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      
      // Filter out sessions that are already loading or have reports
      const sessionsToFetch = sessionIds.filter(sessionId => {
        const isLoading = state.reports.isLoadingSession[sessionId];
        const hasReports = state.reports.reportsBySession[sessionId]?.length > 0;
        return !isLoading && !hasReports;
      });
      
      if (sessionsToFetch.length === 0) {
        return []; // No sessions to fetch
      }
      
      console.log(`Actually fetching reports for ${sessionsToFetch.length} sessions:`, sessionsToFetch);
      
      // Fetch reports for multiple sessions in parallel
      const promises = sessionsToFetch.map(sessionId => 
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

export const regenerateClientReport = createAsyncThunk(
  'reports/regenerateClientReport',
  async ({ sessionId, notes }, { rejectWithValue, getState }) => {
    try {
      // Get the client report for this session
      const state = getState();
      const sessionReports = state.reports.reportsBySession[sessionId] || [];
      const clientReport = sessionReports.find(r => r.type === 'client' && r.is_current_version);
      
      if (!clientReport) {
        throw new Error('No client report found for this session');
      }
      
      // Call the regenerate service with the client report ID
      const response = await reportService.regenerateReport(clientReport.id, { notes });
      return response.data.job; // Return job info, not report (report comes via socket)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to regenerate client report'
      );
    }
  }
);

export const exportClientReport = createAsyncThunk(
  'reports/exportClientReport',
  async ({ sessionId, pdfFormData }, { rejectWithValue, getState }) => {
    try {
      // Get the client report for this session
      const state = getState();
      const sessionReports = state.reports.reportsBySession[sessionId] || [];
      const clientReport = sessionReports.find(r => r.type === 'client' && r.is_current_version);
      
      if (!clientReport) {
        throw new Error('No client report found for this session');
      }
      
      // Call the export service with the client report ID and PDF file
      const response = await reportService.exportReport(clientReport.id, pdfFormData);
      return { sessionId, exportResult: response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to export client report'
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
  isRegeneratingSession: {}, // Map of sessionId -> boolean (for regeneration)
  isExportingSession: {}, // Map of sessionId -> boolean (for export)
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
    },
    // Handle regeneration started event from socket
    regenerationStarted: (state, action) => {
      const { sessionId } = action.payload;
      state.isRegeneratingSession[sessionId] = true;
      delete state.sessionErrors[sessionId];
    },
    // Handle regeneration completed event from socket
    regenerationCompleted: (state, action) => {
      const { sessionId, report } = action.payload;
      state.isRegeneratingSession[sessionId] = false;
      
      // Update the report in state
      if (report) {
        reportSlice.caseReducers.updateReportInState(state, { payload: report });
      }
    },
    // Handle regeneration error event from socket
    regenerationError: (state, action) => {
      const { sessionId, error } = action.payload;
      state.isRegeneratingSession[sessionId] = false;
      state.sessionErrors[sessionId] = error;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch ALL reports at once - simple and clean!
      .addCase(fetchAllReports.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllReports.fulfilled, (state, action) => {
        state.isLoading = false;
        const reports = action.payload;
        
        // Clear existing data
        state.reportsBySession = {};
        state.reportsById = {};
        
        // Group reports by session and store by ID
        reports.forEach(report => {
          // Store by ID for easy access
          state.reportsById[report.id] = report;
          
          // Group by session ID
          const sessionId = report.session_id;
          if (!state.reportsBySession[sessionId]) {
            state.reportsBySession[sessionId] = [];
          }
          state.reportsBySession[sessionId].push(report);
        });
        
      })
      .addCase(fetchAllReports.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

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
      .addCase(fetchReportsForMultipleSessions.pending, (state, action) => {
        const sessionIds = action.meta.arg;
        state.isLoading = true;
        state.error = null;
        
        // Mark all sessions as loading
        sessionIds.forEach(sessionId => {
          state.isLoadingSession[sessionId] = true;
        });
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
        
        // Clear loading states for all sessions
        const sessionIds = action.meta.arg;
        sessionIds.forEach(sessionId => {
          state.isLoadingSession[sessionId] = false;
        });
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

      // Regenerate client report
      .addCase(regenerateClientReport.pending, (state, action) => {
        const { sessionId } = action.meta.arg;
        // Don't use regular loading state for regeneration
        delete state.sessionErrors[sessionId];
      })
      .addCase(regenerateClientReport.fulfilled, (state, action) => {
        const { sessionId } = action.meta.arg;
        // Start regeneration loading state
        state.isRegeneratingSession[sessionId] = true;
        
        // The payload contains job info, not the report itself
        // The actual report will be updated via socket events
      })
      .addCase(regenerateClientReport.rejected, (state, action) => {
        const { sessionId } = action.meta.arg;
        state.sessionErrors[sessionId] = action.payload;
      })

      // Export client report
      .addCase(exportClientReport.pending, (state, action) => {
        const { sessionId } = action.meta.arg;
        state.isExportingSession[sessionId] = true;
        delete state.sessionErrors[sessionId];
      })
      .addCase(exportClientReport.fulfilled, (state, action) => {
        const { sessionId, exportResult } = action.payload;
        state.isExportingSession[sessionId] = false;
        
        // Update the reports with the new status from the export result
        if (exportResult.report) {
          reportSlice.caseReducers.updateReportInState(state, { payload: exportResult.report });
        }
        
        // TODO: Could also update session status in session slice if needed
      })
      .addCase(exportClientReport.rejected, (state, action) => {
        const { sessionId } = action.meta.arg;
        state.isExportingSession[sessionId] = false;
        state.sessionErrors[sessionId] = action.payload;
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
  updateReportInState,
  regenerationStarted,
  regenerationCompleted,
  regenerationError
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

export const selectIsRegeneratingSessionReports = (sessionId) => (state) => 
  state.reports.isRegeneratingSession[sessionId] || false;

export const selectIsExportingSessionReports = (sessionId) => (state) => 
  state.reports.isExportingSession[sessionId] || false;

export const selectReportsError = (state) => state.reports.error;

export const selectSessionReportsError = (sessionId) => (state) => 
  state.reports.sessionErrors[sessionId];

// Simple helper selector for session page
export const selectAvailableReportsForSession = (sessionId) => (state) => {
  const reports = state.reports.reportsBySession[sessionId] || [];
  return {
    adviser: reports.find(r => r.type === 'adviser'),
    client: reports.find(r => r.type === 'client'),
    summary: reports.find(r => r.type === 'summary')
  };
};

// Simple selector to check if reports are loaded
export const selectAreReportsLoaded = (state) => {
  return Object.keys(state.reports.reportsBySession).length > 0 || !state.reports.isLoading;
};

export const selectHasReportsForSession = (sessionId) => (state) => {
  const reports = state.reports.reportsBySession[sessionId] || [];
  return reports.length > 0;
};

export default reportSlice.reducer;
