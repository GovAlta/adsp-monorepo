import { AdspId, ConfigurationService, TokenProvider } from '@abgov/adsp-service-sdk';
import { FormDefinitionEntity, FormDefinitionRepository } from '../form';

export class ConfigurationFormDefinitionRepository implements FormDefinitionRepository {
  constructor(
    private serviceId: AdspId,
    private tokenProvider: TokenProvider,
    private configurationService: ConfigurationService
  ) {}

  async getDefinition(tenantId: AdspId, id: string): Promise<FormDefinitionEntity> {
    const token = await this.tokenProvider.getAccessToken();
    const [configuration] = await this.configurationService.getConfiguration<Record<string, FormDefinitionEntity>>(
      this.serviceId,
      token,
      tenantId
    );

    return configuration[id];
  }
}
