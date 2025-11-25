import _ from 'lodash';
import { sanitize, validate, sanitizeRoutesMapForSerialization } from '@strapi/utils';
import instantiatePermissionsUtilities from './permissions/index.mjs';

const transformRoutePrefixFor = (pluginName)=>(route)=>{
        const prefix = route.config && route.config.prefix;
        const path = prefix !== undefined ? `${prefix}${route.path}` : `/${pluginName}${route.path}`;
        return {
            ...route,
            path
        };
    };
const filterContentAPI = (route)=>route.info.type === 'content-api';
/**
 * Create a content API container that holds logic, tools and utils. (eg: permissions, ...)
 */ const createContentAPI = (strapi)=>{
    const getRoutesMap = async ()=>{
        const routesMap = {};
        _.forEach(strapi.apis, (api, apiName)=>{
            const routes = _.flatMap(api.routes, (route)=>{
                if ('routes' in route) {
                    return route.routes;
                }
                return route;
            }).filter(filterContentAPI);
            if (routes.length === 0) {
                return;
            }
            const apiPrefix = strapi.config.get('api.rest.prefix');
            routesMap[`api::${apiName}`] = routes.map((route)=>({
                    ...route,
                    path: `${apiPrefix}${route.path}`
                }));
        });
        _.forEach(strapi.plugins, (plugin, pluginName)=>{
            const transformPrefix = transformRoutePrefixFor(pluginName);
            if (Array.isArray(plugin.routes)) {
                return plugin.routes.map(transformPrefix).filter(filterContentAPI);
            }
            const routes = _.flatMap(plugin.routes, (route)=>route.routes.map(transformPrefix)).filter(filterContentAPI);
            if (routes.length === 0) {
                return;
            }
            const apiPrefix = strapi.config.get('api.rest.prefix');
            routesMap[`plugin::${pluginName}`] = routes.map((route)=>({
                    ...route,
                    path: `${apiPrefix}${route.path}`
                }));
        });
        return sanitizeRoutesMapForSerialization(routesMap);
    };
    const sanitizer = sanitize.createAPISanitizers({
        getModel (uid) {
            return strapi.getModel(uid);
        },
        // NOTE: use lazy access to allow registration of sanitizers after the creation of the container
        get sanitizers () {
            return {
                input: strapi.sanitizers.get('content-api.input'),
                output: strapi.sanitizers.get('content-api.output')
            };
        }
    });
    const validator = validate.createAPIValidators({
        getModel (uid) {
            return strapi.getModel(uid);
        },
        // NOTE: use lazy access to allow registration of validators after the creation of the container
        get validators () {
            return {
                input: strapi.validators.get('content-api.input')
            };
        }
    });
    return {
        permissions: instantiatePermissionsUtilities(strapi),
        getRoutesMap,
        sanitize: sanitizer,
        validate: validator
    };
};

export { createContentAPI as default };
//# sourceMappingURL=index.mjs.map
