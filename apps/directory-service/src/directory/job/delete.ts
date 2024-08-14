import { ConfigurationService } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { DirectoryConfiguration } from '../configuration';
import { DomainEvent } from '@core-services/core-common';

interface DeleteJobProps {
  logger: Logger;
  configurationService: ConfigurationService;
}

export function createDeleteJob({ logger, configurationService }: DeleteJobProps) {
  return async (event: DomainEvent, done: (err?: Error) => void) => {
    const { tenantId, namespace, name } = event;
    try {
      const configuration = await configurationService.getServiceConfiguration<
        DirectoryConfiguration,
        DirectoryConfiguration
      >(null, tenantId);

      const type = configuration.getResourceTypeForDeleteEvent(event);
      if (type) {
        logger.debug(`Processing event '${namespace}:${name}' for delete of resource of type ${type.type}...`, {
          context: 'DeleteJob',
          tenant: tenantId.toString(),
        });

        const deleted = await type.processDeleteEvent(event);
        logger.info(
          `Processed event '${namespace}:${name}' for delete of resource of type ${type.type} and deleted: ${deleted}`,
          {
            context: 'DeleteJob',
            tenant: tenantId.toString(),
          }
        );
      }

      done();
    } catch (err) {
      done(err);

      logger.warn(`Error encountered processing delete of resource on event '${namespace}:${name}' : ${err}`, {
        context: 'DeleteJob',
        tenant: tenantId?.toString(),
      });
    }
  };
}
