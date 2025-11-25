'use strict';

var strapiUtils = require('@strapi/utils');
var middleware = require('./middleware.js');

const defaultConfig = [
    'strapi::logger',
    'strapi::errors',
    'strapi::security',
    'strapi::cors',
    'strapi::poweredBy',
    'strapi::session',
    'strapi::query',
    'strapi::body',
    'strapi::favicon',
    'strapi::public'
];
const requiredMiddlewares = [
    'strapi::errors',
    'strapi::security',
    'strapi::cors',
    'strapi::query',
    'strapi::body',
    'strapi::public',
    'strapi::favicon'
];
const middlewareConfigSchema = strapiUtils.yup.array().of(strapiUtils.yup.lazy((value)=>{
    if (typeof value === 'string') {
        return strapiUtils.yup.string().required();
    }
    if (typeof value === 'object') {
        return strapiUtils.yup.object({
            name: strapiUtils.yup.string(),
            resolve: strapiUtils.yup.string(),
            config: strapiUtils.yup.mixed()
        }).required().noUnknown();
    }
    return strapiUtils.yup.mixed().test(()=>false);
}));
/**
 * Register middlewares in router
 */ const registerApplicationMiddlewares = async (strapi)=>{
    const middlewareConfig = strapi.config.get('middlewares', defaultConfig);
    await validateMiddlewareConfig(middlewareConfig);
    const middlewares = await middleware.resolveMiddlewares(middlewareConfig, strapi);
    checkRequiredMiddlewares(middlewares);
    // NOTE: exclude middlewares that return nothing.
    // this is used for middlewares that only extend the app only need to be added in certain conditions
    for (const middleware of middlewares){
        strapi.server.use(middleware.handler);
    }
};
/**
 *
 * @param {MiddlewaresConfig} config
 */ const validateMiddlewareConfig = async (config)=>{
    try {
        await middlewareConfigSchema.validate(config, {
            strict: true,
            abortEarly: false
        });
    } catch (error) {
        throw new Error('Invalid middleware configuration. Expected Array<string|{name?: string, resolve?: string, config: any}.');
    }
};
/**
 * Check if some required middlewares are missing in configure middlewares
 * @param {Middlewares} middlewares
 */ const checkRequiredMiddlewares = (middlewares)=>{
    const missingMiddlewares = requiredMiddlewares.filter((name)=>{
        return middlewares.findIndex((mdl)=>mdl.name === name) === -1;
    });
    if (missingMiddlewares.length > 0) {
        throw new Error(`Missing required middlewares in configuration. Add the following middlewares: "${missingMiddlewares.join(', ')}".`);
    }
};

module.exports = registerApplicationMiddlewares;
//# sourceMappingURL=register-middlewares.js.map
