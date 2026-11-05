import { adspId, AuditService, User } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import {
  auditConfiguration,
  auditConfigurationDefinitions,
  ConfigurationActiveRevisionSetAuditAction,
  ConfigurationAuditActions,
  ConfigurationRevisionCreatedAuditAction,
  ConfigurationUpdatedAuditAction,
} from './audit';

describe('configuration audit', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const user = { id: 'user-1', name: 'tester', roles: ['configuration-admin'] } as User;
  const auditService = { record: jest.fn() } as unknown as jest.Mocked<AuditService>;
  const logger = { warn: jest.fn() } as unknown as Logger;

  beforeEach(() => {
    auditService.record.mockReset();
    auditService.record.mockResolvedValue({ status: 'recorded', eventId: 'event-1' });
  });

  it('captures change set only on configuration and definition update actions', () => {
    expect(ConfigurationAuditActions.filter((a) => a.captureChangeSet).map((a) => a.name)).toEqual([
      'configuration.updated',
      'configuration-definition.created',
      'configuration-definition.updated',
      'configuration-definition.deleted',
    ]);
  });

  describe('definitions', () => {
    const definitions = { namespace: 'platform', name: 'configuration-service', tenantId };

    it('records created, updated, and deleted definitions separately', () => {
      auditConfigurationDefinitions(
        auditService,
        logger,
        user,
        definitions,
        { 'a:kept': { description: 'same' }, 'a:changed': { description: 'old' }, 'a:removed': { description: 'x' } },
        { 'a:kept': { description: 'same' }, 'a:changed': { description: 'new' }, 'a:added': { description: 'y' } },
        'UPDATE'
      );

      const recorded = auditService.record.mock.calls.map(([action, details]) => [
        action.name,
        details.resource,
        details.changeSet,
      ]);
      expect(recorded).toEqual(
        expect.arrayContaining([
          [
            'configuration-definition.created',
            { type: 'configuration-definition', id: 'a:added' },
            { before: null, after: { description: 'y' } },
          ],
          [
            'configuration-definition.updated',
            { type: 'configuration-definition', id: 'a:changed' },
            { before: { description: 'old' }, after: { description: 'new' } },
          ],
          [
            'configuration-definition.deleted',
            { type: 'configuration-definition', id: 'a:removed' },
            { before: { description: 'x' }, after: null },
          ],
        ])
      );
      expect(auditService.record).toHaveBeenCalledTimes(3);
    });

    it('does not audit unchanged definitions or other configuration', () => {
      auditConfigurationDefinitions(auditService, logger, user, definitions, { 'a:b': { x: 1 } }, { 'a:b': { x: 1 } });
      auditConfigurationDefinitions(
        auditService,
        logger,
        user,
        { namespace: 'platform', name: 'other', tenantId },
        {},
        { 'a:b': { x: 1 } }
      );

      expect(auditService.record).not.toHaveBeenCalled();
    });
  });

  it('records the event for the configuration tenant', () => {
    auditConfiguration(
      auditService,
      logger,
      ConfigurationRevisionCreatedAuditAction,
      user,
      { namespace: 'platform', name: 'test', tenantId },
      { operation: 'CREATE-REVISION', metadata: { revision: 2 } }
    );

    expect(auditService.record).toHaveBeenCalledWith(
      ConfigurationRevisionCreatedAuditAction,
      expect.objectContaining({
        tenantId,
        actor: expect.objectContaining({ id: 'user-1', type: 'user' }),
        resource: { type: 'configuration', id: 'platform:test' },
        metadata: { revision: 2, namespace: 'platform', name: 'test', operation: 'CREATE-REVISION' },
      })
    );
  });

  it('does not audit core configuration without a tenant', () => {
    auditConfiguration(auditService, logger, ConfigurationActiveRevisionSetAuditAction, user, {
      namespace: 'platform',
      name: 'test',
      tenantId: undefined,
    });

    expect(auditService.record).not.toHaveBeenCalled();
  });

  it('does not audit writes to the audit-service namespace', () => {
    auditConfiguration(auditService, logger, ConfigurationUpdatedAuditAction, user, {
      namespace: 'audit-service',
      name: 'actions',
      tenantId,
    });

    expect(auditService.record).not.toHaveBeenCalled();
  });

  it('omits a change set over the size limit and flags it', () => {
    const big = { value: 'x'.repeat(17 * 1024) };
    auditConfiguration(
      auditService,
      logger,
      ConfigurationUpdatedAuditAction,
      user,
      { namespace: 'platform', name: 'test', tenantId },
      { changeSet: { before: null, after: big } }
    );

    const details = auditService.record.mock.calls[0][1];
    expect(details.changeSet).toBeUndefined();
    expect(details.metadata.changeSetOmitted).toBe(true);
  });

  it('includes a change set within the size limit', () => {
    const changeSet = { before: { a: 1 }, after: { a: 2 } };
    auditConfiguration(
      auditService,
      logger,
      ConfigurationUpdatedAuditAction,
      user,
      { namespace: 'platform', name: 'test', tenantId },
      { changeSet }
    );

    expect(auditService.record.mock.calls[0][1].changeSet).toEqual(changeSet);
  });

  it('logs when the audit event is not recorded', async () => {
    auditService.record.mockResolvedValue({ status: 'rejected', eventId: 'event-1', code: 'x', reason: 'y' });
    auditConfiguration(auditService, logger, ConfigurationUpdatedAuditAction, user, {
      namespace: 'platform',
      name: 'test',
      tenantId,
    });

    await new Promise(process.nextTick);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('was not recorded'), expect.anything());
  });

  it('does not throw when the actor cannot be resolved', () => {
    expect(() =>
      auditConfiguration(auditService, logger, ConfigurationUpdatedAuditAction, undefined, {
        namespace: 'platform',
        name: 'test',
        tenantId,
      })
    ).not.toThrow();
    expect(logger.warn).toHaveBeenCalled();
  });
});
