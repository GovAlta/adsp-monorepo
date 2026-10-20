import { ConfigurationService } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { randomUUID } from 'crypto';
import { createLogger, transports } from 'winston';
import { REPLAY_ACTION, REPLAY_DEFINITION } from '../actions';
import { FailedAuditEvent, ReplayAuditRecord } from '../types';
import { CatalogService } from './catalog';
import { DEFAULT_RETENTION_CLASSES, RetentionService } from './retention';
import { ReplayEventPreparer } from './replay-events';

describe('ReplayEventPreparer', () => {
  const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
  const configuration: jest.Mocked<ConfigurationService> = {
    getConfiguration: jest.fn(),
    getServiceConfiguration: jest.fn(),
    getServiceConfigurationRevision: jest.fn(),
  };
  const catalogs = new CatalogService(configuration, logger);
  const retention = new RetentionService(configuration, logger);
  const preparer = new ReplayEventPreparer(catalogs, retention);
  const tenantId = 'urn:ads:platform:tenant-service:v2:/tenants/case-team';
  const writtenBy = 'urn:ads:platform:audit-service';
  let failed: Omit<FailedAuditEvent, 'event'> & { event: Record<string, unknown> };

  function replayRecord(): ReplayAuditRecord {
    return {
      namespace: 'audit-service',
      writtenBy,
      event: {
        eventId: randomUUID(),
        occurredAt: '2026-10-20T00:00:00Z',
        action: `${REPLAY_ACTION}.succeeded`,
        status: 'success',
        actor: { id: 'administrator', type: 'user', roles: ['audit-admin'] },
        resource: { type: 'failed-event', id: failed.id },
        metadata: { replayedAs: randomUUID() },
      },
    };
  }

  beforeEach(() => {
    const eventId = randomUUID();
    failed = {
      id: randomUUID(),
      tenant_id: tenantId,
      namespace: 'case-service',
      event_id: eventId,
      event: {
        eventId,
        occurredAt: '2020-01-01T00:00:00Z',
        action: 'case.update.succeeded',
        status: 'success',
        actor: { id: 'original-actor', type: 'user', name: 'Case worker', roles: ['case-worker'] },
        resource: { type: 'case', id: 'CASE-1' },
        metadata: { reason: 'resolved' },
        changeSet: { before: { status: 'open' }, after: { status: 'closed' } },
        tenant_id: 'forged',
        namespace: 'forged',
        written_by: 'forged',
      },
      error: 'Previous storage error',
      attempts: 4,
      failed_at: new Date(),
      status: 'open',
      replayed_as: null,
    };
    jest.spyOn(catalogs, 'getCatalog').mockResolvedValue({
      kind: 'actionCatalog',
      application: 'case-service',
      actions: { 'case.update': { ...REPLAY_DEFINITION, resourceType: 'case', captureChangeSet: true } },
    });
    jest.spyOn(retention, 'getClasses').mockResolvedValue(DEFAULT_RETENTION_CLASSES);
  });

  afterEach(() => jest.restoreAllMocks());

  it('accepts old events and preserves the actor while deriving trusted storage fields', async () => {
    const event = await preparer.prepare(failed, writtenBy);

    expect(event).toMatchObject({
      event_id: failed.event_id,
      tenant_id: tenantId,
      namespace: 'case-service',
      written_by: writtenBy,
      action: 'case.update.succeeded',
      action_version: 1,
      actor_id: 'original-actor',
      actor_type: 'user',
      actor_name: 'Case worker',
      actor_roles: ['case-worker'],
      occurred_at: new Date('2020-01-01T00:00:00Z'),
      retention_until: new Date('2020-12-31T00:00:00Z'),
      metadata: { reason: 'resolved' },
      change_set_before: { status: 'open' },
      change_set_after: { status: 'closed' },
    });
    expect(event.id).not.toBe(failed.id);
    expect(catalogs.getCatalog).toHaveBeenCalledWith(
      'case-service',
      expect.objectContaining({ resource: '/tenants/case-team' }),
    );
  });

  it.each([
    { occurredAt: new Date(Date.now() + 3600000).toISOString() },
    { eventId: randomUUID() },
    { eventId: 'not-a-uuid' },
    { actor: { id: 'original-actor' } },
    { action: 'unknown.succeeded' },
    { actionVersion: 99 },
    { resource: { type: 'other', id: 'CASE-1' } },
    { metadata: { privateValue: 'x'.repeat(16 * 1024) } },
    { changeSet: 'invalid change set' },
  ])('rejects invalid stored input without exposing payload (case %#)', async (overrides) => {
    failed.event = { ...failed.event, ...overrides };
    await expect(preparer.prepare(failed, writtenBy)).rejects.toMatchObject({
      message: expect.stringMatching(/^Stored event cannot be replayed \([a-z_]+\)\./),
    });
  });

  it('rejects unknown catalogs and invalid metadata according to current action rules', async () => {
    jest
      .spyOn(catalogs, 'getCatalog')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        kind: 'actionCatalog',
        application: 'case-service',
        actions: {
          'case.update': {
            ...REPLAY_DEFINITION,
            resourceType: 'case',
            metadataSchema: { type: 'object', required: ['ticket'] },
          },
        },
      });
    await expect(preparer.prepare(failed, writtenBy)).rejects.toThrow('(unknown_action)');
    await expect(preparer.prepare(failed, writtenBy)).rejects.toThrow('(invalid_metadata)');
  });

  it('preserves catalog and retention service failures rather than misreporting invalid input', async () => {
    const unavailable = new InvalidOperationError('Configuration unavailable', { statusCode: 503 });
    jest.spyOn(retention, 'getClasses').mockRejectedValue(unavailable);
    await expect(preparer.prepare(failed, writtenBy)).rejects.toBe(unavailable);
  });

  it('builds the self-audit using the registered action definition and audit-service retention', async () => {
    const record = replayRecord();
    jest.spyOn(catalogs, 'getCatalog').mockResolvedValue({
      kind: 'actionCatalog',
      application: 'audit-service',
      actions: {
        [REPLAY_ACTION]: {
          ...REPLAY_DEFINITION,
          version: 2,
          category: 'security',
          severity: 'warning',
          retentionClass: 'security',
        },
      },
    });
    const event = await preparer.prepareAudit(record, tenantId);
    expect(event).toMatchObject({
      namespace: 'audit-service',
      tenant_id: tenantId,
      written_by: writtenBy,
      actor_id: 'administrator',
      action: record.event.action,
      resource_id: failed.id,
      metadata: record.event.metadata,
      action_version: 2,
      category: 'security',
      severity: 'warning',
      retention_class: 'security',
      retention_until: new Date('2027-10-20T00:00:00Z'),
    });
    expect(catalogs.getCatalog).toHaveBeenCalledWith(
      'audit-service',
      expect.objectContaining({ resource: '/tenants/case-team' }),
    );
    expect(retention.getClasses).toHaveBeenCalledWith('audit-service', expect.anything());
  });

  it.each([null, { kind: 'actionCatalog' as const, application: 'audit-service', actions: {} }])(
    'returns a retryable error when the replay action has not been registered (case %#)',
    async (catalog) => {
      jest.spyOn(catalogs, 'getCatalog').mockResolvedValue(catalog);

      await expect(preparer.prepareAudit(replayRecord(), tenantId)).rejects.toMatchObject({
        extra: { statusCode: 503 },
      });
      expect(retention.getClasses).not.toHaveBeenCalled();
    },
  );

  it.each([
    { ...REPLAY_DEFINITION, resourceType: 'other-resource' },
    { ...REPLAY_DEFINITION, metadataSchema: { type: 'object', required: ['missing-field'] } },
  ])('rejects an incompatible configured replay definition instead of falling back (case %#)', async (definition) => {
    jest.spyOn(catalogs, 'getCatalog').mockResolvedValue({
      kind: 'actionCatalog',
      application: 'audit-service',
      actions: { [REPLAY_ACTION]: definition },
    });
    await expect(preparer.prepareAudit(replayRecord(), tenantId)).rejects.toMatchObject({
      extra: { statusCode: 503 },
    });
  });

  it('propagates configuration failures during self-audit preparation', async () => {
    const unavailable = new InvalidOperationError('Configuration unavailable', { statusCode: 503 });
    jest.spyOn(catalogs, 'getCatalog').mockRejectedValue(unavailable);
    await expect(preparer.prepareAudit(replayRecord(), tenantId)).rejects.toBe(unavailable);
  });
});
