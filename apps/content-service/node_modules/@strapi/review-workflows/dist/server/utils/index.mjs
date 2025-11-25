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

export { getAdminService, getService };
//# sourceMappingURL=index.mjs.map
