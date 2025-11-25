'use strict';

var admin = require('./admin.js');
var contentApi = require('./content-api.js');
var viewConfiguration = require('./view-configuration.js');

const routes = {
    admin: admin.routes,
    'content-api': contentApi.routes,
    viewConfiguration: viewConfiguration.routes
};

exports.routes = routes;
//# sourceMappingURL=index.js.map
