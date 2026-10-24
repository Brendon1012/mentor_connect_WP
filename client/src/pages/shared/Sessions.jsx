import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarClock, CalendarPlus, History } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { requestService, sessionService } from '../../services/resources.js';
import { PageHeader } from '../../components/ui/Misc.jsx';
import { EmptyState, ErrorState, PageLoader } from '../../components/ui/States.jsx';
import Button from '../../components/ui/Button.jsx';
import SessionRow from '../../components/dashboard/SessionRow.jsx';
import SessionFormModal from '../../components/forms/SessionFormModal.jsx';

export default function Sessions() {
  const { user } = useAuth();
  useDocumentTitle(user.role === 'mentor' ? 'Sessions' : 'My sessions');
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState('upcoming');
  const [creating, setCreating] = useState(false);
  const sessions = useFetch(() => sessionService.mine(), []);
  // Only accepted mentorships can have sessions.
  const accepted = useFetch(() => requestService.mine({ status: 'accepted' }), []);

  // Dashboard links use ?new=1 to open the schedule form directly.
  useEffect(() => {
    if (params.get('new') === '1') {
      setCreating(true);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const mentorships = accepted.data?.requests || [];
  const list = sessions.data?.[tab] || [];
  const canCreate = mentorships.length > 0;

  return (
    <>
      <PageHeader
        title={user.role === 'mentor' ? 'Sessions' : 'My sessions'}
        subtitle="Upcoming and past mentorship sessions."
        actions={
          <Button
            variant="primary"
            onClick={() => setCreating(true)}
            disabled={accepted.loading || !canCreate}
            title={!canCreate ? 'You need an accepted mentorship to schedule a session' : undefined}
          >
            <CalendarPlus aria-hidden="true" /> Schedule session
          </Button>
        }
      />
      {!accepted.loading && !canCreate && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <CalendarClock aria-hidden="true" />
          <span>
            {user.role === 'student'
              ? 'Sessions can be scheduled once a mentor accepts one of your requests.'
              : 'Sessions can be scheduled once you accept a student request.'}
          </span>
        </div>
      )}

      <div className="tabs" role="tablist" aria-label="Session lists">
        <button role="tab" className="tab" aria-selected={tab === 'upcoming'} onClick={() => setTab('upcoming')}>
          Upcoming {sessions.data && <span className="badge">{sessions.data.upcoming.length}</span>}
        </button>
        <button role="tab" className="tab" aria-selected={tab === 'past'} onClick={() => setTab('past')}>
          Past & cancelled {sessions.data && <span className="badge">{sessions.data.past.length}</span>}
        </button>
      </div>

      {sessions.loading ? (
        <PageLoader />
      ) : sessions.error ? (
        <ErrorState message={sessions.error} onRetry={sessions.reload} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={tab === 'upcoming' ? CalendarClock : History}
          title={tab === 'upcoming' ? 'No upcoming sessions' : 'No past sessions yet'}
          message={tab === 'upcoming' ? 'Schedule a session to start working together.' : 'Completed and cancelled sessions will appear here.'}
          action={
            canCreate ? (
              <Button variant="primary" size="sm" onClick={() => setCreating(true)}>Schedule a session</Button>
            ) : user.role === 'student' ? (
              <Button to="/mentors" variant="primary" size="sm">Find a mentor</Button>
            ) : (
              <Button to="/mentor/requests" variant="primary" size="sm">Review requests</Button>
            )
          }
        />
      ) : (
        <ul className="list" role="tabpanel">
          {list.map((s) => <SessionRow key={s._id} session={s} past={tab === 'past'} />)}
        </ul>
      )}

      <SessionFormModal
        open={creating}
        onClose={() => setCreating(false)}
        mentorships={mentorships}
        viewerRole={user.role}
        onSaved={() => {
          setTab('upcoming');
          sessions.reload({ silent: true });
        }}
      />
    </>
  );
}
