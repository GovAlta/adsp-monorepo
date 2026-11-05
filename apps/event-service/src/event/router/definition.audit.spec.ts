import { adspId, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { ConfigurationClient, InvalidOperationError, NotFoundError } from '@core-services/core-common';
import type { Request, Response } from 'express';
import type { Logger } from 'winston';
import {
  createEventDefinitionAuditRecorder,
  EventDefinitionCreatedAuditAction,
  EventDefinitionDeletedAuditAction,
  EventDefinitionUpdatedAuditAction,
} from '../audit';
import { EventServiceRoles } from '../role';
import { createDefinition, deleteDefinition, EventConfiguration, updateDefinition } from './definition';

describe('definition router audit', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const admin = { id: 'admin', name: 'Admin', tenantId, roles: [EventServiceRoles.admin], isCore: false };
  const noRoles = { id: 'none', tenantId, roles: [], isCore: false };

  const definition = { name: 'user-registration', description: 'A user registered', payloadSchema: { type: 'object' } };
  const tenantConfiguration = {
    'application-events': { name: 'application-events', definitions: { 'user-registration': definition } },
  } as unknown as EventConfiguration;

  const clientMock = {
    getTenantConfiguration: jest.fn(),
    getCoreConfiguration: jest.fn(),
    updateEntry: jest.fn(),
    deleteEntry: jest.fn(),
  };
  const client = clientMock as unknown as ConfigurationClient<EventConfiguration>;
  const validationServiceMock = { setSchema: jest.fn(), validate: jest.fn() };
  const auditServiceMock = { record: jest.fn(), query: jest.fn(), flush: jest.fn(), droppedEventCount: 0 };
  const loggerMock = { warn: jest.fn() };
  const recordAudit = createEventDefinitionAuditRecorder(auditServiceMock, loggerMock as unknown as Logger);

  const res = { send: jest.fn() };
  const next = jest.fn();

  const createRequest = (props: Record<string, unknown>) =>
    ({ tenant: { id: tenantId }, params: {}, body: {}, ...props }) as unknown as Request;

  const expectedActor = { id: 'admin', type: 'user', name: 'Admin', roles: [EventServiceRoles.admin] };

  beforeEach(() => {
    Object.values(clientMock).forEach((mock) => mock.mockReset());
    validationServiceMock.setSchema.mockReset();
    auditServiceMock.record.mockReset();
    auditServiceMock.record.mockResolvedValue({ status: 'recorded', eventId: 'event' });
    loggerMock.warn.mockReset();
    res.send.mockReset();
    next.mockReset();
    clientMock.getTenantConfiguration.mockResolvedValue(tenantConfiguration);
    clientMock.updateEntry.mockImplementation((_tenantId, _key, namespace) =>
      Promise.resolve({ [namespace.name]: namespace }),
    );
  });

  describe('createDefinition', () => {
    const handler = createDefinition(client, validationServiceMock, recordAudit);
    const body = { namespace: 'application-events', name: 'new-event', payloadSchema: { type: 'object' } };

    it('records event-definition.created in an existing namespace', async () => {
      await handler(createRequest({ user: admin, body }), res as unknown as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(auditServiceMock.record).toHaveBeenCalledTimes(1);
      expect(auditServiceMock.record).toHaveBeenCalledWith(EventDefinitionCreatedAuditAction, {
        tenantId,
        actor: expectedActor,
        resource: { type: 'event-definition', id: 'application-events:new-event' },
        metadata: { namespace: 'application-events', name: 'new-event', namespaceCreated: false },
      });
    });

    it('records namespaceCreated for a new namespace', async () => {
      await handler(
        createRequest({ user: admin, body: { ...body, namespace: 'new-namespace' } }),
        res as unknown as Response,
        next,
      );

      expect(auditServiceMock.record).toHaveBeenCalledWith(
        EventDefinitionCreatedAuditAction,
        expect.objectContaining({
          resource: { type: 'event-definition', id: 'new-namespace:new-event' },
          metadata: { namespace: 'new-namespace', name: 'new-event', namespaceCreated: true },
        }),
      );
    });

    it('records nothing for an unauthorized user', async () => {
      await handler(createRequest({ user: noRoles, body }), res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
      expect(auditServiceMock.record).not.toHaveBeenCalled();
    });

    it('records nothing for an existing definition', async () => {
      await handler(
        createRequest({ user: admin, body: { ...body, name: 'user-registration' } }),
        res as unknown as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(auditServiceMock.record).not.toHaveBeenCalled();
    });

    it('records nothing for an invalid payload schema', async () => {
      validationServiceMock.setSchema.mockImplementationOnce(() => {
        throw new Error('schema is invalid');
      });

      await handler(createRequest({ user: admin, body }), res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(auditServiceMock.record).not.toHaveBeenCalled();
    });

    it('records nothing when the configuration update fails', async () => {
      const err = new Error('oops');
      clientMock.updateEntry.mockRejectedValueOnce(err);

      await handler(createRequest({ user: admin, body }), res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(err);
      expect(auditServiceMock.record).not.toHaveBeenCalled();
    });

    it('creates the definition when the audit event cannot be recorded', async () => {
      auditServiceMock.record.mockImplementationOnce(() => {
        throw new Error('audit unavailable');
      });

      await handler(createRequest({ user: admin, body }), res as unknown as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'new-event' }));
      expect(loggerMock.warn).toHaveBeenCalled();
    });
  });

  describe('updateDefinition', () => {
    const handler = updateDefinition(client, validationServiceMock, recordAudit);
    const params = { namespace: 'application-events', name: 'user-registration' };

    it('records event-definition.updated with the changed fields', async () => {
      await handler(
        createRequest({
          user: admin,
          params,
          body: { description: 'Updated', payloadSchema: definition.payloadSchema },
        }),
        res as unknown as Response,
        next,
      );

      expect(next).not.toHaveBeenCalled();
      expect(auditServiceMock.record).toHaveBeenCalledWith(EventDefinitionUpdatedAuditAction, {
        tenantId,
        actor: expectedActor,
        resource: { type: 'event-definition', id: 'application-events:user-registration' },
        metadata: { namespace: 'application-events', name: 'user-registration', changedFields: ['description'] },
      });
    });

    it('records an update without changes', async () => {
      await handler(
        createRequest({
          user: admin,
          params,
          body: { description: definition.description, payloadSchema: definition.payloadSchema },
        }),
        res as unknown as Response,
        next,
      );

      expect(auditServiceMock.record).toHaveBeenCalledWith(
        EventDefinitionUpdatedAuditAction,
        expect.objectContaining({
          metadata: { namespace: 'application-events', name: 'user-registration', changedFields: [] },
        }),
      );
    });

    it('records nothing for a missing definition', async () => {
      await handler(
        createRequest({ user: admin, params: { ...params, name: 'missing' }, body: { payloadSchema: {} } }),
        res as unknown as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(auditServiceMock.record).not.toHaveBeenCalled();
    });

    it('records nothing for an unauthorized user', async () => {
      await handler(
        createRequest({ user: noRoles, params, body: { payloadSchema: {} } }),
        res as unknown as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
      expect(auditServiceMock.record).not.toHaveBeenCalled();
    });
  });

  describe('deleteDefinition', () => {
    const handler = deleteDefinition(client, recordAudit);
    const params = { namespace: 'application-events', name: 'user-registration' };

    it('records event-definition.deleted when the namespace is removed', async () => {
      await handler(createRequest({ user: admin, params }), res as unknown as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(clientMock.deleteEntry).toHaveBeenCalled();
      expect(auditServiceMock.record).toHaveBeenCalledWith(EventDefinitionDeletedAuditAction, {
        tenantId,
        actor: expectedActor,
        resource: { type: 'event-definition', id: 'application-events:user-registration' },
        metadata: { namespace: 'application-events', name: 'user-registration', namespaceDeleted: true },
      });
      expect(EventDefinitionDeletedAuditAction.severity).toBe('warning');
    });

    it('records event-definition.deleted when other definitions remain', async () => {
      clientMock.getTenantConfiguration.mockResolvedValueOnce({
        'application-events': {
          name: 'application-events',
          definitions: { 'user-registration': definition, other: { ...definition, name: 'other' } },
        },
      });

      await handler(createRequest({ user: admin, params }), res as unknown as Response, next);

      expect(clientMock.updateEntry).toHaveBeenCalled();
      expect(auditServiceMock.record).toHaveBeenCalledWith(
        EventDefinitionDeletedAuditAction,
        expect.objectContaining({
          metadata: { namespace: 'application-events', name: 'user-registration', namespaceDeleted: false },
        }),
      );
    });

    it('records nothing for a missing definition', async () => {
      await handler(
        createRequest({ user: admin, params: { ...params, name: 'missing' } }),
        res as unknown as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(auditServiceMock.record).not.toHaveBeenCalled();
    });

    it('records nothing when the configuration delete fails', async () => {
      const err = new Error('oops');
      clientMock.deleteEntry.mockRejectedValueOnce(err);

      await handler(createRequest({ user: admin, params }), res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(err);
      expect(auditServiceMock.record).not.toHaveBeenCalled();
    });

    it('deletes the definition when the audit event is not recorded', async () => {
      auditServiceMock.record.mockResolvedValueOnce({
        status: 'rejected',
        eventId: 'event',
        code: 'audit_disabled',
        reason: 'Audit recording is disabled.',
      });

      await handler(createRequest({ user: admin, params }), res as unknown as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith({ deleted: true });
    });
  });
});
