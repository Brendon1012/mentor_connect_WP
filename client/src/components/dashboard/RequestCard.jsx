import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar.jsx';
import { RequestStatusBadge } from '../ui/Badge.jsx';
import { Stars } from '../ui/Misc.jsx';
import { formatDate, timeAgo } from '../../utils/formatters.js';
import './Dashboard.css';

/*
 * One mentorship request. `viewerRole` decides whose details are shown:
 * students see the mentor, mentors see the student.
 */
export default function RequestCard({ request, viewerRole, actions, compact }) {
  const other = viewerRole === 'student' ? request.mentor : request.student;
  const name = other?.name || 'Deleted user';
  const sub =
    viewerRole === 'student'
      ? other?.mentorProfile?.title || other?.department
      : [other?.department, other?.studentProfile?.yearOfStudy && `Year ${other.studentProfile.yearOfStudy}`]
          .filter(Boolean)
          .join(' · ');

  return (
    <article className="card request-card">
      <div className="request-head">
        <Avatar name={name} src={other?.avatarUrl} size={44} />
        <div className="request-head-main">
          <h3>
            {viewerRole === 'student' && other ? <Link to={`/mentors/${other._id}`}>{name}</Link> : name}
          </h3>
          <p className="request-meta">
            {sub && <>{sub} · </>}
            {request.category} · sent {timeAgo(request.createdAt)}
          </p>
        </div>
        <RequestStatusBadge status={request.status} />
      </div>

      {!compact && <p className="request-goals"><span className="sr-only">Goals: </span>{request.goals}</p>}

      {request.mentorResponse && (
        <p className="request-response">
          <strong>{viewerRole === 'student' ? 'Mentor’s note: ' : 'Your note: '}</strong>
          {request.mentorResponse}
        </p>
      )}

      {viewerRole === 'mentor' && !compact && other?.studentProfile?.skills?.length > 0 && (
        <p className="request-meta">Student skills: {other.studentProfile.skills.join(', ')}</p>
      )}

      {request.review?.rating && (
        <p className="request-response">
          <Stars rating={request.review.rating} /> {request.review.comment && <>“{request.review.comment}”</>}
        </p>
      )}

      {(request.respondedAt || request.completedAt) && !compact && (
        <p className="request-meta">
          {request.completedAt
            ? `Completed on ${formatDate(request.completedAt)}`
            : `Responded on ${formatDate(request.respondedAt)}`}
        </p>
      )}

      {actions && <div className="request-actions">{actions}</div>}
    </article>
  );
}
