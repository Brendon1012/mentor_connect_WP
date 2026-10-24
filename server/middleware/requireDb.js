import { isDbConnected } from '../config/db.js';

// Answer quickly with 503 when MongoDB is down instead of letting requests hang.
export function requireDb(req, res, next) {
  if (isDbConnected()) return next();
  res.status(503).json({
    success: false,
    message: 'The service is temporarily unavailable (database not reachable). Please try again shortly.',
  });
}
