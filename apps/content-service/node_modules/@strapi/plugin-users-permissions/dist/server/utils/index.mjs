import { __require as requireSanitize } from './sanitize/index.mjs';

var utils;
var hasRequiredUtils;
function requireUtils() {
    if (hasRequiredUtils) return utils;
    hasRequiredUtils = 1;
    const sanitize = requireSanitize();
    const getService = (name)=>{
        return strapi.plugin('users-permissions').service(name);
    };
    utils = {
        getService,
        sanitize
    };
    return utils;
}

export { requireUtils as __require };
//# sourceMappingURL=index.mjs.map
