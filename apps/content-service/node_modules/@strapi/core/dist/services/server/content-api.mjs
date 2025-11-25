import { createAPI } from './api.mjs';

const createContentAPI = (strapi)=>{
    const opts = {
        prefix: strapi.config.get('api.rest.prefix', '/api'),
        type: 'content-api'
    };
    return createAPI(strapi, opts);
};

export { createContentAPI };
//# sourceMappingURL=content-api.mjs.map
