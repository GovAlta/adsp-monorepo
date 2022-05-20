import { Logger } from 'winston';
import { NotificationType } from '..';
import { TokenProvider } from '../access';
import { ServiceDirectory } from '../directory';
import { DomainEventDefinition } from '../event';
import { FileType } from '../file';
import { Stream } from '../push';
import { AdspId } from '../utils';
import { ValueDefinition } from '../value';
import { ServiceRegistrarImpl } from './registration';

export interface ServiceRole {
  role: string;
  description: string;
  inTenantAdmin?: boolean;
}

export interface ServiceRegistration {
  /** Service ID: ADSP ID of the service. */

  /**
   * Service ID: ADSP ID of the service.
   *
   * The service ID is an ADSP URN that uniquely identifies the service being registered.
   * Associated configuration will be stored against the namespace and service in the URN.
   *
   * This value is also used as the client ID for the service.
   *
   * @type {AdspId}
   * @memberof ServiceRegistration
   */
  serviceId: AdspId;
  /**
   * Display name: Human friendly name for the service.
   *
   * @type {string}
   * @memberof ServiceRegistration
   */
  displayName: string;
  /**
   * Description: Description of the service.
   *
   * @type {string}
   * @memberof ServiceRegistration
   */
  description: string;
  /**
   * Roles: Service roles that control access into the service capabilities.
   *
   * For platform services, these roles are automatically created under the service client
   * when a new tenant is created.
   *
   * @type {((string | ServiceRole)[])}
   * @memberof ServiceRegistration
   */
  roles?: (string | ServiceRole)[];
  /**
   * Configuration schema: JSON schema for configuration of the service.
   *
   * The configuration schema provides a write schema for service configuration in the
   * configuration service. Service associated configuration is stored at namespace and
   * (service) name.
   *
   * @type {Record<string, unknown>}
   * @memberof ServiceRegistration
   */
  configurationSchema?: Record<string, unknown>;
  /**
   * Events: Definitions of domain events of the service.
   *
   * Domain events represent domain significant occurrences like state transitions.
   * Events are recorded to the event log and can trigger side effects such as notifications.
   *
   * @type {DomainEventDefinition[]}
   * @memberof ServiceRegistration
   */
  events?: DomainEventDefinition[];
  /**
   * Event streams: Push mode event streams of the service.
   *
   * Streams make sets of events available over push mode endpoints in push service.
   * Clients can connect to streams over socket.io or Server side events (SSE).
   *
   * @type {Stream[]}
   * @memberof ServiceRegistration
   */
  eventStreams?: Stream[];
  /**
   * File types: File types of the service.
   *
   * File types represent sets of files with specific access rules; i.e. the roles allowed to
   * upload and download the files of the type.
   *
   * @type {FileType[]}
   * @memberof ServiceRegistration
   */
  fileTypes?: FileType[];
  /**
   * Notifications: Subscribable notification types of the service.
   *
   * Notification types represent subscribable collection of notifications. Each type can include
   * multiple notifications with their own templates and triggered by specific events.
   *
   * @type {NotificationType[]}
   * @memberof ServiceRegistration
   */
  notifications?: NotificationType[];
  /**
   * Values: Definitions of time-series values of the service.
   *
   * @type {ValueDefinition[]}
   * @memberof ServiceRegistration
   */
  values?: ValueDefinition[];
  /**
   * Service configurations: Additional configurations for services to apply at registration.
   *
   * This property can be used to configuration services without a defined registration property.
   * Configuration for each entry is applied to the configuration service at the namespace and
   * (service) name.
   *
   * @type {{ serviceId: AdspId; configuration: Record<string, unknown> }[]}
   * @memberof ServiceRegistration
   */
  serviceConfigurations?: { serviceId: AdspId; configuration: Record<string, unknown> }[];
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
