import { auditDefinitions } from '@abgov/adsp-service-sdk';
import { ACCESS_SERVICE_ID, AccessAuditActions } from './actions';

describe('access service audit actions', () => {
  const catalog = auditDefinitions(AccessAuditActions);

  it('records actions under the access-service namespace', () => {
    expect(ACCESS_SERVICE_ID.service).toBe('access-service');
  });

  it.each([
    ['user.created', 'info'],
    ['user.updated', 'info'],
    ['user.deleted', 'critical'],
    ['user.role-assigned', 'warning'],
    ['user.role-removed', 'warning'],
    ['service-account.created', 'warning'],
    ['service-account.credential-rotated', 'critical'],
    ['service-account.deleted', 'critical'],
    ['realm.configuration-changed', 'critical'],
    ['user.login-failed', 'warning'],
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
    ['user.created', 'user'],
    ['user.deleted', 'user'],
    ['user.role-assigned', 'user'],
    ['service-account.credential-rotated', 'service-account'],
    ['realm.configuration-changed', 'realm'],
  ])('requires %s records to have a %s resource', (action, resourceType) => {
    expect(catalog[action].resourceType).toBe(resourceType);
  });

  it('does not require a resource for a failed login of an unknown user', () => {
    expect(catalog['user.login-failed'].resourceType).toBeUndefined();
  });
});
