import type { Core, UID } from '@strapi/types';
export type ServiceFactory = (params: {
    strapi: Core.Strapi;
}) => Core.Service | Core.Service;
export type ServiceFactoryMap = Record<string, ServiceFactory>;
export type ServiceMap = Record<string, Core.Service>;
export type ServiceExtendFn = (service: Core.Service) => Core.Service;
declare const servicesRegistry: (strapi: Core.Strapi) => {
    /**
     * Returns this list of registered services uids
     */
    keys(): string[];
    /**
     * Returns the instance of a service. Instantiate the service if not already done
     */
    get(uid: UID.Service): Core.Service | undefined;
    /**
     * Returns a map with all the services in a namespace
     */
    getAll(namespace: string): ServiceMap;
    /**
     * Registers a service
     */
    set(uid: string, service: ServiceFactory): any;
    /**
     * Registers a map of services for a specific namespace
     */
    add(namespace: string, newServices: ServiceFactoryMap): any;
    /**
     * Wraps a service to extend it
     */
    extend(uid: UID.Service, extendFn: ServiceExtendFn): any;
};
export default servicesRegistry;
//# sourceMappingURL=services.d.ts.map