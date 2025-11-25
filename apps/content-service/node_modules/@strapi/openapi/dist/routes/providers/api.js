'use strict';

var debug$1 = require('../../utils/debug.js');
require('node:crypto');
require('zod/v4');
var abstract = require('./abstract.js');

const debug = debug$1.createDebugger('routes:provider:api');
/**
 * Class representing a provider for API routes.
 *
 * This class retrieves and provides access to routes registered in the Strapi
 * APIs.
 *
 * @extends {@link AbstractRoutesProvider}
 */ class ApiRoutesProvider extends abstract.AbstractRoutesProvider {
    /**
   * Retrieves all routes registered in the Strapi APIs.
   *
   * It extracts routes from the Strapi APIs by flattening their
   * structure and consolidating them into a single array of {@link Core.Route}.
   *
   * @returns An array of {@link Core.Route} objects
   */ get routes() {
        const { apis } = this._strapi;
        const routes = Object.values(apis)// Extract and flatten each router from every API
        .flatMap((api)=>Object.values(api.routes))// Extract and flatten the routes from each router
        .flatMap((router)=>router.routes);
        debug('found %o routes in Strapi APIs', routes.length);
        return routes;
    }
}

exports.ApiRoutesProvider = ApiRoutesProvider;
//# sourceMappingURL=api.js.map
