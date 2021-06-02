import { ServiceDirectory } from './directory';
import { DomainEventDefinition } from './event';
import { AdspId } from './utils';

export interface ServiceRegistration {
  /** Service ID: ADSP ID of the platform service. */
  serviceId: AdspId;
  /** Display Name: Human friendly name for the platform service.. */
  displayName: string;
  /** Description: Description of the platform service.. */
  description: string;
  /** Roles: Roles for tenant access of the platform service. */
  roles?: string[];
  /** Configuration Schema: JSON schema for tenant configuration of the platform service. */
  configurationSchema?: unknown;
  /** Events: Domain events of the platform service. */
  events?: DomainEventDefinition[];
}

export const registerService = async (
  _directory: ServiceDirectory,
  _registration: ServiceRegistration
): Promise<void> => {
  // TODO: This is a stub for registration of platform service.
  return Promise.resolve();
};
