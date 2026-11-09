import { adspId, AuditService, resolveRetentionClass, User } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import {
  auditValue,
  ServiceMetricRollupTriggeredAuditAction,
  toDefinitionAuditDetails,
  toRollupAuditDetails,
  ValueAuditActions,
  ValueDefinitionCreatedAuditAction,
  ValueDefinitionDeletedAuditAction,
  ValueDefinitionUpdatedAuditAction,
} from './audit';

describe('value audit', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const user = { id: 'tester', name: 'Tester', tenantId, isCore: false, roles: [] } as User;

  const loggerMock = { warn: jest.fn() } as unknown as Logger;
  const auditServiceMock = { record: jest.fn(), flush: jest.fn() } as unknown as AuditService & {
    record: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    auditServiceMock.record.mockResolvedValue({ status: 'recorded' });
  });

  describe('actions', () => {
    it('registers the four value-service actions', () => {
      expect(ValueAuditActions.map((action) => action.name)).toEqual([
        'value-definition.created',
        'value-definition.updated',
        'value-definition.deleted',
        'value-definition.service-metric-rollup.triggered',
      ]);
    });

    it('classifies definition changes as administrative with compliance retention', () => {
      [ValueDefinitionCreatedAuditAction, ValueDefinitionUpdatedAuditAction, ValueDefinitionDeletedAuditAction].forEach(
        (action) => {
          expect(resolveRetentionClass(action)).toBe('compliance');
          expect(action).toMatchObject({
            category: 'administrative',
            resourceType: 'value-definition',
          });
        },
      );
    });

    it('does not set a retention class on any action, so the audit service derives it from the category', () => {
      expect(ValueAuditActions.filter((action) => 'retentionClass' in action)).toEqual([]);
    });

    it('uses warning severity only for deletion', () => {
      expect(ValueDefinitionDeletedAuditAction.severity).toBe('warning');
      expect(ValueDefinitionCreatedAuditAction.severity).toBe('info');
      expect(ValueDefinitionUpdatedAuditAction.severity).toBe('info');
    });

    it('classifies manual rollup as runtime with standard retention', () => {
      expect(resolveRetentionClass(ServiceMetricRollupTriggeredAuditAction)).toBe('standard');
      expect(ServiceMetricRollupTriggeredAuditAction).toMatchObject({
        category: 'runtime',
        severity: 'info',
        resourceType: 'service-metric-rollup',
      });
    });
  });

  describe('toDefinitionAuditDetails', () => {
    it('identifies the definition by namespace and name', () => {
      expect(toDefinitionAuditDetails('ns', 'def', { changedFields: ['jsonSchema'] })).toEqual({
        resource: { type: 'value-definition', id: 'ns:def' },
        metadata: { changedFields: ['jsonSchema'], namespace: 'ns', name: 'def' },
      });
    });

    it('defaults to namespace and name metadata', () => {
      expect(toDefinitionAuditDetails('ns', 'def').metadata).toEqual({ namespace: 'ns', name: 'def' });
    });
  });

  describe('toRollupAuditDetails', () => {
    it('identifies the rollup by day range', () => {
      expect(toRollupAuditDetails({ start: '2026-08-01', end: '2026-08-03' }, 5, 'tenant-urn')).toEqual({
        resource: { type: 'service-metric-rollup', id: '2026-08-01/2026-08-03' },
        metadata: { start: '2026-08-01', end: '2026-08-03', rollups: 5, tenant: 'tenant-urn' },
      });
    });

    it('omits tenant when not provided', () => {
      expect(toRollupAuditDetails({ start: 'a', end: 'b' }, 0).metadata).not.toHaveProperty('tenant');
    });
  });

  describe('auditValue', () => {
    const details = toDefinitionAuditDetails('ns', 'def');

    it('records the action with actor, resource and metadata', () => {
      auditValue(auditServiceMock, loggerMock, ValueDefinitionCreatedAuditAction, user, tenantId, details);

      expect(auditServiceMock.record).toHaveBeenCalledWith(ValueDefinitionCreatedAuditAction, {
        tenantId,
        actor: expect.objectContaining({ id: 'tester', type: 'user' }),
        resource: details.resource,
        correlationId: 'ns:def',
        metadata: details.metadata,
      });
    });

    it('does not record without a tenant', () => {
      auditValue(auditServiceMock, loggerMock, ValueDefinitionCreatedAuditAction, user, undefined, details);
      expect(auditServiceMock.record).not.toHaveBeenCalled();
    });

    it('logs a warning when recording rejects', async () => {
      auditServiceMock.record.mockRejectedValueOnce(new Error('audit down'));

      expect(() =>
        auditValue(auditServiceMock, loggerMock, ValueDefinitionCreatedAuditAction, user, tenantId, details),
      ).not.toThrow();
      await new Promise(process.nextTick);

      expect(loggerMock.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to record audit event value-definition.created for ns:def'),
        expect.objectContaining({ context: 'value-audit', tenant: tenantId.toString() }),
      );
    });

    it('logs a warning when recording throws synchronously', () => {
      auditServiceMock.record.mockImplementationOnce(() => {
        throw new Error('boom');
      });

      expect(() =>
        auditValue(auditServiceMock, loggerMock, ValueDefinitionDeletedAuditAction, user, tenantId, details),
      ).not.toThrow();
      expect(loggerMock.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to record audit event value-definition.deleted'),
        expect.anything(),
      );
    });
  });
});
