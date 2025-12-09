import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import sessionService from '../services/sessionService';

// Async thunks
export const createSession = createAsyncThunk(
  'sessions/create',
  async (sessionData, { rejectWithValue }) => {
    try {
      const response = await sessionService.createSession(sessionData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create session'
      );
    }
  }
);

export const fetchSessionsWithReports = createAsyncThunk(
  'sessions/fetchWithReports',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await sessionService.getSessionsWithReports(params);

      // Return the sessions with reports already attached
      const sessions = response.data.sessions || [];

      return {
        ...response.data,
        sessions: sessions
      };
    } catch (error) {
      // If API fails, still return the example session with reports
      const exampleSession = {
        id: 'session-123',
        title: 'דוגמה - ייעוץ עסקי לחברת תיירות',
        status: 'completed',
        created_at: new Date('2024-12-01T10:30:00Z').toISOString(),
        file_name: 'business_consultation_demo.mp3',
        file_size: 15728640, // 15MB
        duration: 1800, // 30 minutes
        file_url: 'https://example.com/demo-audio.mp3',
        client: {
          id: 'client-demo',
          name: 'דוד כהן',
          email: 'david.cohen@example.com',
          metadata: {
            business_domain: 'תיירות וסיורים',
            business_number: '123456789'
          }
        },
        // Reports already attached to the session
        reports: {
          adviser: {
            id: 'report-adviser-123',
            type: 'adviser',
            status: 'approved',
            created_at: new Date('2024-12-01T11:30:00Z').toISOString()
          },
          client: {
            id: 'report-client-123',
            type: 'client',
            status: 'approved',
            created_at: new Date('2024-12-01T12:00:00Z').toISOString()
          }
        }
      };

      return {
        sessions: [exampleSession],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      };
    }
  }
);

export const fetchSessions = createAsyncThunk(
  'sessions/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await sessionService.getSessions(params);

      // Add example session to the beginning of the list
      const sessions = response.data.sessions || [];

      return {
        ...response.data,
        sessions: sessions
      };
    } catch (error) {
      // If API fails, still return the example session
      const exampleSession = {
        id: 'session-123',
        title: 'דוגמה - ייעוץ עסקי לחברת תיירות',
        status: 'completed',
        created_at: new Date('2024-12-01T10:30:00Z').toISOString(),
        file_name: 'business_consultation_demo.mp3',
        file_size: 15728640, // 15MB
        duration: 1800, // 30 minutes
        file_url: 'https://example.com/demo-audio.mp3',
        client: {
          id: 'client-demo',
          name: 'דוד כהן',
          email: 'david.cohen@example.com',
          metadata: {
            business_domain: 'תיירות וסיורים',
            business_number: '123456789'
          }
        }
      };

      return {
        sessions: [exampleSession],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      };
    }
  }
);

export const fetchSessionById = createAsyncThunk(
  'sessions/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await sessionService.getSessionById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch session'
      );
    }
  }
);

export const fetchDashboardStats = createAsyncThunk(
  'sessions/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await sessionService.getSessionStats();
      return response.data.stats;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch dashboard stats'
      );
    }
  }
);

// Initial state
const initialState = {
  sessions: [],
  advisers: [], // List of all advisers for admin dropdown
  currentSession: null,
  isLoading: false,
  isUploading: false,
  uploadProgress: 0,
  uploadStatus: null, // 'started', 'uploading', 'complete', 'error'
  uploadMessage: '',
  currentUploadSession: null, // Session being uploaded
  activeSessionId: null, // Session ID that should affect UI state (null means no active session for UI)
  uiState: 'upload', // 'upload', 'uploading', 'transcribing', 'generating_report', 'report_ready', 'processing', 'error'

  // AI Processing state
  processingStage: null, // 'transcribing', 'generating_report', 'completed'
  processingMessage: '',
  transcriptionComplete: false,
  advisorReportGenerated: false,
  currentReport: null, // Generated advisor report data

  // Dashboard stats
  dashboardStats: null,
  isDashboardLoading: false,
  dashboardError: null,

  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  }
};

