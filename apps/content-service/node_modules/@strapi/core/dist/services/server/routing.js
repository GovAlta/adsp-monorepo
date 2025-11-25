'use strict';

var Router = require('@koa/router');
var fp = require('lodash/fp');
var strapiUtils = require('@strapi/utils');
var composeEndpoint = require('./compose-endpoint.js');

const policyOrMiddlewareSchema = strapiUtils.yup.lazy((value)=>{
    if (typeof value === 'string') {
        return strapiUtils.yup.string().required();
    }
    if (typeof value === 'function') {
        return strapiUtils.yup.mixed().isFunction();
    }
    return strapiUtils.yup.object({
        name: strapiUtils.yup.string().required(),
        options: strapiUtils.yup.object().notRequired()
    });
});
const routeSchema = strapiUtils.yup.object({
    method: strapiUtils.yup.string().oneOf([
        'GET',
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
        'ALL'
    ]).required(),
    path: strapiUtils.yup.string().required(),
    handler: strapiUtils.yup.lazy((value)=>{
        if (typeof value === 'string') {
            return strapiUtils.yup.string().required();
        }
        if (Array.isArray(value)) {
            return strapiUtils.yup.array().required();
        }
        return strapiUtils.yup.mixed().isFunction().required();
    }),
    request: strapiUtils.yup.object({
        params: strapiUtils.yup.object().notRequired(),
        query: strapiUtils.yup.object().notRequired(),
        body: strapiUtils.yup.object().notRequired()
    }).notRequired(),
    response: strapiUtils.yup.object().notRequired(),
    config: strapiUtils.yup.object({
        auth: strapiUtils.yup.lazy((value)=>{
            if (value === false) {
                return strapiUtils.yup.boolean().required();
            }
            return strapiUtils.yup.object({
                scope: strapiUtils.yup.array().of(strapiUtils.yup.string()).required()
            });
        }),
        policies: strapiUtils.yup.array()// FIXME: fixed in yup v1
        .of(policyOrMiddlewareSchema).notRequired(),
        middlewares: strapiUtils.yup.array()// FIXME: fixed in yup v1
        .of(policyOrMiddlewareSchema).notRequired()
    }).notRequired()
});
const validateRouteConfig = (routeConfig)=>{
    try {
        return routeSchema.validateSync(routeConfig, {
            strict: true,
            abortEarly: false,
            stripUnknown: true
        });
    } catch (error) {
        if (error instanceof strapiUtils.yup.ValidationError) {
            throw new Error(`Invalid route config ${error.message}`);
        }
    }
};
const createRouteManager = (strapi, opts = {})=>{
    const { type } = opts;
    const composeEndpoint$1 = composeEndpoint(strapi);
    const createRoute = (route, router)=>{
        validateRouteConfig(route);
        // NOTE: the router type is used to tag controller actions and for authentication / authorization so we need to pass this info down to the route level
        const routeWithInfo = Object.assign(route, {
            info: {
                ...route.info ?? {},
                type: type ?? 'api'
            }
        });
        composeEndpoint$1(routeWithInfo, {
            router
        });
    };
    const addRoutes = (routes, router)=>{
        if (Array.isArray(routes)) {
            routes.forEach((route)=>createRoute(route, router));
        } else if (routes.routes) {
            const subRouter = new Router({
                prefix: routes.prefix
            });
            routes.routes.forEach((route)=>{
                const hasPrefix = fp.has('prefix', route.config);
                createRoute(route, hasPrefix ? router : subRouter);
            });
            return router.use(subRouter.routes(), subRouter.allowedMethods());
        }
    };
    return {
        addRoutes
    };
};

exports.createRouteManager = createRouteManager;
exports.validateRouteConfig = validateRouteConfig;
//# sourceMappingURL=routing.js.map
