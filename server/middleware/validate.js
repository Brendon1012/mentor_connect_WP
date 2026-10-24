import { validationResult, param } from 'express-validator';
import mongoose from 'mongoose';

// Runs after express-validator rules and returns 400 with [{ field, message }].
export function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const seen = new Set();
  const errors = [];
  for (const e of result.array()) {
    // Report only the first problem per field to keep messages readable.
    if (seen.has(e.path)) continue;
    seen.add(e.path);
    errors.push({ field: e.path, message: e.msg });
  }
  res.status(400).json({ success: false, message: errors[0]?.message || 'Validation failed', errors });
}

export const validId = (name = 'id') =>
  param(name)
    .custom((v) => mongoose.isValidObjectId(v))
    .withMessage('Invalid id');
