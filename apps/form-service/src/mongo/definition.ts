import { AdspId, ConfigurationService } from '@abgov/adsp-service-sdk';
import { FormDefinitionEntity, FormDefinitionRepository } from '../form';
import { Logger } from 'winston';
import { getVersionFromDefinitionId } from './helpers';

export class ConfigurationFormDefinitionRepository implements FormDefinitionRepository {
  constructor(
    private logger: Logger,
    private configurationService: ConfigurationService,
  ) {}

  async getDefinition(tenantId: AdspId, id: string): Promise<FormDefinitionEntity> {
    const baseDefinitionId = id.replace(/-v\d+$/, '');
    const version = getVersionFromDefinitionId(id);

    // clean-code-ignore: 2.9
    const [definition] = await this.configurationService.getServiceConfiguration<FormDefinitionEntity>(
      baseDefinitionId,
      tenantId,
    );

    if (!definition) {
      this.logger.warn(`Definition with ID '${id}' could not be found.`, {
        context: 'FormDefinitionRepository',
        tenant: tenantId?.toString(),
      });
    }
    if (version !== undefined && version !== null) {
      // clean-code-ignore: 2.18 - FormDefinitionEntity is a class instance; preserve methods/services on the returned entity.
      definition.version = version;
    }

    return definition;
  }
}
