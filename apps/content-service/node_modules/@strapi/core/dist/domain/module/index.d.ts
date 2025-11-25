import { type PropertyPath } from 'lodash';
import type { Core, UID, Struct } from '@strapi/types';
export interface RawModule {
    config?: Record<string, unknown>;
    routes?: Core.Module['routes'];
    controllers?: Core.Module['controllers'];
    services?: Core.Module['services'];
    contentTypes?: Core.Module['contentTypes'];
    policies?: Core.Module['policies'];
    middlewares?: Core.Module['middlewares'];
    bootstrap?: (params: {
        strapi: Core.Strapi;
    }) => Promise<void>;
    register?: (params: {
        strapi: Core.Strapi;
    }) => Promise<void>;
    destroy?: (params: {
        strapi: Core.Strapi;
    }) => Promise<void>;
}
export interface Module {
    bootstrap: () => Promise<void>;
    register: () => Promise<void>;
    destroy: () => Promise<void>;
    load: () => void;
    routes: Core.Module['routes'];
    config<T = unknown>(key: PropertyPath, defaultVal?: T): T;
    contentType: (ctName: UID.ContentType) => Struct.ContentTypeSchema;
    contentTypes: Record<string, Struct.ContentTypeSchema>;
    service: (serviceName: UID.Service) => Core.Service;
    services: Record<string, Core.Service>;
    policy: (policyName: UID.Policy) => Core.Policy;
    policies: Record<string, Core.Policy>;
    middleware: (middlewareName: UID.Middleware) => Core.Middleware;
    middlewares: Record<string, Core.Middleware>;
    controller: (controllerName: UID.Controller) => Core.Controller;
    controllers: Record<string, Core.Controller>;
}
export declare const createModule: (namespace: string, rawModule: RawModule, strapi: Core.Strapi) => Module;
//# sourceMappingURL=index.d.ts.map