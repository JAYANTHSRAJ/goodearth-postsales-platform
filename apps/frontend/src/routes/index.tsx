import React, { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { PublicRoute } from '../components/common/PublicRoute';

// Suspense higher order component to handle route-level code splitting loaders
const withSuspense = (importFn: () => Promise<any>, exportName: string) => {
  const LazyComponent = lazy(() => importFn().then((m) => ({ default: m[exportName] })));
  
  const SuspenseWrapper: React.FC<any> = (props) => (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-brand-50/5 dark:bg-brand-950/10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-700" />
        </div>
      }
    >
      <LazyComponent {...props} />
    </Suspense>
  );

  SuspenseWrapper.displayName = `Suspense(${exportName})`;
  return SuspenseWrapper;
};

// Lazy loaded page components
const LoginPage = withSuspense(() => import('../features/auth/pages/LoginPage'), 'LoginPage');
const OTPPage = withSuspense(() => import('../features/auth/pages/OTPPage'), 'OTPPage');
const ForgotPasswordPage = withSuspense(() => import('../features/auth/pages/ForgotPasswordPage'), 'ForgotPasswordPage');
const ResetPasswordPage = withSuspense(() => import('../features/auth/pages/ResetPasswordPage'), 'ResetPasswordPage');
const ActivationPage = withSuspense(() => import('../features/auth/pages/ActivationPage'), 'ActivationPage');
const DashboardPage = withSuspense(() => import('../features/dashboard/pages/DashboardPage'), 'DashboardPage');
const MyHomePage = withSuspense(() => import('../features/dashboard/pages/MyHomePage'), 'MyHomePage');
const AdminPage = withSuspense(() => import('../features/dashboard/pages/AdminPage'), 'AdminPage');
const BuyersPage = withSuspense(() => import('../features/buyers/pages/BuyersPage'), 'BuyersPage');
const ProjectsPage = withSuspense(() => import('../features/projects/pages/ProjectsPage'), 'ProjectsPage');
const WorkflowsPage = withSuspense(() => import('../features/workflows/pages/WorkflowsPage'), 'WorkflowsPage');
const MySelectionsPage = withSuspense(() => import('../features/workflows/pages/MySelectionsPage'), 'MySelectionsPage');
const StagesPage = withSuspense(() => import('../features/stages/pages/StagesPage'), 'StagesPage');
const ClientConstructionUpdatesPage = withSuspense(() => import('../features/stages/pages/ClientConstructionUpdatesPage'), 'ClientConstructionUpdatesPage');
const DocumentsPage = withSuspense(() => import('../features/documents/pages/DocumentsPage'), 'DocumentsPage');
const PaymentsPage = withSuspense(() => import('../features/payments/pages/PaymentsPage'), 'PaymentsPage');
const ClientFinancePage = withSuspense(() => import('../features/payments/pages/ClientFinancePage'), 'ClientFinancePage');
const NotificationsPage = withSuspense(() => import('../features/notifications/pages/NotificationsPage'), 'NotificationsPage');
const AnnotationsPage = withSuspense(() => import('../features/annotations/pages/AnnotationsPage'), 'AnnotationsPage');
const DesignStudioPage = withSuspense(() => import('../features/annotations/pages/DesignStudioPage'), 'DesignStudioPage');
const ClientSupportPage = withSuspense(() => import('../features/dashboard/pages/ClientSupportPage'), 'ClientSupportPage');
const ClientProfilePage = withSuspense(() => import('../features/dashboard/pages/ClientProfilePage'), 'ClientProfilePage');
const OnboardingPage = withSuspense(() => import('../features/onboarding/pages/OnboardingPage'), 'OnboardingPage');
const Unauthorized = withSuspense(() => import('../pages/Unauthorized'), 'Unauthorized');
const NotFound = withSuspense(() => import('../pages/NotFound'), 'NotFound');

export const router = createBrowserRouter([
  // Public-only routes (redirects home if logged in)
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: '/login',
            element: <LoginPage />,
          },
          {
            path: '/verify-otp',
            element: <OTPPage />,
          },
          {
            path: '/forgot-password',
            element: <ForgotPasswordPage />,
          },
          {
            path: '/reset-password',
            element: <ResetPasswordPage />,
          },
          {
            path: '/activate',
            element: <ActivationPage />,
          },
        ],
      },
    ],
  },

  // Authenticated/Protected routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        errorElement: <NotFound />,
        children: [
          {
            path: '/',
            element: <DashboardPage />,
          },
          {
            path: '/notifications',
            element: <NotificationsPage />,
          },
          {
            path: '/unauthorized',
            element: <Unauthorized />,
          },
          // CRM-only routes
          {
            element: <ProtectedRoute allowedRoles={['admin', 'employee']} />,
            children: [
              {
                path: '/buyers',
                element: <BuyersPage />,
              },
              {
                path: '/projects',
                element: <ProjectsPage />,
              },
              {
                path: '/properties',
                element: <ProjectsPage />,
              },
              {
                path: '/workflows',
                element: <WorkflowsPage />,
              },
              {
                path: '/stages',
                element: <StagesPage />,
              },
              {
                path: '/annotations',
                element: <AnnotationsPage />,
              },
              {
                path: '/documents',
                element: <DocumentsPage />,
              },
              {
                path: '/payments',
                element: <PaymentsPage />,
              },
              {
                path: '/reports',
                element: <AdminPage />,
              },
              {
                path: '/settings',
                element: <AdminPage />,
              },
            ],
          },
          // Client-only routes
          {
            element: <ProtectedRoute allowedRoles={['buyer']} />,
            children: [
              {
                path: '/my-home',
                element: <MyHomePage />,
              },
              {
                path: '/design-studio',
                element: <DesignStudioPage />,
              },
              {
                path: '/construction-updates',
                element: <ClientConstructionUpdatesPage />,
              },
              {
                path: '/finance',
                element: <ClientFinancePage />,
              },
              {
                path: '/selections',
                element: <MySelectionsPage />,
              },
              {
                path: '/support',
                element: <ClientSupportPage />,
              },
              {
                path: '/profile',
                element: <ClientProfilePage />,
              },
              {
                path: '/onboarding',
                element: <OnboardingPage />,
              },
            ],
          },
          // Role-Restricted Admin-only route
          {
            element: <ProtectedRoute allowedRoles={['admin']} />,
            children: [
              {
                path: '/admin',
                element: <AdminPage />,
              },
            ],
          },
        ],
      },
    ],
  },

  // Catch-all
  {
    path: '*',
    element: <NotFound />,
  },
]);
