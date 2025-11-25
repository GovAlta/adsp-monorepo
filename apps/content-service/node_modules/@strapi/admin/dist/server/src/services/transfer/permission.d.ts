import permissions from '@strapi/permissions';
declare const providers: {
    action: import("@strapi/utils/dist/provider-factory").Provider<{
        [x: string]: unknown;
    }>;
    condition: import("@strapi/utils/dist/provider-factory").Provider<{
        [x: string]: unknown;
    }>;
};
declare const engine: permissions.engine.Engine;
export { engine, providers };
//# sourceMappingURL=permission.d.ts.map