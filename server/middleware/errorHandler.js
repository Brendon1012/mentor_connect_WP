import mongoose from 'mongoose';

export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Central place that turns any error into a safe JSON response.
// Stack traces are logged on the server only, never sent to the client.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let message = err.isOperational ? err.message : 'Something went wrong. Please try again later.';
  let errors = err.errors && err.isOperational ? err.errors : undefined;

  if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    // Duplicate key from a unique index
    status = 409;
    message = err.keyPattern?.email ? 'An account with this email already exists' : 'Duplicate record';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON in request body';
  } else if (
    err.name === 'MongooseServerSelectionError' ||
    err.name === 'MongoNotConnectedError' ||
    /buffering timed out/i.test(err.message || '')
  ) {
    status = 503;
    message = 'The database is temporarily unavailable. Please try again shortly.';
  }

  if (status >= 500) console.error('[error]', err);

  const body = { success: false, message };
  if (errors) body.errors = errors;
  res.status(status).json(body);
}
