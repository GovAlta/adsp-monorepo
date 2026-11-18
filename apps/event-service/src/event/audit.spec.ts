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
  toUpdateChangeSet,
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

    it('captures change sets of updates and deletions only', () => {
      expect(
        Object.fromEntries(EventServiceAuditActions.map(({ name, captureChangeSet }) => [name, !!captureChangeSet])),
      ).toEqual({
        'event-definition.created': false,
        'event-definition.updated': true,
        'event-definition.deleted': true,
      });
    });
  });

  describe('toEventDefinitionAuditDetails', () => {
    it('builds details with the definition as the resource', () => {
      expect(
        toEventDefinitionAuditDetails(user, tenantId, 'application-events', 'user-registration', {
          metadata: { namespaceCreated: true },
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
        metadata: { namespace: 'other', name: 'other' },
      });
      expect(details.metadata).toEqual({ namespace: 'application-events', name: 'user-registration' });
    });

    it('includes the change set', () => {
      const changeSet = { before: { description: 'Old' }, after: { description: 'New' } };
      const details = toEventDefinitionAuditDetails(user, tenantId, 'application-events', 'user-registration', {
        changeSet,
      });
      expect(details.changeSet).toEqual(changeSet);
      expect(details.metadata).not.toHaveProperty('changeSetOmitted');
    });

    it('omits a change set over the size limit', () => {
      const details = toEventDefinitionAuditDetails(user, tenantId, 'application-events', 'user-registration', {
        metadata: { namespaceDeleted: false },
        changeSet: { before: { payloadSchema: { description: 'x'.repeat(16 * 1024) } }, after: null },
      });
      expect(details.changeSet).toBeUndefined();
      expect(details.metadata).toEqual({
        namespace: 'application-events',
        name: 'user-registration',
        namespaceDeleted: false,
        changeSetOmitted: true,
      });
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

  describe('toUpdateChangeSet', () => {
    const before = { name: 'user-registration', description: 'Old', payloadSchema: { type: 'object' } };

    it('includes only the changed fields', () => {
      const after = { ...before, description: 'New' };
      expect(toUpdateChangeSet(before, after, ['description'])).toEqual({
        before: { description: 'Old' },
        after: { description: 'New' },
      });
    });

    it('leaves out fields missing on one side', () => {
      const after = { name: before.name, payloadSchema: before.payloadSchema } as unknown as EventDefinition;
      expect(toUpdateChangeSet(before, after, ['description'])).toEqual({
        before: { description: 'Old' },
        after: {},
      });
    });

    it('returns undefined when nothing changed', () => {
      expect(toUpdateChangeSet(before, before, [])).toBeUndefined();
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
        metadata: { namespaceDeleted: true },
      });

      expect(auditServiceMock.record).toHaveBeenCalledWith(
        EventDefinitionDeletedAuditAction,
        toEventDefinitionAuditDetails(user, tenantId, 'application-events', 'user-registration', {
          metadata: { namespaceDeleted: true },
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
