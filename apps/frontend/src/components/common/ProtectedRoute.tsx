import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore, UserRole } from '../../store/authStore';
import { LoadingScreen } from './LoadingScreen';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  console.log('[ROUTE] Evaluating path:', location.pathname, '| Authenticated:', isAuthenticated, '| Role:', user?.role);

  // Handle loading or uninitialized state
  if (isAuthenticated === undefined) {
    console.log('[ROUTE]', location.pathname, '-> Uninitialized auth state, rendering LoadingScreen');
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    console.log('[ROUTE]', location.pathname, '-> Not authenticated, redirecting to /login');
    // Redirect to login page and save previous location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    console.log('[ROUTE]', location.pathname, '-> Role mismatch for role:', user.role, ', redirecting to /unauthorized');
    // Redirect unauthorized users
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('[ROUTE]', location.pathname, '-> Access granted, rendering Outlet');
  return <Outlet />;
};

export default ProtectedRoute;
