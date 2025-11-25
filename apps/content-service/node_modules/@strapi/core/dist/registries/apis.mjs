import { has } from 'lodash/fp';

const apisRegistry = (strapi)=>{
    const apis = {};
    return {
        get (name) {
            return apis[name];
        },
        getAll () {
            return apis;
        },
        add (apiName, apiConfig) {
            if (has(apiName, apis)) {
                throw new Error(`API ${apiName} has already been registered.`);
            }
            const api = strapi.get('modules').add(`api::${apiName}`, apiConfig);
            apis[apiName] = api;
            return apis[apiName];
        }
    };
};

export { apisRegistry as default };
//# sourceMappingURL=apis.mjs.map
