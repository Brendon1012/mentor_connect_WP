export function initials(name = '') {
  const parts = name
    .replace(/^(dr|prof|mr|ms|mrs)\.?\s+/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '?';
  return ((parts[0][0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});
const timeFmt = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' });

export const formatDate = (d) => (d ? dateFmt.format(new Date(d)) : '');
export const formatDateTime = (d) => (d ? dateTimeFmt.format(new Date(d)) : '');
export const formatTime = (d) => (d ? timeFmt.format(new Date(d)) : '');

export function timeAgo(d) {
  if (!d) return '';
  const seconds = Math.round((Date.now() - new Date(d).getTime()) / 1000);
  if (seconds < 45) return 'just now';
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, secs] of units) {
    const n = Math.floor(Math.abs(seconds) / secs);
    if (n >= 1) return seconds > 0 ? `${n} ${unit}${n > 1 ? 's' : ''} ago` : `in ${n} ${unit}${n > 1 ? 's' : ''}`;
  }
  return 'just now';
}

// Value for <input type="datetime-local"> in the user's local time zone.
export function toDateTimeLocal(d) {
  const date = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const pluralize = (n, word, plural = `${word}s`) => `${n} ${n === 1 ? word : plural}`;

export const listToText = (list) => (Array.isArray(list) ? list.join(', ') : '');
export const textToList = (text) =>
  String(text || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
