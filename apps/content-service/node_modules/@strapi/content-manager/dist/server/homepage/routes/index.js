'use strict';

var homepage = require('./homepage.js');

/**
 * The routes will be merged with the other Content Manager routers,
 * so we need to avoid conficts in the router name, and to prefix the path for each route.
 */ const routes = {
    homepage: homepage.homepageRouter
};

exports.routes = routes;
//# sourceMappingURL=index.js.map
