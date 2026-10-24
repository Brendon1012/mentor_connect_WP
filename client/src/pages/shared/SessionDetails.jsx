import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, CheckCheck, ExternalLink, MessageSquare, Pencil, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { sessionService } from '../../services/resources.js';
import { getErrorMessage } from '../../services/api.js';
import { ErrorState, PageLoader } from '../../components/ui/States.jsx';
import { SessionStatusBadge } from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import SessionFormModal from '../../components/forms/SessionFormModal.jsx';
import { formatDateTime, formatTime, timeAgo } from '../../utils/formatters.js';
import '../../components/dashboard/Dashboard.css';

export default function SessionDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const base = `/${user.role}`;
  const { data, loading, error, reload } = useFetch(() => sessionService.get(id), [id]);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(null); // 'cancel' | 'complete'
  const [busy, setBusy] = useState(false);
  useDocumentTitle(data?.session?.title || 'Session');

  if (loading) return <PageLoader />;
  if (error) {
    return (
      <>
        <ErrorState message={error} onRetry={reload} />
        <p className="text-center" style={{ marginTop: 16 }}><Link to={`${base}/sessions`}>Back to sessions</Link></p>
      </>
    );
  }

  const { session } = data;
  const other = user.role === 'student' ? session.mentor : session.student;
  const isMentor = user.role === 'mentor';
  const start = new Date(session.scheduledAt);
  const end = new Date(start.getTime() + session.durationMinutes * 60000);
  const started = start.getTime() <= Date.now();
  const scheduled = session.status === 'scheduled';
  const mentorshipActive = session.request?.status === 'accepted';

  async function runConfirmed() {
    setBusy(true);
    try {
      if (confirm === 'cancel') await sessionService.cancel(session._id);
      else await sessionService.update(session._id, { status: 'completed' });
      toast.success(confirm === 'cancel' ? 'Session cancelled' : 'Session marked as completed');
      setConfirm(null);
      reload({ silent: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Link to={`${base}/sessions`} className="btn btn-ghost btn-sm" style={{ marginBottom: 16, paddingLeft: 8 }}>
        <ArrowLeft aria-hidden="true" /> All sessions
      </Link>

      <div className="dash-grid">
        <section className="card stack" aria-labelledby="session-title">
          <div className="row-between" style={{ alignItems: 'flex-start' }}>
            <div>
              <h1 id="session-title" style={{ fontSize: '1.5rem', marginBottom: 4 }}>{session.title}</h1>
              <p className="muted" style={{ margin: 0 }}>
                <CalendarClock size={16} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-3px' }} /> {formatDateTime(start)} - {formatTime(end)}
              </p>
            </div>
            {scheduled && started ? <span className="badge badge-warning">Awaiting completion</span> : <SessionStatusBadge status={session.status} />}
          </div>

          <dl className="detail-list">
            <div><dt>Duration</dt><dd>{session.durationMinutes} minutes</dd></div>
            <div><dt>Mentorship category</dt><dd>{session.request?.category || '-'}</dd></div>
            <div><dt>Rescheduled</dt><dd>{session.rescheduledCount} time{session.rescheduledCount === 1 ? '' : 's'}</dd></div>
            <div><dt>Last updated</dt><dd>{timeAgo(session.updatedAt)}</dd></div>
            {session.status === 'cancelled' && (
              <div><dt>Cancelled by</dt><dd>{session.cancelledBy?.name || 'Automatically (mentorship completed)'}</dd></div>
            )}
            <div style={{ gridColumn: '1 / -1' }}>
              <dt>Meeting link</dt>
              <dd>
                {session.meetingUrl ? (
                  <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer">
                    {session.meetingUrl} <ExternalLink size={14} aria-hidden="true" style={{ display: 'inline' }} />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  <span className="muted">No link added yet. Edit the session to add one.</span>
                )}
              </dd>
            </div>
          </dl>

          <div>
            <h2 style={{ fontSize: '1rem' }}>Agenda / notes</h2>
            <p className="prewrap" style={{ whiteSpace: 'pre-line', margin: 0 }}>{session.description || <span className="muted">No notes.</span>}</p>
          </div>

          {scheduled && (
            <div className="request-actions" style={{ borderTop: '1px solid var(--gray-200)', paddingTop: 16 }}>
              {mentorshipActive && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil aria-hidden="true" /> Edit / reschedule
                </Button>
              )}
              {isMentor && started && (
                <Button variant="primary" size="sm" onClick={() => setConfirm('complete')}>
                  <CheckCheck aria-hidden="true" /> Mark completed
                </Button>
              )}
              <Button variant="danger" size="sm" onClick={() => setConfirm('cancel')}>
                <XCircle aria-hidden="true" /> Cancel session
              </Button>
            </div>
          )}
          {scheduled && isMentor && !started && (
            <p className="small muted" style={{ margin: 0 }}>You can mark this session completed after it starts.</p>
          )}
          {!scheduled && (
            <p className="small muted" style={{ margin: 0 }}>This session is {session.status} and can no longer be changed.</p>
          )}
        </section>

        <aside className="card" aria-labelledby="with-h">
          <h2 id="with-h" style={{ fontSize: '1rem' }}>{isMentor ? 'Student' : 'Mentor'}</h2>
          <div className="row" style={{ marginBottom: 16 }}>
            <Avatar name={other?.name || '?'} src={other?.avatarUrl} size={48} />
            <div>
              <strong style={{ color: 'var(--navy)' }}>{other?.name}</strong>
              <div className="small muted">{other?.mentorProfile?.title || other?.department}</div>
            </div>
          </div>
          <Button to={`${base}/messages?with=${other?._id}`} variant="outline" size="sm" block>
            <MessageSquare aria-hidden="true" /> Send a message
          </Button>
          {session.request?.goals && (
            <>
              <h3 style={{ fontSize: '0.9rem', marginTop: 20 }}>Mentorship goals</h3>
              <p className="small" style={{ margin: 0 }}>{session.request.goals}</p>
            </>
          )}
        </aside>
      </div>

      <SessionFormModal open={editing} onClose={() => setEditing(false)} session={session} viewerRole={user.role} onSaved={() => reload({ silent: true })} />

      <Modal open={Boolean(confirm)} onClose={() => !busy && setConfirm(null)} title={confirm === 'cancel' ? 'Cancel this session?' : 'Mark session as completed?'}>
        <p>
          {confirm === 'cancel'
            ? `${other?.name} will see that the session was cancelled. This cannot be undone.`
            : 'Completed sessions are counted on both dashboards and can no longer be edited.'}
        </p>
        <div className="form-actions">
          <Button variant="ghost" onClick={() => setConfirm(null)} disabled={busy}>Go back</Button>
          <Button variant={confirm === 'cancel' ? 'danger' : 'primary'} onClick={runConfirmed} loading={busy}>
            {confirm === 'cancel' ? 'Cancel session' : 'Mark completed'}
          </Button>
        </div>
      </Modal>
    </>
  );
}
