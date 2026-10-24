import { useState } from 'react';
import { CalendarPlus, CheckCheck, MessageSquare, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import useFetch from '../../hooks/useFetch.js';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { requestService } from '../../services/resources.js';
import { getErrorMessage } from '../../services/api.js';
import { PageHeader } from '../../components/ui/Misc.jsx';
import { EmptyState, ErrorState, PageLoader } from '../../components/ui/States.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import RequestCard from '../../components/dashboard/RequestCard.jsx';
import SessionFormModal from '../../components/forms/SessionFormModal.jsx';

export default function MentorStudents() {
  useDocumentTitle('My students');
  const { data, loading, error, reload } = useFetch(() => requestService.mine(), []);
  const [sessionFor, setSessionFor] = useState(null);
  const [completing, setCompleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const requests = data?.requests || [];
  const active = requests.filter((r) => r.status === 'accepted');
  const past = requests.filter((r) => r.status === 'completed');

  async function confirmComplete() {
    setBusy(true);
    try {
      await requestService.complete(completing._id);
      toast.success('Mentorship marked as completed');
      setCompleting(null);
      reload({ silent: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader title="My students" subtitle="Students you are currently mentoring and those you have mentored before." />

      <section aria-labelledby="active-h" className="stack">
        <h2 id="active-h" style={{ fontSize: '1.15rem' }}>Active ({active.length})</h2>
        {active.length === 0 ? (
          <EmptyState icon={Users} title="No active students" message="Accept a student request to start mentoring." action={<Button to="/mentor/requests" variant="primary" size="sm">Review requests</Button>} />
        ) : (
          <div className="grid-2">
            {active.map((r) => (
              <RequestCard
                key={r._id}
                request={r}
                viewerRole="mentor"
                actions={
                  <>
                    <Button size="sm" variant="primary" onClick={() => setSessionFor(r)}><CalendarPlus aria-hidden="true" /> Schedule</Button>
                    <Button size="sm" variant="outline" to={`/mentor/messages?with=${r.student?._id}`}><MessageSquare aria-hidden="true" /> Message</Button>
                    <Button size="sm" variant="ghost" onClick={() => setCompleting(r)}><CheckCheck aria-hidden="true" /> Mark completed</Button>
                  </>
                }
              />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="past-h" className="stack" style={{ marginTop: 32 }}>
        <h2 id="past-h" style={{ fontSize: '1.15rem' }}>Completed ({past.length})</h2>
        {past.length === 0 ? (
          <EmptyState compact title="No completed mentorships yet" message="When a mentorship reaches its goals, mark it completed so the student can leave feedback." />
        ) : (
          <div className="grid-2">
            {past.map((r) => (
              <RequestCard
                key={r._id}
                request={r}
                viewerRole="mentor"
                compact
                actions={<Button size="sm" variant="ghost" to={`/mentor/messages?with=${r.student?._id}`}>Message</Button>}
              />
            ))}
          </div>
        )}
      </section>

      <SessionFormModal open={Boolean(sessionFor)} onClose={() => setSessionFor(null)} requestId={sessionFor?._id} viewerRole="mentor" />

      <Modal open={Boolean(completing)} onClose={() => !busy && setCompleting(null)} title="Mark mentorship as completed?">
        <p>
          This ends your mentorship with <strong>{completing?.student?.name}</strong>. Any future scheduled sessions will be
          cancelled, and the student will be able to leave feedback. You can still exchange messages.
        </p>
        <div className="form-actions">
          <Button variant="ghost" onClick={() => setCompleting(null)} disabled={busy}>Keep active</Button>
          <Button variant="primary" onClick={confirmComplete} loading={busy}>Mark completed</Button>
        </div>
      </Modal>
    </>
  );
}
