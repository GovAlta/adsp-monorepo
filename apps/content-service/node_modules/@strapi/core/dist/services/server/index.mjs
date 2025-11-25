import Router from '@koa/router';
import { createHTTPServer } from './http-server.mjs';
import { createRouteManager } from './routing.mjs';
import { createAdminAPI } from './admin-api.mjs';
import { createContentAPI } from './content-api.mjs';
import registerAllRoutes from './register-routes.mjs';
import registerApplicationMiddlewares from './register-middlewares.mjs';
import createKoaApp from './koa.mjs';
import requestCtx from '../request-context.mjs';

const healthCheck = async (ctx)=>{
    ctx.set('strapi', 'You are so French!');
    ctx.status = 204;
};
const createServer = (strapi)=>{
    const app = createKoaApp({
        proxy: strapi.config.get('server.proxy.koa'),
        keys: strapi.config.get('server.app.keys')
    });
    app.use((ctx, next)=>requestCtx.run(ctx, ()=>next()));
    const router = new Router();
    const routeManager = createRouteManager(strapi);
    const httpServer = createHTTPServer(strapi, app);
    const apis = {
        'content-api': createContentAPI(strapi),
        admin: createAdminAPI(strapi)
    };
    // init health check
    router.all('/_health', healthCheck);
    const state = {
        mounted: false
    };
    return {
        app,
        router,
        httpServer,
        api (name) {
            return apis[name];
        },
        use (...args) {
            app.use(...args);
            return this;
        },
        routes (routes) {
            if (!Array.isArray(routes) && routes.type) {
                const api = apis[routes.type];
                if (!api) {
                    throw new Error(`API ${routes.type} not found. Possible APIs are ${Object.keys(apis)}`);
                }
                apis[routes.type].routes(routes);
                return this;
            }
            routeManager.addRoutes(routes, router);
            return this;
        },
        mount () {
            state.mounted = true;
            Object.values(apis).forEach((api)=>api.mount(router));
            app.use(router.routes()).use(router.allowedMethods());
            return this;
        },
        initRouting () {
            registerAllRoutes(strapi);
            return this;
        },
        async initMiddlewares () {
            await registerApplicationMiddlewares(strapi);
            return this;
        },
        listRoutes () {
            return [
                ...router.stack
            ];
        },
        listen (...args) {
            if (!state.mounted) {
                this.mount();
            }
            return httpServer.listen(...args);
        },
        async destroy () {
            await httpServer.destroy();
        }
    };
};

export { createServer };
//# sourceMappingURL=index.mjs.map
