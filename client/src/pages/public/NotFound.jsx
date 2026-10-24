import { Compass } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { dashboardPath } from '../../utils/constants.js';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';

export default function NotFound({ inDashboard }) {
  useDocumentTitle('Page not found');
  const { user } = useAuth();
  return (
    <div className={inDashboard ? '' : 'container section'}>
      <div className="state">
        <div className="state-icon" aria-hidden="true">
          <Compass />
        </div>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Page not found</h1>
        <p>The page you are looking for does not exist or may have been moved.</p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <Button to={user ? dashboardPath(user.role) : '/'} variant="primary">
            {user ? 'Go to dashboard' : 'Go home'}
          </Button>
          <Button to="/mentors" variant="outline">Find mentors</Button>
        </div>
      </div>
    </div>
  );
}
