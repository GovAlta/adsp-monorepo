'use strict';

const getCoreStore = ()=>{
    return strapi.store({
        type: 'plugin',
        name: 'i18n'
    });
};
// retrieve a local service
const getService = (name)=>{
    return strapi.plugin('i18n').service(name);
};

exports.getCoreStore = getCoreStore;
exports.getService = getService;
//# sourceMappingURL=index.js.map
