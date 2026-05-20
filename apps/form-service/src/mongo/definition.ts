import { AdspId, ConfigurationService } from '@abgov/adsp-service-sdk';
import { FormDefinitionEntity, FormDefinitionRepository } from '../form';
import { Logger } from 'winston';
import { getVersionFromDefinitionId } from './helpers';

export class ConfigurationFormDefinitionRepository implements FormDefinitionRepository {
  constructor(
    private logger: Logger,
    private configurationService: ConfigurationService,
  ) {}

  // clean-code-ignore: 2.10 - Keeping this orchestration inline is more readable than extracting one-line private helpers.
  async getDefinition(tenantId: AdspId, id: string): Promise<FormDefinitionEntity> {
    const definitionIdWithoutVersion = id.replace(/-v\d+$/, '');
    const definitionVersion = getVersionFromDefinitionId(id);

    // clean-code-ignore: 2.9
    const [definition] = await this.configurationService.getServiceConfiguration<FormDefinitionEntity>(
      definitionIdWithoutVersion,
      tenantId,
    );

    if (!definition) {
      this.logger.warn(`Definition with ID '${id}' could not be found.`, {
        context: 'FormDefinitionRepository',
        tenant: tenantId?.toString(),
      });
    }
    if (definitionVersion !== undefined && definitionVersion !== null) {
      // clean-code-ignore: 2.11 -I think i need the line below, or it complains
      // clean-code-ignore: 2.18 - FormDefinitionEntity is a class instance; preserve methods/services on the returned entity.
      definition.version = definitionVersion;
    }

    return definition;
  }
}