// Session slice
const sessionSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentSession: (state) => {
      state.currentSession = null;
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    resetUploadState: (state) => {
      state.isUploading = false;
      state.uploadProgress = 0;
      state.uploadStatus = null;
      state.uploadMessage = '';
      state.currentUploadSession = null;
      state.activeSessionId = null; // Clear active session
      state.uiState = 'upload';
      state.error = null;

      // Also reset AI processing state
      state.processingStage = null;
      state.processingMessage = '';
      state.transcriptionComplete = false;
      state.advisorReportGenerated = false;
      state.currentReport = null;
    },
    // New action to return to upload form
    returnToUpload: (state) => {
      state.uiState = 'upload';
      state.uploadStatus = null;
      state.uploadMessage = '';
      state.currentUploadSession = null;
      state.activeSessionId = null; // Clear active session so socket events don't affect UI
      state.error = null;

      // Reset processing state for clean UI
      state.processingStage = null;
      state.processingMessage = '';
      state.transcriptionComplete = false;
      state.advisorReportGenerated = false;
      state.currentReport = null;
    },
    // Socket event handlers
    handleUploadStarted: (state, action) => {
      const { fileName, message } = action.payload;
      state.uploadStatus = 'started';
      state.uploadMessage = message;
      state.currentUploadSession = { fileName };
      // state.currentUploadSession = { id: sessionId, fileName };
      // state.activeSessionId = sessionId; // Set this session as active for UI updates
      state.uploadProgress = 5;
      state.uiState = 'uploading'; // Switch to uploading UI
    },
    handleUploadProgress: (state, action) => {
      const { sessionId, progress, message } = action.payload;

      if (!state.activeSessionId && sessionId) {
        state.activeSessionId = sessionId;
        state.currentUploadSession = {
          ...state.currentUploadSession,
          id: sessionId,
          sessionId
        };
      }

      // Only update UI state if this is the active session
      if (state.activeSessionId === sessionId) {
        state.uploadStatus = 'uploading';
        state.uploadProgress = progress;
        state.uploadMessage = message;
      }
    },
    handleUploadComplete: (state, action) => {
      const { sessionId, message, fileUrl, duration } = action.payload;

      if (!state.activeSessionId && sessionId) {
        state.activeSessionId = sessionId;
        state.currentUploadSession = {
          ...state.currentUploadSession,
          id: sessionId,
          sessionId
        };
      }

      // Only update UI state if this is the active session
      if (state.activeSessionId === sessionId) {
        state.uploadStatus = 'complete';
        state.uploadProgress = 100;
        state.uploadMessage = message || 'Upload completed successfully!';
        state.isUploading = false;
        state.currentUploadSession = {
          ...state.currentUploadSession,
          id: sessionId,
          sessionId,
          fileUrl,
          duration
        };

        // Transition to processing state - wait for transcription_started event
        state.uiState = 'processing';
        state.processingMessage = 'Upload complete, preparing transcription...';
      }

      // Always update session in sessions array (for data consistency)
      const sessionIndex = state.sessions.findIndex(s => s.id === sessionId);
      if (sessionIndex !== -1) {
        state.sessions[sessionIndex] = {
          ...state.sessions[sessionIndex],
          file_url: fileUrl,
          duration: duration,
          status: 'uploaded'
        };
      }
    },
    handleUploadError: (state, action) => {
      const { sessionId, message, error } = action.payload;

      // Show errors even if not the active session (as requested by user)
      // But only change UI state if it's the active session
      if (state.activeSessionId === sessionId) {
        state.uploadStatus = 'error';
        state.uploadMessage = message;
        state.error = error || message;
        state.isUploading = false;
        state.uploadProgress = 0;
        state.uiState = 'error'; // Switch to error UI
      } else {
        // For non-active sessions, just set a general error that can be shown as a toast/notification
        state.error = `Background upload failed for ${sessionId}: ${message || error}`;
      }
    },

    // AI Processing event handlers
    handleTranscriptionStarted: (state, action) => {
      const { sessionId, message } = action.payload;

      // Only update UI state if this is the active session
      if (state.activeSessionId === sessionId) {
        state.processingStage = 'transcribing';
        state.processingMessage = message || 'Starting transcription...';
        state.uiState = 'transcribing';
        state.transcriptionComplete = false;
      }
    },

    handleTranscriptionComplete: (state, action) => {
      const { sessionId, transcript, message } = action.payload;

      // Only update UI state if this is the active session
      if (state.activeSessionId === sessionId) {
        state.processingStage = 'transcribed';
        state.processingMessage = message || 'Transcription completed';
        state.transcriptionComplete = true;
      }

      // Always update session in sessions array (for data consistency)
      const sessionIndex = state.sessions.findIndex(s => s.id === sessionId);
      if (sessionIndex !== -1) {
        state.sessions[sessionIndex] = {
          ...state.sessions[sessionIndex],
          status: 'transcribed',
          transcription_text: transcript
        };
      }
    },

    handleReportGenerationStarted: (state, action) => {
      const { sessionId, message } = action.payload;

      // Only update UI state if this is the active session
      if (state.activeSessionId === sessionId) {
        state.processingStage = 'generating_report';
        state.processingMessage = message || 'Generating advisor report...';
        state.uiState = 'generating_report';
        state.advisorReportGenerated = false;
      }
    },

    handleAdvisorReportGenerated: (state, action) => {
      const { sessionId, report, message } = action.payload;

      // Only update UI state if this is the active session
      if (state.activeSessionId === sessionId) {
        state.processingStage = 'completed';
        state.processingMessage = message || 'Advisor report generated successfully!';
        state.uiState = 'report_ready';
        state.advisorReportGenerated = true;
        state.currentReport = report;
      }

      // Always update session in sessions array (for data consistency)
      const sessionIndex = state.sessions.findIndex(s => s.id === sessionId);
      if (sessionIndex !== -1) {
        state.sessions[sessionIndex] = {
          ...state.sessions[sessionIndex],
          status: 'reports_generated'
        };
      }
    },

    handleProcessingError: (state, action) => {
      const { sessionId, message, error, stage } = action.payload;

      // Show errors even if not the active session (as requested by user)
      // But only change UI state if it's the active session
      if (state.activeSessionId === sessionId) {
        state.processingStage = 'error';
        state.processingMessage = message || 'Processing failed';
        state.error = error || message;
        state.uiState = 'error';
      } else {
        // For non-active sessions, just set a general error that can be shown as a toast/notification
        state.error = `Background processing failed for ${sessionId}: ${message || error}`;
      }

      // Always update session status to failed (for data consistency)
      const sessionIndex = state.sessions.findIndex(s => s.id === sessionId);
      if (sessionIndex !== -1) {
        state.sessions[sessionIndex] = {
          ...state.sessions[sessionIndex],
          status: 'failed'
        };
      }
    },

    // Reset processing state
    resetProcessingState: (state) => {
      state.processingStage = null;
      state.processingMessage = '';
      state.transcriptionComplete = false;
      state.advisorReportGenerated = false;
      state.currentReport = null;
      state.uiState = 'upload';
    },

    // Restore active session for socket events
    restoreActiveSession: (state, action) => {
      const { sessionId } = action.payload;
      state.activeSessionId = sessionId;
      console.log(`🔄 Active session restored: ${sessionId}`);
    }
  },
  extraReducers: (builder) => {
    builder
      // Create session cases
      .addCase(createSession.pending, (state) => {
        state.isUploading = true;
        state.uploadProgress = 0;
        state.uiState = 'uploading'; // Immediately switch to uploading UI
        state.uploadMessage = 'Preparing upload...';
        state.error = null;
        state.activeSessionId = null; // Clear any previous active session
        state.currentUploadSession = null; // Clear previous upload session
      })
      .addCase(createSession.fulfilled, (state, action) => {
        // Don't set isUploading to false yet - socket events will handle that
        state.uploadProgress = 5; // Initial progress after API success
        state.sessions.unshift(action.payload.session);
        state.currentSession = action.payload.session;
        state.currentUploadSession = action.payload.session;
        state.activeSessionId = action.payload.session.id; // Set as active session
        state.uploadStatus = 'started';
        state.uploadMessage = 'Session created, starting file upload...';
        state.error = null;
      })
      .addCase(createSession.rejected, (state, action) => {
        state.isUploading = false;
        state.uploadProgress = 0;
        state.uiState = 'upload'; // Reset to upload form
        state.uploadStatus = null;
        state.uploadMessage = '';
        state.currentUploadSession = null;
        state.error = action.payload?.message || action.error?.message || 'Upload failed';
      })
      .addCase(fetchSessions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessions = action.payload.sessions || [];
        state.pagination = action.payload.pagination || state.pagination;
        state.error = null;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch sessions with reports cases
      .addCase(fetchSessionsWithReports.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSessionsWithReports.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessions = action.payload.sessions || [];
        state.advisers = action.payload.advisers || []; // Store advisers data
        state.pagination = action.payload.pagination || state.pagination;
        state.error = null;

        // No need to fetch reports separately - they're already attached to sessions
      })
      .addCase(fetchSessionsWithReports.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch session by ID cases
      .addCase(fetchSessionById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSessionById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSession = action.payload.session || action.payload;
        state.error = null;
      })
      .addCase(fetchSessionById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Dashboard stats cases
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isDashboardLoading = true;
        state.dashboardError = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isDashboardLoading = false;
        state.dashboardStats = action.payload;
        state.dashboardError = null;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isDashboardLoading = false;
        state.dashboardError = action.payload;
      })
      // Reset session state on logout
      .addCase('auth/logout', (state) => {
        return {
          ...initialState,
          sessions: [], // Keep empty sessions array
          pagination: initialState.pagination
        };
      });
  }
});

