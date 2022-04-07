import { Logger } from 'winston';
import { NotificationType } from '..';
import { TokenProvider } from '../access';
import { ServiceDirectory } from '../directory';
import { DomainEventDefinition } from '../event';
import { FileType } from '../file';
import { Stream } from '../push';
import { AdspId } from '../utils';
import { ServiceRegistrarImpl } from './registration';

export interface ServiceRole {
  role: string;
  description: string;
  inTenantAdmin?: boolean;
}

export interface ServiceRegistration {
  /** Service ID: ADSP ID of the service. */
  serviceId: AdspId;
  /** Display Name: Human friendly name for the service.. */
  displayName: string;
  /** Description: Description of the service.. */
  description: string;
  /** Roles: Roles for tenant access of the service. */
  roles?: (string | ServiceRole)[];
  /** Configuration Schema: JSON schema for tenant configuration of the service. */
  configurationSchema?: Record<string, unknown>;
  /** Events: Domain events of the service. */
  events?: DomainEventDefinition[];
  /** File Types: File types of the service. */
  fileTypes?: FileType[];
  /** Event Streams: Push mode event streams of the service. */
  eventStreams?: Stream[];
  /** Notifications: Subscribable notification types of the service. */
  notifications?: NotificationType[];
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
