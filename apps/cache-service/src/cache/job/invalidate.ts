import { ConfigurationService } from '@abgov/adsp-service-sdk';
import { DomainEvent } from '@core-services/core-common';
import { Logger } from 'winston';
import { CacheServiceConfiguration } from '../configuration';

interface InvalidateJobProps {
  logger: Logger;
  configurationService: ConfigurationService;
}

export function createInvalidateJob({ logger, configurationService }: InvalidateJobProps) {
  return async (event: DomainEvent) => {
    try {
      const configuration = await configurationService.getServiceConfiguration<
        CacheServiceConfiguration,
        CacheServiceConfiguration
      >(null, event.tenantId);

      const targets = configuration.getTargets();
      for (const target of targets) {
        await target.processEvent(event);
      }
    } catch (err) {
      logger.warn(
        `Error encountered processing event '${event.namespace}:${event.name}' for cache invalidation: ${err}`,
        {
          context: 'InvalidateJob',
          tenant: event.tenantId.toString(),
        }
      );
    }
  };
}
