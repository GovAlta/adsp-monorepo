import { CronJob, CronJobConfig } from './types';
import { ConfigurationService, TenantService, AdspId, TokenProvider, EventService } from '@abgov/adsp-service-sdk';
import { CronJobServiceConfiguration } from './configuration';
import { scheduleJob } from 'node-schedule';
import { Logger } from 'winston';
export interface CronJobService {
  getJobsByTenant(id: AdspId): CronJob[];
  remove(id: AdspId, jobId: string);
  add(tenantId: AdspId, config: CronJobConfig): void;
}
export class CronJobServiceImpl implements CronJobService {
  #cronJobs: Record<string, CronJob[]> = {};
  readonly #configurationService: ConfigurationService;
  readonly #tenantService: TenantService;
  readonly #tokenProvider: TokenProvider;
  readonly #serviceId: AdspId;
  readonly #logger: Logger;
  readonly #eventService: EventService;

  constructor(
    configurationService: ConfigurationService,
    tenantService: TenantService,
    serviceId: AdspId,
    tokenProvider: TokenProvider,
    eventService: EventService,
    logger: Logger,
  ) {
    this.#configurationService = configurationService;
    this.#tenantService = tenantService;
    this.#serviceId = serviceId;
    this.#tokenProvider = tokenProvider;
    this.#logger = logger;
    this.#eventService = eventService;
  }

  private createCronJobEvent(job: CronJob) {
    if (job.triggerEvents) {
      job.triggerEvents.forEach((event) => {
        this.#logger.info(`send event ${event.namespace}:${event.name}`);
        this.#eventService.send({
          tenantId: job.tenantId,
          name: `cron-job-triggered`,
          timestamp: new Date(),
          payload: {
            namespace: event.namespace,
            name: event.name,
            data: event.payload,
          },
        });
      });
    }
  }

  public async load() {
    await this.sync();
    scheduleJob('cron-job-sync', '* * * * *', async () => await this.sync());
  }

  private async checkConfigurationDiff(): Promise<
    Record<string, { added: CronJobConfig[]; removed: CronJob[]; changed: CronJobConfig[] }>
  > {
    const tenants = await this.#tenantService.getTenants();
    const accessToken = await this.#tokenProvider.getAccessToken();
    const diff: Record<string, { added: CronJobConfig[]; removed: CronJob[]; changed: CronJobConfig[] }> = {};

    for (const tenant of tenants) {
      const tenantKey = tenant.id.toString();
      const jobConfigsByTenant = await this.#configurationService.getConfiguration<
        CronJobServiceConfiguration[],
        CronJobServiceConfiguration[]
      >(this.#serviceId, accessToken, tenant.id);

      const latestConfigs: CronJobConfig[] = jobConfigsByTenant?.[0] ? Object.values(jobConfigsByTenant[0]) : [];
      const currentJobs: CronJob[] = this.#cronJobs[tenantKey] ?? [];

      const latestById = new Map(latestConfigs.map((c) => [c.id, c]));
      const currentById = new Map(currentJobs.map((j) => [j.id, j]));

      const added = latestConfigs.filter((c) => !currentById.has(c.id));
      const removed = currentJobs.filter((j) => !latestById.has(j.id));
      const changed = latestConfigs.filter((c) => {
        const current = currentById.get(c.id);
        if (!current) return false;
        return (
          c.schedule !== current.schedule ||
          c.webhook !== current.webhook ||
          JSON.stringify(c.triggerEvents) !== JSON.stringify(current.triggerEvents)
        );
      });

      if (added.length || removed.length || changed.length) {
        this.#logger.info(
          `Configuration diff for tenant ${tenantKey}: ${added.length} added, ${removed.length} removed, ${changed.length} changed`,
        );
        diff[tenantKey] = { added, removed, changed };
      }
    }

    return diff;
  }

  private async sync(): Promise<void> {
    this.#logger.info('Sync started');
    const diff = await this.checkConfigurationDiff();

    for (const [tenantKey, { added, removed, changed }] of Object.entries(diff)) {
      const tenantId = AdspId.parse(tenantKey);

      for (const job of added) {
        this.#logger.info(`Sync: adding job '${job.id}' for tenant ${tenantKey} - ${JSON.stringify(job)}`);
        this.add(tenantId, job);
      }

      for (const job of removed) {
        this.#logger.info(`Sync: removing job '${job.id}' for tenant ${tenantKey}`);
        this.remove(tenantId, job.id);
      }

      for (const job of changed) {
        this.#logger.info(`Sync: updating job '${job.id}' for tenant ${tenantKey} - ${JSON.stringify(job)}`);
        this.remove(tenantId, job.id);
        this.add(tenantId, job);
      }
    }

    this.#logger.info('Sync completed');
  }

  public add(tenantId: AdspId, config: CronJobConfig): void {
    const tenantKey = tenantId.toString();

    if (!this.#cronJobs[tenantKey]) {
      this.#cronJobs[tenantKey] = [];
    }

    if (this.#cronJobs[tenantKey].find((j) => j.id === config.id)) {
      this.#logger.info(`Job with id '${config.id}' already exists for tenant ${tenantKey}`);
      return;
    }

    const job: CronJob = { ...config, isLoaded: false, tenantId };
    const scheduledJob = scheduleJob(config.id, config.schedule, () => {
      this.createCronJobEvent(job);
    });

    job.isLoaded = true;
    job.job = scheduledJob;
    this.#cronJobs[tenantKey].push(job);

    this.#logger.info(`Added cron job '${config.id}' for tenant ${tenantKey} with schedule '${config.schedule}'`);
  }

  public remove(id: AdspId, jobId: string) {
    const tenantKey = id.toString();
    if (tenantKey in this.#cronJobs) {
      const index = this.#cronJobs[tenantKey].findIndex((j) => j.id === jobId);
      if (index !== -1) {
        this.#cronJobs[tenantKey][index].job.cancel();
        this.#cronJobs[tenantKey].splice(index, 1);
      }
    }
  }

  public getJobsByTenant(id: AdspId): CronJob[] {
    const tenantKey = id.toString();
    if (tenantKey in this.#cronJobs) {
      return this.#cronJobs[tenantKey];
    }
    return [];
  }
}
