import {
  ServiceRegistration as ServiceRegistrationInfo,
  ServiceRegistrar,
  ServiceRole,
  User,
  AdspId,
  adspId,
} from '@abgov/adsp-service-sdk';
import { TenantServiceRoles } from '../roles';
import { ServiceOptionEntity, ServiceConfigurationRepository } from './configuration';

export interface ServiceClient {
  serviceId: AdspId;
  roles: ServiceRole[];
}
export interface ServiceRegistration extends ServiceRegistrar {
  getServiceClients(): Promise<ServiceClient[]>;
}

export class ServiceRegistrationImpl implements ServiceRegistration {
  constructor(private readonly repository: ServiceConfigurationRepository) {}

  async getServiceClients(): Promise<ServiceClient[]> {
    const result = await this.repository.find(500, null);

    // Services are all registered as v1 for now.
    const services = result.results.filter((r) => r.version === 'v1');
    return services.map((s) => ({
      serviceId: adspId`urn:ads:platform:${s.service}`,
      roles: s.roles.map((r) => ({ role: r.role, description: r.description, inTenantAdmin: r.inTenantAdmin })),
    }));
  }

  async register({
    serviceId,
    displayName,
    description,
    roles,
    configurationSchema,
    events,
  }: ServiceRegistrationInfo): Promise<void> {
    const serviceRoles: ServiceRole[] =
      roles?.map((r) => (typeof r === 'string' ? { role: r, description: '' } : r)) || [];
    const user: User = {
      id: 'tenant-service-internal',
      name: 'tenant-service-internal',
      email: null,
      token: null,
      isCore: true,
      roles: [TenantServiceRoles.PlatformService],
    };

    const entity = await this.repository.getConfigOptionByVersion(serviceId.service, 'v1');
    if (entity) {
      await entity.update(user, { displayName, description, roles: serviceRoles, configSchema: configurationSchema });
    } else {
      await ServiceOptionEntity.create(user, this.repository, {
        id: null,
        service: serviceId.service,
        version: 'v1',
        displayName,
        description,
        roles: serviceRoles,
        configSchema: configurationSchema,
        configOptions: {},
      });
    }

    if (events) {
      const namespaceConfig = {
        name: serviceId.service,
        definitions: events.reduce(
          (defs, def) => ({
            ...defs,
            [def.name]: {
              name: def.name,
              description: def.description,
              payloadSchema: def.payloadSchema,
            },
          }),
          {}
        ),
      };

      const entity = await this.repository.getConfigOptionByVersion('event-service', 'v1');
      if (entity) {
        entity.update(user, { configOptions: { ...entity.configOptions, [serviceId.service]: namespaceConfig } });
      } else {
        await ServiceOptionEntity.create(user, this.repository, {
          id: null,
          service: 'event-service',
          version: 'v1',
          displayName: null,
          description: null,
          roles: [],
          configSchema: {},
          configOptions: {
            [serviceId.service]: namespaceConfig,
          },
        });
      }
    }
  }
}
