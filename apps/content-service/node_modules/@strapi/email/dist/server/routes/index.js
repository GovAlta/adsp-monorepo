'use strict';

var admin = require('./admin.js');
var contentApi = require('./content-api.js');

const routes = {
    admin,
    'content-api': contentApi
};

exports.routes = routes;
//# sourceMappingURL=index.js.map
