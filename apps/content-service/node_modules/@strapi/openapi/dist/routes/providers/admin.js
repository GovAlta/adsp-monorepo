'use strict';

var debug$1 = require('../../utils/debug.js');
require('node:crypto');
require('zod/v4');
var abstract = require('./abstract.js');

const debug = debug$1.createDebugger('routes:provider:admin');
class AdminRoutesProvider extends abstract.AbstractRoutesProvider {
    get routes() {
        const { admin } = this._strapi;
        const routes = Object.values(admin.routes).flatMap((router)=>router.routes);
        debug('found %o routes in Strapi admin', routes.length);
        return routes;
    }
}

exports.AdminRoutesProvider = AdminRoutesProvider;
//# sourceMappingURL=admin.js.map
