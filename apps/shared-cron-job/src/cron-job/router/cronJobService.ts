import { CronJob, CronJobConfig } from '../types';
import { ConfigurationService, TenantService, AdspId, TokenProvider } from '@abgov/adsp-service-sdk';
import { CronJobServiceConfiguration } from '../configuration';
import { Job, scheduleJob } from 'node-schedule';

export interface CronJobService {
  getJobsByTenant(id: AdspId): CronJob[];
}

export class CronJobServiceImpl implements CronJobService {
  static #cronJobs: CronJob[] = [];
  readonly #configurationService: ConfigurationService;
  readonly #tenantService: TenantService;
  readonly #tokenProvider: TokenProvider;
  readonly #serviceId: AdspId;

  constructor(
    configurationService: ConfigurationService,
    tenantService: TenantService,
    serviceId: AdspId,
    tokenProvider: TokenProvider,
  ) {
    this.#configurationService = configurationService;
    this.#tenantService = tenantService;
    this.#serviceId = serviceId;
    this.#tokenProvider = tokenProvider;
  }

  public async load() {
    const tenants = await this.#tenantService.getTenants();
    const accessToken = await this.#tokenProvider.getAccessToken();
    const getCronJobsPromises = tenants.map(async (tenant) => {
      return await this.#configurationService.getConfiguration<
        CronJobServiceConfiguration,
        CronJobServiceConfiguration
      >(this.#serviceId, accessToken, tenant.id);
    });

    const cronJobConfigs = await Promise.all(getCronJobsPromises);

    // for (const job of cronJobConfigs) {
    // }
  }

  public getJobsByTenant(id: AdspId): CronJob[] {
    return this.#cronJobs.filter((job) => job.tenantId === id);
  }
}
