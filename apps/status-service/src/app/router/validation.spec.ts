import { InvalidValueError, UnauthorizedError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { ApplicationRepo } from './ApplicationRepo';
import {
  assertTenantUser,
  isHttpUrl,
  isKebabCase,
  validateApplicationStatus,
  validateCreateApplication,
  validateUpdateApplication,
} from './validation';

const res = {} as Response;
const run = (handler, req: Partial<Request>) => {
  const next = jest.fn();
  handler(req as Request, res, next);
  return next.mock.calls[0][0];
};
const endpoint = { url: 'https://example.com/health' };

describe('validation', () => {
  describe('isKebabCase', () => {
    it.each(['app', 'my-app', 'app-2'])('accepts %s', (value) => expect(isKebabCase(value)).toBe(true));
    it.each(['', 'My-App', 'my--app', '-app', 'app!', 42])('rejects %s', (value) =>
      expect(isKebabCase(value)).toBe(false),
    );
  });

  describe('isHttpUrl', () => {
    it.each(['http://a.com', 'https://a.com/x'])('accepts %s', (value) => expect(isHttpUrl(value)).toBe(true));
    it.each(['not a url', 'ftp://a.com', undefined, 1])('rejects %s', (value) => expect(isHttpUrl(value)).toBe(false));
  });

  describe('assertTenantUser', () => {
    it('passes a user with a tenant', () => {
      expect(run(assertTenantUser, { user: { tenantId: 'tenant' } as never })).toBeUndefined();
    });

    it.each([[{ user: { roles: [] } as never }], [{}]])('returns 401 without a tenant', (req) => {
      const err = run(assertTenantUser, req);
      expect(err).toBeInstanceOf(UnauthorizedError);
      expect(err.extra.statusCode).toBe(401);
    });
  });

  describe('validateCreateApplication', () => {
    const handler = validateCreateApplication(ApplicationRepo.getApplicationKey);

    it('passes a valid body', () => {
      expect(run(handler, { body: { name: 'My App', endpoint, status: 'operational' } })).toBeUndefined();
    });

    it.each([
      ['missing endpoint', { name: 'My App' }],
      ['invalid endpoint url', { name: 'My App', endpoint: { url: 'nope' } }],
      ['missing name', { endpoint }],
      ['blank name', { name: '  ', endpoint }],
      ['name that is not kebab-able', { name: '!!!', endpoint }],
      ['non kebab appKey', { name: 'My App', appKey: 'My_App', endpoint }],
      ['invalid status', { name: 'My App', endpoint, status: 'bogus' }],
      ['null status', { name: 'My App', endpoint, status: null }],
      ['name with surrounding spaces', { name: ' My App ', endpoint }],
      ['object appKey', { name: 'My App', appKey: { toString: 1 }, endpoint }],
    ])('returns 400 for %s', (_, body) => {
      const err = run(handler, { body });
      expect(err).toBeInstanceOf(InvalidValueError);
      expect(err.extra.statusCode).toBe(400);
    });

    it('returns 400 when there is no body', () => {
      expect(run(handler, {})).toBeInstanceOf(InvalidValueError);
    });
  });

  describe('validateUpdateApplication', () => {
    it('passes a valid body', () => {
      expect(
        run(validateUpdateApplication, { params: { appKey: 'a' }, body: { name: 'A', endpoint } }),
      ).toBeUndefined();
    });

    it.each([
      ['missing name', { endpoint }],
      ['missing endpoint', { name: 'A' }],
    ])('returns 400 for %s', (_, body) => {
      expect(run(validateUpdateApplication, { params: { appKey: 'a' }, body })).toBeInstanceOf(InvalidValueError);
    });
  });

  describe('validateApplicationStatus', () => {
    it.each(['operational', 'reported-issues', 'maintenance', 'outage'])('accepts %s', (status) => {
      expect(run(validateApplicationStatus, { body: { status } })).toBeUndefined();
    });

    it.each(['bogus', '', undefined])('returns 400 for %s', (status) => {
      expect(run(validateApplicationStatus, { body: { status } })).toBeInstanceOf(InvalidValueError);
    });
  });
});
