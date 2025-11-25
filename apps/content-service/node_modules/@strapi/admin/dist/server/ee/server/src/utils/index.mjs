const getService = (name, { strapi } = {
    strapi: global.strapi
})=>{
    return strapi.service(`admin::${name}`);
};

export { getService };
//# sourceMappingURL=index.mjs.map
