import { Activity, CalendarClock, CheckCircle2, Inbox, Pencil, Star, Users } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { dashboardService, requestService } from '../../services/resources.js';
import { getErrorMessage } from '../../services/api.js';
import { StatCard, Stars, TagList } from '../../components/ui/Misc.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { EmptyState, ErrorState } from '../../components/ui/States.jsx';
import Button from '../../components/ui/Button.jsx';
import RequestCard from '../../components/dashboard/RequestCard.jsx';
import SessionRow from '../../components/dashboard/SessionRow.jsx';
import RespondModal from '../../components/forms/RespondModal.jsx';
import { WelcomeCard, DashboardSkeleton } from '../../components/dashboard/Widgets.jsx';
import { timeAgo, pluralize } from '../../utils/formatters.js';

export default function MentorDashboard() {
  useDocumentTitle('Mentor dashboard');
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(() => dashboardService.mentor(), []);
  const [responding, setResponding] = useState(null); // { request, action }

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { counts, profileCompletion, pendingRequests, acceptedRequests, upcomingSessions, recentActivity, rating } = data;
  const p = user.mentorProfile || {};
  const accepting = p.availability?.isAcceptingStudents !== false;

  async function respond(note) {
    const { request, action } = responding;
    try {
      await (action === 'accept' ? requestService.accept(request._id, note) : requestService.reject(request._id, note));
      toast.success(action === 'accept' ? 'Request accepted' : 'Request declined');
      reload({ silent: true });
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }

  return (
    <>
      <WelcomeCard
        name={user.name}
        completion={profileCompletion}
        profilePath="/mentor/profile"
        subtitle={`You have ${pluralize(counts.pending, 'request')} waiting for a response.`}
      />

      <div className="stat-row">
        <StatCard icon={Inbox} label="Pending requests" value={counts.pending} />
        <StatCard icon={Users} label="Students mentored" value={counts.studentsMentored} />
        <StatCard icon={CalendarClock} label="Upcoming sessions" value={counts.upcomingSessions} />
        <StatCard icon={CheckCircle2} label="Completed sessions" value={counts.completedSessions} />
      </div>

      <div className="dash-grid">
        <div className="stack">
          <section className="card" aria-labelledby="pend-h">
            <div className="card-title">
              <h2 id="pend-h">Pending requests</h2>
              <Button to="/mentor/requests" variant="ghost" size="sm">View all</Button>
            </div>
            {pendingRequests.length === 0 ? (
              <EmptyState
                compact
                icon={Inbox}
                title="No pending requests"
                message={accepting ? 'New requests from students will appear here.' : 'You are not accepting new students. Turn it on in Availability.'}
                action={<Button to={accepting ? '/mentor/profile' : '/mentor/availability'} variant="outline" size="sm">{accepting ? 'Improve your profile' : 'Open availability'}</Button>}
              />
            ) : (
              <div className="grid">
                {pendingRequests.slice(0, 3).map((r) => (
                  <RequestCard
                    key={r._id}
                    request={r}
                    viewerRole="mentor"
                    actions={
                      <>
                        <Button size="sm" variant="primary" onClick={() => setResponding({ request: r, action: 'accept' })}>Accept</Button>
                        <Button size="sm" variant="danger" onClick={() => setResponding({ request: r, action: 'reject' })}>Decline</Button>
                      </>
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <section className="card" aria-labelledby="up-h">
            <div className="card-title">
              <h2 id="up-h">Upcoming sessions</h2>
              <Button to="/mentor/sessions" variant="ghost" size="sm">View all</Button>
            </div>
            {upcomingSessions.length === 0 ? (
              <EmptyState
                compact
                icon={CalendarClock}
                title="No upcoming sessions"
                message={acceptedRequests.length ? 'Schedule a session with one of your students.' : 'Accept a request to start scheduling sessions.'}
                action={acceptedRequests.length ? <Button to="/mentor/sessions?new=1" variant="primary" size="sm">Schedule a session</Button> : null}
              />
            ) : (
              <ul className="list">{upcomingSessions.map((s) => <SessionRow key={s._id} session={s} />)}</ul>
            )}
          </section>

          <section className="card" aria-labelledby="acc-h">
            <div className="card-title">
              <h2 id="acc-h">Current students</h2>
              <Button to="/mentor/students" variant="ghost" size="sm">Manage</Button>
            </div>
            {acceptedRequests.length === 0 ? (
              <EmptyState compact icon={Users} title="No active students" message="Students you accept will appear here." />
            ) : (
              <div className="grid">
                {acceptedRequests.map((r) => <RequestCard key={r._id} request={r} viewerRole="mentor" compact />)}
              </div>
            )}
          </section>
        </div>

        <div className="stack">
          <section className="card" aria-labelledby="po-h">
            <div className="card-title">
              <h2 id="po-h">Profile overview</h2>
              <Button to="/mentor/profile" variant="outline" size="sm"><Pencil aria-hidden="true" /> Edit Profile</Button>
            </div>
            <p style={{ margin: '0 0 8px', fontWeight: 600, color: 'var(--navy)' }}>{p.title || 'Add a professional title'}</p>
            <div className="row" style={{ marginBottom: 12 }}>
              <Badge tone={accepting ? 'success' : 'warning'}>{accepting ? 'Accepting students' : 'Not accepting'}</Badge>
              {rating ? (
                <span className="small"><Stars rating={rating.average} /> {rating.average} ({pluralize(rating.count, 'review')})</span>
              ) : (
                <span className="small muted"><Star size={14} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px' }} /> No reviews yet</span>
              )}
            </div>
            {p.skills?.length ? <TagList items={p.skills} max={6} /> : <p className="small muted">No skills listed yet.</p>}
            <div className="row" style={{ marginTop: 16 }}>
              <Button to={`/mentors/${user._id}`} variant="ghost" size="sm">View public profile</Button>
            </div>
          </section>

          <section className="card" aria-labelledby="act-h">
            <div className="card-title">
              <h2 id="act-h"><Activity size={18} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-3px' }} /> Recent activity</h2>
            </div>
            {recentActivity.length === 0 ? (
              <EmptyState compact title="No activity yet" message="Requests and sessions will show up here." />
            ) : (
              <ul className="activity">
                {recentActivity.map((a) => (
                  <li key={`${a.type}-${a.id}`}>
                    <span className={`activity-dot ${a.type}`} aria-hidden="true" />
                    <span>
                      {a.text}
                      <br />
                      <span className="small muted">{timeAgo(a.at)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

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
