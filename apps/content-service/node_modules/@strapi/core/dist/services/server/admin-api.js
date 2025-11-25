'use strict';

var api = require('./api.js');

const createAdminAPI = (strapi)=>{
    const opts = {
        prefix: '',
        type: 'admin'
    };
    return api.createAPI(strapi, opts);
};

exports.createAdminAPI = createAdminAPI;
//# sourceMappingURL=admin-api.js.map
