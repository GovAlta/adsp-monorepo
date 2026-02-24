import { CronJob, CronJobConfig } from '../types';
import { ConfigurationService, TenantService, AdspId, TokenProvider } from '@abgov/adsp-service-sdk';
import { CronJobServiceConfiguration } from '../configuration';
import { scheduleJob } from 'node-schedule';
import { Logger } from 'winston';
export interface CronJobService {
  // getJobsByTenant(id: AdspId): CronJob[];
}

type JobByTenants = Record<string, CronJob[]>;
export class CronJobServiceImpl implements CronJobService {
  #cronJobs: JobByTenants = {};
  readonly #configurationService: ConfigurationService;
  readonly #tenantService: TenantService;
  readonly #tokenProvider: TokenProvider;
  readonly #serviceId: AdspId;
  readonly #logger: Logger;

  constructor(
    configurationService: ConfigurationService,
    tenantService: TenantService,
    serviceId: AdspId,
    tokenProvider: TokenProvider,
    logger: Logger,
  ) {
    this.#configurationService = configurationService;
    this.#tenantService = tenantService;
    this.#serviceId = serviceId;
    this.#tokenProvider = tokenProvider;
    this.#logger = logger;
  }

  public async load() {
    // const tenants = await this.#tenantService.getTenants();
    // const accessToken = await this.#tokenProvider.getAccessToken();
    // const getCronJobsPromises = tenants.map(async (tenant) => {
    //   const jobConfigsByTenant = await this.#configurationService.getConfiguration<
    //     CronJobServiceConfiguration,
    //     CronJobServiceConfiguration
    //   >(this.#serviceId, accessToken, tenant.id);
    // });
    // const jobsByTenants = await Promise.all(getCronJobsPromises);
    // for (const jobByTenant of jobsByTenants) {
    //   for (const job of jobByTenant) {
    //     const scheduledJob = scheduleJob(job.name, job?.schedule, () => {
    //       this.#logger.info(`Start to load job ${job.name} for tenant: ${job}`);
    //     });
    //   }
    // }
  }

  // public getJobsByTenant(id: AdspId): CronJob[] {
  //   return this.#cronJobs.filter((job) => job.tenantId === id);
  // }
}
