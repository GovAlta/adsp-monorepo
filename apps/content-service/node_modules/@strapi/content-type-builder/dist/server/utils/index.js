'use strict';

function getService(name) {
    return strapi.plugin('content-type-builder').service(name);
}

exports.getService = getService;
//# sourceMappingURL=index.js.map
