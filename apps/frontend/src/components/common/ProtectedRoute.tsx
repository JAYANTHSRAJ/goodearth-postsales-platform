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

  // Handle loading or uninitialized state (mock state is instant, but hooks into framework design)
  if (isAuthenticated === undefined) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    // Redirect to login page and save previous location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized users
    return <Navigate to="/unauthorized" replace />;
  }

  // Onboarding Route Guard
  if (user && user.role === 'buyer') {
    const isCompleted = !user.onboardingStage || user.onboardingStage === 'COMPLETED';
    if (!isCompleted && location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />;
    }
    if (isCompleted && location.pathname === '/onboarding') {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};
