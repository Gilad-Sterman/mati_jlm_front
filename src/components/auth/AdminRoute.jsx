import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectIsAdmin, selectUser } from '../../store/authSlice';

/**
 * AdminRoute component that requires admin authentication
 * Redirects to login if not authenticated, or to appropriate page if not admin
 */
export function AdminRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);
  const user = useSelector(selectUser);
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    // Redirect non-admin users to their appropriate page
    if (user?.role === 'adviser') {
      return <Navigate to="/upload" replace />;
    }
    // Fallback to login for unknown roles
    return <Navigate to="/" replace />;
  }

  return children;
}
