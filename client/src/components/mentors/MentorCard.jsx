import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Building2 } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import Badge, { DemoBadge } from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import { TagList, Skeleton } from '../ui/Misc.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { pluralize } from '../../utils/formatters.js';
import './Mentors.css';

export default function MentorCard({ mentor }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const p = mentor.mentorProfile || {};
  const accepting = p.availability?.isAcceptingStudents !== false;
  const profileUrl = `/mentors/${mentor._id}`;

  // The profile page opens the request form when it sees ?request=1.
  // Visitors who are not logged in go to login first and come back afterwards.
  function handleRequest() {
    const target = `${profileUrl}?request=1`;
    if (!user) navigate('/login', { state: { from: target } });
    else navigate(target);
  }

  return (
    <article className="card card-hover mentor-card">
      <div className="mentor-card-head">
        <Avatar name={mentor.name} src={mentor.avatarUrl} size={56} />
        <div>
          <h3 className="mentor-card-name">
            <Link to={profileUrl}>{mentor.name}</Link>
          </h3>
          {p.title && <p className="mentor-card-title">{p.title}</p>}
          {mentor.department && <p className="mentor-card-dept">{mentor.department}</p>}
        </div>
      </div>

      <div className="mentor-card-badges">
        <Badge tone={accepting ? 'success' : 'warning'}>{accepting ? 'Accepting students' : 'Not accepting now'}</Badge>
        {mentor.isSample && <DemoBadge />}
      </div>

      {p.bio && <p className="mentor-card-bio">{p.bio}</p>}

      <TagList items={p.skills} max={4} />

      <div className="mentor-card-meta">
        <span>
          <Briefcase aria-hidden="true" /> {pluralize(p.yearsOfExperience || 0, 'year')} experience
        </span>
        {p.categories?.length > 0 && (
          <span>
            <Building2 aria-hidden="true" /> {p.categories.slice(0, 2).join(', ')}
            {p.categories.length > 2 ? ` +${p.categories.length - 2}` : ''}
          </span>
        )}
      </div>

      <div className="mentor-card-actions">
        <Button to={profileUrl} variant="outline" size="sm" aria-label={`View ${mentor.name}'s profile`}>
          View Profile
        </Button>
        {user?.role !== 'mentor' && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleRequest}
            disabled={!accepting}
            title={!accepting ? 'This mentor is not accepting new students right now' : undefined}
            aria-label={`Request mentorship from ${mentor.name}`}
          >
            Request Mentorship
          </Button>
        )}
      </div>
    </article>
  );
}

export function MentorCardSkeleton() {
  return (
    <div className="card mentor-card" aria-hidden="true">
      <div className="mentor-card-head">
        <Skeleton circle width={56} height={56} />
        <div style={{ flex: 1 }}>
          <Skeleton width="70%" height={16} style={{ marginBottom: 8 }} />
          <Skeleton width="50%" />
        </div>
      </div>
      <Skeleton width="40%" height={20} />
      <div>
        <Skeleton className="skeleton-line" />
        <Skeleton className="skeleton-line" width="90%" />
        <Skeleton className="skeleton-line" width="60%" />
      </div>
      <Skeleton height={36} />
    </div>
  );
}
