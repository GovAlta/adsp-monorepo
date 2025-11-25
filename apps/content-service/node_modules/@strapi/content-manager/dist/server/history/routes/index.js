'use strict';

var historyVersion = require('./history-version.js');

/**
 * The routes will me merged with the other Content Manager routers,
 * so we need to avoid conficts in the router name, and to prefix the path for each route.
 */ const routes = {
    'history-version': historyVersion.historyVersionRouter
};

exports.routes = routes;
//# sourceMappingURL=index.js.map