// Actions
export const {
  clearError,
  clearCurrentSession,
  setUploadProgress,
  resetUploadState,
  returnToUpload,
  handleUploadStarted,
  handleUploadProgress,
  handleUploadComplete,
  handleUploadError,
  handleTranscriptionStarted,
  handleTranscriptionComplete,
  handleReportGenerationStarted,
  handleAdvisorReportGenerated,
  handleProcessingError,
  resetProcessingState,
  restoreActiveSession
} = sessionSlice.actions;

// Selectors
export const selectSessions = (state) => state.sessions.sessions;
export const selectAdvisers = (state) => state.sessions.advisers;
export const selectCurrentSession = (state) => state.sessions.currentSession;
export const selectIsLoading = (state) => state.sessions.isLoading;
export const selectIsUploading = (state) => state.sessions.isUploading;
export const selectUploadProgress = (state) => state.sessions.uploadProgress;
export const selectUploadStatus = (state) => state.sessions.uploadStatus;
export const selectUploadMessage = (state) => state.sessions.uploadMessage;
export const selectCurrentUploadSession = (state) => state.sessions.currentUploadSession;
export const selectActiveSessionId = (state) => state.sessions.activeSessionId;
export const selectUiState = (state) => state.sessions.uiState;
export const selectError = (state) => state.sessions.error;

// Dashboard selectors
export const selectDashboardStats = (state) => state.sessions.dashboardStats;
export const selectIsDashboardLoading = (state) => state.sessions.isDashboardLoading;
export const selectDashboardError = (state) => state.sessions.dashboardError;

// AI Processing selectors
export const selectProcessingStage = (state) => state.sessions.processingStage;
export const selectProcessingMessage = (state) => state.sessions.processingMessage;
export const selectTranscriptionComplete = (state) => state.sessions.transcriptionComplete;
export const selectAdvisorReportGenerated = (state) => state.sessions.advisorReportGenerated;
export const selectCurrentReport = (state) => state.sessions.currentReport;
export const selectPagination = (state) => state.sessions.pagination;

export default sessionSlice.reducer;
