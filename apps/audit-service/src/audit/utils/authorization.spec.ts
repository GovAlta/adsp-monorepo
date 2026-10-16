import { adspId, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { Request, Response } from 'express';
import { AuditServiceRoles } from '../roles';
import { requireAuditRole } from './authorization';

describe.each(Object.values(AuditServiceRoles))('requireAuditRole(%s)', (role) => {
  const tenantA = { id: adspId`urn:ads:platform:tenant-service:v2:/tenants/case-team`, name: 'Case', realm: 'case' };
  const tenantB = {
    id: adspId`urn:ads:platform:tenant-service:v2:/tenants/payment-team`,
    name: 'Payment',
    realm: 'payment',
  };
  const user: User = {
    id: 'audit-client',
    name: 'Audit client',
    email: '',
    isCore: false,
    tenantId: tenantA.id,
    roles: [role],
    token: {
      azp: 'urn:ads:case-team:case-service',
      aud: 'urn:ads:platform:audit-service',
      iss: 'tenant-issuer',
      bearer: 'test',
      email_verified: false,
    },
  };
  const coreUser: User = { ...user, isCore: true, tenantId: undefined };
  const response = {} as Response;

  it.each([
    ['tenant caller in its resolved tenant', user, tenantA],
    ['Core caller in another tenant', coreUser, tenantB],
    ['Core caller accessing Core catalogs', coreUser, undefined],
  ])('permits a %s holding the required role', (_label, caller, tenant) => {
    const req = { user: caller, tenant } as Request;
    const next = jest.fn();

    requireAuditRole(role)(req, response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it.each([
    ['tenant caller without the role', { ...user, roles: [] }, tenantA],
    ['Core caller without the role', { ...coreUser, roles: [] }, tenantB],
    ['Core caller without the role or tenant', { ...coreUser, roles: [] }, undefined],
    ['tenant caller accessing another resolved tenant', user, tenantB],
    ['tenant caller without a resolved tenant', user, undefined],
    ['tenant caller without a tenant identity', { ...user, tenantId: undefined }, tenantA],
    ['missing caller', undefined, tenantA],
    ['caller with unrelated roles', { ...user, roles: ['tenant-admin', 'configuration-admin'] }, tenantA],
  ])('refuses a %s', (_label, caller, tenant) => {
    const req = { user: caller, tenant } as Request;
    const next = jest.fn();

    requireAuditRole(role)(req, response, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
  });

  it('does not treat other audit roles as the required role', () => {
    const caller = { ...user, roles: Object.values(AuditServiceRoles).filter((candidate) => candidate !== role) };
    const req = { user: caller, tenant: tenantA } as Request;
    const next = jest.fn();

    requireAuditRole(role)(req, response, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
  });
});
