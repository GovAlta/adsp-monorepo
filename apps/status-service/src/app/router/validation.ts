import { User } from '@abgov/adsp-service-sdk';
import { InvalidValueError, UnauthorizedError } from '@core-services/core-common';
import { RequestHandler } from 'express';
import { PublicServiceStatusType } from '../types';

export const PublicServiceStatuses: PublicServiceStatusType[] = [
  'operational',
  'reported-issues',
  'maintenance',
  'outage',
];

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SOURCE = 'status-service';

export const isKebabCase = (value: unknown): boolean => typeof value === 'string' && KEBAB_CASE.test(value);

export const isHttpUrl = (value: unknown): boolean => {
  if (typeof value !== 'string') {
    return false;
  }
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

export const assertTenantUser: RequestHandler = (req, _res, next) => {
  const user = req.user as User;
  if (!user?.tenantId) {
    next(new UnauthorizedError('missing tenant id'));
  } else {
    next();
  }
};

function assertName(name: unknown, appKey: unknown, deriveKey: (name: string) => string) {
  if (typeof name !== 'string' || !name.trim()) {
    throw new InvalidValueError(SOURCE, 'Application name is required.');
  }
  // Derive the key from the name as sent, which is what the handler stores.
  const key = appKey ?? deriveKey(name);
  if (!isKebabCase(key)) {
    throw new InvalidValueError(
      SOURCE,
      'Application key must be kebab-case (lowercase letters, numbers and single hyphens).',
    );
  }
}

function assertEndpoint(endpoint: { url?: unknown } | undefined) {
  if (!isHttpUrl(endpoint?.url)) {
    throw new InvalidValueError(SOURCE, 'endpoint.url must be a valid http or https URL.');
  }
}

export function assertStatus(status: unknown, optional = false) {
  if (optional && status === undefined) {
    return;
  }
  if (!PublicServiceStatuses.includes(status as PublicServiceStatusType)) {
    throw new InvalidValueError(SOURCE, `status must be one of: ${PublicServiceStatuses.join(', ')}.`);
  }
}

export const validateCreateApplication =
  (deriveKey: (name: string) => string): RequestHandler =>
  (req, _res, next) => {
    try {
      const { name, appKey, endpoint, status } = req.body ?? {};
      assertName(name, appKey, deriveKey);
      assertEndpoint(endpoint);
      assertStatus(status, true);
      next();
    } catch (err) {
      next(err);
    }
  };

export const validateUpdateApplication: RequestHandler = (req, _res, next) => {
  try {
    const { name, endpoint } = req.body ?? {};
    // The key of an existing application is fixed, so only the name itself is checked here.
    if (typeof name !== 'string' || !name.trim()) {
      throw new InvalidValueError(SOURCE, 'Application name is required.');
    }
    assertEndpoint(endpoint);
    next();
  } catch (err) {
    next(err);
  }
};

export const validateApplicationStatus: RequestHandler = (req, _res, next) => {
  try {
    assertStatus(req.body?.status);
    next();
  } catch (err) {
    next(err);
  }
};
