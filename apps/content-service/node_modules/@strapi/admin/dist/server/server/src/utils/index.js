'use strict';

const getService = (name)=>{
    return strapi.service(`admin::${name}`);
};

exports.getService = getService;
//# sourceMappingURL=index.js.map
