import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LoadingScreen } from './LoadingScreen';

export const PublicRoute: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated === undefined) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    // Redirect authenticated users to the home dashboard
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
