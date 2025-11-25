'use strict';

require('@strapi/types');

const getService = (name)=>{
    return strapi.plugin('content-manager').service(name);
};

exports.getService = getService;
//# sourceMappingURL=index.js.map
