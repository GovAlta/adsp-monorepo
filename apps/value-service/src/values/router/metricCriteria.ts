import { InvalidOperationError } from '@core-services/core-common';
import { MetricCriteria } from '../types';

type MetricCriteriaBounds = Pick<MetricCriteria, 'intervalMin' | 'intervalMax' | 'metricLike'>;

const parseInterval = (value: unknown, parameter: string): Date | null => {
  if (value === undefined || value === null) {
    return null;
  }

  const interval = typeof value === 'string' ? new Date(value) : null;
  if (!interval || Number.isNaN(interval.getTime())) {
    throw new InvalidOperationError(`criteria ${parameter} must be an ISO 8601 timestamp.`);
  }

  return interval;
};

/**
 * Read the criteria query parameter of a metrics request.
 *
 * The parameter arrives as a JSON string, so neither it nor the interval bounds inside it can be
 * checked by the route schema; without this the JSON parse failed as a server error and an
 * unparseable bound reached the database as an invalid date.
 */
export const parseMetricCriteria = (criteriaValue: unknown): MetricCriteriaBounds => {
  if (criteriaValue === undefined || criteriaValue === null) {
    return { intervalMin: null, intervalMax: null, metricLike: undefined };
  }

  if (typeof criteriaValue !== 'string') {
    throw new InvalidOperationError('criteria must be a single JSON object.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(criteriaValue);
  } catch {
    throw new InvalidOperationError('criteria must be valid JSON.');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new InvalidOperationError('criteria must be a JSON object.');
  }

  const { intervalMin, intervalMax, metricLike } = parsed as Record<string, unknown>;
  if (metricLike !== undefined && typeof metricLike !== 'string') {
    throw new InvalidOperationError('criteria metricLike must be text.');
  }

  return {
    intervalMin: parseInterval(intervalMin, 'intervalMin'),
    intervalMax: parseInterval(intervalMax, 'intervalMax'),
    metricLike: metricLike as string | undefined,
  };
};
