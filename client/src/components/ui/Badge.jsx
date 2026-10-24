import { FlaskConical } from 'lucide-react';
import { REQUEST_STATUS, SESSION_STATUS } from '../../utils/constants.js';

export default function Badge({ tone, children, className = '', ...rest }) {
  return (
    <span className={`badge ${tone ? `badge-${tone}` : ''} ${className}`} {...rest}>
      {children}
    </span>
  );
}

export function RequestStatusBadge({ status }) {
  const s = REQUEST_STATUS[status] || { label: status, tone: undefined };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function SessionStatusBadge({ status }) {
  const s = SESSION_STATUS[status] || { label: status, tone: undefined };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function DemoBadge() {
  return (
    <Badge tone="gold" title="This is a fictional sample profile created by the seed script">
      <FlaskConical aria-hidden="true" /> Demo data
    </Badge>
  );
}
