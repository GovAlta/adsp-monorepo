'use strict';

var fp = require('lodash/fp');
var index = require('./core-api/controller/index.js');
require('@strapi/utils');
require('zod/v4');
var contentType = require('./core-api/routes/validation/content-type.js');
var index$1 = require('./core-api/service/index.js');
var index$2 = require('./core-api/routes/index.js');

const symbols = {
    CustomController: Symbol('StrapiCustomCoreController')
};
const createCoreController = (uid, cfg)=>{
    return ({ strapi: strapi1 })=>{
        const baseController = index.createController({
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
        const baseService = index$1.createService({
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
                const defaultRoutes = index$2.createRoutes({
                    contentType,
                    strapi
                });
                const keys = Object.keys(defaultRoutes);
                keys.forEach((routeName)=>{
                    const defaultRoute = defaultRoutes[routeName];
                    defaultRoute.config = config[routeName] ?? {};
                });
                const selectedRoutes = fp.pipe((routes)=>except ? fp.omit(except, routes) : routes, (routes)=>only ? fp.pick(only, routes) : routes)(defaultRoutes);
                routes = Object.values(selectedRoutes);
            }
            return routes;
        }
    };
}
const createCoreValidator = (uid, strapi1)=>{
    return new contentType.CoreContentTypeRouteValidator(strapi1, uid);
};
const isCustomController = (controller)=>{
    return symbols.CustomController in controller;
};

exports.createCoreController = createCoreController;
exports.createCoreRouter = createCoreRouter;
exports.createCoreService = createCoreService;
exports.createCoreValidator = createCoreValidator;
exports.isCustomController = isCustomController;
//# sourceMappingURL=factories.js.map
