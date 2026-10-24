// Escapes user text before putting it in a RegExp, so "C++" or ".*" are searched literally.
export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function pageParams(query, { defaultLimit = 9, maxLimit = 50 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

// Fields of a mentor that anyone may see. Email and password hash are never included.
export const PUBLIC_MENTOR_FIELDS = 'name college department avatarUrl mentorProfile isSample createdAt';
export const PUBLIC_USER_FIELDS = 'name role college department avatarUrl mentorProfile.title studentProfile.yearOfStudy';
