import { useState } from 'react';
import { Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import useFetch from '../../hooks/useFetch.js';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { requestService } from '../../services/resources.js';
import { getErrorMessage } from '../../services/api.js';
import { PageHeader } from '../../components/ui/Misc.jsx';
import { EmptyState, ErrorState, PageLoader } from '../../components/ui/States.jsx';
import Button from '../../components/ui/Button.jsx';
import RequestCard from '../../components/dashboard/RequestCard.jsx';
import RespondModal from '../../components/forms/RespondModal.jsx';

const TABS = [
  ['pending', 'Pending'],
  ['accepted', 'Accepted'],
  ['completed', 'Completed'],
  ['rejected', 'Declined'],
  ['all', 'All'],
];

export default function MentorRequests() {
  useDocumentTitle('Student requests');
  const [tab, setTab] = useState('pending');
  const [responding, setResponding] = useState(null);
  const { data, loading, error, reload } = useFetch(() => requestService.mine(), []);

  const requests = data?.requests || [];
  const count = (s) => (s === 'all' ? requests.length : requests.filter((r) => r.status === s).length);
  const shown = tab === 'all' ? requests : requests.filter((r) => r.status === tab);

  async function respond(note) {
    const { request, action } = responding;
    try {
      await (action === 'accept' ? requestService.accept(request._id, note) : requestService.reject(request._id, note));
      toast.success(action === 'accept' ? `You are now mentoring ${request.student?.name}` : 'Request declined');
      reload({ silent: true });
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }

  return (
    <>
      <PageHeader title="Student requests" subtitle="Review each request and accept or decline it." />
      <div className="tabs" role="tablist" aria-label="Filter by status">
        {TABS.map(([key, label]) => (
          <button key={key} role="tab" className="tab" aria-selected={tab === key} onClick={() => setTab(key)}>
            {label}
            {!loading && <span className={`badge ${key === 'pending' && count(key) ? 'badge-warning' : ''}`}>{count(key)}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={tab === 'pending' ? 'No requests waiting' : 'Nothing here yet'}
          message="A complete profile with clear skills and availability helps students find you."
          action={<Button to="/mentor/profile" variant="primary" size="sm">Edit profile</Button>}
        />
      ) : (
        <div className="grid" role="tabpanel">
          {shown.map((r) => (
            <RequestCard
              key={r._id}
              request={r}
              viewerRole="mentor"
              actions={
                r.status === 'pending' ? (
                  <>
                    <Button size="sm" variant="primary" onClick={() => setResponding({ request: r, action: 'accept' })}>Accept</Button>
                    <Button size="sm" variant="danger" onClick={() => setResponding({ request: r, action: 'reject' })}>Decline</Button>
                  </>
                ) : r.status === 'accepted' ? (
                  <Button size="sm" variant="outline" to="/mentor/students">Manage in My Students</Button>
                ) : null
              }
            />
          ))}
        </div>
      )}

      <RespondModal
        open={Boolean(responding)}
        onClose={() => setResponding(null)}
        action={responding?.action}
        studentName={responding?.request.student?.name || 'student'}
        onConfirm={respond}
      />
    </>
  );
}
