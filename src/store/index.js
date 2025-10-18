import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import sessionReducer from './sessionSlice';
import clientReducer from './clientSlice';
import reportReducer from './reportSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    sessions: sessionReducer,
    clients: clientReducer,
    reports: reportReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export default store;
