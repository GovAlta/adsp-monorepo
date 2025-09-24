import { AdspId, adspId, ConfigurationService, Tenant, TenantService, TokenProvider } from '@abgov/adsp-service-sdk';

export interface Site {
  url: string;
}

export interface FeedbackSiteService {
  getAllSites: () => Promise<string[]>;
  countAllSites: () => Promise<number>;
  getTenantSites: (tenantIds: AdspId[]) => Promise<string[]>;
  countTenantSites: (tenantIds: AdspId[]) => Promise<number>;
}

export function createFeedbackSiteService(
  tenantService: TenantService,
  tokenProvider: TokenProvider,
  configurationService: ConfigurationService
): FeedbackSiteService {
  return new FeedbackSitesServiceImpl(tenantService, tokenProvider, configurationService);
}

class FeedbackSitesServiceImpl implements FeedbackSiteService {
  constructor(
    private tenantService: TenantService,
    private tokenProvider: TokenProvider,
    private configurationService: ConfigurationService
  ) {}

  getTenantSites = async (tenantIds: AdspId[]): Promise<string[]> => {
    const sites = [];
    for (const tenantId of tenantIds) {
      const tenantSites = await this.configurationService.getConfiguration(
        adspId`urn:ads:platform:feedback-service`,
        await this.tokenProvider.getAccessToken(),
        tenantId
      );
      if (
        tenantSites &&
        typeof tenantSites === 'object' &&
        !Array.isArray(tenantSites) &&
        (tenantSites as { sites?: Record<string, unknown> }).sites
      ) {
        const siteObj = (tenantSites as { sites: Record<string, unknown> }).sites;
        Object.keys(siteObj).forEach((siteUrl: string) => {
          if (siteUrl) {
            sites.push(siteUrl);
          }
        });
      }
    }
    return sites;
  };

  countTenantSites = async (tenantIds: AdspId[]): Promise<number> => {
    const sites = await this.getTenantSites(tenantIds);
    return sites.length;
  };

  getAllSites = async (): Promise<string[]> => {
    const tenants = await this.tenantService.getTenants();
    const ids = tenants.map((tenant: Tenant) => tenant.id);
    return this.getTenantSites(ids);
  };

  countAllSites = async (): Promise<number> => {
    const sites = await this.getAllSites();
    return sites.length;
  };
}
