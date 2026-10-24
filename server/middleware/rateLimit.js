import rateLimit from 'express-rate-limit';

const handler = (req, res, next, options) =>
  res.status(429).json({ success: false, message: options.message });

// Login/register: 10 failed attempts per 15 minutes per IP slows down password guessing.
// Successful attempts are not counted so normal users are never locked out.
// AUTH_RATE_LIMIT_MAX can raise the limit temporarily for automated testing.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many attempts. Please wait 15 minutes and try again.',
  handler,
});

// Contact form: stops spam floods.
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many messages sent. Please try again in an hour.',
  handler,
});
