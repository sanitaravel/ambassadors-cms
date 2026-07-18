import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../context/auth-context';
import { storeRedirectPath } from '../../utils/redirect-store';

/**
 * Route guard that protects child routes from unauthenticated access.
 *
 * - While auth state is loading, shows a loading spinner.
 * - If user is unauthenticated, stores the current path and redirects to /login.
 * - If authenticated, renders the child route via <Outlet />.
 */
export function AuthGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Loading"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: '4px solid #e5e7eb',
            borderTopColor: '#d54407',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    storeRedirectPath(location.pathname);
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
