const getService = (name)=>{
    return strapi.plugin('upload').service(name);
};

export { getService };
//# sourceMappingURL=index.mjs.map
