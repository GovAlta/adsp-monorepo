import { createAPI } from './api.mjs';

const createAdminAPI = (strapi)=>{
    const opts = {
        prefix: '',
        type: 'admin'
    };
    return createAPI(strapi, opts);
};

export { createAdminAPI };
//# sourceMappingURL=admin-api.mjs.map
