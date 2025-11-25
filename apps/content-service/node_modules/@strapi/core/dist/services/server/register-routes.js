'use strict';

var _ = require('lodash');

const createRouteScopeGenerator = (namespace)=>(route)=>{
        const prefix = namespace.endsWith('::') ? namespace : `${namespace}.`;
        if (typeof route.handler === 'string') {
            _.defaultsDeep(route, {
                config: {
                    auth: {
                        scope: [
                            `${route.handler.startsWith(prefix) ? '' : prefix}${route.handler}`
                        ]
                    }
                }
            });
        }
    };
/**
 * Register all routes
 */ var registerAllRoutes = ((strapi)=>{
    registerAdminRoutes(strapi);
    registerAPIRoutes(strapi);
    registerPluginRoutes(strapi);
});
/**
 * Register admin routes
 * @param {import('../../').Strapi} strapi
 */ const registerAdminRoutes = (strapi)=>{
    const generateRouteScope = createRouteScopeGenerator(`admin::`);
    // Instantiate function-like routers
    // Mutate admin.routes in-place and make sure router factories are instantiated correctly
    strapi.admin.routes = instantiateRouterInputs(strapi.admin.routes, strapi);
    _.forEach(strapi.admin.routes, (router)=>{
        router.type = router.type || 'admin';
        router.prefix = router.prefix || `/admin`;
        router.routes.forEach((route)=>{
            generateRouteScope(route);
            route.info = {
                pluginName: 'admin'
            };
        });
        strapi.server.routes(router);
    });
};
/**
 * Register plugin routes
 * @param {import('../../').Strapi} strapi
 */ const registerPluginRoutes = (strapi)=>{
    for (const pluginName of Object.keys(strapi.plugins)){
        const plugin = strapi.plugins[pluginName];
        const generateRouteScope = createRouteScopeGenerator(`plugin::${pluginName}`);
        if (Array.isArray(plugin.routes)) {
            plugin.routes.forEach((route)=>{
                generateRouteScope(route);
                route.info = {
                    pluginName
                };
            });
            strapi.server.routes({
                type: 'admin',
                prefix: `/${pluginName}`,
                routes: plugin.routes
            });
        } else {
            // Instantiate function-like routers
            // Mutate plugin.routes in-place and make sure router factories are instantiated correctly
            plugin.routes = instantiateRouterInputs(plugin.routes, strapi);
            _.forEach(plugin.routes, (router)=>{
                router.type = router.type ?? 'admin';
                router.prefix = router.prefix ?? `/${pluginName}`;
                router.routes.forEach((route)=>{
                    generateRouteScope(route);
                    route.info = {
                        pluginName
                    };
                });
                strapi.server.routes(router);
            });
        }
    }
};
/**
 * Register api routes
 */ const registerAPIRoutes = (strapi)=>{
    for (const apiName of Object.keys(strapi.apis)){
        const api = strapi.api(apiName);
        const generateRouteScope = createRouteScopeGenerator(`api::${apiName}`);
        // Mutate api.routes in-place and make sure router factories are instantiated correctly
        api.routes = instantiateRouterInputs(api.routes, strapi);
        _.forEach(api.routes, (router)=>{
            // TODO: remove once auth setup
            // pass meta down to compose endpoint
            router.type = 'content-api';
            router.routes?.forEach((route)=>{
                generateRouteScope(route);
                route.info = {
                    apiName
                };
            });
            return strapi.server.routes(router);
        });
    }
};
const instantiateRouterInputs = (routers, strapi)=>{
    const entries = Object.entries(routers);
    return entries.reduce((record, [key, inputOrCallback])=>{
        const isCallback = typeof inputOrCallback === 'function';
        return {
            ...record,
            [key]: isCallback ? inputOrCallback({
                strapi
            }) : inputOrCallback
        };
    }, {});
};

module.exports = registerAllRoutes;
//# sourceMappingURL=register-routes.js.map
