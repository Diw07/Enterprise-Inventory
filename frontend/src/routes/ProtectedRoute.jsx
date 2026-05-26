import { Navigate, Outlet } from 'react-router-dom';
import { useUser, useOrganization, OrganizationSwitcher } from '@clerk/clerk-react';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ roles }) => {
  const { isLoaded, isSignedIn } = useUser();
  const { organization } = useOrganization();
  const { user, loading } = useAuth();

  if (!isLoaded || loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isSignedIn) return <Navigate to="/login" replace />;

  // If user hasn't selected an organization, show a centered selection screen
  if (!organization) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-brand-50 to-indigo-100 p-4">
      <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select an Organization</h2>
        <p className="text-gray-600 text-sm mb-6">
          To access the inventory system, please create a new organization or switch to an existing one.
        </p>
        <div className="flex justify-center">
          <OrganizationSwitcher
            hidePersonal={true}
            afterCreateOrganizationUrl="/"
            afterSelectOrganizationUrl="/"
            appearance={{
              elements: {
                rootBox: 'w-full max-w-xs',
                organizationSwitcherTrigger: 'w-full justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors',
              }
            }}
          />
        </div>
      </div>
    </div>
  );

  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return <Outlet />;
};
