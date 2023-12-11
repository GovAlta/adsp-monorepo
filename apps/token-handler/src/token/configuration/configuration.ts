import { AdspId, ServiceDirectory } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';

import { AuthenticationClient } from '../model';
import { ClientCredentialRepository } from '../repository';
import { Client, Target } from '../types';

interface TokenHandlerConfigurationObject {
  clients?: Record<
    string,
    Omit<Client, 'tenantId' | 'targets'> & { targets: Record<string, Omit<Target, 'upstream'> & { upstream: string }> }
  >;
}

export class TokenHandlerConfiguration {
  private clients: Record<string, AuthenticationClient>;

  constructor(
    accessServiceUrl: URL,
    logger: Logger,
    directory: ServiceDirectory,
    repository: ClientCredentialRepository,
    tenantId: AdspId,
    { clients }: TokenHandlerConfigurationObject
  ) {
    this.clients = Object.entries(clients || {}).reduce((clients, [id, client]) => {
      const clientRecord = {
        ...client,
        id,
        tenantId,
        targets: Object.entries(client.targets || {}).reduce(
          (targets, [targetId, target]) => ({
            ...targets,
            [targetId]: { id: targetId, upstream: AdspId.parse(target.upstream) },
          }),
          {}
        ),
      };
      return {
        ...clients,
        [id]: new AuthenticationClient(accessServiceUrl, logger, directory, repository, clientRecord),
      };
    }, {});
  }

  public getClient(clientId: string): AuthenticationClient {
    return this.clients[clientId];
  }
}
