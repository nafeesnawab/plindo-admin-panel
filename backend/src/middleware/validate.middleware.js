import { validationResult } from 'express-validator';
import { error } from '../utils/response.js';

/**
 * Middleware to check express-validator results.
 * Use after validation chains in route definitions.
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return error(res, messages.join(', '), 400, 10001);
  }
  next();
};
