import { AdspId, ConfigurationService, EventService } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { DirectoryConfiguration } from '../configuration';
import { resourceResolutionFailed } from '../events';
import { ResourceType } from '../model';

interface ResolveJobProps {
  logger: Logger;
  configurationService: ConfigurationService;
  eventService: EventService;
}

export function createResolveJob({ logger, configurationService, eventService }: ResolveJobProps) {
  return async (tenantId: AdspId, urn: AdspId, retryOnError: boolean, done: (err?: Error) => void) => {
    const resource = { tenantId, urn };
    let type: ResourceType;
    try {
      const configuration = await configurationService.getServiceConfiguration<
        DirectoryConfiguration,
        DirectoryConfiguration
      >(null, tenantId);
      type = configuration.getResourceType(urn);

      if (type) {
        logger.debug(`Matched type '${type.type}' to resource ${urn} and resolving...`, {
          context: 'ResolveJob',
          tenant: tenantId.toString(),
        });

        const result = await type.resolve(resource);
        if (result) {
          logger.info(`Resolved resource ${urn} to name '${result.name}' and description '${result.description}'.`, {
            context: 'ResolveJob',
            tenant: tenantId.toString(),
          });
        } else {
          logger.info(
            `Resource ${urn} could not be found on associated API during resolve and was deleted for consistency.`,
            {
              context: 'ResolveJob',
              tenant: tenantId.toString(),
            }
          );
        }
      } else {
        logger.info(`Resource ${urn} did not match any type and will not be resolved.`, {
          context: 'ResolveJob',
          tenant: tenantId.toString(),
        });
      }

      done();
    } catch (err) {
      done(err);

      // If this is the last attempt, then signal a failure event.
      if (!retryOnError) {
        logger.error(`Error encountered resolving resource ${urn}: ${err}`, {
          context: 'ResolveJob',
          tenant: tenantId.toString(),
        });
        eventService.send(resourceResolutionFailed(resource, type?.type, `${err}`));
      }
    }
  };
}
