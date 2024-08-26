import { AdspId, ConfigurationService } from '@abgov/adsp-service-sdk';
import { FormDefinitionEntity, FormDefinitionRepository } from '../form';
import { Logger } from 'winston';

export class ConfigurationFormDefinitionRepository implements FormDefinitionRepository {
  constructor(private logger: Logger, private configurationService: ConfigurationService) {}

  async getDefinition(tenantId: AdspId, id: string): Promise<FormDefinitionEntity> {
    const [definition] = await this.configurationService.getServiceConfiguration<FormDefinitionEntity>(id, tenantId);

    if (!definition) {
      this.logger.warn(`Definition with ID '${id}' could not be found.`, {
        context: 'FormDefinitionRepository',
        tenant: tenantId?.toString(),
      });
    }

    return definition;
  }
}
