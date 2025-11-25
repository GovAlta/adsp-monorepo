import { env } from '@strapi/utils';
import type { Strapi, Router, Controller, Service, Policy, Middleware } from '../core';
import type { ContentTypeSchema } from '../struct';
import type { Schemas } from '../schema';
import type * as Public from '../public';
import type * as UID from '../uid';
import type { Constants, Extends, Or, Not } from '../utils';
export type IsEnabled<TName extends keyof any, TSchemaUID extends UID.Schema> = TName extends keyof Public.PluginActivation ? Public.PluginActivation[TName] extends infer TRule ? Or<Not<Constants.AreSchemaRegistriesExtended>, Extends<Schemas[TSchemaUID]['pluginOptions'], {
    [key in TName]: TRule;
}>> : false : false;
export type LoadedPlugin = {
    config: {
        default: Record<string, unknown> | ((opts: {
            env: typeof env;
        }) => Record<string, unknown>);
        validator: (config: Record<string, unknown>) => void;
    };
    bootstrap: ({ strapi }: {
        strapi: Strapi;
    }) => void | Promise<void>;
    destroy: ({ strapi }: {
        strapi: Strapi;
    }) => void | Promise<void>;
    register: ({ strapi }: {
        strapi: Strapi;
    }) => void | Promise<void>;
    routes: Record<string, Router>;
    controllers: Record<string, Controller>;
    services: Record<string, Service>;
    policies: Record<string, Policy>;
    middlewares: Record<string, Middleware>;
    contentTypes: Record<string, {
        schema: ContentTypeSchema;
    }>;
};
export * as Config from './config';
//# sourceMappingURL=index.d.ts.map