import { adspId, AuditService } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
import * as schedule from 'node-schedule';
import { Logger } from 'winston';
import { TenantEntity } from '../models';
import { TenantRepository } from '../repository';
import { RealmService } from '../services/realm';
import { createTenantProvisioningRecoveryJob, scheduleTenantProvisioningRecoveryJob } from './recovery';

jest.mock('node-schedule', () => ({ scheduleJob: jest.fn() }));

describe('createTenantProvisioningRecoveryJob', () => {
  const serviceId = adspId`urn:ads:platform:tenant-service`;
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;
  const auditService = { record: jest.fn() };
  const realmService = { deleteRealm: jest.fn() };
  const repository = {
    find: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  };

  const createEntity = (id: string, status: 'provisioning' | 'active' = 'provisioning') =>
    new TenantEntity(repository as unknown as TenantRepository, {
      id,
      name: `tenant-${id}`,
      realm: `realm-${id}`,
      adminEmail: 'admin@example.ca',
      status,
    });

  const createJob = () =>
    createTenantProvisioningRecoveryJob({
      serviceId,
      logger,
      tenantRepository: repository as unknown as TenantRepository,
      realmService: realmService as unknown as RealmService,
      auditService: auditService as unknown as AuditService,
      staleAfterMinutes: 30,
    });

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-06-30T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('can find tenants still provisioning after the stale threshold', async () => {
    repository.find.mockResolvedValueOnce([]);

    await createJob()();

    expect(repository.find).toHaveBeenCalledWith({
      statusEquals: 'provisioning',
      createdBefore: new Date('2026-06-30T11:30:00Z'),
    });
  });

  it('does nothing and logs nothing when no tenant is stuck', async () => {
    repository.find.mockResolvedValueOnce([]);

    await createJob()();

    expect(realmService.deleteRealm).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('can remove a stuck tenant: its realm, broker client and record', async () => {
    repository.find.mockResolvedValueOnce([createEntity('a')]);
    repository.get.mockResolvedValueOnce(createEntity('a'));
    realmService.deleteRealm.mockResolvedValue(true);
    repository.delete.mockResolvedValue(true);

    await createJob()();

    expect(realmService.deleteRealm).toHaveBeenCalledWith(expect.objectContaining({ realm: 'realm-a' }));
    expect(repository.delete).toHaveBeenCalledWith('a');
    expect(logger.info).toHaveBeenCalledWith('Removed 1 of 1 stuck tenant(s).', expect.anything());
  });

  it('records the creation as failed and the removal, both by the tenant service', async () => {
    repository.find.mockResolvedValueOnce([createEntity('a')]);
    repository.get.mockResolvedValueOnce(createEntity('a'));
    realmService.deleteRealm.mockResolvedValue(true);
    repository.delete.mockResolvedValue(true);

    await createJob()();

    const actor = expect.objectContaining({ actor: expect.objectContaining({ id: serviceId.toString() }) });
    expect(auditService.record).toHaveBeenCalledWith(expect.objectContaining({ name: 'tenant.created' }), actor);
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'tenant.created' }),
      expect.objectContaining({ status: 'failure' }),
    );
    expect(auditService.record).toHaveBeenCalledWith(expect.objectContaining({ name: 'tenant.deleted' }), actor);
  });

  it('leaves a tenant whose provisioning finished after it was found', async () => {
    repository.find.mockResolvedValueOnce([createEntity('a')]);
    repository.get.mockResolvedValueOnce(createEntity('a', 'active'));

    await createJob()();

    expect(realmService.deleteRealm).not.toHaveBeenCalled();
    expect(repository.delete).not.toHaveBeenCalled();
    expect(auditService.record).not.toHaveBeenCalled();
  });

  it('skips a tenant that is already gone when it is read again', async () => {
    repository.find.mockResolvedValueOnce([createEntity('a')]);
    repository.get.mockRejectedValueOnce(new NotFoundError('tenant', 'a'));

    await createJob()();

    expect(realmService.deleteRealm).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('can continue with the next tenant when one fails', async () => {
    repository.find.mockResolvedValueOnce([createEntity('a'), createEntity('b')]);
    repository.get.mockResolvedValueOnce(createEntity('a')).mockResolvedValueOnce(createEntity('b'));
    realmService.deleteRealm.mockRejectedValueOnce(new Error('oh noes')).mockResolvedValueOnce(true);
    repository.delete.mockResolvedValue(true);

    await expect(createJob()()).resolves.toBeUndefined();

    expect(repository.delete).toHaveBeenCalledTimes(1);
    expect(repository.delete).toHaveBeenCalledWith('b');
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('tenant-a'), expect.anything());
    expect(logger.info).toHaveBeenCalledWith('Removed 1 of 2 stuck tenant(s).', expect.anything());
  });

  it('does not count a removal that did not fully complete', async () => {
    repository.find.mockResolvedValueOnce([createEntity('a')]);
    repository.get.mockResolvedValueOnce(createEntity('a'));
    realmService.deleteRealm.mockResolvedValue(false);
    repository.delete.mockResolvedValue(true);

    await createJob()();

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('tenant-a'), expect.anything());
    expect(logger.info).toHaveBeenCalledWith('Removed 0 of 1 stuck tenant(s).', expect.anything());
  });
});

describe('scheduleTenantProvisioningRecoveryJob', () => {
  const serviceId = adspId`urn:ads:platform:tenant-service`;
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const scheduleJob = schedule.scheduleJob as jest.Mock;
  const cron = '*/5 * * * *';

  const scheduleRecovery = (rule = cron) =>
    scheduleTenantProvisioningRecoveryJob({
      serviceId,
      logger: logger as unknown as Logger,
      tenantRepository: {} as unknown as TenantRepository,
      realmService: {} as unknown as RealmService,
      auditService: {} as unknown as AuditService,
      staleAfterMinutes: 30,
      cron: rule,
    });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('can schedule the job in UTC with the cron rule', () => {
    scheduleJob.mockReturnValueOnce({});

    scheduleRecovery();

    expect(scheduleJob).toHaveBeenCalledWith({ rule: cron, tz: 'Etc/UTC' }, expect.any(Function));
    expect(logger.info).toHaveBeenCalledWith(
      `Scheduled tenant provisioning recovery job: ${cron} (UTC), stale after 30 minutes.`,
      expect.anything(),
    );
  });

  it('throws for an invalid schedule', () => {
    scheduleJob.mockReturnValueOnce(null);

    expect(() => scheduleRecovery('not a cron')).toThrow('Invalid tenant provisioning recovery schedule: not a cron');
  });
});
