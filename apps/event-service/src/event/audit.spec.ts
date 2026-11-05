import { adspId, auditDefinitions } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import type { Logger } from 'winston';
import {
  createEventDefinitionAuditRecorder,
  EventDefinitionCreatedAuditAction,
  EventDefinitionDeletedAuditAction,
  EventServiceAuditActions,
  getChangedFields,
  toEventDefinitionAuditDetails,
} from './audit';
import type { EventDefinition } from './types';

describe('event definition audit', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const user = {
    id: 'admin',
    name: 'Admin',
    email: 'admin@test.co',
    roles: ['event-service-admin'],
    tenantId,
    isCore: false,
  } as User;

  describe('EventServiceAuditActions', () => {
    it('defines the action catalog', () => {
      const resourceType = 'event-definition';
      expect(auditDefinitions(EventServiceAuditActions)).toEqual({
        'event-definition.created': expect.objectContaining({
          version: 1,
          category: 'administrative',
          severity: 'info',
          retentionClass: 'compliance',
          resourceType,
        }),
        'event-definition.updated': expect.objectContaining({
          version: 1,
          category: 'administrative',
          severity: 'info',
          retentionClass: 'compliance',
          resourceType,
        }),
        'event-definition.deleted': expect.objectContaining({
          version: 1,
          category: 'administrative',
          severity: 'warning',
          retentionClass: 'compliance',
          resourceType,
        }),
      });
    });

    it('does not capture change sets', () => {
      expect(EventServiceAuditActions.some((action) => action.captureChangeSet)).toBe(false);
    });
  });

  describe('toEventDefinitionAuditDetails', () => {
    it('builds details with the definition as the resource', () => {
      expect(
        toEventDefinitionAuditDetails(user, tenantId, 'application-events', 'user-registration', {
          namespaceCreated: true,
        }),
      ).toEqual({
        tenantId,
        actor: { id: 'admin', type: 'user', name: 'Admin', email: 'admin@test.co', roles: ['event-service-admin'] },
        resource: { type: 'event-definition', id: 'application-events:user-registration' },
        metadata: { namespace: 'application-events', name: 'user-registration', namespaceCreated: true },
      });
    });

    it('records service accounts as service actors', () => {
      const details = toEventDefinitionAuditDetails(
        { ...user, id: 'sa', name: 'service-account-test-client' },
        tenantId,
        'application-events',
        'user-registration',
      );
      expect(details.actor).toMatchObject({ id: 'sa', type: 'service' });
    });

    it('does not let metadata override the namespace and name', () => {
      const details = toEventDefinitionAuditDetails(user, tenantId, 'application-events', 'user-registration', {
        namespace: 'other',
        name: 'other',
      });
      expect(details.metadata).toEqual({ namespace: 'application-events', name: 'user-registration' });
    });
  });

  describe('getChangedFields', () => {
    const definition = {
      name: 'user-registration',
      description: 'A user registered',
      payloadSchema: { type: 'object' },
    };

    it('returns no fields for an unchanged definition', () => {
      expect(getChangedFields(definition, { ...definition, payloadSchema: { type: 'object' } })).toEqual([]);
    });

    it('returns changed description and payload schema', () => {
      expect(
        getChangedFields(definition, {
          ...definition,
          description: 'Updated',
          payloadSchema: { type: 'object', properties: { id: { type: 'string' } } },
        }),
      ).toEqual(['description', 'payloadSchema']);
    });

    it('returns added and removed fields', () => {
      expect(
        getChangedFields({ ...definition, log: { skip: true } }, {
          name: definition.name,
          payloadSchema: definition.payloadSchema,
        } as unknown as EventDefinition),
      ).toEqual(['description', 'log']);
    });
  });

  describe('createEventDefinitionAuditRecorder', () => {
    const auditServiceMock = { record: jest.fn(), query: jest.fn(), flush: jest.fn(), droppedEventCount: 0 };
    const loggerMock = { warn: jest.fn() };
    const recordAudit = createEventDefinitionAuditRecorder(auditServiceMock, loggerMock as unknown as Logger);

    beforeEach(() => {
      auditServiceMock.record.mockReset();
      auditServiceMock.record.mockResolvedValue({ status: 'recorded', eventId: 'event' });
      loggerMock.warn.mockReset();
    });

    it('records the action with the definition details', () => {
      recordAudit(EventDefinitionDeletedAuditAction, user, tenantId, 'application-events', 'user-registration', {
        namespaceDeleted: true,
      });

      expect(auditServiceMock.record).toHaveBeenCalledWith(
        EventDefinitionDeletedAuditAction,
        toEventDefinitionAuditDetails(user, tenantId, 'application-events', 'user-registration', {
          namespaceDeleted: true,
        }),
      );
    });

    it('logs instead of throwing when the actor cannot be determined', () => {
      expect(() =>
        recordAudit(EventDefinitionCreatedAuditAction, undefined, tenantId, 'application-events', 'user-registration'),
      ).not.toThrow();
      expect(auditServiceMock.record).not.toHaveBeenCalled();
      expect(loggerMock.warn).toHaveBeenCalledWith(
        expect.stringContaining('event-definition.created'),
        expect.objectContaining({ tenant: tenantId.toString() }),
      );
    });

    it('logs instead of throwing when recording throws', () => {
      auditServiceMock.record.mockImplementationOnce(() => {
        throw new Error('oops');
      });
      expect(() =>
        recordAudit(EventDefinitionCreatedAuditAction, user, tenantId, 'application-events', 'user-registration'),
      ).not.toThrow();
      expect(loggerMock.warn).toHaveBeenCalled();
    });
  });
});
