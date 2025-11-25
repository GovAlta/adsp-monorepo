/// <reference types="koa__router" />
/// <reference types="koa" />
import type { Core } from '@strapi/types';
declare const createAdminAPI: (strapi: Core.Strapi) => {
    listRoutes(): import("@koa/router").Layer[];
    use(fn: import("@koa/router").Middleware<import("koa").DefaultState, import("koa").DefaultContext, unknown>): any;
    routes(routes: Core.Router | Core.Route[]): any;
    mount(router: import("@koa/router")<import("koa").DefaultState, import("koa").DefaultContext>): any;
};
export { createAdminAPI };
//# sourceMappingURL=admin-api.d.ts.map