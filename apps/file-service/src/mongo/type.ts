import { AdspId, ConfigurationService, TokenProvider } from '@abgov/adsp-service-sdk';
import { config } from 'dotenv';
import { FileTypeEntity, FileTypeRepository, ServiceConfiguration } from '../file';

export class ConfigurationFileTypeRepository implements FileTypeRepository {
  constructor(
    private serviceId: AdspId,
    private tokenProvider: TokenProvider,
    private configurationService: ConfigurationService
  ) {}

  async getType(tenantId: AdspId, id: string): Promise<FileTypeEntity> {
    const token = await this.tokenProvider.getAccessToken();
    const [configuration] = await this.configurationService.getConfiguration<ServiceConfiguration>(
      this.serviceId,
      token,
      tenantId
    );

    return configuration[id];
  }
}
