import type { Core } from '@strapi/types';
declare const resolveRouteMiddlewares: (route: Core.Route, strapi: Core.Strapi) => Core.MiddlewareHandler[];
/**
 * Initialize every configured middlewares
 */
declare const resolveMiddlewares: (config: Array<Core.MiddlewareName | Core.MiddlewareConfig | Core.MiddlewareHandler>, strapi: Core.Strapi) => {
    name: string | null;
    handler: Core.MiddlewareHandler;
}[];
export { resolveRouteMiddlewares, resolveMiddlewares };
//# sourceMappingURL=middleware.d.ts.map