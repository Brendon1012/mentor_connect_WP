import { Link } from 'react-router-dom';

/*
 * <Button variant="primary|cta|outline|ghost|danger|light" size="sm|lg" loading to="/path">
 * When `to` is given it renders a router Link styled as a button.
 * While `loading`, it is disabled and shows a spinner, which prevents double submits.
 */
export default function Button({
  variant = 'primary',
  size,
  block,
  loading = false,
  disabled,
  to,
  href,
  className = '',
  children,
  type = 'button',
  ...rest
}) {
  const classes = ['btn', `btn-${variant}`, size && `btn-${size}`, block && 'btn-block', className]
    .filter(Boolean)
    .join(' ');

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <span className="spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
