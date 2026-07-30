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

  // Handle loading or uninitialized state
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

  // KYC / Onboarding Route Guard for Buyers
  if (user && user.role === 'buyer') {
    const isCompleted = user.onboardingStage === 'COMPLETED';
    const isKycRoute = location.pathname.startsWith('/client/kyc');
    const isOfferLetterRoute = location.pathname.startsWith('/client/offer-letter');
    const isApplicantInfoRoute = location.pathname.startsWith('/client/applicant-info');

    // Allow access to KYC, Offer Letter, and Applicant Info routes for buyers
    if (!isCompleted && !isKycRoute && !isOfferLetterRoute && !isApplicantInfoRoute) {
      return <Navigate to="/client/kyc" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
