import { Link } from 'react-router-dom';

export default function Logo({ light = false, to = '/' }) {
  return (
    <Link to={to} className={`logo ${light ? 'logo-light' : ''}`} aria-label="MentorConnect home">
      <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill={light ? '#ffffff' : '#0B1F3A'} />
        <path d="M16 8 5 13l11 5 11-5-11-5Z" fill="#D4A017" />
        <path d="M9 15.5V20c0 1.7 3.1 3.5 7 3.5s7-1.8 7-3.5v-4.5L16 19l-7-3.5Z" fill={light ? '#0B1F3A' : '#E8F1FB'} />
      </svg>
      <span>
        Mentor<strong>Connect</strong>
      </span>
    </Link>
  );
}
