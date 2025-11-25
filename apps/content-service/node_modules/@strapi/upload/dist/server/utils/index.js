'use strict';

const getService = (name)=>{
    return strapi.plugin('upload').service(name);
};

exports.getService = getService;
//# sourceMappingURL=index.js.map
