'use strict';

var permissions = require('@strapi/permissions');

var createPermissionEngine = (({ providers })=>permissions.engine.new({
        providers
    }));

module.exports = createPermissionEngine;
//# sourceMappingURL=engine.js.map
