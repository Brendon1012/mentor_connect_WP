import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { SessionStatusBadge } from '../ui/Badge.jsx';
import { formatTime } from '../../utils/formatters.js';
import { useAuth } from '../../context/AuthContext.jsx';
import './Dashboard.css';

const monthFmt = new Intl.DateTimeFormat('en-IN', { month: 'short' });
const weekdayFmt = new Intl.DateTimeFormat('en-IN', { weekday: 'short' });

export default function SessionRow({ session, past }) {
  const { user } = useAuth();
  const when = new Date(session.scheduledAt);
  const other = user.role === 'student' ? session.mentor : session.student;
  const base = `/${user.role}/sessions/${session._id}`;
  // A scheduled session whose time has passed but was never marked complete.
  const overdue = session.status === 'scheduled' && when.getTime() < Date.now();

  return (
    <li className={`session-row ${past ? 'past' : ''}`}>
      <div className="session-date" aria-hidden="true">
        <span className="m">{monthFmt.format(when)}</span>
        <span className="d">{when.getDate()}</span>
      </div>
      <div className="session-main">
        <h3>
          <Link to={base}>{session.title}</Link>
        </h3>
        <p>
          {weekdayFmt.format(when)}, {formatTime(when)} · {session.durationMinutes} min · with {other?.name || 'unknown'}
        </p>
      </div>
      <div className="session-side">
        {overdue ? <span className="badge badge-warning">Awaiting completion</span> : <SessionStatusBadge status={session.status} />}
        {!past && session.meetingUrl && session.status === 'scheduled' && (
          <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer" className="small">
            Join link <ExternalLink size={12} aria-hidden="true" style={{ display: 'inline' }} />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
      </div>
    </li>
  );
}
