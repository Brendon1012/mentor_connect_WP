import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export const COOKIE_NAME = 'token';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// httpOnly: JavaScript in the page cannot read the token, so an XSS bug cannot steal it.
// sameSite=lax: the cookie is not sent on cross-site POSTs, which blocks basic CSRF.
// secure in production: only sent over HTTPS.
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.isProd,
  path: '/',
};

export function signToken(userId) {
  return jwt.sign({ id: userId.toString() }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export function setAuthCookie(res, userId) {
  res.cookie(COOKIE_NAME, signToken(userId), { ...cookieOptions, maxAge: SEVEN_DAYS_MS });
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, cookieOptions);
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}
