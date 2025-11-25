import '@strapi/types';

const getService = (name)=>{
    return strapi.plugin('content-manager').service(name);
};

export { getService };
//# sourceMappingURL=index.mjs.map
