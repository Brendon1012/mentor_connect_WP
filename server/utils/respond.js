// Every response uses the same shape: { success, message?, data?, errors? }
export function ok(res, data, message, status = 200) {
  const body = { success: true };
  if (message) body.message = message;
  if (data !== undefined) body.data = data;
  return res.status(status).json(body);
}

export function created(res, data, message) {
  return ok(res, data, message, 201);
}

// Wraps async route handlers so rejected promises reach the error handler.
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
