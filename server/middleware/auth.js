import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { COOKIE_NAME, verifyToken, clearAuthCookie } from '../utils/token.js';

async function userFromRequest(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  const payload = verifyToken(token); // throws if expired or tampered
  return User.findById(payload.id);
}

// Requires a valid login. The user is always loaded fresh from the database using
// the ID inside the signed token, never from anything the client sends in the body.
export async function protect(req, res, next) {
  try {
    const user = await userFromRequest(req);
    if (!user) throw new AppError(401, 'Please log in to continue');
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      clearAuthCookie(res);
      return next(new AppError(401, 'Your session has expired. Please log in again.'));
    }
    next(err);
  }
}

// Like protect, but lets anonymous visitors through (used for public pages that
// behave slightly differently for logged-in users).
export async function optionalAuth(req, res, next) {
  try {
    req.user = (await userFromRequest(req)) || null;
  } catch {
    req.user = null;
  }
  next();
}

// Role-based access control. Must run after protect.
export const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
