import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Award, Briefcase, CalendarDays, CheckCircle2, Clock, GraduationCap, Hourglass,
  MessageSquare, MessageSquareQuote, Users,
} from 'lucide-react';
import Avatar from '../../components/ui/Avatar.jsx';
import Badge, { DemoBadge } from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { Skeleton, Stars } from '../../components/ui/Misc.jsx';
import { ErrorState, EmptyState } from '../../components/ui/States.jsx';
import RequestMentorshipModal from '../../components/mentors/RequestMentorshipModal.jsx';
import useFetch from '../../hooks/useFetch.js';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { mentorService } from '../../services/resources.js';
import { formatDate, pluralize } from '../../utils/formatters.js';
import { WEEK_DAYS } from '../../utils/constants.js';
import './MentorProfile.css';

function RequestPanel({ mentor, viewer, onOpen }) {
  const { user } = useAuth();
  const location = useLocation();
  const accepting = mentor.mentorProfile?.availability?.isAcceptingStudents !== false;
  const active = viewer?.activeRequest;

  if (user?.role === 'mentor') {
    return <p className="small muted">You are logged in as a mentor. Only students can send mentorship requests.</p>;
  }
  if (active?.status === 'pending') {
    return (
      <>
        <div className="alert alert-warning"><Hourglass aria-hidden="true" /><span>Your request is waiting for {mentor.name.split(' ')[0]}'s response.</span></div>
        <Button to="/student/mentorships" variant="outline" block>View my requests</Button>
      </>
    );
  }
  if (active?.status === 'accepted') {
    return (
      <>
        <div className="alert alert-success"><CheckCircle2 aria-hidden="true" /><span>You are connected with this mentor.</span></div>
        <Button to={`/student/messages?with=${mentor._id}`} variant="primary" block>
          <MessageSquare aria-hidden="true" /> Message mentor
        </Button>
      </>
    );
  }
  if (!accepting) {
    return (
      <>
        <Button variant="cta" block disabled>Request Mentorship</Button>
        <p className="small muted">This mentor is not accepting new students right now. Please check back later.</p>
      </>
    );
  }
  if (!user) {
    // After logging in or registering, the user comes back here and the form opens.
    const from = `${location.pathname}?request=1`;
    return (
      <>
        <Button to="/login" state={{ from }} variant="cta" block>
          Log in to request mentorship
        </Button>
        <p className="small muted" style={{ margin: 0 }}>
          New here? <Link to="/register" state={{ from }}>Create a free account</Link>
        </p>
      </>
    );
  }
  return (
    <Button variant="cta" block onClick={onOpen}>
      Request Mentorship
    </Button>
  );
}

function ProfileSkeleton() {
  return (
    <div className="container section" aria-busy="true">
      <div className="card profile-hero">
        <Skeleton circle width={96} height={96} />
        <div style={{ flex: 1 }}>
          <Skeleton width="40%" height={24} style={{ marginBottom: 12 }} />
          <Skeleton width="60%" style={{ marginBottom: 8 }} />
          <Skeleton width="30%" />
        </div>
      </div>
      <div className="profile-grid" style={{ marginTop: 24 }}>
        <div className="card"><Skeleton className="skeleton-line" /><Skeleton className="skeleton-line" width="80%" /><Skeleton className="skeleton-line" width="60%" /></div>
        <div className="card"><Skeleton height={44} /></div>
      </div>
    </div>
  );
}

