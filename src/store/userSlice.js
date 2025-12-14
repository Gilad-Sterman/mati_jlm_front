import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import UserService from '../services/userService';

// Async thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await UserService.getAllUsers(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserStatus = createAsyncThunk(
  'users/updateUserStatus',
  async ({ userId, status }, { rejectWithValue }) => {
    try {
      const response = await UserService.updateUserStatus(userId, status);
      return { userId, user: response.data.user };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserStats = createAsyncThunk(
  'users/fetchUserStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await UserService.getUserStats();
      return response.data.stats;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  users: [],
  stats: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  },
  isLoading: false,
  isUpdating: {},
  error: null
};

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.users;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update user status
      .addCase(updateUserStatus.pending, (state, action) => {
        const userId = action.meta.arg.userId;
        state.isUpdating[userId] = true;
        state.error = null;
      })
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        const { userId, user } = action.payload;
        state.isUpdating[userId] = false;
        
        // Get old user data before updating
        const userIndex = state.users.findIndex(u => u.id === userId);
        const oldUser = userIndex !== -1 ? state.users[userIndex] : null;
        
        // Update user in the list
        if (userIndex !== -1) {
          state.users[userIndex] = user;
        }
        
        // Update stats locally
        if (state.stats && oldUser && oldUser.status !== user.status) {
          // Decrement old status count
          if (oldUser.status === 'active') {
            state.stats.active = Math.max(0, state.stats.active - 1);
          } else if (oldUser.status === 'inactive') {
            state.stats.inactive = Math.max(0, state.stats.inactive - 1);
          }
          
          // Increment new status count
          if (user.status === 'active') {
            state.stats.active = state.stats.active + 1;
          } else if (user.status === 'inactive') {
            state.stats.inactive = state.stats.inactive + 1;
          }
        }
      })
      .addCase(updateUserStatus.rejected, (state, action) => {
        const userId = action.meta.arg.userId;
        state.isUpdating[userId] = false;
        state.error = action.payload;
      })
      
      // Fetch user stats
      .addCase(fetchUserStats.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const { clearError, setPage } = userSlice.actions;
export default userSlice.reducer;
