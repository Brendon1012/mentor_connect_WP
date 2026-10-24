import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import Button from './Button.jsx';

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card stat-card">
      <div className="stat-icon" aria-hidden="true">
        <Icon />
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export function ProgressBar({ value, label }) {
  return (
    <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <span style={{ width: `${value}%` }} />
    </div>
  );
}

export function Stars({ rating, max = 5 }) {
  return (
    <span className="stars" role="img" aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <Star key={i} fill={i < Math.round(rating) ? 'currentColor' : 'none'} aria-hidden="true" />
      ))}
    </span>
  );
}

export function Skeleton({ width = '100%', height = 12, circle, style, className = '' }) {
  return (
    <span
      className={`skeleton ${circle ? 'skeleton-circle' : ''} ${className}`}
      style={{ display: 'block', width, height, ...style }}
      aria-hidden="true"
    />
  );
}

// Shows "1 2 3 ... 10" style page buttons.
export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== '...') pages.push('...');
  }
  return (
    <nav className="pagination" aria-label="Pagination">
      <Button variant="outline" size="sm" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
        <ChevronLeft aria-hidden="true" />
      </Button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`gap-${i}`} className="muted" aria-hidden="true">
            ...
          </span>
        ) : (
          <Button
            key={p}
            variant="outline"
            size="sm"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            aria-label={`Page ${p}`}
          >
            {p}
          </Button>
        )
      )}
      <Button variant="outline" size="sm" onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label="Next page">
        <ChevronRight aria-hidden="true" />
      </Button>
    </nav>
  );
}

// Shows the first few tags and "+N" for the rest.
export function TagList({ items = [], max = 4, muted }) {
  if (!items.length) return null;
  const shown = items.slice(0, max);
  const extra = items.length - shown.length;
  return (
    <ul className="tag-list">
      {shown.map((t) => (
        <li key={t} className={`tag ${muted ? 'tag-muted' : ''}`}>
          {t}
        </li>
      ))}
      {extra > 0 && (
        <li className="tag tag-muted" title={items.slice(max).join(', ')}>
          +{extra}
        </li>
      )}
    </ul>
  );
}
