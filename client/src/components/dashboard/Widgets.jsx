import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar.jsx';
import { ProgressBar, Skeleton } from '../ui/Misc.jsx';
import './Dashboard.css';

// Human-readable names for the profile-completion fields reported by the server.
const FIELD_LABELS = {
  name: 'name', college: 'college', department: 'department', avatarUrl: 'profile photo',
  yearOfStudy: 'year of study', skills: 'skills', careerInterests: 'career interests', learningGoals: 'learning goals',
  title: 'professional title', bio: 'bio', expertise: 'expertise', yearsOfExperience: 'years of experience',
  education: 'education', workExperience: 'work experience', availability: 'available days',
  categories: 'categories', mentoringApproach: 'mentoring approach',
};

export function WelcomeCard({ name, completion, profilePath, subtitle }) {
  const percent = completion?.percent ?? 0;
  const missing = (completion?.missing || []).map((f) => FIELD_LABELS[f] || f);
  return (
    <section className="card welcome" aria-label="Welcome">
      <div>
        <h1>Welcome back, {name.split(' ')[0]}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="completion">
        <div className="row-between">
          <span>Profile completion</span>
          <strong>{percent}%</strong>
        </div>
        <ProgressBar value={percent} label="Profile completion" />
        {missing.length > 0 ? (
          <p className="small" style={{ margin: '8px 0 0' }}>
            Missing: {missing.slice(0, 3).join(', ')}
            {missing.length > 3 ? ` +${missing.length - 3} more` : ''}. <Link to={profilePath}>Complete profile</Link>
          </p>
        ) : (
          <p className="small" style={{ margin: '8px 0 0' }}>Your profile is complete.</p>
        )}
      </div>
    </section>
  );
}

export function MiniMentor({ mentor, note, action }) {
  return (
    <div className="mini-mentor">
      <Avatar name={mentor.name} src={mentor.avatarUrl} size={40} />
      <div className="mini-mentor-main">
        <Link to={`/mentors/${mentor._id}`}>{mentor.name}</Link>
        <p>{mentor.mentorProfile?.title || mentor.department}</p>
        {note && <span className="match-note">{note}</span>}
      </div>
      {action}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard">
      <Skeleton height={120} style={{ borderRadius: 12, marginBottom: 20 }} />
      <div className="stat-row">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} height={78} style={{ borderRadius: 12 }} />)}
      </div>
      <div className="dash-grid">
        <Skeleton height={280} style={{ borderRadius: 12 }} />
        <Skeleton height={280} style={{ borderRadius: 12 }} />
      </div>
    </div>
  );
}
