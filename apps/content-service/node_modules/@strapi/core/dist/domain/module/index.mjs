import _, { flatten } from 'lodash';
import { yup } from '@strapi/utils';
import { removeNamespace } from '../../registries/namespace.mjs';
import { validateModule } from './validation.mjs';

// Removes the namespace from a map with keys prefixed with a namespace
const removeNamespacedKeys = (map, namespace)=>{
    return _.mapKeys(map, (value, key)=>removeNamespace(key, namespace));
};
const defaultModule = {
    config: {},
    routes: [],
    controllers: {},
    services: {},
    contentTypes: {},
    policies: {},
    middlewares: {}
};
const createModule = (namespace, rawModule, strapi)=>{
    _.defaults(rawModule, defaultModule);
    try {
        validateModule(rawModule);
    } catch (e) {
        if (e instanceof yup.ValidationError) {
            throw new Error(`strapi-server.js is invalid for '${namespace}'.\n${e.errors.join('\n')}`);
        }
    }
    const called = {};
    return {
        async bootstrap () {
            if (called.bootstrap) {
                throw new Error(`Bootstrap for ${namespace} has already been called`);
            }
            called.bootstrap = true;
            await (rawModule.bootstrap && rawModule.bootstrap({
                strapi
            }));
        },
        async register () {
            if (called.register) {
                throw new Error(`Register for ${namespace} has already been called`);
            }
            called.register = true;
            await (rawModule.register && rawModule.register({
                strapi
            }));
        },
        async destroy () {
            if (called.destroy) {
                throw new Error(`Destroy for ${namespace} has already been called`);
            }
            called.destroy = true;
            await (rawModule.destroy && rawModule.destroy({
                strapi
            }));
        },
        load () {
            strapi.get('content-types').add(namespace, rawModule.contentTypes);
            strapi.get('services').add(namespace, rawModule.services);
            strapi.get('policies').add(namespace, rawModule.policies);
            strapi.get('middlewares').add(namespace, rawModule.middlewares);
            strapi.get('controllers').add(namespace, rawModule.controllers);
            strapi.get('config').set(namespace, rawModule.config);
        },
        get routes () {
            return rawModule.routes ?? {};
        },
        set routes (routes){
            rawModule.routes = routes;
        },
        config (path, defaultValue) {
            const pathArray = flatten([
                namespace,
                path
            ]);
            return strapi.get('config').get(pathArray, defaultValue);
        },
        contentType (ctName) {
            return strapi.get('content-types').get(`${namespace}.${ctName}`);
        },
        get contentTypes () {
            const contentTypes = strapi.get('content-types').getAll(namespace);
            return removeNamespacedKeys(contentTypes, namespace);
        },
        service (serviceName) {
            return strapi.get('services').get(`${namespace}.${serviceName}`);
        },
        get services () {
            const services = strapi.get('services').getAll(namespace);
            return removeNamespacedKeys(services, namespace);
        },
        policy (policyName) {
            return strapi.get('policies').get(`${namespace}.${policyName}`);
        },
        get policies () {
            const policies = strapi.get('policies').getAll(namespace);
            return removeNamespacedKeys(policies, namespace);
        },
        middleware (middlewareName) {
            return strapi.get('middlewares').get(`${namespace}.${middlewareName}`);
        },
        get middlewares () {
            const middlewares = strapi.get('middlewares').getAll(namespace);
            return removeNamespacedKeys(middlewares, namespace);
        },
        controller (controllerName) {
            return strapi.get('controllers').get(`${namespace}.${controllerName}`);
        },
        get controllers () {
            const controllers = strapi.get('controllers').getAll(namespace);
            return removeNamespacedKeys(controllers, namespace);
        }
    };
};

export { createModule };
//# sourceMappingURL=index.mjs.map
