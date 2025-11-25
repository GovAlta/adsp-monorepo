'use strict';

var admin = require('./admin.js');
var authentication = require('./authentication.js');
var permissions = require('./permissions.js');
var users = require('./users.js');
var roles = require('./roles.js');
var webhooks = require('./webhooks.js');
var apiTokens = require('./api-tokens.js');
var contentApi = require('./content-api.js');
var transfer = require('./transfer.js');
var homepage = require('./homepage.js');

const routes = {
    admin: {
        type: 'admin',
        routes: [
            ...admin,
            ...authentication,
            ...permissions,
            ...users,
            ...roles,
            ...webhooks,
            ...apiTokens,
            ...contentApi,
            ...transfer,
            ...homepage
        ]
    }
};

module.exports = routes;
//# sourceMappingURL=index.js.map
