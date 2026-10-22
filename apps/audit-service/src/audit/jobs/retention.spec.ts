jest.mock('node-schedule', () => ({ scheduleJob: jest.fn() }));

import { adspId, ConfigurationService } from '@abgov/adsp-service-sdk';
import * as schedule from 'node-schedule';
import { createLogger, transports } from 'winston';
import { CatalogService, RetentionService } from '../model';
import {
  RETENTION_ACTION,
  RETENTION_DEFINITION,
  RetentionJob,
  RetentionRepository,
  scheduleRetentionJob,
} from './retention';

describe('tenant retention job', () => {
  const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
  const serviceId = adspId`urn:ads:platform:audit-service`;
  const tenantId = 'urn:ads:platform:tenant-service:v2:/tenants/case-team';
  const otherTenant = 'urn:ads:platform:tenant-service:v2:/tenants/payment-team';
  const configuration: jest.Mocked<ConfigurationService> = {
    getConfiguration: jest.fn(),
    getServiceConfiguration: jest.fn(),
    getServiceConfigurationRevision: jest.fn(),
  };
  const repository: jest.Mocked<RetentionRepository> = { getTenantIds: jest.fn(), run: jest.fn() };
  const job = new RetentionJob(
    repository,
    new CatalogService(configuration, logger),
    new RetentionService(configuration, logger),
    serviceId,
    logger,
    { batchSize: 100, maxBatches: 3 },
  );

  beforeEach(() => {
    jest.resetAllMocks();
    repository.getTenantIds.mockResolvedValue([tenantId]);
    repository.run.mockResolvedValue({ deletedCount: 0, batches: 1 });
    configuration.getServiceConfiguration.mockImplementation(async (name) =>
      name.startsWith('actions-')
        ? {
            kind: 'actionCatalog',
            application: 'audit-service',
            actions: { [RETENTION_ACTION]: RETENTION_DEFINITION },
          }
        : null,
    );
  });

  it('records a successful cleanup as the service in its tenant, including zero deletions', async () => {
    await job.run();
    const [tenant, cutoff, options, audit] = repository.run.mock.calls[0];

    expect({ tenant, options }).toEqual({ tenant: tenantId, options: { batchSize: 100, maxBatches: 3 } });
    expect(audit({ deletedCount: 0, batches: 1 })).toMatchObject({
      tenant_id: tenantId,
      namespace: 'audit-service',
      action: 'retention.run.succeeded',
      status: 'success',
      actor_type: 'system',
      written_by: serviceId.toString(),
      metadata: { deletedCount: 0, batches: 1, cutoff: cutoff.toISOString() },
    });
  });

  it('records partial failure counts and rejects for job instrumentation', async () => {
    const result = { deletedCount: 100, batches: 1, error: 'Audit database operation failed (57014).' };
    repository.run.mockResolvedValue(result);

    await expect(job.run()).rejects.toThrow('Retention failed for 1 tenant(s).');
    expect(repository.run.mock.calls[0][3](result)).toMatchObject({
      action: 'retention.run.failed',
      status: 'failure',
      metadata: result,
    });
  });

  it('does not delete before the retention audit action is available', async () => {
    configuration.getServiceConfiguration.mockResolvedValue(null);

    await expect(job.run()).rejects.toThrow('Retention failed');
    expect(repository.run).not.toHaveBeenCalled();
  });

  it('continues other tenants after a failed tenant run', async () => {
    repository.getTenantIds.mockResolvedValue([tenantId, otherTenant]);
    repository.run.mockRejectedValueOnce(new Error('Connection unavailable'));

    await expect(job.run()).rejects.toThrow('Retention failed for 1 tenant(s).');
    expect(repository.run.mock.calls.map(([tenant]) => tenant)).toEqual([tenantId, otherTenant]);
  });

  it('skips a lock loser without recording a cleanup', async () => {
    repository.run.mockResolvedValue(null);

    await expect(job.run()).resolves.toBeUndefined();
  });

  it('stops before starting more tenants during shutdown', async () => {
    await job.run(() => true);

    expect(repository.run).not.toHaveBeenCalled();
  });

  it('does not require synthetic tenant context when no audit data exists', async () => {
    repository.getTenantIds.mockResolvedValue([]);

    await job.run();

    expect(repository.run).not.toHaveBeenCalled();
  });

  it('uses the tenant retention override for its own run event', async () => {
    configuration.getServiceConfiguration
      .mockResolvedValueOnce({
        kind: 'actionCatalog',
        application: 'audit-service',
        actions: { [RETENTION_ACTION]: RETENTION_DEFINITION },
      })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        kind: 'applicationRetentionSettings',
        application: 'audit-service',
        classes: { compliance: { days: 730 } },
      });

    await job.run();
    const audit = repository.run.mock.calls[0][3]({ deletedCount: 1, batches: 1 });

    expect(audit.retention_until.getTime() - audit.occurred_at.getTime()).toBe(730 * 86400000);
  });

  it.each([
    { batchSize: 0, maxBatches: 1 },
    { batchSize: 1, maxBatches: 0 },
    { batchSize: 1.5, maxBatches: 1 },
  ])('refuses invalid batch bounds %j', (options) => {
    expect(
      () =>
        new RetentionJob(
          repository,
          new CatalogService(configuration, logger),
          new RetentionService(configuration, logger),
          serviceId,
          logger,
          options,
        ),
    ).toThrow('positive integers');
  });

  describe('scheduling lifecycle', () => {
    const cancel = jest.fn();
    beforeEach(() => {
      jest.mocked(schedule.scheduleJob).mockReturnValue({ cancel } as Pick<schedule.Job, 'cancel'> as schedule.Job);
    });

    it('schedules in UTC and cancels on shutdown', async () => {
      const control = scheduleRetentionJob(job, '0 2 * * *', logger);

      await control.stop();

      expect(schedule.scheduleJob).toHaveBeenCalledWith({ rule: '0 2 * * *', tz: 'Etc/UTC' }, expect.any(Function));
      expect(cancel).toHaveBeenCalled();
    });

    it('refuses an invalid cron expression', () => {
      jest.mocked(schedule.scheduleJob).mockReturnValue(null);

      expect(() => scheduleRetentionJob(job, 'invalid', logger)).toThrow('Invalid audit retention schedule');
    });

    it('prevents local overlap and waits for the active run before stopping', async () => {
      let finish: () => void;
      const running = jest.spyOn(job, 'run').mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            finish = resolve;
          }),
      );
      const control = scheduleRetentionJob(job, '0 2 * * *', logger);
      const callback = jest.mocked(schedule.scheduleJob).mock.calls[0][1] as () => Promise<void>;
      const first = callback();
      await callback();
      const stopped = jest.fn();
      const closing = control.stop().then(stopped);

      expect(running).toHaveBeenCalledTimes(1);
      expect(stopped).not.toHaveBeenCalled();
      finish();
      await Promise.all([first, closing]);
      await callback();
      expect(running).toHaveBeenCalledTimes(1);
      running.mockRestore();
    });
  });
});
