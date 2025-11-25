'use strict';

const getAdminService = (name, { strapi } = {
    strapi: global.strapi
})=>{
    return strapi.service(`admin::${name}`);
};
const getService = (name, { strapi } = {
    strapi: global.strapi
})=>{
    return strapi.plugin('review-workflows').service(name);
};

exports.getAdminService = getAdminService;
exports.getService = getService;
//# sourceMappingURL=index.js.map
