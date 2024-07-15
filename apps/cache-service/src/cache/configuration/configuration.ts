import { AdspId, ServiceDirectory } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { CacheProvider } from '../cacheProvider';
import { CacheTarget } from '../model';

export interface ConfigurationValue {
  targets: Record<string, { ttl?: number }>;
}

const DEFAULT_TTL = 15 * 60;

export class CacheServiceConfiguration {
  private targets: Record<string, CacheTarget>;
  constructor(
    logger: Logger,
    directory: ServiceDirectory,
    provider: CacheProvider,
    configuration: ConfigurationValue,
    tenantId: AdspId
  ) {
    this.targets = Object.entries(configuration?.targets || {}).reduce((targets, [id, value]) => {
      try {
        const target = new CacheTarget(logger, directory, provider, tenantId, {
          serviceId: AdspId.parse(id),
          ttl: value.ttl || DEFAULT_TTL,
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
}
