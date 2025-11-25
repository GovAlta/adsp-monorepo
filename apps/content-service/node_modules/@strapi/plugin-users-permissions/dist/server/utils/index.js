'use strict';

var index = require('./sanitize/index.js');

var utils;
var hasRequiredUtils;
function requireUtils() {
    if (hasRequiredUtils) return utils;
    hasRequiredUtils = 1;
    const sanitize = index.__require();
    const getService = (name)=>{
        return strapi.plugin('users-permissions').service(name);
    };
    utils = {
        getService,
        sanitize
    };
    return utils;
}

exports.__require = requireUtils;
//# sourceMappingURL=index.js.map
