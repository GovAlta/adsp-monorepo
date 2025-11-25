'use strict';

const getService = (name, { strapi } = {
    strapi: global.strapi
})=>{
    return strapi.service(`admin::${name}`);
};

exports.getService = getService;
//# sourceMappingURL=index.js.map
