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

export const fetchSessions = createAsyncThunk(
  'sessions/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await sessionService.getSessions(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch sessions'
      );
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

// Initial state
const initialState = {
  sessions: [],
  currentSession: null,
  isLoading: false,
  isUploading: false,
  uploadProgress: 0,
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
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create session cases
      .addCase(createSession.pending, (state) => {
        state.isUploading = true;
        state.uploadProgress = 0;
        state.error = null;
      })
      .addCase(createSession.fulfilled, (state, action) => {
        state.isUploading = false;
        state.uploadProgress = 100;
        state.sessions.unshift(action.payload);
        state.currentSession = action.payload;
        state.error = null;
      })
      .addCase(createSession.rejected, (state, action) => {
        state.isUploading = false;
        state.uploadProgress = 0;
        state.error = action.payload;
      })
      // Fetch sessions cases
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
      // Fetch session by ID cases
      .addCase(fetchSessionById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSessionById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSession = action.payload;
        state.error = null;
      })
      .addCase(fetchSessionById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

// Actions
export const { clearError, clearCurrentSession, setUploadProgress, resetUploadState } = sessionSlice.actions;

// Selectors
export const selectSessions = (state) => state.sessions.sessions;
export const selectCurrentSession = (state) => state.sessions.currentSession;
export const selectIsLoading = (state) => state.sessions.isLoading;
export const selectIsUploading = (state) => state.sessions.isUploading;
export const selectUploadProgress = (state) => state.sessions.uploadProgress;
export const selectError = (state) => state.sessions.error;
export const selectPagination = (state) => state.sessions.pagination;

export default sessionSlice.reducer;
