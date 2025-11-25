import type { Core } from '@strapi/types';
/**
 * Create instances of providers and permission engine for the core content-API service.
 * Also, expose utilities to get information about available actions and such.
 */
declare const _default: (strapi: Core.Strapi) => {
    engine: import("@strapi/permissions/dist/engine").Engine;
    providers: {
        action: {
            register(action: string, payload: Record<string, unknown>): Promise<import("@strapi/utils/dist/provider-factory").Provider<unknown>>;
            hooks: import("@strapi/utils/dist/provider-factory").ProviderHooksMap;
            delete(key: string): Promise<import("@strapi/utils/dist/provider-factory").Provider<unknown>>;
            get(key: string): {
                [x: string]: unknown;
            } | undefined;
            values(): {
                [x: string]: unknown;
            }[];
            keys(): string[];
            has(key: string): boolean;
            size(): number;
            clear(): Promise<import("@strapi/utils/dist/provider-factory").Provider<{
                [x: string]: unknown;
            }>>;
        };
        condition: {
            register(condition: import("./providers/condition").Condition): Promise<import("@strapi/utils/dist/provider-factory").Provider<unknown>>;
            hooks: import("@strapi/utils/dist/provider-factory").ProviderHooksMap;
            delete(key: string): Promise<import("@strapi/utils/dist/provider-factory").Provider<unknown>>;
            get(key: string): {
                [x: string]: unknown;
            } | undefined;
            values(): {
                [x: string]: unknown;
            }[];
            keys(): string[];
            has(key: string): boolean;
            size(): number;
            clear(): Promise<import("@strapi/utils/dist/provider-factory").Provider<{
                [x: string]: unknown;
            }>>;
        };
    };
    registerActions: () => Promise<void>;
    getActionsMap: () => Record<string, {
        controllers: Record<string, string[]>;
    }>;
};
export default _default;
//# sourceMappingURL=index.d.ts.map