import { adspId } from '@abgov/adsp-service-sdk';
import type { DomainEvent } from '@core-services/core-common';
import { toAccessAuditRecord } from './records';

describe('toAccessAuditRecord', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/6f0d3c1a2b4e5f6a7b8c9d0e`;
  const timestamp = new Date('2026-11-04T16:20:41.702Z');
  const adminId = '1d2c3b4a-5e6f-4a7b-8c9d-0e1f2a3b4c5d';
  const userId = '9a8b7c6d-5e4f-4a3b-2c1d-0e9f8a7b6c5d';
  const clientUuid = '4b5c6d7e-8f9a-4b0c-9d1e-2f3a4b5c6d7e';
  const authDetails = {
    userId: adminId,
    realmId: 'core-realm-id',
    clientId: '7e6d5c4b-3a29-4180-9f8e-7d6c5b4a3928',
    ipAddress: '192.0.2.10',
    realmName: 'core',
  };

  const adminEvent = (name: string, payload: Record<string, unknown> = {}): DomainEvent => {
    const [operationType, resourceType] = name.split('-');
    return {
      namespace: 'access-service',
      name,
      tenantId,
      timestamp,
      payload: {
        error: null,
        realmId: 'test-tenant-realm',
        authDetails,
        operationType,
        resourceType,
        resourcePath: null,
        representation: null,
        ...payload,
      },
    };
  };

  const userEvent = (name: string, payload: Record<string, unknown> = {}): DomainEvent => ({
    namespace: 'access-service',
    name,
    tenantId,
    timestamp,
    payload: {
      id: '3e2d1c0b-9a8f-4e7d-8c6b-5a4f3e2d1c0b',
      time: timestamp.getTime(),
      type: name,
      error: 'invalid_user_credentials',
      userId: null,
      details: { username: 'jordan.tester', redirect_uri: 'https://app.example.test/callback' },
      realmId: 'test-tenant-realm',
      clientId: 'tenant-app',
      ipAddress: '192.0.2.20',
      realmName: 'test-tenant-realm',
      sessionId: null,
      ...payload,
    },
  });

  const userRepresentation = JSON.stringify({
    username: 'jordan.tester',
    firstName: 'Jordan',
    lastName: 'Tester',
    email: 'jordan.tester@example.test',
    attributes: { phoneNumber: ['780-555-0100'], dateOfBirth: ['1990-01-01'] },
    enabled: true,
  });
  const roleRepresentation = JSON.stringify([
    { id: 'd1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a', name: 'value-reader', description: 'Reader role.', composite: false },
    { id: 'e2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6b', name: 'value-writer', composite: false },
  ]);
  const clientRepresentation = JSON.stringify({
    id: clientUuid,
    clientId: 'urn:ads:test-tenant:case-service',
    name: 'Case service',
    secret: 'client-secret-value',
  });

  describe('admin events', () => {
    it.each([
      ['CREATE-USER', `users/${userId}`, userRepresentation, 'user.created'],
      ['UPDATE-USER', `users/${userId}`, userRepresentation, 'user.updated'],
      ['DELETE-USER', `users/${userId}`, null, 'user.deleted'],
      [
        'CREATE-CLIENT_ROLE_MAPPING',
        `users/${userId}/role-mappings/clients/${clientUuid}`,
        roleRepresentation,
        'user.role-assigned',
      ],
      [
        'DELETE-CLIENT_ROLE_MAPPING',
        `users/${userId}/role-mappings/clients/${clientUuid}`,
        roleRepresentation,
        'user.role-removed',
      ],
      ['CREATE-CLIENT', `clients/${clientUuid}`, clientRepresentation, 'service-account.created'],
      ['DELETE-CLIENT', `clients/${clientUuid}`, null, 'service-account.deleted'],
      ['ACTION-CLIENT', `clients/${clientUuid}/client-secret`, null, 'service-account.credential-rotated'],
      ['UPDATE-REALM', null, '{"realm":"test-tenant-realm"}', 'realm.configuration-changed'],
      ['UPDATE-REALM', 'events/config', '{"eventsEnabled":true}', 'realm.configuration-changed'],
    ])('records %s on %s as %s', (name, resourcePath, representation, action) => {
      const event = adminEvent(name, { resourcePath, representation });

      const record = toAccessAuditRecord(event);

      expect(record?.action.name).toBe(action);
    });

    it('records the affected user as the resource, named by username', () => {
      const event = adminEvent('CREATE-USER', { resourcePath: `users/${userId}`, representation: userRepresentation });

      const record = toAccessAuditRecord(event);

      expect(record.details.resource).toEqual({ type: 'user', id: userId, name: 'jordan.tester' });
    });

    it('records a deleted user without a name since the event has no representation', () => {
      const event = adminEvent('DELETE-USER', { resourcePath: `users/${userId}` });

      const record = toAccessAuditRecord(event);

      expect(record.details.resource).toEqual({ type: 'user', id: userId });
    });

    it('does not copy personal information from the user representation', () => {
      const event = adminEvent('UPDATE-USER', { resourcePath: `users/${userId}`, representation: userRepresentation });

      const record = toAccessAuditRecord(event);

      expect(JSON.stringify(record)).not.toMatch(/example\.test|780-555-0100|1990-01-01|Jordan/);
    });

    it('records the administrator as the actor', () => {
      const event = adminEvent('DELETE-USER', { resourcePath: `users/${userId}` });

      const record = toAccessAuditRecord(event);

      expect(record.details.actor).toEqual({ id: adminId, type: 'user' });
    });

    it('records the realm, operation, resource path and administrator realm as metadata', () => {
      const event = adminEvent('DELETE-USER', { resourcePath: `users/${userId}` });

      const record = toAccessAuditRecord(event);

      expect(record.details.metadata).toEqual({
        realm: 'test-tenant-realm',
        operationType: 'DELETE',
        resourcePath: `users/${userId}`,
        actorRealm: 'core',
      });
    });

    it('uses the administrator realm ID when the realm name is not provided', () => {
      const { realmName: _realmName, ...detailsWithoutName } = authDetails;
      const event = adminEvent('DELETE-USER', { resourcePath: `users/${userId}`, authDetails: detailsWithoutName });

      const record = toAccessAuditRecord(event);

      expect(record.details.metadata.actorRealm).toBe('core-realm-id');
    });

    it('does not record the administrator IP address', () => {
      const event = adminEvent('DELETE-USER', { resourcePath: `users/${userId}` });

      const record = toAccessAuditRecord(event);

      expect(JSON.stringify(record)).not.toContain('192.0.2.10');
    });

    it('matches resource paths with a leading slash', () => {
      const event = adminEvent('DELETE-USER', { resourcePath: `/users/${userId}` });

      const record = toAccessAuditRecord(event);

      expect(record.details.resource).toEqual({ type: 'user', id: userId });
    });

    it('records the assigned client role names and client as metadata', () => {
      const event = adminEvent('CREATE-CLIENT_ROLE_MAPPING', {
        resourcePath: `users/${userId}/role-mappings/clients/${clientUuid}`,
        representation: roleRepresentation,
      });

      const record = toAccessAuditRecord(event);

      expect(record.details.metadata).toMatchObject({ roles: ['value-reader', 'value-writer'], clientId: clientUuid });
    });

    it('records the user of a role mapping as the resource', () => {
      const event = adminEvent('DELETE-CLIENT_ROLE_MAPPING', {
        resourcePath: `users/${userId}/role-mappings/clients/${clientUuid}`,
        representation: roleRepresentation,
      });

      const record = toAccessAuditRecord(event);

      expect(record.details.resource).toEqual({ type: 'user', id: userId });
    });

    it.each(['[]', 'not json', null])('does not record a role mapping with representation %s', (representation) => {
      const event = adminEvent('CREATE-CLIENT_ROLE_MAPPING', {
        resourcePath: `users/${userId}/role-mappings/clients/${clientUuid}`,
        representation,
      });

      const record = toAccessAuditRecord(event);

      expect(record).toBeUndefined();
    });

    it('records a created client as a service account named by its client ID', () => {
      const event = adminEvent('CREATE-CLIENT', {
        resourcePath: `clients/${clientUuid}`,
        representation: clientRepresentation,
      });

      const record = toAccessAuditRecord(event);

      expect(record.details.resource).toEqual({
        type: 'service-account',
        id: clientUuid,
        name: 'urn:ads:test-tenant:case-service',
      });
    });

    it('records the client of a regenerated secret as the resource', () => {
      const event = adminEvent('ACTION-CLIENT', { resourcePath: `clients/${clientUuid}/client-secret` });

      const record = toAccessAuditRecord(event);

      expect(record.details.resource).toEqual({ type: 'service-account', id: clientUuid });
    });

    it('never records the regenerated client secret', () => {
      const event = adminEvent('ACTION-CLIENT', {
        resourcePath: `clients/${clientUuid}/client-secret`,
        representation: JSON.stringify({ type: 'secret', value: 'regenerated-secret-value' }),
      });

      const record = toAccessAuditRecord(event);

      expect(JSON.stringify(record)).not.toContain('regenerated-secret-value');
    });

    it('records the tenant realm as the resource of a realm change', () => {
      const event = adminEvent('UPDATE-REALM', { resourcePath: 'events/config' });

      const record = toAccessAuditRecord(event);

      expect(record.details.resource).toEqual({ type: 'realm', id: 'test-tenant-realm' });
    });

    it.each([
      ['DELETE-USER', `users/${userId}/federated-identity/core`],
      ['ACTION-USER', `users/${userId}/reset-password`],
      ['UPDATE-USER_PROFILE', 'users/profile'],
      ['UPDATE-CLIENT', `clients/${clientUuid}`],
      ['CREATE-REALM_ROLE_MAPPING', `users/${userId}/role-mappings/realm`],
      ['CREATE-GROUP_MEMBERSHIP', `users/${userId}/groups/${clientUuid}`],
      ['ACTION-CLIENT', `clients/${clientUuid}/push-revocation`],
    ])('does not record %s on %s', (name, resourcePath) => {
      const event = adminEvent(name, { resourcePath, representation: roleRepresentation });

      const record = toAccessAuditRecord(event);

      expect(record).toBeUndefined();
    });

    it('does not record an admin event without an administrator', () => {
      const event = adminEvent('DELETE-USER', { resourcePath: `users/${userId}`, authDetails: { realmId: 'core' } });

      const record = toAccessAuditRecord(event);

      expect(record).toBeUndefined();
    });

    it('gives a redelivered admin event the same event ID', () => {
      const event = adminEvent('DELETE-USER', { resourcePath: `users/${userId}` });

      const first = toAccessAuditRecord(event);
      const redelivered = toAccessAuditRecord({ ...event, timestamp: new Date(timestamp.toISOString()) });

      expect(redelivered.details.eventId).toBe(first.details.eventId);
    });

    it('gives admin events at different times different event IDs', () => {
      const event = adminEvent('DELETE-USER', { resourcePath: `users/${userId}` });

      const first = toAccessAuditRecord(event);
      const later = toAccessAuditRecord({ ...event, timestamp: new Date(timestamp.getTime() + 1) });

      expect(later.details.eventId).not.toBe(first.details.eventId);
    });

    it('identifies admin events with a UUID', () => {
      const event = adminEvent('DELETE-USER', { resourcePath: `users/${userId}` });

      const record = toAccessAuditRecord(event);

      expect(record.details.eventId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });
  });

  describe('login failures', () => {
    it('records a LOGIN_ERROR as a failed user.login-failed', () => {
      const event = userEvent('LOGIN_ERROR');

      const record = toAccessAuditRecord(event);

      expect(record).toMatchObject({ action: { name: 'user.login-failed' }, details: { status: 'failure' } });
    });

    it('identifies the record by the Keycloak event ID', () => {
      const event = userEvent('LOGIN_ERROR');

      const record = toAccessAuditRecord(event);

      expect(record.details.eventId).toBe('3e2d1c0b-9a8f-4e7d-8c6b-5a4f3e2d1c0b');
    });

    it('records the attempted username as the actor of an unknown user', () => {
      const event = userEvent('LOGIN_ERROR');

      const record = toAccessAuditRecord(event);

      expect(record.details.actor).toEqual({ id: 'jordan.tester', type: 'user', name: 'jordan.tester' });
    });

    it('records no resource for an unknown user', () => {
      const event = userEvent('LOGIN_ERROR');

      const record = toAccessAuditRecord(event);

      expect(record.details.resource).toBeUndefined();
    });

    it('records a known user as the actor and the resource', () => {
      const event = userEvent('LOGIN_ERROR', { userId });

      const record = toAccessAuditRecord(event);

      expect(record.details).toMatchObject({
        actor: { id: userId, type: 'user', name: 'jordan.tester' },
        resource: { type: 'user', id: userId },
      });
    });

    it('records an unknown actor when neither user nor username is provided', () => {
      const event = userEvent('LOGIN_ERROR', { error: 'client_not_found', details: { grant_type: 'password' } });

      const record = toAccessAuditRecord(event);

      expect(record.details.actor).toEqual({ id: 'unknown', type: 'user' });
    });

    it('records the realm, client and failure reason as metadata', () => {
      const event = userEvent('LOGIN_ERROR');

      const record = toAccessAuditRecord(event);

      expect(record.details.metadata).toEqual({
        realm: 'test-tenant-realm',
        clientId: 'tenant-app',
        reason: 'invalid_user_credentials',
      });
    });

    it('does not copy other login details or the IP address', () => {
      const event = userEvent('LOGIN_ERROR');

      const record = toAccessAuditRecord(event);

      expect(JSON.stringify(record)).not.toMatch(/callback|192\.0\.2\.20/);
    });

    it('records the session of the failed login when present', () => {
      const event = userEvent('LOGIN_ERROR', { userId, sessionId: 'b7c8d9e0-f1a2-4b3c-8d4e-5f6a7b8c9d0e' });

      const record = toAccessAuditRecord(event);

      expect(record.details.sessionId).toBe('b7c8d9e0-f1a2-4b3c-8d4e-5f6a7b8c9d0e');
    });

    it.each(['LOGIN', 'CODE_TO_TOKEN', 'CLIENT_LOGIN', 'LOGOUT', 'REFRESH_TOKEN'])('does not record %s', (name) => {
      const event = userEvent(name, { error: null, userId });

      const record = toAccessAuditRecord(event);

      expect(record).toBeUndefined();
    });

    it('does not record a login failure without a Keycloak event ID', () => {
      const event = userEvent('LOGIN_ERROR', { id: undefined });

      const record = toAccessAuditRecord(event);

      expect(record).toBeUndefined();
    });
  });

  describe('event context', () => {
    it('records the event in the tenant of the domain event', () => {
      const event = userEvent('LOGIN_ERROR');

      const record = toAccessAuditRecord(event);

      expect(record.details.tenantId).toBe(tenantId);
    });

    it('records the event at the time of the domain event', () => {
      const event = adminEvent('UPDATE-REALM');

      const record = toAccessAuditRecord(event);

      expect(record.details.occurredAt).toEqual(timestamp);
    });

    it('records the correlation ID of the domain event', () => {
      const event = { ...adminEvent('UPDATE-REALM'), correlationId: 'test-tenant-realm' };

      const record = toAccessAuditRecord(event);

      expect(record.details.correlationId).toBe('test-tenant-realm');
    });

    it('omits an empty correlation ID', () => {
      const event = { ...adminEvent('UPDATE-REALM'), correlationId: '' };

      const record = toAccessAuditRecord(event);

      expect(record.details.correlationId).toBeUndefined();
    });

    it('does not record events of other namespaces', () => {
      const event = { ...adminEvent('DELETE-USER', { resourcePath: `users/${userId}` }), namespace: 'form-service' };

      const record = toAccessAuditRecord(event);

      expect(record).toBeUndefined();
    });

    it('does not record events without a tenant', () => {
      const event = { ...adminEvent('DELETE-USER', { resourcePath: `users/${userId}` }), tenantId: undefined };

      const record = toAccessAuditRecord(event);

      expect(record).toBeUndefined();
    });

    it('does not record events without a valid timestamp', () => {
      const event = { ...userEvent('LOGIN_ERROR'), timestamp: new Date('invalid') };

      const record = toAccessAuditRecord(event);

      expect(record).toBeUndefined();
    });

    it.each(['constructor', '__proto__', 'toString'])('does not record an event named %s', (name) => {
      const event = adminEvent(name, { resourcePath: `users/${userId}` });

      const record = toAccessAuditRecord(event);

      expect(record).toBeUndefined();
    });

    it('does not record an event without a payload', () => {
      const event = { ...adminEvent('DELETE-USER'), payload: undefined };

      const record = toAccessAuditRecord(event);

      expect(record).toBeUndefined();
    });
  });
});
