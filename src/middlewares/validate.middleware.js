import { BadRequestError } from '../errors/errors.js';

export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    const message = err.errors?.[0]?.message || 'Datos inválidos';
    next(new BadRequestError(message));
  }
};
