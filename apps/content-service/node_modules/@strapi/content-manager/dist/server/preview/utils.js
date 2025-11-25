'use strict';

function getService(strapi, name) {
    // Cast is needed because the return type of strapi.service is too vague
    return strapi.service(`plugin::content-manager.${name}`);
}

exports.getService = getService;
//# sourceMappingURL=utils.js.map
