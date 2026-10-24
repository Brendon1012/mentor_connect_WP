// Client-side checks give instant feedback. The server validates everything again.

export const isEmail = (v) => /^\S+@\S+\.\S+$/.test(String(v || '').trim());

export const PASSWORD_HINT = 'At least 8 characters with an uppercase letter, a lowercase letter and a number.';

export const isStrongPassword = (v) => typeof v === 'string' && v.length >= 8 && /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v);

export const isHttpUrl = (v) => /^https?:\/\/\S+$/i.test(String(v || '').trim());

export function required(value, label) {
  if (Array.isArray(value) ? value.length === 0 : !String(value ?? '').trim()) return `${label} is required`;
  return '';
}

export function lengthBetween(value, label, min, max) {
  const len = String(value || '').trim().length;
  if (len < min) return `${label} must be at least ${min} characters`;
  if (len > max) return `${label} must be at most ${max} characters`;
  return '';
}

// Only allow internal paths for "return to" redirects (blocks //evil.com and backslash tricks).
export function safeRedirectPath(path) {
  if (typeof path !== 'string') return null;
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return null;
  return path;
}

// Removes empty-string keys so the error object can be checked with Object.keys().length
export const compactErrors = (errors) =>
  Object.fromEntries(Object.entries(errors).filter(([, v]) => Boolean(v)));
