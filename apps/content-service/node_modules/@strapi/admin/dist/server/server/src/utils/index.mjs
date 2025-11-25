const getService = (name)=>{
    return strapi.service(`admin::${name}`);
};

export { getService };
//# sourceMappingURL=index.mjs.map
