import { AlertTriangle, CloudOff, Inbox, RotateCw } from 'lucide-react';
import Button from './Button.jsx';

export function EmptyState({ icon: Icon = Inbox, title, message, action, compact }) {
  return (
    <div className={`state ${compact ? 'state-compact' : ''}`}>
      <div className="state-icon" aria-hidden="true">
        <Icon />
      </div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry, compact }) {
  return (
    <div className={`state state-error ${compact ? 'state-compact' : ''}`} role="alert">
      <div className="state-icon" aria-hidden="true">
        <AlertTriangle />
      </div>
      <h3>Could not load this</h3>
      <p>{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={() => onRetry()}>
          <RotateCw aria-hidden="true" /> Try again
        </Button>
      )}
    </div>
  );
}

export function PageLoader({ label = 'Loading...' }) {
  return (
    <div className="page-loader" role="status">
      <span className="spinner spinner-lg" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ServiceUnavailable({ onRetry }) {
  return (
    <div className="container section">
      <div className="state state-error" role="alert">
        <div className="state-icon" aria-hidden="true">
          <CloudOff />
        </div>
        <h3>Service temporarily unavailable</h3>
        <p>We cannot reach the MentorConnect server or its database right now. Please try again in a moment.</p>
        {onRetry && (
          <Button variant="primary" onClick={() => onRetry()}>
            <RotateCw aria-hidden="true" /> Retry
          </Button>
        )}
      </div>
    </div>
  );
}
