import { prop, castArray, trim, toLower, isNil } from 'lodash/fp';
import { errors } from '@strapi/utils';
import compose from 'koa-compose';
import { resolveRouteMiddlewares } from './middleware.mjs';
import { createPolicicesMiddleware } from './policy.mjs';

const getMethod = (route)=>{
    return trim(toLower(route.method));
};
const getPath = (route)=>trim(route.path);
const createRouteInfoMiddleware = (routeInfo)=>(ctx, next)=>{
        const route = {
            ...routeInfo,
            config: routeInfo.config || {}
        };
        ctx.state.route = route;
        return next();
    };
const getAuthConfig = prop('config.auth');
const createAuthorizeMiddleware = (strapi)=>async (ctx, next)=>{
        const { auth, route } = ctx.state;
        const authService = strapi.get('auth');
        try {
            await authService.verify(auth, getAuthConfig(route));
            return await next();
        } catch (error) {
            if (error instanceof errors.UnauthorizedError) {
                return ctx.unauthorized();
            }
            if (error instanceof errors.ForbiddenError) {
                // allow PolicyError as an exception to throw a publicly visible message in the API
                if (error instanceof errors.PolicyError) {
                    throw error;
                }
                return ctx.forbidden();
            }
            throw error;
        }
    };
const createAuthenticateMiddleware = (strapi)=>async (ctx, next)=>{
        return strapi.get('auth').authenticate(ctx, next);
    };
const returnBodyMiddleware = async (ctx, next)=>{
    const values = await next();
    if (isNil(ctx.body) && !isNil(values)) {
        ctx.body = values;
    }
};
var createEndpointComposer = ((strapi)=>{
    const authenticate = createAuthenticateMiddleware(strapi);
    const authorize = createAuthorizeMiddleware(strapi);
    return (route, { router })=>{
        try {
            const method = getMethod(route);
            const path = getPath(route);
            const middlewares = resolveRouteMiddlewares(route, strapi);
            const action = getAction(route, strapi);
            const routeHandler = compose([
                createRouteInfoMiddleware(route),
                authenticate,
                authorize,
                createPolicicesMiddleware(route, strapi),
                ...middlewares,
                returnBodyMiddleware,
                ...castArray(action)
            ]);
            router[method](path, routeHandler);
        } catch (error) {
            if (error instanceof Error) {
                error.message = `Error creating endpoint ${route.method} ${route.path}: ${error.message}`;
            }
            throw error;
        }
    };
});
const getController = (name, { pluginName, apiName }, strapi)=>{
    let ctrl;
    if (pluginName) {
        if (pluginName === 'admin') {
            ctrl = strapi.controller(`admin::${name}`);
        } else {
            ctrl = strapi.plugin(pluginName).controller(name);
        }
    } else if (apiName) {
        ctrl = strapi.controller(`api::${apiName}.${name}`);
    }
    if (!ctrl) {
        return strapi.controller(name);
    }
    return ctrl;
};
const extractHandlerParts = (name)=>{
    const controllerName = name.slice(0, name.lastIndexOf('.'));
    const actionName = name.slice(name.lastIndexOf('.') + 1);
    return {
        controllerName,
        actionName
    };
};
const getAction = (route, strapi)=>{
    const { handler, info } = route;
    const { pluginName, apiName, type } = info ?? {};
    if (Array.isArray(handler) || typeof handler === 'function') {
        return handler;
    }
    const { controllerName, actionName } = extractHandlerParts(trim(handler));
    const controller = getController(controllerName, {
        pluginName,
        apiName,
        type
    }, strapi);
    if (typeof controller[actionName] !== 'function') {
        throw new Error(`Handler not found "${handler}"`);
    }
    if (Symbol.for('__type__') in controller[actionName]) {
        controller[actionName][Symbol.for('__type__')].push(type);
    } else {
        controller[actionName][Symbol.for('__type__')] = [
            type
        ];
    }
    return controller[actionName].bind(controller);
};

export { createEndpointComposer as default };
//# sourceMappingURL=compose-endpoint.mjs.map
