import { adspId, AuditService, EventService } from '@abgov/adsp-service-sdk';
import * as schedule from 'node-schedule';
import { Logger } from 'winston';
import { TenantEntity } from '../models';
import { TenantRepository } from '../repository';
import { RealmService } from '../services/realm';
import { createTenantPurgeJob, scheduleTenantPurgeJob } from './purge';

jest.mock('node-schedule', () => ({ scheduleJob: jest.fn() }));

describe('createTenantPurgeJob', () => {
  const serviceId = adspId`urn:ads:platform:tenant-service`;
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;
  const eventService = { send: jest.fn() };
  const auditService = { record: jest.fn() };
  const realmService = { deleteRealm: jest.fn() };
  const repository = {
    find: jest.fn(),
    delete: jest.fn(),
  };

  const createEntity = (id: string) =>
    new TenantEntity(repository as unknown as TenantRepository, {
      id,
      name: `tenant-${id}`,
      realm: `realm-${id}`,
      adminEmail: 'admin@example.ca',
      status: 'archived',
      deletedAt: new Date('2026-01-01'),
    });

  const createJob = () =>
    createTenantPurgeJob({
      serviceId,
      logger,
      tenantRepository: repository as unknown as TenantRepository,
      realmService: realmService as unknown as RealmService,
      eventService: eventService as unknown as EventService,
      auditService: auditService as unknown as AuditService,
      retentionDays: 30,
    });

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-06-30T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('can find archived tenants older than the retention period', async () => {
    repository.find.mockResolvedValueOnce([]);

    await createJob()();

    expect(repository.find).toHaveBeenCalledWith({
      statusEquals: 'archived',
      deletedBefore: new Date('2026-05-31T00:00:00Z'),
    });
  });

  it('can purge expired tenants and signal tenant-deleted', async () => {
    repository.find.mockResolvedValueOnce([createEntity('a'), createEntity('b')]);
    realmService.deleteRealm.mockResolvedValue(true);
    repository.delete.mockResolvedValue(true);

    await createJob()();

    expect(realmService.deleteRealm).toHaveBeenCalledTimes(2);
    expect(repository.delete).toHaveBeenCalledWith('a');
    expect(repository.delete).toHaveBeenCalledWith('b');
    expect(eventService.send).toHaveBeenCalledTimes(2);
    expect(eventService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'tenant-deleted',
        payload: expect.objectContaining({ deletedBy: expect.objectContaining({ id: serviceId.toString() }) }),
      }),
    );
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('can continue purging when a tenant fails', async () => {
    repository.find.mockResolvedValueOnce([createEntity('a'), createEntity('b')]);
    realmService.deleteRealm.mockRejectedValueOnce(new Error('oh noes')).mockResolvedValueOnce(true);
    repository.delete.mockResolvedValue(true);

    await expect(createJob()()).resolves.toBeUndefined();

    expect(repository.delete).toHaveBeenCalledTimes(1);
    expect(repository.delete).toHaveBeenCalledWith('b');
    expect(eventService.send).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('tenant-a'), expect.anything());
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('does not signal tenant-deleted when the record is not deleted', async () => {
    repository.find.mockResolvedValueOnce([createEntity('a')]);
    realmService.deleteRealm.mockResolvedValue(true);
    repository.delete.mockResolvedValue(false);

    await createJob()();

    expect(eventService.send).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('does not remove any tenant when none have expired', async () => {
    repository.find.mockResolvedValueOnce([]);

    await createJob()();

    expect(realmService.deleteRealm).not.toHaveBeenCalled();
  });

  it('records an audit event for each purged tenant', async () => {
    repository.find.mockResolvedValueOnce([createEntity('a')]);
    realmService.deleteRealm.mockResolvedValue(true);
    repository.delete.mockResolvedValue(true);

    await createJob()();

    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'tenant.deleted' }),
      expect.objectContaining({ actor: expect.objectContaining({ id: serviceId.toString() }) }),
    );
  });

  it('logs the number of purged tenants', async () => {
    repository.find.mockResolvedValueOnce([createEntity('a'), createEntity('b')]);
    realmService.deleteRealm.mockResolvedValue(true);
    repository.delete.mockResolvedValue(true);

    await createJob()();

    expect(logger.info).toHaveBeenCalledWith('Purged 2 of 2 tenant(s).', expect.anything());
  });

  it('does not count a partially completed purge as purged', async () => {
    repository.find.mockResolvedValueOnce([createEntity('a')]);
    realmService.deleteRealm.mockResolvedValue(false);
    repository.delete.mockResolvedValue(true);

    await createJob()();

    expect(logger.info).toHaveBeenCalledWith('Purged 0 of 1 tenant(s).', expect.anything());
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('can propagate an error when finding expired tenants fails', async () => {
    repository.find.mockRejectedValueOnce(new Error('oh noes'));

    await expect(createJob()()).rejects.toThrow('oh noes');
  });
});

describe('scheduleTenantPurgeJob', () => {
  const serviceId = adspId`urn:ads:platform:tenant-service`;
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const scheduleJob = schedule.scheduleJob as jest.Mock;
  const cron = '0 2 * * *';

  const schedulePurge = (rule = cron) =>
    scheduleTenantPurgeJob({
      serviceId,
      logger: logger as unknown as Logger,
      tenantRepository: {} as unknown as TenantRepository,
      realmService: {} as unknown as RealmService,
      eventService: {} as unknown as EventService,
      auditService: {} as unknown as AuditService,
      retentionDays: 30,
      cron: rule,
    });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('can schedule the job in UTC with the cron rule', () => {
    scheduleJob.mockReturnValueOnce({});

    schedulePurge();

    expect(scheduleJob).toHaveBeenCalledWith({ rule: cron, tz: 'Etc/UTC' }, expect.any(Function));
  });

  it('returns the scheduled job', () => {
    const job = { name: 'tenant-purge' };
    scheduleJob.mockReturnValueOnce(job);

    const result = schedulePurge();

    expect(result).toBe(job);
  });

  it('logs the schedule when the job is scheduled', () => {
    scheduleJob.mockReturnValueOnce({});

    schedulePurge();

    expect(logger.info).toHaveBeenCalledWith(`Scheduled tenant purge job: ${cron} (UTC).`, expect.anything());
  });

  it('throws when the cron rule is invalid', () => {
    scheduleJob.mockReturnValueOnce(null);

    expect(() => schedulePurge('not-a-cron')).toThrow('Invalid tenant purge schedule: not-a-cron');
  });
});
