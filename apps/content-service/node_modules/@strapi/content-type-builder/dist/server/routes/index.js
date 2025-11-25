'use strict';

var admin = require('./admin.js');
var contentApi = require('./content-api.js');

var routes = {
    admin,
    'content-api': contentApi
};

module.exports = routes;
//# sourceMappingURL=index.js.map