export default function MentorProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const { data, loading, error, reload } = useFetch(() => mentorService.get(id), [id, user?._id]);
  useDocumentTitle(data?.mentor?.name || 'Mentor profile');

  // Coming from a "Request Mentorship" button (or back from login): open the form automatically.
  useEffect(() => {
    if (!data || params.get('request') !== '1') return;
    const accepting = data.mentor.mentorProfile?.availability?.isAcceptingStudents !== false;
    if (user?.role === 'student' && !data.viewer?.activeRequest && accepting) setModalOpen(true);
    setParams({}, { replace: true });
  }, [data, params, setParams, user]);

  if (loading) return <ProfileSkeleton />;
  if (error) {
    return (
      <div className="container section">
        <ErrorState message={error} onRetry={reload} />
        <p className="text-center" style={{ marginTop: 16 }}><Link to="/mentors">Back to all mentors</Link></p>
      </div>
    );
  }

  const { mentor, reviews, averageRating, stats, viewer } = data;
  const p = mentor.mentorProfile || {};
  const accepting = p.availability?.isAcceptingStudents !== false;

  return (
    <div className="container section" style={{ paddingTop: 32 }}>
      <button type="button" className="btn btn-ghost btn-sm back-link" onClick={() => navigate(-1)}>
        <ArrowLeft aria-hidden="true" /> Back
      </button>

      <section className="card profile-hero" aria-labelledby="mentor-name">
        <Avatar name={mentor.name} src={mentor.avatarUrl} size={96} />
        <div className="profile-hero-main">
          <div className="row" style={{ gap: 8 }}>
            <h1 id="mentor-name">{mentor.name}</h1>
            {mentor.isSample && <DemoBadge />}
          </div>
          {p.title && <p className="profile-title">{p.title}</p>}
          <p className="muted">{[mentor.department, mentor.college].filter(Boolean).join(' · ')}</p>
          <div className="profile-facts">
            <span><Briefcase aria-hidden="true" /> {pluralize(p.yearsOfExperience || 0, 'year')} experience</span>
            <span><Users aria-hidden="true" /> {pluralize(stats.studentsMentored, 'student')} mentored</span>
            {averageRating && (
              <span><Stars rating={averageRating} /> {averageRating} ({pluralize(reviews.length, 'review')})</span>
            )}
            <Badge tone={accepting ? 'success' : 'warning'}>{accepting ? 'Accepting students' : 'Not accepting now'}</Badge>
          </div>
        </div>
      </section>

      <div className="profile-grid">
        <div className="stack">
          <section className="card" aria-labelledby="about-h">
            <h2 id="about-h" className="profile-h">About</h2>
            {p.bio ? <p className="prewrap">{p.bio}</p> : <p className="muted">This mentor has not written an introduction yet.</p>}
          </section>

          <section className="card" aria-labelledby="skills-h">
            <h2 id="skills-h" className="profile-h">Skills & expertise</h2>
            {p.skills?.length ? (
              <ul className="tag-list">{p.skills.map((s) => <li key={s} className="tag">{s}</li>)}</ul>
            ) : (
              <p className="muted">No skills listed yet.</p>
            )}
            {p.expertise?.length > 0 && (
              <>
                <h3 className="profile-sub">Areas of expertise</h3>
                <ul className="bullet-list">{p.expertise.map((e) => <li key={e}>{e}</li>)}</ul>
              </>
            )}
          </section>

          <section className="card" aria-labelledby="exp-h">
            <h2 id="exp-h" className="profile-h">Experience</h2>
            {p.workExperience?.length ? (
              <ul className="timeline">
                {p.workExperience.map((w, i) => (
                  <li key={i}>
                    <strong>{w.role}</strong> <span className="muted">at {w.organization}</span>
                    {w.period && <div className="small muted">{w.period}</div>}
                    {w.description && <p className="small" style={{ margin: '4px 0 0' }}>{w.description}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No work or project experience listed yet.</p>
            )}
          </section>

          <section className="card" aria-labelledby="edu-h">
            <h2 id="edu-h" className="profile-h">Education</h2>
            {p.education?.length ? (
              <ul className="timeline">
                {p.education.map((e, i) => (
                  <li key={i}>
                    <strong>{e.degree}</strong>
                    <div className="small muted">{[e.institution, e.year].filter(Boolean).join(' · ')}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No education details listed yet.</p>
            )}
          </section>

          <section className="card" aria-labelledby="approach-h">
            <h2 id="approach-h" className="profile-h">Mentoring approach</h2>
            {p.mentoringApproach ? <p className="prewrap">{p.mentoringApproach}</p> : <p className="muted">Not described yet.</p>}
          </section>

          <section className="card" aria-labelledby="fb-h">
            <h2 id="fb-h" className="profile-h">Feedback from students</h2>
            {reviews.length === 0 ? (
              <EmptyState compact icon={MessageSquareQuote} title="No feedback yet." message="Reviews appear here after students complete a mentorship." />
            ) : (
              <ul className="list">
                {reviews.map((r) => (
                  <li key={r._id} className="review">
                    <div className="row-between">
                      <strong>{r.studentName}</strong>
                      <Stars rating={r.rating} />
                    </div>
                    {r.comment && <p style={{ margin: '6px 0' }}>{r.comment}</p>}
                    <span className="small muted">{r.category} · {formatDate(r.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="stack profile-aside">
          <section className="card" aria-labelledby="req-h">
            <h2 id="req-h" className="profile-h">Mentorship</h2>
            <div className="stack">
              <RequestPanel mentor={mentor} viewer={viewer} onOpen={() => setModalOpen(true)} />
            </div>
          </section>

          <section className="card" aria-labelledby="avail-h">
            <h2 id="avail-h" className="profile-h"><CalendarDays aria-hidden="true" /> Availability</h2>
            <div className="day-row" aria-label="Available days">
              {WEEK_DAYS.map((d) => {
                const on = p.availability?.days?.includes(d);
                return (
                  <span key={d} className={`day ${on ? 'on' : ''}`} aria-label={`${d}: ${on ? 'available' : 'not available'}`}>
                    {d}
                  </span>
                );
              })}
            </div>
            {p.availability?.timeNotes && (
              <p className="small" style={{ marginTop: 12, marginBottom: 0 }}>
                <Clock size={14} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px' }} /> {p.availability.timeNotes}
              </p>
            )}
          </section>

          <section className="card" aria-labelledby="cat-h">
            <h2 id="cat-h" className="profile-h"><Award aria-hidden="true" /> Categories</h2>
            {p.categories?.length ? (
              <ul className="tag-list">
                {p.categories.map((c) => (
                  <li key={c}><Link className="tag" to={`/mentors?category=${encodeURIComponent(c)}`}>{c}</Link></li>
                ))}
              </ul>
            ) : (
              <p className="muted small">No categories selected.</p>
            )}
          </section>

          {mentor.isSample && (
            <p className="demo-note">
              <GraduationCap size={14} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px' }} /> This is a fictional demo
              profile created by the seed script.
            </p>
          )}
        </aside>
      </div>

      {user?.role === 'student' && (
        <RequestMentorshipModal
          mentor={mentor}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => reload({ silent: true })}
        />
      )}
    </div>
  );
}
