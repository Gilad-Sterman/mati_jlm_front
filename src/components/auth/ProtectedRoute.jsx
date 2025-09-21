import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../../store/authSlice';

/**
 * ProtectedRoute component that requires user authentication
 * Redirects to login page if user is not authenticated
 */
export function ProtectedRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}
