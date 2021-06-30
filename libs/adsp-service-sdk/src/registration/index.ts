import { Logger } from 'winston';
import { TokenProvider } from '../access';
import { ServiceDirectory } from '../directory';
import { DomainEventDefinition } from '../event';
import { AdspId } from '../utils';
import { ServiceRegistrarImpl } from './registration';

export interface ServiceRole {
  role: string;
  description: string;
}

export interface ServiceRegistration {
  /** Service ID: ADSP ID of the platform service. */
  serviceId: AdspId;
  /** Display Name: Human friendly name for the platform service.. */
  displayName: string;
  /** Description: Description of the platform service.. */
  description: string;
  /** Roles: Roles for tenant access of the platform service. */
  roles?: (string | ServiceRole)[];
  /** Configuration Schema: JSON schema for tenant configuration of the platform service. */
  configurationSchema?: Record<string, unknown>;
  /** Events: Domain events of the platform service. */
  events?: DomainEventDefinition[];
}

interface ServiceRegistrarOptions {
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
}

export interface ServiceRegistrar {
  register(registration: ServiceRegistration): Promise<void>;
}

export const createServiceRegistrar = ({
  logger,
  directory,
  tokenProvider,
}: ServiceRegistrarOptions): ServiceRegistrar => {
  return new ServiceRegistrarImpl(logger, directory, tokenProvider);
};
