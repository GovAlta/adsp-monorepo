import { auditDefinitions } from '@abgov/adsp-service-sdk';
import { ACCESS_SERVICE_ID, AccessAuditActions } from './actions';

describe('access service audit actions', () => {
  const catalog = auditDefinitions(AccessAuditActions);

  it('records actions under the access-service namespace', () => {
    expect(ACCESS_SERVICE_ID.service).toBe('access-service');
  });

  it.each([
    ['access.user.created', 'info'],
    ['access.user.updated', 'info'],
    ['access.user.deleted', 'critical'],
    ['access.user.role-assigned', 'warning'],
    ['access.user.role-removed', 'warning'],
    ['access.service-account.created', 'warning'],
    ['access.service-account.credential-rotated', 'critical'],
    ['access.service-account.deleted', 'critical'],
    ['access.realm.configuration-changed', 'critical'],
    ['access.user.login-failed', 'warning'],
  ])('registers %s with %s severity', (action, severity) => {
    expect(catalog[action]?.severity).toBe(severity);
  });

  it('registers only the cataloged actions', () => {
    expect(Object.keys(catalog)).toHaveLength(10);
  });

  it.each(AccessAuditActions.map(({ name }) => name))('registers %s as a version 1 security action', (action) => {
    expect(catalog[action]).toMatchObject({ version: 1, category: 'security' });
  });

  it.each(AccessAuditActions.map(({ name }) => name))('retains %s under the security retention class', (action) => {
    expect(catalog[action].retentionClass).toBe('security');
  });

  it.each([
    ['access.user.created', 'user'],
    ['access.user.deleted', 'user'],
    ['access.user.role-assigned', 'user'],
    ['access.service-account.credential-rotated', 'service-account'],
    ['access.realm.configuration-changed', 'realm'],
  ])('requires %s records to have a %s resource', (action, resourceType) => {
    expect(catalog[action].resourceType).toBe(resourceType);
  });

  it('does not require a resource for a failed login of an unknown user', () => {
    expect(catalog['access.user.login-failed'].resourceType).toBeUndefined();
  });
});
