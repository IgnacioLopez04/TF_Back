import { BadRequestError } from '../errors/errors.js';

export const validate = (schema) => (req, res, next) => {
  try {
    console.log('[CREATE PATIENT] Incoming body before validation:', req.body);
    req.body = schema.parse(req.body);
    console.log('[CREATE PATIENT] Validated body:', req.body);
    next();
  } catch (err) {
    console.error('[CREATE PATIENT] Validation error:', err?.errors || err);
    const message = err.errors?.[0]?.message || 'Datos inválidos';
    next(new BadRequestError(message));
  }
};
