import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import clientService from '../services/clientService';

// Async thunks
export const fetchClientsForSelection = createAsyncThunk(
  'clients/fetchForSelection',
  async (limit = 50, { rejectWithValue }) => {
    try {
      const response = await clientService.getClientsForSelection(limit);
      return response.data.clients;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch clients'
      );
    }
  }
);

export const createClient = createAsyncThunk(
  'clients/create',
  async (clientData, { rejectWithValue }) => {
    try {
      const response = await clientService.createClient(clientData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create client'
      );
    }
  }
);

export const quickCreateClient = createAsyncThunk(
  'clients/quickCreate',
  async (clientData, { rejectWithValue }) => {
    try {
      const response = await clientService.quickCreateClient(clientData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create client'
      );
    }
  }
);

export const fetchClients = createAsyncThunk(
  'clients/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await clientService.getClients(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch clients'
      );
    }
  }
);

// Initial state
const initialState = {
  clients: [],
  selectionClients: [],
  currentClient: null,
  isLoading: false,
  isCreating: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  }
};

// Client slice
const clientSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentClient: (state) => {
      state.currentClient = null;
    },
    addClientToSelection: (state, action) => {
      // Add newly created client to selection list
      state.selectionClients.unshift(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch clients for selection cases
      .addCase(fetchClientsForSelection.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchClientsForSelection.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectionClients = action.payload;
        state.error = null;
      })
      .addCase(fetchClientsForSelection.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create client cases
      .addCase(createClient.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.isCreating = false;
        state.clients.unshift(action.payload);
        state.currentClient = action.payload;
        state.error = null;
      })
      .addCase(createClient.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload;
      })
      // Quick create client cases
      .addCase(quickCreateClient.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(quickCreateClient.fulfilled, (state, action) => {
        state.isCreating = false;
        state.selectionClients.unshift(action.payload);
        state.currentClient = action.payload;
        state.error = null;
      })
      .addCase(quickCreateClient.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload;
      })
      // Fetch all clients cases
      .addCase(fetchClients.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clients = action.payload.clients || [];
        state.pagination = action.payload.pagination || state.pagination;
        state.error = null;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

// Actions
export const { clearError, clearCurrentClient, addClientToSelection } = clientSlice.actions;

// Selectors
export const selectClients = (state) => state.clients.clients;
export const selectSelectionClients = (state) => state.clients.selectionClients;
export const selectCurrentClient = (state) => state.clients.currentClient;
export const selectIsLoading = (state) => state.clients.isLoading;
export const selectIsCreating = (state) => state.clients.isCreating;
export const selectError = (state) => state.clients.error;
export const selectPagination = (state) => state.clients.pagination;

export default clientSlice.reducer;
