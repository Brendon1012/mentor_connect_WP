import { CloudOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

// Shown on public pages when the first login check could not reach the server.
export default function ServerStatusBanner() {
  const { status, checkAuth } = useAuth();
  if (status !== 'unavailable') return null;
  return (
    <div className="container" style={{ paddingTop: 16 }}>
      <div className="alert alert-warning" role="status">
        <CloudOff aria-hidden="true" />
        <span>
          We cannot reach the server right now, so some features may not work.{' '}
          <button type="button" className="btn btn-sm btn-outline" onClick={checkAuth} style={{ marginLeft: 8 }}>
            Retry
          </button>
        </span>
      </div>
    </div>
  );
}
