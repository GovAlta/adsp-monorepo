'use strict';

var authentication = require('./authentication.js');
var role = require('./role.js');
var user = require('./user.js');
var admin = require('./admin.js');

var controllers = {
    authentication,
    role,
    user,
    admin
};

module.exports = controllers;
//# sourceMappingURL=index.js.map
