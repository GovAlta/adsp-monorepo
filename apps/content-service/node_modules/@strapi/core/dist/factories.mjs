import { pipe, omit, pick } from 'lodash/fp';
import { createController } from './core-api/controller/index.mjs';
import '@strapi/utils';
import 'zod/v4';
import { CoreContentTypeRouteValidator } from './core-api/routes/validation/content-type.mjs';
import { createService } from './core-api/service/index.mjs';
import { createRoutes } from './core-api/routes/index.mjs';

const symbols = {
    CustomController: Symbol('StrapiCustomCoreController')
};
const createCoreController = (uid, cfg)=>{
    return ({ strapi: strapi1 })=>{
        const baseController = createController({
            contentType: strapi1.contentType(uid)
        });
        const userCtrl = typeof cfg === 'function' ? cfg({
            strapi: strapi1
        }) : cfg ?? {};
        for (const methodName of Object.keys(baseController)){
            if (userCtrl[methodName] === undefined) {
                userCtrl[methodName] = baseController[methodName];
            }
        }
        Object.setPrototypeOf(userCtrl, baseController);
        const isCustom = typeof cfg !== 'undefined';
        if (isCustom) {
            Object.defineProperty(userCtrl, symbols.CustomController, {
                writable: false,
                configurable: false,
                enumerable: false
            });
        }
        return userCtrl;
    };
};
function createCoreService(uid, cfg) {
    return ({ strapi: strapi1 })=>{
        const baseService = createService({
            contentType: strapi1.contentType(uid)
        });
        const userService = typeof cfg === 'function' ? cfg({
            strapi: strapi1
        }) : cfg ?? {};
        for (const methodName of Object.keys(baseService)){
            if (userService[methodName] === undefined) {
                userService[methodName] = baseService[methodName];
            }
        }
        Object.setPrototypeOf(userService, baseService);
        return userService;
    };
}
function createCoreRouter(uid, cfg) {
    const { prefix, config = {}, only, except, type = 'content-api' } = cfg ?? {};
    let routes;
    return {
        type,
        prefix,
        get routes () {
            if (!routes) {
                const contentType = strapi.contentType(uid);
                const defaultRoutes = createRoutes({
                    contentType,
                    strapi
                });
                const keys = Object.keys(defaultRoutes);
                keys.forEach((routeName)=>{
                    const defaultRoute = defaultRoutes[routeName];
                    defaultRoute.config = config[routeName] ?? {};
                });
                const selectedRoutes = pipe((routes)=>except ? omit(except, routes) : routes, (routes)=>only ? pick(only, routes) : routes)(defaultRoutes);
                routes = Object.values(selectedRoutes);
            }
            return routes;
        }
    };
}
const createCoreValidator = (uid, strapi1)=>{
    return new CoreContentTypeRouteValidator(strapi1, uid);
};
const isCustomController = (controller)=>{
    return symbols.CustomController in controller;
};

export { createCoreController, createCoreRouter, createCoreService, createCoreValidator, isCustomController };
//# sourceMappingURL=factories.mjs.map
