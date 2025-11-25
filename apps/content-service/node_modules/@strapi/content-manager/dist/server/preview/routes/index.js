'use strict';

var preview = require('./preview.js');

/**
 * The routes will be merged with the other Content Manager routers,
 * so we need to avoid conficts in the router name, and to prefix the path for each route.
 */ const routes = {
    preview: preview.previewRouter
};

exports.routes = routes;
//# sourceMappingURL=index.js.map
