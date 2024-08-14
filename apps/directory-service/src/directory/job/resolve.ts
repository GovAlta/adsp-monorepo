import { AdspId, ConfigurationService } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { DirectoryConfiguration } from '../configuration';

interface ResolveJobProps {
  logger: Logger;
  configurationService: ConfigurationService;
}

export function createResolveJob({ logger, configurationService }: ResolveJobProps) {
  return async (tenantId: AdspId, urn: AdspId, done: (err?: Error) => void) => {
    try {
      const configuration = await configurationService.getServiceConfiguration<
        DirectoryConfiguration,
        DirectoryConfiguration
      >(null, tenantId);
      const type = configuration.getResourceType(urn);

      if (type) {
        logger.debug(`Matched type '${type.type}' to resource ${urn} and resolving...`, {
          context: 'ResolveJob',
          tenant: tenantId.toString(),
        });

        const result = await type.resolve({ tenantId, urn });

        logger.info(`Resolved resource ${urn} to name '${result.name}' and description '${result.description}'.`, {
          context: 'ResolveJob',
          tenant: tenantId.toString(),
        });
      } else {
        logger.info(`Resource ${urn} did not match any type and will not be resolved.`, {
          context: 'ResolveJob',
          tenant: tenantId.toString(),
        });
      }

      done();
    } catch (err) {
      done(err);

      logger.warn(`Error encountered resolving resource ${urn}: ${err}`, {
        context: 'ResolveJob',
        tenant: tenantId.toString(),
      });
    }
  };
}
