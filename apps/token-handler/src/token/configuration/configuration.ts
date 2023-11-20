import { AdspId, ServiceDirectory } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';

import { AuthenticationClient, TargetProxy } from '../model';
import { ClientCredentialRepository } from '../repository';
import { Client, Target } from '../types';

interface TokenHandlerConfigurationObject {
  clients?: Record<string, Omit<Client, 'tenantId'>>;
  targets?: Record<string, Omit<Target, 'upstream'> & { upstream: string }>;
}

export class TokenHandlerConfiguration {
  private clients: Record<string, AuthenticationClient>;
  private targets: Record<string, TargetProxy>;

  constructor(
    accessServiceUrl: URL,
    logger: Logger,
    directory: ServiceDirectory,
    repository: ClientCredentialRepository,
    tenantId: AdspId,
    { clients, targets }: TokenHandlerConfigurationObject
  ) {
    this.clients = Object.entries(clients || {}).reduce(
      (clients, [id, client]) => ({
        ...clients,
        [id]: new AuthenticationClient(accessServiceUrl, logger, repository, { ...client, tenantId }),
      }),
      {}
    );
    this.targets = Object.entries(targets || {}).reduce((targets, [id, target]) => {
      try {
        targets[id] = new TargetProxy(this, directory, { ...target, upstream: AdspId.parse(target.upstream) });
      } catch (err) {
        // Bad upstream value.
      }
      return targets;
    }, {});
  }

  public getClient(clientId: string): AuthenticationClient {
    return this.clients[clientId];
  }

  public getTarget(targetId: string): Target {
    return this.targets[targetId];
  }
}
