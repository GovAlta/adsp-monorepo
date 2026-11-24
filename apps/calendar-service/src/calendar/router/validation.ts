import { query } from 'express-validator';

export const MAX_TOP = 5000;

export const topQueryValidator = () => query('top').optional().isString().bail().isInt({ min: 1, max: MAX_TOP });

export const criteriaQueryValidator = () =>
  query('criteria').optional().isString().isJSON().withMessage('criteria must be valid JSON');
