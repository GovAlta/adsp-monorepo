import { AdspId, ServiceDirectory, TenantService } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { CacheProvider } from '../cacheProvider';
import { AccessCacheTarget, CacheTarget } from '../model';
import { Target } from '../types';

export interface ConfigurationValue {
  targets: Record<string, Omit<Target, 'serviceId'>>;
}

export class CacheServiceConfiguration {
  private targets: Record<string, CacheTarget>;
  constructor(
    logger: Logger,
    directory: ServiceDirectory,
    tenantService: TenantService,
    provider: CacheProvider,
    configuration: ConfigurationValue,
    tenantId: AdspId
  ) {
    this.targets = Object.entries(configuration?.targets || {}).reduce((targets, [id, value]) => {
      try {
        const target = AccessCacheTarget.isAccessTarget(id)
          ? new AccessCacheTarget(logger, directory, tenantService, provider, tenantId, {
              serviceId: AdspId.parse(id),
              ttl: value.ttl,
              invalidationEvents: value.invalidationEvents,
            })
          : new CacheTarget(logger, directory, provider, tenantId, {
              serviceId: AdspId.parse(id),
              ttl: value.ttl,
              invalidationEvents: value.invalidationEvents,
            });

        targets[id] = target;
      } catch (err) {
        logger.warn(`Error creating cache target from configuration ${id}`, {
          context: 'CacheServiceConfiguration',
          tenantId: tenantId?.toString(),
        });
      }

      return targets;
    }, {} as Record<string, CacheTarget>);
  }

  getTarget(id: string): CacheTarget {
    const target = this.targets[id];

    return target;
  }

  getTargets(): CacheTarget[] {
    return Object.values(this.targets);
  }
}
