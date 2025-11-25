'use strict';

var admin = require('./admin.js');
var apiToken = require('./api-token.js');
var authenticatedUser = require('./authenticated-user.js');
var authentication = require('./authentication.js');
var permission = require('./permission.js');
var role = require('./role.js');
var index = require('./transfer/index.js');
var user = require('./user.js');
var webhooks = require('./webhooks.js');
var contentApi = require('./content-api.js');
var homepage = require('./homepage.js');

var controllers = {
    admin,
    'api-token': apiToken,
    'authenticated-user': authenticatedUser,
    authentication,
    permission,
    role,
    transfer: index,
    user,
    webhooks,
    'content-api': contentApi,
    homepage
};

module.exports = controllers;
//# sourceMappingURL=index.js.map
