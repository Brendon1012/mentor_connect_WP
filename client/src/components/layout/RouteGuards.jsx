import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { PageLoader, ServiceUnavailable } from '../ui/States.jsx';
import { dashboardPath } from '../../utils/constants.js';

/*
 * Wraps pages that need a login.
 * - Not logged in      -> /login, remembering where the user wanted to go
 * - Logged in, wrong role -> their own dashboard
 * The server enforces the same rules; this only keeps the UI consistent.
 */
export function ProtectedRoute({ role, children }) {
  const { user, status, checkAuth } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <PageLoader label="Checking your login..." />;
  if (status === 'unavailable' && !user) return <ServiceUnavailable onRetry={checkAuth} />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (role && user.role !== role) return <Navigate to={dashboardPath(user.role)} replace />;
  return children;
}

// Login and register pages: logged-in users are sent to their dashboard instead.
export function GuestRoute({ children }) {
  const { user, status } = useAuth();
  if (status === 'loading') return <PageLoader />;
  if (user) return <Navigate to={dashboardPath(user.role)} replace />;
  return children;
}
