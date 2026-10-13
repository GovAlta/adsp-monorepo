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

type ClientConfigurations = NonNullable<TokenHandlerConfigurationObject['clients']>;

/**
 * Combines the clients of a tenant with the clients of the core configuration, which are provided to all tenants.
 * A client of the core configuration is used instead of a tenant client with the same ID, so that a tenant cannot
 * change or replace it.
 */
export function combineClients(tenant?: ClientConfigurations, core?: ClientConfigurations): ClientConfigurations {
  const mark = (clients: ClientConfigurations, isCore: boolean): ClientConfigurations =>
    Object.fromEntries(Object.entries(clients || {}).map(([id, client]) => [id, { ...client, core: isCore }]));

  return { ...mark(tenant, false), ...mark(core, true) };
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

  public getClients(): AuthenticationClient[] {
    return Object.values(this.clients);
  }

  public getClient(clientId: string): AuthenticationClient {
    return this.clients[clientId];
  }
}
