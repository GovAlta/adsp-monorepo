/// <reference types="koa__router" />
import Router from '@koa/router';
import type { Core } from '@strapi/types';
interface Options {
    prefix?: string;
    type?: string;
}
declare const createAPI: (strapi: Core.Strapi, opts?: Options) => {
    listRoutes(): Router.Layer[];
    use(fn: Router.Middleware): any;
    routes(routes: Core.Router | Core.Route[]): any;
    mount(router: Router): any;
};
export { createAPI };
//# sourceMappingURL=api.d.ts.map